const API_URL = 'https://api4.binance.com/api/v3/ticker/24hr';
const STORAGE_KEY = 'coin-pulse-favorites';
const elements = {
  list: document.getElementById('coin-list'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  empty: document.getElementById('empty'),
  error: document.getElementById('error'),
  status: document.getElementById('status'),
  dot: document.getElementById('status-dot'),
};
let coins = [];
let activeTab = 'all';
let loading = true;
let fetching = false;
let retryAt = 0;
const favorites = loadFavorites();
const modalElement = document.getElementById('coin-modal');
const detailModal = new bootstrap.Modal(modalElement);
const chartRanges = {
  day: { interval: '15m', limit: 96, caption: '15분봉 종가 · 최근 24시간' },
  week: { interval: '1h', limit: 168, caption: '1시간봉 종가 · 최근 7일' },
  month: { interval: '4h', limit: 180, caption: '4시간봉 종가 · 최근 30일' },
};
let selectedSymbol = null;
let selectedRange = 'day';
let chartController = null;
let chartPoints = [];
let detailTrigger = null;

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(symbol => typeof symbol === 'string' && /^[A-Z0-9]+USDT$/.test(symbol)) : []);
  } catch {
    document.getElementById('storage-message').textContent = '저장된 관심항목을 읽을 수 없습니다. 이 창에서는 관심항목을 사용할 수 있습니다.';
    return new Set();
  }
}

function formatPrice(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

function render() {
  const query = elements.search.value.trim().toUpperCase();
  const visible = coins.filter(coin => coin.symbol.includes(query) && (activeTab === 'all' || favorites.has(coin.symbol)));
  visible.sort((a, b) => elements.sort.value === 'name'
    ? a.symbol.localeCompare(b.symbol)
    : elements.sort.value === 'change' ? b.change - a.change : b.volume - a.volume);

  // 기존 행을 재사용하므로 1초 갱신 중에도 버튼의 키보드 포커스를 유지합니다.
  const existingRows = new Map([...elements.list.children].map(row => [row.dataset.symbol, row]));
  const shown = new Set(visible.map(coin => coin.symbol));
  for (const [symbol, row] of existingRows) {
    if (!shown.has(symbol)) row.remove();
  }
  visible.forEach((coin, index) => {
    let row = existingRows.get(coin.symbol);
    if (!row) {
      row = document.createElement('tr');
      row.dataset.symbol = coin.symbol;
      row.innerHTML = '<td><button type="button" class="star"></button></td><td><button type="button" class="coin-button"><span class="coin-avatar" aria-hidden="true"></span><span><span class="coin-name"></span><span class="pair"></span></span></button></td><td class="price"></td><td><span class="change"></span></td><td></td><td></td><td></td>';
    }
    const selected = favorites.has(coin.symbol);
    const star = row.querySelector('button');
    star.textContent = selected ? '★' : '☆';
    star.classList.toggle('selected', selected);
    star.setAttribute('aria-pressed', String(selected));
    star.setAttribute('aria-label', `${coin.symbol} 관심항목 ${selected ? '해제' : '추가'}`);
    row.querySelector('.coin-name').textContent = coin.symbol.slice(0, -4);
    row.querySelector('.coin-button').setAttribute('aria-label', `${coin.symbol} 상세 가격 및 차트 보기`);
    row.querySelector('.coin-button').setAttribute('aria-haspopup', 'dialog');
    row.querySelector('.coin-avatar').textContent = coin.symbol.slice(0, 1);
    row.querySelector('.pair').textContent = coin.symbol;
    row.cells[2].textContent = formatPrice(coin.price);
    const change = row.querySelector('.change');
    change.className = `change ${coin.change > 0 ? 'positive' : coin.change < 0 ? 'negative' : 'neutral'}`;
    change.textContent = `${coin.change > 0 ? '+' : ''}${coin.change.toFixed(2)}%`;
    row.cells[4].textContent = formatPrice(coin.high);
    row.cells[5].textContent = formatPrice(coin.low);
    row.cells[6].textContent = coin.volume.toLocaleString('en-US', { maximumFractionDigits: 0 });
    const current = elements.list.children[index];
    if (current !== row) elements.list.insertBefore(row, current || null);
  });
  document.getElementById('total-count').textContent = loading ? '—' : coins.length.toLocaleString();
  document.getElementById('rising-count').textContent = loading ? '—' : coins.filter(coin => coin.change > 0).length.toLocaleString();
  document.getElementById('falling-count').textContent = loading ? '—' : coins.filter(coin => coin.change < 0).length.toLocaleString();
  document.getElementById('favorite-count').textContent = favorites.size;
  document.getElementById('result-count').textContent = loading ? '불러오는 중…' : `${activeTab === 'all' ? '전체' : '관심항목'} ${visible.length.toLocaleString()}개`;
  elements.empty.hidden = visible.length > 0;
  elements.empty.textContent = loading ? '시장 데이터를 불러오고 있습니다…' : query ? '검색 결과가 없습니다.' : activeTab === 'favorites' ? '별표 ☆를 눌러 관심 코인을 추가해 보세요.' : '표시할 USDT 거래쌍이 없습니다.';
  updateDetail();
}

async function fetchPrices() {
  // 응답이 1초보다 늦으면 이전 요청이 끝날 때까지 중복 요청을 방지합니다.
  if (fetching || Date.now() < retryAt) return;
  fetching = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(API_URL, { method: 'GET', signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      // Binance의 요청 제한 응답은 Retry-After만큼 대기합니다.
      if (response.status === 429 || response.status === 418) {
        const seconds = Number(response.headers.get('Retry-After'));
        retryAt = Date.now() + (seconds > 0 ? seconds : 60) * 1000;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('잘못된 응답');
    coins = data.filter(item => typeof item.symbol === 'string' && /^[A-Z0-9]+USDT$/.test(item.symbol))
      .map(item => ({ symbol: item.symbol, price: Number(item.lastPrice), change: Number(item.priceChangePercent), high: Number(item.highPrice), low: Number(item.lowPrice), volume: Number(item.quoteVolume) }))
      .filter(coin => [coin.price, coin.change, coin.high, coin.low, coin.volume].every(Number.isFinite));
    elements.error.hidden = true;
    elements.status.textContent = '실시간 연결됨';
    elements.dot.classList.add('connected');
    document.getElementById('updated-at').textContent = `최근 갱신 ${new Date().toLocaleTimeString('ko-KR', { hour12: false })}`;
  } catch (error) {
    elements.error.hidden = false;
    elements.error.textContent = retryAt > Date.now()
      ? 'API 요청 제한으로 잠시 대기합니다. 대기 후 자동으로 다시 연결합니다.'
      : '가격을 불러오지 못했습니다. 네트워크 또는 Binance 접근 제한을 확인해 주세요. 자동으로 다시 연결합니다.';
    elements.status.textContent = coins.length ? '연결 지연 · 마지막 수신 가격 표시 중' : '연결 대기 중';
    elements.dot.classList.remove('connected');
  } finally {
    clearTimeout(timeout);
    fetching = false;
    loading = false;
    render();
  }
}

elements.list.addEventListener('click', event => {
  const button = event.target.closest('.star');
  if (!button) {
    const row = event.target.closest('tr[data-symbol]');
    if (row) openDetail(row.dataset.symbol, row.querySelector('.coin-button'));
    return;
  }
  const symbol = button.closest('tr').dataset.symbol;
  toggleFavorite(symbol);
});

function toggleFavorite(symbol) {
  if (favorites.has(symbol)) favorites.delete(symbol);
  else favorites.add(symbol);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    document.getElementById('storage-message').textContent = '';
  } catch {
    document.getElementById('storage-message').textContent = '브라우저 저장소를 사용할 수 없어 관심항목이 이 창에서만 유지됩니다.';
  }
  render();
}

function updateDetail() {
  if (!selectedSymbol) return;
  const coin = coins.find(item => item.symbol === selectedSymbol);
  if (!coin) return;
  document.getElementById('detail-title').textContent = coin.symbol.slice(0, -4);
  document.getElementById('detail-icon').textContent = coin.symbol.slice(0, 1);
  document.getElementById('detail-pair').textContent = `${coin.symbol} · Binance Spot`;
  document.getElementById('detail-price').textContent = formatPrice(coin.price);
  const change = document.getElementById('detail-change');
  change.className = `change ${coin.change > 0 ? 'positive' : coin.change < 0 ? 'negative' : 'neutral'}`;
  change.textContent = `${coin.change > 0 ? '+' : ''}${coin.change.toFixed(2)}% · 24h`;
  document.getElementById('detail-high').textContent = formatPrice(coin.high);
  document.getElementById('detail-low').textContent = formatPrice(coin.low);
  document.getElementById('detail-volume').textContent = coin.volume.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const favorite = document.getElementById('detail-favorite');
  favorite.textContent = favorites.has(coin.symbol) ? '★ 관심항목 해제' : '☆ 관심항목 추가';
  favorite.setAttribute('aria-pressed', String(favorites.has(coin.symbol)));
  document.getElementById('detail-status').textContent = elements.error.hidden ? '현재가 · 1초 자동 갱신' : '연결 지연 · 마지막 수신 가격';
}

function openDetail(symbol, trigger) {
  selectedSymbol = symbol;
  detailTrigger = trigger;
  selectedRange = 'day';
  updateRangeButtons();
  updateDetail();
  detailModal.show();
  loadChart();
}

function updateRangeButtons() {
  document.querySelectorAll('[data-range]').forEach(button => {
    const active = button.dataset.range === selectedRange;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

async function loadChart() {
  if (!selectedSymbol) return;
  chartController?.abort();
  const controller = new AbortController();
  chartController = controller;
  const symbol = selectedSymbol;
  const range = selectedRange;
  const settings = chartRanges[range];
  const status = document.getElementById('chart-status');
  const svg = document.getElementById('price-chart');
  chartPoints = [];
  hideChartTooltip();
  svg.setAttribute('hidden', '');
  status.hidden = false;
  status.textContent = '가격 이력을 불러오는 중입니다…';
  document.getElementById('chart-caption').textContent = settings.caption;
  document.getElementById('chart-updated').textContent = '';
  document.getElementById('chart-wrap').setAttribute('aria-busy', 'true');
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    if (Date.now() < retryAt) throw new Error('요청 제한');
    const query = new URLSearchParams({ symbol, interval: settings.interval, limit: settings.limit });
    const response = await fetch(`https://api4.binance.com/api/v3/klines?${query}`, { signal: controller.signal });
    if (!response.ok) {
      if (response.status === 429 || response.status === 418) {
        const seconds = Number(response.headers.get('Retry-After'));
        retryAt = Date.now() + (seconds > 0 ? seconds : 60) * 1000;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('잘못된 응답');
    // 각 봉의 시작 시각과 종가를 사용합니다. 마지막 봉은 진행 중일 수 있습니다.
    const points = data.filter(item => Array.isArray(item) && item.length >= 5)
      .map(item => ({ time: Number(item[0]), price: Number(item[4]) }))
      .filter(point => Number.isFinite(point.time) && Number.isFinite(point.price));
    if (points.length < 2) throw new Error('가격 이력 부족');
    if (selectedSymbol !== symbol || selectedRange !== range || chartController !== controller) return;
    chartPoints = points;
    drawChart(points);
    status.hidden = true;
    svg.removeAttribute('hidden');
    document.getElementById('chart-updated').textContent = `${new Date().toLocaleTimeString('ko-KR', { hour12: false })} 갱신 · 1분 간격`;
  } catch {
    if (chartController !== controller || selectedSymbol !== symbol) return;
    status.textContent = Date.now() < retryAt ? '요청 제한으로 대기 중입니다. 잠시 후 다시 시도해 주세요.' : '가격 이력을 불러오지 못했습니다. 기간을 다시 선택해 재시도할 수 있습니다.';
  } finally {
    clearTimeout(timeout);
    if (chartController === controller) {
      chartController = null;
      document.getElementById('chart-wrap').setAttribute('aria-busy', 'false');
    }
  }
}

function drawChart(points) {
  const prices = points.map(point => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * .15 || Math.max(Math.abs(max) * .01, .00000001);
  const bottom = min - padding;
  const top = max + padding;
  const y = price => 244 - (price - bottom) / (top - bottom) * 228;
  const first = points[0].time;
  const duration = points[points.length - 1].time - first || 1;
  points.forEach(point => {
    point.x = 16 + (point.time - first) / duration * 592;
    point.y = y(point.price);
  });
  const path = points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  document.getElementById('chart-line').setAttribute('d', path);
  document.getElementById('chart-area').setAttribute('d', `${path} L608,244 L16,244 Z`);
  const grid = document.getElementById('chart-grid');
  grid.replaceChildren();
  const create = (tag, attributes, content) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (content !== undefined) node.textContent = content;
    grid.append(node);
  };
  for (let i = 0; i <= 4; i++) {
    const height = 16 + i * 57;
    create('line', { x1: 16, x2: 608, y1: height, y2: height, stroke: '#ede8f5', 'stroke-dasharray': '4 5' });
    create('text', { x: 620, y: height + 4 }, formatPrice(top - (top - bottom) * i / 4));
  }
  [0, Math.floor((points.length - 1) / 2), points.length - 1].forEach((index, i) => {
    const point = points[index];
    const date = new Date(point.time);
    const label = selectedRange === 'day' ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    create('text', { x: point.x, y: 272, 'text-anchor': ['start', 'middle', 'end'][i] }, label);
  });
  document.getElementById('chart-title').textContent = `${selectedSymbol} ${chartRanges[selectedRange].caption}`;
  document.getElementById('chart-description').textContent = `기간 최저 ${formatPrice(min)}, 최고 ${formatPrice(max)} USDT. 마지막 봉은 진행 중일 수 있습니다. 시간은 브라우저 현지 시간 기준입니다.`;
}

function hideChartTooltip() {
  document.getElementById('chart-tooltip').hidden = true;
  document.getElementById('chart-point').setAttribute('visibility', 'hidden');
  document.getElementById('chart-crosshair').setAttribute('visibility', 'hidden');
}

document.getElementById('price-chart').addEventListener('pointermove', event => {
  if (!chartPoints.length) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * 720;
  const point = chartPoints.reduce((nearest, item) => Math.abs(item.x - x) < Math.abs(nearest.x - x) ? item : nearest);
  const tooltip = document.getElementById('chart-tooltip');
  tooltip.textContent = `${new Date(point.time).toLocaleString('ko-KR')} · ${formatPrice(point.price)} USDT`;
  tooltip.hidden = false;
  const dot = document.getElementById('chart-point');
  dot.setAttribute('cx', point.x);
  dot.setAttribute('cy', point.y);
  dot.setAttribute('visibility', 'visible');
  const line = document.getElementById('chart-crosshair');
  line.setAttribute('x1', point.x);
  line.setAttribute('x2', point.x);
  line.setAttribute('visibility', 'visible');
});
document.getElementById('price-chart').addEventListener('pointerleave', hideChartTooltip);
document.getElementById('detail-favorite').addEventListener('click', () => {
  if (selectedSymbol) toggleFavorite(selectedSymbol);
});
document.querySelectorAll('[data-range]').forEach(button => {
  button.addEventListener('click', () => {
    selectedRange = button.dataset.range;
    updateRangeButtons();
    loadChart();
  });
});
modalElement.addEventListener('hide.bs.modal', () => {
  selectedSymbol = null;
  chartController?.abort();
  chartController = null;
  chartPoints = [];
});
modalElement.addEventListener('hidden.bs.modal', () => {
  if (detailTrigger?.isConnected) detailTrigger.focus();
  else document.querySelector(`[data-tab="${activeTab}"]`).focus();
});
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    });
    render();
  });
});
elements.search.addEventListener('input', render);
elements.sort.addEventListener('change', render);
render();
fetchPrices();
setInterval(fetchPrices, 1000);
setInterval(() => {
  if (selectedSymbol && !chartController) loadChart();
}, 60000);

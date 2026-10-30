const display = document.getElementById('display');
let expression = '';
let poweredOn = true;
let finished = false;
let hasError = false;

function renderDisplay() {
    display.value = poweredOn ? expression || '0' : '';
    display.scrollLeft = display.scrollWidth;
}

function togglePower() {
    poweredOn = !poweredOn;
    expression = '';
    finished = false;
    hasError = false;
    document.querySelectorAll('.buttons button:not(.on-off)').forEach(button => {
        button.disabled = !poweredOn;
    });
    renderDisplay();
}

function clearDisplay() {
    if (!poweredOn) return;
    expression = '';
    finished = false;
    hasError = false;
    renderDisplay();
}

function appendNumber(value) {
    if (!poweredOn || !/^[0-9.]$/.test(value)) return;
    if (finished || hasError) clearDisplay();
    const currentNumber = expression.split(/[+*/-]/).pop();
    if (value === '.') {
        if (currentNumber.includes('.')) return;
        expression += currentNumber ? '.' : '0.';
    } else if (currentNumber === '0') {
        expression = expression.slice(0, -1) + value;
    } else {
        expression += value;
    }
    renderDisplay();
}

function appendOperator(operator) {
    if (!poweredOn || hasError || !['+', '-', '*', '/'].includes(operator)) return;
    finished = false;
    if (!expression || expression === '-') {
        expression = operator === '-' ? '-' : '';
    } else if (/[+*/-]$/.test(expression)) {
        expression = expression.slice(0, -1) + operator;
    } else {
        expression += operator;
    }
    renderDisplay();
}

// 계산식을 숫자와 연산자로 나눈 뒤 곱셈과 나눗셈부터 계산합니다.
function calculate(formula) {
    const source = formula.replace(/\s+/g, '');
    const numberPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i;
    const numbers = [];
    const operators = [];
    let position = 0;
    while (position < source.length) {
        let sign = 1;
        if (source[position] === '-' || source[position] === '+') {
            sign = source[position++] === '-' ? -1 : 1;
        }
        const match = source.slice(position).match(numberPattern);
        if (!match) throw new Error('올바른 계산식을 입력하세요.');
        const number = sign * Number(match[0]);
        if (!Number.isFinite(number)) throw new Error('계산 범위를 초과했습니다.');
        numbers.push(number);
        position += match[0].length;
        if (position === source.length) break;
        const operator = source[position++];
        if (!['+', '-', '*', '/'].includes(operator) || position === source.length) {
            throw new Error('올바른 계산식을 입력하세요.');
        }
        operators.push(operator);
    }
    if (!numbers.length) throw new Error('계산식을 입력하세요.');

    const terms = [numbers[0]];
    const additions = [];
    operators.forEach((operator, index) => {
        const right = numbers[index + 1];
        if (operator === '*' || operator === '/') {
            if (operator === '/' && right === 0) throw new Error('0으로 나눌 수 없습니다.');
            const left = terms.pop();
            const value = operator === '*' ? left * right : left / right;
            if (!Number.isFinite(value)) throw new Error('계산 범위를 초과했습니다.');
            terms.push(value);
        } else {
            additions.push(operator);
            terms.push(right);
        }
    });
    let result = terms[0];
    additions.forEach((operator, index) => {
        result = operator === '+' ? result + terms[index + 1] : result - terms[index + 1];
        if (!Number.isFinite(result)) throw new Error('계산 범위를 초과했습니다.');
    });
    return Number(result.toPrecision(15));
}

function performCalculate() {
    if (!poweredOn || hasError || !expression) return;
    try {
        expression = String(calculate(expression));
        finished = true;
    } catch (error) {
        expression = error.message;
        hasError = true;
    }
    renderDisplay();
}

document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^[0-9.]$/.test(event.key)) appendNumber(event.key);
    else if (['+', '-', '*', '/'].includes(event.key)) appendOperator(event.key);
    else if (event.key === 'Enter' || event.key === '=') performCalculate();
    else if (event.key === 'Escape') clearDisplay();
    else if (event.key === 'Backspace') {
        if (!poweredOn) return;
        if (finished || hasError) clearDisplay();
        else {
            expression = expression.slice(0, -1);
            renderDisplay();
        }
    } else return;
    event.preventDefault();
});

renderDisplay();

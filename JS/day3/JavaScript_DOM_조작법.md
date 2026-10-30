# JavaScript의 DOM 조작법

## 1. DOM(Document Object Model)이란?

DOM(Document Object Model)이란?
: **HTML 문서를 JavaScript에서 접근하고 조작할 수 있도록 객체와 트리 구조로 표현한 것**이다. 

브라우저는 HTML을 해석해 DOM 트리를 만들고, JavaScript는 이 트리의 요소를 찾아 내용·스타일·속성 등을 변경할 수 있다.

예를 들어 다음 HTML이 있을 때:

```html
<body>
  <h1 id="title">안녕하세요</h1>
  <p>DOM 학습 중입니다.</p>
</body>
```

`document` 아래에 `body`, `h1`, `p` 등의 요소가 계층적으로 연결된다. 다음 코드로 제목을 변경할 수 있다.

```javascript
const title = document.getElementById("title");
title.textContent = "Hello, DOM!";
title.style.color = "red";
```

**실행 결과:** 제목이 `Hello, DOM!`으로 바뀌고 글자색이 빨간색이 된다. 이는 HTML 원본 파일을 수정하는 것이 아니라 브라우저가 관리하는 DOM을 변경하는 것이다.

## 2. Selector(선택자)로 DOM 요소 가져오기

선택자(Selector)는 **조작하려는 HTML 요소를 지정하는 방법**이다. JavaScript에서는 `document`의 메서드를 사용해 요소를 가져온다.

| 메서드 | 선택 기준 | 반환 결과 |
| --- | --- | --- |
| `getElementById("title")` | 특정 `id` | 요소 1개 또는 `null` |
| `querySelector(".item")` | CSS 선택자 | 일치하는 첫 번째 요소 또는 `null` |
| `querySelectorAll(".item")` | CSS 선택자 | 일치하는 모든 요소를 담은 `NodeList` |

### 2-1. `getElementById()`

```html
<h1 id="title">기존 제목</h1>
```

```javascript
const title = document.getElementById("title");
console.log(title.textContent); // 기존 제목
```

`id`는 고유한 요소를 찾는 데 사용하며, 인자에 `#`을 붙이지 않는다.

### 2-2. `querySelector()`

```html
<p class="item">첫 번째 문장</p>
<p class="item">두 번째 문장</p>
```

```javascript
const firstItem = document.querySelector(".item");
console.log(firstItem.textContent); // 첫 번째 문장
```

CSS 선택자 문법을 사용한다. `#title`은 ID, `.item`은 클래스, `p`는 태그를 의미한다. 여러 요소가 일치해도 첫 번째 요소만 반환한다.

### 2-3. `querySelectorAll()`

```javascript
const items = document.querySelectorAll(".item");
items.forEach((item) => {
  console.log(item.textContent);
});
```

**실행 결과:** `첫 번째 문장`, `두 번째 문장`이 순서대로 출력된다. 일치하는 요소가 없으면 빈 `NodeList`가 반환된다.

### 2-4. 선택한 요소 조작하기

```html
<p id="message">기존 메시지</p>
<a id="link" href="#">이동</a>
```

```javascript
const message = document.querySelector("#message");
message.textContent = "새 메시지";  // 텍스트 변경
message.style.fontSize = "20px";  // 스타일 변경
message.style.color = "blue";

const link = document.querySelector("#link");
link.href = "https://www.google.com"; // 속성 변경
```

- `textContent`: 요소 안의 텍스트를 읽거나 변경한다.
- `innerHTML`: HTML 마크업을 읽거나 변경한다. 사용자 입력을 검증 없이 넣으면 XSS 보안 문제가 발생할 수 있어 주의해야 한다.
- `style`: 인라인 CSS 스타일을 변경한다. `font-size`는 JavaScript에서 `fontSize`로 작성한다.
- `href`, `src` 등: 해당 HTML 속성에 접근하거나 값을 변경한다.

## 3. Event란?

이벤트(Event)는 **웹 페이지에서 발생하는 동작이나 상태 변화**이다. 사용자의 클릭이나 입력뿐 아니라 브라우저의 로딩 및 화면 크기 변경도 이벤트이다.

| 이벤트 | 발생 상황 |
| --- | --- |
| `click` | 요소를 클릭했을 때 |
| `input` | 입력값이 변경될 때 |
| `keydown` / `keyup` | 키를 누르거나 뗄 때 |
| `mouseover` / `mouseout` | 마우스 포인터가 요소 안으로 들어오거나 밖으로 나갈 때 |
| `scroll` | 스크롤할 때 |
| `DOMContentLoaded` | HTML 문서가 파싱되어 DOM 구성이 완료됐을 때 |
| `load` | 페이지와 관련 리소스의 로드가 완료됐을 때 |
| `resize` | 브라우저 창 크기가 변경될 때 |

이벤트가 발생하면 브라우저는 등록된 처리 함수를 실행할 수 있다.

## 4. EventListener(이벤트 리스너)

이벤트 리스너는 특정 요소에서 특정 이벤트가 발생하는 것을 감지해 **미리 등록한 함수를 실행하도록 하는 방식**이다.

```html
<button id="helloBtn">클릭하기</button>
```

```javascript
const button = document.querySelector("#helloBtn");
button.addEventListener("click", function () {
  console.log("버튼을 클릭했습니다.");
});
```

버튼을 클릭하면 콘솔에 메시지가 출력된다.

## 5. EventListener(이벤트 리스너)란?

`addEventListener()`는 요소에 이벤트 처리 함수를 등록하는 메서드이다. 이벤트가 발생했을 때 실행할 함수를 **콜백 함수(callback function)** 라고 한다.

```javascript
요소.addEventListener("이벤트이름", 실행할함수);
```

위 코드는 문법 구조를 보여주는 예시이다. `요소`에는 실제 DOM 요소가, `실행할함수`에는 함수가 들어가야 한다. 이벤트 이름에는 `onclick`이 아니라 `click`처럼 `on`을 제외한 이름을 쓴다.

## 6. EventListener를 사용하는 목적과 이유

1. **사용자와 상호작용:** 클릭, 입력, 마우스 이동에 반응하는 기능을 구현한다.
2. **동적 화면 구성:** 새로고침 없이 텍스트·색상·표시 상태를 변경할 수 있다.
3. **UI와 동작 로직 분리:** HTML 구조와 JavaScript 이벤트 처리 코드를 구분해 관리할 수 있다.
4. **다양한 이벤트 처리:** 한 요소에 여러 종류의 이벤트나 여러 처리 함수를 등록할 수 있다.

예를 들어 회원가입 화면에서는 입력할 때 비밀번호 길이를 검사하고, 버튼을 클릭했을 때 입력 결과를 표시할 수 있다.

## 7. EventListener 정의하기

### 7-1. 익명 함수로 등록

```javascript
const button = document.querySelector("#helloBtn");
button.addEventListener("click", function () {
  alert("안녕하세요!");
});
```

### 7-2. 이름이 있는 함수로 등록

```javascript
function showMessage() {
  alert("버튼이 클릭되었습니다.");
}

button.addEventListener("click", showMessage);
```

`showMessage()`라고 쓰면 등록 시점에 함수를 즉시 호출하므로, 함수 자체를 전달할 때는 **괄호 없이 `showMessage`**라고 작성한다.

### 7-3. 이벤트 객체 사용

```javascript
button.addEventListener("click", function (event) {
  console.log(event.type);   // click
  console.log(event.target); // 이벤트가 발생한 요소
});
```

이벤트 처리 함수는 이벤트에 관한 정보를 담은 `event` 객체를 받을 수 있다.

## 8. EventListener 응용

### 8-1. 버튼 클릭으로 텍스트 변경

```html
<h2 id="result">변경 전</h2>
<button id="changeBtn">변경하기</button>
<script>
  const result = document.querySelector("#result");
  const changeBtn = document.querySelector("#changeBtn");

  changeBtn.addEventListener("click", function () {
    result.textContent = "변경 완료!";
    result.style.color = "blue";
  });
</script>
```

**실행 결과:** 버튼 클릭 시 제목이 `변경 완료!`로 바뀌고 파란색으로 표시된다.

### 8-2. 입력값 실시간 검사

```html
<input id="password" type="password" placeholder="비밀번호 입력">
<p id="guide"></p>
<script>
  const input = document.querySelector("#password");
  const guide = document.querySelector("#guide");

  input.addEventListener("input", function () {
    if (input.value.length < 4) {
      guide.textContent = "4자리 이상 입력하세요.";
      guide.style.color = "red";
    } else {
      guide.textContent = "길이 조건을 충족했습니다.";
      guide.style.color = "blue";
    }
  });
</script>
```

**실행 결과:** 입력값이 4자 미만이면 빨간 안내 문구가, 4자 이상이면 파란 안내 문구가 나타납니다. 실제 비밀번호의 안전성은 길이 외의 조건도 고려해야 한다.

## 9. 마우스 감지란?

마우스 감지는 마우스 포인터가 **특정 요소에 들어오거나 벗어나는 등의 움직임을 이벤트로 감지하는 것**이다. 버튼 강조, 메뉴 표시, 카드 색상 변경 등의 UI에 활용한다.

| 이벤트 | 의미 |
| --- | --- |
| `mouseover` | 요소 또는 그 자식 요소 위로 포인터가 들어올 때 |
| `mouseout` | 요소 또는 그 자식 요소 밖으로 포인터가 이동할 때 |
| `mouseenter` | 요소 영역에 포인터가 들어올 때(자식 요소 이동으로 재발생하지 않음) |
| `mouseleave` | 요소 영역에서 포인터가 나갈 때(자식 요소 이동으로 재발생하지 않음) |
| `mousemove` | 요소 위에서 마우스가 움직일 때 |

## 10. 마우스 감지 사용

PDF 실습의 요구사항은 **마우스를 올리면 글자색이 주황색, 내리면 검정색**이 되도록 만드는 것이다.

```html
<p id="box">마우스를 올려보세요.</p>

<script>
  const box = document.querySelector("#box");

  box.addEventListener("mouseover", function () {
    box.style.color = "orange";
    box.style.border = "1px solid orange";
  });

  box.addEventListener("mouseout", function () {
    box.style.color = "black";
    box.style.border = "none";
  });
</script>
```

**실행 결과:** 마우스를 올리면 글자와 테두리가 주황색으로 바뀌고, 마우스를 벗어나면 글자색이 검정색으로 돌아오며 테두리가 사라진다.

반복되는 스타일 변경을 함수로 분리할 수도 있다.

```javascript
function changeBackgroundColor(color) {
  box.style.backgroundColor = color;
}

box.addEventListener("mouseover", () => changeBackgroundColor("skyblue"));
box.addEventListener("mouseout", () => changeBackgroundColor("orange"));
```


## 11. 화살표 함수란?

화살표 함수(Arrow Function)는 **`function` 키워드 대신 `=>`를 사용하여 함수를 간결하게 표현하는 JavaScript 문법**이다. 이벤트 리스너나 배열 메서드에 전달하는 콜백 함수를 작성할 때 자주 사용한다.

일반 함수:

```javascript
function add(a, b) {
  return a + b;
}
```

화살표 함수:

```javascript
const add = (a, b) => {
  return a + b;
};
```

본문이 단일 표현식일 때는 중괄호와 `return`을 생략할 수 있다.

```javascript
const add = (a, b) => a + b;
console.log(add(3, 5)); // 8
```

**주요 문법**

```javascript
const hello = () => "안녕하세요";       // 매개변수 없음
const square = x => x * x;           // 매개변수 1개
const sum = (a, b) => a + b;         // 매개변수 2개
const greet = (name) => {            // 여러 문장
  const message = `안녕, ${name}!`;
  return message;
};
```

주의할 점은 화살표 함수가 일반 함수와 완전히 같지는 않다는 것이다. 화살표 함수는 **자체 `this`를 갖지 않고 바깥 스코프의 `this`를 사용**하므로, `this`가 이벤트 대상 요소를 가리켜야 하는 코드에서는 일반 함수와 동작이 다를 수 있다.

## 12. 화살표 함수 사용

### 12-1. 이벤트 리스너에 적용

일반 함수 방식:

```javascript
button.addEventListener("click", function () {
  console.log("클릭됨");
});
```

화살표 함수 방식:

```javascript
button.addEventListener("click", () => {
  console.log("클릭됨");
});
```

한 줄로도 작성할 수 있다.

```javascript
button.addEventListener("click", () => console.log("클릭됨"));
```

### 12-2. 마우스 감지에 적용

다음은 독립적으로 실행 가능한 예제이다.

```html
<p id="box">마우스를 올려보세요.</p>
<script>
  const box = document.querySelector("#box");

  const changeTextColor = (color) => {
    box.style.color = color;
  };

  box.addEventListener("mouseover", () => changeTextColor("orange"));
  box.addEventListener("mouseout", () => changeTextColor("black"));
</script>
```

**실행 결과:** 마우스를 올리면 글자색이 주황색, 벗어나면 검정색으로 바뀐다. 화살표 함수를 사용하면 콜백을 짧고 읽기 쉽게 작성할 수 있다.

---

## 핵심 요약

| 개념 | 핵심 내용 |
| --- | --- |
| DOM | HTML 문서를 객체 트리로 표현한 구조 |
| Selector | 원하는 HTML 요소를 찾는 방법 |
| `querySelector()` | CSS 선택자에 일치하는 첫 번째 요소 선택 |
| `querySelectorAll()` | 일치하는 모든 요소 선택 |
| Event | 클릭·입력·마우스 이동 등 페이지에서 발생하는 동작과 상태 변화 |
| EventListener | 특정 이벤트가 발생했을 때 실행할 함수를 등록하는 방식 |
| `addEventListener()` | 이벤트 이름과 콜백 함수를 연결하는 메서드 |
| `mouseover` / `mouseout` | 마우스가 요소 안으로 들어오거나 벗어나는 동작 감지 |
| 화살표 함수 | `=>`를 이용해 함수를 간결하게 작성하는 문법 |

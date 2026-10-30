function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    return a / b;
}

function inputFormula() {
    return prompt("계산식을 입력하세요.(예: 1 + 1 * 4)");
}

function calculate(formula) {
    const tokens = formula.trim().split(/\s+/);
    if (tokens.length < 3 || tokens.length % 2 === 0) {
        return "잘못된 계산식이 입력되었습니다.";
    }

    // 1단계: 곱셈과 나눗셈 먼저 처리
    const intermediateTokens = [];
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === "*" || token === "/") {
            const left = Number(intermediateTokens.pop());
            const operator = token;
            const right = Number(tokens[i + 1]);

            if (isNaN(left) || isNaN(right)) return "잘못된 숫자가 입력되었습니다.";

            let res;
            if (operator === "*") {
                res = multiply(left, right);
            } else {
                if (right === 0) return "0으로 나눌 수 없습니다.";
                res = divide(left, right);
            }
            intermediateTokens.push(res);
            i += 2; // 연산자와 오른쪽 피연산자 건너뜀
        } else {
            intermediateTokens.push(token);
            i++;
        }
    }

    // 2단계: 덧셈과 뺄셈 처리
    let result = Number(intermediateTokens[0]);
    if (isNaN(result)) return "잘못된 숫자가 입력되었습니다.";

    for (let j = 1; j < intermediateTokens.length; j += 2) {
        const operator = intermediateTokens[j];
        const nextValue = Number(intermediateTokens[j + 1]);

        if (isNaN(nextValue)) return "잘못된 숫자가 입력되었습니다.";

        if (operator === "+") {
            result = add(result, nextValue);
        } else if (operator === "-") {
            result = subtract(result, nextValue);
        } else {
            return `예외 발생: ${operator}`;
        }
    }
    return result;
}

function start(formula) {
    let input = formula;
    
    // 인자가 없으면 prompt로 물어봄
    if (!input) {
        input = inputFormula();
    }
    
    if (!input) {
        console.log("계산식을 입력해주세요.");
        return;
    }

    const result = calculate(input);
    if (typeof result === "string") {
        console.log(`에러 발생: ${result}`);
    } else {
        console.log(`결과: ${result}`);
    }
}
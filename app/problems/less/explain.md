# 객체·함수 의존성과 exhaustive-deps

## 📌 상황

`ThemePreview` 컴포넌트는 `theme` 문자열과 `onApplied` 콜백을 props로 받습니다. 컴포넌트 내부에서는 `theme` 값을 기반으로 배경색과 글자색이 담긴 `style` 객체를 만들고, `useEffect` 안에서 `applyTheme(style)`로 문서에 테마를 적용한 뒤 `onApplied(theme)`로 부모에게 적용 사실을 알립니다.

부모 컴포넌트에는 테마 외에도 카운트 상태가 있고, `onApplied`로 넘기는 콜백은 현재 카운트 값을 로그 메시지에 포함합니다. 이 콜백은 인라인 함수로 넘겨지고 있습니다.

그런데 `useEffect`의 deps 배열이 `[]`로 되어 있어 린트 경고가 발생하고 있습니다.

---

## 🚨 린트 에러 내용

> React Hook useEffect has missing dependencies: 'onApplied', 'style', and 'theme'.  
> Either include them or remove the dependency array.

`eslint-plugin-react-hooks`의 `exhaustive-deps` 규칙이
effect 내부에서 사용하는 값 중 deps에 없는 것들을 경고합니다.

---

## 🔍 왜 린트 에러가 뜨는 걸까요?

React의 `useEffect`는 deps 배열에 명시된 값이 바뀔 때만 다시 실행됩니다.
만약 effect 안에서 외부 값을 읽는데 deps에 넣지 않으면,
그 값이 바뀌어도 effect가 다시 실행되지 않아 **오래된 값(stale closure)** 을 읽게 됩니다.

이를 방지하기 위해 exhaustive-deps 규칙은 effect 내부에서 참조하는 모든 외부 값을
deps에 넣도록 강제합니다.
현재 코드에서는 `style`, `onApplied`, `theme`을 effect 안에서 사용하고 있지만
deps가 `[]`이라 경고가 뜨는 것입니다.

---

## 🤔 생각해보기

### 1. deps에 `style`을 추가하면 해결될까요?

경고는 사라지지만 새로운 문제가 생깁니다.
`style` 객체는 컴포넌트 바디에서 매 렌더마다 새로 생성됩니다.
JavaScript에서 객체는 내용이 같아도 참조가 다르면 다른 값으로 취급합니다.

```js
const a = { color: 'red' };
const b = { color: 'red' };
console.log(a === b); // false
```

따라서 `[style]`을 deps에 넣으면
렌더마다 새 참조 → effect 재실행 → state 업데이트 → 렌더 → **무한 루프** 가 발생합니다.

### 2. deps에 `onApplied`도 같이 추가하면요?

부모 컴포넌트에서 `onApplied`를 인라인 함수로 넘기고 있습니다.

```jsx
<ThemePreview
  onApplied={t => setLog(prev => [...prev, `[${count}번째] Applied: ${t}`])}
/>
```

인라인 함수도 렌더마다 새로 생성되기 때문에 참조가 매번 달라집니다.
`style`과 같은 이유로, `onApplied`를 deps에 추가해도 무한 루프를 피할 수 없습니다.

### 3. `style` 문제와 `onApplied` 문제의 성격이 다를까요?

둘 다 "매 렌더마다 새 참조"라는 같은 증상이지만, 원인과 해결 방향이 다릅니다.

- **`style`** 은 `theme`으로부터 파생된 값입니다.
  객체로 묶을 필요 없이 effect 안에서 직접 계산하거나, 순수 함수로 추출하면 됩니다.

- **`onApplied`** 는 외부(부모)에서 넘어오는 함수입니다.
  게다가 이 콜백은 부모의 `count`를 클로저로 캡처하고 있어서,
  단순히 참조를 안정화하는 것만으로는 충분하지 않을 수 있습니다.

### 4. `useCallback`으로 `onApplied`를 안정화하면 되지 않을까요?

`useCallback`을 쓸 때 deps 선택에 따라 서로 다른 문제가 생깁니다.

**deps를 `[]`로 비우면** — 함수 참조는 안정적이지만 `count`를 클로저로 캡처한 시점에 고정됩니다.
count가 아무리 바뀌어도 로그에는 항상 초기값만 찍히는 **stale closure** 버그가 발생합니다.

```jsx
const handleApplied = useCallback((t) => {
  setLog(prev => [...prev, `[${count}번째] Applied: ${t}`]);
}, []); // count가 바뀌어도 0으로 고정됨
```

**deps에 `count`를 포함하면** — stale closure는 해결되지만 count가 바뀔 때마다
`handleApplied`의 참조가 새로 만들어집니다.
이 함수가 effect deps에 있으므로, 카운트를 올릴 때마다 테마 적용 effect가 **불필요하게 재실행**됩니다.
count는 로그 표시용일 뿐인데 effect 재실행을 유발하는 게 이상적이지 않습니다.

```jsx
const handleApplied = useCallback((t) => {
  setLog(prev => [...prev, `[${count}번째] Applied: ${t}`]);
}, [count]); // count 바뀔 때마다 effect 재실행
```

### 5. 어떤 해결 방법들이 있을까요?

**방법 1 — 메모이제이션** (`solve1.jsx`)

`style`을 `useMemo`로 감싸고, `onApplied`를 부모에서 `useCallback([count])`으로 감쌉니다.
stale closure는 없지만 count 변화가 effect 재실행을 유발하는 한계가 있습니다.

**방법 2 — 순수 함수 추출** (`solve2.jsx`)

객체 생성 로직을 컴포넌트 바깥 순수 함수로 옮겨 style 문제를 해결합니다.
`onApplied`는 방법 1과 동일하게 `useCallback([count])`이 필요하며 같은 한계를 공유합니다.

**방법 3 — useRef로 콜백 추적** (`solve3.jsx`)

`onApplied`를 ref에 저장하고 매 렌더마다 최신 값으로 갱신합니다.
effect는 ref를 통해 최신 함수를 호출하므로 `onApplied`를 deps에서 제외할 수 있습니다.
count가 바뀌어도 effect가 재실행되지 않고, 부모 수정도 불필요합니다.

**방법 4 — useEffectEvent** (`solve4.jsx`)

방법 3의 useRef 패턴을 React가 공식 API로 추상화한 것입니다.
`useEffectEvent`로 감싼 함수는 항상 최신 값을 읽지만 effect의 의존성으로 취급되지 않습니다.
React 19.2에서 stable API로 승격되어 `experimental_` 접두사 없이 사용 가능합니다.

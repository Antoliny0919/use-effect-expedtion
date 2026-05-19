// [풀이 4] useEffectEvent
//
// solve3의 useRef 패턴을 React가 공식 API로 추상화한 것.
// useEffectEvent로 감싼 함수는 항상 최신 값을 읽지만,
// effect의 의존성으로 취급되지 않아 deps에서 제외할 수 있음.
// 내부적으로는 solve3의 ref 갱신 패턴과 동일하게 동작함.
//
// React 19.2에서 stable API로 승격되어 experimental_ 접두사 없이 import 가능.

import { useState, useEffect, useEffectEvent } from "react";

function getStyle(theme) {
  return {
    background: theme === "dark" ? "#222" : "#fff",
    color: theme === "dark" ? "#fff" : "#222",
  };
}

function applyTheme(style) {
  document.body.style.background = style.background;
  document.body.style.color = style.color;
}

function ThemePreview({ theme, onApplied }) {
  // onApplied를 Effect Event로 감쌈 → 항상 최신 함수를 호출하지만 deps 대상이 아님
  const onReceiveApplied = useEffectEvent(onApplied);

  useEffect(() => {
    console.log('effect 실행:', theme);
    applyTheme(getStyle(theme));
    onReceiveApplied(theme);
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [theme]);

  return <div style={getStyle(theme)}>현재 테마: {theme}</div>;
}

export default function LessSolve4() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme (currently: {theme})
      </button>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      {/* 부모 수정 불필요, useCallback도 필요 없음 */}
      <ThemePreview
        theme={theme}
        onApplied={(t) => setLog((prev) => [...prev, `[${count}번째] Applied: ${t}`])}
      />
      <ul>
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

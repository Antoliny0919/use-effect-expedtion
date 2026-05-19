// [풀이 3] useRef로 최신 콜백 추적
//
// onApplied를 ref에 저장하고 매 렌더마다 갱신.
// effect는 ref를 통해 최신 함수를 호출하므로 onApplied를 deps에서 제외 가능.
//
// ✅ 풀이 1, 2와 달리 count가 바뀌어도 effect가 재실행되지 않음.
//    "로그에 최신 count를 보여준다"는 건 이벤트적 동작이지 effect의 재실행 조건이 아님.
//    ref 패턴은 이 둘을 정확히 분리함. React의 useEffectEvent가 이 패턴을 공식화한 것.

import { useState, useEffect, useRef } from "react";

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
  const onAppliedRef = useRef(onApplied);
  useEffect(() => {
    onAppliedRef.current = onApplied;
  });

  useEffect(() => {
    console.log('effect 실행:', theme);
    applyTheme(getStyle(theme));
    onAppliedRef.current(theme);
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [theme]);

  return <div style={getStyle(theme)}>현재 테마: {theme}</div>;
}

export default function LessSolve3() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme (currently: {theme})
      </button>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      {/* 인라인 함수로 count를 캡처해도 effect 재실행 없음 */}
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

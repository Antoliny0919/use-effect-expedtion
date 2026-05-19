// [풀이 2] 순수 함수 추출 + useCallback
//
// style → 컴포넌트 바깥 getStyle 함수로 추출, effect 내부에서 호출
// onApplied → 부모에서 useCallback으로 안정화
//
// ⚠️ 풀이 1과 동일한 한계: count를 deps에 포함한 useCallback은
//    count가 바뀔 때마다 새 참조를 만들어 effect를 불필요하게 재실행시킴.

import { useState, useEffect, useCallback } from "react";

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
  useEffect(() => {
    console.log('effect 실행:', theme);
    applyTheme(getStyle(theme));
    onApplied(theme);
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [theme, onApplied]);

  return <div style={getStyle(theme)}>현재 테마: {theme}</div>;
}

export default function LessSolve2() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  const handleApplied = useCallback(
    (t) => {
      setLog((prev) => [...prev, `[${count}번째] Applied: ${t}`]);
    },
    [count],
  );

  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme (currently: {theme})
      </button>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <ThemePreview theme={theme} onApplied={handleApplied} />
      <ul>
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

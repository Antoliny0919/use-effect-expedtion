// [풀이 1] useMemo + useCallback으로 참조 안정화
//
// style → useMemo로 theme이 바뀔 때만 새 객체 생성
// onApplied → useCallback으로 안정화. 단, count를 캡처하므로 deps에 count 포함 필요.
//
// ⚠️ 한계: count가 바뀔 때마다 handleApplied의 참조가 바뀌고,
//         그게 effect deps에 있으므로 테마 재적용 effect가 불필요하게 재실행됨.
//         count는 로그 표시용일 뿐인데 effect 재실행을 유발하는 게 이상적이지 않음.

import { useState, useEffect, useMemo, useCallback } from "react";

function applyTheme(style) {
  document.body.style.background = style.background;
  document.body.style.color = style.color;
}

function ThemePreview({ theme, onApplied }) {
  const style = useMemo(
    () => ({
      background: theme === "dark" ? "#222" : "#fff",
      color: theme === "dark" ? "#fff" : "#222",
    }),
    [theme],
  );

  useEffect(() => {
    console.log('effect 실행:', theme);
    applyTheme(style);
    onApplied(theme);
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [style, theme, onApplied]);

  return <div style={style}>현재 테마: {theme}</div>;
}

export default function LessSolve1() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  // count를 deps에 넣어야 최신 count를 캡처할 수 있음
  // 하지만 count가 바뀌면 새 함수 참조 → effect 재실행
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

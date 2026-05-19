import { useState, useEffect } from "react";

function applyTheme(style) {
  document.body.style.background = style.background;
  document.body.style.color = style.color;
}

function ThemePreview({ theme, onApplied }) {
  const style = {
    background: theme === "dark" ? "#222" : "#fff",
    color: theme === "dark" ? "#fff" : "#222",
  };

  useEffect(() => {
    console.log('effect 실행:', theme);
    applyTheme(style);
    onApplied(theme);
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, []);
  // exhaustive-deps

  return <div style={style}>현재 테마: {theme}</div>;
}

export default function LessProblem() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme (currently: {theme})
      </button>
      <button onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
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

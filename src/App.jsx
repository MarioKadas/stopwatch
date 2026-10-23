import { useCallback, useEffect, useRef, useState } from "react";

const pad = (n, len = 2) => String(n).padStart(len, "0");

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hrs = Math.floor(totalSec / 3600);
  return { hrs, min: pad(min), sec: pad(sec), cs: pad(cs) };
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const startRef = useRef(0); // performance.now() at last start, minus time already elapsed
  const rafRef = useRef(null);

  // Tick loop: derive time from the clock, not from counting frames,
  // so the display stays accurate even if the tab is throttled.
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Apply + remember the theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* storage unavailable: theme just won't persist */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#eef1f8" : "#0d1220");
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
  }, []);

  // Keyboard: Space = start/pause, R = reset
  useEffect(() => {
    const onKey = (e) => {
      // Don't hijack browser shortcuts like Ctrl+R / Cmd+R (page refresh)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === "Space") {
        // A focused button already toggles on Space natively; avoid a double trigger
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        toggle();
      } else if (e.code === "KeyR") {
        reset(); // works for both "r" and "R", regardless of which element has focus
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, reset]);

  const { hrs, min, sec, cs } = formatTime(elapsed);
  const isIdle = !running && elapsed === 0;

  return (
    <main className="app">
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <section className="watch" aria-label="Stopwatch">
        <div
          className={`display${running ? " is-running" : ""}`}
          role="timer"
          aria-live="off"
        >
          {hrs > 0 && (
            <>
              <span className="digits">{hrs}</span>
              <span className="sep">:</span>
            </>
          )}
          <span className="digits">{min}</span>
          <span className="sep">:</span>
          <span className="digits">{sec}</span>
          <span className="cs">.{cs}</span>
        </div>

        <div className="controls">
          <button
            type="button"
            className={`btn primary${running ? " is-pause" : ""}`}
            onClick={toggle}
          >
            {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={reset}
            disabled={isIdle}
          >
            Reset
          </button>
        </div>

        <p className="hint">Space to start or pause · R to reset</p>
      </section>
    </main>
  );
}

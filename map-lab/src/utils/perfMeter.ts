import { useEffect, useRef, useState } from "react";

export function usePerfHUD() {
  const [fps, setFps] = useState(0);
  const [longTasks, setLongTasks] = useState(0);
  const [visibleChunks, setVisibleChunks] = useState(0);
  const [visibleHexes, setVisibleHexes] = useState(0);

  const fpsRef = useRef(0);
  const longTaskRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    let frames = 0;
    let start = performance.now();

    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now - start >= 1000) {
        const nextFps = (frames * 1000) / (now - start);
        fpsRef.current = nextFps;
        setFps(nextFps);
        frames = 0;
        start = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== "undefined") {
      observer = new PerformanceObserver((list) => {
        let count = 0;
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) count += 1;
        }
        if (!count) return;
        longTaskRef.current += count;
        setLongTasks(longTaskRef.current);
      });
      observer.observe({ entryTypes: ["longtask"] as any });
    }

    (window as any).__gameReady__ = true;
    (window as any).__startPerfScenario__ = () => {};
    (window as any).__collectPerfStats__ = async ({ durationMs = 5000 }: { durationMs: number }) => {
      const startTime = performance.now();
      const samples: number[] = [];
      return new Promise((resolve) => {
        const id = window.setInterval(() => {
          samples.push(fpsRef.current);
          if (performance.now() - startTime >= durationMs) {
            clearInterval(id);
            const sorted = [...samples].sort((a, b) => a - b);
            const avg = sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length);
            const p1 = sorted[Math.floor(sorted.length * 0.01)] || 0;
            const p99Frame = 1000 / Math.max(1, sorted[Math.floor(sorted.length * 0.99)] || 1);
            resolve({ avgFps: avg, p1Fps: p1, p99Frame, longTasks: longTaskRef.current });
          }
        }, 250);
      });
    };

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return { fps, longTasks, visibleChunks, visibleHexes, setVisibleChunks, setVisibleHexes };
}

export type PerfHandle = ReturnType<typeof usePerfHUD>;
export function usePerfHUDHandle() {
  return usePerfHUD();
}

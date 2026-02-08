import { useEffect, useRef, useState } from "react";

export function usePerfHUD() {
  const [fps, setFps] = useState(0);
  const [longTasks, setLong] = useState(0);
  const [visibleChunks, setVisibleChunks] = useState(0);
  const [visibleHexes, setVisibleHexes] = useState(0);
  const poRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    let frames = 0;
    let start = performance.now();
    const raf = () => {
      frames++;
      const now = performance.now();
      if (now - start >= 1000) {
        setFps(frames * 1000 / (now - start));
        frames = 0; start = now;
      }
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    const po = new PerformanceObserver((list) => {
      let c = 0;
      for (const e of list.getEntries()) if (e.duration > 50) c++;
      setLong((x)=>x + c);
    });
    po.observe({ entryTypes: ["longtask"] as any });
    poRef.current = po;

    (window as any).__gameReady__ = true;
    (window as any).__startPerfScenario__ = () => {};
    (window as any).__collectPerfStats__ = async ({ durationMs = 5000 }:{durationMs:number}) => {
      const t0 = performance.now();
      const samples:number[] = [];
      return new Promise((resolve) => {
        const id = setInterval(() => {
          samples.push(fps);
          if (performance.now() - t0 >= durationMs) {
            clearInterval(id);
            const avg = samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length);
            const sorted = [...samples].sort((a,b)=>a-b);
            const p1 = sorted[Math.floor(0.01*sorted.length)] || 0;
            const p99Frame = 1000 / ((sorted[Math.floor(0.99*sorted.length)] || 1));
            resolve({ avgFps: avg, p1Fps: p1, p99Frame, longTasks });
          }
        }, 250);
      });
    };

    return () => { po.disconnect(); };
  }, []);

  return { fps, longTasks, visibleChunks, visibleHexes, setVisibleChunks, setVisibleHexes };
}

export type PerfHandle = ReturnType<typeof usePerfHUD>;
export function usePerfHUDHandle() { return usePerfHUD(); }

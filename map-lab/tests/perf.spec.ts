import { test, expect } from "@playwright/test";

test("map perf", async ({ page }) => {
  await page.goto("http://localhost:5173/?seed=123&tiles=20000&testMode=1");
  await page.waitForFunction(() => (window as any).__gameReady__ === true);
  const stats:any = await page.evaluate(async () => {
    return await (window as any).__collectPerfStats__({ durationMs: 3000 });
  });
  console.log("Perf stats", stats);
  expect(stats.avgFps).toBeGreaterThanOrEqual(45);
});

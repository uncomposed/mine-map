Map Lab
A small, deterministic lab for hex-map generation and remix experiments.

What you get
- React
- Chunked generation in a Web Worker using OpenSimplex FBM, ridged, plates, seams, warp
- Bands-based coloring for glanceable movement values
- Remix controls: weight deltas, relax kernel, stack rule
- Perf HUD and a Playwright perf smoke test

Quick start
1. npm install
2. npx playwright install chromium
3. npm run dev
4. open http://localhost:5173

Perf test
npm run perf:test

Ideas
- Add contour rendering
- Add LOD: draw chunk-level rectangles when zoomed far out
- Add layers z>0 and a toggle to view deeper strata

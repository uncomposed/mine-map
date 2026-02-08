import { axialToWorld } from "./hexMath";

export type ChunkCoord = { cq: number; cr: number };
export type ViewTransform = { x: number; y: number; k: number };

export function visibleChunks(
  view: ViewTransform,
  width: number,
  height: number,
  tileRadius: number,
  chunkSize: number,
) {
  const pad = 2 * tileRadius;
  const x0 = -view.x / view.k - pad;
  const y0 = -view.y / view.k - pad;
  const x1 = x0 + width / view.k + 2 * pad;
  const y1 = y0 + height / view.k + 2 * pad;

  const chunkWorldWidth = chunkSize * Math.sqrt(3) * tileRadius;
  const chunkWorldHeight = chunkSize * 1.5 * tileRadius;

  const cq0 = Math.floor(x0 / chunkWorldWidth) - 1;
  const cq1 = Math.floor(x1 / chunkWorldWidth) + 1;
  const cr0 = Math.floor(y0 / chunkWorldHeight) - 1;
  const cr1 = Math.floor(y1 / chunkWorldHeight) + 1;

  const out: ChunkCoord[] = [];
  for (let cr = cr0; cr <= cr1; cr++) {
    for (let cq = cq0; cq <= cq1; cq++) {
      out.push({ cq, cr });
    }
  }
  return out;
}

export function prioritizeChunks(
  chunks: ChunkCoord[],
  view: ViewTransform,
  width: number,
  height: number,
  tileRadius: number,
  chunkSize: number,
  limit: number,
) {
  const centerWorldX = (width * 0.5 - view.x) / view.k;
  const centerWorldY = (height * 0.5 - view.y) / view.k;

  return chunks
    .map((c) => {
      const centerQ = c.cq * chunkSize + chunkSize * 0.5;
      const centerR = c.cr * chunkSize + chunkSize * 0.5;
      const world = axialToWorld(centerQ, centerR, tileRadius);
      const dx = world.x - centerWorldX;
      const dy = world.y - centerWorldY;
      return { c, dist2: dx * dx + dy * dy };
    })
    .sort((a, b) => a.dist2 - b.dist2)
    .slice(0, limit)
    .map((it) => it.c);
}

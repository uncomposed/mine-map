import { fbm2D } from '../engine/field2d.js';

export type MovementMap = { w: number; h: number; move: Int8Array; };
export type GenConfig = { width: number; height: number; seed: string; clampMin?: number; clampMax?: number; landThresh?: number; };

export function generateMovement(config: GenConfig): MovementMap {
  const startTime = performance.now();
  const { width:w, height:h, seed, clampMin = -3, clampMax = 3, landThresh = 0.1 } = config;

  // Optimized for smaller maps: reduced octaves and frequency bases
  const C = fbm2D(w, h, seed + ':C', { octaves: 2, freqBase: 48, persistence: 0.5 });
  const R = fbm2D(w, h, seed + ':R', { octaves: 2, freqBase: 24, persistence: 0.5 });
  const D = fbm2D(w, h, seed + ':D', { octaves: 2, freqBase: 12, persistence: 0.5 });

  const move = new Int8Array(w * h);

  function coastBonus(v: number) {
    const d = Math.abs(v - landThresh);
    return Math.exp(-((d * 6) ** 2));
  }

  for (let i = 0; i < move.length; i++) {
    const c = C[i]!; const r = R[i]!; const d = D[i]!;
    let M0 = 1.2 * c + 0.7 * r + 0.3 * d;
    M0 += 0.8 * coastBonus(c);
    if (c < landThresh) M0 = Math.min(M0, 0.5);
    let q = Math.round(M0);
    if (q < clampMin) q = clampMin;
    if (q > clampMax) q = clampMax;
    if (q === 0) q = 1;
    move[i] = q as number;
  }
  
  const endTime = performance.now();
  console.log(`Map generation (${w}x${h}): ${(endTime - startTime).toFixed(2)}ms`);
  
  return { w, h, move };
}

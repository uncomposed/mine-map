import { fbm2D } from '../engine/field2d.js';

export type MovementMap = { w: number; h: number; move: Int8Array; };
export type GenConfig = { width: number; height: number; seed: string; clampMin?: number; clampMax?: number; landThresh?: number; };

// Cache for generated maps to avoid regeneration
const mapCache = new Map<string, MovementMap>();

export function generateMovement(config: GenConfig): MovementMap {
  const { width:w, height:h, seed, clampMin = -3, clampMax = 3, landThresh = 0.1 } = config;
  
  // Check cache first
  const cacheKey = `${w}x${h}:${seed}:${clampMin}:${clampMax}:${landThresh}`;
  if (mapCache.has(cacheKey)) {
    return mapCache.get(cacheKey)!;
  }

  const startTime = performance.now();

  // Simplified noise generation for better performance
  const C = fbm2D(w, h, seed + ':C', { octaves: 1, freqBase: 32, persistence: 0.5 });
  const R = fbm2D(w, h, seed + ':R', { octaves: 1, freqBase: 16, persistence: 0.5 });

  const move = new Int8Array(w * h);

  // Simplified formula for better performance
  for (let i = 0; i < move.length; i++) {
    const c = C[i]!; 
    const r = R[i]!;
    
    // Simplified movement calculation
    let M0 = c + 0.5 * r;
    
    if (c < landThresh) M0 = Math.min(M0, 0.5);
    
    let q = Math.round(M0);
    if (q < clampMin) q = clampMin;
    if (q > clampMax) q = clampMax;
    if (q === 0) q = 1;
    
    move[i] = q as number;
  }
  
  const result = { w, h, move };
  
  // Cache the result
  mapCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory issues
  if (mapCache.size > 10) {
    const firstKey = mapCache.keys().next().value;
    if (firstKey) {
      mapCache.delete(firstKey);
    }
  }
  
  const endTime = performance.now();
  console.log(`Map generation (${w}x${h}): ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
}

import { RNG } from './rand.js';

export type Field2DOpts = {
  octaves?: number;
  freqBase?: number;
  persistence?: number;
};

// Cache for generated noise fields to avoid regeneration
const noiseCache = new Map<string, Float32Array>();

export function fbm2D(w: number, h: number, seed: string, opts: Field2DOpts = {}) {
  const cacheKey = `${w}x${h}:${seed}:${JSON.stringify(opts)}`;
  
  // Check cache first
  if (noiseCache.has(cacheKey)) {
    return noiseCache.get(cacheKey)!;
  }

  const { octaves = 4, freqBase = 32, persistence = 0.5 } = opts;
  const rng = new RNG(seed);
  
  // Pre-calculate all phase offsets once
  const phases = Array.from({ length: octaves }, () => ({
    ax: rng.range(0, Math.PI * 2),
    ay: rng.range(0, Math.PI * 2),
    bx: rng.range(0, Math.PI * 2),
    by: rng.range(0, Math.PI * 2)
  }));

  // Pre-calculate frequency and amplitude multipliers
  const freqs = new Array(octaves);
  const amps = new Array(octaves);
  for (let o = 0; o < octaves; o++) {
    freqs[o] = (1 / freqBase) * Math.pow(2, o);
    amps[o] = Math.pow(persistence, o);
  }

  const out = new Float32Array(w * h);
  
  // Optimized nested loops with pre-calculated values
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let o = 0; o < octaves; o++) {
        const f = freqs[o];
        const amp = amps[o];
        const ph = phases[o];
        if (ph) {
          const xf = (x + ph.ax) * f;
          const yf = (y + ph.ay) * f;
          const xf2 = (x + ph.bx) * f;
          const yf2 = (y + ph.by) * f;
          
          const s = Math.sin(xf) * Math.cos(yf) * 0.5 + Math.cos(xf2) * Math.sin(yf2) * 0.5;
          val += s * amp;
        }
      }
      out[y * w + x] = val;
    }
  }
  
  // Optimized normalization
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < out.length; i++) {
    const v = out[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  
  const scale = max !== min ? (2 / (max - min)) : 1;
  const offset = min * scale - 1;
  
  for (let i = 0; i < out.length; i++) {
    out[i] = out[i] * scale - offset;
  }
  
  // Cache the result
  noiseCache.set(cacheKey, out);
  
  // Limit cache size to prevent memory issues
  if (noiseCache.size > 20) {
    const firstKey = noiseCache.keys().next().value;
    noiseCache.delete(firstKey);
  }
  
  return out;
}

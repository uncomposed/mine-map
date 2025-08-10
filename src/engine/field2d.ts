import { RNG } from './rand';

export type Field2DOpts = {
  octaves?: number;
  freqBase?: number;
  persistence?: number;
};

export function fbm2D(w: number, h: number, seed: string, opts: Field2DOpts = {}) {
  const { octaves = 4, freqBase = 32, persistence = 0.5 } = opts;
  const rng = new RNG(seed);
  const phases = Array.from({ length: octaves }, () => ({
    ax: rng.range(0, Math.PI * 2),
    ay: rng.range(0, Math.PI * 2),
    bx: rng.range(0, Math.PI * 2),
    by: rng.range(0, Math.PI * 2)
  }));

  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let amp = 1;
      let val = 0;
      for (let o = 0; o < octaves; o++) {
        const f = (1 / freqBase) * Math.pow(2, o);
        const ph = phases[o];
        const s =
          Math.sin((x + ph.ax) * f) * Math.cos((y + ph.ay) * f) * 0.5 +
          Math.cos((x + ph.bx) * f) * Math.sin((y + ph.by) * f) * 0.5;
        val += s * amp;
        amp *= persistence;
      }
      out[y * w + x] = val;
    }
  }
  let min = Infinity, max = -Infinity;
  for (const v of out) { if (v < min) min = v; if (v > max) max = v; }
  const scale = max !== min ? (2 / (max - min)) : 1;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - min) * scale - 1;
  return out;
}

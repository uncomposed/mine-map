import { makeNoise2D } from "open-simplex-noise";
import { WorldConfig, Remix } from "../types";

const CHUNK = 64;

self.onmessage = (e: MessageEvent) => {
  const { id, req } = e.data as { id: number; req: { cfg: WorldConfig; remix?: Remix; chunk: { cq: number; cr: number }; layer: number } };
  const res = generateChunk(req);
  (self as any).postMessage({ id, res }, [res.movement.buffer]);
};

function generateChunk(req: { cfg: WorldConfig; remix?: Remix; chunk: { cq: number; cr: number }; layer: number }) {
  const { cfg, remix, chunk, layer } = req;
  const movement = new Int8Array(CHUNK * CHUNK);
  const seed = cfg.seed|0;

  const base = makeNoise2D(seed);
  const warpX = makeNoise2D(seed * 97 + 1);
  const warpY = makeNoise2D(seed * 97 + 2);

  const plates = plateSites(cfg.noise.plateCount, seed, remix?.dPlateShift);

  for (let i=0;i<CHUNK*CHUNK;i++) {
    const q = i % CHUNK + chunk.cq * CHUNK;
    const r = Math.floor(i / CHUNK) + chunk.cr * CHUNK;
    const w = axialToWorld(q, r);
    const wx = w.x + cfg.noise.warpAmp * warpX(w.x * cfg.noise.warpFreq, w.y * cfg.noise.warpFreq);
    const wy = w.y + cfg.noise.warpAmp * warpY(w.x * cfg.noise.warpFreq, w.y * cfg.noise.warpFreq);

    // Generate base terrain features
    const f = fbm(base, wx, wy, cfg.noise.octaves, cfg.noise.lacunarity, cfg.noise.gain);
    const rid = 1 - Math.abs(fbm(base, wx+1000, wy+1000, Math.max(1,cfg.noise.octaves-1), cfg.noise.lacunarity, cfg.noise.gain));
    const plate = plateField(wx, wy, plates);
    const seam = seamField(wx, wy, seed, cfg.noise.seamDensity);
    const depth = depthBand(layer, cfg.layers);

    // Enhanced terrain generation with better continental shapes
    let v =
      cfg.noise.fbmWeight * f +
      cfg.noise.ridgedWeight * rid +
      cfg.noise.plateWeight * plate +
      cfg.noise.seamWeight * seam +
      cfg.noise.depthWeight * depth;

    // Add continental bias - create more distinct land masses
    const continentalBias = Math.sin(wx * 0.001) * Math.cos(wy * 0.001) * 0.3;
    v += continentalBias;

    // Add coastal erosion for more natural shorelines
    const coastalErosion = Math.exp(-Math.abs(plate - 0.5) * 3) * 0.15;
    v -= coastalErosion;

    // Ensure we have proper ocean/land separation
    if (v < -0.5) {
      v = -0.8; // Deep ocean
    } else if (v < -0.2) {
      v = -0.3; // Shallow water
    } else if (v < 0.1) {
      v = 0.1; // Lowland
    } else if (v < 0.4) {
      v = 0.4; // Highland
    } else {
      v = 0.7; // Mountain
    }

    if (remix?.dWeights) {
      const d = remix.dWeights;
      v += (d.fbmWeight||0)*f + (d.ridgedWeight||0)*rid + (d.plateWeight||0)*plate + (d.seamWeight||0)*seam + (d.depthWeight||0)*depth;
    }

    movement[i] = quantize(v, cfg.bands);
  }

  return { cq: chunk.cq, cr: chunk.cr, size: CHUNK*CHUNK, movement };
}

function axialToWorld(q:number, r:number) {
  const x = Math.sqrt(3) * (q + r/2);
  const y = (3/2) * r;
  return { x, y };
}

function fbm(noise: (x:number,y:number)=>number, x:number, y:number, oct:number, lac:number, gain:number) {
  let amp = 0.5, freq = 1, sum = 0;
  for (let i=0;i<oct;i++) {
    sum += amp * noise(x*freq, y*freq);
    freq *= lac;
    amp *= gain;
  }
  return sum;
}

function plateSites(n:number, seed:number, shift?: Record<number,{dx:number;dy:number}>) {
  const out: {x:number;y:number}[] = [];
  let s = seed * 1664525 + 1013904223;
  for (let i=0;i<n;i++) {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    const x = ((s>>>0)%20000) - 10000;
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    const y = ((s>>>0)%20000) - 10000;
    const sh = shift && shift[i] ? shift[i] : {dx:0,dy:0};
    out.push({ x: x + sh.dx, y: y + sh.dy });
  }
  return out;
}

function plateField(x:number, y:number, sites:{x:number;y:number}[]) {
  let min1 = 1e9, min2 = 1e9;
  for (let i=0;i<sites.length;i++) {
    const dx = x - sites[i].x, dy = y - sites[i].y;
    const d = Math.hypot(dx, dy);
    if (d < min1) { min2 = min1; min1 = d; } else if (d < min2) { min2 = d; }
  }
  
  // Enhanced plate field with better continental definition
  const edge = Math.max(0, Math.min(1, (min2 - min1) / 400)); // Increased for softer edges
  let plateStrength = 1.0 - edge;
  
  // Add some variation to make plates more interesting
  const variation = Math.sin(x * 0.001) * Math.cos(y * 0.001) * 0.15;
  
  // Ensure we have strong continental cores
  if (plateStrength > 0.7) {
    plateStrength = Math.min(1.0, plateStrength + 0.2);
  }
  
  return Math.max(0, Math.min(1, plateStrength + variation));
}

function seamField(x:number, y:number, seed:number, density:number) {
  // Enhanced seam field for more natural coastlines
  const n1 = Math.sin((x+seed)*0.02) * Math.cos((y-seed)*0.02);
  const n2 = Math.sin((x-seed)*0.005) * Math.sin((y+seed)*0.007);
  const n3 = Math.sin((x+seed*2)*0.01) * Math.cos((y-seed*3)*0.015); // Additional variation
  
  // Combine multiple noise layers for more natural coastlines
  const seam = density * (Math.abs(n1) * 0.4 + Math.abs(n2) * 0.4 + Math.abs(n3) * 0.2);
  
  // Add some randomness to break up straight lines
  const random = (Math.sin(x * 0.1 + seed) + Math.cos(y * 0.1 + seed)) * 0.1;
  
  return Math.max(0, Math.min(1, seam + random));
}

function depthBand(layer:number, layers:number) {
  if (layers <= 1) return 0;
  return (layer / (layers-1)) * 0.5;
}

function quantize(v:number, bands:number[]) {
  let idx = 0;
  for (let i=0;i<bands.length;i++) if (v > bands[i]) idx = i+1;
  const clamped = Math.max(-8, Math.min(8, idx - Math.floor(bands.length/2)));
  return clamped;
}

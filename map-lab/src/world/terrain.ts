import { makeNoise2D } from "open-simplex-noise";
import { Remix, WorldConfig } from "../types";
import { clamp } from "./hexMath";

export const CHUNK_SIZE = 64;

type Noise2D = (x: number, y: number) => number;

type PlateSite = { x: number; y: number };

export type TerrainContext = {
  base: Noise2D;
  ridge: Noise2D;
  continent: Noise2D;
  detail: Noise2D;
  warpX: Noise2D;
  warpY: Noise2D;
  seam: Noise2D;
  plates: PlateSite[];
};

export type GenerateChunkInput = {
  cfg: WorldConfig;
  remix?: Remix;
  chunk: { cq: number; cr: number };
  layer: number;
};

export type ChunkData = {
  cq: number;
  cr: number;
  size: number;
  movement: Float32Array;
};

export function terrainContextKey(cfg: WorldConfig, remix?: Remix) {
  const shift = remix?.dPlateShift ? JSON.stringify(remix.dPlateShift) : "none";
  return `${cfg.seed}:${cfg.noise.plateCount}:${shift}`;
}

export function createTerrainContext(cfg: WorldConfig, remix?: Remix): TerrainContext {
  const seed = cfg.seed | 0;
  return {
    base: makeNoise2D(seed * 11 + 1),
    ridge: makeNoise2D(seed * 11 + 2),
    continent: makeNoise2D(seed * 11 + 3),
    detail: makeNoise2D(seed * 11 + 4),
    warpX: makeNoise2D(seed * 11 + 5),
    warpY: makeNoise2D(seed * 11 + 6),
    seam: makeNoise2D(seed * 11 + 7),
    plates: plateSites(cfg.noise.plateCount, seed, remix?.dPlateShift),
  };
}

export function generateChunkData(req: GenerateChunkInput, context?: TerrainContext): ChunkData {
  const { cfg, remix, chunk, layer } = req;
  const ctx = context ?? createTerrainContext(cfg, remix);
  const movement = new Float32Array(CHUNK_SIZE * CHUNK_SIZE);

  for (let i = 0; i < CHUNK_SIZE * CHUNK_SIZE; i++) {
    const q = (i % CHUNK_SIZE) + chunk.cq * CHUNK_SIZE;
    const r = Math.floor(i / CHUNK_SIZE) + chunk.cr * CHUNK_SIZE;

    const world = axialToWorldUnit(q, r);
    const macroWarpFreq = Math.max(0.0001, cfg.noise.warpFreq * 0.35);
    const microWarpFreq = Math.max(0.0001, cfg.noise.warpFreq * 1.6);
    const macroWarpAmp = cfg.noise.warpAmp * 0.55;
    const microWarpAmp = cfg.noise.warpAmp * 0.95;

    const macroWx = world.x + macroWarpAmp * ctx.warpX(world.x * macroWarpFreq, world.y * macroWarpFreq);
    const macroWy = world.y + macroWarpAmp * ctx.warpY(world.x * macroWarpFreq, world.y * macroWarpFreq);
    const microWx = world.x + microWarpAmp * ctx.warpX(world.x * microWarpFreq + 1000, world.y * microWarpFreq - 1000);
    const microWy = world.y + microWarpAmp * ctx.warpY(world.x * microWarpFreq - 1000, world.y * microWarpFreq + 1000);

    const macroContinent = fbm(ctx.continent, macroWx * 0.12, macroWy * 0.12, 4, 2.0, 0.5);
    const microFbm = fbm(ctx.base, microWx, microWy, cfg.noise.octaves, cfg.noise.lacunarity, cfg.noise.gain);
    const detail = fbm(ctx.detail, microWx * 1.7, microWy * 1.7, Math.max(2, cfg.noise.octaves - 1), 2.1, 0.52);
    const ridged = 1 - Math.abs(fbm(ctx.ridge, microWx * 1.35, microWy * 1.35, Math.max(2, cfg.noise.octaves - 1), cfg.noise.lacunarity, cfg.noise.gain));
    const plate = plateMetrics(macroWx, macroWy, ctx.plates);
    const seam = seamField(ctx.seam, microWx, microWy, cfg.noise.seamDensity);
    const depth = depthBand(layer, cfg.layers);

    const macro = macroContinent * 0.95 + plate.interior * cfg.noise.plateWeight;
    const micro = microFbm * cfg.noise.fbmWeight + (ridged * 2 - 1) * cfg.noise.ridgedWeight + detail * 0.25;
    const boundaryUplift = plate.boundary * Math.max(0.05, cfg.noise.plateWeight) * 0.85;

    let v = macro + micro + boundaryUplift + seam * cfg.noise.seamWeight * 0.18 + cfg.noise.depthWeight * depth;

    if (remix?.dWeights) {
      const d = remix.dWeights;
      v +=
        (d.fbmWeight ?? 0) * microFbm +
        (d.ridgedWeight ?? 0) * (ridged * 2 - 1) +
        (d.plateWeight ?? 0) * plate.interior +
        (d.seamWeight ?? 0) * seam +
        (d.depthWeight ?? 0) * depth;
    }

    const seaShifted = v - cfg.noise.seaLevel;
    const coastSharpness = Math.max(0.35, cfg.noise.coastSharpness);
    const mountainSharpness = Math.max(0.6, cfg.noise.mountainSharpness);
    const shaped =
      seaShifted < 0
        ? -Math.pow(Math.abs(seaShifted), coastSharpness)
        : Math.pow(seaShifted, mountainSharpness);

    movement[i] = clamp(Math.tanh(shaped * 1.15), -1, 1);
  }

  return { cq: chunk.cq, cr: chunk.cr, size: CHUNK_SIZE * CHUNK_SIZE, movement };
}

function axialToWorldUnit(q: number, r: number) {
  return {
    x: Math.sqrt(3) * (q + r / 2),
    y: 1.5 * r,
  };
}

function fbm(noise: Noise2D, x: number, y: number, octaves: number, lacunarity: number, gain: number) {
  let amplitude = 0.5;
  let frequency = 1;
  let sum = 0;

  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise(x * frequency, y * frequency);
    frequency *= lacunarity;
    amplitude *= gain;
  }

  return sum;
}

function plateSites(count: number, seed: number, shift?: Record<number, { dx: number; dy: number }>) {
  const out: PlateSite[] = [];
  let s = seed * 1664525 + 1013904223;

  for (let i = 0; i < count; i++) {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    const x = (s >>> 0) % 20000 - 10000;

    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    const y = (s >>> 0) % 20000 - 10000;

    const delta = shift?.[i] ?? { dx: 0, dy: 0 };
    out.push({ x: x + delta.dx, y: y + delta.dy });
  }

  return out;
}

function plateMetrics(x: number, y: number, sites: PlateSite[]) {
  let min1 = Number.POSITIVE_INFINITY;
  let min2 = Number.POSITIVE_INFINITY;

  for (let i = 0; i < sites.length; i++) {
    const dx = x - sites[i].x;
    const dy = y - sites[i].y;
    const d = Math.hypot(dx, dy);

    if (d < min1) {
      min2 = min1;
      min1 = d;
    } else if (d < min2) {
      min2 = d;
    }
  }

  const spread = clamp((min2 - min1) / 480, 0, 1);
  const boundary = 1 - spread;
  const interior = spread * 2 - 1;
  const variation = Math.sin(x * 0.0016 + y * 0.0007) * 0.12;

  return {
    interior: clamp(interior + variation, -1, 1),
    boundary: clamp(boundary + variation * 0.3, 0, 1),
  };
}

function seamField(noise: Noise2D, x: number, y: number, density: number) {
  const freq = 0.22 + density * 0.28;
  const n = Math.abs(noise(x * freq, y * freq));
  const channels = 1 - n;
  return clamp(channels * 2 - 1, -1, 1);
}

function depthBand(layer: number, layers: number) {
  if (layers <= 1) return 0;
  return -(layer / (layers - 1));
}

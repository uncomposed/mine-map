import { describe, expect, it } from "vitest";
import { generateChunkData } from "../src/world/terrain";
import { WorldConfig } from "../src/types";

const baseCfg: WorldConfig = {
  seed: 42,
  diameter: 160,
  noise: {
    plateCount: 8,
    warpAmp: 80,
    warpFreq: 0.007,
    octaves: 5,
    lacunarity: 2,
    gain: 0.52,
    fbmWeight: 0.7,
    ridgedWeight: 0.35,
    plateWeight: 0.5,
    seamWeight: 0.2,
    depthWeight: 0.15,
    seamDensity: 0.4,
    seaLevel: 0.05,
    coastSharpness: 0.78,
    mountainSharpness: 1.25,
    macroScale: 1.1,
    microRoughness: 0.55,
  },
  layers: 4,
  bands: [],
};

describe("terrain generation", () => {
  it("is deterministic for the same input", () => {
    const a = generateChunkData({ cfg: baseCfg, chunk: { cq: 0, cr: 0 }, layer: 0 });
    const b = generateChunkData({ cfg: baseCfg, chunk: { cq: 0, cr: 0 }, layer: 0 });
    expect(Array.from(a.movement)).toEqual(Array.from(b.movement));
  });

  it("changes when seed changes", () => {
    const a = generateChunkData({ cfg: baseCfg, chunk: { cq: 1, cr: -2 }, layer: 0 });
    const c = generateChunkData({ cfg: { ...baseCfg, seed: 99 }, chunk: { cq: 1, cr: -2 }, layer: 0 });

    let diffCount = 0;
    for (let i = 0; i < a.movement.length; i++) {
      if (Math.abs(a.movement[i] - c.movement[i]) > 1e-6) diffCount += 1;
    }

    expect(diffCount).toBeGreaterThan(2000);
  });

  it("produces continuous movement values, not coarse buckets", () => {
    const a = generateChunkData({ cfg: baseCfg, chunk: { cq: 0, cr: 0 }, layer: 0 });
    const uniqueRounded = new Set(Array.from(a.movement, (v) => v.toFixed(3)));
    expect(uniqueRounded.size).toBeGreaterThan(400);
  });

  it("keeps movement values in normalized range", () => {
    const a = generateChunkData({ cfg: baseCfg, chunk: { cq: 0, cr: 0 }, layer: 0 });
    const min = Math.min(...a.movement);
    const max = Math.max(...a.movement);
    expect(min).toBeGreaterThanOrEqual(-1);
    expect(max).toBeLessThanOrEqual(1);
  });
});

import { describe, expect, it } from "vitest";
import { prioritizeChunks, visibleChunks } from "../src/world/chunkPlan";

describe("chunk planning", () => {
  it("returns visible chunk candidates for the current viewport", () => {
    const chunks = visibleChunks({ x: 800, y: 450, k: 1 }, 1600, 900, 14, 64);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("prioritizes chunks nearest the viewport center", () => {
    const chunks = [
      { cq: 0, cr: 0 },
      { cq: 6, cr: 6 },
      { cq: 1, cr: 0 },
      { cq: -7, cr: 5 },
      { cq: 0, cr: 1 },
    ];

    const prioritized = prioritizeChunks(chunks, { x: 800, y: 450, k: 1 }, 1600, 900, 14, 64, 3);
    expect(prioritized).toHaveLength(3);

    const keys = prioritized.map((c) => `${c.cq}:${c.cr}`);
    expect(keys).toContain("0:0");
    expect(keys).not.toContain("6:6");
  });

  it("respects request limit", () => {
    const all = visibleChunks({ x: 400, y: 300, k: 0.25 }, 800, 600, 14, 64);
    const limited = prioritizeChunks(all, { x: 400, y: 300, k: 0.25 }, 800, 600, 14, 64, 12);
    expect(limited).toHaveLength(12);
  });
});

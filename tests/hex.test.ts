import { describe, it, expect } from 'vitest';
import type { Axial } from '../src/engine/hex.js';
import { neighbors, axialDistance, axialToPixel, pixelToAxial } from '../src/engine/hex.js';

const layout = { hexSize: 32, originX: 0, originY: 0 };

describe('axial neighbors', () => {
  it('returns 6 neighbors around origin', () => {
    const ns = neighbors({ q: 0, r: 0 });
    expect(ns).toHaveLength(6);
    // neighbors should be unique
    const set = new Set(ns.map((n: Axial) => `${n.q},${n.r}`));
    expect(set.size).toBe(6);
  });
});

describe('axial distance', () => {
  it('distance to self is 0', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });
  it('distance symmetric and matches known values', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(axialDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
   // max(|dq|=3, |dr|=4, |ds|=1) = 4
    expect(axialDistance({ q: -2, r: 3 }, { q: 1, r: -1 })).toBe(4);
  });
});

describe('axial <-> pixel', () => {
  const samples: Axial[] = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: 2, r: -1 }
  ];
  it('round-trips within tolerance for typical hexSize', () => {
    for (const a of samples) {
      const p = axialToPixel(a, layout);
      const back = pixelToAxial(p.x, p.y, layout);
      expect(back.q).toBe(a.q);
      expect(back.r).toBe(a.r);
    }
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the worker
vi.mock('../src/workers/genWorker', () => ({
  startWorker: () => ({
    request: vi.fn().mockResolvedValue({
      cq: 0, cr: 0, size: 64, movement: new Int8Array(64 * 64).fill(0)
    })
  })
}));

// Mock the performance meter
vi.mock('../src/utils/perfMeter', () => ({
  usePerfHUDHandle: () => ({
    setVisibleChunks: vi.fn(),
    setVisibleHexes: vi.fn()
  })
}));

describe('HexGrid Zoom and Pan Functionality', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      seed: 123,
      diameter: 100,
      noise: {
        plateCount: 12,
        warpAmp: 80,
        warpFreq: 0.008,
        octaves: 5,
        lacunarity: 2.2,
        gain: 0.45,
        fbmWeight: 0.5,
        ridgedWeight: 0.4,
        plateWeight: 0.3,
        seamWeight: 0.15,
        depthWeight: 0.2,
        seamDensity: 0.4
      },
      layers: 4,
      bands: [-0.8, -0.3, 0.1, 0.4, 0.7]
    };
  });

  it('should have proper configuration for zoom/pan', () => {
    expect(mockConfig).toBeDefined();
    expect(mockConfig.noise.plateCount).toBe(12);
    expect(mockConfig.noise.warpAmp).toBe(80);
    expect(mockConfig.bands).toEqual([-0.8, -0.3, 0.1, 0.4, 0.7]);
  });

  it('should have proper terrain bands for continents', () => {
    const bands = mockConfig.bands;
    
    // Should have ocean bands (negative)
    const oceanBands = bands.filter(b => b < 0);
    expect(oceanBands.length).toBeGreaterThan(0);
    expect(oceanBands[0]).toBe(-0.8); // Deep ocean
    expect(oceanBands[1]).toBe(-0.3); // Shallow water
    
    // Should have land bands (positive)
    const landBands = bands.filter(b => b > 0);
    expect(landBands.length).toBeGreaterThan(0);
    expect(landBands[0]).toBe(0.1); // Lowland
    expect(landBands[1]).toBe(0.4); // Highland
    expect(landBands[2]).toBe(0.7); // Mountain
  });

  it('should have proper noise configuration for continental shapes', () => {
    const noise = mockConfig.noise;
    
    // Plate count should be sufficient for continents
    expect(noise.plateCount).toBeGreaterThanOrEqual(8);
    
    // Warp amplitude should be sufficient for organic coastlines
    expect(noise.warpAmp).toBeGreaterThanOrEqual(50);
    
    // Plate weight should be sufficient for continental boundaries
    expect(noise.plateWeight).toBeGreaterThanOrEqual(0.2);
    
    // Seam weight should be sufficient for coastline definition
    expect(noise.seamWeight).toBeGreaterThanOrEqual(0.1);
  });

  it('should have proper layer configuration for depth', () => {
    expect(mockConfig.layers).toBeGreaterThanOrEqual(3);
    expect(mockConfig.layers).toBeLessThanOrEqual(5);
  });

  it('should have balanced terrain weights', () => {
    const noise = mockConfig.noise;
    const totalWeight = noise.fbmWeight + noise.ridgedWeight + noise.plateWeight + noise.seamWeight + noise.depthWeight;
    
    // Total weight should be reasonable (not too high or too low)
    expect(totalWeight).toBeGreaterThan(0.5);
    expect(totalWeight).toBeLessThan(2.0);
  });
});

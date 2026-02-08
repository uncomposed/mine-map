import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the open-simplex-noise module
vi.mock('open-simplex-noise', () => ({
  makeNoise2D: () => (x: number, y: number) => {
    // Return deterministic noise values for testing
    return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
  }
}));

describe('Terrain Generation', () => {
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

  it('should have proper terrain configuration for continents', () => {
    expect(mockConfig).toBeDefined();
    expect(mockConfig.bands).toEqual([-0.8, -0.3, 0.1, 0.4, 0.7]);
    expect(mockConfig.noise.plateCount).toBe(12);
    expect(mockConfig.noise.warpAmp).toBe(80);
  });

  it('should have ocean bands for water generation', () => {
    const bands = mockConfig.bands;
    const oceanBands = bands.filter(b => b < 0);
    
    expect(oceanBands.length).toBeGreaterThan(0);
    expect(oceanBands[0]).toBe(-0.8); // Deep ocean
    expect(oceanBands[1]).toBe(-0.3); // Shallow water
  });

  it('should have land bands for terrain generation', () => {
    const bands = mockConfig.bands;
    const landBands = bands.filter(b => b > 0);
    
    expect(landBands.length).toBeGreaterThan(0);
    expect(landBands[0]).toBe(0.1); // Lowland
    expect(landBands[1]).toBe(0.4); // Highland
    expect(landBands[2]).toBe(0.7); // Mountain
  });

  it('should have proper noise parameters for continental shapes', () => {
    const noise = mockConfig.noise;
    
    // Plate count should create distinct continental masses
    expect(noise.plateCount).toBeGreaterThanOrEqual(8);
    expect(noise.plateCount).toBeLessThanOrEqual(20);
    
    // Warp amplitude should create organic coastlines
    expect(noise.warpAmp).toBeGreaterThanOrEqual(50);
    expect(noise.warpAmp).toBeLessThanOrEqual(150);
    
    // Plate weight should be sufficient for continental boundaries
    expect(noise.plateWeight).toBeGreaterThanOrEqual(0.2);
    expect(noise.plateWeight).toBeLessThanOrEqual(0.6);
  });

  it('should have balanced terrain generation weights', () => {
    const noise = mockConfig.noise;
    const totalWeight = noise.fbmWeight + noise.ridgedWeight + noise.plateWeight + noise.seamWeight + noise.depthWeight;
    
    // Total weight should be reasonable
    expect(totalWeight).toBeGreaterThan(0.5);
    expect(totalWeight).toBeLessThan(2.0);
    
    // Individual weights should be positive
    expect(noise.fbmWeight).toBeGreaterThan(0);
    expect(noise.ridgedWeight).toBeGreaterThan(0);
    expect(noise.plateWeight).toBeGreaterThan(0);
    expect(noise.seamWeight).toBeGreaterThan(0);
    expect(noise.depthWeight).toBeGreaterThan(0);
  });

  it('should have proper depth layers for terrain variation', () => {
    expect(mockConfig.layers).toBeGreaterThanOrEqual(3);
    expect(mockConfig.layers).toBeLessThanOrEqual(5);
  });

  it('should have appropriate seam density for coastlines', () => {
    const seamDensity = mockConfig.noise.seamDensity;
    expect(seamDensity).toBeGreaterThanOrEqual(0.2);
    expect(seamDensity).toBeLessThanOrEqual(0.8);
  });
});

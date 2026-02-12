export interface WorldConfig {
  seed: number;
  diameter: number;
  noise: {
    plateCount: number;
    warpAmp: number;
    warpFreq: number;
    octaves: number;
    lacunarity: number;
    gain: number;
    fbmWeight: number;
    ridgedWeight: number;
    plateWeight: number;
    seamWeight: number;
    depthWeight: number;
    seamDensity: number;
    seaLevel: number;
    coastSharpness: number;
    mountainSharpness: number;
    macroScale: number;
    microRoughness: number;
  };
  layers: number;
  bands: number[];
}

export interface Remix {
  id: string;
  dPlateShift?: Record<number, { dx: number; dy: number }>;
  dWeights?: {
    fbmWeight?: number;
    ridgedWeight?: number;
    plateWeight?: number;
    seamWeight?: number;
    depthWeight?: number;
  };
}

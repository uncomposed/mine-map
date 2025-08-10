// Axial coordinates (flat-top). Reference: redblobgames hex grid guide.
export type Axial = { q: number; r: number };

export const AXIAL_DIRS: Readonly<Axial[]> = [
  { q: +1, r: 0 },
  { q: +1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: +1 },
  { q: 0, r: +1 }
];

export function add(a: Axial, b: Axial): Axial {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function neighbors(a: Axial): Axial[] {
  return AXIAL_DIRS.map((d) => add(a, d));
}

export function axialDistance(a: Axial, b: Axial): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = (-a.q - a.r) - (-b.q - b.r);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

// Layout parameters for flat-top hexes
export type Layout = {
  hexSize: number; // radius from center to corner
  originX: number; // pixel origin
  originY: number;
};

// axial -> pixel (flat-top)
export function axialToPixel(a: Axial, layout: Layout): { x: number; y: number } {
  const { hexSize, originX, originY } = layout;
  const x = hexSize * (3/2 * a.q);
  const y = hexSize * (Math.sqrt(3)/2 * a.q + Math.sqrt(3) * a.r);
  return { x: x + originX, y: y + originY };
}

// pixel -> axial (with cube-rounding to nearest axial)
export function pixelToAxial(x: number, y: number, layout: Layout): Axial {
  const { hexSize, originX, originY } = layout;
  const px = x - originX;
  const py = y - originY;

  const qf = (2/3 * px) / hexSize;
  const rf = (-1/3 * px + Math.sqrt(3)/3 * py) / hexSize;

  // convert to cube, round, then back to axial
  const xf = qf;
  const zf = rf;
  const yf = -xf - zf;

  let rx = Math.round(xf);
  let ry = Math.round(yf);
  let rz = Math.round(zf);

  const x_diff = Math.abs(rx - xf);
  const y_diff = Math.abs(ry - yf);
  const z_diff = Math.abs(rz - zf);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

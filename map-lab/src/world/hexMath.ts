export function axialToWorld(q: number, r: number, radius: number) {
  const x = Math.sqrt(3) * (q + r / 2) * radius;
  const y = 1.5 * r * radius;
  return { x, y };
}

export function inRadius(q: number, r: number, radius: number) {
  const s = -q - r;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

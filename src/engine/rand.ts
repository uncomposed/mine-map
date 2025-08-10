export class RNG {
  private state: number;
  constructor(seed: string | number) {
    let s = 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
    this.state = s || 1;
  }
  nextU32() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state;
  }
  next() {
    return this.nextU32() / 0xffffffff;
  }
  range(min: number, max: number) {
    return min + (max - min) * this.next();
  }
}

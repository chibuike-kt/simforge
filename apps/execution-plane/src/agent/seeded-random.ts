/**
 * Mulberry32 PRNG — fast, seedable, deterministic.
 * Same seed = identical agent behavior every run.
 * This is the reproducibility guarantee.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed += 0x6d2b79f5;
    let z = this.seed;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  static childSeed(parentSeed: number, index: number): number {
    return (parentSeed ^ (index * 0x45d9f3b)) >>> 0;
  }
}

export class TokenBucket {
  private tokens: number;
  private lastRefillAt: number;
  private readonly maxTokens: number;
  private refillRatePerMs: number;

  constructor(ratePerSecond: number) {
    this.maxTokens = ratePerSecond;
    this.tokens = ratePerSecond;
    this.refillRatePerMs = ratePerSecond / 1000;
    this.lastRefillAt = Date.now();
  }

  tryConsume(): boolean {
    this.refill();
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }

  async consume(): Promise<void> {
    while (!this.tryConsume()) await sleep(10);
  }

  backOff(factor = 0.8): void {
    const newRate = Math.max(1, Math.floor(this.refillRatePerMs * 1000 * factor));
    this.refillRatePerMs = newRate / 1000;
    console.warn(`[TokenBucket] Backed off to ${newRate} RPS`);
  }

  get currentRate(): number {
    return Math.round(this.refillRatePerMs * 1000);
  }

  private refill(): void {
    const now = Date.now();
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + (now - this.lastRefillAt) * this.refillRatePerMs,
    );
    this.lastRefillAt = now;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

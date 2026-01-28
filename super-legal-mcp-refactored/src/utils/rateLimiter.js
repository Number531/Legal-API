/**
 * Simple token bucket rate limiter (requests per minute, tokens per minute).
 */
export class RateLimiter {
  constructor({ rpm = 60, tpm = 60000 } = {}) {
    this.rpm = rpm;
    this.tpm = tpm;
    this.requestBucket = rpm;
    this.tokenBucket = tpm;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedMinutes = (now - this.lastRefill) / 60000;
    if (elapsedMinutes >= 1) {
      this.requestBucket = this.rpm;
      this.tokenBucket = this.tpm;
      this.lastRefill = now;
    }
  }

  acquire(tokens = 0) {
    this.refill();
    if (this.requestBucket < 1) {
      throw new Error('RateLimitError: requests per minute exceeded');
    }
    if (this.tokenBucket < tokens) {
      throw new Error('RateLimitError: tokens per minute exceeded');
    }
    this.requestBucket -= 1;
    this.tokenBucket -= tokens;
  }
}


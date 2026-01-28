/**
 * GeminiRateLimiter - Sliding window rate limiter for Gemini API
 *
 * Implements a sliding window algorithm to enforce rate limits across
 * all GeminiFilterModule instances. Uses a singleton pattern to ensure
 * shared state across the application.
 *
 * Default configuration:
 * - 10 requests per minute (Gemini free tier limit)
 * - 60 second sliding window
 */

/**
 * @typedef {Object} RateLimiterStatus
 * @property {number} current - Current request count in window
 * @property {number} max - Maximum requests allowed
 * @property {number} windowMs - Window size in milliseconds
 * @property {number} remainingMs - Time until oldest request expires
 */

class GeminiRateLimiterClass {
  /**
   * Create a new rate limiter instance
   *
   * @param {Object} options - Configuration options
   * @param {number} [options.maxRequestsPerMinute=10] - Max requests per minute
   * @param {number} [options.windowMs=60000] - Sliding window in milliseconds
   */
  constructor(options = {}) {
    this.maxRequests = options.maxRequestsPerMinute || 10;
    this.windowMs = options.windowMs || 60000;
    this.requests = [];
    this.waitingQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Enforce rate limit - waits if limit reached
   *
   * @returns {Promise<void>} Resolves when request can proceed
   * @throws {Error} If rate limiting fails unexpectedly
   */
  async enforce() {
    const now = Date.now();

    // Remove expired requests outside the window
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    // If under limit, proceed immediately
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return;
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = this.requests[0];
    const waitTime = this.windowMs - (now - oldestRequest) + 100; // 100ms buffer

    if (waitTime > 0) {
      console.log(`[GeminiRateLimiter] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Re-check after waiting (another request may have been added)
      return this.enforce();
    }

    // Should have room now, add request
    this.requests.push(Date.now());
  }

  /**
   * Try to acquire a slot without waiting
   *
   * @returns {boolean} True if slot acquired, false if rate limited
   */
  tryAcquire() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get current rate limiter status
   *
   * @returns {RateLimiterStatus} Current status
   */
  getStatus() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    const oldestRequest = this.requests[0];
    const remainingMs = oldestRequest
      ? Math.max(0, this.windowMs - (now - oldestRequest))
      : 0;

    return {
      current: this.requests.length,
      max: this.maxRequests,
      windowMs: this.windowMs,
      remainingMs,
      utilizationPercent: Math.round((this.requests.length / this.maxRequests) * 100)
    };
  }

  /**
   * Get available slots
   *
   * @returns {number} Number of available request slots
   */
  getAvailableSlots() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until next available slot
   *
   * @returns {number} Milliseconds until next slot available (0 if available now)
   */
  getTimeUntilAvailable() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }

  /**
   * Reset the rate limiter (clear all tracked requests)
   */
  reset() {
    this.requests = [];
    console.log('[GeminiRateLimiter] Reset - all request tracking cleared');
  }

  /**
   * Update rate limiter configuration
   *
   * @param {Object} options - New configuration
   * @param {number} [options.maxRequestsPerMinute] - New max requests
   * @param {number} [options.windowMs] - New window size
   */
  updateConfig(options) {
    if (options.maxRequestsPerMinute !== undefined) {
      this.maxRequests = options.maxRequestsPerMinute;
    }
    if (options.windowMs !== undefined) {
      this.windowMs = options.windowMs;
    }
    console.log(`[GeminiRateLimiter] Config updated: ${this.maxRequests} req/${this.windowMs}ms`);
  }
}

// Singleton instance
let instance = null;

/**
 * GeminiRateLimiter - Singleton wrapper for rate limiter
 */
export const GeminiRateLimiter = {
  /**
   * Get the singleton instance
   *
   * @param {Object} [options] - Configuration options (only used on first call)
   * @returns {GeminiRateLimiterClass} The rate limiter instance
   */
  getInstance(options = {}) {
    if (!instance) {
      instance = new GeminiRateLimiterClass(options);
    }
    return instance;
  },

  /**
   * Reset the singleton instance (useful for testing)
   *
   * @param {Object} [options] - New configuration options
   * @returns {GeminiRateLimiterClass} Fresh instance
   */
  resetInstance(options = {}) {
    instance = new GeminiRateLimiterClass(options);
    return instance;
  }
};

export default GeminiRateLimiter;

/**
 * CircuitBreaker - Protects against cascade failures
 * 
 * Implements the circuit breaker pattern to prevent repeated failures from
 * overwhelming the Supabase connection while allowing automatic recovery.
 */

export class CircuitBreaker {
  constructor(options = {}) {
    this.config = {
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 30000,
      maxConsecutiveFailures: options.maxConsecutiveFailures || 5,
      ...options
    };
    
    this.state = {
      failures: 0,
      consecutiveFailures: 0,
      isOpen: false,
      lastFailure: null,
      resetTimeoutId: null
    };
  }

  /**
   * Check if circuit breaker is open
   */
  isOpen() {
    return this.state.isOpen;
  }

  /**
   * Record a successful operation
   */
  recordSuccess() {
    // Reset all failure counters on success
    this.state.consecutiveFailures = 0;
    
    // Close circuit if it was open
    if (this.state.isOpen) {
      this.closeCircuit();
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure() {
    this.state.failures++;
    this.state.consecutiveFailures++;
    this.state.lastFailure = Date.now();
    
    console.warn(`Circuit breaker failure recorded (${this.state.consecutiveFailures}/${this.config.failureThreshold})`);
    
    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }
  }

  /**
   * Determine if circuit should be opened
   */
  shouldOpenCircuit() {
    return (
      this.state.consecutiveFailures >= this.config.failureThreshold ||
      (this.state.failures >= this.config.maxConsecutiveFailures && 
       Date.now() - this.state.lastFailure < this.config.resetTimeout)
    );
  }

  /**
   * Open the circuit breaker
   */
  openCircuit() {
    if (this.state.isOpen) return; // Already open
    
    this.state.isOpen = true;
    
    console.error('🚨 Circuit breaker opened', {
      consecutive_failures: this.state.consecutiveFailures,
      total_failures: this.state.failures,
      reset_timeout_ms: this.config.resetTimeout,
      timestamp: new Date().toISOString()
    });

    // Schedule automatic reset
    this.scheduleReset();
  }

  /**
   * Close the circuit breaker
   */
  closeCircuit() {
    if (!this.state.isOpen) return; // Already closed
    
    this.state.isOpen = false;
    
    // Clear any pending reset timeout
    if (this.state.resetTimeoutId) {
      clearTimeout(this.state.resetTimeoutId);
      this.state.resetTimeoutId = null;
    }
    
    console.log('✅ Circuit breaker closed - conversation logging re-enabled');
  }

  /**
   * Schedule automatic circuit reset
   */
  scheduleReset() {
    // Clear any existing timeout
    if (this.state.resetTimeoutId) {
      clearTimeout(this.state.resetTimeoutId);
    }
    
    this.state.resetTimeoutId = setTimeout(() => {
      this.attemptReset();
    }, this.config.resetTimeout);
  }

  /**
   * Attempt to reset the circuit breaker
   */
  attemptReset() {
    console.log('🔄 Circuit breaker attempting reset...');
    
    // Move to half-open state (next success will fully close)
    this.state.isOpen = false;
    this.state.resetTimeoutId = null;
    
    console.log('⚠️ Circuit breaker in half-open state - testing connection');
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      isOpen: this.state.isOpen,
      failures: this.state.failures,
      consecutiveFailures: this.state.consecutiveFailures,
      lastFailure: this.state.lastFailure,
      config: this.config
    };
  }

  /**
   * Reset all failure counters (manual reset)
   */
  reset() {
    this.state.failures = 0;
    this.state.consecutiveFailures = 0;
    this.state.lastFailure = null;
    
    if (this.state.resetTimeoutId) {
      clearTimeout(this.state.resetTimeoutId);
      this.state.resetTimeoutId = null;
    }
    
    this.closeCircuit();
    
    console.log('✅ Circuit breaker manually reset');
  }

  /**
   * Get failure rate as percentage
   */
  getFailureRate(totalAttempts) {
    if (totalAttempts === 0) return 0;
    return (this.state.failures / totalAttempts) * 100;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.state.resetTimeoutId) {
      clearTimeout(this.state.resetTimeoutId);
      this.state.resetTimeoutId = null;
    }
  }
}
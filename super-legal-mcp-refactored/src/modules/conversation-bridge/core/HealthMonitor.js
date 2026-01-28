/**
 * HealthMonitor - Tracks conversation bridge performance metrics
 * 
 * Monitors success rates, response times, and provides health alerts
 * without requiring external telemetry dependencies.
 */

export class HealthMonitor {
  constructor(options = {}) {
    this.config = {
      checkInterval: options.checkInterval || 300000, // 5 minutes
      successRateThreshold: options.successRateThreshold || 90,
      responseTimeThreshold: options.responseTimeThreshold || 1000, // 1 second
      ...options
    };
    
    this.metrics = {
      totalAttempts: 0,
      successfulLogs: 0,
      failedLogs: 0,
      avgResponseTime: 0,
      lastHealthCheck: Date.now(),
      responseTimes: []
    };
    
    this.intervalId = null;
    this.healthCallback = null;
  }

  /**
   * Start health monitoring
   */
  start(healthCallback) {
    this.healthCallback = healthCallback;
    
    // Initial health check
    this.performHealthCheck();
    
    // Schedule regular health checks
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    console.log(`✅ Health monitoring started (${this.config.checkInterval}ms intervals)`);
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('✅ Health monitoring stopped');
  }

  /**
   * Record an attempt to log to conversation
   */
  recordAttempt() {
    this.metrics.totalAttempts++;
  }

  /**
   * Record a successful conversation log
   */
  recordSuccess(responseTime) {
    this.metrics.successfulLogs++;
    this.updateResponseTime(responseTime);
  }

  /**
   * Record a failed conversation log
   */
  recordFailure() {
    this.metrics.failedLogs++;
  }

  /**
   * Update average response time
   */
  updateResponseTime(responseTime) {
    // Keep last 100 response times for more accurate averages
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Calculate moving average
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgResponseTime = sum / this.metrics.responseTimes.length;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.successfulLogs / this.metrics.totalAttempts * 100).toFixed(1)
      : '100.0';
    
    return {
      totalAttempts: this.metrics.totalAttempts,
      successfulLogs: this.metrics.successfulLogs,
      failedLogs: this.metrics.failedLogs,
      successRate: parseFloat(successRate),
      avgResponseTime: this.metrics.avgResponseTime,
      lastHealthCheck: this.metrics.lastHealthCheck
    };
  }

  /**
   * Perform health check and log status
   */
  performHealthCheck() {
    this.metrics.lastHealthCheck = Date.now();
    
    if (this.healthCallback) {
      const health = this.healthCallback();
      this.logHealthStatus(health);
      this.checkForAlerts(health);
    }
  }

  /**
   * Log health status
   */
  logHealthStatus(health) {
    const bridgeHealth = health.conversation_bridge;
    
    console.log('📊 Conversation Bridge Health Check:', {
      enabled: bridgeHealth.enabled,
      success_rate: bridgeHealth.success_rate,
      total_attempts: bridgeHealth.total_attempts,
      avg_response_time: bridgeHealth.avg_response_time_ms,
      circuit_status: bridgeHealth.circuit_breaker.status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check for performance alerts
   */
  checkForAlerts(health) {
    const bridgeHealth = health.conversation_bridge;
    const successRate = parseFloat(bridgeHealth.success_rate);
    const avgResponseTime = bridgeHealth.avg_response_time_ms;
    
    // Alert on low success rate
    if (!isNaN(successRate)) {
      if (successRate < 85) {
        console.error('🚨 CRITICAL: Conversation bridge success rate critically low', {
          success_rate: successRate,
          threshold: 85,
          recommendation: 'Investigate Supabase connectivity issues immediately',
          circuit_status: bridgeHealth.circuit_breaker.status
        });
      } else if (successRate < this.config.successRateThreshold) {
        console.warn('⚠️ WARNING: Conversation bridge success rate degraded', {
          success_rate: successRate,
          threshold: this.config.successRateThreshold,
          recommendation: 'Monitor Supabase connection and query performance'
        });
      }
    }
    
    // Alert on high response time
    if (avgResponseTime > this.config.responseTimeThreshold) {
      console.warn('⚠️ WARNING: Conversation bridge response time high', {
        avg_response_time_ms: avgResponseTime,
        threshold_ms: this.config.responseTimeThreshold,
        recommendation: 'Check Supabase performance and network latency'
      });
    }
    
    // Alert if circuit is open
    if (bridgeHealth.circuit_breaker.status === 'OPEN') {
      console.error('🚨 ALERT: Conversation bridge circuit is OPEN', {
        consecutive_failures: bridgeHealth.circuit_breaker.consecutive_failures,
        total_failures: bridgeHealth.circuit_breaker.failures,
        last_failure: bridgeHealth.circuit_breaker.last_failure,
        recommendation: 'Check Supabase service status and connectivity'
      });
    }
  }

  /**
   * Get health summary for external monitoring
   */
  getHealthSummary() {
    const metrics = this.getMetrics();
    
    return {
      status: this.determineHealthStatus(metrics),
      metrics,
      alerts: this.getActiveAlerts(metrics),
      last_check: new Date(this.metrics.lastHealthCheck).toISOString()
    };
  }

  /**
   * Determine overall health status
   */
  determineHealthStatus(metrics) {
    if (metrics.successRate < 85) return 'critical';
    if (metrics.successRate < this.config.successRateThreshold) return 'degraded';
    if (metrics.avgResponseTime > this.config.responseTimeThreshold) return 'degraded';
    return 'healthy';
  }

  /**
   * Get list of active alerts
   */
  getActiveAlerts(metrics) {
    const alerts = [];
    
    if (metrics.successRate < 85) {
      alerts.push({
        level: 'critical',
        message: `Success rate critically low: ${metrics.successRate}%`,
        threshold: 85
      });
    } else if (metrics.successRate < this.config.successRateThreshold) {
      alerts.push({
        level: 'warning',
        message: `Success rate below threshold: ${metrics.successRate}%`,
        threshold: this.config.successRateThreshold
      });
    }
    
    if (metrics.avgResponseTime > this.config.responseTimeThreshold) {
      alerts.push({
        level: 'warning',
        message: `Response time high: ${Math.round(metrics.avgResponseTime)}ms`,
        threshold: this.config.responseTimeThreshold
      });
    }
    
    return alerts;
  }

  /**
   * Reset all metrics (for testing or manual reset)
   */
  reset() {
    this.metrics = {
      totalAttempts: 0,
      successfulLogs: 0,
      failedLogs: 0,
      avgResponseTime: 0,
      lastHealthCheck: Date.now(),
      responseTimes: []
    };
    
    console.log('✅ Health monitor metrics reset');
  }
}
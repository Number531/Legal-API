/**
 * Conversation Bridge Configuration Defaults
 * 
 * Default configuration values for the conversation bridge module
 */

export const CONVERSATION_BRIDGE_DEFAULTS = {
  // Circuit breaker configuration
  circuit: {
    failureThreshold: 3,           // Open circuit after 3 consecutive failures
    resetTimeout: 30000,           // 30 seconds before attempting reset
    maxConsecutiveFailures: 5,     // Maximum failures before extended timeout
    extendedResetTimeout: 300000   // 5 minutes for extended timeout
  },

  // Health monitoring configuration  
  health: {
    checkInterval: 300000,         // 5 minutes between health checks
    successRateThreshold: 90,      // Warning threshold for success rate
    criticalThreshold: 85,         // Critical threshold for success rate
    responseTimeThreshold: 1000,   // Warning threshold for response time (ms)
    enableAlerts: true             // Enable health alerts
  },

  // Conversation management
  conversation: {
    maxTitleLength: 200,           // Maximum conversation title length
    maxSessionsPerUser: 1000,      // Maximum sessions per user (soft limit)
    defaultSessionTimeout: 2592000000, // 30 days in milliseconds
    maxRecallFindings: 20,         // Maximum findings to recall
    defaultRecallLimit: 5          // Default number of findings to recall
  },

  // Performance settings
  performance: {
    enableBackgroundLogging: true,  // Use setImmediate for non-blocking logging
    maxRetries: 3,                 // Maximum retry attempts
    retryDelay: 1000,              // Base delay between retries (ms)
    enableMetricsTracking: true,   // Track performance metrics
    maxResponseTimeHistory: 100    // Keep last N response times
  },

  // Security settings
  security: {
    sanitizeArgs: true,            // Remove sensitive data from logs
    maxContentLength: 100000,      // Maximum message content length
    enableRLS: true,               // Expect Row Level Security to be enabled
    requireUserAuth: false         // Require user authentication (set to true for production)
  },

  // Logging configuration
  logging: {
    level: 'info',                 // Log level: 'error', 'warn', 'info', 'debug'
    enableStructuredLogs: true,    // Use structured logging format
    logHealthChecks: true,         // Log health check results
    logCircuitEvents: true,        // Log circuit breaker events
    logToolCalls: false            // Log individual tool calls (verbose)
  }
};

/**
 * Get configuration with environment overrides
 */
export function getConfig(customConfig = {}) {
  const config = JSON.parse(JSON.stringify(CONVERSATION_BRIDGE_DEFAULTS));
  
  // Environment variable overrides
  const envOverrides = {
    circuit: {
      failureThreshold: parseInt(process.env.CONV_BRIDGE_FAILURE_THRESHOLD) || config.circuit.failureThreshold,
      resetTimeout: parseInt(process.env.CONV_BRIDGE_RESET_TIMEOUT) || config.circuit.resetTimeout
    },
    health: {
      checkInterval: parseInt(process.env.CONV_BRIDGE_HEALTH_INTERVAL) || config.health.checkInterval,
      successRateThreshold: parseInt(process.env.CONV_BRIDGE_SUCCESS_THRESHOLD) || config.health.successRateThreshold
    },
    logging: {
      level: process.env.CONV_BRIDGE_LOG_LEVEL || config.logging.level,
      logHealthChecks: process.env.CONV_BRIDGE_LOG_HEALTH !== 'false',
      logCircuitEvents: process.env.CONV_BRIDGE_LOG_CIRCUIT !== 'false'
    }
  };

  // Deep merge configurations
  const finalConfig = mergeDeep(config, envOverrides, customConfig);
  
  return finalConfig;
}

/**
 * Deep merge utility function
 */
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * Check if value is an object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];
  
  // Validate circuit breaker settings
  if (config.circuit.failureThreshold < 1) {
    errors.push('Circuit breaker failure threshold must be >= 1');
  }
  
  if (config.circuit.resetTimeout < 1000) {
    errors.push('Circuit breaker reset timeout must be >= 1000ms');
  }
  
  // Validate health settings
  if (config.health.checkInterval < 30000) {
    errors.push('Health check interval must be >= 30000ms (30 seconds)');
  }
  
  if (config.health.successRateThreshold < 0 || config.health.successRateThreshold > 100) {
    errors.push('Success rate threshold must be between 0-100');
  }
  
  // Validate conversation settings
  if (config.conversation.maxTitleLength < 10) {
    errors.push('Maximum title length must be >= 10');
  }
  
  if (config.conversation.maxRecallFindings > 100) {
    errors.push('Maximum recall findings must be <= 100');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get environment variable requirements
 */
export function getEnvironmentRequirements() {
  return {
    required: [
      {
        name: 'SUPABASE_URL',
        description: 'Supabase project URL',
        example: 'https://your-project.supabase.co'
      },
      {
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        description: 'Supabase service role key (or SUPABASE_ACCESS_TOKEN)',
        example: 'sbp_...'
      }
    ],
    optional: [
      {
        name: 'PG_CONNECTION_STRING',
        description: 'PostgreSQL connection string (for dual-write)',
        example: 'postgresql://user:pass@host:5432/dbname'
      },
      {
        name: 'CONV_BRIDGE_FAILURE_THRESHOLD', 
        description: 'Circuit breaker failure threshold',
        default: '3'
      },
      {
        name: 'CONV_BRIDGE_RESET_TIMEOUT',
        description: 'Circuit breaker reset timeout (ms)',
        default: '30000'
      },
      {
        name: 'CONV_BRIDGE_HEALTH_INTERVAL',
        description: 'Health check interval (ms)', 
        default: '300000'
      },
      {
        name: 'CONV_BRIDGE_LOG_LEVEL',
        description: 'Log level (error, warn, info, debug)',
        default: 'info'
      }
    ]
  };
}
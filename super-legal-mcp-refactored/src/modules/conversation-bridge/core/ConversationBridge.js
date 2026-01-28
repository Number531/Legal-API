/**
 * ConversationBridge - Production-ready dual-write conversation logging
 * 
 * This class bridges the existing PostgreSQL logging with new Supabase conversation features.
 * It ensures that PostgreSQL logging (critical path) always succeeds while gracefully handling
 * conversation logging failures through circuit breaker patterns.
 */

import { CircuitBreaker } from './CircuitBreaker.js';
import { HealthMonitor } from './HealthMonitor.js';

export class ConversationBridge {
  constructor(postgresClient, supabaseClient, options = {}) {
    this.postgres = postgresClient;
    this.supabase = supabaseClient;
    this.options = {
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 30000,
        maxConsecutiveFailures: 5
      },
      healthMonitor: {
        checkInterval: 300000, // 5 minutes
        successRateThreshold: 90
      },
      ...options
    };
    
    // Initialize formatters
    this.formatters = this.initializeFormatters();
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(this.options.circuitBreaker);
    
    // Initialize health monitor
    this.healthMonitor = new HealthMonitor(this.options.healthMonitor);
    
    // Start health monitoring
    this.healthMonitor.start(() => this.getHealthStatus());
    
    console.log('✅ ConversationBridge initialized with dual-write pattern');
  }

  /**
   * Log tool calls to Supabase for conversation continuity
   * NON-CRITICAL: Conversation logging fails gracefully
   * NOTE: PostgreSQL logging is handled by the original tool implementations
   */
  async logToolCall(toolName, args, result, conversationId = null) {
    // ✅ NON-CRITICAL PATH: Conversation logging (fail-safe, async)
    if (conversationId && !this.circuitBreaker.isOpen()) {
      this.healthMonitor.recordAttempt();
      
      // Use setImmediate for non-blocking background processing
      setImmediate(() => this.logToConversationSafe(toolName, args, result, conversationId));
    }

    return result; // User gets immediate response
  }

  /**
   * Safe conversation logging with error handling and circuit breaker
   */
  async logToConversationSafe(toolName, args, result, conversationId) {
    const startTime = Date.now();
    
    try {
      const sequence = await this.getNextSequence(conversationId);
      const formattedContent = this.formatToolResult(toolName, args, result);
      
      await this.supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: formattedContent,
          sequence_number: sequence,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            result_summary: this.summarizeResult(result),
            args_summary: this.sanitizeArgs(args),
            performance: {
              response_time_ms: Date.now() - startTime,
              result_size: JSON.stringify(result).length
            }
          }
        });

      // Update conversation activity timestamp
      await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // ✅ Success metrics and circuit reset
      const responseTime = Date.now() - startTime;
      this.healthMonitor.recordSuccess(responseTime);
      this.circuitBreaker.recordSuccess();

    } catch (error) {
      // ✅ Failure handling with circuit breaker
      this.healthMonitor.recordFailure();
      this.circuitBreaker.recordFailure();
      
      console.warn(`⚠️ Conversation logging failed for ${toolName}:`, error.message);
      
      // Circuit breaker will automatically open if threshold is reached
      if (this.circuitBreaker.isOpen()) {
        console.warn('🚨 Conversation logging circuit opened - temporarily disabled');
      }
    }
  }

  /**
   * Initialize smart formatters for different legal tools
   */
  initializeFormatters() {
    return {
      'search_cases': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        const jurisdiction = args.jurisdiction || 'all jurisdictions';
        return `🏛️ **Court Case Search Complete**\n\nQuery: "${args.query}"\nJurisdiction: ${jurisdiction}\nResults: Found ${count} cases\n\n${count > 0 ? 'Key findings available for review.' : 'No cases found matching criteria.'}`;
      },

      'get_case_details': (args, result) => {
        const caseName = result?.case_name || args.case_id || 'case';
        return `📋 **Case Details Retrieved**\n\nCase: ${caseName}\nSource: CourtListener\n\nDetailed case information available for analysis.`;
      },

      'lookup_citation': (args, result) => {
        const citation = args.citation || 'citation';
        const found = result && Object.keys(result).length > 0;
        return `📖 **Citation Lookup Complete**\n\nCitation: ${citation}\nStatus: ${found ? 'Found' : 'Not found'}\n\n${found ? 'Citation details available for review.' : 'Citation not found in database.'}`;
      },

      'sec_search': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        const company = args.company || args.ticker || 'companies';
        return `📊 **SEC Filing Search Complete**\n\nCompany: ${company}\nQuery: "${args.query || 'General search'}"\nResults: Found ${count} filings\n\n${count > 0 ? 'Financial documents ready for analysis.' : 'No filings found matching criteria.'}`;
      },

      'epa_search': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        return `🌿 **EPA Regulation Search Complete**\n\nQuery: "${args.query}"\nResults: Found ${count} regulatory documents\n\n${count > 0 ? 'Environmental compliance data available.' : 'No regulations found matching criteria.'}`;
      },

      'ptab_search': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        return `⚖️ **Patent Trial Search Complete**\n\nQuery: "${args.query}"\nResults: Found ${count} PTAB proceedings\n\n${count > 0 ? 'Patent dispute data available for review.' : 'No proceedings found matching criteria.'}`;
      },

      'state_statute_search': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        const state = args.state || args.jurisdiction || 'multiple states';
        return `📜 **State Statute Search Complete**\n\nState: ${state}\nQuery: "${args.query}"\nResults: Found ${count} statutes\n\n${count > 0 ? 'State law provisions available for analysis.' : 'No statutes found matching criteria.'}`;
      },

      'federal_register_search': (args, result) => {
        const count = Array.isArray(result) ? result.length : 0;
        return `🏛️ **Federal Register Search Complete**\n\nQuery: "${args.query}"\nResults: Found ${count} federal documents\n\n${count > 0 ? 'Federal regulatory information available.' : 'No federal documents found matching criteria.'}`;
      },

      'default': (args, result) => {
        const count = Array.isArray(result) ? result.length : 1;
        return `✅ **Legal Research Tool Complete**\n\nTool: ${args.tool || 'Legal Search'}\nResults: ${count} items found\n\nResearch data available for review.`;
      }
    };
  }

  /**
   * Format tool results for conversation display
   */
  formatToolResult(toolName, args, result) {
    const formatter = this.formatters[toolName] || this.formatters.default;
    return formatter(args, result);
  }

  /**
   * Create concise result summary for metadata
   */
  summarizeResult(result) {
    if (Array.isArray(result)) {
      return {
        type: 'array',
        count: result.length,
        first_item_keys: result.length > 0 ? Object.keys(result[0] || {}).slice(0, 3) : []
      };
    }
    
    if (typeof result === 'object' && result !== null) {
      return {
        type: 'object',
        keys: Object.keys(result).slice(0, 5),
        has_data: Object.keys(result).length > 0
      };
    }
    
    return {
      type: typeof result,
      length: String(result).length
    };
  }

  /**
   * Sanitize args for logging (remove sensitive data)
   */
  sanitizeArgs(args) {
    const { conversation_id, run_id, api_key, token, ...sanitized } = args;
    return sanitized;
  }

  /**
   * Get next sequence number for conversation
   */
  async getNextSequence(conversationId) {
    try {
      const { count } = await this.supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);
      return (count || 0) + 1;
    } catch (error) {
      console.warn('Failed to get sequence number, using timestamp fallback');
      return Date.now();
    }
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus() {
    const healthData = this.healthMonitor.getMetrics();
    const circuitStatus = this.circuitBreaker.getStatus();
    
    return {
      conversation_bridge: {
        enabled: !circuitStatus.isOpen,
        success_rate: `${healthData.successRate}%`,
        total_attempts: healthData.totalAttempts,
        successful_logs: healthData.successfulLogs,
        failed_logs: healthData.failedLogs,
        avg_response_time_ms: Math.round(healthData.avgResponseTime),
        circuit_breaker: {
          status: circuitStatus.isOpen ? 'OPEN' : 'CLOSED',
          failures: circuitStatus.failures,
          consecutive_failures: circuitStatus.consecutiveFailures,
          last_failure: circuitStatus.lastFailure ? new Date(circuitStatus.lastFailure).toISOString() : null
        },
        last_health_check: new Date().toISOString()
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.healthMonitor.stop();
    console.log('✅ ConversationBridge destroyed');
  }
}
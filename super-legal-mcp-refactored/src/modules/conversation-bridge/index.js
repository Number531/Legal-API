/**
 * Conversation Bridge Module - Main Entry Point
 * 
 * This module provides conversation continuity for the legal MCP server
 * by bridging existing PostgreSQL logging with new Supabase conversation features.
 */

// Core components
export { ConversationBridge } from './core/ConversationBridge.js';
export { CircuitBreaker } from './core/CircuitBreaker.js';
export { HealthMonitor } from './core/HealthMonitor.js';

// Supabase integration
export { 
  createSupabaseClient, 
  testSupabaseConnection,
  getSupabaseHealth,
  safeSupabaseOperation,
  getSupabaseConfig
} from './supabase/client.js';

export {
  getAllSchemas,
  validateTableSchema,
  validateAllTables,
  getCreateTableSQL,
  CONVERSATIONS_SCHEMA,
  CONVERSATION_MESSAGES_SCHEMA,
  MESSAGE_CHUNKS_SCHEMA,
  MESSAGE_ATTACHMENTS_SCHEMA,
  DOCUMENT_VERSIONS_SCHEMA
} from './supabase/schemas.js';

// Formatters
export {
  getFormatters,
  formatToolResult,
  getAvailableFormatters,
  hasFormatter
} from './formatters/index.js';

// Conversation management tools
export { conversationToolDefinitions } from './tools/definitions.js';
export { 
  createConversationTools,
  getConversationToolNames
} from './tools/implementations.js';

// Configuration
export {
  CONVERSATION_BRIDGE_DEFAULTS,
  getConfig,
  validateConfig,
  getEnvironmentRequirements
} from './config/defaults.js';

/**
 * Initialize complete conversation bridge system
 */
export async function initializeConversationBridge(postgresClient, options = {}) {
  const { getConfig } = await import('./config/defaults.js');
  const { createSupabaseClient, testSupabaseConnection } = await import('./supabase/client.js');
  const { ConversationBridge } = await import('./core/ConversationBridge.js');
  const { createConversationTools } = await import('./tools/implementations.js');
  
  // Get configuration
  const config = getConfig(options);
  
  // Validate configuration
  const { validateConfig } = await import('./config/defaults.js');
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }
  
  // Initialize Supabase client
  const supabaseClient = createSupabaseClient();
  
  // Test connections
  const results = {
    postgres: { connected: !!postgresClient },
    supabase: { connected: false }
  };
  
  if (supabaseClient) {
    const supabaseTest = await testSupabaseConnection(supabaseClient);
    results.supabase = supabaseTest;
  }
  
  // Initialize conversation bridge (only if PostgreSQL is available)
  let conversationBridge = null;
  if (postgresClient) {
    conversationBridge = new ConversationBridge(postgresClient, supabaseClient, config);
  } else {
    console.warn('⚠️ PostgreSQL client not provided - conversation bridge disabled');
  }
  
  // Initialize conversation tools
  const conversationTools = supabaseClient 
    ? createConversationTools(supabaseClient, conversationBridge)
    : {};
  
  const initResult = {
    conversationBridge,
    conversationTools,
    supabaseClient,
    config,
    health: {
      postgres: results.postgres,
      supabase: results.supabase,
      bridge_enabled: !!conversationBridge,
      tools_enabled: Object.keys(conversationTools).length > 0
    }
  };
  
  // Log initialization results
  if (conversationBridge) {
    console.log('✅ Conversation bridge initialized successfully');
    if (results.supabase.connected) {
      console.log(`✅ Supabase connected (${results.supabase.conversationCount || 0} existing conversations)`);
    } else {
      console.warn('⚠️ Supabase connection failed - conversation features limited');
    }
  } else {
    console.warn('⚠️ Conversation bridge not initialized - PostgreSQL client missing');
  }
  
  console.log(`📊 Conversation tools available: ${Object.keys(conversationTools).length}`);
  
  return initResult;
}

/**
 * Create a minimal conversation bridge for testing
 */
export async function createTestConversationBridge(mockPostgres, mockSupabase, testConfig = {}) {
  const { ConversationBridge } = await import('./core/ConversationBridge.js');
  const { getConfig } = await import('./config/defaults.js');
  
  const config = getConfig({
    ...testConfig,
    logging: { level: 'error', logHealthChecks: false, ...testConfig.logging }
  });
  
  return new ConversationBridge(mockPostgres, mockSupabase, config);
}

/**
 * Get module version and info
 */
export function getModuleInfo() {
  return {
    name: 'conversation-bridge',
    version: '1.0.0',
    description: 'Legal MCP Conversation Bridge Module',
    features: [
      'Dual-write pattern (PostgreSQL + Supabase)',
      'Circuit breaker resilience',
      'Health monitoring',
      'Tool result formatting',
      'Conversation management tools',
      'Zero breaking changes'
    ],
    dependencies: [
      '@supabase/supabase-js',
      'pg (PostgreSQL client)'
    ]
  };
}

/**
 * Check if conversation bridge is properly configured
 */
export function checkConfiguration() {
  const { getSupabaseConfig } = import('./supabase/client.js');
  const supabaseConfig = getSupabaseConfig();
  
  const postgresConfigured = !!(process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL);
  
  return {
    ready: supabaseConfig.full_config && postgresConfigured,
    supabase: supabaseConfig,
    postgres: { configured: postgresConfigured },
    missing_requirements: [
      ...(!supabaseConfig.url ? ['SUPABASE_URL'] : []),
      ...(!supabaseConfig.key ? ['SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN'] : []),
      ...(!postgresConfigured ? ['PG_CONNECTION_STRING or DATABASE_URL'] : [])
    ]
  };
}
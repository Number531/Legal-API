/**
 * Supabase Client Integration
 * 
 * Provides a configured Supabase client for conversation storage
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create and configure Supabase client for conversation bridge
 */
export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!url || !key) {
    console.warn('⚠️ Supabase credentials not configured - conversation features disabled');
    console.warn('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  
  try {
    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    
    console.log('✅ Supabase client initialized for conversation bridge');
    return supabase;
    
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    return null;
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(supabaseClient) {
  if (!supabaseClient) {
    return { connected: false, error: 'No Supabase client available' };
  }
  
  try {
    // Test connection with a simple query
    const { data, error } = await supabaseClient
      .from('conversations')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      return { 
        connected: false, 
        error: error.message,
        details: error.details || 'Connection test failed'
      };
    }
    
    return { 
      connected: true, 
      message: 'Supabase connection successful',
      conversationCount: data?.count || 0
    };
    
  } catch (error) {
    return { 
      connected: false, 
      error: error.message,
      details: 'Exception during connection test'
    };
  }
}

/**
 * Get Supabase client health status
 */
export async function getSupabaseHealth(supabaseClient) {
  if (!supabaseClient) {
    return {
      status: 'unavailable',
      message: 'Supabase client not initialized'
    };
  }
  
  const connectionTest = await testSupabaseConnection(supabaseClient);
  
  if (connectionTest.connected) {
    return {
      status: 'healthy',
      message: 'Supabase connection operational',
      details: connectionTest
    };
  } else {
    return {
      status: 'unhealthy',
      message: 'Supabase connection failed',
      error: connectionTest.error,
      details: connectionTest.details
    };
  }
}

/**
 * Utility function to safely execute Supabase operations with error handling
 */
export async function safeSupabaseOperation(operation, operationName = 'Supabase operation') {
  try {
    const result = await operation();
    return { success: true, data: result.data, error: null };
  } catch (error) {
    console.warn(`⚠️ ${operationName} failed:`, error.message);
    return { 
      success: false, 
      data: null, 
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    };
  }
}

/**
 * Get environment configuration status
 */
export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ? 'configured' : 'missing',
    key: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN) ? 'configured' : 'missing',
    full_config: !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN))
  };
}
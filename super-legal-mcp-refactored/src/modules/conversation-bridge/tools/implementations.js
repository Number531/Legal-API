/**
 * Conversation Management Tool Implementations
 * 
 * Implements MCP tools for managing legal research conversation sessions
 */

import { safeSupabaseOperation } from '../supabase/client.js';

/**
 * Create conversation management tool implementations
 */
export function createConversationTools(supabaseClient, conversationBridge) {
  return {
    /**
     * Start a new legal research session
     */
    start_legal_session: async (args) => {
      if (!supabaseClient) {
        throw new Error('Conversation features not available - Supabase not configured');
      }

      const sessionId = `legal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const conversationData = {
        session_id: sessionId,
        title: args.title,
        user_id: args.user_id || null,
        metadata: {
          legal_context: args.context || 'general_research',
          jurisdiction: args.jurisdiction || null,
          practice_area: args.practice_area || null,
          created_by: 'legal_mcp_server',
          created_at: new Date().toISOString()
        }
      };

      const operation = () => supabaseClient
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      const result = await safeSupabaseOperation(operation, 'start_legal_session');
      
      if (!result.success) {
        throw new Error(`Failed to start legal session: ${result.error.message}`);
      }

      const conversation = result.data;
      
      // Log session start to conversation history
      if (conversationBridge) {
        await conversationBridge.logToConversationSafe(
          'session_start',
          args,
          conversation,
          conversation.id
        );
      }

      return {
        conversation_id: conversation.id,
        session_id: conversation.session_id,
        title: conversation.title,
        legal_context: conversation.metadata?.legal_context,
        jurisdiction: conversation.metadata?.jurisdiction,
        message: `Legal research session "${conversation.title}" started successfully.`,
        instructions: [
          `Use conversation_id: ${conversation.id} with any legal research tools`,
          `Available tools: search_cases, sec_search, epa_search, ptab_search, etc.`,
          `Use recall_findings to review previous research in this session`
        ]
      };
    },

    /**
     * Resume an existing legal research session
     */
    resume_legal_session: async (args) => {
      if (!supabaseClient) {
        throw new Error('Conversation features not available - Supabase not configured');
      }

      const operation = () => supabaseClient
        .from('conversations')
        .select('id, title, created_at, updated_at, metadata')
        .eq('id', args.conversation_id)
        .single();

      const result = await safeSupabaseOperation(operation, 'resume_legal_session');
      
      if (!result.success) {
        throw new Error(`Failed to resume session: ${result.error.message}`);
      }

      if (!result.data) {
        throw new Error(`Conversation not found: ${args.conversation_id}`);
      }

      const conversation = result.data;
      const lastActivity = new Date(conversation.updated_at).toLocaleDateString();
      const createdDate = new Date(conversation.created_at).toLocaleDateString();

      return {
        conversation_id: conversation.id,
        title: conversation.title,
        created: createdDate,
        last_activity: lastActivity,
        legal_context: conversation.metadata?.legal_context || 'general_research',
        jurisdiction: conversation.metadata?.jurisdiction,
        message: `Resuming "${conversation.title}" (last active: ${lastActivity})`,
        next_steps: [
          "Continue research using this conversation_id with legal tools",
          "Use recall_findings to review previous research",
          "Use summarize_session to get a research summary"
        ]
      };
    },

    /**
     * Retrieve previous research findings from a session
     */
    recall_findings: async (args) => {
      if (!supabaseClient) {
        throw new Error('Conversation features not available - Supabase not configured');
      }

      // Get conversation messages with tool results
      let query = supabaseClient
        .from('conversation_messages')
        .select('id, content, created_at, metadata')
        .eq('conversation_id', args.conversation_id)
        .eq('role', 'assistant')
        .not('metadata->tool', 'is', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (args.tool_type) {
        query = query.eq('metadata->tool', args.tool_type);
      }

      if (args.topic) {
        // Use text search on content
        query = query.textSearch('content', args.topic);
      }

      const limit = Math.min(args.limit || 5, 20);
      query = query.limit(limit);

      const operation = () => query;
      const result = await safeSupabaseOperation(operation, 'recall_findings');
      
      if (!result.success) {
        throw new Error(`Failed to recall findings: ${result.error.message}`);
      }

      const messages = result.data || [];
      
      const findings = messages.map(msg => ({
        tool: msg.metadata?.tool,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleString(),
        result_summary: msg.metadata?.result_summary,
        args_summary: msg.metadata?.args_summary
      }));

      return {
        conversation_id: args.conversation_id,
        topic_filter: args.topic || 'all research',
        tool_filter: args.tool_type || 'all tools',
        findings_count: findings.length,
        findings: findings,
        message: findings.length > 0 
          ? `Found ${findings.length} relevant findings${args.topic ? ` related to "${args.topic}"` : ''}`
          : `No findings found${args.topic ? ` for topic "${args.topic}"` : ''}`
      };
    },

    /**
     * Get comprehensive session summary
     */
    summarize_session: async (args) => {
      if (!supabaseClient) {
        throw new Error('Conversation features not available - Supabase not configured');
      }

      // Get conversation info and all messages
      const conversationOp = () => supabaseClient
        .from('conversations')
        .select('id, title, created_at, updated_at, metadata')
        .eq('id', args.conversation_id)
        .single();

      const messagesOp = () => supabaseClient
        .from('conversation_messages')
        .select('id, role, content, created_at, metadata')
        .eq('conversation_id', args.conversation_id)
        .order('created_at', { ascending: true });

      const [conversationResult, messagesResult] = await Promise.all([
        safeSupabaseOperation(conversationOp, 'get_conversation'),
        safeSupabaseOperation(messagesOp, 'get_messages')
      ]);

      if (!conversationResult.success) {
        throw new Error(`Failed to get conversation: ${conversationResult.error.message}`);
      }

      if (!messagesResult.success) {
        throw new Error(`Failed to get messages: ${messagesResult.error.message}`);
      }

      const conversation = conversationResult.data;
      const messages = messagesResult.data || [];
      
      // Analyze messages
      const toolMessages = messages.filter(msg => msg.role === 'assistant' && msg.metadata?.tool);
      const userMessages = messages.filter(msg => msg.role === 'user');
      
      // Group by tool type
      const toolSummary = toolMessages.reduce((acc, msg) => {
        const tool = msg.metadata.tool;
        if (!acc[tool]) {
          acc[tool] = {
            count: 0,
            latest: null,
            total_results: 0
          };
        }
        acc[tool].count++;
        acc[tool].latest = msg.created_at;
        acc[tool].total_results += msg.metadata?.result_summary?.count || 0;
        return acc;
      }, {});

      const summary = Object.entries(toolSummary).map(([tool, stats]) => ({
        tool,
        search_count: stats.count,
        last_search: new Date(stats.latest).toLocaleString(),
        total_results: stats.total_results
      }));

      const sessionMetrics = args.include_metrics ? {
        duration_hours: ((new Date(conversation.updated_at) - new Date(conversation.created_at)) / (1000 * 60 * 60)).toFixed(1),
        total_messages: messages.length,
        user_queries: userMessages.length,
        tool_executions: toolMessages.length,
        unique_tools_used: Object.keys(toolSummary).length,
        avg_results_per_search: toolMessages.length > 0 
          ? Math.round(toolMessages.reduce((sum, msg) => sum + (msg.metadata?.result_summary?.count || 0), 0) / toolMessages.length)
          : 0
      } : null;

      return {
        conversation_id: args.conversation_id,
        title: conversation.title,
        legal_context: conversation.metadata?.legal_context,
        jurisdiction: conversation.metadata?.jurisdiction,
        created: new Date(conversation.created_at).toLocaleString(),
        last_activity: new Date(conversation.updated_at).toLocaleString(),
        tool_summary: summary,
        metrics: sessionMetrics,
        message: `Session summary: ${toolMessages.length} searches across ${Object.keys(toolSummary).length} legal research tools`
      };
    },

    /**
     * List available conversation sessions
     */
    list_conversations: async (args) => {
      if (!supabaseClient) {
        throw new Error('Conversation features not available - Supabase not configured');
      }

      let query = supabaseClient
        .from('conversations')
        .select('id, title, created_at, updated_at, metadata')
        .order('updated_at', { ascending: false });

      if (args.user_id) {
        query = query.eq('user_id', args.user_id);
      }

      if (args.context_filter) {
        query = query.eq('metadata->legal_context', args.context_filter);
      }

      if (args.since_date) {
        query = query.gte('created_at', args.since_date);
      }

      const limit = Math.min(args.limit || 10, 100);
      query = query.limit(limit);

      const operation = () => query;
      const result = await safeSupabaseOperation(operation, 'list_conversations');
      
      if (!result.success) {
        throw new Error(`Failed to list conversations: ${result.error.message}`);
      }

      const conversations = (result.data || []).map(conv => ({
        conversation_id: conv.id,
        title: conv.title,
        legal_context: conv.metadata?.legal_context || 'general',
        jurisdiction: conv.metadata?.jurisdiction,
        created: new Date(conv.created_at).toLocaleDateString(),
        last_active: new Date(conv.updated_at).toLocaleDateString(),
        days_since_activity: Math.floor((Date.now() - new Date(conv.updated_at)) / (1000 * 60 * 60 * 24))
      }));

      return {
        conversations,
        count: conversations.length,
        filters_applied: {
          user_id: args.user_id || null,
          context: args.context_filter || null,
          since_date: args.since_date || null
        }
      };
    },

    /**
     * Get conversation bridge health status
     */
    get_conversation_health: async (args) => {
      const health = conversationBridge ? conversationBridge.getHealthStatus() : {
        conversation_bridge: {
          enabled: false,
          message: 'Conversation bridge not initialized'
        }
      };

      if (args.detailed && supabaseClient) {
        // Add database connectivity test
        const dbTest = await safeSupabaseOperation(
          () => supabaseClient.from('conversations').select('count', { count: 'exact', head: true }).limit(1),
          'database_connectivity_test'
        );

        health.database = {
          connected: dbTest.success,
          error: dbTest.success ? null : dbTest.error.message,
          conversation_count: dbTest.success ? dbTest.data?.count || 0 : null
        };
      }

      return health;
    }
  };
}

/**
 * Get list of available conversation tool names
 */
export function getConversationToolNames() {
  return [
    'start_legal_session',
    'resume_legal_session', 
    'recall_findings',
    'summarize_session',
    'list_conversations',
    'get_conversation_health'
  ];
}
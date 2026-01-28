/**
 * Enhanced Legal MCP Server
 * Main server class that orchestrates all API clients and handles MCP requests
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Import configurations and utilities
import { rateLimiterConfigs } from '../config/apiConfig.js';
import { startCacheCleanup } from '../utils/cache.js';

// Import database connections
import { getPool } from '../db/postgres.js';

// Import conversation bridge module
import { 
  initializeConversationBridge,
  conversationToolDefinitions 
} from '../modules/conversation-bridge/index.js';

// Import API clients
import { FinancialDisclosureClient } from '../api-clients/FinancialDisclosureClient.js';
import { FederalRegisterHybridClient } from '../api-clients/FederalRegisterHybridClient.js';
import { UsptoWebSearchClient } from '../api-clients/UsptoWebSearchClient.js';
import { USPTOHybridClient } from '../api-clients/USPTOHybridClient.js';
import { GovInfoHybridClient } from '../api-clients/GovInfoHybridClient.js';
import { ExaClient } from '../api-clients/ExaClient.js';
import { ComprehensiveAnalysisClient } from '../api-clients/ComprehensiveAnalysisClient.js';
import { PTABClient } from '../api-clients/PTABClient.js';
import { PTABWebSearchClient } from '../api-clients/PTABWebSearchClient.js';
import { CourtListenerWebSearchClient } from '../api-clients/CourtListenerWebSearchClient.js';
import { FTCWebSearchClient } from '../api-clients/FTCWebSearchClient.js';
import { EPAComplianceClient } from '../api-clients/EPAComplianceClient.js';
import { EPAWebSearchClient } from '../api-clients/EPAWebSearchClient.js';
import { SECWebSearchClient } from '../api-clients/SECWebSearchClient.js';
import { FDAWebSearchClient } from '../api-clients/FDAWebSearchClient.js';

// Import Hybrid Clients (Phase 1 & 2)
import { CourtListenerHybridClient } from '../api-clients/CourtListenerHybridClient.js';
import { SECHybridClient } from '../api-clients/SECHybridClient.js';
import { EPAHybridClient } from '../api-clients/EPAHybridClient.js';
import { FDAHybridClient } from '../api-clients/FDAHybridClient.js';

// Import Native API Clients (for direct access when needed)
import { CourtListenerClient } from '../api-clients/courtlistenerClient.js';
import { SecEdgarClient } from '../api-clients/SecEdgarClient.js';
import { CPSCWebSearchClient } from '../api-clients/CPSCWebSearchClient.js';
import { NHTSAWebSearchClient } from '../api-clients/NHTSAWebSearchClient.js';
import { FilingDraftClient } from '../api-clients/FilingDraftClient.js';
import { StateCourtRulesWebSearchClient } from '../api-clients/StateCourtRulesWebSearchClient.js';
import { StateStatuteWebSearchClient } from '../api-clients/StateStatuteWebSearchClient.js';

// Import tool definitions and implementations
import { allTools } from '../tools/toolDefinitions.js';
import { createToolImplementations } from '../tools/toolImplementations.js';

// Import ClaudeOrchestrator for Gemini-powered filtering (Phase 3)
import { ClaudeOrchestrator } from './ClaudeOrchestrator.js';

export class EnhancedLegalMcpServer {
  constructor() {
    this.apiToken = process.env.COURTLISTENER_API_TOKEN || "";
    this.rateLimiters = new Map();
    this.toolImplementations = null;
    this.conversationBridge = null;
    this.conversationTools = {};
    this.orchestrator = null;  // ClaudeOrchestrator for Gemini filtering
    
    if (!this.apiToken) {
      console.error("Warning: COURTLISTENER_API_TOKEN environment variable not set");
      console.error("Some features may be limited without authentication");
    }

    // Initialize MCP server
    this.server = new Server(
      {
        name: "super-legal-mcp",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize all components (some are async)
    this.initializeRateLimiters();
    this.initializeClients();
    // Note: conversation bridge will be initialized in the run() method
    this.setupToolHandlers();
    startCacheCleanup(); // Call the imported function directly
  }

  /**
   * Initialize rate limiters for all APIs
   */
  initializeRateLimiters() {
    // Create rate limiter instances from configurations
    for (const [apiType, config] of Object.entries(rateLimiterConfigs)) {
      this.rateLimiters.set(apiType, {
        ...config,
        requests: []
      });
    }
  }

  /**
   * Initialize all API clients with their respective rate limiters
   */
  initializeClients() {
    const clients = {
      // ==========================================
      // PHASE 1: HYBRID CLIENTS (Native + Websearch)
      // ==========================================

      // CourtListener Hybrid (smart routing between native API and Exa)
      courtListener: new CourtListenerHybridClient(
        this.rateLimiters.get('courtlistener'),
        process.env.EXA_API_KEY
      ),
      courtListenerWeb: new CourtListenerHybridClient(  // Alias for backward compatibility
        this.rateLimiters.get('courtlistener'),
        process.env.EXA_API_KEY
      ),

      // SEC Hybrid (native EDGAR API + Exa fallback)
      secWeb: new SECHybridClient(
        this.rateLimiters.get('sec'),
        process.env.EXA_API_KEY
      ),

      // ==========================================
      // PHASE 2: EPA HYBRID CLIENT (Websearch-first with circuit breaker)
      // ==========================================

      // EPA Hybrid (websearch-first due to ECHO API unreliability)
      epa: new EPAHybridClient(
        this.rateLimiters.get('epa_echo'),
        process.env.EXA_API_KEY
      ),
      epaWeb: new EPAHybridClient(  // Alias for backward compatibility
        this.rateLimiters.get('epa_echo'),
        process.env.EXA_API_KEY
      ),

      // ==========================================
      // NATIVE API CLIENTS (Direct access)
      // ==========================================

      // Native CourtListener API (for direct access if needed)
      courtListenerNative: new CourtListenerClient(
        this.rateLimiters.get('courtlistener')
      ),

      // Native SEC EDGAR API (for direct access if needed)
      secNative: new SecEdgarClient(
        this.rateLimiters.get('sec')
      ),

      // Native EPA ECHO API (for direct access if needed, though unreliable)
      epaNative: new EPAComplianceClient(
        this.rateLimiters.get('epa_echo')
      ),

      // ==========================================
      // OTHER API CLIENTS (Unchanged)
      // ==========================================

      financialDisclosure: new FinancialDisclosureClient(this.rateLimiters.get('courtlistener')),

      // Federal Register Hybrid (Phase 4.1) - Smart routing between Native API and Exa
      federalRegisterWeb: new FederalRegisterHybridClient(
        this.rateLimiters.get('federal_register'),
        process.env.EXA_API_KEY
      ),

      // USPTO Hybrid (Phase 3) - Smart routing between PatentSearch API and Exa
      uspto: new USPTOHybridClient(
        this.rateLimiters.get('uspto_patents'),
        process.env.EXA_API_KEY
      ),
      usptoWeb: new USPTOHybridClient(  // Alias for backward compatibility
        this.rateLimiters.get('uspto_patents'),
        process.env.EXA_API_KEY
      ),

      // GovInfo Hybrid (Phase 4.1) - Smart routing between GovInfo API and Exa
      govInfo: new GovInfoHybridClient(
        this.rateLimiters.get('govinfo'),
        process.env.EXA_API_KEY
      ),
      exa: new ExaClient(this.rateLimiters.get('exa')),
      ptab: new PTABClient(this.rateLimiters.get('ptab')),
      ptabWebSearch: new PTABWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY), // Uses Exa for web search
      ftcWeb: new FTCWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY),

      // FDA Hybrid (Phase 4.4) - Smart routing between OpenFDA API and Exa
      fdaHybrid: new FDAHybridClient(
        this.rateLimiters.get('fda_openfda'),
        process.env.EXA_API_KEY
      ),
      fdaWeb: new FDAWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY), // Keep for specialized tools

      cpsc: new CPSCWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY),
      nhtsaWeb: new NHTSAWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY),
      filingDraft: new FilingDraftClient(),
      stateCourtRules: new StateCourtRulesWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY),
      stateStatute: new StateStatuteWebSearchClient(this.rateLimiters.get('exa'), process.env.EXA_API_KEY)
    };

    // Create comprehensive analysis client with access to other clients
    clients.comprehensiveAnalysis = new ComprehensiveAnalysisClient({
      courtListener: clients.courtListenerWeb, // Use web-based CourtListener client
      secEdgar: clients.secWeb, // Use web-based SEC client
      federalRegister: clients.federalRegisterWeb, // Use web-based Federal Register client
      uspto: clients.uspto
    });

    // Store clients for later access
    this.clients = clients;

    // Initialize ClaudeOrchestrator for Gemini-powered filtering (Phase 3)
    if (process.env.ENABLE_GEMINI_FILTERING === 'true') {
      try {
        this.orchestrator = new ClaudeOrchestrator({
          maxIterations: 3,
          enableGeminiFiltering: true
        });

        // Register WebSearch clients with orchestrator for raw data access
        // Map domain names to clients that have getRawResults()
        const orchestratorClients = {
          secWeb: clients.secWeb,
          fdaWeb: clients.fdaWeb,
          fdaHybrid: clients.fdaHybrid,
          epaWeb: clients.epaWeb,
          epa: clients.epa,
          courtListenerWeb: clients.courtListenerWeb,
          courtListener: clients.courtListener,
          govInfo: clients.govInfo,
          federalRegisterWeb: clients.federalRegisterWeb,
          cpsc: clients.cpsc,
          nhtsaWeb: clients.nhtsaWeb,
          ftcWeb: clients.ftcWeb,
          ptabWebSearch: clients.ptabWebSearch,
          uspto: clients.uspto,
          usptoWeb: clients.usptoWeb,
          stateCourtRules: clients.stateCourtRules,
          stateStatute: clients.stateStatute
        };

        this.orchestrator.registerClients(orchestratorClients);
        console.error('🤖 ClaudeOrchestrator initialized with Gemini filtering enabled');
        console.error(`   ✅ Registered ${Object.keys(orchestratorClients).length} API clients`);
      } catch (error) {
        console.error('⚠️ Failed to initialize ClaudeOrchestrator:', error.message);
        this.orchestrator = null;
      }
    }

    // Create tool implementations mapping (will be updated with conversation bridge later)
    this.toolImplementations = createToolImplementations(clients, null, this.orchestrator);
  }

  /**
   * Get initialized clients
   */
  getClients() {
    return this.clients;
  }

  /**
   * Initialize conversation bridge for conversation continuity
   */
  async initializeConversationBridge() {
    try {
      console.error("🔗 Initializing conversation bridge...");
      
      // Get PostgreSQL client
      const postgresClient = getPool();
      
      // Initialize conversation bridge system
      const bridgeResult = await initializeConversationBridge(postgresClient, {
        logging: {
          level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
        }
      });
      
      // Store bridge components
      this.conversationBridge = bridgeResult.conversationBridge;
      this.conversationTools = bridgeResult.conversationTools;
      
      // Recreate tool implementations with conversation bridge and orchestrator
      if (this.conversationBridge) {
        const clients = this.getClients(); // Need to get clients for recreation
        this.toolImplementations = createToolImplementations(clients, this.conversationBridge, this.orchestrator);
        console.error("✅ Updated all tools with conversation bridge integration");
        if (this.orchestrator) {
          console.error("✅ Orchestrator routing enabled for complex queries");
        }
      }
      
      // Add conversation tools to tool implementations
      if (Object.keys(this.conversationTools).length > 0) {
        this.toolImplementations = {
          ...this.toolImplementations,
          ...this.conversationTools
        };
        console.error(`✅ Added ${Object.keys(this.conversationTools).length} conversation management tools`);
      }
      
      // Log health status
      if (bridgeResult.health) {
        const health = bridgeResult.health;
        console.error("📊 Conversation Bridge Health:");
        console.error(`   PostgreSQL: ${health.postgres.connected ? '✅ Connected' : '❌ Not connected'}`);
        console.error(`   Supabase: ${health.supabase.connected ? '✅ Connected' : '❌ Not connected'}`);
        console.error(`   Bridge: ${health.bridge_enabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.error(`   Tools: ${health.tools_enabled ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (health.supabase.connected && health.supabase.conversationCount !== undefined) {
          console.error(`   Existing conversations: ${health.supabase.conversationCount}`);
        }
      }
      
    } catch (error) {
      console.error("⚠️ Failed to initialize conversation bridge:", error.message);
      console.error("   Conversation features will be disabled");
      // Don't throw - server should continue without conversation features
    }
  }

  /**
   * Setup MCP tool handlers
   */
  setupToolHandlers() {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Combine standard tools with conversation tools
      let tools = [...allTools];
      
      // Add conversation tool definitions if conversation bridge is available
      if (Object.keys(this.conversationTools).length > 0) {
        const conversationToolDefs = Object.entries(conversationToolDefinitions).map(([name, def]) => ({
          name,
          description: def.description,
          inputSchema: def.inputSchema
        }));
        tools = [...tools, ...conversationToolDefs];
      }
      
      return { tools };
    });

    // Handle call tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Check if tool exists
        if (!this.toolImplementations[name]) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        // Execute the tool
        const result = await this.toolImplementations[name](args);
        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // If it's already an McpError, re-throw it
        if (error instanceof McpError) {
          throw error;
        }
        
        // Otherwise, wrap it in an McpError
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run() {
    // Initialize conversation bridge before starting server
    await this.initializeConversationBridge();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Enhanced Legal MCP server running on stdio");
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      // Stop cache cleanup
      // Note: The cache cleanup is handled by the imported function
      
      // Close any open connections
      // Note: Individual clients don't maintain persistent connections
      
      console.error("Enhanced Legal MCP server shutdown complete");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }
}

// Handle process signals for graceful shutdown
let serverInstance = null;

process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  if (serverInstance) {
    await serverInstance.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  if (serverInstance) {
    await serverInstance.shutdown();
  }
  process.exit(0);
});

// Export already done via export class declaration above

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  serverInstance = new EnhancedLegalMcpServer();
  serverInstance.run().catch(console.error);
}
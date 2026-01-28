# Super-Legal-MCP-Refactored Architecture Audit
**Date**: December 5, 2025
**System**: super-legal-mcp-refactored

---

## Executive Summary

This audit covers the complete agent architecture of the super-legal-mcp-refactored system, including:
- **Streaming Architecture**: How Claude responses are streamed with tool handling
- **Tool Call Lifecycle**: From definition → invocation → execution → result
- **API Client Hierarchy**: BaseWebSearchClient → WebSearchClients → HybridClients
- **ClaudeOrchestrator**: Gemini-powered intelligent research coordination

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌────────────────────────────────────────────────────────────────────┐
│                    Claude Code / Client Application                 │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ HTTP GET/POST
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                     claude-server-v2.js                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ClaudeLegalResearch (Main Orchestrator)                      │  │
│  │  - streamLegalResearch() entry point                          │  │
│  │  - streamClaudeCall() API invocation                          │  │
│  │  - processStreamWithToolHandling() event processing           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ MCP Protocol
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                   EnhancedLegalMcpServer.js                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Tool Definitions │  │ Tool Impls      │  │ Conversation    │    │
│  │ (70+ tools)     │  │ (wrappers)      │  │ Bridge          │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ API Clients   │       │ Hybrid Clients │       │ Claude        │
│ (WebSearch)   │       │ (Native+Web)  │       │ Orchestrator  │
│               │       │               │       │               │
│ - SEC         │       │ - SECHybrid   │       │ - Gemini      │
│ - EPA         │       │ - EPAHybrid   │       │   Filtering   │
│ - FDA         │       │ - FDAHybrid   │       │ - Multi-turn  │
│ - USPTO       │       │ - etc.        │       │   Synthesis   │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Exa AI API        │
                    │   (Neural Search)   │
                    └─────────────────────┘
```

---

## 2. STREAMING ARCHITECTURE (DETAILED)

### 2.1 Entry Point: `/api/claude/stream`

**File**: `super-legal-mcp-refactored/src/server/claude-server-v2.js`

```javascript
// Lines 2603-2687: GET endpoint for streaming
app.get('/api/claude/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 15-second heartbeat to keep connection alive
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);

  // Stream research
  await research.streamLegalResearch(query, {
    onThinking: (data) => res.write(`data: ${JSON.stringify({type:'thinking',...data})}\n\n`),
    onToolCall: (data) => res.write(`data: ${JSON.stringify({type:'tool',...data})}\n\n`),
    onContent: (text) => res.write(`data: ${JSON.stringify({type:'content',text})}\n\n`),
    sessionId
  });
});
```

### 2.2 Stream Processing Pipeline

**Method Chain**:
```
streamLegalResearch()     → Main entry point (Lines 977-1051)
  ↓
streamClaudeCall()        → Sends to Anthropic API with stream: true (Lines 1053-1102)
  ↓
processStreamWithToolHandling()  → Parses SSE events, handles tools (Lines 1104-1316)
  ↓
handleStreamEventWithTools()     → Dispatches individual events (Lines 1318-1479)
```

### 2.3 Buffer Management and Event Parsing

**Key Code (Lines 1117-1150)**:
```javascript
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Buffer management for chunked responses
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';  // Keep incomplete line for next iteration

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;

      try {
        const event = JSON.parse(line.slice(6));  // Remove 'data: ' prefix
        const result = await this.handleStreamEventWithTools(event, {
          onThinking,
          onToolCall,
          onContent,
          onProgress,
          toolCalls,
          activeTasks,
          streamingSession,
          assistantMessage: (text) => { assistantMessage += text; },
          thinkingBlocks
        });

        if (result?.needsToolExecution) {
          needsToolExecution = true;
        }
      } catch (parseError) {
        console.warn('Stream parse error:', parseError);
      }
    }
  }
```

### 2.4 Event Types and Handler Actions

**handleStreamEventWithTools() (Lines 1318-1479)**:

| Event Type | Delta Subtype | Handler Action |
|------------|---------------|----------------|
| `message_start` | - | `onProgress({ type: 'research_start', model, timestamp })` |
| `content_block_start` | type='thinking' | Initialize thinking block with `signature: null` |
| `content_block_start` | type='tool_use' | Create toolCall object, push to toolCalls[], return `needsToolExecution: true` |
| `content_block_delta` | thinking_delta | Accumulate in `thinkingBlocks[last].thinking` |
| `content_block_delta` | signature_delta | Set `thinkingBlocks[last].signature` |
| `content_block_delta` | text_delta | Call `assistantMessage(text)` and `onContent(text)` |
| `content_block_delta` | input_json_delta | Accumulate `partialJson`, attempt JSON parse on each delta |
| `content_block_stop` | - | Mark `toolCall.complete = true`, `toolCall.ready = true` (queued, NOT executed) |
| `message_stop` | - | `onProgress({ type: 'research_complete' })` |

### 2.5 Tool Input JSON Streaming (Lines 1385-1412)

Claude streams tool parameters incrementally via `input_json_delta`:

```javascript
} else if (event.delta.type === 'input_json_delta') {
  const blockIndex = event.index || event.content_block_index;
  if (blockIndex !== undefined) {
    let toolIndex = -1;
    for (let i = 0; i <= blockIndex; i++) {
      if (i > 0) toolIndex++;
    }

    if (toolIndex >= 0 && toolIndex < toolCalls.length) {
      const toolCall = toolCalls[toolIndex];
      if (!toolCall.partialJson) toolCall.partialJson = '';
      toolCall.partialJson += event.delta.partial_json || '';

      try {
        toolCall.input = JSON.parse(toolCall.partialJson);

        // Forward the parsed arguments to frontend
        onToolCall?.({
          type: 'tool_update',
          tool: { id: toolCall.id, name: toolCall.name, input: toolCall.input },
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Not complete yet - wait for more deltas
      }
    }
  }
}
```

### 2.6 Tool Execution Timing (CRITICAL)

**Per Anthropic Best Practice**: Tools execute AFTER stream completes, not during `content_block_stop`.

**Grace Period Logic (Lines 1158-1165)**:
```javascript
// First-message detection: use longer grace period for initial response (cold-start delay)
const isFirstMessage = !this._messageCount;
const gracePeriod = isFirstMessage ? 2000 : 500;  // 2s for first, 500ms for subsequent
this._messageCount = (this._messageCount || 0) + 1;

console.log(`⏱️ Grace period: ${gracePeriod}ms (${isFirstMessage ? 'first message' : 'subsequent message'})`);
await new Promise(resolve => setTimeout(resolve, gracePeriod));
```

**Tool Readiness Classification (Lines 1167-1172)**:
```javascript
// Separate tools by readiness
const readyTools = toolCalls.filter(t => t.ready === true);
const incompleteTools = toolCalls.filter(t => t.ready !== true);

console.log(`   ✅ Ready tools (received content_block_stop): ${readyTools.length}`);
console.log(`   ⚠️ Incomplete tools (no content_block_stop): ${incompleteTools.length}`);
```

### 2.7 Parallel Tool Execution (Lines 1174-1195)

```javascript
// Execute all ready tools in parallel
if (readyTools.length > 0) {
  console.log(`🚀 Executing ${readyTools.length} ready tools in parallel...`);

  await Promise.all(readyTools.map(async (toolCall) => {
    try {
      if (!activeTasks.has(toolCall.id)) {
        // Notify frontend that execution is starting
        onToolCall?.({
          type: 'tool_execute',
          tool: { id: toolCall.id, name: toolCall.name, input: toolCall.input },
          timestamp: new Date().toISOString()
        });

        console.log(`🔧 Executing: ${toolCall.name}`);
        await this.executeTool(toolCall, activeTasks, streamingSession);
      }
    } catch (e) {
      console.warn(`Failed to execute tool ${toolCall.name}:`, e?.message || e);
    }
  }));
}
```

### 2.8 Fallback Handler for Incomplete Tools (Lines 1197-1266)

**Safe Empty Tools Set** (tools that can execute with no/empty parameters):
```javascript
const safeEmptyTools = new Set([
  'search_ptab_proceedings',
  'search_federal_register', 'search_federal_register_notices',
  'search_us_code', 'list_usc_titles',
  'search_ftc_enforcement_cases', 'search_ftc_competition_matters',
  'search_cpsc_recalls', 'search_cpsc_enforcement',
  'search_fda_drug_adverse_events', 'search_fda_device_events',
]);
```

**Required Parameter Gates**:
```javascript
if (toolCall.name === 'get_ptab_decisions') {
  if (!hasInput || !input.proceeding_number) {
    console.log('⏭️ Skipping fallback execution for get_ptab_decisions: proceeding_number missing');
    continue;
  }
}
```

### 2.9 Thinking Block Preservation

Extended thinking blocks are captured and preserved for multi-turn conversations:

```javascript
// Lines 1331-1338: Initialize thinking block
if (event.content_block.type === 'thinking') {
  thinkingBlocks.push({
    type: 'thinking',
    thinking: '',
    signature: null  // Will be filled by signature_delta event
  });
}

// Lines 1376-1380: Capture signature
if (event.delta.type === 'signature_delta') {
  thinkingBlocks[thinkingBlocks.length - 1].signature = event.delta.signature;
}

// Lines 1276-1279: Preserve in conversation history
if (thinkingBlocks.length > 0) {
  assistantContent.push(...thinkingBlocks);  // Pass unmodified including signatures
}
```

### 2.10 Recursive Tool Loop (Lines 1299-1306)

After collecting tool results, sends back to Claude for synthesis:

```javascript
console.log('🔄 Sending tool results back to Claude for final response...');

const result = await this.streamClaudeCall(conversationHistory, tools, {
  ...options,
  phase: 'follow-up'  // Marks this as a follow-up call
});

return result;
```

---

## 3. TOOL CALL LIFECYCLE (EXPANDED)

### 3.1 Phase 1: Tool Discovery

**File**: `src/tools/toolDefinitions.js`

Tools are defined with:
- `name`: Unique identifier (e.g., `search_sec_filings`)
- `description`: Usage hints including SIGNALS keywords
- `inputSchema`: JSON Schema for parameters

**Example Tool Definition**:
```javascript
{
  name: "search_sec_filings",
  description: "Search SEC corporate filings... SIGNALS: 'SEC filing', '10-K'...",
  inputSchema: {
    type: "object",
    properties: {
      company_identifier: { type: "string", description: "Company name, ticker, or CIK" },
      filing_type: { type: "string", enum: ["10-K", "10-Q", "8-K", ...] },
      limit: { type: "number", default: 5, maximum: 5 }
    },
    required: ["company_identifier"]
  }
}
```

### 3.2 Phase 2: Tool Invocation

**File**: `src/server/EnhancedLegalMcpServer.js` (Lines 364-394)

```javascript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Lookup tool implementation
  if (!this.toolImplementations[name]) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  // Execute tool
  const result = await this.toolImplementations[name](args);
  return result;
});
```

### 3.3 Phase 3: Parameter Processing (DETAILED)

**File**: `src/tools/toolImplementations.js`

#### 3.3.1 Parameter Capping Configuration (Lines 117-136)

```javascript
const PARAMETER_CAPS = {
  default: {
    limit: 5,
    include_snippet: false,
    include_text: false,
    include_full_text: false
  },

  // Tools exempt from capping (need exact data)
  noCap: [
    'get_case_details',
    'get_judge_details',
    'get_financial_disclosure_details',
    'get_usc_section',
    'nhtsa_decode_vin',
    'get_audio_details',
    'get_court_info'
  ]
};
```

#### 3.3.2 applyParameterCaps() Implementation (Lines 139-165)

```javascript
function applyParameterCaps(toolName, args) {
  // Skip capping for detail/lookup tools
  if (PARAMETER_CAPS.noCap.includes(toolName)) {
    return args;
  }

  const cappedArgs = { ...args };

  // Smart limits based on content type
  if (cappedArgs.include_full_text === true) {
    // Full text = stricter limits (2 results max)
    cappedArgs.limit = Math.min(cappedArgs.limit || 2, 2);
  } else {
    // Regular searches = standard limit (5 results max)
    cappedArgs.limit = Math.min(cappedArgs.limit || 5, 5);
  }

  // Force snippet/text flags off to reduce token usage
  cappedArgs.include_snippet = false;
  cappedArgs.include_text = false;
  cappedArgs.include_full_text = cappedArgs.include_full_text || false;

  return cappedArgs;
}
```

#### 3.3.3 Orchestrator Routing Decision (Lines 17-43)

**Gemini filtering is enabled when** `ENABLE_GEMINI_FILTERING=true`:

```javascript
function shouldUseOrchestrator(toolName, args) {
  // Feature flag check
  if (process.env.ENABLE_GEMINI_FILTERING !== 'true') {
    return false;
  }

  // Skip for detail/lookup tools needing specific IDs
  const detailTools = [
    'get_case_details', 'get_judge_details', 'get_financial_disclosure_details',
    'get_usc_section', 'nhtsa_decode_vin', 'get_audio_details', 'get_court_info',
    'get_sec_company_facts', 'get_epa_facility_compliance_report'
  ];

  if (detailTools.includes(toolName)) return false;

  // Complex query indicators trigger orchestrator
  const query = args.query || args.search_text || args.search_term || '';
  const isComplexQuery = query.length > 50 ||
    /\b(and|or|between|related|regarding|concerning|about)\b/i.test(query) ||
    /\d{4}/.test(query);  // Contains year

  return isComplexQuery;
}
```

#### 3.3.4 Tool-to-Domain Mapping for Orchestrator (Lines 48-88)

```javascript
const TOOL_DOMAIN_MAPPING = {
  // SEC/Securities
  'search_sec_filings': 'securities',
  'get_sec_company_facts': 'securities',
  'search_sec_company_tickers': 'securities',

  // FDA/Pharmaceutical
  'search_fda_drug_adverse_events': 'pharmaceutical_safety',
  'search_fda_device_events': 'pharmaceutical_safety',
  'search_fda_drug_labels': 'pharmaceutical_safety',
  'search_fda_recalls': 'pharmaceutical_safety',

  // EPA/Environmental
  'search_epa_facilities': 'environmental',
  'search_epa_violations': 'environmental',

  // CourtListener/Case Law
  'search_cases': 'case_law',
  'search_opinions': 'case_law',
  'lookup_citation': 'case_law',

  // GovInfo/Legislation
  'search_us_code': 'legislation',
  'search_federal_register': 'federal_register',

  // CPSC/NHTSA/Product Safety
  'search_cpsc_recalls': 'product_safety',
  'nhtsa_recalls_by_make_model_year': 'product_safety',

  // FTC/Antitrust
  'search_ftc_enforcement_cases': 'antitrust',
  'search_ftc_competition_matters': 'antitrust',

  // USPTO/Patent
  'search_patents': 'patent',
  'search_ptab_proceedings': 'patent_appeals',

  // State
  'search_court_rules': 'state_courts',
  'search_state_statute': 'state_statutes'
};
```

#### 3.3.5 wrapWithConversation() Full Implementation (Lines 169-227)

```javascript
const wrapWithConversation = (toolName, toolFunction) => {
  return async (args) => {
    // 1. Apply parameter caps BEFORE calling tool
    const cappedArgs = applyParameterCaps(toolName, args);

    let result;

    // 2. Check if orchestrator routing is appropriate
    if (orchestrator && shouldUseOrchestrator(toolName, cappedArgs)) {
      try {
        const domain = TOOL_DOMAIN_MAPPING[toolName];
        const query = cappedArgs.query || cappedArgs.search_text || cappedArgs.search_term || '';

        console.log(`🤖 [Orchestrator] Routing ${toolName} through Gemini filtering (domain: ${domain})`);

        // Use orchestrator for filtered extraction
        const orchestratorResult = await orchestrator.research(query, {
          sessionId: cappedArgs.session_id,
          preferredModules: domain ? [domain] : undefined
        });

        // Format orchestrator result to match expected tool output
        result = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              source: 'orchestrator',
              domain: domain,
              answer: orchestratorResult.answer,
              findings: orchestratorResult.findings || [],
              sessionId: orchestratorResult.sessionId,
              _gemini_filtered: true,
              _token_savings: 'estimated 70-80%'
            }, null, 2)
          }]
        };
      } catch (error) {
        console.warn(`⚠️ Orchestrator routing failed, falling back to direct call: ${error.message}`);
        // Fall back to direct tool call
        result = await toolFunction(cappedArgs);
      }
    } else {
      // 3. Execute tool directly with capped parameters
      result = await toolFunction(cappedArgs);
    }

    // 4. Log to conversation bridge if available
    if (conversationBridge && cappedArgs.conversation_id) {
      try {
        await conversationBridge.logToolCall(toolName, cappedArgs, result, cappedArgs.conversation_id);
      } catch (error) {
        console.warn(`Failed to log ${toolName} to conversation:`, error.message);
      }
    }

    return result;
  };
};
```

### 3.4 Phase 4: Client Method Execution

**Example: SEC Filings Search**

```javascript
// toolImplementations.js Line 277
"search_sec_filings": wrapWithConversation("search_sec_filings",
  (args) => secWeb.searchSECFilingsWeb(args)
)
```

**SECWebSearchClient.searchSECFilingsWeb()**:
```javascript
async searchSECFilingsWeb(args) {
  // 1. Build Exa query
  let q = 'site:sec.gov ' + company_identifier + ' ' + filing_type;

  // 2. Execute Exa search (with ContentStrategy selection)
  const results = await this.executeExaSearch(q, limit, {
    dataType: 'sec_filing',
    domain: 'securities'
  });

  // 3. Map results with metadata extraction
  const mapped = results.map(r => this.mapFilingFromHighlights(r));

  // 4. Return MCP-formatted response
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        search_type: 'sec_filings_web',
        results: mapped,
        count: mapped.length
      }, null, 2)
    }]
  };
}
```

### 3.5 Phase 5: Result Return

**Standard MCP Response Format**:
```javascript
{
  content: [{
    type: 'text',
    text: JSON.stringify({
      search_type: string,
      query: string,
      results: Array<{
        title: string,
        url: string,
        snippet?: string,
        // domain-specific fields
      }>,
      count: number,
      metadata: {
        source: 'native' | 'websearch' | 'orchestrator',
        confidence: number,
        _extraction_metadata: {...}
      }
    }, null, 2)
  }]
}
```

### 3.6 Complete Tool Inventory (70+ Tools)

| Category | Count | Example Tools |
|----------|-------|---------------|
| CourtListener | 12 | `search_cases`, `lookup_citation`, `search_judges`, `search_opinions` |
| Financial Disclosure | 9 | `search_financial_disclosures`, `search_judge_investments`, `get_judge_gifts` |
| SEC | 4 | `search_sec_filings`, `get_sec_company_facts`, `search_sec_company_tickers` |
| Federal Register | 6 | `search_federal_register`, `search_federal_register_notices`, `search_federal_register_final_rules` |
| USPTO | 6 | `search_patents`, `search_cpc_classifications`, `search_uspc_classifications` |
| GovInfo/USC | 4 | `search_us_code`, `get_usc_section`, `list_usc_titles` |
| PTAB | 5 | `search_ptab_proceedings`, `search_ptab_ipr_proceedings`, `search_all_ptab_aia_proceedings` |
| FTC | 6 | `search_ftc_enforcement_cases`, `search_ftc_competition_matters`, `search_ftc_rulemaking` |
| EPA | 3 | `search_epa_facilities`, `search_epa_violations`, `get_epa_facility_compliance_report` |
| FDA | 12 | `search_fda_drug_adverse_events`, `search_fda_recalls`, `search_fda_510k`, `search_fda_orange_book` |
| CPSC | 7 | `search_cpsc_recalls`, `search_cpsc_enforcement`, `search_cpsc_safety_standards` |
| NHTSA | 6 | `nhtsa_decode_vin`, `nhtsa_recalls_by_make_model_year`, `nhtsa_safety_ratings` |
| State Court Rules | 12 | `search_court_rules`, `get_formatting_requirements`, `get_discovery_rules` |
| State Statutes | 1 | `search_state_statute` |

---

## 4. API CLIENT ARCHITECTURE (EXPANDED)

### 4.1 Inheritance Hierarchy

```
SearchQualityMixin (trait)
    ↓
BaseWebSearchClient (abstract base)
    │
    ├── WebSearch Clients (direct inheritance)
    │   ├── SECWebSearchClient
    │   ├── EPAWebSearchClient
    │   ├── FDAWebSearchClient
    │   ├── CourtListenerWebSearchClient
    │   └── ... (13+ clients)
    │
    └── BaseHybridClient (extends BaseWebSearchClient)
        │
        ├── SECHybridClient
        ├── EPAHybridClient
        ├── FDAHybridClient
        └── ... (8+ hybrid clients)
```

### 4.2 BaseWebSearchClient Constructor

**File**: `src/api-clients/BaseWebSearchClient.js` (Lines 11-74)

```javascript
export class BaseWebSearchClient extends SearchQualityMixin {
  constructor(rateLimiter, exaApiKey, contentStrategy = null) {
    super();
    this.rateLimiter = rateLimiter;
    this.exaApiKey = exaApiKey || process.env.EXA_API_KEY;

    // Inject ContentStrategy (dependency injection for testability)
    this.contentStrategy = contentStrategy || new ContentStrategy();

    // Domain-specific summary queries (guides AI summary generation)
    this.summaryQueries = {
      case_law: 'holding precedent citation court judge opinion dissent concurrence...',
      securities: 'revenue net income earnings assets liabilities cash flow EBITDA...',
      patent: 'patent claims prior art inventor examiner filing date priority...',
      bankruptcy: 'chapter 7 chapter 11 chapter 13 liquidation reorganization...',
      employment: 'discrimination harassment retaliation EEOC Title VII ADA FLSA...',
      intellectual_property: 'copyright trademark trade secret fair use dilution...',
      procedural: 'statute limitations discovery deposition interrogatory subpoena...',
      transactional: 'merger acquisition due diligence earnout escrow indemnification...',
      environmental: 'compliance status violations penalties enforcement noncompliance...',
      pharmaceutical_safety: 'adverse events warnings contraindications recall death...',
      antitrust: 'antitrust merger enforcement FTC complaint consent decree...',
      automotive: 'recall defect NHTSA safety investigation campaign remedy',
      product_safety: 'recall hazard injury CPSC safety defect consumer product',
      regulatory: 'federal register rule regulation CFR USC agency enforcement...',
      state_law: 'statute code section amendment legislative session governor signed'
    };

    // Retry configuration
    this.retryConfig = {
      maxRetries: 2,
      baseDelayMs: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    };
  }
}
```

### 4.3 ContentStrategy Engine

**File**: `src/api-clients/ContentStrategy.js`

#### 4.3.1 Strategy Types

```javascript
export const StrategyType = {
  SUMMARY_WITH_SCHEMA: 'summary_with_schema',  // Structured JSON extraction
  SUMMARY_QUERY: 'summary_query',              // Text summary with focus query
  TEXT: 'text',                                // Full document text
  TEXT_WITH_SUMMARY: 'text_with_summary'       // Both text + summary
};
```

#### 4.3.2 Strategy Decision Logic (Lines 70-104)

```javascript
determine(options) {
  const {
    dataType,
    query,
    domain,
    limit = 10,
    includeFullText = false,
    highlightQuery = null,
    comprehensive = false
  } = options;

  // Strategy 1: Full text for low-limit queries or explicit request (HIGHEST PRIORITY)
  if (includeFullText || limit < 2) {
    return this._createTextConfig();
  }

  // Strategy 2: Comprehensive mode - text + summary
  if (comprehensive) {
    return this._createTextWithSummary(highlightQuery || query);
  }

  // Strategy 3: Schema-based extraction for structured data
  if (dataType && this.schemaRegistry[dataType]) {
    return this._createSummaryWithSchema(dataType, query);
  }

  // Strategy 4: Summary query (replaces deprecated highlights)
  if (highlightQuery) {
    return this._createSummaryQuery(highlightQuery);
  }

  // Strategy 5: Default summary query based on search query
  return this._createSummaryQuery(query);
}
```

#### 4.3.3 Schema-Based Summary Queries (Lines 185-221)

```javascript
_generateSchemaQuery(dataType, originalQuery) {
  const queries = {
    // SEC
    'sec_filing': 'Extract SEC filing metadata including accession number, filing date, form type, and company information',
    'sec_financial': 'Extract financial metrics including revenue, net income, total assets, and reporting period',

    // USPTO
    'patent': 'Extract patent metadata including patent number, title, inventors, assignee, filing date, and CPC classifications',
    'patent_classification': 'Extract CPC classification codes and descriptions',

    // EPA
    'epa_facility': 'Extract facility information including registry ID, name, location, and violation history',
    'epa_compliance': 'Extract compliance status, violations, and enforcement actions',

    // FDA
    'fda_adverse_event': 'Extract drug adverse event details including product name, reactions, and outcomes',
    'fda_device_event': 'Extract medical device event information',
    'fda_recall': 'Extract recall information including product, manufacturer, and reason',

    // NHTSA
    'nhtsa_recall': 'Extract vehicle recall details including make, model, component, and defect description',

    // Court/Legal
    'court_case': 'Extract case information including case number, parties, date, and citation',
    'statute': 'Extract statute citation, title, effective date, and key provisions',

    // GovInfo/USC
    'usc_search_result': 'Essential details about USC sections',
    'usc_section': 'Extract complete USC section information including title number, section number, official USC citation, full section text, and any subsections',

    // Default
    'default': `Extract key information related to: ${originalQuery}`
  };

  return queries[dataType] || queries['default'];
}
```

### 4.4 executeExaSearch() Detailed Implementation

**File**: `src/api-clients/BaseWebSearchClient.js` (Lines 105-256)

```javascript
async executeExaSearch(query, limit, options = {}) {
  // 1. API key validation
  if (!this.exaApiKey) {
    console.error('Exa API key not configured');
    return [];  // Graceful degradation
  }

  // 2. Rate limiting
  if (this.rateLimiter && typeof this.rateLimiter.enforce === 'function') {
    await this.rateLimiter.enforce();
  }

  // 3. Extract options
  const {
    domain,
    dataType,
    highlightQuery,
    summaryQuery,
    includeDomains,
    includeFullText = false,
    comprehensive = false,
    fallbackToText = true,
    _retryCount = 0
  } = options;

  // 4. Generate optimized summary query
  const optimizedSummaryQuery = summaryQuery || this.generateSummaryQuery(
    highlightQuery, query, domain
  );

  // 5. Determine content strategy via ContentStrategy engine
  const strategyConfig = this.contentStrategy.determine({
    dataType,
    query,
    domain,
    limit,
    includeFullText,
    highlightQuery: optimizedSummaryQuery,
    comprehensive
  });

  // 6. Build Exa API request body
  const requestBody = {
    query,
    numResults: limit,
    type: 'auto',
    livecrawl: 'preferred',
    contents: strategyConfig.config  // ContentStrategy output
  };

  if (includeDomains) {
    requestBody.includeDomains = includeDomains;
  }

  // 7. Execute with 60s timeout
  const EXA_TIMEOUT_MS = 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXA_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': this.exaApiKey
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // 8. Handle retryable errors (408, 429, 500, 502, 503, 504)
    if (!response.ok) {
      const statusCode = response.status;
      if (this.isRetryableError(statusCode) && _retryCount < this.retryConfig.maxRetries) {
        const delayMs = this.retryConfig.baseDelayMs * (_retryCount + 1);
        console.log(`[Exa] Retry ${_retryCount + 1}/${this.retryConfig.maxRetries} after ${statusCode}`);
        await this.delay(delayMs);
        return this.executeExaSearch(query, limit, { ...options, _retryCount: _retryCount + 1 });
      }
      throw new Error(`Exa API error: ${statusCode}`);
    }

    // 9. Parse JSON summaries from schema-based extraction
    let results = (await response.json()).results || [];
    if (strategyConfig.type === 'summary_with_schema') {
      results = results.map(result => {
        if (result.summary && typeof result.summary === 'string') {
          try {
            return { ...result, summary: JSON.parse(result.summary) };
          } catch (e) { return result; }
        }
        return result;
      });
    }

    // 10. Assess content quality
    const qualityAssessment = await this.assessContentQuality(results, query, strategyConfig.type);

    // 11. Fallback to full text if quality insufficient
    if (qualityAssessment.needsFallback && fallbackToText && !includeFullText) {
      console.log(`🔄 Content quality insufficient (${qualityAssessment.confidence}), falling back to full text`);
      return this.executeExaSearch(query, limit, { ...options, includeFullText: true, fallbackToText: false });
    }

    // 12. Add quality metadata to results
    return results.map(result => ({
      ...result,
      _content_quality: {
        confidence: qualityAssessment.confidence,
        coverage: qualityAssessment.coverage,
        relevance: qualityAssessment.relevance,
        strategy_type: strategyConfig.type,
        extraction_method: includeFullText ? 'full_text' : dataType ? 'schema_summary' : 'summary'
      }
    }));

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Exa API request failed:', error);
    return [];  // Graceful degradation
  }
}
```

### 4.5 Content Quality Assessment

**File**: `src/api-clients/BaseWebSearchClient.js` (Lines 296-426)

```javascript
async assessContentQuality(results, originalQuery, strategyType) {
  if (!results || results.length === 0) {
    return { confidence: 0, coverage: 'none', relevance: 'low', needsFallback: true };
  }

  let totalContentLength = 0;
  let substantialContent = 0;
  let relevantResults = 0;
  let structuredResults = 0;

  for (const result of results) {
    let content = result.summary || result.text || '';

    // Handle structured summaries from schema-based extraction
    if (typeof content === 'object' && content !== null) {
      structuredResults++;
      content = Object.values(content).filter(v => v != null).map(String).join(' ');
    }

    if (!content.length) continue;

    totalContentLength += content.length;
    const minLength = structuredResults > 0 ? 50 : 100;

    if (content.length > minLength && this.containsRelevantTerms(content, originalQuery)) {
      substantialContent++;
      relevantResults++;
    } else if (content.length > (minLength / 2)) {
      substantialContent++;
    }
  }

  // Calculate metrics
  const avgContentLength = totalContentLength / results.length;
  const relevanceRatio = relevantResults / results.length;
  const qualityRatio = substantialContent / results.length;
  const structuredRatio = structuredResults / results.length;

  // Calculate confidence score
  let confidence = 0;
  if (structuredRatio > 0.5) {
    confidence += 0.2;  // Bonus for structured extraction
    if (avgContentLength >= 100) confidence += 0.2;
    else if (avgContentLength >= 50) confidence += 0.1;
  } else {
    if (avgContentLength >= 200) confidence += 0.3;
    else if (avgContentLength >= 100) confidence += 0.2;
  }
  if (relevanceRatio >= 0.6) confidence += 0.4;
  if (qualityRatio >= 0.7) confidence += 0.3;

  // Determine coverage: complete | substantial | partial | minimal
  let coverage = 'minimal';
  if (relevanceRatio >= 0.8) coverage = 'complete';
  else if (relevanceRatio >= 0.6) coverage = 'substantial';
  else if (relevanceRatio >= 0.3) coverage = 'partial';

  // Determine relevance: high | medium | low
  let relevance = 'low';
  if (qualityRatio >= 0.7) relevance = 'high';
  else if (qualityRatio >= 0.4) relevance = 'medium';

  // Fallback decision
  const needsFallback = structuredRatio > 0.5
    ? confidence < 0.3   // More lenient for structured data
    : confidence < 0.5 || relevanceRatio < 0.3;

  return {
    confidence: Math.round(confidence * 100) / 100,
    coverage,
    relevance,
    needsFallback,
    metrics: { totalResults: results.length, relevantResults, structuredResults, avgContentLength, relevanceRatio, qualityRatio, structuredRatio }
  };
}
```

### 4.6 getRawResults() for Gemini Processing

**File**: `src/api-clients/BaseWebSearchClient.js` (Lines 686-776)

```javascript
async getRawResults(query, limit = 5, options = {}) {
  // Build minimal request - full text only, no summaries
  const requestBody = {
    query,
    numResults: Math.min(limit, 5),  // Cap at 5 for Gemini context efficiency
    type: 'auto',
    livecrawl: 'preferred',
    contents: {
      text: true  // Full text only
    }
  };

  if (options.includeDomains) {
    requestBody.includeDomains = options.includeDomains;
  }

  // Execute with retry logic (same as executeExaSearch)
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': this.exaApiKey },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  // Return minimal structure for Gemini processing
  return (data.results || []).map(result => ({
    title: result.title || 'Untitled',
    url: result.url,
    text: result.text || '',
    rawContent: result.text || '',  // Alias for compatibility
    publishedDate: result.publishedDate,
    _source: 'exa_raw',
    _domain: options.domain
  }));
}
```

### 4.7 BaseHybridClient Routing Strategies

**File**: `src/api-clients/BaseHybridClient.js`

**4 Routing Strategies**:

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `native_first` | Try native API, fallback to web | Structured queries with IDs |
| `websearch_first` | Prioritize websearch | Content discovery queries |
| `parallel` | Execute both simultaneously | Time-critical scenarios |
| `smart` | Analyze query to decide | Default for most tools |

**Smart Query Analysis**:
```javascript
analyzeQuery(args) {
  // Indicators for native API:
  // - Specific IDs (case_id, cik, patent_number)
  // - Date ranges
  // - Short, specific queries (<30 chars)

  // Indicators for websearch:
  // - include_snippet, highlight flags
  // - Long natural language queries (>50 chars)
  // - Keywords: "about", "regarding", "discuss"

  return { strategy: 'native' | 'websearch', confidence: 0.0-1.0 };
}
```

### 4.8 Circuit Breaker Pattern

Protects against cascading failures from unreliable native APIs:

```javascript
// Circuit breaker states
this.circuitBreaker = {
  state: 'closed',     // normal operation
  failures: 0,         // consecutive failure count
  lastFailure: null,   // timestamp
  threshold: 5,        // failures before opening
  timeout: 300000      // 5 minutes in open state
};

// On native API failure
recordNativeFailure() {
  this.circuitBreaker.failures++;
  if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
    this.circuitBreaker.state = 'open';  // Skip native for 5 minutes
  }
}
```

### 4.9 Exa API Request Parameters Reference

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `query` | string | Neural search query | Required |
| `numResults` | number | Result count (1-100) | 10 |
| `type` | string | Search type: `auto`, `neural`, `keyword` | `auto` |
| `livecrawl` | string | `always`, `preferred`, `never`, `fallback` | `preferred` |
| `contents.text` | boolean | Include full document text | false |
| `contents.summary.query` | string | Focus query for AI summary | null |
| `contents.summary.schema` | object | JSON Schema for structured extraction | null |
| `includeDomains` | string[] | Restrict to domains | null |
| `excludeDomains` | string[] | Exclude domains | null |
| `startPublishedDate` | string | Filter by publication date | null |
| `endPublishedDate` | string | Filter by publication date | null |

### 4.10 Domain-Specific Client Implementations

| Client | Domain | Key Methods |
|--------|--------|-------------|
| `SECWebSearchClient` | Securities | `searchSECFilingsWeb()`, `getSECCompanyFactsWeb()` |
| `EPAWebSearchClient` | Environmental | `searchFacilitiesWeb()`, `searchViolationsWeb()` |
| `FDAWebSearchClient` | Pharmaceutical | `searchDrugAdverseEventsWeb()`, `searchRecallsWeb()` |
| `CourtListenerWebSearchClient` | Case Law | `searchOpinionsWeb()`, `lookupCitationWeb()` |
| `GovInfoWebSearchClient` | Legislation | `searchUSCode()`, `getUSCSection()` |
| `FederalRegisterWebSearchClient` | Regulatory | `searchFederalRegister()` |
| `USPTOWebSearchClient` | Patents | `searchPatentsWeb()`, `searchCPCClassificationsWeb()` |
| `PTABWebSearchClient` | Patent Appeals | `searchIPRProceedings()`, `searchPGRProceedings()` |
| `FTCWebSearchClient` | Antitrust | `searchEnforcementCasesWeb()` |
| `CPSCWebSearchClient` | Product Safety | `searchRecallsWeb()` |
| `NHTSAWebSearchClient` | Automotive | `decodeVinWeb()`, `getRecallsByMakeModelYearWeb()` |

---

## 5. CLAUDEORCHESTRATOR (Gemini Integration)

### 5.1 Purpose

Coordinates intelligent research using:
- **Claude**: Reasoning, query analysis, synthesis
- **Gemini 2.5 Flash**: High-speed content filtering/extraction

### 5.2 Research Flow

**File**: `src/server/ClaudeOrchestrator.js`

```javascript
async research(userQuery, options = {}) {
  // 1. Generate focus points (Claude plans the search)
  const plan = await this.generateFocusPoints(userQuery, previousFindings);
  // Returns: { modules: ['securities', 'case_law'], focusPoints: {...} }

  // 2. Fetch raw data for each module (parallel)
  const rawDataPromises = plan.modules.map(m => this._fetchRawData(m, userQuery));
  const rawDataResults = await Promise.all(rawDataPromises);

  // 3. Filter through Gemini (parallel)
  const filterPromises = plan.modules.map((m, i) => {
    return this.filters[m].processAndFilter(rawDataResults[i], plan.focusPoints[m]);
  });
  const findings = await Promise.all(filterPromises);

  // 4. Synthesize with Claude
  const synthesis = await this.synthesize(findings, userQuery, session);

  // 5. Check if more info needed (max 3 iterations)
  if (synthesis.needsMoreInfo && iteration < 3) {
    return this.research(synthesis.refinedQuery, { iteration: iteration + 1 });
  }

  return { answer: synthesis.answer, iterations, modulesQueried };
}
```

### 5.3 Domain Modules

12 specialized Gemini filter modules with domain-specific prompts:

| Module | Domain | System Prompt |
|--------|--------|---------------|
| `securities` | SEC filings | SECURITIES_PROMPT |
| `pharmaceutical_safety` | FDA data | PHARMACEUTICAL_PROMPT |
| `environmental` | EPA compliance | ENVIRONMENTAL_PROMPT |
| `case_law` | Court opinions | CASE_LAW_PROMPT |
| `legislation` | US Code | LEGISLATION_PROMPT |
| `federal_register` | Rules/notices | FEDERAL_REGISTER_PROMPT |
| `product_safety` | CPSC/NHTSA | PRODUCT_SAFETY_PROMPT |
| `antitrust` | FTC enforcement | ANTITRUST_PROMPT |
| `patent` | USPTO patents | PATENT_PROMPT |
| `patent_appeals` | PTAB proceedings | PATENT_APPEALS_PROMPT |
| `state_courts` | State procedures | STATE_COURTS_PROMPT |
| `state_statutes` | State laws | STATE_STATUTES_PROMPT |

---

## 6. EXPECTED OUTCOMES

### 6.1 Successful Tool Call

**Input**:
```javascript
{
  name: "search_sec_filings",
  arguments: {
    company_identifier: "AAPL",
    filing_type: "10-K",
    limit: 5
  }
}
```

**Expected Output**:
```json
{
  "search_type": "sec_filings_web",
  "query": "site:sec.gov AAPL 10-K",
  "results": [
    {
      "title": "Apple Inc. 10-K Annual Report 2024",
      "url": "https://www.sec.gov/Archives/edgar/data/320193/...",
      "form": "10-K",
      "filingDate": "2024-10-31",
      "company": "Apple Inc.",
      "cik": "0000320193"
    }
  ],
  "count": 5,
  "metadata": {
    "source": "websearch",
    "confidence": 0.92
  }
}
```

### 6.2 Streaming Response

**SSE Events Sequence**:
```
data: {"type":"thinking","text":"Analyzing legal research strategy..."}

data: {"type":"tool","type":"tool_start","tool":{"name":"search_sec_filings"}}

data: {"type":"tool","type":"tool_update","tool":{"input":{"company_identifier":"AAPL"}}}

data: {"type":"tool","type":"tool_execute","tool":{"name":"search_sec_filings"}}

data: {"type":"tool","type":"tool_result","success":true,"preview":"..."}

data: {"type":"content","text":"Based on the SEC filings..."}

data: {"type":"progress","type":"research_complete","tools_executed":1}
```

### 6.3 Error Handling

**Unknown Tool**:
```javascript
{
  error: {
    code: ErrorCode.MethodNotFound,
    message: "Unknown tool: nonexistent_tool"
  }
}
```

**Native API Failure (Hybrid Client)**:
```javascript
{
  "results": [...],
  "_hybrid_metadata": {
    "source": "web_search_fallback",
    "fallback_used": true,
    "fallback_reason": "Native API returned 500"
  }
}
```

---

## 7. KEY CONFIGURATION FILES

| File | Purpose |
|------|---------|
| `.env` | API keys (ANTHROPIC_API_KEY, EXA_API_KEY) |
| `src/config/geminiConfig.js` | Gemini model settings, token limits |
| `src/tools/toolDefinitions.js` | All tool schemas |
| `src/tools/toolImplementations.js` | Tool → client mappings |
| `src/api-clients/schemas/*.js` | Domain-specific extraction schemas |

---

## 8. CRITICAL PATHS FOR IMPLEMENTATION

1. **Adding a New Tool**:
   - Define schema in `toolDefinitions.js`
   - Create implementation in `toolImplementations.js`
   - Create API client extending `BaseWebSearchClient`
   - Register schemas with `ContentStrategy`

2. **Modifying Streaming Behavior**:
   - Edit `processStreamWithToolHandling()` for event handling
   - Edit `handleStreamEventWithTools()` for specific event types
   - Adjust delays/timeouts as needed

3. **Adding Hybrid Client**:
   - Extend `BaseHybridClient`
   - Implement `analyzeQuery()` for smart routing
   - Configure circuit breaker thresholds

---

## 9. RECOMMENDATIONS

1. **Reduce 7-second delay**: The hardcoded 7-second wait in `content_block_stop` is excessive for most tools
2. **Circuit breaker metrics**: Expose circuit breaker state via health endpoint
3. **Token optimization**: Consider dynamic limit reduction based on response size
4. **Error taxonomy**: Standardize error codes across all clients

---

## 10. KEY SOURCE FILES REFERENCE

| File Path | Description |
|-----------|-------------|
| `src/server/claude-server-v2.js` | Main streaming server, ClaudeLegalResearch class |
| `src/server/EnhancedLegalMcpServer.js` | MCP protocol handler, tool routing |
| `src/server/ClaudeOrchestrator.js` | Gemini integration for intelligent filtering |
| `src/tools/toolDefinitions.js` | 70+ tool schemas with JSON Schema validation |
| `src/tools/toolImplementations.js` | Tool wrappers with parameter capping |
| `src/api-clients/BaseWebSearchClient.js` | Abstract base for all Exa-based clients |
| `src/api-clients/BaseHybridClient.js` | Native + WebSearch hybrid routing |
| `src/api-clients/ContentStrategy.js` | Content extraction strategy engine |
| `src/api-clients/schemas/*.js` | Domain-specific JSON schemas for extraction |

---

## 11. SCHEMA EXTRACTION ARCHITECTURE

### 11.1 Schema Infrastructure Overview

**Location**: `src/api-clients/schemas/` (5,954 lines across 15 schema files)

The system uses JSON Schema v7 for structured data extraction from Exa API summaries.

### 11.2 Foundation Layer (BaseSchemas.js)

```javascript
// Common type definitions for reuse across domains
export const CommonTypes = {
  date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
  monetary: { type: "number", minimum: 0 },
  percentage: { type: "number", minimum: 0, maximum: 100 },
  url: { type: "string", format: "uri" },
  citation: { type: "string" },
  stateCode: { type: "string", pattern: "^[A-Z]{2}$" }
};

export function createSchema(title, properties, required = [], options = {}) {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    ...options
  };
}
```

### 11.3 Domain-Specific Schemas

**SEC Schemas** (`SECSchemas.js`):
- `SECFilingSchema`: Company name, form type, filing/report dates, CIK, ticker, URL
- `SECFinancialSchema`: Revenue, net income, assets, liabilities, EPS, cash equivalents
- Strategy: Relaxed patterns to handle variations (e.g., "10-K/A" alongside "10-K")

**EPA Schemas** (`EPASchemas.js`):
- `EPAFacilitySchema`: Registry ID, facility name, address, location coords, SIC/NAICS codes
- `EPAComplianceSchema`: Report dates, inspection findings, violation counts, enforcement actions
- Required fields: Only `registry_id` and `facility_name` (minimum viable extraction)

**FDA Schemas** (`FDASchemas.js`):
- `DrugAdverseEventSchema`: Report ID, drug name, active ingredient, serious flag, patient reaction
- `DeviceEventSchema`: Brand name, generic name, manufacturer, event type/description
- `DrugLabelSchema`: Indications, warnings, dosage, NDC code pattern validation

**CourtListener Schemas** (`CourtListenerSchemas.js`):
- `CourtOpinionSchema`: Case name, citation, court, docket, date filed, judge, opinion type
- `JudgeSchema`: Name components, court, appointer, selection method, political affiliation
- Includes: Cited cases array, disposition, holding extraction

**GovInfo Schemas** (`GovInfoSchemas.js`):
- `USCSearchResultSchema`: USC citation pattern, title number (1-54), section info
- `USCSectionSchema`: Full statutory text with subsection parsing support
- Two-tier approach: Complex schema for structured queries, simple for natural language

### 11.4 Schema Validation Layer (SchemaValidator.js)

```javascript
export function validateSchema(data, schema) {
  // Type validation with null/undefined handling
  // Required field checking
  // Property-level validation including:
  //   - Enum validation (with warnings for non-matching values)
  //   - Pattern regex matching
  //   - Numeric min/max constraints
  //   - Array item count validation

  return {
    valid: true/false,
    errors: [{field, message, code}],
    warnings: [{field, message, code}]
  };
}

// Fallback extraction when Gemini responses don't match schema
export function fallbackToTextParsing(rawText, schema) {
  // Attempts manual extraction from unstructured text
  // Graceful degradation when AI extraction fails
}

export function sanitizeData(data) {
  // HTML entity decoding (&nbsp; → space, &amp; → &, etc.)
  // Whitespace normalization
  // Security-focused sanitization
}
```

---

## 12. RATE LIMITING ARCHITECTURE

### 12.1 GeminiRateLimiter (Sliding Window)

**File**: `src/utils/GeminiRateLimiter.js`

```javascript
class GeminiRateLimiterClass {
  constructor(options = {}) {
    this.maxRequests = options.maxRequestsPerMinute || 10;  // Gemini free tier
    this.windowMs = options.windowMs || 60000;             // 1-minute window
    this.requests = [];                                     // Timestamp tracking
    this.waitingQueue = [];                                 // Request queueing
  }

  async enforce() {
    // Remove expired requests outside window
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return;  // Proceed immediately
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = this.requests[0];
    const waitTime = this.windowMs - (now - oldestRequest) + 100; // +100ms buffer

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.enforce();  // Recursive check
    }
  }

  getStatus() {
    return {
      current: this.requests.length,
      max: this.maxRequests,
      windowMs: this.windowMs,
      utilizationPercent: Math.round((this.requests.length / this.maxRequests) * 100)
    };
  }
}

// Singleton pattern for shared state
export const GeminiRateLimiter = {
  getInstance(options = {}),
  resetInstance(options = {})
};
```

### 12.2 API-Specific Rate Limits

| API | Rate Limit | Window | Official Limit |
|-----|-----------|--------|----------------|
| SEC EDGAR | 9 req/sec | 1000ms | 10/sec |
| Federal Register | 5 req/sec | 1000ms | - |
| USPTO Patents | 40 req/min | 60000ms | 45/min |
| PTAB | 5 req/sec | 1000ms | - |
| GovInfo | 9 req/sec | 1000ms | 10/sec |
| Exa Search | 5 req/sec | 1000ms | - |
| EPA ECHO | 90 req/min | 60000ms | 100/min |
| openFDA | 180 req/min | 60000ms | 200/min |
| CPSC | 5 req/sec | 1000ms | - |
| NHTSA | 5 req/sec | 1000ms | - |

---

## 13. INTELLIGENT FILTERING LAYER (GeminiFilterModule)

### 13.1 Purpose

**File**: `src/filters/GeminiFilterModule.js`

Processes raw API data through Gemini 2.5 Flash (1M context window) to extract only relevant findings.

### 13.2 Core Implementation

```javascript
export class GeminiFilterModule {
  constructor(domain, config) {
    this.domain = domain;                    // 'securities', 'case_law', etc.
    this.systemPrompt = config.systemPrompt; // Domain-specific extraction rules
    this.maxOutputTokens = config.maxOutputTokens || 10000;
    this.temperature = config.temperature ?? 0.1;  // Low for factual extraction

    // Rate limiter (shared singleton)
    this.rateLimiter = GeminiRateLimiter.getInstance();

    // Circuit breaker (per domain)
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000,
      maxConsecutiveFailures: 5
    });

    // Content limits
    this.maxCharsPerDoc = 12000;     // ~3K tokens per doc
    this.maxTotalChars = 30000;      // ~7.5K tokens total
  }

  async processAndFilter(rawResults, extractionInstructions) {
    // 1. Check circuit breaker (skip if open)
    if (this.circuitBreaker.isOpen()) {
      return this.fallbackToLimitedPreview(rawResults);
    }

    // 2. Enforce rate limiting
    await this.rateLimiter.enforce();

    // 3. Preprocess: Clean content, remove XBRL/HTML, limit size
    const preprocessed = this._preprocessResults(rawResults);

    // 4. Build context: Format documents with titles and URLs
    const fullContext = this._buildContext(preprocessed);

    // 5. Build prompt: Add query-specific focus points
    const prompt = this._buildPrompt(extractionInstructions, fullContext);

    // 6. Call Gemini with system instruction
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    // 7. Handle MAX_TOKENS: Retry with reduced content
    if (finishReason === 'MAX_TOKENS' && retries < 3) {
      return this._retryWithReducedContent();
    }

    // 8. Return structured result
    return {
      domain: this.domain,
      findings: responseText,
      sourceCount: rawResults.length,
      sourceUrls: rawResults.map(r => r.url).filter(Boolean),
      confidence: this._assessConfidence(result, responseText),
      processingTime: Date.now() - startTime
    };
  }
}
```

### 13.3 Content Preprocessing

```javascript
_preprocessResults(rawResults, maxPerDoc = 12000, maxTotal = 30000) {
  // Clean content with regex patterns:
  // - XBRL: /http:\/\/[^\s]+#[^\s]+/g (namespace references)
  // - Base64: /[A-Za-z0-9+/=]{100,}/g (long encoded strings)
  // - Boilerplate: /\[Skip to main content\][^\n]*/gi
  // - HTML tags: /<[^>]+>/g
  // - Multiple whitespace: /\s+/g → ' '
}
```

### 13.4 Confidence Assessment

```javascript
_assessConfidence(result, responseText) {
  let confidence = 0.5;  // Base

  // Adjustments:
  if (responseText.length > 1000) confidence += 0.2;
  if (/##|\\*\\*/.test(responseText)) confidence += 0.1;  // Structured headers
  if (/Source:|Citation:/.test(responseText)) confidence += 0.1;  // Citations
  if (/no results|not found/i.test(responseText)) confidence -= 0.3;

  return Math.max(0, Math.min(1, confidence));
}
```

### 13.5 Fallback Strategy

```javascript
fallbackToLimitedPreview(rawResults) {
  // Graceful degradation when:
  // - Gemini unavailable
  // - Circuit breaker open
  // - Rate limit exceeded

  // Returns 5 document previews (500 chars each)
  return rawResults.slice(0, 5).map(r => ({
    title: r.title,
    url: r.url,
    preview: r.text?.substring(0, 500) || '',
    _fallback: true
  }));
}
```

---

## 14. CIRCUIT BREAKER PATTERN (DETAILED)

### 14.1 Three-State Implementation

**File**: `src/modules/conversation-bridge/core/CircuitBreaker.js`

```javascript
export class CircuitBreaker {
  constructor(options = {}) {
    this.config = {
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 30000,          // 30 seconds
      maxConsecutiveFailures: options.maxConsecutiveFailures || 5
    };

    this.state = {
      failures: 0,
      consecutiveFailures: 0,
      isOpen: false,
      lastFailure: null,
      resetTimeoutId: null
    };
  }

  recordSuccess() {
    this.state.consecutiveFailures = 0;
    if (this.state.isOpen) this.closeCircuit();
  }

  recordFailure() {
    this.state.failures++;
    this.state.consecutiveFailures++;
    this.state.lastFailure = Date.now();

    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }
  }

  shouldOpenCircuit() {
    return (
      this.state.consecutiveFailures >= this.config.failureThreshold ||
      (this.state.failures >= this.config.maxConsecutiveFailures &&
       Date.now() - this.state.lastFailure < this.config.resetTimeout)
    );
  }

  openCircuit() {
    this.state.isOpen = true;
    // Schedule automatic reset (half-open state)
    this.state.resetTimeoutId = setTimeout(() => {
      this.attemptReset();
    }, this.config.resetTimeout);
  }

  getStatus() {
    return {
      isOpen: this.state.isOpen,
      failures: this.state.failures,
      consecutiveFailures: this.state.consecutiveFailures,
      lastFailure: this.state.lastFailure,
      config: this.config
    };
  }
}
```

### 14.2 State Transitions

```
┌─────────┐     failure count >= threshold     ┌─────────┐
│ CLOSED  │ ─────────────────────────────────► │  OPEN   │
│         │                                     │         │
│ Normal  │                                     │ Blocking│
│operation│ ◄───────────────────────────────── │ requests│
└─────────┘     success in half-open           └─────────┘
     ▲                                              │
     │                                              │
     │           ┌───────────┐                      │
     └────────── │ HALF-OPEN │ ◄────────────────────┘
       success   │           │    after resetTimeout
                 │Test single│
                 │  request  │
                 └───────────┘
```

---

## 15. VALIDATION & ERROR HANDLING

### 15.1 Input Validation Functions

**File**: `src/utils/validation.js`

```javascript
export function validateDate(date, fieldName) {
  if (!DATE_REGEX.test(date)) {
    throw new Error(`Invalid date format for ${fieldName}. Expected YYYY-MM-DD, got: ${date}`);
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value for ${fieldName}: ${date}`);
  }
}

export function validateLimit(limit, max = 20) {
  if (limit < 1) return 1;
  if (limit > max) return max;
  return Math.floor(limit);
}

export function validateRequired(params, required) {
  for (const param of required) {
    if (params[param] === undefined || params[param] === null) {
      throw new Error(`Required parameter missing: ${param}`);
    }
  }
}

export function sanitizeString(input) {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}
```

### 15.2 Error Handling Patterns

**Pattern 1: Try-catch with Fallback**
```javascript
try {
  const result = await nativeApiCall();
  this.circuitBreaker.recordSuccess();
  return result;
} catch (error) {
  this.circuitBreaker.recordFailure();
  return this.fallbackToWebsearch();
}
```

**Pattern 2: Retryable Status Codes**
```javascript
isRetryableError(statusCode) {
  return [408, 429, 500, 502, 503, 504].includes(statusCode);
}
```

**Pattern 3: Exponential Backoff**
```javascript
async _exponentialBackoff(attempt) {
  const delay = Math.min(
    baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * jitterMs,
    maxDelayMs
  );
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

---

## 16. ENVIRONMENT CONFIGURATION

### 16.1 Gemini Filtering Configuration

```bash
ENABLE_GEMINI_FILTERING=true
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_OUTPUT_TOKENS=10000
GEMINI_TEMPERATURE=0.1
GEMINI_RATE_LIMIT=10
GEMINI_CIRCUIT_FAILURE_THRESHOLD=3
GEMINI_CIRCUIT_RESET_TIMEOUT_MS=30000
GEMINI_CIRCUIT_MAX_FAILURES=5
GEMINI_MAX_RETRIES=3
GEMINI_MAX_CHARS_PER_DOC=12000
GEMINI_MAX_TOTAL_CHARS=30000
GEMINI_FALLBACK_PREVIEW_LENGTH=500
GEMINI_FALLBACK_MAX_RESULTS=5
GEMINI_LOG_REQUESTS=false
GEMINI_LOG_RESPONSES=false
```

### 16.2 Hybrid Client Configuration

```bash
HYBRID_PREFER_NATIVE=true
HYBRID_ENABLE_CACHE=true
HYBRID_ENABLE_FALLBACK=true
HYBRID_VERBOSE_LOGGING=false
```

### 16.3 API Keys

```bash
COURTLISTENER_API_TOKEN=...
EXA_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 16.4 Feature Flags

```bash
ENABLE_GEMINI_FILTERING=true
ENABLE_CONVERSATION_LOGGING=true
```

---

## 17. COMPREHENSIVE FILE REFERENCE

### Core Architecture Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/server/claude-server-v2.js` | ~2700 | Main streaming server |
| `src/server/EnhancedLegalMcpServer.js` | ~600 | MCP protocol handler |
| `src/server/ClaudeOrchestrator.js` | ~400 | Gemini orchestration |
| `src/api-clients/BaseWebSearchClient.js` | ~856 | Abstract base for Exa clients |
| `src/api-clients/BaseHybridClient.js` | ~500 | Native + WebSearch routing |

### Schema Layer Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/api-clients/schemas/BaseSchemas.js` | ~200 | Common type definitions |
| `src/api-clients/schemas/SECSchemas.js` | ~350 | SEC filing extraction |
| `src/api-clients/schemas/EPASchemas.js` | ~300 | EPA facility/compliance |
| `src/api-clients/schemas/FDASchemas.js` | ~400 | FDA drug/device events |
| `src/api-clients/schemas/CourtListenerSchemas.js` | ~493 | Case law extraction |
| `src/api-clients/schemas/GovInfoSchemas.js` | ~250 | USC/legislation |
| `src/api-clients/schemas/SchemaValidator.js` | ~426 | Validation & fallback |

### Filter & Rate Limiting Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/filters/GeminiFilterModule.js` | ~525 | Intelligent content filtering |
| `src/utils/GeminiRateLimiter.js` | ~150 | Sliding window rate limiter |
| `src/config/geminiConfig.js` | ~80 | Gemini configuration |
| `src/config/apiConfig.js` | ~200 | All API rate limits |

### Tool Layer Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/tools/toolDefinitions.js` | ~2000 | 70+ tool schemas |
| `src/tools/toolImplementations.js` | ~573 | Tool routing & wrappers |

### Utility Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/utils/validation.js` | ~150 | Input validation |
| `src/utils/apiHelpers.js` | ~200 | API helper functions |
| `src/modules/conversation-bridge/core/CircuitBreaker.js` | ~100 | Circuit breaker |

---

## 18. SUMMARYQUERYBUILDER - CONTEXT-AWARE EXTRACTION

### 18.1 Purpose

**File**: `src/api-clients/SummaryQueryBuilder.js` (239 lines)

Builds natural language extraction prompts for Exa API's Gemini-powered summaries. Converts technical queries into human-readable extraction instructions.

### 18.2 Core Implementation

```javascript
class SummaryQueryBuilder {
  constructor(schema = null) {
    this.schema = schema;
  }

  build({ userSearchTerm, dataType, schema, baseTerms }) {
    const userTerm = this._extractUserTerm(userSearchTerm);
    return this._buildEnhancedQuery({ userTerm, dataType, schema, baseTerms });
  }
}

// Output example for FDA:
// "Provide adverse event information for '{userTerm}'
//  including severity, date, medical history"
```

### 18.3 Data Type Mappings

| Domain | Data Types |
|--------|------------|
| FDA | adverse_event, device_event, recall, drug_label, warning_letter |
| SEC | filing, financial, company, 10-K, 10-Q, 8-K, proxy |
| USPTO | patent, trademark, patent_assignment |
| EPA | facility, compliance, enforcement, permit, violation |
| CourtListener | court_case, case_law, statute, docket, judge |
| Federal Register | document, rule, proposed_rule, notice |

### 18.4 Fallback Safety

```javascript
// Always reverts to baseTerms if enhancement fails
// Graceful degradation prevents extraction failures
if (!enhancedQuery) {
  return baseTerms;
}
```

---

## 19. MCP PROTOCOL MESSAGE FORMATS

### 19.1 CallToolRequest Format

**File**: `src/server/EnhancedLegalMcpServer.js` (Lines 364-378)

```javascript
// Request from Claude to server
const { name, arguments: args } = request.params;

// Execute tool
const result = await this.toolImplementations[name](args);

// Standard response structure
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      search_type: 'domain_specific_search',
      query: 'original_query',
      total_results: number,
      results: Array<result_item>,
      quality_metadata: { confidence, coverage, relevance }
    }, null, 2)
  }]
};
```

### 19.2 ListToolsRequest Response

```javascript
return {
  tools: [
    {
      name: 'search_cases',
      description: 'Search federal and state court opinions',
      inputSchema: {
        type: 'object',
        properties: { query, court, limit, date_filed_after },
        required: ['query']
      }
    }
  ]
};
```

### 19.3 Tool Result Standard Structure

```javascript
{
  content: [{
    type: 'text',
    text: JSON.stringify({
      search_type: string,           // 'sec_filings_web', 'court_opinions', etc.
      query: string,                 // Original search query
      original_query: string,        // User's input before transformation
      total_results: number,
      results: [{
        // Domain-specific fields
        title: string,
        url: string,
        publishedDate: string,
        snippet: string,
        _extraction_metadata: {
          confidence: number,
          source: string,
          extraction_method: string
        }
      }],
      quality_assessment: {
        confidence_score: number,
        extraction_success_rate: number,
        advisory_flags: string[]
      }
    }, null, 2)
  }]
}
```

---

## 20. CONVERSATION HISTORY & CONTEXT MANAGEMENT

### 20.1 Message Structure

**File**: `src/server/claude-server-v2.js` (Lines 57-107)

```javascript
// User message
{
  role: 'user',
  content: 'user query text',
  timestamp: '2025-12-05T...',
  entities: Set<'companies:JPMorgan Chase', 'patents:US7123456'>
}

// Assistant response
{
  role: 'assistant',
  content: 'assistant answer',
  timestamp: '2025-12-05T...',
  toolCalls: Array<{ name, input, result }>
}

// Tool result
{
  role: 'user',
  content: [{
    type: 'tool_result',
    tool_use_id: 'tool_id',
    content: 'result_data'
  }]
}
```

### 20.2 Smart Truncation Algorithm

```javascript
smartTruncate(history, maxTokens = 32000) {
  const maxChars = maxTokens * 4;  // Conservative: 4 chars/token
  let totalChars = 0;
  const truncated = [];

  // Iterate from most recent backwards (preserves recent context)
  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    const messageSize = JSON.stringify(message).length;

    if (totalChars + messageSize > maxChars && truncated.length > 0) {
      break;
    }
    truncated.unshift(message);
    totalChars += messageSize;
  }
  return truncated;
}
```

### 20.3 Context Memory Limits

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Memory limit | 50MB | Per conversation session |
| Max tokens | 32,000 | Default truncation threshold |
| Chars/token | 4 | Conservative estimation ratio |
| Entity types | companies, cases, judges, patents | Extracted from content |

---

## 21. EXA API RESPONSE STRUCTURE

### 21.1 Request Format

```javascript
const requestBody = {
  query: 'site:courtlistener.com/opinion patent infringement',
  numResults: 5,
  type: 'auto',           // 'auto' | 'neural' | 'keyword'
  livecrawl: 'preferred', // 'always' | 'preferred' | 'never' | 'fallback'
  contents: {
    // Strategy-dependent structure:
    summary: {
      query: 'holding precedent citation...',
      schema: { /* JSON Schema v7 */ }
    }
    // OR: { text: true }
    // OR: { text: true, summary: { query: '...' } }
  }
};
```

### 21.2 Response Structure

```javascript
{
  results: [{
    id: 'exa_result_id',
    title: 'Opinion title or page title',
    url: 'https://courtlistener.com/opinion/...',
    publishedDate: 'YYYY-MM-DD',
    author: 'Judge name or document author',

    // Content (depends on strategy):
    text: '... full document text ...',     // If text: true
    summary: {                               // If schema specified
      company_name: 'Apple Inc.',
      form_type: '10-K',
      filing_date: '2025-02-15',
      cik: '0000320193'
    },

    // Quality metadata (added by BaseWebSearchClient)
    _content_quality: {
      confidence: 0.85,
      coverage: 'high',
      relevance: 'exact_match',
      strategy_type: 'summary_with_schema',
      extraction_method: 'schema_summary'
    }
  }]
}
```

### 21.3 JSON Parsing for Schema Results

```javascript
// Exa returns structured summaries as JSON strings
if (strategyConfig.type === 'summary_with_schema') {
  results = results.map(result => {
    if (result.summary && typeof result.summary === 'string') {
      try {
        return { ...result, summary: JSON.parse(result.summary) };
      } catch (e) {
        return result;  // Leave as string if parse fails
      }
    }
    return result;
  });
}
```

---

## 22. CONVERSATION BRIDGE - DUAL-WRITE LOGGING

### 22.1 Architecture Pattern

**File**: `src/modules/conversation-bridge/core/ConversationBridge.js`

```javascript
async logToolCall(toolName, args, result, conversationId = null) {
  // NON-CRITICAL PATH: Background logging (fail-safe)
  if (conversationId && !this.circuitBreaker.isOpen()) {
    this.healthMonitor.recordAttempt();

    // Non-blocking background processing
    setImmediate(() => this.logToConversationSafe(toolName, args, result, conversationId));
  }

  return result; // User gets immediate response (CRITICAL PATH)
}
```

### 22.2 Message Storage Format

```javascript
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
```

### 22.3 Tool Result Formatters

```javascript
const formatters = {
  'search_cases': (args, result) =>
    `🏛️ **Court Case Search Complete**\n` +
    `Query: "${args.query}"\n` +
    `Results: Found ${result.length} cases`,

  'sec_search': (args, result) =>
    `📊 **SEC Filing Search Complete**\n` +
    `Company: ${args.company || args.ticker}\n` +
    `Results: Found ${result.length} filings`,

  'epa_search': (args, result) =>
    `🌿 **EPA Regulation Search Complete**\n` +
    `Query: "${args.query}"\n` +
    `Results: Found ${result.length} documents`
};
```

### 22.4 Health Monitoring

| Parameter | Value | Purpose |
|-----------|-------|---------|
| checkInterval | 300,000ms (5 min) | Health check frequency |
| successRateThreshold | 90% | Minimum success rate |
| circuitBreaker | Per-bridge | Prevents cascade failures |

---

## 23. TIMEOUT & RETRY CONFIGURATION

### 23.1 Exa API Settings

**File**: `src/api-clients/BaseWebSearchClient.js` (Lines 68-73)

```javascript
this.retryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

const EXA_TIMEOUT_MS = 60000;  // 60 seconds per request
```

### 23.2 Linear Backoff Implementation

```javascript
if (this.isRetryableError(statusCode) && _retryCount < this.retryConfig.maxRetries) {
  const delayMs = this.retryConfig.baseDelayMs * (_retryCount + 1);  // 1s, 2s, 3s
  console.log(`[Exa] Retry ${_retryCount + 1}/${this.retryConfig.maxRetries}`);
  await this.delay(delayMs);
  return this.executeExaSearch(query, limit, {
    ...options,
    _retryCount: _retryCount + 1
  });
}
```

### 23.3 Timeout Handling

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), EXA_TIMEOUT_MS);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ... process response
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.error('Exa request timed out after 60s');
  }
}
```

---

## 24. ORCHESTRATOR 1M CONTEXT INTEGRATION

### 24.1 Initialization

**File**: `src/server/ClaudeOrchestrator.js` (Lines 73-83)

```javascript
this.anthropic = apiKey ? new Anthropic({
  apiKey,
  defaultHeaders: {
    'anthropic-beta': 'context-1m-2025-08-07'  // Enables 1M context window
  }
}) : null;
```

### 24.2 Domain Filter Initialization

```javascript
_initializeFilters() {
  const prompts = {
    securities: SECURITIES_PROMPT,
    pharmaceutical_safety: PHARMACEUTICAL_PROMPT,
    environmental: ENVIRONMENTAL_PROMPT,
    case_law: CASE_LAW_PROMPT,
    legislation: LEGISLATION_PROMPT,
    federal_register: FEDERAL_REGISTER_PROMPT,
    product_safety: PRODUCT_SAFETY_PROMPT,
    antitrust: ANTITRUST_PROMPT,
    patent: PATENT_PROMPT,
    patent_appeals: PATENT_APPEALS_PROMPT,
    state_courts: STATE_COURTS_PROMPT,
    state_statutes: STATE_STATUTES_PROMPT
  };

  const filters = {};
  for (const [domain, prompt] of Object.entries(prompts)) {
    filters[domain] = new GeminiFilterModule(domain, {
      systemPrompt: prompt,
      maxOutputTokens: getMaxTokensForDomain(domain)
    });
  }
  return filters;
}
```

### 24.3 Research Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Query                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Analyze query → Determine relevant modules                   │
│     (securities, case_law, environmental, etc.)                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Execute searches in PARALLEL across selected modules         │
│     Module A ─┬─► Exa Search ─► Raw Results                     │
│     Module B ─┤                                                  │
│     Module C ─┘                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Filter through Gemini (per module, parallel)                 │
│     Raw Results ─► GeminiFilterModule ─► Filtered Findings       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Synthesize findings using Claude                             │
│     Combined Findings ─► Claude Synthesis ─► Answer              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Need more info? (max 3 iterations)                           │
│     Yes ─► Refine query ─► Loop back to Step 1                  │
│     No  ─► Return final answer                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 25. COMPONENT QUICK REFERENCE

| Component | File Path | Lines | Key Purpose |
|-----------|-----------|-------|-------------|
| SummaryQueryBuilder | `src/api-clients/SummaryQueryBuilder.js` | 239 | Context-aware extraction prompts |
| MCP Protocol Handler | `src/server/EnhancedLegalMcpServer.js` | ~600 | Tool request routing |
| Conversation History | `src/server/claude-server-v2.js` | 57-107 | Multi-turn context management |
| Token Management | `src/tools/toolImplementations.js` | 115-165 | Parameter capping |
| Exa Integration | `src/api-clients/BaseWebSearchClient.js` | ~856 | Search with retry/timeout |
| Content Strategies | `src/api-clients/ContentStrategy.js` | ~260 | Extraction methodology routing |
| JSON Schemas | `src/api-clients/schemas/*.js` | 5,954 | Structured extraction patterns |
| Hybrid Routing | `src/api-clients/BaseHybridClient.js` | ~500 | Native + WebSearch routing |
| Conversation Bridge | `src/modules/conversation-bridge/` | ~177 | Dual-write logging |
| Orchestrator | `src/server/ClaudeOrchestrator.js` | ~400 | Gemini-powered filtering |

---

## 26. NATIVE API CLIENTS REFERENCE

### 26.1 Overview

The system includes direct API clients for government data sources that support structured queries. These are used by Hybrid clients as the primary data source before falling back to web search.

### 26.2 Client Inventory

| Client | File | API | Key Methods |
|--------|------|-----|-------------|
| `CourtListenerClient` | `courtlistenerClient.js` | CourtListener REST API | `searchCases()`, `getCaseDetails()`, `lookupCitation()`, `searchJudges()`, `getJudgeDetails()`, `getCourtInfo()`, `listCourts()`, `searchOpinions()`, `getOpinionWithCitations()`, `searchAudio()`, `getAudioDetails()`, `searchDockets()` |
| `SecEdgarClient` | `SecEdgarClient.js` | SEC EDGAR API | `searchSECFilings()`, `getSECCompanyFacts()`, `getSECXBRLFrames()`, `searchSECCompanyTickers()` |
| `FDAClient` | `FDAClient.js` | openFDA API | `searchDrugAdverseEvents()`, `searchDeviceEvents()`, `searchDrugLabels()`, `searchRecalls()` |
| `GovInfoClient` | `GovInfoClient.js` | GovInfo API | `searchUSCode()`, `getUSCSection()`, `getUSCTitleStructure()`, `listUSCTitles()` |
| `UsptoClient` | `UsptoClient.js` | USPTO PatentsView API | `searchPatents()` (patents, inventors, assignees) |
| `FederalRegisterClient` | `FederalRegisterClient.js` | Federal Register API | `searchDocuments()`, `getDocument()` |
| `NHTSAClient` | `NHTSAClient.js` | NHTSA VPIC API | `decodeVin()`, `getRecallsByMakeModelYear()` |
| `PTABClient` | `PTABClient.js` | PTAB E2E API | `searchIPRProceedings()`, `searchPGRProceedings()` |
| `CPSCClient` | `CPSCClient.js` | CPSC API | `searchRecalls()` |

### 26.3 CourtListenerClient Implementation Details

**File**: `src/api-clients/courtlistenerClient.js` (~731 lines)

**Core Methods**:
- Case search with pagination (`fetch_all_pages` support)
- Judge search with political affiliation filtering
- Court listing by jurisdiction
- Opinion search with citation depth (1-3 levels)
- Oral argument audio with transcript support
- Docket search by case name, party, or docket number
- Financial disclosure methods (judicial disclosures)

**API Patterns**:
```javascript
// Search with pagination
async searchCases(args) {
  const { query, court, limit = 10, fetch_all_pages = false } = args;

  const params = {
    q: query,
    type: 'o',  // Opinion search
    order_by: 'score desc',
    limit: fetch_all_pages ? 20 : validatedLimit
  };

  if (fetch_all_pages) {
    results = await fetchAllPages('/search/', params, Math.ceil(limit / 20));
  }
}
```

### 26.4 SecEdgarClient Implementation Details

**File**: `src/api-clients/SecEdgarClient.js` (~336 lines)

**CIK Resolution Flow**:
```javascript
// 1. Resolve company identifier to CIK
const cik = await resolveToCIK(company_identifier, rateLimiter);

// 2. Fetch submissions (columnar format)
const submissionsResponse = await makeSECApiRequest(
  `/submissions/CIK${cik.padStart(10, '0')}.json`
);

// 3. Convert columnar to row format
const numFilings = recentFilingsData.form?.length || 0;
for (let i = 0; i < numFilings; i++) {
  recentFilings.push({
    accessionNumber: recentFilingsData.accessionNumber?.[i],
    filingDate: recentFilingsData.filingDate?.[i],
    // ...
  });
}
```

**XBRL Frames Period Formatting**:
```javascript
// Accepts: CY2021, CY2021Q1, CY2021Q4I (I = instant)
if (/^\d{4}$/.test(period)) {
  formattedPeriod = `CY${period}Q4I`;  // Year → year-end instant
}
```

### 26.5 FDAClient Implementation Details

**File**: `src/api-clients/FDAClient.js` (~94 lines)

**Endpoints**:
| Method | Endpoint | Dataset |
|--------|----------|---------|
| `searchDrugAdverseEvents()` | `/drug/event.json` | FAERS |
| `searchDeviceEvents()` | `/device/event.json` | MAUDE |
| `searchDrugLabels()` | `/drug/label.json` | SPL |
| `searchRecalls()` | `/{area}/enforcement.json` | Enforcement Reports |

**Query Building**:
```javascript
buildOpenFdaParams({ search, limit = 2, skip = 0, sort, count, api_key }) {
  const params = {};
  if (search) params.search = search;  // openFDA Lucene-like query
  if (limit) params.limit = Math.min(Number(limit), 100);
  // ...
}
```

### 26.6 GovInfoClient Implementation Details

**File**: `src/api-clients/GovInfoClient.js` (~537 lines)

**USC Search Strategies**:
1. **Text Search**: Uses `/search` POST endpoint with `collection:(USCODE)` filter
2. **Browse**: Uses `/collections/USCODE/{year}` for structured queries

**Section Lookup Optimization**:
```javascript
// Smart batch sizing based on section number patterns
const sectionNum = parseInt(section.match(/\d+/)?.[0] || '0');

if (sectionNum >= 1100 && sectionNum < 1200 && title === 11) {
  batchSize = 500;  // Title 11 Chapter 11 sections are ~position 400+
} else if (sectionNum >= 1000) {
  batchSize = 300;  // Higher sections tend to be later
} else if (sectionNum >= 500) {
  batchSize = 200;  // Mid-range sections
} else {
  batchSize = 100;  // Lower sections are usually early
}
```

**Full Text Extraction Note**:
```javascript
// FULL TEXT EXTRACTION TEMPORARILY DISABLED
// Issue: USC titles are 8-20MB each, causing system overload
// TODO: Implement granular section fetching before re-enabling
```

### 26.7 UsptoClient Implementation Details

**File**: `src/api-clients/UsptoClient.js` (~200+ lines)

**Query Types**:
| Type | Endpoint | Fields |
|------|----------|--------|
| `patents` | `/patent/` | patent_id, patent_title, patent_date, assignees, inventors |
| `inventors` | `/inventor/` | inventor_id, name, num_patents |
| `assignees` | `/assignee/` | assignee_id, organization, num_patents |

**Patent Number Detection**:
```javascript
// Detect patent number formats:
// - 7 or 8 digit numbers: 5123456, 10123456
// - With kind codes: 10123456B2
// - Design patents: D890123
if (/^D?\d{6,8}[A-Z]?\d?$/i.test(cleanedText)) {
  conditions.push({ patent_id: cleanedText });  // Direct lookup
} else {
  conditions.push({ _text_any: { patent_title: search_text }});  // Text search
}
```

**CPC Classification Filtering**:
```javascript
if (technology_area.includes('/')) {
  // Full subgroup code: use exact match
  conditions.push({ "cpcs.cpc_subgroup_id": technology_area });
} else {
  // Section/class/subclass: use prefix match
  conditions.push({ _begins: { "cpcs.cpc_subgroup_id": technology_area }});
}
```

---

## 27. ERROR HANDLING ARCHITECTURE

### 27.1 Overview

**File**: `src/utils/errorHandling.js` (~260 lines)

Provides graceful error handling, classification, and logging for expected API failures that trigger fallback mechanisms.

### 27.2 APIError Class

```javascript
export class APIError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.isExpected = options.isExpected || false;
    this.isRetryable = options.isRetryable !== undefined ? options.isRetryable : true;
    this.category = options.category || 'unknown';
    this.context = options.context || {};
    this.willFallback = options.willFallback || false;
  }

  isAPILimitation() {
    return this.isExpected && this.willFallback;
  }

  getUserMessage() {
    if (this.isAPILimitation()) {
      return `Using web search (native API doesn't support this query type)`;
    }
    return this.message;
  }

  getLogLevel() {
    if (this.isAPILimitation()) return 'debug';
    if (this.willFallback) return 'warn';
    return 'error';
  }
}
```

### 27.3 HTTP Error Classification

```javascript
export function classifyHTTPError(statusCode, endpoint, params) {
  const classifications = {
    400: {
      isExpected: detectExpectedBadRequest(endpoint, params),
      category: 'api_limitation',
      isRetryable: false,
      willFallback: true
    },
    401: { isExpected: false, category: 'authentication', isRetryable: false, willFallback: false },
    403: { isExpected: false, category: 'authorization', isRetryable: false, willFallback: false },
    404: { isExpected: false, category: 'not_found', isRetryable: false, willFallback: true },
    429: { isExpected: true, category: 'rate_limit', isRetryable: true, willFallback: false },
    500: { isExpected: false, category: 'server_error', isRetryable: true, willFallback: true },
    502: { isExpected: false, category: 'bad_gateway', isRetryable: true, willFallback: true },
    503: { isExpected: false, category: 'service_unavailable', isRetryable: true, willFallback: true },
    504: { isExpected: false, category: 'gateway_timeout', isRetryable: true, willFallback: true }
  };
  return classifications[statusCode] || { isExpected: false, category: 'unknown' };
}
```

### 27.4 Expected API Limitation Detection

```javascript
function detectExpectedBadRequest(endpoint, params) {
  // Federal Register known limitations
  if (endpoint.includes('federalregister.gov')) {
    // Agency + document number combo not supported
    if (params.has('conditions[agencies][]') && params.has('conditions[term]')) {
      return true;
    }
    // Full agency names not supported (expects abbreviations)
    const agencyParam = params.get('conditions[agencies][]');
    if (agencyParam && agencyParam.length > 10) {
      return true;
    }
  }

  // GovInfo known limitations
  if (endpoint.includes('api.govinfo.gov')) {
    // Package ID format issues
    if (!params.get('packageId')?.match(/^[A-Z]+-\d{4}-title\d+$/)) {
      return true;
    }
  }
  return false;
}
```

### 27.5 Log Level Routing

```javascript
export function logError(error, context = {}) {
  const level = error.getLogLevel ? error.getLogLevel() : 'error';

  switch (level) {
    case 'debug':
      // Only log in verbose mode for expected limitations
      if (process.env.VERBOSE_LOGGING === 'true') {
        console.debug(`[API Limitation] ${error.message}`);
      }
      break;
    case 'warn':
      console.warn(`[API Warning] ${error.getUserMessage?.() || error.message}`);
      break;
    case 'error':
    default:
      console.error(`[API Error] ${error.message}`, { context, category: error.category });
      break;
  }
}
```

### 27.6 Graceful Error Wrapper

```javascript
export async function withGracefulError(operation, context = {}) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof APIError) {
      logError(error, context);
      throw error;
    }
    // Wrap unknown errors
    const wrappedError = new APIError(error.message, error.statusCode || 500, {
      isExpected: false,
      category: 'unknown',
      context: { ...context, originalError: error.name }
    });
    logError(wrappedError, context);
    throw wrappedError;
  }
}
```

### 27.7 Client Error Messages

```javascript
export function createClientErrorMessage(error, fallbackAvailable = false) {
  if (error instanceof APIError && error.isAPILimitation()) {
    return {
      error: false,  // Not actually an error from user perspective
      message: error.getUserMessage(),
      details: {
        native_api_limitation: true,
        using_fallback: fallbackAvailable,
        category: error.category
      }
    };
  }
  return {
    error: true,
    message: error.message,
    details: { category: error.category, retryable: error.isRetryable }
  };
}
```

---

## 28. CITATIONVALIDATOR UTILITY

### 28.1 Overview

**File**: `src/utils/CitationValidator.js` (~634 lines)

Comprehensive legal citation validation, parsing, and formatting utility supporting Bluebook and ALWD citation standards.

### 28.2 Citation Pattern Categories

| Category | Pattern Examples |
|----------|------------------|
| Federal Cases | `Brown v. Board of Education, 347 U.S. 483 (1954)` |
| State Cases | `People v. Smith, 123 Cal.App.4th 456 (2004)` |
| Federal Statutes | `42 U.S.C. § 1983`, `15 U.S.C. § 78j(b)` |
| CFR Regulations | `17 C.F.R. § 240.10b-5` |
| Federal Register | `89 Fed. Reg. 12345 (Jan. 15, 2024)` |
| Public Laws | `Pub. L. No. 117-169` |
| Patents | `U.S. Patent No. 7,123,456` |

### 28.3 Core Validation Methods

```javascript
export class CitationValidator {
  constructor() {
    this.patterns = {
      federal_case: /(\d+)\s+U\.S\.\s+(\d+)/,
      federal_statute: /(\d+)\s+U\.S\.C\.\s+§\s*(\d+)/,
      cfr: /(\d+)\s+C\.F\.R\.\s+§\s*([\d.]+)/,
      federal_register: /(\d+)\s+Fed\.\s+Reg\.\s+(\d+)/,
      public_law: /Pub\.\s+L\.\s+No\.\s+(\d+-\d+)/,
      patent: /U\.S\.\s+Patent\s+No\.\s+([\d,]+)/
    };
  }

  validate(citation) {
    const results = {
      isValid: false,
      type: null,
      parsed: null,
      errors: [],
      warnings: []
    };

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const match = citation.match(pattern);
      if (match) {
        results.isValid = true;
        results.type = type;
        results.parsed = this._parseMatch(type, match);
        break;
      }
    }

    // Check for placeholder patterns
    if (this._hasPlaceholder(citation)) {
      results.warnings.push('Citation contains placeholder text');
    }

    return results;
  }
}
```

### 28.4 Placeholder Detection

```javascript
_hasPlaceholder(citation) {
  const placeholders = [
    /\[.*?\]/,           // [cite]
    /\{.*?\}/,           // {reference}
    /XX+/,               // XXX
    /\?\?+/,             // ???
    /TBD/i,              // TBD
    /INSERT|PLACEHOLDER/i
  ];
  return placeholders.some(p => p.test(citation));
}
```

### 28.5 Citation Formatting

```javascript
formatCitation(parsed, style = 'bluebook') {
  switch (parsed.type) {
    case 'federal_case':
      return `${parsed.volume} U.S. ${parsed.page} (${parsed.year})`;
    case 'federal_statute':
      return `${parsed.title} U.S.C. § ${parsed.section}`;
    case 'cfr':
      return `${parsed.title} C.F.R. § ${parsed.part}`;
    // ...
  }
}
```

### 28.6 Table of Authorities Generation

```javascript
generateTableOfAuthorities(citations) {
  const grouped = {
    cases: [],
    statutes: [],
    regulations: [],
    other: []
  };

  for (const citation of citations) {
    const validated = this.validate(citation);
    if (validated.isValid) {
      const category = this._getCategory(validated.type);
      grouped[category].push({
        original: citation,
        formatted: this.formatCitation(validated.parsed),
        type: validated.type
      });
    }
  }

  // Sort each category alphabetically
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.formatted.localeCompare(b.formatted));
  }

  return grouped;
}
```

### 28.7 Bulk Validation

```javascript
validateBulk(citations) {
  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    statistics: {
      total: citations.length,
      validCount: 0,
      invalidCount: 0,
      byType: {}
    }
  };

  for (const citation of citations) {
    const result = this.validate(citation);
    if (result.isValid) {
      results.valid.push({ citation, ...result });
      results.statistics.validCount++;
      results.statistics.byType[result.type] =
        (results.statistics.byType[result.type] || 0) + 1;
    } else {
      results.invalid.push({ citation, errors: result.errors });
      results.statistics.invalidCount++;
    }
  }

  return results;
}
```

---

## 29. GEMINI FILTER PROMPTS REFERENCE

### 29.1 Overview

**File**: `src/filters/prompts/index.js` (exports), individual files per domain

12 domain-specific system prompts optimized for Gemini 2.5 Flash extraction.

### 29.2 Prompt Design Principles

1. **Explicit extraction targets with examples**
2. **Structured output format specification**
3. **Priority ordering (most important first)**
4. **Length constraints to control output tokens**
5. **Citation requirements for traceability**

### 29.3 Domain Prompts Inventory

| File | Export | Domain | Key Extraction Targets |
|------|--------|--------|------------------------|
| `securities.js` | `SECURITIES_PROMPT` | SEC filings | CIK, accession numbers, financial metrics, risk factors, material events |
| `pharmaceutical.js` | `PHARMACEUTICAL_PROMPT` | FDA data | Report IDs, drug names, adverse reactions, severity, patient outcomes |
| `environmental.js` | `ENVIRONMENTAL_PROMPT` | EPA compliance | Registry IDs, facility info, violations, enforcement actions |
| `caseLaw.js` | `CASE_LAW_PROMPT` | Court opinions | Case names, citations, holdings, precedents, judges |
| `legislation.js` | `LEGISLATION_PROMPT` | USC statutes | Title, section, effective dates, key provisions |
| `federalRegister.js` | `FEDERAL_REGISTER_PROMPT` | Rules/notices | Document numbers, agencies, effective dates, RINs |
| `patent.js` | `PATENT_PROMPT` | USPTO patents | Patent numbers, inventors, assignees, CPC codes, claims |
| `patentAppeals.js` | `PATENT_APPEALS_PROMPT` | PTAB proceedings | IPR/PGR numbers, patent at issue, petitioner, status |
| `productSafety.js` | `PRODUCT_SAFETY_PROMPT` | CPSC/NHTSA | Recall numbers, products, hazards, remedies |
| `antitrust.js` | `ANTITRUST_PROMPT` | FTC enforcement | Case numbers, parties, violations, remedies |
| `stateCourts.js` | `STATE_COURTS_PROMPT` | State court rules | Court rules, local procedures, filing requirements |
| `stateStatutes.js` | `STATE_STATUTES_PROMPT` | State laws | State code citations, effective dates, amendments |

### 29.4 Securities Prompt Example (Detailed)

```javascript
export const SECURITIES_PROMPT = `You are a securities law extraction specialist...

EXTRACTION TARGETS (in priority order):

1. COMPANY IDENTIFIERS
   - Ticker symbol (e.g., AAPL, MSFT)
   - CIK number (10-digit, e.g., 0000320193)
   - Legal entity name
   - Fiscal year end

2. FILING METADATA
   - Form type (10-K, 10-Q, 8-K, DEF 14A, S-1, etc.)
   - Filing date
   - Period end date
   - Accession number

3. FINANCIAL METRICS (with YoY comparison if available)
   - Total revenue / Net sales
   - Net income / Loss
   - Earnings per share (basic and diluted)
   - Total assets
   - Total liabilities
   - Stockholders' equity
   - Cash and equivalents

4. RISK FACTORS
   - New risks added this period (flag as NEW)
   - Material changes to existing risks
   - Verbatim excerpts (first 200 chars)
   - Categories: operational, financial, regulatory, competitive, cyber, legal

5. MATERIAL EVENTS (8-K triggers)
   - M&A activity
   - Executive changes
   - Material contracts
   - Bankruptcy/receivership

LEGAL ANALYSIS CONTEXT:
- TSC Industries v. Northway (materiality standard)
- Basic Inc. v. Levinson (probability × magnitude test)
- SAB 99 qualitative factors

MAX OUTPUT: 1500 tokens
PROVENANCE REQUIREMENTS (MANDATORY):
- ALWAYS include CIK number (10-digit format)
- ALWAYS include accession number for each filing cited`;
```

### 29.5 Domain-to-Client Mapping

```javascript
export const DOMAIN_CLIENT_MAPPING = {
  securities: ['secWeb'],
  pharmaceutical_safety: ['fdaWeb', 'fdaHybrid'],
  environmental: ['epa', 'epaWeb'],
  case_law: ['courtListenerWeb', 'courtListener'],
  legislation: ['govInfo'],
  federal_register: ['federalRegisterWeb'],
  product_safety: ['cpsc', 'nhtsaWeb'],
  antitrust: ['ftcWeb'],
  patent: ['uspto', 'usptoWeb'],
  patent_appeals: ['ptabWebSearch'],
  state_courts: ['stateCourtRules'],
  state_statutes: ['stateStatute']
};
```

### 29.6 Lazy Loading Pattern

```javascript
// Prompts loaded asynchronously to avoid circular dependencies
import('./securities.js').then(m => DOMAIN_PROMPTS.securities = m.SECURITIES_PROMPT);
import('./pharmaceutical.js').then(m => DOMAIN_PROMPTS.pharmaceutical_safety = m.PHARMACEUTICAL_PROMPT);
// ...
```

---

## 30. HEALTHMONITOR DEEP DIVE

### 30.1 Overview

**File**: `src/modules/conversation-bridge/core/HealthMonitor.js` (~259 lines)

Tracks conversation bridge performance metrics without requiring external telemetry dependencies.

### 30.2 Core Configuration

```javascript
export class HealthMonitor {
  constructor(options = {}) {
    this.config = {
      checkInterval: options.checkInterval || 300000,        // 5 minutes
      successRateThreshold: options.successRateThreshold || 90,  // 90%
      responseTimeThreshold: options.responseTimeThreshold || 1000  // 1 second
    };

    this.metrics = {
      totalAttempts: 0,
      successfulLogs: 0,
      failedLogs: 0,
      avgResponseTime: 0,
      lastHealthCheck: Date.now(),
      responseTimes: []  // Rolling window of last 100
    };
  }
}
```

### 30.3 Metric Recording Methods

```javascript
recordAttempt() {
  this.metrics.totalAttempts++;
}

recordSuccess(responseTime) {
  this.metrics.successfulLogs++;
  this.updateResponseTime(responseTime);
}

recordFailure() {
  this.metrics.failedLogs++;
}

updateResponseTime(responseTime) {
  // Keep last 100 response times for moving average
  this.metrics.responseTimes.push(responseTime);
  if (this.metrics.responseTimes.length > 100) {
    this.metrics.responseTimes.shift();
  }

  const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
  this.metrics.avgResponseTime = sum / this.metrics.responseTimes.length;
}
```

### 30.4 Health Check Alerts

```javascript
checkForAlerts(health) {
  const successRate = parseFloat(health.conversation_bridge.success_rate);
  const avgResponseTime = health.conversation_bridge.avg_response_time_ms;

  // Critical: < 85% success rate
  if (successRate < 85) {
    console.error('🚨 CRITICAL: Conversation bridge success rate critically low', {
      success_rate: successRate,
      threshold: 85,
      recommendation: 'Investigate Supabase connectivity issues immediately'
    });
  }
  // Warning: < 90% success rate
  else if (successRate < this.config.successRateThreshold) {
    console.warn('⚠️ WARNING: Conversation bridge success rate degraded');
  }

  // Warning: High response time
  if (avgResponseTime > this.config.responseTimeThreshold) {
    console.warn('⚠️ WARNING: Response time high', {
      avg_response_time_ms: avgResponseTime,
      threshold_ms: this.config.responseTimeThreshold
    });
  }

  // Alert: Circuit breaker open
  if (health.conversation_bridge.circuit_breaker.status === 'OPEN') {
    console.error('🚨 ALERT: Conversation bridge circuit is OPEN');
  }
}
```

### 30.5 Health Status Determination

```javascript
determineHealthStatus(metrics) {
  if (metrics.successRate < 85) return 'critical';
  if (metrics.successRate < this.config.successRateThreshold) return 'degraded';
  if (metrics.avgResponseTime > this.config.responseTimeThreshold) return 'degraded';
  return 'healthy';
}

getHealthSummary() {
  const metrics = this.getMetrics();
  return {
    status: this.determineHealthStatus(metrics),  // 'healthy' | 'degraded' | 'critical'
    metrics,
    alerts: this.getActiveAlerts(metrics),
    last_check: new Date(this.metrics.lastHealthCheck).toISOString()
  };
}
```

### 30.6 Periodic Health Checks

```javascript
start(healthCallback) {
  this.healthCallback = healthCallback;
  this.performHealthCheck();  // Initial check

  this.intervalId = setInterval(() => {
    this.performHealthCheck();
  }, this.config.checkInterval);

  console.log(`✅ Health monitoring started (${this.config.checkInterval}ms intervals)`);
}

stop() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
  console.log('✅ Health monitoring stopped');
}
```

---

## 31. CACHE MANAGEMENT SYSTEM

### 31.1 Overview

**File**: `src/utils/cache.js` (~217 lines)

In-memory TTL-based cache with automatic cleanup and statistics tracking.

### 31.2 Core Implementation

```javascript
class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 300000;  // 5 minutes
    this.maxSize = options.maxSize || 1000;
    this.cleanupInterval = options.cleanupInterval || 60000;  // 1 minute

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    // Start cleanup timer
    this._startCleanup();
  }
}
```

### 31.3 Cache Operations

```javascript
get(key) {
  const entry = this.cache.get(key);

  if (!entry) {
    this.stats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    this.cache.delete(key);
    this.stats.misses++;
    return null;
  }

  this.stats.hits++;
  return entry.value;
}

set(key, value, ttl = this.defaultTTL) {
  // Evict oldest if at capacity
  if (this.cache.size >= this.maxSize) {
    const oldestKey = this.cache.keys().next().value;
    this.cache.delete(oldestKey);
    this.stats.evictions++;
  }

  this.cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  });

  this.stats.sets++;
}

delete(key) {
  return this.cache.delete(key);
}

clear() {
  this.cache.clear();
}
```

### 31.4 Key Generation

```javascript
generateKey(endpoint, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}
```

### 31.5 Automatic Cleanup

```javascript
_startCleanup() {
  this.cleanupTimerId = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }, this.cleanupInterval);
}

destroy() {
  if (this.cleanupTimerId) {
    clearInterval(this.cleanupTimerId);
  }
  this.cache.clear();
}
```

### 31.6 Statistics & Monitoring

```javascript
getStats() {
  const total = this.stats.hits + this.stats.misses;
  return {
    hits: this.stats.hits,
    misses: this.stats.misses,
    sets: this.stats.sets,
    evictions: this.stats.evictions,
    hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
    size: this.cache.size,
    maxSize: this.maxSize
  };
}
```

### 31.7 Singleton Pattern

```javascript
let instance = null;

export function getCacheInstance(options = {}) {
  if (!instance) {
    instance = new CacheManager(options);
  }
  return instance;
}

export function resetCacheInstance(options = {}) {
  if (instance) {
    instance.destroy();
  }
  instance = new CacheManager(options);
  return instance;
}
```

---

## 32. CONTENT STRATEGY SCHEMA REGISTRY

### 32.1 Overview

The `ContentStrategy` class (Section 4.3) maintains an internal `schemaRegistry` that maps data types to JSON Schema v7 definitions for structured extraction.

### 32.2 Schema Registry Structure

```javascript
export class ContentStrategy {
  constructor(schemaRegistry = null) {
    this.schemaRegistry = schemaRegistry || {};
  }

  registerSchema(dataType, schema) {
    this.schemaRegistry[dataType] = schema;
  }

  getSchema(dataType) {
    return this.schemaRegistry[dataType] || null;
  }
}
```

### 32.3 Registered Data Types

| Data Type | Schema File | Usage |
|-----------|-------------|-------|
| `sec_filing` | `SECSchemas.js` | SEC filing metadata extraction |
| `sec_financial` | `SECSchemas.js` | Financial metrics extraction |
| `patent` | `USPTOSchemas.js` | Patent metadata extraction |
| `patent_classification` | `USPTOSchemas.js` | CPC code extraction |
| `epa_facility` | `EPASchemas.js` | Facility information |
| `epa_compliance` | `EPASchemas.js` | Compliance/violation data |
| `fda_adverse_event` | `FDASchemas.js` | Drug adverse events |
| `fda_device_event` | `FDASchemas.js` | Device events |
| `fda_recall` | `FDASchemas.js` | Recall information |
| `nhtsa_recall` | `NHTSASchemas.js` | Vehicle recalls |
| `court_case` | `CourtListenerSchemas.js` | Case information |
| `statute` | `GovInfoSchemas.js` | Statute details |
| `usc_search_result` | `GovInfoSchemas.js` | USC search results |
| `usc_section` | `GovInfoSchemas.js` | Full USC section |
| `usc_title_structure` | `GovInfoSchemas.js` | Title structure |

### 32.4 Schema Selection Logic

```javascript
determine(options) {
  const { dataType, query, limit, includeFullText, comprehensive } = options;

  // Priority 1: Full text for low-limit or explicit request
  if (includeFullText || limit < 2) {
    return this._createTextConfig();
  }

  // Priority 2: Comprehensive mode
  if (comprehensive) {
    return this._createTextWithSummary(query);
  }

  // Priority 3: Schema-based extraction (if registered)
  if (dataType && this.schemaRegistry[dataType]) {
    return this._createSummaryWithSchema(dataType, query);
  }

  // Priority 4/5: Summary query fallback
  return this._createSummaryQuery(query);
}
```

### 32.5 Schema Query Generation

```javascript
_generateSchemaQuery(dataType, originalQuery) {
  const queries = {
    'sec_filing': 'Extract SEC filing metadata including accession number, filing date, form type, and company information',
    'sec_financial': 'Extract financial metrics including revenue, net income, total assets, and reporting period',
    'patent': 'Extract patent metadata including patent number, title, inventors, assignee, filing date, and CPC classifications',
    'epa_facility': 'Extract facility information including registry ID, name, location, and violation history',
    'fda_adverse_event': 'Extract drug adverse event details including product name, reactions, and outcomes',
    'court_case': 'Extract case information including case number, parties, date, and citation',
    'usc_section': 'Extract complete USC section information including title number, section number, official USC citation, full section text, and any subsections',
    'default': `Extract key information related to: ${originalQuery}`
  };
  return queries[dataType] || queries['default'];
}
```

---

## 33. CIRCUIT BREAKER INTEGRATION POINTS

### 33.1 Overview

The `CircuitBreaker` pattern (Section 14) is integrated at three key points in the architecture:

### 33.2 GeminiFilterModule Integration

**File**: `src/filters/GeminiFilterModule.js`

```javascript
export class GeminiFilterModule {
  constructor(domain, config) {
    // Per-domain circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: geminiConfig.circuitBreaker.failureThreshold,  // 3
      resetTimeout: geminiConfig.circuitBreaker.resetTimeout,          // 30000ms
      maxConsecutiveFailures: geminiConfig.circuitBreaker.maxConsecutiveFailures  // 5
    });
  }

  async processAndFilter(rawResults, extractionInstructions) {
    // Check circuit breaker before processing
    if (this.circuitBreaker.isOpen()) {
      console.warn(`[GeminiFilter:${this.domain}] Circuit breaker open, using fallback`);
      return this.fallbackToLimitedPreview(rawResults);
    }

    try {
      const result = await this.model.generateContent({...});
      this.circuitBreaker.recordSuccess();  // Reset on success
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();  // Track failure
      return this.fallbackToLimitedPreview(rawResults);
    }
  }
}
```

### 33.3 ConversationBridge Integration

**File**: `src/modules/conversation-bridge/core/ConversationBridge.js`

```javascript
export class ConversationBridge {
  constructor(supabaseClient, options = {}) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 30000,
      maxConsecutiveFailures: options.maxConsecutiveFailures || 5
    });
  }

  async logToolCall(toolName, args, result, conversationId) {
    // Non-blocking: Check circuit before logging
    if (conversationId && !this.circuitBreaker.isOpen()) {
      this.healthMonitor.recordAttempt();
      setImmediate(() => this.logToConversationSafe(toolName, args, result, conversationId));
    }
    return result;  // Critical path never blocked
  }

  async logToConversationSafe(toolName, args, result, conversationId) {
    try {
      const startTime = Date.now();
      await this.supabase.from('conversation_messages').insert({...});
      this.circuitBreaker.recordSuccess();
      this.healthMonitor.recordSuccess(Date.now() - startTime);
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.healthMonitor.recordFailure();
      console.error('Conversation logging failed (non-critical):', error.message);
    }
  }
}
```

### 33.4 BaseHybridClient Integration

**File**: `src/api-clients/BaseHybridClient.js`

```javascript
export class BaseHybridClient {
  constructor(nativeClient, webSearchClient, options = {}) {
    this.circuitBreaker = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      threshold: 5,
      timeout: 300000  // 5 minutes
    };
  }

  async executeWithFallback(nativeMethod, webSearchMethod, args) {
    // Skip native if circuit is open
    if (this.circuitBreaker.state === 'open') {
      if (Date.now() - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'half-open';  // Allow one test request
      } else {
        return webSearchMethod(args);  // Direct to fallback
      }
    }

    try {
      const result = await nativeMethod(args);
      this.circuitBreaker.failures = 0;
      if (this.circuitBreaker.state === 'half-open') {
        this.circuitBreaker.state = 'closed';
      }
      return result;
    } catch (error) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = Date.now();

      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.state = 'open';
        console.warn('Circuit breaker opened for native API');
      }

      return webSearchMethod(args);  // Fallback
    }
  }
}
```

### 33.5 Circuit Breaker Status Exposure

```javascript
// GeminiFilterModule
getStatus() {
  return {
    domain: this.domain,
    geminiAvailable: !!this.model,
    circuitBreaker: this.circuitBreaker.getStatus(),
    rateLimiter: this.rateLimiter.getStatus()
  };
}

// CircuitBreaker
getStatus() {
  return {
    status: this.state.isOpen ? 'OPEN' : 'CLOSED',
    failures: this.state.failures,
    consecutive_failures: this.state.consecutiveFailures,
    last_failure: this.state.lastFailure
  };
}
```

### 33.6 Configuration Summary

| Integration Point | Failure Threshold | Reset Timeout | Max Consecutive |
|-------------------|-------------------|---------------|-----------------|
| GeminiFilterModule | 3 | 30 seconds | 5 |
| ConversationBridge | 3 | 30 seconds | 5 |
| BaseHybridClient | 5 | 5 minutes | - |

---

## 34. ANTHROPIC API REQUEST FORMAT (SDK MIGRATION CRITICAL)

### 34.1 Request Body Structure

**File**: `src/server/claude-server-v2.js` (Lines 1064-1085)

```javascript
const requestBody = {
  model: this.model,                          // 'claude-sonnet-4-5-20250929'
  max_tokens: maxTokens,                      // Default: 8192
  stream: true,                               // Always true for streaming
  system: this.getLegalSystemPrompt(),        // System prompt from file or embedded
  messages: conversationHistory,              // Array of {role, content} objects
  tools: tools.length > 0 ? tools : undefined // MCP tools converted to Anthropic format
};

// Interleaved thinking (optional)
if (this.features.interleaved_thinking) {
  requestBody.thinking = {
    type: 'enabled',
    budget_tokens: Math.min(maxTokens * 3, 12000)
  };
}
```

### 34.2 API Headers

```javascript
getApiHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': this.apiKey,
    'anthropic-version': '2023-06-01'
  };

  const betaFeatures = [];
  if (this.features.interleaved_thinking) {
    betaFeatures.push('interleaved-thinking-2025-05-14');
  }
  if (this.features.fine_grained_streaming) {
    betaFeatures.push('fine-grained-tool-streaming-2025-05-14');
  }
  if (this.features.extended_context) {
    betaFeatures.push('context-1m-2025-08-07');
  }

  if (betaFeatures.length > 0) {
    headers['anthropic-beta'] = betaFeatures.join(',');
  }
  return headers;
}
```

### 34.3 Message Format

```javascript
// User message
{
  role: 'user',
  content: 'Search for SEC filings...'
}

// Assistant message with tool use
{
  role: 'assistant',
  content: [
    { type: 'text', text: 'I will search...' },
    { type: 'tool_use', id: 'tool_123', name: 'search_sec_filings', input: {...} }
  ]
}

// Tool result message
{
  role: 'user',
  content: [{
    type: 'tool_result',
    tool_use_id: 'tool_123',
    content: JSON.stringify(result)
  }]
}
```

### 34.4 Tool Format (MCP to Anthropic Conversion)

```javascript
// MCP format (from listTools())
{
  name: 'search_sec_filings',
  description: 'Search SEC EDGAR filings...',
  inputSchema: {
    type: 'object',
    properties: {
      company_identifier: { type: 'string', description: '...' },
      filing_type: { type: 'string', enum: ['10-K', '10-Q', '8-K', ...] },
      limit: { type: 'number', default: 10 }
    },
    required: ['company_identifier']
  }
}

// Anthropic format (used in API call)
{
  name: 'search_sec_filings',
  description: 'Search SEC EDGAR filings...',
  input_schema: {                              // Note: input_schema not inputSchema
    type: 'object',
    properties: {...},
    required: [...]
  }
}
```

---

## 35. FEATURE FLAGS & BETA HEADERS

### 35.1 Feature Configuration

**File**: `src/server/claude-server-v2.js` (Lines 527-535)

```javascript
this.features = {
  interleaved_thinking: options.enableInterleavedThinking ?? true,      // ENABLED by default
  fine_grained_streaming: options.enableFinegrainedStreaming ?? true,  // ENABLED by default
  extended_context: options.enableExtendedContext ?? (process.env.ENABLE_EXTENDED_CONTEXT !== 'false'),
  session_memory: options.enableSessionMemory ?? false,                 // DISABLED by default
  connection_pooling: options.enableConnectionPooling ?? false,         // DISABLED by default
  gemini_filtering: options.enableGeminiFiltering ?? true              // ENABLED by default
};
```

### 35.2 Beta Feature Strings

| Feature | Beta Header String | Purpose |
|---------|-------------------|---------|
| Interleaved Thinking | `interleaved-thinking-2025-05-14` | Enables thinking blocks in streaming |
| Fine-grained Streaming | `fine-grained-tool-streaming-2025-05-14` | Enhanced tool streaming events |
| Extended Context | `context-1m-2025-08-07` | 1M context window for Claude Sonnet 4.5 |

### 35.3 Model Compatibility

```javascript
// Extended context only available for Claude Sonnet 4.5
if (this.features.extended_context && this.model !== 'claude-sonnet-4-5-20250929') {
  console.warn('⚠️  1M context only available for Claude Sonnet 4');
  this.features.extended_context = false;
}
```

---

## 36. SYSTEM PROMPT MANAGEMENT

### 36.1 Prompt Loading Priority

**File**: `src/server/claude-server-v2.js` (Lines 1732-1748)

```javascript
getLegalSystemPrompt() {
  // Priority: 1. Constructor option → 2. Env var → 3. Default file path
  const promptPath = this.promptFile ||
                    process.env.LEGAL_PROMPT_FILE ||
                    path.join(__dirname, '../../prompts/active.md');

  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, 'utf8');
  }

  console.warn(`Prompt file not found at ${promptPath}, using embedded prompt`);
  return this.getEmbeddedPrompt();
}
```

### 36.2 Embedded Prompt Structure

```markdown
# Expert Legal Research Assistant & Academic Legal Scholar

You are a sophisticated legal research specialist with access to 70+ specialized
legal databases through MCP tools...

## WORKFLOW TRANSPARENCY PROTOCOL
- **Current Phase**: Explicitly state phase (strategy, gathering, analysis, synthesis)
- **Confidence Level**: Rate confidence (low/moderate/high)
- **Tool Selection Rationale**: Explain WHY choosing specific tools
- **Research Progress**: Note established vs. needs investigation

## COMPLEX QUERY DECOMPOSITION
1. FIRST: Extract geographic references
2. SECOND: Extract entity names and classifications
3. THIRD: Identify legal concepts and map to tools

## EXECUTION PROTOCOLS
- When tool returns no results, TRY ALTERNATIVE APPROACHES
- Synthesize findings across multiple sources
- ALWAYS provide citations with provenance
```

### 36.3 Configuration Files

| File | Purpose |
|------|---------|
| `prompts/active.md` | Default production prompt |
| `prompts/memorandum.md` | Legal memo format prompt |
| `prompts/research.md` | Research-focused prompt |

---

## 37. SESSION & STATE MANAGEMENT

### 37.1 ConversationSession Class

**File**: `src/server/claude-server-v2.js` (Lines 42-161)

```javascript
class ConversationSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.conversationHistory = [];
    this.researchContext = {
      entities: new Set(),           // Extracted entities
      toolResults: new Map(),        // Cached tool results
      timeline: [],                  // Research timeline
      lastActivity: Date.now()
    };
    this.createdAt = Date.now();
    this.memoryUsage = 0;
    this.maxMemoryMB = 50;          // Per-session limit
  }

  // Core methods
  addUserMessage(content)           // Add user turn, extract entities
  addAssistantResponse(content, toolCalls)  // Add assistant turn, cache results
  addToolResults(toolResults)       // Add tool result messages
  getContextualHistory(maxTokens)   // Get truncated history for API call
  smartTruncate(history, maxTokens) // LIFO truncation preserving recent
  extractEntities(content)          // Regex-based entity extraction
  cacheToolResults(toolCalls)       // Cache tool results for reuse
  checkMemoryLimit()                // Enforce 50MB limit
}
```

### 37.2 SessionManager Class

```javascript
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.maxSessionAge = 4 * 60 * 60 * 1000;  // 4 hours
    this.maxSessions = 1000;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  generateSessionId()               // crypto.randomBytes(16).toString('hex')
  getSession(sessionId)             // Return existing or null (no auto-create)
  createSession(sessionId)          // Explicit creation only
  cleanup()                         // Remove expired sessions
  cleanupOldest()                   // Remove LRU when at capacity
  getSessionStats()                 // Total, memory, oldest
  destroy()                         // Clear interval, clear sessions
}
```

### 37.3 StreamingSession Class

```javascript
class StreamingSession {
  constructor(sessionId, maxMemoryMB = 100) {
    this.sessionId = sessionId;
    this.activeTasks = new Map();
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.startTime = Date.now();
    this.maxDuration = 30 * 60 * 1000;  // 30 minutes
    this.maxTasks = 50;

    // Cleanup every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.checkLimits();
      this.cleanupCompletedTasks();
    }, 10000);
  }

  checkLimits()                     // Enforce time/memory/task limits
  cleanupCompletedTasks()           // Remove completed tasks
  cleanupOldestTasks()              // Remove oldest 10 tasks
  addTask(id, task)                 // Register new task
  markTaskCompleted(id)             // Mark task done
  terminate()                       // Full cleanup
  getStats()                        // Session statistics
}
```

---

## 38. GRACEFUL SHUTDOWN HANDLING

### 38.1 Shutdown Handler

**File**: `src/server/claude-server-v2.js` (Lines 2831-2865)

```javascript
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // 2. Cleanup session manager
  if (research.sessionManager) {
    research.sessionManager.destroy();
    console.log('✅ Session manager destroyed');
  }

  // 3. Cleanup MCP connection pool
  if (research.mcpPool) {
    await research.mcpPool.destroy();
    console.log('✅ MCP connection pool destroyed');
  }

  // 4. Cleanup streaming sessions
  for (const [id, session] of research.streamingSessions) {
    session.terminate();
  }
  console.log('✅ Streaming sessions terminated');

  // 5. Exit
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### 38.2 Resource Cleanup Order

1. Stop HTTP server (no new requests)
2. Destroy SessionManager (clear sessions, stop cleanup interval)
3. Destroy MCP connection pool (close all connections)
4. Terminate all streaming sessions
5. Exit process

---

## 39. HEALTH ENDPOINTS

### 39.1 GET /health

**File**: `src/server/claude-server-v2.js` (Lines 2596-2620)

```javascript
app.get('/health', (req, res) => {
  const stats = research.getHealthStats();

  res.json({
    ok: true,
    status: 'healthy',
    model: research.model,
    features: research.features,
    timestamp: new Date().toISOString(),
    version: '3.1.0-BACKWARDS-COMPATIBLE',
    models: { current: research.model },
    legal_coverage: { tools: '70+' },
    performance: {
      uptime_seconds: Math.floor(stats.uptime / 1000),
      request_count: stats.requestCount,
      error_rate: stats.errorRate.toFixed(2) + '%',
      active_sessions: stats.sessions?.totalSessions || 0,
      streaming_sessions: stats.streamingSessions,
      memory_usage_mb: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)
    },
    orchestrator: stats.orchestrator  // Gemini filtering stats
  });
});
```

### 39.2 Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System status and metrics |
| `/api/claude/stream` | GET | Streaming research endpoint |
| `/api/claude/research` | POST | Non-streaming research endpoint |
| `/api/sessions` | POST | Create new session (if enabled) |
| `/api/sessions/:id` | GET | Get session details (if enabled) |
| `/api/sessions/:id` | DELETE | Delete session (if enabled) |

---

## 40. CLIENT INSTANTIATION & REGISTRATION

### 40.1 ClaudeLegalResearch Constructor

**File**: `src/server/claude-server-v2.js` (Lines 469-545)

```javascript
class ClaudeLegalResearch {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = options.model || 'claude-sonnet-4-5-20250929';
    this.promptFile = options.promptFile || process.env.LEGAL_PROMPT_FILE || null;

    // Original MCP client (backwards compatibility)
    this.mcpClient = null;

    // Optional features
    this.mcpPool = options.enableConnectionPooling
      ? new MCPConnectionPool(options.poolSize || 3) : null;
    this.sessionManager = options.enableSessionMemory
      ? new SessionManager() : null;
    this.streamingSessions = new Map();

    // Gemini orchestrator
    this.orchestrator = enableGemini ? new ClaudeOrchestrator({
      sessionManager: this.sessionManager,
      maxIterations: options.maxOrchestratorIterations ?? 3,
      enableGeminiFiltering: true
    }) : null;
  }
}
```

### 40.2 Orchestrator Client Registration

**File**: `src/server/claude-server-v2.js` (Lines 494-525)

```javascript
if (this.orchestrator) {
  // Create rate limiters
  const rateLimiters = new Map();
  for (const [apiType, config] of Object.entries(rateLimiterConfigs)) {
    rateLimiters.set(apiType, { ...config, requests: [] });
  }

  // Register all WebSearch/Hybrid clients
  this.orchestrator.registerClients({
    secHybrid: new SECHybridClient(rateLimiters.get('sec_edgar')),
    fdaWeb: new FDAWebSearchClient(rateLimiters.get('fda')),
    fdaHybrid: new FDAHybridClient(rateLimiters.get('fda')),
    epaHybrid: new EPAHybridClient(rateLimiters.get('epa')),
    courtListenerHybrid: new CourtListenerHybridClient(rateLimiters.get('courtlistener')),
    govInfoHybrid: new GovInfoHybridClient(rateLimiters.get('govinfo')),
    federalRegisterHybrid: new FederalRegisterHybridClient(rateLimiters.get('federal_register')),
    cpscWeb: new CPSCWebSearchClient(rateLimiters.get('cpsc')),
    nhtsaWeb: new NHTSAWebSearchClient(rateLimiters.get('nhtsa')),
    ftcWeb: new FTCWebSearchClient(rateLimiters.get('ftc')),
    ptabWeb: new PTABWebSearchClient(rateLimiters.get('ptab')),
    usptoHybrid: new USPTOHybridClient(rateLimiters.get('uspto')),
    stateCourtRulesWeb: new StateCourtRulesWebSearchClient(rateLimiters.get('exa')),
    stateStatuteWeb: new StateStatuteWebSearchClient(rateLimiters.get('exa'))
  });
}
```

### 40.3 Rate Limiter Configuration Reference

**File**: `src/config/apiConfig.js`

```javascript
export const rateLimiterConfigs = {
  sec_edgar: { maxRequests: 9, windowMs: 1000 },
  federal_register: { maxRequests: 5, windowMs: 1000 },
  uspto: { maxRequests: 40, windowMs: 60000 },
  ptab: { maxRequests: 5, windowMs: 1000 },
  govinfo: { maxRequests: 9, windowMs: 1000 },
  exa: { maxRequests: 5, windowMs: 1000 },
  epa: { maxRequests: 90, windowMs: 60000 },
  fda: { maxRequests: 180, windowMs: 60000 },
  cpsc: { maxRequests: 5, windowMs: 1000 },
  nhtsa: { maxRequests: 5, windowMs: 1000 },
  courtlistener: { maxRequests: 5, windowMs: 1000 },
  ftc: { maxRequests: 5, windowMs: 1000 }
};
```

---

## 41. MCP CONNECTION POOL

### 41.1 MCPConnectionPool Class

**File**: `src/server/claude-server-v2.js` (Lines 249-365)

```javascript
class MCPConnectionPool {
  constructor(poolSize = 3) {
    this.pool = [];
    this.activeConnections = 0;
    this.maxConnections = poolSize;
    this.reconnectAttempts = 0;
    this.maxReconnects = 3;
    this.enabled = true;
  }

  async getConnection() {
    // 1. Try to get existing connection from pool
    if (this.pool.length > 0) {
      const connection = this.pool.pop();
      if (await this.isConnectionAlive(connection)) {
        return connection;
      }
    }

    // 2. Create new connection if under limit
    if (this.activeConnections < this.maxConnections) {
      return this.createConnection();
    }

    // 3. Wait for available connection
    return this.waitForConnection();
  }

  async createConnection() {
    const transport = new StdioClientTransport({
      command: 'bash',
      args: [process.env.MCP_RUNNER_SCRIPT || './run-legal-mcp.sh']
    });

    const client = new MCPClient(
      { name: 'legal-research', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    return client;
  }

  async isConnectionAlive(connection) {
    try {
      await connection.listTools();
      return true;
    } catch {
      return false;
    }
  }

  returnConnection(connection) {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(connection);
    } else {
      this.closeConnection(connection);
    }
  }

  async destroy() {
    this.enabled = false;
    await Promise.allSettled(this.pool.map(c => this.closeConnection(c)));
    this.pool = [];
  }
}
```

### 41.2 Exponential Backoff

```javascript
async exponentialBackoff() {
  const delay = Math.min(
    1000 * Math.pow(2, this.reconnectAttempts),
    10000  // Max 10 seconds
  );
  return new Promise(resolve => setTimeout(resolve, delay));
}
```

---

## 42. SDK MIGRATION CHECKLIST

### 42.1 Critical Components to Migrate

| Component | Current Location | SDK Equivalent |
|-----------|------------------|----------------|
| Tool Definitions | `toolDefinitions.js` | Agent tools |
| Tool Implementations | `toolImplementations.js` | Agent handlers |
| System Prompt | `getLegalSystemPrompt()` | Agent instructions |
| Message Formatting | Manual JSON | SDK message types |
| Streaming Handling | `processStreamWithToolHandling()` | SDK stream handlers |
| Session Management | `ConversationSession` | SDK conversation state |
| Error Handling | `APIError` class | SDK error types |

### 42.2 API Contract Summary

```javascript
// Current API Contract
POST /api/claude/stream?query={query}&sessionId={id}
→ SSE stream with events: thinking, tool_start, tool_update, tool_execute, tool_result, content, progress

POST /api/claude/research
Body: { query, sessionId? }
→ JSON: { text, usage, model, timestamp, sessionId? }

GET /health
→ JSON: { ok, status, model, features, performance, orchestrator }
```

### 42.3 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | Required |
| `EXA_API_KEY` | Exa search API key | Required for web search |
| `GEMINI_API_KEY` | Gemini API key | Required for filtering |
| `LEGAL_PROMPT_FILE` | System prompt path | `prompts/active.md` |
| `ENABLE_GEMINI_FILTERING` | Enable Gemini filtering | `true` |
| `ENABLE_EXTENDED_CONTEXT` | Enable 1M context | `true` |
| `CLAUDE_PORT` | Server port | `8090` |
| `MCP_RUNNER_SCRIPT` | MCP startup script | `./run-legal-mcp.sh` |

### 42.4 Key Abstractions to Preserve

1. **Tool Result Format**: Always `{ content: [{ type: 'text', text: JSON.stringify(...) }] }`
2. **Conversation History**: Array of `{ role, content }` with tool results as user messages
3. **Smart Truncation**: LIFO with 4 chars/token estimation
4. **Entity Extraction**: Regex patterns for companies, cases, judges, patents
5. **Circuit Breaker Pattern**: 3 failures → open → 30s reset → half-open → test
6. **Graceful Degradation**: Gemini fallback → preview mode, Native fallback → web search

---

## 43. FILING TEMPLATE ENGINE

### 43.1 Overview

**File**: `src/utils/FilingTemplateEngine.js` (~729 lines)

The FilingTemplateEngine provides SEC filing draft generation with federal and state court templates. It supports multiple document types and handles template selection, population, and formatting.

### 43.2 Supported Document Types

| Document Type | Template Key | Use Case |
|--------------|--------------|----------|
| Complaint | `complaint` | Civil litigation initiation |
| Motion to Dismiss | `motion_to_dismiss` | Defendant response |
| Motion to Suppress | `motion_to_suppress` | Evidence exclusion |
| Memorandum | `memorandum` | Legal analysis |
| Legal Brief | `brief` | Appellate argument |
| TRO Application | `tro` | Emergency relief |

### 43.3 Core Class Structure

```javascript
class FilingTemplateEngine {
  constructor() {
    this.templates = this.loadTemplates();
    this.stateRules = this.loadStateRules();
  }

  /**
   * Generate a filing document from template
   * @param {string} documentType - Type of document to generate
   * @param {object} params - Template parameters
   * @param {string} jurisdiction - Federal or state code
   * @returns {object} { content, metadata, warnings }
   */
  generateDocument(documentType, params, jurisdiction = 'federal') {
    const template = this.getTemplate(documentType, jurisdiction);
    const populated = this.populateTemplate(template, params);
    const formatted = this.applyFormatting(populated, jurisdiction);
    return {
      content: formatted,
      metadata: this.buildMetadata(documentType, jurisdiction),
      warnings: this.validateCompliance(formatted, jurisdiction)
    };
  }

  getTemplate(documentType, jurisdiction) {
    const key = `${jurisdiction}_${documentType}`;
    return this.templates[key] || this.templates[`federal_${documentType}`];
  }

  populateTemplate(template, params) {
    let content = template;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(placeholder, value || '[REQUIRED]');
    }
    return content;
  }
}
```

### 43.4 Template Parameters

```javascript
const standardParams = {
  // Party Information
  plaintiff_name: 'Required - Full legal name',
  defendant_name: 'Required - Full legal name',
  case_number: 'Optional - Court-assigned number',

  // Court Information
  court_name: 'Required - Full court name',
  district: 'Optional - Judicial district',
  division: 'Optional - Court division',

  // Document-Specific
  filing_date: 'Auto-generated if not provided',
  attorney_name: 'Required - Filing attorney',
  attorney_bar_number: 'Required - Bar ID',
  firm_name: 'Optional - Law firm',

  // Content Sections
  facts_section: 'Required - Statement of facts',
  legal_arguments: 'Required - Legal basis',
  relief_requested: 'Required - Requested remedy'
};
```

### 43.5 SDK Migration Notes

- **Tool Integration**: `generate_filing_draft` tool uses this engine
- **Stateless Design**: Each call is independent, suitable for SDK tool handlers
- **Validation**: Built-in compliance checking for jurisdiction rules
- **Error Handling**: Returns warnings array for incomplete templates

---

## 44. API REQUEST UTILITIES

### 44.1 Overview

**File**: `src/utils/apiHelpers.js` (~602 lines)

Generic API request utilities with retry logic, caching, and error handling. Provides consistent HTTP request patterns across all API clients.

### 44.2 Core Functions

#### fetchWithInsecureSSL

```javascript
/**
 * Fetch with SSL certificate bypass for EPA ECHO API
 * EPA's API has known SSL certificate issues requiring this workaround
 */
export async function fetchWithInsecureSSL(url, options = {}) {
  const https = await import('https');
  const agent = new https.Agent({ rejectUnauthorized: false });

  return fetch(url, {
    ...options,
    agent,
    timeout: options.timeout || 30000
  });
}
```

#### makeApiRequest

```javascript
/**
 * Generic API request wrapper with retry logic
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Max retry attempts (default: 3)
 * @param {number} baseDelay - Base delay for exponential backoff (default: 1000ms)
 */
export async function makeApiRequest(url, options = {}, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'super-legal-mcp/2.0',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 429) {
        // Rate limited - use exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, baseDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
}
```

### 44.3 Pagination Support

```javascript
/**
 * Fetch all pages from a paginated API
 * @param {string} baseUrl - API endpoint
 * @param {object} params - Query parameters
 * @param {string} resultsKey - Key containing results array
 * @param {number} maxPages - Maximum pages to fetch
 */
export async function fetchAllPages(baseUrl, params, resultsKey = 'results', maxPages = 10) {
  const allResults = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const url = new URL(baseUrl);
    Object.entries({ ...params, page }).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );

    const data = await makeApiRequest(url.toString());
    const results = data[resultsKey] || [];
    allResults.push(...results);

    hasMore = results.length > 0 && data.next !== null;
    page++;
  }

  return allResults;
}
```

### 44.4 SEC-Specific Helpers

```javascript
/**
 * Resolve company name or ticker to CIK
 * @param {string} identifier - Company name, ticker, or CIK
 * @returns {string} 10-digit padded CIK
 */
export async function resolveToCIK(identifier) {
  // Direct CIK - just pad it
  if (/^\d+$/.test(identifier)) {
    return identifier.padStart(10, '0');
  }

  // Ticker lookup
  const tickerUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(identifier)}&type=&dateb=&owner=include&count=1&output=atom`;
  const response = await makeApiRequest(tickerUrl);

  // Parse CIK from response
  const cikMatch = response.match(/CIK=(\d+)/);
  return cikMatch ? cikMatch[1].padStart(10, '0') : null;
}

/**
 * Build Federal Register API parameters
 */
export function buildFederalRegisterParams(options) {
  const params = {};

  if (options.agencies) {
    params['conditions[agencies][]'] = options.agencies;
  }
  if (options.type) {
    params['conditions[type][]'] = options.type;
  }
  if (options.startDate) {
    params['conditions[publication_date][gte]'] = options.startDate;
  }
  if (options.endDate) {
    params['conditions[publication_date][lte]'] = options.endDate;
  }

  return params;
}
```

### 44.5 SDK Migration Notes

- **Shared Utilities**: All API clients depend on these helpers
- **Stateless Design**: Pure functions suitable for SDK context
- **Error Propagation**: Throws on failure for caller handling
- **Rate Limit Awareness**: Built-in exponential backoff

---

## 45. SEARCH QUALITY MIXIN

### 45.1 Overview

**File**: `src/api-clients/SearchQualityMixin.js` (~763 lines)

A mixin class providing query relevance assessment, coverage analysis, and quality scoring for all WebSearch clients. Evaluates search result quality and provides improvement suggestions.

### 45.2 Mixin Pattern

```javascript
/**
 * Apply SearchQualityMixin to a WebSearch client
 * @param {class} BaseClass - The WebSearch client class
 * @returns {class} Enhanced class with quality assessment
 */
export function withSearchQuality(BaseClass) {
  return class extends BaseClass {
    constructor(...args) {
      super(...args);
      this.qualityThresholds = {
        excellent: 0.85,
        good: 0.70,
        acceptable: 0.50,
        poor: 0.30
      };
    }

    // Quality assessment methods injected here
  };
}
```

### 45.3 Query Relevance Assessment

```javascript
/**
 * Assess relevance of search results to user query
 * @param {string} userQuery - Original user query
 * @param {array} results - Search results
 * @returns {object} { score, confidence, breakdown }
 */
assessQueryRelevance(userQuery, results) {
  const analysis = this.analyzeUserQuery(userQuery);

  const scores = results.map(result => ({
    termOverlap: this.calculateTermOverlap(analysis.terms, result),
    entityMatch: this.calculateEntityMatch(analysis.entities, result),
    domainAlignment: this.calculateDomainAlignment(analysis.domain, result),
    temporalRelevance: this.calculateTemporalRelevance(analysis.temporal, result)
  }));

  const avgScore = scores.reduce((sum, s) =>
    sum + (s.termOverlap * 0.3 + s.entityMatch * 0.4 +
           s.domainAlignment * 0.2 + s.temporalRelevance * 0.1), 0
  ) / scores.length;

  return {
    score: avgScore,
    confidence: this.calculateConfidence(scores),
    breakdown: { termOverlap, entityMatch, domainAlignment, temporalRelevance },
    suggestions: this.generateSuggestions(analysis, scores)
  };
}
```

### 45.4 Query Type Detection

```javascript
/**
 * Analyze user query to determine intent and type
 */
analyzeUserQuery(query) {
  const queryTypes = {
    case_law: /\bv\.?\s+|\bcourt\b|\bruling\b|\bdecision\b/i,
    securities: /\bsec\b|\bfiling\b|\b10-k\b|\b10-q\b|\bproxy\b/i,
    patent: /\bpatent\b|\busp[to]?\b|\bclaim\b|\binvention\b/i,
    regulatory: /\bregulation\b|\bcfr\b|\brule\b|\bagency\b/i,
    temporal: /\b(19|20)\d{2}\b|\brecent\b|\blast\s+\d+\s+(year|month)/i
  };

  const detectedTypes = [];
  for (const [type, pattern] of Object.entries(queryTypes)) {
    if (pattern.test(query)) {
      detectedTypes.push(type);
    }
  }

  return {
    types: detectedTypes,
    terms: this.extractKeyTerms(query),
    entities: this.extractEntities(query),
    temporal: this.extractTemporalConstraints(query),
    domain: this.inferDomain(detectedTypes)
  };
}
```

### 45.5 Coverage Analysis

```javascript
/**
 * Assess how well results cover the query's information needs
 */
assessQueryCoverage(userQuery, results) {
  const needs = this.identifyInformationNeeds(userQuery);

  const coverage = needs.map(need => {
    const satisfied = results.some(r => this.resultSatisfiesNeed(r, need));
    return { need, satisfied, confidence: satisfied ? 1 : 0 };
  });

  const coverageScore = coverage.filter(c => c.satisfied).length / needs.length;

  return {
    score: coverageScore,
    needs: coverage,
    gaps: coverage.filter(c => !c.satisfied).map(c => c.need),
    recommendation: this.generateCoverageRecommendation(coverage)
  };
}
```

### 45.6 Quality Metrics

| Metric | Weight | Description |
|--------|--------|-------------|
| Term Overlap | 30% | Keyword match between query and results |
| Entity Match | 40% | Named entity alignment (companies, people, cases) |
| Domain Alignment | 20% | Result source matches query domain |
| Temporal Relevance | 10% | Date recency for time-sensitive queries |

### 45.7 SDK Migration Notes

- **Mixin Pattern**: Can be applied to any WebSearch client
- **Non-Blocking**: All methods are synchronous string operations
- **Quality Feedback**: Integrates with Gemini filtering decisions
- **Extensible**: Subclasses can override threshold values

---

## 46. CONVERSATION BRIDGE FORMATTERS

### 46.1 Overview

**Directory**: `src/modules/conversation-bridge/formatters/`
**Files**: 13 formatter modules + index.js registry

The formatter system transforms raw tool results into structured, conversation-friendly output for Supabase dual-write storage.

### 46.2 Formatter Registry

**File**: `formatters/index.js`

```javascript
import { formatCourtListenerResult } from './courtlistener.js';
import { formatSECResult } from './sec.js';
import { formatEPAResult } from './epa.js';
// ... additional imports

const FORMATTER_MAP = {
  // CourtListener Tools
  'search_cases': formatCourtListenerResult,
  'search_opinions': formatCourtListenerResult,
  'search_dockets': formatCourtListenerResult,
  'get_case_details': formatCourtListenerResult,
  'lookup_citation': formatCourtListenerResult,

  // SEC Tools
  'search_sec_filings': formatSECResult,
  'get_sec_filing_details': formatSECResult,
  'get_company_filings': formatSECResult,

  // EPA Tools
  'search_epa_facilities': formatEPAResult,
  'get_facility_details': formatEPAResult,

  // Additional domain mappings...
};

export function getFormatters() {
  return Object.keys(FORMATTER_MAP);
}

export function formatToolResult(toolName, rawResult) {
  const formatter = FORMATTER_MAP[toolName];
  if (!formatter) {
    return { formatted: rawResult, type: 'raw' };
  }
  return formatter(rawResult);
}

export function hasFormatter(toolName) {
  return toolName in FORMATTER_MAP;
}
```

### 46.3 Formatter Interface

Each formatter implements:

```javascript
/**
 * @param {object} rawResult - Raw tool execution result
 * @returns {object} {
 *   formatted: string,      // Human-readable summary
 *   structured: object,     // Normalized data structure
 *   metadata: object,       // Source, timestamp, quality metrics
 *   citations: array        // Extracted citations for linking
 * }
 */
export function formatDomainResult(rawResult) {
  // Implementation
}
```

### 46.4 Registered Tools by Domain

| Domain | Tools |
|--------|-------|
| CourtListener | `search_cases`, `search_opinions`, `search_dockets`, `get_case_details`, `lookup_citation`, `search_judges`, `get_judge_details`, `search_audio` |
| SEC | `search_sec_filings`, `get_sec_filing_details`, `get_company_filings`, `get_insider_transactions` |
| EPA | `search_epa_facilities`, `get_facility_details`, `get_compliance_history` |
| USPTO | `search_patents`, `get_patent_details`, `search_trademarks` |
| PTAB | `search_ptab_proceedings`, `get_ptab_decision` |
| FDA | `search_fda_drugs`, `search_fda_devices`, `search_fda_recalls` |
| Federal Register | `search_federal_register`, `get_document_details` |
| GovInfo | `search_usc`, `search_cfr`, `search_congressional_record` |
| FTC | `search_ftc_actions`, `get_ftc_case_details` |
| NHTSA | `search_nhtsa_recalls`, `search_nhtsa_complaints` |
| CPSC | `search_cpsc_recalls`, `get_recall_details` |
| State | `search_state_statutes`, `search_state_court_rules` |

### 46.5 SDK Migration Notes

- **Dual-Write Support**: Formatters enable Supabase conversation storage
- **Normalization**: Standardizes diverse API responses
- **Citation Extraction**: Builds cross-reference links
- **Pluggable**: New domains add new formatter files

---

## 47. SPECIALIZED API CLIENTS

### 47.1 FinancialDisclosureClient

**File**: `src/api-clients/FinancialDisclosureClient.js` (~837 lines)

Researches judicial financial disclosures via CourtListener's financial disclosure API.

```javascript
class FinancialDisclosureClient {
  constructor(rateLimiter) {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4';
    this.rateLimiter = rateLimiter;
  }

  /**
   * Search financial disclosures by judge or year
   */
  async searchFinancialDisclosures(params) {
    const { judge_name, year, report_type, limit = 20 } = params;

    // First resolve judge name to person_id
    const judge = await this.resolveJudge(judge_name);
    if (!judge) {
      return { results: [], error: 'Judge not found' };
    }

    const queryParams = new URLSearchParams({
      person: judge.id,
      ...(year && { year }),
      ...(report_type && { report_type }),
      page_size: limit
    });

    const response = await this.makeRequest(
      `/financial-disclosures/?${queryParams}`
    );

    return this.formatDisclosureResults(response.results);
  }

  /**
   * Get detailed disclosure with investments and positions
   */
  async getFinancialDisclosureDetails(disclosureId) {
    const disclosure = await this.makeRequest(
      `/financial-disclosures/${disclosureId}/`
    );

    // Fetch related data
    const [investments, positions, agreements] = await Promise.all([
      this.getInvestments(disclosureId),
      this.getPositions(disclosureId),
      this.getAgreements(disclosureId)
    ]);

    return {
      ...disclosure,
      investments,
      positions,
      agreements
    };
  }
}
```

### 47.2 FilingDraftClient

**File**: `src/api-clients/FilingDraftClient.js` (~388 lines)

Assists with SEC filing draft preparation and compliance checking.

```javascript
class FilingDraftClient {
  constructor() {
    this.templateEngine = new FilingTemplateEngine();
  }

  /**
   * Generate filing draft with compliance validation
   */
  async generateFilingDraft(params) {
    const { filing_type, company_info, content_sections } = params;

    // Validate required fields per filing type
    const validation = this.validateFilingRequirements(
      filing_type,
      content_sections
    );

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        suggestions: validation.suggestions
      };
    }

    // Generate draft using template engine
    const draft = this.templateEngine.generateDocument(
      filing_type,
      { ...company_info, ...content_sections },
      'federal'
    );

    return {
      success: true,
      draft: draft.content,
      metadata: draft.metadata,
      compliance_warnings: draft.warnings
    };
  }
}
```

### 47.3 ComprehensiveAnalysisClient

**File**: `src/api-clients/ComprehensiveAnalysisClient.js` (~221 lines)

Coordinates multi-domain analysis across multiple API clients.

```javascript
class ComprehensiveAnalysisClient {
  constructor(clients) {
    this.clients = clients; // Map of domain -> client
  }

  /**
   * Run parallel analysis across multiple domains
   */
  async runComprehensiveAnalysis(entity, domains) {
    const analysisPromises = domains.map(domain =>
      this.analyzeForDomain(entity, domain)
    );

    const results = await Promise.allSettled(analysisPromises);

    return {
      entity,
      analyses: results.map((r, i) => ({
        domain: domains[i],
        status: r.status,
        data: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? r.reason.message : null
      })),
      summary: this.generateCrossdomainSummary(results)
    };
  }

  async analyzeForDomain(entity, domain) {
    const client = this.clients.get(domain);
    if (!client) throw new Error(`No client for domain: ${domain}`);

    switch (domain) {
      case 'sec':
        return client.searchFilings({ company: entity });
      case 'courtlistener':
        return client.searchCases({ party_name: entity });
      case 'epa':
        return client.searchFacilities({ name: entity });
      // Additional domains...
    }
  }
}
```

### 47.4 SDK Migration Notes

- **Stateless Clients**: Each method call is independent
- **Promise-Based**: All async operations return Promises
- **Composable**: ComprehensiveAnalysisClient coordinates others
- **Rate-Limited**: All clients accept rateLimiter in constructor

---

## 48. PARAMETER UTILITIES

### 48.1 Parameter Extractor

**File**: `src/utils/parameterExtractor.js` (~177 lines)

Extracts structured parameters from free-form user queries for tool invocation.

```javascript
/**
 * Infer parameters for a supported tool from a free-text query
 * @param {string} toolName - Target tool name
 * @param {string} userQuery - Free-form user query
 * @returns {object} Extracted parameters
 */
export function extractParametersFromQuery(toolName, userQuery) {
  const tool = (toolName || '').trim();
  const query = (userQuery || '').trim();
  if (!tool || !query) return {};

  try {
    if (tool === 'search_epa_facilities') return extractEPAParams(query);
    if (tool === 'search_cases' || tool === 'search_opinions') return extractCaseParams(query);
    if (tool === 'search_dockets') return extractDocketParams(query);
    if (tool === 'search_judges') return extractJudgeSearchParams(query);
    if (tool === 'search_audio') return extractAudioParams(query);
    if (tool === 'lookup_citation') return extractCitationParams(query);
  } catch (_) {
    return {};  // Fail closed
  }

  // Default: pass-through for search/lookup tools
  if (/search|lookup/i.test(tool)) {
    return { query: normalizeWhitespace(query) };
  }
  return {};
}
```

### 48.2 Detection Functions

```javascript
// State code detection (full names and abbreviations)
function detectStateCode(query) {
  // STATE_NAME_TO_CODE mapping: 'california' -> 'CA', etc.
  // Returns 2-letter state code or undefined
}

// ZIP code detection (5-digit or ZIP+4)
function detectZipCode(query) {
  const m = query.match(/\b\d{5}(?:-\d{4})?\b/);
  return m ? m[0] : undefined;
}

// Federal docket number detection
function detectDocketNumber(query) {
  const m = query.match(/\b\d{1,2}:\d{2}-(?:cv|cr|mc|mj|md|bk|br|ap)-\d{3,8}\b/i);
  return m ? m[0] : undefined;
}

// Temporal constraint detection
function detectYearAfter(query) {
  const m = query.match(/\b(from|after|since)\s+(19\d{2}|20\d{2})\b/i);
  if (!m) return undefined;
  return `${m[2]}-01-01`;
}

// Transcript requirement detection
function detectHasTranscript(query) {
  return /transcript|with transcript|has transcript/i.test(query);
}
```

### 48.3 Domain-Specific Extraction

```javascript
function extractEPAParams(query) {
  return {
    ...(detectStateCode(query) && { state: detectStateCode(query) }),
    ...(detectZipCode(query) && { zip_code: detectZipCode(query) }),
    ...(/violation|noncompliance|enforcement/i.test(query) &&
        { compliance_status: 'violation' })
  };
}

function extractCaseParams(query) {
  return {
    query: buildCaseQuery(query),
    include_snippet: true,
    limit: 10,
    ...(detectYearAfter(query) && { date_filed_after: detectYearAfter(query) })
  };
}

function extractDocketParams(query) {
  const docket = detectDocketNumber(query);
  return {
    limit: 5,
    ...(docket ? { docket_number: docket } : { case_name: normalizeWhitespace(query) }),
    ...(detectYearAfter(query) && { date_filed_after: detectYearAfter(query) })
  };
}
```

### 48.4 SDK Migration Notes

- **Pure Functions**: No side effects, testable in isolation
- **Fail Closed**: Returns empty object on extraction errors
- **Extensible**: Add new extractors for new tools
- **Query Preservation**: Original query passed through when extraction fails

---

## 49. DEPLOYMENT CONFIGURATION

### 49.1 Start Scripts

#### Baseline Mode

**File**: `start-server-baseline.sh`

```bash
#!/bin/bash
# Baseline Mode - Enhanced Queries OFF

export ENHANCED_SUMMARY_QUERIES=false
export MCP_RUNNER_SCRIPT="../../run-legal-mcp.sh"

cd src/server
node claude-server-v2.js
```

**Behavior**: Static keyword queries, original query generation logic.

#### Enhanced Mode

**File**: `start-server-enhanced.sh`

```bash
#!/bin/bash
# Enhanced Mode - Context-aware queries ON

export ENHANCED_SUMMARY_QUERIES=true
export MCP_RUNNER_SCRIPT="../../run-legal-mcp.sh"

cd src/server
node claude-server-v2.js
```

**Behavior**: User intent propagated to Gemini extraction, natural language queries.

### 49.2 Package.json Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "orchestrator": "node src/server/startOrchestrator.js",
    "claude": "node src/server/start-claude-server.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

### 49.3 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.39.0 | Claude API integration |
| `@google/generative-ai` | ^0.21.0 | Gemini filtering |
| `@modelcontextprotocol/sdk` | ^0.5.0 | MCP tool protocol |
| `@supabase/supabase-js` | ^2.45.0 | Conversation storage |
| `express` | ^4.19.2 | HTTP server |
| `cors` | ^2.8.5 | Cross-origin support |
| `dotenv` | ^16.6.1 | Environment config |

### 49.4 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Required | Claude API authentication |
| `EXA_API_KEY` | Required | Exa web search API |
| `GEMINI_API_KEY` | Required | Gemini filtering API |
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_ANON_KEY` | Required | Supabase anonymous key |
| `CLAUDE_PORT` | 8090 | HTTP server port |
| `ENABLE_GEMINI_FILTERING` | true | Toggle Gemini layer |
| `ENABLE_EXTENDED_CONTEXT` | true | Enable 1M context window |
| `ENHANCED_SUMMARY_QUERIES` | true | Context-aware queries |
| `MCP_RUNNER_SCRIPT` | ./run-legal-mcp.sh | MCP subprocess script |

### 49.5 SDK Migration Notes

- **Feature Flags**: Environment-based feature toggling
- **Dual Mode**: Baseline vs Enhanced for A/B comparison
- **Port Configuration**: Single port for all endpoints
- **MCP Subprocess**: External MCP server via shell script

---

## 50. TEST INFRASTRUCTURE

### 50.1 Test Directory Structure

```
super-legal-mcp-refactored/
├── test/                           # Quick integration tests (90+ files)
│   ├── *.test.js                   # Direct client tests
│   ├── unit/                       # Isolated unit tests
│   ├── integration/                # Multi-component tests
│   └── isolated/                   # Mock-based tests
│
└── tests/                          # Jest test suite
    ├── setup.js                    # Jest configuration
    ├── unit/
    │   ├── api-clients/            # Client unit tests
    │   ├── tools/                  # Tool definition tests
    │   ├── utils/                  # Utility tests
    │   └── config/                 # Config tests
    ├── integration/
    │   ├── server/                 # Server integration
    │   ├── *.live.test.js          # Live API tests
    │   └── *.test.js               # Integration tests
    ├── e2e/
    │   └── index.test.js           # End-to-end flows
    └── schemas/
        └── *.test.js               # Schema validation tests
```

### 50.2 Test Categories

| Category | Purpose | Command |
|----------|---------|---------|
| Unit | Isolated component testing | `npm run test:unit` |
| Integration | Multi-component flows | `npm run test:integration` |
| E2E | Full system flows | `npm run test:e2e` |
| Schema | JSON Schema validation | Jest automatic |
| Quick | Rapid development tests | Direct node execution |

### 50.3 Jest Configuration

```javascript
// package.json jest config
{
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"],
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/**/*.test.js"
    ],
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
```

### 50.4 Schema Test Pattern

**File**: `tests/schemas/*.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { SECSchemas } from '../../src/api-clients/schemas/SECSchemas.js';
import { SchemaValidator } from '../../src/api-clients/schemas/SchemaValidator.js';

describe('SECSchemas', () => {
  const validator = new SchemaValidator();

  it('should validate SEC filing response', () => {
    const mockResponse = {
      filings: [{
        accession_number: '0001234567-24-000001',
        form_type: '10-K',
        company_name: 'Test Corp',
        filing_date: '2024-01-15'
      }]
    };

    const result = validator.validate(mockResponse, SECSchemas.FILING_RESPONSE);
    expect(result.valid).toBe(true);
  });
});
```

### 50.5 Quick Test Pattern

**File**: `test/test-*.js`

```javascript
// Direct execution: node test/test-fda-web-client-live.js
import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';

async function runTest() {
  const client = new FDAWebSearchClient();

  console.log('Testing FDA drug search...');
  const results = await client.searchDrugs({ query: 'aspirin', limit: 5 });

  console.log(`Found ${results.length} results`);
  console.log(JSON.stringify(results[0], null, 2));
}

runTest().catch(console.error);
```

### 50.6 Test Coverage Areas

| Domain | Unit Tests | Integration | Schema |
|--------|------------|-------------|--------|
| SEC | ✅ | ✅ | ✅ |
| FDA | ✅ | ✅ | ✅ |
| EPA | ✅ | ✅ | ✅ |
| USPTO | ✅ | ✅ | ✅ |
| CourtListener | ✅ | ✅ | ✅ |
| GovInfo | ✅ | ✅ | ✅ |
| Federal Register | ✅ | ✅ | ✅ |
| PTAB | ✅ | ✅ | ✅ |
| CPSC | ✅ | ✅ | ✅ |
| NHTSA | ✅ | ✅ | ✅ |
| FTC | ✅ | ✅ | ✅ |
| State | ✅ | ✅ | ✅ |

### 50.7 SDK Migration Notes

- **Test Patterns**: Reusable for SDK tool testing
- **Schema Validation**: Ensures API response stability
- **Quick Tests**: Rapid iteration during development
- **Coverage**: All domains have comprehensive test suites
- **Mock Support**: Isolated tests use mock data

---

*Document generated: 2025-12-06*
*Total sections: 50*
*Approximate lines: ~5,500*
*Purpose: Claude Agent SDK Migration Reference*

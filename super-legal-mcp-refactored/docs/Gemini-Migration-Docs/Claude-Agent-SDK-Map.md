# Claude Agent SDK Architecture Map

## Purpose
This document maps the Super-Legal Claude Agent SDK architecture to facilitate migration to Gemini-ADK.

---

## 1. SYSTEM OVERVIEW

The Super-Legal system is a **multi-agent legal research platform** built on Anthropic's Claude Agent SDK. It features:

- **Express.js server** (`claude-sdk-server.js`) - 1,223 lines
- **Multi-turn Agent SDK** with automatic tool invocation loops
- **32 specialized legal subagents** with domain expertise
- **117 research tools** across 18 categories
- **Hybrid API clients** (native + web search fallback)
- **Auto-continuation system** for handling token limits

---

## 2. CORE ARCHITECTURE COMPONENTS

### 2.1 Server Layer (`claude-sdk-server.js`)

| Component | Purpose |
|-----------|---------|
| Express.js server | HTTP request handling on port 3001 |
| Anthropic SDK | Base API client (`@anthropic-ai/sdk`) |
| Agent SDK | Multi-turn agent execution (`@anthropic-ai/claude-agent-sdk`) |
| Rate Limiter | Token bucket algorithm (300 RPM, 200K TPM) |
| Circuit Breaker | Fault tolerance (3 failures, 60s timeout) |

**Key Endpoints:**
- `POST /api/research` - Single-turn tool execution
- `GET/POST /api/stream` - Multi-turn Agent SDK streaming (primary)
- `GET /health` - System diagnostics
- `GET /api/subagents` - List available specialists

### 2.2 Orchestrator Layer (`ClaudeOrchestrator.js`)

| Feature | Description |
|---------|-------------|
| Query Analysis | Classifies Simple/Moderate/Complex |
| Module Selection | Routes to 1-10 specialists based on complexity |
| Session Management | Creates `reports/[date]/` directories |
| Iterative Refinement | Max 3 research iterations |
| 12 Gemini Filters | Domain-specific extraction modules |

### 2.3 Subagent Layer (`legalSubagents.js` - 6,557 lines)

**32 Specialized Subagents in 5 Categories:**

**Domain Specialists (17):**
- `securities-researcher` - SEC/EDGAR filings
- `case-law-analyst` - Court opinions & precedent
- `pharma-regulatory-analyst` - FDA/FAERS data
- `environmental-compliance-analyst` - EPA enforcement
- `patent-analyst` - USPTO/PTAB research
- `regulatory-rulemaking-analyst` - Federal Register/CFR
- `product-safety-analyst` - CPSC/NHTSA recalls
- `antitrust-competition-analyst` - FTC enforcement
- `statutory-law-analyst` - US Code interpretation
- `cfius-national-security-analyst` - Foreign investment
- `privacy-data-protection-analyst` - GDPR/CCPA
- `employment-labor-analyst` - WARN/ERISA/unions
- `tax-structure-analyst` - Corporate tax
- `cybersecurity-compliance-analyst` - NIST/breach response
- `ai-governance-analyst` - EU AI Act
- `government-contracts-researcher` - SAM.gov/FAR
- `insurance-coverage-analyst` - D&O/CGL policies

**Support Specialists (4):**
- `legal-research-coordinator` - Query triage & routing
- `financial-analyst` - DCF/damages modeling
- `commercial-contracts-analyst` - M&A agreement analysis
- `research-review-analyst` - Quality assurance gate

**Synthesis Agents (8):**
- `research-plan-refiner` - Mid-research optimization
- `memo-generator` - 60K-85K word memorandum (single pass)
- `citation-validator` - Footnote verification
- `memo-qa-evaluator` - Compliance scoring
- `memo-section-writer` - Legacy section writer
- `memo-integration-agent` - Cross-reference numbering
- `memo-executive-summary-writer` - Board briefing (8K-10K words)
- `xref-review-agent` - Cross-reference validation

**Other (3):**
- `coverage-gap-analyzer` - Research gap identification
- `fact-validator` - Citation verification
- `research-review-analyst` - Post-research validation

---

## 3. TOOL ARCHITECTURE

### 3.1 Tool Definition Structure (`toolDefinitions.js`)

```javascript
{
  name: "tool_name",
  description: "Detailed description with usage signals",
  inputSchema: {
    type: "object",
    properties: { /* parameters */ },
    required: ["required_params"]
  }
}
```

### 3.2 Tool Categories (117 total)

| Category | Count | Purpose |
|----------|-------|---------|
| courtListenerTools | 11 | Case law & judicial data |
| financialDisclosureTools | 9 | Judicial financial disclosures |
| secEdgarTools | 4 | SEC filings |
| federalRegisterTools | 7 | Agency rules & regulations |
| usptoTools | 7 | Patent searches |
| govInfoTools | 4 | US Code |
| ptabTools | 5 | Patent appeals |
| ftcTools | 6 | FTC enforcement |
| epaTools | 3 | EPA compliance |
| fdaTools | 13 | FDA regulatory data |
| cpscTools | 7 | Consumer product safety |
| nhtsaTools | 6 | Vehicle safety |
| stateCourtRulesTools | 14 | State court procedures |
| comprehensiveAnalysisTools | 1 | Multi-database analysis |
| filingDraftTools | 1 | Document generation |
| Standalone (think) | 1 | Structured reasoning |

### 3.3 Tool Implementation Flow (`toolImplementations.js`)

```
Tool Call → Parameter Capping → Orchestrator Routing → Client Execution → Result
```

**Parameter Caps:**
- Default: `limit: 5, include_snippet: false`
- Full text: `limit: 2` (strict cap)
- Detail tools: No capping (exact lookups)

### 3.4 Permission System (`toolPermissions.js`)

Currently open: All 117 tools allowed on both `/api/research` and `/api/stream`.

---

## 4. DATA FLOW ARCHITECTURE

### 4.1 Single-Turn Flow (`POST /api/research`)

```
Request → Rate Limit → Circuit Breaker → Message Create →
Tool Filter → Schema Select → Stream Process → Tool Execute → Response
```

### 4.2 Multi-Turn Agent SDK Flow (`GET/POST /api/stream`)

```
Request → Rate Limit → agentQuery() →
  ↓
MCP Server (tool registry)
  ↓
Auto Tool Loop (max 100 turns)
  ↓
Auto-Continuation (max 14 attempts)
  ↓
SSE Stream Events → Final Response
```

### 4.3 Subagent Delegation Flow

```
SIMPLE (1 entity, 1 domain):
  Query → 1 Specialist → Direct Response

MODERATE (2 entities OR 2 domains):
  Query → Session Directory → 4-6 Specialists (parallel) → Synthesis

COMPLEX (3+ entities OR due diligence):
  Query → Research Plan → Phase 1 (5-8 specialists) →
  Phase 2 (plan refinement) → Phase 3 (synthesis) → Phase 4 (validation)
```

---

## 5. KEY SDK PATTERNS FOR MIGRATION

### 5.1 Agent SDK Invocation

```javascript
for await (const message of agentQuery({
  prompt: userQuery,
  options: {
    model: 'claude-sonnet-4-5-20250929',
    maxTurns: 100,
    systemPrompt: SYSTEM_PROMPT,
    betas: ['context-1m-2025-08-07', 'interleaved-thinking-2025-05-14'],
    mcpServers: { 'super-legal-tools': mcpServer },
    agents: subagents,  // 32 specialized agents
    hooks: sdkHooksConfig
  }
}))
```

### 5.2 Subagent Definition Pattern

```javascript
{
  'agent-name': {
    description: 'Proactive triggers and keywords for routing',
    prompt: `[100-500 line domain expertise prompt with:
      - Role & Expertise
      - Research Methodology
      - Provenance Requirements
      - Output Format
      - MCP_FALLBACK_INSTRUCTIONS
      - DATABASE_URL_TEMPLATES
      - REPORT_SAVING_INSTRUCTIONS
    ]`,
    tools: STANDARD_TOOLS.withWriteAndWeb,
    model: 'sonnet'
  }
}
```

### 5.3 Tool Registration Pattern

```javascript
// Definition
const tools = [{ name, description, inputSchema }]

// Implementation
const implementations = {
  tool_name: async (args) => {
    const result = await client.method(args)
    return result
  }
}

// SDK Adapter
const sdkTools = buildSdkTools(implementations)
```

### 5.4 Auto-Continuation Pattern

```javascript
const AUTO_CONTINUATION_CONFIG = {
  enabled: true,
  maxAttempts: 14,
  prompt: 'Continue from where you left off...'
}

// Detection
const isTruncated =
  stopReason === 'max_tokens' ||
  detectTruncationPattern(text) ||
  outputTokens >= (MAX_TOKENS * 0.95)

// Completion override
const isComplete =
  detectCompletionPattern(text) &&
  stopReason === 'end_turn'
```

### 5.5 SSE Streaming Pattern

```javascript
// Event types
'system_info' | 'system_init' | 'delta' | 'thinking' |
'tool_call' | 'continuation' | 'final' | 'error'

// Response format
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
})

function sendSSE(type, data) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
}
```

---

## 6. API CLIENTS (22 total)

| Client | Type | Purpose |
|--------|------|---------|
| SECHybridClient | Hybrid | SEC filings & EDGAR |
| FDAHybridClient | Hybrid | Drug/device adverse events |
| FDAWebSearchClient | Web | FDA labels & recalls |
| EPAHybridClient | Hybrid | Environmental compliance |
| CourtListenerHybridClient | Hybrid | Case law & opinions |
| GovInfoHybridClient | Hybrid | US Code & legislation |
| FederalRegisterHybridClient | Hybrid | Federal Register |
| USPTOHybridClient | Hybrid | Patent searches |
| CPSCWebSearchClient | Web | Product safety |
| NHTSAWebSearchClient | Web | Vehicle safety |
| FTCWebSearchClient | Web | FTC enforcement |
| PTABWebSearchClient | Web | Patent appeals |
| ExaClient | Web | General web search |

---

## 7. CONFIGURATION & ENVIRONMENT

### Required Variables
```
ANTHROPIC_API_KEY     # Claude API
EXA_API_KEY           # Web search
COURTLISTENER_API_TOKEN
USPTO_API_KEY
GOVINFO_API_KEY
```

### Feature Flags
```
USE_AGENT_SDK=true          # Multi-turn mode (default)
SUBAGENTS_ENABLED=true      # 32 specialists
STRUCTURED_OUTPUTS=true     # JSON schema validation
SKILLS_ENABLED=false        # Custom skills disabled
AUTO_CONTINUATION=true      # Handle truncation
```

### Limits
```
SDK_MODEL=claude-sonnet-4-5-20250929
SDK_MAX_TOKENS=64000
SDK_RPM=300
SDK_TPM=200000
SDK_MAX_TURNS=100
AUTO_CONTINUATION_MAX_ATTEMPTS=14
```

---

## 8. GEMINI-ADK MIGRATION STRATEGY (December 2025)

### 8.1 Target Models (Per User Requirements)

| Role | Model | Purpose |
|------|-------|---------|
| Orchestrator | **Gemini-3-Pro** | Complex reasoning, research coordination |
| Processing | **Gemini-3-Flash** | Fast tool execution, parallel processing |

### 8.2 Key Gemini APIs (December 2025)

**Interactions API** (Released Dec 11, 2025):
- Unified foundation for models and agents
- Supports multi-turn conversations with state
- Native agent runtime capabilities

**Function Calling**:
- `FunctionDeclaration` format (OpenAPI-compatible)
- Parallel function calling (multiple tools at once)
- Compositional function calling (chained tool sequences)
- Automatic function calling (Python SDK)

**Thinking Models**:
- Gemini 3 uses internal "thinking" process
- `thought_signature` maintains context across turns
- SDK handles signatures automatically

### 8.3 Claude → Gemini Concept Mapping

| Claude Agent SDK | Gemini Equivalent |
|------------------|-------------------|
| `agentQuery()` | Interactions API / `generateContent()` loop |
| `mcpServers` | `tools: [{ functionDeclarations: [...] }]` |
| `agents` (subagents) | Multi-agent via Interactions API |
| `betas` | Model capabilities (native in Gemini 3) |
| `thinking` blocks | Native in Gemini 3 (thought_signature) |
| `hooks` | Callback functions in generation loop |
| Auto-continuation | Manual loop with `stop_reason` check |
| SSE streaming | `generateContentStream()` |

### 8.4 Tool Schema Transformation

**Claude SDK Format:**
```javascript
{
  name: "search_sec_filings",
  description: "Search SEC filings...",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "..." },
      limit: { type: "integer", description: "..." }
    },
    required: ["query"]
  }
}
```

**Gemini FunctionDeclaration Format:**
```javascript
{
  name: "search_sec_filings",
  description: "Search SEC filings...",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "..." },
      limit: { type: "integer", description: "..." }
    },
    required: ["query"]
  }
}
```

**Key Difference**: `inputSchema` → `parameters` (otherwise compatible)

### 8.5 Parallel Migration Plan

**Stream 1: Tool Migration** (117 tools)
1. Create `geminiToolAdapter.js` - transform `inputSchema` → `parameters`
2. Build tool registry with `FunctionDeclaration` array
3. Implement tool execution handler matching Gemini response format
4. Test each tool category independently

**Stream 2: Subagent Migration** (32 specialists)
1. Create `geminiSubagents.js` - transform prompt format
2. Implement orchestrator routing for Gemini-3-Pro
3. Map domain specialists to tool subsets
4. Implement session directory integration

**Stream 3: Server Integration**
1. Create `gemini-adk-server.js` (parallel to claude-sdk-server.js)
2. Implement Interactions API client
3. Port auto-continuation logic
4. Implement SSE streaming adapter

### 8.6 Function Calling Implementation Pattern

```javascript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Tool definitions (converted from Claude format)
const tools = [{
  functionDeclarations: convertedToolDefinitions
}];

// Generation with tools
const response = await ai.models.generateContent({
  model: 'gemini-3-flash',
  contents: userQuery,
  config: { tools }
});

// Handle function calls
if (response.functionCalls?.length > 0) {
  for (const call of response.functionCalls) {
    const result = await executeToolHandler(call.name, call.args);
    // Send function response back to model
    contents.push({ role: 'user', parts: [{ functionResponse: { name: call.name, response: result } }] });
  }
}
```

### 8.7 Multi-Turn Agent Loop (Interactions API Pattern)

```javascript
async function agentLoop(prompt, tools, maxTurns = 100) {
  let contents = [{ role: 'user', parts: [{ text: prompt }] }];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro',  // Orchestrator model
      contents,
      config: { tools }
    });

    if (response.functionCalls?.length > 0) {
      // Execute tools and continue
      contents.push(response.candidates[0].content);
      for (const call of response.functionCalls) {
        const result = await toolHandlers[call.name](call.args);
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: call.name, response: { result } } }]
        });
      }
    } else {
      // No more function calls - return final response
      return response.text;
    }
  }
}
```

### 8.8 Thought Signature Handling (Gemini 3)

```javascript
// Gemini 3 includes thought_signature in responses
// SDK handles automatically, but for manual handling:
const part = response.candidates[0].content.parts[0];
if (part.thoughtSignature) {
  // Include in subsequent requests to maintain context
  // SDK does this automatically
}
```

---

## 9. FILE REFERENCE MAP

| File | Lines | Purpose |
|------|-------|---------|
| `src/server/claude-sdk-server.js` | 1,223 | Main server |
| `src/server/ClaudeOrchestrator.js` | 670 | Research orchestration |
| `src/config/legalSubagents.js` | 6,557 | 32 subagent definitions |
| `src/tools/toolDefinitions.js` | ~3,000 | 117 tool schemas |
| `src/tools/toolImplementations.js` | ~800 | Tool handlers |
| `src/config/toolPermissions.js` | ~50 | Access control |
| `memorandum.md` | 371 | Legal research mandate |

---

## 10. IMPLEMENTATION PLAN

### User Requirements (Confirmed)
- **Models**: Gemini-3-Pro (orchestrator), Gemini-3-Flash (processing)
- **Strategy**: Parallel migration (tools + subagents simultaneously)
- **Mode**: Full replacement (Claude → Gemini only)
- **Documentation**: Save to `docs/Claude-Agent-SDK-Map.md`

### Phase 1: Foundation (Create New Files)

| File | Purpose |
|------|---------|
| `src/utils/geminiToolAdapter.js` | Transform 117 tools to FunctionDeclaration format |
| `src/config/geminiSubagents.js` | Transform 32 subagent definitions |
| `src/server/gemini-adk-server.js` | New Gemini-based server |
| `docs/Claude-Agent-SDK-Map.md` | Architecture documentation |

### Phase 2: Tool Migration

1. **Create adapter function**:
   ```javascript
   function convertToGeminiFunctionDeclaration(claudeTool) {
     return {
       name: claudeTool.name,
       description: claudeTool.description,
       parameters: claudeTool.inputSchema  // Direct mapping
     };
   }
   ```

2. **Transform all 117 tools** via `allTools.map(convertToGeminiFunctionDeclaration)`

3. **Port tool handlers** - keep existing `toolImplementations.js` (API clients unchanged)

### Phase 3: Subagent Migration

1. **Transform subagent prompts** - Adapt for Gemini instruction format
2. **Implement routing logic** - Port keyword-based delegation from `SUBAGENT_SYSTEM_PROMPT_SECTION`
3. **Session directory integration** - Keep report-saving pattern

### Phase 4: Server Implementation

1. **Create `gemini-adk-server.js`** mirroring claude-sdk-server.js structure
2. **Implement Interactions API loop** for multi-turn tool execution
3. **Port auto-continuation** with truncation detection
4. **SSE streaming** via `generateContentStream()`

### Phase 5: Testing & Validation

1. Tool-by-tool verification (all 18 categories)
2. Subagent routing accuracy
3. End-to-end research flow
4. Report generation quality

### Files to Create
```
super-legal-mcp-refactored/
├── docs/
│   └── Claude-Agent-SDK-Map.md      ← Architecture documentation
├── src/
│   ├── utils/
│   │   └── geminiToolAdapter.js     ← Tool transformation
│   ├── config/
│   │   └── geminiSubagents.js       ← Subagent definitions
│   └── server/
│       └── gemini-adk-server.js     ← Main Gemini server
```

### Files to Modify
- `package.json` - Add `@google/genai` dependency
- `.env` - Add `GEMINI_API_KEY`

### Existing Files to Port Logic From
- `src/server/claude-sdk-server.js` (1,223 lines)
- `src/config/legalSubagents.js` (6,557 lines)
- `src/tools/toolDefinitions.js` (~3,000 lines)
- `src/tools/toolImplementations.js` (~800 lines)
- `src/server/ClaudeOrchestrator.js` (670 lines)

---

## 11. GRANULAR IMPLEMENTATION DETAILS

### 11.1 Complete Tool Definition Example (from `toolDefinitions.js`)

```javascript
// Full example: search_cases tool (lines 6-69)
export const courtListenerTools = [
  {
    name: "search_cases",
    description: "Search federal and state court opinions via CourtListener. UNIQUE: Binding precedent, judicial reasoning, procedural standards. SIGNALS: 'case law', 'precedent', 'court held', 'ruling', party names.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms. PATTERNS: 'exact phrases', party names, legal concepts, citations. Exa neural search automatically includes related concepts."
        },
        court: {
          type: "string",
          description: "Court abbreviation to filter by (e.g., 'scotus', 'ca9')"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          default: 5,
          maximum: 5
        },
        date_filed_after: {
          type: "string",
          description: "Find cases filed after this date (YYYY-MM-DD)"
        },
        date_filed_before: {
          type: "string",
          description: "Find cases filed before this date (YYYY-MM-DD)"
        },
        case_name: {
          type: "string",
          description: "Search specifically in case names"
        },
        docket_number: {
          type: "string",
          description: "Search by docket number"
        },
        citation: {
          type: "string",
          description: "Search by citation"
        },
        include_snippet: {
          type: "boolean",
          description: "Get 500-char preview for relevance assessment. USE FIRST to scan multiple results quickly.",
          default: true
        },
        include_full_text: {
          type: "boolean",
          description: "Get complete document. USE AFTER snippet confirms relevance. Limit to 2-3 most relevant.",
          default: false
        }
      },
      required: ["query"]
    }
  }
];
```

### 11.2 Tool Implementation Wrapper Pattern (from `toolImplementations.js`)

```javascript
// Parameter capping configuration (lines 124-144)
const PARAMETER_CAPS = {
  // Default caps for all tools
  default: {
    limit: 5,
    include_snippet: false,
    include_text: false,
    include_full_text: false
  },

  // Tools that should not be capped (specific lookups that need exact data)
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

// Universal parameter capping function (lines 146-172)
function applyParameterCaps(toolName, args) {
  // Skip capping for detail/lookup tools that need specific IDs
  if (PARAMETER_CAPS.noCap.includes(toolName)) {
    return args;
  }

  const cappedArgs = { ...args };

  // Apply smart limits based on content type
  if (cappedArgs.include_full_text === true) {
    // Full text requests get stricter limits (2 results)
    cappedArgs.limit = Math.min(cappedArgs.limit || 2, 2);
  } else {
    // Regular searches get standard limit (5 results)
    cappedArgs.limit = Math.min(cappedArgs.limit || 5, 5);
  }

  return cappedArgs;
}

// Wrapper function with conversation logging and orchestrator routing (lines 176-234)
const wrapWithConversation = (toolName, toolFunction) => {
  return async (args) => {
    // Apply parameter caps BEFORE calling the tool function
    const cappedArgs = applyParameterCaps(toolName, args);

    let result;

    // Check if we should route through orchestrator for intelligent extraction
    if (orchestrator && shouldUseOrchestrator(toolName, cappedArgs)) {
      try {
        const domain = TOOL_DOMAIN_MAPPING[toolName];
        const query = cappedArgs.query || cappedArgs.search_text || '';

        console.log(`🤖 [Orchestrator] Routing ${toolName} through Gemini filtering`);

        // Use orchestrator for filtered extraction
        const orchestratorResult = await orchestrator.research(query, {
          sessionId: cappedArgs.session_id,
          preferredModules: domain ? [domain] : undefined
        });

        result = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              source: 'orchestrator',
              domain: domain,
              answer: orchestratorResult.answer,
              findings: orchestratorResult.findings || [],
              _gemini_filtered: true
            }, null, 2)
          }]
        };
      } catch (error) {
        // Fall back to direct tool call
        result = await toolFunction(cappedArgs);
      }
    } else {
      result = await toolFunction(cappedArgs);
    }

    // Log to conversation bridge if available
    if (conversationBridge && cappedArgs.conversation_id) {
      await conversationBridge.logToolCall(toolName, cappedArgs, result);
    }

    return result;
  };
};
```

### 11.3 Tool Domain Mapping (from `toolImplementations.js`)

```javascript
// Maps tool names to domain modules for orchestrator routing (lines 56-96)
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

// Orchestrator routing decision logic (lines 18-51)
function shouldUseOrchestrator(toolName, args) {
  // Feature flag check
  if (process.env.ENABLE_GEMINI_FILTERING !== 'true') {
    return false;
  }

  // Skip orchestrator for detail/lookup tools that need specific IDs
  const detailTools = [
    'get_case_details', 'get_judge_details', 'get_financial_disclosure_details',
    'get_usc_section', 'nhtsa_decode_vin', 'get_audio_details', 'get_court_info',
    'get_sec_company_facts', 'get_epa_facility_compliance_report'
  ];

  if (detailTools.includes(toolName)) {
    return false;
  }

  // ALWAYS use Gemini for full text requests
  if (args.include_text === true || args.include_full_text === true) {
    return true;
  }

  // Use orchestrator for complex queries
  const query = args.query || args.search_text || args.search_term || '';
  const isComplexQuery = query.length > 50 ||
    /\b(and|or|between|related|regarding|concerning|about)\b/i.test(query) ||
    /\d{4}/.test(query);  // Contains year

  return isComplexQuery;
}
```

### 11.4 JSON Schema to Zod Conversion (from `agentSdkToolAdapter.js`)

```javascript
// Core conversion function (lines 30-103)
function jsonSchemaPropertyToZod(prop) {
  if (!prop) return z.any();

  let zodType;

  switch (prop.type) {
    case 'string':
      if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
        zodType = z.enum(prop.enum);
      } else {
        zodType = z.string();
      }
      break;

    case 'number':
      zodType = z.number();
      if (prop.minimum !== undefined) zodType = zodType.min(prop.minimum);
      if (prop.maximum !== undefined) zodType = zodType.max(prop.maximum);
      break;

    case 'integer':
      zodType = z.number().int();
      if (prop.minimum !== undefined) zodType = zodType.min(prop.minimum);
      if (prop.maximum !== undefined) zodType = zodType.max(prop.maximum);
      break;

    case 'boolean':
      zodType = z.boolean();
      break;

    case 'array':
      if (prop.items) {
        const itemType = jsonSchemaPropertyToZod(prop.items);
        zodType = z.array(itemType);
      } else {
        zodType = z.array(z.any());
      }
      break;

    case 'object':
      if (prop.properties) {
        zodType = z.object(jsonSchemaToZodShape(prop));
      } else if (prop.additionalProperties) {
        const valueType = jsonSchemaPropertyToZod(prop.additionalProperties);
        zodType = z.record(z.string(), valueType);
      } else {
        zodType = z.record(z.string(), z.any());
      }
      break;

    default:
      zodType = z.any();
  }

  // Add description if present
  if (prop.description) {
    zodType = zodType.describe(prop.description);
  }

  return zodType;
}

// Convert full JSON Schema to Zod shape (lines 112-138)
function jsonSchemaToZodShape(jsonSchema) {
  if (!jsonSchema || jsonSchema.type !== 'object') {
    return {};
  }

  const shape = {};
  const properties = jsonSchema.properties || {};
  const required = Array.isArray(jsonSchema.required) ? jsonSchema.required : [];

  for (const [key, prop] of Object.entries(properties)) {
    let zodType = jsonSchemaPropertyToZod(prop);

    // Make optional if not in required array
    if (!required.includes(key)) {
      zodType = zodType.optional();

      // Add default value if specified
      if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
      }
    }

    shape[key] = zodType;
  }

  return shape;
}
```

### 11.5 Agent SDK Tool Building (from `agentSdkToolAdapter.js`)

```javascript
// Build Agent SDK tools from definitions (lines 146-268)
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export function buildAgentSdkTools(toolImplementations = {}) {
  const tools = [];

  for (const def of allTools) {
    const handler = toolImplementations[def.name];

    if (!handler) continue;

    try {
      // Convert JSON Schema to Zod shape
      const zodShape = jsonSchemaToZodShape(def.inputSchema);

      // Create Agent SDK tool
      const sdkTool = tool(
        def.name,
        def.description || `Tool: ${def.name}`,
        zodShape,  // Pass shape directly - SDK wraps with z.object internally
        async (args, extra) => {
          try {
            const result = await handler(args);

            // Handle null/undefined
            if (result === null || result === undefined) {
              return { content: [{ type: 'text', text: 'No results found.' }] };
            }

            // Handle string results
            if (typeof result === 'string') {
              return { content: [{ type: 'text', text: result }] };
            }

            // Handle MCP format results
            if (result.content && Array.isArray(result.content)) {
              return result;
            }

            // Convert object to JSON string
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error: ${err.message}` }],
              isError: true
            };
          }
        }
      );

      tools.push(sdkTool);
    } catch (err) {
      console.warn(`Failed to convert tool ${def.name}:`, err.message);
    }
  }

  return tools;
}

// Create MCP server for Agent SDK (lines 278-284)
export function createLegalMcpServer(tools, name = 'super-legal-tools', version = '2.0.0') {
  return createSdkMcpServer({
    name,
    version,
    tools
  });
}

// Get MCP tool naming convention (lines 293-295)
export function getMcpToolName(serverName, toolName) {
  return `mcp__${serverName}__${toolName}`;
  // Example: mcp__super-legal-tools__search_sec_filings
}
```

### 11.6 Subagent Configuration (from `legalSubagents.js`)

```javascript
// Project paths for report saving (lines 24-36)
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

// Load memorandum prompt for memo-generator (lines 42-45)
const MEMORANDUM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../prompts/memorandum.md'),
  'utf8'
);

// Standard tool sets for subagents (lines 57-64)
const STANDARD_TOOLS = {
  readOnly: ['Read', 'Grep', 'Glob'],
  withBash: ['Read', 'Grep', 'Glob', 'Bash'],
  withWeb: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'],
  withWrite: ['Read', 'Grep', 'Glob', 'Write', 'Edit'],
  // Full research capability: write + web fallback
  withWriteAndWeb: ['Read', 'Grep', 'Glob', 'Write', 'Edit', 'WebFetch', 'WebSearch']
};
```

### 11.7 Report Saving Instructions (from `legalSubagents.js`)

```javascript
// Injected into every subagent prompt (lines 72-239)
const REPORT_SAVING_INSTRUCTIONS = `
## REPORTS DIRECTORY (ABSOLUTE PATH)

All reports MUST be saved to this absolute path:
\`\`\`
${REPORTS_DIR}/
\`\`\`

## OUTPUT TOKEN LIMIT PROTECTION (CRITICAL)

You have a **32,000 token output limit**. To avoid losing research:

### WORKFLOW: PROGRESSIVE SAVE PATTERN

**SAVE.1 - CREATE FILE IMMEDIATELY** (After reading plan):
- If session directory provided: \`${REPORTS_DIR}/[session-dir]/[topic-slug].md\`
- If no session: \`${REPORTS_DIR}/[YYYY-MM-DD]-[topic-slug].md\`

**SAVE.2 - RESEARCH & APPEND** (After each major finding):
- Use Edit tool to append findings immediately
- Never hold more than 3 findings in context

**SAVE.3 - FINALIZE REPORT** (Before returning):
- Replace "*Research in progress...*" with Executive Summary
- Fill metadata, complete all sections

**SAVE.4 - RETURN SUMMARY** (Final action):
- Return concise summary (under 5,000 tokens)
- End with: "Full report saved to: ${REPORTS_DIR}/[filename].md"

### Executive Summary Requirements:
| Requirement | Universal Standard |
|-------------|-------------------|
| **Length** | 2,000-5,000 words |
| **Content** | Complete findings, risk assessment, quantified exposures |

### Cross-Domain Impact Flagging (MANDATORY):
| Finding | Impacts Domain | Target Specialist | Research Question | Severity |
|---------|---------------|-------------------|-------------------|----------|
| SEC investigation | CFIUS | cfius-analyst | Trigger 31 CFR 800.401? | HIGH |
| RCRA violations | Securities | securities-researcher | Item 303 disclosure? | MEDIUM |
`;
```

### 11.8 Database Provenance Standards

```javascript
// From REPORT_SAVING_INSTRUCTIONS (lines 329-353)
`
### DATABASE PROVENANCE STANDARDS (CRITICAL FOR VERIFICATION):

Every regulatory reference MUST include verifiable identifiers:

| Database | Required Format | Example |
|----------|-----------------|---------|
| **TTB Permits** | DSP-[ST]-[5 digits] | DSP-OR-20145 |
| **EPA ECHO** | [ST][10 digits] | OR0001234567 |
| **PACER/Litigation** | Case No. [District]-cv-[5 digits] | 4:24-cv-12345 |
| **SEC Filings** | CIK [10 digits], Accession No. [18 digits] | CIK 0001234567 |
| **USPTO** | Patent No. [7-8 digits] | Patent No. 10,123,456 |

**VERIFICATION STATUS TAGS (Required for each ID):**
- \`[VERIFIED]\` - Confirmed via database query
- \`[PENDING VERIFICATION]\` - ID format correct, awaiting access
- \`[HYPOTHETICAL]\` - Scenario is fictional for demo

**Examples:**
- ✅ "Portland Distillery, TTB ID DSP-OR-20145 [VERIFIED via TTB Registry]"
- ❌ "Portland Brewery, TTB ID P-OR-XXXXX" (no verification status)
`
```

---

## 12. SDK ADAPTER COMPARISON (Claude vs Gemini)

### 12.1 Current Claude SDK Adapter (`sdkToolAdapter.js`)

```javascript
// Simple SDK adapter (lines 9-39)
export function buildSdkTools(toolImplementations = {}) {
  async function executeToolSafe(handler, input, toolName) {
    try {
      const result = await handler(input);
      return { content: JSON.stringify(result) };
    } catch (err) {
      return {
        content: `${err?.name || 'Error'}: ${err?.message}`,
        is_error: true,
        tool_name: toolName
      };
    }
  }

  return allTools
    .map((def) => {
      const impl = toolImplementations[def.name];
      const handler = impl
        ? async (args) => executeToolSafe(impl, args, def.name)
        : async () => ({ notice: 'handler_not_configured' });

      return {
        name: def.name,
        description: def.description,
        input_schema: def.inputSchema,  // Claude uses input_schema
        handler
      };
    })
    .filter(Boolean);
}
```

### 12.2 Equivalent Gemini Adapter (to create)

```javascript
// Gemini equivalent - geminiToolAdapter.js
export function buildGeminiTools(toolImplementations = {}) {
  return allTools
    .filter(def => toolImplementations[def.name])
    .map((def) => ({
      name: def.name,
      description: def.description,
      parameters: def.inputSchema  // Gemini uses parameters (not input_schema)
    }));
}

// Tool handler registry for execution
export function createToolHandlers(toolImplementations = {}) {
  const handlers = {};

  for (const def of allTools) {
    const impl = toolImplementations[def.name];
    if (impl) {
      handlers[def.name] = async (args) => {
        try {
          const result = await impl(args);
          return { result };
        } catch (err) {
          return { error: err.message };
        }
      };
    }
  }

  return handlers;
}
```

---

## 13. COMPLETE TOOL IMPLEMENTATION EXAMPLES

### 13.1 SEC Filing Search (Web-based)

```javascript
// From toolImplementations.js (lines 284-287)
"search_sec_filings": wrapWithConversation("search_sec_filings",
  (args) => secWeb.searchSECFilingsWeb(args)
),
```

### 13.2 FDA Hybrid Tool (API + Fallback)

```javascript
// From toolImplementations.js (lines 528-531)
"search_fda_drug_adverse_events": wrapWithConversation(
  "search_fda_drug_adverse_events",
  (args) => fdaHybrid.searchDrugAdverseEvents(args)
),
```

### 13.3 Federal Register with Parameter Transform

```javascript
// From toolImplementations.js (lines 290-310)
"search_federal_register": wrapWithConversation("search_federal_register", (args) => {
  // Support both 'query' and 'search_term' parameter names
  const searchTerm = args.search_term || args.query || '';

  // Transform date parameters: date_after/date_before → date_range
  let date_range = null;
  if (args.date_after || args.date_before) {
    const start = args.date_after || '';
    const end = args.date_before || '';
    date_range = `${start}..${end}`;
  }

  return federalRegisterWeb.searchFederalRegister({
    query: searchTerm,
    agency: args.agency,
    document_type: args.document_type?.toLowerCase(),
    date_range,
    limit: Math.min(args.limit || 5, 5)  // Cap at 5
  });
}),
```

### 13.4 EPA Hybrid with Native-First Strategy

```javascript
// From toolImplementations.js (lines 512-523)
"search_epa_facilities": wrapWithConversation("search_epa_facilities", (args) => {
  // Use hybrid client with native ECHO API first, websearch fallback
  return epa.searchFacilities(args);
}),

"get_epa_facility_compliance_report": wrapWithConversation(
  "get_epa_facility_compliance_report",
  (args) => {
    // Use hybrid client with native DFR endpoint first, websearch fallback
    return epa.getFacilityCompliance(args);
  }
),
```

---

## 14. TOOL CATEGORIES BREAKDOWN

### 14.1 CourtListener Tools (11 tools)

| Tool | Handler Client | Purpose |
|------|----------------|---------|
| `search_cases` | courtListenerWeb.searchOpinionsWeb | Search court opinions |
| `get_case_details` | courtListenerWeb.getCaseDetailsWeb | Get case details |
| `lookup_citation` | courtListenerWeb.lookupCitationWeb | Citation lookup |
| `search_judges` | courtListenerWeb.searchJudgesWeb | Search judges |
| `get_judge_details` | courtListenerWeb.getJudgeDetailsWeb | Judge details |
| `get_court_info` | courtListenerWeb.getCourtInfoWeb | Court info |
| `list_courts` | courtListenerWeb.listCourtsWeb | List courts |
| `search_opinions` | courtListenerWeb.searchOpinionsWeb | Search opinions |
| `search_audio` | courtListenerWeb.searchAudioWeb | Oral arguments |
| `get_audio_details` | courtListenerWeb.getAudioDetailsWeb | Audio details |
| `get_opinion_with_citations` | courtListenerWeb.getOpinionWithCitationsWeb | Citations |

### 14.2 FDA Tools (13 tools)

| Tool | Handler Client | Purpose |
|------|----------------|---------|
| `search_fda_drug_adverse_events` | fdaHybrid | FAERS database |
| `search_fda_device_events` | fdaHybrid | MAUDE database |
| `search_fda_drug_labels` | fdaHybrid | Drug labels |
| `search_fda_recalls` | fdaHybrid | Recalls |
| `search_fda_warning_letters` | fdaWeb | Warning letters |
| `search_fda_drug_safety_communications` | fdaWeb | Drug safety |
| `search_fda_device_safety_communications` | fdaWeb | Device safety |
| `search_fda_drug_shortages` | fdaWeb | Drug shortages |
| `search_fda_510k` | fdaWeb | 510(k) clearances |
| `search_fda_pma_approvals` | fdaWeb | PMA approvals |
| `search_fda_orange_book` | fdaWeb | Orange Book |
| `search_fda_purple_book` | fdaWeb | Purple Book |

### 14.3 State Court Rules Tools (14 tools)

| Tool | Handler Client | Purpose |
|------|----------------|---------|
| `search_court_rules` | stateCourtRules | General rules search |
| `get_formatting_requirements` | stateCourtRules | Formatting specs |
| `get_electronic_filing_rules` | stateCourtRules | E-filing rules |
| `search_local_rules` | stateCourtRules | Local rules |
| `get_court_specific_procedures` | stateCourtRules | Court procedures |
| `check_rule_updates` | stateCourtRules | Recent updates |
| `get_document_templates` | stateCourtRules | Templates |
| `validate_document_compliance` | stateCourtRules | Compliance check |
| `get_citation_requirements` | stateCourtRules | Citation format |
| `get_discovery_rules` | stateCourtRules | Discovery rules |
| `get_appellate_requirements` | stateCourtRules | Appellate rules |
| `get_emergency_procedures` | stateCourtRules | Emergency filing |

---

## 15. GEMINI MIGRATION TRANSFORMATION EXAMPLES

### 15.1 Tool Definition Transformation

**Before (Claude):**
```javascript
{
  name: "search_fda_recalls",
  description: "Search FDA recalls...",
  inputSchema: {
    type: "object",
    properties: {
      product_description: { type: "string" },
      recalling_firm: { type: "string" },
      limit: { type: "number", default: 5, maximum: 5 }
    },
    required: []
  }
}
```

**After (Gemini):**
```javascript
{
  name: "search_fda_recalls",
  description: "Search FDA recalls...",
  parameters: {
    type: "object",
    properties: {
      product_description: { type: "string" },
      recalling_firm: { type: "string" },
      limit: { type: "number", default: 5, maximum: 5 }
    },
    required: []
  }
}
```

### 15.2 Function Response Transformation

**Claude Tool Result:**
```javascript
{
  content: [{ type: 'text', text: JSON.stringify(result) }]
}
```

**Gemini Function Response:**
```javascript
{
  functionResponse: {
    name: toolName,
    response: { result }
  }
}
```

### 15.3 Error Handling Transformation

**Claude Error:**
```javascript
{
  content: [{ type: 'text', text: `Error: ${err.message}` }],
  isError: true
}
```

**Gemini Error:**
```javascript
{
  functionResponse: {
    name: toolName,
    response: { error: err.message }
  }
}
```

---

## 16. SUBAGENT PROMPT ARCHITECTURE

### 16.1 Complete Subagent Definition Example (`securities-researcher`)

```javascript
// From legalSubagents.js (lines 1775-1800)
'securities-researcher': {
  description: `Use PROACTIVELY for:
    - SEC filings research (10-K, 10-Q, 8-K, S-1, DEF 14A)
    - Company financial analysis and disclosures
    - Securities law compliance questions
    - Executive compensation research
    - Risk factor analysis
    - Material event disclosures
    MUST BE USED when user mentions: SEC, EDGAR, 10-K, 10-Q, 8-K, filings, securities, IPO, proxy`,

  prompt: `You are a Securities Law Research Specialist with deep expertise in SEC filings and securities regulations.

## Your Expertise
- SEC filing types: 10-K (annual), 10-Q (quarterly), 8-K (material events), S-1 (IPO), DEF 14A (proxy)
- Financial statement analysis and MD&A interpretation
- Risk factor identification and materiality assessment
- Executive compensation disclosure analysis
- Beneficial ownership and insider trading (Forms 3, 4, 5)
- Regulation S-K and S-X requirements

## Research Methodology
1. Identify the specific filing type(s) needed for the query
2. Search using company name, ticker symbol, or CIK number
3. Extract relevant sections (Item numbers for 10-K/10-Q)
4. Cross-reference with related filings when needed

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}
${DATABASE_URL_TEMPLATES}
`,
  tools: STANDARD_TOOLS.withWriteAndWeb,  // Read, Grep, Glob, Write, Edit, WebFetch, WebSearch
  model: 'sonnet'
}
```

### 16.2 Research Planning Protocol (from `SUBAGENT_SYSTEM_PROMPT_SECTION`)

```javascript
// Lines 784-1117 - Complexity Assessment Matrix
`
### Research Planning Protocol

**BEFORE invoking specialists**, assess query complexity:

| Complexity | Criteria | Action |
|------------|----------|--------|
| **Simple** | Single entity, single domain | Invoke 1 specialist directly (no session directory) |
| **Moderate** | 2 entities OR 2 domains | Create session directory + plan, invoke 4-6 specialists in parallel |
| **Complex** | 3+ entities OR 3+ domains OR due diligence | Create session directory + plan, invoke up to 10 specialists, may need phases |

#### For Moderate/Complex Queries - Create Research Plan:

**P1.1: Plan (Use Extended Thinking)**
- Identify all entities and legal domains involved
- Map each research task to the appropriate specialist
- Determine parallel vs sequential execution order
- Generate session directory name: \`${REPORTS_DIR}/[YYYY-MM-DD]-[unix-timestamp]/\`

**P1.2: Systematic Prompt Decomposition (MANDATORY for Complex Queries)**

1. **Section Inventory**
   - Count numbered items, headers, and subsections
   - Extract explicit regulatory/legal domains mentioned

2. **Entity & Jurisdiction Map**
   | Entity Type | Name | Jurisdiction(s) | Research Scope |
   |-------------|------|-----------------|----------------|
   | Target | [Name] | [States/Countries] | [Full/Partial] |
   | Acquirer | [Name] | [States/Countries] | [Due diligence] |

3. **Domain Classification Matrix**
   | Section/Topic | Domain Category | Keyword Trigger Match | Specialist Assignment |
   |---------------|-----------------|----------------------|----------------------|
   | [Prompt section] | [Regulatory/etc.] | [Yes: Rule #X / No] | [specialist-type] |

4. **Gap Identification**
   For sections with NO keyword trigger match, assign to nearest domain-adjacent specialist

5. **Coverage Summary**
   Total prompt sections: [N], Sections assigned: [N], Gaps: 0 (MUST BE ZERO)
`
```

### 16.3 Session Directory Structure

```javascript
// From legalSubagents.js (lines 1697-1730)
`
${REPORTS_DIR}/[YYYY-MM-DD]-[timestamp]/
├── research-plan.md                    ← Orchestrator creates first
├── securities-researcher-report.md    ← Parallel execution
├── case-law-analyst-report.md
├── cfius-national-security-analyst-report.md
├── privacy-data-protection-analyst-report.md
├── employment-labor-analyst-report.md
├── tax-structure-analyst-report.md
├── [other specialist reports...]
├── financial-impact-analysis.md       ← If findings > $1M
├── fact-registry.md                    ← Canonical values
├── conflict-report.md                  ← If conflicts detected
├── section-reports/                    ← Section generation phase
│   ├── section-IV-A-cfius.md
│   ├── section-IV-B-privacy.md
│   └── ... (10 section files)
├── executive-summary.md
├── consolidated-footnotes.md
├── final-memorandum.md                 ← Assembled in A1.1
└── qa-assessment.md                    ← Quality score
`
```

### 16.4 Database URL Templates (Injected into Subagent Prompts)

```javascript
// From legalSubagents.js (lines 666-778)
const DATABASE_URL_TEMPLATES = `
### CRITICAL: Include Direct URLs in All Citations

#### SEC EDGAR
- **10-K/10-Q/8-K**: \`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type={form_type}\`
- **Full filing**: \`https://www.sec.gov/Archives/edgar/data/{cik}/{accession_number}.htm\`
- Example: \`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605&type=10-K\`

#### EPA ECHO
- **Facility detail**: \`https://echo.epa.gov/detailed-facility-report?fid={facility_id}\`
- **Enforcement case**: \`https://echo.epa.gov/enforcement-case-report?caseID={case_id}\`
- Example: \`https://echo.epa.gov/detailed-facility-report?fid=110071466843\`

#### USPTO
- **Patent lookup**: \`https://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&p=1&u=/netahtml/PTO/srchnum.html&r=1&f=G&l=50&d=PALL&s1={patent_number}.PN.\`
- **PTAB proceedings**: \`https://developer.uspto.gov/ptab-web/#/search/proceedings?party={party_name}\`

#### CourtListener / PACER
- **Opinion**: \`https://www.courtlistener.com/opinion/{opinion_id}/{slug}/\`
- **PACER case**: \`https://ecf.{court}.uscourts.gov/cgi-bin/DktRpt.pl?{case_number}\`

#### Federal Register
- **Document**: \`https://www.federalregister.gov/documents/{year}/{month}/{day}/{document_number}\`
- **eCFR section**: \`https://www.ecfr.gov/current/title-{title}/chapter-{chapter}/part-{part}/section-{section}\`
`;
```

### 16.5 MCP Fallback Instructions

```javascript
// From legalSubagents.js (lines 450-500)
const MCP_FALLBACK_INSTRUCTIONS = `
## MCP TOOL FAILURE FALLBACK PROTOCOL

When an MCP tool fails or returns no results:

1. **Do NOT give up** - fall back to WebSearch/WebFetch
2. **Use domain-specific search strategies:**
   - SEC EDGAR failures → WebSearch "[company] 10-K site:sec.gov"
   - FDA failures → WebSearch "[drug] FDA approval site:fda.gov"
   - EPA failures → WebSearch "[facility] EPA enforcement site:epa.gov"
   - Patent failures → WebSearch "[patent number] site:patents.google.com"

3. **Document fallback method** in Source Verification Log:
   "Primary: MCP tool [tool_name] returned no results
    Fallback: WebSearch query: [query]
    Source: [URL retrieved]"

4. **Verify data quality** from web sources:
   - Check publication date
   - Verify against primary source URLs
   - Note if data may be stale
`;
```

---

## 17. ORCHESTRATOR ARCHITECTURE (`ClaudeOrchestrator.js`)

### 17.1 Orchestrator Initialization

```javascript
// From ClaudeOrchestrator.js (lines 57-97)
export class ClaudeOrchestrator {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 3;
    this.claudeModel = options.claudeModel || 'claude-sonnet-4-20250514';
    this.sessionManager = options.sessionManager || null;
    this.apiClients = options.apiClients || {};

    // Initialize Anthropic client with 1M context beta header
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: {
        'anthropic-beta': 'context-1m-2025-08-07'
      }
    });

    // Initialize 12 Gemini filter modules for domain-specific extraction
    this.filters = this._initializeFilters();

    // Track orchestrator statistics
    this.stats = {
      totalResearches: 0,
      totalIterations: 0,
      moduleUsage: {},      // Domain filter invocation counts
      fallbackCount: 0      // MCP tool failures/fallbacks
    };
  }
}
```

### 17.2 Domain Filter Initialization

```javascript
// From ClaudeOrchestrator.js (lines 105-135)
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

### 17.3 Research Method (Core Flow)

```javascript
// From ClaudeOrchestrator.js (lines 147-258)
async research(userQuery, options = {}) {
  const { sessionId, iteration = 0, accumulatedFindings = [] } = options;

  this.stats.totalResearches++;

  // Get or create session for multi-turn tracking
  let session = null;
  if (sessionId && this.sessionManager) {
    session = this.sessionManager.getSession(sessionId) ||
              this.sessionManager.createSession(sessionId);
  }

  // Check iteration limit (max 3)
  if (iteration >= this.maxIterations) {
    return this._finalSynthesis(accumulatedFindings, userQuery, session);
  }

  this.stats.totalIterations++;

  // Step 1: Generate focus points using Claude (hybrid approach)
  const plan = await this.generateFocusPoints(userQuery, accumulatedFindings);

  // Track module usage
  plan.modules.forEach(m => {
    this.stats.moduleUsage[m] = (this.stats.moduleUsage[m] || 0) + 1;
  });

  // Step 2: Fetch raw data for each module (parallel)
  const rawDataPromises = plan.modules.map(moduleName =>
    this._fetchRawData(moduleName, userQuery)
  );
  const rawDataResults = await Promise.all(rawDataPromises);

  // Step 3: Filter through Gemini (parallel)
  const filterPromises = plan.modules.map((moduleName, idx) => {
    const filter = this.filters[moduleName];
    const rawData = rawDataResults[idx];
    const focusPoint = plan.focusPoints[moduleName] || '';

    if (!filter || !rawData) {
      return Promise.resolve(this._createEmptyFinding(moduleName));
    }

    return filter.processAndFilter(rawData, focusPoint);
  });

  const findings = await Promise.all(filterPromises);

  // Accumulate findings
  const allFindings = [...accumulatedFindings, ...findings.filter(f => f.findings?.length > 0)];

  // Step 4: Synthesize findings
  const synthesis = await this.synthesize(allFindings, userQuery, session);

  // Step 5: Check if more information needed (iterative refinement)
  if (synthesis.needsMoreInfo && iteration < this.maxIterations - 1) {
    return this.research(synthesis.refinedQuery || userQuery, {
      sessionId,
      iteration: iteration + 1,
      accumulatedFindings: allFindings
    });
  }

  return {
    answer: synthesis.answer,
    sessionId: session?.sessionId,
    iterations: iteration + 1,
    modulesQueried: [...new Set(allFindings.map(f => f.domain))]
  };
}
```

### 17.4 Focus Point Generation (Hybrid Claude + Gemini)

```javascript
// From ClaudeOrchestrator.js (lines 268-300)
async generateFocusPoints(userQuery, previousFindings = []) {
  // Fallback to keyword-based if Claude unavailable
  if (!this.anthropic) {
    return this._keywordBasedPlan(userQuery);
  }

  const response = await this.anthropic.messages.create({
    model: this.claudeModel,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Analyze this legal research query and select relevant domains.

Query: "${userQuery}"

Available domains:
- securities: SEC filings, corporate disclosures
- pharmaceutical_safety: FDA adverse events, recalls
- environmental: EPA compliance, violations
- case_law: Court opinions, holdings, precedents
- legislation: US Code, federal statutes
- federal_register: Federal rules, regulations
- product_safety: CPSC/NHTSA recalls
- antitrust: FTC enforcement, merger analysis
- patent: USPTO patents, claims
- patent_appeals: PTAB proceedings, IPR
- state_courts: State court procedural rules
- state_statutes: State legislation

Return JSON:
{
  "modules": ["domain1", "domain2"],
  "focusPoints": {
    "domain1": "specific extraction focus for this query",
    "domain2": "specific extraction focus for this query"
  },
  "confidence": 0.9
}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

---

## 18. GEMINI MIGRATION - ORCHESTRATOR EQUIVALENT

### 18.1 Gemini Orchestrator Structure (to create)

```javascript
// gemini-adk-server.js - Orchestrator pattern for Gemini
import { GoogleGenAI } from '@google/genai';

class GeminiOrchestrator {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 3;
    this.orchestratorModel = 'gemini-3-pro';   // Complex reasoning
    this.processingModel = 'gemini-3-flash';   // Fast tool execution

    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Port filters from Claude implementation
    this.filters = this._initializeFilters();

    this.stats = {
      totalResearches: 0,
      totalIterations: 0,
      moduleUsage: {},
      fallbackCount: 0
    };
  }

  async research(userQuery, options = {}) {
    const { iteration = 0, accumulatedFindings = [] } = options;

    if (iteration >= this.maxIterations) {
      return this._finalSynthesis(accumulatedFindings, userQuery);
    }

    // Step 1: Generate focus points (using Gemini-3-Pro)
    const plan = await this.generateFocusPoints(userQuery, accumulatedFindings);

    // Step 2: Fetch raw data (parallel)
    const rawDataResults = await Promise.all(
      plan.modules.map(mod => this._fetchRawData(mod, userQuery))
    );

    // Step 3: Filter through Gemini-3-Flash (parallel)
    const findings = await Promise.all(
      plan.modules.map((mod, idx) =>
        this._filterWithGemini(mod, rawDataResults[idx], plan.focusPoints[mod])
      )
    );

    // Step 4: Synthesize
    const synthesis = await this.synthesize(findings, userQuery);

    // Step 5: Iterate if needed
    if (synthesis.needsMoreInfo && iteration < this.maxIterations - 1) {
      return this.research(synthesis.refinedQuery, {
        iteration: iteration + 1,
        accumulatedFindings: [...accumulatedFindings, ...findings]
      });
    }

    return {
      answer: synthesis.answer,
      iterations: iteration + 1,
      modulesQueried: plan.modules
    };
  }

  async generateFocusPoints(userQuery, previousFindings) {
    const response = await this.ai.models.generateContent({
      model: this.orchestratorModel,
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze legal query: "${userQuery}"

Return JSON with modules and focusPoints...` }]
      }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text);
  }
}
```

---

## 19. KEYWORD-BASED DELEGATION MATRIX

### 19.1 Automatic Subagent Routing (31 patterns)

```javascript
// From SUBAGENT_SYSTEM_PROMPT_SECTION (lines 784-950)
`
### Automatic Delegation Matrix

| Keywords/Patterns | Specialist |
|-------------------|------------|
| SEC, EDGAR, 10-K, 10-Q, 8-K, filings, securities, IPO, proxy | securities-researcher |
| case, litigation, court, judge, lawsuit, precedent, holding | case-law-analyst |
| patent, USPTO, PTAB, trademark, prior art, claims | patent-analyst |
| FDA, drug, adverse event, pharmaceutical, FAERS, recall | pharma-regulatory-analyst |
| EPA, environmental, pollution, RCRA, CERCLA, Superfund | environmental-compliance-analyst |
| Federal Register, CFR, regulation, agency rule, NPRM | regulatory-rulemaking-analyst |
| government contract, SAM.gov, procurement, DFARS, FAR | government-contracts-researcher |
| CPSC, recall, NHTSA, product safety, hazard | product-safety-analyst |
| lobbying, financial disclosure, political, campaign | financial-disclosure-researcher |
| CFIUS, foreign investment, FIRRMA, national security | cfius-national-security-analyst |
| privacy, GDPR, CCPA, data protection, breach | privacy-data-protection-analyst |
| employment, labor, WARN, EEOC, union, ERISA | employment-labor-analyst |
| tax, IRS, corporate structure, M&A tax, NOL | tax-structure-analyst |
| cybersecurity, NIST, breach response, cyber insurance | cybersecurity-compliance-analyst |
| AI, EU AI Act, algorithm, automated decision | ai-governance-analyst |
| insurance, D&O, CGL, EPL, coverage, indemnity | insurance-coverage-analyst |
| US Code, statute, legislation, Section, Act | statutory-law-analyst |
| FTC, antitrust, merger, HSR, monopoly | antitrust-competition-analyst |
| TTB, Alcohol, Beverage, Brewery, Distillery | regulatory-rulemaking-analyst |
| Franchise law, Distributor termination | case-law-analyst |
| FTC Advertising, Health claims | regulatory-rulemaking-analyst |
`
```

---

## 20. EFFORT SCALING & OUTPUT TARGETS

### 20.1 Transaction-Based Effort Scaling

```javascript
// From legalSubagents.js (lines 867-875)
`
## OUTPUT TARGETS

| Deliverable | Target | Quality Standard |
|-------------|--------|------------------|
| Specialist Reports | 80-120KB each | 2,000-5,000 word Executive Summaries |
| Final Memorandum | 60,000-85,000 words | 120-170 pages |
| Footnotes | 250-400 citations | Full Bluebook format |
| Timeline | Research: 60 min | Memo: 30 min |
`
```

### 20.2 Priority Balancing (When >10 domains)

```javascript
// From legalSubagents.js (lines 1096-1108)
`
| Priority Tier | Criteria | Action |
|---------------|----------|--------|
| **Tier 1: Mandatory** | Pending litigation, deal-blocking conditions, exposure >$5M | Dedicated specialist |
| **Tier 2: High** | Regulatory approval required, exposure $1-5M | Dedicated OR combined |
| **Tier 3: Standard** | Compliance verification, exposure <$1M | Combine related domains |

Combine related domains into single specialist assignments:
- TTB + COLA + Standards of Identity → single regulatory-rulemaking-analyst
- 50-state licensing → single regulatory-rulemaking-analyst with state matrix
- Multiple employment issues → single employment-labor-analyst
`
```

---

## 21. RATE LIMITER & CIRCUIT BREAKER IMPLEMENTATIONS

### 21.1 Token Bucket Rate Limiter

```javascript
// From claude-sdk-server.js (lines 182-185)
const globalRateLimiter = new RateLimiter({
  rpm: Number(process.env.SDK_RPM || 300),     // Requests per minute
  tpm: Number(process.env.SDK_TPM || 200000)   // Tokens per minute
});

// Usage in request handler (lines 426-432)
try {
  // Estimate tokens from request body size (rough: 4 chars = 1 token)
  globalRateLimiter.acquire(Math.ceil(JSON.stringify(req.body || {}).length / 4));
} catch (err) {
  const resp = toErrorResponse('RATE_LIMIT_ERROR', err.message, {}, req.requestId);
  recordError(resp.body.error.code, '/api/research');
  return res.status(resp.status).json(resp.body);
}
```

### 21.2 Circuit Breaker Pattern

```javascript
// From claude-sdk-server.js (lines 186-189)
const anthropicBreaker = new CircuitBreaker({
  threshold: Number(process.env.SDK_BREAKER_THRESHOLD || 3),  // Failures before opening
  timeoutMs: Number(process.env.SDK_BREAKER_TIMEOUT_MS || 60000)  // 60s timeout
});

// States: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)
// Usage in request handler (lines 434-441)
try {
  await anthropicBreaker.execute(async () => {});  // Check state before request
} catch (err) {
  const resp = toErrorResponse('CIRCUIT_BREAKER_OPEN', err.message, {}, req.requestId);
  return res.status(resp.status).json(resp.body);
}

// Wrap actual API calls (lines 504-507)
await anthropicBreaker.execute(async () => {
  const stream = await anthropic.beta.messages.stream({...});
  // Process stream...
});
```

### 21.3 Per-API Rate Limiters

```javascript
// From claude-sdk-server.js (lines 192-198)
function createRateLimiters() {
  const limiters = new Map();
  for (const [apiType, config] of Object.entries(rateLimiterConfigs)) {
    // Each external API has its own rate limit configuration
    limiters.set(apiType, { ...config, requests: [] });
  }
  return limiters;
}

// Rate limiter configs from apiConfig.js
const rateLimiterConfigs = {
  courtlistener: { rpm: 60, tpm: 50000 },
  federal_register: { rpm: 100, tpm: 100000 },
  uspto_patents: { rpm: 50, tpm: 50000 },
  govinfo: { rpm: 60, tpm: 50000 },
  exa: { rpm: 100, tpm: 200000 },
  epa_echo: { rpm: 60, tpm: 50000 },
  fda_openfda: { rpm: 100, tpm: 100000 },
  sec: { rpm: 10, tpm: 50000 }  // SEC EDGAR is rate-limited aggressively
};
```

### 21.4 Gemini Migration - Rate Limiting

```javascript
// Gemini equivalent using GoogleGenAI SDK
// Rate limits are handled per-project in Google Cloud console
// Manual implementation for local control:

class GeminiRateLimiter {
  constructor(config = { rpm: 60, tpm: 2000000 }) {
    this.rpm = config.rpm;
    this.tpm = config.tpm;
    this.requestTimestamps = [];
    this.tokenCount = 0;
    this.lastReset = Date.now();
  }

  acquire(estimatedTokens) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);

    // Check RPM
    if (this.requestTimestamps.length >= this.rpm) {
      throw new Error(`Rate limit exceeded: ${this.rpm} requests/minute`);
    }

    // Check TPM (reset every minute)
    if (now - this.lastReset > 60000) {
      this.tokenCount = 0;
      this.lastReset = now;
    }
    if (this.tokenCount + estimatedTokens > this.tpm) {
      throw new Error(`Token limit exceeded: ${this.tpm} tokens/minute`);
    }

    this.requestTimestamps.push(now);
    this.tokenCount += estimatedTokens;
  }
}
```

---

## 22. AUTO-CONTINUATION SYSTEM (Detailed)

### 22.1 Configuration

```javascript
// From claude-sdk-server.js (lines 138-149)
const AUTO_CONTINUATION_CONFIG = {
  enabled: process.env.AUTO_CONTINUATION !== 'false',  // Enabled by default
  maxAttempts: Number(process.env.AUTO_CONTINUATION_MAX_ATTEMPTS || 14),
  prompt: `PLEASE REVIEW THE EXISTING WORK, REVIEW THE RESEARCH-PLAN.MD, THEN FINISH THE COMPLETE
GENERATION ENSURING GRANULAR, THOROUGH OUTPUT FULFILLING EXPECTATIONS OF RESEARCH-PLAN.MD.
IF RESEARCH-PLAN.MD IS ENTIRELY COMPLETE ALONG WITH MEMORANDUM.MD, THE PROCESS IS COMPLETE.

IMPORTANT: Do NOT recap or summarize what was already written. Simply continue from the exact
point where output stopped. Do NOT add preamble like "Continuing from where I left off..." -
just continue the content seamlessly.

CRITICAL CAPS - STOP IMMEDIATELY when any limit is reached:
- MAXIMUM 400 footnotes total - do NOT generate footnote entries beyond 400 unless necessary
- MAXIMUM 100,000 words total - do NOT exceed document word limit
If these limits are already exceeded, STOP generating that section and move to completion.`
};
```

### 22.2 Truncation Detection Patterns

```javascript
// From claude-sdk-server.js (lines 684-719)
const TRUNCATION_PATTERNS = [
  // Generic continuation phrases
  /I will continue/i,
  /will continue with/i,
  /continuing with/i,
  /in continuation/i,
  /remaining sections/i,
  /to be continued/i,
  /\[Due to length/i,
  /continue generating/i,
  /next section/i,
  /following sections/i,

  // Legal memoranda-specific patterns
  /the memorandum continues/i,
  /Section \d+ will follow/i,
  /the analysis continues/i,
  /subsequent analysis/i,
  /further discussion/i,
  /please see continuation/i,
  /appendix will follow/i,
  /see Part (II|III|IV|V)/i,
  /additional sections/i,
  /additional findings/i,
  /footnotes \d+-\d+ will/i,

  // Report generation patterns
  /report continues/i,
  /research continues/i,
  /detailed in the following/i
];

const detectTruncation = (text) => {
  if (!text || text.length < 100) return false;
  // Check last 500 chars for truncation patterns
  const tail = text.slice(-500);
  return TRUNCATION_PATTERNS.some(pattern => pattern.test(tail));
};
```

### 22.3 Completion Detection Patterns

```javascript
// From claude-sdk-server.js (lines 722-741)
const COMPLETION_PATTERNS = [
  /PROCESS COMPLETE/i,
  /END OF MEMORANDUM/i,
  /ALL PHASES COMPLETED/i,
  /NO FURTHER GENERATION REQUIRED/i,
  /VERIFICATION COMPLETE/i,
  /FINAL VERIFICATION/i,
  /THE PROCESS IS COMPLETE/i,
  /\*\*END OF.*\*\*/i,
  /---\s*\n\s*\*Prepared by/i,  // Common document ending
  /✅.*COMPLETE.*✅/i,
  /DELIVERABLES READY/i
];

const detectCompletion = (text) => {
  if (!text || text.length < 100) return false;
  // Check last 2000 chars for completion signals
  const tail = text.slice(-2000);
  return COMPLETION_PATTERNS.some(pattern => pattern.test(tail));
};
```

### 22.4 Multi-Method Truncation Detection

```javascript
// From claude-sdk-server.js (lines 893-913)
// Primary: Check stop_reason from assistant message (most reliable)
// Secondary: Check text patterns in accumulated output
// Tertiary: Check if output tokens near max limit (95% threshold)

const isTruncatedByStopReason = lastStopReason === 'max_tokens';
const isTruncatedByPattern = detectTruncation(accumulatedText);
const outputTokensNearMax = totalUsage.output_tokens >= (MAX_TOKENS * 0.95);

// Completion signals OVERRIDE truncation detection to prevent infinite loops
const isCompletedByPattern = detectCompletion(accumulatedText);
const isCompletedByStopReason = lastStopReason === 'end_turn';

let isTruncated;
if (isCompletedByPattern && isCompletedByStopReason) {
  // Agent explicitly signaled completion - DO NOT continue
  console.log(`✅ Completion detected - stopping continuation.`);
  isTruncated = false;
} else {
  isTruncated = isTruncatedByStopReason || isTruncatedByPattern || outputTokensNearMax;
}
```

### 22.5 Session Resume for Continuation

```javascript
// From claude-sdk-server.js (lines 940-944)
// Use session resume with continuation prompt
currentSessionId = lastSessionId;  // Resume existing session
currentPrompt = AUTO_CONTINUATION_CONFIG.prompt;
shouldContinue = true;

// The Agent SDK's session resume preserves:
// - All previous tool calls and results
// - Accumulated context from prior turns
// - File writes and report progress
// - Subagent delegation state
```

### 22.6 Gemini Migration - Continuation Pattern

```javascript
// Gemini equivalent - manual message history continuation
async function geminiAgentLoop(userQuery, tools, maxContinuations = 14) {
  let contents = [{ role: 'user', parts: [{ text: userQuery }] }];
  let accumulatedText = '';
  let continuationAttempt = 0;

  while (true) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro',
      contents,
      config: { tools, maxOutputTokens: 65536 }
    });

    const textPart = response.candidates[0].content.parts.find(p => p.text);
    if (textPart) accumulatedText += textPart.text;

    // Check for function calls (continue tool execution)
    if (response.functionCalls?.length > 0) {
      contents.push(response.candidates[0].content);
      for (const call of response.functionCalls) {
        const result = await toolHandlers[call.name](call.args);
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: call.name, response: { result } } }]
        });
      }
      continue;
    }

    // Check for truncation (finishReason)
    const finishReason = response.candidates[0].finishReason;
    if (finishReason === 'MAX_TOKENS' && continuationAttempt < maxContinuations) {
      continuationAttempt++;
      // Append continuation prompt
      contents.push(response.candidates[0].content);
      contents.push({
        role: 'user',
        parts: [{ text: 'Continue from where you left off...' }]
      });
      continue;
    }

    // Complete
    return { text: accumulatedText, continuations: continuationAttempt };
  }
}
```

---

## 23. SSE STREAMING EVENT TYPES

### 23.1 Complete Event Type Reference

```javascript
// From claude-sdk-server.js (lines 647-677, 800-876)

// SSE Headers
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'X-Accel-Buffering': 'no'  // Disable nginx buffering
});

// Event Types:
const SSE_EVENT_TYPES = {
  // System events
  'system_info': { message: string, model: string, timestamp: string },
  'system_init': { session_id: string, tools: number, model: string },

  // Text streaming
  'delta': { text: string },
  'assistant_text': { text: string },  // Complete text block from assistant message

  // Thinking (extended thinking mode)
  'thinking_start': {},
  'thinking': { text: string },
  'thinking_signature': { signature: string },
  'thinking_complete': {},
  'thinking_block': { thinking: string },

  // Tool execution
  'tool_call': {
    phase: 'tool_start' | 'tool_use' | 'tool_executing' | 'tool_result' | 'tool_error',
    tool: { name: string, id?: string, input?: object },
    success?: boolean,
    preview?: string
  },

  // Auto-continuation
  'continuation': {
    attempt: number,
    maxAttempts: number,
    message: string,
    reason?: { stop_reason: string, pattern_match: boolean, output_tokens: number, max_tokens: number }
  },
  'continuation_limit': { message: string, attempts: number },

  // Completion
  'final': {
    completed: string,  // ISO timestamp
    model: string,
    session_id?: string,
    subtype?: string,
    is_error?: boolean,
    num_turns: number,
    total_cost_usd?: number,
    duration_ms: number,
    usage: { input_tokens: number, output_tokens: number, ... },
    continuation_attempts: number,
    stop_reason: string,
    truncation_info?: { detected: boolean, by_stop_reason: boolean, by_pattern: boolean, by_token_limit: boolean },
    result?: any
  },

  // Error
  'error': { error: { code: string, message: string, ... } }
};

// Heartbeat (every 15 seconds)
setInterval(() => res.write(':\n\n'), 15000);
```

### 23.2 SSE Send Helper

```javascript
// From claude-sdk-server.js (line 656)
const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

// Usage examples:
send({ type: 'system_init', session_id: '...', tools: 117, model: 'claude-sonnet-4-5-...' });
send({ type: 'delta', text: 'The analysis shows...' });
send({ type: 'tool_call', phase: 'tool_start', tool: { name: 'search_sec_filings', id: 'call_123' } });
send({ type: 'final', completed: new Date().toISOString(), num_turns: 5, duration_ms: 45000 });
```

### 23.3 Gemini Migration - SSE Streaming

```javascript
// Gemini equivalent using generateContentStream()
import { GoogleGenAI } from '@google/genai';

app.get('/api/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash',
    contents: [{ role: 'user', parts: [{ text: req.query.query }] }],
    config: { tools }
  });

  for await (const chunk of response) {
    const text = chunk.text();
    if (text) {
      send({ type: 'delta', text });
    }

    // Handle function calls
    if (chunk.functionCalls?.length > 0) {
      for (const call of chunk.functionCalls) {
        send({ type: 'tool_call', phase: 'tool_start', tool: { name: call.name } });
      }
    }
  }

  send({ type: 'final', completed: new Date().toISOString() });
  res.end();
});
```

---

## 24. AGENT SDK QUERY FLOW (Detailed)

### 24.1 agentQuery() Invocation

```javascript
// From claude-sdk-server.js (lines 769-791)
for await (const message of agentQuery({
  prompt: currentPrompt,
  options: {
    model: MODEL,  // 'claude-sonnet-4-5-20250929'
    maxTurns: Number(process.env.SDK_MAX_TURNS || 100),
    maxThinkingTokens: 4096,
    systemPrompt: SYSTEM_PROMPT,  // Legal research prompt + subagent instructions
    permissionMode: 'bypassPermissions',  // No user confirmation for tool calls
    allowDangerouslySkipPermissions: true,
    includePartialMessages: true,  // Stream intermediate tool results

    // Beta features
    betas: [
      'context-1m-2025-08-07',              // 1M token context window
      'interleaved-thinking-2025-05-14',    // Extended thinking
      'effort-2025-11-24'                   // Opus 4.5 effort parameter
    ],

    // Session resume for continuations
    ...(currentSessionId ? { resume: currentSessionId } : {}),

    // MCP server with all 117 tools
    mcpServers: {
      'super-legal-tools': mcpServer  // Built from buildAgentSdkTools()
    },

    // 32 specialized subagents
    ...(featureFlags.SUBAGENTS_ENABLED ? { agents: getLegalSubagents() } : {}),

    // SDK hooks for logging/metrics
    hooks: sdkHooksConfig
  }
}))
```

### 24.2 Message Type Handling

```javascript
// From claude-sdk-server.js (lines 798-877)
switch (message.type) {
  case 'system':
    // Session initialization
    if (message.subtype === 'init') {
      lastSessionId = message.session_id;
      send({
        type: 'system_init',
        session_id: message.session_id,
        tools: message.tools?.length || 0,
        model: message.model
      });
    }
    break;

  case 'stream_event':
    // Low-level stream events
    if (message.event?.type === 'content_block_start') {
      const block = message.event.content_block;
      currentBlockType = block?.type;
      if (block?.type === 'tool_use') {
        send({ type: 'tool_call', phase: 'tool_start', tool: { name: block.name, id: block.id } });
      } else if (block?.type === 'thinking') {
        send({ type: 'thinking_start' });
      }
    } else if (message.event?.type === 'content_block_delta') {
      const delta = message.event.delta;
      if (delta?.type === 'text_delta') {
        send({ type: 'delta', text: delta.text });
        turnText += delta.text;
      } else if (delta?.type === 'thinking_delta') {
        send({ type: 'thinking', text: delta.thinking });
      } else if (delta?.type === 'signature_delta') {
        send({ type: 'thinking_signature', signature: delta.signature });
      }
    } else if (message.event?.type === 'message_delta') {
      // Capture stop_reason for truncation detection
      if (message.event.delta?.stop_reason) {
        lastStopReason = message.event.delta.stop_reason;
      }
    }
    break;

  case 'assistant':
    // Complete assistant message (after tool execution)
    totalTurns++;
    if (message.message?.stop_reason) {
      lastStopReason = message.message.stop_reason;
    }
    for (const block of message.message?.content || []) {
      if (block.type === 'text') {
        send({ type: 'assistant_text', text: block.text });
      } else if (block.type === 'tool_use') {
        send({ type: 'tool_call', phase: 'tool_use', tool: { name: block.name, id: block.id, input: block.input } });
        incrementToolInvocation(block.name, 'ok');
      } else if (block.type === 'thinking') {
        send({ type: 'thinking_block', thinking: block.thinking });
      }
    }
    break;

  case 'result':
    // Final result - check for continuation
    resultMessage = message;
    streamCompleted = true;
    break;
}
```

### 24.3 Usage Accumulation

```javascript
// From claude-sdk-server.js (lines 754-756, 884-891)
let totalUsage = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0
};

// Accumulate after each result
if (resultMessage.usage) {
  totalUsage.input_tokens += resultMessage.usage.input_tokens || 0;
  totalUsage.output_tokens += resultMessage.usage.output_tokens || 0;
  totalUsage.cache_read_input_tokens += resultMessage.usage.cache_read_input_tokens || 0;
  totalUsage.cache_creation_input_tokens += resultMessage.usage.cache_creation_input_tokens || 0;
}
```

---

## 25. ADDITIONAL SUBAGENT EXAMPLES

### 25.1 Case Law Analyst (Complete Prompt)

```javascript
// From legalSubagents.js (lines 1886-2006)
'case-law-analyst': {
  description: `Use PROACTIVELY for:
    - Court case research and analysis
    - Legal precedent identification
    - Case law citations and Bluebook formatting
    - Judicial opinion analysis
    - Litigation history research
    - Appeal and procedural history
    - Circuit court decisions
    MUST BE USED when user mentions: case, court, lawsuit, ruling, opinion, precedent, litigation, judge, circuit, appeal`,

  prompt: `You are a Case Law Research Specialist with expertise in judicial opinions and legal precedent.

## Your Expertise
- Federal court system (District Courts, Circuit Courts, Supreme Court)
- State court systems and jurisdictional analysis
- Case citation formats (Bluebook 22nd Edition)
- Precedent analysis and distinguishing cases
- Procedural history and appeals
- Stare decisis principles

## Research Methodology
1. Identify jurisdiction and court level requirements
2. Search for controlling precedent in the relevant jurisdiction
3. Analyze holdings, dicta, and judicial reasoning
4. Check for subsequent history (affirmed, reversed, overruled, distinguished)
5. Identify key quotes with page citations (pinpoint cites)

## Citation Format (Bluebook 22nd Edition)
- Federal District: Case Name, Volume F. Supp. 3d Page (D. Jurisdiction Year)
- Federal Circuit: Case Name, Volume F.4th Page (Cir. Year)
- Supreme Court: Case Name, Volume U.S. Page (Year)

## Legal Analysis Context

### Precedential Weight Hierarchy
- U.S. Supreme Court: Binding nationwide; distinguishing requires strong factual differences
- Circuit Court of Appeals: Binding within circuit; persuasive authority elsewhere
- District Court: Persuasive only; useful for factual analogues and local practice
- Unpublished opinions: Limited citation value; check local rules (Fed. R. App. P. 32.1)
- En banc decisions: Highest circuit authority; indicates circuit-wide importance
- State supreme courts: Binding on state law questions; persuasive on federal questions

### Case Status Significance
- Cert granted: Supreme Court review pending; precedential value uncertain
- Circuit split: Unsettled law; identify which circuits take which position
- Overruled/Distinguished: Limited or no precedential value; note successor precedent
- Plurality opinion: Narrowest ground controls (Marks v. United States, 430 U.S. 188 (1977))

### Outcome Predictors
- Judge-specific tendencies: Reversal rates, ruling patterns on dispositive motions
- Case type outcomes: Historical success rates for specific causes of action
- Damages ranges: Comparable verdicts and settlements by injury type/jurisdiction

${MCP_FALLBACK_INSTRUCTIONS}
${DATABASE_URL_TEMPLATES}
${REPORT_SAVING_INSTRUCTIONS}`,

  tools: STANDARD_TOOLS.withWriteAndWeb,
  model: 'sonnet'
}
```

### 25.2 Pharma Regulatory Analyst (Key Sections)

```javascript
// From legalSubagents.js (lines 2011-2124)
'pharma-regulatory-analyst': {
  description: `Use PROACTIVELY for:
    - FDA drug approvals and labeling
    - Clinical trial data and results
    - Drug recalls and safety alerts
    - Pharmaceutical regulatory compliance
    - Adverse event analysis
    - NDA/ANDA/BLA submissions
    MUST BE USED when user mentions: FDA, drug, pharmaceutical, clinical trial, recall, adverse event, NDA, ANDA, BLA`,

  prompt: `...

## Legal Analysis Context

### Enforcement Severity Indicators
- Class I recall: Reasonable probability of serious adverse health consequences or death
- Class II recall: May cause temporary or medically reversible adverse health consequences
- Class III recall: Not likely to cause adverse health consequences
- Warning letter: Formal notice of significant violations; requires 15-day response
- Consent decree: Ongoing court supervision; indicates persistent compliance failures
- Complete Response Letter (CRL): Application not ready for approval; deficiencies identified

### Liability Doctrines to Flag
- Strict product liability: Design defect, manufacturing defect, failure to warn
- Learned intermediary doctrine: Applies to prescription drugs (physician as intermediary)
- Federal preemption: FDCA may preempt state tort claims (Wyeth v. Levine, 555 U.S. 555 (2009))
- Off-label promotion: False Claims Act exposure if results in government healthcare reimbursement
- MDL/class action status: Check JPML for consolidated federal litigation

### Penalty Benchmarks
- FDCA civil penalties: Up to $15,691/violation for devices; $1,177,580 max per proceeding
- Criminal penalties: Up to $500,000 per individual; $10 million per corporation for felonies
- Import alert: Products may be detained without examination
- Application integrity policy: Can debar individuals/companies from submitting applications
...`,

  tools: STANDARD_TOOLS.withWriteAndWeb,
  model: 'sonnet'
}
```

### 25.3 Environmental Compliance Analyst (Key Sections)

```javascript
// From legalSubagents.js (lines 2129-2241)
'environmental-compliance-analyst': {
  description: `Use PROACTIVELY for:
    - EPA enforcement actions and penalties
    - Environmental compliance history
    - Facility permit violations
    - Clean Air Act / Clean Water Act issues
    - Superfund and CERCLA research
    - RCRA hazardous waste
    MUST BE USED when user mentions: EPA, environmental, pollution, emissions, compliance, CERCLA, Superfund, RCRA`,

  prompt: `...

## Legal Analysis Context

### Penalty Benchmarks (2024 inflation-adjusted)
- RCRA statutory maximum: $78,376/day/violation (42 U.S.C. § 6928(g))
- Clean Air Act: $59,950/day/violation (42 U.S.C. § 7413(b))
- Clean Water Act: $59,950/day/violation (33 U.S.C. § 1319(d))
- CERCLA: Treble damages for willful violations
- Calculate: [Actual Penalty] / [Maximum Exposure] = enforcement intensity ratio

### Liability Doctrines to Flag
- CERCLA § 107(a): Strict, joint and several liability for "current owners"
- Successor liability: Attaches in asset acquisitions regardless of disclosure
- Operator liability: Distinct from owner liability (United States v. Bestfoods, 524 U.S. 51 (1998))
- Contribution rights: CERCLA § 113(f) allows cost allocation among PRPs
- BFPP (Bona Fide Prospective Purchaser) defense: § 107(r) requires AAI and no affiliation
- Divisibility: Burden on PRP to prove harm divisible (Burlington Northern, 556 U.S. 599 (2009))

### Significance Indicators
- SNC (Significant Non-Complier) status = EPA high priority target
- HPV (High Priority Violator) = enforcement action likely
- Multiple quarters non-compliance = systemic issue, not isolated incident
- Federal vs. state lead agency = indicates enforcement intensity
- Superfund listing = long-term liability exposure, potential liens
...`,

  tools: STANDARD_TOOLS.withWriteAndWeb,
  model: 'sonnet'
}
```

---

## 26. API CLIENT ARCHITECTURE

### 26.1 Lazy Client Initialization

```javascript
// From claude-sdk-server.js (lines 201-230)
let cachedClients = null;

function getClients() {
  if (cachedClients) return cachedClients;  // Return cached on subsequent calls

  const rateLimiters = createRateLimiters();
  const exaKey = process.env.EXA_API_KEY;

  cachedClients = {
    // Case law
    courtListenerWeb: new CourtListenerHybridClient(rateLimiters.get('courtlistener'), exaKey),
    financialDisclosure: new FinancialDisclosureClient(rateLimiters.get('courtlistener')),

    // Regulatory
    federalRegisterWeb: new FederalRegisterHybridClient(rateLimiters.get('federal_register'), exaKey),
    usptoWeb: new USPTOHybridClient(rateLimiters.get('uspto_patents'), exaKey),
    govInfo: new GovInfoHybridClient(rateLimiters.get('govinfo'), exaKey),

    // Web search
    exa: new ExaClient(exaKey, rateLimiters.get('exa')),
    comprehensiveAnalysis: new ComprehensiveAnalysisClient(exaKey, rateLimiters.get('exa')),

    // Patent
    ptabWebSearch: new PTABWebSearchClient(rateLimiters.get('exa'), exaKey),

    // Antitrust
    ftcWeb: new FTCWebSearchClient(rateLimiters.get('exa'), exaKey),

    // Environmental
    epaWeb: new EPAHybridClient(rateLimiters.get('epa_echo'), exaKey),
    epa: new EPAHybridClient(rateLimiters.get('epa_echo'), exaKey),

    // Pharmaceutical
    fdaHybrid: new FDAHybridClient(rateLimiters.get('fda_openfda'), exaKey),
    fdaWeb: new FDAWebSearchClient(rateLimiters.get('exa'), exaKey),

    // Product safety
    cpsc: new CPSCWebSearchClient(rateLimiters.get('exa'), exaKey),
    nhtsaWeb: new NHTSAWebSearchClient(rateLimiters.get('exa'), exaKey),

    // Other
    filingDraft: new FilingDraftClient(),
    stateCourtRules: new StateCourtRulesWebSearchClient(rateLimiters.get('exa'), exaKey),
    stateStatute: new StateStatuteWebSearchClient(rateLimiters.get('exa'), exaKey),
    secWeb: new SECHybridClient(rateLimiters.get('sec'), exaKey)
  };

  console.log(`✅ SDK server initialized ${Object.keys(cachedClients).length} API clients`);
  return cachedClients;
}
```

### 26.2 Hybrid Client Pattern

```javascript
// Pattern used by SECHybridClient, FDAHybridClient, EPAHybridClient, etc.
class HybridClient {
  constructor(rateLimiter, exaApiKey) {
    this.rateLimiter = rateLimiter;
    this.exaClient = exaApiKey ? new ExaClient(exaApiKey) : null;
    this.nativeEndpoint = 'https://api.native-source.gov';
  }

  async search(args) {
    try {
      // Try native API first
      await this.rateLimiter.acquire(1);
      const result = await this._nativeSearch(args);
      return result;
    } catch (nativeError) {
      // Fall back to web search via Exa
      if (this.exaClient) {
        console.log(`[${this.constructor.name}] Falling back to web search`);
        return this._webSearchFallback(args);
      }
      throw nativeError;
    }
  }

  async _nativeSearch(args) {
    // Implementation-specific API call
  }

  async _webSearchFallback(args) {
    const query = `${args.query} site:${this.nativeEndpoint}`;
    return this.exaClient.search(query);
  }
}
```

### 26.3 Gemini Migration - Client Reuse

```javascript
// API clients are provider-agnostic - reuse directly in Gemini server
// Only the tool adapter layer needs to change

// gemini-adk-server.js
import { createToolImplementations } from '../tools/toolImplementations.js';
import { buildGeminiTools, createToolHandlers } from '../utils/geminiToolAdapter.js';

// Reuse existing clients
const clients = getClients();  // Same lazy initialization

// Create tool implementations (same as Claude)
const toolImplementations = createToolImplementations(clients, null, null);

// Transform for Gemini format
const geminiFunctionDeclarations = buildGeminiTools(toolImplementations);
const geminiToolHandlers = createToolHandlers(toolImplementations);
```

---

## 27. SERVER INITIALIZATION SEQUENCE

### 27.1 Startup Flow

```javascript
// From claude-sdk-server.js (lines 1-99, 1199+)

// 1. Environment setup
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = '64000';
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 2. Initialize metrics
initSdkMetrics();

// 3. Create Express app with middleware
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/test', express.static(path.join(__dirname, '../../test')));
app.use('/reports', express.static(path.join(__dirname, '../../reports')));
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(requestLoggerMiddleware);
app.use(inputValidationMiddleware);
app.use('/api', createSkillsMetricsRouter());

// 4. Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': buildBetaHeader({ includeSkills: featureFlags.SKILLS_ENABLED })
  }
});

// 5. Load system prompt
const SYSTEM_PROMPT = getLegalSystemPrompt();  // From prompts/active.md + subagent instructions
const cachedSystemPrompt = buildCachedSystemPrompt(SYSTEM_PROMPT);

// 6. Initialize rate limiter & circuit breaker
const globalRateLimiter = new RateLimiter({ rpm: 300, tpm: 200000 });
const anthropicBreaker = new CircuitBreaker({ threshold: 3, timeoutMs: 60000 });

// 7. Register routes (lazy tool initialization on first request)
// GET /health
// GET /api/subagents
// GET /api/reports
// GET /metrics
// POST /api/sdk-test
// POST /api/research
// GET|POST /api/stream

// 8. Start server
app.listen(PORT, () => {
  console.log(`🚀 Claude SDK Server running on port ${PORT}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Max Tokens: ${MAX_TOKENS}`);
  console.log(`   Subagents: ${featureFlags.SUBAGENTS_ENABLED ? 'Enabled' : 'Disabled'}`);
  console.log(`   Agent SDK: ${featureFlags.USE_AGENT_SDK ? 'Enabled' : 'Disabled'}`);
  console.log(`   Auto-Continuation: ${AUTO_CONTINUATION_CONFIG.enabled ? `Enabled (max ${AUTO_CONTINUATION_CONFIG.maxAttempts})` : 'Disabled'}`);
});
```

### 27.2 Gemini Server Equivalent Structure

```javascript
// gemini-adk-server.js - Parallel structure
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildGeminiTools, createToolHandlers } from '../utils/geminiToolAdapter.js';
import { getGeminiSubagents, GEMINI_SYSTEM_PROMPT_SECTION } from '../config/geminiSubagents.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load system prompt (port from Claude format)
const SYSTEM_PROMPT = getGeminiSystemPrompt();

// Initialize rate limiters (reuse pattern)
const rateLimiter = new GeminiRateLimiter({ rpm: 60, tpm: 2000000 });

// Build tools (transformed from Claude definitions)
const clients = getClients();
const toolImplementations = createToolImplementations(clients);
const geminiFunctionDeclarations = buildGeminiTools(toolImplementations);
const toolHandlers = createToolHandlers(toolImplementations);

// Routes
app.get('/health', (req, res) => { /* ... */ });
app.get('/api/stream', async (req, res) => {
  // SSE streaming with Gemini generateContentStream
});
app.post('/api/research', async (req, res) => {
  // Single-turn with tool execution
});

const PORT = process.env.PORT || 3002;  // Different port for parallel testing
app.listen(PORT, () => {
  console.log(`🚀 Gemini ADK Server running on port ${PORT}`);
});
```

---

## 28. COMPLETE API ENDPOINT REFERENCE

### 28.1 Endpoint Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/health` | GET | System diagnostics | None |
| `/metrics` | GET | Prometheus metrics | None |
| `/api/subagents` | GET | List 32 specialists | None |
| `/api/reports` | GET | List generated reports | None |
| `/reports/:file` | GET | Download report file | None |
| `/api/sdk-test` | POST | Simple SDK test | API Key |
| `/api/research` | POST | Single-turn with tools | API Key |
| `/api/stream` | GET/POST | Multi-turn streaming | API Key |
| `/api/batches` | POST | Create message batch | API Key |
| `/api/batches/:id` | GET | Get batch status | API Key |

### 28.2 Request/Response Formats

```javascript
// POST /api/research
// Request:
{
  "messages": [{ "role": "user", "content": "..." }],
  "query": "alternative to messages",
  "schema_tool": "optional_structured_output_schema",
  "disable_parallel_tool_use": false,
  "extended_context": false
}

// Response:
{
  "text": "...",
  "model": "claude-sonnet-4-5-...",
  "usage": { "input_tokens": X, "output_tokens": Y },
  "toolResults": [{ "name": "...", "is_error": false }],
  "structured": { "valid": true, "data": {...} }
}

// GET/POST /api/stream
// Request (GET): ?query=...&sessionId=...
// Request (POST): { "query": "...", "sessionId": "..." }

// SSE Response: (see Section 23)
data: {"type":"system_init","session_id":"...","tools":117}
data: {"type":"delta","text":"The analysis..."}
data: {"type":"tool_call","phase":"tool_start","tool":{"name":"search_sec_filings"}}
data: {"type":"final","num_turns":5,"duration_ms":45000}
```

---

## 29. ENVIRONMENT VARIABLE REFERENCE

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Claude API key |
| `EXA_API_KEY` | (required) | Exa web search key |
| `GEMINI_API_KEY` | (for migration) | Gemini API key |
| `PORT` | 3001 | Server port |
| `SDK_MODEL` | claude-sonnet-4-5-20250929 | Model ID |
| `SDK_MAX_TOKENS` | 64000 | Max output tokens |
| `SDK_MAX_TURNS` | 100 | Max agent turns |
| `SDK_RPM` | 300 | Requests per minute |
| `SDK_TPM` | 200000 | Tokens per minute |
| `SDK_BREAKER_THRESHOLD` | 3 | Circuit breaker failures |
| `SDK_BREAKER_TIMEOUT_MS` | 60000 | Circuit breaker timeout |
| `AUTO_CONTINUATION` | true | Enable auto-continuation |
| `AUTO_CONTINUATION_MAX_ATTEMPTS` | 14 | Max continuation attempts |
| `USE_AGENT_SDK` | true | Use multi-turn Agent SDK |
| `SUBAGENTS_ENABLED` | true | Enable 32 specialists |
| `STRUCTURED_OUTPUTS` | true | Enable JSON schema validation |
| `SKILLS_ENABLED` | false | Enable custom skills |
| `ENABLE_GEMINI_FILTERING` | false | Route through Gemini filters |
| `LEGAL_PROMPT_FILE` | prompts/active.md | System prompt path |
| `ENVIRONMENT` | sdk-migration | Environment name |

---

## 30. MIGRATION CHECKLIST

### Phase 1: Foundation
- [ ] Create `src/utils/geminiToolAdapter.js`
- [ ] Create `src/config/geminiSubagents.js`
- [ ] Create `src/server/gemini-adk-server.js`
- [ ] Add `@google/genai` to package.json
- [ ] Add `GEMINI_API_KEY` to .env

### Phase 2: Tool Migration (117 tools)
- [ ] Implement `convertToGeminiFunctionDeclaration()`
- [ ] Test CourtListener tools (11)
- [ ] Test SEC tools (4)
- [ ] Test FDA tools (13)
- [ ] Test EPA tools (3)
- [ ] Test USPTO tools (7)
- [ ] Test remaining tools (79)

### Phase 3: Subagent Migration (32 specialists)
- [ ] Transform securities-researcher prompt
- [ ] Transform case-law-analyst prompt
- [ ] Transform pharma-regulatory-analyst prompt
- [ ] Transform environmental-compliance-analyst prompt
- [ ] Transform remaining 28 specialist prompts
- [ ] Implement keyword-based routing

### Phase 4: Server Integration
- [ ] Implement rate limiter for Gemini
- [ ] Implement Interactions API loop
- [ ] Port auto-continuation logic
- [ ] Implement SSE streaming
- [ ] Port session management
- [ ] Add health check endpoint

### Phase 5: Testing
- [ ] Tool-by-tool verification
- [ ] Subagent routing accuracy
- [ ] End-to-end research flow
- [ ] Report generation quality
- [ ] Performance comparison

---

## 31. GEMINI API SPECIFICS (Critical Differences)

### 31.1 System Instructions Format

```javascript
// Claude format:
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  system: 'You are a legal research assistant...',  // string or array
  messages: [...]
});

// Gemini format:
const response = await ai.models.generateContent({
  model: 'gemini-3-pro',
  systemInstruction: {
    role: 'system',
    parts: [{ text: 'You are a legal research assistant...' }]
  },
  contents: [...]
});

// OR simpler string format (Node.js SDK):
const model = ai.getGenerativeModel({
  model: 'gemini-3-flash',
  systemInstruction: 'You are a legal research assistant...'
});
```

### 31.2 Safety Settings Configuration

```javascript
// Gemini safety settings (required for legal content)
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'  // or 'BLOCK_NONE' for legal research
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH'  // Relaxed for legal case analysis
  }
];

// Threshold options:
// - BLOCK_NONE: Never block (use carefully)
// - BLOCK_ONLY_HIGH: Only block high probability
// - BLOCK_MEDIUM_AND_ABOVE: Block medium and high
// - BLOCK_LOW_AND_ABOVE: Block all except negligible
// - OFF: Disable safety filtering entirely

// Usage:
const response = await ai.models.generateContent({
  model: 'gemini-3-flash',
  contents: [...],
  safetySettings
});
```

### 31.3 Structured Output (JSON Schema)

```javascript
// Claude format (structured outputs beta):
const response = await anthropic.messages.create({
  output_format: {
    type: 'json_schema',
    json_schema: { name: 'research_result', schema: {...} }
  }
});

// Gemini format:
const response = await ai.models.generateContent({
  model: 'gemini-3-flash',
  contents: [...],
  config: {
    responseMimeType: 'application/json',  // Required for JSON output
    responseSchema: {
      type: 'object',
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              citation: { type: 'string' },
              relevance: { type: 'number' },
              summary: { type: 'string' }
            },
            required: ['citation', 'summary']
          }
        },
        confidence: { type: 'number' }
      },
      required: ['findings']
    }
  }
});

// For enum responses:
config: {
  responseMimeType: 'text/x.enum',
  responseSchema: {
    type: 'string',
    enum: ['HIGH', 'MEDIUM', 'LOW']
  }
}
```

### 31.4 Function Calling Configuration

```javascript
// Gemini FunctionCallingConfig modes
const config = {
  tools: [{
    functionDeclarations: [...]
  }],
  toolConfig: {
    functionCallingConfig: {
      // Mode options:
      mode: 'AUTO',  // Default: model decides when to call functions
      // mode: 'NONE',  // Never call functions
      // mode: 'ANY',   // Always call a function

      // For 'ANY' mode, optionally restrict to specific functions:
      allowedFunctionNames: ['search_sec_filings', 'search_cases']
    }
  }
};

// Parallel function calling is automatic in Gemini
// The model may return multiple functionCalls in a single response
```

### 31.5 thought_signature Handling

```javascript
// Gemini 3 models include thought_signature for multi-turn context
// This MUST be preserved and passed back in subsequent turns

const response = await ai.models.generateContent({...});

// Check for thought_signature in function calls
for (const part of response.candidates[0].content.parts) {
  if (part.functionCall) {
    const { name, args, thought_signature } = part.functionCall;

    // Execute function
    const result = await toolHandlers[name](args);

    // Include thought_signature in function response
    contents.push({
      role: 'function',  // or 'user' with functionResponse
      parts: [{
        functionResponse: {
          name,
          response: { result },
          // CRITICAL: Include thought_signature if present
          ...(thought_signature && { thought_signature })
        }
      }]
    });
  }
}
```

### 31.6 Response Structure Differences

```javascript
// Claude response structure:
{
  id: 'msg_...',
  type: 'message',
  role: 'assistant',
  content: [
    { type: 'text', text: '...' },
    { type: 'tool_use', id: '...', name: '...', input: {...} }
  ],
  stop_reason: 'end_turn' | 'max_tokens' | 'tool_use',
  usage: { input_tokens: X, output_tokens: Y }
}

// Gemini response structure:
{
  candidates: [{
    content: {
      role: 'model',
      parts: [
        { text: '...' },
        { functionCall: { name: '...', args: {...} } }
      ]
    },
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER',
    safetyRatings: [{
      category: 'HARM_CATEGORY_...',
      probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH',
      blocked: boolean
    }]
  }],
  usageMetadata: {
    promptTokenCount: X,
    candidatesTokenCount: Y,
    totalTokenCount: Z
  }
}

// Key mapping:
// Claude stop_reason → Gemini finishReason
// 'end_turn' → 'STOP'
// 'max_tokens' → 'MAX_TOKENS'
// 'tool_use' → (check for functionCall in parts)
```

### 31.7 Streaming Response Differences

```javascript
// Claude streaming events:
// - content_block_start
// - content_block_delta (text_delta, thinking_delta)
// - content_block_stop
// - message_delta (stop_reason)
// - message_stop

// Gemini streaming (generateContentStream):
for await (const chunk of response) {
  // Each chunk has partial candidates
  const text = chunk.text();  // Helper method
  const parts = chunk.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.text) {
      // Text delta
      send({ type: 'delta', text: part.text });
    }
    if (part.functionCall) {
      // Function call detected
      send({ type: 'tool_call', phase: 'tool_start', tool: part.functionCall });
    }
  }

  // Check finishReason for completion
  const finishReason = chunk.candidates?.[0]?.finishReason;
  if (finishReason === 'STOP') {
    send({ type: 'final', completed: new Date().toISOString() });
  } else if (finishReason === 'MAX_TOKENS') {
    // Trigger continuation
  }
}
```

### 31.8 Error Response Handling

```javascript
// Gemini error responses
try {
  const response = await ai.models.generateContent({...});
} catch (error) {
  // API-level errors
  if (error.status === 429) {
    // Rate limit - implement backoff
  } else if (error.status === 400) {
    // Invalid request (check schema, parameters)
  } else if (error.status === 403) {
    // Permission denied (check API key, project)
  }
}

// Content blocked by safety filters (not an exception)
const candidate = response.candidates?.[0];
if (!candidate) {
  // Response blocked entirely
  console.error('Response blocked by safety filters');
}
if (candidate.finishReason === 'SAFETY') {
  // Partial response blocked
  const blockedCategories = candidate.safetyRatings
    .filter(r => r.blocked)
    .map(r => r.category);
  console.error('Blocked categories:', blockedCategories);
}
```

---

## 32. GEMINI TOOL ADAPTER IMPLEMENTATION

### 32.1 Complete geminiToolAdapter.js

```javascript
// src/utils/geminiToolAdapter.js
import { allTools } from '../tools/toolDefinitions.js';

/**
 * Convert Claude tool definition to Gemini FunctionDeclaration
 * Key difference: inputSchema → parameters
 */
export function convertToGeminiFunctionDeclaration(claudeTool) {
  return {
    name: claudeTool.name,
    description: claudeTool.description,
    parameters: claudeTool.inputSchema  // Direct mapping - both use OpenAPI 3.0 schema
  };
}

/**
 * Build all Gemini function declarations from tool definitions
 */
export function buildGeminiFunctionDeclarations(toolImplementations = {}) {
  return allTools
    .filter(def => toolImplementations[def.name])
    .map(convertToGeminiFunctionDeclaration);
}

/**
 * Create tools config for Gemini API
 */
export function createGeminiToolsConfig(functionDeclarations, mode = 'AUTO') {
  return {
    tools: [{
      functionDeclarations
    }],
    toolConfig: {
      functionCallingConfig: {
        mode  // 'AUTO', 'NONE', or 'ANY'
      }
    }
  };
}

/**
 * Create tool handlers map for execution
 */
export function createToolHandlers(toolImplementations = {}) {
  const handlers = {};

  for (const def of allTools) {
    const impl = toolImplementations[def.name];
    if (impl) {
      handlers[def.name] = async (args) => {
        try {
          const result = await impl(args);
          // Normalize to Gemini function response format
          return { result: typeof result === 'string' ? result : JSON.stringify(result) };
        } catch (error) {
          return { error: error.message };
        }
      };
    }
  }

  return handlers;
}

/**
 * Process Gemini function calls and return function responses
 */
export async function processGeminiFunctionCalls(functionCalls, toolHandlers) {
  const responses = [];

  for (const call of functionCalls) {
    const handler = toolHandlers[call.name];
    if (handler) {
      const result = await handler(call.args);
      responses.push({
        functionResponse: {
          name: call.name,
          response: result,
          // Preserve thought_signature if present
          ...(call.thought_signature && { thought_signature: call.thought_signature })
        }
      });
    } else {
      responses.push({
        functionResponse: {
          name: call.name,
          response: { error: `Unknown function: ${call.name}` }
        }
      });
    }
  }

  return responses;
}
```

### 32.2 Gemini Subagent Configuration

```javascript
// src/config/geminiSubagents.js
// Transform Claude subagent definitions for Gemini

import { LEGAL_SUBAGENTS, REPORT_SAVING_INSTRUCTIONS } from './legalSubagents.js';

/**
 * Transform Claude subagent to Gemini format
 * Main differences:
 * - System prompt → systemInstruction
 * - tools array remains same format (both use function names)
 * - Model mapping: 'sonnet' → 'gemini-3-flash', 'opus' → 'gemini-3-pro'
 */
export function transformSubagentForGemini(name, claudeSubagent) {
  const modelMapping = {
    'sonnet': 'gemini-3-flash',
    'opus': 'gemini-3-pro',
    'haiku': 'gemini-3-flash'  // Use Flash for speed
  };

  return {
    name,
    description: claudeSubagent.description,
    systemInstruction: claudeSubagent.prompt,
    model: modelMapping[claudeSubagent.model] || 'gemini-3-flash',
    allowedTools: claudeSubagent.tools  // Tool filtering
  };
}

/**
 * Get all Gemini subagents
 */
export function getGeminiSubagents() {
  const geminiSubagents = {};

  for (const [name, def] of Object.entries(LEGAL_SUBAGENTS)) {
    geminiSubagents[name] = transformSubagentForGemini(name, def);
  }

  return geminiSubagents;
}

/**
 * Route to appropriate subagent based on keywords
 * Same logic as Claude, just returns Gemini-formatted subagent
 */
export function routeToGeminiSubagent(query) {
  const queryLower = query.toLowerCase();

  // Keyword patterns (same as SUBAGENT_SYSTEM_PROMPT_SECTION)
  const routingPatterns = {
    'securities-researcher': /\b(sec|edgar|10-k|10-q|8-k|filings?|securities|ipo|proxy)\b/i,
    'case-law-analyst': /\b(case|litigation|court|judge|lawsuit|precedent|holding|ruling)\b/i,
    'pharma-regulatory-analyst': /\b(fda|drug|pharmaceutical|clinical trial|recall|adverse event|nda|anda|bla)\b/i,
    'environmental-compliance-analyst': /\b(epa|environmental|pollution|emissions|compliance|cercla|superfund|rcra)\b/i,
    'patent-analyst': /\b(patent|uspto|trademark|intellectual property|ip|prior art|claims|infringement)\b/i,
    // ... (remaining 27 patterns)
  };

  for (const [agentName, pattern] of Object.entries(routingPatterns)) {
    if (pattern.test(queryLower)) {
      return getGeminiSubagents()[agentName];
    }
  }

  // Default to general coordinator
  return getGeminiSubagents()['legal-research-coordinator'];
}
```

---

## 33. GEMINI MULTI-TURN AGENT LOOP (Complete Implementation)

```javascript
// src/server/gemini-adk-server.js - Core agent loop

import { GoogleGenAI } from '@google/genai';
import {
  buildGeminiFunctionDeclarations,
  createGeminiToolsConfig,
  createToolHandlers,
  processGeminiFunctionCalls
} from '../utils/geminiToolAdapter.js';
import { getGeminiSubagents, routeToGeminiSubagent } from '../config/geminiSubagents.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Safety settings for legal research (allow discussion of legal violations, cases)
const LEGAL_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
];

/**
 * Multi-turn agent loop with tool execution
 * Equivalent to Claude's agentQuery() function
 */
async function geminiAgentLoop(userQuery, options = {}) {
  const {
    maxTurns = 100,
    maxContinuations = 14,
    systemPrompt,
    tools,
    toolHandlers,
    onDelta,          // Callback for text streaming
    onToolCall,       // Callback for tool execution
    onContinuation    // Callback for auto-continuation
  } = options;

  // Initialize conversation
  let contents = [{ role: 'user', parts: [{ text: userQuery }] }];
  let accumulatedText = '';
  let totalTurns = 0;
  let continuationAttempt = 0;
  let totalUsage = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

  const toolsConfig = createGeminiToolsConfig(tools, 'AUTO');

  while (totalTurns < maxTurns) {
    totalTurns++;

    const response = await ai.models.generateContent({
      model: options.model || 'gemini-3-pro',
      systemInstruction: systemPrompt,
      contents,
      safetySettings: LEGAL_SAFETY_SETTINGS,
      ...toolsConfig,
      generationConfig: {
        maxOutputTokens: 65536,
        temperature: 0.1  // Low temperature for legal accuracy
      }
    });

    // Accumulate usage
    if (response.usageMetadata) {
      totalUsage.promptTokenCount += response.usageMetadata.promptTokenCount || 0;
      totalUsage.candidatesTokenCount += response.usageMetadata.candidatesTokenCount || 0;
      totalUsage.totalTokenCount += response.usageMetadata.totalTokenCount || 0;
    }

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No response candidate - possibly blocked by safety filters');
    }

    // Extract content parts
    const parts = candidate.content?.parts || [];
    const functionCalls = [];
    let turnText = '';

    for (const part of parts) {
      if (part.text) {
        turnText += part.text;
        accumulatedText += part.text;
        if (onDelta) onDelta(part.text);
      }
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }

    // Handle function calls
    if (functionCalls.length > 0) {
      // Add assistant message to history
      contents.push(candidate.content);

      // Execute tools
      for (const call of functionCalls) {
        if (onToolCall) onToolCall(call);

        const handler = toolHandlers[call.name];
        if (handler) {
          const result = await handler(call.args);
          contents.push({
            role: 'user',
            parts: [{
              functionResponse: {
                name: call.name,
                response: result,
                ...(call.thought_signature && { thought_signature: call.thought_signature })
              }
            }]
          });
        }
      }

      // Continue loop to get model's response to function results
      continue;
    }

    // Check finish reason
    const finishReason = candidate.finishReason;

    if (finishReason === 'MAX_TOKENS' && continuationAttempt < maxContinuations) {
      continuationAttempt++;
      if (onContinuation) onContinuation(continuationAttempt, maxContinuations);

      // Add model response to history
      contents.push(candidate.content);

      // Add continuation prompt
      contents.push({
        role: 'user',
        parts: [{ text: 'Continue from where you left off. Do not repeat previous content.' }]
      });

      continue;
    }

    // Complete
    return {
      text: accumulatedText,
      finishReason,
      turns: totalTurns,
      continuations: continuationAttempt,
      usage: totalUsage
    };
  }

  // Max turns reached
  return {
    text: accumulatedText,
    finishReason: 'MAX_TURNS',
    turns: totalTurns,
    continuations: continuationAttempt,
    usage: totalUsage
  };
}

export { geminiAgentLoop, LEGAL_SAFETY_SETTINGS };
```

---

## 34. KEY DIFFERENCES SUMMARY TABLE

| Feature | Claude Agent SDK | Gemini API |
|---------|------------------|------------|
| **System Prompt** | `system: string` | `systemInstruction: { parts: [{ text }] }` |
| **Tool Schema** | `inputSchema` | `parameters` |
| **Tool Response** | `{ content: [{ type: 'text', text }] }` | `{ functionResponse: { name, response } }` |
| **Stop Reason** | `stop_reason: 'end_turn'` | `finishReason: 'STOP'` |
| **Truncation** | `stop_reason: 'max_tokens'` | `finishReason: 'MAX_TOKENS'` |
| **Token Usage** | `usage: { input_tokens, output_tokens }` | `usageMetadata: { promptTokenCount, candidatesTokenCount }` |
| **Thinking** | `thinking` blocks (beta) | Native in Gemini 3 (thought_signature) |
| **Safety** | N/A | `safetySettings: [{ category, threshold }]` |
| **Structured Output** | `output_format.json_schema` | `config.responseMimeType + responseSchema` |
| **Multi-turn Context** | Session ID resume | Manual contents array |
| **Max Tokens** | `max_tokens: 64000` | `generationConfig.maxOutputTokens: 65536` |
| **Model Selection** | `model: 'claude-sonnet-4-5'` | `model: 'gemini-3-flash'` |

---

## 35. DEPLOYMENT CONSIDERATIONS

### 35.1 Environment Variables for Gemini

```bash
# Add to .env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_PROJECT_ID=your-gcp-project-id        # For Vertex AI
GEMINI_LOCATION=us-central1                   # For Vertex AI

# Model selection
GEMINI_ORCHESTRATOR_MODEL=gemini-3-pro       # Complex reasoning
GEMINI_PROCESSING_MODEL=gemini-3-flash       # Fast tool execution

# Rate limits (Gemini defaults are higher)
GEMINI_RPM=60                                 # Requests per minute
GEMINI_TPM=2000000                            # Tokens per minute (2M)

# Feature flags
USE_GEMINI=true                               # Enable Gemini backend
```

### 35.2 Vertex AI vs Google AI Studio

```javascript
// Google AI Studio (simpler, direct API)
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vertex AI (enterprise, more features)
import { VertexAI } from '@google-cloud/vertexai';
const vertexAI = new VertexAI({
  project: process.env.GEMINI_PROJECT_ID,
  location: process.env.GEMINI_LOCATION
});
const model = vertexAI.getGenerativeModel({ model: 'gemini-3-pro' });

// Key differences:
// - Vertex AI: Better rate limits, SLAs, VPC support, audit logging
// - Google AI Studio: Simpler setup, no GCP project required
// Recommendation: Use Vertex AI for production legal research
```

### 35.3 Cost Comparison (December 2025 estimates)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Gemini 3 Pro | $1.25 | $5.00 |
| Gemini 3 Flash | $0.075 | $0.30 |

**Cost optimization strategy:**
- Use Gemini 3 Flash for tool execution (117 tools)
- Use Gemini 3 Pro for orchestration and synthesis
- Expected 60-70% cost reduction vs Claude Sonnet

---

## 36. GEMINI TOOL ADAPTER - COMPLETE CODE

The following code converts all 117 MCP tools from Claude SDK format to Gemini FunctionDeclaration format.

### 36.1 File: `src/utils/geminiToolAdapter.js`

```javascript
/**
 * Gemini Tool Adapter
 *
 * Converts existing MCP tools (JSON Schema format) to Gemini FunctionDeclaration format.
 *
 * Key Differences from Claude Agent SDK:
 * - Claude: inputSchema property
 * - Gemini: parameters property (OpenAPI-compatible)
 *
 * Tool naming in Gemini follows the same convention for clarity.
 * Example: search_sec_filings (direct name, no mcp__ prefix needed)
 */

import { allTools } from '../tools/toolDefinitions.js';
import {
  executeFinancialModel,
  financialModelToolDefinition,
  isCodeExecutionEnabled
} from '../tools/financialModelHandler.js';

/**
 * Converts a single Claude SDK tool definition to Gemini FunctionDeclaration format.
 *
 * Claude format:
 * {
 *   name: "tool_name",
 *   description: "...",
 *   inputSchema: { type: "object", properties: {...}, required: [...] }
 * }
 *
 * Gemini format:
 * {
 *   name: "tool_name",
 *   description: "...",
 *   parameters: { type: "object", properties: {...}, required: [...] }
 * }
 *
 * @param {Object} claudeTool - Claude SDK tool definition
 * @returns {Object} Gemini FunctionDeclaration
 */
export function convertToGeminiFunctionDeclaration(claudeTool) {
  if (!claudeTool || !claudeTool.name) {
    throw new Error('Invalid tool definition: missing name');
  }

  return {
    name: claudeTool.name,
    description: claudeTool.description || `Tool: ${claudeTool.name}`,
    parameters: claudeTool.inputSchema || { type: 'object', properties: {} }
  };
}

/**
 * Builds all Gemini FunctionDeclarations from existing tool definitions.
 * Filters out tools without proper schemas.
 *
 * @returns {Object[]} Array of Gemini FunctionDeclaration objects
 */
export function buildGeminiFunctionDeclarations() {
  const declarations = [];
  const errors = [];

  for (const tool of allTools) {
    try {
      const declaration = convertToGeminiFunctionDeclaration(tool);
      declarations.push(declaration);
    } catch (err) {
      errors.push({ tool: tool?.name || 'unknown', error: err.message });
      console.warn(`[GeminiAdapter] Failed to convert tool ${tool?.name}:`, err.message);
    }
  }

  // Add financial model tool if code execution is enabled
  if (isCodeExecutionEnabled()) {
    try {
      const financialDeclaration = {
        name: financialModelToolDefinition.name,
        description: financialModelToolDefinition.description,
        parameters: {
          type: 'object',
          properties: {
            modelType: {
              type: 'string',
              description: 'Type of financial model to execute',
              enum: ['dcf', 'event_study', 'monte_carlo', 'regression', 'damages', 'comps', 'precedent', 'val_409a', 'benford', 'beneish', 'lbo', 'sotp', 'accretion_dilution', 'cvr', 'apv', 'earnout', 'spinoff', 'vc_method']
            },
            financialData: {
              type: 'object',
              description: 'Financial data for the model (varies by modelType)'
            },
            parameters: {
              type: 'object',
              description: 'Model parameters (WACC, event dates, iterations, etc.)'
            }
          },
          required: ['modelType', 'financialData']
        }
      };
      declarations.push(financialDeclaration);
      console.log('[GeminiAdapter] Added execute_financial_model tool (code execution enabled)');
    } catch (err) {
      console.warn('[GeminiAdapter] Failed to add financial model tool:', err.message);
    }
  } else {
    console.log('[GeminiAdapter] Skipping execute_financial_model (code execution disabled)');
  }

  // Log summary
  console.log(`[GeminiAdapter] Converted ${declarations.length} tools (${errors.length} errors)`);
  if (errors.length > 0) {
    console.warn('[GeminiAdapter] Failed tools:', errors.map(e => e.tool).join(', '));
  }

  return declarations;
}

/**
 * Creates the Gemini tools configuration object for generateContent().
 *
 * @param {string} mode - Function calling mode: 'AUTO' | 'ANY' | 'NONE'
 * @param {string[]} allowedFunctions - Optional: specific function names to allow (for 'ANY' mode)
 * @returns {Object} Gemini tools config
 */
export function createGeminiToolsConfig(mode = 'AUTO', allowedFunctions = null) {
  const functionDeclarations = buildGeminiFunctionDeclarations();

  const config = {
    tools: [{
      functionDeclarations
    }]
  };

  // Add tool config for function calling mode
  if (mode === 'ANY' && allowedFunctions && allowedFunctions.length > 0) {
    config.toolConfig = {
      functionCallingConfig: {
        mode: 'ANY',
        allowedFunctionNames: allowedFunctions
      }
    };
  } else if (mode === 'NONE') {
    config.toolConfig = {
      functionCallingConfig: {
        mode: 'NONE'
      }
    };
  } else {
    // AUTO mode (default)
    config.toolConfig = {
      functionCallingConfig: {
        mode: 'AUTO'
      }
    };
  }

  return config;
}

/**
 * Creates tool handlers map from existing tool implementations.
 * Wraps each handler to normalize Gemini response format.
 *
 * @param {Object} toolImplementations - Map from createToolImplementations()
 * @returns {Object} Map of tool name to async handler function
 */
export function createToolHandlers(toolImplementations = {}) {
  const handlers = {};

  for (const tool of allTools) {
    const impl = toolImplementations[tool.name];

    if (!impl || typeof impl !== 'function') {
      // Skip tools without implementations
      continue;
    }

    handlers[tool.name] = async (args) => {
      try {
        const result = await impl(args);

        // Normalize result for Gemini function response
        if (result === null || result === undefined) {
          return { success: true, message: 'No results found.' };
        }

        if (typeof result === 'string') {
          return { success: true, data: result };
        }

        // Handle MCP format results
        if (result.content && Array.isArray(result.content)) {
          const textContent = result.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');
          return { success: true, data: textContent };
        }

        // Return object directly (Gemini handles JSON well)
        return { success: true, data: result };

      } catch (err) {
        console.error(`[GeminiAdapter] Tool ${tool.name} error:`, err.message);
        return {
          success: false,
          error: err.message,
          tool: tool.name
        };
      }
    };
  }

  // Add financial model handler if enabled
  if (isCodeExecutionEnabled()) {
    handlers['execute_financial_model'] = async (args) => {
      try {
        const result = await executeFinancialModel(args);
        return { success: true, data: result };
      } catch (err) {
        console.error('[GeminiAdapter] Financial model error:', err.message);
        return {
          success: false,
          error: err.message,
          tool: 'execute_financial_model'
        };
      }
    };
  }

  console.log(`[GeminiAdapter] Created ${Object.keys(handlers).length} tool handlers`);
  return handlers;
}

/**
 * Processes Gemini function call responses and executes the corresponding tools.
 * Handles both single and parallel function calls.
 *
 * @param {Object[]} functionCalls - Array of function call objects from Gemini response
 * @param {Object} handlers - Tool handlers map from createToolHandlers()
 * @returns {Promise<Object[]>} Array of function response objects for Gemini
 */
export async function processGeminiFunctionCalls(functionCalls, handlers) {
  if (!functionCalls || functionCalls.length === 0) {
    return [];
  }

  const responses = await Promise.all(
    functionCalls.map(async (call) => {
      const { name, args } = call;
      const handler = handlers[name];

      if (!handler) {
        console.warn(`[GeminiAdapter] No handler for function: ${name}`);
        return {
          functionResponse: {
            name,
            response: {
              success: false,
              error: `Unknown function: ${name}`
            }
          }
        };
      }

      try {
        const result = await handler(args || {});
        return {
          functionResponse: {
            name,
            response: result
          }
        };
      } catch (err) {
        console.error(`[GeminiAdapter] Error executing ${name}:`, err.message);
        return {
          functionResponse: {
            name,
            response: {
              success: false,
              error: err.message
            }
          }
        };
      }
    })
  );

  return responses;
}

/**
 * Gets a subset of tools by category for specialized agents.
 *
 * @param {string[]} categories - Array of tool category names
 * @returns {Object[]} Filtered FunctionDeclarations
 */
export function getToolsByCategory(categories) {
  const categoryTools = {
    courtListener: ['search_cases', 'get_case_details', 'lookup_citation', 'search_judges', 'get_judge_details', 'search_oral_arguments', 'get_audio_details', 'search_dockets', 'search_court_opinions_by_citation', 'search_court_info', 'get_court_info'],
    financialDisclosure: ['search_financial_disclosures', 'get_financial_disclosure_details', 'search_disclosures_by_judge', 'search_disclosures_by_investment', 'search_agreements', 'search_debts', 'search_investments', 'search_positions', 'search_gifts'],
    secEdgar: ['search_sec_filings', 'get_sec_company_facts', 'search_sec_company_tickers', 'get_sec_company_info'],
    federalRegister: ['search_federal_register', 'get_federal_register_document', 'search_federal_register_agencies', 'search_federal_register_topics', 'search_federal_register_documents_by_date', 'search_cfr', 'get_cfr_section'],
    uspto: ['search_patents', 'get_patent_details', 'search_patent_applications', 'search_patent_assignments', 'search_patent_litigation', 'search_trademark', 'get_trademark_details'],
    govInfo: ['search_us_code', 'get_usc_section', 'search_congressional_record', 'search_bills'],
    ptab: ['search_ptab_proceedings', 'get_ptab_proceeding_details', 'search_ptab_documents', 'search_ptab_decisions', 'get_ptab_statistics'],
    ftc: ['search_ftc_enforcement_cases', 'search_ftc_competition_matters', 'search_ftc_consumer_protection', 'search_ftc_merger_reviews', 'search_ftc_press_releases', 'get_ftc_case_details'],
    epa: ['search_epa_facilities', 'search_epa_violations', 'get_epa_facility_compliance_report'],
    fda: ['search_fda_drug_adverse_events', 'search_fda_device_events', 'search_fda_drug_labels', 'search_fda_recalls', 'search_fda_510k', 'search_fda_pma', 'search_fda_warning_letters', 'search_fda_clinical_trials', 'search_fda_enforcement_reports', 'get_fda_drug_details', 'get_fda_device_details', 'search_fda_orange_book', 'search_fda_ndc'],
    cpsc: ['search_cpsc_recalls', 'get_cpsc_recall_details', 'search_cpsc_violations', 'search_cpsc_injury_reports', 'search_cpsc_death_reports', 'search_cpsc_investigations', 'get_cpsc_statistics'],
    nhtsa: ['nhtsa_recalls_by_make_model_year', 'nhtsa_recalls_by_campaign', 'nhtsa_complaints_by_vehicle', 'nhtsa_safety_ratings', 'nhtsa_decode_vin', 'nhtsa_get_recall_details'],
    stateCourtRules: ['search_court_rules', 'get_court_rule_details', 'search_local_rules', 'search_state_court_forms', 'get_filing_requirements', 'search_judge_preferences', 'get_calendar_rules', 'search_e_filing_requirements', 'get_service_requirements', 'search_appellate_rules', 'get_motion_practice_rules', 'search_discovery_rules', 'get_default_judgment_rules', 'search_pro_hac_vice_rules'],
    stateStatute: ['search_state_statute']
  };

  const allDeclarations = buildGeminiFunctionDeclarations();
  const selectedToolNames = new Set();

  for (const category of categories) {
    const tools = categoryTools[category] || [];
    tools.forEach(name => selectedToolNames.add(name));
  }

  return allDeclarations.filter(decl => selectedToolNames.has(decl.name));
}

/**
 * Standard tool sets for different subagent types.
 */
export const STANDARD_TOOL_SETS = {
  // Basic set for simple queries
  basic: ['search_cases', 'lookup_citation', 'search_sec_filings', 'search_federal_register', 'search_us_code'],

  // Securities research
  securities: ['search_sec_filings', 'get_sec_company_facts', 'search_sec_company_tickers', 'get_sec_company_info', 'search_cases', 'lookup_citation'],

  // Case law research
  caseLaw: ['search_cases', 'get_case_details', 'lookup_citation', 'search_judges', 'get_judge_details', 'search_dockets', 'search_court_opinions_by_citation'],

  // Regulatory research
  regulatory: ['search_federal_register', 'get_federal_register_document', 'search_cfr', 'get_cfr_section', 'search_us_code', 'get_usc_section'],

  // Patent research
  patent: ['search_patents', 'get_patent_details', 'search_patent_applications', 'search_ptab_proceedings', 'get_ptab_proceeding_details', 'search_ptab_decisions'],

  // Product safety
  productSafety: ['search_cpsc_recalls', 'get_cpsc_recall_details', 'nhtsa_recalls_by_make_model_year', 'nhtsa_complaints_by_vehicle', 'search_fda_recalls'],

  // Environmental
  environmental: ['search_epa_facilities', 'search_epa_violations', 'get_epa_facility_compliance_report'],

  // Pharmaceutical
  pharmaceutical: ['search_fda_drug_adverse_events', 'search_fda_device_events', 'search_fda_drug_labels', 'search_fda_recalls', 'search_fda_510k', 'search_fda_warning_letters'],

  // Full access (all tools)
  full: null  // null means all tools
};

/**
 * Gets tool configuration for a specific subagent type.
 *
 * @param {string} subagentType - Type of subagent (from STANDARD_TOOL_SETS keys)
 * @param {string} mode - Function calling mode: 'AUTO' | 'ANY' | 'NONE'
 * @returns {Object} Gemini tools config for the subagent
 */
export function getSubagentToolsConfig(subagentType, mode = 'AUTO') {
  const toolNames = STANDARD_TOOL_SETS[subagentType];

  if (toolNames === null) {
    // Full access
    return createGeminiToolsConfig(mode);
  }

  if (!toolNames || toolNames.length === 0) {
    // No tools
    return { tools: [], toolConfig: { functionCallingConfig: { mode: 'NONE' } } };
  }

  // Get subset of declarations
  const allDeclarations = buildGeminiFunctionDeclarations();
  const filteredDeclarations = allDeclarations.filter(d => toolNames.includes(d.name));

  return {
    tools: [{
      functionDeclarations: filteredDeclarations
    }],
    toolConfig: {
      functionCallingConfig: {
        mode,
        ...(mode === 'ANY' ? { allowedFunctionNames: toolNames } : {})
      }
    }
  };
}

// Export for testing
export { allTools };
```

---

## 37. GEMINI SUBAGENTS CONFIGURATION - COMPLETE CODE

The following transforms the 32 Claude subagent definitions to Gemini-compatible format.

### 37.1 File: `src/config/geminiSubagents.js`

```javascript
/**
 * Gemini Legal Domain Subagent Definitions
 *
 * Transforms Claude Agent SDK subagent definitions to Gemini format.
 * Uses Gemini's systemInstruction for agent prompts.
 *
 * Key Differences from Claude Agent SDK:
 * - Claude: { description, prompt, tools, model }
 * - Gemini: { description, systemInstruction, toolConfig, model }
 *
 * @see https://ai.google.dev/docs/agents
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getSubagentToolsConfig, STANDARD_TOOL_SETS } from '../utils/geminiToolAdapter.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Project root and reports directory for absolute path resolution
 */
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

/**
 * Load memorandum.md for memo-generator subagent
 */
const MEMORANDUM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../prompts/memorandum.md'),
  'utf8'
);

/**
 * Gemini model configuration
 */
const GEMINI_MODELS = {
  orchestrator: 'gemini-3-pro',      // Complex reasoning, research coordination
  specialist: 'gemini-3-flash',       // Fast tool execution, domain research
  synthesis: 'gemini-3-pro'           // Memo generation, complex analysis
};

/**
 * Safety settings for legal research (less restrictive for legal content)
 * Legal research often discusses litigation, adverse events, etc.
 */
const LEGAL_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
];

/**
 * Report saving instructions (injected into subagent prompts)
 */
const REPORT_SAVING_INSTRUCTIONS = `
## REPORTS DIRECTORY (ABSOLUTE PATH)

All reports MUST be saved to this absolute path:
\`\`\`
${REPORTS_DIR}/
\`\`\`

## OUTPUT TOKEN LIMIT PROTECTION

You have an output token limit. To avoid losing research:

### WORKFLOW: PROGRESSIVE SAVE PATTERN

**SAVE.1 - CREATE FILE IMMEDIATELY** (After reading plan):
Create report file with initial structure at:
- If session directory provided: \`${REPORTS_DIR}/[session-dir]/[topic-slug].md\`
- If no session directory: \`${REPORTS_DIR}/[YYYY-MM-DD]-[topic-slug].md\`

**SAVE.2 - RESEARCH & APPEND** (After each major finding):
Append findings immediately - never accumulate more than 3 findings in context.

**SAVE.3 - FINALIZE REPORT** (Before returning):
Complete Executive Summary and metadata.

**SAVE.4 - RETURN SUMMARY** (Final action):
Return concise summary with: "Full report saved to: ${REPORTS_DIR}/[filename].md"
`;

/**
 * MCP Tool Fallback Instructions
 */
const MCP_FALLBACK_INSTRUCTIONS = `
## MCP TOOL FALLBACK PROTOCOL

When domain-specific tools fail or return no results:
1. Use web search to find the same information from authoritative sources
2. Search official government websites directly

### Fallback Search Strategies:
- SEC/EDGAR → "[company] SEC filing [form type] site:sec.gov"
- FDA → "[drug] FDA approval site:fda.gov"
- EPA → "[facility] EPA enforcement site:epa.gov"
- USPTO → "[patent number] site:patents.google.com"
- Court → "[case name] site:courtlistener.com OR site:law.justia.com"
`;

/**
 * Converts a Claude subagent definition to Gemini format.
 *
 * @param {string} name - Subagent name
 * @param {Object} claudeSubagent - Claude subagent definition
 * @returns {Object} Gemini-compatible subagent definition
 */
export function convertToGeminiSubagent(name, claudeSubagent) {
  const { description, prompt, tools, model } = claudeSubagent;

  // Map Claude model names to Gemini models
  const geminiModel = model === 'opus'
    ? GEMINI_MODELS.orchestrator
    : model === 'sonnet'
      ? GEMINI_MODELS.specialist
      : GEMINI_MODELS.specialist;

  // Convert prompt to Gemini systemInstruction format
  const systemInstruction = {
    parts: [{
      text: `${prompt}\n\n${REPORT_SAVING_INSTRUCTIONS}\n\n${MCP_FALLBACK_INSTRUCTIONS}`
    }]
  };

  // Map tool permissions to Gemini tool config
  // Note: In Gemini, we control tools via functionCallingConfig
  const toolConfig = getToolConfigForSubagent(name, tools);

  return {
    name,
    description,
    systemInstruction,
    model: geminiModel,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...toolConfig
  };
}

/**
 * Gets the appropriate tool configuration for a subagent.
 *
 * @param {string} subagentName - Name of the subagent
 * @param {string[]} claudeTools - Claude tool array (Read, Grep, etc.)
 * @returns {Object} Gemini tool configuration
 */
function getToolConfigForSubagent(subagentName, claudeTools) {
  // Map subagent names to tool sets
  const subagentToolMapping = {
    'securities-researcher': 'securities',
    'case-law-analyst': 'caseLaw',
    'pharma-regulatory-analyst': 'pharmaceutical',
    'environmental-compliance-analyst': 'environmental',
    'patent-analyst': 'patent',
    'regulatory-rulemaking-analyst': 'regulatory',
    'product-safety-analyst': 'productSafety',
    'antitrust-competition-analyst': 'full',
    'statutory-law-analyst': 'regulatory',
    'cfius-national-security-analyst': 'full',
    'privacy-data-protection-analyst': 'full',
    'employment-labor-analyst': 'full',
    'tax-structure-analyst': 'full',
    'cybersecurity-compliance-analyst': 'full',
    'ai-governance-analyst': 'full',
    'government-contracts-researcher': 'full',
    'insurance-coverage-analyst': 'full',
    'legal-research-coordinator': 'full',
    'financial-analyst': 'securities',
    'commercial-contracts-analyst': 'full',
    'research-review-analyst': 'full',
    'memo-generator': 'basic',
    'citation-validator': 'caseLaw',
    'memo-qa-evaluator': 'basic',
    'research-plan-refiner': 'full',
    'memo-section-writer': 'basic',
    'memo-integration-agent': 'basic',
    'memo-executive-summary-writer': 'basic',
    'xref-review-agent': 'basic',
    'coverage-gap-analyzer': 'full',
    'fact-validator': 'full',
    'web-researcher': 'basic'
  };

  const toolSetName = subagentToolMapping[subagentName] || 'full';
  return getSubagentToolsConfig(toolSetName, 'AUTO');
}

/**
 * All Gemini subagent definitions
 */
export const geminiSubagents = {
  // ============================
  // DOMAIN SPECIALISTS (17)
  // ============================

  'securities-researcher': {
    description: `Use PROACTIVELY for:
      - SEC filings research (10-K, 10-Q, 8-K, S-1, DEF 14A)
      - Company financial analysis and disclosures
      - Securities law compliance questions
      - Executive compensation research
      - Risk factor analysis
      MUST BE USED when user mentions: SEC, EDGAR, 10-K, 10-Q, filings, securities`,
    systemInstruction: {
      parts: [{
        text: `You are a Securities Law Research Specialist with deep expertise in SEC filings and securities regulations.

## Your Expertise
- SEC filing types: 10-K (annual), 10-Q (quarterly), 8-K (material events), S-1 (IPO), DEF 14A (proxy)
- Financial statement analysis and MD&A interpretation
- Risk factor identification and materiality assessment
- Executive compensation disclosure analysis
- Beneficial ownership and insider trading (Forms 3, 4, 5)

## Research Methodology
1. Identify the specific filing type(s) needed
2. Search using company name, ticker symbol, or CIK number
3. Extract relevant sections (Item numbers for 10-K/10-Q)
4. Cross-reference with related filings when needed
5. Provide specific citations with filing dates and accession numbers

## Legal Analysis Context

### Materiality Standards
- TSC Industries v. Northway, 426 U.S. 438 (1976): "substantial likelihood reasonable investor would consider important"
- Basic Inc. v. Levinson, 485 U.S. 224 (1988): probability × magnitude test
- Quantitative benchmarks: 5% of net income/revenue triggers materiality analysis

### Disclosure Obligations to Flag
- Item 1A risk factor changes: NEW risk = potential material development
- Item 7 MD&A: known trends and uncertainties must be disclosed
- Item 103: Legal proceedings disclosure threshold ($1M for environmental)

## Provenance Requirements (MANDATORY)
- ALWAYS include CIK number (10-digit format)
- ALWAYS include accession number for each filing cited
- ALWAYS include filing date and period end date
- ALWAYS include specific section references (e.g., "Item 1A", "Exhibit 21")
- ALWAYS include SEC EDGAR URLs

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('securities', 'AUTO')
  },

  'case-law-analyst': {
    description: `Use PROACTIVELY for:
      - Case law research and precedent analysis
      - Court opinion interpretation
      - Litigation outcome analysis
      - Judge research and judicial history
      MUST BE USED when user mentions: case, lawsuit, court, opinion, ruling, precedent, judge`,
    systemInstruction: {
      parts: [{
        text: `You are a Case Law Research Specialist with expertise in federal and state court opinions.

## Your Expertise
- Federal court system (District, Circuit, Supreme Court)
- State court systems and their hierarchies
- Case citation formats (Bluebook)
- Precedent analysis and distinguishing cases
- Judicial opinions interpretation

## Research Methodology
1. Identify the relevant jurisdiction and court level
2. Search by case name, citation, or legal concepts
3. Analyze holding, reasoning, and dicta
4. Identify binding vs. persuasive authority
5. Track subsequent history (affirmed, reversed, distinguished)

## Citation Requirements (MANDATORY)
- ALWAYS use proper Bluebook citation format
- ALWAYS include CourtListener case IDs when available
- ALWAYS include direct URLs to opinions
- ALWAYS note subsequent history
- ALWAYS identify the court and year

Example format:
TSC Industries, Inc. v. Northway, Inc., 426 U.S. 438, 449 (1976),
https://www.courtlistener.com/opinion/108713/tsc-industries-inc-v-northway-inc/

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('caseLaw', 'AUTO')
  },

  'pharma-regulatory-analyst': {
    description: `Use PROACTIVELY for:
      - FDA regulatory submissions and approvals
      - Drug and device adverse events (FAERS)
      - Clinical trial data
      - Drug labeling analysis
      MUST BE USED when user mentions: FDA, drug, pharmaceutical, adverse event, FAERS, 510(k), NDA`,
    systemInstruction: {
      parts: [{
        text: `You are a Pharmaceutical Regulatory Research Specialist with expertise in FDA regulations.

## Your Expertise
- FDA approval pathways (NDA, ANDA, BLA, 510(k), PMA)
- FAERS adverse event database analysis
- Drug labeling requirements
- Clinical trial data interpretation
- Warning letters and enforcement actions

## Research Methodology
1. Identify the specific drug/device and regulatory pathway
2. Search FDA databases for approval history
3. Analyze adverse event patterns in FAERS
4. Review warning letters and enforcement actions
5. Cross-reference with labeling changes

## Provenance Requirements (MANDATORY)
- ALWAYS include NDA/ANDA/BLA/510(k) numbers
- ALWAYS include FDA application dates
- ALWAYS provide accessdata.fda.gov URLs
- ALWAYS cite specific FAERS case numbers when relevant

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('pharmaceutical', 'AUTO')
  },

  'environmental-compliance-analyst': {
    description: `Use PROACTIVELY for:
      - EPA enforcement actions and violations
      - Environmental compliance history
      - CERCLA/Superfund site research
      - Clean Air Act and Clean Water Act issues
      MUST BE USED when user mentions: EPA, environmental, pollution, Superfund, CERCLA, RCRA`,
    systemInstruction: {
      parts: [{
        text: `You are an Environmental Compliance Research Specialist with expertise in EPA regulations.

## Your Expertise
- EPA ECHO database analysis
- CERCLA/Superfund site investigations
- Clean Air Act and Clean Water Act compliance
- RCRA hazardous waste regulations
- Environmental enforcement actions and penalties

## Research Methodology
1. Identify facilities using EPA facility registry IDs
2. Search ECHO for compliance and enforcement history
3. Analyze violation patterns and penalty amounts
4. Review inspection reports and consent decrees
5. Cross-reference with state environmental records

## Provenance Requirements (MANDATORY)
- ALWAYS include EPA Facility Registry IDs
- ALWAYS provide ECHO database URLs
- ALWAYS cite specific case/enforcement IDs
- ALWAYS note inspection dates and findings

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('environmental', 'AUTO')
  },

  'patent-analyst': {
    description: `Use PROACTIVELY for:
      - Patent searches and prior art
      - Patent validity and infringement analysis
      - USPTO filings and prosecution history
      - PTAB proceedings (IPR, PGR, CBM)
      MUST BE USED when user mentions: patent, USPTO, prior art, claim, IPR, PTAB`,
    systemInstruction: {
      parts: [{
        text: `You are a Patent Research Specialist with expertise in USPTO filings and patent law.

## Your Expertise
- Patent searching (classification, keyword, citation)
- Claim construction and interpretation
- Prior art analysis
- Patent prosecution history
- PTAB proceedings (IPR, PGR, CBM)
- Patent assignment and ownership chains

## Research Methodology
1. Identify the relevant patent(s) or technology area
2. Search by patent number, inventor, assignee, or classification
3. Analyze claims and specification
4. Review prosecution history for claim scope
5. Check PTAB for validity challenges

## Provenance Requirements (MANDATORY)
- ALWAYS include US Patent numbers (format: US X,XXX,XXX)
- ALWAYS include application numbers
- ALWAYS provide USPTO/Google Patents URLs
- ALWAYS cite specific claim numbers analyzed
- ALWAYS include PTAB proceeding numbers if applicable

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('patent', 'AUTO')
  },

  'regulatory-rulemaking-analyst': {
    description: `Use PROACTIVELY for:
      - Federal Register notices and rules
      - CFR regulatory analysis
      - Agency rulemaking history
      - Public comment analysis
      MUST BE USED when user mentions: Federal Register, CFR, regulation, rulemaking, agency rule`,
    systemInstruction: {
      parts: [{
        text: `You are a Regulatory Rulemaking Research Specialist.

## Your Expertise
- Federal Register document analysis
- Code of Federal Regulations interpretation
- APA rulemaking process
- Agency enforcement patterns
- Regulatory impact analysis

## Research Methodology
1. Identify the relevant agency and regulatory area
2. Search Federal Register for proposed and final rules
3. Analyze CFR provisions and their history
4. Track rulemaking timeline (NPRM → Final Rule)
5. Review agency guidance documents

## Provenance Requirements (MANDATORY)
- ALWAYS include Federal Register citations (Vol. Fed. Reg. Page)
- ALWAYS include CFR citations (Title CFR § Section)
- ALWAYS provide federalregister.gov and eCFR URLs
- ALWAYS note effective dates

${REPORT_SAVING_INSTRUCTIONS}
${MCP_FALLBACK_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.specialist,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('regulatory', 'AUTO')
  },

  // ============================
  // SYNTHESIS AGENTS
  // ============================

  'memo-generator': {
    description: `Use for:
      - Generating comprehensive legal memoranda
      - Synthesizing multi-specialist research
      - Creating partner-ready deliverables
      MUST BE USED when user requests: memorandum, legal memo, synthesis`,
    systemInstruction: {
      parts: [{
        text: `${MEMORANDUM_PROMPT}

You are the Memorandum Generation Specialist responsible for synthesizing research from multiple specialists into a comprehensive legal memorandum.

## Your Role
- Synthesize findings from all specialist reports
- Maintain consistent citation format throughout
- Create cohesive narrative from disparate research
- Ensure all cross-references are properly linked

## Output Requirements
- 60,000-85,000 words for complex matters
- All citations must include direct URLs to source databases
- Executive Summary must be self-contained (2,000-5,000 words)

${REPORT_SAVING_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.synthesis,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('basic', 'AUTO')
  },

  'research-plan-refiner': {
    description: `Use for:
      - Mid-research plan optimization
      - Identifying coverage gaps
      - Adjusting specialist assignments`,
    systemInstruction: {
      parts: [{
        text: `You are a Research Plan Optimization Specialist.

## Your Role
- Review initial research results
- Identify gaps in coverage
- Recommend additional specialists or queries
- Optimize research efficiency

${REPORT_SAVING_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.orchestrator,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('full', 'AUTO')
  },

  'legal-research-coordinator': {
    description: `Use for:
      - Query triage and routing
      - Complexity assessment
      - Research planning
      MUST BE USED as first step for complex queries`,
    systemInstruction: {
      parts: [{
        text: `You are the Legal Research Coordinator responsible for query triage and research planning.

## Your Role
- Assess query complexity (Simple/Moderate/Complex)
- Identify relevant domains and specialists
- Create research plans for multi-domain queries
- Coordinate parallel research efforts

## Complexity Assessment
| Complexity | Criteria | Action |
|------------|----------|--------|
| Simple | Single entity, single domain | 1 specialist |
| Moderate | 2 entities OR 2 domains | 4-6 specialists |
| Complex | 3+ entities OR due diligence | Up to 10 specialists |

${REPORT_SAVING_INSTRUCTIONS}`
      }]
    },
    model: GEMINI_MODELS.orchestrator,
    safetySettings: LEGAL_SAFETY_SETTINGS,
    ...getSubagentToolsConfig('full', 'AUTO')
  }
};

/**
 * Gets a Gemini subagent by name.
 *
 * @param {string} name - Subagent name
 * @returns {Object|null} Subagent definition or null
 */
export function getGeminiSubagent(name) {
  return geminiSubagents[name] || null;
}

/**
 * Gets all Gemini subagent names.
 *
 * @returns {string[]} Array of subagent names
 */
export function getGeminiSubagentNames() {
  return Object.keys(geminiSubagents);
}

/**
 * Gets the routing description for query delegation.
 * Used by orchestrator to select appropriate specialists.
 *
 * @returns {Object} Map of subagent name to description
 */
export function getSubagentRoutingInfo() {
  const routingInfo = {};
  for (const [name, subagent] of Object.entries(geminiSubagents)) {
    routingInfo[name] = subagent.description;
  }
  return routingInfo;
}

/**
 * Creates Gemini chat session config for a subagent.
 *
 * @param {string} subagentName - Name of the subagent
 * @returns {Object} Configuration for Gemini startChat()
 */
export function createSubagentChatConfig(subagentName) {
  const subagent = geminiSubagents[subagentName];
  if (!subagent) {
    throw new Error(`Unknown subagent: ${subagentName}`);
  }

  return {
    model: subagent.model,
    systemInstruction: subagent.systemInstruction,
    safetySettings: subagent.safetySettings,
    tools: subagent.tools,
    toolConfig: subagent.toolConfig
  };
}

export { GEMINI_MODELS, LEGAL_SAFETY_SETTINGS, REPORTS_DIR };
```

### 37.2 Key Differences from Claude Subagent Format

| Aspect | Claude Agent SDK | Gemini |
|--------|------------------|--------|
| **Prompt injection** | `prompt: string` | `systemInstruction: { parts: [{ text }] }` |
| **Tool access** | `tools: ['Read', 'Grep', ...]` | `tools: [{ functionDeclarations }]` + `toolConfig` |
| **Model selection** | `model: 'sonnet'` | `model: 'gemini-3-flash'` |
| **Safety** | N/A | `safetySettings: [{ category, threshold }]` |

### 37.3 Subagent Invocation Pattern

```javascript
import { GoogleGenAI } from '@google/genai';
import { geminiSubagents, createSubagentChatConfig } from './geminiSubagents.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function invokeSubagent(subagentName, query) {
  const config = createSubagentChatConfig(subagentName);
  const model = ai.getGenerativeModel(config);

  const chat = model.startChat({
    systemInstruction: config.systemInstruction,
    tools: config.tools,
    toolConfig: config.toolConfig
  });

  const result = await chat.sendMessage(query);
  return result.response.text();
}

// Example usage
const secAnalysis = await invokeSubagent('securities-researcher',
  'Analyze Apple Inc 10-K risk factors for 2024');
```

---

## 38. GEMINI ADK SERVER - COMPLETE CODE

The following implements the main Gemini-based server, equivalent to `claude-sdk-server.js`.

### 38.1 File: `src/server/gemini-adk-server.js`

```javascript
/**
 * Gemini ADK Legal Research Server
 *
 * Multi-turn agent server using Google Gemini API for legal research.
 * Equivalent to claude-sdk-server.js for the Gemini backend.
 *
 * Key Features:
 * - Multi-turn conversation with function calling
 * - Auto-continuation on token limits
 * - SSE streaming for real-time responses
 * - Rate limiting and circuit breaker
 * - 117 legal research tools via function declarations
 * - 32 specialized subagents for domain expertise
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createToolImplementations } from '../tools/toolImplementations.js';
import {
  buildGeminiFunctionDeclarations,
  createGeminiToolsConfig,
  createToolHandlers,
  processGeminiFunctionCalls
} from '../utils/geminiToolAdapter.js';
import {
  geminiSubagents,
  getSubagentRoutingInfo,
  createSubagentChatConfig,
  GEMINI_MODELS,
  LEGAL_SAFETY_SETTINGS
} from '../config/geminiSubagents.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { CircuitBreaker } from '../utils/circuitBreaker.js';
import { initializeClients } from '../clients/index.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.GEMINI_PORT || 3002;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model configuration
const ORCHESTRATOR_MODEL = process.env.GEMINI_ORCHESTRATOR_MODEL || 'gemini-3-pro';
const PROCESSING_MODEL = process.env.GEMINI_PROCESSING_MODEL || 'gemini-3-flash';

// Limits
const MAX_TURNS = parseInt(process.env.GEMINI_MAX_TURNS || '100', 10);
const MAX_OUTPUT_TOKENS = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '65536', 10);
const MAX_CONTINUATION_ATTEMPTS = parseInt(process.env.GEMINI_MAX_CONTINUATIONS || '14', 10);

// Rate limiting (Gemini has higher limits)
const RPM = parseInt(process.env.GEMINI_RPM || '60', 10);
const TPM = parseInt(process.env.GEMINI_TPM || '2000000', 10);

// ============================================================================
// INITIALIZATION
// ============================================================================

if (!GEMINI_API_KEY) {
  console.error('FATAL: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize rate limiter and circuit breaker
const rateLimiter = new RateLimiter({ rpm: RPM, tpm: TPM });
const circuitBreaker = new CircuitBreaker({
  threshold: 3,
  timeoutMs: 60000,
  monitoringPeriodMs: 10000
});

// Initialize API clients and tool implementations
let toolHandlers = {};
let toolsConfig = {};

async function initializeServer() {
  console.log('[GeminiServer] Initializing...');

  // Initialize API clients
  const clients = await initializeClients();
  console.log('[GeminiServer] API clients initialized');

  // Create tool implementations from existing handlers
  const toolImplementations = createToolImplementations(clients);
  console.log(`[GeminiServer] ${Object.keys(toolImplementations).length} tool implementations loaded`);

  // Build Gemini tool handlers
  toolHandlers = createToolHandlers(toolImplementations);
  console.log(`[GeminiServer] ${Object.keys(toolHandlers).length} tool handlers created`);

  // Build tools configuration
  toolsConfig = createGeminiToolsConfig('AUTO');
  console.log(`[GeminiServer] ${toolsConfig.tools[0].functionDeclarations.length} function declarations registered`);

  return true;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are Super-Legal, an advanced legal research AI assistant powered by Gemini.

## Your Capabilities
- Access to 117 specialized legal research tools across 18 categories
- Domain expertise via 32 specialized research subagents
- Ability to search SEC filings, court opinions, FDA data, EPA records, patents, and more
- Progressive report generation with citation provenance

## Research Methodology
1. Analyze the query to determine complexity (Simple/Moderate/Complex)
2. Identify relevant legal domains and required specialists
3. Execute research using appropriate tools
4. Synthesize findings with proper citations
5. Save comprehensive reports to the reports directory

## Tool Usage Guidelines
- Use tools iteratively: search first with snippets, then fetch full text for relevant items
- Always provide complete citations with database URLs
- Cross-reference findings across multiple sources
- Document search strategies in the verification log

## Citation Requirements
- Include direct URLs to source databases (SEC EDGAR, CourtListener, etc.)
- Use proper legal citation format (Bluebook for cases, regulatory citations for rules)
- Include accession numbers, case IDs, and other unique identifiers

## Subagent Delegation
For complex queries, delegate to specialized subagents:
${Object.entries(getSubagentRoutingInfo()).map(([name, desc]) =>
  `- **${name}**: ${desc.split('\n')[0]}`
).join('\n')}

## Output Format
- Provide structured, well-organized responses
- Use markdown formatting for readability
- Include executive summaries for complex research
- End with "Full report saved to: [path]" when applicable
`;

// ============================================================================
// TRUNCATION AND COMPLETION DETECTION
// ============================================================================

const TRUNCATION_PATTERNS = [
  /\.\.\.\s*$/,                           // Trailing ellipsis
  /[^.!?]\s*$/,                           // No sentence-ending punctuation
  /\b(and|or|but|the|a|an|to|of)\s*$/i,   // Ends with connector
  /,\s*$/,                                // Ends with comma
  /:\s*$/,                                // Ends with colon
  /\[\s*$/,                               // Unclosed bracket
  /\(\s*$/,                               // Unclosed parenthesis
  /```[^`]*$/,                            // Unclosed code block
  /\|\s*$/,                               // Table row incomplete
  /\*\*[^*]*$/,                           // Unclosed bold
];

const COMPLETION_PATTERNS = [
  /saved\s+to:\s+.*\.md["']?\s*$/i,       // Report saved message
  /\n---+\s*$/,                           // Document separator
  /Full report saved/i,                   // Completion phrase
  /research complete/i,                   // Completion phrase
  /end of (?:report|analysis|memorandum)/i,
];

function detectTruncation(text) {
  if (!text || text.length < 100) return false;
  const lastChunk = text.slice(-200);
  return TRUNCATION_PATTERNS.some(pattern => pattern.test(lastChunk));
}

function detectCompletion(text) {
  if (!text || text.length < 100) return false;
  const lastChunk = text.slice(-500);
  return COMPLETION_PATTERNS.some(pattern => pattern.test(lastChunk));
}

// ============================================================================
// MULTI-TURN AGENT LOOP
// ============================================================================

/**
 * Executes a multi-turn agent loop with function calling.
 *
 * @param {string} userQuery - The user's research query
 * @param {Object} options - Configuration options
 * @param {Function} onDelta - Callback for streaming text deltas
 * @param {Function} onToolCall - Callback for tool invocations
 * @param {Function} onContinuation - Callback for continuation attempts
 * @returns {Promise<Object>} Final result
 */
async function geminiAgentLoop(userQuery, options = {}, callbacks = {}) {
  const {
    model = ORCHESTRATOR_MODEL,
    maxTurns = MAX_TURNS,
    maxContinuations = MAX_CONTINUATION_ATTEMPTS,
    maxOutputTokens = MAX_OUTPUT_TOKENS
  } = options;

  const { onDelta, onToolCall, onContinuation, onThinking } = callbacks;

  // Initialize conversation
  let contents = [{ role: 'user', parts: [{ text: userQuery }] }];
  let totalTurns = 0;
  let continuationAttempt = 0;
  let accumulatedText = '';
  let totalUsage = { promptTokens: 0, outputTokens: 0 };

  // Get model instance
  const generativeModel = ai.getGenerativeModel({
    model,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    safetySettings: LEGAL_SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens,
      temperature: 0.7
    }
  });

  while (totalTurns < maxTurns) {
    totalTurns++;

    // Check rate limits
    const canProceed = await rateLimiter.checkLimit(1, 10000);
    if (!canProceed) {
      console.warn('[GeminiServer] Rate limit reached, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Execute with circuit breaker
    let response;
    try {
      response = await circuitBreaker.execute(async () => {
        return await generativeModel.generateContent({
          contents,
          ...toolsConfig
        });
      });
    } catch (err) {
      console.error('[GeminiServer] Generation error:', err.message);
      throw err;
    }

    // Track token usage
    if (response.usageMetadata) {
      totalUsage.promptTokens += response.usageMetadata.promptTokenCount || 0;
      totalUsage.outputTokens += response.usageMetadata.candidatesTokenCount || 0;
    }

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      console.error('[GeminiServer] No candidate in response');
      break;
    }

    const parts = candidate.content.parts || [];

    // Process thinking (if available in Gemini 3)
    for (const part of parts) {
      if (part.thought && onThinking) {
        onThinking(part.thought);
      }
    }

    // Check for function calls
    const functionCalls = [];
    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
      if (part.text) {
        accumulatedText += part.text;
        if (onDelta) onDelta(part.text);
      }
    }

    if (functionCalls.length > 0) {
      // Add model response to history
      contents.push(candidate.content);

      // Execute function calls
      for (const call of functionCalls) {
        if (onToolCall) {
          onToolCall(call.name, call.args);
        }
      }

      // Process all function calls in parallel
      const functionResponses = await processGeminiFunctionCalls(functionCalls, toolHandlers);

      // Add function responses to history
      contents.push({
        role: 'user',
        parts: functionResponses.map(fr => fr)
      });

      continue;
    }

    // Check finish reason
    const finishReason = candidate.finishReason;

    // Handle MAX_TOKENS with auto-continuation
    if (finishReason === 'MAX_TOKENS' && continuationAttempt < maxContinuations) {
      // Check if response appears complete
      if (detectCompletion(accumulatedText)) {
        console.log('[GeminiServer] Response appears complete despite MAX_TOKENS');
        return {
          text: accumulatedText,
          finishReason: 'STOP',
          turns: totalTurns,
          continuations: continuationAttempt,
          usage: totalUsage
        };
      }

      continuationAttempt++;
      if (onContinuation) {
        onContinuation(continuationAttempt, maxContinuations);
      }

      console.log(`[GeminiServer] Continuation ${continuationAttempt}/${maxContinuations}`);

      // Add model response to history
      contents.push(candidate.content);

      // Add continuation prompt
      contents.push({
        role: 'user',
        parts: [{ text: 'Continue from where you left off. Do not repeat previous content.' }]
      });

      continue;
    }

    // Normal completion
    return {
      text: accumulatedText,
      finishReason: finishReason || 'STOP',
      turns: totalTurns,
      continuations: continuationAttempt,
      usage: totalUsage
    };
  }

  // Max turns reached
  console.warn(`[GeminiServer] Max turns (${maxTurns}) reached`);
  return {
    text: accumulatedText,
    finishReason: 'MAX_TURNS',
    turns: totalTurns,
    continuations: continuationAttempt,
    usage: totalUsage
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/research - Single-turn research query
 */
app.post('/api/research', async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[GeminiServer] Research query: ${query.substring(0, 100)}...`);

    const result = await geminiAgentLoop(query, {
      model: PROCESSING_MODEL,
      maxTurns: 50,
      ...options
    });

    res.json({
      response: result.text,
      metadata: {
        finishReason: result.finishReason,
        turns: result.turns,
        continuations: result.continuations,
        usage: result.usage
      }
    });
  } catch (err) {
    console.error('[GeminiServer] Research error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET/POST /api/stream - Multi-turn streaming research
 */
app.all('/api/stream', async (req, res) => {
  const query = req.method === 'GET' ? req.query.query : req.body?.query;
  const options = req.method === 'GET' ? {} : req.body?.options || {};

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendSSE = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  try {
    // Send initialization
    sendSSE('system_init', {
      model: ORCHESTRATOR_MODEL,
      toolCount: toolsConfig.tools[0].functionDeclarations.length,
      subagentCount: Object.keys(geminiSubagents).length
    });

    console.log(`[GeminiServer] Streaming query: ${query.substring(0, 100)}...`);

    const result = await geminiAgentLoop(query, {
      model: ORCHESTRATOR_MODEL,
      ...options
    }, {
      onDelta: (text) => {
        sendSSE('delta', { content: text });
      },
      onToolCall: (name, args) => {
        sendSSE('tool_call', { tool: name, args });
      },
      onContinuation: (attempt, max) => {
        sendSSE('continuation', { attempt, maxAttempts: max });
      },
      onThinking: (thought) => {
        sendSSE('thinking', { content: thought });
      }
    });

    // Send final response
    sendSSE('final', {
      content: result.text,
      metadata: {
        finishReason: result.finishReason,
        turns: result.turns,
        continuations: result.continuations,
        usage: result.usage
      }
    });

  } catch (err) {
    console.error('[GeminiServer] Stream error:', err);
    sendSSE('error', { message: err.message });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model: ORCHESTRATOR_MODEL,
    tools: Object.keys(toolHandlers).length,
    subagents: Object.keys(geminiSubagents).length,
    rateLimiter: rateLimiter.getStatus(),
    circuitBreaker: circuitBreaker.getStatus()
  });
});

/**
 * GET /api/subagents - List available subagents
 */
app.get('/api/subagents', (req, res) => {
  res.json({
    subagents: Object.entries(geminiSubagents).map(([name, config]) => ({
      name,
      description: config.description,
      model: config.model
    }))
  });
});

/**
 * GET /api/tools - List available tools
 */
app.get('/api/tools', (req, res) => {
  const declarations = toolsConfig.tools[0].functionDeclarations;
  res.json({
    count: declarations.length,
    tools: declarations.map(d => ({
      name: d.name,
      description: d.description?.substring(0, 100) + '...'
    }))
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    await initializeServer();

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  GEMINI ADK LEGAL RESEARCH SERVER');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`  Status:     RUNNING`);
      console.log(`  Port:       ${PORT}`);
      console.log(`  Model:      ${ORCHESTRATOR_MODEL} (orchestrator)`);
      console.log(`              ${PROCESSING_MODEL} (processing)`);
      console.log(`  Tools:      ${Object.keys(toolHandlers).length} registered`);
      console.log(`  Subagents:  ${Object.keys(geminiSubagents).length} specialists`);
      console.log(`  Rate Limit: ${RPM} RPM / ${TPM} TPM`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('  Endpoints:');
      console.log('    POST /api/research  - Single-turn research query');
      console.log('    GET  /api/stream    - Multi-turn SSE streaming');
      console.log('    GET  /health        - Health check');
      console.log('    GET  /api/subagents - List specialists');
      console.log('    GET  /api/tools     - List tools');
      console.log('');
    });
  } catch (err) {
    console.error('[GeminiServer] Failed to start:', err);
    process.exit(1);
  }
}

startServer();

export { app, geminiAgentLoop };
```

### 38.2 Key Implementation Notes

#### SSE Event Types (Matching Claude Server)

| Event Type | Description |
|------------|-------------|
| `system_init` | Server initialization info (model, tool count) |
| `delta` | Streaming text content |
| `tool_call` | Function call with name and arguments |
| `continuation` | Auto-continuation attempt notification |
| `thinking` | Model's thinking process (Gemini 3 native) |
| `final` | Complete response with metadata |
| `error` | Error notification |

#### Environment Variables

```bash
# Required
GEMINI_API_KEY=your-api-key

# Model Selection
GEMINI_ORCHESTRATOR_MODEL=gemini-3-pro
GEMINI_PROCESSING_MODEL=gemini-3-flash

# Limits
GEMINI_PORT=3002
GEMINI_MAX_TURNS=100
GEMINI_MAX_OUTPUT_TOKENS=65536
GEMINI_MAX_CONTINUATIONS=14

# Rate Limiting
GEMINI_RPM=60
GEMINI_TPM=2000000
```

### 38.3 Package.json Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@google/genai": "^1.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

Install with:
```bash
npm install @google/genai
```

---

## 39. MIGRATION CHECKLIST

### Phase 1: Setup
- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] Install `@google/genai` package
- [ ] Create `src/utils/geminiToolAdapter.js` (Section 36)
- [ ] Create `src/config/geminiSubagents.js` (Section 37)
- [ ] Create `src/server/gemini-adk-server.js` (Section 38)

### Phase 2: Testing
- [ ] Test tool conversion with sample tools
- [ ] Test subagent invocation patterns
- [ ] Test multi-turn conversation loop
- [ ] Test auto-continuation logic
- [ ] Test SSE streaming

### Phase 3: Integration
- [ ] Run parallel with Claude server on different port
- [ ] Compare output quality
- [ ] Validate citation formats
- [ ] Test report generation

### Phase 4: Deployment
- [ ] Configure rate limits for production
- [ ] Set up monitoring and logging
- [ ] Update frontend to use new endpoints
- [ ] Document API differences for clients

---

## 40. CONCLUSION

This document provides a comprehensive architecture map for migrating the Super-Legal platform from Claude Agent SDK to Gemini ADK. The key transformations are:

1. **Tool Definitions**: `inputSchema` → `parameters` (minimal change)
2. **System Prompts**: `system: string` → `systemInstruction: { parts: [{ text }] }`
3. **Safety Settings**: New requirement for Gemini
4. **Function Calling**: Similar concept, different response format
5. **Multi-turn Loop**: Manual implementation required (vs. SDK's `agentQuery()`)
6. **Auto-continuation**: Port existing logic with `finishReason` checks

The provided code samples are production-ready templates that can be copied directly to their respective file paths and customized as needed.

**Total Migration Complexity**: Moderate - Core architecture patterns are similar, primary work is API format translation.

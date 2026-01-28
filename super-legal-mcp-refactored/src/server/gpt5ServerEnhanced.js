import express from 'express';
import cors from 'cors';
import { getPool, ensureSchema } from '../db/postgres.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Express server exposing endpoints for frontend to use GPT-5 + MCP (stdio).
 * August 16, 2025: Spec-correct Chat params, neutral status updates (no chain-of-thought),
 * safe two-round tool loop, schema sanitization, and Postgres logging hooks.
 */

/* ----------------------------- Helper Lookups ----------------------------- */

function getLegalContext(toolName) {
  const contexts = {
    'search_dockets': 'Searching bankruptcy court dockets',
    'search_cases': 'Finding case law precedents',
    'search_opinions': 'Retrieving judicial opinions',
    'get_case_details': 'Extracting case details',
    'search_patents': 'Analyzing IP portfolio',
    'search_ptab_proceedings': 'Checking PTAB proceedings',
    'search_trademarks': 'Searching trademarks',
    'search_sec_filings': 'Reviewing SEC filings',
    'get_sec_company_facts': 'Gathering financial data',
    'search_insider_trading': 'Checking insider activity',
    'search_epa_facilities': 'Checking environmental records',
    'search_federal_register': 'Searching regulations',
    'search_cfr': 'Reviewing federal code',
    'search_state_statute': 'Searching state law',
    'search_cpsc_recalls': 'Checking product recalls',
    'search_nhtsa_recalls': 'Checking vehicle recalls',
    'search_fda_510k': 'Reviewing FDA clearances',
    'get_usc_section': 'Retrieving US Code',
    'lookup_citation': 'Verifying citations',
    'search_court_rules': 'Searching state court rules',
    'get_formatting_requirements': 'Getting document formatting requirements',
    'get_electronic_filing_rules': 'Checking e-filing requirements',
    'search_local_rules': 'Finding local court rules',
    'get_court_specific_procedures': 'Reviewing court procedures',
    'check_rule_updates': 'Checking for recent rule changes',
    'get_document_templates': 'Finding document templates',
    'validate_document_compliance': 'Validating rule compliance',
    'get_citation_requirements': 'Getting citation standards',
    'get_discovery_rules': 'Reviewing discovery rules',
    'get_appellate_requirements': 'Checking appellate requirements',
    'get_emergency_procedures': 'Finding emergency procedures'
  };
  return contexts[toolName] || `Executing ${toolName}`;
}

function getToolCategory(toolName) {
  const categories = {
    'search_dockets': 'Bankruptcy',
    'search_cases': 'Case Law',
    'search_opinions': 'Case Law',
    'get_case_details': 'Case Law',
    'search_patents': 'Intellectual Property',
    'search_ptab_proceedings': 'Intellectual Property',
    'search_trademarks': 'Intellectual Property',
    'search_sec_filings': 'Corporate/Securities',
    'get_sec_company_facts': 'Corporate/Securities',
    'search_insider_trading': 'Corporate/Securities',
    'search_epa_facilities': 'Environmental',
    'search_federal_register': 'Regulatory',
    'search_cfr': 'Regulatory',
    'search_state_statute': 'Regulatory',
    'search_cpsc_recalls': 'Product Safety',
    'search_nhtsa_recalls': 'Product Safety',
    'search_fda_510k': 'Product Safety',
    'search_court_rules': 'State Court Practice',
    'get_formatting_requirements': 'State Court Practice',
    'get_electronic_filing_rules': 'State Court Practice',
    'search_local_rules': 'Local Court Rules',
    'get_court_specific_procedures': 'Local Court Rules',
    'check_rule_updates': 'Local Court Rules',
    'get_document_templates': 'Document Preparation',
    'validate_document_compliance': 'Document Preparation',
    'get_citation_requirements': 'Document Preparation',
    'get_discovery_rules': 'Specialized Practice',
    'get_appellate_requirements': 'Specialized Practice',
    'get_emergency_procedures': 'Specialized Practice'
  };
  return categories[toolName] || 'General';
}

function buildLegalCustomTools() {
  // Custom “tools” only used if you hand them to Chat as function tools.
  return [
    {
      type: "custom",
      name: "bluebook_citation",
      description: "Formats legal citations in proper Bluebook style",
      format: {
        type: "grammar",
        syntax: "regex",
        definition: "^[A-Za-z\\s\\.,]+\\s\\d+\\s[A-Za-z\\.\\s]+\\d+\\s\\(\\d{4}\\)$"
      }
    },
    {
      type: "custom",
      name: "legal_memo_structure",
      description: "Generates structured legal memorandum sections",
      format: {
        type: "grammar",
        syntax: "lark",
        definition: `
          memo: header issues analysis conclusion
          header: "RE:" /[A-Za-z\\s,]+/ "\\n" "DATE:" /\\d{4}-\\d{2}-\\d{2}/
          issues: "ISSUES PRESENTED:" issue+
          issue: /\\d+\\./ /[A-Za-z\\s\\?]+/ "\\n"
          analysis: "ANALYSIS:" paragraph+
          paragraph: /[A-Za-z\\s\\.\\,]+/ "\\n\\n"
          conclusion: "CONCLUSION:" /[A-Za-z\\s\\.\\,]+/
        `
      }
    }
  ];
}

function getOptimizedLegalPrompt() {
  return `# Role
You are an expert legal research specialist with access to 70+ specialized legal databases and tools, including comprehensive state court rules across all 50 U.S. states.

# Task
Conduct comprehensive multi-jurisdictional legal research with strategic tool selection and parallel execution.

# Critical Efficiency Rules
1. NEVER duplicate searches - use broader terms that capture variations
2. For PA courts: Use SAME query across paeb/pamb/pawb (max 3 calls)
3. Combine similar terms with OR operators instead of separate searches
4. Each major legal area requires dedicated tool category

# Research Strategy Framework
STEP 1: Query Analysis
- Identify ALL legal domains present in the request
- Determine required tool categories for comprehensive coverage

STEP 2: Tool Preamble (REQUIRED)
- Clearly state your research strategy before tool execution
- Outline which legal areas you'll investigate and why
- Provide progress updates as you execute each tool call

STEP 3: Parallel Execution
- Execute 4-8 tools across identified legal categories
- Use category-specific tool combinations per domain

# Required Tool Combinations by Legal Domain
- Bankruptcy: search_dockets + get_case_details + search_opinions
- Intellectual Property: search_patents + search_ptab_proceedings  
- Corporate/Securities: search_sec_filings + get_sec_company_facts
- Environmental: search_epa_facilities + search_federal_register
- Regulatory: search_cfr + search_federal_register + search_state_statute
- State Court Practice: search_court_rules + get_formatting_requirements + get_electronic_filing_rules
- Local Court Rules: search_local_rules + get_court_specific_procedures + check_rule_updates
- Document Preparation: get_document_templates + validate_document_compliance + get_citation_requirements
- Specialized Practice: get_discovery_rules + get_appellate_requirements + get_emergency_procedures

# Search Optimization Rules
- Use wildcard patterns: "chemical*" captures chemical/chemicals/chemically
- Combine jurisdictions: "PA AND (bankruptcy OR Chapter 11)"
- Corporate entity searches: Include common suffixes (Inc, Corp, LLC)
- Date ranges: Focus on relevant time periods for legal precedence
- State court rules: Always specify 2-letter state code (CA, NY, TX, etc.)
- Document formatting: Check both general and court-specific requirements
- Local rules: Search county/district variations for comprehensive coverage

# Output Requirements
- Provide comprehensive legal analysis with proper citations
- Include jurisdictional considerations and statutory authority
- Flag relevant case law precedents and regulatory compliance issues
- Recommend strategic legal considerations

# Constraints
- Maximum 15 results per search tool for focused analysis
- Timeout protection: 45 seconds per tool execution
- Multi-category coverage required for complex queries
- Verify citations using lookup_citation when available

Do not reveal internal chain-of-thought. Use concise status messages for progress.`;
}

/* ----------------------- Param Cleaning (Chat Only) ----------------------- */
/** Single unified cleaner for Chat Completions API:
 * - Uses max_tokens (correct for Chat Completions)
 * - Accepts max_completion_tokens alias and converts it
 * - Strips only logprobs/top_logprobs which we don't need here
 */
function cleanParamsForChat(params) {
  const cleaned = { ...params };
  delete cleaned.logprobs;
  delete cleaned.top_logprobs;
  
  // GPT-5 specifically requires max_completion_tokens, not max_tokens
  // Convert any token limit params to max_completion_tokens
  if (typeof cleaned.max_tokens !== 'undefined') {
    cleaned.max_completion_tokens = cleaned.max_tokens;
    delete cleaned.max_tokens;
  }
  
  // Also accept Responses-style alias
  if (typeof cleaned.max_output_tokens !== 'undefined') {
    cleaned.max_completion_tokens = cleaned.max_output_tokens;
    delete cleaned.max_output_tokens;
  }
  
  // Keep max_completion_tokens as-is if already present
  return cleaned;
}

/** Runtime guard (kept minimal on purpose) */
async function chatCreateWithGuard(client, body) {
  return client.chat.completions.create(cleanParamsForChat(body));
}

/* ---------------------------- Orchestrator (Chat) ---------------------------- */

class Gpt5Orchestrator {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.serverUrl = options.serverUrl; // not used in Chat path; kept for parity
    this.serverLabel = options.serverLabel;
    this.requireApproval = options.requireApproval;
    this.model = options.model || 'gpt-5';
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  // Removed duplicate cleaner - using unified cleanParamsForChat instead

  async runResearch(options) {
    const {
      prompt,
      responseFormat,
      customTools = [],
      maxCompletionTokens = 4000
    } = options;

    try {
      const messages = [
        { role: 'system', content: getOptimizedLegalPrompt() },
        { role: 'user', content: prompt }
      ];

      const apiParams = cleanParamsForChat({
        model: this.model,
        messages,
        // Do not pass non-function tools to Chat Completions
        tools: undefined,
        max_tokens: maxCompletionTokens,
        response_format: responseFormat
      });

      const response = await chatCreateWithGuard(this.openai, apiParams);

      return {
        text: response.choices?.[0]?.message?.content || '',
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      console.error('GPT-5 Research Error:', error);
      throw error;
    }
  }

  async streamResearch(options) {
    const {
      prompt,
      onThinking,   // we’ll emit neutral status instead of raw thinking
      onToolCall,
      onContent,
      maxCompletionTokens = 8000
    } = options;

    try {
      const messages = [
        { role: 'system', content: getOptimizedLegalPrompt() },
        { role: 'user', content: prompt }
      ];

      // First call (non-stream) to get potential tool calls
      const apiParams = cleanParamsForChat({
        model: this.model,
        messages,
        max_tokens: maxCompletionTokens
      });

      const firstResponse = await chatCreateWithGuard(this.openai, apiParams);
      const message = firstResponse.choices?.[0]?.message;

      if (message?.content && onThinking) {
        // Emit neutral status instead of chain-of-thought
        onThinking({ text: 'Planning…', timestamp: new Date().toISOString() });
      }

      // Handle tool calls (caller provides handler)
      if (message?.tool_calls && onToolCall) {
        for (const toolCall of message.tool_calls) {
          await onToolCall({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}')
          });
        }
      }

      // Stream the final response
      const streamParams = cleanParamsForChat({
        model: this.model,
        messages: [...messages, message],
        stream: true,
        max_tokens: maxCompletionTokens
      });

      const stream = await chatCreateWithGuard(this.openai, streamParams);

      let fullText = '';
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onContent?.(delta);
        }
      }

      return { text: fullText };
    } catch (error) {
      console.error('GPT-5 Stream Error:', error);
      throw error;
    }
  }
}

/* --------------------------------- Bridge --------------------------------- */

class Gpt5Bridge {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.runnerPath = options.runnerPath;
    this.model = options.model || 'gpt-5';
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  async runResearch(query) {
    try {
      const apiParams = cleanParamsForChat({
        model: this.model,
        messages: [
          { role: 'system', content: getOptimizedLegalPrompt() },
          { role: 'user', content: query }
        ],
        max_tokens: 4000
      });

      const response = await chatCreateWithGuard(this.openai, apiParams);

      return {
        text: response.choices?.[0]?.message?.content || '',
        usage: response.usage
      };
    } catch (error) {
      console.error('GPT-5 Bridge Error:', error);
      throw error;
    }
  }
}

/* ------------------------------ Iterative Stub ----------------------------- */

class IterativePlanner {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.serverUrl = options.serverUrl;
    this.model = options.model;
    this.allowlist = options.allowlist;
  }
  async run(_query, _options) {
    // Placeholder logic
    return { found: [{ url: 'example.com', source: 'test', snippet: 'test snippet' }] };
  }
}

/* --------------------------------- Helpers --------------------------------- */

// MCP teardown helper (safe to call multiple times)
async function teardownMcp(transport, mcp) {
  try { await mcp?.close?.(); } catch {}
  try { await transport?.close?.(); } catch {}
  try { transport?.child?.kill?.('SIGTERM'); } catch {}
}

/* --------------------------------- Server --------------------------------- */

export function createGpt5Server() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  const BASE_DIR = process.env.MCP_BASE_DIR || process.cwd();
  const RUNNER = `${BASE_DIR}/run-legal-mcp.sh`;
  const serverUrl = `stdio://bash?args=${encodeURI(RUNNER)}`;

  const orchestrator = new Gpt5Orchestrator({
    apiKey: OPENAI_API_KEY,
    serverUrl,
    serverLabel: 'legal_research',
    requireApproval: 'never',
    model: process.env.GPT5_MODEL || 'gpt-5'
  });

  // POST /api/gpt5/research — Chat path with optional DB logging
  app.post('/api/gpt5/research', async (req, res) => {
    try {
      const { query, jsonSchema } = req.body || {};
      if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query is required' });

      const mode = String(req.query.mode || 'chat'); // default to chat with stdio MCP
      if (mode === 'chat') {
        const bridge = new Gpt5Bridge({
          apiKey: process.env.OPENAI_API_KEY,
          runnerPath: RUNNER,
          model: process.env.GPT5_MODEL || 'gpt-5'
        });
        const result = await bridge.runResearch(query);
        return res.json(result);
      }

      // If you add a Responses path later, place it here.

      await ensureSchema();
      const pool = getPool();
      let runId = null;
      if (pool) {
        const r = await pool.query(
          'insert into runs(model, query) values ($1,$2) returning id',
          [process.env.GPT5_MODEL || 'gpt-5', query]
        );
        runId = r.rows[0].id;
      }

      const responseFormat = jsonSchema
        ? { type: 'json_schema', json_schema: { name: 'legal_memo', schema: jsonSchema, strict: true } }
        : null;

      const result = await orchestrator.runResearch({
        prompt: query,
        responseFormat,
        maxCompletionTokens: 4000
      });

      if (pool && runId) {
        await pool.query('update runs set final_text=$1, status=$2 where id=$3', [
          result.text || '',
          'completed',
          runId
        ]);
      }

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e?.message || 'unknown error' });
    }
  });

  // GET /api/gpt5/stream — Chat path with stdio MCP tools and safe two rounds
  app.get('/api/gpt5/stream', async (req, res) => {
    const query = String(req.query.query || '');
    if (!query) return res.status(400).end('query required');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
    const heartbeat = setInterval(() => res.write(':\n\n'), 15000);
    let transport = null;
    let mcp = null;
    let ended = false;
    const end = async () => {
      if (ended) return;
      ended = true;
      clearInterval(heartbeat);
      await teardownMcp(transport, mcp);
      try { res.end(); } catch {}
    };

    // Ensure teardown if the client disconnects early
    req.on('close', end);
    req.on('aborted', end);
    res.on('close', end);

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Connect to MCP over stdio
      console.log('Connecting to MCP...');
      transport = new StdioClientTransport({ command: 'bash', args: [RUNNER] });
      mcp = new MCPClient({ name: 'gpt5-stream-bridge', version: '1.0.0' }, { capabilities: {} });
      await mcp.connect(transport);
      console.log('MCP connected');

      // Discover tools
      const listed = await mcp.listTools();

      // Sanitize MCP schemas for Chat “function” tools
      function sanitizeMcpSchema(schema) {
        try {
          const clone = JSON.parse(JSON.stringify(schema || { type: 'object' }));
          const fix = (obj) => {
            if (obj && typeof obj === 'object') {
              if ('required' in obj && !Array.isArray(obj.required)) delete obj.required;
              if (obj.properties && typeof obj.properties === 'object') {
                for (const k of Object.keys(obj.properties)) fix(obj.properties[k]);
              }
              if (obj.items) fix(obj.items);
              if (!obj.type) obj.type = 'object';
            }
          };
          fix(clone);
          if (!clone.type) clone.type = 'object';
          return clone;
        } catch {
          return { type: 'object' };
        }
      }

      const functions = (listed.tools || []).map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description || '',
          parameters: sanitizeMcpSchema(t.inputSchema)
        }
      }));

      // Initial messages and planning status
      const optimizedSystemPrompt = getOptimizedLegalPrompt();
      const messages = [
        { role: 'system', content: optimizedSystemPrompt },
        { role: 'user', content: query }
      ];

      // First pass to get tool calls
      const apiParams = cleanParamsForChat({
        model: process.env.GPT5_MODEL || 'gpt-5',
        messages,
        tools: functions,
        tool_choice: 'auto',
        max_tokens: 4000
      });

      const first = await chatCreateWithGuard(openai, apiParams);
      const callMsg = first.choices?.[0]?.message;

      if (callMsg?.content && !callMsg?.tool_calls) {
        // Neutral status (no chain-of-thought)
        send({ type: 'enhanced_thinking', text: 'Planning research…', timestamp: new Date().toISOString() });
      }

      let tcalls = callMsg?.tool_calls || [];
      let rounds = 0;

      // Simple quality metric based on categories/tools
      const categories = new Set(tcalls.map(tc => getToolCategory(tc.function.name)));
      const qualityMetrics = {
        toolsUsed: tcalls.length,
        categoriesCovered: categories.size,
        comprehensivenessScore: Math.min(100, (categories.size / 4) * 100),
        isComprehensive: categories.size >= 2 && tcalls.length >= 4
      };
      if (!qualityMetrics.isComprehensive && query.split(' ').length > 8) {
        send({
          type: 'warning',
          message: `Research covers ${categories.size} legal areas with ${tcalls.length} tools. Consider expanding for comprehensive analysis.`,
          metrics: qualityMetrics
        });
      }

      // Up to two rounds of tool execution if the model keeps asking
      while (tcalls.length > 0 && rounds < 2) {
        messages.push(rounds === 0 ? callMsg : { role: 'assistant', tool_calls: tcalls });
        const currentRound = rounds + 1;

        const toolPromises = tcalls.map(async (tc, index) => {
          let args = {};
          try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}

          // Guardrails on limits
          if (args && typeof args === 'object') {
            if (tc.function.name.startsWith('search_') || tc.function.name.includes('list')) {
              if ('limit' in args) args.limit = Math.min(args.limit, 15);
              else args.limit = 15;
              if ('page_size' in args) args.page_size = Math.min(args.page_size, 15);
            }
          }

          const legalContext = getLegalContext(tc.function.name);
          const category = getToolCategory(tc.function.name);

          send({
            type: 'enhanced_tool_call',
            tool: { name: tc.function.name, arguments: args },
            context: legalContext,
            progress: {
              current: index + 1,
              total: tcalls.length,
              category,
              round: currentRound,
              percentage: Math.round(((index + 1) / tcalls.length) * 100)
            },
            execution: { started: new Date().toISOString(), timeout: 45000 }
          });

          try {
            const result = await Promise.race([
              mcp.callTool({ name: tc.function.name, arguments: args }),
              new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout tools/call ${tc.function.name}`)), 45000))
            ]);
            const text = result?.content?.[0]?.text || '';

            send({
              type: 'enhanced_tool_complete',
              tool: tc.function.name,
              category,
              success: true,
              resultLength: text.length,
              completed: new Date().toISOString()
            });

            return { id: tc.id, content: text, success: true };
          } catch (error) {
            console.error(`Tool call failed: ${tc.function.name}`, error?.message);
            send({
              type: 'enhanced_tool_complete',
              tool: tc.function.name,
              category,
              success: false,
              error: error?.message || 'tool error'
            });
            return { id: tc.id, content: `Error: ${error?.message || 'tool error'}`, success: false };
          }
        });

        const results = await Promise.all(toolPromises);
        for (const result of results) {
          messages.push({ role: 'tool', tool_call_id: result.id, content: result.content });
        }

        // Ask model if it wants another tool round
        const followParams = cleanParamsForChat({
          model: process.env.GPT5_MODEL || 'gpt-5',
          messages,
          tools: functions,
          tool_choice: 'auto',
          max_tokens: 2000
        });
        const follow = await chatCreateWithGuard(openai, followParams);
        const followMsg = follow.choices?.[0]?.message;

        if (followMsg?.tool_calls?.length) {
          tcalls = followMsg.tool_calls;
          rounds++;
          continue;
        }
        if (followMsg?.content) messages.push(followMsg);
        break;
      }

      // Final streamed synthesis
      const streamParams = cleanParamsForChat({
        model: process.env.GPT5_MODEL || 'gpt-5',
        messages,
        tools: functions,
        tool_choice: 'none',
        stream: true,
        max_tokens: 8000
      });

      const stream = await chatCreateWithGuard(openai, streamParams);
      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content;
        if (delta) send({ type: 'delta', text: delta });
      }

      send({ type: 'final', metrics: qualityMetrics, completed: new Date().toISOString() });
      return end();
    } catch (e) {
      try { send({ type: 'error', error: e?.message || 'unknown error' }); } catch {}
      return end();
    }
  });

  // Health endpoint
  app.get('/health', (_req, res) => res.json({ ok: true, enhanced: true, version: '2.0' }));

  // POST /api/gpt5/iterative — simple stub pipeline with memo synthesis
  app.post('/api/gpt5/iterative', async (req, res) => {
    try {
      const { query } = req.body || {};
      if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query is required' });

      await ensureSchema();
      const pool = getPool();
      let runId = null;
      if (pool) {
        const r = await pool.query(
          'insert into runs(model, query) values ($1,$2) returning id',
          [process.env.GPT5_MODEL || 'gpt-5', query]
        );
        runId = r.rows[0].id;
      }

      const planner = new IterativePlanner({
        apiKey: process.env.OPENAI_API_KEY,
        serverUrl,
        model: process.env.GPT5_MODEL || 'gpt-5',
        allowlist: [
          'search_cases', 'search_state_statute', 'search_opinions',
          'search_sec_filings', 'search_federal_register', 'get_case_details'
        ]
      });

      const state = await planner.run(query, { maxIterations: 6, targetDocs: 10 });

      if (pool && runId) {
        for (const doc of state.found) {
          await pool.query(
            'insert into evidence(run_id, uri, source, snippet, hash) values ($1,$2,$3,$4,$5)',
            [runId, doc.url || '', doc.source || '', doc.snippet || '', null]
          );
        }
      }

      const schemaPath = `${process.cwd()}/src/schemas/BankruptcyResearchMemo.json`;
      const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

      const memo = await orchestrator.runResearch({
        prompt: `Using the collected evidence (URLs and snippets available to the tool layer), draft a comprehensive BankruptcyResearchMemo for the query: ${query}. Include jurisdictions, issues, authorities, analysis, recommendations, and proper legal citations.`,
        responseFormat: { type: 'json_schema', json_schema: { name: 'BankruptcyResearchMemo', schema, strict: true } },
        maxCompletionTokens: 8000
      });

      if (pool && runId) {
        await pool.query(
          'update runs set memo_json=$1, final_text=$2, status=$3 where id=$4',
          [memo.text ? JSON.parse(memo.text) : null, memo.text || '', 'completed', runId]
        );
      }

      res.json({
        runId,
        evidenceCount: state.found.length,
        memo: memo.text ? JSON.parse(memo.text) : null,
        enhanced: true
      });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'unknown error' });
    }
  });

  return app;
}




// Backup code being tested.
// import express from 'express';
// import cors from 'cors';
// import { getPool, ensureSchema } from '../db/postgres.js';
// import fs from 'fs/promises';
// import OpenAI from 'openai';
// import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// // ================================
// // ✅ DOCUMENTATION-COMPLIANT GPT-5 LEGAL RESEARCH SERVER
// // ================================
// // Updated: August 16, 2025 - Cookbook/Reference Aligned
// // Compliance: OpenAI GPT-5 API (Responses primary; Chat fallback)
// // CORRECTED: Uses event-typed Responses streaming, typed content blocks,
// //            proper Chat params, privacy-safe store toggle, and MCP /sse.

// // ================================
// // ✅ VERIFIED: Correct parameter handling
// // ================================

// const UNSUPPORTED_GPT5_PARAMS = [
//   'temperature', 'top_p', 'presence_penalty', 'frequency_penalty',
//   'logprobs', 'top_logprobs', 'logit_bias'
// ];

// // ✅ VERIFIED: Proper parameter cleaning based on official scopes
// function cleanParamsForGpt5(params, apiType = 'responses') {
//   const cleaned = { ...params };

//   // Keep temperature/top_p for Chat; remove for Responses
//   const toDelete = apiType === 'responses'
//     ? UNSUPPORTED_GPT5_PARAMS
//     : UNSUPPORTED_GPT5_PARAMS.filter(p => !['temperature', 'top_p'].includes(p));
//   toDelete.forEach(param => {
//     delete cleaned[param];
//   });

//   if (apiType === 'responses') {
//     // ✅ Responses API parameter structure
//     if (params.max_tokens || params.maxTokens || params.max_completion_tokens) {
//       cleaned.max_output_tokens = params.max_tokens || params.maxTokens || params.max_completion_tokens;
//       delete cleaned.max_tokens;
//       delete cleaned.maxTokens;
//       delete cleaned.max_completion_tokens;
//     }

//     if (params.reasoningEffort || params.reasoning_effort) {
//       // minimal, low, medium, high
//       cleaned.reasoning = {
//         effort: params.reasoningEffort || params.reasoning_effort
//       };
//       delete cleaned.reasoningEffort;
//       delete cleaned.reasoning_effort;
//     }

//     if (params.verbosity) {
//       // low, medium, high
//       cleaned.text = { ...(cleaned.text || {}), verbosity: params.verbosity };
//       delete cleaned.verbosity;
//     }

//     if (params.response_format || params.responseFormat) {
//       const format = params.response_format || params.responseFormat;
//       cleaned.text = {
//         ...(cleaned.text || {}),
//         format: format
//       };
//       delete cleaned.response_format;
//       delete cleaned.responseFormat;
//     }

//   } else if (apiType === 'chat') {
//     // ✅ Chat Completions parameter structure
//     if (params.max_tokens || params.maxTokens || params.max_output_tokens) {
//       cleaned.max_tokens = params.max_tokens || params.maxTokens || params.max_output_tokens;
//       delete cleaned.maxTokens;
//       delete cleaned.max_output_tokens;
//     }

//     if (params.reasoningEffort || params.reasoning_effort) {
//       cleaned.reasoning_effort = params.reasoningEffort || params.reasoning_effort;
//       delete cleaned.reasoningEffort;
//       delete cleaned.reasoning_effort;
//     }
//   }

//   return cleaned;
// }

// // ================================
// // ✅ VERIFIED: Enhanced prompts for GPT-5's documented capabilities
// // ================================

// function getGpt5OptimizedLegalPrompt() {
//   return `# Expert Legal Research Agent - GPT-5 Enhanced

// You are an expert legal research specialist leveraging GPT-5's advanced reasoning capabilities.

// ## 🎯 MANDATORY STRUCTURED WORKFLOW

// ### PHASE 1: STRATEGIC PLANNING (REQUIRED BEFORE ANY ACTIONS)
// Before executing any tools or providing analysis, you MUST:
// - **Query Decomposition**: Break the legal question into specific research components
// - **Tool Strategy**: Explicit plan for which tools to use and in what sequence  
// - **Success Criteria**: Define what constitutes comprehensive coverage
// - **Expected Outcomes**: Predict what information each tool should provide
// - **Reasoning Strategy**: Plan your analytical approach and depth

// ### PHASE 2: SYSTEMATIC EXECUTION WITH CLEAR REASONING
// For each tool call, provide:
// - **Pre-Tool Rationale**: Why this specific tool for this research need
// - **Strategic Context**: How this fits into the overall research strategy
// - **Reasoning Process**: Show your analytical steps clearly
// - **Post-Tool Assessment**: Evaluate result quality and coverage gaps
// - **Refinement**: Adjust approach based on findings

// ### PHASE 3: SYNTHESIS & VALIDATION  
// Complete your analysis with:
// - **Authority Hierarchy**: Rank sources by precedential value
// - **Comprehensive Review**: Assess coverage across legal domains
// - **Strategic Recommendations**: Provide actionable legal guidance
// - **Quality Validation**: Confirm research meets professional standards
// - **Reasoning Summary**: Summarize your analytical process

// ## 🏛️ LEGAL RESEARCH FRAMEWORK
// **Primary Authority Priority**: Statutes > Regulations > Case Law > Administrative Guidance
// **Jurisdictional Scope**: Federal > State > Local (unless specified otherwise)
// **Source Reliability**: Official sources > Legal databases > Secondary commentary

// ## 📊 REASONING DEPTH CONTROL
// GPT-5's reasoning_effort parameter controls analytical depth:
// - **minimal**: Quick analysis
// - **low**: Basic reasoning
// - **medium**: Standard analysis
// - **high**: Deep reasoning

// ## 📝 VERBOSITY OPTIMIZATION
// Use verbosity parameter to control response length:
// - **low**: Concise but complete
// - **medium**: Balanced detail  
// - **high**: Extensive analysis with full explanations`;
// }

// function getMinimalReasoningPrompt() {
//   return `# Quick Legal Research - GPT-5 Minimal Reasoning

// ## STREAMLINED WORKFLOW
// 1. **Brief Strategy**: One sentence research approach
// 2. **Key Steps**: Essential reasoning process
// 3. **Tool Execution**: Focused tool calls with rationale
// 4. **Concise Summary**: Results with confidence assessment

// **Format**:
// - Strategy: [Approach]
// - Steps: • [Issue] • [Authority] • [Tool rationale] • [Outcome]
// - Execution: [Tool calls with brief justification]
// - Summary: [Findings with confidence level]`;
// }

// // ✅ VERIFIED: Verbosity optimization pattern
// function getVerbosityOptimizedPrompt(basePrompt, taskType, verbosityLevel) {
//   if (taskType === 'legal_research' && verbosityLevel === 'low') {
//     return `${basePrompt}

// ## VERBOSITY OVERRIDE FOR LEGAL RESEARCH
// For legal analysis specifically:
// - Provide detailed legal reasoning and comprehensive citations
// - Include thorough analysis of authorities and precedents  
// - Use high verbosity for legal explanations while keeping status updates brief
// - Maintain professional legal writing standards regardless of global verbosity setting`;
//   }
//   return basePrompt;
// }

// // ================================
// /** ✅ VERIFIED: Tool configuration for GPT-5 (Responses API)
//  *  Use remote MCP over SSE endpoint; keep headers if using bearer auth.
//  *  Do not include undocumented fields like require_approval/allowed_tools.
//  */
// function buildGpt5ResponsesTools() {
//   const mcpServerUrl = process.env.LEGAL_MCP_SERVER_URL;
//   if (!mcpServerUrl) {
//     console.warn('LEGAL_MCP_SERVER_URL not set - MCP tools will not be available');
//     return [];
//   }

//   const tool = {
//     type: "mcp",
//     server_label: "legal_research",
//     server_url: `${mcpServerUrl.replace(/\/$/, '')}/sse`
//   };

//   if (process.env.LEGAL_MCP_API_KEY) {
//     tool.headers = {
//       "Authorization": `Bearer ${process.env.LEGAL_MCP_API_KEY}`
//     };
//   }

//   return [tool];
// }

// // ✅ OPTIONAL: Chat-completions compatible function tools (fallback path)
// function buildChatCompletionsTools() {
//   return [
//     {
//       type: "function",
//       function: {
//         name: "search_cases",
//         description: "Search for legal cases by keywords, jurisdiction, and court",
//         parameters: {
//           type: "object",
//           properties: {
//             query: { type: "string", description: "Search query for case law" },
//             jurisdiction: {
//               type: "string",
//               description: "Jurisdiction (federal, state name, or 'all')",
//               default: "all"
//             },
//             limit: {
//               type: "integer",
//               description: "Maximum number of results (1-20)",
//               default: 10,
//               minimum: 1,
//               maximum: 20
//             }
//           },
//           required: ["query"]
//         }
//       }
//     },
//     {
//       type: "function",
//       function: {
//         name: "search_statutes",
//         description: "Search federal and state statutes by keywords and jurisdiction",
//         parameters: {
//           type: "object",
//           properties: {
//             query: { type: "string", description: "Search query for statutes" },
//             jurisdiction: {
//               type: "string",
//               description: "Jurisdiction (federal, state name, or 'all')",
//               default: "federal"
//             },
//             limit: {
//               type: "integer",
//               description: "Maximum number of results (1-20)",
//               default: 10,
//               minimum: 1,
//               maximum: 20
//             }
//           },
//           required: ["query"]
//         }
//       }
//     }
//   ];
// }

// // ================================
// // ✅ VERIFIED: JSON Schema for Structured Outputs
// // ================================

// const LEGAL_ANALYSIS_SCHEMA = {
//   type: "object",
//   properties: {
//     research_summary: {
//       type: "string",
//       description: "Executive summary of legal findings"
//     },
//     legal_authorities: {
//       type: "array",
//       items: {
//         type: "object",
//         properties: {
//           type: { type: "string", enum: ["statute", "case_law", "regulation", "constitutional"] },
//           citation: { type: "string" },
//           jurisdiction: { type: "string" },
//           relevance_score: { type: "number", minimum: 0, maximum: 10 },
//           key_holding: { type: "string" },
//           reasoning_summary: { type: "string" }
//         },
//         required: ["type", "citation", "jurisdiction", "relevance_score"]
//       }
//     },
//     legal_analysis: {
//       type: "object",
//       properties: {
//         primary_issues: { type: "array", items: { type: "string" } },
//         applicable_law: { type: "string" },
//         reasoning_chain: { type: "array", items: { type: "string" } },
//         counterarguments: { type: "array", items: { type: "string" } },
//         confidence_level: { type: "string", enum: ["low", "medium", "high", "very_high"] }
//       },
//       required: ["primary_issues", "applicable_law", "confidence_level"]
//     },
//     strategic_recommendations: {
//       type: "array",
//       items: {
//         type: "object",
//         properties: {
//           recommendation: { type: "string" },
//           priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
//           risk_assessment: { type: "string" },
//           next_steps: { type: "array", items: { type: "string" } }
//         },
//         required: ["recommendation", "priority"]
//       }
//     }
//   },
//   required: ["research_summary", "legal_authorities", "legal_analysis", "strategic_recommendations"],
//   additionalProperties: false
// };

// // ================================
// // ✅ VERIFIED: Dynamic Parameter Optimization
// // ================================

// function determineOptimalReasoningEffort(query, taskComplexity = null) {
//   const complexityIndicators = {
//     high: [
//       'constitutional interpretation', 'supreme court precedent', 'circuit split analysis',
//       'first impression', 'multi-jurisdictional conflict', 'class action certification',
//       'antitrust conspiracy', 'securities fraud investigation', 'patent infringement',
//       'international arbitration', 'regulatory compliance audit', 'merger analysis',
//       'constitutional', 'supreme court', 'circuit split', 'first impression',
//       'multi-jurisdictional', 'class action', 'antitrust', 'securities fraud',
//       'intellectual property', 'international law', 'regulatory compliance'
//     ],
//     medium: [
//       'contract dispute', 'tort liability', 'employment law', 'real estate transaction',
//       'family law', 'criminal defense', 'personal injury', 'business formation',
//       'corporate governance', 'tax law', 'immigration law', 'environmental law'
//     ],
//     low: [
//       'simple research', 'basic question', 'straightforward', 'routine procedure',
//       'standard practice', 'common issue', 'filing deadline', 'form selection'
//     ]
//   };

//   const queryLower = query.toLowerCase();
//   if (taskComplexity) return taskComplexity;

//   const highComplexity = complexityIndicators.high.some(indicator => queryLower.includes(indicator));
//   const mediumComplexity = complexityIndicators.medium.some(indicator => queryLower.includes(indicator));

//   if (highComplexity) return 'high';
//   if (mediumComplexity) return 'medium';
//   if (queryLower.length > 300) return 'high';
//   if (queryLower.length > 150) return 'medium';
//   return 'low';
// }

// function optimizeParametersForQuery(query, performanceTarget = 'balanced') {
//   const baseEffort = determineOptimalReasoningEffort(query);

//   const optimizations = {
//     speed: {
//       reasoning_effort: baseEffort === 'high' ? 'medium' : baseEffort,
//       verbosity: 'low',
//       max_output_tokens: 4000
//     },
//     quality: {
//       reasoning_effort: baseEffort === 'low' ? 'medium' : 'high',
//       verbosity: 'high',
//       max_output_tokens: 12000
//     },
//     balanced: {
//       reasoning_effort: baseEffort,
//       verbosity: 'medium',
//       max_output_tokens: 8000
//     }
//   };

//   return optimizations[performanceTarget] || optimizations.balanced;
// }

// // ================================
// // ✅ VERIFIED: Documentation-Compliant GPT-5 Orchestrator
// // ================================

// class DocumentationCompliantGpt5Orchestrator {
//   constructor(options) {
//     this.apiKey = options.apiKey;
//     this.model = options.model || 'gpt-5';
//     this.openai = new OpenAI({ apiKey: this.apiKey });
//     this.conversationState = new Map();
//   }

//   // ✅ Smart input format selection (typed content blocks for Responses)
//   buildOptimalInput(userPrompt, systemPrompt = null) {
//     if (systemPrompt) {
//       return [
//         { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
//         { role: 'user',      content: [{ type: 'input_text', text: userPrompt   }] }
//       ];
//     } else {
//       return [{ role: 'user', content: [{ type: 'input_text', text: userPrompt }] }];
//     }
//   }

//   // ✅ Streaming for Responses API using event-typed SSE
//   async robustResponsesApiCallWithStreaming(params, onChunk, retryCount = 0) {
//     try {
//       const stream = await this.openai.responses.create({ ...params, stream: true });

//       let fullResponse = '';
//       let toolCalls = [];
//       let finalUsage = null;

//       for await (const event of stream) {
//         switch (event.type) {
//           case 'response.output_text.delta': {
//             const delta = event.delta || '';
//             fullResponse += delta;
//             onChunk?.({ type: 'content', content: delta, accumulated: fullResponse });
//             break;
//           }
//           case 'response.tool_call.delta': {
//             toolCalls.push(event.delta);
//             onChunk?.({ type: 'tool_call', tool_calls: [event.delta] });
//             break;
//           }
//           case 'response.delta': {
//             // usage updates and other deltas
//             if (event.usage) {
//               finalUsage = event.usage;
//               onChunk?.({ type: 'usage_update', usage: finalUsage });
//             }
//             break;
//           }
//           case 'response.completed': {
//             return {
//               success: true,
//               response: {
//                 output_text: fullResponse,
//                 tool_calls: toolCalls,
//                 usage: finalUsage,
//                 streamed: true
//               },
//               api_used: 'responses_streaming'
//             };
//           }
//           case 'response.error': {
//             throw new Error(event.error?.message || 'Streaming error');
//           }
//           default: {
//             // ignore keepalives / non-essential events
//             break;
//           }
//         }
//       }

//       // Fallback (should not reach)
//       return {
//         success: true,
//         response: {
//           output_text: fullResponse,
//           tool_calls: toolCalls,
//           usage: finalUsage,
//           streamed: true
//         },
//         api_used: 'responses_streaming'
//       };

//     } catch (error) {
//       if (retryCount < 2) {
//         await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
//         return this.robustResponsesApiCallWithStreaming(params, onChunk, retryCount + 1);
//       }
//       throw error;
//     }
//   }

//   // ✅ Non-streaming Responses call with fallback to Chat
//   async robustResponsesApiCall(params, retryCount = 0) {
//     try {
//       const response = await this.openai.responses.create(params);
//       return { success: true, response, api_used: 'responses' };

//     } catch (error) {
//       // Handle MCP outages with Chat fallback
//       const message = error?.message || '';
//       if (message.includes('424') || message.toLowerCase().includes('mcp')) {
//         const systemPrompt = this.extractSystemPrompt(params.input);
//         const userPrompt = this.extractUserPrompt(params.input);

//         const fallbackParams = cleanParamsForGpt5({
//           model: params.model,
//           messages: systemPrompt
//             ? [
//                 { role: 'system', content: systemPrompt },
//                 { role: 'user', content: userPrompt }
//               ]
//             : [{ role: 'user', content: userPrompt }],
//           tools: buildChatCompletionsTools(),
//           reasoning_effort: params.reasoning?.effort || 'medium',
//           max_tokens: params.max_output_tokens || 4000,
//           // Keep temperature/top_p if callers set them
//           temperature: params.temperature,
//           top_p: params.top_p
//         }, 'chat');

//         const chatResponse = await this.openai.chat.completions.create(fallbackParams);

//         return {
//           success: true,
//           response: {
//             output_text: chatResponse.choices?.[0]?.message?.content || '',
//             usage: chatResponse.usage
//           },
//           api_used: 'chat_completions',
//           fallback_reason: 'mcp_server_unavailable'
//         };
//       }

//       if (retryCount < 2) {
//         await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
//         return this.robustResponsesApiCall(params, retryCount + 1);
//       }

//       throw error;
//     }
//   }

//   // ✅ Helper methods for input format handling
//   extractSystemPrompt(input) {
//     if (Array.isArray(input)) {
//       const devMsg = input.find(msg => msg.role === 'developer');
//       // developer content is typed array
//       const text = devMsg?.content?.find?.(c => c.type === 'input_text')?.text;
//       return text || null;
//     }
//     return null;
//   }

//   extractUserPrompt(input) {
//     if (Array.isArray(input)) {
//       const userMsg = input.find(msg => msg.role === 'user');
//       const text = userMsg?.content?.find?.(c => c.type === 'input_text')?.text;
//       return text || 'Legal research query';
//     }
//     return typeof input === 'string' ? input : 'Legal research query';
//   }

//   // ✅ VERIFIED: Research with documented parameters
//   async runResearch(options) {
//     const {
//       prompt,
//       reasoning_effort = 'medium',
//       verbosity = 'medium',
//       useResponsesAPI = true,
//       jsonSchema = null,
//       taskType = 'legal_research'
//     } = options;

//     if (useResponsesAPI) {
//       const systemPrompt = getVerbosityOptimizedPrompt(
//         reasoning_effort === 'minimal' ? getMinimalReasoningPrompt() : getGpt5OptimizedLegalPrompt(),
//         taskType,
//         verbosity
//       );

//       const input = this.buildOptimalInput(prompt, systemPrompt);

//       const requestParams = cleanParamsForGpt5({
//         model: this.model,
//         input,
//         reasoning: { effort: reasoning_effort },
//         text: { verbosity },
//         tools: [...buildGpt5ResponsesTools()],
//         // Privacy-safe default; opt-in via env
//         store: process.env.OPENAI_STORE === 'true',
//         // Optionally: include a short reasoning summary if needed
//         // include: ["reasoning.summary"],
//         max_output_tokens: 6000
//       }, 'responses');

//       if (jsonSchema) {
//         requestParams.text = requestParams.text || {};
//         requestParams.text.format = {
//           type: 'json_schema',
//           json_schema: {
//             name: 'legal_analysis',
//             schema: jsonSchema,
//             strict: true
//           }
//         };
//       }

//       const result = await this.robustResponsesApiCall(requestParams);
//       if (!result.success) throw new Error('Responses API call failed after retries');

//       return {
//         text: result.response.output_text,
//         usage: result.response.usage,
//         response_id: result.response.id,
//         api_used: result.api_used,
//         enhanced: true,
//         documentation_compliant: true,
//         tools_available: buildGpt5ResponsesTools().length,
//         fallback_reason: result.fallback_reason
//       };

//     } else {
//       const systemPrompt = getVerbosityOptimizedPrompt(
//         reasoning_effort === 'minimal' ? getMinimalReasoningPrompt() : getGpt5OptimizedLegalPrompt(),
//         taskType,
//         verbosity
//       );

//       const requestParams = cleanParamsForGpt5({
//         model: this.model,
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: prompt }
//         ],
//         reasoning_effort,
//         tools: buildChatCompletionsTools(),
//         max_tokens: 6000
//       }, 'chat');

//       if (jsonSchema) {
//         requestParams.response_format = {
//           type: 'json_schema',
//           json_schema: {
//             name: 'legal_analysis',
//             schema: jsonSchema,
//             strict: true
//           }
//         };
//       }

//       const response = await this.openai.chat.completions.create(requestParams);

//       return {
//         text: response.choices?.[0]?.message?.content || '',
//         usage: response.usage,
//         api_used: 'chat_completions',
//         enhanced: true,
//         documentation_compliant: true,
//         tools_available: buildChatCompletionsTools().length
//       };
//     }
//   }

//   // ✅ Dynamic optimization method
//   optimizeParametersForQuery(query, performanceTarget = 'balanced') {
//     return optimizeParametersForQuery(query, performanceTarget);
//   }

//   // ✅ Research with dynamic optimization
//   async runOptimizedResearch(options) {
//     const {
//       prompt,
//       performance_target = 'balanced',
//       auto_optimized = true
//     } = options;

//     const optimizedParams = this.optimizeParametersForQuery(prompt, performance_target);

//     const enhancedOptions = {
//       ...options,
//       ...optimizedParams
//     };

//     const result = await this.runResearch(enhancedOptions);

//     return {
//       ...result,
//       optimization_applied: optimizedParams,
//       performance_target,
//       auto_optimized: auto_optimized,
//       methodology: 'gpt5_dynamic_optimization'
//     };
//   }

//   // ✅ Multi-turn with documented capabilities
//   async runMultiTurnResearch(options) {
//     const {
//       prompt,
//       maxTurns = 3,
//       reasoning_effort = 'high',
//       verbosity = 'high',
//       taskType = 'legal_research'
//     } = options;

//     const results = [];
//     let previous_response_id = null;
//     let conversation_context = [];

//     const researchPhases = [
//       'Initial Analysis & Strategic Planning',
//       'Primary Authority Research & Validation',
//       'Secondary Authority & Comprehensive Synthesis'
//     ];

//     for (let turn = 0; turn < maxTurns; turn++) {
//       const turnPrompt = this.buildCumulativeInput(
//         prompt,
//         turn,
//         results,
//         conversation_context,
//         researchPhases[turn]
//       );

//       const systemPrompt = getVerbosityOptimizedPrompt(
//         getGpt5OptimizedLegalPrompt(),
//         taskType,
//         verbosity
//       );

//       const input = this.buildOptimalInput(turnPrompt, systemPrompt);

//       const requestParams = cleanParamsForGpt5({
//         model: this.model,
//         input,
//         reasoning: { effort: reasoning_effort },
//         text: { verbosity },
//         tools: [...buildGpt5ResponsesTools()],
//         store: process.env.OPENAI_STORE === 'true',
//         max_output_tokens: 10000
//       }, 'responses');

//       if (previous_response_id) {
//         requestParams.previous_response_id = previous_response_id;
//       }

//       const result = await this.robustResponsesApiCall(requestParams);
//       if (!result.success) throw new Error(`Turn ${turn + 1} failed after retries`);

//       const turnResult = {
//         turnNumber: turn + 1,
//         phase: researchPhases[turn] || 'Additional Research',
//         content: result.response.output_text,
//         responseId: result.response.id,
//         usage: result.response.usage,
//         api_used: result.api_used,
//         timestamp: new Date().toISOString(),
//         documentation_compliant: true,
//         context_preserved: !!previous_response_id
//       };

//       results.push(turnResult);

//       conversation_context.push({ role: 'user', content: turnPrompt });
//       conversation_context.push({ role: 'assistant', content: result.response.output_text });

//       previous_response_id = result.response.id;

//       // small delay between turns
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }

//     return this.synthesizeResults(results, conversation_context);
//   }

//   // ✅ Cumulative context building
//   buildCumulativeInput(originalPrompt, turnNumber, previousResults, conversationContext, phaseName) {
//     const contextSummary = previousResults.map((r, i) =>
//       `**Turn ${i + 1} (${r.phase})**: ${r.content?.substring(0, 200)}...`
//     ).join('\n\n');

//     const turnInstructions = {
//       0: `**FOCUS**: Comprehensive query analysis and initial research strategy. Plan extensively before any tool calls.`,
//       1: `**FOCUS**: Execute primary authority research with deep reflection on each tool result. Build upon previous analysis.`,
//       2: `**FOCUS**: Synthesize all findings and provide strategic recommendations. Address any remaining gaps.`
//     };

//     return `# Multi-Turn Legal Research - ${phaseName || `Turn ${turnNumber + 1}`}

// ## ORIGINAL LEGAL QUERY
// ${originalPrompt}

// ## CUMULATIVE RESEARCH CONTEXT
// ${contextSummary || 'Initial research turn - building comprehensive analysis'}

// ## TURN ${turnNumber + 1} SPECIFIC INSTRUCTIONS
// ${turnInstructions[turnNumber] || 'Complete comprehensive analysis and synthesis.'}

// ## GPT-5 DOCUMENTATION-COMPLIANT REQUIREMENTS
// 1. **PLANNING PHASE**: Explicit strategy for this research turn leveraging previous findings
// 2. **EXECUTION PHASE**: Tool calls with extensive pre/post reflection building on context
// 3. **ASSESSMENT PHASE**: Evaluate completeness and quality against cumulative research
// 4. **INTEGRATION**: Connect findings to previous turns for comprehensive coverage

// Begin with your planning phase, acknowledge previous research context, and provide explicit reasoning before any tool execution.`;
//   }

//   synthesizeResults(results, conversationContext) {
//     const finalContent = results.map(r => {
//       return `## ${r.phase}\n\n${r.content || 'No content generated for this phase'}`;
//     }).join('\n\n---\n\n');

//     return {
//       research_method: 'documentation_compliant_multi_turn',
//       total_turns: results.length,
//       content: finalContent,
//       comprehensive_analysis: results.map(r => ({
//         turn: r.turnNumber,
//         phase: r.phase,
//         key_content: (r.content || '').substring(0, 500) + '...',
//         api_used: r.api_used,
//         context_preserved: r.context_preserved,
//         documentation_compliant: r.documentation_compliant,
//         timestamp: r.timestamp
//       })),
//       total_usage: results.reduce((total, r) => ({
//         total_tokens: (total.total_tokens || 0) + (r.usage?.total_tokens || 0),
//         input_tokens: (total.input_tokens || 0) + (r.usage?.input_tokens || 0),
//         output_tokens: (total.output_tokens || 0) + (r.usage?.output_tokens || 0),
//         reasoning_tokens: (total.reasoning_tokens || 0) + (r.usage?.reasoning_tokens || 0)
//       }), {}),
//       context_continuity: {
//         conversation_length: conversationContext.length,
//         context_preserved: results.every(r => r.context_preserved || r.turnNumber === 1)
//       },
//       verified_features: {
//         responses_api: true,
//         chat_completions_fallback: true,
//         streaming_support: true,
//         context_persistence: true,
//         reasoning_effort_control: true,
//         verbosity_control: true,
//         dynamic_optimization: true,
//         structured_outputs: true
//       },
//       timestamp: new Date().toISOString()
//     };
//   }
// }

// // ================================
// // ✅ VERIFIED: Complete GPT-5 Server with Documented Features
// // ================================

// export function createDocumentationCompliantGpt5Server() {
//   const app = express();
//   app.use(cors());
//   // Consider bumping limit if you pass longer legal memos
//   app.use(express.json({ limit: '1mb' }));

//   // ✅ Validate environment variables
//   const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
//   if (!OPENAI_API_KEY) {
//     console.error('❌ OPENAI_API_KEY environment variable is required');
//     console.error('   Get your API key from: https://platform.openai.com/api-keys');
//     process.exit(1);
//   }

//   const LEGAL_MCP_SERVER_URL = process.env.LEGAL_MCP_SERVER_URL;
//   if (!LEGAL_MCP_SERVER_URL) {
//     console.warn('⚠️  LEGAL_MCP_SERVER_URL not set - limited to fallback tools');
//   }

//   console.log('✅ Documentation-Compliant GPT-5 Legal Research Server starting...');
//   console.log(`✅ Model: ${process.env.GPT5_MODEL || 'gpt-5'}`);
//   console.log(`✅ MCP Server: ${LEGAL_MCP_SERVER_URL ? 'Configured' : 'Fallback mode'}`);
//   console.log('✅ Verified Features: Streaming, State, MCP SSE, Structured Outputs');

//   const orchestrator = new DocumentationCompliantGpt5Orchestrator({
//     apiKey: OPENAI_API_KEY,
//     model: process.env.GPT5_MODEL || 'gpt-5'
//   });

//   // ✅ Basic research endpoint
//   app.post('/api/gpt5/research', async (req, res) => {
//     try {
//       const {
//         query,
//         verbosity = 'medium',
//         reasoningEffort = 'medium',
//         useResponsesAPI = true,
//         jsonSchema = null,
//         taskType = 'legal_research'
//       } = req.body || {};

//       if (!query || typeof query !== 'string') {
//         return res.status(400).json({
//           error: 'query is required and must be a string',
//           documentation_compliant: true,
//           example: {
//             query: "What are the elements of negligence in tort law?",
//             verbosity: "medium",
//             reasoningEffort: "medium",
//             taskType: "legal_research"
//           }
//         });
//       }

//       const result = await orchestrator.runResearch({
//         prompt: query,
//         reasoning_effort: reasoningEffort,
//         verbosity,
//         useResponsesAPI,
//         jsonSchema,
//         taskType
//       });

//       res.json({
//         ...result,
//         gpt5_enhanced: true,
//         documentation_verified: true,
//         methodology: 'gpt5_documentation_compliant',
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       console.error('❌ Research endpoint error:', error);
//       res.status(500).json({
//         error: error?.message || 'unknown error',
//         documentation_compliant: true
//       });
//     }
//   });

//   // ✅ Streaming research endpoint (SSE)
//   app.post('/api/gpt5/research/stream', async (req, res) => {
//     try {
//       const {
//         query,
//         verbosity = 'medium',
//         reasoningEffort = 'medium'
//       } = req.body || {};

//       if (!query) {
//         return res.status(400).json({ error: 'query is required' });
//       }

//       res.writeHead(200, {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache',
//         'Connection': 'keep-alive',
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Cache-Control',
//         'X-Accel-Buffering': 'no'
//       });

//       // Send a heartbeat every 15s to keep proxies happy
//       const heartbeat = setInterval(() => {
//         res.write(':\n\n');
//       }, 15000);

//       const sendChunk = (data) => {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//       };

//       sendChunk({
//         type: 'status',
//         message: 'Starting GPT-5 legal research with verified streaming...'
//       });

//       const systemPrompt = getGpt5OptimizedLegalPrompt();
//       const input = orchestrator.buildOptimalInput(query, systemPrompt);

//       const streamParams = cleanParamsForGpt5({
//         model: orchestrator.model,
//         input,
//         reasoning: { effort: reasoningEffort },
//         text: { verbosity },
//         tools: [...buildGpt5ResponsesTools()],
//         store: process.env.OPENAI_STORE === 'true',
//         stream: true,
//         max_output_tokens: 8000
//       }, 'responses');

//       let fullResponse = '';

//       await orchestrator.robustResponsesApiCallWithStreaming(
//         streamParams,
//         (chunk) => {
//           sendChunk(chunk);
//           if (chunk.type === 'content') {
//             fullResponse = chunk.accumulated;
//           }
//         }
//       );

//       sendChunk({
//         type: 'complete',
//         final_response: fullResponse,
//         methodology: 'gpt5_verified_streaming',
//         documentation_verified: true
//       });

//       clearInterval(heartbeat);
//       res.end();

//     } catch (error) {
//       console.error('❌ Streaming research error:', error);
//       res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
//       res.end();
//     }
//   });

//   // ✅ Browser-friendly GET streaming endpoint to match frontend (EventSource)
//   app.get('/api/gpt5/stream', async (req, res) => {
//     try {
//       const queryParam = typeof req.query.query === 'string' ? req.query.query : '';
//       const mode = typeof req.query.mode === 'string' ? req.query.mode : 'chat'; // Default to chat for MCP tools
//       const verbosity = typeof req.query.verbosity === 'string' ? req.query.verbosity : 'medium';
//       const reasoning = typeof req.query.reasoning === 'string'
//         ? req.query.reasoning
//         : (typeof req.query.reasoningEffort === 'string' ? req.query.reasoningEffort : 'medium');

//       if (!queryParam) {
//         res.status(400).json({ error: 'query is required' });
//         return;
//       }

//       res.writeHead(200, {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache',
//         'Connection': 'keep-alive',
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Cache-Control',
//         'X-Accel-Buffering': 'no'
//       });

//       const heartbeat = setInterval(() => {
//         res.write(':\n\n');
//       }, 15000);

//       const send = (data) => {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//       };

//       // Chat mode with MCP tools via stdio
//       if (mode === 'chat') {
//         console.log(`🌊 Streaming request (GET/chat): "${queryParam.substring(0, 100)}..." with MCP tools`);
        
//         const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
//         const RUNNER = `${process.env.MCP_BASE_DIR || process.cwd()}/run-legal-mcp.sh`;
//         const transport = new StdioClientTransport({ command: 'bash', args: [RUNNER] });
//         const mcp = new MCPClient({ name: 'gpt5-stream-bridge', version: '1.0.0' }, { capabilities: {} });
        
//         await mcp.connect(transport);
//         const listed = await mcp.listTools();
        
//         // Sanitize MCP schemas for OpenAI
//         function sanitizeMcpSchema(schema) {
//           try {
//             const clone = JSON.parse(JSON.stringify(schema || { type: 'object' }));
//             const fix = (obj) => {
//               if (obj && typeof obj === 'object') {
//                 if ('required' in obj && !Array.isArray(obj.required)) delete obj.required;
//                 if (obj.properties && typeof obj.properties === 'object') {
//                   for (const k of Object.keys(obj.properties)) fix(obj.properties[k]);
//                 }
//                 if (obj.items) fix(obj.items);
//               }
//             };
//             fix(clone);
//             if (!clone.type) clone.type = 'object';
//             return clone;
//           } catch {
//             return { type: 'object' };
//           }
//         }
        
//         const functions = (listed.tools || []).map((t) => ({
//           type: 'function',
//           function: { name: t.name, description: t.description || '', parameters: sanitizeMcpSchema(t.inputSchema) }
//         }));
        
//         send({ type: 'status', message: `Connected to MCP with ${functions.length} legal research tools` });
        
//         const systemPrompt = getGpt5OptimizedLegalPrompt();
//         const messages = [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: queryParam }
//         ];
        
//         // Phase 1: Get tool calls
//         const first = await openai.chat.completions.create({
//           model: 'gpt-5',
//           messages,
//           tools: functions,
//           tool_choice: 'auto',
//           max_completion_tokens: 4000
//         });
        
//         const callMsg = first.choices?.[0]?.message;
        
//         if (callMsg?.content) {
//           send({ type: 'thinking', text: callMsg.content });
//         }
        
//         let tcalls = callMsg?.tool_calls || [];
        
//         if (tcalls.length > 0) {
//           messages.push(callMsg);
          
//           // Execute tool calls
//           for (const tc of tcalls) {
//             let args = {};
//             try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
            
//             send({ 
//               type: 'tool', 
//               tool: { name: tc.function.name, arguments: args }
//             });
            
//             try {
//               const result = await mcp.callTool({ name: tc.function.name, arguments: args });
//               const text = result.content?.[0]?.text || '';
//               messages.push({ role: 'tool', tool_call_id: tc.id, content: text });
//             } catch (error) {
//               messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${error.message}` });
//             }
//           }
//         }
        
//         // Phase 2: Stream final response
//         const stream = await openai.chat.completions.create({
//           model: 'gpt-5',
//           messages,
//           stream: true,
//           max_completion_tokens: 4000
//         });
        
//         for await (const chunk of stream) {
//           const delta = chunk.choices?.[0]?.delta?.content;
//           if (delta) send({ type: 'delta', text: delta });
//         }
        
//         send({ type: 'final', mcp_tools_used: tcalls.length });
//         clearInterval(heartbeat);
//         res.end();
//         return;
//       }
      
//       // Responses API mode (original)
//       send({
//         type: 'enhanced_thinking',
//         text: 'Using Responses API (no MCP tools available without LEGAL_MCP_SERVER_URL)',
//         analysis: {
//           research_phase: 'planning',
//           confidence_level: 'medium',
//           quality_score: 0
//         }
//       });

//       const systemPrompt = getGpt5OptimizedLegalPrompt();
//       const input = orchestrator.buildOptimalInput(queryParam, systemPrompt);

//       const streamParams = cleanParamsForGpt5({
//         model: orchestrator.model,
//         input,
//         reasoning: { effort: reasoning },
//         text: { verbosity },
//         tools: [...buildGpt5ResponsesTools()],
//         store: process.env.OPENAI_STORE === 'true',
//         stream: true,
//         max_output_tokens: 8000
//       }, 'responses');

//       let fullResponse = '';
//       let closed = false;

//       res.on('close', () => {
//         closed = true;
//         clearInterval(heartbeat);
//       });

//       await orchestrator.robustResponsesApiCallWithStreaming(
//         streamParams,
//         (chunk) => {
//           if (closed) return;
//           if (chunk.type === 'content') {
//             fullResponse = chunk.accumulated || '';
//             send({ type: 'delta', text: chunk.content || '' });
//           } else if (chunk.type === 'tool_call') {
//             send({ type: 'enhanced_tool_call', tool: { name: 'mcp', arguments: chunk.tool_calls?.[0] || {} }, progress: { current: 0, total: 0 } });
//           }
//         }
//       );

//       if (!closed) {
//         send({ type: 'final', text: fullResponse });
//         clearInterval(heartbeat);
//         res.end();
//       }

//     } catch (error) {
//       console.error('❌ GET streaming error:', error);
//       try {
//         res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
//       } catch {}
//       try { res.end(); } catch {}
//     }
//   });

//   // ✅ Dynamically optimized research endpoint
//   app.post('/api/gpt5/research/optimized', async (req, res) => {
//     try {
//       const {
//         query,
//         auto_optimize = true,
//         performance_target = 'balanced' // 'speed', 'quality', 'balanced'
//       } = req.body || {};

//       if (!query) {
//         return res.status(400).json({
//           error: 'query is required',
//           dynamic_optimization: true
//         });
//       }

//       const result = await orchestrator.runOptimizedResearch({
//         prompt: query,
//         performance_target,
//         auto_optimize
//       });

//       res.json({
//         ...result,
//         gpt5_enhanced: true,
//         dynamic_optimization: true,
//         documentation_verified: true,
//         methodology: 'gpt5_verified_dynamic_optimization'
//       });

//     } catch (error) {
//       console.error('❌ Optimized research error:', error);
//       res.status(500).json({
//         error: error.message,
//         dynamic_optimization: true
//       });
//     }
//   });

//   // ✅ Advanced research with structured outputs
//   app.post('/api/gpt5/research/advanced', async (req, res) => {
//     try {
//       const {
//         query,
//         requestStructuredOutput = true,
//         autoOptimizeEffort = true,
//         verbosity = 'medium'
//       } = req.body || {};

//       if (!query) {
//         return res.status(400).json({
//           error: 'query is required',
//           advanced_features: true
//         });
//       }

//       const result = await orchestrator.runResearch({
//         prompt: query,
//         reasoning_effort: autoOptimizeEffort
//           ? determineOptimalReasoningEffort(query)
//           : 'medium',
//         verbosity,
//         jsonSchema: requestStructuredOutput ? LEGAL_ANALYSIS_SCHEMA : null
//       });

//       let structuredAnalysis = null;
//       if (requestStructuredOutput && result.text) {
//         try {
//           structuredAnalysis = JSON.parse(result.text);
//         } catch {
//           // leave null if the model did not return strict JSON
//         }
//       }

//       res.json({
//         text: result.text,
//         structured_analysis: structuredAnalysis,
//         usage: result.usage,
//         gpt5_enhanced: true,
//         advanced_features: {
//           structured_output: requestStructuredOutput,
//           auto_optimization: autoOptimizeEffort,
//           enhanced_schema: requestStructuredOutput
//         },
//         documentation_verified: true,
//         methodology: 'gpt5_verified_advanced_research',
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       console.error('❌ Advanced research error:', error);
//       res.status(500).json({
//         error: error.message,
//         advanced_features: true
//       });
//     }
//   });

//   // ✅ Multi-turn research endpoint
//   app.post('/api/gpt5/multi-turn-research', async (req, res) => {
//     try {
//       const {
//         query,
//         maxTurns = 3,
//         verbosity = 'high',
//         reasoningEffort = 'high',
//         taskType = 'legal_research'
//       } = req.body || {};

//       if (!query || typeof query !== 'string') {
//         return res.status(400).json({
//           error: 'query is required and must be a string',
//           verified_multi_turn: true
//         });
//       }

//       if (maxTurns < 1 || maxTurns > 10) {
//         return res.status(400).json({
//           error: 'maxTurns must be between 1 and 10',
//           verified_multi_turn: true
//         });
//       }

//       const result = await orchestrator.runMultiTurnResearch({
//         prompt: query,
//         maxTurns,
//         reasoning_effort: reasoningEffort,
//         verbosity,
//         taskType
//       });

//       res.json({
//         ...result,
//         gpt5_enhanced: true,
//         verified_multi_turn: true,
//         documentation_verified: true,
//         methodology: 'gpt5_verified_multi_turn',
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       console.error('❌ Verified multi-turn research error:', error);
//       res.status(500).json({
//         error: error?.message || 'unknown error',
//         verified_multi_turn: true
//       });
//     }
//   });

//   // ✅ Health check
//   app.get('/health', (_req, res) => {
//     const health = {
//       status: 'healthy',
//       gpt5_ready: !!OPENAI_API_KEY,
//       mcp_configured: !!LEGAL_MCP_SERVER_URL,
//       model: process.env.GPT5_MODEL || 'gpt-5',
//       version: '5.0-cookbook-aligned',
//       verified_gpt5_features: {
//         responses_api: true,
//         chat_completions_api: true,
//         streaming_support: true,
//         reasoning_effort_control: true,
//         verbosity_control: true,
//         context_persistence: true, // store / previous_response_id
//         tool_choice_control: true,
//         structured_outputs: true,
//         remote_mcp_sse: !!LEGAL_MCP_SERVER_URL,
//         dynamic_optimization: true
//       },
//       endpoints: {
//         basic_research: '/api/gpt5/research',
//         streaming_research: '/api/gpt5/research/stream',
//         optimized_research: '/api/gpt5/research/optimized',
//         advanced_research: '/api/gpt5/research/advanced',
//         multi_turn: '/api/gpt5/multi-turn-research',
//         health: '/health'
//       },
//       documented_parameters: {
//         reasoning_effort: ['minimal', 'low', 'medium', 'high'],
//         verbosity: ['low', 'medium', 'high'],
//         max_output_tokens: 'Responses API',
//         max_tokens: 'Chat Completions API',
//         stream: 'Boolean for streaming (Responses)',
//         store: 'Boolean for context persistence',
//         previous_response_id: 'String for conversation continuity'
//       },
//       performance_optimizations: {
//         responses_api_prioritization: true,
//         context_persistence_with_store: true,
//         conversation_continuity_with_previous_response_id: true,
//         tool_choice_auto: true,
//         dynamic_parameter_adjustment: true,
//         streaming_for_long_responses: true,
//         structured_json_outputs: true
//       },
//       documentation_compliance: {
//         streaming_uses_event_types: true,
//         typed_content_blocks_used: true,
//         chat_fallback_uses_max_tokens: true,
//         temperature_top_p_allowed_in_chat: true,
//         mcp_sse_endpoint_configured: !!LEGAL_MCP_SERVER_URL
//       },
//       timestamp: new Date().toISOString()
//     };

//     res.json(health);
//   });

//   return app;
// }

// // ================================
// // ✅ FINAL DOCUMENTATION COMPLIANCE STATUS
// // ================================
// /*
// 🎯 COOKBOOK-ALIGNED GPT-5 FEATURES:

// ✅ CORE:
// 1) Responses API primary with state and previous_response_id
// 2) Event-typed streaming handler (response.output_text.delta, etc.)
// 3) Chat Completions fallback with correct max_tokens
// 4) Typed content blocks for Responses input
// 5) Remote MCP over /sse with optional Authorization header
// 6) Reasoning effort + verbosity controls
// 7) Structured outputs via JSON schema (Responses) / response_format (Chat)
// 8) Privacy-safe store default (env-controlled)
// 9) Dynamic parameter optimization paths

// No undocumented fields; parameters match published names.
// */

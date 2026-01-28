import express from 'express';
import cors from 'cors';
import { Gpt5Orchestrator } from '../orchestrator/gpt5Orchestrator.js';
import { Gpt5Bridge } from '../orchestrator/gpt5Bridge.js';
import { getPool, ensureSchema } from '../db/postgres.js';
import { IterativePlanner } from '../orchestrator/iterativePlanner.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// Removed tool optimization - GPT-5 should handle this itself

// Express server exposing endpoints for frontend to use GPT-5 + MCP.
// August 15, 2025: Implements streaming SSE and non-streamed structured output.

// Legal context descriptions for tools (no regex needed)
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
    'lookup_citation': 'Verifying citations'
  };
  return contexts[toolName] || `Executing ${toolName}`;
}

// Categorize tools by legal area (no regex, just mapping)
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
    'search_fda_510k': 'Product Safety'
  };
  return categories[toolName] || 'General';
}

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

  // POST /api/gpt5/research — non-streaming, optional JSON schema response
  app.post('/api/gpt5/research', async (req, res) => {
    try {
      const { query, jsonSchema } = req.body || {};
      if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query is required' });

      const mode = String(req.query.mode || 'responses');
      if (mode === 'chat') {
        // Fallback path via Chat Completions + MCP bridge (no MCP server_url). Useful if Responses MCP is unavailable.
        const bridge = new Gpt5Bridge({ apiKey: process.env.OPENAI_API_KEY, runnerPath: RUNNER, model: process.env.GPT5_MODEL || 'gpt-5' });
        const result = await bridge.runResearch(query);
        return res.json(result);
      }

      await ensureSchema();
      const pool = getPool();
      let runId = null;
      if (pool) {
        const r = await pool.query('insert into runs(model, query) values ($1,$2) returning id', [process.env.GPT5_MODEL || 'gpt-5', query]);
        runId = r.rows[0].id;
      }

      const responseFormat = jsonSchema ? { type: 'json_schema', json_schema: { name: 'legal_memo', schema: jsonSchema, strict: true } } : null;

      const result = await orchestrator.runResearch({
        prompt: query,
        reasoningEffort: 'medium',
        verbosity: 'medium',
        responseFormat
      });

      if (pool && runId) {
        await pool.query('update runs set final_text=$1, status=$2 where id=$3', [result.text || '', 'completed', runId]);
      }

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e?.message || 'unknown error' });
    }
  });

  // GET /api/gpt5/stream?query=... — Server-Sent Events streaming
  app.get('/api/gpt5/stream', async (req, res) => {
    const query = String(req.query.query || '');
    if (!query) return res.status(400).end('query required');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      // Chat-bridge streaming mode avoids Responses MCP server_url issues
      if (String(req.query.mode || '') === 'chat') {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const transport = new StdioClientTransport({ command: 'bash', args: [RUNNER] });
        const mcp = new MCPClient({ name: 'gpt5-stream-bridge', version: '1.0.0' }, { capabilities: {} });
        await mcp.connect(transport);
        const listed = await mcp.listTools();
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
          function: { name: t.name, description: t.description || '', parameters: sanitizeMcpSchema(t.inputSchema) }
        }));

        // Phase 1: get tool calls (non-streamed) with reasoning
        const systemPrompt = `You are an expert legal research assistant with access to 60+ tools across multiple legal databases.

CRITICAL SEARCH EFFICIENCY RULES:
1. NEVER search for "chemical" and "chemicals" separately - use ONE search with party_name: "chemical*" or case_name: "chemical"
2. When searching multiple PA courts, use the SAME search query for each court
3. Maximum 3 search_dockets calls for PA courts (paeb, pamb, pawb) - one per court
4. COMBINE similar terms: Instead of separate searches, use broader terms that catch variations

ANALYZE the query and identify ALL legal research areas:
- Bankruptcy: Chapter 11, debtor in possession, DIP financing
- Intellectual Property: patents, IP retention, licensing
- Corporate/Securities: SEC filings, 8-K for DIP financing
- Environmental: EPA, chemical waste liability

Based on your analysis, use tools from EACH identified category:
- "intellectual property" or "IP retention" → MUST use search_patents or search_uspto  
- "DIP financing" or "debtor in possession" → MUST use search_sec_filings for 8-K filings
- "environmental" issues → MUST use search_epa_facilities
- Multiple topics → MUST use tools from multiple categories

EFFICIENCY PRINCIPLES:
- Combine related search terms using OR operators instead of separate searches
- Use 4-8 tool calls for comprehensive research (not just 3 search_dockets)
- Each major topic in the query requires its own tool category

REQUIRED TOOL COMBINATIONS by topic:
- Bankruptcy research: search_dockets + get_case_details + search_opinions
- Corporate/DIP: search_sec_filings + get_sec_company_facts  
- IP/patents: search_patents + search_ptab_proceedings
- Environmental: search_epa_facilities + search_federal_register

EXAMPLE: For "chemical bankruptcy with IP retention and DIP financing":
1. search_dockets (3 PA courts with combined terms)
2. search_patents (for IP portfolio)
3. search_sec_filings (for DIP/8-K filings)
4. get_case_details (for specific cases found)

Never use only one tool type when the query explicitly mentions multiple topics.`;

        const messages = [ 
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query } 
        ];
        const first = await openai.chat.completions.create({ 
          model: process.env.GPT5_MODEL || 'gpt-5', 
          messages, 
          tools: functions, 
          tool_choice: 'auto',
          max_completion_tokens: 4000  // Limit response to prevent excessive tool calls
        });
        const callMsg = first.choices?.[0]?.message;
        
        // Check if the model provided reasoning/thinking before tool calls
        if (callMsg?.content && !callMsg?.tool_calls) {
          // Model is explaining its thinking
          res.write(`data: ${JSON.stringify({ 
            type: 'thinking', 
            text: callMsg.content 
          })}\n\n`);
        }
        
        let tcalls = callMsg?.tool_calls || [];
        
        // Log if excessive tool calls
        if (tcalls.length > 5) {
          console.warn(`GPT-5 made ${tcalls.length} tool calls - this indicates prompt issues`);
          // Still allow them through - GPT-5 should learn from the prompt
        }
        
        if (tcalls.length > 0) {
          messages.push(callMsg);
          
          // Process all tool calls in parallel
          const toolPromises = tcalls.map(async (tc, index) => {
            let args = {};
            try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
            if (args && typeof args === 'object') {
              // Cap limit to 15 for all search operations
              if (tc.function.name.startsWith('search_') || tc.function.name.includes('list')) {
                if ('limit' in args) {
                  args.limit = Math.min(args.limit, 15);
                } else {
                  args.limit = 15;
                }
                if ('page_size' in args) {
                  args.page_size = Math.min(args.page_size, 15);
                }
              }
            }
            
            // Send tool notification with legal context
            const legalContext = getLegalContext(tc.function.name);
            res.write(`data: ${JSON.stringify({ 
              type: 'tool', 
              tool: { name: tc.function.name, arguments: args },
              context: legalContext,
              progress: {
                current: index + 1,
                total: tcalls.length,
                toolType: getToolCategory(tc.function.name)
              }
            })}\n\n`);
            
            // Execute tool call with timeout
            try {
              const result = await Promise.race([
                mcp.callTool({ name: tc.function.name, arguments: args }),
                new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout tools/call ${tc.function.name}`)), 45000))
              ]);
              const text = result.content?.[0]?.text || '';
              return { id: tc.id, content: text, success: true };
            } catch (error) {
              console.error(`Tool call failed: ${tc.function.name}`, error.message);
              return { id: tc.id, content: `Error: ${error.message}`, success: false };
            }
          });
          
          // Wait for all tool calls to complete
          const results = await Promise.all(toolPromises);
          
          // Add results to messages in original order
          for (const result of results) {
            messages.push({ role: 'tool', tool_call_id: result.id, content: result.content });
          }
        }

        // Phase 2: stream final synthesis
        const stream = await openai.chat.completions.create({ model: process.env.GPT5_MODEL || 'gpt-5', messages, tools: functions, tool_choice: 'none', stream: true });
        for await (const part of stream) {
          const delta = part.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'final' })}\n\n`);
        return res.end();
      }

      // Default: Responses MCP streaming
      await ensureSchema();
      const pool = getPool();
      let runId = null;
      if (pool) {
        const r = await pool.query('insert into runs(model, query) values ($1,$2) returning id', [process.env.GPT5_MODEL || 'gpt-5', query]);
        runId = r.rows[0].id;
      }

      let buffered = '';
      const toolCalls = [];
      await orchestrator.streamResearch({
        prompt: query,
        reasoningEffort: 'medium',
        verbosity: 'medium',
        onToolCall: async (tc) => {
          toolCalls.push(tc);
          if (pool && runId) await pool.query('insert into tool_calls(run_id, tool_name, args) values ($1,$2,$3)', [runId, tc.name, tc.arguments || {}]);
          res.write(`data: ${JSON.stringify({ type: 'tool', tool: tc })}\n\n`);
        },
        onContent: (delta) => {
          buffered += delta;
          res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
        }
      }).then(async ({ text }) => {
        if (pool && runId) {
          await pool.query('update runs set final_text=$1, status=$2 where id=$3', [text || buffered || '', 'completed', runId]);
        }
        res.write(`data: ${JSON.stringify({ type: 'final' })}\n\n`);
        res.end();
      });
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: e?.message || 'unknown error' })}\n\n`);
      res.end();
    }
  });

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // POST /api/gpt5/iterative — plan→execute→accumulate evidence, then produce memo JSON
  app.post('/api/gpt5/iterative', async (req, res) => {
    try {
      const { query } = req.body || {};
      if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query is required' });

      await ensureSchema();
      const pool = getPool();
      let runId = null;
      if (pool) {
        const r = await pool.query('insert into runs(model, query) values ($1,$2) returning id', [process.env.GPT5_MODEL || 'gpt-5', query]);
        runId = r.rows[0].id;
      }

      const planner = new IterativePlanner({ apiKey: process.env.OPENAI_API_KEY, serverUrl, model: process.env.GPT5_MODEL || 'gpt-5', allowlist: ['search_cases','search_state_statute','search_opinions','search_sec_filings','search_federal_register','get_case_details'] });
      const state = await planner.run(query, { maxIterations: 6, targetDocs: 10 });

      // Persist evidence
      if (pool && runId) {
        for (const doc of state.found) {
          await pool.query('insert into evidence(run_id, uri, source, snippet, hash) values ($1,$2,$3,$4,$5)', [runId, doc.url || '', doc.source || '', doc.snippet || '', null]);
        }
      }

      // Load memo schema
      const schemaPath = `${process.cwd()}/src/schemas/BankruptcyResearchMemo.json`;
      const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

      // Ask for structured memo
      const memo = await orchestrator.runResearch({
        prompt: `Using the collected evidence (URLs and snippets available to the tool layer), draft a BankruptcyResearchMemo for the query: ${query}. Include jurisdictions, issues, authorities, analysis, recommendations, and citations.`,
        responseFormat: { type: 'json_schema', json_schema: { name: 'BankruptcyResearchMemo', schema, strict: true } },
        reasoningEffort: 'high',
        verbosity: 'high'
      });

      if (pool && runId) {
        await pool.query('update runs set memo_json=$1, final_text=$2, status=$3 where id=$4', [memo.text ? JSON.parse(memo.text) : null, memo.text || '', 'completed', runId]);
      }

      res.json({ runId, evidenceCount: state.found.length, memo: memo.text ? JSON.parse(memo.text) : null });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'unknown error' });
    }
  });

  return app;
}



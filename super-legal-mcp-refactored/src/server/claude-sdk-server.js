/**
 * Claude Agent SDK Migration - Server with Tool Runner (Phase 1)
 * Provides health check, SDK test endpoint, and /api/research via Tool Runner.
 * Isolated to the SDK migration environment; no production-impacting changes.
 */

// Set Claude Code max output tokens before any SDK imports
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = '64000';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { buildSdkTools } from '../utils/sdkToolAdapter.js';
import { query as agentQuery } from '@anthropic-ai/claude-agent-sdk';
import { buildAgentSdkTools, createLegalMcpServer } from '../utils/agentSdkToolAdapter.js';
import { createSdkStreamHandler } from '../utils/sdkStreamHandler.js';
import { featureFlags } from '../config/featureFlags.js';
import { getLegalSubagents, SUBAGENT_SYSTEM_PROMPT_SECTION } from '../config/legalSubagents.js';
import { sdkHooksConfig } from '../hooks/sdkHooks.js';
import {
  STRUCTURED_OUTPUT_ENABLED
} from '../config/structuredOutputSchemas.js';
import {
  safeParseStructured,
  recordStructuredOutputMetrics
} from '../utils/structuredOutputValidator.js';
import { createToolImplementations } from '../tools/toolImplementations.js';
import { rateLimiterConfigs } from '../config/apiConfig.js';
import { buildSkillsContainer, buildBetaHeader, buildContextManagement } from '../utils/skillsRequestBuilder.js';
import {
  recordSkillInvocation,
  recordSkillFailure
} from '../utils/skillsMetrics.js';
import { getCustomSkills } from '../skills/skillsRegistry.js';
import { buildCachedSystemPrompt, buildCachedTools } from '../utils/promptCaching.js';
import { enforceSkillQuota } from '../middleware/skillsQuotaEnforcer.js';
import { createSkillsMetricsRouter } from './skillsMetricsDashboard.js';
import { createBatch, getBatchStatus, getBatchResults } from '../utils/messageBatches.js';
import {
  initSdkMetrics,
  metricsMiddleware,
  metricsEndpoint,
  recordTokens,
  recordStreamDuration,
  recordToolDuration,
  incrementToolInvocation,
  recordError,
  recordStructuredOutputAttempt,
  recordStructuredOutputSuccess,
  recordStructuredOutputFailure
} from '../utils/sdkMetrics.js';
import {
  correlationIdMiddleware,
  requestLoggerMiddleware,
  logError
} from '../utils/sdkLogger.js';
import { startRequestSpan, endSpan, withToolSpan } from '../utils/sdkTracing.js';
import { toErrorResponse, mapExceptionToCode } from '../utils/sdkErrorTaxonomy.js';
import { filterToolsByPermissions } from '../config/toolPermissions.js';
import { inputValidationMiddleware } from '../middleware/inputValidation.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { CircuitBreaker } from '../utils/circuitBreaker.js';

// Import hybrid/web clients for tool implementations
import { SECHybridClient } from '../api-clients/SECHybridClient.js';
import { FDAWebSearchClient } from '../api-clients/FDAWebSearchClient.js';
import { FDAHybridClient } from '../api-clients/FDAHybridClient.js';
import { EPAHybridClient } from '../api-clients/EPAHybridClient.js';
import { CourtListenerHybridClient } from '../api-clients/CourtListenerHybridClient.js';
import { GovInfoHybridClient } from '../api-clients/GovInfoHybridClient.js';
import { FederalRegisterHybridClient } from '../api-clients/FederalRegisterHybridClient.js';
import { CPSCWebSearchClient } from '../api-clients/CPSCWebSearchClient.js';
import { NHTSAWebSearchClient } from '../api-clients/NHTSAWebSearchClient.js';
import { FTCWebSearchClient } from '../api-clients/FTCWebSearchClient.js';
import { PTABWebSearchClient } from '../api-clients/PTABWebSearchClient.js';
import { USPTOHybridClient } from '../api-clients/USPTOHybridClient.js';
import { StateCourtRulesWebSearchClient } from '../api-clients/StateCourtRulesWebSearchClient.js';
import { StateStatuteWebSearchClient } from '../api-clients/StateStatuteWebSearchClient.js';
import { FinancialDisclosureClient } from '../api-clients/FinancialDisclosureClient.js';
import { ComprehensiveAnalysisClient } from '../api-clients/ComprehensiveAnalysisClient.js';
import { ExaClient } from '../api-clients/ExaClient.js';
import { FilingDraftClient } from '../api-clients/FilingDraftClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (do not overwrite existing .env behavior)
dotenv.config({ path: path.join(__dirname, '../../.env') });

initSdkMetrics();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve test playground and static files
app.use('/test', express.static(path.join(__dirname, '../../test')));

// Serve generated reports for download
app.use('/reports', express.static(path.join(__dirname, '../../reports'), {
  setHeaders: (res, filepath) => {
    // Set content type for markdown files to allow proper download
    if (filepath.endsWith('.md')) {
      res.set('Content-Type', 'text/markdown; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    }
  }
}));
console.log('📄 Reports endpoint enabled at /reports');

app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(requestLoggerMiddleware);
app.use(inputValidationMiddleware);
app.use('/api', createSkillsMetricsRouter());

// Anthropic client initialization
const SDK_VERSION = Anthropic?.VERSION || '0.39.0';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    // Enable thinking + fine-grained streaming by default for migration testing
    'anthropic-beta': buildBetaHeader({
      includeSkills: featureFlags.SKILLS_ENABLED
    })
  }
});

const PORT = process.env.PORT || 3001;
const MODEL = process.env.SDK_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = Number(process.env.SDK_MAX_TOKENS || 64000);

// Auto-continuation configuration for incomplete outputs
const AUTO_CONTINUATION_CONFIG = {
  enabled: process.env.AUTO_CONTINUATION !== 'false', // Enabled by default
  maxAttempts: Number(process.env.AUTO_CONTINUATION_MAX_ATTEMPTS || 14),
  prompt: `PLEASE REVIEW THE EXISTING WORK, REVIEW THE RESEARCH-PLAN.MD, THEN FINISH THE COMPLETE GENERATION ENSURING GRANULAR, THOROUGH OUTPUT FULFILLING EXPECTATIONS OF RESEARCH-PLAN.MD. IF RESEARCH-PLAN.MD IS ENTIRELY COMPLETE ALONG WITH MEMORANDUM.MD, THE PROCESS IS COMPLETE.

IMPORTANT: Do NOT recap or summarize what was already written. Simply continue from the exact point where output stopped. Do NOT add preamble like "Continuing from where I left off..." - just continue the content seamlessly.

OUTPUT TARGETS (GUIDELINES, NOT HARD LIMITS):
- 400 footnotes is a TARGET - exceeding is acceptable if content requires it
- 100,000 words is a TARGET - exceeding is acceptable for thoroughness
- COMPLETENESS > arbitrary limits - never skip content to meet word counts

MANDATORY DELIVERABLES - NEVER SKIP REGARDLESS OF LENGTH:
- Executive Summary (Phase 8/G1.2) - ALWAYS generate at full quality
- Citation Validation (Phase 9/G1.3) - ALWAYS complete
- Final Assembly (Phase 10/A1.1) - ALWAYS complete
- QA Assessment (Phase 11/A1.2) - ALWAYS generate

PROHIBITED THINKING PATTERNS:
- "Skip Phase X because limits exceeded" - WRONG
- "Omit executive summary to save words" - WRONG
- "Move to completion without [mandatory phase]" - WRONG
- "Document is too long, skip remaining deliverables" - WRONG

CORRECT APPROACH:
1. Generate ALL mandatory deliverables at full quality
2. Exceeding word/footnote targets is ACCEPTABLE
3. Completeness takes priority over staying within arbitrary limits
4. Never sacrifice required deliverables for word count targets`
};

// Load legal system prompt from file (same as claude-server-v2.js)
// Conditionally appends subagent delegation instructions when SUBAGENTS_ENABLED=true
function getLegalSystemPrompt() {
  try {
    const promptPath = process.env.LEGAL_PROMPT_FILE ||
                       path.join(__dirname, '../../prompts/active.md');
    let basePrompt;

    if (fs.existsSync(promptPath)) {
      console.log(`✅ Loaded legal system prompt from ${promptPath}`);
      basePrompt = fs.readFileSync(promptPath, 'utf8');
    } else {
      console.warn(`⚠️ Prompt file not found at ${promptPath}, using fallback`);
      basePrompt = 'You are a legal research assistant with access to SEC, FDA, EPA, USPTO, CourtListener, and other regulatory databases.';
    }

    // Conditionally append subagent delegation instructions
    if (featureFlags.SUBAGENTS_ENABLED) {
      console.log('✅ Appending subagent delegation instructions to system prompt');
      return basePrompt + '\n\n' + SUBAGENT_SYSTEM_PROMPT_SECTION;
    }

    return basePrompt;
  } catch (error) {
    console.error('Error loading prompt:', error.message);
    return 'You are a legal research assistant with access to SEC, FDA, EPA, USPTO, CourtListener, and other regulatory databases.';
  }
}

const SYSTEM_PROMPT = process.env.SDK_SYSTEM_PROMPT || getLegalSystemPrompt();
const cachedSystemPrompt = buildCachedSystemPrompt(SYSTEM_PROMPT);

// Inject current date into system prompt (model can't execute JS, needs actual values)
function getSystemPromptWithDate() {
  const today = new Date().toISOString().split('T')[0];
  const unix = Math.floor(Date.now() / 1000);
  const dateBlock = {
    type: 'text',
    text: `TODAY'S DATE: ${today} | UNIX TIMESTAMP: ${unix}\nSession directory format: reports/${today}-${unix}/\n\n`
  };
  return cachedSystemPrompt ? [dateBlock, ...cachedSystemPrompt] : [dateBlock];
}

const globalRateLimiter = new RateLimiter({
  rpm: Number(process.env.SDK_RPM || 300),
  tpm: Number(process.env.SDK_TPM || 200000)
});
const anthropicBreaker = new CircuitBreaker({
  threshold: Number(process.env.SDK_BREAKER_THRESHOLD || 3),
  timeoutMs: Number(process.env.SDK_BREAKER_TIMEOUT_MS || 60000)
});

// Build rate limiters for API clients
function createRateLimiters() {
  const limiters = new Map();
  for (const [apiType, config] of Object.entries(rateLimiterConfigs)) {
    limiters.set(apiType, { ...config, requests: [] });
  }
  return limiters;
}

// Lazy initialization of API clients (expensive, done once)
let cachedClients = null;
function getClients() {
  if (cachedClients) return cachedClients;
  const rateLimiters = createRateLimiters();
  const exaKey = process.env.EXA_API_KEY;

  cachedClients = {
    courtListenerWeb: new CourtListenerHybridClient(rateLimiters.get('courtlistener'), exaKey),
    financialDisclosure: new FinancialDisclosureClient(rateLimiters.get('courtlistener')),
    federalRegisterWeb: new FederalRegisterHybridClient(rateLimiters.get('federal_register'), exaKey),
    usptoWeb: new USPTOHybridClient(rateLimiters.get('uspto_patents'), exaKey),
    govInfo: new GovInfoHybridClient(rateLimiters.get('govinfo'), exaKey),
    exa: new ExaClient(exaKey, rateLimiters.get('exa')),
    comprehensiveAnalysis: new ComprehensiveAnalysisClient(exaKey, rateLimiters.get('exa')),
    ptabWebSearch: new PTABWebSearchClient(rateLimiters.get('exa'), exaKey),
    ftcWeb: new FTCWebSearchClient(rateLimiters.get('exa'), exaKey),
    epaWeb: new EPAHybridClient(rateLimiters.get('epa_echo'), exaKey),
    epa: new EPAHybridClient(rateLimiters.get('epa_echo'), exaKey),
    fdaHybrid: new FDAHybridClient(rateLimiters.get('fda_openfda'), exaKey),
    fdaWeb: new FDAWebSearchClient(rateLimiters.get('exa'), exaKey),
    cpsc: new CPSCWebSearchClient(rateLimiters.get('exa'), exaKey),
    nhtsaWeb: new NHTSAWebSearchClient(rateLimiters.get('exa'), exaKey),
    filingDraft: new FilingDraftClient(),
    stateCourtRules: new StateCourtRulesWebSearchClient(rateLimiters.get('exa'), exaKey),
    stateStatute: new StateStatuteWebSearchClient(rateLimiters.get('exa'), exaKey),
    secWeb: new SECHybridClient(rateLimiters.get('sec'), exaKey)
  };
  console.log(`✅ SDK server initialized ${Object.keys(cachedClients).length} API clients`);
  return cachedClients;
}

// Lazy tool registry with real client bindings
let cachedSdkTools = null;
function getSdkTools() {
  if (cachedSdkTools) return cachedSdkTools;
  try {
    const clients = getClients();
    const toolImplementations = createToolImplementations(clients, null, null);
    cachedSdkTools = buildSdkTools(toolImplementations);
    console.log(`✅ SDK server built ${cachedSdkTools.length} tools with real handlers`);
  } catch (err) {
    console.warn('⚠️ Failed to build SDK tools, falling back to empty set:', err?.message || err);
    cachedSdkTools = [];
  }
  return cachedSdkTools;
}

// Agent SDK tool registry (multi-turn support)
let cachedAgentSdkMcp = null;
function getAgentSdkMcpServer() {
  if (cachedAgentSdkMcp) return cachedAgentSdkMcp;
  try {
    const clients = getClients();
    const toolImplementations = createToolImplementations(clients, null, null);
    const agentTools = buildAgentSdkTools(toolImplementations);
    cachedAgentSdkMcp = createLegalMcpServer(agentTools);
    console.log(`✅ Agent SDK MCP server created with ${agentTools.length} tools`);
  } catch (err) {
    console.warn('⚠️ Failed to build Agent SDK MCP server:', err?.message || err);
    cachedAgentSdkMcp = null;
  }
  return cachedAgentSdkMcp;
}

// Health check
app.get('/health', async (req, res) => {
  const now = new Date().toISOString();
  const build = {
    commit: process.env.BUILD_SHA || process.env.GIT_SHA || 'unknown',
    version: process.env.npm_package_version || 'unknown',
    timestamp: process.env.BUILD_TIMESTAMP || now
  };

  const flags = {
    SDK_TOOL_RUNNER: featureFlags.SDK_TOOL_RUNNER,
    CANARY_PCT: featureFlags.CANARY_PCT,
    STRUCTURED_OUTPUTS: featureFlags.STRUCTURED_OUTPUTS,
    SKILLS_ENABLED: featureFlags.SKILLS_ENABLED
  };

  const rateLimiterStatus = {
    rpm_remaining: globalRateLimiter?.requestBucket ?? null,
    tpm_remaining: globalRateLimiter?.tokenBucket ?? null
  };

  const breakerStatus = {
    state: anthropicBreaker?.state || 'unknown',
    failures: anthropicBreaker?.failures ?? null,
    threshold: anthropicBreaker?.failureThreshold ?? null
  };

  // Anthropic reachability probe is skipped in sandboxed/offline environments
  const anthropicStatus = process.env.ANTHROPIC_API_KEY ? 'not_checked' : 'missing_api_key';

  const healthy = breakerStatus.state !== 'OPEN';

  res.status(healthy ? 200 : 503).json({
    ok: healthy,
    status: healthy ? 'healthy' : 'degraded',
    environment: process.env.ENVIRONMENT || 'sdk-migration',
    sdk_version: SDK_VERSION,
    model: MODEL,
    timestamp: now,
    build,
    feature_flags: flags,
    dependencies: {
      anthropic_api: anthropicStatus,
      rate_limiter: rateLimiterStatus,
      circuit_breaker: breakerStatus
    }
  });
});

// Subagents endpoint - list available legal domain subagents
app.get('/api/subagents', (req, res) => {
  const subagents = getLegalSubagents();
  const summary = Object.entries(subagents).map(([name, def]) => ({
    name,
    description: def.description.split('\n')[0].replace('Use PROACTIVELY for:', '').trim(),
    model: def.model || 'inherit',
    toolCount: def.tools?.length || 'all',
    mcpTools: def.tools?.filter(t => t.startsWith('mcp__')).length || 0
  }));

  res.json({
    enabled: featureFlags.SUBAGENTS_ENABLED,
    count: summary.length,
    subagents: summary
  });
});

// List available reports
app.get('/api/reports', async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../../reports');
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => {
        const stat = fs.statSync(path.join(reportsDir, f));
        return {
          name: f,
          url: `/reports/${f}`,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({
      count: files.length,
      reports: files
    });
  } catch (error) {
    res.json({
      count: 0,
      reports: [],
      error: 'Reports directory not accessible'
    });
  }
});

// Metrics endpoint (Prometheus)
app.get('/metrics', metricsEndpoint);

// Basic SDK test endpoint
app.post('/api/sdk-test', async (req, res) => {
  const userMessage = req.body?.message || 'Hello from SDK migration environment!';

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: userMessage }]
    });

    res.json({
      success: true,
      response: response?.content?.[0]?.text || '',
      model: response?.model,
      usage: response?.usage,
      stop_reason: response?.stop_reason
    });
  } catch (error) {
    console.error('❌ SDK test error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// Message batches (stub/foundation)
app.post('/api/batches', async (req, res) => {
  if (!anthropic?.batches) {
    return res.status(501).json({ error: 'Message batches API not available in this SDK version' });
  }
  try {
    const requests = Array.isArray(req.body?.requests) ? req.body.requests : [];
    const batch = await createBatch(anthropic, requests);
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Batch creation failed' });
  }
});

app.get('/api/batches/:id', async (req, res) => {
  if (!anthropic?.batches) {
    return res.status(501).json({ error: 'Message batches API not available in this SDK version' });
  }
  try {
    const status = await getBatchStatus(anthropic, req.params.id);
    const results = status?.status === 'ended' ? await getBatchResults(anthropic, req.params.id) : null;
    res.json({ status, results });
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Batch status retrieval failed' });
  }
});

// SDK research endpoint
app.post('/api/research', async (req, res) => {
  const span = startRequestSpan('api.research', { path: '/api/research', model: MODEL });
  res.locals.model = MODEL;

  try {
    globalRateLimiter.acquire(Math.ceil(JSON.stringify(req.body || {}).length / 4));
  } catch (err) {
    const resp = toErrorResponse('RATE_LIMIT_ERROR', err.message, {}, req.requestId);
    recordError(resp.body.error.code, '/api/research');
    endSpan(span, { error: err });
    return res.status(resp.status).json(resp.body);
  }

  try {
    await anthropicBreaker.execute(async () => {});
  } catch (err) {
    const resp = toErrorResponse('CIRCUIT_BREAKER_OPEN', err.message, {}, req.requestId);
    recordError(resp.body.error.code, '/api/research');
    endSpan(span, { error: err });
    return res.status(resp.status).json(resp.body);
  }

  const messages = req.body?.messages || [
    { role: 'user', content: req.body?.query || 'Run legal research.' }
  ];

  const estimatedTokens = Math.ceil(JSON.stringify(messages).length / 4);
  const includeExtendedContext =
    featureFlags.EXTENDED_CONTEXT ||
    req.body?.extended_context === true ||
    estimatedTokens > 100000;

  const allTools = filterToolsByPermissions(getSdkTools(), '/api/research');
  const tools = buildCachedTools(allTools);
  const requestedTool = req.body?.schema_tool || req.body?.tool;
  const schema = featureFlags.STRUCTURED_OUTPUTS ? STRUCTURED_OUTPUT_ENABLED[requestedTool] : null;
  if (schema && requestedTool) recordStructuredOutputAttempt(requestedTool);
  const output_format = schema ? { type: 'json_schema', json_schema: schema } : undefined;

  // Build skills container with quota enforcement
  // NOTE: Custom skills disabled by default (SKILLS_ENABLED=false) because:
  // - Current implementation uses non-SDK-compliant JS format (not SKILL.md)
  // - Python code is no-op (just echoes {"status": "ok"})
  // - Subagents already handle all domain expertise
  // - Managed skills (pdf, xlsx, docx) work independently via managedSkillsConfig
  // Files preserved in /src/skills/customSkills/ for future SDK-compliant conversion.
  const customSkills = featureFlags.SKILLS_ENABLED ? getCustomSkills() : [];
  const userId = req.headers['x-user-id'] || req.body?.user_id || null;
  if (featureFlags.SKILLS_ENABLED && customSkills.length) {
    for (const skill of customSkills) {
      const quota = enforceSkillQuota({ userId, skillName: skill.name });
      if (!quota.allowed) {
        recordSkillFailure(skill.name);
        return res.status(429).json({
          error: 'skill_quota_exceeded',
          skill: skill.name,
          limits: quota.limits,
          counts: { hourly: quota.hourlyCount, daily: quota.dailyCount }
        });
      }
    }
  }
  const skills = featureFlags.SKILLS_ENABLED ? buildSkillsContainer(customSkills) : null;
  if (skills) {
    skills.forEach((skill) => {
      const skillId = skill.skill_id || skill.name;
      if (skillId) recordSkillInvocation(skillId);
    });
  }
  const betaHeader = buildBetaHeader({
    includeStructuredOutputs: Boolean(schema),
    includeSkills: Boolean(skills),
    includeExtendedContext
  });
  const tool_choice =
    req.body?.disable_parallel_tool_use === true
      ? { type: 'auto', disable_parallel_tool_use: true }
      : undefined;

  const handler = createSdkStreamHandler();
  const toolHandlers = Object.fromEntries(allTools.map((t) => [t.name, t.handler]));

  try {
    await anthropicBreaker.execute(async () => {
      const stream = await anthropic.beta.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages,
        tools,
        thinking: {
          type: 'enabled',
          budget_tokens: 4096
        },
        ...(output_format ? { output_format } : {}),
        system: getSystemPromptWithDate(),
        ...((betaHeader && betaHeader.length > 0) ? { betas: betaHeader.split(',').filter(Boolean) } : {}),
        ...(skills ? { container: { skills } } : {}),
        ...(tool_choice ? { tool_choice } : {}),
        context_management: buildContextManagement()
      });

      const start = Date.now();
      for await (const event of stream) {
        await handler.handle(event);
      }
      const streamDurationMs = Date.now() - start;
      recordStreamDuration({ path: '/api/research', model: MODEL, status: 'ok' }, streamDurationMs);

      const finalMessage = await stream.finalMessage();
      if (finalMessage?.usage) handler.handle({ type: 'message_stop', usage: finalMessage.usage, stop_reason: finalMessage.stop_reason });

      // Execute tools if needed
      if (finalMessage.stop_reason === 'tool_use') {
        for (const block of finalMessage.content) {
          if (block.type === 'tool_use') {
            const toolHandler = toolHandlers[block.name];
            if (toolHandler) {
              try {
                const result = await withToolSpan(block.name, () => toolHandler(block.input));
                incrementToolInvocation(block.name, 'ok');
                // Record tool result
                handler.handle({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  tool_name: block.name,
                  output: result
                });
              } catch (err) {
                incrementToolInvocation(block.name, 'error');
                handler.handle({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  tool_name: block.name,
                  output: { error: err?.message || 'Unknown tool error' },
                  is_error: true
                });
              }
            }
          }
        }
      }

      const result = handler.final();
      if (finalMessage?.model) result.model = finalMessage.model;
      if (schema && finalMessage?.content?.[0]?.text) {
        const parsed = safeParseStructured(finalMessage.content[0].text, schema, requestedTool || 'unknown');
        result.structured = parsed;
        if (parsed?.valid) recordStructuredOutputSuccess(requestedTool || 'unknown');
        else recordStructuredOutputFailure(requestedTool || 'unknown');
      }

      if (finalMessage?.usage) {
        recordTokens({
          model: MODEL,
          input: finalMessage.usage.input_tokens,
          output: finalMessage.usage.output_tokens,
          cached: finalMessage.usage.cache_read_input_tokens,
          cacheRead: finalMessage.usage.cache_read_input_tokens,
          cacheCreation: finalMessage.usage.cache_creation_input_tokens
        });
        res.locals.tokens = finalMessage.usage;
      }

      // Tool metrics
      if (Array.isArray(result.toolResults)) {
        result.toolResults.forEach((t) => {
          const status = t?.is_error ? 'error' : 'ok';
          incrementToolInvocation(t?.name || 'unknown', status);
          if (typeof t?.duration_ms === 'number') {
            recordToolDuration(t?.name || 'unknown', status, t.duration_ms);
          }
        });
      }

      res.locals.tools_called = Array.isArray(result.toolResults)
        ? result.toolResults.map((t) => t?.name).filter(Boolean)
        : undefined;

      res.json(result);
    });
    endSpan(span);
  } catch (error) {
    const code = mapExceptionToCode(error);
    const resp = toErrorResponse(code, error?.message || 'Unknown SDK research error', {}, req.requestId);
    recordError(resp.body.error.code, '/api/research');
    logError('sdk_research_error', { request_id: req.requestId, code: resp.body.error.code, message: resp.body.error.message });
    endSpan(span, { error });
    res.status(resp.status).json(resp.body);
  }
});

// SSE streaming endpoint - supports both Agent SDK (multi-turn) and legacy (single-turn)
// Accepts both GET (query params) and POST (body) for large prompt support
app.all('/api/stream', async (req, res) => {
  // Only allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const span = startRequestSpan('api.stream', { path: '/api/stream', model: MODEL });
  res.locals.model = MODEL;

  // Support both GET (query params) and POST (body) - POST allows larger prompts
  const userQuery = req.method === 'POST'
    ? String(req.body?.query || '')
    : String(req.query.query || '');
  const resumeSessionId = req.method === 'POST'
    ? (req.body?.sessionId || null)
    : (req.query.sessionId || null);

  if (!userQuery) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  if (resumeSessionId) {
    console.log(`🔄 [Session] Resuming session: ${resumeSessionId}`);
  }

  try {
    globalRateLimiter.acquire(Math.ceil(userQuery.length / 4));
  } catch (err) {
    const resp = toErrorResponse('RATE_LIMIT_ERROR', err.message, {}, req.requestId);
    recordError(resp.body.error.code, '/api/stream');
    endSpan(span, { error: err });
    return res.status(resp.status).json(resp.body);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const heartbeat = setInterval(() => res.write(':\n\n'), 15000);

  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    clearInterval(heartbeat);
    try { res.end(); } catch {}
  };

  // Only listen to response close, NOT request close
  // For POST requests, req 'close' fires after body is consumed (before streaming completes)
  // res 'close' correctly fires when client disconnects
  res.on('close', end);

  send({
    type: 'system_info',
    message: featureFlags.USE_AGENT_SDK ? 'Claude Agent SDK (Multi-Turn)' : 'Claude SDK (Single-Turn)',
    model: MODEL,
    timestamp: new Date().toISOString()
  });

  const streamStart = Date.now();

  // Use Agent SDK for multi-turn execution with auto-continuation support
  if (featureFlags.USE_AGENT_SDK) {
    // Patterns that indicate truncated output needing continuation
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

    // Patterns that indicate COMPLETED output (should NOT continue)
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

    try {
      const mcpServer = getAgentSdkMcpServer();
      if (!mcpServer) {
        throw new Error('Agent SDK MCP server not initialized');
      }

      let continuationAttempt = 0;
      let currentSessionId = resumeSessionId || null;
      let currentPrompt = userQuery;
      let shouldContinue = true;
      let accumulatedText = '';
      let totalUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
      let totalDurationMs = 0;
      let totalTurns = 0;
      let lastSessionId = null;
      let lastStopReason = null;  // Track stop_reason from assistant messages for truncation detection

      while (shouldContinue) {
        let turnText = '';
        let currentBlockType = null;
        let streamCompleted = false;
        let resultMessage = null;
        lastStopReason = null;  // Reset for each turn

        console.log(`🚀 [AgentSDK] ${continuationAttempt > 0 ? `Continuation ${continuationAttempt}` : 'Starting query'} (prompt: ${currentPrompt.length} chars, session: ${currentSessionId || 'new'})`);

        for await (const message of agentQuery({
          prompt: currentPrompt,
          options: {
            model: MODEL,
            maxTurns: Number(process.env.SDK_MAX_TURNS || 500),
            maxThinkingTokens: 4096,
            systemPrompt: SYSTEM_PROMPT,
            permissionMode: 'bypassPermissions',
            allowDangerouslySkipPermissions: true,
            includePartialMessages: true,
            betas: [
              'context-1m-2025-08-07',
              'interleaved-thinking-2025-05-14',
              'effort-2025-11-24'  // Opus 4.5 effort parameter for memo-executive-summary-writer
            ],
            ...(currentSessionId ? { resume: currentSessionId } : {}),
            mcpServers: {
              'super-legal-tools': mcpServer
            },
            ...(featureFlags.SUBAGENTS_ENABLED ? { agents: getLegalSubagents() } : {}),
            hooks: sdkHooksConfig
          }
        })) {
          // Debug logging (reduced verbosity for content_block_delta)
          if (message.type !== 'stream_event' ||
              (message.event?.type !== 'content_block_delta')) {
            console.log(`📨 [AgentSDK] Message type: ${message.type}${message.subtype ? ` (${message.subtype})` : ''}`);
          }

          switch (message.type) {
            case 'system':
              if (message.subtype === 'init') {
                lastSessionId = message.session_id;
                if (continuationAttempt === 0) {
                  send({
                    type: 'system_init',
                    session_id: message.session_id,
                    tools: message.tools?.length || 0,
                    model: message.model
                  });
                }
              }
              break;

            case 'stream_event':
              if (message.event?.type === 'content_block_start') {
                const block = message.event.content_block;
                currentBlockType = block?.type;
                if (block?.type === 'tool_use') {
                  send({ type: 'tool_call', phase: 'tool_start', tool: { name: block.name, id: block.id } });
                  console.log(`📦 [Stream] Tool started: ${block.name}`);
                } else if (block?.type === 'thinking') {
                  send({ type: 'thinking_start' });
                  console.log('🧠 [Stream] Thinking started');
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
              } else if (message.event?.type === 'content_block_stop') {
                if (currentBlockType === 'thinking') {
                  send({ type: 'thinking_complete' });
                  console.log('🧠 [Stream] Thinking complete');
                }
                currentBlockType = null;
              } else if (message.event?.type === 'message_delta') {
                // Capture stop_reason from message_delta event for truncation detection
                if (message.event.delta?.stop_reason) {
                  lastStopReason = message.event.delta.stop_reason;
                  console.log(`[AgentSDK Stream] message_delta stop_reason: ${lastStopReason}`);
                }
              }
              break;

            case 'assistant':
              totalTurns++;
              // Capture stop_reason from assistant message for truncation detection
              if (message.message?.stop_reason) {
                lastStopReason = message.message.stop_reason;
                console.log(`[AgentSDK] Assistant message stop_reason: ${lastStopReason}`);
              }
              for (const block of message.message?.content || []) {
                if (block.type === 'text') {
                  send({ type: 'assistant_text', text: block.text });
                  // Also accumulate from assistant blocks (may contain text not in deltas)
                  if (!turnText.includes(block.text)) {
                    turnText += block.text;
                  }
                } else if (block.type === 'tool_use') {
                  send({ type: 'tool_call', phase: 'tool_use', tool: { name: block.name, id: block.id, input: block.input } });
                  console.log(`📦 [Stream] Tool use: ${block.name}`);
                  incrementToolInvocation(block.name, 'ok');
                } else if (block.type === 'thinking') {
                  send({ type: 'thinking_block', thinking: block.thinking });
                }
              }
              break;

            case 'result':
              resultMessage = message;
              streamCompleted = true;
              break;
          }
        }

        // Accumulate text from this turn
        accumulatedText += turnText;

        // Process result
        if (resultMessage) {
          totalDurationMs += resultMessage.duration_ms || 0;
          if (resultMessage.usage) {
            totalUsage.input_tokens += resultMessage.usage.input_tokens || 0;
            totalUsage.output_tokens += resultMessage.usage.output_tokens || 0;
            totalUsage.cache_read_input_tokens += resultMessage.usage.cache_read_input_tokens || 0;
            totalUsage.cache_creation_input_tokens += resultMessage.usage.cache_creation_input_tokens || 0;
          }

          // Multi-method truncation detection
          // Primary: Check stop_reason from assistant message (most reliable)
          // Secondary: Check text patterns in accumulated output
          // Tertiary: Check if output tokens near max limit (95% threshold)
          const isTruncatedByStopReason = lastStopReason === 'max_tokens';
          const isTruncatedByPattern = detectTruncation(accumulatedText);
          const outputTokensNearMax = totalUsage.output_tokens >= (MAX_TOKENS * 0.95);

          // NEW: Check for completion signals BEFORE deciding to continue
          // Completion signals OVERRIDE truncation detection to prevent infinite loops
          const isCompletedByPattern = detectCompletion(accumulatedText);
          const isCompletedByStopReason = lastStopReason === 'end_turn';

          let isTruncated;
          if (isCompletedByPattern && isCompletedByStopReason) {
            // Agent explicitly signaled completion - DO NOT continue regardless of token count
            console.log(`✅ [AgentSDK] Completion detected - stop_reason: ${lastStopReason}, pattern match found in output. Stopping continuation.`);
            isTruncated = false;
          } else {
            isTruncated = isTruncatedByStopReason || isTruncatedByPattern || outputTokensNearMax;
          }

          if (isTruncated) {
            console.log(`[AgentSDK] Truncation detected - stop_reason: ${lastStopReason}, pattern: ${isTruncatedByPattern}, tokens: ${totalUsage.output_tokens}/${MAX_TOKENS} (${outputTokensNearMax ? 'near max' : 'ok'})`);
          }

          if (isTruncated &&
              AUTO_CONTINUATION_CONFIG.enabled &&
              continuationAttempt < AUTO_CONTINUATION_CONFIG.maxAttempts) {

            continuationAttempt++;
            const reason = isTruncatedByStopReason ? 'stop_reason=max_tokens' :
                          isTruncatedByPattern ? 'pattern_match' : 'token_limit_95%';
            console.log(`🔄 [AgentSDK Auto-Continue] Attempt ${continuationAttempt}/${AUTO_CONTINUATION_CONFIG.maxAttempts} - ${reason}`);

            send({
              type: 'continuation',
              attempt: continuationAttempt,
              maxAttempts: AUTO_CONTINUATION_CONFIG.maxAttempts,
              message: 'Output appears truncated, automatically continuing...',
              reason: {
                stop_reason: lastStopReason,
                pattern_match: isTruncatedByPattern,
                output_tokens: totalUsage.output_tokens,
                max_tokens: MAX_TOKENS
              }
            });

            // Use session resume with continuation prompt
            currentSessionId = lastSessionId;
            currentPrompt = AUTO_CONTINUATION_CONFIG.prompt;
            shouldContinue = true;
          } else {
            // Done - either complete or max attempts reached
            shouldContinue = false;

            if (isTruncated && continuationAttempt >= AUTO_CONTINUATION_CONFIG.maxAttempts) {
              console.log(`⚠️ [AgentSDK Auto-Continue] Max attempts (${AUTO_CONTINUATION_CONFIG.maxAttempts}) reached, output may be incomplete`);
              send({
                type: 'continuation_limit',
                message: `Auto-continuation limit reached (${AUTO_CONTINUATION_CONFIG.maxAttempts} attempts). Output may be incomplete.`,
                attempts: continuationAttempt
              });
            }

            clearInterval(heartbeat);
            recordStreamDuration({ path: '/api/stream', model: MODEL, status: resultMessage.is_error ? 'error' : 'ok' }, Date.now() - streamStart);

            const finalPayload = {
              type: 'final',
              completed: new Date().toISOString(),
              model: MODEL,
              session_id: lastSessionId,
              subtype: resultMessage.subtype,
              is_error: resultMessage.is_error,
              num_turns: totalTurns,
              total_cost_usd: resultMessage.total_cost_usd,
              duration_ms: totalDurationMs,
              usage: totalUsage,
              continuation_attempts: continuationAttempt,
              stop_reason: lastStopReason,
              truncation_info: {
                detected: isTruncated,
                by_stop_reason: isTruncatedByStopReason,
                by_pattern: isTruncatedByPattern,
                by_token_limit: outputTokensNearMax
              }
            };

            if (resultMessage.subtype === 'success' && resultMessage.result) {
              finalPayload.result = resultMessage.result;
            }

            recordTokens({
              model: MODEL,
              input: totalUsage.input_tokens,
              output: totalUsage.output_tokens,
              cached: totalUsage.cache_read_input_tokens,
              cacheRead: totalUsage.cache_read_input_tokens,
              cacheCreation: totalUsage.cache_creation_input_tokens
            });

            send(finalPayload);
            console.log(`✅ [Stream] Complete: ${totalTurns} turns, ${totalDurationMs}ms, ${continuationAttempt} continuations`);
          }
        }
      }

      endSpan(span);
    } catch (error) {
      clearInterval(heartbeat);
      const code = mapExceptionToCode(error);
      const resp = toErrorResponse(code, error?.message || 'Unknown error', {}, req.requestId);
      recordError(resp.body.error.code, '/api/stream');
      console.error('Agent SDK stream error:', error);
      send({ type: 'error', error: resp.body.error });
      endSpan(span, { error });
    } finally {
      end();
    }
    return;
  }

  // Legacy single-turn implementation with auto-continuation support
  const allTools = filterToolsByPermissions(getSdkTools(), '/api/stream');
  let conversationMessages = [{ role: 'user', content: userQuery }];
  const requestedTool = req.query.schema_tool || null;
  const schema = featureFlags.STRUCTURED_OUTPUTS && requestedTool
    ? STRUCTURED_OUTPUT_ENABLED[requestedTool]
    : null;
  const output_format = schema ? { type: 'json_schema', json_schema: schema } : undefined;
  const skills = featureFlags.SKILLS_ENABLED ? buildSkillsContainer() : null;
  if (skills) {
    skills.forEach((skill) => recordSkillInvocation(skill.skill_id || skill.name));
  }
  const tool_choice =
    req.query.disable_parallel_tool_use === 'true'
      ? { type: 'auto', disable_parallel_tool_use: true }
      : undefined;
  const toolsForRequest = allTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema
  }));
  if (featureFlags.SKILLS_ENABLED) {
    toolsForRequest.push({
      type: 'code_execution_20250825',
      name: 'code_execution',
      description: 'Anthropic managed code execution for Skills'
    });
  }

  // Track accumulated response for auto-continuation
  let accumulatedText = '';
  let continuationAttempt = 0;
  let totalUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

  // Build beta headers for Legacy Stream (context management requires beta endpoint)
  const legacyBetaHeader = buildBetaHeader({
    includeStructuredOutputs: Boolean(schema),
    includeSkills: Boolean(skills),
    includeContextManagement: true
  });

  try {
    await anthropicBreaker.execute(async () => {
      const toolHandlers = Object.fromEntries(allTools.map((t) => [t.name, t.handler]));
      let shouldContinue = true;
      let lastStopReason = null;

      while (shouldContinue) {
        const stream = anthropic.beta.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: conversationMessages,
          thinking: {
            type: 'enabled',
            budget_tokens: 4096
          },
          system: getSystemPromptWithDate(),
          tools: buildCachedTools(toolsForRequest),
          ...(output_format ? { output_format } : {}),
          ...(skills ? { container: { skills } } : {}),
          ...(tool_choice ? { tool_choice } : {}),
          ...((legacyBetaHeader && legacyBetaHeader.length > 0) ? { betas: legacyBetaHeader.split(',').filter(Boolean) } : {}),
          context_management: buildContextManagement()
        });

        let currentBlockType = null;
        let currentTurnText = '';

        for await (const event of stream) {
          if (event.type === 'content_block_start') {
            currentBlockType = event.content_block?.type;
            if (event.content_block?.type === 'tool_use') {
              send({ type: 'tool_call', phase: 'tool_start', tool: { name: event.content_block.name, id: event.content_block.id } });
            } else if (event.content_block?.type === 'thinking') {
              send({ type: 'thinking_start' });
            }
          } else if (event.type === 'content_block_delta') {
            if (event.delta?.type === 'text_delta') {
              send({ type: 'delta', text: event.delta.text });
              currentTurnText += event.delta.text;
            } else if (event.delta?.type === 'thinking_delta') {
              send({ type: 'thinking', text: event.delta.thinking });
            } else if (event.delta?.type === 'signature_delta') {
              send({ type: 'thinking_signature', signature: event.delta.signature });
            }
          } else if (event.type === 'content_block_stop') {
            if (currentBlockType === 'thinking') {
              send({ type: 'thinking_complete' });
            }
            currentBlockType = null;
          }
        }

        const finalMessage = await stream.finalMessage();
        lastStopReason = finalMessage.stop_reason;

        // Accumulate text from this turn
        accumulatedText += currentTurnText;

        // Accumulate usage
        if (finalMessage?.usage) {
          totalUsage.input_tokens += finalMessage.usage.input_tokens || 0;
          totalUsage.output_tokens += finalMessage.usage.output_tokens || 0;
          totalUsage.cache_read_input_tokens += finalMessage.usage.cache_read_input_tokens || 0;
          totalUsage.cache_creation_input_tokens += finalMessage.usage.cache_creation_input_tokens || 0;
        }

        // Execute tools if stop_reason is tool_use
        if (finalMessage.stop_reason === 'tool_use') {
          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              const handler = toolHandlers[block.name];
              if (handler) {
                send({ type: 'tool_call', phase: 'tool_executing', tool: { name: block.name, input: block.input } });
                try {
                  const result = await withToolSpan(block.name, () => handler(block.input));
                  incrementToolInvocation(block.name, 'ok');
                  send({ type: 'tool_call', phase: 'tool_result', tool: { name: block.name }, success: true, preview: JSON.stringify(result) });
                } catch (err) {
                  incrementToolInvocation(block.name, 'error');
                  send({ type: 'tool_call', phase: 'tool_error', tool: { name: block.name }, success: false, preview: JSON.stringify({ error: err?.message }) });
                }
              }
            }
          }
        }

        // Check if we should auto-continue due to max_tokens
        if (finalMessage.stop_reason === 'max_tokens' &&
            AUTO_CONTINUATION_CONFIG.enabled &&
            continuationAttempt < AUTO_CONTINUATION_CONFIG.maxAttempts) {

          continuationAttempt++;
          console.log(`🔄 [Auto-Continue] Attempt ${continuationAttempt}/${AUTO_CONTINUATION_CONFIG.maxAttempts} - output truncated at max_tokens`);

          // Send continuation event to frontend
          send({
            type: 'continuation',
            attempt: continuationAttempt,
            maxAttempts: AUTO_CONTINUATION_CONFIG.maxAttempts,
            message: 'Output truncated, automatically continuing...'
          });

          // Build continuation messages per Anthropic's recommended pattern
          conversationMessages = [
            { role: 'user', content: userQuery },
            { role: 'assistant', content: accumulatedText },
            { role: 'user', content: AUTO_CONTINUATION_CONFIG.prompt }
          ];

          // Continue the loop
          shouldContinue = true;
        } else {
          // Stop the loop - either completed normally or max attempts reached
          shouldContinue = false;

          if (finalMessage.stop_reason === 'max_tokens' && continuationAttempt >= AUTO_CONTINUATION_CONFIG.maxAttempts) {
            console.log(`⚠️ [Auto-Continue] Max attempts (${AUTO_CONTINUATION_CONFIG.maxAttempts}) reached, output may be incomplete`);
            send({
              type: 'continuation_limit',
              message: `Auto-continuation limit reached (${AUTO_CONTINUATION_CONFIG.maxAttempts} attempts). Output may be incomplete.`,
              attempts: continuationAttempt
            });
          }
        }
      }

      recordStreamDuration({ path: '/api/stream', model: MODEL, status: 'ok' }, Date.now() - streamStart);

      const finalPayload = {
        type: 'final',
        completed: new Date().toISOString(),
        model: MODEL,
        usage: totalUsage,
        stop_reason: lastStopReason,
        continuation_attempts: continuationAttempt
      };
      if (schema && accumulatedText) {
        finalPayload.structured = safeParseStructured(accumulatedText, schema, requestedTool || 'unknown');
      }

      recordTokens({
        model: MODEL,
        input: totalUsage.input_tokens,
        output: totalUsage.output_tokens,
        cached: totalUsage.cache_read_input_tokens,
        cacheRead: totalUsage.cache_read_input_tokens,
        cacheCreation: totalUsage.cache_creation_input_tokens
      });

      send(finalPayload);
    });
    endSpan(span);
  } catch (error) {
    const code = mapExceptionToCode(error);
    const resp = toErrorResponse(code, error?.message || 'Unknown error', {}, req.requestId);
    recordError(resp.body.error.code, '/api/stream');
    console.error('SDK stream error:', error);
    send({ type: 'error', error: resp.body.error });
    endSpan(span, { error });
  } finally {
    end();
  }
});

app.listen(PORT, () => {
  console.log('🚀 Claude SDK Migration Server (Phase 1)');
  console.log(`📡 Environment: ${process.env.ENVIRONMENT || 'sdk-migration'}`);
  console.log(`🔗 Port: ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test:  http://localhost:${PORT}/api/sdk-test`);
  console.log(`📖 Research: http://localhost:${PORT}/api/research`);
  console.log(`📡 Stream: http://localhost:${PORT}/api/stream`);
});

export { anthropic };


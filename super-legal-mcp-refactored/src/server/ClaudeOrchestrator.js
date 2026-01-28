/**
 * ClaudeOrchestrator - Intelligent Research Coordinator
 *
 * Coordinates between Claude (reasoning/synthesis) and Gemini filters (extraction).
 * Uses a hybrid instruction approach: static domain prompts + dynamic focus points.
 *
 * Features:
 * - Query analysis and module selection
 * - Parallel Gemini filter invocation
 * - Iterative search refinement (max 3 iterations)
 * - SessionManager integration for multi-turn conversations
 * - Fallback handling for Gemini unavailability
 */

import Anthropic from '@anthropic-ai/sdk';
import { GeminiFilterModule } from '../filters/GeminiFilterModule.js';
import {
  SECURITIES_PROMPT,
  PHARMACEUTICAL_PROMPT,
  ENVIRONMENTAL_PROMPT,
  CASE_LAW_PROMPT,
  LEGISLATION_PROMPT,
  FEDERAL_REGISTER_PROMPT,
  PRODUCT_SAFETY_PROMPT,
  ANTITRUST_PROMPT,
  PATENT_PROMPT,
  PATENT_APPEALS_PROMPT,
  STATE_COURTS_PROMPT,
  STATE_STATUTES_PROMPT,
  DOMAIN_CLIENT_MAPPING,
  getDomainForClient
} from '../filters/prompts/index.js';
import { geminiConfig, getMaxTokensForDomain } from '../config/geminiConfig.js';

/**
 * @typedef {Object} SearchPlan
 * @property {string[]} modules - Selected domain modules
 * @property {Object<string, string>} focusPoints - Module-specific focus points
 * @property {number} confidence - Planning confidence score
 */

/**
 * @typedef {Object} SynthesisResult
 * @property {string} answer - Synthesized answer
 * @property {boolean} needsMoreInfo - Whether more search is needed
 * @property {string} [refinedQuery] - Refined query for next iteration
 */

/**
 * @typedef {Object} ResearchResult
 * @property {string} answer - Final answer
 * @property {string} [sessionId] - Session ID if session tracking enabled
 * @property {number} iterations - Number of search iterations performed
 * @property {string[]} modulesQueried - Modules that were queried
 */

export class ClaudeOrchestrator {
  /**
   * Create a new ClaudeOrchestrator
   *
   * @param {Object} options - Configuration options
   * @param {Object} [options.sessionManager] - SessionManager instance for multi-turn
   * @param {number} [options.maxIterations=3] - Maximum search refinement iterations
   * @param {Object} [options.apiClients] - Map of API client instances for fetching raw data
   * @param {string} [options.claudeModel='claude-sonnet-4-20250514'] - Claude model for orchestration
   */
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 3;
    this.claudeModel = options.claudeModel || 'claude-sonnet-4-20250514';
    this.sessionManager = options.sessionManager || null;
    this.apiClients = options.apiClients || {};

    // Initialize Anthropic client with 1M context beta header
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[ClaudeOrchestrator] ANTHROPIC_API_KEY not set');
    }
    this.anthropic = apiKey ? new Anthropic({ 
      apiKey,
      defaultHeaders: {
        'anthropic-beta': 'context-1m-2025-08-07'
      }
    }) : null;

    // Initialize Gemini filter modules for each domain
    this.filters = this._initializeFilters();

    // Track orchestrator statistics
    this.stats = {
      totalResearches: 0,
      totalIterations: 0,
      moduleUsage: {},
      fallbackCount: 0
    };

    console.log('[ClaudeOrchestrator] Initialized with', Object.keys(this.filters).length, 'domain filters');
  }

  /**
   * Initialize all domain filter modules
   *
   * @returns {Object<string, GeminiFilterModule>} Map of domain to filter module
   * @private
   */
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
      try {
        filters[domain] = new GeminiFilterModule(domain, {
          systemPrompt: prompt,
          maxOutputTokens: getMaxTokensForDomain(domain)
        });
      } catch (error) {
        console.warn(`[ClaudeOrchestrator] Failed to initialize ${domain} filter:`, error.message);
      }
    }

    return filters;
  }

  /**
   * Main research method - coordinates search, filtering, and synthesis
   *
   * @param {string} userQuery - User's research query
   * @param {Object} [options] - Research options
   * @param {string} [options.sessionId] - Session ID for multi-turn tracking
   * @param {number} [options.iteration=0] - Current iteration (internal)
   * @param {Array} [options.accumulatedFindings=[]] - Findings from previous iterations
   * @returns {Promise<ResearchResult>} Research result
   */
  async research(userQuery, options = {}) {
    const {
      sessionId,
      iteration = 0,
      accumulatedFindings = []
    } = options;

    this.stats.totalResearches++;

    // Get or create session for multi-turn tracking
    let session = null;
    if (sessionId && this.sessionManager) {
      session = this.sessionManager.getSession(sessionId);
      if (!session) {
        session = this.sessionManager.createSession(sessionId);
      }
      if (iteration === 0) {
        session.addUserMessage(userQuery);
      }
    }

    // Check iteration limit
    if (iteration >= this.maxIterations) {
      console.log(`[ClaudeOrchestrator] Max iterations (${this.maxIterations}) reached`);
      return this._finalSynthesis(accumulatedFindings, userQuery, session);
    }

    this.stats.totalIterations++;

    try {
      // Step 1: Generate focus points using Claude (hybrid approach)
      const plan = await this.generateFocusPoints(userQuery, accumulatedFindings);
      console.log(`[ClaudeOrchestrator] Iteration ${iteration + 1}: querying modules [${plan.modules.join(', ')}]`);

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

        if (!filter) {
          console.warn(`[ClaudeOrchestrator] No filter for module: ${moduleName}`);
          return Promise.resolve(this._createEmptyFinding(moduleName, 'no_filter'));
        }

        if (!rawData || rawData.length === 0) {
          return Promise.resolve(this._createEmptyFinding(moduleName, 'no_data'));
        }

        return filter.processAndFilter(rawData, focusPoint);
      });

      const findings = await Promise.all(filterPromises);

      // Track fallbacks
      findings.forEach(f => {
        if (f.fallback) this.stats.fallbackCount++;
      });

      // Accumulate findings
      const allFindings = [...accumulatedFindings, ...findings.filter(f => f.findings && f.findings.length > 0)];

      // Step 4: Synthesize findings
      const synthesis = await this.synthesize(allFindings, userQuery, session);

      // Step 5: Check if more information needed
      if (synthesis.needsMoreInfo && iteration < this.maxIterations - 1) {
        console.log(`[ClaudeOrchestrator] Needs more info, refining query: "${synthesis.refinedQuery}"`);

        return this.research(synthesis.refinedQuery || userQuery, {
          sessionId,
          iteration: iteration + 1,
          accumulatedFindings: allFindings
        });
      }

      // Store final answer in session
      if (session) {
        session.addAssistantResponse(synthesis.answer);
        // Store accumulated findings for context
        session.accumulatedFindings = allFindings;
      }

      return {
        answer: synthesis.answer,
        sessionId: session?.sessionId,
        iterations: iteration + 1,
        modulesQueried: [...new Set(allFindings.map(f => f.domain))]
      };

    } catch (error) {
      console.error('[ClaudeOrchestrator] Research error:', error);

      // Return partial results if available
      if (accumulatedFindings.length > 0) {
        return this._finalSynthesis(accumulatedFindings, userQuery, session);
      }

      throw error;
    }
  }

  /**
   * Generate query-specific focus points using Claude (hybrid approach)
   * These augment the static domain system prompts
   *
   * @param {string} userQuery - User's query
   * @param {Array} previousFindings - Findings from previous iterations
   * @returns {Promise<SearchPlan>} Search plan with modules and focus points
   */
  async generateFocusPoints(userQuery, previousFindings = []) {
    // If Claude is not available, use keyword-based selection
    if (!this.anthropic) {
      return this._keywordBasedPlan(userQuery);
    }

    const previousContext = previousFindings.length > 0
      ? `\n\nPrevious findings (for context - identify gaps):\n${previousFindings.map(f => `- ${f.domain}: ${typeof f.findings === 'string' ? f.findings.substring(0, 200) : 'structured data'}`).join('\n')}`
      : '';

    try {
      const response = await this.anthropic.messages.create({
        model: this.claudeModel,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this legal research query and select relevant domains. Provide query-specific focus points that will AUGMENT the static extraction prompts.

Query: "${userQuery}"
${previousContext}

Available domains:
- securities: SEC filings, corporate disclosures, financial metrics
- pharmaceutical_safety: FDA adverse events, recalls, drug safety
- environmental: EPA compliance, violations, penalties
- case_law: Court opinions, holdings, precedents
- legislation: US Code, federal statutes
- federal_register: Federal rules, regulations, notices
- product_safety: CPSC/NHTSA recalls, hazards
- antitrust: FTC enforcement, merger analysis
- patent: USPTO patents, claims, prosecution
- patent_appeals: PTAB proceedings, IPR decisions
- state_courts: State court procedural rules
- state_statutes: State laws, codes

Return ONLY valid JSON (no markdown):
{
  "modules": ["domain1", "domain2"],
  "focusPoints": {
    "domain1": "FOCUS: [specific entities/metrics/issues to prioritize]",
    "domain2": "FOCUS: [specific aspects to extract]"
  },
  "confidence": 0.8
}

Rules:
- Select 1-3 most relevant modules
- Keep focus points concise (1-2 sentences each)
- Focus points should add query-specific guidance, not repeat general extraction rules
- If query spans multiple domains, prioritize by relevance`
        }]
      });

      const responseText = response.content[0].text.trim();

      // Parse JSON response
      try {
        // Handle potential markdown code blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const plan = JSON.parse(jsonMatch[0]);

          // Validate plan structure
          if (!plan.modules || !Array.isArray(plan.modules) || plan.modules.length === 0) {
            throw new Error('Invalid plan: missing modules');
          }

          // Filter to only valid modules
          plan.modules = plan.modules.filter(m => this.filters[m]);

          if (plan.modules.length === 0) {
            console.warn('[ClaudeOrchestrator] No valid modules in plan, using fallback');
            return this._keywordBasedPlan(userQuery);
          }

          return {
            modules: plan.modules,
            focusPoints: plan.focusPoints || {},
            confidence: plan.confidence || 0.7
          };
        }
      } catch (parseError) {
        console.warn('[ClaudeOrchestrator] Failed to parse focus points:', parseError.message);
      }

      // Fall back to keyword-based plan
      return this._keywordBasedPlan(userQuery);

    } catch (error) {
      console.error('[ClaudeOrchestrator] generateFocusPoints error:', error);
      return this._keywordBasedPlan(userQuery);
    }
  }

  /**
   * Keyword-based module selection fallback
   *
   * @param {string} query - User query
   * @returns {SearchPlan} Search plan based on keywords
   * @private
   */
  _keywordBasedPlan(query) {
    const queryLower = query.toLowerCase();
    const modules = [];
    const focusPoints = {};

    // Keyword patterns for each domain
    const patterns = {
      securities: /\b(sec|edgar|10-k|10-q|8-k|filing|ticker|cik|stock|shares|revenue|earnings|proxy)\b/i,
      pharmaceutical_safety: /\b(fda|drug|device|adverse|recall|maude|faers|pharmaceutical|medicine|prescription)\b/i,
      environmental: /\b(epa|environmental|pollution|echo|compliance|emission|permit|clean air|clean water)\b/i,
      case_law: /\b(v\.|vs\.|court|judge|ruling|opinion|holding|precedent|appeal|affirm|reverse)\b/i,
      legislation: /\b(usc|u\.s\.c\.|statute|code|section|chapter|title|congress|enacted)\b/i,
      federal_register: /\b(federal register|cfr|regulation|rule|final rule|proposed rule|notice)\b/i,
      product_safety: /\b(cpsc|nhtsa|recall|hazard|safety|defect|injury|consumer product|vehicle)\b/i,
      antitrust: /\b(ftc|antitrust|merger|competition|monopol|consent decree|hart-scott)\b/i,
      patent: /\b(patent|uspto|inventor|claim|prior art|application|assignee)\b/i,
      patent_appeals: /\b(ptab|ipr|pgr|cbm|inter partes|post-grant)\b/i,
      state_courts: /\b(state court|local rule|civil procedure|filing deadline)\b/i,
      state_statutes: /\b(state law|state statute|state code)\b/i
    };

    // Check each pattern
    for (const [domain, pattern] of Object.entries(patterns)) {
      if (pattern.test(queryLower)) {
        modules.push(domain);
        focusPoints[domain] = `FOCUS: Extract information specifically about "${query.substring(0, 100)}"`;
      }
    }

    // Default to case_law if no matches
    if (modules.length === 0) {
      modules.push('case_law');
      focusPoints.case_law = `FOCUS: Find relevant legal precedents for "${query.substring(0, 100)}"`;
    }

    // Limit to top 3 modules
    return {
      modules: modules.slice(0, 3),
      focusPoints,
      confidence: 0.5
    };
  }

  /**
   * Fetch raw data for a module from the appropriate API client
   *
   * @param {string} moduleName - Domain module name
   * @param {string} query - Search query
   * @returns {Promise<Array>} Raw search results
   * @private
   */
  async _fetchRawData(moduleName, query) {
    // Get the client for this module
    const clientNames = DOMAIN_CLIENT_MAPPING[moduleName];
    if (!clientNames || clientNames.length === 0) {
      console.warn(`[ClaudeOrchestrator] No client mapping for module: ${moduleName}`);
      return [];
    }

    // Try each mapped client
    for (const clientName of clientNames) {
      const client = this.apiClients[clientName];

      // Prefer getRawResults() for Gemini filtering (no Exa summaries)
      if (client && typeof client.getRawResults === 'function') {
        try {
          const results = await client.getRawResults(query, 5, {
            domain: moduleName
          });
          if (results && results.length > 0) {
            return results;
          }
        } catch (error) {
          console.warn(`[ClaudeOrchestrator] Client ${clientName} getRawResults failed:`, error.message);
        }
      }

      // Fallback to executeExaSearch with full text
      if (client && typeof client.executeExaSearch === 'function') {
        try {
          const results = await client.executeExaSearch(query, 5, {
            domain: moduleName,
            includeFullText: true,
            fallbackToText: false
          });
          return results;
        } catch (error) {
          console.warn(`[ClaudeOrchestrator] Client ${clientName} executeExaSearch failed:`, error.message);
        }
      }
    }

    // If no API client available, return empty
    console.log(`[ClaudeOrchestrator] No API client available for ${moduleName}`);
    return [];
  }

  /**
   * Create an empty finding placeholder
   *
   * @param {string} domain - Domain name
   * @param {string} reason - Reason for empty result
   * @returns {Object} Empty finding object
   * @private
   */
  _createEmptyFinding(domain, reason) {
    return {
      domain,
      findings: [],
      sourceCount: 0,
      sourceUrls: [],
      fallback: true,
      fallbackReason: reason
    };
  }

  /**
   * Synthesize findings into a comprehensive answer
   *
   * @param {Array} findings - All accumulated findings
   * @param {string} userQuery - Original user query
   * @param {Object} [session] - Session object for context
   * @returns {Promise<SynthesisResult>} Synthesis result
   */
  async synthesize(findings, userQuery, session = null) {
    // If no Claude available, return formatted findings
    if (!this.anthropic) {
      return {
        answer: this._formatFindingsAsAnswer(findings),
        needsMoreInfo: false
      };
    }

    // Build context from session history if available
    const sessionContext = session && session.conversationHistory?.length > 0
      ? `\n\nConversation context:\n${session.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content?.substring(0, 200)}`).join('\n')}`
      : '';

    // Format findings for Claude
    const findingsText = findings.map(f => {
      const fallbackNote = f.fallback ? ' [LIMITED PREVIEW - Gemini unavailable]' : '';
      const findingsContent = typeof f.findings === 'string'
        ? f.findings
        : Array.isArray(f.findings)
          ? f.findings.map(item =>
              typeof item === 'object'
                ? `- ${item.title || 'Result'}: ${item.preview || JSON.stringify(item).substring(0, 300)}`
                : `- ${item}`
            ).join('\n')
          : JSON.stringify(f.findings);

      return `## ${f.domain}${fallbackNote}
${findingsContent}
Sources: ${f.sourceUrls?.slice(0, 3).join(', ') || 'N/A'}`;
    }).join('\n\n');

    try {
      const response = await this.anthropic.messages.create({
        model: this.claudeModel,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Query: ${userQuery}
${sessionContext}

Research findings from ${findings.length} domain searches:

${findingsText}

Synthesize a comprehensive answer to the query based on these findings.

Rules:
1. Directly answer the user's question
2. Cite sources with URLs where possible
3. If findings are marked [LIMITED PREVIEW], note that full analysis may be incomplete
4. If more specific information would help, indicate what additional searches would be useful

If you need more information to fully answer the query, respond with this JSON at the END of your answer:
{"needsMoreInfo": true, "refinedQuery": "more specific query here"}

Otherwise, provide your complete answer.`
        }]
      });

      const responseText = response.content[0].text;

      // Check for needsMoreInfo JSON at end
      const jsonMatch = responseText.match(/\{"needsMoreInfo":\s*true,\s*"refinedQuery":\s*"([^"]+)"\}/);
      if (jsonMatch) {
        const answer = responseText.replace(jsonMatch[0], '').trim();
        return {
          answer,
          needsMoreInfo: true,
          refinedQuery: jsonMatch[1]
        };
      }

      return {
        answer: responseText,
        needsMoreInfo: false
      };

    } catch (error) {
      console.error('[ClaudeOrchestrator] Synthesis error:', error);
      return {
        answer: this._formatFindingsAsAnswer(findings),
        needsMoreInfo: false
      };
    }
  }

  /**
   * Format findings as an answer without Claude synthesis
   *
   * @param {Array} findings - All findings
   * @returns {string} Formatted answer
   * @private
   */
  _formatFindingsAsAnswer(findings) {
    if (findings.length === 0) {
      return 'No relevant information found for your query.';
    }

    return findings.map(f => {
      const header = `**${f.domain.replace(/_/g, ' ').toUpperCase()}**${f.fallback ? ' (limited preview)' : ''}`;
      const content = typeof f.findings === 'string'
        ? f.findings
        : Array.isArray(f.findings)
          ? f.findings.map(item =>
              typeof item === 'object' ? `- ${item.title}: ${item.preview}` : `- ${item}`
            ).join('\n')
          : JSON.stringify(f.findings, null, 2);

      return `${header}\n${content}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Create final synthesis when max iterations reached
   *
   * @param {Array} findings - All accumulated findings
   * @param {string} userQuery - Original query
   * @param {Object} [session] - Session object
   * @returns {Promise<ResearchResult>} Final result
   * @private
   */
  async _finalSynthesis(findings, userQuery, session) {
    const synthesis = await this.synthesize(findings, userQuery, session);

    if (session) {
      session.addAssistantResponse(synthesis.answer);
      session.accumulatedFindings = findings;
    }

    return {
      answer: synthesis.answer + '\n\n*Note: Maximum search iterations reached. Results may be partial.*',
      sessionId: session?.sessionId,
      iterations: this.maxIterations,
      modulesQueried: [...new Set(findings.map(f => f.domain))]
    };
  }

  /**
   * Get orchestrator statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      filterStatus: Object.entries(this.filters).map(([domain, filter]) => ({
        domain,
        status: filter.getStatus()
      }))
    };
  }

  /**
   * Register API clients for data fetching
   *
   * @param {Object} clients - Map of client name to client instance
   */
  registerClients(clients) {
    this.apiClients = { ...this.apiClients, ...clients };
    console.log('[ClaudeOrchestrator] Registered clients:', Object.keys(clients).join(', '));
  }

  /**
   * Reset all filters (useful for testing)
   */
  reset() {
    Object.values(this.filters).forEach(filter => filter.reset());
    this.stats = {
      totalResearches: 0,
      totalIterations: 0,
      moduleUsage: {},
      fallbackCount: 0
    };
  }
}

export default ClaudeOrchestrator;

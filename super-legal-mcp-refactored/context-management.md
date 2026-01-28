# Context Window Management Implementation Spec

## Problem Statement

The Legal MCP Server with Gemini Filter Layer processes tool results through Gemini for intelligent extraction (70-80% token reduction per tool). However, **accumulated filtered results across multiple tool calls** still overflow Claude's 200K context window.

**Observed Failure:**
```
Test: Healthcare AI Regulatory Compliance Research
Tool calls: 15+
Error: "prompt is too long: 207873 tokens > 200000 maximum"
```

**Root Cause:** No mechanism manages cumulative token usage across tool calls.

---

## Solution: ContextWindowManager

A class that tracks accumulated tokens and triggers Gemini-based compression when approaching the context limit.

---

## Step-by-Step Implementation

### Step 1: Create ContextWindowManager Class

**File:** `src/utils/ContextWindowManager.js`

**Action:** Create new file

```javascript
/**
 * ContextWindowManager - Tracks accumulated tool results and compresses when needed
 *
 * Problem: Gemini filtering reduces each tool's output by 70-80%, but accumulated
 * results across 15+ tool calls still overflow Claude's 200K context window.
 *
 * Solution: Track token usage and trigger compression when approaching limit.
 */

import { GeminiFilterModule } from '../filters/GeminiFilterModule.js';
import { geminiConfig } from '../config/geminiConfig.js';

// Synthesis prompt for compressing accumulated findings
const SYNTHESIS_PROMPT = `You are a legal research synthesis specialist. Your task is to compress multiple research findings into a coherent summary while preserving:

MUST PRESERVE:
- All citations (case names, statutes, regulations with full citations)
- Key dates and deadlines
- Quantitative data (penalties, amounts, percentages, counts)
- Holdings and legal conclusions
- Entity names (companies, agencies, judges, parties)
- Source URLs for verification

FORMAT:
- Organize by topic/domain
- Use bullet points for facts
- Include section headers
- Maximum 4000 tokens total

Do NOT:
- Add commentary or analysis beyond what's in the source
- Omit any citations or legal references
- Change numerical values`;

export class ContextWindowManager {
  /**
   * @param {Object} options Configuration options
   * @param {number} options.maxTokenBudget Maximum tokens before requiring compression (default: 150000)
   * @param {number} options.compressionThreshold Trigger compression at this % of budget (default: 0.8)
   * @param {number} options.keepRecentResults Number of recent results to keep uncompressed (default: 3)
   */
  constructor(options = {}) {
    // Use config values with fallbacks
    const contextConfig = geminiConfig.contextWindow || {};

    this.maxTokenBudget = options.maxTokenBudget || contextConfig.maxTokenBudget || 150000;
    this.compressionThreshold = options.compressionThreshold || contextConfig.compressionThreshold || 0.8;
    this.keepRecentResults = options.keepRecentResults || contextConfig.keepRecentResults || 3;

    // State tracking
    this.currentTokens = 0;
    this.toolResults = [];  // Array of {content, tokens, timestamp, domain, toolName}
    this.compressionCount = 0;

    // Gemini filter for compression (lazy initialized)
    this.compressionFilter = null;

    console.log(`[ContextWindowManager] Initialized: budget=${this.maxTokenBudget}, threshold=${this.compressionThreshold * 100}%`);
  }

  /**
   * Lazy initialize compression filter (avoids circular deps)
   */
  _getCompressionFilter() {
    if (!this.compressionFilter) {
      this.compressionFilter = new GeminiFilterModule('synthesis', {
        systemPrompt: SYNTHESIS_PROMPT,
        maxOutputTokens: 4000
      });
    }
    return this.compressionFilter;
  }

  /**
   * Estimate tokens for content (4 chars ≈ 1 token)
   * @param {string|Object} content Content to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(content) {
    if (!content) return 0;
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    }
    return Math.ceil(String(content).length / 4);
  }

  /**
   * Add a tool result, compressing old results if needed
   *
   * @param {Object} toolResult Tool result to add
   * @param {string} toolResult.content The result content
   * @param {string} toolResult.domain Domain category (securities, pharmaceutical, etc.)
   * @param {string} toolResult.name Tool name
   * @returns {Promise<Object>} The result (unchanged, compression happens to old results)
   */
  async addResult(toolResult) {
    const resultTokens = this.estimateTokens(toolResult.content);
    const threshold = this.maxTokenBudget * this.compressionThreshold;

    // Check if we need to compress BEFORE adding
    if (this.currentTokens + resultTokens > threshold) {
      console.log(`[ContextWindowManager] Threshold reached: ${this.currentTokens} + ${resultTokens} > ${threshold}`);
      await this.compressOldResults();
    }

    // Track this result
    this.toolResults.push({
      content: toolResult.content,
      tokens: resultTokens,
      timestamp: Date.now(),
      domain: toolResult.domain || this._inferDomain(toolResult.name),
      toolName: toolResult.name || 'unknown'
    });
    this.currentTokens += resultTokens;

    // Log status
    const utilization = (this.currentTokens / this.maxTokenBudget * 100).toFixed(1);
    console.log(`[ContextWindowManager] Added ${resultTokens} tokens (${utilization}% used, ${this.toolResults.length} results)`);

    return toolResult;  // Return unchanged
  }

  /**
   * Infer domain from tool name
   * @param {string} toolName Tool name
   * @returns {string} Inferred domain
   */
  _inferDomain(toolName) {
    if (!toolName) return 'general';
    const name = toolName.toLowerCase();

    if (name.includes('sec') || name.includes('edgar') || name.includes('filing')) return 'securities';
    if (name.includes('fda') || name.includes('drug') || name.includes('adverse')) return 'pharmaceutical';
    if (name.includes('epa') || name.includes('environmental')) return 'environmental';
    if (name.includes('case') || name.includes('court') || name.includes('opinion')) return 'case_law';
    if (name.includes('federal_register') || name.includes('regulation')) return 'federal_register';
    if (name.includes('usc') || name.includes('statute') || name.includes('code')) return 'legislation';
    if (name.includes('patent') || name.includes('ptab') || name.includes('uspto')) return 'patent';
    if (name.includes('ftc') || name.includes('antitrust')) return 'antitrust';
    if (name.includes('cpsc') || name.includes('nhtsa') || name.includes('recall')) return 'product_safety';

    return 'general';
  }

  /**
   * Compress older results using Gemini synthesis
   */
  async compressOldResults() {
    // Need at least (keepRecentResults + 1) to have something to compress
    if (this.toolResults.length <= this.keepRecentResults) {
      console.log(`[ContextWindowManager] Not enough results to compress (${this.toolResults.length})`);
      return;
    }

    const toCompress = this.toolResults.slice(0, -this.keepRecentResults);
    const toKeep = this.toolResults.slice(-this.keepRecentResults);

    console.log(`[ContextWindowManager] Compressing ${toCompress.length} results, keeping ${toKeep.length} recent`);

    try {
      // Group by domain for coherent synthesis
      const byDomain = this._groupByDomain(toCompress);

      // Synthesize each domain group
      const compressed = await this._synthesizeDomains(byDomain);

      // Replace old results with compressed summary
      const compressedTokens = this.estimateTokens(compressed);
      const originalTokens = toCompress.reduce((sum, r) => sum + r.tokens, 0);

      this.toolResults = [
        {
          content: compressed,
          tokens: compressedTokens,
          timestamp: Date.now(),
          domain: 'synthesis',
          toolName: 'context_compression'
        },
        ...toKeep
      ];

      // Recalculate total tokens
      this.currentTokens = this.toolResults.reduce((sum, r) => sum + r.tokens, 0);
      this.compressionCount++;

      const savings = ((1 - compressedTokens / originalTokens) * 100).toFixed(1);
      console.log(`[ContextWindowManager] Compression #${this.compressionCount}: ${originalTokens} -> ${compressedTokens} tokens (${savings}% reduction)`);

    } catch (error) {
      console.error(`[ContextWindowManager] Compression failed:`, error.message);
      // Fallback: simple truncation of oldest results
      this._fallbackTruncate(toCompress, toKeep);
    }
  }

  /**
   * Group results by domain for coherent synthesis
   * @param {Array} results Results to group
   * @returns {Object} Results grouped by domain
   */
  _groupByDomain(results) {
    return results.reduce((acc, r) => {
      const domain = r.domain || 'general';
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(r);
      return acc;
    }, {});
  }

  /**
   * Synthesize domain groups using Gemini
   * @param {Object} byDomain Results grouped by domain
   * @returns {Promise<string>} Synthesized content
   */
  async _synthesizeDomains(byDomain) {
    const filter = this._getCompressionFilter();
    const syntheses = [];

    for (const [domain, results] of Object.entries(byDomain)) {
      // Combine content from this domain
      const combinedContent = results.map(r =>
        `--- Tool: ${r.toolName} ---\n${r.content}`
      ).join('\n\n');

      // Synthesize via Gemini
      const synthesis = await filter.processAndFilter(
        [{ text: combinedContent, domain }],
        `Synthesize these ${domain.toUpperCase()} research findings into a concise summary. Preserve all citations, dates, and numerical data.`
      );

      // Format synthesis output
      const findingsText = typeof synthesis.findings === 'string'
        ? synthesis.findings
        : JSON.stringify(synthesis.findings);

      syntheses.push(`## ${this._formatDomainName(domain)} Research Summary\n\n${findingsText}`);
    }

    return `# Compressed Research Context\n\n_${Object.keys(byDomain).length} domains synthesized at ${new Date().toISOString()}_\n\n${syntheses.join('\n\n---\n\n')}`;
  }

  /**
   * Format domain name for display
   */
  _formatDomainName(domain) {
    return domain
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Fallback truncation when Gemini compression fails
   */
  _fallbackTruncate(toCompress, toKeep) {
    console.warn(`[ContextWindowManager] Using fallback truncation`);

    // Create simple summary
    const summary = toCompress.map(r =>
      `[${r.toolName}] ${String(r.content).substring(0, 200)}...`
    ).join('\n\n');

    const summaryTokens = this.estimateTokens(summary);

    this.toolResults = [
      {
        content: `# Truncated Research Summary\n\n${summary}`,
        tokens: summaryTokens,
        timestamp: Date.now(),
        domain: 'truncated',
        toolName: 'fallback_truncation'
      },
      ...toKeep
    ];

    this.currentTokens = this.toolResults.reduce((sum, r) => sum + r.tokens, 0);
  }

  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      currentTokens: this.currentTokens,
      maxBudget: this.maxTokenBudget,
      utilization: `${(this.currentTokens / this.maxTokenBudget * 100).toFixed(1)}%`,
      resultCount: this.toolResults.length,
      compressionCount: this.compressionCount,
      domains: [...new Set(this.toolResults.map(r => r.domain))]
    };
  }

  /**
   * Check if approaching limit
   * @returns {boolean} True if above threshold
   */
  isApproachingLimit() {
    return this.currentTokens > this.maxTokenBudget * this.compressionThreshold;
  }

  /**
   * Get accumulated content for conversation
   * @returns {string} All accumulated content
   */
  getAccumulatedContent() {
    return this.toolResults.map(r => r.content).join('\n\n---\n\n');
  }

  /**
   * Reset for new conversation
   */
  reset() {
    this.currentTokens = 0;
    this.toolResults = [];
    this.compressionCount = 0;
    console.log(`[ContextWindowManager] Reset`);
  }
}

export default ContextWindowManager;
```

---

### Step 2: Add Configuration Options

**File:** `src/config/geminiConfig.js`

**Action:** Add context window configuration section

**Location:** After line 68 (after `features` block)

```javascript
  // Context Window Management
  contextWindow: {
    maxTokenBudget: parseInt(process.env.CONTEXT_MAX_TOKENS, 10) || 150000,
    compressionThreshold: parseFloat(process.env.CONTEXT_COMPRESSION_THRESHOLD) || 0.8,
    keepRecentResults: parseInt(process.env.CONTEXT_KEEP_RECENT, 10) || 3,
    enabled: process.env.CONTEXT_MANAGEMENT_ENABLED !== 'false'  // Enabled by default
  }
```

---

### Step 3: Create Synthesis Prompt File

**File:** `src/filters/prompts/synthesis.js`

**Action:** Create new file

```javascript
/**
 * Synthesis prompt for context compression
 * Used by ContextWindowManager to compress accumulated research findings
 */

export const SYNTHESIS_PROMPT = `You are a legal research synthesis specialist. Your task is to compress multiple research findings into a coherent summary while preserving ALL legally significant information.

## MUST PRESERVE (Never Omit)

### Citations & References
- Full case citations (e.g., "Brown v. Board of Education, 347 U.S. 483 (1954)")
- Statutory citations (e.g., "21 U.S.C. § 360c")
- Regulatory citations (e.g., "21 CFR Part 820")
- Document numbers (docket numbers, filing IDs, patent numbers)

### Dates & Deadlines
- Filing dates, effective dates, expiration dates
- Compliance deadlines
- Statute of limitations periods
- Comment period deadlines

### Quantitative Data
- Financial amounts (penalties, damages, revenue)
- Percentages and ratios
- Counts (adverse events, violations, recalls)
- Measurements and thresholds

### Legal Conclusions
- Holdings and rulings
- Regulatory determinations
- Enforcement actions
- Compliance status

### Entities
- Party names (plaintiffs, defendants, petitioners)
- Company names (with tickers/CIKs if available)
- Agency names
- Judge names
- Attorney names (if relevant)

## OUTPUT FORMAT

Organize by domain/topic with clear headers:

### [DOMAIN NAME]

**Key Findings:**
- Bullet point 1 with citation
- Bullet point 2 with data

**Sources:** [URLs]

## CONSTRAINTS

- Maximum output: 4000 tokens
- Do NOT add analysis beyond source material
- Do NOT change numerical values
- Do NOT omit any citations
- Preserve source URLs for verification`;

export default SYNTHESIS_PROMPT;
```

---

### Step 4: Integrate into claude-server-v2.js

**File:** `src/server/claude-server-v2.js`

**Action:** Multiple modifications

#### 4a. Add Import (near top of file, with other imports)

```javascript
import { ContextWindowManager } from '../utils/ContextWindowManager.js';
```

#### 4b. Add to ClaudeStreamingServer Constructor (around line 280)

Find the constructor and add after other initializations:

```javascript
    // Context window management for accumulated tool results
    this.contextManager = new ContextWindowManager({
      maxTokenBudget: geminiConfig.contextWindow?.maxTokenBudget || 150000,
      compressionThreshold: geminiConfig.contextWindow?.compressionThreshold || 0.8,
      keepRecentResults: geminiConfig.contextWindow?.keepRecentResults || 3
    });
```

#### 4c. Modify collectToolResults Method (around line 1392)

Find the `collectToolResults` method and modify to track results:

```javascript
  async collectToolResults(toolCalls, activeTasks, streamingSession, onToolCall) {
    const toolResults = [];

    // Get context manager (from session or server instance)
    const contextManager = streamingSession?.contextManager || this.contextManager;

    const promises = toolCalls.map(async (toolCall) => {
      try {
        // ... existing tool execution code ...

        const result = await this.executeTool(toolCall, activeTasks, streamingSession);

        // NEW: Track in context manager if enabled
        if (contextManager && result.success && result.content) {
          try {
            await contextManager.addResult({
              content: result.content,
              name: toolCall.name,
              domain: null  // Will be inferred from tool name
            });
          } catch (contextError) {
            console.warn(`[ContextWindow] Failed to track result:`, contextError.message);
          }
        }

        return result;
      } catch (error) {
        // ... existing error handling ...
      }
    });

    // ... rest of existing code ...
  }
```

#### 4d. Reset Context on New Conversation (in processStreamWithToolHandling, around line 1058)

Add at the start of `processStreamWithToolHandling`:

```javascript
  async processStreamWithToolHandling(conversationHistory, tools, options = {}) {
    // Reset context manager for new conversation if specified
    if (options.resetContext && this.contextManager) {
      this.contextManager.reset();
    }

    // ... rest of existing code ...
  }
```

---

### Step 5: Add Domain Mapping Utility

**File:** `src/utils/domainMapping.js`

**Action:** Create new file (optional, for cleaner domain inference)

```javascript
/**
 * Maps tool names to domains for context grouping
 */

export const TOOL_DOMAIN_MAP = {
  // SEC / Securities
  'search_sec_filings': 'securities',
  'search_sec_filings_enhanced': 'securities',
  'search_sec_company_tickers': 'securities',
  'get_sec_filing': 'securities',

  // FDA / Pharmaceutical
  'search_fda_adverse_events': 'pharmaceutical',
  'search_fda_recalls': 'pharmaceutical',
  'search_fda_approvals': 'pharmaceutical',
  'search_fda_warning_letters': 'pharmaceutical',

  // EPA / Environmental
  'search_epa_violations': 'environmental',
  'search_epa_facilities': 'environmental',
  'get_epa_compliance': 'environmental',

  // Courts / Case Law
  'search_cases': 'case_law',
  'search_opinions': 'case_law',
  'get_case_details': 'case_law',
  'search_judges': 'case_law',

  // Federal Register
  'search_federal_register': 'federal_register',
  'search_federal_register_notices': 'federal_register',
  'search_federal_register_rules': 'federal_register',

  // USC / Legislation
  'search_us_code': 'legislation',
  'get_usc_section': 'legislation',
  'get_usc_titles': 'legislation',

  // Patents
  'search_patents': 'patent',
  'search_ptab_decisions': 'patent',
  'get_patent_details': 'patent',

  // Product Safety
  'search_cpsc_recalls': 'product_safety',
  'search_nhtsa_recalls': 'product_safety',
  'nhtsa_decode_vin': 'product_safety',

  // Antitrust
  'search_ftc_actions': 'antitrust'
};

/**
 * Get domain for a tool name
 * @param {string} toolName Tool name
 * @returns {string} Domain name
 */
export function getDomainForTool(toolName) {
  return TOOL_DOMAIN_MAP[toolName] || 'general';
}

export default { TOOL_DOMAIN_MAP, getDomainForTool };
```

---

### Step 6: Create Unit Test

**File:** `test/unit/test-context-window-manager.js`

**Action:** Create new test file

```javascript
/**
 * Unit tests for ContextWindowManager
 */

import { ContextWindowManager } from '../../src/utils/ContextWindowManager.js';

async function runTests() {
  console.log('='.repeat(60));
  console.log('ContextWindowManager Unit Tests');
  console.log('='.repeat(60));

  // Test 1: Token Estimation
  console.log('\n--- Test 1: Token Estimation ---');
  const manager = new ContextWindowManager({ maxTokenBudget: 1000 });

  const shortText = 'Hello world';  // 11 chars = ~3 tokens
  const longText = 'x'.repeat(400);  // 400 chars = 100 tokens

  console.log(`Short text (${shortText.length} chars): ${manager.estimateTokens(shortText)} tokens`);
  console.log(`Long text (${longText.length} chars): ${manager.estimateTokens(longText)} tokens`);

  const objContent = { key: 'value', nested: { data: 123 } };
  console.log(`Object content: ${manager.estimateTokens(objContent)} tokens`);

  // Test 2: Adding Results
  console.log('\n--- Test 2: Adding Results ---');
  const manager2 = new ContextWindowManager({
    maxTokenBudget: 500,  // Small budget for testing
    compressionThreshold: 0.8,
    keepRecentResults: 2
  });

  await manager2.addResult({ content: 'Result 1: ' + 'x'.repeat(100), name: 'search_sec_filings' });
  await manager2.addResult({ content: 'Result 2: ' + 'x'.repeat(100), name: 'search_fda_adverse_events' });
  await manager2.addResult({ content: 'Result 3: ' + 'x'.repeat(100), name: 'search_cases' });

  console.log('Status after 3 results:', manager2.getStatus());

  // Test 3: Domain Inference
  console.log('\n--- Test 3: Domain Inference ---');
  const testTools = [
    'search_sec_filings',
    'search_fda_recalls',
    'search_epa_violations',
    'search_cases',
    'unknown_tool'
  ];

  testTools.forEach(tool => {
    const domain = manager2._inferDomain(tool);
    console.log(`  ${tool} -> ${domain}`);
  });

  // Test 4: Compression Trigger
  console.log('\n--- Test 4: Compression Trigger ---');
  const manager3 = new ContextWindowManager({
    maxTokenBudget: 200,  // Very small to trigger compression
    compressionThreshold: 0.5,
    keepRecentResults: 1
  });

  console.log('Adding results to trigger compression...');
  await manager3.addResult({ content: 'First result with data', name: 'tool1' });
  await manager3.addResult({ content: 'Second result with more data', name: 'tool2' });
  await manager3.addResult({ content: 'Third result triggering compression', name: 'tool3' });
  await manager3.addResult({ content: 'Fourth result after compression', name: 'tool4' });

  console.log('Final status:', manager3.getStatus());

  // Test 5: Reset
  console.log('\n--- Test 5: Reset ---');
  manager3.reset();
  console.log('After reset:', manager3.getStatus());

  console.log('\n' + '='.repeat(60));
  console.log('All tests completed');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
```

---

### Step 7: Create Integration Test

**File:** `test/integration/test-context-overflow-prevention.js`

**Action:** Create integration test that simulates the overflow scenario

```javascript
/**
 * Integration test: Verify context overflow is prevented
 *
 * Simulates the Healthcare AI Regulatory Compliance query that
 * previously caused 207K token overflow.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ContextWindowManager } from '../../src/utils/ContextWindowManager.js';

async function simulateHeavyResearchWorkflow() {
  console.log('='.repeat(70));
  console.log('INTEGRATION TEST: Context Overflow Prevention');
  console.log('='.repeat(70));
  console.log('\nSimulating heavy research workflow (20+ tool calls)...\n');

  const manager = new ContextWindowManager({
    maxTokenBudget: 150000,
    compressionThreshold: 0.8,
    keepRecentResults: 3
  });

  // Simulate realistic tool results (varying sizes)
  const simulatedResults = [
    { name: 'search_federal_register', size: 15000, domain: 'federal_register' },
    { name: 'search_federal_register_rules', size: 12000, domain: 'federal_register' },
    { name: 'get_usc_section', size: 8000, domain: 'legislation' },
    { name: 'get_usc_section', size: 10000, domain: 'legislation' },
    { name: 'search_sec_filings', size: 18000, domain: 'securities' },
    { name: 'search_fda_adverse_events', size: 20000, domain: 'pharmaceutical' },
    { name: 'search_fda_recalls', size: 15000, domain: 'pharmaceutical' },
    { name: 'search_cases', size: 25000, domain: 'case_law' },
    { name: 'search_opinions', size: 22000, domain: 'case_law' },
    { name: 'search_epa_violations', size: 12000, domain: 'environmental' },
    { name: 'search_federal_register', size: 14000, domain: 'federal_register' },
    { name: 'get_usc_section', size: 9000, domain: 'legislation' },
    { name: 'search_sec_filings', size: 16000, domain: 'securities' },
    { name: 'search_fda_approvals', size: 11000, domain: 'pharmaceutical' },
    { name: 'search_cases', size: 20000, domain: 'case_law' },
    { name: 'search_patents', size: 18000, domain: 'patent' },
    { name: 'search_ptab_decisions', size: 15000, domain: 'patent' },
    { name: 'search_ftc_actions', size: 13000, domain: 'antitrust' },
    { name: 'search_cpsc_recalls', size: 10000, domain: 'product_safety' },
    { name: 'search_nhtsa_recalls', size: 12000, domain: 'product_safety' },
  ];

  // Total without compression: ~295,000 chars = ~74,000 tokens
  const totalCharsWithoutCompression = simulatedResults.reduce((sum, r) => sum + r.size, 0);
  console.log(`Total content without compression: ${totalCharsWithoutCompression.toLocaleString()} chars (~${Math.round(totalCharsWithoutCompression/4).toLocaleString()} tokens)`);
  console.log(`Claude limit: 200,000 tokens`);
  console.log(`Target budget: 150,000 tokens\n`);

  // Process each result
  for (let i = 0; i < simulatedResults.length; i++) {
    const result = simulatedResults[i];

    // Generate realistic-looking content
    const content = generateMockContent(result.domain, result.size);

    console.log(`[${i + 1}/${simulatedResults.length}] ${result.name} (${result.size.toLocaleString()} chars)`);

    await manager.addResult({
      content,
      name: result.name,
      domain: result.domain
    });

    const status = manager.getStatus();
    console.log(`   Status: ${status.utilization} used, ${status.resultCount} results, ${status.compressionCount} compressions`);

    // Small delay to respect rate limits if using real Gemini
    await new Promise(r => setTimeout(r, 100));
  }

  // Final status
  console.log('\n' + '='.repeat(70));
  console.log('FINAL STATUS');
  console.log('='.repeat(70));

  const finalStatus = manager.getStatus();
  console.log(`Current tokens: ${finalStatus.currentTokens.toLocaleString()}`);
  console.log(`Budget: ${finalStatus.maxBudget.toLocaleString()}`);
  console.log(`Utilization: ${finalStatus.utilization}`);
  console.log(`Result count: ${finalStatus.resultCount}`);
  console.log(`Compressions performed: ${finalStatus.compressionCount}`);
  console.log(`Domains tracked: ${finalStatus.domains.join(', ')}`);

  // Verify we stayed under budget
  const passed = finalStatus.currentTokens < finalStatus.maxBudget;
  console.log(`\nTEST ${passed ? 'PASSED' : 'FAILED'}: ${passed ? 'Stayed under budget' : 'Exceeded budget'}`);

  return passed;
}

function generateMockContent(domain, size) {
  const templates = {
    federal_register: `Federal Register Notice - ${domain}\n\nEffective Date: 2024-01-15\nDocket No: FDA-2024-N-0001\n\nSummary: This rule establishes requirements for...\n\n`,
    legislation: `21 U.S.C. § 360c - Classification of devices\n\n(a) Device classes...\n\n`,
    securities: `Form 10-K Annual Report\nCompany: Example Corp (EXMP)\nCIK: 0001234567\n\nRevenue: $1,234,567,890\nNet Income: $123,456,789\n\n`,
    pharmaceutical: `FDA Adverse Event Report\nDrug: Examplexin\nNDC: 12345-678-90\n\nSerious: Yes\nOutcome: Hospitalization\n\n`,
    case_law: `Brown v. Board of Education, 347 U.S. 483 (1954)\n\nHolding: Separate educational facilities are inherently unequal.\n\n`,
    environmental: `EPA Enforcement Action\nFacility: Example Manufacturing\nRegistry ID: 110000000001\n\nViolation: Clean Water Act\nPenalty: $500,000\n\n`,
    patent: `US Patent 10,000,000\nTitle: Method for Example Processing\nInventor: John Doe\n\nClaim 1: A method comprising...\n\n`,
    antitrust: `FTC Consent Decree\nMatter: In re Example Corp\nDocket: C-1234\n\nRelief: Divestiture of assets...\n\n`,
    product_safety: `CPSC Recall Notice\nProduct: Example Widget\nHazard: Choking hazard\nUnits: 50,000\n\n`
  };

  const template = templates[domain] || `Research finding for ${domain}:\n\n`;
  const padding = 'Lorem ipsum dolor sit amet. '.repeat(Math.ceil(size / 30));

  return template + padding.substring(0, size - template.length);
}

// Run test
simulateHeavyResearchWorkflow()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
```

---

## Environment Variables

Add to `.env.example`:

```bash
# Context Window Management
CONTEXT_MAX_TOKENS=150000          # Max tokens before requiring compression
CONTEXT_COMPRESSION_THRESHOLD=0.8  # Trigger compression at 80% of budget
CONTEXT_KEEP_RECENT=3              # Keep 3 most recent results uncompressed
CONTEXT_MANAGEMENT_ENABLED=true    # Enable/disable context management
```

---

## Verification Checklist

After implementation, verify:

- [ ] `ContextWindowManager.js` created in `src/utils/`
- [ ] Configuration added to `geminiConfig.js`
- [ ] Import added to `claude-server-v2.js`
- [ ] Constructor instantiates ContextWindowManager
- [ ] `collectToolResults()` calls `contextManager.addResult()`
- [ ] Unit tests pass: `node test/unit/test-context-window-manager.js`
- [ ] Integration test passes: `node test/integration/test-context-overflow-prevention.js`
- [ ] Live test: Healthcare AI query completes without 200K overflow

---

## Expected Behavior

```
Tool calls 1-5:   Results added normally (~30K tokens)
Tool calls 6-10:  Approaching threshold (~80K tokens)
Tool call 11:     [ContextWindowManager] Threshold reached, compressing...
                  [ContextWindowManager] Compression #1: 60000 -> 8000 tokens (87% reduction)
Tool calls 12-20: Continue with fresh budget
                  More compressions as needed

Final: ~100K tokens used, well under 200K limit
```

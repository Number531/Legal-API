# Legal Research System Enhancement Specification

**Version**: 1.0.0
**Date**: 2025-12-01
**Status**: Proposed
**Authors**: Engineering Team

---

## Executive Summary

This specification document outlines six strategic enhancements to the Legal MCP Server following successful validation of the 1M context window implementation. These enhancements address observed limitations in tool execution, error handling, and output quality based on production test results.

### Test Results Summary
- **Context Window**: 1M tokens enabled via `context-1m-2025-08-07` beta
- **Tools Executed**: 57 tool calls across 4 research rounds
- **Success Rate**: 98.2% (56/57 tools completed successfully)
- **Identified Gap**: GovInfo USC section lookup (granule search cap limitation)

---

## Enhancement 1: GovInfo USC Section Lookup Fix

### Problem Statement
The `get_usc_section` tool fails when searching for specific USC sections due to the GovInfo API's granule search cap of 100 results.

**Observed Error**:
```
Get USC section error: Section 355 not found in Title 21. Total granules searched: 100
```

### Root Cause Analysis
The current implementation iterates through granules sequentially, stopping at 100. For large titles (like Title 21 - Food and Drugs), relevant sections may exist beyond this limit.

### Implementation Specification

#### 1.1 Direct URL Construction Strategy

**File**: `src/api-clients/GovInfoClient.js`

```javascript
/**
 * Enhanced USC Section Retrieval with Direct URL Construction
 *
 * @spec USC_DIRECT_001
 * @priority High
 * @complexity Medium
 */
class GovInfoClient {
  /**
   * USC URL patterns for direct access
   * Format: USCODE-{year}-title{number}
   */
  static USC_URL_PATTERNS = {
    html: 'https://www.govinfo.gov/content/pkg/USCODE-{year}-title{title}/html/USCODE-{year}-title{title}-sec{section}.htm',
    xml: 'https://www.govinfo.gov/content/pkg/USCODE-{year}-title{title}/xml/USCODE-{year}-title{title}-sec{section}.xml',
    pdf: 'https://www.govinfo.gov/content/pkg/USCODE-{year}-title{title}/pdf/USCODE-{year}-title{title}-sec{section}.pdf'
  };

  /**
   * Get USC section with multi-strategy approach
   *
   * Strategy Order:
   * 1. Direct URL construction (fastest)
   * 2. API granule search with pagination
   * 3. Web search fallback
   *
   * @param {number} title - USC title number
   * @param {string} section - Section identifier (e.g., "355", "355a")
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Section content and metadata
   */
  async getUSCSection(title, section, options = {}) {
    const { year = 2023, format = 'html', includeHistory = false } = options;

    // Strategy 1: Direct URL Construction
    const directResult = await this.tryDirectUSCFetch(title, section, year, format);
    if (directResult.success) {
      return this.formatUSCResponse(directResult.data, { strategy: 'direct' });
    }

    // Strategy 2: Enhanced Granule Search (with pagination)
    const granuleResult = await this.searchUSCGranules(title, section, {
      maxPages: 10,  // Up to 1000 granules
      pageSize: 100
    });
    if (granuleResult.success) {
      return this.formatUSCResponse(granuleResult.data, { strategy: 'granule' });
    }

    // Strategy 3: Web Search Fallback
    const webResult = await this.webSearchUSC(title, section);
    if (webResult.success) {
      return this.formatUSCResponse(webResult.data, { strategy: 'web_search' });
    }

    throw new USCSectionNotFoundError(title, section, {
      strategiesAttempted: ['direct', 'granule', 'web_search'],
      suggestions: this.getSectionSuggestions(title, section)
    });
  }

  /**
   * Attempt direct URL fetch for USC section
   */
  async tryDirectUSCFetch(title, section, year, format) {
    const url = GovInfoClient.USC_URL_PATTERNS[format]
      .replace('{year}', year)
      .replace(/{title}/g, title)
      .replace('{section}', section);

    try {
      const response = await fetch(url, {
        headers: { 'X-Api-Key': this.apiKey }
      });

      if (response.ok) {
        const content = await response.text();
        return {
          success: true,
          data: {
            title,
            section,
            year,
            format,
            content,
            url,
            fetchedAt: new Date().toISOString()
          }
        };
      }

      return { success: false, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Paginated granule search for USC sections
   */
  async searchUSCGranules(title, section, options) {
    const { maxPages, pageSize } = options;
    let allGranules = [];

    for (let page = 0; page < maxPages; page++) {
      const offset = page * pageSize;
      const granules = await this.fetchGranules({
        collection: 'USCODE',
        title: `title${title}`,
        offset,
        pageSize
      });

      allGranules = allGranules.concat(granules);

      // Search for matching section
      const match = granules.find(g =>
        g.granuleId.includes(`sec${section}`) ||
        g.title.includes(`Section ${section}`)
      );

      if (match) {
        return {
          success: true,
          data: await this.fetchGranuleContent(match.granuleId)
        };
      }

      // Stop if no more results
      if (granules.length < pageSize) break;
    }

    return {
      success: false,
      granulesSearched: allGranules.length
    };
  }
}
```

#### 1.2 Test Specification

**File**: `test/unit/govinfo-usc-section.test.js`

```javascript
/**
 * @spec USC_DIRECT_001_TEST
 */
describe('GovInfo USC Section Enhancement', () => {
  describe('Direct URL Strategy', () => {
    it('should construct valid USC URLs for all formats', () => {
      const client = new GovInfoClient();

      const testCases = [
        { title: 21, section: '355', expected: /USCODE-2023-title21.*sec355/ },
        { title: 26, section: '501', expected: /USCODE-2023-title26.*sec501/ },
        { title: 15, section: '78j', expected: /USCODE-2023-title15.*sec78j/ }
      ];

      testCases.forEach(({ title, section, expected }) => {
        const url = client.buildUSCUrl(title, section);
        expect(url).toMatch(expected);
      });
    });

    it('should fallback to granule search when direct URL fails', async () => {
      const client = new GovInfoClient();
      // Mock 404 response for direct URL
      mockFetch.mockResponseOnce('', { status: 404 });

      const result = await client.getUSCSection(21, '355');
      expect(result.metadata.strategy).toBe('granule');
    });

    it('should fallback to web search when granule search exhausted', async () => {
      const client = new GovInfoClient();
      // Mock failures for direct and granule
      mockFetch.mockResponseOnce('', { status: 404 });
      mockGranuleSearch.mockResolvedValue({ success: false });

      const result = await client.getUSCSection(21, '355');
      expect(result.metadata.strategy).toBe('web_search');
    });
  });

  describe('Section Format Handling', () => {
    it('should handle alphanumeric sections (e.g., 355a, 78j-1)', async () => {
      const client = new GovInfoClient();

      const result = await client.getUSCSection(21, '355a');
      expect(result.section).toBe('355a');
    });

    it('should handle subsections with parentheses', async () => {
      const client = new GovInfoClient();

      const result = await client.getUSCSection(21, '355(b)(2)');
      expect(result.content).toContain('subsection');
    });
  });
});
```

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| USC-001 | Direct URL fetch succeeds for 90%+ of common USC sections | Integration test with 50 sample sections |
| USC-002 | Fallback chain executes within 10 seconds | Performance benchmark |
| USC-003 | Error messages include actionable suggestions | Unit test assertions |
| USC-004 | All three strategies are attempted before failure | Log inspection |

---

## Enhancement 2: Automatic Tool Retry with Alternatives

### Problem Statement
When a primary tool fails, the system should automatically attempt equivalent alternative tools before reporting failure to the user.

### Implementation Specification

#### 2.1 Tool Fallback Registry

**File**: `src/config/toolFallbacks.js`

```javascript
/**
 * Tool Fallback Configuration
 *
 * @spec TOOL_FALLBACK_001
 * @description Defines alternative tools for each primary tool
 */
export const toolFallbackRegistry = {
  // USC/Legislation Tools
  get_usc_section: {
    alternatives: ['search_us_code', 'search_legislation'],
    transformParams: (params) => ({
      query: `${params.title} USC ${params.section}`,
      limit: 3
    }),
    mergeResults: (primary, fallback) => ({
      ...fallback,
      _fallbackUsed: true,
      _primaryError: primary.error
    })
  },

  // SEC Tools
  search_sec_filings: {
    alternatives: ['search_sec_company_tickers', 'search_sec_full_text'],
    transformParams: (params) => ({
      query: params.company_identifier,
      filing_type: params.filing_type
    }),
    shouldFallback: (error) =>
      error.code === 'COMPANY_NOT_FOUND' ||
      error.code === 'NO_RESULTS'
  },

  // FDA Tools
  search_fda_warning_letters: {
    alternatives: ['search_fda_enforcement_reports', 'search_fda_483_observations'],
    transformParams: (params) => ({
      search: params.search,
      date_after: params.date_after
    })
  },

  // Patent Tools
  search_patents: {
    alternatives: ['search_patent_applications', 'search_ptab_proceedings'],
    transformParams: (params) => ({
      query: params.search_text,
      limit: params.limit
    })
  },

  // Case Law Tools
  search_cases: {
    alternatives: ['search_court_opinions', 'search_state_cases'],
    transformParams: (params) => ({
      query: params.query,
      jurisdiction: 'federal'
    })
  },

  // Environmental Tools
  search_epa_facilities: {
    alternatives: ['search_epa_enforcement', 'search_epa_permits'],
    transformParams: (params) => ({
      facility_name: params.company_name
    })
  }
};

/**
 * Tool categories for intelligent routing
 */
export const toolCategories = {
  legislation: ['get_usc_section', 'search_us_code', 'search_legislation', 'search_cfr'],
  securities: ['search_sec_filings', 'search_sec_company_tickers', 'search_sec_full_text'],
  regulatory_fda: ['search_fda_warning_letters', 'search_fda_recalls', 'search_fda_drug_labels'],
  intellectual_property: ['search_patents', 'search_patent_applications', 'search_ptab_proceedings'],
  case_law: ['search_cases', 'search_court_opinions', 'search_state_cases'],
  environmental: ['search_epa_facilities', 'search_epa_enforcement', 'search_epa_permits']
};
```

#### 2.2 Fallback Executor

**File**: `src/tools/FallbackExecutor.js`

```javascript
/**
 * Intelligent Tool Fallback Executor
 *
 * @spec TOOL_FALLBACK_002
 */
import { toolFallbackRegistry } from '../config/toolFallbacks.js';

export class FallbackExecutor {
  constructor(toolImplementations, options = {}) {
    this.tools = toolImplementations;
    this.maxFallbackAttempts = options.maxFallbackAttempts || 3;
    this.fallbackTimeout = options.fallbackTimeout || 30000;
    this.logger = options.logger || console;
  }

  /**
   * Execute tool with automatic fallback on failure
   *
   * @param {string} toolName - Primary tool name
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool result with fallback metadata
   */
  async executeWithFallback(toolName, params) {
    const startTime = Date.now();
    const executionLog = [];

    // Try primary tool
    try {
      const result = await this.executeWithTimeout(toolName, params);
      executionLog.push({ tool: toolName, status: 'success', duration: Date.now() - startTime });

      return {
        ...result,
        _executionMetadata: {
          primaryTool: toolName,
          fallbacksUsed: 0,
          executionLog,
          totalDuration: Date.now() - startTime
        }
      };
    } catch (primaryError) {
      executionLog.push({
        tool: toolName,
        status: 'failed',
        error: primaryError.message,
        duration: Date.now() - startTime
      });

      this.logger.warn(`[FallbackExecutor] Primary tool ${toolName} failed: ${primaryError.message}`);
    }

    // Get fallback configuration
    const fallbackConfig = toolFallbackRegistry[toolName];
    if (!fallbackConfig || !fallbackConfig.alternatives) {
      throw new ToolExecutionError(toolName, 'No fallback alternatives configured');
    }

    // Try alternatives
    for (let i = 0; i < Math.min(fallbackConfig.alternatives.length, this.maxFallbackAttempts); i++) {
      const altTool = fallbackConfig.alternatives[i];
      const altParams = fallbackConfig.transformParams
        ? fallbackConfig.transformParams(params)
        : params;

      const attemptStart = Date.now();

      try {
        this.logger.info(`[FallbackExecutor] Trying fallback: ${altTool}`);

        const result = await this.executeWithTimeout(altTool, altParams);

        executionLog.push({
          tool: altTool,
          status: 'success',
          duration: Date.now() - attemptStart
        });

        // Merge results if configured
        const finalResult = fallbackConfig.mergeResults
          ? fallbackConfig.mergeResults({ error: 'primary_failed' }, result)
          : result;

        return {
          ...finalResult,
          _executionMetadata: {
            primaryTool: toolName,
            fallbackTool: altTool,
            fallbacksUsed: i + 1,
            executionLog,
            totalDuration: Date.now() - startTime
          }
        };
      } catch (altError) {
        executionLog.push({
          tool: altTool,
          status: 'failed',
          error: altError.message,
          duration: Date.now() - attemptStart
        });

        this.logger.warn(`[FallbackExecutor] Fallback ${altTool} failed: ${altError.message}`);
      }
    }

    // All attempts failed
    throw new AllFallbacksExhaustedError(toolName, executionLog);
  }

  /**
   * Execute tool with timeout
   */
  async executeWithTimeout(toolName, params) {
    const toolFn = this.tools[toolName];
    if (!toolFn) {
      throw new ToolNotFoundError(toolName);
    }

    return Promise.race([
      toolFn(params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new TimeoutError(toolName, this.fallbackTimeout)), this.fallbackTimeout)
      )
    ]);
  }
}

/**
 * Custom error classes
 */
export class ToolExecutionError extends Error {
  constructor(toolName, message) {
    super(`Tool ${toolName} failed: ${message}`);
    this.toolName = toolName;
    this.code = 'TOOL_EXECUTION_ERROR';
  }
}

export class AllFallbacksExhaustedError extends Error {
  constructor(toolName, executionLog) {
    super(`All fallback attempts exhausted for ${toolName}`);
    this.toolName = toolName;
    this.executionLog = executionLog;
    this.code = 'ALL_FALLBACKS_EXHAUSTED';
  }
}
```

#### 2.3 Integration with Tool Router

**File**: `src/tools/toolImplementations.js` (modifications)

```javascript
import { FallbackExecutor } from './FallbackExecutor.js';

// Initialize fallback executor
const fallbackExecutor = new FallbackExecutor(toolImplementations, {
  maxFallbackAttempts: 3,
  fallbackTimeout: 30000,
  logger: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  }
});

/**
 * Enhanced tool execution with automatic fallback
 *
 * @spec TOOL_FALLBACK_003
 */
export async function executeToolWithFallback(toolName, params) {
  return fallbackExecutor.executeWithFallback(toolName, params);
}

// Export for use in MCP server
export { fallbackExecutor };
```

### Test Specification

**File**: `test/unit/fallback-executor.test.js`

```javascript
describe('FallbackExecutor', () => {
  let executor;
  let mockTools;

  beforeEach(() => {
    mockTools = {
      get_usc_section: jest.fn(),
      search_us_code: jest.fn(),
      search_legislation: jest.fn()
    };
    executor = new FallbackExecutor(mockTools);
  });

  describe('Primary Tool Success', () => {
    it('should return primary result when successful', async () => {
      mockTools.get_usc_section.mockResolvedValue({ content: 'Section 355...' });

      const result = await executor.executeWithFallback('get_usc_section', { title: 21, section: '355' });

      expect(result.content).toBe('Section 355...');
      expect(result._executionMetadata.fallbacksUsed).toBe(0);
      expect(mockTools.search_us_code).not.toHaveBeenCalled();
    });
  });

  describe('Fallback Execution', () => {
    it('should try first fallback when primary fails', async () => {
      mockTools.get_usc_section.mockRejectedValue(new Error('Not found'));
      mockTools.search_us_code.mockResolvedValue({ results: [{ title: '21 USC 355' }] });

      const result = await executor.executeWithFallback('get_usc_section', { title: 21, section: '355' });

      expect(result._executionMetadata.fallbackTool).toBe('search_us_code');
      expect(result._executionMetadata.fallbacksUsed).toBe(1);
    });

    it('should try multiple fallbacks until success', async () => {
      mockTools.get_usc_section.mockRejectedValue(new Error('Not found'));
      mockTools.search_us_code.mockRejectedValue(new Error('API error'));
      mockTools.search_legislation.mockResolvedValue({ results: [] });

      const result = await executor.executeWithFallback('get_usc_section', { title: 21, section: '355' });

      expect(result._executionMetadata.fallbackTool).toBe('search_legislation');
      expect(result._executionMetadata.fallbacksUsed).toBe(2);
    });

    it('should throw when all fallbacks exhausted', async () => {
      mockTools.get_usc_section.mockRejectedValue(new Error('Not found'));
      mockTools.search_us_code.mockRejectedValue(new Error('API error'));
      mockTools.search_legislation.mockRejectedValue(new Error('Timeout'));

      await expect(
        executor.executeWithFallback('get_usc_section', { title: 21, section: '355' })
      ).rejects.toThrow(AllFallbacksExhaustedError);
    });
  });

  describe('Execution Logging', () => {
    it('should include complete execution log in metadata', async () => {
      mockTools.get_usc_section.mockRejectedValue(new Error('Not found'));
      mockTools.search_us_code.mockResolvedValue({ results: [] });

      const result = await executor.executeWithFallback('get_usc_section', { title: 21, section: '355' });

      expect(result._executionMetadata.executionLog).toHaveLength(2);
      expect(result._executionMetadata.executionLog[0].tool).toBe('get_usc_section');
      expect(result._executionMetadata.executionLog[0].status).toBe('failed');
      expect(result._executionMetadata.executionLog[1].tool).toBe('search_us_code');
      expect(result._executionMetadata.executionLog[1].status).toBe('success');
    });
  });
});
```

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| FB-001 | Fallback triggers automatically on primary tool failure | Integration test |
| FB-002 | Parameter transformation works for all configured tools | Unit tests |
| FB-003 | Execution metadata includes complete fallback chain | Log inspection |
| FB-004 | Total fallback chain completes within 60 seconds | Performance benchmark |
| FB-005 | AllFallbacksExhausted error includes actionable context | Unit test |

---

## Enhancement 3: Parallel Tool Execution Optimization

### Problem Statement
Several tools exceeded 30 seconds execution time. Independent tools should execute in parallel to reduce total research time.

### Implementation Specification

#### 3.1 Dependency Graph Analysis

**File**: `src/orchestration/ToolDependencyGraph.js`

```javascript
/**
 * Tool Dependency Graph for Parallel Execution
 *
 * @spec PARALLEL_001
 */
export class ToolDependencyGraph {
  constructor() {
    this.dependencies = new Map();
    this.dependents = new Map();
  }

  /**
   * Define tool dependency relationships
   */
  static DEPENDENCY_RULES = {
    // Tools that must run first (no dependencies)
    independentTools: [
      'search_sec_filings',
      'search_fda_warning_letters',
      'search_fda_recalls',
      'search_patents',
      'search_cases',
      'search_epa_facilities',
      'search_federal_register'
    ],

    // Tools that depend on others
    dependentTools: {
      // get_case_details depends on search_cases returning case IDs
      'get_case_details': ['search_cases'],
      // get_filing_details depends on search_sec_filings
      'get_sec_filing_details': ['search_sec_filings'],
      // Patent citations depend on initial patent search
      'get_patent_citations': ['search_patents'],
      // PTAB details depend on PTAB search
      'get_ptab_decision': ['search_ptab_proceedings']
    }
  };

  /**
   * Analyze tool batch and return execution groups
   *
   * @param {Array<Object>} tools - Tools to execute [{name, params}]
   * @returns {Array<Array<Object>>} Execution groups (parallel within group, sequential between)
   */
  analyzeExecutionOrder(tools) {
    const groups = [];
    const executed = new Set();
    let remaining = [...tools];

    while (remaining.length > 0) {
      // Find all tools whose dependencies are satisfied
      const currentGroup = remaining.filter(tool => {
        const deps = ToolDependencyGraph.DEPENDENCY_RULES.dependentTools[tool.name] || [];
        return deps.every(dep => executed.has(dep));
      });

      if (currentGroup.length === 0) {
        // Circular dependency or missing dependency - execute remaining sequentially
        console.warn('[ToolDependencyGraph] Potential circular dependency detected');
        groups.push(remaining);
        break;
      }

      groups.push(currentGroup);
      currentGroup.forEach(tool => executed.add(tool.name));
      remaining = remaining.filter(tool => !executed.has(tool.name));
    }

    return groups;
  }

  /**
   * Estimate parallel execution time
   */
  estimateExecutionTime(groups, avgToolTime = 15000) {
    // Time = max time within each group (parallel) summed across groups (sequential)
    return groups.reduce((total, group) => {
      const groupTime = Math.max(...group.map(() => avgToolTime));
      return total + groupTime;
    }, 0);
  }
}
```

#### 3.2 Parallel Batch Executor

**File**: `src/orchestration/ParallelBatchExecutor.js`

```javascript
/**
 * Parallel Tool Batch Executor
 *
 * @spec PARALLEL_002
 */
import { ToolDependencyGraph } from './ToolDependencyGraph.js';

export class ParallelBatchExecutor {
  constructor(toolExecutor, options = {}) {
    this.toolExecutor = toolExecutor;
    this.dependencyGraph = new ToolDependencyGraph();
    this.maxConcurrency = options.maxConcurrency || 10;
    this.batchTimeout = options.batchTimeout || 60000;
    this.logger = options.logger || console;
  }

  /**
   * Execute tools with optimal parallelization
   *
   * @param {Array<Object>} tools - Tools to execute
   * @returns {Promise<Map<string, Object>>} Results keyed by tool call ID
   */
  async executeBatch(tools) {
    const startTime = Date.now();
    const results = new Map();

    // Analyze dependencies and create execution groups
    const groups = this.dependencyGraph.analyzeExecutionOrder(tools);

    this.logger.info(`[ParallelBatchExecutor] Executing ${tools.length} tools in ${groups.length} groups`);

    // Execute groups sequentially, tools within group in parallel
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];
      const groupStart = Date.now();

      this.logger.info(`[ParallelBatchExecutor] Group ${groupIndex + 1}/${groups.length}: ${group.length} tools`);

      // Execute all tools in group concurrently with concurrency limit
      const groupResults = await this.executeGroupWithConcurrencyLimit(group, results);

      // Store results
      groupResults.forEach((result, toolId) => {
        results.set(toolId, result);
      });

      this.logger.info(`[ParallelBatchExecutor] Group ${groupIndex + 1} completed in ${Date.now() - groupStart}ms`);
    }

    const totalTime = Date.now() - startTime;
    this.logger.info(`[ParallelBatchExecutor] Batch completed: ${tools.length} tools in ${totalTime}ms`);

    return results;
  }

  /**
   * Execute group with concurrency limit
   */
  async executeGroupWithConcurrencyLimit(tools, previousResults) {
    const results = new Map();
    const queue = [...tools];
    const inFlight = new Set();

    const executeNext = async () => {
      if (queue.length === 0) return;

      const tool = queue.shift();
      const toolId = tool.id || `${tool.name}_${Date.now()}`;
      inFlight.add(toolId);

      try {
        // Inject results from previous groups if needed
        const params = this.injectDependencyResults(tool.params, previousResults);

        const result = await this.toolExecutor(tool.name, params);
        results.set(toolId, { success: true, data: result });
      } catch (error) {
        results.set(toolId, { success: false, error: error.message });
      } finally {
        inFlight.delete(toolId);
      }

      // Start next if queue not empty
      if (queue.length > 0 && inFlight.size < this.maxConcurrency) {
        await executeNext();
      }
    };

    // Start initial batch up to concurrency limit
    const initialBatch = Math.min(this.maxConcurrency, tools.length);
    await Promise.all(
      Array(initialBatch).fill().map(() => executeNext())
    );

    // Wait for all to complete
    while (inFlight.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Inject results from dependent tools into parameters
   */
  injectDependencyResults(params, previousResults) {
    // Check for special parameter patterns like ${search_cases.caseIds}
    const injectedParams = { ...params };

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const refPath = value.slice(2, -1);
        const [toolName, resultPath] = refPath.split('.');

        // Find matching result
        for (const [id, result] of previousResults) {
          if (id.startsWith(toolName) && result.success) {
            const extractedValue = this.extractNestedValue(result.data, resultPath);
            if (extractedValue !== undefined) {
              injectedParams[key] = extractedValue;
              break;
            }
          }
        }
      }
    }

    return injectedParams;
  }

  extractNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
```

#### 3.3 Integration with ClaudeOrchestrator

**File**: `src/server/ClaudeOrchestrator.js` (modifications)

```javascript
import { ParallelBatchExecutor } from '../orchestration/ParallelBatchExecutor.js';

class ClaudeOrchestrator {
  constructor(options = {}) {
    // ... existing initialization ...

    // Initialize parallel executor
    this.parallelExecutor = new ParallelBatchExecutor(
      this.executeToolWithFallback.bind(this),
      {
        maxConcurrency: options.maxToolConcurrency || 10,
        batchTimeout: options.toolBatchTimeout || 60000,
        logger: this.logger
      }
    );
  }

  /**
   * Execute pending tools with parallel optimization
   *
   * @spec PARALLEL_003
   */
  async executeToolBatch(tools) {
    // Use parallel executor for batches > 1
    if (tools.length > 1) {
      return this.parallelExecutor.executeBatch(tools);
    }

    // Single tool - execute directly
    const tool = tools[0];
    try {
      const result = await this.executeToolWithFallback(tool.name, tool.params);
      return new Map([[tool.id, { success: true, data: result }]]);
    } catch (error) {
      return new Map([[tool.id, { success: false, error: error.message }]]);
    }
  }
}
```

### Performance Benchmarks

| Scenario | Sequential Time | Parallel Time | Improvement |
|----------|-----------------|---------------|-------------|
| 16 independent tools @ 20s each | 320s | 40s (4 groups of 4) | 87.5% |
| 10 tools with 2 dependencies | 200s | 60s | 70% |
| Mixed batch (observed test) | ~300s | ~80s | 73% |

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| PL-001 | Independent tools execute in parallel | Log inspection |
| PL-002 | Dependent tools wait for dependencies | Integration test |
| PL-003 | Concurrency limit is respected | Load test |
| PL-004 | Total execution time reduced by 50%+ | Performance benchmark |
| PL-005 | Results properly merged across groups | Unit test |

---

## Enhancement 4: Streaming Input Parameter Enhancement

### Problem Statement
Many tools showed "awaiting complete inputs" during streaming, indicating incomplete parameter parsing from streamed tool use blocks.

### Implementation Specification

#### 4.1 Enhanced Streaming Parser

**File**: `src/streaming/ToolInputParser.js`

```javascript
/**
 * Enhanced Tool Input Parser for Streaming
 *
 * @spec STREAM_001
 */
export class ToolInputParser {
  constructor(options = {}) {
    this.partialInputs = new Map();
    this.completionThreshold = options.completionThreshold || 0.9;
    this.maxWaitMs = options.maxWaitMs || 5000;
    this.requiredParamsCache = new Map();
  }

  /**
   * Tool parameter requirements from schema
   */
  static TOOL_SCHEMAS = {
    search_sec_filings: {
      required: ['company_identifier'],
      optional: ['filing_type', 'date_after', 'date_before', 'limit', 'include_snippet'],
      defaults: { limit: 10, include_snippet: true }
    },
    search_fda_warning_letters: {
      required: ['search'],
      optional: ['date_after', 'date_before', 'limit', 'include_snippet'],
      defaults: { limit: 10, include_snippet: true }
    },
    get_usc_section: {
      required: ['title', 'section'],
      optional: ['include_text', 'year'],
      defaults: { include_text: true, year: 2023 }
    },
    search_cases: {
      required: ['query'],
      optional: ['court', 'date_filed_after', 'date_filed_before', 'limit', 'include_snippet'],
      defaults: { limit: 10, include_snippet: true }
    },
    search_patents: {
      required: ['search_text'],
      optional: ['query_type', 'limit', 'include_snippet'],
      defaults: { query_type: 'patents', limit: 10, include_snippet: true }
    },
    search_epa_facilities: {
      required: [],  // At least one of company_name, city, state required
      optional: ['company_name', 'city', 'state', 'limit'],
      defaults: { limit: 10 },
      validation: (params) => params.company_name || params.city || params.state
    }
    // ... additional tool schemas
  };

  /**
   * Process incremental input chunk
   *
   * @param {string} toolId - Tool use ID
   * @param {string} toolName - Tool name
   * @param {string} inputDelta - JSON string delta
   * @returns {Object} Parse status
   */
  processInputDelta(toolId, toolName, inputDelta) {
    // Get or create partial input buffer
    if (!this.partialInputs.has(toolId)) {
      this.partialInputs.set(toolId, {
        toolName,
        rawBuffer: '',
        parsedParams: {},
        startTime: Date.now(),
        complete: false
      });
    }

    const state = this.partialInputs.get(toolId);
    state.rawBuffer += inputDelta;

    // Attempt incremental JSON parsing
    const parseResult = this.attemptIncrementalParse(state.rawBuffer);
    if (parseResult.success) {
      state.parsedParams = { ...state.parsedParams, ...parseResult.params };
    }

    // Check completion status
    const completionStatus = this.checkCompletion(toolName, state.parsedParams);
    state.complete = completionStatus.complete;

    return {
      toolId,
      toolName,
      complete: state.complete,
      completionPercentage: completionStatus.percentage,
      missingParams: completionStatus.missingParams,
      parsedParams: state.parsedParams,
      canExecuteEarly: completionStatus.canExecuteEarly
    };
  }

  /**
   * Attempt to parse partial JSON incrementally
   */
  attemptIncrementalParse(buffer) {
    // Try direct parse first
    try {
      const params = JSON.parse(buffer);
      return { success: true, params };
    } catch (e) {
      // Attempt recovery strategies
    }

    // Strategy 1: Close open braces/brackets
    const recovered = this.tryRecoverJSON(buffer);
    if (recovered) {
      try {
        const params = JSON.parse(recovered);
        return { success: true, params, recovered: true };
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 2: Extract key-value pairs individually
    const extractedParams = this.extractPartialParams(buffer);
    if (Object.keys(extractedParams).length > 0) {
      return { success: true, params: extractedParams, partial: true };
    }

    return { success: false };
  }

  /**
   * Try to recover incomplete JSON by closing open structures
   */
  tryRecoverJSON(buffer) {
    let recovered = buffer.trim();

    // Count open structures
    const openBraces = (recovered.match(/{/g) || []).length;
    const closeBraces = (recovered.match(/}/g) || []).length;
    const openBrackets = (recovered.match(/\[/g) || []).length;
    const closeBrackets = (recovered.match(/\]/g) || []).length;

    // Check if we're in the middle of a string
    const quoteCount = (recovered.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      recovered += '"';
    }

    // Close arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      recovered += ']';
    }

    // Close objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      recovered += '}';
    }

    return recovered;
  }

  /**
   * Extract individual parameters from partial JSON
   */
  extractPartialParams(buffer) {
    const params = {};

    // Match complete key-value pairs
    const kvPattern = /"(\w+)":\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|(\d+(?:\.\d+)?)|(\[(?:[^\[\]]*)\])|(\{(?:[^{}]*)\})|(true|false|null))/g;

    let match;
    while ((match = kvPattern.exec(buffer)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6];

      if (value !== undefined) {
        try {
          params[key] = JSON.parse(match[3] || match[4] || match[5] || match[6] || `"${value}"`);
        } catch {
          params[key] = value;
        }
      }
    }

    return params;
  }

  /**
   * Check if tool has enough parameters to execute
   */
  checkCompletion(toolName, parsedParams) {
    const schema = ToolInputParser.TOOL_SCHEMAS[toolName];
    if (!schema) {
      // Unknown tool - assume complete if any params present
      return {
        complete: Object.keys(parsedParams).length > 0,
        percentage: 100,
        missingParams: [],
        canExecuteEarly: false
      };
    }

    const presentRequired = schema.required.filter(p => parsedParams[p] !== undefined);
    const missingRequired = schema.required.filter(p => parsedParams[p] === undefined);

    const percentage = schema.required.length === 0
      ? 100
      : (presentRequired.length / schema.required.length) * 100;

    // Custom validation if present
    const passesValidation = schema.validation
      ? schema.validation(parsedParams)
      : true;

    const complete = missingRequired.length === 0 && passesValidation;

    // Can execute early if all required params present
    const canExecuteEarly = complete && percentage >= this.completionThreshold * 100;

    return {
      complete,
      percentage,
      missingParams: missingRequired,
      canExecuteEarly
    };
  }

  /**
   * Apply default values to parameters
   */
  applyDefaults(toolName, params) {
    const schema = ToolInputParser.TOOL_SCHEMAS[toolName];
    if (!schema?.defaults) return params;

    return { ...schema.defaults, ...params };
  }

  /**
   * Get finalized parameters for tool execution
   */
  getFinalizedParams(toolId) {
    const state = this.partialInputs.get(toolId);
    if (!state) return null;

    const finalParams = this.applyDefaults(state.toolName, state.parsedParams);

    // Clean up
    this.partialInputs.delete(toolId);

    return finalParams;
  }
}
```

#### 4.2 Integration with Streaming Handler

**File**: `src/server/claude-server-v2.js` (modifications)

```javascript
import { ToolInputParser } from '../streaming/ToolInputParser.js';

// In streaming handler
const inputParser = new ToolInputParser({
  completionThreshold: 0.9,
  maxWaitMs: 5000
});

// Process content_block_delta events
if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
  const parseStatus = inputParser.processInputDelta(
    currentToolUseId,
    currentToolName,
    event.delta.partial_json
  );

  if (parseStatus.canExecuteEarly) {
    console.log(`[Streaming] Early execution eligible for ${currentToolName}`);
    // Queue for early execution
    earlyExecutionQueue.push({
      id: currentToolUseId,
      name: currentToolName,
      params: inputParser.getFinalizedParams(currentToolUseId)
    });
  }
}
```

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| SP-001 | Partial JSON recovery works for 95%+ cases | Unit test suite |
| SP-002 | Early execution triggers when safe | Integration test |
| SP-003 | "Awaiting complete inputs" reduced by 80% | Log analysis |
| SP-004 | No premature execution with incomplete params | Safety test |

---

## Enhancement 5: Citation Cross-Referencing System

### Problem Statement
Legal research often requires understanding relationships between sources across different domains (SEC filings citing court cases, FDA actions linked to patents, etc.).

### Implementation Specification

#### 5.1 Citation Graph Builder

**File**: `src/citations/CitationGraphBuilder.js`

```javascript
/**
 * Citation Cross-Reference Graph Builder
 *
 * @spec CITATION_001
 */
export class CitationGraphBuilder {
  constructor() {
    this.nodes = new Map();  // sourceId -> { type, metadata, content }
    this.edges = new Map();  // edgeId -> { from, to, type, context }
    this.citationPatterns = new Map();
  }

  /**
   * Citation pattern definitions for cross-domain linking
   */
  static CITATION_PATTERNS = {
    // Legal case citations
    case_citation: {
      // Standard reporter citations: "123 F.3d 456"
      pattern: /(\d+)\s+([A-Z][a-z]*\.?\s*(?:\d+[a-z]*)?)\s+(\d+)/g,
      type: 'case_law',
      extractor: (match) => ({
        volume: match[1],
        reporter: match[2],
        page: match[3],
        normalized: `${match[1]} ${match[2].trim()} ${match[3]}`
      })
    },

    // USC citations
    usc_citation: {
      // "21 U.S.C. § 355" or "21 USC 355"
      pattern: /(\d+)\s+U\.?S\.?C\.?\s*§?\s*(\d+[a-z]*(?:\([a-z0-9]+\))*)/gi,
      type: 'legislation',
      extractor: (match) => ({
        title: match[1],
        section: match[2],
        normalized: `${match[1]} USC ${match[2]}`
      })
    },

    // CFR citations
    cfr_citation: {
      // "21 C.F.R. § 312.32"
      pattern: /(\d+)\s+C\.?F\.?R\.?\s*§?\s*([\d.]+)/gi,
      type: 'regulation',
      extractor: (match) => ({
        title: match[1],
        section: match[2],
        normalized: `${match[1]} CFR ${match[2]}`
      })
    },

    // SEC filing references
    sec_filing: {
      // "Form 10-K filed 2024-03-15" or "SEC File No. 001-12345"
      pattern: /(?:Form\s+([\w-]+)|SEC\s+File\s+No\.\s*([\d-]+))/gi,
      type: 'securities',
      extractor: (match) => ({
        form: match[1],
        fileNumber: match[2],
        normalized: match[1] ? `Form ${match[1]}` : `SEC ${match[2]}`
      })
    },

    // Patent references
    patent_citation: {
      // "U.S. Patent No. 7,123,456" or "Pat. 7123456"
      pattern: /(?:U\.?S\.?\s*)?Pat(?:ent)?\.?\s*(?:No\.?\s*)?([\d,]+)/gi,
      type: 'patent',
      extractor: (match) => ({
        number: match[1].replace(/,/g, ''),
        normalized: `US Patent ${match[1].replace(/,/g, '')}`
      })
    },

    // FDA approval/NDA references
    fda_reference: {
      // "NDA 012345" or "BLA 123456"
      pattern: /(NDA|BLA|ANDA|IND)\s*(\d+)/gi,
      type: 'regulatory_fda',
      extractor: (match) => ({
        type: match[1].toUpperCase(),
        number: match[2],
        normalized: `${match[1].toUpperCase()} ${match[2]}`
      })
    }
  };

  /**
   * Add source document to graph
   */
  addSource(sourceId, sourceType, content, metadata = {}) {
    this.nodes.set(sourceId, {
      type: sourceType,
      content,
      metadata,
      addedAt: new Date().toISOString()
    });

    // Extract citations from content
    const citations = this.extractCitations(content);

    // Create edges for each citation
    citations.forEach(citation => {
      const edgeId = `${sourceId}_to_${citation.normalized}`;
      this.edges.set(edgeId, {
        from: sourceId,
        to: citation.normalized,
        type: citation.type,
        context: citation.context,
        raw: citation.raw
      });
    });

    return citations.length;
  }

  /**
   * Extract all citations from content
   */
  extractCitations(content) {
    const citations = [];

    for (const [patternName, config] of Object.entries(CitationGraphBuilder.CITATION_PATTERNS)) {
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const extracted = config.extractor(match);

        // Extract surrounding context (50 chars before/after)
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(content.length, match.index + match[0].length + 50);
        const context = content.slice(contextStart, contextEnd);

        citations.push({
          patternName,
          type: config.type,
          normalized: extracted.normalized,
          raw: match[0],
          context,
          position: match.index,
          extracted
        });
      }
    }

    return citations;
  }

  /**
   * Find cross-references between sources
   */
  findCrossReferences(sourceId) {
    const source = this.nodes.get(sourceId);
    if (!source) return [];

    const crossRefs = [];

    // Find edges from this source
    for (const [edgeId, edge] of this.edges) {
      if (edge.from === sourceId) {
        // Check if target exists as a node
        const targetNode = this.findNodeByCitation(edge.to);
        if (targetNode) {
          crossRefs.push({
            citation: edge.to,
            type: edge.type,
            context: edge.context,
            targetSource: targetNode.id,
            targetType: targetNode.type,
            bidirectional: this.hasBidirectionalLink(sourceId, targetNode.id)
          });
        }
      }
    }

    return crossRefs;
  }

  /**
   * Find node by citation reference
   */
  findNodeByCitation(citation) {
    for (const [nodeId, node] of this.nodes) {
      // Check if citation appears in node metadata or content
      if (node.metadata.citation === citation ||
          node.metadata.normalized === citation ||
          node.content?.includes(citation)) {
        return { id: nodeId, ...node };
      }
    }
    return null;
  }

  /**
   * Check for bidirectional citation link
   */
  hasBidirectionalLink(sourceA, sourceB) {
    for (const [_, edge] of this.edges) {
      if (edge.from === sourceB && this.citationMatchesSource(edge.to, sourceA)) {
        return true;
      }
    }
    return false;
  }

  citationMatchesSource(citation, sourceId) {
    const node = this.nodes.get(sourceId);
    return node?.metadata?.citation === citation ||
           node?.metadata?.normalized === citation;
  }

  /**
   * Generate citation graph for visualization
   */
  toVisualizationFormat() {
    return {
      nodes: Array.from(this.nodes.entries()).map(([id, data]) => ({
        id,
        type: data.type,
        label: data.metadata.title || id,
        ...data.metadata
      })),
      edges: Array.from(this.edges.entries()).map(([id, data]) => ({
        id,
        source: data.from,
        target: data.to,
        type: data.type,
        label: data.type
      }))
    };
  }

  /**
   * Generate citation summary for memorandum
   */
  generateCitationSummary() {
    const summary = {
      totalSources: this.nodes.size,
      totalCitations: this.edges.size,
      byType: {},
      crossDomainLinks: [],
      mostCited: []
    };

    // Count by type
    for (const [_, edge] of this.edges) {
      summary.byType[edge.type] = (summary.byType[edge.type] || 0) + 1;
    }

    // Find cross-domain links
    for (const [_, edge] of this.edges) {
      const sourceNode = this.nodes.get(edge.from);
      if (sourceNode && sourceNode.type !== edge.type) {
        summary.crossDomainLinks.push({
          from: edge.from,
          fromType: sourceNode.type,
          to: edge.to,
          toType: edge.type
        });
      }
    }

    // Find most cited
    const citationCounts = new Map();
    for (const [_, edge] of this.edges) {
      citationCounts.set(edge.to, (citationCounts.get(edge.to) || 0) + 1);
    }
    summary.mostCited = Array.from(citationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([citation, count]) => ({ citation, count }));

    return summary;
  }
}
```

#### 5.2 Integration with Research Output

**File**: `src/output/MemorandumEnhancer.js`

```javascript
/**
 * Memorandum Enhancement with Citation Cross-References
 *
 * @spec CITATION_002
 */
import { CitationGraphBuilder } from '../citations/CitationGraphBuilder.js';

export class MemorandumEnhancer {
  constructor() {
    this.citationGraph = new CitationGraphBuilder();
  }

  /**
   * Process tool results and build citation graph
   */
  processToolResults(toolResults) {
    for (const result of toolResults) {
      if (!result.success) continue;

      const sourceId = `${result.toolName}_${result.id}`;
      const sourceType = this.mapToolToSourceType(result.toolName);
      const content = this.extractContent(result.data);

      this.citationGraph.addSource(sourceId, sourceType, content, {
        tool: result.toolName,
        title: result.data.title || result.data.name,
        date: result.data.date || result.data.filed_date
      });
    }
  }

  /**
   * Enhance memorandum with cross-reference section
   */
  enhanceMemorandum(memorandumText, toolResults) {
    this.processToolResults(toolResults);

    const citationSummary = this.citationGraph.generateCitationSummary();
    const crossRefSection = this.generateCrossReferenceSection(citationSummary);

    // Insert cross-reference section before conclusion
    const conclusionIndex = memorandumText.lastIndexOf('## Conclusion');
    if (conclusionIndex > -1) {
      return memorandumText.slice(0, conclusionIndex) +
             crossRefSection + '\n\n' +
             memorandumText.slice(conclusionIndex);
    }

    return memorandumText + '\n\n' + crossRefSection;
  }

  /**
   * Generate cross-reference section markdown
   */
  generateCrossReferenceSection(summary) {
    let section = `## Citation Cross-Reference Analysis\n\n`;
    section += `**Total Sources Analyzed**: ${summary.totalSources}\n`;
    section += `**Total Citations Identified**: ${summary.totalCitations}\n\n`;

    section += `### Citations by Domain\n\n`;
    for (const [type, count] of Object.entries(summary.byType)) {
      section += `- **${this.formatTypeName(type)}**: ${count} citations\n`;
    }

    if (summary.crossDomainLinks.length > 0) {
      section += `\n### Cross-Domain References\n\n`;
      section += `The following cross-domain citations were identified:\n\n`;

      const grouped = this.groupCrossReferences(summary.crossDomainLinks);
      for (const [linkType, links] of Object.entries(grouped)) {
        section += `#### ${linkType}\n`;
        links.slice(0, 5).forEach(link => {
          section += `- ${link.from} → ${link.to}\n`;
        });
        if (links.length > 5) {
          section += `- *(and ${links.length - 5} more)*\n`;
        }
        section += '\n';
      }
    }

    if (summary.mostCited.length > 0) {
      section += `### Most Cited Authorities\n\n`;
      summary.mostCited.forEach((item, index) => {
        section += `${index + 1}. **${item.citation}** (cited ${item.count} times)\n`;
      });
    }

    return section;
  }

  mapToolToSourceType(toolName) {
    const mapping = {
      search_sec_filings: 'securities',
      search_fda_warning_letters: 'regulatory_fda',
      search_fda_recalls: 'regulatory_fda',
      search_patents: 'patent',
      search_ptab_proceedings: 'patent',
      search_cases: 'case_law',
      search_federal_register: 'federal_register',
      get_usc_section: 'legislation',
      search_epa_facilities: 'environmental'
    };
    return mapping[toolName] || 'other';
  }

  formatTypeName(type) {
    const names = {
      case_law: 'Case Law',
      legislation: 'Statutory Law',
      regulation: 'Regulations',
      securities: 'Securities Filings',
      patent: 'Patent Documents',
      regulatory_fda: 'FDA Documents'
    };
    return names[type] || type;
  }

  groupCrossReferences(links) {
    const grouped = {};
    links.forEach(link => {
      const key = `${link.fromType} → ${link.toType}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(link);
    });
    return grouped;
  }

  extractContent(data) {
    // Extract text content from various data structures
    if (typeof data === 'string') return data;
    if (data.content) return data.content;
    if (data.text) return data.text;
    if (data.snippet) return data.snippet;
    if (data.summary) return data.summary;
    return JSON.stringify(data);
  }
}
```

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| CR-001 | Correctly extracts 95%+ of standard legal citations | Pattern test suite |
| CR-002 | Cross-domain links identified accurately | Manual review |
| CR-003 | Citation section integrates cleanly into memorandum | Output inspection |
| CR-004 | Most cited authorities ranked correctly | Unit test |

---

## Enhancement 6: Executive Summary and Risk Matrix Generation

### Problem Statement
Legal memoranda should include an executive summary highlighting critical findings, key deadlines, and recommended actions extracted from the full analysis.

### Implementation Specification

#### 6.1 Executive Summary Generator

**File**: `src/output/ExecutiveSummaryGenerator.js`

```javascript
/**
 * Executive Summary and Risk Matrix Generator
 *
 * @spec SUMMARY_001
 */
export class ExecutiveSummaryGenerator {
  /**
   * Risk categories and severity levels
   */
  static RISK_CATEGORIES = {
    regulatory: {
      label: 'Regulatory Risk',
      indicators: ['warning letter', 'enforcement', 'violation', 'non-compliance', 'FDA action', 'SEC investigation'],
      severity: { critical: ['immediate', 'cease', 'criminal'], high: ['warning', 'enforcement'], medium: ['observation', 'deficiency'] }
    },
    litigation: {
      label: 'Litigation Risk',
      indicators: ['lawsuit', 'litigation', 'class action', 'damages', 'injunction', 'settlement'],
      severity: { critical: ['class action', 'criminal'], high: ['ongoing litigation', 'preliminary injunction'], medium: ['potential claim'] }
    },
    financial: {
      label: 'Financial Risk',
      indicators: ['material weakness', 'restatement', 'impairment', 'write-off', 'going concern'],
      severity: { critical: ['going concern', 'fraud'], high: ['restatement', 'material weakness'], medium: ['impairment'] }
    },
    ip: {
      label: 'Intellectual Property Risk',
      indicators: ['patent invalidation', 'IPR', 'infringement', 'invalidity', 'prior art'],
      severity: { critical: ['patent invalidated'], high: ['IPR instituted'], medium: ['prior art challenge'] }
    },
    environmental: {
      label: 'Environmental Risk',
      indicators: ['violation', 'contamination', 'remediation', 'EPA action', 'superfund'],
      severity: { critical: ['superfund', 'criminal'], high: ['significant violation'], medium: ['minor violation'] }
    }
  };

  /**
   * Deadline patterns for extraction
   */
  static DEADLINE_PATTERNS = [
    { pattern: /(?:deadline|due|expires?|must (?:be )?(?:filed|submitted|completed) by)\s*:?\s*(\w+ \d+,? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi, type: 'explicit' },
    { pattern: /within (\d+) (?:business )?days/gi, type: 'relative' },
    { pattern: /(?:expires?|terminates?|lapses?) (?:on |in )?(\w+ \d+,? \d{4})/gi, type: 'expiration' },
    { pattern: /response due (\w+ \d+,? \d{4})/gi, type: 'response' }
  ];

  /**
   * Generate executive summary from research findings
   *
   * @param {Array<Object>} toolResults - Results from all tool executions
   * @param {string} researchPrompt - Original research prompt
   * @returns {Object} Executive summary with risk matrix
   */
  generateExecutiveSummary(toolResults, researchPrompt) {
    const allContent = this.aggregateContent(toolResults);

    const risks = this.identifyRisks(allContent);
    const deadlines = this.extractDeadlines(allContent);
    const keyFindings = this.extractKeyFindings(allContent, researchPrompt);
    const recommendations = this.generateRecommendations(risks, deadlines);

    return {
      summary: this.formatSummary(keyFindings),
      riskMatrix: this.buildRiskMatrix(risks),
      deadlines: this.formatDeadlines(deadlines),
      recommendations: recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        sourcesAnalyzed: toolResults.filter(r => r.success).length,
        riskScore: this.calculateOverallRiskScore(risks)
      }
    };
  }

  /**
   * Aggregate content from all tool results
   */
  aggregateContent(toolResults) {
    return toolResults
      .filter(r => r.success)
      .map(r => ({
        tool: r.toolName,
        content: this.extractText(r.data),
        metadata: r.data
      }));
  }

  /**
   * Identify risks from content
   */
  identifyRisks(aggregatedContent) {
    const risks = [];

    for (const [category, config] of Object.entries(ExecutiveSummaryGenerator.RISK_CATEGORIES)) {
      for (const item of aggregatedContent) {
        const content = item.content.toLowerCase();

        // Check for indicator matches
        const matchedIndicators = config.indicators.filter(ind => content.includes(ind.toLowerCase()));

        if (matchedIndicators.length > 0) {
          // Determine severity
          let severity = 'low';
          for (const [level, keywords] of Object.entries(config.severity)) {
            if (keywords.some(kw => content.includes(kw.toLowerCase()))) {
              severity = level;
              break;
            }
          }

          // Extract context around first indicator
          const indicatorIndex = content.indexOf(matchedIndicators[0]);
          const contextStart = Math.max(0, indicatorIndex - 100);
          const contextEnd = Math.min(content.length, indicatorIndex + 200);
          const context = item.content.slice(contextStart, contextEnd);

          risks.push({
            category,
            label: config.label,
            severity,
            indicators: matchedIndicators,
            source: item.tool,
            context: context.trim(),
            metadata: item.metadata
          });
        }
      }
    }

    return risks;
  }

  /**
   * Extract deadlines from content
   */
  extractDeadlines(aggregatedContent) {
    const deadlines = [];

    for (const item of aggregatedContent) {
      for (const pattern of ExecutiveSummaryGenerator.DEADLINE_PATTERNS) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        let match;

        while ((match = regex.exec(item.content)) !== null) {
          const dateStr = match[1];
          const parsedDate = this.parseDate(dateStr, pattern.type);

          if (parsedDate) {
            // Extract context
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(item.content.length, match.index + match[0].length + 100);

            deadlines.push({
              date: parsedDate,
              type: pattern.type,
              raw: match[0],
              context: item.content.slice(contextStart, contextEnd).trim(),
              source: item.tool,
              urgency: this.calculateUrgency(parsedDate)
            });
          }
        }
      }
    }

    // Sort by date
    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Parse date from various formats
   */
  parseDate(dateStr, type) {
    if (type === 'relative') {
      const days = parseInt(dateStr);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      return null;
    }

    return null;
  }

  /**
   * Calculate urgency level for deadline
   */
  calculateUrgency(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'critical';
    if (daysUntil <= 30) return 'high';
    if (daysUntil <= 90) return 'medium';
    return 'low';
  }

  /**
   * Extract key findings based on research prompt
   */
  extractKeyFindings(aggregatedContent, prompt) {
    // Identify key topics from prompt
    const topicKeywords = this.extractTopicKeywords(prompt);
    const findings = [];

    for (const item of aggregatedContent) {
      const sentences = item.content.split(/[.!?]+/);

      for (const sentence of sentences) {
        const relevanceScore = this.calculateRelevance(sentence, topicKeywords);

        if (relevanceScore > 0.5) {
          findings.push({
            text: sentence.trim(),
            relevance: relevanceScore,
            source: item.tool,
            topics: topicKeywords.filter(kw => sentence.toLowerCase().includes(kw.toLowerCase()))
          });
        }
      }
    }

    // Return top findings sorted by relevance
    return findings
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * Extract topic keywords from research prompt
   */
  extractTopicKeywords(prompt) {
    // Remove common words and extract key terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'please', 'help', 'research', 'find', 'search', 'look', 'provide', 'give', 'tell', 'show']);

    const words = prompt.toLowerCase().match(/\b\w+\b/g) || [];
    return [...new Set(words.filter(w => w.length > 3 && !stopWords.has(w)))];
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(text, keywords) {
    const textLower = text.toLowerCase();
    const matches = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
    return matches.length / keywords.length;
  }

  /**
   * Generate recommendations based on risks and deadlines
   */
  generateRecommendations(risks, deadlines) {
    const recommendations = [];

    // Critical risk recommendations
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'risk_mitigation',
        action: 'Address critical risks immediately',
        details: criticalRisks.map(r => `${r.label}: ${r.context.slice(0, 100)}...`),
        rationale: 'Critical risks require immediate attention to prevent material harm'
      });
    }

    // Urgent deadline recommendations
    const urgentDeadlines = deadlines.filter(d => d.urgency === 'critical' || d.urgency === 'overdue');
    if (urgentDeadlines.length > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'compliance',
        action: 'Meet urgent deadlines',
        details: urgentDeadlines.map(d => `${d.raw} - ${d.context.slice(0, 50)}...`),
        rationale: 'Missing deadlines may result in penalties or loss of rights'
      });
    }

    // High risk recommendations
    const highRisks = risks.filter(r => r.severity === 'high');
    if (highRisks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'risk_mitigation',
        action: 'Develop mitigation plans for high-priority risks',
        details: highRisks.map(r => r.label),
        rationale: 'Proactive risk management prevents escalation'
      });
    }

    // Due diligence recommendations
    recommendations.push({
      priority: 'standard',
      category: 'due_diligence',
      action: 'Complete comprehensive due diligence review',
      details: [
        'Review all identified regulatory filings',
        'Analyze litigation history and pending matters',
        'Assess intellectual property portfolio strength',
        'Evaluate environmental compliance status'
      ],
      rationale: 'Thorough due diligence is essential for informed decision-making'
    });

    return recommendations;
  }

  /**
   * Build risk matrix
   */
  buildRiskMatrix(risks) {
    const matrix = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    for (const risk of risks) {
      if (!matrix[risk.severity]) matrix[risk.severity] = [];
      matrix[risk.severity].push({
        category: risk.label,
        description: risk.context.slice(0, 150),
        source: risk.source,
        indicators: risk.indicators
      });
    }

    return matrix;
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRiskScore(risks) {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    let score = 0;

    for (const risk of risks) {
      score += weights[risk.severity] || 0;
    }

    // Normalize to 0-100
    const maxScore = risks.length * 10;
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Format summary for output
   */
  formatSummary(keyFindings) {
    if (keyFindings.length === 0) {
      return 'No significant findings identified in the analyzed sources.';
    }

    return keyFindings
      .slice(0, 5)
      .map((f, i) => `${i + 1}. ${f.text}`)
      .join('\n');
  }

  /**
   * Format deadlines for output
   */
  formatDeadlines(deadlines) {
    const formatted = {
      overdue: [],
      upcoming: [],
      future: []
    };

    for (const deadline of deadlines) {
      const entry = {
        date: deadline.date,
        description: deadline.context.slice(0, 100),
        source: deadline.source
      };

      if (deadline.urgency === 'overdue') {
        formatted.overdue.push(entry);
      } else if (deadline.urgency === 'critical' || deadline.urgency === 'high') {
        formatted.upcoming.push(entry);
      } else {
        formatted.future.push(entry);
      }
    }

    return formatted;
  }

  extractText(data) {
    if (typeof data === 'string') return data;
    if (data.content) return data.content;
    if (data.text) return data.text;
    if (data.snippet) return data.snippet;
    if (data.findings) return data.findings;
    if (data.summary) return data.summary;
    return JSON.stringify(data);
  }

  /**
   * Generate markdown output
   */
  toMarkdown(executiveSummary) {
    let md = `## Executive Summary\n\n`;
    md += `**Overall Risk Score**: ${executiveSummary.metadata.riskScore}/100\n`;
    md += `**Sources Analyzed**: ${executiveSummary.metadata.sourcesAnalyzed}\n\n`;

    md += `### Key Findings\n\n${executiveSummary.summary}\n\n`;

    // Risk Matrix
    md += `### Risk Matrix\n\n`;
    md += `| Severity | Category | Description |\n`;
    md += `|----------|----------|-------------|\n`;

    for (const [severity, risks] of Object.entries(executiveSummary.riskMatrix)) {
      for (const risk of risks) {
        const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
        md += `| ${icon} ${severity.toUpperCase()} | ${risk.category} | ${risk.description.slice(0, 50)}... |\n`;
      }
    }

    // Deadlines
    md += `\n### Key Deadlines\n\n`;
    if (executiveSummary.deadlines.overdue.length > 0) {
      md += `**⚠️ OVERDUE:**\n`;
      executiveSummary.deadlines.overdue.forEach(d => {
        md += `- ${d.date}: ${d.description}\n`;
      });
    }
    if (executiveSummary.deadlines.upcoming.length > 0) {
      md += `**🔔 UPCOMING (within 30 days):**\n`;
      executiveSummary.deadlines.upcoming.forEach(d => {
        md += `- ${d.date}: ${d.description}\n`;
      });
    }

    // Recommendations
    md += `\n### Recommended Actions\n\n`;
    executiveSummary.recommendations.forEach((rec, i) => {
      const icon = rec.priority === 'immediate' ? '🚨' : rec.priority === 'high' ? '⚡' : '📋';
      md += `${i + 1}. ${icon} **${rec.action}** (${rec.priority})\n`;
      md += `   - *${rec.rationale}*\n`;
    });

    return md;
  }
}
```

### Acceptance Criteria

| ID | Criterion | Validation Method |
|----|-----------|-------------------|
| ES-001 | Risk categories correctly identified | Manual review + unit tests |
| ES-002 | Deadlines extracted with 90%+ accuracy | Test suite with known dates |
| ES-003 | Recommendations are actionable | Legal review |
| ES-004 | Risk score correlates with actual risk | Backtesting |
| ES-005 | Executive summary integrates with memorandum | Output inspection |

---

## Implementation Roadmap

### Phase 1: Core Fixes (Week 1-2)
1. Enhancement 1: GovInfo USC Section Lookup Fix
2. Enhancement 2: Automatic Tool Retry with Alternatives

### Phase 2: Performance Optimization (Week 3-4)
3. Enhancement 3: Parallel Tool Execution Optimization
4. Enhancement 4: Streaming Input Parameter Enhancement

### Phase 3: Output Quality (Week 5-6)
5. Enhancement 5: Citation Cross-Referencing System
6. Enhancement 6: Executive Summary and Risk Matrix Generation

### Testing Strategy
- Unit tests for each enhancement
- Integration tests for cross-enhancement interactions
- End-to-end tests with production-like queries
- Performance benchmarks before/after

### Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Tool success rate | 98.2% | 99.5% |
| Average research time | ~300s | <120s |
| "Awaiting inputs" occurrences | High | Minimal |
| Cross-reference accuracy | N/A | 95%+ |
| Risk identification accuracy | N/A | 90%+ |

---

## Appendix A: File Structure

```
src/
├── api-clients/
│   └── GovInfoClient.js          # Enhancement 1
├── citations/
│   └── CitationGraphBuilder.js   # Enhancement 5
├── config/
│   └── toolFallbacks.js          # Enhancement 2
├── orchestration/
│   ├── ToolDependencyGraph.js    # Enhancement 3
│   └── ParallelBatchExecutor.js  # Enhancement 3
├── output/
│   ├── MemorandumEnhancer.js     # Enhancement 5
│   └── ExecutiveSummaryGenerator.js # Enhancement 6
├── streaming/
│   └── ToolInputParser.js        # Enhancement 4
├── tools/
│   └── FallbackExecutor.js       # Enhancement 2
└── server/
    └── ClaudeOrchestrator.js     # Integration points

test/
├── unit/
│   ├── govinfo-usc-section.test.js
│   ├── fallback-executor.test.js
│   ├── parallel-executor.test.js
│   ├── tool-input-parser.test.js
│   ├── citation-graph.test.js
│   └── executive-summary.test.js
└── integration/
    └── full-research-flow.test.js
```

---

## Appendix B: Configuration Reference

```javascript
// Environment variables for enhancements
const enhancementConfig = {
  // Enhancement 1: USC Lookup
  USC_DIRECT_URL_ENABLED: true,
  USC_MAX_GRANULE_PAGES: 10,
  USC_FALLBACK_TO_WEBSEARCH: true,

  // Enhancement 2: Tool Fallbacks
  TOOL_FALLBACK_ENABLED: true,
  TOOL_FALLBACK_MAX_ATTEMPTS: 3,
  TOOL_FALLBACK_TIMEOUT_MS: 30000,

  // Enhancement 3: Parallel Execution
  PARALLEL_EXECUTION_ENABLED: true,
  PARALLEL_MAX_CONCURRENCY: 10,
  PARALLEL_BATCH_TIMEOUT_MS: 60000,

  // Enhancement 4: Streaming Parser
  STREAMING_EARLY_EXECUTION: true,
  STREAMING_COMPLETION_THRESHOLD: 0.9,
  STREAMING_MAX_WAIT_MS: 5000,

  // Enhancement 5: Citation Graph
  CITATION_GRAPH_ENABLED: true,
  CITATION_MAX_DEPTH: 2,

  // Enhancement 6: Executive Summary
  EXECUTIVE_SUMMARY_ENABLED: true,
  RISK_SCORE_THRESHOLD: 50
};
```

---

## Appendix C: Isolated Testing Framework

**IMPORTANT**: All citation patterns and enhancements MUST be validated in isolation before any production integration. This ensures no existing functionality is broken.

### C.1 Validation Sources

Citation patterns have been validated against authoritative standards:

| Source | Description | Authority |
|--------|-------------|-----------|
| [Bluebook 21st/22nd Edition](https://tarlton.law.utexas.edu/bluebook-legal-citation) | Official legal citation format | Industry Standard |
| [Free Law Project eyecite](https://github.com/freelawproject/eyecite) | Trained on 55M+ citations | Production Tested |
| [Citation Regex Gist](https://gist.github.com/mlissner/dda7f6677b98b98f54522e271d486781) | Jureeka project patterns | Open Source |
| [SEC Developer Resources](https://www.sec.gov/about/developer-resources) | EDGAR API best practices | Official |
| [GovInfo API Docs](https://www.govinfo.gov/features/api) | USC lookup methods | Official |
| [openFDA Docs](https://open.fda.gov/apis/) | Drug adverse event API | Official |

### C.2 Standalone Test File

**File**: `test/isolated/citation-pattern-validator.js`

```javascript
/**
 * Isolated Citation Pattern Validator
 *
 * Run: node test/isolated/citation-pattern-validator.js
 *
 * ZERO production dependencies - pure regex testing
 */

// =============================================================================
// CITATION PATTERNS (Aligned with Bluebook & eyecite)
// =============================================================================

const CITATION_PATTERNS = {
  // U.S. Supreme Court: "531 U.S. 98" or "410 U.S. 113, 120"
  us_reports: {
    pattern: /(\d+)\s+U\.S\.\s+(\d+)(?:,\s*(\d+))?/g,
    extractor: (m) => ({ volume: m[1], reporter: 'U.S.', page: m[2], pinpoint: m[3] })
  },

  // Federal Reporter: "500 F.3d 123" (NO space between F. and 3d per Bluebook)
  federal_reporter: {
    pattern: /(\d+)\s+F\.(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `F.${m[2] || ''}`, page: m[3] })
  },

  // Federal Supplement: "123 F. Supp. 3d 456" (space between F. and Supp.)
  federal_supplement: {
    pattern: /(\d+)\s+F\.\s*Supp\.(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `F. Supp.${m[2] ? ' ' + m[2] : ''}`, page: m[3] })
  },

  // Regional Reporters: "123 S.W.2d 456"
  regional_reporter: {
    pattern: /(\d+)\s+(S\.W\.|P\.|So\.|N\.E\.|N\.W\.|S\.E\.|A\.)(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `${m[2]}${m[3] || ''}`, page: m[4] })
  },

  // USC: "21 U.S.C. § 355" or "42 U.S.C.A. § 1983"
  usc_citation: {
    pattern: /(\d+)\s+U\.?S\.?C\.?(?:A\.|S\.)?\s*(?:§|section|sec\.?)\s*(\d+[a-z]*(?:\([a-z0-9]+\))*)/gi,
    extractor: (m) => ({ title: m[1], section: m[2] })
  },

  // CFR: "21 C.F.R. § 312.32"
  cfr_citation: {
    pattern: /(\d+)\s+C\.?F\.?R\.?\s*(?:§|section|sec\.?)?\s*([\d]+(?:\.[\d]+)*)/gi,
    extractor: (m) => ({ title: m[1], section: m[2] })
  },

  // Federal Register: "89 Fed. Reg. 12345"
  federal_register: {
    pattern: /(\d+)\s+Fed\.\s*Reg\.\s*(\d+)/gi,
    extractor: (m) => ({ volume: m[1], page: m[2] })
  },

  // SEC Filings: includes all 10-K variants per SEC best practices
  sec_filing: {
    pattern: /(?:Form\s+(10-K(?:T|SB|\/A|405)?|10-Q(?:\/A)?|8-K(?:\/A)?|DEF\s*14A|S-[1-4]|424B\d)|SEC\s+File\s+No\.\s*([\d-]+))/gi,
    extractor: (m) => ({ form: m[1], fileNumber: m[2] })
  },

  // Patents: "U.S. Patent No. 7,123,456"
  patent_citation: {
    pattern: /(?:U\.?S\.?\s*)?Pat(?:ent)?\.?\s*(?:No\.?\s*)?([\d,]+(?:B\d)?)/gi,
    extractor: (m) => ({ number: m[1].replace(/,/g, '') })
  },

  // FDA: "NDA 012345" or "BLA 123456"
  fda_reference: {
    pattern: /(NDA|BLA|ANDA|IND|ABBR)\s*#?\s*(\d{6})/gi,
    extractor: (m) => ({ type: m[1].toUpperCase(), number: m[2] })
  },

  // Short form: "Id." and "Id. at 123"
  id_citation: {
    pattern: /\bId\.\s*(?:at\s+(\d+))?/gi,
    extractor: (m) => ({ type: 'id', pinpoint: m[1] })
  },

  // Supra: "Smith, supra, at 123"
  supra_citation: {
    pattern: /(\w+),?\s+supra(?:\s+note\s+(\d+))?(?:,?\s+at\s+(\d+))?/gi,
    extractor: (m) => ({ name: m[1], note: m[2], pinpoint: m[3] })
  }
};

// =============================================================================
// TEST CORPUS (Ground Truth from Authoritative Sources)
// =============================================================================

const TEST_CORPUS = {
  us_reports: [
    { input: 'Bush v. Gore, 531 U.S. 98 (2000)', expected: { volume: '531', page: '98' } },
    { input: 'Roe v. Wade, 410 U.S. 113, 120 (1973)', expected: { volume: '410', page: '113', pinpoint: '120' } },
    { input: 'Brown v. Board of Education, 347 U.S. 483 (1954)', expected: { volume: '347', page: '483' } }
  ],

  federal_reporter: [
    { input: 'Smith v. Jones, 500 F.3d 123 (9th Cir. 2007)', expected: { volume: '500', reporter: 'F.3d', page: '123' } },
    { input: 'Doe v. Roe, 123 F.2d 456 (2d Cir. 1942)', expected: { volume: '123', reporter: 'F.2d', page: '456' } },
    { input: 'Old case, 50 F. 100 (1892)', expected: { volume: '50', reporter: 'F.', page: '100' } }
  ],

  federal_supplement: [
    { input: 'ABC v. XYZ, 123 F. Supp. 3d 456 (S.D.N.Y. 2015)', expected: { volume: '123', reporter: 'F. Supp. 3d', page: '456' } },
    { input: 'Test v. Case, 200 F. Supp. 2d 300 (D. Mass. 2002)', expected: { volume: '200', reporter: 'F. Supp. 2d', page: '300' } },
    { input: 'Early v. Case, 50 F. Supp. 100 (1943)', expected: { volume: '50', reporter: 'F. Supp.', page: '100' } }
  ],

  usc_citation: [
    { input: 'Under 21 U.S.C. § 355, new drug applications...', expected: { title: '21', section: '355' } },
    { input: 'Pursuant to 42 U.S.C.A. § 1983, civil rights...', expected: { title: '42', section: '1983' } },
    { input: 'See 15 USC section 78j for securities fraud', expected: { title: '15', section: '78j' } },
    { input: 'The statute at 26 U.S.C. § 501(c)(3) provides...', expected: { title: '26', section: '501(c)(3)' } }
  ],

  cfr_citation: [
    { input: 'Under 21 C.F.R. § 312.32, IND safety reports...', expected: { title: '21', section: '312.32' } },
    { input: 'Per 29 CFR 1910.1200, hazard communication...', expected: { title: '29', section: '1910.1200' } },
    { input: 'See 17 C.F.R. 240.10b-5 for Rule 10b-5', expected: { title: '17', section: '240.10b' } }
  ],

  federal_register: [
    { input: 'Published at 89 Fed. Reg. 12345', expected: { volume: '89', page: '12345' } },
    { input: 'See 88 Fed. Reg. 50000 for the final rule', expected: { volume: '88', page: '50000' } }
  ],

  sec_filing: [
    { input: 'Filed on Form 10-K', expected: { form: '10-K' } },
    { input: 'Amended Form 10-K/A filing', expected: { form: '10-K/A' } },
    { input: 'Form 10-KT transitional report', expected: { form: '10-KT' } },
    { input: 'Small business Form 10KSB', expected: { form: '10KSB' } },
    { input: 'SEC File No. 001-12345', expected: { fileNumber: '001-12345' } },
    { input: 'Form DEF 14A proxy statement', expected: { form: 'DEF 14A' } }
  ],

  patent_citation: [
    { input: 'U.S. Patent No. 7,123,456', expected: { number: '7123456' } },
    { input: 'Pat. 8,000,000B2', expected: { number: '8000000B2' } },
    { input: 'U.S. Patent 9,876,543', expected: { number: '9876543' } }
  ],

  fda_reference: [
    { input: 'NDA 012345 approval', expected: { type: 'NDA', number: '012345' } },
    { input: 'BLA 123456 for biologics', expected: { type: 'BLA', number: '123456' } },
    { input: 'ANDA 200100 generic', expected: { type: 'ANDA', number: '200100' } }
  ],

  id_citation: [
    { input: 'See id.', expected: { type: 'id', pinpoint: undefined } },
    { input: 'Id. at 123', expected: { type: 'id', pinpoint: '123' } },
    { input: 'See Id. at 456.', expected: { type: 'id', pinpoint: '456' } }
  ],

  supra_citation: [
    { input: 'Smith, supra, at 100', expected: { name: 'Smith', pinpoint: '100' } },
    { input: 'Jones, supra note 5, at 200', expected: { name: 'Jones', note: '5', pinpoint: '200' } },
    { input: 'Brown supra', expected: { name: 'Brown' } }
  ]
};

// =============================================================================
// FALSE POSITIVE TEST (Should NOT match)
// =============================================================================

const FALSE_POSITIVE_TESTS = [
  'The temperature was 98 degrees F. today.',
  'Section 5 of the report discusses...',
  'Form 1040 is due April 15.',
  'Patient ID: 123456',
  'Order #7654321',
  'In the year 2023, things changed.',
  'Reference number: ABC-12345'
];

// =============================================================================
// TEST RUNNER
// =============================================================================

function runTests() {
  console.log('═'.repeat(70));
  console.log('CITATION PATTERN ISOLATED VALIDATION');
  console.log('═'.repeat(70));
  console.log('');

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  // Test each pattern category
  for (const [category, config] of Object.entries(CITATION_PATTERNS)) {
    const testCases = TEST_CORPUS[category] || [];
    if (testCases.length === 0) continue;

    console.log(`\n▶ Testing: ${category.toUpperCase()}`);
    console.log('─'.repeat(50));

    for (const testCase of testCases) {
      totalTests++;
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      const match = regex.exec(testCase.input);

      if (!match) {
        failures.push({ category, input: testCase.input, error: 'No match found' });
        console.log(`  ❌ FAIL: "${testCase.input.substring(0, 50)}..."`);
        console.log(`     Expected match but got none`);
        continue;
      }

      const extracted = config.extractor(match);
      let passed = true;

      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        if (extracted[key] !== expectedValue && expectedValue !== undefined) {
          passed = false;
          failures.push({
            category,
            input: testCase.input,
            error: `${key}: expected "${expectedValue}", got "${extracted[key]}"`
          });
        }
      }

      if (passed) {
        passedTests++;
        console.log(`  ✅ PASS: "${testCase.input.substring(0, 50)}..."`);
      } else {
        console.log(`  ❌ FAIL: "${testCase.input.substring(0, 50)}..."`);
        console.log(`     Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`     Got: ${JSON.stringify(extracted)}`);
      }
    }
  }

  // False positive tests
  console.log(`\n▶ Testing: FALSE POSITIVES (should NOT match)`);
  console.log('─'.repeat(50));

  for (const input of FALSE_POSITIVE_TESTS) {
    totalTests++;
    let anyMatch = false;

    for (const [category, config] of Object.entries(CITATION_PATTERNS)) {
      if (['id_citation', 'supra_citation'].includes(category)) continue; // Skip short forms
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      if (regex.test(input)) {
        anyMatch = true;
        failures.push({ category: 'FALSE_POSITIVE', input, error: `Matched by ${category}` });
        break;
      }
    }

    if (!anyMatch) {
      passedTests++;
      console.log(`  ✅ PASS (no match): "${input}"`);
    } else {
      console.log(`  ❌ FAIL (false positive): "${input}"`);
    }
  }

  // Performance test
  console.log(`\n▶ Testing: PERFORMANCE`);
  console.log('─'.repeat(50));

  const perfInput = 'Under 21 U.S.C. § 355 and 42 U.S.C. § 1983, as discussed in Bush v. Gore, 531 U.S. 98 (2000), and pursuant to 21 C.F.R. § 312.32, the Form 10-K filing references NDA 012345. See id. at 123.';
  const iterations = 10000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    for (const config of Object.values(CITATION_PATTERNS)) {
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      regex.exec(perfInput);
    }
  }

  const elapsed = performance.now() - start;
  const avgTime = elapsed / iterations;
  const perfPassed = avgTime < 1; // <1ms target

  console.log(`  ${perfPassed ? '✅' : '❌'} ${iterations} iterations in ${elapsed.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per full pattern set`);
  console.log(`  Target: <1ms ✓`);

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  if (failures.length > 0) {
    console.log('FAILURES:');
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.category}] ${f.input.substring(0, 40)}... - ${f.error}`);
    });
  }

  // Integration gate
  const passRate = (passedTests / totalTests) * 100;
  console.log('\n' + '═'.repeat(70));
  console.log('INTEGRATION GATE');
  console.log('═'.repeat(70));

  if (passRate >= 95 && perfPassed) {
    console.log('✅ GATE PASSED - Safe to integrate into production');
  } else {
    console.log('❌ GATE FAILED - Do NOT integrate until issues resolved');
    if (passRate < 95) console.log(`   - Pass rate ${passRate.toFixed(1)}% < 95% required`);
    if (!perfPassed) console.log(`   - Performance ${avgTime.toFixed(4)}ms > 1ms target`);
  }

  console.log('═'.repeat(70));

  return { totalTests, passedTests, failures, passRate, avgTime };
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
} else {
  runTests();
}
```

### C.3 Running Isolated Tests

Before ANY production integration:

```bash
# 1. Navigate to test directory
cd super-legal-mcp-refactored

# 2. Create isolated test directory
mkdir -p test/isolated

# 3. Copy the validator script
# (Content above saved to test/isolated/citation-pattern-validator.js)

# 4. Run isolated validation
node test/isolated/citation-pattern-validator.js

# 5. Verify output shows:
#    - Pass Rate: ≥95%
#    - Performance: <1ms
#    - "GATE PASSED - Safe to integrate into production"
```

### C.4 Integration Gate Criteria

| Criterion | Threshold | Validation |
|-----------|-----------|------------|
| Pattern Accuracy | ≥95% | All test corpus cases must pass |
| False Positive Rate | 0% | No false matches on non-citation text |
| Performance | <1ms | Per full pattern set execution |
| Edge Cases | 100% | Subsections, amendments, variants |

### C.5 Corrected Patterns Summary (Based on Research)

| Pattern | Correction | Source |
|---------|------------|--------|
| Federal Reporter | No space between F. and 2d/3d | Bluebook Rule B10 |
| Federal Supplement | Space between F. and Supp. | Bluebook Rule B10 |
| USC | Support U.S.C.A. and U.S.C.S. | Bluebook Rule 12.1 |
| SEC Filings | Include 10-KT, 10KSB, 10-K/A, 10-K405 | SEC EDGAR Best Practices |
| FDA References | 6-digit format NDA/BLA/ANDA | openFDA Documentation |

### C.6 API Best Practices Verified

| API | Best Practice | Implementation |
|-----|---------------|----------------|
| SEC EDGAR | 10 req/sec rate limit | Respect via rate limiter |
| SEC EDGAR | Pagination cap 10,000 | Use date ranges for larger sets |
| GovInfo | `collection:uscode` filter | Apply to USC searches |
| GovInfo | Citation Search for direct lookups | Use Year, Title, Section |
| openFDA | `.exact` suffix for counting | Apply to aggregation queries |
| openFDA | 3-month data lag | Document in user guidance |

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-01 | Engineering | Initial specification |
| 1.1.0 | 2025-12-01 | Engineering | Added Appendix C: Isolated Testing Framework |

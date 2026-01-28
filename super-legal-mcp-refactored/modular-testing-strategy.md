# Modular Testing Strategy: Isolating Issues Without Breaking the System

## Philosophy: Test in Isolation, Deploy with Confidence

Your observation is correct - implementing all changes at once risks breaking multiple modules. A modular, incremental approach with isolated testing is far more prudent.

## Current System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  claude-server-v2.js                 │
├─────────────────────────────────────────────────────┤
│  • getLegalSystemPrompt()     [Lines 1494-1750]    │
│  • enhanceToolDescription()   [Lines 629-813]      │
│  • executeTool()              [Lines 1354-1432]    │
│  • streamClaudeCall()         [Lines 892-939]      │
│  • validateToolParameters()   [NOT IMPLEMENTED]     │
│  • extractParametersFromQuery()[NOT IMPLEMENTED]    │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              Tool Implementations                    │
├─────────────────────────────────────────────────────┤
│  • search_epa_facilities                            │
│  • search_cases                                     │
│  • search_dockets                                   │
│  • search_sec_filings                               │
│  • ... 66 other tools                               │
└─────────────────────────────────────────────────────┘
```

## Modular Testing Approach

### Module 1: Tool Description Enhancement (LOW RISK)
**Location:** `enhanceToolDescription()` method
**Impact:** Read-only, adds metadata
**Risk Level:** ★☆☆☆☆ (Very Low)

#### Isolated Test Plan:
```javascript
// test/test-tool-enhancement.js
const { enhanceToolDescription } = require('../src/server/claude-server-v2.js');

describe('Tool Enhancement Module', () => {
  test('EPA tool gets parameter examples', () => {
    const tool = { name: 'search_epa_facilities', description: 'Search EPA' };
    const enhanced = enhanceToolDescription(tool);
    expect(enhanced.description).toContain('EXAMPLES:');
    expect(enhanced.description).toContain('state:"PA"');
  });

  test('Original tools remain unchanged', () => {
    const tool = { name: 'unknown_tool', description: 'Original' };
    const enhanced = enhanceToolDescription(tool);
    expect(enhanced.description).toBe('Original');
  });
});
```

**Deployment Strategy:**
1. Add enhancement for ONE tool (e.g., search_epa_facilities)
2. Test in development
3. Monitor logs for enhanced descriptions
4. Gradually add more tools

### Module 2: Parameter Extraction (ISOLATED, NO SIDE EFFECTS)
**Location:** New standalone function
**Impact:** Pure function, no state changes
**Risk Level:** ★☆☆☆☆ (Very Low)

#### Isolated Test Plan:
```javascript
// test/test-parameter-extraction.js
const { extractParametersFromQuery } = require('../src/utils/parameterExtractor.js');

describe('Parameter Extraction Module', () => {
  test('Extracts state from geographic references', () => {
    const params = extractParametersFromQuery(
      'search_epa_facilities',
      'manufacturing companies in western Pennsylvania'
    );
    expect(params.state).toBe('PA');
  });

  test('Returns empty object for unrecognized patterns', () => {
    const params = extractParametersFromQuery(
      'search_epa_facilities',
      'random text with no location'
    );
    expect(params).toEqual({});
  });

  test('Extracts multiple parameters', () => {
    const params = extractParametersFromQuery(
      'search_cases',
      'bankruptcy cases in Pennsylvania from 2020'
    );
    expect(params).toEqual({
      query: 'bankruptcy cases in Pennsylvania from 2020',
      include_snippet: true,
      limit: 10
    });
  });
});
```

**Implementation Strategy:**
```javascript
// src/utils/parameterExtractor.js (NEW FILE - NO BREAKING CHANGES)
export function extractParametersFromQuery(toolName, userQuery) {
  // Pure function - no side effects
  const extractors = {
    'search_epa_facilities': extractEPAParams,
    'search_cases': extractCaseParams,
    // Add more as tested
  };

  const extractor = extractors[toolName];
  return extractor ? extractor(userQuery) : {};
}
```

### Module 3: Parameter Validation (ISOLATED)
**Location:** New standalone function
**Impact:** Pure function, returns validation result
**Risk Level:** ★☆☆☆☆ (Very Low)

#### Isolated Test Plan:
```javascript
// test/test-parameter-validation.js
describe('Parameter Validation Module', () => {
  test('Validates EPA facility parameters', () => {
    const result = validateToolParameters('search_epa_facilities', {});
    expect(result.valid).toBe(false);
    expect(result.message).toContain('requires at least one location');
  });

  test('Accepts valid parameters', () => {
    const result = validateToolParameters('search_epa_facilities', {
      state: 'PA'
    });
    expect(result.valid).toBe(true);
  });

  test('Adds safe defaults', () => {
    const result = validateToolParameters('search_cases', {
      query: 'test'
    });
    expect(result.parameters.include_snippet).toBe(true);
    expect(result.parameters.limit).toBe(10);
  });
});
```

### Module 4: Retry Logic (FEATURE FLAGGED)
**Location:** Modified `executeTool()` with feature flag
**Impact:** Only active when enabled
**Risk Level:** ★★☆☆☆ (Low with flag)

#### Isolated Test Plan:
```javascript
// test/test-retry-logic.js
describe('Retry Logic Module', () => {
  beforeEach(() => {
    process.env.ENABLE_PARAM_RETRY = 'true';
  });

  test('Retries with extracted parameters on empty input', async () => {
    const toolCall = {
      name: 'search_epa_facilities',
      input: {}
    };

    // Mock the extraction
    jest.mock('../utils/parameterExtractor', () => ({
      extractParametersFromQuery: () => ({ state: 'PA' })
    }));

    const result = await executeTool(toolCall);
    expect(result.parameters.state).toBe('PA');
    expect(result.success).toBe(true);
  });

  test('Disabled when flag is off', async () => {
    process.env.ENABLE_PARAM_RETRY = 'false';
    // Original behavior should occur
  });
});
```

## Incremental Testing Strategy

### Phase 1: Read-Only Enhancements (Week 1)
**Zero Risk - No Execution Changes**

1. **Day 1-2:** Implement and test `enhanceToolDescription()`
   - Test with console.log outputs
   - Verify tool descriptions are enhanced
   - No changes to execution flow

2. **Day 3:** Deploy with monitoring
   - Log enhanced descriptions
   - Verify no performance impact
   - Collect baseline metrics

### Phase 2: Pure Functions (Week 2)
**Zero Risk - Standalone Functions**

3. **Day 4-5:** Implement `extractParametersFromQuery()`
   - Create as separate utility file
   - Test extensively with unit tests
   - No integration with main flow

4. **Day 6-7:** Implement `validateToolParameters()`
   - Another separate utility
   - Pure validation logic
   - Comprehensive test suite

### Phase 3: Feature-Flagged Integration (Week 3)
**Controlled Risk - Gradual Rollout**

5. **Day 8-9:** Add retry logic with feature flag
```javascript
if (process.env.ENABLE_PARAM_ENHANCEMENT === 'true') {
  // New logic
  if (!toolCall.input || Object.keys(toolCall.input).length === 0) {
    toolCall.input = extractParametersFromQuery(toolCall.name, query);
  }
} else {
  // Original logic unchanged
}
```

6. **Day 10:** Test with flag enabled for specific tools
```javascript
const ENHANCED_TOOLS = process.env.ENHANCED_TOOLS?.split(',') || [];
if (ENHANCED_TOOLS.includes(toolCall.name)) {
  // Apply enhancements
}
```

### Phase 4: Gradual Rollout (Week 4)
**Monitored Deployment**

7. **Day 11-12:** Enable for one tool in production
   - Start with search_federal_register (already working)
   - Monitor success rates
   - Compare before/after metrics

8. **Day 13-14:** Expand to problem tools
   - Enable for search_epa_facilities
   - Then search_cases
   - Then search_dockets

## Testing Isolation Matrix

| Module | Dependencies | Side Effects | Test Method | Risk |
|--------|-------------|--------------|-------------|------|
| enhanceToolDescription | None | None | Unit tests | Very Low |
| extractParametersFromQuery | None | None | Unit tests | Very Low |
| validateToolParameters | None | None | Unit tests | Very Low |
| Retry Logic | Above 3 modules | Tool execution | Integration tests with mocks | Low (flagged) |
| System Prompt | None | Claude behavior | A/B testing | Low |

## Continuous Integration Tests

```yaml
# .github/workflows/modular-tests.yml
name: Modular Testing

on: [push, pull_request]

jobs:
  test-enhancements:
    runs-on: ubuntu-latest
    steps:
      - name: Test Tool Enhancements
        run: npm test -- test/test-tool-enhancement.js

  test-extraction:
    runs-on: ubuntu-latest
    steps:
      - name: Test Parameter Extraction
        run: npm test -- test/test-parameter-extraction.js

  test-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Test Parameter Validation
        run: npm test -- test/test-parameter-validation.js

  test-integration:
    runs-on: ubuntu-latest
    steps:
      - name: Test With Feature Flags
        env:
          ENABLE_PARAM_ENHANCEMENT: true
        run: npm test -- test/test-integration.js
```

## Benchmark Clients (FDA/GovInfo): Invariants and Tests

The FDA and GovInfo web clients are our reference implementations. The following invariants and tests should be used to validate any new or refactored client (e.g., State Statute, State Court Rules) to ensure feature parity without regressions.

### Invariants observed in benchmark clients
- Domains (authoritative, scoped via includeDomains)
  - FDA: `fda.gov`, `accessdata.fda.gov`, `clinicaltrials.gov`
  - GovInfo (USC): `govinfo.gov`, `uscode.house.gov`, `law.cornell.edu/uscode`, `congress.gov`, `constitution.congress.gov`, `gpo.gov`

- Exa execution settings (BaseWebSearchClient)
  - Always pass `includeDomains` with the client’s domain preset
  - Provide strong `highlightQuery` (domain-specific); allow Base fallback when omitted
  - Prefer snippets first; enable `fallbackToText` for low-quality highlights
  - Reasonable `numSentences` and `highlightsPerUrl` (4–7 sentences, 2–3 per URL)

- Query builders and filtering
  - FDA: `buildFDAQuery()` + `convertOpenFDASearch()` convert fielded search → natural language
  - GovInfo: `buildUSCQuery()`, `buildUSCSectionQuery()`, `buildTitleStructureQuery()`
  - Domain guards: FDA uses `isFDADomain(url)` post-filtering

- Result mapping and quality metadata
  - FDA maps to stable shapes by type: `adverse_event`, `device_event`, `drug_label`, `recall`, etc.
  - All Base results enriched with `_highlight_quality { confidence, coverage, relevance, extraction_method }`

- Tool wiring and server integration
  - `toolDefinitions.js`: concise descriptions, safe defaults, token-aware limits
  - `toolImplementations.js`: direct mapping to web clients, wrapped with conversation logging
  - `claude-server-v2.js`: enhancement-ready (description expansion), compatible with future validation/retry

### Tests to codify these invariants

1) Unit: Query builders produce scoped, biasing queries
```javascript
// test/fda.query.test.js
import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';

test('convertOpenFDASearch maps fields to natural language', () => {
  const c = new FDAWebSearchClient();
  const q = c.convertOpenFDASearch('patient.drug.medicinalproduct:aspirin serious:true');
  expect(q).toMatch(/drug name "aspirin"/i);
});

test('buildFDAQuery scopes to FDA domains and safety terms', () => {
  const c = new FDAWebSearchClient();
  const q = c.buildFDAQuery({ search: 'openfda.brand_name:ibuprofen', dataType: 'drug_labels' });
  expect(q).toMatch(/site:fda\.gov/i);
  expect(q).toMatch(/site:accessdata\.fda\.gov/i);
});
```

```javascript
// test/govinfo.query.test.js
import { GovInfoWebSearchClient } from '../src/api-clients/GovInfoWebSearchClient.js';

test('buildUSCSectionQuery includes multiple USC citation formats', () => {
  const c = new GovInfoWebSearchClient();
  const q = c.buildUSCSectionQuery(42, '1983', 'The Public Health and Welfare');
  expect(q).toMatch(/42 U\.S\.C\. § 1983/);
  expect(q).toMatch(/42 USC 1983/);
});
```

2) Unit: Domain scoping and filters
```javascript
// test/fda.domains.test.js
import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';

test('isFDADomain only accepts configured domains', () => {
  const c = new FDAWebSearchClient();
  expect(c.isFDADomain('https://www.fda.gov/drugs')).toBe(true);
  expect(c.isFDADomain('https://example.com')).toBe(false);
});
```

3) Integration: Exa request assembly (mock fetch)
```javascript
// test/govinfo.exa.test.js
import { GovInfoWebSearchClient } from '../src/api-clients/GovInfoWebSearchClient.js';

global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ results: [] }) }));

test('passes includeDomains and highlightQuery to Base executeExaSearch', async () => {
  const c = new GovInfoWebSearchClient();
  await c.searchUSCodeWeb({ title_number: 15, section: '45' });
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.includeDomains).toEqual(expect.arrayContaining(['govinfo.gov', 'uscode.house.gov']));
  // contents.highlights.query present when includeFullText is false
  expect(body.contents.highlights.query).toBeTruthy();
});
```

4) Unit: Result mapping and quality metadata
```javascript
// test/fda.mapping.test.js
import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';

test('mapFDAResult adds highlight_quality and type-specific metadata', () => {
  const c = new FDAWebSearchClient();
  const mapped = c.mapFDAResult({ url: 'https://www.fda.gov/x', title: 't', text: 'Recall Reason Description defective lot A1' , _highlight_quality: { confidence: 0.8 } }, 'recall', false, true);
  expect(mapped.result_type).toBe('recall');
  expect(mapped.highlight_quality.confidence).toBeDefined();
  expect(mapped.metadata.recall_reason).toBeTruthy();
});
```

5) Tool wiring: Definitions and implementations stay in sync
```javascript
// test/tools.wiring.test.js
import { govInfoTools, fdaTools } from '../src/tools/toolDefinitions.js';

test('GovInfo tools have safe defaults and bounded limits', () => {
  const search = govInfoTools.find(t => t.name === 'search_us_code');
  expect(search.inputSchema.properties.limit.default).toBeDefined();
});
```

6) Server compatibility: Descriptions and (future) validation/retry
```javascript
// test/server.enhancements.smoke.test.js
// Ensure enhanceToolDescription can enrich FDA/GovInfo tools without side effects
// (import location per file structure; may expose via a helper for testing)
```

### CI additions for benchmark conformance
```yaml
  test-fda-web:
    runs-on: ubuntu-latest
    steps:
      - name: Test FDA client behavior
        run: npm test -- test/fda.*.test.js

  test-govinfo-web:
    runs-on: ubuntu-latest
    steps:
      - name: Test GovInfo client behavior
        run: npm test -- test/govinfo.*.test.js
```

### Rollout checklist for new/updated clients
- Verify domain preset completeness (authoritative-first)
- Ensure highlightQuery present (custom or Base domain key)
- Enable `fallbackToText` in Base options
- Add post-filter (e.g., `is<Domain>Domain`) if needed
- Add smoke tests (query builder, Exa request assembly, mapping)
- Gate rollout with feature flag if changing execution flow

## Rollback Strategy

Each module can be independently disabled:

```javascript
// Emergency rollback configuration
const CONFIG = {
  enableEnhancement: process.env.ENABLE_ENHANCEMENT !== 'false',
  enableExtraction: process.env.ENABLE_EXTRACTION !== 'false',
  enableValidation: process.env.ENABLE_VALIDATION !== 'false',
  enableRetry: process.env.ENABLE_RETRY !== 'false'
};

// In executeTool
if (CONFIG.enableRetry && CONFIG.enableExtraction) {
  // Enhanced flow
} else {
  // Original flow
}
```

## Module Testing Checklist

### For Each Module:
- [ ] **Unit Tests** - Test in complete isolation
- [ ] **Integration Tests** - Test with mocked dependencies
- [ ] **Performance Tests** - Ensure no degradation
- [ ] **Error Cases** - Test failure scenarios
- [ ] **Edge Cases** - Test boundary conditions
- [ ] **Regression Tests** - Ensure no breaks to existing functionality

### Before Integration:
- [ ] **Feature Flag** - Implement on/off switch
- [ ] **Logging** - Add detailed logging for debugging
- [ ] **Metrics** - Track success/failure rates
- [ ] **Documentation** - Update with new behavior
- [ ] **Rollback Plan** - Document how to disable

### During Rollout:
- [ ] **Start Small** - One tool at a time
- [ ] **Monitor Closely** - Watch error rates
- [ ] **Compare Metrics** - Before/after success rates
- [ ] **User Feedback** - Collect issues
- [ ] **Iterate** - Fix issues before expanding

## Benefits of Modular Approach

1. **Risk Mitigation**
   - Each module tested independently
   - No system-wide failures
   - Easy rollback per module

2. **Faster Debugging**
   - Issues isolated to specific modules
   - Clear error boundaries
   - Simpler root cause analysis

3. **Parallel Development**
   - Multiple developers can work on different modules
   - No merge conflicts
   - Independent testing

4. **Confidence Building**
   - Prove each component works
   - Build on solid foundations
   - Incremental improvements

5. **Production Safety**
   - Feature flags allow instant rollback
   - Gradual rollout reduces blast radius
   - A/B testing validates improvements

## Recommended Implementation Order

### Week 1: Foundation (No Risk)
1. Create test framework
2. Implement parameter extraction (standalone)
3. Implement validation (standalone)
4. Unit test extensively

### Week 2: Enhancement (Low Risk)
5. Add tool description enhancements
6. Test with logging only
7. Verify no side effects

### Week 3: Integration (Controlled Risk)
8. Add feature-flagged retry logic
9. Test with one tool
10. Monitor metrics

### Week 4: Rollout (Monitored Risk)
11. Gradually enable for more tools
12. Monitor success rates
13. Fix any issues found
14. Full rollout when stable

## Conclusion

You're absolutely right - testing each module independently is the prudent approach. This strategy:

1. **Isolates issues** to specific modules
2. **Prevents cascading failures**
3. **Allows incremental validation**
4. **Enables safe rollback**
5. **Builds confidence** through proven components

Rather than a "big bang" implementation that could break multiple systems, this modular approach ensures each piece is solid before integration, reducing risk and improving maintainability.
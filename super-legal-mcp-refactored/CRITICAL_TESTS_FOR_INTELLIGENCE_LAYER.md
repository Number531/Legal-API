# Critical Tests to Add Before Intelligence Layer Integration

## Priority Tests for Tool Calling Reliability

### 1. SEC API Helper Tests (CRITICAL - Currently Missing) 🔴

**File to Create**: `tests/unit/utils/secApiHelper.test.js`

This is the **most critical missing test** since the SEC API routing was the source of major production bugs.

```javascript
describe('SEC API Helper - URL Routing', () => {
  test('routes /company_tickers.json to www.sec.gov/files', () => {
    // Verify: https://www.sec.gov/files/company_tickers.json
  });
  
  test('routes /submissions/CIK*.json to data.sec.gov WITHOUT /api', () => {
    // Verify: https://data.sec.gov/submissions/CIK0000320193.json
  });
  
  test('routes /api/xbrl/companyfacts to data.sec.gov WITH /api', () => {
    // Verify: https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json
  });
  
  test('routes /xbrl/* paths by adding /api prefix', () => {
    // Verify: /xbrl/companyfacts → /api/xbrl/companyfacts
  });
  
  test('includes proper User-Agent header for all requests', () => {
    // Critical for SEC API acceptance
  });
});
```

### 2. Tool Response Format Validation Tests 🟡

**File to Enhance**: `tests/integration/server/EnhancedLegalMcpServer.test.js`

Add tests to ensure all tool responses match MCP protocol exactly:

```javascript
describe('MCP Protocol Compliance', () => {
  test('all tools return content array with type/text structure', async () => {
    // Verify response format:
    // { content: [{ type: "text", text: "..." }] }
  });
  
  test('error responses include proper MCP error codes', async () => {
    // Verify: McpError with ErrorCode.InvalidRequest, etc.
  });
  
  test('handles null/undefined arguments gracefully', async () => {
    // Every tool should handle missing args
  });
  
  test('validates response size limits', async () => {
    // Ensure responses don't exceed token limits
  });
});
```

### 3. Complex Query Pattern Tests 🟡

**File to Create**: `tests/integration/intelligencePatterns.test.js`

Test patterns that an intelligence layer would use:

```javascript
describe('Intelligence Layer Query Patterns', () => {
  test('handles multi-step legal research workflow', async () => {
    // 1. Search company ticker → Get CIK
    // 2. Use CIK → Get SEC filings
    // 3. Extract dates → Search court cases in same period
  });
  
  test('handles entity correlation across APIs', async () => {
    // Company name in SEC → Same company in court cases
    // Judge name in opinions → Same judge in financial disclosures
  });
  
  test('handles date range queries across all tools', async () => {
    // Consistent date filtering across APIs
  });
  
  test('handles partial/fuzzy company name matching', async () => {
    // "Apple" → "Apple Inc.", "AAPL"
    // "Google" → "Alphabet Inc.", "GOOGL"
  });
});
```

### 4. Concurrent Request Handling Tests 🟡

**File to Create**: `tests/integration/concurrency.test.js`

```javascript
describe('Concurrent Tool Calls', () => {
  test('handles 10 simultaneous tool calls', async () => {
    // Intelligence layer may batch requests
  });
  
  test('rate limiting works across concurrent requests', async () => {
    // SEC: 9/sec, USPTO: 45/min limits respected
  });
  
  test('cache prevents duplicate concurrent API calls', async () => {
    // Same query twice simultaneously = 1 API call
  });
  
  test('different tools can run in parallel', async () => {
    // SEC + CourtListener + USPTO simultaneously
  });
});
```

### 5. Data Consistency Tests 🟡

**File to Create**: `tests/integration/dataConsistency.test.js`

```javascript
describe('Data Consistency Across Tools', () => {
  test('CIK format consistency across all SEC tools', () => {
    // "320193" vs "0000320193" handling
  });
  
  test('date format consistency across all tools', () => {
    // YYYY-MM-DD everywhere
  });
  
  test('empty result handling consistency', () => {
    // All tools handle "no results" the same way
  });
  
  test('error message consistency', () => {
    // Similar errors have similar messages
  });
});
```

### 6. Graceful Degradation Tests 🟡

**File to Enhance**: `tests/e2e/index.test.js`

```javascript
describe('Graceful Degradation', () => {
  test('continues working when one API is down', async () => {
    // If SEC fails, other tools still work
  });
  
  test('provides helpful context when API key missing', async () => {
    // Clear message about limited functionality
  });
  
  test('handles timeout gracefully with partial results', async () => {
    // Returns what it can within time limit
  });
  
  test('caches work when APIs are down', async () => {
    // Cached results still returned
  });
});
```

### 7. Tool Discovery Tests 🟡

**File to Enhance**: `tests/unit/tools/toolDefinitions.test.js`

```javascript
describe('Tool Discovery for Intelligence Layer', () => {
  test('all tools have unique, descriptive names', () => {
    // No naming conflicts
  });
  
  test('all tools have comprehensive descriptions', () => {
    // Intelligence layer can understand purpose
  });
  
  test('all parameters have clear descriptions', () => {
    // Intelligence layer knows how to use them
  });
  
  test('examples provided for complex tools', () => {
    // Usage patterns documented
  });
});
```

## Implementation Priority

### Must Have Before Intelligence Layer (Do First) 🔴

1. **SEC API Helper Tests** - Prevents regression of critical bugs
2. **MCP Protocol Compliance Tests** - Ensures proper tool responses

### Should Have (Do Second) 🟡

3. **Complex Query Pattern Tests** - Validates real-world usage
4. **Concurrent Request Tests** - Ensures scalability
5. **Data Consistency Tests** - Prevents confusion

### Nice to Have (Do Later) 🟢

6. **Graceful Degradation Tests** - Improves resilience
7. **Tool Discovery Tests** - Helps intelligence layer

## Quick Test Implementation

### Minimal SEC API Helper Test

Create `tests/unit/utils/secApiHelper.test.js`:

```javascript
import { describe, test, expect, jest } from '@jest/globals';
import { makeSECApiRequest } from '../../../src/utils/secApiHelper.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('SEC API Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ test: 'data' })
    });
  });

  test('routes company_tickers.json to correct URL', async () => {
    await makeSECApiRequest('/company_tickers.json');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.sec.gov/files/company_tickers.json',
      expect.any(Object)
    );
  });

  test('routes submissions without /api prefix', async () => {
    await makeSECApiRequest('/submissions/CIK0000320193.json');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/submissions/CIK0000320193.json',
      expect.any(Object)
    );
  });

  test('routes XBRL with /api prefix', async () => {
    await makeSECApiRequest('/api/xbrl/companyfacts/CIK0000320193.json');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
      expect.any(Object)
    );
  });

  test('adds /api prefix to /xbrl paths', async () => {
    await makeSECApiRequest('/xbrl/companyfacts/CIK0000320193.json');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
      expect.any(Object)
    );
  });

  test('includes proper headers', async () => {
    await makeSECApiRequest('/test');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('Enhanced-Legal-MCP'),
          'Accept': 'application/json'
        })
      })
    );
  });

  test('handles API errors properly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(makeSECApiRequest('/invalid'))
      .rejects
      .toThrow('SEC API request failed: 404 Not Found');
  });
});
```

## Summary

### Critical Additions Needed:

1. **SEC API Helper Tests** (1 file, ~10 tests) - MOST IMPORTANT
2. **MCP Protocol Compliance** (enhance existing, ~5 tests)
3. **Intelligence Pattern Tests** (1 file, ~8 tests)

### Total New Tests Needed: ~25-30 tests

These tests will ensure:
- SEC routing bugs don't regress (critical for production)
- Tool responses are intelligence-layer compatible
- Complex multi-tool workflows work correctly
- System handles concurrent requests properly

With these additions, the test suite will be **fully ready** for intelligence layer integration, bringing total coverage to approximately **80-85%** with all critical paths thoroughly tested.
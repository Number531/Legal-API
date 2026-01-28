# Unit Test Recommendations for Super-Legal-MCP-Refactored

## Priority 1: Critical Core Functionality Tests

### 1. SEC API Helper Tests (`src/utils/secApiHelper.test.js`)
**Why Critical**: SEC has complex URL routing that was the source of major bugs

```javascript
describe('SEC API Helper', () => {
  describe('URL routing', () => {
    test('routes company_tickers.json to www.sec.gov/files');
    test('routes submissions to data.sec.gov without /api prefix');
    test('routes XBRL companyfacts with /api prefix');
    test('handles rate limiting correctly');
    test('includes proper User-Agent headers');
  });
});
```

### 2. SEC Data Format Conversion Tests (`src/api-clients/SecEdgarClient.test.js`)
**Why Critical**: SEC's columnar format was causing failures

```javascript
describe('SEC Edgar Client', () => {
  describe('columnar to row conversion', () => {
    test('converts SEC columnar format to array of objects');
    test('handles missing fields in columnar data');
    test('preserves all filing fields during conversion');
    test('handles empty filings response');
  });
  
  describe('filterSECFilings', () => {
    test('filters by filing type (10-K, 10-Q, 8-K)');
    test('filters by date range');
    test('handles "all" filing type');
    test('returns empty array for invalid input');
  });
});
```

### 3. Rate Limiter Tests (`src/utils/rateLimiter.test.js`)
**Why Critical**: Prevents API throttling and ensures compliance

```javascript
describe('Rate Limiter', () => {
  test('enforces per-second limits for SEC (9/sec)');
  test('enforces per-minute limits for USPTO (45/min)');
  test('implements exponential backoff on 429 responses');
  test('tracks requests across multiple API types');
  test('cleans up old request timestamps');
});
```

## Priority 2: API Client Tests

### 4. CourtListener Client Tests (`src/api-clients/CourtListenerClient.test.js`)
```javascript
describe('CourtListener Client', () => {
  describe('searchCases', () => {
    test('builds correct query parameters');
    test('handles authentication token');
    test('processes search results correctly');
    test('handles empty search results');
    test('respects filed_after and filed_before dates');
  });
  
  describe('searchJudges', () => {
    test('searches by name');
    test('filters by appointer');
    test('handles pagination');
  });
});
```

### 5. GovInfo Client Tests (`src/api-clients/GovInfoClient.test.js`)
```javascript
describe('GovInfo Client', () => {
  describe('searchUSCode', () => {
    test('searches by title number');
    test('searches by text query');
    test('handles USC section format');
    test('validates API key presence');
  });
  
  describe('USC full text (disabled)', () => {
    test('returns appropriate message when full text requested');
    test('provides download URLs as alternative');
  });
});
```

### 6. Federal Register Client Tests (`src/api-clients/FederalRegisterClient.test.js`)
```javascript
describe('Federal Register Client', () => {
  test('builds search query with multiple conditions');
  test('filters by agency');
  test('filters by document type');
  test('handles date ranges');
  test('filters significant documents');
});
```

## Priority 3: Utility Function Tests

### 7. API Helpers Tests (`src/utils/apiHelpers.test.js`)
```javascript
describe('API Helpers', () => {
  describe('resolveToCIK', () => {
    test('returns CIK if already 10-digit number');
    test('resolves ticker symbol to CIK');
    test('resolves company name to CIK');
    test('throws error for unknown company');
    test('handles partial name matches');
  });
  
  describe('makeApiRequest', () => {
    test('adds authorization headers when required');
    test('retries on failure with exponential backoff');
    test('caches successful responses');
    test('returns cached data when available');
    test('handles 429 rate limit responses');
  });
  
  describe('extractKeyFinancialFacts', () => {
    test('extracts revenue from XBRL data');
    test('extracts net income');
    test('extracts total assets');
    test('handles missing financial data gracefully');
    test('returns latest values from time series');
  });
});
```

### 8. Cache Tests (`src/utils/cache.test.js`)
```javascript
describe('Cache', () => {
  test('stores and retrieves data');
  test('respects TTL expiration');
  test('generates consistent cache keys');
  test('cleans up expired entries');
  test('handles concurrent access');
});
```

### 9. Validation Tests (`src/utils/validation.test.js`)
```javascript
describe('Validation', () => {
  test('validates date formats (YYYY-MM-DD)');
  test('validates court IDs');
  test('validates CIK numbers');
  test('validates ticker symbols');
  test('sanitizes user input');
});
```

## Priority 4: Integration Tests

### 10. Tool Implementation Tests (`src/tools/toolImplementations.test.js`)
```javascript
describe('Tool Implementations', () => {
  test('all 39 tools are registered');
  test('each tool has valid input schema');
  test('tool handlers return correct response format');
  test('error responses follow MCP error format');
});
```

### 11. MCP Server Tests (`src/server/EnhancedLegalMcpServer.test.js`)
```javascript
describe('MCP Server', () => {
  test('initializes all API clients');
  test('handles tool/list requests');
  test('handles tool/call requests');
  test('validates tool arguments');
  test('handles missing API keys gracefully');
  test('implements graceful shutdown');
});
```

## Priority 5: Edge Cases and Error Handling

### 12. Error Scenario Tests
```javascript
describe('Error Handling', () => {
  test('handles network timeouts');
  test('handles malformed API responses');
  test('handles invalid JSON');
  test('handles API service downtime');
  test('provides helpful error messages');
  test('doesn't expose sensitive information in errors');
});
```

### 13. Data Edge Cases Tests
```javascript
describe('Data Edge Cases', () => {
  test('handles companies with multiple tickers');
  test('handles companies with special characters in names');
  test('handles very large result sets');
  test('handles unicode in legal documents');
  test('handles missing optional fields');
});
```

## Priority 6: Performance Tests

### 14. Performance Tests
```javascript
describe('Performance', () => {
  test('caching reduces response time for repeated queries');
  test('rate limiting doesn't block other API calls');
  test('handles 100+ concurrent requests');
  test('memory usage stays under 200MB');
  test('cleanup processes don't block main thread');
});
```

## Test Implementation Strategy

### Phase 1: Critical Path (Week 1)
1. SEC API Helper tests (URL routing bugs were showstoppers)
2. SEC data format conversion tests
3. Rate limiter tests

### Phase 2: API Clients (Week 2)
4. CourtListener client tests
5. GovInfo client tests
6. Federal Register client tests
7. USPTO client tests

### Phase 3: Infrastructure (Week 3)
8. Cache tests
9. Validation tests
10. API helpers tests

### Phase 4: Integration (Week 4)
11. Tool implementation tests
12. MCP server tests
13. End-to-end workflow tests

## Test Data Management

### Mock Data Files Needed
```
/tests/fixtures/
├── sec/
│   ├── company_tickers.json
│   ├── submissions_response.json
│   ├── company_facts.json
│   └── xbrl_frames.json
├── courtlistener/
│   ├── cases_response.json
│   ├── judges_response.json
│   └── opinions_response.json
├── govinfo/
│   ├── usc_search.json
│   └── usc_titles.json
└── common/
    ├── error_responses.json
    └── rate_limit_response.json
```

## Coverage Goals

### Minimum Acceptable Coverage
- **Critical paths**: 90% coverage
- **API clients**: 80% coverage
- **Utilities**: 85% coverage
- **Overall**: 75% coverage

### Ideal Coverage
- **Critical paths**: 100% coverage
- **API clients**: 90% coverage
- **Utilities**: 95% coverage
- **Overall**: 85% coverage

## Testing Best Practices

### 1. Mock External APIs
```javascript
// Use Jest mocks for all external API calls
jest.mock('node-fetch');
fetch.mockResolvedValue({
  ok: true,
  json: async () => mockData
});
```

### 2. Test Isolation
```javascript
// Each test should be independent
beforeEach(() => {
  jest.clearAllMocks();
  cache.clear();
});
```

### 3. Descriptive Test Names
```javascript
// Bad: test('works')
// Good: test('returns filtered 10-K filings when filing_type is "10-K"')
```

### 4. Test Data Builders
```javascript
// Create reusable test data factories
const createMockFiling = (overrides = {}) => ({
  form: '10-K',
  filingDate: '2024-01-01',
  accessionNumber: '0000000000-24-000001',
  ...overrides
});
```

## Continuous Integration Recommendations

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Return on Investment

### High ROI Tests (implement first)
1. **SEC URL routing** - Prevents major production failures
2. **Data format conversions** - Ensures data integrity
3. **Rate limiting** - Prevents API bans
4. **Authentication** - Ensures security

### Medium ROI Tests
5. **Search filters** - Validates business logic
6. **Error handling** - Improves user experience
7. **Caching** - Ensures performance

### Lower ROI Tests (implement last)
8. **Edge cases** - Handles rare scenarios
9. **Performance tests** - Optimization validation

## Summary

Total recommended tests: **~150-200 test cases**

Priority distribution:
- **Critical (P1)**: 30 tests - Implement immediately
- **High (P2-P3)**: 60 tests - Implement within 2 weeks
- **Medium (P4-P5)**: 50 tests - Implement within month
- **Nice to have (P6)**: 30 tests - Implement as time permits

This comprehensive test suite would provide confidence in:
- API integration reliability
- Data transformation accuracy
- Rate limiting compliance
- Error handling robustness
- Performance characteristics

The tests focus on areas where bugs were found (SEC API) and critical functionality that could cause production failures.
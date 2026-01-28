# WebSearch Client Migration - Step-by-Step Checklist & Testing Guide

## Master Migration Checklist

### 📋 Pre-Migration Assessment
- [ ] Identify target API client for migration
- [ ] Document current API endpoints and parameters
- [ ] Analyze response data structure
- [ ] Identify key content patterns for snippet extraction
- [ ] Review rate limits and authentication requirements
- [ ] Check for existing test coverage

### 🏗️ Phase 1: FederalRegisterWebSearchClient

#### Step 1: Create Client Implementation
- [ ] Create `/src/api-clients/FederalRegisterWebSearchClient.js`
- [ ] Import required dependencies:
  ```javascript
  import { validateLimit } from '../utils/validation.js';
  import { handleApiError } from '../utils/errorHandling.js';
  ```
- [ ] Define class with constructor:
  ```javascript
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY)
  ```
- [ ] Implement core methods:
  - [ ] `searchFederalRegisterWeb()`
  - [ ] `searchDocketsWeb()`
  - [ ] `searchRulesWeb()`
  - [ ] `searchNoticesWeb()`
  - [ ] `extractSmartSnippet()`
  - [ ] `executeExaSearch()`
  - [ ] `buildFederalRegisterQuery()`
  - [ ] `mapFederalRegisterResult()`

#### Step 2: Implement Snippet Extraction
- [ ] Define domain-specific patterns:
  ```javascript
  const meaningfulSections = [
    /executive\s+summary[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /background[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /purpose[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /supplementary\s+information[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
  ];
  ```
- [ ] Implement fallback to first meaningful paragraph
- [ ] Add length trimming with ellipsis
- [ ] Test snippet quality manually

#### Step 3: Create Mock Test Suite
- [ ] Create `/test/test-federal-register-web-client-mock.js`
- [ ] Mock Exa API responses:
  ```javascript
  const mockExaResponse = {
    results: [
      {
        title: "Federal Register Document",
        url: "https://www.federalregister.gov/documents/2025/01/06/...",
        text: "Full document text...",
        publishedDate: "2025-01-06"
      }
    ]
  };
  ```
- [ ] Test cases to implement:
  - [ ] Basic search without content
  - [ ] Search with snippets
  - [ ] Search with full text
  - [ ] Empty results handling
  - [ ] Error handling (API failure)
  - [ ] Rate limiting behavior
  - [ ] Parameter validation
  - [ ] Query building logic

#### Step 4: Run Mock Tests
```bash
# Run mock tests
node test/test-federal-register-web-client-mock.js
```
- [ ] All mock tests pass
- [ ] Document any issues found
- [ ] Fix implementation based on test results
- [ ] Re-run until all pass

#### Step 5: Create Live Test Suite
- [ ] Create `/test/test-federal-register-web-client-live.js`
- [ ] Import actual client with real API key
- [ ] Implement test cases:
  ```javascript
  const testCases = [
    {
      name: 'Federal Register Search - Basic',
      method: 'searchFederalRegisterWeb',
      args: {
        search_term: 'environmental protection',
        limit: 3
      },
      expectedFields: ['title', 'url', 'document_number']
    },
    {
      name: 'Federal Register Search - With Snippets',
      method: 'searchFederalRegisterWeb',
      args: {
        search_term: 'environmental protection',
        limit: 3,
        include_snippet: true
      },
      expectedFields: ['title', 'url', 'document_number', 'snippet'],
      validateSnippet: true
    },
    {
      name: 'Federal Register Search - With Full Text',
      method: 'searchFederalRegisterWeb',
      args: {
        search_term: 'environmental protection',
        limit: 2,
        include_text: true
      },
      expectedFields: ['title', 'url', 'document_number', 'full_text'],
      validateFullText: true
    }
  ];
  ```

#### Step 6: Run Live Tests
```bash
# Set environment variable if needed
export EXA_API_KEY=your_key_here

# Run live tests
node test/test-federal-register-web-client-live.js
```
- [ ] Verify Exa API connectivity
- [ ] Confirm results match expected structure
- [ ] Validate snippet quality (500 chars, meaningful content)
- [ ] Check full text retrieval
- [ ] Monitor rate limiting
- [ ] Document response times

#### Step 7: Update Tool Definitions
- [ ] Open `/src/tools/toolDefinitions.js`
- [ ] Add new tool definition:
  ```javascript
  {
    name: "search_federal_register",
    description: "Search Federal Register documents via intelligent web search",
    properties: {
      search_term: {
        type: "string",
        description: "Search query for Federal Register documents",
        required: true
      },
      document_type: {
        type: "string",
        enum: ["rule", "proposed_rule", "notice", "presidential_document"],
        description: "Type of document to search"
      },
      agency: {
        type: "string",
        description: "Agency acronym (e.g., 'EPA', 'FDA')"
      },
      date_range: {
        type: "object",
        properties: {
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" }
        }
      },
      limit: {
        type: "number",
        default: 10,
        maximum: 100
      },
      include_snippet: {
        type: "boolean",
        description: "Include 500-char intelligent snippet",
        default: false
      },
      include_text: {
        type: "boolean",
        description: "Include full document text",
        default: false
      }
    }
  }
  ```
- [ ] Mark old tool as deprecated if exists

#### Step 8: Update Tool Implementations
- [ ] Open `/src/tools/toolImplementations.js`
- [ ] Import new client
- [ ] Add implementation:
  ```javascript
  "search_federal_register": wrapWithConversation(
    "search_federal_register",
    (args) => federalRegisterWeb.searchFederalRegisterWeb(args)
  ),
  ```
- [ ] Remove or comment old implementation

#### Step 9: Update Server Configuration
- [ ] Open `/src/server/EnhancedLegalMcpServer.js`
- [ ] Import new client:
  ```javascript
  import { FederalRegisterWebSearchClient } from '../api-clients/FederalRegisterWebSearchClient.js';
  ```
- [ ] Initialize client:
  ```javascript
  clients.federalRegisterWeb = new FederalRegisterWebSearchClient(
    rateLimiters.exa,
    process.env.EXA_API_KEY
  );
  ```
- [ ] Update any references to old client

#### Step 10: Integration Testing
- [ ] Start the server:
  ```bash
  node src/server/claude-server-v2.js
  ```
- [ ] Test via MCP protocol
- [ ] Verify tool appears in available tools
- [ ] Execute search with various parameters
- [ ] Confirm snippet functionality
- [ ] Test error handling

#### Step 11: Documentation
- [ ] Update migration status document
- [ ] Document any limitations
- [ ] Add usage examples
- [ ] Note performance metrics

#### Step 12: Final Validation
- [ ] All tests pass (mock and live)
- [ ] Backward compatibility maintained
- [ ] No breaking changes to existing tools
- [ ] Performance acceptable (<2s response time)
- [ ] Error messages clear and helpful

---

## Current Migration Status & Tool Analysis

### 📊 **Total Tools: 86 | Using Exa WebSearch: 50 tools (58%)**

### ✅ Fully Migrated to Exa WebSearch (50 tools):

#### **CourtListener (23 tools - 100% Exa):**
- **Primary tools (12)**: All legacy tool names now route to WebSearch client
- **Web variants (11)**: Explicit `*_web` tool names 
- **Status**: ✅ **COMPLETE** - All CourtListener functionality uses Exa

#### **SEC (4 tools - 100% Exa):**
- `search_sec_filings`, `get_sec_company_facts`, `get_sec_xbrl_frames`, `search_sec_company_tickers`
- **Status**: ✅ **COMPLETE** - All SEC tools use SECWebSearchClient

#### **EPA (6 tools - 100% Exa):**
- **Primary tools (3)**: Legacy tool names route to WebSearch
- **Web variants (3)**: Explicit `*_web` tool names
- **Status**: ✅ **COMPLETE** - All EPA tools use EPAWebSearchClient

#### **State Court Rules (12 tools - 100% Exa):**
- All procedural rule tools use StateCourtRulesWebSearchClient
- **Status**: ✅ **COMPLETE** - Court formatting & rules via Exa

#### **PTAB Web Search (4 tools - Exa Supplement):**
- IPR, PGR, CBM proceedings via PTABWebSearchClient
- **Status**: ✅ **COMPLETE** - Supplements native PTAB API

#### **State Statutes (1 tool - 100% Exa):**
- `search_state_statute` uses ExaClient
- **Status**: ✅ **COMPLETE** - Multi-state statute search

### ❌ Still Using Native APIs (36 tools - 42%):

#### **🔴 High Priority Migration (13 tools):**

**Federal Register (1 tool)**
- `search_federal_register` → **FederalRegisterWebSearchClient** (Phase 1)

**FTC (2 tools)** 
- `search_ftc_hsr_terminations`, `search_ftc_enforcement_actions` → **FTCWebSearchClient** (Phase 2)

**FDA (4 tools)**
- Drug events, labels, recalls → **FDAWebSearchClient** (Phase 3)

**NHTSA (6 tools)**
- Vehicle data, recalls, complaints → **NHTSAWebSearchClient** (Phase 4)

#### **🟡 Medium Priority - Hybrid Approach (10 tools):**

**GovInfo USC (4 tools)** - Keep API for structure, add Exa for content
**USPTO Patents (6 tools)** - Keep PatentsView for data, add Exa for text

#### **🟢 Low Priority - Keep Native API (11 tools):**

**Financial Disclosures (9 tools)** - Specialized judicial financial data
**PTAB Native (2 tools)** - Structured proceeding data (supplements Exa tools)

#### **🔵 Regulatory/Safety - Keep Native (2 tools):**
**CPSC (1 tool)** - Product recall data requires structured format

### ⚪ Not Applicable (2 tools):
**Utility Tools** - `comprehensive_legal_entity_analysis`, `draft_legal_filing`

---

## 🎯 Migration Success Metrics

### **Already Achieved:**
- ✅ **58% tool coverage** with Exa WebSearch
- ✅ **Major legal research areas** fully migrated:
  - Court cases & opinions (CourtListener)
  - SEC corporate filings 
  - EPA environmental compliance
  - State court procedural rules
  - Patent trial proceedings (PTAB supplement)
- ✅ **Seamless backward compatibility** maintained
- ✅ **Zero breaking changes** to existing tools

### **Target After High-Priority Migration:**
- 🎯 **73% tool coverage** (63 of 86 tools using Exa)
- 🎯 **Primary government document sources** migrated
- 🎯 **Reduced API key dependencies** by ~45%

---

## Sequential Migration Plan

## Remaining Migration Phases (13 High-Priority Tools)

### 🏗️ Phase 1: FederalRegisterWebSearchClient (1 tool)

**Priority**: 🔴 Highest - Federal regulations and rules via web search
**Impact**: Reduces Federal Register API dependency, enables snippet extraction

**Current Status**: `search_federal_register` uses native `federalRegister.searchFederalRegister()`

### 🏗️ Phase 2: FTCWebSearchClient (2 tools)

**⚠️ DO NOT START until Phase 1 is complete and validated**

**Priority**: 🔴 High - FTC enforcement actions and HSR terminations
**Impact**: Better contextual search for antitrust and consumer protection

**Current Status**: 
- `search_ftc_hsr_terminations` uses native `ftc.searchHSRTerminations()`
- `search_ftc_enforcement_actions` uses native `ftc.searchEnforcementActions()`

#### Repeat Steps 1-12 with FTC-specific modifications:
- [ ] Content patterns for FTC enforcement actions
- [ ] Query building for FTC-specific terms
- [ ] Test with FTC case examples
- [ ] Validate enforcement action snippets

---

### 🏗️ Phase 3: FDAWebSearchClient (4 tools)

**⚠️ DO NOT START until Phase 2 is complete and validated**

**Priority**: 🔴 High - Drug labels, recalls, and adverse events
**Impact**: Enhanced health & safety content extraction

**Current Status**:
- `search_fda_drug_adverse_events` uses native `fda.searchDrugAdverseEvents()`
- `search_fda_device_events` uses native `fda.searchDeviceEvents()`
- `search_fda_drug_labels` uses native `fda.searchDrugLabels()`
- `search_fda_recalls` uses native `fda.searchRecalls()`

#### Repeat Steps 1-12 with FDA-specific modifications:
- [ ] Drug label extraction patterns
- [ ] Recall notice formatting
- [ ] Safety alert snippets
- [ ] Medical device classifications

---

### 🏗️ Phase 4: NHTSAWebSearchClient (6 tools)

**⚠️ DO NOT START until Phase 3 is complete and validated**

**Priority**: 🔴 High - Vehicle safety data and recall information
**Impact**: Comprehensive automotive safety content search

**Current Status**:
- `nhtsa_decode_vin` uses native `nhtsa.decodeVin()`
- `nhtsa_models_for_make` uses native `nhtsa.getModelsForMake()`
- `nhtsa_recalls_by_vin` uses native `nhtsa.getRecallsByVin()`
- `nhtsa_recalls_by_make_model_year` uses native `nhtsa.getRecallsByMakeModelYear()`
- `nhtsa_search_complaints` uses native `nhtsa.searchComplaints()`
- `nhtsa_safety_ratings` uses native `nhtsa.getSafetyRatings()`

#### Repeat Steps 1-12 with NHTSA-specific modifications:
- [ ] Vehicle recall extraction patterns
- [ ] Defect investigation summaries
- [ ] Safety rating content
- [ ] Manufacturer response snippets

---

## Post-Migration Projections

### After Completing All 4 High-Priority Phases:
- **Total tools using Exa**: 63 of 86 (73%)
- **Government document coverage**: ~85% migrated
- **Snippet functionality**: Available across all major research areas
- **API key dependencies**: Reduced by ~45%

### Remaining Native API Usage (23 tools):
- **GovInfo USC (4 tools)** - Structured legal code navigation
- **USPTO Patents (6 tools)** - Patent database structured queries  
- **Financial Disclosures (9 tools)** - Judicial conflict of interest data
- **PTAB Native (2 tools)** - Structured proceeding metadata
- **CPSC (1 tool)** - Product safety recall database
- **Utility (2 tools)** - Internal orchestration tools

---

## Testing Guidelines

### Mock Testing Structure

```javascript
// test/test-[client]-mock.js
import { [Client]WebSearchClient } from '../src/api-clients/[Client]WebSearchClient.js';

class MockRateLimiter {
  async acquire() { return Promise.resolve(); }
}

class Mock[Client]WebSearchClient extends [Client]WebSearchClient {
  async executeExaSearch(query, limit, includeContents) {
    // Return mock data based on query
    return mockResponses[query] || [];
  }
}

async function runMockTests() {
  const client = new Mock[Client]WebSearchClient(
    new MockRateLimiter(),
    'mock-api-key'
  );

  // Test 1: Basic search
  try {
    const results = await client.searchMethod({ 
      query: 'test',
      limit: 5 
    });
    assert(results.results.length <= 5, 'Limit not respected');
    console.log('✅ Basic search test passed');
  } catch (error) {
    console.error('❌ Basic search test failed:', error);
  }

  // Test 2: Snippet generation
  try {
    const results = await client.searchMethod({
      query: 'test',
      include_snippet: true
    });
    assert(results.results[0].snippet, 'Snippet not generated');
    assert(results.results[0].snippet.length <= 500, 'Snippet too long');
    console.log('✅ Snippet test passed');
  } catch (error) {
    console.error('❌ Snippet test failed:', error);
  }
}
```

### Live Testing Structure

```javascript
// test/test-[client]-live.js
import { [Client]WebSearchClient } from '../src/api-clients/[Client]WebSearchClient.js';
import { RateLimiter } from '../utils/rateLimiter.js';

async function runLiveTests() {
  const rateLimiter = new RateLimiter(5, 1000);
  const client = new [Client]WebSearchClient(
    rateLimiter,
    process.env.EXA_API_KEY
  );

  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const testCase of testCases) {
    try {
      console.log(`\nRunning: ${testCase.name}`);
      const startTime = Date.now();
      
      const result = await client[testCase.method](testCase.args);
      
      const duration = Date.now() - startTime;
      console.log(`  Response time: ${duration}ms`);

      // Validate structure
      validateResponseStructure(result, testCase.expectedFields);
      
      // Validate content quality
      if (testCase.validateSnippet) {
        validateSnippetQuality(result.results);
      }
      
      if (testCase.validateFullText) {
        validateFullTextContent(result.results);
      }

      console.log(`  ✅ Test passed`);
      testResults.passed++;
      
    } catch (error) {
      console.error(`  ❌ Test failed: ${error.message}`);
      testResults.failed++;
      testResults.details.push({
        test: testCase.name,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed tests:');
    testResults.details.forEach(d => {
      console.log(`  - ${d.test}: ${d.error}`);
    });
  }
}
```

### Validation Functions

```javascript
function validateResponseStructure(response, expectedFields) {
  assert(response.results, 'No results array in response');
  assert(Array.isArray(response.results), 'Results is not an array');
  
  if (response.results.length > 0) {
    const firstResult = response.results[0];
    expectedFields.forEach(field => {
      assert(field in firstResult, `Missing field: ${field}`);
    });
  }
}

function validateSnippetQuality(results) {
  results.forEach((result, index) => {
    if (result.snippet) {
      assert(result.snippet.length > 0, `Empty snippet at index ${index}`);
      assert(result.snippet.length <= 500, `Snippet too long at index ${index}`);
      
      // Check for meaningful content (not just boilerplate)
      const boilerplatePatterns = [
        /^page \d+/i,
        /^table of contents/i,
        /^index/i
      ];
      
      const isBoilerplate = boilerplatePatterns.some(
        pattern => pattern.test(result.snippet)
      );
      assert(!isBoilerplate, `Boilerplate snippet at index ${index}`);
    }
  });
}

function validateFullTextContent(results) {
  results.forEach((result, index) => {
    if (result.full_text) {
      assert(result.full_text.length > 500, 
        `Full text too short at index ${index}`);
      assert(!result.snippet || result.full_text.includes(result.snippet.substring(0, 50)),
        `Snippet not found in full text at index ${index}`);
    }
  });
}
```

## Quality Gates

### Before Moving to Next Client

Each phase must meet these criteria before proceeding:

1. **Mock Tests**: 100% pass rate
2. **Live Tests**: >90% pass rate
3. **Response Time**: <2 seconds average
4. **Snippet Quality**: Meaningful content in >80% of results
5. **Error Handling**: Graceful failures with clear messages
6. **Documentation**: Complete and accurate
7. **Code Review**: Implementation follows patterns
8. **Integration Test**: Works with claude-server-v2.js

### Performance Benchmarks

| Metric | Acceptable | Good | Excellent |
|--------|------------|------|-----------|
| Response Time | <3s | <2s | <1s |
| Snippet Quality | 70% meaningful | 85% meaningful | 95% meaningful |
| Error Rate | <10% | <5% | <2% |
| Test Coverage | 80% | 90% | 95% |

## Rollback Plan

If issues are discovered after migration:

1. **Immediate Rollback**:
   ```javascript
   // In toolImplementations.js
   // Comment out new implementation
   // "search_federal_register": federalRegisterWeb.searchFederalRegisterWeb,
   
   // Uncomment old implementation  
   "search_federal_register": federalRegister.searchDocuments,
   ```

2. **Keep Both Versions**:
   ```javascript
   // Add versioned tools
   "search_federal_register": federalRegisterWeb.searchFederalRegisterWeb,
   "search_federal_register_legacy": federalRegister.searchDocuments,
   ```

3. **Document Issues**:
   - Record failure symptoms
   - Capture error logs
   - Note reproduction steps
   - File GitHub issue

## Common Issues & Solutions

### Issue: Snippets contain boilerplate
**Solution**: Refine extraction patterns, add skip patterns for headers/footers

### Issue: Exa returns no results
**Solution**: Adjust query building, add site filters, check domain availability

### Issue: Rate limiting errors
**Solution**: Increase delay in rate limiter, implement exponential backoff

### Issue: Full text too large
**Solution**: Implement pagination, add size limits, use streaming

### Issue: Tests timeout
**Solution**: Increase timeout limits, check network connectivity, verify API key

## Success Metrics Dashboard

Track these metrics for each migrated client:

```markdown
## [Client]WebSearchClient Migration Metrics

- **Migration Date**: YYYY-MM-DD
- **Mock Tests**: X/Y passed
- **Live Tests**: X/Y passed  
- **Avg Response Time**: Xs
- **Snippet Quality**: X% meaningful
- **Error Rate**: X%
- **API Calls Saved**: X/month
- **User Feedback**: [Positive/Neutral/Negative]
```

---

*This checklist ensures systematic, testable migration with quality gates at each step.*
*No client migration should begin until the previous one is fully validated.*
*Document all deviations from this process for continuous improvement.*
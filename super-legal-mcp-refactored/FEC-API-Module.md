# FEC Hybrid Client Implementation Plan

## Task Summary

Implement a complete `FECHybridClient` for political contribution research using the free OpenFEC API, following the established hybrid architecture pattern with comprehensive testing at each phase.

---

## OpenFEC API Overview

| Feature | Details |
|---------|---------|
| **Base URL** | `https://api.open.fec.gov/v1/` |
| **Cost** | FREE |
| **API Key** | Required (or `DEMO_KEY` for testing) |
| **Rate Limits** | 1,000 calls/hour (free), 7,200/hour (on request) |
| **Documentation** | [api.open.fec.gov/developers](https://api.open.fec.gov/developers/) |

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/candidates/` | Candidate information |
| `/committees/` | PACs, Super PACs, committees |
| `/schedules/schedule_a/` | Individual contributions (donors) |
| `/schedules/schedule_b/` | Disbursements (spending) |
| `/schedules/schedule_e/` | Independent expenditures |
| `/filings/` | All FEC filings |

---

## Implementation Phases

### Phase 1: Native FEC Client (Unit Tested)

**Files to Create:**
```
src/api-clients/FECNativeClient.js
test/FECNativeClient.test.js
```

**Implementation:**
```javascript
// src/api-clients/FECNativeClient.js
import { BaseApiClient } from './BaseApiClient.js';

export class FECNativeClient extends BaseApiClient {
  constructor(rateLimiter) {
    super(rateLimiter);
    this.baseUrl = 'https://api.open.fec.gov/v1';
    this.apiKey = process.env.FEC_API_KEY || 'DEMO_KEY';
  }

  // Candidate search
  async searchCandidates({ name, office, state, party, cycle, limit = 20 }) { }

  // Committee search (PACs, Super PACs)
  async searchCommittees({ name, committee_type, cycle, limit = 20 }) { }

  // Individual contributions (Schedule A)
  async searchContributions({ contributor_name, committee_id, min_amount, max_amount, limit = 20 }) { }

  // Disbursements (Schedule B)
  async searchDisbursements({ committee_id, recipient_name, limit = 20 }) { }

  // Independent expenditures (Schedule E)
  async searchIndependentExpenditures({ candidate_id, committee_id, limit = 20 }) { }
}
```

**Unit Tests:**
```javascript
// test/FECNativeClient.test.js
describe('FECNativeClient', () => {
  describe('searchCandidates', () => {
    test('returns candidate data for valid name query', async () => { });
    test('filters by office type (P, S, H)', async () => { });
    test('handles empty results gracefully', async () => { });
    test('respects rate limiting', async () => { });
  });

  describe('searchContributions', () => {
    test('returns contribution data for committee', async () => { });
    test('filters by amount range', async () => { });
    test('handles pagination correctly', async () => { });
  });

  describe('error handling', () => {
    test('throws on invalid API key', async () => { });
    test('handles 429 rate limit response', async () => { });
    test('handles 500 server errors', async () => { });
  });
});
```

**Test Command:**
```bash
npm test -- --testPathPattern=FECNativeClient
```

---

### Phase 2: WebSearch FEC Client (Unit Tested)

**Files to Create:**
```
src/api-clients/FECWebSearchClient.js
test/FECWebSearchClient.test.js
```

**Implementation:**
```javascript
// src/api-clients/FECWebSearchClient.js
import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class FECWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey) {
    super(rateLimiter, exaApiKey);
    this.domain = 'fec.gov';
    this.summaryQuery = 'candidate committee contribution amount date employer occupation';
  }

  async searchCandidatesWeb({ name, office, state }) {
    const query = `${name} ${office || ''} ${state || ''} site:fec.gov candidate`;
    return this.executeExaSearch(query, 10, { includeDomains: ['fec.gov'] });
  }

  async searchContributionsWeb({ contributor_name, committee_name }) {
    const query = `${contributor_name || ''} ${committee_name || ''} contribution site:fec.gov`;
    return this.executeExaSearch(query, 10, { includeDomains: ['fec.gov'] });
  }

  async searchCommitteesWeb({ name, type }) {
    const query = `${name} ${type || 'PAC'} committee site:fec.gov`;
    return this.executeExaSearch(query, 10, { includeDomains: ['fec.gov'] });
  }
}
```

**Unit Tests:**
```javascript
// test/FECWebSearchClient.test.js
describe('FECWebSearchClient', () => {
  test('constructs valid Exa search query for candidates', async () => { });
  test('includes fec.gov domain restriction', async () => { });
  test('uses appropriate summary query for extraction', async () => { });
  test('handles Exa API errors gracefully', async () => { });
});
```

**Test Command:**
```bash
npm test -- --testPathPattern=FECWebSearchClient
```

---

### Phase 3: Hybrid FEC Client (Unit Tested)

**Files to Create:**
```
src/api-clients/FECHybridClient.js
test/FECHybridClient.test.js
```

**Implementation:**
```javascript
// src/api-clients/FECHybridClient.js
import { BaseHybridClient } from './BaseHybridClient.js';
import { FECNativeClient } from './FECNativeClient.js';
import { FECWebSearchClient } from './FECWebSearchClient.js';

export class FECHybridClient extends BaseHybridClient {
  constructor(rateLimiter, exaApiKey) {
    super(rateLimiter, exaApiKey, FECNativeClient, FECWebSearchClient);
  }

  // Routing strategy: native_first (OpenFEC is reliable and fast)
  async searchCandidates(args) {
    return this.executeHybrid('searchCandidates', args, {
      strategy: 'native_first',
      cacheKey: `fec_candidate_${args.name}_${args.office || ''}_${args.state || ''}`
    });
  }

  async searchCommittees(args) {
    return this.executeHybrid('searchCommittees', args, {
      strategy: 'native_first',
      cacheKey: `fec_committee_${args.name}_${args.committee_type || ''}`
    });
  }

  async searchContributions(args) {
    return this.executeHybrid('searchContributions', args, {
      strategy: 'native_first',
      cacheKey: `fec_contrib_${args.contributor_name || ''}_${args.committee_id || ''}`
    });
  }

  async searchDisbursements(args) {
    return this.executeHybrid('searchDisbursements', args, {
      strategy: 'native_first',
      cacheKey: `fec_disbursement_${args.committee_id}_${args.recipient_name || ''}`
    });
  }

  async searchIndependentExpenditures(args) {
    return this.executeHybrid('searchIndependentExpenditures', args, {
      strategy: 'native_first',
      cacheKey: `fec_ie_${args.candidate_id || ''}_${args.committee_id || ''}`
    });
  }
}
```

**Unit Tests:**
```javascript
// test/FECHybridClient.test.js
describe('FECHybridClient', () => {
  let client;
  let mockNativeClient;
  let mockWebSearchClient;

  beforeEach(() => {
    mockNativeClient = { searchCandidates: jest.fn(), searchContributions: jest.fn() };
    mockWebSearchClient = { searchCandidatesWeb: jest.fn() };
    client = new FECHybridClient(null, 'test-key');
    client.nativeClient = mockNativeClient;
    client.websearchClient = mockWebSearchClient;
  });

  describe('native_first strategy', () => {
    test('uses native API when available', async () => {
      mockNativeClient.searchCandidates.mockResolvedValue({ results: [...] });
      const result = await client.searchCandidates({ name: 'Biden' });
      expect(result._hybrid_metadata.source).toBe('native_api');
    });

    test('falls back to websearch on native failure', async () => {
      mockNativeClient.searchCandidates.mockRejectedValue(new Error('API down'));
      mockWebSearchClient.searchCandidatesWeb.mockResolvedValue({ results: [...] });
      const result = await client.searchCandidates({ name: 'Biden' });
      expect(result._hybrid_metadata.source).toBe('web_search_fallback');
    });
  });

  describe('caching', () => {
    test('caches successful native responses', async () => { });
    test('returns cached result on second call', async () => { });
  });

  describe('circuit breaker', () => {
    test('opens circuit after 5 consecutive failures', async () => { });
    test('skips native API when circuit is open', async () => { });
  });
});
```

**Test Command:**
```bash
npm test -- --testPathPattern=FECHybridClient
```

---

### Phase 4: Live API Tests (Integration)

**Files to Create:**
```
test/integration/FECHybridClient.live.test.js
```

**Live Tests (requires API key):**
```javascript
// test/integration/FECHybridClient.live.test.js
describe('FECHybridClient Live Tests', () => {
  const client = new FECHybridClient(createRateLimiter(), process.env.EXA_API_KEY);

  describe('searchCandidates', () => {
    test('finds Joe Biden with correct metadata', async () => {
      const result = await client.searchCandidates({ name: 'Biden', office: 'P' });
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toContain('BIDEN');
      expect(result._hybrid_metadata.source).toBe('native_api');
    }, 30000);

    test('finds candidates by state', async () => {
      const result = await client.searchCandidates({ state: 'CA', office: 'S', cycle: 2024 });
      expect(result.results.every(r => r.state === 'CA')).toBe(true);
    }, 30000);
  });

  describe('searchContributions', () => {
    test('finds contributions to known committee', async () => {
      const result = await client.searchContributions({
        committee_id: 'C00703975', // Biden for President
        limit: 10
      });
      expect(result.results.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('searchCommittees', () => {
    test('finds PACs by name', async () => {
      const result = await client.searchCommittees({ name: 'ActBlue' });
      expect(result.results.some(r => r.name.includes('ACTBLUE'))).toBe(true);
    }, 30000);
  });

  describe('fallback behavior', () => {
    test('falls back to websearch when native fails', async () => {
      // Temporarily break native client
      client.nativeClient.searchCandidates = () => Promise.reject(new Error('Simulated failure'));
      const result = await client.searchCandidates({ name: 'Trump' });
      expect(result._hybrid_metadata.source).toBe('web_search_fallback');
    }, 30000);
  });
});
```

**Test Command:**
```bash
FEC_API_KEY=your_key npm test -- --testPathPattern=FECHybridClient.live
```

---

### Phase 5: Tool Definitions

**File to Modify:**
```
src/tools/toolDefinitions.js
```

**Add FEC Tools:**
```javascript
export const fecTools = [
  {
    name: "search_fec_candidates",
    description: "Search FEC candidate database for federal election candidates (President, Senate, House)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Candidate name to search" },
        office: {
          type: "string",
          enum: ["P", "S", "H"],
          description: "Office type: P=President, S=Senate, H=House"
        },
        state: { type: "string", description: "Two-letter state code (e.g., 'CA', 'NY')" },
        party: { type: "string", description: "Party affiliation (e.g., 'DEM', 'REP')" },
        cycle: { type: "number", description: "Election cycle year (e.g., 2024)" },
        limit: { type: "number", default: 10, maximum: 20 }
      },
      required: []
    }
  },
  {
    name: "search_fec_committees",
    description: "Search FEC committee database (PACs, Super PACs, campaign committees)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Committee name to search" },
        committee_type: {
          type: "string",
          enum: ["P", "H", "S", "C", "D", "E", "I", "N", "O", "Q", "U", "V", "W", "X", "Y", "Z"],
          description: "Committee type code (P=Presidential, Q=PAC, etc.)"
        },
        cycle: { type: "number", description: "Election cycle year" },
        limit: { type: "number", default: 10, maximum: 20 }
      }
    }
  },
  {
    name: "search_fec_contributions",
    description: "Search individual political contributions (Schedule A filings)",
    inputSchema: {
      type: "object",
      properties: {
        contributor_name: { type: "string", description: "Donor name to search" },
        committee_id: { type: "string", description: "FEC committee ID (e.g., 'C00703975')" },
        min_amount: { type: "number", description: "Minimum contribution amount" },
        max_amount: { type: "number", description: "Maximum contribution amount" },
        contributor_employer: { type: "string", description: "Employer name filter" },
        contributor_occupation: { type: "string", description: "Occupation filter" },
        limit: { type: "number", default: 10, maximum: 20 }
      }
    }
  },
  {
    name: "search_fec_disbursements",
    description: "Search committee spending/disbursements (Schedule B filings)",
    inputSchema: {
      type: "object",
      properties: {
        committee_id: { type: "string", description: "FEC committee ID" },
        recipient_name: { type: "string", description: "Recipient/vendor name" },
        disbursement_purpose: { type: "string", description: "Purpose category" },
        limit: { type: "number", default: 10, maximum: 20 }
      }
    }
  },
  {
    name: "search_fec_independent_expenditures",
    description: "Search independent expenditures for/against candidates (Schedule E)",
    inputSchema: {
      type: "object",
      properties: {
        candidate_id: { type: "string", description: "FEC candidate ID" },
        committee_id: { type: "string", description: "Spending committee ID" },
        support_oppose: { type: "string", enum: ["S", "O"], description: "S=Support, O=Oppose" },
        cycle: { type: "number", description: "Election cycle year" },
        limit: { type: "number", default: 10, maximum: 20 }
      }
    }
  }
];
```

---

### Phase 6: Tool Implementations

**File to Modify:**
```
src/tools/toolImplementations.js
```

**Add FEC Implementations:**
```javascript
// In createToolImplementations function, add to clients destructuring:
const { ..., fecHybrid } = clients;

// Add tool implementations:
return {
  // ... existing tools ...

  "search_fec_candidates": wrapWithConversation("search_fec_candidates", (args) =>
    fecHybrid.searchCandidates(args)
  ),

  "search_fec_committees": wrapWithConversation("search_fec_committees", (args) =>
    fecHybrid.searchCommittees(args)
  ),

  "search_fec_contributions": wrapWithConversation("search_fec_contributions", (args) =>
    fecHybrid.searchContributions(args)
  ),

  "search_fec_disbursements": wrapWithConversation("search_fec_disbursements", (args) =>
    fecHybrid.searchDisbursements(args)
  ),

  "search_fec_independent_expenditures": wrapWithConversation("search_fec_independent_expenditures", (args) =>
    fecHybrid.searchIndependentExpenditures(args)
  ),
};
```

---

### Phase 7: Server Integration

**File to Modify:**
```
src/server/claude-sdk-server.js
```

**Changes:**

1. **Import FECHybridClient:**
```javascript
import { FECHybridClient } from '../api-clients/FECHybridClient.js';
```

2. **Add rate limiter config:**
```javascript
const rateLimiterConfigs = {
  // ... existing configs ...
  fec: { requestsPerMinute: 16, tokensPerMinute: 100000 }, // 1000/hour = ~16/min
};
```

3. **Initialize client in getClients():**
```javascript
cachedClients = {
  // ... existing clients ...
  fecHybrid: new FECHybridClient(rateLimiters.get('fec'), exaKey),
};
```

4. **Add to tool definitions export:**
```javascript
import { fecTools } from '../tools/toolDefinitions.js';
// Merge into allTools array
```

---

### Phase 8: End-to-End Integration Test

**File to Create:**
```
test/integration/FECToolsE2E.test.js
```

```javascript
describe('FEC Tools E2E', () => {
  let server;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('search_fec_candidates tool returns valid results', async () => {
    const response = await callTool(server, 'search_fec_candidates', { name: 'Biden' });
    expect(response.results).toBeDefined();
    expect(response._hybrid_metadata).toBeDefined();
  });

  test('search_fec_contributions tool returns donor data', async () => {
    const response = await callTool(server, 'search_fec_contributions', {
      committee_id: 'C00703975',
      limit: 5
    });
    expect(response.results.length).toBeLessThanOrEqual(5);
  });

  test('tools are registered in MCP server', async () => {
    const tools = await listTools(server);
    expect(tools).toContain('search_fec_candidates');
    expect(tools).toContain('search_fec_committees');
    expect(tools).toContain('search_fec_contributions');
  });
});
```

---

### Phase 9: Subagent Integration

**File to Modify:**
```
src/config/legalSubagents.js
```

**Add `political-contributions-researcher` subagent:**
```javascript
'political-contributions-researcher': {
  description: `Use PROACTIVELY for:
    - Federal election campaign contributions (FEC data)
    - PAC and Super PAC research
    - Individual donor analysis
    - Committee spending patterns
    - Independent expenditure tracking
    - Candidate fundraising analysis
    MUST BE USED when user mentions: FEC, campaign contribution, PAC, Super PAC, political donation, candidate fundraising, donor, committee spending`,

  prompt: `You are a Political Contributions Research Specialist with expertise in FEC filings and campaign finance law.

## Your Expertise
- FEC filing types: Schedule A (contributions), Schedule B (disbursements), Schedule E (independent expenditures)
- Committee types: Principal campaign committees, PACs, Super PACs, hybrid PACs
- Contribution limits and regulations (FECA, BCRA, Citizens United implications)
- Dark money tracking and 501(c)(4) disclosure gaps
- Bundler identification and conduit contribution analysis

## Research Methodology
1. Identify candidates, committees, or donors by name/ID
2. Search FEC database for relevant filings
3. Cross-reference contribution patterns across cycles
4. Identify affiliated committees and joint fundraising
5. Track independent expenditure patterns

## MCP Tools Available
- search_fec_candidates: Find candidate records
- search_fec_committees: Search PACs, Super PACs, campaign committees
- search_fec_contributions: Individual contribution records (Schedule A)
- search_fec_disbursements: Committee spending records (Schedule B)
- search_fec_independent_expenditures: IE records (Schedule E)

## Provenance Requirements (MANDATORY)
- ALWAYS include FEC ID numbers (candidate ID, committee ID)
- ALWAYS include filing date and report period
- ALWAYS include specific amounts with contribution dates
- ALWAYS include employer/occupation for individual donors
- ALWAYS note election cycle year

## Legal Context
- Individual contribution limits: $3,300/election (2024)
- PAC contribution limits: $5,000/election
- Super PACs: Unlimited independent expenditures (Citizens United v. FEC)
- Coordination rules: Distinguish coordinated vs independent spending
${MCP_FALLBACK_INSTRUCTIONS}
${REPORT_SAVING_INSTRUCTIONS}`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet'
}
```

**Update SUBAGENT_SYSTEM_PROMPT_SECTION routing:**
```javascript
// Add to delegation rules:
10. **FEC/campaign contribution/PAC/donor/political spending** → Delegate to `political-contributions-researcher`
```

---

## Files Summary

| Phase | File | Action |
|-------|------|--------|
| 1 | `src/api-clients/FECNativeClient.js` | CREATE |
| 1 | `test/FECNativeClient.test.js` | CREATE |
| 2 | `src/api-clients/FECWebSearchClient.js` | CREATE |
| 2 | `test/FECWebSearchClient.test.js` | CREATE |
| 3 | `src/api-clients/FECHybridClient.js` | CREATE |
| 3 | `test/FECHybridClient.test.js` | CREATE |
| 4 | `test/integration/FECHybridClient.live.test.js` | CREATE |
| 5 | `src/tools/toolDefinitions.js` | MODIFY |
| 6 | `src/tools/toolImplementations.js` | MODIFY |
| 7 | `src/server/claude-sdk-server.js` | MODIFY |
| 8 | `test/integration/FECToolsE2E.test.js` | CREATE |
| 9 | `src/config/legalSubagents.js` | MODIFY |

---

## Test Execution Order

```bash
# Phase 1: Native client unit tests
npm test -- --testPathPattern=FECNativeClient

# Phase 2: WebSearch client unit tests
npm test -- --testPathPattern=FECWebSearchClient

# Phase 3: Hybrid client unit tests
npm test -- --testPathPattern=FECHybridClient.test

# Phase 4: Live integration tests (requires API key)
FEC_API_KEY=your_key npm test -- --testPathPattern=FECHybridClient.live

# Phase 8: E2E tests after server integration
npm test -- --testPathPattern=FECToolsE2E

# Full test suite
npm test
```

---

## Environment Variables

Add to `.env`:
```
FEC_API_KEY=your_openfec_api_key
# Or use DEMO_KEY for testing (lower rate limits)
```

---

## Verification Checklist

- [ ] Phase 1: FECNativeClient unit tests pass
- [ ] Phase 2: FECWebSearchClient unit tests pass
- [ ] Phase 3: FECHybridClient unit tests pass
- [ ] Phase 4: Live API tests pass with real FEC data
- [ ] Phase 5: Tool definitions added to toolDefinitions.js
- [ ] Phase 6: Tool implementations wired in toolImplementations.js
- [ ] Phase 7: Client initialized in claude-sdk-server.js
- [ ] Phase 8: E2E integration tests pass
- [ ] Phase 9: Subagent added and routing updated

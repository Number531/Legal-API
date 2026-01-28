# API Client Validation Issue Analysis & Fix Plan

## Executive Summary
Complex multi-faceted legal queries are failing due to restrictive parameter validation in API clients. When Claude decomposes complex queries and calls multiple tools in parallel for discovery, tools with strict validation throw errors on empty parameters instead of providing graceful fallbacks.

## Problem Statement

### User's Observed Behavior
- **Working**: Simple, single-tool queries with specific parameters
  - Example: `search_cases({query: "Roe v Wade"})`
- **Failing**: Complex multi-faceted queries requiring multiple tools
  - Example: "manufacturing companies in western Pennsylvania which have filed for bankruptcy"
  - Results in: "Tool execution failed with no result" errors

### Root Cause
When Claude receives complex queries, it attempts to decompose them and call multiple relevant tools in parallel for discovery. However, many API clients have restrictive validation that throws errors when required parameters are missing, rather than providing intelligent fallbacks.

## Detailed Analysis

### Validation Patterns Discovered

#### 1. Graceful Handling (Good Pattern)
These clients handle empty parameters well:

**EPAWebSearchClient.js (Line 21)**
```javascript
if (!args || typeof args !== 'object') args = {};
// Continues with defaults, doesn't throw
```

**EPAComplianceClient.js (Lines 18-19)**
```javascript
if (!args || typeof args !== 'object') {
  args = {};
}
// Proceeds with empty search
```

**PTABClient.js (Lines 19-21)**
```javascript
if (!args || typeof args !== 'object') {
  args = {};
}
// Builds query with available parameters
```

**UsptoWebSearchClient.js (Lines 926-928)**
```javascript
if (!args || typeof args !== 'object') {
  args = {};
}
// Has intelligent fallbacks when no parameters provided
```

#### 2. Restrictive Validation (Problem Pattern)
These clients throw errors on missing parameters:

**CourtListenerWebSearchClient.js**
```javascript
// Line 47-48: searchOpinionsWeb
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  throw new Error('Query is required for CourtListener web search.');
}

// Line 117: lookupCitationWeb
if (!citation || typeof citation !== 'string' || citation.trim().length === 0) {
  throw new Error('citation is required for lookupCitationWeb');
}

// Line 396: getCourtInfoWeb
if (!court_id) throw new Error('court_id is required');
```

**SECWebSearchClient.js**
```javascript
// Line 166: getSECCompanyFactsWeb
if (!company_identifier) {
  throw new Error('company_identifier is required');
}

// Lines 213-214: getSECXBRLFramesWeb
if (!concept) throw new Error('concept is required');
if (!period) throw new Error('period is required');

// Line 261: searchSECCompanyTickersWeb
if (!search_term) {
  throw new Error('search_term is required');
}
```

**StateCourtRulesWebSearchClient.js**
```javascript
// Line 681: generateFilingTemplateWeb
if (!document_type) {
  throw new Error('document_type is required (e.g., complaint, motion, brief)');
}

// Line 737: getFilingRequirementsWeb
if (!document_type) {
  throw new Error('document_type is required');
}
```

**StateStatuteWebSearchClient.js**
```javascript
// Line 173: searchStateStatutesWeb
if (!state) {
  throw new Error('State code is required. Example: {state: "CA", query: "criminal procedure"}');
}

// Line 184: searchStateStatutesWeb
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  throw new Error('Query is required. Example: "criminal procedure", "family law", "business corporations"');
}
```

**EPAWebSearchClient.js (specific methods)**
```javascript
// Line 81: getFacilityComplianceReportWeb
if (!facility_id) throw new Error('facility_id is required');

// Line 121: getFacilityViolationsWeb
if (!facility_id) throw new Error('facility_id is required');
```

### Tool Implementation Layer Issues

**toolImplementations.js**

Critical issue in `search_cases` implementation (Line 55):
```javascript
"search_cases": wrapWithConversation("search_cases", (args) => {
  return courtListenerWeb.searchOpinionsWeb({
    query: args.query || args.case_name || '',  // Passes empty string!
    case_name: args.case_name,
    citation: args.citation,
    // ...
  });
}),
```

When both `args.query` and `args.case_name` are undefined (common in discovery phase), this passes an empty string to `searchOpinionsWeb`, which then throws an error.

Similar patterns exist in other tool mappings:
- `search_patents` (Line 192-205)
- `search_epa_facilities` (Line 291-303)
- `search_dockets` (Line 83)

## Impact Analysis

### Tools Affected by User's Complex Query

From the user's transcript showing failures:
1. **search_epa_facilities** - Called with empty parameters for discovery
2. **search_cases** - Called with empty query for bankruptcy case discovery
3. **search_dockets** - Called without specific case names
4. **search_patents** - Called without specific patent numbers

### Why Simple Queries Work
Single, focused queries provide specific parameters:
- "Search for Apple patents" → `search_patents({assignee_organization: "Apple"})`
- "Find Roe v Wade" → `search_cases({query: "Roe v Wade"})`

### Why Complex Queries Fail
Multi-faceted queries trigger parallel discovery calls:
```javascript
// Claude's decomposition of "manufacturing companies in western Pennsylvania which have filed for bankruptcy"
Promise.all([
  search_epa_facilities({state: 'PA', city: 'Pittsburgh'}),  // Missing facility_name
  search_cases({query: ''}),  // Empty query triggers error!
  search_dockets({}),  // No parameters
  search_sec_filings({})  // No company specified
])
```

## Recommended Solutions

### Solution 1: Fix Validation in API Clients (Preferred)

#### Pattern to Apply
Replace restrictive validation with intelligent fallbacks:

**CourtListenerWebSearchClient.js - searchOpinionsWeb**
```javascript
// CURRENT (throws error):
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  throw new Error('Query is required for CourtListener web search.');
}

// RECOMMENDED (graceful fallback):
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  // Use other parameters to build a query, or use a broad default
  if (case_name) {
    query = case_name;
  } else if (citation) {
    query = citation;
  } else if (date_after || date_before) {
    query = 'recent court opinions decisions';
  } else {
    query = 'recent federal court cases opinions';
  }
}
```

**SECWebSearchClient.js - getSECCompanyFactsWeb**
```javascript
// CURRENT (throws error):
if (!company_identifier) {
  throw new Error('company_identifier is required');
}

// RECOMMENDED (graceful fallback):
if (!company_identifier) {
  // Fallback to recent notable filings or use concept as search
  if (concept) {
    company_identifier = concept;  // Search by concept
    search_text = `SEC filings ${concept} company facts`;
  } else {
    // Return recent major company facts
    search_text = 'Fortune 500 SEC filings quarterly reports 10-K 10-Q';
  }
}
```

**StateStatuteWebSearchClient.js - searchStateStatutesWeb**
```javascript
// CURRENT (throws error):
if (!state) {
  throw new Error('State code is required');
}

// RECOMMENDED (graceful fallback):
if (!state) {
  // Search across multiple states or federal
  if (query) {
    // Search for the query across major states
    state = 'US';  // Or implement multi-state search
    search_text = `state law statutes ${query}`;
  } else {
    // Return general state law resources
    return this.getGeneralStatuteResources();
  }
}
```

### Solution 2: Enhanced Tool Implementation Layer

Update toolImplementations.js to provide better defaults:

```javascript
"search_cases": wrapWithConversation("search_cases", (args) => {
  // Ensure we never pass empty query
  let enrichedArgs = {...args};

  if (!enrichedArgs.query && !enrichedArgs.case_name && !enrichedArgs.citation) {
    // Build intelligent default based on other parameters
    if (enrichedArgs.date_filed_after || enrichedArgs.date_filed_before) {
      enrichedArgs.query = 'recent court cases opinions decisions';
    } else if (enrichedArgs.court) {
      enrichedArgs.query = `${enrichedArgs.court} court recent cases`;
    } else {
      enrichedArgs.query = 'recent federal court cases';
    }
  }

  return courtListenerWeb.searchOpinionsWeb({
    query: enrichedArgs.query || enrichedArgs.case_name || enrichedArgs.citation,
    case_name: enrichedArgs.case_name,
    citation: enrichedArgs.citation,
    date_after: enrichedArgs.date_filed_after,
    date_before: enrichedArgs.date_filed_before,
    limit: enrichedArgs.limit,
    include_text: enrichedArgs.include_text !== false,
    include_full_text: enrichedArgs.include_full_text || false
  });
}),
```

### Solution 3: Add Discovery Mode Support

Create a discovery mode for tools that returns broad results when no specific parameters are provided:

```javascript
class CourtListenerWebSearchClient extends BaseWebSearchClient {
  async searchOpinionsWeb(args) {
    if (!args || typeof args !== 'object') args = {};

    // Discovery mode: no specific parameters
    const isDiscoveryMode = !args.query && !args.case_name && !args.citation;

    if (isDiscoveryMode) {
      // Return recent notable cases for discovery
      return this.discoverySearch({
        type: 'opinions',
        date_after: args.date_after,
        date_before: args.date_before,
        court: args.court,
        limit: args.limit || 5
      });
    }

    // Normal search with parameters...
  }

  async discoverySearch(options) {
    // Build intelligent discovery query
    let query = 'site:courtlistener.com/opinion ';

    if (options.court) {
      query += `"${options.court}" `;
    }

    // Add recent timeframe for discovery
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query += `after:${thirtyDaysAgo.toISOString().split('T')[0]} `;

    query += 'court opinion decision precedent';

    return this.executeExaSearch(query, options.limit, {
      domain: this.domain,
      // ... other options
    });
  }
}
```

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
These are causing the user's observed failures:

1. **CourtListenerWebSearchClient.searchOpinionsWeb** (Line 47-48)
   - Remove throw, add fallback query
   - Impact: Fixes `search_cases` tool failures

2. **toolImplementations.js search_cases** (Line 55)
   - Never pass empty string as query
   - Add intelligent defaults based on other parameters

3. **SECWebSearchClient company methods** (Lines 166, 213-214, 261)
   - Add fallbacks for discovery searches
   - Return recent/notable results when no specific company

4. **StateStatuteWebSearchClient.searchStateStatutesWeb** (Lines 173, 184)
   - Handle multi-state searches
   - Provide federal law fallback

### Phase 2: Secondary Fixes (Important)
These could cause issues in complex queries:

1. **EPAWebSearchClient facility-specific methods** (Lines 81, 121)
   - These legitimately need facility_id
   - Consider returning empty results instead of throwing

2. **StateCourtRulesWebSearchClient template methods** (Lines 681, 737)
   - Add common document type defaults
   - Or return list of available templates

3. **CourtListenerWebSearchClient citation/court lookups** (Lines 117, 396)
   - These are specific lookups that need their parameters
   - Consider more helpful error messages

### Phase 3: System Improvements (Long-term)

1. **Standardize Error Handling Pattern**
   ```javascript
   // Create a base validation helper
   function validateOrDefault(value, paramName, defaultValue, validationFn) {
     if (!value) {
       if (defaultValue !== undefined) {
         return defaultValue;
       }
       // Return null to indicate optional parameter missing
       return null;
     }
     if (validationFn && !validationFn(value)) {
       throw new Error(`Invalid ${paramName}: ${value}`);
     }
     return value;
   }
   ```

2. **Add Explicit Discovery Mode**
   - Add `discovery: true` flag to all search methods
   - When set, return broad, recent results
   - Helps Claude's exploration phase

3. **Implement Parameter Enrichment Layer**
   - Middleware between tools and API clients
   - Enriches empty parameters with context
   - Logs parameter transformations for debugging

## Testing Strategy

### Test Cases for Validation

1. **Empty Parameter Test**
   ```javascript
   // Should not throw, should return results
   await searchOpinionsWeb({});
   await searchPatentsWeb({});
   await searchFacilitiesWeb({});
   ```

2. **Partial Parameter Test**
   ```javascript
   // Should use available parameters intelligently
   await searchOpinionsWeb({date_after: '2024-01-01'});
   await searchPatentsWeb({technology_area: 'AI'});
   ```

3. **Complex Query Simulation**
   ```javascript
   // Simulate Claude's parallel discovery calls
   await Promise.all([
     searchOpinionsWeb({state: 'PA'}),
     searchDocketsWeb({party_name: 'manufacturing'}),
     searchPatentsWeb({location_state: 'PA'}),
     searchFacilitiesWeb({state: 'PA', city: 'Pittsburgh'})
   ]);
   ```

### Expected Outcomes

After implementing these fixes:
1. Complex multi-faceted queries should work without errors
2. Tools should return relevant discovery results when called without specific parameters
3. Error messages should be helpful when parameters are truly required
4. System should gracefully degrade rather than fail completely

## Metrics for Success

1. **Error Rate Reduction**
   - Current: 100% failure rate on complex queries
   - Target: 0% hard failures, <10% empty results

2. **Discovery Success Rate**
   - Current: 0% (throws errors)
   - Target: >80% return useful discovery results

3. **Query Completion Time**
   - Current: Immediate failure
   - Target: <5 seconds for complex multi-tool queries

## Conclusion

The root cause of complex query failures is overly restrictive parameter validation in API clients. The solution is to replace error-throwing validation with intelligent fallbacks and discovery modes. This aligns with Claude's natural tendency to explore and discover through parallel tool calls, rather than requiring perfect parameters upfront.

### Key Takeaways
1. **Never throw on missing optional parameters** - Return empty/default results
2. **Required parameters need intelligent fallbacks** - Use context to build defaults
3. **Support discovery mode explicitly** - Tools should help exploration
4. **Tool layer should enrich, not just pass through** - Add intelligence at integration points

### Next Steps
1. Implement Phase 1 critical fixes immediately
2. Test with user's failing query examples
3. Deploy Phase 2 fixes based on testing results
4. Plan Phase 3 system improvements for long-term robustness
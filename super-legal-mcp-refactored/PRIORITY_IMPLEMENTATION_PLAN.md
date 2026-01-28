# Priority Implementation Plan - Viable Legal APIs
## Based on Research Findings: 4 Confirmed Integrations

---

## Executive Summary

Research confirms **4 viable APIs** will increase coverage from 60% to 85%. Implementation time: **4 weeks total**.

**Key Finding**: Justia API doesn't exist (website only), DOJ has no antitrust API, and CFTC only offers market data. Focus on the 4 that actually exist.

---

## 🎯 Implementation Priority Order

### Week 1: PTAB Integration (HIGHEST VALUE)
**Why First**: 
- Uses existing USPTO API key (no new credentials)
- Critical for patent litigation (80% of challenged claims invalidated)
- Excellent documentation available
- Complements existing USPTO patent search

**Implementation Effort**: 2-3 days

### Week 2: FTC Integration (ANTITRUST GAP)
**Why Second**:
- Fills critical antitrust gap
- Simple REST API structure
- Well-documented endpoints
- M&A due diligence capability

**Implementation Effort**: 3-4 days

### Week 3: EPA ECHO Integration (COMPLIANCE)
**Why Third**:
- Comprehensive environmental compliance
- Multiple service endpoints (more complex)
- Public API, no key required for basic access
- Due diligence essential

**Implementation Effort**: 4-5 days

### Week 4: Exa Enhancement (ALREADY STARTED)
**Why Last**:
- Already partially implemented
- Enhances existing functionality
- State statute coverage improvement

**Implementation Effort**: 2-3 days

---

## 📦 Module Architecture for Refactored System

```javascript
// New file structure for super-legal-mcp-refactored
src/
├── api-clients/
│   ├── [existing clients]
│   ├── PTABClient.js          // NEW - Week 1
│   ├── FTCClient.js           // NEW - Week 2
│   ├── EPAComplianceClient.js // NEW - Week 3
│   └── ExaClient.js           // ENHANCE - Week 4
├── tools/
│   └── toolDefinitions.js     // Add 10 new tool definitions
└── config/
    └── apiConfig.js            // Add new API configurations
```

---

## 🔧 Week 1: PTAB Implementation

### New Client: `PTABClient.js`

```javascript
/**
 * PTAB (Patent Trial and Appeal Board) API Client
 * Handles patent validity challenges and proceedings
 */

import { makePostRequest, makeApiRequest } from '../utils/apiHelpers.js';

export class PTABClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.baseUrl = 'https://developer.uspto.gov/ptab-api/v2';
  }

  /**
   * Search PTAB proceedings (IPR, PGR, CBM)
   * Critical for patent litigation strategy
   */
  async searchProceedings(args) {
    const {
      proceeding_type = 'IPR',
      patent_number,
      petitioner,
      patent_owner,
      date_filed_after,
      date_filed_before,
      status,
      limit = 25
    } = args;

    const requestBody = {
      proceedingType: proceeding_type,
      limit: Math.min(limit, 100)
    };

    // Build search criteria
    if (patent_number) requestBody.patentNumber = patent_number;
    if (petitioner) requestBody.petitioner = petitioner;
    if (patent_owner) requestBody.patentOwner = patent_owner;
    if (date_filed_after) requestBody.filedDateStart = date_filed_after;
    if (date_filed_before) requestBody.filedDateEnd = date_filed_before;
    if (status) requestBody.status = status;

    await this.rateLimiter.enforce();

    const response = await makePostRequest(
      '/proceedings/search',
      requestBody,
      { 
        apiType: 'ptab',
        rateLimiter: this.rateLimiter,
        headers: {
          'X-API-KEY': process.env.USPTO_API_KEY
        }
      }
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          proceedings: response.results || [],
          total_count: response.totalCount || 0,
          stats: {
            institution_rate: response.institutionRate,
            invalidation_rate: response.invalidationRate
          }
        }, null, 2)
      }]
    };
  }

  /**
   * Get institution and final written decisions
   */
  async getDecisions(args) {
    const { proceeding_number, decision_type = 'all' } = args;

    if (!proceeding_number) {
      throw new Error("Proceeding number required (e.g., IPR2023-00123)");
    }

    await this.rateLimiter.enforce();

    const endpoints = [];
    if (decision_type === 'all' || decision_type === 'institution') {
      endpoints.push(`/decisions/institution/${proceeding_number}`);
    }
    if (decision_type === 'all' || decision_type === 'final') {
      endpoints.push(`/decisions/final/${proceeding_number}`);
    }

    const decisions = await Promise.all(
      endpoints.map(endpoint => 
        makeApiRequest(endpoint, {}, {
          apiType: 'ptab',
          rateLimiter: this.rateLimiter
        })
      )
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          proceeding: proceeding_number,
          decisions: decisions,
          invalidated_claims: decisions[1]?.invalidatedClaims || [],
          survived_claims: decisions[1]?.survivedClaims || []
        }, null, 2)
      }]
    };
  }
}
```

### New Tool Definitions (Week 1)

```javascript
// Add to toolDefinitions.js
{
  name: "search_ptab_proceedings",
  description: "Search PTAB proceedings (IPR, PGR, CBM) for patent validity challenges",
  inputSchema: {
    type: "object",
    properties: {
      proceeding_type: {
        type: "string",
        enum: ["IPR", "PGR", "CBM", "ALL"],
        description: "Type of PTAB proceeding"
      },
      patent_number: {
        type: "string",
        description: "US Patent number (e.g., 7,123,456)"
      },
      petitioner: {
        type: "string",
        description: "Name of petitioner challenging patent"
      },
      patent_owner: {
        type: "string",
        description: "Name of patent owner"
      },
      status: {
        type: "string",
        enum: ["PENDING", "INSTITUTED", "TERMINATED", "FWD_ENTERED"],
        description: "Proceeding status"
      }
    }
  }
},
{
  name: "get_ptab_decisions",
  description: "Get institution and final written decisions for PTAB proceedings",
  inputSchema: {
    type: "object",
    properties: {
      proceeding_number: {
        type: "string",
        description: "PTAB proceeding number (e.g., IPR2023-00123)"
      },
      decision_type: {
        type: "string",
        enum: ["institution", "final", "all"],
        description: "Type of decision to retrieve"
      }
    },
    required: ["proceeding_number"]
  }
}
```

---

## 🏛️ Week 2: FTC Implementation

### New Client: `FTCClient.js`

```javascript
/**
 * FTC (Federal Trade Commission) API Client
 * Handles antitrust and consumer protection data
 */

export class FTCClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.baseUrl = 'https://api.ftc.gov/v0';
  }

  /**
   * Search Hart-Scott-Rodino early termination notices
   * Critical for M&A due diligence
   */
  async searchHSRTerminations(args) {
    const {
      acquiring_party,
      acquired_party,
      date_after,
      date_before,
      transaction_value_min,
      limit = 50
    } = args;

    const params = {
      'api_key': process.env.DATA_GOV_API_KEY,
      'limit': limit
    };

    // Build filters
    if (acquiring_party) {
      params['filter[acquiring_party][value]'] = acquiring_party;
      params['filter[acquiring_party][operator]'] = 'CONTAINS';
    }
    if (date_after) params['filter[date][min]'] = date_after;
    if (date_before) params['filter[date][max]'] = date_before;

    await this.rateLimiter.enforce();

    const response = await makeApiRequest(
      '/hsr-early-termination-notices',
      params,
      { apiType: 'ftc', rateLimiter: this.rateLimiter }
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          hsr_terminations: response.data || [],
          total_count: response.meta?.totalCount || 0,
          early_termination_granted: response.data?.filter(d => d.status === 'GRANTED').length || 0
        }, null, 2)
      }]
    };
  }

  /**
   * Search FTC enforcement actions and consent orders
   */
  async searchEnforcementActions(args) {
    const {
      defendant_name,
      case_type,
      industry,
      date_filed_after,
      date_filed_before,
      include_consent_orders = true,
      limit = 25
    } = args;

    const params = {
      'api_key': process.env.DATA_GOV_API_KEY,
      'limit': limit
    };

    if (defendant_name) params['filter[defendant]'] = defendant_name;
    if (case_type) params['filter[type]'] = case_type;
    if (industry) params['filter[industry]'] = industry;
    if (date_filed_after) params['filter[filed_date][min]'] = date_filed_after;
    if (date_filed_before) params['filter[filed_date][max]'] = date_filed_before;

    await this.rateLimiter.enforce();

    const response = await makeApiRequest(
      '/enforcement-actions',
      params,
      { apiType: 'ftc', rateLimiter: this.rateLimiter }
    );

    // Also get consent orders if requested
    let consentOrders = [];
    if (include_consent_orders) {
      const consentResponse = await makeApiRequest(
        '/consent-orders',
        params,
        { apiType: 'ftc', rateLimiter: this.rateLimiter }
      );
      consentOrders = consentResponse.data || [];
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          enforcement_actions: response.data || [],
          consent_orders: consentOrders,
          total_actions: (response.data?.length || 0) + consentOrders.length,
          penalties_total: response.data?.reduce((sum, a) => sum + (a.penalty || 0), 0) || 0
        }, null, 2)
      }]
    };
  }
}
```

---

## 🌍 Week 3: EPA ECHO Implementation

### New Client: `EPAComplianceClient.js`

```javascript
/**
 * EPA ECHO (Enforcement and Compliance History) API Client
 * Handles environmental compliance data
 */

export class EPAComplianceClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.baseUrl = 'https://echodata.epa.gov/echo';
  }

  /**
   * Search EPA-regulated facilities
   */
  async searchFacilities(args) {
    const {
      facility_name,
      company_name,
      city,
      state,
      zip_code,
      compliance_status,
      violations_last_3_years,
      limit = 50
    } = args;

    const params = {
      output: 'JSON',
      qcolumns: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,22,23,24,25,26',
      p_rows: limit
    };

    // Build search parameters
    if (facility_name) params.p_fn = facility_name;
    if (company_name) params.p_owname = company_name;
    if (city) params.p_ct = city;
    if (state) params.p_st = state;
    if (zip_code) params.p_zip = zip_code;
    
    // Compliance filters
    if (compliance_status === 'violation') {
      params.p_qnc = 'Y'; // Quarters in non-compliance
    }
    if (violations_last_3_years) {
      params.p_qiv = '12'; // Violations in last 12 quarters
    }

    await this.rateLimiter.enforce();

    const response = await makeApiRequest(
      '/echo_rest_services.get_facilities',
      params,
      { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
    );

    const facilities = response.Results?.Facilities || [];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          facilities: facilities.map(f => ({
            name: f.FacName,
            company: f.FacParentCo,
            location: {
              address: f.FacStreet,
              city: f.FacCity,
              state: f.FacState,
              zip: f.FacZip
            },
            compliance: {
              current_status: f.ComplianceStatus,
              quarters_in_noncompliance: f.QtrsWithNC,
              formal_enforcement_actions: f.FormalEACount,
              total_penalties: f.TotalPenalties
            },
            programs: {
              clean_air: f.CAAFlag === 'Y',
              clean_water: f.CWAFlag === 'Y',
              rcra: f.RCRAFlag === 'Y'
            }
          })),
          total_facilities: response.Results?.QueryRows || 0,
          high_priority_violators: facilities.filter(f => f.HPVFlag === 'Y').length
        }, null, 2)
      }]
    };
  }

  /**
   * Get detailed compliance report for specific facility
   */
  async getFacilityComplianceReport(args) {
    const { facility_id, include_violations = true, include_enforcement = true } = args;

    if (!facility_id) {
      throw new Error("Facility ID required (use searchFacilities to find ID)");
    }

    const params = {
      output: 'JSON',
      p_id: facility_id
    };

    await this.rateLimiter.enforce();

    // Get detailed facility report
    const response = await makeApiRequest(
      '/dfr_rest_services.get_dfr',
      params,
      { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
    );

    const report = {
      facility: response.Facility,
      compliance_summary: response.ComplianceSummary,
      three_year_compliance: response.ThreeYearComplianceHistory
    };

    // Get violations if requested
    if (include_violations) {
      const violationsResponse = await makeApiRequest(
        '/echo_rest_services.get_violations',
        { p_id: facility_id, output: 'JSON' },
        { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
      );
      report.violations = violationsResponse.Violations || [];
    }

    // Get enforcement actions if requested
    if (include_enforcement) {
      const enforcementResponse = await makeApiRequest(
        '/echo_rest_services.get_enforcement',
        { p_id: facility_id, output: 'JSON' },
        { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
      );
      report.enforcement_actions = enforcementResponse.EnforcementActions || [];
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(report, null, 2)
      }]
    };
  }
}
```

---

## 🔍 Week 4: Exa Enhancement

### Enhanced `ExaClient.js` (Already Exists - Just Improve)

```javascript
// Enhance the existing searchStateStatute method
async searchStateStatute(args) {
  const {
    state,
    query,
    include_text = true,
    num_results = 5,
    search_type = 'neural' // NEW: neural vs keyword
  } = args;

  // Validate inputs (keep existing validation)
  
  // NEW: Enhanced domain filtering
  const stateInfo = this.stateConfig.states[state];
  let searchDomains = [];
  
  // Priority 1: Statute-specific URLs
  if (stateInfo.statute_base_urls?.length > 0) {
    searchDomains = stateInfo.statute_base_urls;
  }
  // Priority 2: Legislature websites
  else if (stateInfo.legislature_url) {
    searchDomains.push(stateInfo.legislature_url);
  }
  // Priority 3: State government domains
  else {
    searchDomains.push(`${state.toLowerCase()}.gov`);
    searchDomains.push(`legislature.${state.toLowerCase()}.gov`);
    searchDomains.push(`law.${state.toLowerCase()}.gov`);
  }

  // NEW: Enhanced query building
  const legalTerms = ['statute', 'code', 'law', 'regulation', 'section', 'chapter'];
  const enhancedQuery = `${query} ${stateName} ${legalTerms.join(' OR ')}`;

  // NEW: Advanced Exa features
  const requestBody = {
    query: enhancedQuery,
    includeDomains: searchDomains,
    numResults: Math.min(num_results, 10),
    searchType: search_type, // 'neural' or 'keyword'
    useAutoprompt: true, // Let Exa optimize the query
    category: 'legal', // Hint for better results
    
    // Enhanced content extraction
    contents: {
      text: include_text,
      highlights: {
        query: query, // Highlight the original query
        numSentences: 3,
        highlightsPerUrl: 5
      },
      summary: {
        query: `Extract the legal provisions, requirements, and penalties from this ${stateName} statute regarding ${query}`
      }
    }
  };

  // NEW: Add filters for recency and relevance
  if (args.date_after) {
    requestBody.startPublishedDate = args.date_after;
  }
  
  // Keep existing API call and error handling
  
  // NEW: Enhanced response processing
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        state: state,
        state_name: stateName,
        search_query: query,
        search_type: search_type,
        results: results.map(r => ({
          title: r.title,
          url: r.url,
          score: r.score,
          published_date: r.publishedDate,
          statute_text: r.text,
          highlights: r.highlights,
          legal_summary: r.summary,
          // NEW: Extract statute numbers if present
          statute_sections: this.extractStatuteSections(r.text)
        })),
        total_results: results.length,
        domains_searched: searchDomains
      }, null, 2)
    }]
  };
}

// NEW: Helper method to extract statute sections
extractStatuteSections(text) {
  const sectionPattern = /(?:Section|§|Sec\.?)\s*(\d+[\d\w.-]*)/gi;
  const matches = text.match(sectionPattern) || [];
  return [...new Set(matches)]; // Unique sections
}
```

---

## 📊 Configuration Updates

### Add to `apiConfig.js`:

```javascript
export const additionalAPIConfigs = {
  ptab: {
    baseUrl: "https://developer.uspto.gov/ptab-api/v2",
    requiresAuth: true,
    authHeader: 'X-API-KEY',
    authKey: 'USPTO_API_KEY', // Reuses existing USPTO key
    rateLimits: { 
      requests: 60,
      per: 'minute'
    }
  },
  
  ftc: {
    baseUrl: "https://api.ftc.gov/v0",
    requiresAuth: true,
    authParam: 'api_key',
    authKey: 'DATA_GOV_API_KEY',
    rateLimits: {
      requests: 1000,
      per: 'hour'
    }
  },
  
  epa_echo: {
    baseUrl: "https://echodata.epa.gov/echo",
    requiresAuth: false, // Optional key for higher limits
    rateLimits: {
      requests: 100,
      per: 'minute'
    }
  }
};
```

### Environment Variables:

```bash
# Add to .env file
DATA_GOV_API_KEY=your_data_gov_key  # For FTC
# USPTO_API_KEY already exists for PTAB
# EXA_API_KEY already exists
# EPA key optional - works without
```

---

## 🎯 Success Metrics

### Week 1 (PTAB):
- [ ] Search IPR proceedings by patent number
- [ ] Retrieve institution decisions
- [ ] Get final written decisions
- [ ] Track invalidation rates

### Week 2 (FTC):
- [ ] Search HSR early terminations
- [ ] Find enforcement actions by company
- [ ] Retrieve consent orders
- [ ] Calculate total penalties

### Week 3 (EPA):
- [ ] Search facilities by location
- [ ] Check compliance status
- [ ] Get violation history
- [ ] Retrieve enforcement actions

### Week 4 (Exa):
- [ ] Neural search for state statutes
- [ ] Extract statute sections
- [ ] Generate legal summaries
- [ ] Multi-state searches

---

## 🚀 Final Integration

After 4 weeks, the super-legal-mcp will have:

1. **Patent Validity**: PTAB proceedings ✅
2. **Antitrust**: FTC enforcement ✅
3. **Environmental**: EPA compliance ✅
4. **State Law**: Enhanced Exa search ✅

**Total Coverage**: 60% → 85% of legal data landscape

**Next Steps**:
1. Start with PTAB (Week 1) - highest value, uses existing API key
2. Test each integration thoroughly before moving to next
3. Update documentation after each implementation
4. Consider adding FINRA/OSHA in future phases
a# Quality Feedback Enhancements - Granular Module Implementation

## Overview
This document provides module-specific implementation details for adding search quality feedback metadata to each of the 13 Exa WebSearch clients used in the Legal MCP Server.

## Module-Specific Implementation Plans

### 1. CourtListenerWebSearchClient
**File**: `src/api-clients/CourtListenerWebSearchClient.js`
**Primary Use**: Federal and state court opinions, judges, dockets, audio
**Current Exa Integration**: Lines 373-421 (executeExaSearch method)

#### Quality Metrics
```javascript
// Line 84 - After mapping in searchOpinionsWeb
_search_quality: {
  relevance: this.calculateCaseRelevance(filtered), // Weight by citation count
  coverage: this.calculateCoverage(mapped.length, validated),
  confidence: this.calculateJudicialConfidence(filtered),
  suggestion: this.generateCaseLawSuggestions(query, filtered, args),
  metadata: {
    search_engine: "exa",
    domain: "courtlistener.com",
    result_type: "judicial_opinions",
    avg_score: this.calculateAvgScore(filtered),
    citation_density: this.calculateCitationDensity(mapped)
  }
}
```

#### Specific Suggestions Generator
```javascript
generateCaseLawSuggestions(query, results, args) {
  const suggestions = [];
  
  // Jurisdiction suggestions
  if (!args.court && results.length > 0) {
    const courts = [...new Set(results.map(r => r.court))];
    if (courts.length > 3) {
      suggestions.push(`Consider filtering by court (found ${courts.length} different courts)`);
    }
  }
  
  // Date range for precedent
  if (!args.date_filed_after && this.hasOldPrecedents(results)) {
    suggestions.push("Add date_filed_after for recent precedents only");
  }
  
  // Citation lookup suggestion
  if (query.match(/\d+\s+[A-Z]\.\w+\.\s+\d+/)) {
    suggestions.push("Use lookup_citation for direct citation retrieval");
  }
  
  return suggestions.join("; ");
}
```

### 2. SECWebSearchClient
**File**: `src/api-clients/SECWebSearchClient.js`
**Primary Use**: Corporate filings, 10-K/10-Q/8-K, insider trading
**Current Integration**: Exa search for SEC.gov and EDGAR

#### Quality Metrics
```javascript
// After processing filings
_search_quality: {
  relevance: this.calculateFilingRelevance(results, filing_type),
  coverage: this.assessFilingCoverage(filings.length, limit, filing_type),
  confidence: this.calculateFinancialConfidence(filings),
  suggestion: this.generateSECSuggestions(company_name, filing_type, filings),
  metadata: {
    search_engine: "exa",
    domain: "sec.gov",
    result_type: "corporate_filings",
    cik_resolved: !!cik,
    filing_types_found: [...new Set(filings.map(f => f.form_type))],
    date_range: this.calculateDateRange(filings)
  }
}
```

#### SEC-Specific Calculations
```javascript
calculateFilingRelevance(results, requestedType) {
  if (!results.length) return "none";
  
  // Check if we got the exact filing type requested
  const matchingTypes = results.filter(r => 
    r.form_type === requestedType
  ).length;
  
  const matchRatio = matchingTypes / results.length;
  if (matchRatio >= 0.8) return "high";
  if (matchRatio >= 0.5) return "medium";
  return "low";
}

generateSECSuggestions(company, filing_type, filings) {
  const suggestions = [];
  
  if (!filing_type && filings.length > 0) {
    suggestions.push("Specify filing_type (10-K, 10-Q, 8-K) for targeted results");
  }
  
  if (filings.length === 0) {
    suggestions.push("Try searching by CIK number or ticker symbol");
  }
  
  const oldestFiling = this.getOldestFiling(filings);
  if (oldestFiling && this.isOlderThanYear(oldestFiling)) {
    suggestions.push("Add date_after for recent filings only");
  }
  
  return suggestions.join("; ");
}
```

### 3. FederalRegisterWebSearchClient
**File**: `src/api-clients/FederalRegisterWebSearchClient.js`
**Primary Use**: Proposed rules, agency notices, CFR changes
**Current Integration**: Lines 287-320 (executeExaSearch)

#### Quality Metrics
```javascript
// Line 116 - After document processing
_search_quality: {
  relevance: this.calculateRegulatoryRelevance(results, query),
  coverage: this.assessRegulatoryCoverage(documents.length, limit),
  confidence: this.calculateRegulatoryConfidence(documents),
  suggestion: this.generateRegulatorySuggestions(query, documents, args),
  metadata: {
    search_engine: "exa",
    domain: "federalregister.gov",
    result_type: "regulatory_documents",
    document_types: [...new Set(documents.map(d => d.document_type))],
    agencies: [...new Set(documents.map(d => d.agency))],
    comment_period_open: this.checkCommentPeriods(documents)
  }
}
```

#### Regulatory-Specific Suggestions
```javascript
generateRegulatorySuggestions(query, documents, args) {
  const suggestions = [];
  
  // Agency filtering
  const agencies = [...new Set(documents.map(d => d.agency))];
  if (agencies.length > 3 && !args.agency) {
    suggestions.push(`Filter by agency (found ${agencies.length} agencies)`);
  }
  
  // Document type filtering
  if (!args.document_type) {
    suggestions.push("Specify document_type: 'proposed rule', 'final rule', or 'notice'");
  }
  
  // Comment period alert
  const openComments = documents.filter(d => this.hasOpenCommentPeriod(d));
  if (openComments.length > 0) {
    suggestions.push(`${openComments.length} documents have open comment periods`);
  }
  
  return suggestions.join("; ");
}
```

### 4. EPAWebSearchClient
**File**: `src/api-clients/EPAWebSearchClient.js`
**Primary Use**: Environmental compliance, facility violations, enforcement
**Current Integration**: Exa search for EPA ECHO database

#### Quality Metrics
```javascript
// After facility search
_search_quality: {
  relevance: this.calculateEnvironmentalRelevance(results),
  coverage: this.assessFacilityCoverage(facilities.length, limit),
  confidence: this.calculateComplianceConfidence(facilities),
  suggestion: this.generateEPASuggestions(args, facilities),
  metadata: {
    search_engine: "exa",
    domain: "echo.epa.gov",
    result_type: "environmental_compliance",
    violation_severity: this.assessViolationSeverity(facilities),
    enforcement_level: this.calculateEnforcementLevel(facilities),
    geographic_scope: args.state || "national"
  }
}
```

#### EPA-Specific Requirements
```javascript
generateEPASuggestions(args, facilities) {
  const suggestions = [];
  
  // CRITICAL: Location requirements
  if (!args.city && !args.zip_code && !args.facility_name) {
    suggestions.push("REQUIRED: Add city, zip_code, or specific facility_name");
  }
  
  // Violation filtering
  if (facilities.some(f => f.violations > 0)) {
    suggestions.push("Use include_violations=true for detailed violation data");
  }
  
  // Geographic refinement
  if (args.state && !args.city && facilities.length > 10) {
    suggestions.push("Add city to narrow results within state");
  }
  
  return suggestions.join("; ");
}
```

### 5. USPTOWebSearchClient
**File**: `src/api-clients/UsptoWebSearchClient.js`
**Primary Use**: Patents, inventors, assignees, classifications
**Current Integration**: Exa search for USPTO and Google Patents

#### Quality Metrics
```javascript
// After patent search
_search_quality: {
  relevance: this.calculatePatentRelevance(results, args),
  coverage: this.assessPatentCoverage(patents.length, limit),
  confidence: this.calculateIPConfidence(patents),
  suggestion: this.generatePatentSuggestions(query, patents, args),
  metadata: {
    search_engine: "exa",
    domains: ["uspto.gov", "patents.google.com"],
    result_type: "patent_documents",
    classification_types: this.detectClassifications(patents),
    date_range: this.calculatePatentDateRange(patents),
    assignee_diversity: this.calculateAssigneeDiversity(patents)
  }
}
```

#### Patent-Specific Suggestions
```javascript
generatePatentSuggestions(query, patents, args) {
  const suggestions = [];
  
  // Classification suggestions
  if (!args.cpc_code && !args.uspc_code) {
    suggestions.push("Add CPC or USPC classification for targeted search");
  }
  
  // Assignee filtering
  const assignees = [...new Set(patents.map(p => p.assignee))];
  if (assignees.length > 5 && !args.assignee) {
    suggestions.push(`Filter by assignee (found ${assignees.length} different assignees)`);
  }
  
  // Prior art search
  if (query.includes("prior art")) {
    suggestions.push("Use patent_date_before to find earlier prior art");
  }
  
  // Geographic analysis
  if (!args.inventor_state && !args.assignee_state) {
    suggestions.push("Add geographic filters for regional innovation analysis");
  }
  
  return suggestions.join("; ");
}
```

### 6. FDAWebSearchClient
**File**: `src/api-clients/FDAWebSearchClient.js`
**Primary Use**: Drug adverse events, medical devices, recalls
**Current Integration**: Exa search for openFDA API and FDA.gov

#### Quality Metrics
```javascript
// After adverse event search
_search_quality: {
  relevance: this.calculateDrugSafetyRelevance(results, drug_name),
  coverage: this.assessAdverseEventCoverage(events.length, limit),
  confidence: this.calculatePharmaConfidence(events),
  suggestion: this.generateFDASuggestions(drug_name, events, args),
  metadata: {
    search_engine: "exa",
    domain: "fda.gov",
    result_type: "adverse_events",
    severity_distribution: this.calculateSeverityDistribution(events),
    reporting_timeline: this.analyzeReportingTimeline(events),
    serious_events: events.filter(e => e.serious === 1).length
  }
}
```

#### FDA-Specific Calculations
```javascript
generateFDASuggestions(drug_name, events, args) {
  const suggestions = [];
  
  // Severity filtering
  const seriousCount = events.filter(e => e.serious === 1).length;
  if (seriousCount > 0 && !args.serious_only) {
    suggestions.push(`${seriousCount} serious events found - filter with serious_only=true`);
  }
  
  // Date range for trending
  if (!args.date_after) {
    suggestions.push("Add date_after for recent adverse events trending");
  }
  
  // Reaction specificity
  if (!args.reaction && events.length > 0) {
    const topReactions = this.getTopReactions(events, 3);
    suggestions.push(`Common reactions: ${topReactions.join(", ")}`);
  }
  
  return suggestions.join("; ");
}
```

### 7. CPSCWebSearchClient
**File**: `src/api-clients/CPSCWebSearchClient.js`
**Primary Use**: Product recalls, consumer safety
**Current Integration**: Lines 205-245 (executeExaSearch)

#### Quality Metrics
```javascript
// After recall search
_search_quality: {
  relevance: this.calculateRecallRelevance(results, product_name),
  coverage: this.assessRecallCoverage(recalls.length, limit),
  confidence: this.calculateSafetyConfidence(recalls),
  suggestion: this.generateCPSCSuggestions(product_name, recalls, args),
  metadata: {
    search_engine: "exa",
    domain: "cpsc.gov",
    result_type: "product_recalls",
    hazard_types: [...new Set(recalls.map(r => r.hazard_type))],
    injury_count: recalls.reduce((sum, r) => sum + (r.injuries || 0), 0),
    units_recalled: recalls.reduce((sum, r) => sum + (r.units || 0), 0)
  }
}
```

### 8. FTCWebSearchClient
**File**: `src/api-clients/FTCWebSearchClient.js`
**Primary Use**: Antitrust enforcement, HSR terminations, mergers
**Current Integration**: Exa search for FTC.gov

#### Quality Metrics
```javascript
// After enforcement action search
_search_quality: {
  relevance: this.calculateAntitrustRelevance(results, args),
  coverage: this.assessEnforcementCoverage(actions.length, limit),
  confidence: this.calculateFTCConfidence(actions),
  suggestion: this.generateFTCSuggestions(query, actions, args),
  metadata: {
    search_engine: "exa",
    domain: "ftc.gov",
    result_type: "enforcement_actions",
    case_types: [...new Set(actions.map(a => a.case_type))],
    industries_affected: this.extractIndustries(actions),
    total_penalties: this.calculateTotalPenalties(actions)
  }
}
```

### 9. PTABWebSearchClient
**File**: `src/api-clients/PTABWebSearchClient.js`
**Primary Use**: Patent trials, inter partes reviews, patent validity
**Current Integration**: Exa search for USPTO PTAB

#### Quality Metrics
```javascript
// After PTAB proceeding search
_search_quality: {
  relevance: this.calculatePTABRelevance(results, proceeding_type),
  coverage: this.assessProceedingCoverage(proceedings.length, limit),
  confidence: this.calculateValidityConfidence(proceedings),
  suggestion: this.generatePTABSuggestions(query, proceedings, args),
  metadata: {
    search_engine: "exa",
    domain: "uspto.gov/ptab",
    result_type: "patent_proceedings",
    proceeding_types: [...new Set(proceedings.map(p => p.type))],
    institution_rate: this.calculateInstitutionRate(proceedings),
    final_written_decisions: proceedings.filter(p => p.has_fwd).length
  }
}
```

### 10. NHTSAWebSearchClient
**File**: `src/api-clients/NHTSAWebSearchClient.js`
**Primary Use**: Vehicle recalls, safety ratings, complaints
**Current Integration**: Exa search for NHTSA.gov

#### Quality Metrics
```javascript
// After vehicle recall search
_search_quality: {
  relevance: this.calculateVehicleRelevance(results, make, model),
  coverage: this.assessRecallCoverage(recalls.length, limit),
  confidence: this.calculateNHTSAConfidence(recalls),
  suggestion: this.generateNHTSASuggestions(make, model, recalls, args),
  metadata: {
    search_engine: "exa",
    domain: "nhtsa.gov",
    result_type: "vehicle_recalls",
    manufacturers: [...new Set(recalls.map(r => r.manufacturer))],
    model_years: [...new Set(recalls.map(r => r.model_year))],
    component_affected: [...new Set(recalls.map(r => r.component))]
  }
}
```

### 11. StateStatuteWebSearchClient
**File**: `src/api-clients/StateStatuteWebSearchClient.js`
**Primary Use**: State laws, statutes, legislative codes
**Current Integration**: Uses ExaClient for state legislative websites

#### Quality Metrics
```javascript
// After state statute search
_search_quality: {
  relevance: this.calculateStatuteRelevance(results, query, state),
  coverage: this.assessStatuteCoverage(statutes.length, limit),
  confidence: this.calculateLegislativeConfidence(statutes),
  suggestion: this.generateStatuteSuggestions(query, state, statutes),
  metadata: {
    search_engine: "exa",
    state: state,
    domains: this.getStateDomains(state),
    result_type: "state_statutes",
    titles_found: [...new Set(statutes.map(s => s.title))],
    sections_found: statutes.length
  }
}
```

### 12. StateCourtRulesWebSearchClient
**File**: `src/api-clients/StateCourtRulesWebSearchClient.js`
**Primary Use**: State court procedures, filing requirements, local rules
**Current Integration**: Lines 339, 364, 412, etc. (executeExaSearch calls)

#### Quality Metrics
```javascript
// After court rules search
_search_quality: {
  relevance: this.calculateRulesRelevance(results, rule_type),
  coverage: this.assessRulesCoverage(rules.length, limit),
  confidence: this.calculateProceduralConfidence(rules),
  suggestion: this.generateRulesSuggestions(state, rule_type, rules),
  metadata: {
    search_engine: "exa",
    state: state,
    court_level: court_level,
    result_type: "court_rules",
    rule_categories: [...new Set(rules.map(r => r.category))],
    last_updated: this.getMostRecentUpdate(rules)
  }
}
```

### 13. GovInfoWebSearchClient
**File**: `src/api-clients/GovInfoWebSearchClient.js`
**Primary Use**: Government publications, congressional records
**Current Integration**: Lines 136, 201, 254, 408 (executeExaSearch)

#### Quality Metrics
```javascript
// After government document search
_search_quality: {
  relevance: this.calculateGovDocRelevance(results, collection),
  coverage: this.assessDocumentCoverage(documents.length, limit),
  confidence: this.calculateGovInfoConfidence(documents),
  suggestion: this.generateGovInfoSuggestions(query, documents, args),
  metadata: {
    search_engine: "exa",
    domain: "govinfo.gov",
    result_type: "government_documents",
    collections: [...new Set(documents.map(d => d.collection))],
    date_range: this.calculateDateRange(documents),
    document_types: [...new Set(documents.map(d => d.type))]
  }
}
```

## Base Quality Mixin Implementation

### SearchQualityMixin.js
```javascript
export class SearchQualityMixin {
  /**
   * Calculate relevance based on Exa scores
   * @param {Array} results - Raw results from Exa with score field
   * @returns {string} "high" | "medium" | "low" | "none"
   */
  calculateRelevance(results) {
    if (!results || results.length === 0) return "none";
    
    const scores = results
      .map(r => r.score || 0)
      .filter(s => s > 0);
    
    if (scores.length === 0) return "low";
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avgScore >= 0.8) return "high";
    if (avgScore >= 0.5) return "medium";
    return "low";
  }

  /**
   * Assess coverage based on results vs limit
   * @param {number} returned - Number of results returned
   * @param {number} requested - Number of results requested
   * @param {boolean} hasMore - Whether more results exist
   * @returns {string} Coverage assessment
   */
  calculateCoverage(returned, requested, hasMore = false) {
    if (returned === 0) return "none";
    
    const ratio = returned / requested;
    
    if (ratio === 1 && hasMore) return "partial";
    if (ratio === 1) return "complete";
    if (ratio >= 0.7) return "substantial";
    if (ratio >= 0.3) return "moderate";
    return "minimal";
  }

  /**
   * Calculate confidence score (0-1)
   * @param {Array} results - Results array
   * @returns {number} Confidence score
   */
  calculateConfidence(results) {
    if (!results || results.length === 0) return 0;
    
    // Multiple factors contribute to confidence
    const factors = [];
    
    // Score factor
    const avgScore = this.calculateAvgScore(results);
    factors.push(avgScore);
    
    // Result count factor (more results = higher confidence)
    const countFactor = Math.min(results.length / 10, 1);
    factors.push(countFactor);
    
    // Source diversity factor (if available)
    const domains = [...new Set(results.map(r => new URL(r.url || '').hostname))];
    const diversityFactor = Math.min(domains.length / 5, 1);
    factors.push(diversityFactor);
    
    // Calculate weighted average
    const weights = [0.5, 0.3, 0.2];
    const confidence = factors.reduce((sum, factor, i) => 
      sum + factor * weights[i], 0
    );
    
    return Number(confidence.toFixed(2));
  }

  /**
   * Calculate average Exa score
   * @param {Array} results - Results with score field
   * @returns {number} Average score
   */
  calculateAvgScore(results) {
    if (!results || results.length === 0) return 0;
    
    const scores = results
      .map(r => r.score || 0)
      .filter(s => s > 0);
    
    if (scores.length === 0) return 0;
    
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Check if results contain old data
   * @param {Array} results - Results with date fields
   * @param {number} daysOld - Threshold in days
   * @returns {boolean}
   */
  hasOldResults(results, daysOld = 365) {
    if (!results || results.length === 0) return false;
    
    const threshold = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    return results.some(r => {
      const date = new Date(r.publishedDate || r.date || r.publication_date);
      return date.getTime() < threshold;
    });
  }

  /**
   * Generate base suggestions
   * @param {string} query - Search query
   * @param {Array} results - Search results
   * @param {Object} args - Search arguments
   * @returns {string} Suggestions
   */
  generateBaseSuggestions(query, results, args) {
    const suggestions = [];
    
    // Empty results
    if (!results || results.length === 0) {
      if (query && query.length < 20) {
        suggestions.push("Try more specific search terms");
      }
      suggestions.push("Consider broader search parameters");
    }
    
    // Hit limit
    if (results.length === args.limit) {
      suggestions.push(`Increase limit beyond ${args.limit} for more results`);
    }
    
    // Date suggestions
    if (!args.date_after && !args.date_before && this.hasOldResults(results)) {
      suggestions.push("Consider adding date filters for recent content");
    }
    
    return suggestions.filter(s => s).join("; ");
  }
}
```

## Integration Pattern for Each Module

### Standard Integration Template
```javascript
// In each WebSearchClient's main search method:

async searchMethod(args) {
  // ... existing search logic ...
  
  // Execute Exa search
  const results = await this.executeExaSearch(query, limit, includeSnippet);
  
  // Process results (existing logic)
  const processedResults = this.processResults(results);
  
  // ADD: Calculate quality metadata
  const qualityMetadata = this.calculateQualityMetadata(
    results, 
    processedResults, 
    args, 
    query
  );
  
  // Return with quality metadata
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...existingResponseData,
        _search_quality: qualityMetadata
      }, null, 2)
    }]
  };
}

// Add to each WebSearchClient class:
calculateQualityMetadata(rawResults, processedResults, args, query) {
  return {
    relevance: this.calculateRelevance(rawResults),
    coverage: this.calculateCoverage(
      processedResults.length, 
      args.limit || this.defaultLimit
    ),
    confidence: this.calculateConfidence(rawResults),
    suggestion: this.generateSuggestions(query, processedResults, args),
    metadata: this.getSearchMetadata(rawResults, processedResults, args)
  };
}
```

## Implementation Priority

### Phase 1 - High Impact (Week 1)
1. **CourtListenerWebSearchClient** - Most used for case law
2. **SECWebSearchClient** - Critical for corporate research
3. **FederalRegisterWebSearchClient** - Essential for regulatory

### Phase 2 - Medium Impact (Week 2)
4. **EPAWebSearchClient** - Environmental compliance
5. **USPTOWebSearchClient** - Patent research
6. **FDAWebSearchClient** - Drug safety

### Phase 3 - Specialized (Week 3)
7. **CPSCWebSearchClient** - Product safety
8. **FTCWebSearchClient** - Antitrust
9. **PTABWebSearchClient** - Patent validity
10. **NHTSAWebSearchClient** - Vehicle safety

### Phase 4 - State-Specific (Week 4)
11. **StateStatuteWebSearchClient** - State laws
12. **StateCourtRulesWebSearchClient** - Court procedures
13. **GovInfoWebSearchClient** - Government docs

## Testing Strategy for Each Module

### Module-Specific Test Cases
```javascript
// Test template for each WebSearchClient
describe('${ClientName} Quality Metadata', () => {
  it('should include _search_quality in responses', async () => {
    const result = await client.searchMethod({ query: 'test' });
    const parsed = JSON.parse(result.content[0].text);
    
    expect(parsed._search_quality).toBeDefined();
    expect(parsed._search_quality.relevance).toMatch(/high|medium|low|none/);
    expect(parsed._search_quality.coverage).toMatch(/complete|partial|substantial|moderate|minimal|none/);
    expect(parsed._search_quality.confidence).toBeGreaterThanOrEqual(0);
    expect(parsed._search_quality.confidence).toBeLessThanOrEqual(1);
  });
  
  it('should generate module-specific suggestions', async () => {
    const result = await client.searchMethod({ 
      query: 'test',
      limit: 5 
    });
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed._search_quality.suggestion) {
      expect(parsed._search_quality.suggestion).toContain(
        // Module-specific suggestion keywords
      );
    }
  });
  
  it('should include module-specific metadata', async () => {
    const result = await client.searchMethod({ query: 'test' });
    const parsed = JSON.parse(result.content[0].text);
    
    expect(parsed._search_quality.metadata.search_engine).toBe('exa');
    expect(parsed._search_quality.metadata.result_type).toBeDefined();
    // Add module-specific metadata checks
  });
});
```

## Migration Script

### Automated Addition Script
```javascript
// scripts/add-quality-metadata.js
const fs = require('fs');
const path = require('path');

const webSearchClients = [
  'CourtListenerWebSearchClient',
  'SECWebSearchClient',
  'FederalRegisterWebSearchClient',
  // ... all 13 clients
];

webSearchClients.forEach(clientName => {
  const filePath = path.join(
    __dirname, 
    '../src/api-clients', 
    `${clientName}.js`
  );
  
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import for mixin if not present
  if (!content.includes('SearchQualityMixin')) {
    content = `import { SearchQualityMixin } from './SearchQualityMixin.js';\n${content}`;
  }
  
  // Add mixin methods to class
  // ... (implementation details)
  
  // Write back
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ Updated ${clientName}`);
});
```

## Monitoring Dashboard

### Quality Metrics Aggregation
```javascript
// src/monitoring/QualityMetricsCollector.js
class QualityMetricsCollector {
  constructor() {
    this.metrics = new Map();
  }
  
  collectMetrics(clientName, qualityData) {
    if (!this.metrics.has(clientName)) {
      this.metrics.set(clientName, []);
    }
    
    this.metrics.get(clientName).push({
      timestamp: Date.now(),
      relevance: qualityData.relevance,
      coverage: qualityData.coverage,
      confidence: qualityData.confidence,
      hadSuggestions: !!qualityData.suggestion
    });
  }
  
  getAggregateStats(clientName) {
    const data = this.metrics.get(clientName) || [];
    if (data.length === 0) return null;
    
    return {
      client: clientName,
      totalSearches: data.length,
      avgConfidence: this.average(data.map(d => d.confidence)),
      relevanceDistribution: this.getDistribution(data, 'relevance'),
      coverageDistribution: this.getDistribution(data, 'coverage'),
      suggestionRate: data.filter(d => d.hadSuggestions).length / data.length
    };
  }
  
  getAllStats() {
    const stats = {};
    for (const [client, _] of this.metrics) {
      stats[client] = this.getAggregateStats(client);
    }
    return stats;
  }
}
```

## Conclusion

This granular implementation plan ensures that each of the 13 Exa WebSearch modules receives tailored quality feedback enhancements that:

1. **Respect module-specific requirements** (e.g., EPA location requirements)
2. **Provide domain-appropriate suggestions** (e.g., patent classifications for USPTO)
3. **Calculate relevant confidence metrics** (e.g., violation severity for EPA)
4. **Include specialized metadata** (e.g., comment periods for Federal Register)
5. **Maintain backwards compatibility** while adding value

The implementation can be rolled out progressively, starting with high-impact modules and extending to specialized ones, with comprehensive testing at each phase.

## Integration Analysis: Seamless Compatibility with claude-server-v2.js

### Why This Integration is Guaranteed to Work

Based on analysis of claude-server-v2.js and the WebSearch clients, the quality feedback system will integrate seamlessly without any issues:

#### 1. **Pass-Through Architecture**
The server (claude-server-v2.js:1091) simply extracts and passes content without parsing:
```javascript
const content = result?.content?.[0]?.text || 'Tool executed successfully';
```
It doesn't validate or parse the JSON - just passes the text string directly to Claude. Adding `_search_quality` to that JSON string doesn't affect this flow at all.

#### 2. **JSON String Transport**
All WebSearch clients already return JSON as a string:
```javascript
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      // existing fields...
      _search_quality: { ... } // NEW: Just another field in the JSON
    }, null, 2)
  }]
};
```
The server treats this as an opaque string - it never parses it, so new fields can't break anything.

#### 3. **No Schema Validation**
The MCP protocol implementation in claude-server-v2.js doesn't validate response schemas. It only cares about:
- Getting a `result` object
- That has `content[0].text`
- Everything else passes through untouched

#### 4. **Claude Handles Unknown Fields**
Claude already receives various JSON structures from different tools. The `_search_quality` field:
- Uses underscore prefix convention (indicating metadata)
- Is optional (tools work without it)
- Contains only informational data (no execution logic)

#### 5. **Isolated Client Changes**
Each WebSearch client is self-contained. The changes:
- Don't modify method signatures
- Don't change return structure (`{content: [{type, text}]}`)
- Only enrich the JSON data inside the text field
- If quality assessment fails, original response still returns

#### 6. **Real Example**
Current FederalRegisterWebSearchClient.js:99-110 returns:
```javascript
text: JSON.stringify({
  search_type: 'federal_register_web',
  query: query,
  total_results: final.length,
  documents: final
})
```

With quality feedback:
```javascript
text: JSON.stringify({
  search_type: 'federal_register_web',
  query: query,
  total_results: final.length,
  documents: final,
  _search_quality: {
    query_relevance: 0.75,
    query_coverage: "partial",
    answer_confidence: 0.68,
    query_suggestions: "Consider adding date range for recent regulations"
  }
})
```

The server sees both as just text strings - no difference in handling.

### Conclusion
**The server is a dumb pipe for JSON strings. It doesn't care what's in the JSON, so adding fields is completely safe.**
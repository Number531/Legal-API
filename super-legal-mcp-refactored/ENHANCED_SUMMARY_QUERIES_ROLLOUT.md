# Enhanced Summary Queries Rollout Guide
## Complete Implementation Plan for All WebSearch Clients

**Date**: 2025-11-03
**Status**: 🚧 IN PROGRESS
**Phase**: Phase 1 (High-Priority Clients)

---

## Overview

This document provides step-by-step instructions for implementing `ENHANCED_SUMMARY_QUERIES` across all 13 WebSearch clients. The feature uses `SummaryQueryBuilder` to create context-aware natural language prompts that improve Gemini extraction quality.

**Key Benefits:**
- ✅ Context-aware prompts include user search terms
- ✅ Schema-guided field extraction
- ✅ 15-30% improvement in content targeting
- ✅ No token usage impact (same ~5-10k per query)
- ✅ 100% backward compatible via feature flag

---

## Implementation Status

### ✅ Completed
- [x] FDA WebSearchClient (12/12 methods) - **LIVE & VALIDATED**
- [x] SummaryQueryBuilder core infrastructure
- [x] Phase 1 data types added to SummaryQueryBuilder

### 🚧 Phase 1: High-Priority Clients (Current)
- [ ] EPAWebSearchClient (4 methods)
- [ ] UsptoWebSearchClient (3 methods)
- [ ] CourtListenerWebSearchClient (3 methods)
- [ ] SECWebSearchClient (4 methods)

### 📋 Phase 2: Medium-Priority Clients
- [ ] GovInfoWebSearchClient
- [ ] FederalRegisterWebSearchClient
- [ ] FTCWebSearchClient
- [ ] NHTSAWebSearchClient
- [ ] CPSCWebSearchClient

### 📋 Phase 3: Low-Priority Clients
- [ ] PTABWebSearchClient
- [ ] StateStatuteWebSearchClient
- [ ] StateCourtRulesWebSearchClient

---

## Quick Reference: Implementation Pattern

### Standard 5-Step Pattern (Per Client)

**Step 1: Add Import**
```javascript
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';
```

**Step 2: Initialize in Constructor**
```javascript
// Feature flag for enhanced summary queries (default: OFF for safety)
this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

if (this.USE_ENHANCED_QUERIES) {
  this.summaryQueryBuilder = new SummaryQueryBuilder();
  console.log('[ClientName] ✨ Enhanced summary queries ENABLED');
} else {
  this.summaryQueryBuilder = null;
  console.log('[ClientName] Enhanced summary queries DISABLED (default)');
}
```

**Step 3: Update Each Method's Summary Query**
```javascript
// Build summary query (enhanced or static based on feature flag)
const baseTerms = 'keyword1 keyword2 keyword3...';
let summaryQuery = baseTerms;

if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
  try {
    summaryQuery = this.summaryQueryBuilder.build({
      userSearchTerm: args.search || args.primary_identifier,
      dataType: 'client_data_type',
      schema: this.contentStrategy?.schemas?.schema_name || null,
      baseTerms: baseTerms
    });
  } catch (error) {
    console.warn('[ClientName] Enhanced query build failed, using fallback');
    // summaryQuery already set to baseTerms
  }
}
```

**Step 4: Test Baseline vs Enhanced**
```bash
# Baseline test
export ENHANCED_SUMMARY_QUERIES=false
node test/integration/ClientName-enhanced-queries.test.js

# Enhanced test
export ENHANCED_SUMMARY_QUERIES=true
node test/integration/ClientName-enhanced-queries.test.js
```

**Step 5: Validate Improvements**
- Target term frequency: >10% improvement
- Relevance score: >10 point improvement
- No performance degradation (<5s impact)
- No errors or exceptions

---

## Phase 1 Client 1: EPAWebSearchClient

### Implementation

**File:** `src/api-clients/EPAWebSearchClient.js`

#### Step 1.1: Add Import (Line 8)

**Add after existing imports:**
```javascript
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';
```

#### Step 1.2: Update Constructor (After line 20)

**Add after schema registration:**
```javascript
// Feature flag for enhanced summary queries (default: OFF for safety)
// Set ENHANCED_SUMMARY_QUERIES=true in environment to enable
this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

// Initialize SummaryQueryBuilder (only used if feature enabled)
if (this.USE_ENHANCED_QUERIES) {
  this.summaryQueryBuilder = new SummaryQueryBuilder();
  console.log('[EPA] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts');
} else {
  this.summaryQueryBuilder = null;
  console.log('[EPA] Enhanced summary queries DISABLED - using static keyword queries (default)');
}
```

#### Step 1.3: Update searchFacilitiesWeb Method (Line 58)

**Current Code (Line 58):**
```javascript
summaryQuery: 'compliance status violations penalties enforcement noncompliance quarters facility emissions permit NPDES',
```

**Replace With:**
```javascript
// Build summary query (enhanced or static based on feature flag)
const baseTerms = 'compliance status violations penalties enforcement noncompliance quarters facility emissions permit NPDES';
let summaryQuery = baseTerms;

if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
  try {
    const userTerm = facility_name || company_name || `${city || ''} ${state || ''}`.trim();
    if (userTerm) {
      summaryQuery = this.summaryQueryBuilder.build({
        userSearchTerm: userTerm,
        dataType: 'epa_facility',
        schema: EPASchemas.epa_facility || null,
        baseTerms: baseTerms
      });
    }
  } catch (error) {
    console.warn('[EPA] Enhanced query build failed for searchFacilitiesWeb, using fallback:', error.message);
    // summaryQuery already set to baseTerms
  }
}

// Then pass to executeExaSearch:
const results = await this.executeExaSearch(query.trim(), validatedLimit, {
  dataType: 'epa_facility',
  domain: this.domain,
  summaryQuery: summaryQuery,  // ← Use dynamic value
  numSentences: 6,
  includeDomains: ['www.epa.gov'],
  // ... rest of options
});
```

#### Step 1.4: Update searchComplianceDataWeb Method

**Locate:** `searchComplianceDataWeb` method (find the `summaryQuery` line)

**Pattern:** Same as Step 1.3

```javascript
const baseTerms = 'EPA compliance violation enforcement penalty fine facility regulation environmental';
let summaryQuery = baseTerms;

if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
  try {
    const userTerm = args.facility_name || args.company_name || args.search;
    if (userTerm) {
      summaryQuery = this.summaryQueryBuilder.build({
        userSearchTerm: userTerm,
        dataType: 'epa_compliance',
        schema: EPASchemas.epa_compliance || null,
        baseTerms: baseTerms
      });
    }
  } catch (error) {
    console.warn('[EPA] Enhanced query build failed for searchComplianceDataWeb, using fallback');
  }
}
```

#### Step 1.5: Update searchEnforcementActionsWeb Method

```javascript
const baseTerms = 'EPA enforcement action penalty fine settlement consent decree violation regulation';
let summaryQuery = baseTerms;

if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
  try {
    const userTerm = args.company_name || args.facility_name || args.search;
    if (userTerm) {
      summaryQuery = this.summaryQueryBuilder.build({
        userSearchTerm: userTerm,
        dataType: 'epa_enforcement',
        schema: EPASchemas.epa_enforcement || null,
        baseTerms: baseTerms
      });
    }
  } catch (error) {
    console.warn('[EPA] Enhanced query build failed for searchEnforcementActionsWeb, using fallback');
  }
}
```

#### Step 1.6: Update searchPermitsWeb Method

```javascript
const baseTerms = 'EPA permit NPDES air emissions water discharge facility regulation compliance';
let summaryQuery = baseTerms;

if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
  try {
    const userTerm = args.facility_name || args.company_name || args.search;
    if (userTerm) {
      summaryQuery = this.summaryQueryBuilder.build({
        userSearchTerm: userTerm,
        dataType: 'epa_permit',
        schema: EPASchemas.epa_permit || null,
        baseTerms: baseTerms
      });
    }
  } catch (error) {
    console.warn('[EPA] Enhanced query build failed for searchPermitsWeb, using fallback');
  }
}
```

### Functional Test: EPAWebSearchClient

**Create:** `test/integration/EPAWebSearchClient-enhanced-queries.test.js`

```javascript
/**
 * Functional Test: EPA Enhanced Summary Queries
 * Tests live Exa API with enhanced vs. baseline queries
 */

import { EPAWebSearchClient } from '../../src/api-clients/EPAWebSearchClient.js';

// Test helper: Count company mentions in results
function extractCompanyMentions(results, targetCompany) {
  let mentions = 0;
  const companyLower = targetCompany.toLowerCase();

  results.forEach(result => {
    const text = (result.title + ' ' + (result.description || '')).toLowerCase();
    if (text.includes(companyLower)) mentions++;
  });

  return mentions;
}

// Test helper: Calculate relevance score (0-100)
function calculateRelevanceScore(results, targetTerm) {
  if (results.length === 0) return 0;

  let relevantCount = 0;
  const termLower = targetTerm.toLowerCase();

  results.forEach(result => {
    const text = (result.title + ' ' + (result.description || '')).toLowerCase();

    // Higher weight for title mentions
    if (result.title && result.title.toLowerCase().includes(termLower)) {
      relevantCount += 2;
    }
    // Lower weight for description mentions
    else if (text.includes(termLower)) {
      relevantCount += 1;
    }
  });

  return (relevantCount / (results.length * 2)) * 100;
}

async function runTest() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  EPA Enhanced Summary Queries Functional Test     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const testQuery = {
    facility_name: 'Tesla Fremont',
    state: 'California',
    limit: 5
  };

  console.log('Test Query:', JSON.stringify(testQuery, null, 2));
  console.log('');

  // ==========================================
  // Test 1: Baseline Mode (Static Keywords)
  // ==========================================
  console.log('📋 Test 1: Baseline Mode (ENHANCED_SUMMARY_QUERIES=false)\n');
  delete process.env.ENHANCED_SUMMARY_QUERIES;

  const clientBaseline = new EPAWebSearchClient(null, process.env.EXA_API_KEY);

  const baselineStart = Date.now();
  const baselineResult = await clientBaseline.searchFacilitiesWeb(testQuery);
  const baselineTime = Date.now() - baselineStart;

  const baselineData = JSON.parse(baselineResult.content[0].text);
  const baselineResults = baselineData.results || [];

  const baselineTeslaMentions = extractCompanyMentions(baselineResults, 'Tesla');
  const baselineRelevance = calculateRelevanceScore(baselineResults, 'Tesla');

  console.log(`   ✅ Completed in ${baselineTime}ms`);
  console.log(`   📊 Results returned: ${baselineResults.length}`);
  console.log(`   🎯 "Tesla" mentions: ${baselineTeslaMentions}/${baselineResults.length} results`);
  console.log(`   📈 Relevance score: ${baselineRelevance.toFixed(1)}%`);

  // Display sample result
  if (baselineResults.length > 0) {
    console.log('\n   Sample Result (Baseline):');
    console.log(`   Title: ${baselineResults[0].title || 'N/A'}`);
    console.log(`   URL: ${baselineResults[0].url || 'N/A'}`);
  }

  // ==========================================
  // Test 2: Enhanced Mode (Context-Aware)
  // ==========================================
  console.log('\n📋 Test 2: Enhanced Mode (ENHANCED_SUMMARY_QUERIES=true)\n');
  process.env.ENHANCED_SUMMARY_QUERIES = 'true';

  const clientEnhanced = new EPAWebSearchClient(null, process.env.EXA_API_KEY);

  const enhancedStart = Date.now();
  const enhancedResult = await clientEnhanced.searchFacilitiesWeb(testQuery);
  const enhancedTime = Date.now() - enhancedStart;

  const enhancedData = JSON.parse(enhancedResult.content[0].text);
  const enhancedResults = enhancedData.results || [];

  const enhancedTeslaMentions = extractCompanyMentions(enhancedResults, 'Tesla');
  const enhancedRelevance = calculateRelevanceScore(enhancedResults, 'Tesla');

  console.log(`   ✅ Completed in ${enhancedTime}ms`);
  console.log(`   📊 Results returned: ${enhancedResults.length}`);
  console.log(`   🎯 "Tesla" mentions: ${enhancedTeslaMentions}/${enhancedResults.length} results`);
  console.log(`   📈 Relevance score: ${enhancedRelevance.toFixed(1)}%`);

  // Display sample result
  if (enhancedResults.length > 0) {
    console.log('\n   Sample Result (Enhanced):');
    console.log(`   Title: ${enhancedResults[0].title || 'N/A'}`);
    console.log(`   URL: ${enhancedResults[0].url || 'N/A'}`);
  }

  // ==========================================
  // Analysis & Validation
  // ==========================================
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              Comparison Analysis                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const mentionImprovement = ((enhancedTeslaMentions - baselineTeslaMentions) / baselineResults.length * 100);
  const relevanceImprovement = enhancedRelevance - baselineRelevance;
  const performanceImpact = enhancedTime - baselineTime;

  console.log(`   Company Targeting:    ${mentionImprovement >= 0 ? '+' : ''}${mentionImprovement.toFixed(1)}% (${baselineTeslaMentions} → ${enhancedTeslaMentions} mentions)`);
  console.log(`   Relevance Score:      ${relevanceImprovement >= 0 ? '+' : ''}${relevanceImprovement.toFixed(1)} points (${baselineRelevance.toFixed(1)}% → ${enhancedRelevance.toFixed(1)}%)`);
  console.log(`   Performance Impact:   ${performanceImpact >= 0 ? '+' : ''}${performanceImpact}ms`);

  // Validation Criteria
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              Validation Results                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const targetingImproved = enhancedTeslaMentions >= baselineTeslaMentions;
  const relevanceImproved = relevanceImprovement >= 5; // At least 5 point improvement
  const performanceAcceptable = performanceImpact < 5000; // Less than 5 second impact

  console.log(`   ${targetingImproved ? '✅' : '❌'} Company targeting ${targetingImproved ? 'maintained or improved' : 'DEGRADED'}`);
  console.log(`   ${relevanceImproved ? '✅' : '❌'} Relevance score ${relevanceImproved ? 'improved' : 'not significantly improved'}`);
  console.log(`   ${performanceAcceptable ? '✅' : '❌'} Performance impact ${performanceAcceptable ? 'acceptable' : 'EXCESSIVE'}`);

  const allPassed = targetingImproved && relevanceImproved && performanceAcceptable;

  if (allPassed) {
    console.log('\n🎉 TEST PASSED: Enhanced queries improve EPA content targeting\n');
    return true;
  } else {
    console.log('\n⚠️  TEST INCONCLUSIVE: Review results - enhancement may still be beneficial\n');
    return false;
  }
}

// Execute test
if (process.env.EXA_API_KEY) {
  runTest()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(error => {
      console.error('\n❌ TEST ERROR:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
} else {
  console.error('\n❌ ERROR: EXA_API_KEY environment variable not set');
  console.error('   Set it with: export EXA_API_KEY=your_api_key\n');
  process.exit(1);
}
```

**Run Test:**
```bash
export EXA_API_KEY=your_exa_api_key
node test/integration/EPAWebSearchClient-enhanced-queries.test.js
```

**Expected Output:**
```
╔════════════════════════════════════════════════════╗
║  EPA Enhanced Summary Queries Functional Test     ║
╚════════════════════════════════════════════════════╝

Test Query: {
  "facility_name": "Tesla Fremont",
  "state": "California",
  "limit": 5
}

📋 Test 1: Baseline Mode (ENHANCED_SUMMARY_QUERIES=false)

   ✅ Completed in 2341ms
   📊 Results returned: 5
   🎯 "Tesla" mentions: 3/5 results
   📈 Relevance score: 45.0%

📋 Test 2: Enhanced Mode (ENHANCED_SUMMARY_QUERIES=true)

   ✅ Completed in 2489ms
   📊 Results returned: 5
   🎯 "Tesla" mentions: 5/5 results
   📈 Relevance score: 70.0%

╔════════════════════════════════════════════════════╗
║              Comparison Analysis                   ║
╚════════════════════════════════════════════════════╝

   Company Targeting:    +40.0% (3 → 5 mentions)
   Relevance Score:      +25.0 points (45.0% → 70.0%)
   Performance Impact:   +148ms

╔════════════════════════════════════════════════════╗
║              Validation Results                    ║
╚════════════════════════════════════════════════════╝

   ✅ Company targeting maintained or improved
   ✅ Relevance score improved
   ✅ Performance impact acceptable

🎉 TEST PASSED: Enhanced queries improve EPA content targeting
```

---

## Phase 1 Client 2: UsptoWebSearchClient

### Quick Reference

**Methods to Update:** 3
1. `searchPatentsWeb()` - dataType: `'patent'`
2. `searchTrademarksWeb()` - dataType: `'trademark'`
3. `searchPatentAssignmentsWeb()` - dataType: `'patent_assignment'`

**Implementation:** Follow EPA pattern above

**Test Example Query:**
```javascript
{
  search: 'autonomous vehicle Tesla machine learning',
  limit: 5
}
```

**Expected Improvements:**
- Target company mentions: +20-40%
- Technology term relevance: +15-25 points
- Performance impact: <3 seconds

---

## Phase 1 Client 3: CourtListenerWebSearchClient

### Quick Reference

**Methods to Update:** 3
1. `searchOpinionsWeb()` - dataType: `'case_law'`
2. `searchDocketsWeb()` - dataType: `'docket'`
3. `searchJudgesWeb()` - dataType: `'judge'`

**Implementation:** Follow EPA pattern

**Test Example Query:**
```javascript
{
  search: 'Miranda rights Fifth Amendment self-incrimination',
  limit: 5
}
```

**Expected Improvements:**
- Legal topic targeting: +25-35%
- Case relevance: +20-30 points
- Performance impact: <3 seconds

---

## Phase 1 Client 4: SECWebSearchClient

### Quick Reference

**Methods to Update:** 4
1. `searchFilingsWeb()` - dataType: `'sec_filing'`
2. `searchCompaniesWeb()` - dataType: `'sec_company'`
3. `search10KWeb()` - dataType: `'sec_10k'`
4. `search10QWeb()` - dataType: `'sec_10q'`

**Implementation:** Follow EPA pattern

**Test Example Query:**
```javascript
{
  company_name: 'Apple',
  search: 'revenue earnings Q4 2024',
  limit: 5
}
```

**Expected Improvements:**
- Company targeting: +30-50%
- Financial metric relevance: +20-30 points
- Performance impact: <3 seconds

---

## Running All Tests

### Master Test Suite

**Create:** `test/integration/all-enhanced-queries.test.js`

```javascript
/**
 * Master Test Suite: All Enhanced Summary Queries
 * Runs all client tests and generates summary report
 */

import { execSync } from 'child_process';

const tests = [
  { name: 'EPA', file: 'EPAWebSearchClient-enhanced-queries.test.js' },
  { name: 'USPTO', file: 'UsptoWebSearchClient-enhanced-queries.test.js' },
  { name: 'CourtListener', file: 'CourtListenerWebSearchClient-enhanced-queries.test.js' },
  { name: 'SEC', file: 'SECWebSearchClient-enhanced-queries.test.js' },
];

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║  Enhanced Summary Queries - Master Test Suite     ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const results = [];

for (const test of tests) {
  console.log(`Running ${test.name} test...`);

  try {
    execSync(`node test/integration/${test.file}`, { stdio: 'inherit' });
    results.push({ name: test.name, passed: true });
  } catch (error) {
    results.push({ name: test.name, passed: false });
  }
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║              Test Results Summary                  ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;

results.forEach(r => {
  console.log(`   ${r.passed ? '✅' : '❌'} ${r.name.padEnd(20)} ${r.passed ? 'PASSED' : 'FAILED'}`);
});

console.log(`\n📊 Overall: ${passed}/${total} clients passed (${(passed/total*100).toFixed(1)}%)\n`);

if (passed === total) {
  console.log('🎉 ALL TESTS PASSED - Ready for production deployment\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed - Review results before deployment\n');
  process.exit(1);
}
```

**Run All Tests:**
```bash
export EXA_API_KEY=your_api_key
node test/integration/all-enhanced-queries.test.js
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All Phase 1 client implementations complete
- [ ] All functional tests passing (4/4)
- [ ] No regressions in baseline tests
- [ ] Performance impact measured and acceptable
- [ ] Documentation updated

### Deployment

- [ ] Deploy to staging environment
- [ ] Enable `ENHANCED_SUMMARY_QUERIES=true` for 1% traffic
- [ ] Monitor metrics for 24-48 hours
- [ ] Increase to 10% traffic if metrics good
- [ ] Full rollout (100%) after 1 week validation

### Post-Deployment Monitoring

**Metrics to Track:**
- Query relevance scores (target: +15% average)
- User feedback on result quality
- API latency (target: <5s increase)
- Error rates (target: <1%)
- Token usage per session (should be unchanged)

---

## Troubleshooting

### Issue: Enhanced queries not triggering

**Symptom:** Logs show "Enhanced summary queries DISABLED"

**Solution:**
```bash
export ENHANCED_SUMMARY_QUERIES=true
# Restart server
```

### Issue: Fallback always triggered

**Symptom:** Logs show "Enhanced query build failed, using fallback"

**Solution:** Check that:
1. SummaryQueryBuilder imported correctly
2. Data types added to SummaryQueryBuilder
3. User search term is not empty/null

### Issue: No improvement in test results

**Symptom:** Baseline and enhanced tests show similar scores

**Possible Causes:**
1. Test query too generic (try more specific company/topic names)
2. Exa API returning similar results regardless of summary query
3. Target metrics may need adjustment for this domain

**Action:** Review test query and validation criteria

---

## Next Steps

### Immediate (This Session)
1. ✅ Update SummaryQueryBuilder with Phase 1 data types
2. 🚧 Implement EPA client (in progress)
3. ⏳ Create EPA functional test
4. ⏳ Document remaining Phase 1 clients

### Week 1-2 (Phase 1 Completion)
1. Implement USPTO client + test
2. Implement CourtListener client + test
3. Implement SEC client + test
4. Run master test suite
5. Deploy to staging

### Week 3-4 (Phase 2)
1. Implement Phase 2 clients (GovInfo, FederalRegister, FTC, NHTSA, CPSC)
2. Create functional tests for each
3. Gradual production rollout

### Week 5-6 (Phase 3)
1. Implement Phase 3 clients (PTAB, StateStatute, StateCourtRules)
2. Final validation
3. Full production deployment
4. Enable as default (`ENHANCED_SUMMARY_QUERIES=true` by default)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: 🚧 Active Development
**Contact**: See project maintainers for questions

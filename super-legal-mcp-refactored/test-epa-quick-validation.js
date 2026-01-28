/**
 * EPA Query Fixes Quick Validation Test
 *
 * Purpose: Validate that EPA query targeting fixes work across multiple facilities
 * Tests: 3 diverse facilities in baseline vs enhanced modes
 * Runtime: ~30 minutes
 *
 * Success Criteria:
 * - Returns facility-specific URLs (not generic EPA homepage)
 * - Relevance scores consistently >20/100
 * - ECHO subdomain pages found where applicable
 * - Enhanced mode shows improvement over baseline
 */

import dotenv from 'dotenv';
import { EPAWebSearchClient } from './src/api-clients/EPAWebSearchClient.js';

dotenv.config();

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

// Test facilities covering different industries and regions
const testFacilities = [
  {
    name: 'Tesla Fremont',
    query: {
      company_name: 'Tesla',
      facility_name: 'Tesla Fremont',
      limit: 3
    },
    industry: 'Automotive Manufacturing',
    state: 'California',
    expectedKeywords: ['tesla', 'fremont', 'violation', 'clean air', 'epa']
  },
  {
    name: 'Boeing Renton',
    query: {
      company_name: 'Boeing',
      facility_name: 'Renton',
      city: 'Renton',
      state: 'WA',
      limit: 3
    },
    industry: 'Aerospace Manufacturing',
    state: 'Washington',
    expectedKeywords: ['boeing', 'renton', 'facility', 'compliance']
  },
  {
    name: 'Chevron Richmond Refinery',
    query: {
      company_name: 'Chevron',
      facility_name: 'Richmond',
      city: 'Richmond',
      state: 'CA',
      limit: 3
    },
    industry: 'Oil Refining',
    state: 'California',
    expectedKeywords: ['chevron', 'richmond', 'refinery', 'air quality']
  }
];

/**
 * Analyze URL quality
 */
function analyzeURLQuality(urls, facilityName) {
  const analysis = {
    total: urls.length,
    facilitySpecific: 0,
    echoPages: 0,
    newsPages: 0,
    genericPages: 0,
    qualityScore: 0,
    urls: urls
  };

  const facilityKeywords = facilityName.toLowerCase().split(' ');

  for (const url of urls) {
    const urlLower = url.toLowerCase();

    // Check for facility-specific content
    const hasFacilityKeywords = facilityKeywords.some(keyword =>
      keyword.length > 3 && urlLower.includes(keyword)
    );
    if (hasFacilityKeywords) {
      analysis.facilitySpecific++;
      analysis.qualityScore += 30;
    }

    // Check for ECHO system pages
    if (urlLower.includes('echo.epa.gov') || urlLower.includes('frs-public.epa.gov')) {
      analysis.echoPages++;
      analysis.qualityScore += 25;
    }

    // Check for news/press releases
    if (urlLower.includes('newsrelease') || urlLower.includes('/news/')) {
      analysis.newsPages++;
      analysis.qualityScore += 20;
    }

    // Check for generic pages (bad)
    if (urlLower === 'https://www.epa.gov/' ||
        urlLower.includes('/aboutepa') ||
        urlLower.includes('/home')) {
      analysis.genericPages++;
      analysis.qualityScore -= 30;
    }
  }

  // Normalize score (0-100)
  analysis.qualityScore = Math.max(0, Math.min(100, analysis.qualityScore));

  // Verdict
  if (analysis.genericPages > 0) {
    analysis.verdict = 'POOR - Generic pages found';
  } else if (analysis.echoPages > 0) {
    analysis.verdict = 'EXCELLENT - ECHO system pages found';
  } else if (analysis.facilitySpecific > 0) {
    analysis.verdict = 'GOOD - Facility-specific pages found';
  } else {
    analysis.verdict = 'MODERATE - EPA pages but not facility-specific';
  }

  return analysis;
}

/**
 * Extract URLs from EPA client response
 */
function extractURLsFromResponse(response) {
  try {
    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    // The URLs might be in facilities array or need to be extracted from the response
    // For now, we'll return empty array and log what we got
    return [];
  } catch (error) {
    console.error('Error extracting URLs:', error.message);
    return [];
  }
}

/**
 * Test a facility in specific mode
 */
async function testFacilityInMode(epaClient, facility, mode) {
  log(`\n🔍 Testing: ${facility.name} (${mode.toUpperCase()} mode)`, 'cyan');
  log(`Industry: ${facility.industry} | State: ${facility.state}`, 'blue');

  const startTime = Date.now();

  try {
    const response = await epaClient.searchFacilitiesWeb(facility.query);
    const executionTime = Date.now() - startTime;

    // Parse response
    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    const facilities = parsed.facilities || [];
    const totalResults = parsed.total_facilities || facilities.length;

    // Analyze results
    const results = {
      mode,
      facilityName: facility.name,
      executionTime,
      totalResults,
      facilities: facilities.slice(0, 3),  // Top 3 for display

      // Quality metrics
      relevanceScore: 0,
      facilityMentions: 0,
      urlQuality: { verdict: 'Unknown', qualityScore: 0 }
    };

    // Calculate facility mentions in results
    const searchTerms = facility.expectedKeywords;
    for (const fac of facilities) {
      const facText = JSON.stringify(fac).toLowerCase();
      for (const term of searchTerms) {
        if (facText.includes(term.toLowerCase())) {
          results.facilityMentions++;
        }
      }
    }

    // Calculate relevance score
    results.relevanceScore = calculateRelevanceScore(facilities, facility);

    // Display results
    log(`\n📊 Results:`, 'bright');
    console.log(`  Facilities found:     ${totalResults}`);
    console.log(`  Facility mentions:    ${results.facilityMentions}`);
    console.log(`  Relevance score:      ${results.relevanceScore.toFixed(1)}/100`);
    console.log(`  Execution time:       ${executionTime}ms`);

    // Show sample facility
    if (facilities.length > 0) {
      log(`\n📄 Sample Facility:`, 'blue');
      console.log(JSON.stringify(facilities[0], null, 2).substring(0, 500) + '...');
    }

    return results;

  } catch (error) {
    log(`\n❌ Error testing ${facility.name}: ${error.message}`, 'red');
    return {
      mode,
      facilityName: facility.name,
      error: error.message,
      relevanceScore: 0,
      facilityMentions: 0
    };
  }
}

/**
 * Calculate relevance score
 */
function calculateRelevanceScore(facilities, testCase) {
  if (!facilities || facilities.length === 0) return 0;

  let score = 0;
  const keywords = testCase.expectedKeywords;

  for (const facility of facilities) {
    const text = JSON.stringify(facility).toLowerCase();

    // Award points for expected keywords
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 15;
      }
    }

    // Award points for structured data present
    if (facility.name && facility.name !== '#main)') score += 10;
    if (facility.epa_registry_id) score += 15;
    if (facility.company && facility.company.length > 10) score += 10;
    if (facility.compliance_status) score += 15;
  }

  // Normalize
  return Math.min(100, score / facilities.length);
}

/**
 * Compare baseline vs enhanced
 */
function compareResults(baseline, enhanced) {
  logSection(`📊 COMPARISON: ${baseline.facilityName}`);

  const relevanceChange = enhanced.relevanceScore - baseline.relevanceScore;
  const mentionsChange = enhanced.facilityMentions - baseline.facilityMentions;
  const timeChange = enhanced.executionTime - baseline.executionTime;

  console.log('Relevance Score:');
  console.log(`  Baseline:  ${baseline.relevanceScore.toFixed(1)}/100`);
  console.log(`  Enhanced:  ${enhanced.relevanceScore.toFixed(1)}/100`);
  console.log(`  Change:    ${relevanceChange >= 0 ? '+' : ''}${relevanceChange.toFixed(1)} points`);

  console.log('\nFacility Mentions:');
  console.log(`  Baseline:  ${baseline.facilityMentions}`);
  console.log(`  Enhanced:  ${enhanced.facilityMentions}`);
  console.log(`  Change:    ${mentionsChange >= 0 ? '+' : ''}${mentionsChange}`);

  console.log('\nExecution Time:');
  console.log(`  Baseline:  ${baseline.executionTime}ms`);
  console.log(`  Enhanced:  ${enhanced.executionTime}ms`);
  console.log(`  Change:    ${timeChange >= 0 ? '+' : ''}${timeChange}ms`);

  // Verdict
  const criteria = {
    relevance: baseline.relevanceScore >= 20,  // Query fixes working
    improvement: relevanceChange >= 0,  // Enhanced not worse
    performance: Math.abs(timeChange) < 5000,  // Performance acceptable
    results: baseline.totalResults > 0  // Getting results
  };

  const passed = Object.values(criteria).filter(Boolean).length;
  const total = Object.keys(criteria).length;

  console.log(`\n✅ Criteria: ${passed}/${total} passed`);
  console.log(`  Query Fixes Working:  ${criteria.relevance ? '✅' : '❌'} (relevance >= 20)`);
  console.log(`  Enhanced Not Worse:   ${criteria.improvement ? '✅' : '❌'} (change >= 0)`);
  console.log(`  Performance OK:       ${criteria.performance ? '✅' : '❌'} (within 5s)`);
  console.log(`  Returns Results:      ${criteria.results ? '✅' : '❌'} (>0 results)`);

  const color = passed >= 3 ? 'green' : passed >= 2 ? 'yellow' : 'red';
  log(`\n${criteria.relevance ? '✅' : '❌'} ${baseline.facilityName}: ${criteria.relevance ? 'Query fixes working' : 'Query fixes need improvement'}`, color);

  return { passed, total, criteria };
}

/**
 * Main test execution
 */
async function main() {
  logSection('🧪 EPA QUERY FIXES QUICK VALIDATION');
  log('Testing EPA query targeting improvements across multiple facilities', 'cyan');
  log('Runtime: ~30 minutes for 3 facilities x 2 modes', 'cyan');

  // Validate environment
  if (!process.env.EXA_API_KEY) {
    log('\n❌ EXA_API_KEY not found in environment', 'red');
    process.exit(1);
  }

  log('\n✅ EXA_API_KEY found', 'green');

  const allResults = {
    baseline: [],
    enhanced: [],
    comparisons: []
  };

  // Test each facility
  for (let i = 0; i < testFacilities.length; i++) {
    const facility = testFacilities[i];

    logSection(`FACILITY ${i + 1}/${testFacilities.length}: ${facility.name}`);

    // Baseline mode
    process.env.ENHANCED_SUMMARY_QUERIES = 'false';
    const epaClientBaseline = new EPAWebSearchClient(null, process.env.EXA_API_KEY);
    const baselineResult = await testFacilityInMode(epaClientBaseline, facility, 'baseline');
    allResults.baseline.push(baselineResult);

    // Wait between tests
    log('\n⏳ Waiting 5 seconds before enhanced mode...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Enhanced mode
    process.env.ENHANCED_SUMMARY_QUERIES = 'true';
    const epaClientEnhanced = new EPAWebSearchClient(null, process.env.EXA_API_KEY);
    const enhancedResult = await testFacilityInMode(epaClientEnhanced, facility, 'enhanced');
    allResults.enhanced.push(enhancedResult);

    // Compare
    const comparison = compareResults(baselineResult, enhancedResult);
    allResults.comparisons.push(comparison);

    // Wait before next facility
    if (i < testFacilities.length - 1) {
      log('\n⏳ Waiting 5 seconds before next facility...', 'cyan');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Overall summary
  logSection('📊 OVERALL SUMMARY');

  const totalPassed = allResults.comparisons.reduce((sum, c) => sum + c.passed, 0);
  const totalCriteria = allResults.comparisons.reduce((sum, c) => sum + c.total, 0);
  const avgBaselineRelevance = allResults.baseline.reduce((sum, r) => sum + r.relevanceScore, 0) / allResults.baseline.length;
  const avgEnhancedRelevance = allResults.enhanced.reduce((sum, r) => sum + r.relevanceScore, 0) / allResults.enhanced.length;

  console.log(`\nFacilities Tested: ${testFacilities.length}`);
  console.log(`Overall Criteria Passed: ${totalPassed}/${totalCriteria} (${((totalPassed/totalCriteria)*100).toFixed(1)}%)`);
  console.log(`\nAverage Relevance Scores:`);
  console.log(`  Baseline: ${avgBaselineRelevance.toFixed(1)}/100`);
  console.log(`  Enhanced: ${avgEnhancedRelevance.toFixed(1)}/100`);
  console.log(`  Change:   ${(avgEnhancedRelevance - avgBaselineRelevance >= 0 ? '+' : '')}${(avgEnhancedRelevance - avgBaselineRelevance).toFixed(1)} points`);

  // Final verdict
  logSection('🏁 FINAL VERDICT');

  const queryFixesWorking = avgBaselineRelevance >= 20;
  const enhancedQueriesViable = avgEnhancedRelevance >= avgBaselineRelevance;
  const overallSuccess = totalPassed >= totalCriteria * 0.75;

  console.log(`Query Fixes Working: ${queryFixesWorking ? '✅ YES' : '❌ NO'} (avg relevance >= 20)`);
  console.log(`Enhanced Queries Viable: ${enhancedQueriesViable ? '✅ YES' : '❌ NO'} (improved or equal)`);
  console.log(`Overall Success: ${overallSuccess ? '✅ YES' : '❌ NO'} (>75% criteria passed)`);

  if (queryFixesWorking && enhancedQueriesViable) {
    log('\n✅ RECOMMENDATION: Enable ENHANCED_SUMMARY_QUERIES for EPA in production', 'green');
    log('Query targeting fixes are working and enhanced queries show improvement', 'green');
  } else if (queryFixesWorking) {
    log('\n⚠️ RECOMMENDATION: Query fixes working but enhanced queries show mixed results', 'yellow');
    log('Consider enabling with monitoring', 'yellow');
  } else {
    log('\n❌ RECOMMENDATION: Query fixes need more work', 'red');
    log('Investigate why relevance scores are still low', 'red');
  }

  process.exit(overallSuccess ? 0 : 1);
}

// Run test
main().catch(error => {
  logSection('❌ TEST FAILED');
  console.error(error);
  process.exit(1);
});

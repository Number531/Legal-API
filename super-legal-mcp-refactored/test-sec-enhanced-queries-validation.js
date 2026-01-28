/**
 * SEC Enhanced Queries - Comprehensive Validation Test
 *
 * Purpose: Validate that SEC enhanced queries improve relevance scores
 * Pattern: Based on test-epa-quick-validation.js (validated EPA pattern)
 * Tests: 3 diverse companies across 3 sectors (Automotive, Financial, Energy)
 * Runtime: ~20-30 minutes
 *
 * Success Criteria:
 * - Returns filing-specific data (not generic SEC homepage)
 * - Relevance scores consistently ≥40/100
 * - Enhanced mode shows ≥+20% improvement over baseline
 * - All accession numbers, form types, and dates present
 */

import dotenv from 'dotenv';
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';

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

// Test companies covering diverse sectors
const testCompanies = [
  {
    name: 'Tesla, Inc.',
    query: {
      company_identifier: 'Tesla',
      filing_type: '10-K',
      limit: 3
    },
    industry: 'Automotive Manufacturing',
    expectedKeywords: ['tesla', '10-k', 'annual', 'financial', 'edgar'],
    expectedCIK: '0001318605',
    expectedAccessionPattern: /\d{10}-\d{2}-\d{6}/
  },
  {
    name: 'JPMorgan Chase & Co.',
    query: {
      company_identifier: 'JPMorgan Chase',
      filing_type: '10-Q',
      limit: 3
    },
    industry: 'Financial Services',
    expectedKeywords: ['jpmorgan', 'chase', '10-q', 'quarterly', 'financial'],
    expectedCIK: '0000019617',
    expectedAccessionPattern: /\d{10}-\d{2}-\d{6}/
  },
  {
    name: 'Exxon Mobil Corporation',
    query: {
      company_identifier: 'Exxon',
      filing_type: '8-K',
      limit: 3
    },
    industry: 'Energy/Oil & Gas',
    expectedKeywords: ['exxon', '8-k', 'current', 'report', 'filing'],
    expectedCIK: '0000034088',
    expectedAccessionPattern: /\d{10}-\d{2}-\d{6}/
  }
];

/**
 * Calculate relevance score based on SEC filing data quality
 */
function calculateRelevanceScore(filings, testCase) {
  if (!filings || filings.length === 0) return 0;

  let score = 0;
  const keywords = testCase.expectedKeywords;

  for (const filing of filings) {
    const text = JSON.stringify(filing).toLowerCase();

    // Award points for expected keywords (15 pts each, max 5 keywords = 75pts)
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 15;
      }
    }

    // Award points for structured data present (critical SEC metadata)
    if (filing.accessionNumber && testCase.expectedAccessionPattern.test(filing.accessionNumber)) {
      score += 15; // Valid accession number format
    }
    if (filing.form && filing.form.length > 0) {
      score += 15; // Form type present
    }
    if (filing.filingDate && /\d{4}-\d{2}-\d{2}/.test(filing.filingDate)) {
      score += 15; // Valid filing date format
    }
    if (filing.edgar_url && filing.edgar_url.includes('sec.gov')) {
      score += 10; // Valid EDGAR URL
    }
    if (filing.cik && filing.cik.length === 10) {
      score += 10; // Valid CIK format (10 digits)
    }
  }

  // Normalize (0-100 scale)
  return Math.min(100, score / filings.length);
}

/**
 * Test a company in specific mode
 */
async function testCompanyInMode(secClient, company, mode) {
  log(`\n🔍 Testing: ${company.name} (${mode.toUpperCase()} mode)`, 'cyan');
  log(`Industry: ${company.industry} | Filing Type: ${company.query.filing_type}`, 'blue');

  const startTime = Date.now();

  try {
    const response = await secClient.searchSECFilingsWeb(company.query);
    const executionTime = Date.now() - startTime;

    // Parse response
    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    const filings = parsed.filings || [];
    const totalResults = filings.length;

    // Analyze results
    const results = {
      mode,
      companyName: company.name,
      executionTime,
      totalResults,
      filings: filings.slice(0, 3),  // Top 3 for display

      // Quality metrics
      relevanceScore: 0,
      keywordMentions: 0,
      accessionNumbers: 0,
      formTypes: 0,
      filingDates: 0,
      edgarUrls: 0
    };

    // Calculate keyword mentions in results
    const searchTerms = company.expectedKeywords;
    for (const filing of filings) {
      const filingText = JSON.stringify(filing).toLowerCase();
      for (const term of searchTerms) {
        if (filingText.includes(term.toLowerCase())) {
          results.keywordMentions++;
        }
      }

      // Count structured data fields
      if (filing.accessionNumber && company.expectedAccessionPattern.test(filing.accessionNumber)) {
        results.accessionNumbers++;
      }
      if (filing.form) results.formTypes++;
      if (filing.filingDate) results.filingDates++;
      if (filing.edgar_url && filing.edgar_url.includes('sec.gov')) results.edgarUrls++;
    }

    // Calculate relevance score
    results.relevanceScore = calculateRelevanceScore(filings, company);

    // Display results
    log(`\n📊 Results:`, 'bright');
    console.log(`  Filings found:        ${totalResults}`);
    console.log(`  Keyword mentions:     ${results.keywordMentions}`);
    console.log(`  Accession numbers:    ${results.accessionNumbers}/${totalResults}`);
    console.log(`  Form types:           ${results.formTypes}/${totalResults}`);
    console.log(`  Filing dates:         ${results.filingDates}/${totalResults}`);
    console.log(`  EDGAR URLs:           ${results.edgarUrls}/${totalResults}`);
    console.log(`  Relevance score:      ${results.relevanceScore.toFixed(1)}/100`);
    console.log(`  Execution time:       ${executionTime}ms`);

    // Show sample filing
    if (filings.length > 0) {
      log(`\n📄 Sample Filing:`, 'blue');
      const sample = filings[0];
      console.log(`  Company:         ${parsed.company?.name || 'N/A'}`);
      console.log(`  Form:            ${sample.form || 'N/A'}`);
      console.log(`  Accession:       ${sample.accessionNumber || 'N/A'}`);
      console.log(`  Filing Date:     ${sample.filingDate || 'N/A'}`);
      console.log(`  EDGAR URL:       ${sample.edgar_url ? sample.edgar_url.substring(0, 80) + '...' : 'N/A'}`);
    }

    return results;

  } catch (error) {
    log(`\n❌ Error testing ${company.name}: ${error.message}`, 'red');
    return {
      mode,
      companyName: company.name,
      error: error.message,
      relevanceScore: 0,
      keywordMentions: 0
    };
  }
}

/**
 * Compare baseline vs enhanced
 */
function compareResults(baseline, enhanced) {
  logSection(`📊 COMPARISON: ${baseline.companyName}`);

  const relevanceChange = enhanced.relevanceScore - baseline.relevanceScore;
  const mentionsChange = enhanced.keywordMentions - baseline.keywordMentions;
  const timeChange = enhanced.executionTime - baseline.executionTime;

  console.log('Relevance Score:');
  console.log(`  Baseline:  ${baseline.relevanceScore.toFixed(1)}/100`);
  console.log(`  Enhanced:  ${enhanced.relevanceScore.toFixed(1)}/100`);
  console.log(`  Change:    ${relevanceChange >= 0 ? '+' : ''}${relevanceChange.toFixed(1)} points (${relevanceChange >= 0 ? '+' : ''}${((relevanceChange / baseline.relevanceScore) * 100).toFixed(1)}%)`);

  console.log('\nKeyword Mentions:');
  console.log(`  Baseline:  ${baseline.keywordMentions}`);
  console.log(`  Enhanced:  ${enhanced.keywordMentions}`);
  console.log(`  Change:    ${mentionsChange >= 0 ? '+' : ''}${mentionsChange}`);

  console.log('\nExecution Time:');
  console.log(`  Baseline:  ${baseline.executionTime}ms`);
  console.log(`  Enhanced:  ${enhanced.executionTime}ms`);
  console.log(`  Change:    ${timeChange >= 0 ? '+' : ''}${timeChange}ms`);

  // Verdict
  const criteria = {
    relevance: baseline.relevanceScore >= 40,  // Minimum threshold
    improvement: relevanceChange >= 0,  // Enhanced not worse
    significantImprovement: relevanceChange >= (baseline.relevanceScore * 0.2),  // +20% or better
    performance: Math.abs(timeChange) < 10000,  // Performance acceptable (<10s difference)
    results: baseline.totalResults > 0  // Getting results
  };

  const passed = Object.values(criteria).filter(Boolean).length;
  const total = Object.keys(criteria).length;

  console.log(`\n✅ Criteria: ${passed}/${total} passed`);
  console.log(`  Minimum Relevance (≥40):  ${criteria.relevance ? '✅' : '❌'} (${baseline.relevanceScore.toFixed(1)})`);
  console.log(`  Enhanced Not Worse:       ${criteria.improvement ? '✅' : '❌'} (${relevanceChange >= 0 ? '+' : ''}${relevanceChange.toFixed(1)})`);
  console.log(`  Significant Improvement:  ${criteria.significantImprovement ? '✅' : '❌'} (≥+20% target)`);
  console.log(`  Performance OK:           ${criteria.performance ? '✅' : '❌'} (within 10s)`);
  console.log(`  Returns Results:          ${criteria.results ? '✅' : '❌'} (>0 results)`);

  const color = passed >= 4 ? 'green' : passed >= 3 ? 'yellow' : 'red';
  log(`\n${criteria.relevance ? '✅' : '❌'} ${baseline.companyName}: ${criteria.relevance ? 'Enhanced queries working' : 'Needs improvement'}`, color);

  return { passed, total, criteria, relevanceChange };
}

/**
 * Main test execution
 */
async function main() {
  logSection('🧪 SEC ENHANCED QUERIES VALIDATION');
  log('Testing SEC query improvements across multiple companies and sectors', 'cyan');
  log('Runtime: ~20-30 minutes for 3 companies x 2 modes', 'cyan');

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

  // Test each company
  for (let i = 0; i < testCompanies.length; i++) {
    const company = testCompanies[i];

    logSection(`COMPANY ${i + 1}/${testCompanies.length}: ${company.name}`);

    // Baseline mode
    log('\n📝 Running BASELINE test (ENHANCED_SUMMARY_QUERIES=false)...', 'cyan');
    process.env.ENHANCED_SUMMARY_QUERIES = 'false';
    const secClientBaseline = new SECWebSearchClient(null);
    const baselineResult = await testCompanyInMode(secClientBaseline, company, 'baseline');
    allResults.baseline.push(baselineResult);

    // Wait between tests
    log('\n⏳ Waiting 5 seconds before enhanced mode...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Enhanced mode
    log('\n✨ Running ENHANCED test (ENHANCED_SUMMARY_QUERIES=true)...', 'cyan');
    process.env.ENHANCED_SUMMARY_QUERIES = 'true';
    const secClientEnhanced = new SECWebSearchClient(null);
    const enhancedResult = await testCompanyInMode(secClientEnhanced, company, 'enhanced');
    allResults.enhanced.push(enhancedResult);

    // Compare
    const comparison = compareResults(baselineResult, enhancedResult);
    allResults.comparisons.push(comparison);

    // Wait before next company
    if (i < testCompanies.length - 1) {
      log('\n⏳ Waiting 5 seconds before next company...', 'cyan');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Overall summary
  logSection('📊 OVERALL SUMMARY');

  const totalPassed = allResults.comparisons.reduce((sum, c) => sum + c.passed, 0);
  const totalCriteria = allResults.comparisons.reduce((sum, c) => sum + c.total, 0);
  const avgBaselineRelevance = allResults.baseline.reduce((sum, r) => sum + r.relevanceScore, 0) / allResults.baseline.length;
  const avgEnhancedRelevance = allResults.enhanced.reduce((sum, r) => sum + r.relevanceScore, 0) / allResults.enhanced.length;
  const avgImprovement = allResults.comparisons.reduce((sum, c) => sum + c.relevanceChange, 0) / allResults.comparisons.length;

  console.log(`\nCompanies Tested: ${testCompanies.length}`);
  console.log(`Overall Criteria Passed: ${totalPassed}/${totalCriteria} (${((totalPassed / totalCriteria) * 100).toFixed(1)}%)`);
  console.log(`\nAverage Relevance Scores:`);
  console.log(`  Baseline: ${avgBaselineRelevance.toFixed(1)}/100`);
  console.log(`  Enhanced: ${avgEnhancedRelevance.toFixed(1)}/100`);
  console.log(`  Change:   ${(avgEnhancedRelevance - avgBaselineRelevance >= 0 ? '+' : '')}${(avgEnhancedRelevance - avgBaselineRelevance).toFixed(1)} points (${(avgEnhancedRelevance - avgBaselineRelevance >= 0 ? '+' : '')}${((avgEnhancedRelevance - avgBaselineRelevance) / avgBaselineRelevance * 100).toFixed(1)}%)`);

  // Per-company breakdown
  console.log(`\nPer-Company Results:`);
  for (let i = 0; i < testCompanies.length; i++) {
    const company = testCompanies[i];
    const baseline = allResults.baseline[i];
    const enhanced = allResults.enhanced[i];
    const change = enhanced.relevanceScore - baseline.relevanceScore;
    const pct = ((change / baseline.relevanceScore) * 100).toFixed(1);
    console.log(`  ${company.name}: ${baseline.relevanceScore.toFixed(1)} → ${enhanced.relevanceScore.toFixed(1)} (${change >= 0 ? '+' : ''}${change.toFixed(1)} points, ${change >= 0 ? '+' : ''}${pct}%)`);
  }

  // Final verdict
  logSection('🏁 FINAL VERDICT');

  const enhancedQueriesWorking = avgBaselineRelevance >= 40;
  const enhancedQueriesViable = avgEnhancedRelevance >= avgBaselineRelevance;
  const significantImprovement = avgImprovement >= (avgBaselineRelevance * 0.2);
  const overallSuccess = totalPassed >= totalCriteria * 0.75;

  console.log(`Enhanced Queries Working: ${enhancedQueriesWorking ? '✅ YES' : '❌ NO'} (avg baseline ≥ 40)`);
  console.log(`Enhanced Queries Viable: ${enhancedQueriesViable ? '✅ YES' : '❌ NO'} (improved or equal)`);
  console.log(`Significant Improvement: ${significantImprovement ? '✅ YES' : '❌ NO'} (≥+20% average)`);
  console.log(`Overall Success: ${overallSuccess ? '✅ YES' : '❌ NO'} (>75% criteria passed)`);

  if (enhancedQueriesWorking && enhancedQueriesViable && significantImprovement) {
    log('\n✅ RECOMMENDATION: Enable ENHANCED_SUMMARY_QUERIES for SEC in production', 'green');
    log('Enhanced queries show measurable improvement and maintain data quality', 'green');
    process.exit(0);
  } else if (enhancedQueriesWorking && enhancedQueriesViable) {
    log('\n⚠️  RECOMMENDATION: Enhanced queries working but improvement is modest', 'yellow');
    log('Consider enabling with monitoring', 'yellow');
    process.exit(0);
  } else {
    log('\n❌ RECOMMENDATION: Enhanced queries need more work', 'red');
    log('Investigate why relevance scores are not improving', 'red');
    process.exit(1);
  }
}

// Run test
main().catch(error => {
  logSection('❌ TEST FAILED');
  console.error(error);
  process.exit(1);
});

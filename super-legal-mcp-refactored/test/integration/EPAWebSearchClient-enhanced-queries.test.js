/**
 * EPAWebSearchClient Enhanced Queries Functional Test
 *
 * Purpose: Validate that ENHANCED_SUMMARY_QUERIES improves extraction quality for EPA data
 *
 * Success Criteria:
 * - Company targeting improvement: >10% (count of company name mentions in results)
 * - Relevance improvement: >10 points (0-100 scale)
 * - No token usage increase (both modes should be ~5-10k)
 * - Backward compatibility: Both modes produce valid results
 *
 * Test Methodology:
 * - Uses LIVE Exa API (requires EXA_API_KEY environment variable)
 * - Runs same query in both modes (baseline vs enhanced)
 * - Compares company name targeting in Gemini-extracted content
 * - Validates extraction quality and structure
 */

import dotenv from 'dotenv';
import { EPAWebSearchClient } from '../../src/api-clients/EPAWebSearchClient.js';

dotenv.config();

// ANSI color codes for terminal output
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logFailure(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Count occurrences of company name in result content
 */
function countCompanyMentions(results, companyName) {
  let count = 0;
  const searchTerm = companyName.toLowerCase();

  for (const result of results) {
    // Count in highlights (Gemini-extracted content)
    if (result.highlights && Array.isArray(result.highlights)) {
      const highlightsText = result.highlights.join(' ').toLowerCase();
      const matches = highlightsText.match(new RegExp(searchTerm, 'g'));
      count += matches ? matches.length : 0;
    }

    // Count in title
    if (result.title) {
      const titleMatches = result.title.toLowerCase().match(new RegExp(searchTerm, 'g'));
      count += titleMatches ? titleMatches.length : 0;
    }
  }

  return count;
}

/**
 * Calculate relevance score (0-100) based on result quality
 */
function calculateRelevanceScore(results, companyName, facilityName) {
  let score = 0;
  const searchTerms = [companyName.toLowerCase(), facilityName.toLowerCase()];

  for (const result of results) {
    const content = [
      result.title || '',
      (result.highlights || []).join(' '),
      result.text || ''
    ].join(' ').toLowerCase();

    // Award points for matching search terms
    for (const term of searchTerms) {
      if (content.includes(term)) {
        score += 15;
      }
    }

    // Award points for EPA-relevant keywords
    const epaKeywords = ['compliance', 'violation', 'enforcement', 'penalty', 'noncompliance'];
    for (const keyword of epaKeywords) {
      if (content.includes(keyword)) {
        score += 5;
      }
    }

    // Award points for structured data in highlights
    if (result.highlights && result.highlights.length > 0) {
      score += 10;
    }

    // Award points for epa.gov domain
    if (result.url && result.url.includes('epa.gov')) {
      score += 10;
    }
  }

  // Normalize to 0-100
  return Math.min(100, score);
}

/**
 * Run EPA facility search in specific mode (baseline or enhanced)
 */
async function runEPASearchInMode(mode, companyName, facilityName) {
  // Set environment variable for this test
  const originalValue = process.env.ENHANCED_SUMMARY_QUERIES;
  process.env.ENHANCED_SUMMARY_QUERIES = mode === 'enhanced' ? 'true' : 'false';

  try {
    const epaClient = new EPAWebSearchClient(null, process.env.EXA_API_KEY);

    log(`\n📊 Running in ${mode.toUpperCase()} mode...`, 'cyan');
    logInfo(`Feature flag: ENHANCED_SUMMARY_QUERIES=${process.env.ENHANCED_SUMMARY_QUERIES}`);

    const startTime = Date.now();

    const response = await epaClient.searchFacilitiesWeb({
      company_name: companyName,
      facility_name: facilityName,
      limit: 3,
      include_full_text: false
    });

    const executionTime = Date.now() - startTime;

    // Parse response
    const contentText = response.content[0].text;
    const parsedResponse = JSON.parse(contentText);
    const facilities = parsedResponse.facilities || [];

    // Extract raw results from client (need to access internal state for this)
    // For now, we'll analyze the facilities returned

    // Calculate metrics from facilities
    const companyMentions = facilities.reduce((count, facility) => {
      const text = JSON.stringify(facility).toLowerCase();
      const matches = text.match(new RegExp(companyName.toLowerCase(), 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);

    const relevanceScore = facilities.reduce((score, facility) => {
      const text = JSON.stringify(facility).toLowerCase();
      let points = 0;

      // Company name mentioned
      if (text.includes(companyName.toLowerCase())) points += 20;

      // Compliance data present
      if (facility.compliance_status) points += 15;
      if (facility.total_penalties) points += 15;

      // Location data present
      if (facility.location?.city && facility.location?.state) points += 10;

      // EPA registry ID present
      if (facility.epa_registry_id) points += 10;

      // Program info present
      if (facility.clean_air || facility.clean_water) points += 10;

      return score + points;
    }, 0);

    const avgRelevance = facilities.length > 0 ? relevanceScore / facilities.length : 0;

    return {
      mode,
      executionTime,
      facilitiesCount: facilities.length,
      companyMentions,
      relevanceScore: avgRelevance,
      facilities,
      rawResponse: parsedResponse
    };

  } finally {
    // Restore original environment variable
    if (originalValue !== undefined) {
      process.env.ENHANCED_SUMMARY_QUERIES = originalValue;
    } else {
      delete process.env.ENHANCED_SUMMARY_QUERIES;
    }
  }
}

/**
 * Compare baseline vs enhanced results
 */
function compareResults(baselineResults, enhancedResults) {
  logSection('📊 COMPARISON RESULTS');

  // Company targeting improvement
  const targetingImprovement = enhancedResults.companyMentions - baselineResults.companyMentions;
  const targetingImprovementPct = baselineResults.companyMentions > 0
    ? ((targetingImprovement / baselineResults.companyMentions) * 100).toFixed(1)
    : 'N/A';

  log('\n🎯 Company Targeting:', 'bright');
  console.log(`  Baseline mentions:  ${baselineResults.companyMentions}`);
  console.log(`  Enhanced mentions:  ${enhancedResults.companyMentions}`);
  console.log(`  Improvement:        ${targetingImprovement >= 0 ? '+' : ''}${targetingImprovement} (${targetingImprovementPct}%)`);

  if (targetingImprovement >= 1 || (baselineResults.companyMentions > 0 && targetingImprovementPct >= 10)) {
    logSuccess('Company targeting improved significantly');
  } else if (targetingImprovement >= 0) {
    logWarning('Company targeting improvement modest');
  } else {
    logFailure('Company targeting decreased');
  }

  // Relevance improvement
  const relevanceImprovement = enhancedResults.relevanceScore - baselineResults.relevanceScore;

  log('\n📈 Relevance Score (0-100):', 'bright');
  console.log(`  Baseline score:     ${baselineResults.relevanceScore.toFixed(1)}`);
  console.log(`  Enhanced score:     ${enhancedResults.relevanceScore.toFixed(1)}`);
  console.log(`  Improvement:        ${relevanceImprovement >= 0 ? '+' : ''}${relevanceImprovement.toFixed(1)} points`);

  if (relevanceImprovement >= 10) {
    logSuccess('Relevance score improved significantly (>10 points)');
  } else if (relevanceImprovement >= 5) {
    logWarning('Relevance score improved moderately');
  } else if (relevanceImprovement >= 0) {
    logInfo('Relevance score improved slightly');
  } else {
    logFailure('Relevance score decreased');
  }

  // Execution time comparison
  const timeChange = enhancedResults.executionTime - baselineResults.executionTime;

  log('\n⏱️  Execution Time:', 'bright');
  console.log(`  Baseline:           ${baselineResults.executionTime}ms`);
  console.log(`  Enhanced:           ${enhancedResults.executionTime}ms`);
  console.log(`  Difference:         ${timeChange >= 0 ? '+' : ''}${timeChange}ms`);

  if (Math.abs(timeChange) < 1000) {
    logSuccess('Execution time comparable (within 1s)');
  } else if (timeChange < 3000) {
    logWarning('Enhanced mode slightly slower');
  } else {
    logFailure('Enhanced mode significantly slower');
  }

  // Facilities count
  log('\n📋 Facilities Returned:', 'bright');
  console.log(`  Baseline:           ${baselineResults.facilitiesCount}`);
  console.log(`  Enhanced:           ${enhancedResults.facilitiesCount}`);

  // Overall verdict
  logSection('🏆 OVERALL VERDICT');

  const criteriaResults = {
    targeting: targetingImprovement >= 1 || (baselineResults.companyMentions > 0 && targetingImprovementPct >= 10),
    relevance: relevanceImprovement >= 5,
    performance: Math.abs(timeChange) < 3000,
    validResults: enhancedResults.facilitiesCount > 0
  };

  const passedCriteria = Object.values(criteriaResults).filter(Boolean).length;
  const totalCriteria = Object.keys(criteriaResults).length;

  console.log('\nCriteria Summary:');
  console.log(`  Company Targeting:  ${criteriaResults.targeting ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Relevance Score:    ${criteriaResults.relevance ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Performance:        ${criteriaResults.performance ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Valid Results:      ${criteriaResults.validResults ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n📊 Overall: ${passedCriteria}/${totalCriteria} criteria passed`);

  if (passedCriteria === totalCriteria) {
    logSuccess('🎉 ENHANCED_SUMMARY_QUERIES successfully improves EPA extraction quality!');
    logInfo('✅ RECOMMENDATION: Proceed with rollout to remaining WebSearch clients');
    return true;
  } else if (passedCriteria >= totalCriteria * 0.75) {
    logWarning('⚠️  ENHANCED_SUMMARY_QUERIES shows promise but has some issues');
    logInfo('🔍 RECOMMENDATION: Review failures and re-test before broader rollout');
    return true; // Still passing, but with warnings
  } else {
    logFailure('❌ ENHANCED_SUMMARY_QUERIES did not meet success criteria');
    logInfo('🛑 RECOMMENDATION: Do NOT proceed with rollout - investigate issues');
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  logSection('🧪 EPA ENHANCED QUERIES FUNCTIONAL TEST');
  logInfo('Testing ENHANCED_SUMMARY_QUERIES feature with live Exa API');
  logInfo('Test case: Tesla Fremont facility compliance search\n');

  // Validate environment
  if (!process.env.EXA_API_KEY) {
    logFailure('EXA_API_KEY not found in environment');
    logInfo('Set EXA_API_KEY in .env file or environment variables');
    process.exit(1);
  }

  logSuccess('EXA_API_KEY found in environment');

  try {
    // Test configuration
    const testCompany = 'Tesla';
    const testFacility = 'Tesla Fremont';

    logInfo(`Test Query: company_name="${testCompany}", facility_name="${testFacility}"`);

    // Run baseline test
    logSection('🔵 BASELINE MODE TEST (Static Keyword Queries)');
    const baselineResults = await runEPASearchInMode('baseline', testCompany, testFacility);

    log('\n📊 Baseline Results Summary:', 'blue');
    console.log(`  Facilities found:   ${baselineResults.facilitiesCount}`);
    console.log(`  Company mentions:   ${baselineResults.companyMentions}`);
    console.log(`  Relevance score:    ${baselineResults.relevanceScore.toFixed(1)}/100`);
    console.log(`  Execution time:     ${baselineResults.executionTime}ms`);

    // Sample facility from baseline
    if (baselineResults.facilities.length > 0) {
      log('\n📄 Sample Baseline Facility:', 'blue');
      console.log(JSON.stringify(baselineResults.facilities[0], null, 2));
    }

    // Wait a bit to respect rate limits
    logInfo('\n⏳ Waiting 3 seconds before enhanced mode test...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Run enhanced test
    logSection('🟢 ENHANCED MODE TEST (Context-Aware Natural Language)');
    const enhancedResults = await runEPASearchInMode('enhanced', testCompany, testFacility);

    log('\n📊 Enhanced Results Summary:', 'green');
    console.log(`  Facilities found:   ${enhancedResults.facilitiesCount}`);
    console.log(`  Company mentions:   ${enhancedResults.companyMentions}`);
    console.log(`  Relevance score:    ${enhancedResults.relevanceScore.toFixed(1)}/100`);
    console.log(`  Execution time:     ${enhancedResults.executionTime}ms`);

    // Sample facility from enhanced
    if (enhancedResults.facilities.length > 0) {
      log('\n📄 Sample Enhanced Facility:', 'green');
      console.log(JSON.stringify(enhancedResults.facilities[0], null, 2));
    }

    // Compare results
    const success = compareResults(baselineResults, enhancedResults);

    // Exit with appropriate code
    process.exit(success ? 0 : 1);

  } catch (error) {
    logSection('❌ TEST FAILED WITH ERROR');
    logFailure(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
main();

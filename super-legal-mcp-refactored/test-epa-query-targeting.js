/**
 * EPA Query Targeting Investigation Script
 *
 * Purpose: Test different query patterns to find which one returns
 * facility-specific EPA data instead of generic EPA pages.
 *
 * Test Case: Tesla Fremont facility compliance data
 *
 * Query Patterns to Test:
 * 1. Current (baseline) - Restricted to www.epa.gov
 * 2. Expanded domains - Include echo.epa.gov
 * 3. Wildcard domain - All epa.gov subdomains
 * 4. EPA-specific terms - ECHO, FRS, etc.
 * 5. Data system focus - Target echo.epa.gov, enviro.epa.gov
 */

import dotenv from 'dotenv';

dotenv.config();

// ANSI color codes
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

/**
 * Query patterns to test
 */
const queryPatterns = [
  {
    name: 'Current (Baseline)',
    description: 'Restricted to www.epa.gov only',
    query: 'site:www.epa.gov "Tesla" "Fremont" facility compliance environmental',
    expectedIssue: 'Too restrictive - facility data may be on echo.epa.gov'
  },
  {
    name: 'Expanded Domains',
    description: 'Include echo.epa.gov alongside www.epa.gov',
    query: '(site:www.epa.gov OR site:echo.epa.gov) "Tesla" "Fremont" facility',
    expectedBenefit: 'Access to ECHO database pages'
  },
  {
    name: 'Wildcard Domain',
    description: 'All epa.gov subdomains',
    query: 'site:epa.gov "Tesla" "Fremont" facility compliance',
    expectedBenefit: 'Catches all EPA subdomains (www, echo, enviro, etc.)'
  },
  {
    name: 'EPA-Specific Terms',
    description: 'Focus on EPA data system terminology',
    query: 'site:epa.gov "Tesla" "Fremont" (ECHO OR "Enforcement and Compliance History" OR FRS OR "Facility Registry")',
    expectedBenefit: 'Targets specific EPA databases by name'
  },
  {
    name: 'Data Systems Focus',
    description: 'Target data-specific EPA subdomains',
    query: '(site:echo.epa.gov OR site:enviro.epa.gov OR site:www.epa.gov/echo) "Tesla" "Fremont"',
    expectedBenefit: 'Direct targeting of ECHO and Envirofacts systems'
  },
  {
    name: 'Registry ID Approach',
    description: 'If we know the facility registry ID',
    query: 'site:epa.gov (Tesla Fremont OR "110000438113") facility registry',
    expectedBenefit: 'Direct facility lookup by ID (if available)',
    note: 'Example FRS ID - actual Tesla ID may differ'
  }
];

/**
 * Analyze result quality for facility-specific content
 */
function analyzeResultQuality(results, queryName) {
  const analysis = {
    queryName: queryName,
    totalResults: results.length,
    facilitySpecificCount: 0,
    genericEPACount: 0,
    echoSystemCount: 0,
    teslaFreemontMentions: 0,
    complianceDataCount: 0,
    urls: [],
    topResult: null,
    qualityScore: 0
  };

  for (const result of results) {
    const url = result.url || '';
    const title = (result.title || '').toLowerCase();
    const text = (result.text || '').toLowerCase();
    const combined = (url + ' ' + title + ' ' + text).toLowerCase();

    analysis.urls.push(url);

    // Count Tesla + Fremont mentions
    const teslaMatches = (combined.match(/tesla/gi) || []).length;
    const fremontMatches = (combined.match(/fremont/gi) || []).length;
    analysis.teslaFreemontMentions += Math.min(teslaMatches, fremontMatches);

    // Detect ECHO system pages
    if (url.includes('echo.epa.gov') || url.includes('/echo/') || combined.includes('enforcement and compliance')) {
      analysis.echoSystemCount++;
      analysis.qualityScore += 30;
    }

    // Detect facility-specific pages
    if ((teslaMatches > 0 && fremontMatches > 0) || combined.includes('tesla fremont')) {
      analysis.facilitySpecificCount++;
      analysis.qualityScore += 25;
    }

    // Detect compliance data indicators
    const complianceIndicators = ['violation', 'penalty', 'enforcement', 'compliance', 'inspection', 'noncompliance'];
    const hasComplianceData = complianceIndicators.some(indicator => combined.includes(indicator));
    if (hasComplianceData) {
      analysis.complianceDataCount++;
      analysis.qualityScore += 15;
    }

    // Detect generic EPA pages (low quality)
    const genericIndicators = ['epa.gov/aboutepa', 'epa.gov/home', 'epa.gov/environmental', 'about epa'];
    const isGeneric = genericIndicators.some(indicator => url.includes(indicator) || combined.includes(indicator));
    if (isGeneric) {
      analysis.genericEPACount++;
      analysis.qualityScore -= 20;
    }
  }

  // Store top result for detailed analysis
  if (results.length > 0) {
    analysis.topResult = {
      title: results[0].title,
      url: results[0].url,
      snippet: (results[0].text || '').substring(0, 200)
    };
  }

  // Normalize quality score (0-100)
  analysis.qualityScore = Math.max(0, Math.min(100, analysis.qualityScore));

  // Calculate facility relevance ratio
  analysis.facilityRelevanceRatio = results.length > 0
    ? (analysis.facilitySpecificCount / results.length)
    : 0;

  // Overall assessment
  if (analysis.facilitySpecificCount > 0 && analysis.echoSystemCount > 0) {
    analysis.verdict = 'EXCELLENT - Found facility-specific ECHO data';
  } else if (analysis.facilitySpecificCount > 0) {
    analysis.verdict = 'GOOD - Found facility-specific pages';
  } else if (analysis.echoSystemCount > 0) {
    analysis.verdict = 'MODERATE - Found ECHO system but not Tesla-specific';
  } else if (analysis.genericEPACount === results.length) {
    analysis.verdict = 'POOR - Only generic EPA pages';
  } else {
    analysis.verdict = 'UNCLEAR - Mixed results';
  }

  return analysis;
}

/**
 * Test a single query pattern
 */
async function testQueryPattern(exaApiKey, pattern, limit = 3) {
  logSection(`Testing: ${pattern.name}`);
  log(`Description: ${pattern.description}`, 'cyan');
  log(`Query: ${pattern.query}`, 'yellow');
  if (pattern.expectedBenefit) {
    log(`Expected: ${pattern.expectedBenefit}`, 'blue');
  }
  if (pattern.note) {
    log(`Note: ${pattern.note}`, 'magenta');
  }

  try {
    const startTime = Date.now();

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey
      },
      body: JSON.stringify({
        query: pattern.query,
        numResults: limit,
        contents: {
          text: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const executionTime = Date.now() - startTime;

    log(`\n✅ Query executed successfully (${executionTime}ms)`, 'green');
    log(`Results found: ${data.results.length}`, 'cyan');

    // Analyze result quality
    const analysis = analyzeResultQuality(data.results, pattern.name);

    // Display analysis
    console.log('\n📊 Quality Analysis:');
    console.log(`  Total results:              ${analysis.totalResults}`);
    console.log(`  Facility-specific pages:    ${analysis.facilitySpecificCount}`);
    console.log(`  ECHO system pages:          ${analysis.echoSystemCount}`);
    console.log(`  Generic EPA pages:          ${analysis.genericEPACount}`);
    console.log(`  Tesla+Fremont mentions:     ${analysis.teslaFreemontMentions}`);
    console.log(`  Compliance data indicators: ${analysis.complianceDataCount}`);
    console.log(`  Facility relevance ratio:   ${(analysis.facilityRelevanceRatio * 100).toFixed(0)}%`);
    console.log(`  Quality score:              ${analysis.qualityScore}/100`);

    // Verdict
    const verdictColor = analysis.qualityScore >= 60 ? 'green' :
                         analysis.qualityScore >= 30 ? 'yellow' : 'red';
    log(`\n${analysis.verdict}`, verdictColor);

    // Show top result details
    if (analysis.topResult) {
      console.log('\n📄 Top Result:');
      console.log(`  Title:   ${analysis.topResult.title}`);
      console.log(`  URL:     ${analysis.topResult.url}`);
      console.log(`  Snippet: ${analysis.topResult.snippet}...`);
    }

    // Show all URLs
    if (analysis.urls.length > 0) {
      console.log('\n🔗 All URLs Found:');
      analysis.urls.forEach((url, i) => {
        const isEcho = url.includes('echo.epa.gov');
        const hasFremont = url.toLowerCase().includes('fremont');
        const marker = isEcho ? '🎯 ' : hasFremont ? '✓ ' : '  ';
        console.log(`  ${i + 1}. ${marker}${url}`);
      });
    }

    return {
      pattern: pattern.name,
      query: pattern.query,
      executionTime,
      analysis,
      rawResults: data.results
    };

  } catch (error) {
    log(`\n❌ Query failed: ${error.message}`, 'red');
    console.error(error);
    return {
      pattern: pattern.name,
      query: pattern.query,
      error: error.message,
      analysis: {
        qualityScore: 0,
        verdict: 'FAILED - Error executing query'
      }
    };
  }
}

/**
 * Compare all query patterns
 */
function comparePatterns(testResults) {
  logSection('📊 COMPARISON SUMMARY');

  // Sort by quality score
  const sorted = testResults
    .filter(r => r.analysis)
    .sort((a, b) => b.analysis.qualityScore - a.analysis.qualityScore);

  console.log('\nRanking by Quality Score:\n');
  console.log('Rank | Score | Pattern Name                | Facility-Specific | ECHO | Verdict');
  console.log('-----|-------|----------------------------|-------------------|------|------------------');

  sorted.forEach((result, index) => {
    const rank = (index + 1).toString().padStart(4);
    const score = result.analysis.qualityScore.toString().padEnd(5);
    const name = result.pattern.padEnd(26);
    const facilityCount = result.analysis.facilitySpecificCount?.toString().padStart(17) || '      -          ';
    const echoCount = result.analysis.echoSystemCount?.toString().padStart(4) || '  - ';
    const verdict = result.analysis.verdict;

    const color = result.analysis.qualityScore >= 60 ? 'green' :
                  result.analysis.qualityScore >= 30 ? 'yellow' : 'red';

    log(`${rank} | ${score} | ${name} | ${facilityCount} | ${echoCount} | ${verdict}`, color);
  });

  // Recommend best pattern
  if (sorted.length > 0 && sorted[0].analysis.qualityScore >= 30) {
    logSection('✅ RECOMMENDED QUERY PATTERN');
    const winner = sorted[0];
    log(`Pattern: ${winner.pattern}`, 'green');
    log(`Query:   ${winner.query}`, 'cyan');
    log(`Score:   ${winner.analysis.qualityScore}/100`, 'green');
    log(`Reason:  ${winner.analysis.verdict}`, 'blue');

    console.log('\n💡 Implementation Recommendation:');
    console.log(`Update EPAWebSearchClient.js to use this query pattern for searchFacilitiesWeb()`);

  } else {
    logSection('⚠️ NO GOOD PATTERN FOUND');
    log('None of the query patterns returned high-quality facility-specific data.', 'yellow');
    console.log('\nPossible Reasons:');
    console.log('  1. Tesla Fremont facility data not available via web search');
    console.log('  2. Data only accessible via native ECHO API');
    console.log('  3. Need different search terms or facility identifiers');
    console.log('\n💡 Recommendations:');
    console.log('  - Test with native ECHO API instead of web search');
    console.log('  - Try different facility name (e.g., "Tesla Motors" instead of "Tesla")');
    console.log('  - Use facility registry ID if available');
    console.log('  - Consider hybrid approach: native API + web search for context');
  }
}

/**
 * Main test execution
 */
async function main() {
  logSection('🧪 EPA QUERY TARGETING INVESTIGATION');
  log('Testing different query patterns to find Tesla Fremont facility data', 'cyan');
  log('Test Case: Tesla Fremont manufacturing facility compliance', 'cyan');

  // Validate environment
  if (!process.env.EXA_API_KEY) {
    log('\n❌ EXA_API_KEY not found in environment', 'red');
    log('Set EXA_API_KEY in .env file or environment variables', 'yellow');
    process.exit(1);
  }

  log('\n✅ EXA_API_KEY found in environment', 'green');

  const exaApiKey = process.env.EXA_API_KEY;

  // Test all patterns
  const testResults = [];

  for (let i = 0; i < queryPatterns.length; i++) {
    const pattern = queryPatterns[i];

    const result = await testQueryPattern(exaApiKey, pattern, 3);
    testResults.push(result);

    // Wait between queries to respect rate limits
    if (i < queryPatterns.length - 1) {
      log('\n⏳ Waiting 3 seconds before next query...', 'cyan');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Compare all patterns
  comparePatterns(testResults);

  logSection('🏁 TEST COMPLETE');
  log('Review the results above to determine the best query pattern for EPA facility searches.', 'cyan');
}

// Run test
main().catch(error => {
  logSection('❌ TEST FAILED WITH ERROR');
  console.error(error);
  process.exit(1);
});

/**
 * Integration Tests for GovInfo Enhanced Summary Queries
 *
 * Tests complete search flow with Exa API integration
 * Compares baseline vs enhanced query results for 3 high-value USC scenarios
 *
 * REQUIRES: EXA_API_KEY environment variable
 *
 * Usage:
 *   EXA_API_KEY=your_key node test/integration/test-govinfo-enhanced-queries-integration.js (baseline)
 *   EXA_API_KEY=your_key ENHANCED_SUMMARY_QUERIES=true node test/integration/test-govinfo-enhanced-queries-integration.js (enhanced)
 */

import { GovInfoWebSearchClient } from '../../src/api-clients/GovInfoWebSearchClient.js';

console.log('\n🔬 GOVINFO ENHANCED QUERIES - INTEGRATION TESTS');
console.log('=' + '='.repeat(70));
console.log(`Mode: ${process.env.ENHANCED_SUMMARY_QUERIES === 'true' ? 'ENHANCED ✨' : 'BASELINE'}`);
console.log('⚠️  Requires EXA_API_KEY environment variable\n');

// Check for EXA_API_KEY
if (!process.env.EXA_API_KEY) {
  console.error('❌ EXA_API_KEY not set - integration tests skipped');
  console.error('   Set EXA_API_KEY environment variable to run integration tests');
  process.exit(1);
}

const client = new GovInfoWebSearchClient();

let totalTests = 0;
let totalPassed = 0;

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Civil Rights Law (42 USC 1983)',
    description: 'Civil rights under color of law - most searched USC provision',
    args: {
      search_term: '42 USC 1983 civil rights under color of law',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['42 USC 1983', 'civil rights', 'color of law', 'constitutional'],
    expectedMinResults: 1,
    context: 'This is the foundation of civil rights litigation in federal courts'
  },
  {
    name: 'Tax Exempt Status (26 USC 501(c)(3))',
    description: 'Nonprofit tax exemption requirements',
    args: {
      search_term: '26 USC 501(c)(3) tax exempt nonprofit organization',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['501(c)(3)', 'tax exempt', 'nonprofit', 'organization', 'charitable'],
    expectedMinResults: 1,
    context: 'Critical for nonprofit organizations seeking tax exempt status'
  },
  {
    name: 'Clean Air Act (42 USC 7401)',
    description: 'Environmental emissions standards',
    args: {
      search_term: '42 USC 7401 Clean Air Act emissions standards',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['Clean Air Act', '7401', 'emissions', 'air quality', 'environmental'],
    expectedMinResults: 1,
    context: 'Foundation of federal air quality regulation'
  }
];

// Helper function to calculate relevance score
function calculateRelevanceScore(results, keywords) {
  if (!results || results.length === 0) return 0;

  let totalScore = 0;
  results.forEach(result => {
    let itemScore = 0;
    const textToSearch = `${result.usc_citation || ''} ${result.title || ''} ${result.section_title || ''} ${result.snippet || ''}`.toLowerCase();

    keywords.forEach(keyword => {
      if (textToSearch.includes(keyword.toLowerCase())) {
        itemScore += 25; // Each matching keyword adds 25 points
      }
    });

    totalScore += itemScore;
  });

  return totalScore / results.length; // Average score across all results
}

// Run tests
async function runTests() {
  for (const scenario of TEST_SCENARIOS) {
    totalTests++;
    console.log(`\n📋 Test ${totalTests}: ${scenario.name}`);
    console.log('-'.repeat(72));
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Context: ${scenario.context}`);
    console.log('');

    try {
      const startTime = Date.now();
      const result = await client.searchUSCodeWeb(scenario.args);
      const endTime = Date.now();
      const executionTime = ((endTime - startTime) / 1000).toFixed(2);

      // Parse results
      const resultData = result.content && result.content[0] ? JSON.parse(result.content[0].text) : null;
      const results = resultData?.results || [];

      console.log(`   Results Found: ${results.length}`);
      console.log(`   Execution Time: ${executionTime}s`);

      // Calculate relevance score
      const relevanceScore = calculateRelevanceScore(results, scenario.expectedKeywords);
      console.log(`   Relevance Score: ${relevanceScore.toFixed(1)}/100`);

      // Check for expected keywords
      let keywordsFound = 0;
      scenario.expectedKeywords.forEach(keyword => {
        const found = results.some(r => {
          const textToSearch = `${r.usc_citation || ''} ${r.title || ''} ${r.section_title || ''} ${r.snippet || ''}`.toLowerCase();
          return textToSearch.includes(keyword.toLowerCase());
        });
        if (found) keywordsFound++;
      });

      const keywordCoverage = ((keywordsFound / scenario.expectedKeywords.length) * 100).toFixed(1);
      console.log(`   Keyword Coverage: ${keywordsFound}/${scenario.expectedKeywords.length} (${keywordCoverage}%)`);

      // Validation
      const passed = results.length >= scenario.expectedMinResults && relevanceScore > 0;

      if (passed) {
        console.log(`   ✅ PASS - Found ${results.length} results with relevance score ${relevanceScore.toFixed(1)}`);
        totalPassed++;

        // Display sample result
        if (results.length > 0) {
          console.log(`\n   📄 Sample Result:`);
          console.log(`      USC Citation: ${results[0].usc_citation || 'N/A'}`);
          console.log(`      Title: ${results[0].title || results[0].section_title || 'N/A'}`);
          if (results[0].snippet) {
            console.log(`      Snippet: ${results[0].snippet.substring(0, 150)}...`);
          }
        }
      } else {
        console.log(`   ❌ FAIL - Expected ${scenario.expectedMinResults}+ results with relevance > 0`);
        console.log(`      Got: ${results.length} results with relevance ${relevanceScore.toFixed(1)}`);
      }

      // Store metrics for comparison
      if (!global.testMetrics) global.testMetrics = [];
      global.testMetrics.push({
        scenario: scenario.name,
        mode: process.env.ENHANCED_SUMMARY_QUERIES === 'true' ? 'enhanced' : 'baseline',
        resultsCount: results.length,
        relevanceScore: relevanceScore,
        keywordCoverage: parseFloat(keywordCoverage),
        executionTime: parseFloat(executionTime)
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.error(error.stack);
    }
  }
}

// Execute tests
await runTests();

// Final summary
console.log('\n' + '='.repeat(72));
console.log('📊 INTEGRATION TEST SUMMARY');
console.log('='.repeat(72));
console.log(`Mode: ${process.env.ENHANCED_SUMMARY_QUERIES === 'true' ? 'ENHANCED ✨' : 'BASELINE'}`);
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalTests - totalPassed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
console.log('');

// Display metrics table
if (global.testMetrics && global.testMetrics.length > 0) {
  console.log('📈 PERFORMANCE METRICS:');
  console.log('-'.repeat(72));
  global.testMetrics.forEach(m => {
    console.log(`${m.scenario}:`);
    console.log(`   Results: ${m.resultsCount} | Relevance: ${m.relevanceScore.toFixed(1)} | Keywords: ${m.keywordCoverage}% | Time: ${m.executionTime}s`);
  });
  console.log('');
}

// Compare with baseline if running in enhanced mode
if (process.env.ENHANCED_SUMMARY_QUERIES === 'true') {
  console.log('💡 COMPARISON TIP:');
  console.log('   Run this test without ENHANCED_SUMMARY_QUERIES=true to generate baseline metrics');
  console.log('   Then compare the relevance scores and keyword coverage between modes');
  console.log('');
}

if (totalPassed === totalTests) {
  console.log('🎉 ALL INTEGRATION TESTS PASSED!');
  console.log('');
  if (process.env.ENHANCED_SUMMARY_QUERIES === 'true') {
    console.log('✅ Enhanced mode validated with Exa API');
    console.log('   Expected: +15-30% improvement over baseline');
  } else {
    console.log('✅ Baseline mode validated with Exa API');
  }
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  SOME INTEGRATION TESTS FAILED');
  console.log('   Review failures and check Exa API connectivity');
  console.log('');
  process.exit(1);
}

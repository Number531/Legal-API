/**
 * GovInfo Enhanced Queries Validation Test
 *
 * Comprehensive side-by-side comparison of baseline vs enhanced summary queries
 * Tests 3 high-value USC search scenarios and reports improvement metrics
 *
 * REQUIRES: EXA_API_KEY environment variable
 *
 * Usage:
 *   EXA_API_KEY=your_key node test-govinfo-enhanced-queries-validation.js
 *
 * This test automatically runs BOTH baseline and enhanced modes and compares results
 */

import { GovInfoWebSearchClient } from './src/api-clients/GovInfoWebSearchClient.js';

console.log('\n🔬 GOVINFO ENHANCED QUERIES - VALIDATION TEST');
console.log('=' + '='.repeat(70));
console.log('Comparing baseline vs enhanced summary queries');
console.log('⚠️  Requires EXA_API_KEY environment variable\n');

// Check for EXA_API_KEY
if (!process.env.EXA_API_KEY) {
  console.error('❌ EXA_API_KEY not set - validation test cannot run');
  console.error('   Set EXA_API_KEY environment variable to run this test');
  process.exit(1);
}

const TEST_SCENARIOS = [
  {
    name: 'Civil Rights Law',
    description: '42 USC 1983 - Civil rights under color of law',
    args: {
      search_term: '42 USC 1983 civil rights under color of law',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['42 USC 1983', 'civil rights', 'color of law', 'constitutional']
  },
  {
    name: 'Tax Exempt Status',
    description: '26 USC 501(c)(3) - Nonprofit tax exemption',
    args: {
      search_term: '26 USC 501(c)(3) tax exempt nonprofit',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['501(c)(3)', 'tax exempt', 'nonprofit', 'charitable']
  },
  {
    name: 'Clean Air Act',
    description: '42 USC 7401 - Environmental emissions standards',
    args: {
      search_term: '42 USC 7401 Clean Air Act emissions',
      limit: 5,
      include_snippet: true
    },
    expectedKeywords: ['Clean Air Act', '7401', 'emissions', 'air quality']
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
        itemScore += 25;
      }
    });

    totalScore += itemScore;
  });

  return totalScore / results.length;
}

// Helper function to count keyword coverage
function calculateKeywordCoverage(results, keywords) {
  if (!results || results.length === 0) return 0;

  let keywordsFound = 0;
  keywords.forEach(keyword => {
    const found = results.some(r => {
      const textToSearch = `${r.usc_citation || ''} ${r.title || ''} ${r.section_title || ''} ${r.snippet || ''}`.toLowerCase();
      return textToSearch.includes(keyword.toLowerCase());
    });
    if (found) keywordsFound++;
  });

  return (keywordsFound / keywords.length) * 100;
}

// Run test in specific mode
async function runMode(mode) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`🔍 TESTING ${mode.toUpperCase()} MODE`);
  console.log('='.repeat(72));

  // Set environment variable for this mode
  if (mode === 'enhanced') {
    process.env.ENHANCED_SUMMARY_QUERIES = 'true';
  } else {
    delete process.env.ENHANCED_SUMMARY_QUERIES;
  }

  // Create fresh client for this mode
  const client = new GovInfoWebSearchClient();

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📋 ${scenario.name}`);
    console.log(`   ${scenario.description}`);

    try {
      const startTime = Date.now();
      const result = await client.searchUSCodeWeb(scenario.args);
      const endTime = Date.now();

      const resultData = result.content && result.content[0] ? JSON.parse(result.content[0].text) : null;
      const searchResults = resultData?.results || [];

      const relevanceScore = calculateRelevanceScore(searchResults, scenario.expectedKeywords);
      const keywordCoverage = calculateKeywordCoverage(searchResults, scenario.expectedKeywords);
      const executionTime = ((endTime - startTime) / 1000).toFixed(2);

      const metrics = {
        scenario: scenario.name,
        mode: mode,
        resultsCount: searchResults.length,
        relevanceScore: relevanceScore,
        keywordCoverage: keywordCoverage,
        executionTime: parseFloat(executionTime)
      };

      results.push(metrics);

      console.log(`   ✅ Complete`);
      console.log(`      Results: ${metrics.resultsCount}`);
      console.log(`      Relevance: ${metrics.relevanceScore.toFixed(1)}/100`);
      console.log(`      Keyword Coverage: ${metrics.keywordCoverage.toFixed(1)}%`);
      console.log(`      Time: ${metrics.executionTime}s`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        scenario: scenario.name,
        mode: mode,
        error: error.message
      });
    }
  }

  return results;
}

// Main execution
async function main() {
  console.log('Starting validation test...\n');

  // Run baseline mode
  console.log('⏳ Running baseline mode tests...');
  const baselineResults = await runMode('baseline');

  // Wait a moment between runs
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Run enhanced mode
  console.log('\n⏳ Running enhanced mode tests...');
  const enhancedResults = await runMode('enhanced');

  // Compare results
  console.log('\n' + '='.repeat(72));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(72));
  console.log('');

  const comparisons = [];

  TEST_SCENARIOS.forEach((scenario, index) => {
    const baseline = baselineResults[index];
    const enhanced = enhancedResults[index];

    if (baseline.error || enhanced.error) {
      console.log(`\n❌ ${scenario.name}: Test failed`);
      if (baseline.error) console.log(`   Baseline error: ${baseline.error}`);
      if (enhanced.error) console.log(`   Enhanced error: ${enhanced.error}`);
      return;
    }

    const relevanceImprovement = enhanced.relevanceScore - baseline.relevanceScore;
    const relevancePercent = baseline.relevanceScore > 0 ?
      ((relevanceImprovement / baseline.relevanceScore) * 100) : 0;

    const keywordImprovement = enhanced.keywordCoverage - baseline.keywordCoverage;
    const timeImpact = enhanced.executionTime - baseline.executionTime;

    comparisons.push({
      scenario: scenario.name,
      relevanceImprovement: relevancePercent,
      keywordImprovement: keywordImprovement,
      timeImpact: timeImpact
    });

    console.log(`\n📈 ${scenario.name}:`);
    console.log('   Baseline:');
    console.log(`     - Results: ${baseline.resultsCount}`);
    console.log(`     - Relevance: ${baseline.relevanceScore.toFixed(1)}/100`);
    console.log(`     - Keywords: ${baseline.keywordCoverage.toFixed(1)}%`);
    console.log(`     - Time: ${baseline.executionTime}s`);
    console.log('');
    console.log('   Enhanced:');
    console.log(`     - Results: ${enhanced.resultsCount}`);
    console.log(`     - Relevance: ${enhanced.relevanceScore.toFixed(1)}/100`);
    console.log(`     - Keywords: ${enhanced.keywordCoverage.toFixed(1)}%`);
    console.log(`     - Time: ${enhanced.executionTime}s`);
    console.log('');
    console.log('   Improvement:');
    console.log(`     - Relevance: ${relevanceImprovement > 0 ? '+' : ''}${relevanceImprovement.toFixed(1)} points (${relevancePercent > 0 ? '+' : ''}${relevancePercent.toFixed(1)}%)`);
    console.log(`     - Keyword Coverage: ${keywordImprovement > 0 ? '+' : ''}${keywordImprovement.toFixed(1)}%`);
    console.log(`     - Time Impact: ${timeImpact > 0 ? '+' : ''}${timeImpact.toFixed(2)}s`);

    const verdict = relevancePercent >= 15 ? '✅ SIGNIFICANT IMPROVEMENT' :
                   relevancePercent >= 5 ? '🟡 MODERATE IMPROVEMENT' :
                   relevancePercent > 0 ? '🔵 SLIGHT IMPROVEMENT' :
                   '⚪ NO IMPROVEMENT';
    console.log(`     - Verdict: ${verdict}`);
  });

  // Overall summary
  if (comparisons.length > 0) {
    const avgRelevanceImprovement = comparisons.reduce((sum, c) => sum + c.relevanceImprovement, 0) / comparisons.length;
    const avgKeywordImprovement = comparisons.reduce((sum, c) => sum + c.keywordImprovement, 0) / comparisons.length;
    const avgTimeImpact = comparisons.reduce((sum, c) => sum + c.timeImpact, 0) / comparisons.length;

    console.log('\n' + '='.repeat(72));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(72));
    console.log(`Average Relevance Improvement: ${avgRelevanceImprovement > 0 ? '+' : ''}${avgRelevanceImprovement.toFixed(1)}%`);
    console.log(`Average Keyword Coverage Improvement: ${avgKeywordImprovement > 0 ? '+' : ''}${avgKeywordImprovement.toFixed(1)}%`);
    console.log(`Average Time Impact: ${avgTimeImpact > 0 ? '+' : ''}${avgTimeImpact.toFixed(2)}s`);
    console.log('');

    if (avgRelevanceImprovement >= 15) {
      console.log('🎉 VALIDATION SUCCESSFUL!');
      console.log('✅ Enhanced queries provide significant value (+15% or more)');
      console.log('   Expected range: +15-30% based on FDA/SEC precedent');
    } else if (avgRelevanceImprovement >= 5) {
      console.log('🟡 VALIDATION PARTIAL');
      console.log('   Enhanced queries show improvement but below expected +15%');
      console.log('   Consider reviewing query patterns or test scenarios');
    } else {
      console.log('⚪ VALIDATION INCONCLUSIVE');
      console.log('   Enhanced queries show minimal improvement');
      console.log('   This may indicate the test scenarios or data type don\'t benefit from enhancement');
    }
    console.log('');
  }

  console.log('✅ Validation test complete');
  console.log('');
}

// Run main
main().catch(error => {
  console.error('\n❌ Validation test failed:',error.message);
  console.error(error.stack);
  process.exit(1);
});

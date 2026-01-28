#!/usr/bin/env node

/**
 * Automated GovInfo Server Test Runner
 * Tests GovInfo endpoints in both baseline and enhanced modes
 * Equivalent to testing through claude-server-v2.js
 */

import { GovInfoWebSearchClient } from './src/api-clients/GovInfoWebSearchClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n=== GovInfo Server Test Runner ===\n');
console.log('Testing GovInfo endpoints in both baseline and enhanced modes');
console.log('This simulates testing through claude-server-v2.js\n');

// Test configurations
const TESTS = [
  {
    name: 'Test 1: Civil Rights (42 USC 1983)',
    method: 'searchUSCodeWeb',
    params: {
      search_term: '42 USC 1983 civil rights under color of law',
      include_text: true,
      limit: 5
    },
    expectedCitation: { title: 42, section: '1983' }
  },
  {
    name: 'Test 2: Tax Exempt (26 USC 501)',
    method: 'searchUSCodeWeb',
    params: {
      search_term: '26 USC 501 tax-exempt organizations',
      include_snippet: true,
      limit: 5
    },
    expectedCitation: { title: 26, section: '501' }
  },
  {
    name: 'Test 3: Citation Inference (section 1983)',
    method: 'searchUSCodeWeb',
    params: {
      search_term: 'section 1983 civil rights violations',
      limit: 5
    },
    expectedCitation: { title: 42, section: '1983' }
  }
];

/**
 * Run tests in a specific mode
 */
async function runTestsInMode(mode, useEnhanced) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${mode} MODE TESTING`);
  console.log('='.repeat(70));

  // Set environment variable for this mode
  process.env.ENHANCED_SUMMARY_QUERIES = useEnhanced ? 'true' : 'false';

  const client = new GovInfoWebSearchClient();
  const results = [];

  for (const test of TESTS) {
    console.log(`\n${test.name}`);
    console.log('─'.repeat(70));

    try {
      const response = await client[test.method](test.params);

      // Parse response (MCP server format: {content: [{type: "text", text: JSON}]})
      const data = JSON.parse(response.content[0].text);
      const searchResults = data.results || [];

      console.log(`\n📊 Results: ${searchResults.length} found`);

      if (searchResults.length === 0) {
        console.log('❌ No results returned');
        results.push({
          test: test.name,
          status: 'FAIL',
          reason: 'No results',
          section_match: false,
          extraction_method: null,
          match_confidence: 0
        });
        continue;
      }

      // Analyze first result
      const topResult = searchResults[0];
      const quality = client.assessUSCResultQuality(searchResults, test.expectedCitation);

      console.log('\n📈 Quality Metrics:');
      console.log(`  Total Results: ${quality.total}`);
      console.log(`  Exact Section Matches: ${quality.exact_section_matches} (${quality.precision})`);
      console.log(`  Title Matches: ${quality.title_matches}`);
      console.log(`  Avg Confidence: ${quality.avg_confidence}`);
      console.log(`  Expected: ${quality.expected_section}`);

      console.log('\n🌐 Domain Distribution:');
      console.log(`  GovInfo.gov: ${quality.govinfo_results}`);
      console.log(`  Cornell.edu: ${quality.cornell_results}`);
      console.log(`  Uscode.house.gov: ${quality.uscode_results}`);

      console.log('\n📝 Extraction Methods:');
      console.log(`  Exa Schema: ${quality.extraction_methods.exa_schema}`);
      console.log(`  Regex Fallback: ${quality.extraction_methods.regex_fallback}`);

      console.log('\n📄 Top Result:');
      console.log(`  Title: ${topResult.title}`);
      console.log(`  URL: ${topResult.url}`);
      if (topResult.usc_citation) {
        console.log(`  Citation: ${topResult.usc_citation}`);
      }
      console.log(`  Title Number: ${topResult.title_number || 'null'}`);
      console.log(`  Section Number: ${topResult.section_number || 'null'}`);
      console.log(`  Section Match: ${topResult._section_match ? '✅ true' : '❌ false'}`);
      console.log(`  Title Match: ${topResult._title_match ? '✅ true' : '❌ false'}`);
      console.log(`  Confidence: ${((topResult._match_confidence || 0) * 100).toFixed(0)}%`);
      console.log(`  Extraction: ${topResult._extraction_method}`);

      // Determine pass/fail
      const passed = topResult._section_match &&
                    topResult.section_number === test.expectedCitation.section;

      results.push({
        test: test.name,
        status: passed ? 'PASS' : 'FAIL',
        section_match: topResult._section_match,
        title_match: topResult._title_match,
        extraction_method: topResult._extraction_method,
        match_confidence: topResult._match_confidence,
        expected_section: test.expectedCitation.section,
        actual_section: topResult.section_number,
        expected_title: test.expectedCitation.title,
        actual_title: topResult.title_number
      });

      console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}: ${passed ? 'Section match correct' : 'Section match failed'}`);

    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}`);
      results.push({
        test: test.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Compare baseline vs enhanced results
 */
function compareResults(baseline, enhanced) {
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('COMPARISON: BASELINE vs ENHANCED');
  console.log('='.repeat(70));

  console.log('\n| Test | Baseline Status | Enhanced Status | Extraction Δ | Confidence Δ |');
  console.log('|------|----------------|----------------|--------------|--------------|');

  for (let i = 0; i < baseline.length; i++) {
    const b = baseline[i];
    const e = enhanced[i];

    const extractionDelta = b.extraction_method === e.extraction_method ?
      'No change' :
      `${b.extraction_method} → ${e.extraction_method}`;

    const confidenceDelta = e.match_confidence - b.match_confidence;
    const confidenceStr = confidenceDelta >= 0 ?
      `+${confidenceDelta.toFixed(2)}` :
      confidenceDelta.toFixed(2);

    console.log(`| ${b.test.split(':')[0]} | ${b.status} | ${e.status} | ${extractionDelta} | ${confidenceStr} |`);
  }

  // Calculate aggregate metrics
  console.log('\n\n📊 AGGREGATE METRICS');
  console.log('─'.repeat(70));

  const baselinePasses = baseline.filter(r => r.status === 'PASS').length;
  const enhancedPasses = enhanced.filter(r => r.status === 'PASS').length;

  const baselineExaSchema = baseline.filter(r => r.extraction_method === 'exa_schema').length;
  const enhancedExaSchema = enhanced.filter(r => r.extraction_method === 'exa_schema').length;

  const baselineAvgConfidence = baseline
    .filter(r => r.match_confidence !== undefined)
    .reduce((sum, r) => sum + r.match_confidence, 0) / baseline.length;
  const enhancedAvgConfidence = enhanced
    .filter(r => r.match_confidence !== undefined)
    .reduce((sum, r) => sum + r.match_confidence, 0) / enhanced.length;

  console.log('\n**Pass Rate**:');
  console.log(`  Baseline: ${baselinePasses}/${baseline.length} (${((baselinePasses / baseline.length) * 100).toFixed(0)}%)`);
  console.log(`  Enhanced: ${enhancedPasses}/${enhanced.length} (${((enhancedPasses / enhanced.length) * 100).toFixed(0)}%)`);
  console.log(`  Improvement: ${enhancedPasses - baselinePasses >= 0 ? '+' : ''}${enhancedPasses - baselinePasses}`);

  console.log('\n**Exa Schema Extraction Rate**:');
  console.log(`  Baseline: ${baselineExaSchema}/${baseline.length} (${((baselineExaSchema / baseline.length) * 100).toFixed(0)}%)`);
  console.log(`  Enhanced: ${enhancedExaSchema}/${enhanced.length} (${((enhancedExaSchema / enhanced.length) * 100).toFixed(0)}%)`);
  console.log(`  Improvement: ${enhancedExaSchema - baselineExaSchema >= 0 ? '+' : ''}${((enhancedExaSchema - baselineExaSchema) / baseline.length * 100).toFixed(0)}%`);

  console.log('\n**Average Match Confidence**:');
  console.log(`  Baseline: ${baselineAvgConfidence.toFixed(2)}`);
  console.log(`  Enhanced: ${enhancedAvgConfidence.toFixed(2)}`);
  console.log(`  Improvement: ${(enhancedAvgConfidence - baselineAvgConfidence >= 0 ? '+' : '')}${(enhancedAvgConfidence - baselineAvgConfidence).toFixed(2)}`);

  // Recommendation
  console.log('\n\n🎯 RECOMMENDATION');
  console.log('─'.repeat(70));

  const improvement = enhancedPasses - baselinePasses;
  const exaImprovement = enhancedExaSchema - baselineExaSchema;
  const confidenceImprovement = enhancedAvgConfidence - baselineAvgConfidence;

  if (improvement > 0 || exaImprovement > 0 || confidenceImprovement > 0.1) {
    console.log('\n✅ APPROVE: Enhanced queries show improvement');
    console.log(`  - Pass rate improved by ${improvement} tests`);
    console.log(`  - Exa schema rate improved by ${exaImprovement} tests`);
    console.log(`  - Avg confidence improved by ${confidenceImprovement.toFixed(2)}`);
  } else if (improvement === 0 && exaImprovement === 0 && Math.abs(confidenceImprovement) < 0.05) {
    console.log('\n⚠️ CONDITIONAL: No improvement observed');
    console.log('  - Pass rate unchanged');
    console.log('  - Exa schema rate unchanged');
    console.log('  - Avg confidence unchanged');
    console.log('\n  Consider:');
    console.log('  1. Keep baseline mode (no benefit to enhanced)');
    console.log('  2. Proceed with CourtListenerWebSearchClient');
    console.log('  3. Explore alternative USC search providers');
  } else {
    console.log('\n❌ REJECT: Enhanced queries show regression');
    console.log(`  - Pass rate changed by ${improvement} tests`);
    console.log('  - Revert to baseline mode');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  try {
    console.log('Starting automated GovInfo server tests...\n');

    // Run baseline tests
    const baselineResults = await runTestsInMode('BASELINE', false);

    // Run enhanced tests
    const enhancedResults = await runTestsInMode('ENHANCED', true);

    // Compare results
    compareResults(baselineResults, enhancedResults);

    console.log('\n\n✅ Test run complete!\n');
    console.log('Results saved to console output above.');
    console.log('For full details, see test output.\n');

  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

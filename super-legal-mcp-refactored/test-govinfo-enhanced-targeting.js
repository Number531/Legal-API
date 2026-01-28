#!/usr/bin/env node

/**
 * GovInfo Enhanced Targeting Diagnostic Test
 *
 * Tests the 3-layer enhanced targeting implementation:
 * 1. Citation parsing (parseUSCCitation)
 * 2. Enhanced query building (buildUSCQuery)
 * 3. Section validation and quality assessment
 *
 * Usage: node test-govinfo-enhanced-targeting.js
 */

import { GovInfoWebSearchClient } from './src/api-clients/GovInfoWebSearchClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const ENHANCED_MODE = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

console.log('\n=== GovInfo Enhanced Targeting Diagnostic Test ===\n');
console.log(`Mode: ${ENHANCED_MODE ? 'ENHANCED' : 'BASELINE'}`);
console.log('Testing 3-layer precision enhancement:\n');

const client = new GovInfoWebSearchClient();

/**
 * Test 1: Citation Parsing
 */
async function testCitationParsing() {
  console.log('📋 TEST 1: Citation Parsing');
  console.log('─'.repeat(60));

  const testCases = [
    '42 USC 1983 civil rights',
    '26 U.S.C. § 501(c)(3) tax exempt',
    'section 1983 color of law',
    'civil rights discrimination',
    '42 USC 7401 clean air act'
  ];

  for (const searchTerm of testCases) {
    const parsed = client.parseUSCCitation(searchTerm);
    console.log(`\nInput: "${searchTerm}"`);
    if (parsed) {
      console.log(`  ✅ Parsed: ${parsed.title} USC ${parsed.section}`);
      console.log(`  Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
      console.log(`  Source: ${parsed.source}`);
      if (parsed.warning) {
        console.log(`  ⚠️  ${parsed.warning}`);
      }
    } else {
      console.log(`  ⚠️  No citation detected`);
    }
  }

  console.log('\n');
}

/**
 * Test 2: Enhanced Query Building
 */
async function testQueryBuilding() {
  console.log('🔍 TEST 2: Enhanced Query Building');
  console.log('─'.repeat(60));

  const testCases = [
    {
      search_term: '42 USC 1983 civil rights',
      title_number: null,
      section: null
    },
    {
      search_term: 'tax exempt organizations',
      title_number: 26,
      section: '501'
    },
    {
      search_term: 'clean air act',
      title_number: 42,
      section: '7401'
    }
  ];

  for (const testCase of testCases) {
    const query = client.buildUSCQuery(testCase);
    console.log(`\nInput: "${testCase.search_term}"`);
    console.log(`Enhanced Query:\n  ${query}`);

    // Check for precision enhancements
    const hasExactPhrase = query.includes('"');
    const hasDomainPriority = query.includes('site:');
    console.log(`\n  Exact phrases: ${hasExactPhrase ? '✅' : '❌'}`);
    console.log(`  Domain priority: ${hasDomainPriority ? '✅' : '❌'}`);
  }

  console.log('\n');
}

/**
 * Test 3: Full Search with Section Validation
 */
async function testFullSearch() {
  console.log('🎯 TEST 3: Full Search with Section Validation');
  console.log('─'.repeat(60));

  const testCases = [
    {
      name: 'Civil Rights (42 USC 1983)',
      params: {
        search_term: '42 USC 1983 civil rights under color of law',
        limit: 5
      }
    },
    {
      name: 'Tax Exempt (26 USC 501)',
      params: {
        search_term: '26 USC 501(c)(3) tax exempt organizations',
        limit: 5
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\nSearching: ${testCase.name}`);
      console.log('─'.repeat(40));

      const response = await client.searchUSCodeWeb(testCase.params);

      // Parse the response structure (returns {content: [{type: "text", text: JSON}]})
      if (!response || !response.content || !response.content[0]) {
        console.log('❌ No results returned');
        continue;
      }

      const data = JSON.parse(response.content[0].text);
      const results = data.results;

      if (!results || results.length === 0) {
        console.log('❌ No results returned');
        continue;
      }

      console.log(`\n📊 Results: ${results.length} found`);

      // Parse expected citation for quality assessment
      const expected = client.parseUSCCitation(testCase.params.search_term);
      const quality = client.assessUSCResultQuality(results, expected);

      // Display quality metrics
      console.log('\n📈 Quality Assessment:');
      console.log(`  Total Results: ${quality.total}`);
      console.log(`  Exact Section Matches: ${quality.exact_section_matches} (${quality.precision})`);
      console.log(`  Title Matches: ${quality.title_matches}`);
      console.log(`  Avg Confidence: ${quality.avg_confidence.toFixed(2)}`);
      console.log(`  Expected: ${quality.expected_section}`);

      console.log('\n🌐 Domain Distribution:');
      console.log(`  GovInfo.gov: ${quality.govinfo_results}`);
      console.log(`  Cornell.edu: ${quality.cornell_results}`);
      console.log(`  Uscode.house.gov: ${quality.uscode_results}`);
      console.log(`  Other: ${quality.other_results}`);

      console.log('\n📝 Extraction Methods:');
      console.log(`  Exa Schema: ${quality.extraction_methods.exa_schema}`);
      console.log(`  Regex Fallback: ${quality.extraction_methods.regex_fallback}`);

      // Display first 3 results with match info
      console.log('\n📄 Top Results:');
      results.slice(0, 3).forEach((result, idx) => {
        console.log(`\n  ${idx + 1}. ${result.title}`);
        console.log(`     URL: ${result.url}`);
        if (result.usc_citation) {
          console.log(`     Citation: ${result.usc_citation}`);
        }
        console.log(`     Section Match: ${result._section_match ? '✅' : '❌'}`);
        console.log(`     Title Match: ${result._title_match ? '✅' : '❌'}`);
        console.log(`     Confidence: ${(result._match_confidence * 100).toFixed(0)}%`);
        console.log(`     Extraction: ${result._extraction_method}`);
      });

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
}

/**
 * Test 4: Comparison Summary
 */
function displaySummary() {
  console.log('📊 SUMMARY');
  console.log('─'.repeat(60));
  console.log('\n✅ Enhanced Targeting Features Tested:');
  console.log('  1. USC Citation Parsing (SEC-style preprocessing)');
  console.log('  2. Enhanced Query Building (exact phrases + domain priority)');
  console.log('  3. Section Validation (match confidence scoring)');
  console.log('  4. Quality Assessment (precision metrics)');

  console.log('\n🎯 Expected Improvements:');
  console.log('  • Section Match Rate: 0% → 70%+');
  console.log('  • Match Confidence: 0.5 → 0.9+');
  console.log('  • Domain Quality: More GovInfo.gov results');
  console.log('  • Relevance Scores: 0-10/100 → 15-30/100');

  console.log('\n📋 Next Steps:');
  console.log('  1. Compare baseline vs enhanced results');
  console.log('  2. Run full integration test suite');
  console.log('  3. Measure relevance score improvements');
  console.log('  4. Document final results\n');
}

/**
 * Main test execution
 */
async function runDiagnostics() {
  try {
    await testCitationParsing();
    await testQueryBuilding();
    await testFullSearch();
    displaySummary();

    console.log('✅ Diagnostic test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics();

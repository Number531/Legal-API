/**
 * FDA Hybrid Client Comprehensive Test Suite
 * Based on FDA_HYBRID_COMPREHENSIVE_TEST_PROMPT.md
 *
 * Tests all 16 queries across 5 sections:
 * - Section A: Native-First Queries (4 tests)
 * - Section B: Critical WebSearch Routing (2 tests)
 * - Section C: Natural Language Queries (4 tests)
 * - Section D: Specialized Tools (4 tests)
 * - Section E: Edge Cases (2 tests)
 */

const TEST_QUERIES = [
  // Section A: Native-First Queries (OpenFDA syntax, device names, brand names, recalls)
  {
    section: 'A',
    name: 'A1: OpenFDA Field Syntax',
    query: 'Search FDA adverse events for patient.drug.medicinalproduct:"LIPITOR" AND serious:1',
    expectedRoute: 'native_first',
    description: 'OpenFDA field syntax should route to native API'
  },
  {
    section: 'A',
    name: 'A2: Device Name Query',
    query: 'Search FDA device events for pacemakers',
    expectedRoute: 'native_first',
    description: 'Device name should route to native API'
  },
  {
    section: 'A',
    name: 'A3: Brand Name Query',
    query: 'Search FDA drug labels for Tylenol',
    expectedRoute: 'native_first',
    description: 'Brand name should route to native API'
  },
  {
    section: 'A',
    name: 'A4: Recall Text Search',
    query: 'Search FDA recalls for contamination',
    expectedRoute: 'native_first',
    description: 'Recall text should route to native API'
  },

  // Section B: Critical WebSearch Routing (NDC codes, date ranges)
  {
    section: 'B',
    name: 'B1: NDC Code Query',
    query: 'Search FDA drug labels for NDC code 0069-2587-01',
    expectedRoute: 'websearch_first',
    description: 'NDC code should route to websearch (native returns 404)'
  },
  {
    section: 'B',
    name: 'B2: Date Range Query',
    query: 'Search FDA adverse events from January 2023 to December 2023',
    expectedRoute: 'websearch_first',
    description: 'Date range should route to websearch (native returns 500)'
  },

  // Section C: Natural Language Queries
  {
    section: 'C',
    name: 'C1: Question Format',
    query: 'What are the most common adverse events for blood pressure medications?',
    expectedRoute: 'websearch_first',
    description: 'Question format should route to websearch'
  },
  {
    section: 'C',
    name: 'C2: Temporal Keywords',
    query: 'Find latest FDA safety alerts about diabetes drugs',
    expectedRoute: 'websearch_first',
    description: 'Temporal keywords should route to websearch'
  },
  {
    section: 'C',
    name: 'C3: Long Natural Query',
    query: 'I need information about recent FDA recalls of medical devices that might affect hospital equipment',
    expectedRoute: 'websearch_first',
    description: 'Long natural language should route to websearch'
  },
  {
    section: 'C',
    name: 'C4: Comparative Query',
    query: 'Compare adverse event rates between generic and brand name statins',
    expectedRoute: 'websearch_first',
    description: 'Comparative analysis should route to websearch'
  },

  // Section D: Specialized Tools (WebSearch-only)
  {
    section: 'D',
    name: 'D1: Warning Letters',
    query: 'Find FDA warning letters about manufacturing violations',
    expectedRoute: 'websearch_only',
    description: 'Warning letters use specialized websearch tool'
  },
  {
    section: 'D',
    name: 'D2: 510k Clearances',
    query: 'Search FDA 510k clearances for surgical robots',
    expectedRoute: 'websearch_only',
    description: '510k uses specialized websearch tool'
  },
  {
    section: 'D',
    name: 'D3: Drug Shortages',
    query: 'Check current FDA drug shortage list for antibiotics',
    expectedRoute: 'websearch_only',
    description: 'Drug shortages use specialized websearch tool'
  },
  {
    section: 'D',
    name: 'D4: Orange Book',
    query: 'Search FDA Orange Book for generic equivalents of Prozac',
    expectedRoute: 'websearch_only',
    description: 'Orange Book uses specialized websearch tool'
  },

  // Section E: Edge Cases
  {
    section: 'E',
    name: 'E1: Empty Query',
    query: 'Search FDA adverse events',
    expectedRoute: 'native_first',
    description: 'Empty query should use smart defaults'
  },
  {
    section: 'E',
    name: 'E2: Hybrid Fallback',
    query: 'Search for obscure drug XYZ-12345 adverse events',
    expectedRoute: 'native_first_with_fallback',
    description: 'Native should try first, fallback to websearch if empty'
  }
];

async function runTest(test, index) {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:8090/api/claude/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: test.query,
        enableSessionMemory: false,
        maxTokens: 4000
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      return {
        test: test.name,
        section: test.section,
        status: 'FAIL',
        error: `HTTP ${response.status}`,
        responseTime
      };
    }

    const data = await response.json();

    // Check for errors
    if (data.error) {
      return {
        test: test.name,
        section: test.section,
        status: 'FAIL',
        error: data.error,
        responseTime
      };
    }

    // Check for tool execution
    const toolsExecuted = data.toolCalls?.length || 0;
    const hasResults = data.response && data.response.length > 100;

    return {
      test: test.name,
      section: test.section,
      status: hasResults ? 'PASS' : 'PARTIAL',
      toolsExecuted,
      responseTime,
      responseLength: data.response?.length || 0,
      error: !hasResults ? 'No substantial results returned' : null
    };

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      test: test.name,
      section: test.section,
      status: 'FAIL',
      error: error.message,
      responseTime
    };
  }
}

async function runComprehensiveTest() {
  console.log('🧪 FDA Hybrid Client Comprehensive Test Suite');
  console.log('=' .repeat(80));
  console.log(`Testing ${TEST_QUERIES.length} queries across 5 sections...\n`);

  const results = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`\n[${i + 1}/${TEST_QUERIES.length}] ${test.name}`);
    console.log(`Query: ${test.query}`);
    console.log(`Expected: ${test.expectedRoute}`);

    const result = await runTest(test, i);
    results.push(result);

    const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${statusEmoji} Status: ${result.status}`);
    console.log(`⏱️  Response Time: ${result.responseTime}ms`);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    if (result.toolsExecuted) {
      console.log(`🔧 Tools Executed: ${result.toolsExecuted}`);
    }

    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const sectionResults = {};
  TEST_QUERIES.forEach(test => {
    if (!sectionResults[test.section]) {
      sectionResults[test.section] = { pass: 0, partial: 0, fail: 0, total: 0 };
    }
    sectionResults[test.section].total++;
  });

  results.forEach(result => {
    const section = sectionResults[result.section];
    if (result.status === 'PASS') section.pass++;
    else if (result.status === 'PARTIAL') section.partial++;
    else section.fail++;
  });

  console.log('\nSection Breakdown:');
  console.log('-'.repeat(80));

  const sections = {
    'A': 'Native-First Queries',
    'B': 'Critical WebSearch Routing',
    'C': 'Natural Language Queries',
    'D': 'Specialized Tools',
    'E': 'Edge Cases'
  };

  Object.entries(sections).forEach(([key, name]) => {
    const stats = sectionResults[key];
    const passRate = ((stats.pass / stats.total) * 100).toFixed(0);
    console.log(`Section ${key} (${name}):`);
    console.log(`  ✅ Pass: ${stats.pass}/${stats.total} (${passRate}%)`);
    if (stats.partial > 0) {
      console.log(`  ⚠️  Partial: ${stats.partial}/${stats.total}`);
    }
    if (stats.fail > 0) {
      console.log(`  ❌ Fail: ${stats.fail}/${stats.total}`);
    }
  });

  // Overall statistics
  const totalPass = results.filter(r => r.status === 'PASS').length;
  const totalPartial = results.filter(r => r.status === 'PARTIAL').length;
  const totalFail = results.filter(r => r.status === 'FAIL').length;
  const successRate = ((totalPass / results.length) * 100).toFixed(1);

  const avgResponseTime = (results.reduce((sum, r) => sum + r.responseTime, 0) / results.length).toFixed(0);

  console.log('\n' + '='.repeat(80));
  console.log('Overall Results:');
  console.log(`  ✅ PASS: ${totalPass}/${results.length} (${successRate}%)`);
  if (totalPartial > 0) {
    console.log(`  ⚠️  PARTIAL: ${totalPartial}/${results.length}`);
  }
  if (totalFail > 0) {
    console.log(`  ❌ FAIL: ${totalFail}/${results.length}`);
  }
  console.log(`  ⏱️  Average Response Time: ${avgResponseTime}ms`);

  console.log('\n' + '='.repeat(80));

  // Determine overall verdict
  if (totalFail === 0 && totalPartial === 0) {
    console.log('🎉 ALL TESTS PASSED - FDA Hybrid Client is production ready!');
  } else if (totalPass >= 14) {
    console.log('✅ MOSTLY PASSED - FDA Hybrid Client is functional with minor issues');
  } else if (totalPass >= 10) {
    console.log('⚠️  PARTIALLY PASSED - FDA Hybrid Client needs investigation');
  } else {
    console.log('❌ MAJORITY FAILED - FDA Hybrid Client requires fixes');
  }

  return results;
}

runComprehensiveTest().catch(console.error);

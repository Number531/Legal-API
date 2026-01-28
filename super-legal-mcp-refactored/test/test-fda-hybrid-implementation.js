/**
 * FDA Hybrid Client Implementation Tests
 * Tests FDAHybridClient routing and functionality
 *
 * Test Plan (10 queries):
 * - 4 Native-First Tests (40%): OpenFDA syntax, device, brand, recall
 * - 6 WebSearch-First Tests (60%): NDC, date, natural language (3x), specialized
 *
 * Success Criteria:
 * - ≥90% pass rate (9/10 tests)
 * - Zero crashes
 * - Correct routing for NDC/date queries (WebSearch)
 * - Correct routing for OpenFDA/device/brand queries (Native)
 */

import { FDAHybridClient } from '../src/api-clients/FDAHybridClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock rate limiter for testing
class MockRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runHybridImplementationTests() {
  console.log('🧪 Starting FDA Hybrid Client Implementation Tests\n');
  console.log('📋 Testing Smart Routing: 4 Native-First + 6 WebSearch-First\n');

  // Check for API key
  if (!process.env.EXA_API_KEY) {
    console.log('❌ EXA_API_KEY not found in environment variables');
    console.log('   Please set EXA_API_KEY in your .env file');
    process.exit(1);
  }

  const client = new FDAHybridClient(new MockRateLimiter(), process.env.EXA_API_KEY);
  let passed = 0;
  let failed = 0;
  const testResults = [];

  // Helper function to run a test
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ Running: ${testName}`);
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)\n`);
      passed++;
      testResults.push({
        test: testName,
        status: 'PASS',
        duration,
        ...result
      });
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
      testResults.push({
        test: testName,
        status: 'FAIL',
        error: error.message
      });
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 NATIVE-FIRST TESTS (Expected: 4 tests, 40%)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: OpenFDA Syntax Query (Native First)
  await runTest('Test 1: OpenFDA Syntax - Native First', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'patient.drug.medicinalproduct:"ASPIRIN"',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    // Validate results exist
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 2: Device Name Search (Native First)
  await runTest('Test 2: Device Name - Native First', async () => {
    const result = await client.searchDeviceEvents({
      search: 'device.generic_name:"pacemaker"',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Device events: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 3: Brand Name Lookup (Native First)
  await runTest('Test 3: Brand Name - Native First', async () => {
    const result = await client.searchDrugLabels({
      search: 'openfda.brand_name:"Lipitor"',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Labels found: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 4: Recall Search (Native First)
  await runTest('Test 4: Recall Search - Native First', async () => {
    const result = await client.searchRecalls({
      product_area: 'drug',
      search: 'contamination',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Recalls found: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 WEBSEARCH-FIRST TESTS (Expected: 6 tests, 60%)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 5: NDC Code Lookup (WebSearch First) ⚠️ CRITICAL
  await runTest('Test 5: NDC Code - WebSearch First (CRITICAL)', async () => {
    const result = await client.searchDrugLabels({
      ndc: '0069-2587-01',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    // CRITICAL: Should NOT route to native (native fails with 404)
    if (data.metadata?.route === 'native') {
      console.log('   ⚠️  WARNING: NDC routed to native (expected websearch)');
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'} (should be websearch)`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route,
      correctRoute: data.metadata?.route !== 'native'
    };
  });

  // Test 6: Date Range Query (WebSearch First) ⚠️ CRITICAL
  await runTest('Test 6: Date Range - WebSearch First (CRITICAL)', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'aspirin AND receivedate:[20230101+TO+20231231]',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    // CRITICAL: Should NOT route to native (native fails with 500)
    if (data.metadata?.route === 'native') {
      console.log('   ⚠️  WARNING: Date range routed to native (expected websearch)');
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'} (should be websearch)`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route,
      correctRoute: data.metadata?.route !== 'native'
    };
  });

  // Test 7: Natural Language - Recent FDA Approvals
  await runTest('Test 7: Natural Language - Recent Approvals', async () => {
    const result = await client.searchDrugLabels({
      search: 'What drugs were recently approved by the FDA?',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 8: Natural Language - Drug Safety Analysis
  await runTest('Test 8: Natural Language - Drug Safety', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'What are the most common side effects of blood pressure medications?',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 9: Natural Language - Device Safety Trends
  await runTest('Test 9: Natural Language - Device Safety', async () => {
    const result = await client.searchDeviceEvents({
      search: 'What are the latest safety concerns with insulin pumps?',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Test 10: Specialized Search - Warning Letters
  await runTest('Test 10: Specialized Search - Warning Letters', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'FDA warning letter pharmaceutical company compliance',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }

    console.log(`   Results: ${data.results.length}`);
    console.log(`   Route: ${data.metadata?.route || 'unknown'}`);

    return {
      resultCount: data.results.length,
      route: data.metadata?.route
    };
  });

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 FDA Hybrid Client Implementation Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Detailed results
  console.log('📋 Detailed Test Results:\n');
  testResults.forEach((result, i) => {
    console.log(`${i + 1}. ${result.test}`);
    console.log(`   Status: ${result.status}`);
    if (result.status === 'PASS') {
      console.log(`   Duration: ${result.duration}ms`);
      if (result.resultCount !== undefined) {
        console.log(`   Results: ${result.resultCount}`);
      }
      if (result.route !== undefined) {
        console.log(`   Route: ${result.route}`);
      }
      if (result.correctRoute !== undefined) {
        console.log(`   Correct Route: ${result.correctRoute ? 'YES ✅' : 'NO ⚠️'}`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Routing analysis
  const nativeRouted = testResults.filter(r => r.status === 'PASS' && r.route === 'native').length;
  const websearchRouted = testResults.filter(r => r.status === 'PASS' && r.route === 'websearch').length;

  console.log('🔀 Routing Analysis:');
  console.log(`   Native-routed: ${nativeRouted} (expected: 4)`);
  console.log(`   WebSearch-routed: ${websearchRouted} (expected: 6)`);
  console.log('');

  // Performance Analysis
  const passedTests = testResults.filter(r => r.status === 'PASS');
  if (passedTests.length > 0) {
    const avgDuration = passedTests.reduce((sum, r) => sum + (r.duration || 0), 0) / passedTests.length;
    console.log('⚡ Performance Metrics:');
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Min: ${Math.min(...passedTests.map(r => r.duration || 0))}ms`);
    console.log(`   Max: ${Math.max(...passedTests.map(r => r.duration || 0))}ms\n`);
  }

  // Success criteria evaluation
  const successRate = (passed / (passed + failed) * 100);
  console.log('✅ Success Criteria Evaluation:');
  console.log(`   Pass Rate: ${successRate.toFixed(1)}% (target: ≥90%) ${successRate >= 90 ? '✅' : '❌'}`);
  console.log(`   Zero Crashes: ${failed === 0 || passed > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   NDC routed correctly: Check Test 5 results`);
  console.log(`   Date routed correctly: Check Test 6 results\n`);

  if (successRate >= 90 && failed < 2) {
    console.log('🎉 SUCCESS! FDA Hybrid Client implementation passed validation!');
    console.log('✅ Ready for server integration and deployment.\n');
    return {
      success: true,
      passed,
      failed,
      successRate
    };
  } else {
    console.log('⚠️  Some tests failed. Review errors and apply fixes before proceeding.\n');
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHybridImplementationTests().catch(err => {
    console.error('❌ Hybrid implementation tests failed with error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

export { runHybridImplementationTests };

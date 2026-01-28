/**
 * FDAClient (Native OpenFDA API) Live Tests
 * Tests native OpenFDA API functionality with real API calls
 * No API key required (1,000 requests/day limit)
 */

import { FDAClient } from '../src/api-clients/FDAClient.js';
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

async function runNativeFDATests() {
  console.log('🧪 Starting FDAClient (Native OpenFDA API) Live Tests\n');
  console.log('📋 Testing 4 Core OpenFDA Endpoints\n');

  const client = new FDAClient(new MockRateLimiter());
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

  // Test 1: Drug Adverse Events (FAERS) - Structured Query
  await runTest('Drug Adverse Events - OpenFDA Syntax', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'patient.drug.medicinalproduct:"ASPIRIN"',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    // Validate OpenFDA response structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response structure - missing results array');
    }

    if (data.results.length === 0) {
      throw new Error('No results returned for aspirin query');
    }

    // Check for FAERS-specific fields
    const firstResult = data.results[0];
    if (!firstResult.patient) {
      throw new Error('Missing patient data in FAERS response');
    }

    console.log(`   Found ${data.results.length} adverse event reports`);
    console.log(`   API Meta: Total=${data.meta?.results?.total || 'N/A'}`);

    return {
      resultCount: data.results.length,
      totalAvailable: data.meta?.results?.total,
      hasPatientData: !!firstResult.patient,
      hasDrugData: !!firstResult.patient?.drug
    };
  });

  // Test 2: Drug Adverse Events - Date Range Query
  await runTest('Drug Adverse Events - Date Range', async () => {
    const result = await client.searchDrugAdverseEvents({
      search: 'receivedate:[20230101+TO+20231231]',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No results for 2023 date range');
    }

    // Validate date field exists
    const firstResult = data.results[0];
    if (!firstResult.receivedate) {
      throw new Error('Missing receivedate field in response');
    }

    console.log(`   Found ${data.results.length} reports from 2023`);
    console.log(`   Sample date: ${firstResult.receivedate}`);

    return {
      resultCount: data.results.length,
      sampleDate: firstResult.receivedate
    };
  });

  // Test 3: Device Events (MAUDE) - Device Name Query
  await runTest('Device Events (MAUDE) - Device Name', async () => {
    const result = await client.searchDeviceEvents({
      search: 'device.generic_name:"pacemaker"',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No device events found for pacemaker');
    }

    const firstResult = data.results[0];
    if (!firstResult.device) {
      throw new Error('Missing device data in MAUDE response');
    }

    console.log(`   Found ${data.results.length} device events`);
    console.log(`   Device: ${firstResult.device?.[0]?.generic_name || 'N/A'}`);

    return {
      resultCount: data.results.length,
      hasDeviceData: !!firstResult.device,
      sampleDevice: firstResult.device?.[0]?.generic_name
    };
  });

  // Test 4: Drug Labels (SPL) - Brand Name Query
  await runTest('Drug Labels (SPL) - Brand Name', async () => {
    const result = await client.searchDrugLabels({
      search: 'openfda.brand_name:"Lipitor"',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No drug labels found for Lipitor');
    }

    const firstResult = data.results[0];
    if (!firstResult.openfda) {
      throw new Error('Missing openfda data in SPL response');
    }

    console.log(`   Found ${data.results.length} drug labels`);
    console.log(`   Brand: ${firstResult.openfda?.brand_name?.[0] || 'N/A'}`);
    console.log(`   Generic: ${firstResult.openfda?.generic_name?.[0] || 'N/A'}`);

    return {
      resultCount: data.results.length,
      brandName: firstResult.openfda?.brand_name?.[0],
      genericName: firstResult.openfda?.generic_name?.[0],
      hasWarnings: !!firstResult.warnings
    };
  });

  // Test 5: Drug Labels - NDC Code Lookup
  await runTest('Drug Labels - NDC Code Lookup', async () => {
    const result = await client.searchDrugLabels({
      search: 'openfda.product_ndc:"0069-2587"',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No labels found for NDC 0069-2587');
    }

    const firstResult = data.results[0];
    console.log(`   Found ${data.results.length} labels for NDC`);
    console.log(`   Product: ${firstResult.openfda?.brand_name?.[0] || 'N/A'}`);

    return {
      resultCount: data.results.length,
      ndcFound: true,
      productName: firstResult.openfda?.brand_name?.[0]
    };
  });

  // Test 6: Drug Recalls - Contamination
  await runTest('Drug Recalls - Contamination Search', async () => {
    const result = await client.searchRecalls({
      product_area: 'drug',
      search: 'reason_for_recall:"contamination"',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No drug recalls found for contamination');
    }

    const firstResult = data.results[0];
    console.log(`   Found ${data.results.length} drug recalls`);
    console.log(`   Reason: ${firstResult.reason_for_recall?.substring(0, 60) || 'N/A'}...`);
    console.log(`   Classification: ${firstResult.classification || 'N/A'}`);

    return {
      resultCount: data.results.length,
      hasReason: !!firstResult.reason_for_recall,
      hasClassification: !!firstResult.classification,
      sampleClassification: firstResult.classification
    };
  });

  // Test 7: Device Recalls
  await runTest('Device Recalls - General Search', async () => {
    const result = await client.searchRecalls({
      product_area: 'device',
      search: 'voluntary',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    if (!data.results || data.results.length === 0) {
      throw new Error('No device recalls found');
    }

    console.log(`   Found ${data.results.length} device recalls`);

    return {
      resultCount: data.results.length,
      productArea: 'device'
    };
  });

  // Test 8: Empty Parameters Handling
  await runTest('Empty Parameters - Graceful Handling', async () => {
    const result = await client.searchDrugAdverseEvents({});

    const data = JSON.parse(result.content[0].text);

    // Should return results with default parameters
    if (!data.results) {
      throw new Error('Empty parameters not handled gracefully');
    }

    console.log(`   Returned ${data.results.length} results with defaults`);

    return {
      handlesEmpty: true,
      resultCount: data.results.length
    };
  });

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 FDAClient (Native OpenFDA API) Test Results:');
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
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Performance Analysis
  const passedTests = testResults.filter(r => r.status === 'PASS');
  if (passedTests.length > 0) {
    const avgDuration = passedTests.reduce((sum, r) => sum + (r.duration || 0), 0) / passedTests.length;
    console.log('⚡ Performance Metrics:');
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Min: ${Math.min(...passedTests.map(r => r.duration || 0))}ms`);
    console.log(`   Max: ${Math.max(...passedTests.map(r => r.duration || 0))}ms\n`);
  }

  // API Coverage Assessment
  console.log('📊 OpenFDA API Coverage Assessment:\n');
  console.log('✅ Tested Endpoints:');
  console.log('   1. /drug/event.json (FAERS) - Drug Adverse Events');
  console.log('   2. /device/event.json (MAUDE) - Device Events');
  console.log('   3. /drug/label.json (SPL) - Drug Labeling');
  console.log('   4. /drug/enforcement.json - Drug Recalls');
  console.log('   5. /device/enforcement.json - Device Recalls\n');

  console.log('✅ Query Types Validated:');
  console.log('   - OpenFDA field syntax (patient.drug.medicinalproduct:)');
  console.log('   - Date range queries ([20230101+TO+20231231])');
  console.log('   - Brand name lookups (openfda.brand_name:)');
  console.log('   - NDC code lookups (openfda.product_ndc:)');
  console.log('   - Text search (reason_for_recall:)');
  console.log('   - Empty parameter handling\n');

  if (failed === 0) {
    console.log('🎉 All native OpenFDA API tests passed!');
    console.log('✅ FDAClient is fully functional and ready for hybrid implementation.\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors before proceeding to hybrid implementation.\n');
    process.exit(1);
  }

  return {
    passed,
    failed,
    successRate: (passed / (passed + failed) * 100).toFixed(1),
    testResults
  };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runNativeFDATests().catch(err => {
    console.error('❌ Native FDA tests failed with error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

export { runNativeFDATests };

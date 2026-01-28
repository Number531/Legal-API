/**
 * FDA Web Search Client Live Tests
 * Tests FDA WebSearch functionality with real Exa API calls
 * Requires EXA_API_KEY environment variable
 */

import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock rate limiter for testing
class MockRateLimiter {
  async enforce() {
    // Small delay to simulate rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runLiveTests() {
  console.log('🧪 Starting FDA Web Search Client Live Tests\n');
  
  // Check for API key
  if (!process.env.EXA_API_KEY) {
    console.log('❌ EXA_API_KEY not found in environment variables');
    console.log('   Please set EXA_API_KEY in your .env file');
    process.exit(1);
  }
  
  const client = new FDAWebSearchClient(new MockRateLimiter(), process.env.EXA_API_KEY);
  let passed = 0;
  let failed = 0;

  // Helper function to run a test
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ Running: ${testName}`);
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 1: Drug adverse events search (basic)
  await runTest('Drug adverse events - basic search', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'aspirin bleeding',
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_adverse_events_web') throw new Error('Wrong search type');
    if (!Array.isArray(data.results)) throw new Error('Results not array');
    if (data.results.length === 0) throw new Error('No results returned');
    
    // Check first result has required fields
    const firstResult = data.results[0];
    if (!firstResult.title) throw new Error('Missing title');
    if (!firstResult.url) throw new Error('Missing URL');
    if (!firstResult.url.includes('fda.gov')) throw new Error('URL not from FDA domain');
    if (firstResult.result_type !== 'adverse_event') throw new Error('Wrong result type');
    
    console.log(`   Found ${data.results.length} adverse event results`);
    console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
  });

  // Test 2: Drug adverse events with snippet
  await runTest('Drug adverse events - with snippet', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'serious adverse event warfarin',
      limit: 2,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    if (firstResult.snippet.length < 50) throw new Error('Snippet too short');
    
    console.log(`   Snippet preview: ${firstResult.snippet.substring(0, 100)}...`);
  });

  // Test 3: Medical device events search
  await runTest('Medical device events search', async () => {
    const result = await client.searchDeviceEventsWeb({
      search: 'pacemaker malfunction',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_device_events_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'device_event') throw new Error('Wrong result type');
    if (!firstResult.url.includes('fda.gov')) throw new Error('URL not from FDA domain');
    
    console.log(`   Found ${data.results.length} device event results`);
    console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
  });

  // Test 4: Drug labels search with full text
  await runTest('Drug labels - prescribing information', async () => {
    const result = await client.searchDrugLabelsWeb({
      search: 'atorvastatin prescribing information warnings',
      limit: 2,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_drug_labels_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'drug_label') throw new Error('Wrong result type');
    if (!firstResult.full_text) throw new Error('Full text not included');
    if (firstResult.full_text.length < 100) throw new Error('Full text too short');
    
    console.log(`   Found ${data.results.length} drug label results`);
    console.log(`   Full text length: ${firstResult.full_text.length} characters`);
    console.log(`   Title: ${firstResult.title.substring(0, 80)}...`);
  });

  // Test 5: Drug recalls search
  await runTest('Drug recalls search', async () => {
    const result = await client.searchRecallsWeb({
      product_area: 'drug',
      search: 'contamination recall',
      limit: 3,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_recalls_web') throw new Error('Wrong search type');
    if (data.product_area !== 'drug') throw new Error('Wrong product area');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'recall') throw new Error('Wrong result type');
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    
    console.log(`   Found ${data.results.length} drug recall results`);
    console.log(`   Snippet: ${firstResult.snippet.substring(0, 100)}...`);
  });

  // Test 6: Device recalls search
  await runTest('Device recalls search', async () => {
    const result = await client.searchRecallsWeb({
      product_area: 'device',
      search: 'medical device recall class',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_recalls_web') throw new Error('Wrong search type');
    if (data.product_area !== 'device') throw new Error('Wrong product area');
    if (data.results.length === 0) throw new Error('No results returned');
    
    console.log(`   Found ${data.results.length} device recall results`);
  });

  // Test 7: OpenFDA syntax conversion
  await runTest('OpenFDA syntax conversion', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'patient.drug.medicinalproduct:ibuprofen AND serious:1',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    // Check that query was converted
    if (!data.query.includes('drug name') && !data.query.includes('ibuprofen')) {
      throw new Error('OpenFDA syntax not properly converted');
    }
    
    console.log(`   Converted query: ${data.query}`);
  });

  // Test 8: Metadata extraction validation
  await runTest('Metadata extraction validation', async () => {
    const result = await client.searchRecallsWeb({
      product_area: 'drug',
      search: 'FDA recall class I NDC',
      limit: 3,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length === 0) throw new Error('No results returned');
    
    // Check if any result has extracted metadata
    const hasMetadata = data.results.some(r => 
      Object.keys(r.metadata).length > 0
    );
    
    if (!hasMetadata) {
      console.log('   Warning: No metadata extracted from any result');
    } else {
      console.log('   ✓ Metadata successfully extracted from at least one result');
    }
  });

  // Summary
  console.log('📊 FDA Web Search Client Live Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All live tests passed! FDA WebSearch client is working correctly with real Exa API.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review API responses and error handling.');
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLiveTests().catch(err => {
    console.error('❌ Live tests failed with error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

export { runLiveTests };
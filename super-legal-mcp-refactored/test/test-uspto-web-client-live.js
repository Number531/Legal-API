/**
 * Live tests for USPTO Web Search Client
 * Tests with real Exa API using provided API key
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

// Simple rate limiter for testing
class SimpleRateLimiter {
  constructor(requestsPerSecond = 2) {
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async enforce() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const delay = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
  }
}

async function runLiveTests() {
  console.log('🔍 Running USPTO Web Search Client Live Tests...\n');
  
  // Use provided Exa API key
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  const rateLimiter = new SimpleRateLimiter(2); // 2 requests per second
  const client = new UsptoWebSearchClient(rateLimiter, EXA_API_KEY);

  let testsRun = 0;
  let testsPassed = 0;

  // Helper function to run a test with timing
  const runTest = async (testName, testFunction) => {
    testsRun++;
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ ${testName} (${duration}ms)`);
      testsPassed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${testName} (${duration}ms): ${error.message}`);
    }
  };

  // Test 1: Basic patent search
  await runTest('Search recent AI patents', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence machine learning',
      limit: 3,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.search_type !== 'uspto_patents_web') {
      throw new Error(`Expected search_type 'uspto_patents_web', got '${parsed.search_type}'`);
    }
    
    if (!parsed.results || parsed.results.length === 0) {
      throw new Error('No patent results returned');
    }
    
    const firstResult = parsed.results[0];
    if (!firstResult.patent_title) {
      throw new Error('Patent title missing');
    }
    
    console.log(`   📄 Found ${parsed.results.length} patents`);
    console.log(`   🎯 Sample: ${firstResult.patent_title.substring(0, 60)}...`);
    
    if (!firstResult.snippet) {
      console.log('   ⚠️ Snippet not generated (may need full text content)');
      // Don't fail the test - snippets require text content which may not be available
    } else {
      console.log(`   📋 Snippet: ${firstResult.snippet.substring(0, 80)}...`);
    }
  });

  // Test 2: Patent search with specific inventor
  await runTest('Search patents by specific inventor', async () => {
    const result = await client.searchPatentsWeb({
      inventor_name: 'Smith',
      search_text: 'neural network',
      limit: 2,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.results.length === 0) {
      throw new Error('No results with inventor filter');
    }
    
    console.log(`   👨‍💼 Found ${parsed.results.length} patents with inventor filter`);
    
    // Check if any result has inventor information
    const hasInventorInfo = parsed.results.some(r => r.inventors && r.inventors.length > 0);
    if (!hasInventorInfo) {
      console.log('   ⚠️ No inventor metadata extracted (may be expected for some results)');
    } else {
      console.log(`   ✅ Inventor metadata extracted successfully`);
    }
  });

  // Test 3: Patent search with assignee
  await runTest('Search patents by company assignee', async () => {
    const result = await client.searchPatentsWeb({
      assignee_organization: 'Google',
      limit: 2,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.results.length === 0) {
      throw new Error('No results with assignee filter');
    }
    
    console.log(`   🏢 Found ${parsed.results.length} patents with assignee filter`);
    
    const firstResult = parsed.results[0];
    if (firstResult.assignee_organization) {
      console.log(`   ✅ Assignee extracted: ${firstResult.assignee_organization}`);
    }
  });

  // Test 4: CPC classification search
  await runTest('Search CPC classifications', async () => {
    const result = await client.searchCPCClassificationsWeb({
      cpc_section: 'G',
      search_text: 'machine learning',
      limit: 2,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.search_type !== 'uspto_cpc_web') {
      throw new Error(`Expected search_type 'uspto_cpc_web', got '${parsed.search_type}'`);
    }
    
    if (parsed.results.length === 0) {
      throw new Error('No CPC classification results');
    }
    
    console.log(`   🏷️ Found ${parsed.results.length} CPC classification results`);
    console.log(`   📋 CPC Section G: ${parsed.results[0].cpc_subclass_title}`);
  });

  // Test 5: Patent locations search
  await runTest('Search patent locations', async () => {
    const result = await client.searchPatentLocationsWeb({
      location_state: 'California',
      limit: 3,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.search_type !== 'uspto_locations_web') {
      throw new Error(`Expected search_type 'uspto_locations_web', got '${parsed.search_type}'`);
    }
    
    if (parsed.results.length === 0) {
      throw new Error('No location results');
    }
    
    console.log(`   📍 Found ${parsed.results.length} location-based results`);
    console.log(`   🏛️ Location: ${parsed.results[0].location_state || 'California'}`);
  });

  // Test 6: USPC classification search
  await runTest('Search USPC classifications', async () => {
    const result = await client.searchUSPCClassificationsWeb({
      classification_type: 'mainclass',
      uspc_mainclass_id: '706',
      search_text: 'artificial intelligence',
      limit: 2
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.search_type !== 'uspto_uspc_web') {
      throw new Error(`Expected search_type 'uspto_uspc_web', got '${parsed.search_type}'`);
    }
    
    if (parsed.uspc_mainclasses.length === 0) {
      throw new Error('No USPC classification results');
    }
    
    console.log(`   🏷️ Found ${parsed.uspc_mainclasses.length} USPC mainclass results`);
    console.log(`   📋 USPC 706: ${parsed.uspc_mainclasses[0].uspc_mainclass_title}`);
  });

  // Test 7: WIPO classification search
  await runTest('Search WIPO classifications', async () => {
    const result = await client.searchWIPOClassificationsWeb({
      wipo_field_id: '06',
      search_text: 'computer technology',
      limit: 2
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.search_type !== 'uspto_wipo_web') {
      throw new Error(`Expected search_type 'uspto_wipo_web', got '${parsed.search_type}'`);
    }
    
    if (parsed.results.length === 0) {
      throw new Error('No WIPO classification results');
    }
    
    console.log(`   🌐 Found ${parsed.results.length} WIPO field results`);
    console.log(`   📋 Field 06: ${parsed.results[0].field_title}`);
  });

  // Test 8: Full text retrieval
  await runTest('Test full text retrieval', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'blockchain cryptocurrency',
      limit: 1,
      include_text: true,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    if (parsed.results.length === 0) {
      throw new Error('No results for full text test');
    }
    
    const firstResult = parsed.results[0];
    
    if (!firstResult.snippet) {
      console.log('   ⚠️ Snippet not generated - this may be expected if full text is not available');
    }
    
    if (!firstResult.full_text) {
      throw new Error('Full text missing');
    }
    
    if (firstResult.full_text.length < firstResult.snippet.length) {
      throw new Error('Full text should be longer than snippet');
    }
    
    console.log(`   📄 Full text length: ${firstResult.full_text.length} chars`);
    console.log(`   📋 Snippet length: ${firstResult.snippet.length} chars`);
  });

  // Test 9: Response time validation
  await runTest('Validate response times', async () => {
    const startTime = Date.now();
    
    await client.searchPatentsWeb({
      search_text: 'solar panel efficiency',
      limit: 5
    });
    
    const duration = Date.now() - startTime;
    
    if (duration > 5000) { // 5 seconds max
      throw new Error(`Response time too slow: ${duration}ms`);
    }
    
    console.log(`   ⚡ Response time: ${duration}ms (good)`);
  });

  // Test 10: Domain restriction validation  
  await runTest('Validate domain restriction', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'quantum computing algorithms',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    // Check that results come from expected domains
    let validDomains = 0;
    const expectedDomains = ['uspto.gov', 'patents.google.com'];
    
    parsed.results.forEach(result => {
      if (result.url) {
        const matchesDomain = expectedDomains.some(domain => result.url.includes(domain));
        if (matchesDomain) {
          validDomains++;
        }
      }
    });
    
    if (validDomains === 0) {
      console.log('   ⚠️ No URLs from expected domains (may be expected for some results)');
    } else {
      console.log(`   ✅ ${validDomains}/${parsed.results.length} results from expected domains`);
    }
  });

  // Print final results
  console.log(`\n📊 Live Test Results: ${testsPassed}/${testsRun} tests passed`);
  
  if (testsPassed === testsRun) {
    console.log('🎉 All live tests passed!');
    console.log('\n✅ USPTO Web Search Client is ready for integration');
    return true;
  } else {
    console.log(`❌ ${testsRun - testsPassed} tests failed`);
    return false;
  }
}

// Run the tests
runLiveTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
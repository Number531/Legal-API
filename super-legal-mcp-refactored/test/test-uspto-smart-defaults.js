/**
 * Test USPTO WebSearch Smart Default Limits
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

class MockRateLimiter {
  async enforce() {
    // No delay for testing
  }
}

// Mock the Exa API calls
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url === 'https://api.exa.ai/search') {
    const body = JSON.parse(options.body);
    
    // Return mock search results based on numResults
    return {
      ok: true,
      json: async () => ({
        results: new Array(body.numResults).fill(0).map((_, i) => ({
          id: `result-${i}`,
          title: `Patent ${i + 1}`,
          url: `https://patents.google.com/patent/US123456${i}`,
          publishedDate: '2023-01-01'
        }))
      })
    };
  }
  
  if (url === 'https://api.exa.ai/contents') {
    const body = JSON.parse(options.body);
    
    // Return mock contents
    return {
      ok: true,
      json: async () => ({
        results: body.ids.map(id => ({
          id,
          text: `Full text content for ${id}. This is a long patent document with detailed technical information...`
        }))
      })
    };
  }
  
  return originalFetch(url, options);
};

async function testSmartDefaults() {
  console.log('🧪 Testing USPTO WebSearch Smart Default Limits...\n');
  
  const client = new UsptoWebSearchClient(new MockRateLimiter(), 'test-key');
  let passed = 0;
  let failed = 0;

  // Test helper function
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ ${testName}`);
      await testFn();
      console.log(`✅ PASSED\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  // Test 1: Full text should default to 3
  await runTest('Full text requests default to 3 results', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      include_text: true
      // No limit specified - should default to 3
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 3) {
      throw new Error(`Expected 3 results, got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (expected 3)`);
  });

  // Test 2: Snippet requests should default to 10
  await runTest('Snippet requests default to 10 results', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      include_snippet: true
      // No limit specified - should default to 10
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 10) {
      throw new Error(`Expected 10 results, got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (expected 10)`);
  });

  // Test 3: Metadata only should default to 15
  await runTest('Metadata-only requests default to 15 results', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence'
      // No include_text or include_snippet - should default to 15
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 15) {
      throw new Error(`Expected 15 results, got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (expected 15)`);
  });

  // Test 4: Explicit limit should override defaults
  await runTest('Explicit limit overrides smart defaults', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      include_text: true,
      limit: 7  // Explicit limit should be used
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 7) {
      throw new Error(`Expected 7 results, got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (explicit limit respected)`);
  });

  // Test 5: Test other tool methods have smart defaults
  await runTest('Other tools also have smart defaults', async () => {
    // Test CPC Classifications
    const result = await client.searchCPCClassificationsWeb({
      cpc_section: 'G',
      include_text: true
      // Should default to 3
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 3) {
      throw new Error(`Expected 3 results for CPC search, got ${data.results.length}`);
    }
    console.log(`   ✓ CPC Classifications got ${data.results.length} results (expected 3)`);
  });

  // Test 6: Both snippet and text - text takes precedence
  await runTest('Full text precedence over snippet', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      include_snippet: true,
      include_text: true  // Both set, text should take precedence
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 3) {
      throw new Error(`Expected 3 results (text precedence), got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (full text precedence)`);
  });

  // Test 7: Validation still works
  await runTest('Validation still enforces maximum', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      limit: 200  // Over maximum, should be capped at 100
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length !== 100) {
      throw new Error(`Expected 100 results (validation cap), got ${data.results.length}`);
    }
    console.log(`   ✓ Got ${data.results.length} results (validation enforced maximum)`);
  });

  // Restore original fetch
  global.fetch = originalFetch;

  // Summary
  console.log('📊 Smart Defaults Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All smart default tests passed! USPTO WebSearch now has intelligent context-aware limits.');
  } else {
    console.log('\n⚠️ Some tests failed. Check implementation.');
    process.exit(1);
  }
}

testSmartDefaults().catch(err => {
  console.error('❌ Smart defaults test failed:', err);
  process.exit(1);
});
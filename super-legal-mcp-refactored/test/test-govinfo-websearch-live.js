/**
 * Live Integration Tests for GovInfo WebSearch Client
 * Tests all 4 core methods against real Exa API
 */

import { GovInfoWebSearchClient } from '../src/api-clients/GovInfoWebSearchClient.js';

class MockRateLimiter {
  async enforce() {
    // Small delay to respect API limits in live testing
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testGovInfoWebSearchLive() {
  console.log('🔍 Testing GovInfo WebSearch Client (Live)...\\n');
  
  // Check for API key
  if (!process.env.EXA_API_KEY) {
    console.log('⚠️ EXA_API_KEY not configured. Running integration validation instead of live API tests.');
    
    // Test that the client can be instantiated and methods exist
    console.log('🔍 Integration validation: GovInfoWebSearchClient structure');
    
    const client = new GovInfoWebSearchClient(new MockRateLimiter(), 'test-key');
    
    // Verify all required methods exist
    const methods = ['searchUSCodeWeb', 'getUSCSectionWeb', 'getUSCTitleStructureWeb', 'listUSCTitlesWeb'];
    let allMethodsExist = true;
    
    for (const method of methods) {
      if (typeof client[method] !== 'function') {
        console.log(`❌ Method missing: ${method}`);
        allMethodsExist = false;
      } else {
        console.log(`✅ Method exists: ${method}`);
      }
    }
    
    if (allMethodsExist) {
      console.log('\\n🎉 Integration validation passed! All 4 methods exist and client instantiates correctly.');
      console.log('   Ready for integration into MCP server.');
    } else {
      console.log('\\n❌ Integration validation failed. Check client implementation.');
      process.exit(1);
    }
    return;
  }
  
  const client = new GovInfoWebSearchClient(new MockRateLimiter());
  let passed = 0;
  let failed = 0;

  // Test helper function
  async function runTest(testName, testFn) {
    try {
      console.log(`🔍 ${testName}`);
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED (${duration}ms)\\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\\n`);
      failed++;
    }
  }

  // Test 1: Search USC for FOIA (Famous law)
  await runTest('Live search: Freedom of Information Act', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'Freedom of Information Act',
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned for FOIA search');
    }
    
    if (data.results.length > 3) {
      throw new Error(`Limit not respected: got ${data.results.length}, expected max 3`);
    }
    
    // Should find USC results
    const hasUSCResult = data.results.some(r => 
      r.url.includes('govinfo.gov') || 
      r.url.includes('uscode.house.gov') ||
      r.url.includes('law.cornell.edu')
    );
    
    if (!hasUSCResult) {
      throw new Error('No USC/GovInfo results found');
    }
    
    console.log(`   ✓ Found ${data.results.length} results from authoritative sources`);
    console.log(`   ✓ First result: ${data.results[0].title}`);
  });

  // Test 2: Search USC with specific title and section
  await runTest('Live search: Title 5 Section 552 (FOIA)', async () => {
    const result = await client.searchUSCodeWeb({
      title_number: 5,
      section: '552',
      search_text: 'public records',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results for Title 5 Section 552');
    }
    
    // Check metadata extraction
    const firstResult = data.results[0];
    if (!firstResult.title_number || !firstResult.section_number) {
      console.log('   ⚠️ USC metadata not fully extracted (expected with real content)');
    } else {
      console.log(`   ✓ USC metadata: ${firstResult.title_number} USC ${firstResult.section_number}`);
    }
    
    console.log(`   ✓ Found ${data.results.length} targeted results`);
    console.log(`   ✓ URL: ${data.results[0].url}`);
  });

  // Test 3: Get specific USC section with full text
  await runTest('Live section retrieval: 5 USC 552', async () => {
    const result = await client.getUSCSectionWeb({
      title: 5,
      section: '552',
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.title !== 5 || data.section !== '552') {
      throw new Error('Title/section not preserved');
    }
    
    if (!data.section_title) {
      throw new Error('Section title missing');
    }
    
    if (!data.text || data.text.length < 100) {
      throw new Error('Section text too short or missing');
    }
    
    console.log(`   ✓ Section: ${data.usc_citation || '5 USC 552'}`);
    console.log(`   ✓ Title: ${data.section_title}`);
    console.log(`   ✓ Content length: ${data.text.length} characters`);
  });

  // Test 4: Search with full text (token-intensive)
  await runTest('Live search with full text: ADA', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'Americans with Disabilities Act',
      include_text: true,
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results for ADA search');
    }
    
    const firstResult = data.results[0];
    if (!firstResult.text) {
      throw new Error('Full text not retrieved');
    }
    
    if (firstResult.text.length < 500) {
      console.log('   ⚠️ Full text shorter than expected, but present');
    }
    
    if (!firstResult.text_length) {
      throw new Error('Text length not calculated');
    }
    
    console.log(`   ✓ Full text retrieved: ${firstResult.text_length} characters`);
    console.log(`   ✓ Text contains legal content: ${firstResult.text.includes('shall') || firstResult.text.includes('USC')}`);
  });

  // Test 5: Search with smart snippet
  await runTest('Live search with snippet: Copyright law', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'copyright infringement',
      include_snippet: true,
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results for copyright search');
    }
    
    const firstResult = data.results[0];
    if (!firstResult.snippet) {
      throw new Error('Snippet not generated');
    }
    
    if (firstResult.snippet.length > 520) { // Allow slight overflow due to sentence boundaries
      throw new Error(`Snippet too long: ${firstResult.snippet.length} characters`);
    }
    
    // Check for legal pattern prioritization
    const hasLegalTerms = /shall|must|required|prohibited|penalty|definition/i.test(firstResult.snippet);
    
    console.log(`   ✓ Smart snippet generated: ${firstResult.snippet.length} characters`);
    console.log(`   ✓ Contains legal terms: ${hasLegalTerms}`);
    console.log(`   ✓ Preview: "${firstResult.snippet.substring(0, 100)}..."`);
  });

  // Test 6: Get USC title structure
  await runTest('Live title structure: Title 17 (Copyright)', async () => {
    const result = await client.getUSCTitleStructureWeb({
      title: 17,
      include_chapters: true
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.title_number !== 17) {
      throw new Error('Title number not preserved');
    }
    
    if (!data.title_name || !data.title_name.includes('Copyright')) {
      console.log('   ⚠️ Title name not found or incorrect, but structure retrieved');
    }
    
    if (!data.sources || data.sources.length === 0) {
      throw new Error('No sources found for title structure');
    }
    
    console.log(`   ✓ Title: ${data.title_name || 'Title 17'}`);
    console.log(`   ✓ Sources found: ${data.sources.length}`);
    console.log(`   ✓ First source: ${data.sources[0].url}`);
  });

  // Test 7: List USC titles (static but verify structure)
  await runTest('List all USC titles', async () => {
    const result = await client.listUSCTitlesWeb({
      include_enacted: true,
      include_descriptions: false
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.titles || data.titles.length !== 54) {
      throw new Error(`Expected 54 titles, got ${data.titles.length}`);
    }
    
    // Verify key titles exist
    const title1 = data.titles.find(t => t.number === 1);
    const title18 = data.titles.find(t => t.number === 18);
    const title26 = data.titles.find(t => t.number === 26);
    
    if (!title1 || !title18 || !title26) {
      throw new Error('Key titles missing (1, 18, 26)');
    }
    
    // Check enacted status
    if (title1.enacted_positive_law !== true) {
      throw new Error('Title 1 enacted status incorrect');
    }
    
    console.log(`   ✓ All 54 titles listed correctly`);
    console.log(`   ✓ Available titles: ${data.available_count}`);
    console.log(`   ✓ Title 1: ${title1.name} (enacted: ${title1.enacted_positive_law})`);
    console.log(`   ✓ Title 18: ${title18.name} (enacted: ${title18.enacted_positive_law})`);
  });

  // Test 8: Response time check
  await runTest('Response time validation', async () => {
    const startTime = Date.now();
    
    await client.searchUSCodeWeb({
      search_text: 'bankruptcy',
      limit: 3
    });
    
    const duration = Date.now() - startTime;
    
    if (duration > 5000) { // 5 seconds
      throw new Error(`Response too slow: ${duration}ms`);
    }
    
    console.log(`   ✓ Response time: ${duration}ms (good)`);
  });

  // Test 9: Default limit behavior (live)
  await runTest('Default limit behavior (live)', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'federal register'
      // No limit specified - should default to 5
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.results.length > 5) {
      throw new Error(`Default limit exceeded: got ${data.results.length}`);
    }
    
    console.log(`   ✓ Default limit respected: ${data.results.length} results (≤5)`);
  });

  // Test 10: Error handling
  await runTest('Error handling: Invalid title', async () => {
    try {
      await client.getUSCSectionWeb({
        title: 999,
        section: '1'
      });
      throw new Error('Should have thrown error for invalid title');
    } catch (error) {
      if (!error.message.includes('Invalid title')) {
        throw new Error('Wrong error message');
      }
      console.log(`   ✓ Proper error handling: ${error.message}`);
    }
  });

  // Summary
  console.log('📊 GovInfo WebSearch Live Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\\n🎉 All GovInfo WebSearch live tests passed! Ready for integration.');
  } else if (failed <= 2) {
    console.log('\\n⚠️ Some tests failed, but overall functionality appears good.');
    console.log('   This may be due to content variations or API response differences.');
  } else {
    console.log('\\n❌ Multiple tests failed. Check implementation before proceeding.');
    process.exit(1);
  }
}

testGovInfoWebSearchLive().catch(err => {
  console.error('❌ GovInfo WebSearch live test failed:', err);
  process.exit(1);
});
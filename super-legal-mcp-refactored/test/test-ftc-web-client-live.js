/**
 * Live Tests for FTCWebSearchClient
 * Tests with real Exa API calls
 */

import { FTCWebSearchClient } from '../src/api-clients/FTCWebSearchClient.js';

// Rate limiter for Exa API
const rateLimiter = {
  acquire: async () => {
    // Simple rate limiting - wait 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};

/**
 * Test helper functions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Main live test runner
 */
async function runLiveTests(exaApiKey) {
  if (!exaApiKey) {
    console.log('❌ EXA_API_KEY is required for live tests');
    return false;
  }

  const client = new FTCWebSearchClient(rateLimiter, exaApiKey);
  
  console.log('🧪 Running FTC WebSearch Client Live Tests...\n');
  console.log('⚠️  Using real Exa API - this will consume API quota\n');
  
  let testCount = 0;
  let passCount = 0;
  
  // Test 1: HSR Terminations - Basic Search (Metadata Only)
  try {
    testCount++;
    console.log('Test 1: HSR Terminations - Basic Search (Metadata Only)');
    
    const result = await client.searchHSRTerminationsWeb({
      limit: 3
    });
    
    assert(result.content && result.content[0], 'Should return content array');
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.search_type === 'ftc_hsr_terminations_web', 'Should have correct search type');
    assert(parsed.results.length > 0, 'Should return HSR results');
    assert(parsed.query.includes('site:ftc.gov'), 'Query should include FTC site restriction');
    assert(parsed.query.includes('Hart-Scott-Rodino'), 'Query should include HSR terms');
    
    // Check first result structure
    const firstResult = parsed.results[0];
    assert(firstResult.title, 'Should have title');
    assert(firstResult.url && firstResult.url.includes('ftc.gov'), 'Should have FTC URL');
    assert(!firstResult.snippet, 'Should not have snippet in basic search');
    assert(!firstResult.full_text, 'Should not have full text in basic search');
    
    console.log(`✅ PASS: Found ${parsed.results.length} HSR results\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 2: HSR Terminations - With Snippets
  try {
    testCount++;
    console.log('Test 2: HSR Terminations - With Snippets');
    
    const result = await client.searchHSRTerminationsWeb({
      limit: 2,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results.length > 0, 'Should return results');
    
    const firstResult = parsed.results[0];
    assert(firstResult.snippet, 'Should include snippet');
    assert(firstResult.snippet.length > 50, 'Snippet should be substantial');
    assert(firstResult.snippet.length <= 500, 'Snippet should be within limit');
    assert(!firstResult.full_text, 'Should not include full text');
    
    console.log(`✅ PASS: Snippet length: ${firstResult.snippet.length} chars\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 3: HSR Terminations - With Full Text
  try {
    testCount++;
    console.log('Test 3: HSR Terminations - With Full Text');
    
    const result = await client.searchHSRTerminationsWeb({
      limit: 1,
      include_text: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results.length > 0, 'Should return results');
    
    const firstResult = parsed.results[0];
    assert(firstResult.full_text, 'Should include full text');
    assert(firstResult.full_text.length > 500, 'Full text should be substantial');
    
    console.log(`✅ PASS: Full text length: ${firstResult.full_text.length} chars\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 4: Enforcement Actions - Basic Search
  try {
    testCount++;
    console.log('Test 4: Enforcement Actions - Basic Search');
    
    const result = await client.searchEnforcementActionsWeb({
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.search_type === 'ftc_enforcement_actions_web', 'Should have correct search type');
    assert(parsed.results.length > 0, 'Should return enforcement results');
    assert(parsed.query.includes('site:ftc.gov'), 'Query should include FTC site restriction');
    assert(parsed.query.includes('enforcement'), 'Query should include enforcement term');
    
    const firstResult = parsed.results[0];
    assert(firstResult.title, 'Should have title');
    assert(firstResult.url && firstResult.url.includes('ftc.gov'), 'Should have FTC URL');
    
    console.log(`✅ PASS: Found ${parsed.results.length} enforcement results\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 5: Enforcement Actions - With Company Filter
  try {
    testCount++;
    console.log('Test 5: Enforcement Actions - With Company Filter');
    
    const result = await client.searchEnforcementActionsWeb({
      defendant_name: 'Facebook',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.query.includes('"Facebook"'), 'Query should include company name');
    
    console.log(`✅ PASS: Company filter applied - ${parsed.results.length} results\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 6: Enforcement Actions - With Date Range
  try {
    testCount++;
    console.log('Test 6: Enforcement Actions - With Date Range');
    
    const result = await client.searchEnforcementActionsWeb({
      date_filed_after: '2020-01-01',
      date_filed_before: '2023-12-31',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.query.includes('2020-01-01..2023-12-31'), 'Query should include date range');
    
    console.log(`✅ PASS: Date range filter applied - ${parsed.results.length} results\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 7: Enforcement Actions - With Snippets
  try {
    testCount++;
    console.log('Test 7: Enforcement Actions - With Snippets');
    
    const result = await client.searchEnforcementActionsWeb({
      limit: 2,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results.length > 0, 'Should return results');
    
    const firstResult = parsed.results[0];
    assert(firstResult.snippet, 'Should include snippet');
    assert(firstResult.snippet.length > 50, 'Snippet should be substantial');
    assert(firstResult.snippet.length <= 500, 'Snippet should be within limit');
    
    console.log(`✅ PASS: Enforcement snippet length: ${firstResult.snippet.length} chars\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 8: Response Time Performance
  try {
    testCount++;
    console.log('Test 8: Response Time Performance');
    
    const startTime = Date.now();
    await client.searchHSRTerminationsWeb({ limit: 2 });
    const responseTime = Date.now() - startTime;
    
    assert(responseTime < 5000, 'Response should be under 5 seconds');
    
    console.log(`✅ PASS: Response time: ${responseTime}ms\n`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test Summary
  console.log('='.repeat(50));
  console.log(`📊 FTC WebSearch Client Live Test Results:`);
  console.log(`✅ Passed: ${passCount}/${testCount}`);
  console.log(`❌ Failed: ${testCount - passCount}/${testCount}`);
  console.log(`📈 Success Rate: ${Math.round((passCount/testCount) * 100)}%`);
  
  if (passCount === testCount) {
    console.log(`\n🎉 ALL LIVE TESTS PASSED! FTCWebSearchClient is ready for integration.`);
    return true;
  } else if (passCount >= Math.ceil(testCount * 0.75)) {
    console.log(`\n✅ Most tests passed. FTCWebSearchClient is functional but may need minor adjustments.`);
    return true;
  } else {
    console.log(`\n⚠️  Many tests failed. Please review and fix issues.`);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiKey = process.argv[2] || process.env.EXA_API_KEY;
  runLiveTests(apiKey)
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runLiveTests };
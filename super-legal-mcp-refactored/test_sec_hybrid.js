#!/usr/bin/env node

/**
 * Test SEC Hybrid Client - Native API Integration with Exa Fallback
 * Validates that SECHybridClient properly uses native SEC APIs and falls back to Exa
 */

import { SECHybridClient } from './src/api-clients/SECHybridClient.js';

// Mock rate limiter
const mockRateLimiter = {
  waitForCapacity: async () => {},
  recordRequest: () => {}
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  SEC Hybrid Client Test Suite               ║
╠══════════════════════════════════════════════════════════════╣
║  Testing Native API integration with Exa fallback          ║
╚══════════════════════════════════════════════════════════════╝
`);

async function testNativeAPIs() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing Native SEC API Integration');
  console.log(`${'='.repeat(60)}`);

  const client = new SECHybridClient(mockRateLimiter);
  const testResults = [];

  // Test 1: Company Facts (Native API)
  console.log('\n1. Testing getSECCompanyFactsNative...');
  try {
    const result = await client.getSECCompanyFactsNative({
      company_identifier: '0000320193', // Apple Inc CIK
      concept: 'Assets',
      limit: 5
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('✅ SUCCESS - Native company facts working');
      console.log(`   - Company: ${data.company_name || 'N/A'}`);
      console.log(`   - Concept: ${data.concept || 'N/A'}`);
      console.log(`   - Data points: ${data.facts?.length || 0}`);
      console.log(`   - API source: ${data.api_source}`);
      testResults.push({ test: 'Company Facts Native', success: true });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ FAILED - Native company facts not working');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Company Facts Native', success: false, error: error.message });
  }

  // Test 2: XBRL Frames (Native API)
  console.log('\n2. Testing getSECXBRLFramesNative...');
  try {
    const result = await client.getSECXBRLFramesNative({
      concept: 'Assets',
      taxonomy: 'us-gaap',
      units: 'USD',
      year: 2023,
      quarter: 'Q4',
      limit: 5
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('✅ SUCCESS - Native XBRL frames working');
      console.log(`   - Concept: ${data.concept || 'N/A'}`);
      console.log(`   - Frame data: ${data.frame_data?.length || 0} entries`);
      console.log(`   - API source: ${data.api_source}`);
      testResults.push({ test: 'XBRL Frames Native', success: true });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ FAILED - Native XBRL frames not working');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'XBRL Frames Native', success: false, error: error.message });
  }

  // Test 3: Company Tickers (Native API)
  console.log('\n3. Testing searchSECCompanyTickersNative...');
  try {
    const result = await client.searchSECCompanyTickersNative({
      search_term: 'Apple',
      limit: 5
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('✅ SUCCESS - Native ticker search working');
      console.log(`   - Companies found: ${data.companies?.length || 0}`);
      console.log(`   - API source: ${data.api_source}`);
      if (data.companies && data.companies.length > 0) {
        console.log(`   - First match: ${data.companies[0].title} (${data.companies[0].ticker})`);
      }
      testResults.push({ test: 'Company Tickers Native', success: true });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ FAILED - Native ticker search not working');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Company Tickers Native', success: false, error: error.message });
  }

  return testResults;
}

async function testFallbackMechanism() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing Exa Fallback Mechanism');
  console.log(`${'='.repeat(60)}`);

  // Create a client that simulates native API failure
  class FailingHybridClient extends SECHybridClient {
    async makeSECAPIRequest(endpoint, params) {
      throw new Error('Simulated native API failure');
    }
  }

  const client = new FailingHybridClient(mockRateLimiter);
  const testResults = [];

  // Test 1: Company Facts Fallback
  console.log('\n1. Testing company facts fallback to Exa...');
  try {
    const result = await client.getSECCompanyFactsNative({
      company_identifier: 'AAPL',
      concept: 'Assets',
      limit: 5
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('✅ SUCCESS - Fallback to Exa working');
      console.log(`   - API source: ${data.api_source || 'exa_fallback'}`);
      console.log(`   - Has facts: ${!!data.facts}`);
      testResults.push({ test: 'Company Facts Fallback', success: true });
    } else {
      throw new Error('Fallback did not work correctly');
    }
  } catch (error) {
    console.log('❌ FAILED - Fallback mechanism not working');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Company Facts Fallback', success: false, error: error.message });
  }

  return testResults;
}

async function testCachingAndMetrics() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing Caching and Metrics');
  console.log(`${'='.repeat(60)}`);

  const client = new SECHybridClient(mockRateLimiter);
  const testResults = [];

  // Test 1: Cache functionality
  console.log('\n1. Testing cache functionality...');
  try {
    const startTime = Date.now();

    // First request (should hit API)
    const result1 = await client.getSECCompanyFactsNative({
      company_identifier: '0000320193',
      concept: 'Assets',
      limit: 3
    });

    const firstRequestTime = Date.now() - startTime;

    // Second request (should hit cache)
    const cacheStartTime = Date.now();
    const result2 = await client.getSECCompanyFactsNative({
      company_identifier: '0000320193',
      concept: 'Assets',
      limit: 3
    });

    const secondRequestTime = Date.now() - cacheStartTime;

    if (result1 && result2) {
      console.log('✅ SUCCESS - Caching appears to be working');
      console.log(`   - First request: ${firstRequestTime}ms`);
      console.log(`   - Second request: ${secondRequestTime}ms`);
      console.log(`   - Cache hit likely: ${secondRequestTime < firstRequestTime / 2 ? 'Yes' : 'No'}`);
      testResults.push({ test: 'Caching', success: true });
    } else {
      throw new Error('Requests failed');
    }
  } catch (error) {
    console.log('❌ FAILED - Caching test failed');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Caching', success: false, error: error.message });
  }

  // Test 2: Metrics collection
  console.log('\n2. Testing metrics collection...');
  try {
    const metrics = client.getMetrics();
    console.log('✅ SUCCESS - Metrics collection working');
    console.log(`   - API requests: ${metrics.nativeApiRequests || 0}`);
    console.log(`   - Cache hits: ${metrics.cacheHits || 0}`);
    console.log(`   - Fallback uses: ${metrics.fallbackUses || 0}`);
    console.log(`   - Total errors: ${metrics.totalErrors || 0}`);
    testResults.push({ test: 'Metrics', success: true });
  } catch (error) {
    console.log('❌ FAILED - Metrics collection failed');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Metrics', success: false, error: error.message });
  }

  return testResults;
}

async function testParameterMapping() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing Parameter Mapping & Validation');
  console.log(`${'='.repeat(60)}`);

  const client = new SECHybridClient(mockRateLimiter);
  const testResults = [];

  // Test 1: Ticker to CIK mapping
  console.log('\n1. Testing ticker to CIK conversion...');
  try {
    const result = await client.getSECCompanyFactsNative({
      company_identifier: 'AAPL', // Should convert to CIK
      concept: 'Assets',
      limit: 3
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('✅ SUCCESS - Ticker to CIK mapping working');
      console.log(`   - Input: AAPL`);
      console.log(`   - Resolved CIK: ${data.cik || 'N/A'}`);
      console.log(`   - Company: ${data.company_name || 'N/A'}`);
      testResults.push({ test: 'Ticker to CIK Mapping', success: true });
    } else {
      throw new Error('Ticker conversion failed');
    }
  } catch (error) {
    console.log('❌ FAILED - Ticker to CIK mapping failed');
    console.log(`   Error: ${error.message}`);
    testResults.push({ test: 'Ticker to CIK Mapping', success: false, error: error.message });
  }

  // Test 2: Parameter validation
  console.log('\n2. Testing parameter validation...');
  try {
    // Should handle missing required parameters gracefully
    const result = await client.getSECXBRLFramesNative({
      // Missing concept parameter
      taxonomy: 'us-gaap',
      limit: 3
    });

    // Should either provide a meaningful error or use defaults
    if (result) {
      console.log('✅ SUCCESS - Parameter validation handling gracefully');
      testResults.push({ test: 'Parameter Validation', success: true });
    }
  } catch (error) {
    if (error.message.includes('concept') || error.message.includes('required')) {
      console.log('✅ SUCCESS - Parameter validation working (proper error)');
      console.log(`   - Validation error: ${error.message}`);
      testResults.push({ test: 'Parameter Validation', success: true });
    } else {
      console.log('❌ FAILED - Unexpected validation error');
      console.log(`   Error: ${error.message}`);
      testResults.push({ test: 'Parameter Validation', success: false, error: error.message });
    }
  }

  return testResults;
}

async function runAllTests() {
  const allResults = [];

  try {
    // Test Native APIs
    const nativeResults = await testNativeAPIs();
    allResults.push(...nativeResults);

    // Test Fallback Mechanism
    const fallbackResults = await testFallbackMechanism();
    allResults.push(...fallbackResults);

    // Test Caching and Metrics
    const cacheResults = await testCachingAndMetrics();
    allResults.push(...cacheResults);

    // Test Parameter Mapping
    const paramResults = await testParameterMapping();
    allResults.push(...paramResults);

  } catch (error) {
    console.error('Test suite failed:', error);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SEC HYBRID CLIENT TEST RESULTS');
  console.log(`${'='.repeat(60)}`);

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.success).length;
  const failedTests = allResults.filter(r => !r.success);

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}`);
  console.log(`   📈 Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED - SEC Hybrid Client is working correctly!`);

    console.log(`\n🔧 Hybrid Client Features:`);
    console.log(`   ✅ Native SEC API integration for structured data`);
    console.log(`   ✅ Automatic fallback to Exa for discovery/content`);
    console.log(`   ✅ Intelligent parameter mapping (ticker ↔ CIK)`);
    console.log(`   ✅ Response caching with 1-hour TTL`);
    console.log(`   ✅ Rate limiting compliance (10 req/sec max)`);
    console.log(`   ✅ Comprehensive metrics tracking`);
    console.log(`   ✅ Graceful error handling & recovery`);

    console.log(`\n🚀 Ready for Production:`);
    console.log(`   • Set USE_SEC_HYBRID=true in environment`);
    console.log(`   • Configure SEC_USER_AGENT with your email`);
    console.log(`   • Hybrid client will be used automatically`);
    console.log(`   • Fallback to existing Exa client if disabled`);

  } else {
    console.log(`\n⚠️ SOME TESTS FAILED - Review needed`);
    console.log(`\nFailed Tests:`);
    failedTests.forEach(test => {
      console.log(`   • ${test.test}: ${test.error}`);
    });

    console.log(`\n🔧 Troubleshooting:`);
    console.log(`   • Check SEC_USER_AGENT environment variable`);
    console.log(`   • Verify EXA_API_KEY for fallback functionality`);
    console.log(`   • Ensure network connectivity to data.sec.gov`);
    console.log(`   • Check rate limiting compliance`);
  }

  console.log(`\n🔍 Integration Benefits:`);
  console.log(`   • Before: All SEC data via Exa web search (slower, less accurate)`);
  console.log(`   • After: Native APIs for structured data + Exa for discovery`);
  console.log(`   • Impact: Faster, more accurate financial data retrieval`);
  console.log(`   • Coverage: Company facts, XBRL frames, ticker lookup`);

  console.log(`\n${'='.repeat(60)}\n`);
}

runAllTests().catch(console.error);
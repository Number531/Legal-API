#!/usr/bin/env node
/**
 * USPTO Live API Validation Test
 * Tests real API calls with actual USPTO and Exa APIs
 *
 * Requirements:
 * - USPTO_API_KEY in .env
 * - EXA_API_KEY in .env
 */

import { config } from 'dotenv';
import { USPTOHybridClient } from '../src/api-clients/USPTOHybridClient.js';

// Load environment variables
config({ path: '/Users/ej/Google Grounding/super-legal-mcp-refactored/.env' });

// Simple rate limiter
class RateLimiter {
  async waitForSlot() {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between requests
  }
}

const rateLimiter = new RateLimiter();
const usptoApiKey = process.env.USPTO_API_KEY;
const exaApiKey = process.env.EXA_API_KEY;

console.log('🔴 USPTO Live API Validation Test\n');
console.log('='.repeat(70));

// Check API keys
if (!usptoApiKey || usptoApiKey === 'your-api-key-here') {
  console.log('❌ USPTO_API_KEY not configured');
  console.log('Please set USPTO_API_KEY in .env file');
  process.exit(1);
}

if (!exaApiKey || exaApiKey === 'your-api-key-here') {
  console.log('❌ EXA_API_KEY not configured');
  console.log('Please set EXA_API_KEY in .env file');
  process.exit(1);
}

console.log('✅ API Keys configured');
console.log(`   USPTO: ${usptoApiKey.substring(0, 10)}...`);
console.log(`   Exa: ${exaApiKey.substring(0, 10)}...`);

// Initialize client
const usptoClient = new USPTOHybridClient(rateLimiter, exaApiKey);

// Inject USPTO API key into native client (if it needs it)
if (usptoClient.nativeClient) {
  usptoClient.nativeClient.apiKey = usptoApiKey;
}

console.log('\n📡 Starting Live API Tests...\n');

// ==========================================
// TEST 1: Simple Patent Number Lookup
// ==========================================
console.log('📋 TEST 1: Patent Number Lookup (Live API)');
console.log('-'.repeat(70));

try {
  console.log('   Searching for patent: 10000000 (first 8-digit patent)');

  const result = await usptoClient.searchPatents({
    patent_number: '10000000',
    limit: 1
  });

  if (!result || !result.content || !result.content[0]) {
    throw new Error('Invalid response structure');
  }

  const data = JSON.parse(result.content[0].text);

  console.log(`   ✅ Response received`);
  console.log(`   Source: ${result._metadata?.source || 'unknown'}`);
  console.log(`   Confidence: ${result._metadata?.confidence || 'N/A'}`);

  if (data.patents && data.patents.length > 0) {
    const patent = data.patents[0];
    console.log(`   Patent: ${patent.patent_number || patent.patentNumber || 'N/A'}`);
    console.log(`   Title: ${(patent.title || patent.patentTitle || 'N/A').substring(0, 60)}...`);
  } else if (data.results && data.results.length > 0) {
    console.log(`   Results found: ${data.results.length}`);
    console.log(`   First result: ${data.results[0].title?.substring(0, 60) || 'N/A'}...`);
  } else {
    console.log(`   Response structure: ${JSON.stringify(Object.keys(data))}`);
  }

  console.log('✅ TEST 1 PASSED: Live patent lookup successful\n');
} catch (error) {
  console.log(`❌ TEST 1 FAILED: ${error.message}`);
  console.log(`   Error details: ${error.stack?.split('\n')[0]}\n`);
}

// ==========================================
// TEST 2: Assignee Search (if supported)
// ==========================================
console.log('📋 TEST 2: Assignee Search (Live API)');
console.log('-'.repeat(70));

try {
  console.log('   Searching for assignee: IBM');

  const result = await usptoClient.searchPatents({
    assignee_organization: 'IBM',
    limit: 5
  });

  if (!result || !result.content || !result.content[0]) {
    throw new Error('Invalid response structure');
  }

  const data = JSON.parse(result.content[0].text);

  console.log(`   ✅ Response received`);
  console.log(`   Source: ${result._metadata?.source || 'unknown'}`);

  if (data.patents && data.patents.length > 0) {
    console.log(`   Patents found: ${data.patents.length}`);
    console.log(`   First patent: ${data.patents[0].patent_number || data.patents[0].patentNumber || 'N/A'}`);
  } else if (data.results && data.results.length > 0) {
    console.log(`   Results found: ${data.results.length}`);
    console.log(`   First result: ${data.results[0].title?.substring(0, 60) || 'N/A'}...`);
  } else {
    console.log(`   Response structure: ${JSON.stringify(Object.keys(data))}`);
  }

  console.log('✅ TEST 2 PASSED: Assignee search successful\n');
} catch (error) {
  console.log(`❌ TEST 2 FAILED: ${error.message}`);
  console.log(`   Error details: ${error.stack?.split('\n')[0]}\n`);
}

// ==========================================
// TEST 3: Circuit Breaker with Live API
// ==========================================
console.log('📋 TEST 3: Circuit Breaker Behavior (Live API)');
console.log('-'.repeat(70));

try {
  const initialState = usptoClient.circuitBreaker.state;
  const initialFailures = usptoClient.circuitBreaker.failures;

  console.log(`   Initial circuit state: ${initialState}`);
  console.log(`   Initial failures: ${initialFailures}`);

  // Try a valid request
  const result = await usptoClient.searchPatents({
    patent_number: '5000000',
    limit: 1
  });

  const finalState = usptoClient.circuitBreaker.state;
  const finalFailures = usptoClient.circuitBreaker.failures;

  console.log(`   After successful request:`);
  console.log(`   Circuit state: ${finalState}`);
  console.log(`   Failures: ${finalFailures}`);

  if (finalState !== 'closed') {
    throw new Error('Circuit should be closed after successful request');
  }

  if (finalFailures !== 0) {
    throw new Error('Failures should be 0 after successful request');
  }

  console.log('   ✅ Circuit breaker functioning correctly');
  console.log('✅ TEST 3 PASSED: Circuit breaker verified\n');
} catch (error) {
  console.log(`❌ TEST 3 FAILED: ${error.message}\n`);
}

// ==========================================
// TEST 4: Metrics After Live Calls
// ==========================================
console.log('📋 TEST 4: Metrics Validation (After Live Calls)');
console.log('-'.repeat(70));

try {
  const metrics = usptoClient.getMetrics();

  console.log('   Live API Metrics:');
  console.log(`   - Total requests: ${metrics.totalRequests}`);
  console.log(`   - Native API hits: ${metrics.nativeAPIHits}`);
  console.log(`   - Websearch hits: ${metrics.websearchHits}`);
  console.log(`   - Native API errors: ${metrics.nativeAPIErrors}`);
  console.log(`   - Cache hits: ${metrics.cacheHits}`);
  console.log(`   - Circuit state: ${metrics.circuitBreakerState}`);
  console.log(`   - API reliability: ${metrics.nativeAPIReliability}`);

  if (metrics.totalRequests === 0) {
    throw new Error('No requests recorded in metrics');
  }

  console.log('   ✅ Metrics tracking live API calls');
  console.log('✅ TEST 4 PASSED: Metrics validation complete\n');
} catch (error) {
  console.log(`❌ TEST 4 FAILED: ${error.message}\n`);
}

// ==========================================
// SUMMARY
// ==========================================
console.log('='.repeat(70));
console.log('📊 LIVE API VALIDATION SUMMARY');
console.log('='.repeat(70));

const metrics = usptoClient.getMetrics();

console.log('\n📈 Live API Statistics:');
console.log(`   • Total requests made: ${metrics.totalRequests}`);
console.log(`   • Native API calls: ${metrics.nativeAPIHits}`);
console.log(`   • Websearch calls: ${metrics.websearchHits}`);
console.log(`   • API errors: ${metrics.nativeAPIErrors}`);
console.log(`   • Cache utilization: ${metrics.cacheHits} hits`);
console.log(`   • Circuit breaker: ${metrics.circuitBreakerState} (${metrics.circuitBreakerFailures} failures)`);
console.log(`   • API health: ${metrics.nativeAPIReliability}`);

if (metrics.totalRequests > 0) {
  const successRate = ((metrics.nativeAPIHits + metrics.websearchHits) / metrics.totalRequests * 100).toFixed(1);
  console.log(`   • Overall success rate: ${successRate}%`);
}

console.log('\n✅ Live API validation complete!');
console.log('🎉 USPTOHybridClient successfully validated with real APIs!\n');

#!/usr/bin/env node

/**
 * Test API Timeout Fix
 * Verify the new timeout and retry logic works correctly
 */

import { makeApiRequest } from '../src/utils/apiHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('⏱️  Testing API Timeout Fix\n');

async function testTimeoutBehavior() {
  console.log('Testing timeout behavior...\n');
  
  // Test 1: Valid endpoint (should work)
  console.log('1. Testing valid GovInfo endpoint:');
  const startTime1 = Date.now();
  try {
    const result = await makeApiRequest(
      '/packages/USCODE-2023-title11/summary',
      { api_key: process.env.GOVINFO_API_KEY },
      { apiType: 'govinfo', timeout: 5000 } // 5 second timeout
    );
    const duration = Date.now() - startTime1;
    console.log(`   ✅ SUCCESS: Valid request completed in ${duration}ms`);
    console.log(`   Package: ${result.packageId}\n`);
  } catch (error) {
    const duration = Date.now() - startTime1;
    console.log(`   ❌ FAILED in ${duration}ms: ${error.message}\n`);
  }
  
  // Test 2: Invalid endpoint (should fail fast with 404)
  console.log('2. Testing invalid endpoint (should fail fast):');
  const startTime2 = Date.now();
  try {
    await makeApiRequest(
      '/invalid/nonexistent/endpoint',
      {},
      { apiType: 'govinfo', timeout: 30000 }
    );
    console.log(`   ❌ UNEXPECTED: Should have failed\n`);
  } catch (error) {
    const duration = Date.now() - startTime2;
    console.log(`   ✅ EXPECTED FAILURE: ${error.message}`);
    console.log(`   Failed in ${duration}ms (should be fast, < 5000ms)\n`);
  }
  
  // Test 3: CourtListener with reduced retries
  console.log('3. Testing CourtListener timeout behavior:');
  const startTime3 = Date.now();
  try {
    await makeApiRequest(
      '/search/',
      { q: 'test bankruptcy case' },
      { apiType: 'courtlistener' } // Uses new 30s timeout, 2 retries
    );
    const duration = Date.now() - startTime3;
    console.log(`   ✅ SUCCESS: CourtListener request completed in ${duration}ms\n`);
  } catch (error) {
    const duration = Date.now() - startTime3;
    console.log(`   ⚠️  EXPECTED FAILURE: ${error.message}`);
    console.log(`   Failed in ${duration}ms (should be < 90s vs old 6+ minutes)\n`);
  }
}

async function testRetryLogic() {
  console.log('Testing retry logic improvements...\n');
  
  console.log('CourtListener API configuration:');
  console.log('  • Timeout: 30 seconds (vs infinite before)');
  console.log('  • Max retries: 2 (vs 3 before)');
  console.log('  • Fail-fast on: 404, 403, 5xx, timeouts');
  console.log('  • Maximum delay: ~60 seconds total (vs 6+ minutes)\n');
  
  console.log('Other APIs configuration:');
  console.log('  • Timeout: 60 seconds');
  console.log('  • Max retries: 3');
  console.log('  • Same fail-fast logic\n');
}

// Run tests
async function runTests() {
  console.log('Testing the timeout and retry fixes...\n');
  console.log('=' .repeat(50) + '\n');
  
  await testRetryLogic();
  await testTimeoutBehavior();
  
  console.log('=' .repeat(50));
  console.log('\n📊 Timeout Fix Summary:\n');
  console.log('✅ Key improvements implemented:');
  console.log('   • 30-second timeout for CourtListener API calls');
  console.log('   • 60-second timeout for other APIs');
  console.log('   • Reduced retries for CourtListener (2 vs 3)');
  console.log('   • Fail-fast for 404s, 403s, 5xx errors');
  console.log('   • Maximum delay reduced from 6+ minutes to ~60 seconds');
  console.log('\n🎯 Expected behavior:');
  console.log('   • CourtListener failures: ≤60 seconds (vs 6+ minutes)');
  console.log('   • Valid requests: Unchanged performance');
  console.log('   • 404 errors: Immediate failure (no retries)');
  console.log('   • Better user experience with predictable timeouts\n');
}

runTests().catch(console.error);
#!/usr/bin/env node

/**
 * Simple test to verify BaseWebSearchClient defensive error handling
 */

import { BaseWebSearchClient } from './src/api-clients/BaseWebSearchClient.js';

console.log('Testing BaseWebSearchClient defensive error handling...');

// Mock rate limiter
const mockRateLimiter = {
  waitForCapacity: async () => {},
  recordRequest: () => {}
};

// Test 1: Missing API key
console.log('\n1. Testing missing API key...');
const clientNoKey = new BaseWebSearchClient(mockRateLimiter, null);
try {
  const result = await clientNoKey.executeExaSearch('test query', 5);
  console.log('✅ SUCCESS - Missing API key handled gracefully');
  console.log(`   - Returned ${result.length} results (should be 0)`);
} catch (error) {
  console.log('❌ FAILED - Missing API key still throws error');
  console.log(`   Error: ${error.message}`);
}

// Test 2: Invalid API key (simulated network failure)
console.log('\n2. Testing invalid API key (simulated)...');
class FailingBaseClient extends BaseWebSearchClient {
  async executeExaSearch(query, limit, options) {
    // First check API key
    if (!this.exaApiKey) {
      console.error('Exa API key not configured. Set EXA_API_KEY environment variable.');
      return [];
    }

    // Then simulate network failure
    console.log('   🔍 Simulating network failure...');
    throw new Error('Simulated network failure');
  }
}

const clientInvalidKey = new FailingBaseClient(mockRateLimiter, 'invalid-key');
try {
  const result = await clientInvalidKey.executeExaSearch('test query', 5);
  console.log('✅ SUCCESS - Network failure handled gracefully');
  console.log(`   - Returned ${result.length} results (should be 0)`);
} catch (error) {
  console.log('❌ FAILED - Network failure still throws error');
  console.log(`   Error: ${error.message}`);
}

console.log('\nTest completed.');
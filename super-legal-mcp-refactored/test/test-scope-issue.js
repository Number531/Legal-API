#!/usr/bin/env node

/**
 * Test the specific scope issue causing USC failures
 */

import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import { makeApiRequest } from '../src/utils/apiHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Scope Issue\n');

// Test 1: Direct makeApiRequest call (like the test does)
console.log('1. Testing direct makeApiRequest call:');
try {
  const result = await makeApiRequest(
    '/packages/USCODE-2023-title11/summary',
    { api_key: process.env.GOVINFO_API_KEY },
    { apiType: 'govinfo' }
  );
  console.log('   ✅ Direct call SUCCESS');
  console.log(`   Package: ${result.packageId}\n`);
} catch (error) {
  console.log(`   ❌ Direct call FAILED: ${error.message}\n`);
}

// Test 2: GovInfoClient without rate limiter (like the test does)
console.log('2. Testing GovInfoClient without rate limiter:');
try {
  const client = new GovInfoClient(null);
  const result = await client.getUSCSection({ title: 11, section: '1107' });
  const data = JSON.parse(result.content[0].text);
  console.log('   ✅ Client without rate limiter SUCCESS');
  console.log(`   Granule: ${data.granule_id}\n`);
} catch (error) {
  console.log(`   ❌ Client without rate limiter FAILED: ${error.message}\n`);
}

// Test 3: GovInfoClient WITH rate limiter (like the server does)
console.log('3. Testing GovInfoClient with mock rate limiter:');
try {
  const mockRateLimiter = {
    enforce: async () => {
      // Mock rate limiter - just delay briefly
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  
  const client = new GovInfoClient(mockRateLimiter);
  const result = await client.getUSCSection({ title: 11, section: '1107' });
  const data = JSON.parse(result.content[0].text);
  console.log('   ✅ Client with rate limiter SUCCESS');
  console.log(`   Granule: ${data.granule_id}\n`);
} catch (error) {
  console.log(`   ❌ Client with rate limiter FAILED: ${error.message}\n`);
}

// Test 4: Check if rate limiter object causes issues
console.log('4. Testing with server-style rate limiter:');
try {
  const serverStyleRateLimiter = {
    requests: [],
    maxRequests: 9,
    windowMs: 1000,
    enforce: async function() {
      const now = Date.now();
      this.requests = this.requests.filter(time => now - time < this.windowMs);
      
      if (this.requests.length >= this.maxRequests) {
        const oldestRequest = this.requests[0];
        const waitTime = this.windowMs - (now - oldestRequest);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      this.requests.push(now);
    }
  };
  
  const client = new GovInfoClient(serverStyleRateLimiter);
  const result = await client.getUSCSection({ title: 11, section: '1107' });
  const data = JSON.parse(result.content[0].text);
  console.log('   ✅ Client with server-style rate limiter SUCCESS');
  console.log(`   Granule: ${data.granule_id}\n`);
} catch (error) {
  console.log(`   ❌ Client with server-style rate limiter FAILED: ${error.message}\n`);
}

console.log('🎯 Scope issue investigation complete!');
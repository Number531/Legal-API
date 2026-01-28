#!/usr/bin/env node

/**
 * CourtListener API Status Check
 * Tests the health and availability of the CourtListener API
 */

import 'dotenv/config';
import fetch from 'node-fetch';

async function checkCourtListenerStatus() {
  console.log('🔍 CourtListener API Status Check');
  console.log('='.repeat(50));
  
  const apiToken = process.env.COURTLISTENER_API_TOKEN;
  const baseUrl = 'https://www.courtlistener.com/api/rest/v3';
  
  const endpoints = [
    { name: 'Search API', url: `${baseUrl}/search/`, method: 'GET' },
    { name: 'Courts List', url: `${baseUrl}/courts/`, method: 'GET' },
    { name: 'Opinions API', url: `${baseUrl}/opinions/`, method: 'GET' },
    { name: 'Dockets API', url: `${baseUrl}/dockets/`, method: 'GET' }
  ];
  
  console.log(`\n📡 Testing CourtListener endpoints...\n`);
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url + '?page_size=1', {
        method: endpoint.method,
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const status = response.status;
      const statusText = response.statusText;
      
      if (status === 200) {
        console.log(`✅ Status: ${status} - Service Available`);
      } else if (status === 503) {
        console.log(`⚠️  Status: ${status} - Service Temporarily Unavailable`);
        console.log(`   The CourtListener API is currently overloaded or under maintenance`);
      } else if (status === 429) {
        console.log(`⚠️  Status: ${status} - Rate Limited`);
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          console.log(`   Retry after: ${retryAfter} seconds`);
        }
      } else if (status === 401) {
        console.log(`❌ Status: ${status} - Authentication Failed`);
        console.log(`   Check your COURTLISTENER_API_TOKEN`);
      } else {
        console.log(`❓ Status: ${status} - ${statusText}`);
      }
      
      // Check response headers for additional info
      const rateLimit = response.headers.get('X-RateLimit-Limit');
      const remaining = response.headers.get('X-RateLimit-Remaining');
      
      if (rateLimit) {
        console.log(`   Rate Limit: ${remaining}/${rateLimit} requests remaining`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   Cannot connect to CourtListener API`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   Request timed out after 10 seconds`);
      }
    }
    
    console.log('-'.repeat(40));
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('If you see 503 errors:');
  console.log('  1. Wait a few minutes and try again');
  console.log('  2. Check CourtListener status: https://www.courtlistener.com/');
  console.log('  3. Consider implementing exponential backoff');
  console.log('  4. Use cached data when available');
  
  console.log('\nIf you see 429 errors:');
  console.log('  1. Reduce request frequency');
  console.log('  2. Implement rate limiting in your code');
  console.log('  3. Consider upgrading your API tier');
}

checkCourtListenerStatus().catch(console.error);
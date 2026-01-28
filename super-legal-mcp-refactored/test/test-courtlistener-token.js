#!/usr/bin/env node

/**
 * CourtListener API Token Test
 * Comprehensive test of the CourtListener API token and endpoints
 */

import 'dotenv/config';
import fetch from 'node-fetch';

async function testCourtListenerToken() {
  console.log('🔐 CourtListener API Token Test');
  console.log('='.repeat(60));
  
  const apiToken = process.env.COURTLISTENER_API_TOKEN;
  
  if (!apiToken) {
    console.log('❌ No COURTLISTENER_API_TOKEN found in environment');
    return;
  }
  
  console.log(`📋 Token: ${apiToken.substring(0, 10)}...${apiToken.substring(apiToken.length - 5)}`);
  console.log(`📏 Token length: ${apiToken.length} characters`);
  console.log();
  
  // Test different authentication methods and endpoints
  const tests = [
    {
      name: 'Basic Search (with Token)',
      url: 'https://www.courtlistener.com/api/rest/v3/search/',
      params: '?q=bankruptcy&type=o&page_size=1',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Search without type parameter',
      url: 'https://www.courtlistener.com/api/rest/v3/search/',
      params: '?q=bankruptcy&page_size=1',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Courts Endpoint',
      url: 'https://www.courtlistener.com/api/rest/v3/courts/',
      params: '?page_size=1',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Search Cases Endpoint',
      url: 'https://www.courtlistener.com/api/rest/v3/search/',
      params: '?type=o&q=chemical&page_size=1',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Legal-MCP-Test/1.0'
      }
    },
    {
      name: 'Test with Bearer instead of Token',
      url: 'https://www.courtlistener.com/api/rest/v3/search/',
      params: '?q=test&type=o&page_size=1',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  ];
  
  console.log('🧪 Running authentication tests...\n');
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`URL: ${test.url}${test.params}`);
    
    try {
      const response = await fetch(test.url + test.params, {
        method: 'GET',
        headers: test.headers,
        timeout: 10000
      });
      
      const status = response.status;
      const statusText = response.statusText;
      
      console.log(`Status: ${status} - ${statusText}`);
      
      // Get response headers
      const headers = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().includes('rate') || 
            key.toLowerCase().includes('limit') ||
            key.toLowerCase().includes('retry')) {
          headers[key] = value;
        }
      });
      
      if (Object.keys(headers).length > 0) {
        console.log('Headers:', headers);
      }
      
      // Try to get response body for more details
      if (status !== 200) {
        try {
          const body = await response.text();
          const preview = body.substring(0, 200);
          console.log('Response:', preview);
        } catch {}
      } else {
        try {
          const data = await response.json();
          console.log('✅ Success! Response contains:', {
            count: data.count,
            hasResults: data.results ? data.results.length : 0
          });
        } catch {}
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  // Additional diagnostics
  console.log('\n📊 Diagnostics:');
  console.log('-'.repeat(40));
  
  // Test if the token format is correct
  if (apiToken.length !== 40) {
    console.log('⚠️  Token length is unusual (expected 40 characters)');
  }
  
  if (!/^[a-f0-9]{40}$/i.test(apiToken)) {
    console.log('⚠️  Token format may be incorrect (expected 40 hex characters)');
  }
  
  // Direct curl equivalent
  console.log('\n🔧 Equivalent curl command:');
  console.log(`curl -H "Authorization: Token ${apiToken}" \\`);
  console.log('     "https://www.courtlistener.com/api/rest/v3/search/?q=test&type=o&page_size=1"');
  
  console.log('\n💡 Troubleshooting:');
  console.log('1. Verify token at: https://www.courtlistener.com/account/settings/');
  console.log('2. Generate new token if needed');
  console.log('3. Check API documentation: https://www.courtlistener.com/api/rest-info/');
  console.log('4. Verify account has API access enabled');
}

testCourtListenerToken().catch(console.error);
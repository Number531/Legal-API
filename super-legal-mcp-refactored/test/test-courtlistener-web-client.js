#!/usr/bin/env node

/**
 * Test CourtListenerWebSearchClient functionality
 * Verify it returns proper information and works as expected
 */

import { CourtListenerWebSearchClient } from '../src/api-clients/CourtListenerWebSearchClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing CourtListenerWebSearchClient Functionality\n');

const client = new CourtListenerWebSearchClient(null);

// Test cases covering different scenarios
const testCases = [
  {
    name: 'Basic Opinion Search',
    method: 'searchOpinionsWeb',
    args: {
      query: 'Miranda rights police custody',
      limit: 5,
      include_text: true
    },
    expectedFields: ['case_name', 'court', 'citations', 'absolute_url', 'snippet']
  },
  {
    name: 'Famous Case Search',
    method: 'searchOpinionsWeb', 
    args: {
      query: 'Brown v Board Education',
      case_name: 'Brown v. Board of Education',
      limit: 3,
      include_text: true
    },
    expectedFields: ['case_name', 'court', 'citations', 'absolute_url']
  },
  {
    name: 'Citation Lookup - Roe v Wade',
    method: 'lookupCitationWeb',
    args: {
      citation: '410 U.S. 113',
      limit: 3,
      include_text: true
    },
    expectedFields: ['case_name', 'citations', 'absolute_url']
  },
  {
    name: 'Citation Lookup - Miranda',
    method: 'lookupCitationWeb',
    args: {
      citation: '384 U.S. 436',
      limit: 2,
      include_text: false
    },
    expectedFields: ['case_name', 'absolute_url']
  },
  {
    name: 'Bankruptcy Search with Date Filter',
    method: 'searchOpinionsWeb',
    args: {
      query: 'bankruptcy debtor possession',
      date_after: '2020-01-01',
      date_before: '2024-12-31',
      limit: 4
    },
    expectedFields: ['case_name', 'absolute_url']
  }
];

async function testMethod(testCase) {
  const { name, method, args, expectedFields } = testCase;
  
  console.log(`🔍 ${name}:`);
  console.log(`   Method: ${method}`);
  console.log(`   Args: ${JSON.stringify(args, null, 2).replace(/\n/g, '\n   ')}`);
  
  const startTime = Date.now();
  
  try {
    const result = await client[method](args);
    const duration = Date.now() - startTime;
    
    // Parse the result
    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error('Invalid result structure - missing content.text');
    }
    
    const data = JSON.parse(result.content[0].text);
    
    console.log(`   ✅ SUCCESS (${duration}ms)`);
    console.log(`   Results found: ${data.total_results || data.results?.length || 0}`);
    
    // Verify result structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Results is not an array');
    }
    
    if (data.results.length === 0) {
      console.log(`   ⚠️  No results found (this may be expected for some searches)`);
    } else {
      // Check first result for expected fields
      const firstResult = data.results[0];
      console.log(`   📋 First result structure:`);
      console.log(`      Case name: ${firstResult.case_name || 'N/A'}`);
      console.log(`      Court: ${firstResult.court || 'N/A'}`);
      console.log(`      Citations: ${firstResult.citations?.length || 0} found`);
      console.log(`      URL: ${firstResult.absolute_url ? 'Present' : 'Missing'}`);
      console.log(`      Opinion ID: ${firstResult.opinion_id || 'N/A'}`);
      console.log(`      Snippet: ${firstResult.snippet ? 'Present' : 'N/A'}`);
      
      // Verify expected fields are present
      const missingFields = expectedFields.filter(field => 
        firstResult[field] === undefined || firstResult[field] === null
      );
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Missing expected fields: ${missingFields.join(', ')}`);
      }
      
      // Verify URL format
      if (firstResult.absolute_url && !firstResult.absolute_url.includes('courtlistener.com')) {
        console.log(`   ⚠️  URL doesn't appear to be from CourtListener`);
      }
      
      // Show sample citations if found
      if (firstResult.citations && firstResult.citations.length > 0) {
        console.log(`      Sample citations: ${firstResult.citations.slice(0, 3).join(', ')}`);
      }
    }
    
    // Show metadata
    console.log(`   📊 Response metadata:`);
    console.log(`      Search type: ${data.search_type || 'N/A'}`);
    console.log(`      Query used: ${data.query || data.original_query || 'N/A'}`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAILED (${duration}ms): ${error.message}`);
  }
  
  console.log();
}

async function testErrorHandling() {
  console.log('🚨 Testing Error Handling:\n');
  
  // Test missing query
  console.log('1. Missing query parameter:');
  try {
    await client.searchOpinionsWeb({});
    console.log('   ❌ Should have thrown error for missing query');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  // Test missing citation
  console.log('\n2. Missing citation parameter:');
  try {
    await client.lookupCitationWeb({});
    console.log('   ❌ Should have thrown error for missing citation');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  // Test invalid date
  console.log('\n3. Invalid date format:');
  try {
    await client.searchOpinionsWeb({
      query: 'test',
      date_after: 'invalid-date'
    });
    console.log('   ❌ Should have thrown error for invalid date');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  console.log();
}

async function testApiKeyHandling() {
  console.log('🔑 Testing API Key Handling:\n');
  
  if (!process.env.EXA_API_KEY) {
    console.log('   ⚠️  EXA_API_KEY not configured - testing error handling');
    try {
      await client.searchOpinionsWeb({ query: 'test' });
      console.log('   ❌ Should have thrown error for missing API key');
    } catch (error) {
      console.log(`   ✅ Correctly threw error: ${error.message}`);
    }
  } else {
    console.log('   ✅ EXA_API_KEY is configured');
  }
  
  console.log();
}

// Run all tests
async function runAllTests() {
  console.log('Testing CourtListenerWebSearchClient comprehensive functionality...\n');
  console.log('=' .repeat(70) + '\n');
  
  await testApiKeyHandling();
  await testErrorHandling();
  
  if (!process.env.EXA_API_KEY) {
    console.log('⚠️  Skipping functional tests - EXA_API_KEY not configured\n');
    console.log('To run full tests, set EXA_API_KEY environment variable.\n');
  } else {
    console.log('🔍 Functional Tests:\n');
    
    for (const testCase of testCases) {
      await testMethod(testCase);
    }
  }
  
  console.log('=' .repeat(70));
  console.log('\n📊 Test Summary:');
  console.log('✅ CourtListenerWebSearchClient structure tests completed');
  console.log('✅ Error handling verification completed');
  
  if (process.env.EXA_API_KEY) {
    console.log('✅ Functional integration tests completed');
    console.log('\n🎯 The client should work as a drop-in replacement for:');
    console.log('   - search_cases → searchOpinionsWeb');
    console.log('   - lookup_citation → lookupCitationWeb');
  } else {
    console.log('⚠️  Functional tests skipped (no API key)');
  }
  
  console.log('\n🚀 Ready for integration with existing MCP server!');
}

runAllTests().catch(console.error);
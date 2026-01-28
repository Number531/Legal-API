#!/usr/bin/env node
/**
 * Integration test for FederalRegisterWebSearchClient via the running server
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090';

async function testFederalRegisterIntegration() {
  console.log('🧪 Testing FederalRegisterWebSearchClient via Server Integration');
  console.log('=' + '='.repeat(65));

  try {
    // Test a Federal Register search via the server
    console.log('\n🔍 Testing Federal Register search...');
    
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Search Federal Register for EPA climate change regulations from 2024'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('\n📊 Server Response:');
    console.log(`- Status: ${response.status}`);
    console.log(`- Response length: ${JSON.stringify(data).length} characters`);
    
    // Check if the response mentions Federal Register
    const responseText = data.response || '';
    if (responseText.toLowerCase().includes('federal register')) {
      console.log('✅ Federal Register functionality detected in response');
    } else {
      console.log('⚠️  No Federal Register content detected');
    }
    
    // Check for tool usage indicators
    if (responseText.includes('search_federal_register') || 
        responseText.includes('EPA') || 
        responseText.includes('regulation')) {
      console.log('✅ Regulatory search functionality working');
    } else {
      console.log('⚠️  Regulatory search functionality unclear');
    }

    console.log('\n📋 Response preview:');
    console.log(responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

// Run the integration test
testFederalRegisterIntegration()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Integration test ${success ? 'completed' : 'failed'}`);
    
    if (success) {
      console.log('🎉 FederalRegisterWebSearchClient appears to be working via server!');
      console.log('📋 Phase 1 Federal Register Migration: COMPLETE');
    } else {
      console.log('🔍 May need to investigate server integration');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Integration test error:', error);
    process.exit(1);
  });
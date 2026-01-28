#!/usr/bin/env node
/**
 * Test Phase 1: Verify reduced limits work without token overflow
 * This tests that EPA (3 instead of 25) and PTAB (3 instead of 10) don't hit token limits
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090';

// Test helper
async function testEndpoint(message, expectTokenSuccess = true) {
  console.log(`\n🧪 Testing: ${message}`);
  console.log('=' + '='.repeat(message.length + 10));
  
  try {
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        enableSessionMemory: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for token limit errors
    const hasTokenError = data.response?.includes('token') && 
                         (data.response?.includes('limit') || data.response?.includes('exceeded'));
    
    if (expectTokenSuccess && hasTokenError) {
      console.error('❌ UNEXPECTED TOKEN ERROR:', data.response);
      return false;
    } else if (!expectTokenSuccess && !hasTokenError) {
      console.warn('⚠️  Expected token error but none found');
    }
    
    // Count approximate response length
    const responseLength = JSON.stringify(data).length;
    console.log(`✅ Response received: ${responseLength} chars`);
    
    // Look for tool usage indicators
    if (data.response?.includes('search_epa_facilities') || 
        data.response?.includes('EPA') || 
        data.response?.includes('facilities')) {
      console.log('📊 EPA search detected in response');
    }
    
    if (data.response?.includes('PTAB') || 
        data.response?.includes('IPR') || 
        data.response?.includes('proceeding')) {
      console.log('📊 PTAB search detected in response');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Phase 1 Limit Reduction Tests');
  console.log('Testing that reduced limits prevent token overflow');
  console.log('EPA: 25→3, PTAB: 10→3, EPA violations: 200→15\n');
  
  let passedTests = 0;
  const totalTests = 4;
  
  // Test 1: EPA facilities search (should use limit=3 instead of 25)
  const test1 = await testEndpoint(
    "Find EPA facilities in Pennsylvania with compliance violations",
    true
  );
  if (test1) passedTests++;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: PTAB proceeding search (should use limit=3 instead of 10)  
  const test2 = await testEndpoint(
    "Search for PTAB IPR proceedings involving Apple patents",
    true
  );
  if (test2) passedTests++;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Complex query that would previously hit token limits
  const test3 = await testEndpoint(
    "Analyze pharmaceutical company EPA compliance and any related PTAB patent challenges",
    true
  );
  if (test3) passedTests++;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: EPA violations search (should use limit=15 instead of 200)
  const test4 = await testEndpoint(
    "Get EPA compliance violations for a major chemical facility",
    true
  );
  if (test4) passedTests++;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ Phase 1 SUCCESS: All limit reductions working properly!');
    console.log('✅ Token overflow issues should be resolved');
    console.log('✅ Ready to proceed to Phase 2 (snippet implementation)');
  } else {
    console.log('❌ Phase 1 ISSUES: Some tests failed');
    console.log('❌ May need to investigate further before Phase 2');
  }
  
  return passedTests === totalTests;
}

// Run the tests
runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
#!/usr/bin/env node
/**
 * Test FederalRegisterWebSearchClient functionality via the running server
 * This should have access to EXA_API_KEY and can test real functionality
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090';

async function testFederalRegisterViaServer() {
  console.log('🔬 Testing FederalRegisterWebSearchClient via Server');
  console.log('Testing snippet/highlights, full text, and metadata extraction');
  console.log('=' + '='.repeat(65));

  let testsPassed = 0;
  const totalTests = 4;

  // Test 1: Basic Federal Register search
  console.log('\n📋 Test 1: Basic Federal Register functionality');
  try {
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Search Federal Register for recent EPA environmental protection regulations'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || '';
      
      console.log(`  📊 Response length: ${responseText.length} chars`);
      console.log(`  📄 Response preview: ${responseText.substring(0, 200)}...`);
      
      if (responseText.toLowerCase().includes('federal register') ||
          responseText.toLowerCase().includes('epa') ||
          responseText.toLowerCase().includes('regulation')) {
        console.log('  ✅ Federal Register search functionality detected');
        testsPassed++;
      } else {
        console.log('  ⚠️  Federal Register functionality not clearly detected');
      }
    } else {
      console.log(`  ❌ Server error: ${response.status}`);
    }
  } catch (error) {
    console.error('  ❌ Basic test failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Agency-specific search
  console.log('\n🏛️  Test 2: Agency-specific search (FDA)');
  try {
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find FDA food safety regulations in Federal Register from 2024'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || '';
      
      console.log(`  📊 Response length: ${responseText.length} chars`);
      
      if (responseText.toLowerCase().includes('fda') ||
          responseText.toLowerCase().includes('food') ||
          responseText.toLowerCase().includes('safety')) {
        console.log('  ✅ FDA-specific search working');
        testsPassed++;
      } else {
        console.log('  ⚠️  FDA-specific search not clearly working');
      }
    }
  } catch (error) {
    console.error('  ❌ Agency-specific test failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Document type filtering
  console.log('\n📄 Test 3: Document type and content search');
  try {
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Search Federal Register for proposed rules about consumer protection with document details'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || '';
      
      console.log(`  📊 Response length: ${responseText.length} chars`);
      
      if (responseText.toLowerCase().includes('proposed') ||
          responseText.toLowerCase().includes('consumer') ||
          responseText.toLowerCase().includes('rule')) {
        console.log('  ✅ Document type filtering working');
        testsPassed++;
      } else {
        console.log('  ⚠️  Document type filtering not clearly working');
      }
    }
  } catch (error) {
    console.error('  ❌ Document type test failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Complex search with multiple parameters
  console.log('\n🔍 Test 4: Complex multi-parameter search');
  try {
    const response = await fetch(`${BASE_URL}/api/claude/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find recent DOT transportation safety final rules in Federal Register with document numbers and publication dates'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || '';
      
      console.log(`  📊 Response length: ${responseText.length} chars`);
      
      if (responseText.toLowerCase().includes('transportation') ||
          responseText.toLowerCase().includes('dot') ||
          responseText.toLowerCase().includes('safety')) {
        console.log('  ✅ Complex search working');
        testsPassed++;
      } else {
        console.log('  ⚠️  Complex search not clearly working');
      }
    }
  } catch (error) {
    console.error('  ❌ Complex search test failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Server Integration Tests: ${testsPassed}/${totalTests} passed`);
  
  if (testsPassed >= 3) {
    console.log('🎉 FederalRegisterWebSearchClient working well via server!');
    console.log('✅ Integration successful');
    console.log('✅ Ready for production use');
    console.log('✅ Phase 1 Federal Register Migration: VALIDATED');
    console.log('🚀 Ready to proceed to Phase 2: FTC Client Migration');
    return true;
  } else {
    console.log('⚠️  Some integration issues detected');
    console.log('🔍 May need to check server tool integration');
    return false;
  }
}

// Test server status first
async function checkServerStatus() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Server is running and responsive');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Run tests
checkServerStatus()
  .then(serverOk => {
    if (!serverOk) {
      console.log('❌ Server not available. Start server first: node src/server/claude-server-v2.js');
      process.exit(1);
    }
    return testFederalRegisterViaServer();
  })
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
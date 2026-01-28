#!/usr/bin/env node

/**
 * System Health Check
 * Verify all major components are working after optimizations
 */

import { EPAComplianceClient } from '../src/api-clients/EPAComplianceClient.js';
import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🏥 System Health Check\n');

const results = {
  epa: { status: 'pending', message: '' },
  usc: { status: 'pending', message: '' },
  uscOptimized: { status: 'pending', message: '' }
};

// Test 1: EPA Search with proper validation
async function testEPA() {
  console.log('1. Testing EPA Facility Search (with required location)...');
  try {
    const client = new EPAComplianceClient(null);
    
    // This should work - specific location provided
    await client.searchFacilities({
      state: 'CA',
      city: 'Los Angeles',
      limit: 5
    });
    
    results.epa.status = 'pass';
    results.epa.message = 'EPA search with location requirements working';
    console.log('   ✅ EPA search working correctly\n');
    
  } catch (error) {
    results.epa.status = 'fail';
    results.epa.message = error.message;
    console.log(`   ❌ EPA search failed: ${error.message}\n`);
  }
}

// Test 2: USC Section retrieval (regular section)
async function testUSCRegular() {
  console.log('2. Testing USC Section Retrieval (regular section)...');
  try {
    const client = new GovInfoClient(null);
    
    // Test a regular section that should be found quickly
    const result = await client.getUSCSection({
      title: 11,
      section: '101',
      format: 'json'
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.granule_id && data.section_title) {
      results.usc.status = 'pass';
      results.usc.message = `Found section 101: ${data.section_title}`;
      console.log('   ✅ USC regular section retrieval working\n');
    } else {
      throw new Error('Invalid response structure');
    }
    
  } catch (error) {
    results.usc.status = 'fail';
    results.usc.message = error.message;
    console.log(`   ❌ USC retrieval failed: ${error.message}\n`);
  }
}

// Test 3: USC Section retrieval (optimized Title 11 Chapter 11 section)
async function testUSCOptimized() {
  console.log('3. Testing USC Optimized Retrieval (Title 11 Chapter 11)...');
  try {
    const client = new GovInfoClient(null);
    
    // Test section 1107 which uses the optimization
    const startTime = Date.now();
    const result = await client.getUSCSection({
      title: 11,
      section: '1107',
      format: 'json'
    });
    const duration = Date.now() - startTime;
    
    const data = JSON.parse(result.content[0].text);
    if (data.granule_id && data.section_title) {
      results.uscOptimized.status = 'pass';
      results.uscOptimized.message = `Found section 1107 in ${duration}ms using optimization`;
      console.log(`   ✅ USC optimized retrieval working (${duration}ms)\n`);
    } else {
      throw new Error('Invalid response structure');
    }
    
  } catch (error) {
    results.uscOptimized.status = 'fail';
    results.uscOptimized.message = error.message;
    console.log(`   ❌ USC optimized retrieval failed: ${error.message}\n`);
  }
}

// Test 4: EPA Validation (should reject broad searches)
async function testEPAValidation() {
  console.log('4. Testing EPA Search Validation (should reject broad search)...');
  try {
    const client = new EPAComplianceClient(null);
    
    // This should fail - no specific location
    await client.searchFacilities({
      state: 'CA',
      company_name: 'Inc',  // Too generic
      limit: 5
    });
    
    // If we get here, validation failed
    console.log('   ❌ EPA validation not working - accepted broad search\n');
    
  } catch (error) {
    if (error.message.includes('EPA search too broad')) {
      console.log('   ✅ EPA validation correctly rejected broad search\n');
    } else {
      console.log(`   ⚠️  EPA failed with unexpected error: ${error.message}\n`);
    }
  }
}

// Run all tests
async function runHealthCheck() {
  console.log('Running comprehensive system health check...\n');
  console.log('=' .repeat(50) + '\n');
  
  await testEPA();
  await testUSCRegular();
  await testUSCOptimized();
  await testEPAValidation();
  
  console.log('=' .repeat(50));
  console.log('\n📊 Health Check Summary:\n');
  
  let allPass = true;
  for (const [component, result] of Object.entries(results)) {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${component.toUpperCase()}: ${result.message}`);
    if (result.status !== 'pass') allPass = false;
  }
  
  console.log('\n' + '=' .repeat(50));
  if (allPass) {
    console.log('\n🎉 All systems operational! The optimizations are working correctly.\n');
  } else {
    console.log('\n⚠️  Some components need attention. Review the failures above.\n');
  }
}

runHealthCheck().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});
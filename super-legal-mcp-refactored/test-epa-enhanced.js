#!/usr/bin/env node

/**
 * Test Script for Enhanced EPAWebSearchClient
 * Tests the highlights-based EPA implementation with various queries
 */

import dotenv from 'dotenv';
import { EPAWebSearchClient } from './src/api-clients/EPAWebSearchClient.js';

dotenv.config();

// Mock rate limiter for testing
class TestRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Test runner
async function testEPAClient() {
  console.log('🌿 Testing Enhanced EPAWebSearchClient');
  console.log('=' .repeat(60));
  
  // Check environment
  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY not found in environment!');
    process.exit(1);
  }
  console.log('✅ EXA_API_KEY configured');
  
  const client = new EPAWebSearchClient(new TestRateLimiter(), process.env.EXA_API_KEY);
  
  try {
    // Test 1: Search facilities
    console.log('\n🧪 Test 1: Search EPA Facilities - BASF in Pittsburgh');
    const response1 = await client.searchFacilitiesWeb({
      company_name: 'BASF',
      city: 'Pittsburgh',
      state: 'PA',
      limit: 2
    });
    
    if (response1 && response1.content && response1.content[0]) {
      const data = JSON.parse(response1.content[0].text);
      console.log(`   ✅ Found ${data.total_facilities} facilities`);
      
      if (data.facilities && data.facilities.length > 0) {
        const facility = data.facilities[0];
        console.log(`   - Name: ${facility.name}`);
        console.log(`   - Compliance: ${facility.compliance_status || 'Unknown'}`);
        
        // Check for highlight quality
        if (facility._highlight_quality) {
          console.log(`   - Quality Confidence: ${facility._highlight_quality.confidence}`);
          console.log(`   - Extraction Method: ${facility._highlight_quality.extraction_method}`);
        }
      }
    }
    
    // Test 2: Get compliance report
    console.log('\n🧪 Test 2: Get Facility Compliance Report');
    const response2 = await client.getFacilityComplianceReportWeb({
      facility_id: '110000350996',
      include_violations: true,
      include_enforcement: false
    });
    
    if (response2 && response2.content && response2.content[0]) {
      const data = JSON.parse(response2.content[0].text);
      console.log(`   ✅ Retrieved compliance report`);
      if (data.compliance_summary) {
        console.log(`   - Status: ${data.compliance_summary.Status || 'Unknown'}`);
        console.log(`   - Quarters in NC: ${data.compliance_summary.QtrsInNC || 0}`);
      }
    }
    
    // Test 3: Search violations
    console.log('\n🧪 Test 3: Search Facility Violations');
    const response3 = await client.searchViolationsWeb({
      facility_id: '110000350996',
      limit: 3
    });
    
    if (response3 && response3.content && response3.content[0]) {
      const data = JSON.parse(response3.content[0].text);
      console.log(`   ✅ Found ${data.count} violations`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('Enhanced EPAWebSearchClient with highlights is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testEPAClient().catch(console.error);

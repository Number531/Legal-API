#!/usr/bin/env node

/**
 * Test Script for Enhanced WebSearchClients
 * Validates the highlights-based implementation before full integration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the enhanced clients
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';
import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';
import { EPAWebSearchClient } from './src/api-clients/EPAWebSearchClient.js';

// Simple rate limiter mock for testing
class TestRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
}

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runAll() {
    console.log('🧪 Starting Enhanced WebSearchClients Test Suite');
    console.log('=' .repeat(60));

    for (const test of this.tests) {
      this.results.total++;
      try {
        console.log(`\n🔍 Running: ${test.name}`);
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.error(`   Error: ${error.message}`);
        this.results.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! Enhanced clients are ready for integration.');
    } else {
      console.log('\n⚠️  Some tests failed. Review errors before integration.');
    }
  }
}

// Validation helpers
function validateResponse(response, expectedFields = []) {
  if (!response || !response.content || !Array.isArray(response.content)) {
    throw new Error('Invalid response format: missing content array');
  }

  const content = response.content[0];
  if (!content || content.type !== 'text') {
    throw new Error('Invalid content format: expected text type');
  }

  let parsedData;
  try {
    parsedData = JSON.parse(content.text);
  } catch (error) {
    throw new Error('Invalid JSON in response text');
  }

  // Check for required fields
  for (const field of expectedFields) {
    if (!(field in parsedData)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsedData;
}

function validateHighlightQuality(data) {
  // Check if any results have highlight quality metadata
  const results = data.results || data.facilities || data.dockets || [];
  let hasQualityMetadata = false;

  for (const result of results) {
    if (result._highlight_quality) {
      hasQualityMetadata = true;
      const quality = result._highlight_quality;
      
      // Validate quality metrics
      if (typeof quality.confidence !== 'number' || quality.confidence < 0 || quality.confidence > 1) {
        throw new Error('Invalid highlight confidence score');
      }
      
      if (!['complete', 'substantial', 'partial', 'minimal'].includes(quality.coverage)) {
        throw new Error('Invalid highlight coverage assessment');
      }
      
      if (!['high', 'medium', 'low'].includes(quality.relevance)) {
        throw new Error('Invalid highlight relevance assessment');
      }
    }
  }

  if (results.length > 0 && !hasQualityMetadata) {
    console.warn('⚠️  No highlight quality metadata found in results');
  }

  return hasQualityMetadata;
}

// Initialize test runner and clients
const testRunner = new TestRunner();
const rateLimiter = new TestRateLimiter();

const secClient = new SECWebSearchClient(rateLimiter);
const courtClient = new CourtListenerWebSearchClient(rateLimiter);
const epaClient = new EPAWebSearchClient(rateLimiter);

// SEC WebSearchClient Tests
testRunner.addTest('SEC: Search SEC Filings', async () => {
  const response = await secClient.searchSECFilingsWeb({
    query: 'revenue quarterly report',
    company_identifier: 'AAPL',
    limit: 2
  });

  const data = validateResponse(response, ['search_type', 'results']);
  
  if (data.search_type !== 'sec_filings_web') {
    throw new Error('Incorrect search type');
  }
  
  if (!Array.isArray(data.results)) {
    throw new Error('Results should be an array');
  }

  // Validate highlight quality if present
  validateHighlightQuality(data);
  
  console.log(`   Found ${data.results.length} SEC filing results`);
});

testRunner.addTest('SEC: Get Filing Details', async () => {
  // First search for a filing
  const searchResponse = await secClient.searchSECFilingsWeb({
    query: 'quarterly report',
    company_identifier: 'MSFT',
    limit: 1
  });

  const searchData = validateResponse(searchResponse, ['results']);
  
  if (searchData.results.length === 0) {
    throw new Error('No search results to test filing details');
  }

  const filing = searchData.results[0];
  if (!filing.url) {
    throw new Error('Filing missing URL for details test');
  }

  const detailsResponse = await secClient.getSECFilingDetailsWeb({
    filing_url: filing.url,
    include_full_text: false
  });

  const detailsData = validateResponse(detailsResponse, ['filing']);
  
  console.log(`   Retrieved details for filing: ${detailsData.filing.title || 'Unknown'}`);
});

// CourtListener WebSearchClient Tests
testRunner.addTest('CourtListener: Search Opinions', async () => {
  const response = await courtClient.searchOpinionsWeb({
    query: 'Miranda rights',
    limit: 2
  });

  const data = validateResponse(response, ['search_type', 'results']);
  
  if (data.search_type !== 'courtlistener_opinions_web') {
    throw new Error('Incorrect search type');
  }

  // Validate legal metadata if present
  if (data._search_quality && data._search_quality.legal_metadata) {
    const legal = data._search_quality.legal_metadata;
    if (!legal.jurisdiction_coverage || !legal.court_levels) {
      throw new Error('Missing legal metadata components');
    }
  }

  // Validate highlight quality
  validateHighlightQuality(data);
  
  console.log(`   Found ${data.results.length} court opinions with enhanced highlights`);
});

testRunner.addTest('CourtListener: Citation Lookup', async () => {
  const response = await courtClient.lookupCitationWeb({
    citation: '410 U.S. 113',
    limit: 1
  });

  const data = validateResponse(response, ['search_type', 'results']);
  
  if (data.search_type !== 'courtlistener_citation_web') {
    throw new Error('Incorrect search type');
  }

  console.log(`   Found ${data.results.length} results for citation lookup`);
});

// EPA WebSearchClient Tests
testRunner.addTest('EPA: Search Facilities', async () => {
  const response = await epaClient.searchFacilitiesWeb({
    facility_name: 'chemical plant',
    state: 'CA',
    limit: 2
  });

  const data = validateResponse(response, ['facilities', 'total_facilities']);
  
  if (!Array.isArray(data.facilities)) {
    throw new Error('Facilities should be an array');
  }

  // Validate facility data structure
  if (data.facilities.length > 0) {
    const facility = data.facilities[0];
    if (!facility.name || !facility.compliance) {
      throw new Error('Facility missing required fields');
    }
  }

  // Validate highlight quality
  validateHighlightQuality(data);
  
  console.log(`   Found ${data.facilities.length} EPA facilities`);
});

testRunner.addTest('EPA: Get Compliance Report', async () => {
  // Use a known facility ID or skip if none available
  const facilityId = '110000350996'; // Example facility ID
  
  try {
    const response = await epaClient.getFacilityComplianceReportWeb({
      facility_id: facilityId,
      include_violations: true,
      include_enforcement: true
    });

    const data = validateResponse(response, ['facility', 'compliance_summary']);
    
    console.log(`   Retrieved compliance report for facility ID: ${facilityId}`);
  } catch (error) {
    if (error.message.includes('not found')) {
      console.log(`   Facility ${facilityId} not found - this is expected for test data`);
    } else {
      throw error;
    }
  }
});

// Base functionality tests
testRunner.addTest('BaseWebSearchClient: Quality Assessment', async () => {
  // Test that BaseWebSearchClient methods are available
  if (typeof secClient.assessHighlightQuality !== 'function') {
    throw new Error('BaseWebSearchClient methods not properly inherited');
  }

  if (typeof secClient.generateHighlightQuery !== 'function') {
    throw new Error('BaseWebSearchClient highlight query generation not available');
  }

  // Test highlight query generation
  const query = secClient.generateHighlightQuery(null, 'Apple revenue', 'securities');
  if (!query || typeof query !== 'string') {
    throw new Error('Highlight query generation failed');
  }

  console.log(`   Generated highlight query: "${query}"`);
});

testRunner.addTest('Error Handling: Invalid API Key', async () => {
  // Temporarily break the API key to test error handling
  const originalKey = process.env.EXA_API_KEY;
  process.env.EXA_API_KEY = 'invalid_key';
  
  const testClient = new SECWebSearchClient(rateLimiter);
  
  try {
    await testClient.searchSECFilingsWeb({
      query: 'test query',
      limit: 1
    });
    throw new Error('Should have failed with invalid API key');
  } catch (error) {
    if (!error.message.includes('Exa API error')) {
      throw new Error('Expected Exa API error message');
    }
  } finally {
    // Restore original key
    process.env.EXA_API_KEY = originalKey;
  }
  
  console.log('   Error handling works correctly for invalid API key');
});

testRunner.addTest('Response Format: MCP Compatibility', async () => {
  const response = await secClient.searchSECFilingsWeb({
    query: 'test',
    limit: 1
  });

  // Validate MCP response format
  if (!response.content || !Array.isArray(response.content)) {
    throw new Error('Response not MCP compatible - missing content array');
  }

  const content = response.content[0];
  if (!content || content.type !== 'text' || typeof content.text !== 'string') {
    throw new Error('Response content not MCP compatible');
  }

  // Should be valid JSON
  JSON.parse(content.text);
  
  console.log('   Response format is MCP compatible');
});

// Run all tests
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check environment
  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY environment variable not set');
    console.error('   Please add EXA_API_KEY to your .env file');
    process.exit(1);
  }

  testRunner.runAll().then(() => {
    process.exit(testRunner.results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { testRunner, validateResponse, validateHighlightQuality };
#!/usr/bin/env node

/**
 * Test Quality Feedback Integration
 * Verifies that all three enhanced clients return _search_quality metadata
 */

import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';  
import { FederalRegisterWebSearchClient } from './src/api-clients/FederalRegisterWebSearchClient.js';

// Mock rate limiter
const mockRateLimiter = {
  enforce: async () => {}
};

// Mock Exa API for testing (avoid actual API calls)
const originalFetch = global.fetch;

function mockExaResponse(results = []) {
  return {
    ok: true,
    json: async () => ({
      results: results
    })
  };
}

function setupMockFetch() {
  global.fetch = async (url, options) => {
    if (url.includes('api.exa.ai')) {
      // Return mock Exa response with one test result
      return mockExaResponse([
        {
          title: 'Test Case: Smith v. Jones',
          url: 'https://www.courtlistener.com/opinion/123456/',
          score: 0.85,
          text: 'This is a test court opinion about contract disputes.',
          publishedDate: '2024-03-15',
          highlights: ['contract dispute', 'legal precedent']
        }
      ]);
    }
    return originalFetch(url, options);
  };
}

function restoreFetch() {
  global.fetch = originalFetch;
}

async function testCourtListenerQuality() {
  console.log('🧪 Testing CourtListener quality feedback...');
  
  const client = new CourtListenerWebSearchClient(mockRateLimiter);
  
  try {
    const result = await client.searchCasesWeb({
      query: 'contract dispute',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    // Check for _search_quality field
    if (parsed._search_quality) {
      console.log('✅ CourtListener: _search_quality field present');
      
      // Check required fields
      const quality = parsed._search_quality;
      const requiredFields = ['query_relevance', 'query_coverage', 'answer_confidence', 'query_suggestions'];
      
      for (const field of requiredFields) {
        if (quality[field] !== undefined) {
          console.log(`✅ CourtListener: ${field} field present`);
        } else {
          console.log(`❌ CourtListener: ${field} field missing`);
        }
      }
      
      // Check case law specific metadata
      if (quality.legal_metadata) {
        console.log('✅ CourtListener: legal_metadata present');
      } else {
        console.log('❌ CourtListener: legal_metadata missing');
      }
      
    } else {
      console.log('❌ CourtListener: _search_quality field missing');
    }
    
  } catch (error) {
    console.log(`❌ CourtListener test failed: ${error.message}`);
  }
}

async function testSECQuality() {
  console.log('🧪 Testing SEC quality feedback...');
  
  const client = new SECWebSearchClient(mockRateLimiter);
  
  try {
    const result = await client.searchSECFilingsWeb({
      company_identifier: 'AAPL',
      filing_type: '10-K',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    // Check for _search_quality field
    if (parsed._search_quality) {
      console.log('✅ SEC: _search_quality field present');
      
      // Check required fields
      const quality = parsed._search_quality;
      const requiredFields = ['query_relevance', 'query_coverage', 'answer_confidence', 'query_suggestions'];
      
      for (const field of requiredFields) {
        if (quality[field] !== undefined) {
          console.log(`✅ SEC: ${field} field present`);
        } else {
          console.log(`❌ SEC: ${field} field missing`);
        }
      }
      
      // Check SEC specific metadata
      if (quality.sec_metadata) {
        console.log('✅ SEC: sec_metadata present');
      } else {
        console.log('❌ SEC: sec_metadata missing');
      }
      
    } else {
      console.log('❌ SEC: _search_quality field missing');
    }
    
  } catch (error) {
    console.log(`❌ SEC test failed: ${error.message}`);
  }
}

async function testFederalRegisterQuality() {
  console.log('🧪 Testing Federal Register quality feedback...');
  
  const client = new FederalRegisterWebSearchClient(mockRateLimiter);
  
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'environmental protection',
      agency: 'EPA',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    // Check for _search_quality field
    if (parsed._search_quality) {
      console.log('✅ Federal Register: _search_quality field present');
      
      // Check required fields
      const quality = parsed._search_quality;
      const requiredFields = ['query_relevance', 'query_coverage', 'answer_confidence', 'query_suggestions'];
      
      for (const field of requiredFields) {
        if (quality[field] !== undefined) {
          console.log(`✅ Federal Register: ${field} field present`);
        } else {
          console.log(`❌ Federal Register: ${field} field missing`);
        }
      }
      
      // Check regulatory specific metadata
      if (quality.regulatory_metadata) {
        console.log('✅ Federal Register: regulatory_metadata present');
      } else {
        console.log('❌ Federal Register: regulatory_metadata missing');
      }
      
    } else {
      console.log('❌ Federal Register: _search_quality field missing');
    }
    
  } catch (error) {
    console.log(`❌ Federal Register test failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Quality Feedback Integration Tests\n');
  
  // Set up mock environment
  process.env.EXA_API_KEY = 'test-key'; // Mock API key
  setupMockFetch();
  
  try {
    await testCourtListenerQuality();
    console.log('');
    
    await testSECQuality();
    console.log('');
    
    await testFederalRegisterQuality();
    console.log('');
    
    console.log('✅ All quality feedback integration tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    // Clean up
    restoreFetch();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
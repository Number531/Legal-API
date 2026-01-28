#!/usr/bin/env node
/**
 * Mock Tests for FederalRegisterWebSearchClient
 * Tests all functionality with mock Exa responses
 */

import { FederalRegisterWebSearchClient } from '../src/api-clients/FederalRegisterWebSearchClient.js';
import assert from 'assert';

class MockRateLimiter {
  async enforce() { return Promise.resolve(); }
}

class MockFederalRegisterWebSearchClient extends FederalRegisterWebSearchClient {
  async executeExaSearch(query, limit, includeContents) {
    // Mock responses based on query content
    const mockResponses = {
      'environmental protection': [
        {
          title: 'EPA Clean Air Standards - Final Rule',
          url: 'https://www.federalregister.gov/documents/2025/01/06/2025-12345/clean-air-standards-final-rule',
          publishedDate: '2025-01-06',
          score: 0.95,
          text: includeContents ? 
            'SUMMARY: The Environmental Protection Agency (EPA) is issuing final standards for clean air emissions from industrial facilities. AGENCY: Environmental Protection Agency ACTION: Final rule EFFECTIVE DATE: March 1, 2025' 
            : undefined
        }
      ],
      'consumer protection': [
        {
          title: 'FTC Consumer Protection Rule Enhancement',
          url: 'https://www.federalregister.gov/documents/2025/01/05/2025-11111/consumer-protection-rule-enhancement',
          publishedDate: '2025-01-05', 
          score: 0.92,
          text: includeContents ? 
            'SUMMARY: The Federal Trade Commission (FTC) is enhancing consumer protection measures for digital marketplaces. AGENCY: Federal Trade Commission ACTION: Proposed rule EFFECTIVE DATE: April 15, 2025'
            : undefined
        }
      ],
      'healthcare reform': [
        {
          title: 'HHS Healthcare Reform Implementation Guidelines',
          url: 'https://www.federalregister.gov/documents/2025/01/04/2025-10001/healthcare-reform-implementation',
          publishedDate: '2025-01-04',
          score: 0.88,
          text: includeContents ?
            'SUMMARY: Department of Health and Human Services implements new healthcare reform guidelines. AGENCY: Department of Health and Human Services ACTION: Notice BACKGROUND: This notice provides implementation guidance for healthcare providers.'
            : undefined
        }
      ],
      'food safety': [
        {
          title: 'FDA Food Safety Modernization Standards',
          url: 'https://www.federalregister.gov/documents/2025/01/03/2025-09999/food-safety-modernization-standards',
          publishedDate: '2025-01-03',
          score: 0.90,
          text: includeContents ?
            'SUMMARY: The Food and Drug Administration (FDA) establishes modernized food safety standards for processing facilities. AGENCY: Food and Drug Administration ACTION: Final rule SUPPLEMENTARY INFORMATION: These standards improve food safety protocols nationwide.'
            : undefined
        }
      ]
    };

    // Find matching mock response
    for (const [key, response] of Object.entries(mockResponses)) {
      if (query.toLowerCase().includes(key)) {
        return response.slice(0, limit);
      }
    }

    // Default empty response
    return [];
  }
}

async function runMockTests() {
  console.log('🧪 Running FederalRegisterWebSearchClient Mock Tests');
  console.log('=' + '='.repeat(55));

  const rateLimiter = new MockRateLimiter();
  const client = new MockFederalRegisterWebSearchClient(rateLimiter);

  let passedTests = 0;
  const totalTests = 8;

  // Test 1: Basic search functionality
  console.log('\n🔍 Test 1: Basic search functionality');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'environmental protection'
    });

    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.search_type === 'federal_register_web', 'Search type should be federal_register_web');
    assert(parsed.documents.length > 0, 'Should return documents');
    assert(parsed.documents[0].title.includes('EPA'), 'Should contain EPA document');
    
    console.log('  ✅ Basic search works correctly');
    passedTests++;
  } catch (error) {
    console.error('  ❌ Basic search failed:', error.message);
  }

  // Test 2: Agency filtering
  console.log('\n🏛️  Test 2: Agency filtering');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'consumer protection',
      agency: 'FTC',
      include_snippet: true
    });

    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.documents.length > 0, 'Should return FTC documents');
    assert(parsed.documents[0].agency === 'Federal Trade Commission', 'Should extract correct agency');
    
    console.log('  ✅ Agency filtering works correctly');
    passedTests++;
  } catch (error) {
    console.error('  ❌ Agency filtering failed:', error.message);
    try {
      const result2 = await client.searchFederalRegisterWeb({
        search_term: 'consumer protection',
        agency: 'FTC',
        include_snippet: true
      });
      console.error('    📊 Actual agency:', JSON.parse(result2.content[0].text).documents[0]?.agency);
    } catch (e) {
      console.error('    📊 Could not get debug info');
    }
  }

  // Test 3: Document type extraction
  console.log('\n📄 Test 3: Document type extraction');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'healthcare reform',
      include_snippet: true
    });

    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.documents.length > 0, 'Should return documents');
    console.log('    📊 Found document type:', parsed.documents[0].document_type);
    assert(parsed.documents[0].document_type === 'Notice', 'Should extract document type correctly');
    
    console.log('  ✅ Document type extraction works correctly');
    passedTests++;
  } catch (error) {
    console.error('  ❌ Document type extraction failed:', error.message);
    try {
      const result2 = await client.searchFederalRegisterWeb({
        search_term: 'healthcare reform',
        include_snippet: true
      });
      console.error('    📊 Actual document type:', JSON.parse(result2.content[0].text).documents[0]?.document_type);
    } catch (e) {
      console.error('    📊 Could not get debug info');
    }
  }

  // Test 4: Snippet extraction
  console.log('\n📝 Test 4: Snippet extraction');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'food safety',
      include_snippet: true
    });

    const parsed = JSON.parse(result.content[0].text);
    const doc = parsed.documents[0];
    assert(doc.snippet, 'Should include snippet');
    assert(doc.snippet.includes('food safety'), 'Snippet should contain relevant content');
    assert(doc.snippet.length > 50, 'Snippet should be meaningful length');
    
    console.log('  ✅ Snippet extraction works correctly');
    console.log(`    📄 Sample snippet: ${doc.snippet.substring(0, 100)}...`);
    passedTests++;
  } catch (error) {
    console.error('  ❌ Snippet extraction failed:', error.message);
  }

  // Test 5: Full text inclusion
  console.log('\n📖 Test 5: Full text inclusion');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'environmental protection',
      include_text: true
    });

    const parsed = JSON.parse(result.content[0].text);
    const doc = parsed.documents[0];
    assert(doc.full_text, 'Should include full text');
    assert(doc.snippet, 'Should also include snippet when full text is requested');
    assert(doc.full_text.length >= doc.snippet.length, 'Full text should be same or longer than snippet');
    
    console.log('  ✅ Full text inclusion works correctly');
    passedTests++;
  } catch (error) {
    console.error('  ❌ Full text inclusion failed:', error.message);
  }

  // Test 6: Document number extraction
  console.log('\n🔢 Test 6: Document number extraction');
  try {
    const result = await client.searchFederalRegisterWeb({
      search_term: 'consumer protection'
    });

    const parsed = JSON.parse(result.content[0].text);
    const doc = parsed.documents[0];
    assert(doc.document_number, 'Should extract document number');
    assert(/\d{4}-\d{5}/.test(doc.document_number), 'Document number should match pattern');
    
    console.log('  ✅ Document number extraction works correctly');
    console.log(`    🔢 Document number: ${doc.document_number}`);
    passedTests++;
  } catch (error) {
    console.error('  ❌ Document number extraction failed:', error.message);
  }

  // Test 7: Input validation
  console.log('\n🛡️  Test 7: Input validation');
  try {
    let errorThrown = false;
    try {
      await client.searchFederalRegisterWeb({});
    } catch (error) {
      errorThrown = true;
      assert(error.message.includes('search_term is required'), 'Should require search_term');
    }
    assert(errorThrown, 'Should throw error for missing search_term');
    
    console.log('  ✅ Input validation works correctly');
    passedTests++;
  } catch (error) {
    console.error('  ❌ Input validation failed:', error.message);
  }

  // Test 8: Query building
  console.log('\n🔧 Test 8: Query building');
  try {
    const client2 = new MockFederalRegisterWebSearchClient(rateLimiter);
    const query = client2.buildFederalRegisterQuery({
      search_term: 'climate change',
      agency: 'EPA',
      document_type: 'rule'
    });

    assert(query.includes('site:federalregister.gov'), 'Should include site restriction');
    assert(query.includes('climate change'), 'Should include search term');
    assert(query.includes('Environmental Protection Agency'), 'Should expand EPA to full name');
    assert(query.includes('Final Rule'), 'Should expand rule to Final Rule');
    
    console.log('  ✅ Query building works correctly');
    console.log(`    🔍 Built query: ${query}`);
    passedTests++;
  } catch (error) {
    console.error('  ❌ Query building failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Mock Tests Complete: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All mock tests passed! FederalRegisterWebSearchClient is ready for live testing.');
    return true;
  } else {
    console.log('❌ Some mock tests failed. Please fix issues before proceeding to live tests.');
    return false;
  }
}

// Run the tests
runMockTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
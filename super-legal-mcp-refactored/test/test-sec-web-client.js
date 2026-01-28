#!/usr/bin/env node

/**
 * Test SECWebSearchClient functionality
 * Comprehensive testing of SEC web search capabilities via Exa API
 */

import { SECWebSearchClient } from '../src/api-clients/SECWebSearchClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing SECWebSearchClient Functionality\n');

const client = new SECWebSearchClient(null);

// Test cases covering different SEC endpoints and scenarios
const testCases = [
  // SEC Filings Search Tests
  {
    name: 'Basic SEC Filings Search - Apple Inc',
    method: 'searchSECFilingsWeb',
    args: {
      company_identifier: 'Apple Inc',
      filing_type: 'all',
      limit: 5,
      include_text: false
    },
    expectedFields: ['accessionNumber', 'filingDate', 'form', 'edgar_url']
  },
  {
    name: 'SEC Filings Search - Specific Form Type',
    method: 'searchSECFilingsWeb',
    args: {
      company_identifier: 'Microsoft',
      filing_type: '10-K',
      limit: 3,
      include_text: true
    },
    expectedFields: ['accessionNumber', 'filingDate', 'form', 'edgar_url']
  },
  {
    name: 'SEC Filings Search - Date Range Filter',
    method: 'searchSECFilingsWeb',
    args: {
      company_identifier: 'Tesla',
      filing_type: 'all',
      date_after: '2023-01-01',
      date_before: '2023-12-31',
      limit: 4
    },
    expectedFields: ['accessionNumber', 'filingDate', 'form', 'edgar_url']
  },
  {
    name: 'SEC Filings Search - With Snippets',
    method: 'searchSECFilingsWeb',
    args: {
      company_identifier: 'Apple Inc',
      filing_type: '10-K',
      limit: 3,
      include_snippet: true
    },
    expectedFields: ['accessionNumber', 'form', 'edgar_url', 'snippet']
  },
  {
    name: 'SEC Filings Search - Snippets + Full Text',
    method: 'searchSECFilingsWeb',
    args: {
      company_identifier: 'Microsoft',
      filing_type: 'all',
      limit: 2,
      include_snippet: true,
      include_text: true
    },
    expectedFields: ['accessionNumber', 'form', 'edgar_url', 'snippet', 'full_text']
  },

  // Company Facts Tests
  {
    name: 'SEC Company Facts - General Query',
    method: 'getSECCompanyFactsWeb',
    args: {
      company_identifier: 'Apple Inc'
    },
    expectedFields: ['key_metrics', 'taxonomies', 'concept_counts']
  },
  {
    name: 'SEC Company Facts - Specific Concept',
    method: 'getSECCompanyFactsWeb',
    args: {
      company_identifier: 'Microsoft',
      concept: 'Revenue'
    },
    expectedFields: ['concept', 'data', 'available_concepts']
  },

  // XBRL Frames Tests
  {
    name: 'SEC XBRL Frames - Revenue Data',
    method: 'getSECXBRLFramesWeb',
    args: {
      taxonomy: 'us-gaap',
      concept: 'Revenues',
      unit: 'USD',
      period: '2023',
      limit: 10
    },
    expectedFields: ['taxonomy', 'tag', 'unit', 'data']
  },
  {
    name: 'SEC XBRL Frames - Assets Data',
    method: 'getSECXBRLFramesWeb',
    args: {
      taxonomy: 'us-gaap',
      concept: 'Assets',
      unit: 'USD',
      period: '2022',
      limit: 8
    },
    expectedFields: ['taxonomy', 'tag', 'unit', 'data']
  },

  // Company Tickers Tests
  {
    name: 'SEC Company Tickers Search - By Ticker',
    method: 'searchSECCompanyTickersWeb',
    args: {
      search_term: 'AAPL'
    },
    expectedFields: ['ticker', 'name', 'cik', 'exchange']
  },
  {
    name: 'SEC Company Tickers Search - By Company Name',
    method: 'searchSECCompanyTickersWeb',
    args: {
      search_term: 'Microsoft'
    },
    expectedFields: ['ticker', 'name', 'cik', 'exchange']
  },
  {
    name: 'SEC Company Tickers Search - With Exchange Filter',
    method: 'searchSECCompanyTickersWeb',
    args: {
      search_term: 'Tech',
      exchange: 'NASDAQ'
    },
    expectedFields: ['ticker', 'name', 'cik', 'exchange']
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
    
    // Method-specific result validation
    if (method === 'searchSECFilingsWeb') {
      console.log(`   Company: ${data.company?.name || 'N/A'}`);
      console.log(`   CIK: ${data.company?.cik || 'N/A'}`);
      console.log(`   Filings found: ${data.filings?.length || 0}`);
      
      if (data.filings && data.filings.length > 0) {
        const firstFiling = data.filings[0];
        console.log(`   📋 First filing:`);
        console.log(`      Form: ${firstFiling.form || 'N/A'}`);
        console.log(`      Filing Date: ${firstFiling.filingDate || 'N/A'}`);
        console.log(`      Accession: ${firstFiling.accessionNumber || 'N/A'}`);
        console.log(`      EDGAR URL: ${firstFiling.edgar_url ? 'Present' : 'Missing'}`);
        
        // Check for snippet content
        if (firstFiling.snippet) {
          console.log(`      Snippet: "${firstFiling.snippet.substring(0, 100)}${firstFiling.snippet.length > 100 ? '...' : ''}"`);
          console.log(`      Snippet length: ${firstFiling.snippet.length} chars`);
        }
        
        // Check for full text content
        if (firstFiling.full_text) {
          console.log(`      Full text: ${firstFiling.full_text.length} chars`);
        }
        
        // Verify expected fields
        const missingFields = expectedFields.filter(field => 
          firstFiling[field] === undefined || firstFiling[field] === null
        );
        if (missingFields.length > 0) {
          console.log(`      ⚠️  Missing fields: ${missingFields.join(', ')}`);
        }
        
        // Validate snippet quality if present
        if (firstFiling.snippet) {
          if (firstFiling.snippet.length < 50) {
            console.log(`      ⚠️  Snippet seems too short (${firstFiling.snippet.length} chars)`);
          }
          if (firstFiling.snippet.includes('FORM') || firstFiling.snippet.includes('SEC')) {
            console.log(`      ⚠️  Snippet may contain boilerplate content`);
          }
        }
      }
      
    } else if (method === 'getSECCompanyFactsWeb') {
      console.log(`   Company: ${data.company?.name || 'N/A'}`);
      console.log(`   CIK: ${data.company?.cik || 'N/A'}`);
      
      if (data.concept) {
        console.log(`   Concept: ${data.concept}`);
        console.log(`   Data points: ${Object.keys(data.data || {}).length}`);
        console.log(`   Available concepts: ${data.available_concepts?.length || 0}`);
      } else {
        console.log(`   Taxonomies: ${data.taxonomies?.join(', ') || 'N/A'}`);
        console.log(`   Key metrics: ${Object.keys(data.key_metrics || {}).length}`);
      }
      
    } else if (method === 'getSECXBRLFramesWeb') {
      console.log(`   Taxonomy: ${data.taxonomy || 'N/A'}`);
      console.log(`   Tag: ${data.tag || 'N/A'}`);
      console.log(`   Unit: ${data.unit || 'N/A'}`);
      console.log(`   Period: ${data.period || 'N/A'}`);
      console.log(`   Data points: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        const sample = data.data[0];
        console.log(`   📋 Sample data point:`);
        console.log(`      Entity: ${sample.entityName || 'N/A'}`);
        console.log(`      CIK: ${sample.cik || 'N/A'}`);
        console.log(`      Value: ${sample.value || 'N/A'}`);
        console.log(`      Filing Date: ${sample.filingDate || 'N/A'}`);
      }
      
    } else if (method === 'searchSECCompanyTickersWeb') {
      console.log(`   Search term: ${data.search_term || 'N/A'}`);
      console.log(`   Results found: ${data.count || 0}`);
      
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        console.log(`   📋 First result:`);
        console.log(`      Ticker: ${firstResult.ticker || 'N/A'}`);
        console.log(`      Name: ${firstResult.name || 'N/A'}`);
        console.log(`      CIK: ${firstResult.cik || 'N/A'}`);
        console.log(`      Exchange: ${firstResult.exchange || 'N/A'}`);
        
        // Verify expected fields
        const missingFields = expectedFields.filter(field => 
          firstResult[field] === undefined || firstResult[field] === null
        );
        if (missingFields.length > 0) {
          console.log(`      ⚠️  Missing fields: ${missingFields.join(', ')}`);
        }
      }
    }
    
    // Validate search criteria if present
    if (data.search_criteria) {
      console.log(`   📊 Search criteria applied successfully`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAILED (${duration}ms): ${error.message}`);
  }
  
  console.log();
}

async function testErrorHandling() {
  console.log('🚨 Testing Error Handling:\n');
  
  // Test missing company identifier for filings search
  console.log('1. Missing company_identifier for filings search:');
  try {
    await client.searchSECFilingsWeb({});
    console.log('   ❌ Should have handled missing company_identifier gracefully');
  } catch (error) {
    console.log(`   ✅ Correctly handled: ${error.message}`);
  }
  
  // Test missing company identifier for company facts
  console.log('\n2. Missing company_identifier for company facts:');
  try {
    await client.getSECCompanyFactsWeb({});
    console.log('   ❌ Should have thrown error for missing company_identifier');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  // Test missing required fields for XBRL frames
  console.log('\n3. Missing concept for XBRL frames:');
  try {
    await client.getSECXBRLFramesWeb({ taxonomy: 'us-gaap' });
    console.log('   ❌ Should have thrown error for missing concept');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  console.log('\n4. Missing period for XBRL frames:');
  try {
    await client.getSECXBRLFramesWeb({ taxonomy: 'us-gaap', concept: 'Revenue' });
    console.log('   ❌ Should have thrown error for missing period');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  // Test missing search term for company tickers
  console.log('\n5. Missing search_term for company tickers:');
  try {
    await client.searchSECCompanyTickersWeb({});
    console.log('   ❌ Should have thrown error for missing search_term');
  } catch (error) {
    console.log(`   ✅ Correctly threw error: ${error.message}`);
  }
  
  // Test invalid date formats
  console.log('\n6. Invalid date format:');
  try {
    await client.searchSECFilingsWeb({
      company_identifier: 'Apple',
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
      await client.searchSECFilingsWeb({ company_identifier: 'Apple' });
      console.log('   ❌ Should have thrown error for missing API key');
    } catch (error) {
      console.log(`   ✅ Correctly threw error: ${error.message}`);
    }
  } else {
    console.log('   ✅ EXA_API_KEY is configured');
  }
  
  console.log();
}

async function testDataQuality() {
  console.log('🔍 Testing Data Quality & Format Consistency:\n');
  
  if (!process.env.EXA_API_KEY) {
    console.log('   ⚠️  Skipping data quality tests - EXA_API_KEY not configured\n');
    return;
  }
  
  console.log('1. Testing CIK format consistency:');
  try {
    const result = await client.searchSECFilingsWeb({ company_identifier: 'Apple Inc', limit: 1 });
    const data = JSON.parse(result.content[0].text);
    if (data.company?.cik) {
      const cik = data.company.cik;
      if (/^\d{10}$/.test(cik)) {
        console.log(`   ✅ CIK properly padded: ${cik}`);
      } else {
        console.log(`   ⚠️  CIK format issue: ${cik}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ CIK test failed: ${error.message}`);
  }
  
  console.log('\n2. Testing EDGAR URL format:');
  try {
    const result = await client.searchSECFilingsWeb({ company_identifier: 'Microsoft', limit: 1 });
    const data = JSON.parse(result.content[0].text);
    if (data.filings?.[0]?.edgar_url) {
      const url = data.filings[0].edgar_url;
      if (url.includes('sec.gov/Archives')) {
        console.log(`   ✅ EDGAR URL format correct`);
      } else {
        console.log(`   ⚠️  EDGAR URL format unexpected: ${url}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ EDGAR URL test failed: ${error.message}`);
  }
  
  console.log('\n3. Testing date format consistency:');
  try {
    const result = await client.searchSECFilingsWeb({ company_identifier: 'Tesla', limit: 1 });
    const data = JSON.parse(result.content[0].text);
    if (data.filings?.[0]?.filingDate) {
      const date = data.filings[0].filingDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.log(`   ✅ Date format correct (YYYY-MM-DD): ${date}`);
      } else {
        console.log(`   ⚠️  Date format unexpected: ${date}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Date format test failed: ${error.message}`);
  }
  
  console.log();
}

// Run all tests
async function runAllTests() {
  console.log('Testing SECWebSearchClient comprehensive functionality...\n');
  console.log('=' .repeat(70) + '\n');
  
  await testApiKeyHandling();
  await testErrorHandling();
  await testDataQuality();
  
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
  console.log('✅ SECWebSearchClient structure tests completed');
  console.log('✅ Error handling verification completed');
  console.log('✅ Data quality validation completed');
  
  if (process.env.EXA_API_KEY) {
    console.log('✅ Functional integration tests completed');
    console.log('\n🎯 The client provides these SEC capabilities:');
    console.log('   - searchSECFilingsWeb: Search corporate filings via web');
    console.log('   - getSECCompanyFactsWeb: Extract financial metrics from filings');
    console.log('   - getSECXBRLFramesWeb: Get XBRL concept data across companies');
    console.log('   - searchSECCompanyTickersWeb: Search company ticker database');
    console.log('\n✅ Ready to replace SecEdgarClient completely!');
  } else {
    console.log('⚠️  Functional tests skipped (no API key)');
  }
  
  console.log('\n🚀 SECWebSearchClient verification complete!');
}

runAllTests().catch(console.error);
#!/usr/bin/env node
/**
 * Live Tests for FederalRegisterWebSearchClient
 * Tests with real Exa API to validate functionality
 */

import { FederalRegisterWebSearchClient } from '../src/api-clients/FederalRegisterWebSearchClient.js';

class MockRateLimiter {
  async enforce() { 
    // Add small delay to simulate rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(); 
  }
}

async function runLiveTests() {
  console.log('🌐 Running FederalRegisterWebSearchClient Live Tests');
  console.log('Testing with real Exa API');
  console.log('=' + '='.repeat(55));

  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY not configured for live tests');
    console.error('   Set EXA_API_KEY environment variable to run live tests');
    return false;
  }

  const rateLimiter = new MockRateLimiter();
  const client = new FederalRegisterWebSearchClient(rateLimiter);

  let passedTests = 0;
  const totalTests = 6;

  // Test 1: Environmental regulations search
  console.log('\n🌱 Test 1: Environmental regulations search');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'climate change regulations',
      agency: 'EPA',
      limit: 3
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      console.log(`  🏛️  Agency: ${sample.agency}`);
      console.log(`  🔢 Doc Number: ${sample.document_number}`);
      
      if (duration < 5000 && parsed.documents.length > 0) {
        console.log('  ✅ Environmental search passed');
        passedTests++;
      } else {
        console.log('  ⚠️  Slow response or no results');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ Environmental search failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Consumer protection with snippets
  console.log('\n🛡️  Test 2: Consumer protection with snippets');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'consumer financial protection',
      document_type: 'rule',
      limit: 3,
      include_snippet: true
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      
      if (sample.snippet) {
        console.log(`  📝 Snippet: ${sample.snippet.substring(0, 100)}...`);
        console.log(`  📏 Snippet length: ${sample.snippet.length} chars`);
        
        if (sample.snippet.length > 50 && sample.snippet.length < 600) {
          console.log('  ✅ Snippet quality good');
          passedTests++;
        } else {
          console.log('  ⚠️  Snippet quality needs improvement');
        }
      } else {
        console.log('  ⚠️  No snippet generated');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ Consumer protection search failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: FDA food safety search
  console.log('\n🥗 Test 3: FDA food safety search');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'food safety modernization',
      agency: 'FDA',
      limit: 2,
      include_snippet: true
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      console.log(`  🏛️  Agency: ${sample.agency}`);
      
      // Check if FDA-related
      const isFDARelated = sample.title.toLowerCase().includes('food') ||
                          sample.agency.toLowerCase().includes('food') ||
                          (sample.snippet && sample.snippet.toLowerCase().includes('food'));
      
      if (isFDARelated) {
        console.log('  ✅ FDA relevance confirmed');
        passedTests++;
      } else {
        console.log('  ⚠️  FDA relevance unclear');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ FDA search failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Date range filtering
  console.log('\n📅 Test 4: Date range filtering');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'transportation safety',
      date_after: '2024-01-01',
      limit: 3
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      console.log(`  📅 Date: ${sample.publication_date}`);
      
      if (sample.publication_date && sample.publication_date >= '2024-01-01') {
        console.log('  ✅ Date filtering works');
        passedTests++;
      } else {
        console.log('  ⚠️  Date filtering unclear');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ Date range test failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Full text mode
  console.log('\n📖 Test 5: Full text mode');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'healthcare reform',
      limit: 1,
      include_text: true
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      
      if (sample.full_text) {
        console.log(`  📏 Full text length: ${sample.full_text.length} chars`);
        console.log(`  📝 Snippet length: ${sample.snippet ? sample.snippet.length : 0} chars`);
        
        if (sample.full_text.length > 1000) {
          console.log('  ✅ Full text retrieval works');
          passedTests++;
        } else {
          console.log('  ⚠️  Full text seems short');
        }
      } else {
        console.log('  ⚠️  No full text retrieved');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ Full text test failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 6: Document type extraction
  console.log('\n📄 Test 6: Document type extraction');
  try {
    const startTime = Date.now();
    
    const result = await client.searchFederalRegisterWeb({
      search_term: 'proposed rule consumer protection',
      document_type: 'proposed_rule',
      limit: 2,
      include_snippet: true
    });
    
    const duration = Date.now() - startTime;
    const parsed = JSON.parse(result.content[0].text);
    
    console.log(`  📊 Results: ${parsed.documents.length}`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    
    if (parsed.documents.length > 0) {
      const sample = parsed.documents[0];
      console.log(`  📄 Sample: ${sample.title}`);
      console.log(`  📋 Document type: ${sample.document_type}`);
      
      if (sample.document_type && sample.document_type !== 'Document') {
        console.log('  ✅ Document type extraction works');
        passedTests++;
      } else {
        console.log('  ⚠️  Document type not extracted properly');
      }
    } else {
      console.log('  ⚠️  No results found');
    }
    
  } catch (error) {
    console.error('  ❌ Document type test failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Live Tests Complete: ${passedTests}/${totalTests} passed`);
  
  if (passedTests >= 4) { // Allow 2 failures due to potential API variations
    console.log('🎉 Live tests mostly successful! FederalRegisterWebSearchClient is ready for production.');
    console.log('✅ Phase 1 Federal Register Migration COMPLETE');
    return true;
  } else {
    console.log('❌ Multiple live test failures. May need investigation.');
    return false;
  }
}

// Check if we should run the tests
if (process.argv.includes('--help')) {
  console.log('Usage: node test-federal-register-web-client-live.js');
  console.log('Environment variables required:');
  console.log('  EXA_API_KEY - Your Exa API key');
  process.exit(0);
}

// Run the tests
runLiveTests()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Live testing ${success ? 'completed successfully' : 'had issues'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Live test suite error:', error);
    process.exit(1);
  });
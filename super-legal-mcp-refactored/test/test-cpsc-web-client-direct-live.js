/**
 * Direct live test for CPSCWebSearchClient
 * Tests real Exa API integration with comprehensive feature validation
 */

import { CPSCWebSearchClient } from '../src/api-clients/CPSCWebSearchClient.js';

async function runTests() {
  const apiKey = process.env.EXA_API_KEY;
  
  if (!apiKey) {
    console.error('❌ EXA_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 Starting CPSCWebSearchClient Live Tests');
  console.log('================================\n');

  const mockRateLimiter = {
    requests: [],
    windowMs: 60000,
    maxRequests: 10
  };

  const client = new CPSCWebSearchClient(mockRateLimiter, apiKey);
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  // Test 1: Basic search without enhanced content
  console.log('Test 1: Basic toy recall search (no snippet/text)');
  console.log('-------------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      search_term: 'toy car choking hazard',
      limit: 3,
      include_snippet: false,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} results`);
    
    if (parsed.results.length > 0) {
      const firstResult = parsed.results[0];
      console.log(`   Title: ${firstResult.title}`);
      console.log(`   URL: ${firstResult.url}`);
      console.log(`   Has snippet: ${!!firstResult.snippet}`);
      console.log(`   Has full text: ${!!firstResult.full_text}`);
      
      // Verify no enhanced content when not requested
      if (!firstResult.snippet && !firstResult.full_text) {
        console.log('   ✅ Correctly excluded snippet and full text');
      }
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Basic search', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 1 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Basic search', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 2: Search with snippet extraction
  console.log('Test 2: Fire hazard search with smart snippets');
  console.log('-----------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      hazard_type: 'fire',
      limit: 3,
      include_snippet: true,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} fire hazard recalls`);
    
    if (parsed.results.length > 0) {
      parsed.results.forEach((recall, index) => {
        console.log(`\n   Result ${index + 1}:`);
        console.log(`   Title: ${recall.title}`);
        
        if (recall.snippet) {
          console.log(`   ✅ Snippet (${recall.snippet.length} chars): "${recall.snippet.substring(0, 100)}..."`);
          
          // Check if snippet contains safety-critical keywords
          const safetyKeywords = ['HAZARD', 'REMEDY', 'DEFECT', 'INJURY', 'recall', 'fire'];
          const containsSafetyContent = safetyKeywords.some(keyword => 
            recall.snippet.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (containsSafetyContent) {
            console.log('   ✅ Snippet contains safety-critical content');
          }
        } else {
          console.log('   ⚠️ No snippet extracted');
        }
        
        // Check metadata extraction
        if (recall.recall_number) console.log(`   📋 Recall Number: ${recall.recall_number}`);
        if (recall.manufacturer) console.log(`   🏭 Manufacturer: ${recall.manufacturer}`);
        if (recall.hazard_type) console.log(`   ⚠️ Hazard Type: ${recall.hazard_type}`);
        if (recall.units_affected) console.log(`   📦 Units Affected: ${recall.units_affected}`);
        if (recall.remedy) console.log(`   🔧 Remedy: ${recall.remedy}`);
      });
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Snippet extraction', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 2 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Snippet extraction', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 3: Search with full text extraction
  console.log('Test 3: Furniture recall with full text');
  console.log('----------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      product_category: 'furniture',
      limit: 2,
      include_snippet: false,
      include_text: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} furniture recalls`);
    
    if (parsed.results.length > 0) {
      parsed.results.forEach((recall, index) => {
        console.log(`\n   Result ${index + 1}:`);
        console.log(`   Title: ${recall.title}`);
        
        if (recall.full_text) {
          console.log(`   ✅ Full text retrieved (${recall.full_text.length} chars)`);
          
          // Analyze full text for completeness
          const sections = ['hazard', 'remedy', 'product', 'contact', 'recall'];
          const foundSections = sections.filter(section => 
            recall.full_text.toLowerCase().includes(section)
          );
          console.log(`   📄 Content includes: ${foundSections.join(', ')}`);
        } else {
          console.log('   ⚠️ No full text retrieved');
        }
      });
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Full text extraction', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 3 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Full text extraction', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 4: Search with both snippet and full text
  console.log('Test 4: Children toy recalls with snippet AND full text');
  console.log('--------------------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      search_term: 'children toy',
      hazard_type: 'choking',
      limit: 2,
      include_snippet: true,
      include_text: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} results`);
    
    if (parsed.results.length > 0) {
      const recall = parsed.results[0];
      console.log(`\n   First Result Analysis:`);
      console.log(`   Title: ${recall.title}`);
      console.log(`   URL: ${recall.url}`);
      
      // Verify both snippet and full text are present
      const hasSnippet = !!recall.snippet;
      const hasFullText = !!recall.full_text;
      
      console.log(`   Has snippet: ${hasSnippet ? '✅' : '❌'}`);
      console.log(`   Has full text: ${hasFullText ? '✅' : '❌'}`);
      
      if (hasSnippet && hasFullText) {
        console.log('   ✅ Both snippet and full text retrieved successfully');
        
        // Verify snippet is a subset/summary of full text
        if (recall.full_text.length > recall.snippet.length) {
          console.log(`   ✅ Full text (${recall.full_text.length} chars) > Snippet (${recall.snippet.length} chars)`);
        }
      }
      
      // Display all extracted metadata
      console.log('\n   Extracted Metadata:');
      const metadataFields = ['recall_number', 'recall_id', 'manufacturer', 'hazard_type', 
                             'units_affected', 'injuries_reported', 'remedy'];
      metadataFields.forEach(field => {
        if (recall[field]) {
          console.log(`   - ${field}: ${recall[field]}`);
        }
      });
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Snippet + Full text', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 4 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Snippet + Full text', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 5: Complex multi-parameter search
  console.log('Test 5: Complex search with multiple filters');
  console.log('---------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      search_term: 'bicycle',
      product_category: 'sports',
      hazard_type: 'fall',
      date_after: '2023-01-01',
      date_before: '2023-12-31',
      limit: 3,
      include_snippet: true,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Query executed: ${parsed.query}`);
    console.log(`✅ Found ${parsed.total_results} results`);
    console.log(`   Filters applied:`);
    console.log(`   - Product: ${parsed.filters_applied.product_name}`);
    console.log(`   - Category: ${parsed.filters_applied.product_category}`);
    console.log(`   - Hazard: ${parsed.filters_applied.hazard}`);
    console.log(`   - Date range: ${parsed.filters_applied.date_range}`);
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Complex multi-filter', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 5 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Complex multi-filter', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 6: Manufacturer-specific search
  console.log('Test 6: Manufacturer-specific recall search');
  console.log('--------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      recalling_firm: 'Fisher-Price',
      limit: 3,
      include_snippet: true,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} Fisher-Price recalls`);
    
    if (parsed.results.length > 0) {
      console.log('   Sample recalls:');
      parsed.results.forEach((recall, index) => {
        console.log(`   ${index + 1}. ${recall.title}`);
        if (recall.manufacturer) {
          console.log(`      Manufacturer: ${recall.manufacturer}`);
        }
      });
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Manufacturer search', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 6 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Manufacturer search', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 7: Date range search
  console.log('Test 7: Date range filtering');
  console.log('-----------------------------');
  try {
    const result = await client.searchRecallsWeb({
      search_term: 'toy',
      date_after: '2024-01-01',
      date_before: '2024-06-30',
      limit: 5,
      include_snippet: false,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${parsed.total_results} recalls in date range`);
    console.log(`   Date filter: ${parsed.filters_applied.date_range}`);
    
    if (parsed.results.length > 0) {
      console.log('   Recent recalls found:');
      parsed.results.forEach((recall, index) => {
        console.log(`   ${index + 1}. ${recall.title}`);
        if (recall.published_date) {
          console.log(`      Date: ${recall.published_date}`);
        }
      });
    }
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Date range filter', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 7 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Date range filter', status: 'FAILED', error: error.message });
  }
  console.log();

  // Test 8: Legacy parameter compatibility
  console.log('Test 8: Legacy parameter name compatibility');
  console.log('--------------------------------------------');
  try {
    const result = await client.searchRecallsWeb({
      product_name: 'stroller',  // Legacy parameter
      hazard: 'entanglement',     // Legacy parameter
      date_start: '2023-01-01',   // Legacy parameter
      date_end: '2023-12-31',     // Legacy parameter
      limit: 2,
      include_snippet: true,
      include_text: false
    });
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`✅ Legacy parameters accepted`);
    console.log(`   Product (product_name): ${parsed.filters_applied.product_name}`);
    console.log(`   Hazard (hazard): ${parsed.filters_applied.hazard}`);
    console.log(`   Date range (date_start/end): ${parsed.filters_applied.date_range}`);
    console.log(`✅ Found ${parsed.total_results} results`);
    
    totalTests++;
    passedTests++;
    results.push({ test: 'Legacy parameters', status: 'PASSED' });
  } catch (error) {
    console.error(`❌ Test 8 failed: ${error.message}`);
    totalTests++;
    failedTests++;
    results.push({ test: 'Legacy parameters', status: 'FAILED', error: error.message });
  }

  // Final Summary
  console.log('\n================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
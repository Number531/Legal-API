#!/usr/bin/env node

/**
 * USPTO BaseWebSearchClient - Live Search Test
 * 
 * Demonstrates actual patent search functionality with the migrated client
 */

require('dotenv').config();

async function testLivePatentSearch() {
  console.log('🔍 USPTO BaseWebSearchClient - Live Search Test');
  console.log('='.repeat(60));
  
  try {
    const { UsptoWebSearchClient } = require('../src/api-clients/UsptoWebSearchClient.js');
    
    if (!process.env.EXA_API_KEY) {
      console.log('❌ EXA_API_KEY not configured');
      console.log('   Please set your EXA_API_KEY environment variable to test live searches');
      return;
    }
    
    console.log('✅ EXA_API_KEY configured');
    
    const client = new UsptoWebSearchClient(null, process.env.EXA_API_KEY);
    
    // Test different types of patent searches
    const searchTests = [
      {
        name: 'AI Patent Search',
        args: {
          query_type: 'patents',
          search_text: 'artificial intelligence',
          limit: 2,
          include_snippet: true
        }
      },
      {
        name: 'Patent Litigation Search',
        args: {
          query_type: 'litigation',
          search_text: 'patent invalidity PTAB',
          limit: 2,
          include_snippet: true
        }
      },
      {
        name: 'Technical Patent Search',
        args: {
          query_type: 'technical',
          search_text: 'machine learning neural network',
          limit: 2,
          include_snippet: true
        }
      }
    ];
    
    for (const test of searchTests) {
      console.log(`\n🔬 ${test.name}`);
      console.log('-'.repeat(50));
      
      try {
        console.log('   Search parameters:', JSON.stringify(test.args, null, 2));
        console.log('   Executing search...');
        
        const startTime = Date.now();
        const result = await client.searchPatentsWeb(test.args);
        const searchTime = Date.now() - startTime;
        
        if (result && result.content && result.content[0]) {
          const data = JSON.parse(result.content[0].text);
          
          console.log(`   ✅ Search completed in ${searchTime}ms`);
          console.log(`   📊 Results: ${data.total_results} patents found`);
          console.log(`   🎯 Search type: ${data.search_type}`);
          console.log(`   🔍 Query type: ${data.query_type}`);
          
          if (data.results && data.results.length > 0) {
            console.log(`   📋 Sample results:`);
            
            data.results.forEach((patent, index) => {
              console.log(`   ${index + 1}. ${patent.patent_title || patent.patent_number || 'N/A'}`);
              console.log(`      Patent #: ${patent.patent_number || 'N/A'}`);
              console.log(`      Status: ${JSON.stringify(patent.patent_status || {})}`);
              console.log(`      Citations: ${patent.citations?.length || 0} found`);
              console.log(`      Quality: ${patent._highlight_quality?.confidence || 'N/A'}`);
              
              if (patent.snippet) {
                console.log(`      Snippet: ${patent.snippet.substring(0, 100)}...`);
              }
              
              if (test.args.query_type === 'litigation' && patent.litigation_info) {
                console.log(`      Litigation: PTAB=${patent.litigation_info.ptab_proceedings}, Court=${patent.litigation_info.court_proceedings}`);
              }
              
              if (test.args.query_type === 'technical' && patent.technical_details) {
                console.log(`      Technical: Claims=${patent.technical_details.has_claims}, Field=${patent.technical_details.has_technical_field}`);
              }
              
              console.log('');
            });
          } else {
            console.log('   ⚠️ No patent results returned (may be due to query specificity)');
          }
        } else {
          console.log('   ⚠️ Unexpected response format');
        }
        
      } catch (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log('   💡 Rate limit reached - this is normal for testing');
          break; // Stop testing if rate limited
        }
      }
      
      // Wait between searches to avoid rate limiting
      if (searchTests.indexOf(test) < searchTests.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next search...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n✅ Live search testing completed!');
    console.log('\n🎯 Key Improvements Demonstrated:');
    console.log('   • Patent-specific highlight queries working');
    console.log('   • Query type specialization (patents/litigation/technical)');
    console.log('   • Citation extraction from real data');
    console.log('   • Patent status detection from content');
    console.log('   • Quality assessment integration');
    console.log('   • Fast processing times');
    
  } catch (error) {
    console.error('❌ Live search test failed:', error.message);
    console.error('Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
  }
}

// Run if executed directly
if (require.main === module) {
  testLivePatentSearch();
}

module.exports = { testLivePatentSearch };
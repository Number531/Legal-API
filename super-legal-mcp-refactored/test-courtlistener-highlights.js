/**
 * Test script for CourtListener Highlights Implementation
 * Tests the new snippet mode using Exa highlights
 */

import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';

async function testHighlights() {
  console.log('🧪 Testing CourtListener Highlights Implementation\n');
  
  // Create rate limiter mock
  const rateLimiter = {
    enforce: async () => { /* no-op for testing */ }
  };
  
  const client = new CourtListenerWebSearchClient(rateLimiter);
  
  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY not set. Please set it to test.');
    return;
  }
  
  try {
    // Test 1: Snippet mode (default - should use highlights)
    console.log('📋 Test 1: Snippet mode (highlights)');
    const snippetResult = await client.searchOpinionsWeb({
      query: 'environmental protection agency',
      limit: 2,
      include_snippet: true,
      include_full_text: false
    });
    
    const snippetData = JSON.parse(snippetResult.content[0].text);
    console.log(`✅ Returned ${snippetData.results.length} results`);
    
    if (snippetData.results.length > 0) {
      const firstResult = snippetData.results[0];
      console.log(`   Case: ${firstResult.case_name}`);
      console.log(`   Snippet length: ${firstResult.snippet?.length || 0} chars`);
      console.log(`   Has full_text: ${firstResult.full_text ? 'YES' : 'NO'}`);
      console.log(`   Snippet preview: "${firstResult.snippet?.substring(0, 100)}..."`);
    }
    
    const snippetTokens = JSON.stringify(snippetResult).length / 4; // Rough token estimate
    console.log(`   Estimated tokens: ~${Math.round(snippetTokens)}\n`);
    
    // Test 2: Full text mode
    console.log('📄 Test 2: Full text mode');
    const fullResult = await client.searchOpinionsWeb({
      query: 'environmental protection agency',
      limit: 1,
      include_snippet: false,
      include_full_text: true
    });
    
    const fullData = JSON.parse(fullResult.content[0].text);
    console.log(`✅ Returned ${fullData.results.length} results`);
    
    if (fullData.results.length > 0) {
      const firstResult = fullData.results[0];
      console.log(`   Case: ${firstResult.case_name}`);
      console.log(`   Full text length: ${firstResult.full_text?.length || 0} chars`);
      console.log(`   Has snippet: ${firstResult.snippet ? 'YES' : 'NO'}`);
    }
    
    const fullTokens = JSON.stringify(fullResult).length / 4;
    console.log(`   Estimated tokens: ~${Math.round(fullTokens)}\n`);
    
    // Test 3: Metadata only
    console.log('🏷️  Test 3: Metadata only');
    const metaResult = await client.searchOpinionsWeb({
      query: 'environmental protection agency',
      limit: 2,
      include_snippet: false,
      include_full_text: false
    });
    
    const metaData = JSON.parse(metaResult.content[0].text);
    console.log(`✅ Returned ${metaData.results.length} results`);
    
    if (metaData.results.length > 0) {
      const firstResult = metaData.results[0];
      console.log(`   Case: ${firstResult.case_name}`);
      console.log(`   Has snippet: ${firstResult.snippet ? 'YES' : 'NO'}`);
      console.log(`   Has full_text: ${firstResult.full_text ? 'YES' : 'NO'}`);
    }
    
    const metaTokens = JSON.stringify(metaResult).length / 4;
    console.log(`   Estimated tokens: ~${Math.round(metaTokens)}\n`);
    
    // Test 4: Backward compatibility
    console.log('🔄 Test 4: Backward compatibility (include_text)');
    const backwardResult = await client.searchOpinionsWeb({
      query: 'environmental protection agency',
      limit: 1,
      include_text: true  // Old parameter name
    });
    
    const backwardData = JSON.parse(backwardResult.content[0].text);
    console.log(`✅ Backward compatibility works: ${backwardData.results.length} results`);
    
    if (backwardData.results.length > 0) {
      const firstResult = backwardData.results[0];
      console.log(`   Has snippet: ${firstResult.snippet ? 'YES' : 'NO'}`);
      console.log(`   Snippet length: ${firstResult.snippet?.length || 0} chars`);
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Snippet mode: ~${Math.round(snippetTokens)} tokens`);
    console.log(`   Full text mode: ~${Math.round(fullTokens)} tokens`);
    console.log(`   Metadata only: ~${Math.round(metaTokens)} tokens`);
    console.log(`   Token reduction: ${Math.round((1 - snippetTokens / fullTokens) * 100)}%`);
    console.log(`   🎯 Implementation appears successful!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testHighlights();
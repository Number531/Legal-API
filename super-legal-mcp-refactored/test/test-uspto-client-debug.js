/**
 * Test USPTO WebSearch Client with debugging
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

class DebugRateLimiter {
  async enforce() {
    console.log('   🕐 Rate limiter: enforcing delay...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   ✅ Rate limiter: delay complete');
  }
}

async function testUSPTOClientWithDebug() {
  console.log('🔍 Testing USPTO WebSearch Client with Debug Info...\n');
  
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  const rateLimiter = new DebugRateLimiter();
  const client = new UsptoWebSearchClient(rateLimiter, EXA_API_KEY);

  try {
    console.log('🧪 Calling searchPatentsWeb with debug...');
    console.log('   Parameters: search_text="neural networks", limit=1');
    
    const result = await client.searchPatentsWeb({
      search_text: 'neural networks',
      limit: 1,
      include_snippet: false,
      include_text: false
    });
    
    console.log('✅ SUCCESS! Patent search worked!');
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`📊 Results: ${parsed.results.length} patents found`);
    console.log(`🎯 Search type: ${parsed.search_type}`);
    console.log(`📄 First result: ${parsed.results[0]?.patent_title?.substring(0, 80)}...`);
    
  } catch (error) {
    console.error('❌ Patent search failed:', error.message);
    
    // Try a different search
    console.log('\n🔄 Trying different search term...');
    try {
      const result2 = await client.searchPatentsWeb({
        search_text: 'computer',
        limit: 1,
        include_snippet: false,
        include_text: false
      });
      
      console.log('✅ Second search worked!');
      const parsed2 = JSON.parse(result2.content[0].text);
      console.log(`📊 Results: ${parsed2.results.length} patents found`);
      
    } catch (error2) {
      console.error('❌ Second search also failed:', error2.message);
    }
  }
}

testUSPTOClientWithDebug();
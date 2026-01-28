/**
 * Test USPTO WebSearch Client Full Text Retrieval with liveCrawl
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

class DebugRateLimiter {
  async enforce() {
    console.log('   🕐 Rate limiter: enforcing delay...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   ✅ Rate limiter: delay complete');
  }
}

async function testFullTextRetrieval() {
  console.log('🔍 Testing USPTO WebSearch Client Full Text with liveCrawl...\n');
  
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  const rateLimiter = new DebugRateLimiter();
  const client = new UsptoWebSearchClient(rateLimiter, EXA_API_KEY);

  try {
    console.log('🧪 Testing searchPatentsWeb with include_text=true...');
    console.log('   Parameters: search_text="artificial intelligence", limit=1, include_text=true');
    
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      limit: 1,
      include_text: true,
      include_snippet: true
    });
    
    console.log('✅ SUCCESS! Patent search with full text worked!');
    
    const parsed = JSON.parse(result.content[0].text);
    console.log(`📊 Results: ${parsed.results.length} patents found`);
    console.log(`🎯 Search type: ${parsed.search_type}`);
    
    if (parsed.results.length > 0) {
      const firstResult = parsed.results[0];
      console.log(`📄 First result: ${firstResult.title?.substring(0, 80)}...`);
      
      if (firstResult.full_text) {
        console.log(`📝 Full text length: ${firstResult.full_text.length} characters`);
        console.log(`📝 Full text preview: ${firstResult.full_text.substring(0, 200)}...`);
      } else {
        console.log('❌ No full text retrieved');
      }
      
      if (firstResult.snippet) {
        console.log(`📄 Snippet length: ${firstResult.snippet.length} characters`);
        console.log(`📄 Snippet preview: ${firstResult.snippet.substring(0, 200)}...`);
      } else {
        console.log('❌ No snippet generated');
      }
      
      console.log('\n📊 Full Result Structure:');
      console.log('  Title:', firstResult.title);
      console.log('  URL:', firstResult.url);
      console.log('  Has full_text:', !!firstResult.full_text);
      console.log('  Has snippet:', !!firstResult.snippet);
      console.log('  Metadata keys:', Object.keys(firstResult.metadata || {}));
    }
    
  } catch (error) {
    console.error('❌ Patent search failed:', error.message);
  }
}

testFullTextRetrieval();
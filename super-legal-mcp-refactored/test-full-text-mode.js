/**
 * Test full text mode to ensure it still works
 */

import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';

async function testFullTextMode() {
  console.log('📄 Testing Full Text Mode\n');
  
  const rateLimiter = { enforce: async () => {} };
  const client = new CourtListenerWebSearchClient(rateLimiter);
  
  try {
    console.log('Testing full text mode with "Brown v Board"');
    
    const result = await client.searchOpinionsWeb({
      query: 'Brown v Board',
      limit: 1,
      include_snippet: false,  // Don't want snippet
      include_full_text: true  // Want full text
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log('Results found:', data.results.length);
    
    if (data.results.length > 0) {
      const first = data.results[0];
      console.log('\n📄 Full text result:');
      console.log('- Case name:', first.case_name);
      console.log('- Has snippet:', !!first.snippet);
      console.log('- Snippet length:', first.snippet?.length || 0);
      console.log('- Has full text:', !!first.full_text);
      console.log('- Full text length:', first.full_text?.length || 0);
      
      const totalSize = JSON.stringify(result).length;
      console.log('- Total response size:', totalSize, 'chars');
      console.log('- Estimated tokens:', Math.round(totalSize / 4));
      
      if (first.full_text && first.full_text.length > 1000) {
        console.log('✅ Full text mode working - got', first.full_text.length, 'chars of text');
        console.log('- Preview:', first.full_text.substring(0, 300) + '...');
      } else {
        console.log('⚠️  Full text seems short or missing');
      }
      
      // Compare with snippet mode
      console.log('\n🔄 Now testing snippet mode for comparison...');
      
      const snippetResult = await client.searchOpinionsWeb({
        query: 'Brown v Board',
        limit: 1,
        include_snippet: true,
        include_full_text: false
      });
      
      const snippetData = JSON.parse(snippetResult.content[0].text);
      const snippetSize = JSON.stringify(snippetResult).length;
      
      console.log('- Snippet response size:', snippetSize, 'chars');
      console.log('- Estimated tokens:', Math.round(snippetSize / 4));
      console.log('- Size reduction:', Math.round((1 - snippetSize / totalSize) * 100) + '%');
      
    } else {
      console.log('❌ No results found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullTextMode();
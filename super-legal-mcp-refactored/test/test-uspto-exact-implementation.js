/**
 * Test the exact implementation used in UsptoWebSearchClient
 */

async function testExactImplementation() {
  console.log('🔍 Testing Exact USPTO WebSearch Implementation...\n');
  
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  const domains = [
    'uspto.gov',
    'patft.uspto.gov', 
    'appft.uspto.gov',
    'patents.google.com'
  ];
  
  const query = '(site:uspto.gov OR site:patft.uspto.gov OR site:appft.uspto.gov OR site:patents.google.com) "artificial intelligence"';
  const limit = 2;
  
  console.log('🧪 Test 1: Exact search API call (as in our code)');
  try {
    const searchResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify({
        query: query,
        num_results: limit,
        include_domains: domains,
        use_autoprompt: true,
        type: 'neural'
      })
    });

    console.log(`Status: ${searchResponse.status}`);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log(`❌ Search Error: ${errorText}`);
      return;
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Search Success! Found ${searchData.results?.length} results`);
    
    if (searchData.results?.length > 0) {
      console.log(`📄 First result: ${searchData.results[0].title}`);
      
      // Test contents API call too
      console.log('\n🧪 Test 2: Contents API call (for snippets)');
      const ids = searchData.results.map(result => result.id);
      
      const contentsResponse = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
          ids: ids,
          text: true
        })
      });

      console.log(`Contents Status: ${contentsResponse.status}`);
      
      if (!contentsResponse.ok) {
        const errorText = await contentsResponse.text();
        console.log(`⚠️ Contents Error: ${errorText}`);
        console.log('This is expected for some results');
      } else {
        const contentsData = await contentsResponse.json();
        console.log(`✅ Contents Success! Got ${contentsData.contents?.length} contents`);
        
        if (contentsData.contents?.[0]?.text) {
          console.log(`📄 First content preview: ${contentsData.contents[0].text.substring(0, 100)}...`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExactImplementation();
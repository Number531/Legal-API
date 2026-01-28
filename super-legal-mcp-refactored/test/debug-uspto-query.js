/**
 * Debug USPTO query construction
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

const client = new UsptoWebSearchClient(null, 'test-key');

console.log('🔍 Debugging USPTO Query Construction...\n');

// Test 1: Simple patent query
const query1 = client.buildPatentQuery({
  search_text: 'artificial intelligence',
  include_google: true
});
console.log('🧪 Query 1 (simple search):');
console.log(`"${query1}"`);
console.log('');

// Test 2: Complex patent query
const query2 = client.buildPatentQuery({
  query_type: 'patents',
  search_text: 'neural network',
  inventor_name: 'Smith',
  assignee_organization: 'Google',
  patent_date_start: '2020-01-01',
  patent_date_end: '2024-12-31',
  include_google: true
});
console.log('🧪 Query 2 (complex search):');
console.log(`"${query2}"`);
console.log('');

// Test what a working simple query looks like vs our query
console.log('🔄 Now testing actual API call with simple query...');

const testSimpleQuery = async () => {
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  
  try {
    // Test our constructed query
    console.log('\n📞 Testing our USPTO query:');
    const ourQuery = query1;
    console.log(`Query: "${ourQuery}"`);
    
    const response1 = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify({
        query: ourQuery,
        num_results: 2,
        use_autoprompt: true,
        type: 'neural'
      })
    });
    
    console.log(`Status: ${response1.status}`);
    
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log(`❌ Error: ${errorText}`);
    } else {
      const data1 = await response1.json();
      console.log(`✅ Success! Found ${data1.results?.length} results`);
    }
    
    // Compare with simple working query
    console.log('\n📞 Testing simple working query:');
    const simpleQuery = 'artificial intelligence patent';
    console.log(`Query: "${simpleQuery}"`);
    
    const response2 = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify({
        query: simpleQuery,
        num_results: 2,
        use_autoprompt: false,
        type: 'neural'
      })
    });
    
    console.log(`Status: ${response2.status}`);
    
    if (!response2.ok) {
      const errorText = await response2.text();
      console.log(`❌ Error: ${errorText}`);
    } else {
      const data2 = await response2.json();
      console.log(`✅ Success! Found ${data2.results?.length} results`);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
};

testSimpleQuery();
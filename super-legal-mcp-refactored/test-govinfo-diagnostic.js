/**
 * Quick diagnostic to see what GovInfo searchUSCodeWeb actually returns
 */

import { GovInfoWebSearchClient } from './src/api-clients/GovInfoWebSearchClient.js';

console.log('\n🔍 GOVINFO DIAGNOSTIC TEST');
console.log('=' + '='.repeat(70));
console.log(`Mode: ${process.env.ENHANCED_SUMMARY_QUERIES === 'true' ? 'ENHANCED' : 'BASELINE'}\n`);

const client = new GovInfoWebSearchClient();

console.log('Testing searchUSCodeWeb with: "42 USC 1983 civil rights"\n');

try {
  const result = await client.searchUSCodeWeb({
    search_term: '42 USC 1983 civil rights',
    limit: 2,
    include_snippet: true
  });

  console.log('Raw Result Structure:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n\nParsed Results:');
  if (result.content && result.content[0]) {
    const resultData = JSON.parse(result.content[0].text);
    console.log('Number of results:', resultData.results?.length || 0);

    if (resultData.results && resultData.results.length > 0) {
      console.log('\n📄 First Result:');
      console.log(JSON.stringify(resultData.results[0], null, 2));

      console.log('\n📄 Second Result (if exists):');
      if (resultData.results[1]) {
        console.log(JSON.stringify(resultData.results[1], null, 2));
      }
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

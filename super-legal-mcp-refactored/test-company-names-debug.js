import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';

const client = new SECWebSearchClient();

console.log('Testing Tesla search:');
const teslaResult = await client.searchSECCompanyTickersWeb({ search_term: 'Tesla' });
const teslaData = JSON.parse(teslaResult.content[0].text);
console.log('  Count:', teslaData.count);
console.log('  Top 3 results:', teslaData.results.slice(0, 3).map(r => ({ ticker: r.ticker, name: r.name, cik: r.cik })));

console.log('\nTesting JPMorgan search:');
const jpmResult = await client.searchSECCompanyTickersWeb({ search_term: 'JPMorgan' });
const jpmData = JSON.parse(jpmResult.content[0].text);
console.log('  Count:', jpmData.count);
console.log('  Top 3 results:', jpmData.results.slice(0, 3).map(r => ({ ticker: r.ticker, name: r.name, cik: r.cik })));

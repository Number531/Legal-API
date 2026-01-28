/**
 * Quick test for 10000 token domains
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { BaseWebSearchClient } = await import('./src/api-clients/BaseWebSearchClient.js');
const { GeminiFilterModule } = await import('./src/filters/GeminiFilterModule.js');
const { getMaxTokensForDomain } = await import('./src/config/geminiConfig.js');

const tests = [
  {
    domain: 'pharmaceutical_safety',
    prompt: (await import('./src/filters/prompts/pharmaceutical.js')).PHARMACEUTICAL_PROMPT,
    query: 'Ozempic adverse events cardiac FDA semaglutide',
    includeDomains: ['fda.gov'],
  },
  {
    domain: 'patent_appeals',
    prompt: (await import('./src/filters/prompts/patentAppeals.js')).PATENT_APPEALS_PROMPT,
    query: 'PTAB inter partes review institution decision semiconductor',
    includeDomains: ['uspto.gov'],
  }
];

const client = new BaseWebSearchClient(null, process.env.EXA_API_KEY);

console.log('Testing 10000 token limit for previously-fallback domains...\n');

for (const test of tests) {
  console.log('─'.repeat(60));
  console.log(`Testing: ${test.domain.toUpperCase()}`);
  console.log('─'.repeat(60));

  const maxTokens = getMaxTokensForDomain(test.domain);
  console.log(`  Max tokens: ${maxTokens}`);

  const rawResults = await client.getRawResults(test.query, 3, {
    includeDomains: test.includeDomains,
    domain: test.domain
  });

  console.log(`  Exa results: ${rawResults.length}`);

  const filter = new GeminiFilterModule(test.domain, {
    systemPrompt: test.prompt,
    maxOutputTokens: maxTokens
  });

  const filtered = await filter.processAndFilter(rawResults, 'Extract key details');

  const isFallback = filtered.fallback || false;
  const findingsLen = typeof filtered.findings === 'string' ? filtered.findings.length : 0;

  console.log(`  Fallback: ${isFallback}`);
  console.log(`  Findings length: ${findingsLen}`);

  const status = isFallback ? 'FALLBACK' : 'FULL EXTRACTION';
  const icon = isFallback ? '⚠️' : '✅';
  console.log(`  Result: ${icon} ${status}`);

  if (!isFallback && filtered.findings) {
    console.log('\n  Preview:');
    console.log('  ' + '-'.repeat(50));
    const preview = (typeof filtered.findings === 'string' ? filtered.findings : '').substring(0, 400);
    preview.split('\n').slice(0, 10).forEach(l => console.log(`  | ${l.substring(0, 65)}`));
    console.log('  ' + '-'.repeat(50));
  }

  console.log('');
  await new Promise(r => setTimeout(r, 3000));
}

console.log('═'.repeat(60));
console.log('COMPLETE');
console.log('═'.repeat(60));

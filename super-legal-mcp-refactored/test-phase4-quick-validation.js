/**
 * Phase 4: Quick Validation - Test 3 Representative Domains
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('PHASE 4: QUICK VALIDATION (3 Domains)');
console.log('='.repeat(70));

const { BaseWebSearchClient } = await import('./src/api-clients/BaseWebSearchClient.js');
const { GeminiFilterModule } = await import('./src/filters/GeminiFilterModule.js');
const { getMaxTokensForDomain } = await import('./src/config/geminiConfig.js');

// Test configs
const tests = [
  {
    domain: 'securities',
    prompt: (await import('./src/filters/prompts/securities.js')).SECURITIES_PROMPT,
    query: 'Apple Inc 10-K 2024 financial metrics',
    includeDomains: ['sec.gov'],
    focus: 'Extract revenue and net income figures',
    expected: ['revenue', 'income']
  },
  {
    domain: 'case_law',
    prompt: (await import('./src/filters/prompts/caseLaw.js')).CASE_LAW_PROMPT,
    query: 'patent infringement federal circuit 2024',
    includeDomains: ['courtlistener.com'],
    focus: 'Extract case holdings and citations',
    expected: ['court', 'patent']
  },
  {
    domain: 'environmental',
    prompt: (await import('./src/filters/prompts/environmental.js')).ENVIRONMENTAL_PROMPT,
    query: 'EPA Clean Water Act violations 2024',
    includeDomains: ['epa.gov'],
    focus: 'Extract violation details and penalties',
    expected: ['violation', 'water']
  }
];

const client = new BaseWebSearchClient(null, process.env.EXA_API_KEY);
const results = [];

for (const test of tests) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Testing: ${test.domain.toUpperCase()}`);
  console.log(`${'─'.repeat(60)}`);

  // Fetch
  const rawResults = await client.getRawResults(test.query, 2, {
    includeDomains: test.includeDomains,
    domain: test.domain
  });

  if (!rawResults || rawResults.length === 0) {
    console.log('  No Exa results - SKIPPED');
    results.push({ domain: test.domain, status: 'skipped' });
    continue;
  }

  console.log(`  Exa results: ${rawResults.length}`);

  // Filter
  const maxTokens = getMaxTokensForDomain(test.domain);
  console.log(`  Max output tokens: ${maxTokens}`);

  const filter = new GeminiFilterModule(test.domain, {
    systemPrompt: test.prompt,
    maxOutputTokens: maxTokens
  });

  const filtered = await filter.processAndFilter(rawResults, test.focus);

  console.log(`  Fallback: ${filtered.fallback || false}`);
  console.log(`  Findings length: ${typeof filtered.findings === 'string' ? filtered.findings.length : 0}`);

  // Validate
  const findings = typeof filtered.findings === 'string' ? filtered.findings.toLowerCase() : '';
  const validated = test.expected.filter(e => findings.includes(e.toLowerCase())).length;

  console.log(`  Validation: ${validated}/${test.expected.length} fields found`);

  const status = filtered.fallback ? 'fallback' : (validated >= test.expected.length * 0.5 ? 'success' : 'failed');
  console.log(`  Status: ${status.toUpperCase()}`);

  if (!filtered.fallback && filtered.findings) {
    console.log(`\n  Preview:`);
    console.log('  ' + '-'.repeat(50));
    const preview = (typeof filtered.findings === 'string' ? filtered.findings : '').substring(0, 300);
    preview.split('\n').slice(0, 8).forEach(l => console.log(`  │ ${l.substring(0, 60)}`));
    console.log('  ' + '-'.repeat(50));
  }

  results.push({ domain: test.domain, status, fallback: filtered.fallback || false });

  // Rate limit
  await new Promise(r => setTimeout(r, 2000));
}

// Summary
console.log(`\n${'═'.repeat(70)}`);
console.log('QUICK VALIDATION SUMMARY');
console.log(`${'═'.repeat(70)}`);

const success = results.filter(r => r.status === 'success').length;
const fallback = results.filter(r => r.status === 'fallback').length;
const failed = results.filter(r => r.status === 'failed').length;

console.log(`\nResults:`);
for (const r of results) {
  const icon = r.status === 'success' ? '✅' : r.status === 'fallback' ? '⚠️' : '❌';
  console.log(`  ${icon} ${r.domain}: ${r.status.toUpperCase()}`);
}

console.log(`\nTotal: ${success} success, ${fallback} fallback, ${failed} failed`);
console.log(`Pass rate: ${((success / results.length) * 100).toFixed(0)}%`);

if (success === results.length) {
  console.log('\n✅ All domains working without fallback - ready for full E2E test!');
} else if (success + fallback === results.length) {
  console.log('\n⚠️ All domains passing (some with fallback) - consider tuning prompts');
} else {
  console.log('\n❌ Some domains failing - needs investigation');
}

/**
 * Quick test with reduced content limits
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { BaseWebSearchClient } = await import('./src/api-clients/BaseWebSearchClient.js');
const { GeminiFilterModule } = await import('./src/filters/GeminiFilterModule.js');
const { PRODUCT_SAFETY_PROMPT } = await import('./src/filters/prompts/productSafety.js');
const { SECURITIES_PROMPT } = await import('./src/filters/prompts/securities.js');

console.log('Testing with reduced content limits (15k/doc, 40k total)...\n');

const client = new BaseWebSearchClient(null, process.env.EXA_API_KEY);

// Test 1: Product Safety
console.log('--- TEST 1: Product Safety ---');
const psResults = await client.getRawResults('CPSC recall toys 2024', 2, {
  includeDomains: ['cpsc.gov'],
  domain: 'product_safety'
});
console.log(`Raw results: ${psResults.length}`);

const { getMaxTokensForDomain } = await import('./src/config/geminiConfig.js');

const psFilter = new GeminiFilterModule('product_safety', {
  systemPrompt: PRODUCT_SAFETY_PROMPT,
  maxOutputTokens: getMaxTokensForDomain('product_safety')
});

const psFiltered = await psFilter.processAndFilter(psResults, 'Extract recall details');
console.log(`Fallback used: ${psFiltered.fallback || false}`);
console.log(`Findings length: ${typeof psFiltered.findings === 'string' ? psFiltered.findings.length : JSON.stringify(psFiltered.findings).length}`);

if (psFiltered.fallback) {
  console.log('Using fallback preview mode');
} else {
  console.log(`Preview: ${(typeof psFiltered.findings === 'string' ? psFiltered.findings : JSON.stringify(psFiltered.findings)).substring(0, 300)}...`);
}

// Test 2: Securities
console.log('\n--- TEST 2: Securities ---');
const secResults = await client.getRawResults('Apple 10-K 2024', 1, {
  includeDomains: ['sec.gov'],
  domain: 'securities'
});
console.log(`Raw results: ${secResults.length}`);

const secFilter = new GeminiFilterModule('securities', {
  systemPrompt: SECURITIES_PROMPT,
  maxOutputTokens: getMaxTokensForDomain('securities')
});

const secFiltered = await secFilter.processAndFilter(secResults, 'Extract financial metrics');
console.log(`Fallback used: ${secFiltered.fallback || false}`);
console.log(`Findings length: ${typeof secFiltered.findings === 'string' ? secFiltered.findings.length : JSON.stringify(secFiltered.findings).length}`);

if (secFiltered.fallback) {
  console.log('Using fallback preview mode');
} else {
  console.log(`Preview: ${(typeof secFiltered.findings === 'string' ? secFiltered.findings : JSON.stringify(secFiltered.findings)).substring(0, 300)}...`);
}

// Test 3: Case Law
console.log('\n--- TEST 3: Case Law ---');
const { CASE_LAW_PROMPT } = await import('./src/filters/prompts/caseLaw.js');
const clResults = await client.getRawResults('patent infringement', 2, {
  includeDomains: ['courtlistener.com'],
  domain: 'case_law'
});
console.log(`Raw results: ${clResults.length}`);

const clFilter = new GeminiFilterModule('case_law', {
  systemPrompt: CASE_LAW_PROMPT,
  maxOutputTokens: getMaxTokensForDomain('case_law')
});

const clFiltered = await clFilter.processAndFilter(clResults, 'Extract holdings');
console.log(`Fallback used: ${clFiltered.fallback || false}`);
console.log(`Findings length: ${typeof clFiltered.findings === 'string' ? clFiltered.findings.length : JSON.stringify(clFiltered.findings).length}`);

if (clFiltered.fallback) {
  console.log('Using fallback preview mode');
} else {
  console.log(`Preview: ${(typeof clFiltered.findings === 'string' ? clFiltered.findings : JSON.stringify(clFiltered.findings)).substring(0, 300)}...`);
}

console.log('\n--- SUMMARY ---');
console.log(`Product Safety: ${psFiltered.fallback ? 'FALLBACK' : 'SUCCESS'}`);
console.log(`Securities: ${secFiltered.fallback ? 'FALLBACK' : 'SUCCESS'}`);
console.log(`Case Law: ${clFiltered.fallback ? 'FALLBACK' : 'SUCCESS'}`);

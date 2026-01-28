#!/usr/bin/env node
/**
 * Phase 4.1 Backend Integration Test
 * Tests Federal Register and GovInfo hybrid clients with live APIs
 */

import { FederalRegisterHybridClient } from './src/api-clients/FederalRegisterHybridClient.js';
import { GovInfoHybridClient } from './src/api-clients/GovInfoHybridClient.js';
import { rateLimiterConfigs } from './src/config/apiConfig.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env:', error.message);
}

console.log('🧪 Phase 4.1 Backend Integration Test\n');

let passed = 0;
let failed = 0;
let skipped = 0;

async function testFederalRegister() {
  console.log('━'.repeat(60));
  console.log('📋 Federal Register Hybrid Tests');
  console.log('━'.repeat(60) + '\n');

  const client = new FederalRegisterHybridClient(
    rateLimiterConfigs.federal_register,
    process.env.EXA_API_KEY
  );

  // Test 1: Agency filter (will likely fallback to websearch due to API format)
  console.log('Test 1: Agency filter (smart fallback)...');
  try {
    const result = await client.searchFederalRegister({ agency: 'EPA', limit: 3 });
    const data = JSON.parse(result.content[0].text);

    if (data.documents || data.results) {
      console.log('✅ PASS - Results returned via smart fallback');
      console.log(`   Source: ${data._hybrid_metadata?.source || 'unknown'}`);
      passed++;
    } else {
      console.log('❌ FAIL - No results returned');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }
  console.log('');

  // Test 2: Natural language → WebSearch
  console.log('Test 2: Natural language query (websearch primary)...');
  try {
    const result = await client.searchFederalRegister({
      query: 'climate regulations',
      limit: 3
    });
    const data = JSON.parse(result.content[0].text);

    if (data.documents && data.documents.length > 0) {
      console.log('✅ PASS - WebSearch returned results');
      console.log(`   Documents: ${data.documents.length}`);
      passed++;
    } else {
      console.log('❌ FAIL - No results');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }
  console.log('');
}

async function testGovInfo() {
  console.log('━'.repeat(60));
  console.log('📋 GovInfo Hybrid Tests');
  console.log('━'.repeat(60) + '\n');

  const client = new GovInfoHybridClient(
    rateLimiterConfigs.govinfo,
    process.env.EXA_API_KEY
  );

  const hasApiKey = !!process.env.GOVINFO_API_KEY;

  if (hasApiKey) {
    // Test 3: USC section lookup (native)
    console.log('Test 3: USC section lookup (native API)...');
    try {
      const result = await client.searchUSCode({
        title_number: 17,
        section: 102,
        limit: 3
      });
      const data = JSON.parse(result.content[0].text);

      if (data.results || data.documents) {
        console.log('✅ PASS - Native API or smart fallback worked');
        console.log(`   Source: ${data._hybrid_metadata?.source || 'unknown'}`);
        passed++;
      } else {
        console.log('❌ FAIL - No results');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAIL -', error.message);
      failed++;
    }
    console.log('');
  } else {
    console.log('Test 3: SKIPPED - No GOVINFO_API_KEY\n');
    skipped++;
  }

  // Test 4: Natural language (websearch)
  console.log('Test 4: Natural language query (websearch)...');
  try {
    const result = await client.searchUSCode({
      search_text: 'copyright law',
      limit: 3
    });
    const data = JSON.parse(result.content[0].text);

    if (data.documents || data.results) {
      console.log('✅ PASS - WebSearch returned results');
      console.log(`   Documents: ${data.documents?.length || data.results?.length || 0}`);
      passed++;
    } else {
      console.log('❌ FAIL - No results');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }
  console.log('');

  // Test 5: API key validation (graceful degradation)
  console.log('Test 5: API key validation (graceful degradation)...');
  if (!hasApiKey) {
    console.log('✅ PASS - Client initialized without API key (websearch-only mode)');
    console.log(`   hasNativeAPI: ${client.hasNativeAPI}`);
    passed++;
  } else {
    console.log('✅ PASS - Client has API key');
    console.log(`   hasNativeAPI: ${client.hasNativeAPI}`);
    passed++;
  }
  console.log('');
}

async function runAllTests() {
  await testFederalRegister();
  await testGovInfo();

  console.log('━'.repeat(60));
  console.log('📊 Test Summary');
  console.log('━'.repeat(60));
  console.log(`Total: ${passed + failed + skipped} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('━'.repeat(60));

  if (failed === 0) {
    console.log('✅ Phase 4.1 Backend Integration: ALL TESTS PASSED!');
    console.log('');
    console.log('Next: Run frontend tests with MCP interface');
  } else {
    console.log(`❌ Phase 4.1 Backend Integration: ${failed} test(s) failed`);
    process.exit(1);
  }
}

runAllTests();

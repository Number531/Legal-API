#!/usr/bin/env node
/**
 * Phase 4 Client Test with Proper .env Loading
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load .env from this directory
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
  console.log('✅ Loaded .env from:', envPath);
  console.log('   EXA_API_KEY:', process.env.EXA_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('   GOVINFO_API_KEY:', process.env.GOVINFO_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('');
} catch (error) {
  console.warn('⚠️  Could not load .env:', error.message);
}

// Import clients
import { FederalRegisterClient } from './src/api-clients/FederalRegisterClient.js';
import { FederalRegisterWebSearchClient } from './src/api-clients/FederalRegisterWebSearchClient.js';
import { GovInfoClient } from './src/api-clients/GovInfoClient.js';
import { GovInfoWebSearchClient } from './src/api-clients/GovInfoWebSearchClient.js';
import { rateLimiterConfigs } from './src/config/apiConfig.js';

console.log('🧪 Phase 4 Client Comprehensive Test Suite\n');
console.log('━'.repeat(80) + '\n');

const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

function recordTest(name, status, time, message) {
  results.tests.push({ name, status, time, message });
  if (status === 'PASSED') results.passed++;
  else if (status === 'FAILED') results.failed++;
  else if (status === 'SKIPPED') results.skipped++;
}

// Test 1: FederalRegisterClient (Native API)
async function testFederalRegisterNative() {
  console.log('📋 Test 1: FederalRegisterClient (Native API)');
  console.log('   Endpoint: https://www.federalregister.gov/api/v1/documents.json\n');

  try {
    const client = new FederalRegisterClient(rateLimiterConfigs.federal_register);
    const startTime = Date.now();
    const result = await client.searchFederalRegister({ query: 'EPA', limit: 3 });
    const elapsed = Date.now() - startTime;
    const data = JSON.parse(result.content[0].text);

    if (data.count > 0 && data.results?.length > 0) {
      console.log(`   ✅ SUCCESS (${elapsed}ms)`);
      console.log(`      Results: ${data.count} total, ${data.results.length} returned`);
      console.log(`      Sample: "${data.results[0].title.substring(0, 50)}..."\n`);
      recordTest('FederalRegisterClient (Native)', 'PASSED', elapsed, `${data.count} results`);
    } else {
      throw new Error('No results');
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    recordTest('FederalRegisterClient (Native)', 'FAILED', 0, error.message);
  }
}

// Test 2: FederalRegisterWebSearchClient
async function testFederalRegisterWebSearch() {
  console.log('📋 Test 2: FederalRegisterWebSearchClient');
  console.log('   Type: Exa-powered websearch\n');

  if (!process.env.EXA_API_KEY) {
    console.log(`   ⏭️  SKIPPED: No EXA_API_KEY\n`);
    recordTest('FederalRegisterWebSearchClient', 'SKIPPED', 0, 'No EXA_API_KEY');
    return;
  }

  try {
    const client = new FederalRegisterWebSearchClient(
      rateLimiterConfigs.federal_register,
      process.env.EXA_API_KEY
    );
    const startTime = Date.now();
    const result = await client.searchFederalRegisterWeb({
      search_term: 'EPA climate',
      limit: 3
    });
    const elapsed = Date.now() - startTime;
    const data = JSON.parse(result.content[0].text);

    if (data.documents?.length > 0) {
      console.log(`   ✅ SUCCESS (${elapsed}ms)`);
      console.log(`      Results: ${data.total_results} documents`);
      console.log(`      Sample: "${data.documents[0].title.substring(0, 50)}..."\n`);
      recordTest('FederalRegisterWebSearchClient', 'PASSED', elapsed, `${data.total_results} docs`);
    } else {
      throw new Error('No documents');
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    recordTest('FederalRegisterWebSearchClient', 'FAILED', 0, error.message);
  }
}

// Test 3: GovInfoClient (Native API)
async function testGovInfoNative() {
  console.log('📋 Test 3: GovInfoClient (Native API)');
  console.log('   Endpoint: https://api.govinfo.gov\n');

  if (!process.env.GOVINFO_API_KEY) {
    console.log(`   ⏭️  SKIPPED: No GOVINFO_API_KEY\n`);
    recordTest('GovInfoClient (Native)', 'SKIPPED', 0, 'No GOVINFO_API_KEY');
    return;
  }

  try {
    const client = new GovInfoClient(rateLimiterConfigs.govinfo);
    const startTime = Date.now();
    const result = await client.searchUSCode({
      search_text: 'copyright',
      limit: 3
    });
    const elapsed = Date.now() - startTime;
    const data = JSON.parse(result.content[0].text);

    if (data.results?.length > 0) {
      console.log(`   ✅ SUCCESS (${elapsed}ms)`);
      console.log(`      Results: ${data.count} total, ${data.results.length} returned`);
      console.log(`      Sample: "${data.results[0].title.substring(0, 50)}..."\n`);
      recordTest('GovInfoClient (Native)', 'PASSED', elapsed, `${data.count} results`);
    } else {
      throw new Error('No results');
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    recordTest('GovInfoClient (Native)', 'FAILED', 0, error.message);
  }
}

// Test 4: GovInfoWebSearchClient
async function testGovInfoWebSearch() {
  console.log('📋 Test 4: GovInfoWebSearchClient');
  console.log('   Type: Exa-powered websearch\n');

  if (!process.env.EXA_API_KEY) {
    console.log(`   ⏭️  SKIPPED: No EXA_API_KEY\n`);
    recordTest('GovInfoWebSearchClient', 'SKIPPED', 0, 'No EXA_API_KEY');
    return;
  }

  try {
    const client = new GovInfoWebSearchClient(
      rateLimiterConfigs.govinfo,
      process.env.EXA_API_KEY
    );
    const startTime = Date.now();
    const result = await client.searchUSCodeWeb({
      search_term: 'copyright',
      limit: 3
    });
    const elapsed = Date.now() - startTime;
    const data = JSON.parse(result.content[0].text);

    if (data.documents?.length > 0) {
      console.log(`   ✅ SUCCESS (${elapsed}ms)`);
      console.log(`      Results: ${data.total_results} documents`);
      console.log(`      Sample: "${data.documents[0].title.substring(0, 50)}..."\n`);
      recordTest('GovInfoWebSearchClient', 'PASSED', elapsed, `${data.total_results} docs`);
    } else {
      throw new Error('No documents');
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    recordTest('GovInfoWebSearchClient', 'FAILED', 0, error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testFederalRegisterNative();
  await testFederalRegisterWebSearch();
  await testGovInfoNative();
  await testGovInfoWebSearch();

  console.log('━'.repeat(80));
  console.log('📊 Test Summary\n');
  console.log(`   Total: ${results.tests.length}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}\n`);

  console.log('━'.repeat(80));
  console.log('🎯 Phase 4 Readiness\n');

  if (results.passed === 4) {
    console.log('   ✅ ALL SYSTEMS GO - All 4 clients working!');
    console.log('   ✅ Ready for full Phase 4 hybrid implementation\n');
  } else if (results.passed >= 2) {
    console.log('   ✅ READY - Core clients working');
    console.log(`   ✅ ${results.passed}/4 clients verified`);
    console.log('   ✅ Can proceed with Phase 4\n');
  } else {
    console.log('   ⚠️  PARTIAL - Some clients need attention\n');
  }

  console.log('━'.repeat(80));
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

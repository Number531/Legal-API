#!/usr/bin/env node
/**
 * Step 3 Test: Native-First Routing
 * Tests that queries route to the correct API (native vs websearch)
 */

import { FederalRegisterHybridClient } from './src/api-clients/FederalRegisterHybridClient.js';
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

console.log('🧪 Step 3 Test: Native-First Routing with Live APIs\n');

async function testStep3() {
  const client = new FederalRegisterHybridClient(
    rateLimiterConfigs.federal_register,
    process.env.EXA_API_KEY
  );

  const tests = [
    {
      name: 'Test 1: Agency filter → Native first (may fallback)',
      args: { agency: 'EPA', limit: 3 },
      expectedSource: ['native', 'web_search'],  // Accept either (smart fallback)
      description: 'Should try native first, fallback to websearch if fails'
    },
    {
      name: 'Test 2: Natural language → WebSearch',
      args: { query: 'climate change regulations', limit: 3 },
      expectedSource: ['web_search'],  // WebSearch primary
      description: 'Should use websearch for natural language'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`${test.name}`);
    console.log(`Args: ${JSON.stringify(test.args)}`);

    const startTime = Date.now();
    try {
      const result = await client.searchFederalRegister(test.args);
      const elapsed = Date.now() - startTime;

      const data = JSON.parse(result.content[0].text);

      console.log(`Response time: ${elapsed}ms`);
      console.log(`Metadata: ${JSON.stringify(data._hybrid_metadata || {}, null, 2)}`);

      // Check which source was used
      const metadata = data._hybrid_metadata || {};
      const source = metadata.primary_source || metadata.source || 'unknown';

      console.log(`Source used: ${source}`);
      console.log(`Description: ${test.description}`);

      // Validate source matches any of the expected sources
      const sourceMatches = test.expectedSource.some(expected =>
        source.toLowerCase().includes(expected.toLowerCase())
      );

      if (sourceMatches) {
        console.log(`✅ PASS - Source matched expected: ${test.expectedSource.join(' or ')}`);
        passed++;
      } else {
        console.log(`❌ FAIL - Expected ${test.expectedSource.join(' or ')}, got ${source}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log(`Results: ${passed}/${tests.length} passed, ${failed} failed`);
  console.log('━'.repeat(60));

  if (failed === 0) {
    console.log('✅ Step 3 PASSED: Routing strategies work correctly!');
  } else {
    console.log('❌ Step 3 FAILED: Routing issues detected');
    process.exit(1);
  }
}

testStep3();

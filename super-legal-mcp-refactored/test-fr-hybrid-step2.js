#!/usr/bin/env node
/**
 * Step 2 Test: Query Type Detection
 * Tests all 4 query types are detected correctly
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

console.log('🧪 Step 2 Test: Query Type Detection\n');

async function testStep2() {
  const client = new FederalRegisterHybridClient(
    rateLimiterConfigs.federal_register,
    process.env.EXA_API_KEY
  );

  const tests = [
    {
      name: 'Document number lookup',
      args: { document_number: '2024-12345' },
      expectedType: 'document_lookup'
    },
    {
      name: 'Agency filter (structured)',
      args: { agency: 'EPA', limit: 3 },
      expectedType: 'structured'
    },
    {
      name: 'Document type filter (structured)',
      args: { document_type: 'RULE' },
      expectedType: 'structured'
    },
    {
      name: 'Date range filter (structured)',
      args: { date_range: '2024-01-01..2024-12-31' },
      expectedType: 'structured'
    },
    {
      name: 'CFR title filter (structured)',
      args: { cfr_title: 40 },
      expectedType: 'structured'
    },
    {
      name: 'Natural language query',
      args: { query: 'climate change regulations' },
      expectedType: 'natural_language'
    },
    {
      name: 'Empty/general query',
      args: { limit: 5 },
      expectedType: 'general'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`Args: ${JSON.stringify(test.args)}`);

    const result = await client.searchFederalRegister(test.args);
    const data = JSON.parse(result.content[0].text);

    if (data.detected_query_type === test.expectedType) {
      console.log(`✅ PASS - Detected: ${data.detected_query_type}`);
      passed++;
    } else {
      console.log(`❌ FAIL - Expected: ${test.expectedType}, Got: ${data.detected_query_type}`);
      failed++;
    }
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log(`Results: ${passed}/${tests.length} passed, ${failed} failed`);
  console.log('━'.repeat(60));

  if (failed === 0) {
    console.log('✅ Step 2 PASSED: All query types detected correctly!');
  } else {
    console.log('❌ Step 2 FAILED: Some query types not detected correctly');
    process.exit(1);
  }
}

testStep2();

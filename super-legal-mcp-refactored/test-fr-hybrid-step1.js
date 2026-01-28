#!/usr/bin/env node
/**
 * Step 1 Test: FederalRegisterHybridClient Skeleton
 * Tests constructor and basic initialization
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

console.log('🧪 Step 1 Test: FederalRegisterHybridClient Skeleton\n');

async function testStep1() {
  try {
    // Test 1: Constructor
    console.log('Test 1: Constructor initialization...');
    const client = new FederalRegisterHybridClient(
      rateLimiterConfigs.federal_register,
      process.env.EXA_API_KEY
    );

    console.log('✅ Constructor successful');
    console.log('   clientName:', client.clientName);
    console.log('   enableSmartFallback:', client.enableSmartFallback);
    console.log('   nativeClient exists:', !!client.nativeClient);
    console.log('   websearchClient exists:', !!client.websearchClient);
    console.log('   circuitBreaker.threshold:', client.circuitBreaker.threshold);
    console.log('');

    // Test 2: Basic method call
    console.log('Test 2: Call searchFederalRegister (placeholder)...');
    const result = await client.searchFederalRegister({
      agency: 'EPA',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);
    console.log('✅ Method call successful');
    console.log('   Response:', data.message);
    console.log('   Args received:', JSON.stringify(data.args, null, 2));
    console.log('');

    console.log('━'.repeat(60));
    console.log('✅ Step 1 PASSED: Skeleton works correctly!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.log('');
    console.log('━'.repeat(60));
    console.error('❌ Step 1 FAILED:', error.message);
    console.error(error.stack);
    console.log('━'.repeat(60));
    process.exit(1);
  }
}

testStep1();

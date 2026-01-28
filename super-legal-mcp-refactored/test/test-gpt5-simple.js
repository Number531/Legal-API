#!/usr/bin/env node

/**
 * Simple GPT-5 Bridge Test
 * Tests only the working Bridge mode
 */

import 'dotenv/config';
import { Gpt5Bridge } from '../src/orchestrator/gpt5Bridge.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBridge() {
  const baseDir = path.resolve(__dirname, '..');
  const runnerPath = `${baseDir}/run-legal-mcp.sh`;
  
  console.log('🚀 GPT-5 Bridge Test');
  console.log('='.repeat(50));
  console.log(`📍 Base: ${baseDir}`);
  console.log(`🤖 Model: ${process.env.GPT5_MODEL || 'gpt-4o-2024-08-06'}`);
  console.log('='.repeat(50));
  
  // Ensure runner script
  try {
    await fs.access(runnerPath);
  } catch {
    const content = `#!/bin/bash\ncd "${baseDir}"\nexec node index.js\n`;
    await fs.writeFile(runnerPath, content, { mode: 0o755 });
    console.log('✅ Created runner script');
  }
  
  // Initialize bridge
  const bridge = new Gpt5Bridge({
    apiKey: process.env.OPENAI_API_KEY,
    runnerPath: runnerPath,
    model: process.env.GPT5_MODEL || 'gpt-4o-2024-08-06'
  });
  
  console.log('\n📋 Running Bridge Tests:');
  
  // Test 1: Simple query
  console.log('\n1️⃣ Simple Legal Query');
  try {
    const start = Date.now();
    const result = await bridge.runResearch('What is Chapter 7 bankruptcy?');
    console.log(`   ✅ Success in ${Date.now() - start}ms`);
    console.log(`   📄 Response: ${result.text?.substring(0, 100)}...`);
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}`);
  }
  
  // Test 2: Tool-based query
  console.log('\n2️⃣ SEC Filing Search');
  try {
    const start = Date.now();
    const result = await bridge.runResearch('Find recent 10-K filings for Microsoft');
    console.log(`   ✅ Success in ${Date.now() - start}ms`);
    console.log(`   📄 Length: ${result.text?.length} chars`);
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}`);
  }
  
  // Test 3: Patent search
  console.log('\n3️⃣ Patent Search');
  try {
    const start = Date.now();
    const result = await bridge.runResearch('Search for AI patents filed in 2024');
    console.log(`   ✅ Success in ${Date.now() - start}ms`);
    console.log(`   📄 Length: ${result.text?.length} chars`);
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}`);
  }
  
  console.log('\n✨ Bridge testing complete!');
  process.exit(0);
}

testBridge().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
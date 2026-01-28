#!/usr/bin/env node

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testParams() {
  console.log('Testing GPT-5 parameter requirements...\n');
  
  // Test 1: with max_tokens
  console.log('Test 1: Using max_tokens');
  try {
    const response1 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 100
    });
    console.log('✅ max_tokens works');
  } catch (e) {
    console.log('❌ max_tokens failed:', e.message);
  }
  
  // Test 2: with max_completion_tokens
  console.log('\nTest 2: Using max_completion_tokens');
  try {
    const response2 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_completion_tokens: 100
    });
    console.log('✅ max_completion_tokens works');
  } catch (e) {
    console.log('❌ max_completion_tokens failed:', e.message);
  }
  
  // Test 3: with max_output_tokens
  console.log('\nTest 3: Using max_output_tokens');
  try {
    const response3 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_output_tokens: 100
    });
    console.log('✅ max_output_tokens works');
  } catch (e) {
    console.log('❌ max_output_tokens failed:', e.message);
  }
}

testParams().catch(console.error);
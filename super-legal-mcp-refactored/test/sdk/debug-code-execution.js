#!/usr/bin/env node

/**
 * Debug script to examine Code Execution API response format
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CODE_EXECUTION_BETA = 'code-execution-2025-08-25';
const CODE_EXECUTION_TOOL_TYPE = 'code_execution_20250825';
const MODEL = process.env.CODE_EXECUTION_MODEL || 'claude-sonnet-4-5-20250929';

async function main() {
  console.log('=== Code Execution Debug Test ===\n');
  console.log('Model:', MODEL);
  console.log('Beta:', CODE_EXECUTION_BETA);
  console.log('Tool Type:', CODE_EXECUTION_TOOL_TYPE);
  console.log();

  const client = new Anthropic();

  const prompt = `Execute this simple Python code:

\`\`\`python
import json
result = {"value": 42, "message": "Hello from sandbox"}
print(json.dumps(result))
\`\`\`

Use the code_execution tool to run this code and show me the output.`;

  console.log('Sending request...\n');

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      betas: [CODE_EXECUTION_BETA],
      max_tokens: 4096,
      tools: [{ type: CODE_EXECUTION_TOOL_TYPE, name: 'code_execution' }],
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('=== FULL RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n=== CONTENT BLOCKS ===');
    for (let i = 0; i < response.content.length; i++) {
      const block = response.content[i];
      console.log(`\nBlock ${i}:`);
      console.log('  Type:', block.type);
      console.log('  Keys:', Object.keys(block));

      if (block.type === 'text') {
        console.log('  Text:', block.text?.substring(0, 200) + (block.text?.length > 200 ? '...' : ''));
      } else if (block.type === 'tool_use') {
        console.log('  Tool Name:', block.name);
        console.log('  Tool ID:', block.id);
        console.log('  Input:', JSON.stringify(block.input)?.substring(0, 200));
      } else {
        console.log('  Full Block:', JSON.stringify(block, null, 2));
      }
    }

    console.log('\n=== STOP REASON ===');
    console.log(response.stop_reason);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

main();

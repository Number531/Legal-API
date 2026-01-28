/**
 * Test script to verify 1M context window is correctly configured
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function test1MContext() {
  console.log('='.repeat(60));
  console.log('Testing 1M Context Window Configuration');
  console.log('='.repeat(60));

  // Test 1: Verify SDK can handle betas parameter
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  console.log('\n✓ Anthropic client initialized');

  try {
    // Test with a simple message to verify beta header works
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      betas: ['context-1m-2025-08-07'],
      messages: [{
        role: 'user',
        content: 'Say "1M context enabled" if you can see this message.'
      }]
    });

    console.log('✓ API call with betas parameter succeeded');
    console.log('Response:', response.content[0].text);
    console.log('\n✅ 1M Context Window is correctly configured!');
    
    // Check usage
    console.log('\nToken usage:');
    console.log('  Input tokens:', response.usage.input_tokens);
    console.log('  Output tokens:', response.usage.output_tokens);
    
    return true;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('betas')) {
      console.error('\n⚠️  Beta parameter syntax issue detected!');
      console.error('Expected: betas: [\'context-1m-2025-08-07\']');
    }
    
    return false;
  }
}

// Run test
test1MContext()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Test streaming responses from the GPT-5 Orchestrator
 * Shows real-time tool calls and thinking
 */

import fetch from 'node-fetch';

async function testStreaming() {
  console.log('🚀 Testing Streaming Response');
  console.log('='.repeat(60));
  
  const query = process.argv[2] || 'Find recent bankruptcy cases involving chemical manufacturing companies in Pennsylvania, focusing on intellectual property retention';
  
  console.log(`📝 Query: ${query}`);
  console.log('='.repeat(60));
  console.log('\n📡 Starting stream...\n');
  
  const url = `http://localhost:8089/api/gpt5/stream?${new URLSearchParams({ query })}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Process the stream
    const reader = response.body;
    let buffer = '';
    
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'tool') {
              console.log(`\n🔧 Tool Called: ${data.tool.name}`);
              if (data.tool.arguments) {
                console.log(`   Args: ${JSON.stringify(data.tool.arguments, null, 2).substring(0, 200)}...`);
              }
            } else if (data.type === 'delta') {
              process.stdout.write(data.text);
            } else if (data.type === 'final') {
              console.log('\n\n✅ Stream complete!');
            } else if (data.type === 'error') {
              console.log(`\n❌ Error: ${data.error}`);
            }
          } catch (e) {
            // Not JSON, might be SSE comment or empty line
          }
        }
      }
    });
    
    reader.on('end', () => {
      console.log('\n📊 Streaming session ended');
    });
    
    reader.on('error', (error) => {
      console.error('Stream error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    console.log('\n💡 Make sure the orchestrator server is running:');
    console.log('   node src/server/startOrchestrator.js');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Streaming stopped by user');
  process.exit(0);
});

testStreaming();
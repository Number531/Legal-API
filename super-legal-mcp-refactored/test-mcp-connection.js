#!/usr/bin/env node

import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPConnection() {
  const BASE_DIR = process.env.MCP_BASE_DIR || process.cwd();
  const RUNNER = `${BASE_DIR}/run-legal-mcp.sh`;
  
  console.log('Connecting to MCP via:', RUNNER);
  
  try {
    const transport = new StdioClientTransport({ 
      command: 'bash', 
      args: [RUNNER],
      env: process.env
    });
    
    const mcp = new MCPClient(
      { name: 'test-client', version: '1.0.0' }, 
      { capabilities: {} }
    );
    
    console.log('Connecting to transport...');
    await mcp.connect(transport);
    console.log('Connected!');
    
    console.log('Listing tools...');
    const listed = await mcp.listTools();
    console.log(`Found ${listed.tools?.length || 0} tools`);
    
    if (listed.tools?.length > 0) {
      console.log('First 5 tools:', listed.tools.slice(0, 5).map(t => t.name));
    }
    
    console.log('Closing connection...');
    await mcp.close();
    console.log('Connection closed successfully');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMCPConnection();
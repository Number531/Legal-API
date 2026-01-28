/**
 * Test MCP Tool Listing - Verify FDA tools are registered
 */

import { EnhancedLegalMcpServer } from './src/server/EnhancedLegalMcpServer.js';

async function testMCPToolsList() {
  console.log('🔍 Checking MCP Tool Registration\n');

  try {
    // Initialize the server
    const server = new EnhancedLegalMcpServer();

    // Get the tool implementations
    const tools = Object.keys(server.toolImplementations);

    console.log(`📋 Total Tools Registered: ${tools.length}\n`);

    // Filter FDA tools
    const fdaTools = tools.filter(tool => tool.includes('fda'));

    console.log(`🏥 FDA Tools Found: ${fdaTools.length}`);
    if (fdaTools.length > 0) {
      fdaTools.forEach((tool, i) => {
        console.log(`  ${i + 1}. ${tool}`);
      });
    } else {
      console.log('  ❌ No FDA tools found!');
    }

    // Check if specific FDA hybrid tools are present
    console.log('\n✅ FDA Hybrid Tools Check:');
    const hybridTools = [
      'search_fda_drug_adverse_events',
      'search_fda_device_events',
      'search_fda_drug_labels',
      'search_fda_recalls'
    ];

    hybridTools.forEach(tool => {
      const exists = tools.includes(tool);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${tool}`);
    });

    // Check clients
    console.log('\n🔧 Client Instances Check:');
    const clients = server.getClients();
    console.log(`  fdaHybrid exists: ${clients.fdaHybrid ? '✅' : '❌'}`);
    console.log(`  fdaWeb exists: ${clients.fdaWeb ? '✅' : '❌'}`);

    if (clients.fdaHybrid) {
      console.log(`  fdaHybrid type: ${clients.fdaHybrid.constructor.name}`);
      console.log(`  fdaHybrid.searchDrugAdverseEvents: ${typeof clients.fdaHybrid.searchDrugAdverseEvents}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testMCPToolsList();

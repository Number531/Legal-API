#!/usr/bin/env node

import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'bash',
  args: ['./run-legal-mcp.sh']
});

const mcp = new MCPClient(
  { name: 'tool-counter', version: '1.0.0' },
  { capabilities: {} }
);

await mcp.connect(transport);
const tools = await mcp.listTools();

// Group tools by API
const apis = {
  'CourtListener': [],
  'SEC EDGAR': [],
  'USPTO Patents': [],
  'Federal Register': [],
  'GovInfo': [],
  'Exa (State Laws)': [],
  'EPA ECHO': [],
  'FDA openFDA': [],
  'CPSC Recalls': [],
  'NHTSA': [],
  'PTAB': [],
  'FTC': [],
  'Analysis Tools': []
};

tools.tools.forEach(t => {
  if (t.name.includes('courtlistener') || t.name.startsWith('search_cases') || t.name.startsWith('search_judges') || t.name.startsWith('get_case')) {
    apis['CourtListener'].push(t.name);
  } else if (t.name.includes('sec') || t.name.includes('edgar')) {
    apis['SEC EDGAR'].push(t.name);
  } else if (t.name.includes('patent') || t.name.includes('uspto') || t.name.includes('cpc') || t.name.includes('uspc') || t.name.includes('wipo')) {
    apis['USPTO Patents'].push(t.name);
  } else if (t.name.includes('federal_register') || t.name.includes('ftc')) {
    apis['Federal Register'].push(t.name);
  } else if (t.name.includes('us_code') || t.name.includes('govinfo')) {
    apis['GovInfo'].push(t.name);
  } else if (t.name.includes('state_statute') || t.name.includes('exa')) {
    apis['Exa (State Laws)'].push(t.name);
  } else if (t.name.includes('epa')) {
    apis['EPA ECHO'].push(t.name);
  } else if (t.name.includes('fda')) {
    apis['FDA openFDA'].push(t.name);
  } else if (t.name.includes('cpsc')) {
    apis['CPSC Recalls'].push(t.name);
  } else if (t.name.includes('nhtsa')) {
    apis['NHTSA'].push(t.name);
  } else if (t.name.includes('ptab')) {
    apis['PTAB'].push(t.name);
  } else if (t.name.includes('comprehensive') || t.name.includes('analysis')) {
    apis['Analysis Tools'].push(t.name);
  } else {
    // Categorize by prefix
    const prefix = t.name.split('_')[0];
    if (prefix === 'search') apis['CourtListener'].push(t.name);
    else if (prefix === 'get') apis['CourtListener'].push(t.name);
    else if (prefix === 'lookup') apis['CourtListener'].push(t.name);
    else if (prefix === 'list') apis['CourtListener'].push(t.name);
    else apis['Analysis Tools'].push(t.name);
  }
});

console.log('🏛️ LEGAL RESEARCH APIS AVAILABLE');
console.log('='.repeat(50));
console.log(`Total: ${tools.tools.length} tools across 14 APIs\n`);

Object.entries(apis).forEach(([api, toolList]) => {
  if (toolList.length > 0) {
    console.log(`📚 ${api}: ${toolList.length} tools`);
    toolList.slice(0, 3).forEach(t => console.log(`   • ${t}`));
    if (toolList.length > 3) console.log(`   ... and ${toolList.length - 3} more`);
    console.log();
  }
});

console.log('='.repeat(50));
console.log('✅ All tools are automatically selected based on your query!');
console.log('The AI analyzes your question and uses multiple APIs as needed.');

await mcp.close();
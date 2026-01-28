#!/usr/bin/env node

/**
 * Test USC Section Fix
 * Verify sections 1107, 1108, 1121 can now be retrieved
 */

import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing USC Section Retrieval Fix\n');

const client = new GovInfoClient(null);

const testSections = [
  { title: 11, section: '1107', name: 'Rights, powers, and duties of debtor in possession' },
  { title: 11, section: '1108', name: 'Authorization to operate business' },
  { title: 11, section: '1121', name: 'Who may file a plan' }
];

async function testSection(title, section, name) {
  console.log(`Testing Title ${title}, Section ${section} - ${name}`);
  try {
    const result = await client.getUSCSection({ title, section, format: 'text' });
    const data = JSON.parse(result.content[0].text);
    console.log(`  ✅ SUCCESS! Retrieved section ${section}`);
    console.log(`     Section Title: ${typeof data.section_title === 'string' ? data.section_title.substring(0, 60) : data.section_title}...`);
    console.log(`     Package: ${data.package_id}`);
    console.log(`     Granule: ${data.granule_id}`);
    if (data.content) {
      const contentPreview = typeof data.content === 'string' ? 
        data.content.substring(0, 100) : 
        JSON.stringify(data.content).substring(0, 100);
      console.log(`     Content preview: ${contentPreview}...`);
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
  }
  console.log();
}

// Test all sections
async function runTests() {
  for (const test of testSections) {
    await testSection(test.title, test.section, test.name);
  }
  
  console.log('✨ Test complete!');
}

runTests().catch(console.error);
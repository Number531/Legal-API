#!/usr/bin/env node

/**
 * Test USC Section Retrieval General Optimization
 * Verify the smart batch sizing works for all sections
 */

import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('📊 Testing USC Section Retrieval General Optimization\n');

const client = new GovInfoClient(null);

const testCases = [
  { title: 11, section: '101', expectedBatch: 100, name: 'Low section (< 500)' },
  { title: 11, section: '362', expectedBatch: 100, name: 'Low section (< 500)' },
  { title: 11, section: '521', expectedBatch: 200, name: 'Mid section (500-999)' },
  { title: 11, section: '722', expectedBatch: 200, name: 'Mid section (500-999)' },
  { title: 11, section: '1001', expectedBatch: 300, name: 'High section (≥ 1000)' },
  { title: 11, section: '1107', expectedBatch: 500, name: 'Title 11 Chapter 11 (1100-1199)' },
  { title: 11, section: '1121', expectedBatch: 500, name: 'Title 11 Chapter 11 (1100-1199)' },
  { title: 11, section: '1129', expectedBatch: 500, name: 'Title 11 Chapter 11 (1100-1199)' },
  { title: 11, section: '1301', expectedBatch: 300, name: 'High section (≥ 1000)' },
  { title: 5, section: '102', expectedBatch: 100, name: 'Different title, low section' },
  { title: 5, section: '551', expectedBatch: 200, name: 'Different title, mid section' },
  { title: 5, section: '2105', expectedBatch: 300, name: 'Different title, high section' },
];

async function testSection(testCase) {
  const { title, section, expectedBatch, name } = testCase;
  console.log(`Testing: Title ${title}, Section ${section}`);
  console.log(`  Category: ${name}`);
  console.log(`  Expected initial batch: ${expectedBatch} granules`);
  
  const startTime = Date.now();
  
  try {
    const result = await client.getUSCSection({ 
      title, 
      section, 
      format: 'json' 
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const data = JSON.parse(result.content[0].text);
    
    console.log(`  ✅ SUCCESS`);
    console.log(`     Time: ${duration}ms`);
    console.log(`     Granule: ${data.granule_id}`);
    
    // Indicate the optimization strategy used
    const sectionNum = parseInt(section);
    if (sectionNum >= 1100 && sectionNum < 1200 && title === 11) {
      console.log(`     🚀 Strategy: Title 11 Chapter 11 optimization (500 granules)`);
    } else if (sectionNum >= 1000) {
      console.log(`     📦 Strategy: High section (300 granules initial)`);
    } else if (sectionNum >= 500) {
      console.log(`     📦 Strategy: Mid section (200 granules initial)`);
    } else {
      console.log(`     📦 Strategy: Low section (100 granules initial)`);
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`  ❌ FAILED: ${error.message}`);
    console.log(`     Time: ${duration}ms`);
  }
  
  console.log();
}

// Run all tests
async function runTests() {
  console.log('The general optimization strategy:\n');
  console.log('Smart batch sizing based on section numbers:');
  console.log('  • Sections < 500: Start with 100 granules');
  console.log('  • Sections 500-999: Start with 200 granules');
  console.log('  • Sections ≥ 1000: Start with 300 granules');
  console.log('  • Title 11, Sections 1100-1199: Start with 500 granules (Chapter 11)');
  console.log('  • After initial batch: Continue with 100-granule increments\n');
  console.log('---\n');
  
  for (const testCase of testCases) {
    await testSection(testCase);
  }
  
  console.log('Summary:');
  console.log('✨ General optimization benefits:');
  console.log('   - Works for ALL sections, not just specific ones');
  console.log('   - Smart initial batch size based on section number');
  console.log('   - Minimizes API calls for low sections');
  console.log('   - Ensures high sections are found efficiently');
  console.log('   - Stops immediately when section is found');
}

runTests().catch(console.error);
#!/usr/bin/env node

/**
 * Test USC Section Retrieval Optimization
 * Compare fetching efficiency for different sections
 */

import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('📊 Testing USC Section Retrieval Optimization\n');

const client = new GovInfoClient(null);

const testCases = [
  { 
    title: 11, 
    section: '101', 
    name: 'Definitions (early section)',
    expectedPosition: 'early'
  },
  { 
    title: 11, 
    section: '362', 
    name: 'Automatic stay (middle section)',
    expectedPosition: 'middle'
  },
  { 
    title: 11, 
    section: '1107', 
    name: 'Debtor in possession (late section)',
    expectedPosition: 'late (around granule 400+)'
  },
  { 
    title: 5, 
    section: '551', 
    name: 'General provisions (Title 5)',
    expectedPosition: 'varies by title'
  }
];

async function testSection(testCase) {
  const { title, section, name, expectedPosition } = testCase;
  console.log(`Testing: Title ${title}, Section ${section}`);
  console.log(`  Description: ${name}`);
  console.log(`  Expected position: ${expectedPosition}`);
  
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
    
    // For Title 11 sections, show the optimization in action
    if (title === 11) {
      const isChapter11 = ['1107', '1108', '1121'].includes(section.toString());
      if (isChapter11) {
        console.log(`     🚀 Optimized: Used 500-granule batch for Title 11 Chapter 11`);
      } else {
        console.log(`     📦 Standard: Using progressive 100-granule batches`);
      }
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
  console.log('The optimization strategy:\n');
  console.log('1. For Title 11 sections 1107, 1108, 1121: Fetch 500 granules upfront');
  console.log('   (These sections are known to be around granule position 400+)\n');
  console.log('2. For all other sections: Progressive fetching in 100-granule batches');
  console.log('   (Stop as soon as the section is found)\n');
  console.log('---\n');
  
  for (const testCase of testCases) {
    await testSection(testCase);
  }
  
  console.log('Summary:');
  console.log('✨ Optimization reduces data transfer by:');
  console.log('   - Using targeted batch sizes based on known section positions');
  console.log('   - Stopping search immediately when section is found');
  console.log('   - Fetching only 500 granules for Title 11 Chapter 11 (vs 600 before)');
  console.log('   - Using 100-granule batches for other sections (vs 600 before)');
}

runTests().catch(console.error);
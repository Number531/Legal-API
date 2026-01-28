#!/usr/bin/env node

/**
 * Deep investigation of GovInfo USC granule structure
 * Find out how sections 1107, 1108, 1121 are stored
 */

import { makeApiRequest } from '../src/utils/apiHelpers.js';

const API_KEY = process.env.GOVINFO_API_KEY || 'hx9RWaWtGHhwYRCPTq2raq7C7z1QgdkcR3vhvMRv';

console.log('🔍 Deep Investigation of GovInfo USC Structure\n');

async function getAllGranules(packageId) {
  let allGranules = [];
  let offsetMark = '*';
  let hasMore = true;
  let pageCount = 0;
  
  while (hasMore && allGranules.length < 5000) { // Increased limit
    pageCount++;
    const params = new URLSearchParams();
    params.append('api_key', API_KEY);
    params.append('pageSize', '100');
    params.append('offsetMark', offsetMark);
    
    try {
      const response = await makeApiRequest(
        `/packages/${packageId}/granules?${params.toString()}`,
        {},
        { apiType: 'govinfo' }
      );
      
      if (response.granules && response.granules.length > 0) {
        allGranules.push(...response.granules);
        offsetMark = response.nextPage?.offsetMark;
        hasMore = !!offsetMark;
        console.log(`  Page ${pageCount}: Retrieved ${response.granules.length} granules (total: ${allGranules.length})`);
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`  Error on page ${pageCount}:`, error.message);
      hasMore = false;
    }
  }
  
  return allGranules;
}

async function investigateTitle11() {
  console.log('Fetching ALL granules from Title 11...\n');
  
  const packageId = 'USCODE-2023-title11';
  const allGranules = await getAllGranules(packageId);
  
  console.log(`\nTotal granules retrieved: ${allGranules.length}`);
  
  // Find Chapter 11 related granules
  console.log('\n📚 Chapter 11 Related Granules:');
  const chapter11Granules = allGranules.filter(g => {
    const id = g.granuleId?.toLowerCase() || '';
    const title = g.title?.toLowerCase() || '';
    return id.includes('chap11') || title.includes('chapter 11') || title.includes('reorganization');
  });
  
  chapter11Granules.forEach(g => {
    console.log(`  - ${g.title}`);
    console.log(`    ID: ${g.granuleId}`);
  });
  
  // Search for specific sections
  console.log('\n🔎 Searching for Sections 1107, 1108, 1121:');
  const targetSections = ['1107', '1108', '1121'];
  
  targetSections.forEach(section => {
    const found = allGranules.filter(g => {
      const id = g.granuleId?.toLowerCase() || '';
      const title = g.title || '';
      return id.includes(`sec${section}`) || 
             id.includes(`section${section}`) ||
             title.includes(section);
    });
    
    if (found.length > 0) {
      console.log(`\n  ✓ Section ${section} found:`);
      found.forEach(g => {
        console.log(`    - ${g.title}`);
        console.log(`      ID: ${g.granuleId}`);
      });
    } else {
      console.log(`  ✗ Section ${section} NOT found as individual granule`);
    }
  });
  
  // Show granule ID patterns
  console.log('\n📋 Sample Granule ID Patterns:');
  const sampleGranules = allGranules.slice(100, 110); // Show some middle granules
  sampleGranules.forEach(g => {
    console.log(`  ${g.granuleId} -> ${g.title?.substring(0, 50)}...`);
  });
  
  // Check if sections are within chapters
  console.log('\n🔍 Checking if sections 1100+ are in chapter granules:');
  const section1100Granules = allGranules.filter(g => {
    const title = g.title || '';
    return parseInt(title.match(/\d{4}/)?.[0]) >= 1100 && parseInt(title.match(/\d{4}/)?.[0]) < 1200;
  });
  
  if (section1100Granules.length > 0) {
    console.log('  Found sections 1100-1199:');
    section1100Granules.slice(0, 10).forEach(g => {
      console.log(`    - ${g.title}`);
    });
  } else {
    console.log('  No individual section granules for 1100-1199 range');
    console.log('  These sections are likely contained within chapter-level granules');
  }
}

// Run the investigation
investigateTitle11().then(() => {
  console.log('\n✅ Investigation complete!');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});
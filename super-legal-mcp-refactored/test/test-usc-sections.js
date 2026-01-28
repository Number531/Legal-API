#!/usr/bin/env node

/**
 * Test USC Section Retrieval
 * Debug why sections 1107, 1108, 1121 aren't found
 */

import { GovInfoClient } from '../src/api-clients/GovInfoClient.js';
import { makeApiRequest } from '../src/utils/apiHelpers.js';

console.log('🔍 Testing USC Section Retrieval\n');

const client = new GovInfoClient(null);

// Test 1: Try direct search for these sections
console.log('Test 1: Direct search for bankruptcy sections');
try {
  const searchParams = new URLSearchParams({
    query: '11 USC 1107',
    pageSize: '10'
  });
  
  if (process.env.GOVINFO_API_KEY) {
    searchParams.append('api_key', process.env.GOVINFO_API_KEY);
  }
  
  const searchResponse = await makeApiRequest(
    `/search?${searchParams.toString()}`,
    {},
    { apiType: 'govinfo' }
  );
  
  console.log('Search results for "11 USC 1107":');
  if (searchResponse.results && searchResponse.results.length > 0) {
    searchResponse.results.forEach(r => {
      console.log(`  - ${r.title}`);
      console.log(`    Package: ${r.packageId}`);
      console.log(`    Granule: ${r.granuleId || 'N/A'}`);
    });
  } else {
    console.log('  No results found');
  }
} catch (error) {
  console.log('Search error:', error.message);
}

console.log('\n---\n');

// Test 2: Check Title 11 package structure
console.log('Test 2: Check Title 11 package structure');
try {
  const params = new URLSearchParams();
  if (process.env.GOVINFO_API_KEY) {
    params.append('api_key', process.env.GOVINFO_API_KEY);
  }
  
  // Get the most recent USC Title 11 package
  const packageId = 'USCODE-2023-title11';
  
  // Get more granules to find Chapter 11
  params.append('pageSize', '100');  // Get more results
  params.append('offsetMark', '*');
  
  const granulesResponse = await makeApiRequest(
    `/packages/${packageId}/granules?${params.toString()}`,
    {},
    { apiType: 'govinfo' }
  );
  
  console.log(`Title 11 granules (showing all):`);
  if (granulesResponse.granules) {
    // Show all granules to understand structure
    granulesResponse.granules.forEach(g => {
      console.log(`  - ${g.title}`);
      console.log(`    ID: ${g.granuleId}`);
    });
    
    console.log(`\nTotal granules in this batch: ${granulesResponse.granules.length}`);
    console.log(`Has more pages: ${!!granulesResponse.nextPage?.offsetMark}`);
    
    // Now look for our specific sections
    const targetSections = ['1107', '1108', '1121'];
    console.log('\nSearching for target sections:');
    targetSections.forEach(section => {
      const found = granulesResponse.granules.find(g => 
        (g.title || '').includes(section) || 
        (g.granuleId || '').includes(section)
      );
      if (found) {
        console.log(`  ✓ Found Section ${section}`);
      } else {
        console.log(`  ✗ Section ${section} not in this batch`);
      }
    });
  }
} catch (error) {
  console.log('Package error:', error.message);
}

console.log('\n---\n');

// Test 3: Try alternative search patterns
console.log('Test 3: Alternative search for Chapter 11 sections');
try {
  const searchParams = new URLSearchParams({
    query: 'title:11 AND (1107 OR 1108 OR 1121) AND "debtor in possession"',
    pageSize: '5'
  });
  
  if (process.env.GOVINFO_API_KEY) {
    searchParams.append('api_key', process.env.GOVINFO_API_KEY);
  }
  
  const searchResponse = await makeApiRequest(
    `/search?${searchParams.toString()}`,
    {},
    { apiType: 'govinfo' }
  );
  
  console.log('Alternative search results:');
  if (searchResponse.results && searchResponse.results.length > 0) {
    searchResponse.results.forEach(r => {
      console.log(`  - ${r.title?.substring(0, 80)}...`);
    });
  } else {
    console.log('  No results found');
  }
} catch (error) {
  console.log('Alternative search error:', error.message);
}

console.log('\n📊 Investigation complete!');
process.exit(0);
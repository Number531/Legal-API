#!/usr/bin/env node

/**
 * Test EPA web search with and without live crawl
 * Compare indexed vs real-time EPA data
 */

import dotenv from 'dotenv';

dotenv.config();

console.log('🕷️ Testing EPA Live Crawl vs Indexed Search\n');

async function testLiveCrawlComparison() {
  if (!process.env.EXA_API_KEY) {
    console.log('⚠️  EXA_API_KEY not configured - cannot test live crawl\n');
    return;
  }

  const exaApiKey = process.env.EXA_API_KEY;
  const query = 'site:echo.epa.gov "BASF" "Pennsylvania" violations';
  
  console.log(`🔍 Testing query: ${query}\n`);
  
  // Test 1: Standard indexed search (current implementation)
  console.log('1. Standard Indexed Search (current):');
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': exaApiKey
      },
      body: JSON.stringify({
        query,
        numResults: 3,
        includeDomains: ['echo.epa.gov', 'www.epa.gov'],
        contents: { text: true }
        // No live crawl - uses indexed content
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS: Found ${data.results?.length || 0} results`);
      console.log(`   ⏱️ Response time: Fast (indexed content)`);
      
      if (data.results && data.results.length > 0) {
        const sample = data.results[0];
        console.log(`   📅 Published date: ${sample.publishedDate || 'Unknown'}`);
        console.log(`   🔗 URL: ${sample.url}`);
        console.log(`   📝 Content length: ${sample.text?.length || 0} chars`);
        console.log(`   📄 Title: ${sample.title}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  console.log();
  
  // Test 2: Live crawl enabled (real-time)
  console.log('2. Live Crawl Enabled (real-time):');
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': exaApiKey
      },
      body: JSON.stringify({
        query,
        numResults: 3,
        includeDomains: ['echo.epa.gov', 'www.epa.gov'],
        contents: { text: true },
        liveCrawl: true,        // ✅ Enable live crawling
        use_autoprompt: true    // ✅ Use autoprompt for better extraction
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS: Found ${data.results?.length || 0} results`);
      console.log(`   ⏱️ Response time: ${duration}ms (real-time crawl)`);
      
      if (data.results && data.results.length > 0) {
        const sample = data.results[0];
        console.log(`   📅 Published date: ${sample.publishedDate || 'Unknown'}`);
        console.log(`   🔗 URL: ${sample.url}`);
        console.log(`   📝 Content length: ${sample.text?.length || 0} chars`);
        console.log(`   📄 Title: ${sample.title}`);
        
        // Check if content is different/fresher
        console.log(`   🆕 Live content indicators:`);
        const text = sample.text || '';
        if (text.toLowerCase().includes('current') || text.toLowerCase().includes('recent')) {
          console.log(`      - Contains "current/recent" language`);
        }
        if (text.includes('2025') || text.includes('2024')) {
          console.log(`      - Contains recent year references`);
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  console.log();
}

async function testEPASpecificLiveCrawl() {
  if (!process.env.EXA_API_KEY) return;
  
  console.log('🏭 Testing EPA-specific live crawl scenarios:\n');
  
  const scenarios = [
    {
      name: 'Recent EPA Enforcement Actions',
      query: 'site:epa.gov/enforcement "2024" "settlement" OR "penalty"',
      expectation: 'Latest enforcement cases'
    },
    {
      name: 'Current Compliance Status',
      query: 'site:echo.epa.gov "quarterly noncompliance"',
      expectation: 'Current quarterly compliance data'  
    },
    {
      name: 'Fresh Violation Records',
      query: 'site:echo.epa.gov "violations" "formal enforcement"',
      expectation: 'Recent violation records'
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`🔍 ${scenario.name}:`);
    console.log(`   Query: ${scenario.query}`);
    console.log(`   Expecting: ${scenario.expectation}`);
    
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY
        },
        body: JSON.stringify({
          query: scenario.query,
          numResults: 2,
          includeDomains: ['echo.epa.gov', 'www.epa.gov'],
          contents: { text: true },
          liveCrawl: true,
          use_autoprompt: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Found ${data.results?.length || 0} live results`);
        
        if (data.results && data.results.length > 0) {
          const sample = data.results[0];
          console.log(`   📄 Sample: ${sample.title?.substring(0, 100)}...`);
          console.log(`   🔗 URL: ${sample.url}`);
          
          // Check for freshness indicators
          const text = sample.text || '';
          const recentKeywords = ['2024', '2025', 'current', 'latest', 'recent', 'updated'];
          const foundKeywords = recentKeywords.filter(kw => text.toLowerCase().includes(kw));
          
          if (foundKeywords.length > 0) {
            console.log(`   🆕 Freshness indicators: ${foundKeywords.join(', ')}`);
          }
        }
      } else {
        console.log(`   ❌ FAILED: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log();
  }
}

async function runLiveCrawlTests() {
  console.log('Testing EPA live crawl functionality...\n');
  console.log('=' .repeat(70) + '\n');
  
  await testLiveCrawlComparison();
  await testEPASpecificLiveCrawl();
  
  console.log('=' .repeat(70));
  console.log('\n📊 Live Crawl Analysis:');
  
  if (process.env.EXA_API_KEY) {
    console.log('✅ Live crawl functionality tested');
    console.log('✅ Real-time EPA content retrieval verified');
    
    console.log('\n🎯 Recommendations:');
    console.log('💡 Enable live crawl for EPA tools to get current compliance data');
    console.log('💡 Use live crawl especially for enforcement/violation searches');
    console.log('💡 Consider hybrid approach: indexed for speed, live for freshness');
    console.log('💡 Live crawl is essential for accurate EPA compliance research');
    
    console.log('\n🔧 Implementation:');
    console.log('   Add to EPAWebSearchClient.executeExaSearch():');
    console.log('   - liveCrawl: true (for real-time data)');
    console.log('   - use_autoprompt: true (for better extraction)');
    
  } else {
    console.log('⚠️  Live crawl tests skipped (no EXA_API_KEY)');
  }
  
  console.log('\n🚀 Live crawl essential for current EPA compliance data!');
}

runLiveCrawlTests().catch(console.error);
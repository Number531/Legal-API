/**
 * Mock Tests for GovInfo WebSearch Client
 * Tests all 4 core methods with mock Exa API responses
 */

import { GovInfoWebSearchClient } from '../src/api-clients/GovInfoWebSearchClient.js';

class MockRateLimiter {
  async enforce() {
    // No delay for testing
  }
}

// Mock the Exa API calls
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url === 'https://api.exa.ai/search') {
    const body = JSON.parse(options.body);
    
    // Mock search results based on query content
    let mockResults = [];
    
    if (body.query.includes('section 552') || body.query.includes('Freedom of Information')) {
      mockResults = [
        {
          id: 'result-foia-1',
          title: '5 U.S.C. § 552 - Freedom of Information Act',
          url: 'https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/USCODE-2023-title5-partI-chap5-subchapII-sec552.htm',
          publishedDate: '2023-01-01',
          score: 0.95
        },
        {
          id: 'result-foia-2', 
          title: 'Title 5 - Government Organization and Employees, Chapter 5, Section 552',
          url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title5-section552',
          publishedDate: '2023-01-01',
          score: 0.88
        }
      ];
    } else if (body.query.includes('Title 18') || body.query.includes('Crimes')) {
      mockResults = [
        {
          id: 'result-crimes-1',
          title: 'Title 18 - Crimes and Criminal Procedure',
          url: 'https://www.govinfo.gov/content/pkg/USCODE-2023-title18/',
          publishedDate: '2023-01-01',
          score: 0.92
        }
      ];
    } else if (body.query.includes('table of contents') || body.query.includes('structure')) {
      mockResults = [
        {
          id: 'result-structure-1',
          title: 'Title 5 - Government Organization and Employees - Table of Contents',
          url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title5',
          publishedDate: '2023-01-01', 
          score: 0.90
        }
      ];
    } else {
      // Default USC search results
      mockResults = new Array(Math.min(body.numResults, 5)).fill(0).map((_, i) => ({
        id: `result-${i}`,
        title: `USC Section ${i + 1}`,
        url: `https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/section${i + 1}.htm`,
        publishedDate: '2023-01-01',
        score: 0.85 - (i * 0.05)
      }));
    }
    
    return {
      ok: true,
      json: async () => ({
        results: mockResults.slice(0, body.numResults)
      })
    };
  }
  
  if (url === 'https://api.exa.ai/contents') {
    const body = JSON.parse(options.body);
    
    // Mock contents based on ID
    const mockContents = body.ids.map(id => {
      let text = '';
      
      if (id.includes('foia')) {
        text = `§ 552. Public information; agency rules, opinions, orders, records, and proceedings

(a) Each agency shall make available to the public information as follows:

(1) Each agency shall separately state and currently publish in the Federal Register for the guidance of the public—
(A) descriptions of its central and field organization and the established places at which, the employees (and in the case of a uniformed service, the members) from whom, and the methods whereby, the public may obtain information, make submittals or requests, or obtain decisions;

This section means that government agencies must provide public access to information. Required disclosure includes agency organization, procedures, and substantive rules. Prohibited withholding of information except under specific exemptions. Penalty for improper withholding includes attorney fees and costs.`;
      } else if (id.includes('crimes')) {
        text = `TITLE 18—CRIMES AND CRIMINAL PROCEDURE

Chapter 1—General provisions
Chapter 2—Aircraft and motor vehicles  
Chapter 3—Animals, birds, fish, and plants

This title defines federal crimes and criminal procedures. Requirements for prosecution include jurisdiction, elements of offense, and proper procedure. Prohibited conduct encompasses various federal offenses. Penalties range from fines to imprisonment depending on severity.`;
      } else if (id.includes('structure')) {
        text = `TITLE 5—GOVERNMENT ORGANIZATION AND EMPLOYEES

PART I—THE AGENCIES GENERALLY

Chapter 1—Organization
Chapter 3—Powers  
Chapter 5—Administrative Procedure
Chapter 7—Judicial Review

Effective organization requires proper structure and procedures. This title establishes requirements for federal agency operations.`;
      } else {
        text = `United States Code section content. This is sample statutory text with legal definitions, requirements, and provisions. Effective implementation requires compliance with all applicable provisions.`;
      }
      
      return {
        id,
        text: text
      };
    });
    
    return {
      ok: true,
      json: async () => ({
        contents: mockContents
      })
    };
  }
  
  return originalFetch(url, options);
};

async function testGovInfoWebSearchMock() {
  console.log('🧪 Testing GovInfo WebSearch Client (Mock)...\\n');
  
  const client = new GovInfoWebSearchClient(new MockRateLimiter(), 'test-key');
  let passed = 0;
  let failed = 0;

  // Test helper function
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ ${testName}`);
      await testFn();
      console.log(`✅ PASSED\\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\\n`);
      failed++;
    }
  }

  // Test 1: Search US Code with keyword
  await runTest('Search USC with keyword', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'Freedom of Information Act'
    });
    
    const data = JSON.parse(result.content[0].text);
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }
    
    if (data.count !== data.results.length) {
      throw new Error(`Count mismatch: ${data.count} vs ${data.results.length}`);
    }
    
    console.log(`   ✓ Got ${data.results.length} results (default limit 5)`);
    console.log(`   ✓ Search criteria preserved: ${JSON.stringify(data.search_criteria)}`);
  });

  // Test 2: Search USC with title and section
  await runTest('Search USC with title and section', async () => {
    const result = await client.searchUSCodeWeb({
      title_number: 5,
      section: '552',
      search_text: 'FOIA'
    });
    
    const data = JSON.parse(result.content[0].text);
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }
    
    const firstResult = data.results[0];
    if (!firstResult.usc_citation) {
      throw new Error('USC citation not extracted');
    }
    
    console.log(`   ✓ USC citation extracted: ${firstResult.usc_citation}`);
    console.log(`   ✓ Title/section in criteria: ${data.search_criteria.title_number}/${data.search_criteria.section}`);
  });

  // Test 3: Search USC with full text
  await runTest('Search USC with full text', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'section 552',
      include_text: true,
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned');
    }
    
    if (data.results.length > 3) {
      throw new Error(`Limit not respected: got ${data.results.length}, expected max 3`);
    }
    
    const firstResult = data.results[0];
    if (!firstResult.text) {
      throw new Error('Full text not included');
    }
    
    if (!firstResult.text_length) {
      throw new Error('Text length not calculated');
    }
    
    console.log(`   ✓ Full text included (${firstResult.text_length} chars)`);
    console.log(`   ✓ Explicit limit respected: ${data.results.length} results`);
  });

  // Test 4: Search USC with snippet
  await runTest('Search USC with snippet', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'crimes',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    const firstResult = data.results[0];
    
    if (!firstResult.snippet) {
      throw new Error('Snippet not generated');
    }
    
    if (firstResult.snippet.length > 500) {
      throw new Error(`Snippet too long: ${firstResult.snippet.length} chars`);
    }
    
    console.log(`   ✓ Smart snippet generated (${firstResult.snippet.length} chars)`);
    console.log(`   ✓ Snippet preview: "${firstResult.snippet.substring(0, 100)}..."`);
  });

  // Test 5: Get specific USC section
  await runTest('Get specific USC section', async () => {
    const result = await client.getUSCSectionWeb({
      title: 5,
      section: '552'
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.title !== 5 || data.section !== '552') {
      throw new Error('Title/section not preserved in response');
    }
    
    if (!data.section_title) {
      throw new Error('Section title not found');
    }
    
    if (!data.usc_citation) {
      throw new Error('USC citation not generated');
    }
    
    if (!data.text || data.text === 'Full text not available') {
      throw new Error('Section text not retrieved');
    }
    
    console.log(`   ✓ Section retrieved: ${data.usc_citation}`);
    console.log(`   ✓ Section title: ${data.section_title}`);
    console.log(`   ✓ Has full text: ${data.text.length > 0}`);
  });

  // Test 6: Get USC section with format option
  await runTest('Get USC section with format', async () => {
    const result = await client.getUSCSectionWeb({
      title: 18,
      section: '1341',
      format: 'html',
      year: 2022
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.format !== 'html') {
      throw new Error('Format not preserved');
    }
    
    if (data.year !== 2022) {
      throw new Error('Year not preserved');
    }
    
    console.log(`   ✓ Format preserved: ${data.format}`);
    console.log(`   ✓ Year preserved: ${data.year}`);
  });

  // Test 7: Get USC title structure
  await runTest('Get USC title structure', async () => {
    const result = await client.getUSCTitleStructureWeb({
      title: 5,
      include_chapters: true
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.title_number !== 5) {
      throw new Error('Title number not preserved');
    }
    
    if (!data.title_name || !data.title_name.includes('Government')) {
      throw new Error('Title name not found or incorrect');
    }
    
    if (!data.sources || data.sources.length === 0) {
      throw new Error('No sources found');
    }
    
    if (data.chapters === undefined) {
      throw new Error('Chapters not included when requested');
    }
    
    console.log(`   ✓ Title structure: ${data.title_name}`);
    console.log(`   ✓ Sources found: ${data.sources.length}`);
    console.log(`   ✓ Chapters structure included`);
  });

  // Test 8: List USC titles
  await runTest('List USC titles', async () => {
    const result = await client.listUSCTitlesWeb({
      include_enacted: true,
      include_descriptions: true
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (!data.titles || data.titles.length !== 54) {
      throw new Error(`Expected 54 titles, got ${data.titles ? data.titles.length : 0}`);
    }
    
    if (data.total_titles !== 54) {
      throw new Error(`Total titles incorrect: ${data.total_titles}`);
    }
    
    const title5 = data.titles.find(t => t.number === 5);
    if (!title5 || !title5.name.includes('Government')) {
      throw new Error('Title 5 not found or incorrect');
    }
    
    if (title5.enacted_positive_law === undefined) {
      throw new Error('Enacted status not included when requested');
    }
    
    if (!title5.description) {
      throw new Error('Description not included when requested');
    }
    
    console.log(`   ✓ All 54 titles listed`);
    console.log(`   ✓ Available titles: ${data.available_count}`);
    console.log(`   ✓ Title 5: ${title5.name} (enacted: ${title5.enacted_positive_law})`);
  });

  // Test 9: Validation tests
  await runTest('Input validation', async () => {
    // Test missing title/section for getUSCSection
    try {
      await client.getUSCSectionWeb({ title: 5 }); // Missing section
      throw new Error('Should have thrown error for missing section');
    } catch (error) {
      if (!error.message.includes('section')) {
        throw new Error('Wrong error message for missing section');
      }
    }
    
    // Test invalid title number
    try {
      await client.getUSCSectionWeb({ title: 99, section: '1' });
      throw new Error('Should have thrown error for invalid title');
    } catch (error) {
      if (!error.message.includes('Invalid title')) {
        throw new Error('Wrong error message for invalid title');
      }
    }
    
    // Test search without required params
    try {
      await client.searchUSCodeWeb({});
      throw new Error('Should have thrown error for missing search criteria');
    } catch (error) {
      if (!error.message.includes('search_text or title_number')) {
        throw new Error('Wrong error message for missing criteria');
      }
    }
    
    console.log(`   ✓ Input validation working correctly`);
  });

  // Test 10: Default limits
  await runTest('Default limit behavior', async () => {
    const result = await client.searchUSCodeWeb({
      search_text: 'test'
      // No limit specified - should default to 5
    });
    
    const data = JSON.parse(result.content[0].text);
    
    // Mock should return up to 5 results by default
    if (data.results.length > 5) {
      throw new Error(`Default limit not applied: got ${data.results.length} results`);
    }
    
    console.log(`   ✓ Default limit applied: ${data.results.length} results (max 5)`);
  });

  // Test 11: USC metadata extraction
  await runTest('USC metadata extraction', async () => {
    const result = await client.searchUSCodeWeb({
      title_number: 5,
      section: '552',
      search_text: 'FOIA'
    });
    
    const data = JSON.parse(result.content[0].text);
    const firstResult = data.results[0];
    
    if (!firstResult.title_number) {
      throw new Error('Title number not extracted from metadata');
    }
    
    if (!firstResult.section_number) {
      throw new Error('Section number not extracted from metadata');
    }
    
    if (firstResult.score === undefined) {
      throw new Error('Search score not preserved');
    }
    
    console.log(`   ✓ Metadata extracted - Title: ${firstResult.title_number}, Section: ${firstResult.section_number}`);
    console.log(`   ✓ Search score: ${firstResult.score}`);
  });

  // Restore original fetch
  global.fetch = originalFetch;

  // Summary
  console.log('📊 GovInfo WebSearch Mock Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\\n🎉 All GovInfo WebSearch mock tests passed! Ready for live testing.');
  } else {
    console.log('\\n⚠️ Some tests failed. Check implementation.');
    process.exit(1);
  }
}

testGovInfoWebSearchMock().catch(err => {
  console.error('❌ GovInfo WebSearch mock test failed:', err);
  process.exit(1);
});
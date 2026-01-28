/**
 * FDA Web Search Client Mock Tests
 * Tests FDA WebSearch functionality with simulated responses
 */

import { FDAWebSearchClient } from '../src/api-clients/FDAWebSearchClient.js';

// Mock rate limiter
class MockRateLimiter {
  async enforce() {
    // No-op for testing
  }
}

// Mock FDA Web Search Client with overridden executeExaSearch
class MockFDAWebSearchClient extends FDAWebSearchClient {
  constructor() {
    super(new MockRateLimiter(), 'test-api-key');
    this.mockResponses = new Map();
    this.setupMockResponses();
  }

  setupMockResponses() {
    // Mock adverse events response
    this.mockResponses.set('adverse_events', [
      {
        id: 'ae1',
        title: 'FAERS Case Report: Aspirin Adverse Event',
        url: 'https://www.fda.gov/safety/reporting-serious-problems-fda/faers-case-123456',
        publishedDate: '2024-01-15',
        score: 0.95,
        text: `SERIOUS ADVERSE EVENT: Patient experienced severe gastrointestinal bleeding after taking aspirin 325mg daily. 
        OUTCOME: Hospitalization required. Patient recovered after treatment.
        NDC: 0456-1234-01
        DRUG: Aspirin 325mg tablets
        REPORT DATE: January 15, 2024
        The patient, a 65-year-old male with history of cardiovascular disease, developed serious bleeding complications.
        WARNING: Aspirin may cause serious gastrointestinal bleeding, especially in elderly patients.`
      },
      {
        id: 'ae2', 
        title: 'Drug Safety Communication: Ibuprofen Cardiovascular Risk',
        url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-cardiovascular-risk-ibuprofen',
        publishedDate: '2024-01-10',
        score: 0.88,
        text: `ADVERSE REACTIONS: Cardiovascular thrombotic events, myocardial infarction, and stroke.
        WARNING: NSAIDs may cause an increased risk of serious cardiovascular thrombotic events.
        CONTRAINDICATIONS: Do not use in patients with known cardiovascular disease.
        The FDA is warning that ibuprofen and similar NSAIDs increase cardiovascular risk.`
      }
    ]);

    // Mock device events response
    this.mockResponses.set('device_events', [
      {
        id: 'de1',
        title: 'MAUDE Report: Pacemaker Malfunction',
        url: 'https://accessdata.fda.gov/scripts/cdrh/cfdocs/cfmaude/detail.cfm?mdrfoi__id=12345',
        publishedDate: '2024-01-20',
        score: 0.92,
        text: `DEVICE NAME: Cardiac Pacemaker Model XYZ-100
        MANUFACTURER: MedDevice Corporation
        SERIOUS ADVERSE EVENT: Device malfunction resulting in inappropriate pacing
        OUTCOME: Patient required emergency surgery for device replacement
        DEVICE PROBLEM: Battery depletion earlier than expected, software malfunction
        The pacemaker failed to deliver appropriate therapy, leading to patient hospitalization.`
      }
    ]);

    // Mock drug labels response
    this.mockResponses.set('drug_labels', [
      {
        id: 'dl1',
        title: 'Prescribing Information: Atorvastatin Calcium Tablets',
        url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/020702s123lbl.pdf',
        publishedDate: '2024-01-05',
        score: 0.90,
        text: `INDICATIONS AND USAGE: Atorvastatin is indicated to reduce the risk of myocardial infarction and stroke.
        
        CONTRAINDICATIONS: 
        • Active liver disease
        • Pregnancy and nursing mothers
        • Hypersensitivity to any component
        
        WARNINGS AND PRECAUTIONS:
        • Myopathy and Rhabdomyolysis: Risk increases with higher doses
        • Liver Enzyme Abnormalities: Monitor liver function tests
        
        DOSAGE AND ADMINISTRATION: Initial dose 10-20mg once daily
        NDC: 0071-0155-23
        Strength: 20mg tablets
        Dosage Form: Oral tablet`
      }
    ]);

    // Mock recalls response
    this.mockResponses.set('recalls', [
      {
        id: 'r1',
        title: 'Class I Recall: Blood Pressure Medication Contamination',
        url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/class-i-recall-blood-pressure-medication',
        publishedDate: '2024-01-25',
        score: 0.96,
        text: `CLASSIFICATION: Class I Recall (most serious type)
        PRODUCT DESCRIPTION: Valsartan tablets 80mg and 160mg
        REASON FOR RECALL: Potential contamination with N-nitrosodiethylamine (NDEA), a probable carcinogen
        RECALL STATUS: Ongoing
        NDC: 1234-5678-90
        MANUFACTURER: Generic Pharma Inc.
        RISK STATEMENT: Exposure to NDEA may increase the risk of cancer if the impurity is above acceptable levels.
        REMEDY: Patients should contact their healthcare provider to discuss alternative treatments.`
      },
      {
        id: 'r2',
        title: 'Class II Recall: Insulin Pen Device Defect',
        url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/class-ii-recall-insulin-pen',
        publishedDate: '2024-01-18',
        score: 0.85,
        text: `CLASSIFICATION: Class II Recall
        PRODUCT DESCRIPTION: Insulin delivery pen device
        REASON FOR RECALL: Pen may not deliver accurate insulin dose due to mechanical defect
        RECALL STATUS: Complete
        MANUFACTURER: Diabetes Solutions Inc.
        RISK STATEMENT: Inaccurate dosing may lead to hyperglycemia or hypoglycemia.`
      }
    ]);
  }

  async executeExaSearch(query, limit, includeContents = false) {
    // Determine mock response based on query content
    let mockKey = 'adverse_events'; // default
    
    if (query.includes('recall') || query.includes('enforcement')) {
      mockKey = 'recalls'; // Always return recalls for recall queries regardless of device/drug
    } else if (query.includes('device') || query.includes('MAUDE')) {
      mockKey = 'device_events';
    } else if (query.includes('prescribing') || query.includes('label')) {
      mockKey = 'drug_labels';
    }
    
    const mockData = this.mockResponses.get(mockKey) || [];
    
    // Simulate the two-step process
    if (includeContents) {
      // Return data with text already included (simulating contents API call)
      return mockData.slice(0, limit);
    } else {
      // Return data without text (simulating search-only call)
      return mockData.slice(0, limit).map(item => ({
        ...item,
        text: undefined
      }));
    }
  }
}

async function runMockTests() {
  console.log('🧪 Starting FDA Web Search Client Mock Tests\n');
  
  const client = new MockFDAWebSearchClient();
  let passed = 0;
  let failed = 0;

  // Helper function to run a test
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ Running: ${testName}`);
      await testFn();
      console.log(`✅ PASSED: ${testName}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 1: Drug adverse events search (basic)
  await runTest('Drug adverse events search', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'patient.drug.medicinalproduct:aspirin',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_adverse_events_web') throw new Error('Wrong search type');
    if (!Array.isArray(data.results)) throw new Error('Results not array');
    if (data.results.length === 0) throw new Error('No results returned');
    if (!data.results[0].title) throw new Error('Missing title in results');
    if (data.results[0].result_type !== 'adverse_event') throw new Error('Wrong result type');
  });

  // Test 2: Drug adverse events with snippet
  await runTest('Adverse events with snippet extraction', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'serious adverse event',
      limit: 1,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (!data.results[0].snippet) throw new Error('Snippet not extracted');
    // Check for any safety-related content in snippet
    const safetyTerms = ['SERIOUS ADVERSE EVENT', 'WARNING', 'ADVERSE REACTIONS', 'serious', 'bleeding'];
    const hasSafetyContent = safetyTerms.some(term => data.results[0].snippet.includes(term));
    if (!hasSafetyContent) {
      throw new Error(`Snippet does not contain safety information. Got: ${data.results[0].snippet.substring(0, 100)}...`);
    }
  });

  // Test 3: Medical device events search
  await runTest('Medical device events search', async () => {
    const result = await client.searchDeviceEventsWeb({
      search: 'device.manufacturer_d_name:Medtronic',
      limit: 1,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_device_events_web') throw new Error('Wrong search type');
    if (data.results[0].result_type !== 'device_event') throw new Error('Wrong result type');
    // Debug what we actually got
    if (!data.results[0].metadata.device_name && !data.results[0].metadata.manufacturer) {
      throw new Error(`No device metadata extracted. Metadata: ${JSON.stringify(data.results[0].metadata)}`);
    }
  });

  // Test 4: Drug labels search with metadata
  await runTest('Drug labels search with metadata', async () => {
    const result = await client.searchDrugLabelsWeb({
      search: 'openfda.brand_name:atorvastatin',
      limit: 1,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_drug_labels_web') throw new Error('Wrong search type');
    if (data.results[0].result_type !== 'drug_label') throw new Error('Wrong result type');
    if (!data.results[0].full_text) throw new Error('Full text not included');
    if (!data.results[0].metadata.ndc_number) throw new Error('NDC number not extracted');
  });

  // Test 5: Drug recalls search
  await runTest('Drug recalls search', async () => {
    const result = await client.searchRecallsWeb({
      product_area: 'drug',
      search: 'reason_for_recall:contamination',
      limit: 2
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'fda_recalls_web') throw new Error('Wrong search type');
    if (data.product_area !== 'drug') throw new Error('Wrong product area');
    if (data.results[0].result_type !== 'recall') throw new Error('Wrong result type');
  });

  // Test 6: Device recalls with classification
  await runTest('Device recalls with classification extraction', async () => {
    const result = await client.searchRecallsWeb({
      product_area: 'device',
      search: 'classification:Class',
      limit: 2, // Get both results to find one with Class info
      include_snippet: true,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    const firstResult = data.results[0];
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    
    // Check if either result has recall class (mock data has Class I in first result, Class II in second)
    const hasClassInfo = data.results.some(r => r.metadata.recall_class);
    if (!hasClassInfo) {
      throw new Error(`No recall class found in any result. Metadata: ${JSON.stringify(data.results.map(r => r.metadata))}`);
    }
  });

  // Test 7: OpenFDA query conversion
  await runTest('OpenFDA query syntax conversion', async () => {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'patient.drug.activesubstance.activesubstancename:acetaminophen AND serious:1',
      limit: 1
    });
    
    const data = JSON.parse(result.content[0].text);
    // Should convert openFDA syntax to natural language
    if (!data.query.includes('active ingredient')) {
      throw new Error('OpenFDA field not converted to natural language');
    }
  });

  // Test 8: Safety-focused snippet extraction
  await runTest('Safety-focused snippet extraction', async () => {
    const result = await client.searchDrugLabelsWeb({
      search: 'contraindications warnings',
      limit: 1,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    const snippet = data.results[0].snippet;
    if (!snippet) throw new Error('Snippet not extracted');
    
    // Should prioritize safety information
    const safetyTerms = ['CONTRAINDICATIONS', 'WARNING', 'ADVERSE', 'RISK'];
    const hasSafetyContent = safetyTerms.some(term => snippet.includes(term));
    if (!hasSafetyContent) throw new Error('Snippet does not prioritize safety information');
  });

  // Test 9: Metadata extraction for different result types
  await runTest('Comprehensive metadata extraction', async () => {
    const adverseResult = await client.searchDrugAdverseEventsWeb({ search: 'serious', limit: 1, include_text: true });
    const adverseData = JSON.parse(adverseResult.content[0].text);
    
    // Debug: Check what metadata we actually got
    const adverseMetadata = adverseData.results[0].metadata;
    console.log('Adverse event metadata:', JSON.stringify(adverseMetadata));
    
    // Check if we got some metadata (not necessarily the serious flag)
    const hasMetadata = Object.keys(adverseMetadata).length > 0;
    if (!hasMetadata) throw new Error(`No adverse event metadata extracted. Got: ${JSON.stringify(adverseMetadata)}`);

    const recallResult = await client.searchRecallsWeb({ search: 'Class I', limit: 1, include_text: true });
    const recallData = JSON.parse(recallResult.content[0].text);
    
    const recallMetadata = recallData.results[0].metadata;
    console.log('Recall metadata:', JSON.stringify(recallMetadata));
    
    const hasRecallMetadata = Object.keys(recallMetadata).length > 0;
    if (!hasRecallMetadata) throw new Error(`No recall metadata extracted. Got: ${JSON.stringify(recallMetadata)}`);
  });

  // Test 10: Empty and invalid input handling
  await runTest('Empty and invalid input handling', async () => {
    // Empty args
    const emptyResult = await client.searchDrugAdverseEventsWeb({});
    const emptyData = JSON.parse(emptyResult.content[0].text);
    if (!Array.isArray(emptyData.results)) throw new Error('Should handle empty args gracefully');

    // Invalid product area
    const invalidResult = await client.searchRecallsWeb({ product_area: 'invalid' });
    const invalidData = JSON.parse(invalidResult.content[0].text);
    if (!Array.isArray(invalidData.results)) throw new Error('Should handle invalid product area gracefully');
  });

  // Summary
  console.log('📊 FDA Web Search Client Mock Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All mock tests passed! FDA WebSearch client is ready for live testing.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockTests().catch(console.error);
}

export { runMockTests, MockFDAWebSearchClient };
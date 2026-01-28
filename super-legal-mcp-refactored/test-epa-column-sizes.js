/**
 * EPA ECHO Column Size Test
 * Tests response sizes with different qcolumns configurations
 * to determine optimal column count for the EPAComplianceClient
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const EPA_BASE_URL = 'https://echodata.epa.gov/echo';

console.log('='.repeat(70));
console.log('EPA ECHO COLUMN SIZE TEST');
console.log('='.repeat(70));
console.log('Testing response sizes with different column configurations');
console.log('Max facilities: 25 per test\n');

// Column configurations to test
const columnConfigs = [
  {
    name: 'Current (buggy 9 cols)',
    qcolumns: '1,2,3,4,5,12,15,22,23',
    description: 'Name, Street, City, State, ZIP, IndianSpatial, SIC, RCRA_IDs, RMP_IDs'
  },
  {
    name: 'Fixed Basic (9 cols)',
    qcolumns: '1,2,3,4,5,6,17,18,36',
    description: 'Name, Street, City, State, ZIP, RegistryID, Lat, Long, ComplianceStatus'
  },
  {
    name: 'Recommended 30 cols',
    qcolumns: '1,2,3,4,5,6,7,16,17,18,34,35,36,37,38,39,41,43,49,54,55,60,61,62,63,67,68,75,134,136',
    description: 'Core ID + Compliance + Enforcement + Penalties + Inspections + Emissions'
  },
  {
    name: 'Expanded 40 cols',
    qcolumns: '1,2,3,4,5,6,7,16,17,18,34,35,36,37,38,39,40,41,43,44,45,46,49,54,55,60,61,62,63,64,65,66,67,68,73,75,80,95,134,136',
    description: 'Recommended + SDWA + Program-specific inspections/penalties + Major flag'
  },
  {
    name: 'Full 50 cols',
    qcolumns: '1,2,3,4,5,6,7,16,17,18,19,21,22,26,34,35,36,37,38,39,40,41,43,44,45,46,47,48,49,54,55,60,61,62,63,64,65,66,67,68,73,75,80,95,110,119,128,131,134,136',
    description: 'Expanded + Program IDs + EJ demographics + Quarters non-compliant by program'
  },
  {
    name: 'NEW 60 cols (implemented)',
    qcolumns: '1,2,3,4,5,6,7,8,11,15,16,17,18,19,21,22,24,26,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,54,55,60,61,62,63,64,65,66,67,68,73,75,80,95,110,111,119,120,128,129,131,134,135,136,137',
    description: 'Final implementation: ID + Jurisdiction + Compliance + Enforcement + Penalties + EJ + HPV/SNC flags + DFR URL'
  },
  {
    name: 'All columns (202)',
    qcolumns: null, // No qcolumns = all columns
    description: 'All available EPA ECHO columns'
  }
];

// Test locations with known facilities
const testQueries = [
  { city: 'Pittsburgh', state: 'PA', description: 'Pittsburgh PA (industrial)' },
  { city: 'Houston', state: 'TX', description: 'Houston TX (petrochemical)' },
  { city: 'Chicago', state: 'IL', description: 'Chicago IL (diverse)' }
];

async function fetchEPA(endpoint, params) {
  const url = new URL(`${EPA_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString());
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: 'JSON parse error', rawSize: text.length };
  }

  return {
    data,
    rawSize: text.length,
    facilityCount: data.Results?.Facilities?.length || 0,
    queryRows: data.Results?.QueryRows || 0,
    queryId: data.Results?.QueryID
  };
}

async function testConfiguration(config, query) {
  // Step 1: Initial query to get QueryID
  const initialParams = {
    output: 'JSON',
    p_ct: query.city,
    p_st: query.state,
    p_rows: 25
  };

  if (config.qcolumns) {
    initialParams.qcolumns = config.qcolumns;
  }

  try {
    const initialResult = await fetchEPA('echo_rest_services.get_facilities', initialParams);

    if (initialResult.error) {
      return {
        config: config.name,
        query: query.description,
        error: initialResult.error,
        rawSize: initialResult.rawSize
      };
    }

    // Step 2: If we got a QueryID, fetch actual facilities
    let facilities = initialResult.data.Results?.Facilities || [];
    let totalRawSize = initialResult.rawSize;
    const queryRows = initialResult.queryRows;

    if (initialResult.queryId && facilities.length === 0) {
      const qidParams = {
        output: 'JSON',
        qid: initialResult.queryId,
        pageno: 1
      };

      if (config.qcolumns) {
        qidParams.qcolumns = config.qcolumns;
      }

      const qidResult = await fetchEPA('echo_rest_services.get_qid', qidParams);

      if (!qidResult.error) {
        // EPA ignores p_rows on get_qid, so manually limit to 25
        const allFacilities = qidResult.data.Results?.Facilities || [];
        facilities = allFacilities.slice(0, 25);

        // Calculate size for just 25 facilities
        totalRawSize = JSON.stringify({ Results: { Facilities: facilities } }).length;
      }
    }

    // Calculate per-facility size
    let sampleFacility = null;
    let sampleSize = 0;
    let avgSize = 0;

    if (facilities.length > 0) {
      sampleFacility = facilities[0];
      sampleSize = JSON.stringify(sampleFacility).length;

      // Calculate average across all facilities
      const totalFacilitiesSize = facilities.reduce((sum, f) => sum + JSON.stringify(f).length, 0);
      avgSize = Math.round(totalFacilitiesSize / facilities.length);
    }

    // Count fields in response
    const fieldCount = sampleFacility ? Object.keys(sampleFacility).length : 0;

    return {
      config: config.name,
      query: query.description,
      columnCount: config.qcolumns ? config.qcolumns.split(',').length : 202,
      rawSizeBytes: totalRawSize,
      rawSizeKB: (totalRawSize / 1024).toFixed(2),
      estimatedTokens: Math.ceil(totalRawSize / 4),
      facilityCount: facilities.length,
      totalAvailable: queryRows,
      fieldsReturned: fieldCount,
      perFacilityBytes: avgSize,
      perFacilityTokens: Math.ceil(avgSize / 4)
    };

  } catch (error) {
    return {
      config: config.name,
      query: query.description,
      error: error.message
    };
  }
}

async function runTests() {
  const results = [];

  // Test each configuration with first query (Pittsburgh)
  const testQuery = testQueries[0];
  console.log(`Testing with: ${testQuery.description}\n`);

  for (const config of columnConfigs) {
    console.log(`Testing: ${config.name}...`);

    const result = await testConfiguration(config, testQuery);
    results.push(result);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else {
      console.log(`  Size: ${result.rawSizeKB} KB (~${result.estimatedTokens.toLocaleString()} tokens)`);
      console.log(`  Facilities: ${result.facilityCount}/${result.totalAvailable}`);
      console.log(`  Fields returned: ${result.fieldsReturned}`);
      console.log(`  Per facility: ${result.perFacilityBytes} bytes (~${result.perFacilityTokens} tokens)`);
    }
    console.log('');

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  // Summary table
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY: Response Sizes by Column Configuration');
  console.log('='.repeat(100));
  console.log('');
  console.log('| Configuration          | Cols | Fields | Total KB | Total Tokens | Per-Fac Tokens | Facilities |');
  console.log('|------------------------|------|--------|----------|--------------|----------------|------------|');

  for (const r of results) {
    if (!r.error) {
      const configName = r.config.padEnd(22);
      const cols = String(r.columnCount).padStart(4);
      const fields = String(r.fieldsReturned).padStart(6);
      const kb = r.rawSizeKB.padStart(8);
      const tokens = r.estimatedTokens.toLocaleString().padStart(12);
      const perFac = r.perFacilityTokens.toLocaleString().padStart(14);
      const facs = `${r.facilityCount}/${r.totalAvailable}`.padStart(10);

      console.log(`| ${configName} | ${cols} | ${fields} | ${kb} | ${tokens} | ${perFac} | ${facs} |`);
    }
  }

  // Analysis
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS');
  console.log('='.repeat(70));

  const rec30 = results.find(r => r.config === 'Recommended 30 cols');
  const exp40 = results.find(r => r.config === 'Expanded 40 cols');
  const full50 = results.find(r => r.config === 'Full 50 cols');
  const all202 = results.find(r => r.config === 'All columns (202)');

  if (rec30 && !rec30.error) {
    console.log(`\n30 Columns: ${rec30.estimatedTokens.toLocaleString()} tokens total`);
    console.log(`  - Well within Claude's context window`);
    console.log(`  - Provides compliance, enforcement, penalties, inspections`);
  }

  if (exp40 && !exp40.error) {
    console.log(`\n40 Columns: ${exp40.estimatedTokens.toLocaleString()} tokens total`);
    console.log(`  - ${((exp40.estimatedTokens / rec30?.estimatedTokens - 1) * 100).toFixed(0)}% increase over 30 cols`);
    console.log(`  - Adds program-specific breakdowns`);
  }

  if (full50 && !full50.error) {
    console.log(`\n50 Columns: ${full50.estimatedTokens.toLocaleString()} tokens total`);
    console.log(`  - ${((full50.estimatedTokens / rec30?.estimatedTokens - 1) * 100).toFixed(0)}% increase over 30 cols`);
    console.log(`  - Adds EJ demographics and program IDs`);
  }

  if (all202 && !all202.error) {
    console.log(`\nAll 202 Columns: ${all202.estimatedTokens.toLocaleString()} tokens total`);
    console.log(`  - ${((all202.estimatedTokens / rec30?.estimatedTokens - 1) * 100).toFixed(0)}% increase over 30 cols`);
    console.log(`  - Would benefit from Gemini filtering`);
  }

  // Recommendation
  console.log('\n' + '-'.repeat(70));
  console.log('RECOMMENDATION');
  console.log('-'.repeat(70));

  if (full50 && !full50.error && full50.estimatedTokens < 15000) {
    console.log(`\n50 columns is recommended:`);
    console.log(`  - ${full50.estimatedTokens.toLocaleString()} tokens is manageable`);
    console.log(`  - Provides comprehensive compliance data`);
    console.log(`  - Includes EJ demographics for legal analysis`);
    console.log(`  - No Gemini filtering needed at 25 facilities`);
  } else if (exp40 && !exp40.error && exp40.estimatedTokens < 15000) {
    console.log(`\n40 columns is recommended:`);
    console.log(`  - ${exp40.estimatedTokens.toLocaleString()} tokens is manageable`);
    console.log(`  - Good balance of data vs size`);
  } else if (rec30 && !rec30.error) {
    console.log(`\n30 columns is recommended:`);
    console.log(`  - ${rec30.estimatedTokens.toLocaleString()} tokens is safe`);
    console.log(`  - Core compliance data without bloat`);
  }

  console.log('');
}

// Run
runTests().catch(console.error);

/**
 * EPA Token Usage Measurement
 * Measures actual token consumption for different facility return counts
 */

// Sample facility from actual live test results
const sampleFacility = {
  name: "#1 COCHRAN (PITTSBURGH)",
  epa_registry_id: "110001023295",
  location: {
    address: "5200 CAMPBELLS RUN ROAD",
    city: "PITTSBURGH",
    state: "PA"
  },
  compliance_status: null,
  total_penalties: null,
  clean_air: false,
  clean_water: false
};

// Actual response structure from EPAComplianceClient.js
function generateResponse(facilityCount) {
  const facilities = Array(facilityCount).fill(null).map((_, i) => ({
    ...sampleFacility,
    name: `${sampleFacility.name} ${i + 1}`,
    epa_registry_id: `11000102329${i}`
  }));

  return {
    facilities,
    total_facilities: 3815,
    query_id: "174",
    page_number: 1,
    high_priority_violators: 0
  };
}

// Rough token estimation (1 token ≈ 4 characters for English text)
function estimateTokens(text) {
  // Claude's tokenizer is more sophisticated, but this gives a ballpark
  // JSON adds overhead with quotes, commas, brackets
  return Math.ceil(text.length / 3.5); // More conservative estimate for JSON
}

// Test different facility counts
console.log('EPA Native API Token Usage Analysis\n');
console.log('='.repeat(70));

[1, 3, 5, 10, 25].forEach(count => {
  const response = generateResponse(count);
  const jsonString = JSON.stringify(response, null, 2);
  const charCount = jsonString.length;
  const estimatedTokens = estimateTokens(jsonString);

  console.log(`\n${count} facilities:`);
  console.log(`  Characters: ${charCount.toLocaleString()}`);
  console.log(`  Estimated tokens: ${estimatedTokens.toLocaleString()}`);
  console.log(`  Tokens per facility: ${Math.round(estimatedTokens / count)}`);
});

console.log('\n' + '='.repeat(70));

// Calculate actual response for your test query
const actual25 = generateResponse(25);
const actual25Json = JSON.stringify(actual25, null, 2);
const actual25Tokens = estimateTokens(actual25Json);

console.log('\nACTUAL TEST RESULT (Pittsburgh query):');
console.log(`  Facilities returned: 25 (user requested 5)`);
console.log(`  Total characters: ${actual25Json.length.toLocaleString()}`);
console.log(`  Estimated tokens: ${actual25Tokens.toLocaleString()}`);
console.log(`  Token "waste": ${estimateTokens(JSON.stringify(generateResponse(20), null, 2)).toLocaleString()} tokens (20 unrequested facilities)`);

// Show what 5 facilities would use
const optimal5 = generateResponse(5);
const optimal5Json = JSON.stringify(optimal5, null, 2);
const optimal5Tokens = estimateTokens(optimal5Json);

console.log('\nOPTIMIZED (respecting limit=5):');
console.log(`  Facilities returned: 5`);
console.log(`  Total characters: ${optimal5Json.length.toLocaleString()}`);
console.log(`  Estimated tokens: ${optimal5Tokens.toLocaleString()}`);
console.log(`  Token savings: ${actual25Tokens - optimal5Tokens} tokens (${Math.round((1 - optimal5Tokens/actual25Tokens) * 100)}% reduction)`);

console.log('\n' + '='.repeat(70));

// Show metadata overhead
const metadata = {
  total_facilities: 3815,
  query_id: "174",
  page_number: 1,
  high_priority_violators: 0
};
const metadataTokens = estimateTokens(JSON.stringify(metadata, null, 2));

console.log(`\nMetadata overhead: ${metadataTokens} tokens (included in all responses)`);
console.log('This is necessary pagination info, so cannot be reduced.\n');

// Sample output for visual inspection
console.log('SAMPLE OUTPUT (first 2 facilities):');
console.log(JSON.stringify(generateResponse(2), null, 2).substring(0, 500) + '...\n');

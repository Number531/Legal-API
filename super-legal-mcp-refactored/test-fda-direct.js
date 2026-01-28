/**
 * Direct FDA Tool Test - Bypasses Claude routing to test tools directly
 */

async function testFDAToolDirect() {
  try {
    console.log('🧪 Testing FDA Tool Direct Execution\n');

    // Test 1: Simple drug adverse events query
    console.log('Test 1: Search drug adverse events for aspirin');
    const response1 = await fetch('http://localhost:8090/api/claude/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Use search_fda_drug_adverse_events tool to search for aspirin adverse events with limit 5',
        enableSessionMemory: false,
        maxTokens: 8000
      })
    });

    const data1 = await response1.json();

    console.log('\n📊 Response Details:');
    console.log('Status:', response1.status);
    console.log('Response length:', data1.response?.length || 0);
    console.log('Tools called:', data1.toolCalls?.length || 0);

    if (data1.toolCalls && data1.toolCalls.length > 0) {
      console.log('\n🔧 Tool Calls:');
      data1.toolCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.name}`);
        console.log(`     Input:`, JSON.stringify(call.input).substring(0, 100));
      });
    }

    if (data1.response) {
      console.log('\n📝 Response Preview (first 500 chars):');
      console.log(data1.response.substring(0, 500));
    }

    if (data1.error) {
      console.log('\n❌ Error:', data1.error);
    }

    return data1;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

testFDAToolDirect();

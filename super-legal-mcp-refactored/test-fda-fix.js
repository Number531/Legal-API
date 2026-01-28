/**
 * Quick test to verify FDA tools work after safeEmptyTools fix
 */

async function testFDAFix() {
  try {
    const response = await fetch('http://localhost:8090/api/claude/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Search for adverse events related to aspirin',
        enableSessionMemory: false,
        maxTokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ FDA Tool Test Results:');
    console.log('Status:', response.status);
    console.log('Response length:', JSON.stringify(data).length);

    // Check if tool calls were made
    if (data.toolCalls && data.toolCalls.length > 0) {
      console.log(`\n✅ Tools Called: ${data.toolCalls.length}`);
      data.toolCalls.forEach(call => {
        console.log(`   - ${call.name}: ${call.status || 'executed'}`);
      });
    }

    // Check for errors
    if (data.error) {
      console.log('\n❌ Error detected:', data.error);
      return false;
    }

    // Check for the "awaiting complete inputs" error in response
    const responseText = JSON.stringify(data);
    if (responseText.includes('awaiting complete inputs')) {
      console.log('\n❌ Still seeing "awaiting complete inputs" error');
      return false;
    }

    console.log('\n✅ FDA tools appear to be working correctly!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testFDAFix();

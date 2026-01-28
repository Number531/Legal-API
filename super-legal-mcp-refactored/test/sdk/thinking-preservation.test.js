import { describe, test, expect } from '@jest/globals';

function preserveThinkingBlocks(messages) {
  // Simulate a round-trip where thinking/signatures must not be stripped.
  return messages.map((m) => ({
    ...m,
    thinking: m.thinking?.map((t) => ({ ...t }))
  }));
}

describe('SDK Thinking Preservation', () => {
  test('retains thinking blocks and signatures across turns', () => {
    const input = [
      {
        role: 'assistant',
        content: 'Answer',
        thinking: [{ signature: 'sig-1', text: 'internal thought' }]
      },
      {
        role: 'assistant',
        content: 'Follow-up',
        thinking: [{ signature: 'sig-2', text: 'more reasoning' }]
      }
    ];

    const result = preserveThinkingBlocks(input);
    expect(result[0].thinking[0].signature).toBe('sig-1');
    expect(result[1].thinking[0].signature).toBe('sig-2');
    // Ensure deep clone, not shared references
    expect(result[0].thinking[0]).not.toBe(input[0].thinking[0]);
  });
});


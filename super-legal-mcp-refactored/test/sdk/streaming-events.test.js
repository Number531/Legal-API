import { describe, test, expect } from '@jest/globals';

// Minimal reducer to simulate how a client might apply streaming events,
// ensuring late input_json_delta after stop events does not break state.
function applyStreamingEvents(events) {
  const state = { blocks: {}, stopped: false, inputJson: '' };

  for (const evt of events) {
    if (evt.type === 'content_block_delta') {
      const block = state.blocks[evt.index] || { text: '' };
      block.text += evt.delta;
      state.blocks[evt.index] = block;
    }
    if (evt.type === 'content_block_stop') {
      state.blocks[evt.index] = state.blocks[evt.index] || { text: '' };
      state.blocks[evt.index].stopped = true;
    }
    if (evt.type === 'input_json_delta') {
      state.inputJson += evt.delta;
    }
    if (evt.type === 'message_stop') {
      state.stopped = true;
    }
  }
  return state;
}

describe('SDK Streaming Events', () => {
  test('handles late input_json_delta after content/message stop', () => {
    const events = [
      { type: 'content_block_delta', index: 0, delta: 'Hello ' },
      { type: 'content_block_delta', index: 0, delta: 'world' },
      { type: 'content_block_stop', index: 0 },
      // late input_json_delta after content stop
      { type: 'input_json_delta', delta: '{"foo":' },
      { type: 'message_stop' },
      // very late continuation after message_stop
      { type: 'input_json_delta', delta: '"bar"}' }
    ];

    const state = applyStreamingEvents(events);
    expect(state.blocks[0].text).toBe('Hello world');
    expect(state.blocks[0].stopped).toBe(true);
    expect(state.stopped).toBe(true);
    expect(state.inputJson).toBe('{"foo":"bar"}');
  });
});


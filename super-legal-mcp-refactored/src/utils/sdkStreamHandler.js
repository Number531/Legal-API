/**
 * Streaming event accumulator for SDK Tool Runner.
 * Collects text, thinking blocks, tool calls/results, and usage.
 */
export function createSdkStreamHandler({ onText, onThinking, onToolCall, onToolResult } = {}) {
  const state = {
    text: '',
    thinkingBlocks: [],
    toolCalls: [],
    usage: null,
    stop_reason: null,
    signatures: [],
    citations: []
  };

  function upsertToolCall(id, name) {
    let call = state.toolCalls.find((t) => t.id === id);
    if (!call) {
      call = { id, name, input: '', result: null };
      state.toolCalls.push(call);
    }
    return call;
  }

  async function handle(event) {
    switch (event.type) {
      case 'content_block_start': {
        if (event.content_block?.type === 'thinking') {
          // Prepare placeholder for signature tracking
          state.signatures.push({ id: event.content_block?.id, signature: null });
        }
        break;
      }
      case 'content_block_delta': {
        if (event.delta?.type === 'text_delta') {
          state.text += event.delta.text || '';
          onText?.(event.delta.text || '');
        }
        else if (event.delta?.type === 'thinking_delta') {
          const thinking = event.delta.thinking || '';
          if (state.thinkingBlocks.length === 0 || typeof state.thinkingBlocks[state.thinkingBlocks.length - 1] !== 'string') {
            state.thinkingBlocks.push(thinking);
          } else {
            state.thinkingBlocks[state.thinkingBlocks.length - 1] += thinking;
          }
          onThinking?.(thinking);
        }
        else if (event.delta?.type === 'signature_delta') {
          const sig = event.delta.signature;
          if (sig) {
            state.signatures[state.signatures.length - 1] = {
              id: event.content_block_id,
              signature: sig
            };
          }
        }
        else if (event.delta?.type === 'citations_delta' && event.delta.citation) {
          state.citations.push(event.delta.citation);
        }
        break;
      }
      case 'content_block_stop':
        // No-op placeholder for completeness
        break;
      case 'text': {
        state.text += event.text || '';
        onText?.(event.text || '');
        break;
      }
      case 'thinking': {
        if (event.thinking) {
          state.thinkingBlocks.push(event.thinking);
          onThinking?.(event.thinking);
        }
        break;
      }
      case 'tool_call': {
        const id = event.tool_use_id || event.id || state.toolCalls.length.toString();
        const call = upsertToolCall(id, event.tool_name || event.name);
        if (event.tool_input || event.input) {
          call.input = event.tool_input || event.input;
        }
        onToolCall?.(call);
        break;
      }
      case 'tool_result': {
        const id = event.tool_use_id || event.id || state.toolCalls.length.toString();
        const call = upsertToolCall(id, event.tool_name || event.name);
        call.result = event.output ?? event.result ?? event.content ?? event;
        onToolResult?.(call);
        break;
      }
      case 'message_delta': {
        // Some SDK events provide usage/stop_reason here
        if (event.usage) state.usage = event.usage;
        if (event.delta?.stop_reason) state.stop_reason = event.delta.stop_reason;
        break;
      }
      case 'message_stop': {
        if (event.usage) state.usage = event.usage;
        if (event.stop_reason) state.stop_reason = event.stop_reason;
        break;
      }
      default:
        break;
    }
  }

  function final() {
    return {
      text: state.text,
      thinkingBlocks: state.thinkingBlocks,
      toolCalls: state.toolCalls,
      usage: state.usage,
      stop_reason: state.stop_reason,
      signatures: state.signatures,
      citations: state.citations
    };
  }

  return { handle, final };
}


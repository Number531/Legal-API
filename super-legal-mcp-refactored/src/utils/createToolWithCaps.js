/**
 * Factory that applies parameter caps before invoking a tool handler.
 * Keeps the handler focused on core logic while ensuring guardrails are enforced.
 */

const DEFAULT_CAPS = {
  limit: 5,
  include_snippet: false,
  include_text: false,
  include_full_text: false
};

const NO_CAP_TOOLS = new Set([
  'get_case_details',
  'get_judge_details',
  'get_financial_disclosure_details',
  'get_usc_section',
  'nhtsa_decode_vin',
  'get_audio_details',
  'get_court_info'
]);

export function applyParameterCaps(toolName, args = {}) {
  if (NO_CAP_TOOLS.has(toolName)) {
    return args;
  }

  const capped = { ...DEFAULT_CAPS, ...args };

  // Strict limit when full text is requested
  if (capped.include_full_text === true) {
    capped.limit = Math.min(capped.limit || 2, 2);
  } else {
    capped.limit = Math.min(capped.limit || 5, 5);
  }

  // Force text flags to false to prevent large documents from consuming Claude tokens
  capped.include_snippet = false;
  capped.include_text = false;
  capped.include_full_text = false;

  return capped;
}

export function createToolWithCaps(toolName, handler) {
  if (typeof handler !== 'function') {
    throw new Error('createToolWithCaps requires a handler function');
  }

  return async (args = {}) => {
    const cappedArgs = applyParameterCaps(toolName, args);
    return handler(cappedArgs);
  };
}


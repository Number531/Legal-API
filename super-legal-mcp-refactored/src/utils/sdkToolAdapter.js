import { allTools } from '../tools/toolDefinitions.js';
import { createToolWithCaps } from './createToolWithCaps.js';

/**
 * Build SDK-compatible tool descriptors from existing MCP tool definitions.
 * Falls back to a stub handler when an implementation is missing to keep
 * the registry loadable in test environments.
 */
export function buildSdkTools(toolImplementations = {}) {
  async function executeToolSafe(handler, input, toolName) {
    try {
      const result = await handler(input);
      return { content: JSON.stringify(result) };
    } catch (err) {
      return {
        content: `${err?.name || 'Error'}: ${err?.message || 'Unknown error'}`,
        is_error: true,
        tool_name: toolName
      };
    }
  }

  return allTools
    .map((def) => {
      const impl = toolImplementations[def.name];
      const handler =
        impl && typeof impl === 'function'
          ? async (args = {}) => executeToolSafe(createToolWithCaps(def.name, impl), args, def.name)
          : async () => ({ notice: 'handler_not_configured' });

      return {
        name: def.name,
        description: def.description,
        input_schema: def.inputSchema,
        handler
      };
    })
    .filter(Boolean);
}


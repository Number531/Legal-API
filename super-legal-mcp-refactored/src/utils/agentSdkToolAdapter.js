/**
 * Agent SDK Tool Adapter
 *
 * Converts existing MCP tools (JSON Schema format) to Claude Agent SDK format (Zod).
 *
 * IMPORTANT: Agent SDK tool() function expects a ZodRawShape (object of Zod types),
 * NOT a z.object(). The SDK wraps it internally.
 *
 * Correct:   tool("name", "desc", { param: z.string() }, handler)
 * Incorrect: tool("name", "desc", z.object({ param: z.string() }), handler)
 *
 * Tool naming: When exposed to Claude via MCP, tools are named mcp__{server}__{tool}
 * Example: mcp__super-legal-tools__search_sec_filings
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { allTools } from '../tools/toolDefinitions.js';
import {
  executeFinancialModel,
  financialModelToolDefinition,
  isCodeExecutionEnabled
} from '../tools/financialModelHandler.js';

/**
 * Converts a JSON Schema property to a Zod type
 * @param {object} prop - JSON Schema property definition
 * @returns {z.ZodType} - Corresponding Zod type
 */
function jsonSchemaPropertyToZod(prop) {
  if (!prop) return z.any();

  let zodType;

  switch (prop.type) {
    case 'string':
      if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
        // Zod enum requires at least one value
        zodType = z.enum(prop.enum);
      } else {
        zodType = z.string();
      }
      break;

    case 'number':
      zodType = z.number();
      if (prop.minimum !== undefined) zodType = zodType.min(prop.minimum);
      if (prop.maximum !== undefined) zodType = zodType.max(prop.maximum);
      break;

    case 'integer':
      zodType = z.number().int();
      if (prop.minimum !== undefined) zodType = zodType.min(prop.minimum);
      if (prop.maximum !== undefined) zodType = zodType.max(prop.maximum);
      break;

    case 'boolean':
      zodType = z.boolean();
      break;

    case 'array':
      if (prop.items) {
        const itemType = jsonSchemaPropertyToZod(prop.items);
        zodType = z.array(itemType);
      } else {
        zodType = z.array(z.any());
      }
      break;

    case 'object':
      if (prop.properties) {
        // Nested object with defined properties
        zodType = z.object(jsonSchemaToZodShape(prop));
      } else if (prop.additionalProperties) {
        // Object with dynamic keys
        const valueType = jsonSchemaPropertyToZod(prop.additionalProperties);
        zodType = z.record(z.string(), valueType);
      } else {
        zodType = z.record(z.string(), z.any());
      }
      break;

    case 'null':
      zodType = z.null();
      break;

    default:
      // Handle union types or unknown types
      if (Array.isArray(prop.type)) {
        const types = prop.type.map(t => jsonSchemaPropertyToZod({ type: t }));
        zodType = z.union(types);
      } else {
        zodType = z.any();
      }
  }

  // Add description if present
  if (prop.description) {
    zodType = zodType.describe(prop.description);
  }

  return zodType;
}

/**
 * Converts JSON Schema to Zod shape (NOT z.object!)
 * Returns an object of Zod types that can be passed directly to tool()
 *
 * @param {object} jsonSchema - JSON Schema object with type: "object"
 * @returns {object} - Zod shape { key: z.type() }
 */
function jsonSchemaToZodShape(jsonSchema) {
  if (!jsonSchema || jsonSchema.type !== 'object') {
    return {};
  }

  const shape = {};
  const properties = jsonSchema.properties || {};
  const required = Array.isArray(jsonSchema.required) ? jsonSchema.required : [];

  for (const [key, prop] of Object.entries(properties)) {
    let zodType = jsonSchemaPropertyToZod(prop);

    // Make optional if not in required array
    if (!required.includes(key)) {
      zodType = zodType.optional();

      // Add default value if specified
      if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
      }
    }

    shape[key] = zodType;
  }

  return shape;
}

/**
 * Builds Agent SDK tools from existing tool definitions and implementations
 *
 * @param {object} toolImplementations - Map of tool name to handler function from createToolImplementations()
 * @returns {Array} - Array of Agent SDK tool definitions for createSdkMcpServer()
 */
export function buildAgentSdkTools(toolImplementations = {}) {
  const tools = [];
  const errors = [];

  for (const def of allTools) {
    const handler = toolImplementations[def.name];

    if (!handler) {
      // Skip tools without implementations
      continue;
    }

    try {
      // Convert JSON Schema to Zod shape
      const zodShape = jsonSchemaToZodShape(def.inputSchema);

      // Create Agent SDK tool
      const sdkTool = tool(
        def.name,
        def.description || `Tool: ${def.name}`,
        zodShape,  // Pass shape directly - SDK wraps with z.object internally
        async (args, extra) => {
          try {
            // Call the existing handler
            const result = await handler(args);

            // Normalize result to MCP tool result format
            if (result === null || result === undefined) {
              return {
                content: [{ type: 'text', text: 'No results found.' }]
              };
            }

            // Handle string results
            if (typeof result === 'string') {
              return {
                content: [{ type: 'text', text: result }]
              };
            }

            // Handle object results - check if already in MCP format
            if (result.content && Array.isArray(result.content)) {
              return result;
            }

            // Convert object to JSON string
            const content = JSON.stringify(result, null, 2);
            return {
              content: [{ type: 'text', text: content }]
            };

          } catch (err) {
            console.error(`[AgentSDK] Tool ${def.name} error:`, err.message);
            return {
              content: [{
                type: 'text',
                text: `Error executing ${def.name}: ${err.message}`
              }],
              isError: true
            };
          }
        }
      );

      tools.push(sdkTool);
    } catch (err) {
      errors.push({ tool: def.name, error: err.message });
      console.warn(`[AgentSDK] Failed to convert tool ${def.name}:`, err.message);
    }
  }

  // Add financial model tool if code execution is enabled
  if (isCodeExecutionEnabled()) {
    try {
      const financialModelTool = tool(
        financialModelToolDefinition.name,
        financialModelToolDefinition.description,
        {
          modelType: z.enum(['dcf', 'event_study', 'monte_carlo', 'regression', 'damages', 'comps', 'precedent', 'val_409a', 'benford', 'beneish', 'lbo', 'sotp', 'accretion_dilution', 'cvr', 'apv', 'earnout', 'spinoff', 'vc_method'])
            .describe('Type of financial model to execute'),
          financialData: z.record(z.string(), z.any())
            .describe('Financial data for the model (varies by modelType)'),
          parameters: z.record(z.string(), z.any()).optional()
            .describe('Model parameters (WACC, event dates, iterations, etc.)')
        },
        async (args) => {
          try {
            const result = await executeFinancialModel(args);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (err) {
            console.error('[AgentSDK] Financial model error:', err.message);
            return {
              content: [{
                type: 'text',
                text: `Error executing financial model: ${err.message}`
              }],
              isError: true
            };
          }
        }
      );
      tools.push(financialModelTool);
      console.log('[AgentSDK] Added execute_financial_model tool (code execution enabled)');
    } catch (err) {
      console.warn('[AgentSDK] Failed to add financial model tool:', err.message);
    }
  } else {
    console.log('[AgentSDK] Skipping execute_financial_model (code execution disabled)');
  }

  // Log summary
  console.log(`[AgentSDK] Converted ${tools.length} tools (${errors.length} errors)`);
  if (errors.length > 0) {
    console.warn('[AgentSDK] Failed tools:', errors.map(e => e.tool).join(', '));
  }

  return tools;
}

/**
 * Creates an in-process MCP server for the Agent SDK
 *
 * @param {Array} tools - Array of tool definitions from buildAgentSdkTools()
 * @param {string} name - Server name (default: 'super-legal-tools')
 * @param {string} version - Server version (default: '2.0.0')
 * @returns {object} - MCP server instance for Agent SDK mcpServers config
 */
export function createLegalMcpServer(tools, name = 'super-legal-tools', version = '2.0.0') {
  return createSdkMcpServer({
    name,
    version,
    tools
  });
}

/**
 * Gets the full MCP tool name as Claude will see it
 *
 * @param {string} serverName - MCP server name
 * @param {string} toolName - Original tool name
 * @returns {string} - Full tool name (e.g., mcp__super-legal-tools__search_sec_filings)
 */
export function getMcpToolName(serverName, toolName) {
  return `mcp__${serverName}__${toolName}`;
}

/**
 * Gets all MCP tool names for a server
 *
 * @param {string} serverName - MCP server name
 * @param {object} toolImplementations - Map of tool implementations
 * @returns {string[]} - Array of full tool names
 */
export function getAllMcpToolNames(serverName, toolImplementations = {}) {
  return allTools
    .filter(def => toolImplementations[def.name])
    .map(def => getMcpToolName(serverName, def.name));
}

// Export for testing
export { jsonSchemaToZodShape, jsonSchemaPropertyToZod };

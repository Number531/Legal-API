import { applyParameterCaps } from '../utils/createToolWithCaps.js';
import { validateMCPTools } from './mcpToolValidator.js';

const SUPPORTED_TRANSPORTS = new Set(['stdio', 'http', 'websocket']);

/**
 * Lightweight MCP connector wrapper that enforces transport validation,
 * parameter caps on outgoing calls, and optional registry validation.
 */
export class MCPConnector {
  constructor({ client, transport = 'stdio', validator = validateMCPTools } = {}) {
    if (!client) {
      throw new Error('MCPConnector requires a client with listTools/callTool');
    }
    if (!SUPPORTED_TRANSPORTS.has(transport)) {
      throw new Error(`Unsupported MCP transport: ${transport}`);
    }
    this.client = client;
    this.transport = transport;
    this.validator = validator;
  }

  async listTools() {
    const tools = (await this.client.listTools()) || [];
    if (this.validator) {
      await this.validator(tools, this);
    }
    return tools;
  }

  async callTool(name, args = {}) {
    if (!name) throw new Error('Tool name is required');
    const cappedArgs = applyParameterCaps(name, args);
    return this.client.callTool(name, cappedArgs);
  }
}


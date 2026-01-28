import { describe, test, expect, jest } from '@jest/globals';
import { MCPConnector } from '../../src/mcp/mcpConnector.js';
import { validateMCPTools } from '../../src/mcp/mcpToolValidator.js';

const demoTools = [
  {
    name: 'search_sec_filings',
    description: 'Search SEC',
    input_schema: { type: 'object', properties: { limit: { type: 'number', maximum: 10 } } }
  }
];

describe('MCPConnector', () => {
  test('requires supported transport and a client', () => {
    expect(() => new MCPConnector({})).toThrow(/requires a client/);
    expect(() => new MCPConnector({ client: {}, transport: 'ftp' })).toThrow(/Unsupported MCP transport/);
  });

  test('lists tools and applies validator', async () => {
    const validator = jest.fn(async () => true);
    const client = {
      listTools: async () => demoTools,
      callTool: async () => ({ ok: true })
    };
    const connector = new MCPConnector({ client, validator });
    const tools = await connector.listTools();
    expect(tools).toHaveLength(1);
    expect(validator).toHaveBeenCalled();
  });

  test('applies parameter caps on callTool', async () => {
    const client = {
      listTools: async () => demoTools,
      callTool: jest.fn(async (_name, args) => args)
    };
    const connector = new MCPConnector({ client, validator: null });
    const result = await connector.callTool('search_sec_filings', { limit: 50, include_text: true });
    expect(result.limit).toBe(5); // capped by default rules
    expect(result.include_text).toBe(false);
  });
});

describe('validateMCPTools', () => {
  test('throws on missing required fields', async () => {
    await expect(validateMCPTools([{ name: 'bad', input_schema: {} }])).rejects.toThrow(
      /missing 'description'/
    );
  });

  test('verifies handler reachability', async () => {
    const client = {
      listTools: async () => demoTools,
      callTool: jest.fn(async () => {
        const error = new Error('bad');
        error.code = 'SOME_ERROR';
        throw error;
      })
    };
    const connector = new MCPConnector({ client, validator: null });
    await expect(validateMCPTools(demoTools, connector)).rejects.toThrow(/handler unreachable/);
  });
});


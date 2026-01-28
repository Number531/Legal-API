/**
 * Integration tests for EnhancedLegalMcpServer
 * Tests server initialization, tool registration, and request handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnhancedLegalMcpServer } from '../../../src/server/EnhancedLegalMcpServer.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the MCP SDK Server and StdioServerTransport
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

// Mock the API clients
jest.mock('../../../src/api-clients/CourtListenerClient.js', () => ({
  CourtListenerClient: jest.fn(() => ({
    searchCases: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/FinancialDisclosureClient.js', () => ({
  FinancialDisclosureClient: jest.fn(() => ({
    searchFinancialDisclosures: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/SecEdgarClient.js', () => ({
  SecEdgarClient: jest.fn(() => ({
    searchSECFilings: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/FederalRegisterClient.js', () => ({
  FederalRegisterClient: jest.fn(() => ({
    searchFederalRegister: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/UsptoClient.js', () => ({
  UsptoClient: jest.fn(() => ({
    searchPatents: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/GovInfoClient.js', () => ({
  GovInfoClient: jest.fn(() => ({
    searchUSCode: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/ExaClient.js', () => ({
  ExaClient: jest.fn(() => ({
    searchStateStatute: jest.fn(),
  })),
}));
jest.mock('../../../src/api-clients/ComprehensiveAnalysisClient.js', () => ({
  ComprehensiveAnalysisClient: jest.fn(() => ({
    comprehensiveLegalEntityAnalysis: jest.fn(),
  })),
}));

// Mock utilities
jest.mock('../../../src/utils/cache.js', () => ({
  startCacheCleanup: jest.fn(),
}));
jest.mock('../../../src/config/apiConfig.js', () => ({
  rateLimiterConfigs: {
    sec_edgar: { requests: [], enforce: jest.fn() },
    federal_register: { requests: [], enforce: jest.fn() },
    uspto_patents: { requests: [], enforce: jest.fn() },
    govinfo: { requests: [], enforce: jest.fn() },
    exa: { requests: [], enforce: jest.fn() },
  },
}));

// Import actual modules after mocks
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CourtListenerClient } from '../../../src/api-clients/CourtListenerClient.js';
import { SecEdgarClient } from '../../../src/api-clients/SecEdgarClient.js';
import { FederalRegisterClient } from '../../../src/api-clients/FederalRegisterClient.js';
import { UsptoClient } from '../../../src/api-clients/UsptoClient.js';
import { GovInfoClient } from '../../../src/api-clients/GovInfoClient.js';
import { ExaClient } from '../../../src/api-clients/ExaClient.js';
import { ComprehensiveAnalysisClient } from '../../../src/api-clients/ComprehensiveAnalysisClient.js';
import { startCacheCleanup } from '../../../src/utils/cache.js';
import { rateLimiterConfigs } from '../../../src/config/apiConfig.js';

describe('EnhancedLegalMcpServer (Integration)', () => {
  let serverInstance;
  let mockSetRequestHandler;
  let mockConnect;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock process.env.COURTLISTENER_API_TOKEN
    process.env.COURTLISTENER_API_TOKEN = 'test-token';

    // Create a new server instance for each test
    serverInstance = new EnhancedLegalMcpServer();

    // Capture the setRequestHandler and connect mocks
    mockSetRequestHandler = Server.mock.results[0].value.setRequestHandler;
    mockConnect = Server.mock.results[0].value.connect;
  });

  afterEach(() => {
    delete process.env.COURTLISTENER_API_TOKEN;
  });

  test('should initialize all components correctly', () => {
    expect(Server).toHaveBeenCalledWith(
      { name: 'super-legal-mcp', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );
    expect(serverInstance.rateLimiters).toBeInstanceOf(Map);
    expect(serverInstance.toolImplementations).toBeDefined();

    // Check if clients were initialized
    expect(CourtListenerClient).toHaveBeenCalled();
    expect(SecEdgarClient).toHaveBeenCalled();
    expect(FederalRegisterClient).toHaveBeenCalled();
    expect(UsptoClient).toHaveBeenCalled();
    expect(GovInfoClient).toHaveBeenCalled();
    expect(ExaClient).toHaveBeenCalled();
    expect(ComprehensiveAnalysisClient).toHaveBeenCalled();

    // Check if cache cleanup was started
    expect(startCacheCleanup).toHaveBeenCalled();

    // Check if request handlers were set up
    expect(mockSetRequestHandler).toHaveBeenCalledTimes(2);
  });

  test('should set up ListToolsRequestSchema handler', async () => {
    const listToolsHandler = mockSetRequestHandler.mock.calls[0][1];
    const result = await listToolsHandler();

    expect(result).toHaveProperty('tools');
    expect(Array.isArray(result.tools)).toBe(true);
    expect(result.tools.length).toBeGreaterThan(0); // Should contain all tools
    expect(result.tools[0]).toHaveProperty('name');
    expect(result.tools[0]).toHaveProperty('description');
  });

  test('should set up CallToolRequestSchema handler and execute tool', async () => {
    const callToolHandler = mockSetRequestHandler.mock.calls[1][1];
    const mockArgs = { query: 'test case' };
    const mockToolResult = { content: [{ type: 'text', text: 'Mocked case data' }] };

    // Mock a specific client method that a tool implementation would call
    CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue(mockToolResult);

    const request = {
      params: {
        name: 'search_cases',
        arguments: mockArgs,
      },
    };

    const result = await callToolHandler(request);

    expect(CourtListenerClient.mock.results[0].value.searchCases).toHaveBeenCalledWith(mockArgs);
    expect(result).toEqual(mockToolResult);
  });

  test('should handle unknown tool in CallToolRequestSchema handler', async () => {
    const callToolHandler = mockSetRequestHandler.mock.calls[1][1];
    const request = {
      params: {
        name: 'non_existent_tool',
        arguments: {},
      },
    };

    await expect(callToolHandler(request)).rejects.toThrow(McpError);
    await expect(callToolHandler(request)).rejects.toHaveProperty('code', ErrorCode.MethodNotFound);
    await expect(callToolHandler(request)).rejects.toHaveProperty('message', 'Unknown tool: non_existent_tool');
  });

  test('should handle errors during tool execution and wrap in McpError', async () => {
    const callToolHandler = mockSetRequestHandler.mock.calls[1][1];
    const mockError = new Error('Simulated tool error');

    // Mock a client method to throw an error
    CourtListenerClient.mock.results[0].value.searchCases.mockRejectedValue(mockError);

    const request = {
      params: {
        name: 'search_cases',
        arguments: { query: 'error' },
      },
    };

    await expect(callToolHandler(request)).rejects.toThrow(McpError);
    await expect(callToolHandler(request)).rejects.toHaveProperty('code', ErrorCode.InternalError);
    await expect(callToolHandler(request)).rejects.toHaveProperty('message', 'Error executing search_cases: Simulated tool error');
  });

  test('should connect to transport when run is called', async () => {
    const mockTransport = new StdioServerTransport();
    await serverInstance.run();
    expect(mockConnect).toHaveBeenCalledWith(mockTransport);
  });

  test('should log warning if COURTLISTENER_API_TOKEN is not set', () => {
    delete process.env.COURTLISTENER_API_TOKEN;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    
    new EnhancedLegalMcpServer(); // Re-initialize to trigger constructor warning
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('COURTLISTENER_API_TOKEN environment variable not set'));
    consoleErrorSpy.mockRestore();
  });

  test('should call shutdown gracefully on SIGINT', async () => {
    const mockShutdown = jest.spyOn(EnhancedLegalMcpServer.prototype, 'shutdown').mockResolvedValue();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {}); // Mock process.exit

    // Simulate SIGINT
    process.emit('SIGINT');

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10)); 

    expect(mockShutdown).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);

    mockShutdown.mockRestore();
    mockExit.mockRestore();
  });

  test('should call shutdown gracefully on SIGTERM', async () => {
    const mockShutdown = jest.spyOn(EnhancedLegalMcpServer.prototype, 'shutdown').mockResolvedValue();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {}); // Mock process.exit

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10)); 

    expect(mockShutdown).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);

    mockShutdown.mockRestore();
    mockExit.mockRestore();
  });

  describe('MCP Protocol Compliance', () => {
    let callToolHandler;

    beforeEach(() => {
      callToolHandler = mockSetRequestHandler.mock.calls[1][1];
    });

    test('all tools return content array with type/text structure', async () => {
      // Mock a generic successful tool response
      const mockToolResult = { content: [{ type: 'text', text: 'Some data' }] };
      CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue(mockToolResult);

      const request = {
        params: {
          name: 'search_cases',
          arguments: { query: 'format test' },
        },
      };

      const result = await callToolHandler(request);

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0].type).toBe('text');
      expect(result.content[0]).toHaveProperty('text');
      expect(typeof result.content[0].text).toBe('string');
    });

    test('error responses include proper MCP error codes', async () => {
      const mockError = new McpError(ErrorCode.InvalidRequest, 'Invalid input');
      CourtListenerClient.mock.results[0].value.searchCases.mockRejectedValue(mockError);

      const request = {
        params: {
          name: 'search_cases',
          arguments: { query: 'error test' },
        },
      };

      await expect(callToolHandler(request)).rejects.toThrow(McpError);
      await expect(callToolHandler(request)).rejects.toHaveProperty('code', ErrorCode.InvalidRequest);
      await expect(callToolHandler(request)).rejects.toHaveProperty('message', 'Invalid input');
    });

    test('handles null/undefined arguments gracefully for a tool', async () => {
      // Mock a tool that might receive null/undefined args
      CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue({ content: [{ type: 'text', text: 'Handled null args' }] });

      const request = {
        params: {
          name: 'search_cases',
          arguments: null, // Simulate null arguments
        },
      };

      const result = await callToolHandler(request);
      expect(result.content[0].text).toBe('Handled null args');
      expect(CourtListenerClient.mock.results[0].value.searchCases).toHaveBeenCalledWith(null); // Expect the client method to receive null
    });

    test('validates response size limits (conceptual test)', async () => {
      // This test is conceptual as actual size validation might happen at a higher level (MCP SDK or Claude Desktop)
      // or require more complex mocking of stream/buffer sizes.
      // For now, we ensure the tool returns a stringified JSON, which is the expected format.
      const largeData = { data: 'a'.repeat(100000) }; // 100KB string
      const mockToolResult = { content: [{ type: 'text', text: JSON.stringify(largeData) }] };
      CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue(mockToolResult);

      const request = {
        params: {
          name: 'search_cases',
          arguments: { query: 'large data' },
        },
      };

      const result = await callToolHandler(request);
      expect(result.content[0].text.length).toBeGreaterThan(100000); // Ensure large data is passed
      // Actual size limit enforcement would be external or require more specific SDK mocks
    });
  });
});
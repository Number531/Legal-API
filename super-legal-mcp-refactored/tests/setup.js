/**
 * Jest setup file for Enhanced Legal MCP Server tests
 * Configures global test environment and mocks
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.COURTLISTENER_API_TOKEN = 'test-token';
process.env.USPTO_API_KEY = 'test-uspto-key';
process.env.GOVINFO_API_KEY = 'test-govinfo-key';
process.env.EXA_API_KEY = 'test-exa-key';

// Import jest globals for ESM test environment
import { jest, beforeEach, afterAll } from '@jest/globals';

// Global test timeout (30 seconds)
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock fetch globally for all tests
global.fetch = jest.fn();

// Mock setTimeout and clearTimeout for cache tests
global.setTimeout = jest.fn((callback, delay) => {
  // Return a mock timer ID
  return Math.random();
});

global.clearTimeout = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock to default behavior
  global.fetch.mockReset();
  
  // Reset timer mocks
  global.setTimeout.mockClear();
  global.clearTimeout.mockClear();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
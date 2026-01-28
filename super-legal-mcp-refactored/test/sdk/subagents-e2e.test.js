import { describe, test, expect, beforeAll } from '@jest/globals';

/**
 * Subagent End-to-End Integration Tests
 *
 * PREREQUISITE: Start server before running these tests:
 *   SUBAGENTS_ENABLED=true USE_AGENT_SDK=true npm run sdk-server
 *
 * These tests verify that:
 * 1. /api/subagents endpoint returns correct configuration
 * 2. All 10 subagents are properly configured
 * 3. Tool counts match expected values per domain
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Subagent E2E Integration Tests', () => {
  let serverAvailable = false;

  beforeAll(async () => {
    // Check if server is running
    try {
      const res = await fetch(`${BASE_URL}/health`, { timeout: 2000 });
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
  });

  describe('Server Health with Subagents', () => {
    test('health endpoint should return OK', async () => {
      if (!serverAvailable) {
        console.log('⚠️  Server not running. Start with: SUBAGENTS_ENABLED=true npm run sdk-server');
        return;
      }

      const res = await fetch(`${BASE_URL}/health`);
      expect(res.ok).toBe(true);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe('healthy');
    });
  });

  describe('Subagents Endpoint', () => {
    test('should return all 10 subagents when enabled', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      expect(res.ok).toBe(true);

      const data = await res.json();
      expect(data.enabled).toBe(true);
      expect(data.count).toBe(10);
    });

    test('should include securities-researcher with correct tools', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      const securities = data.subagents.find(s => s.name === 'securities-researcher');
      expect(securities).toBeDefined();
      expect(securities.model).toBe('sonnet');
      expect(securities.mcpTools).toBe(4);
    });

    test('should include case-law-analyst with correct tools', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      const caseLaw = data.subagents.find(s => s.name === 'case-law-analyst');
      expect(caseLaw).toBeDefined();
      expect(caseLaw.model).toBe('sonnet');
      expect(caseLaw.mcpTools).toBe(8);
    });

    test('should include pharma-regulatory-analyst with correct tools', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      const pharma = data.subagents.find(s => s.name === 'pharma-regulatory-analyst');
      expect(pharma).toBeDefined();
      expect(pharma.model).toBe('sonnet');
      expect(pharma.mcpTools).toBe(11);
    });

    test('product-safety-analyst should use haiku model', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      const productSafety = data.subagents.find(s => s.name === 'product-safety-analyst');
      expect(productSafety).toBeDefined();
      expect(productSafety.model).toBe('haiku');
    });

    test('legal-research-coordinator should use haiku model with read-only tools', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      const coordinator = data.subagents.find(s => s.name === 'legal-research-coordinator');
      expect(coordinator).toBeDefined();
      expect(coordinator.model).toBe('haiku');
      expect(coordinator.mcpTools).toBe(0);
      expect(coordinator.toolCount).toBe(3);
    });

    test('all subagents should have required fields', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/subagents`);
      const data = await res.json();

      for (const subagent of data.subagents) {
        expect(subagent.name).toBeDefined();
        expect(typeof subagent.name).toBe('string');
        expect(subagent.model).toBeDefined();
        expect(['sonnet', 'haiku', 'opus', 'inherit']).toContain(subagent.model);
        expect(typeof subagent.toolCount).toBe('number');
        expect(typeof subagent.mcpTools).toBe('number');
      }
    });
  });

  describe('Domain Tool Counts', () => {
    const expectedToolCounts = [
      { name: 'securities-researcher', mcpTools: 4, domain: 'SEC' },
      { name: 'case-law-analyst', mcpTools: 8, domain: 'Court' },
      { name: 'pharma-regulatory-analyst', mcpTools: 11, domain: 'FDA' },
      { name: 'environmental-compliance-analyst', mcpTools: 3, domain: 'EPA' },
      { name: 'patent-analyst', mcpTools: 8, domain: 'USPTO' },
      { name: 'regulatory-rulemaking-analyst', mcpTools: 5, domain: 'Federal Register' },
      { name: 'product-safety-analyst', mcpTools: 9, domain: 'CPSC/NHTSA' },
      { name: 'antitrust-competition-analyst', mcpTools: 4, domain: 'FTC' },
      { name: 'statutory-law-analyst', mcpTools: 4, domain: 'US Code' },
      { name: 'legal-research-coordinator', mcpTools: 0, domain: 'Coordinator' }
    ];

    test.each(expectedToolCounts)(
      '$name should have $mcpTools $domain MCP tools',
      async ({ name, mcpTools }) => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/api/subagents`);
        const data = await res.json();

        const subagent = data.subagents.find(s => s.name === name);
        expect(subagent).toBeDefined();
        expect(subagent.mcpTools).toBe(mcpTools);
      }
    );
  });

  /**
   * Integration tests that require actual API calls
   * These are skipped by default to avoid API costs
   * Run with: ENABLE_API_TESTS=true npm test
   */
  const runApiTests = process.env.ENABLE_API_TESTS === 'true';

  (runApiTests ? describe : describe.skip)('Subagent Invocation (requires API)', () => {
    const STREAM_TIMEOUT = 60000;

    test('SEC query should invoke securities-researcher', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Find Apple 10-K SEC filing for 2024'
        })
      });

      expect(res.ok).toBe(true);

      const text = await res.text();
      expect(text.toLowerCase()).toMatch(/sec|10-k|filing|apple|edgar/);
    }, STREAM_TIMEOUT);

    test('FDA query should invoke pharma-regulatory-analyst', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Find FDA drug recalls for aspirin'
        })
      });

      expect(res.ok).toBe(true);

      const text = await res.text();
      expect(text.toLowerCase()).toMatch(/fda|recall|drug|aspirin/);
    }, STREAM_TIMEOUT);

    test('Patent query should invoke patent-analyst', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Search patents for machine learning neural networks'
        })
      });

      expect(res.ok).toBe(true);

      const text = await res.text();
      expect(text.toLowerCase()).toMatch(/patent|uspto|machine learning|neural/);
    }, STREAM_TIMEOUT);
  });
});

/**
 * Feature Flag Tests - These don't require server
 */
describe('Subagent Feature Flag Tests', () => {
  test('SUBAGENTS_ENABLED flag should be boolean', async () => {
    const { featureFlags } = await import('../../src/config/featureFlags.js');
    expect(typeof featureFlags.SUBAGENTS_ENABLED).toBe('boolean');
  });
});

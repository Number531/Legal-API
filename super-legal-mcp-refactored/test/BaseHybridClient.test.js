/**
 * BaseHybridClient.test.js
 *
 * Unit tests for BaseHybridClient hybrid routing strategies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BaseHybridClient } from '../src/api-clients/BaseHybridClient.js';

describe('BaseHybridClient', () => {
  let client;
  let mockNativeClient;
  let mockWebsearchMethod;

  beforeEach(() => {
    // Create mock native client
    mockNativeClient = {
      searchCases: jest.fn(),
      getCaseDetails: jest.fn(),
      lookupCitation: jest.fn()
    };

    // Create hybrid client without auto-instantiation
    client = new BaseHybridClient(null, 'test-exa-key');
    client.nativeClient = mockNativeClient;

    // Mock websearch methods
    mockWebsearchMethod = jest.fn();
    client.searchCasesWeb = mockWebsearchMethod;
    client.getCaseDetailsWeb = mockWebsearchMethod;
    client.lookupCitationWeb = mockWebsearchMethod;

    // Disable logging for tests
    client.verboseLogging = false;
  });

  describe('Strategy Tests', () => {
    describe('native_first strategy', () => {
      test('succeeds with native API', async () => {
        const mockResult = {
          content: [{ type: 'text', text: '{"results": "native data"}' }]
        };
        mockNativeClient.searchCases.mockResolvedValue(mockResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'native_first'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.results).toBe('native data');
        expect(parsed._hybrid_metadata.source).toBe('native_api');
        expect(parsed._hybrid_metadata.confidence).toBe(1.0);
        expect(parsed._hybrid_metadata.fallback_used).toBe(false);
        expect(client.metrics.nativeAPIHits).toBe(1);
        expect(client.metrics.websearchHits).toBe(0);
      });

      test('falls back to websearch on native error', async () => {
        mockNativeClient.searchCases.mockRejectedValue(new Error('Native API error'));
        const mockWebResult = {
          content: [{ type: 'text', text: '{"results": "web data"}' }]
        };
        mockWebsearchMethod.mockResolvedValue(mockWebResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'native_first'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.results).toBe('web data');
        expect(parsed._hybrid_metadata.source).toBe('web_search_fallback');
        expect(parsed._hybrid_metadata.fallback_used).toBe(true);
        expect(parsed._hybrid_metadata.fallback_reason).toBe('Native API unavailable or failed');
        expect(client.metrics.nativeAPIErrors).toBe(1);
        expect(client.metrics.websearchHits).toBe(1);
      });

      test('respects enableFallback flag', async () => {
        client.enableFallback = false;
        mockNativeClient.searchCases.mockRejectedValue(new Error('Native API error'));

        await expect(
          client.executeHybrid('searchCases', { query: 'test' }, {
            strategy: 'native_first'
          })
        ).rejects.toThrow('Native API error');

        expect(client.metrics.nativeAPIErrors).toBe(1);
        expect(client.metrics.websearchHits).toBe(0);
      });
    });

    describe('websearch_first strategy', () => {
      test('succeeds with websearch', async () => {
        const mockWebResult = {
          content: [{ type: 'text', text: '{"results": "web data"}' }]
        };
        mockWebsearchMethod.mockResolvedValue(mockWebResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'websearch_first'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.results).toBe('web data');
        expect(parsed._hybrid_metadata.source).toBe('web_search_primary');
        expect(client.metrics.websearchHits).toBe(1);
      });

      test('enhances with native metadata when available', async () => {
        const mockWebResult = {
          content: [{ type: 'text', text: '{"results": "web data"}' }]
        };
        const mockNativeResult = {
          content: [{ type: 'text', text: '{"metadata": "native metadata"}' }]
        };

        mockWebsearchMethod.mockResolvedValue(mockWebResult);
        mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'websearch_first'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.results).toBe('web data');
        expect(parsed._native_metadata).toBeDefined();
        expect(parsed._enhanced_with_native).toBe(true);
        expect(client.metrics.websearchHits).toBe(1);
        expect(client.metrics.nativeAPIHits).toBe(1);
      });

      test('falls back to native on websearch error', async () => {
        mockWebsearchMethod.mockRejectedValue(new Error('Websearch error'));
        const mockNativeResult = {
          content: [{ type: 'text', text: '{"results": "native data"}' }]
        };
        mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'websearch_first'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.results).toBe('native data');
        expect(parsed._hybrid_metadata.source).toBe('native_api');
        expect(parsed._hybrid_metadata.fallback_reason).toBe('Websearch unavailable');
        expect(client.metrics.websearchErrors).toBe(1);
        expect(client.metrics.nativeAPIHits).toBe(1);
      });
    });

    describe('parallel strategy', () => {
      test('returns fastest successful result', async () => {
        const mockNativeResult = {
          content: [{ type: 'text', text: '{"source": "native"}' }]
        };
        const mockWebResult = {
          content: [{ type: 'text', text: '{"source": "web"}' }]
        };

        // Make native faster
        mockNativeClient.searchCases.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockNativeResult), 10))
        );
        mockWebsearchMethod.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockWebResult), 100))
        );

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'parallel'
        });

        const parsed = JSON.parse(result.content[0].text);
        // Both should complete, but we get a successful result
        expect(parsed.source).toBeDefined();
        expect(client.metrics.nativeAPIHits + client.metrics.websearchHits).toBeGreaterThan(0);
      });

      test('handles mixed success/failure', async () => {
        mockNativeClient.searchCases.mockRejectedValue(new Error('Native failed'));
        const mockWebResult = {
          content: [{ type: 'text', text: '{"source": "web"}' }]
        };
        mockWebsearchMethod.mockResolvedValue(mockWebResult);

        const result = await client.executeHybrid('searchCases', { query: 'test' }, {
          strategy: 'parallel'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.source).toBe('web');
        expect(client.metrics.nativeAPIErrors).toBe(1);
        expect(client.metrics.websearchHits).toBe(1);
      });

      test('throws if all parallel requests fail', async () => {
        mockNativeClient.searchCases.mockRejectedValue(new Error('Native failed'));
        mockWebsearchMethod.mockRejectedValue(new Error('Web failed'));

        await expect(
          client.executeHybrid('searchCases', { query: 'test' }, {
            strategy: 'parallel'
          })
        ).rejects.toThrow('All parallel requests failed');

        expect(client.metrics.nativeAPIErrors).toBe(1);
        expect(client.metrics.websearchErrors).toBe(1);
      });
    });

    describe('smart strategy', () => {
      test('routes to native for specific IDs', async () => {
        const mockNativeResult = {
          content: [{ type: 'text', text: '{"case_id": 12345}' }]
        };
        mockNativeClient.getCaseDetails.mockResolvedValue(mockNativeResult);

        const result = await client.executeHybrid('getCaseDetails', { case_id: 12345 }, {
          strategy: 'smart'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.case_id).toBe(12345);
        expect(parsed._hybrid_metadata.source).toBe('native_api');
        expect(client.metrics.nativeAPIHits).toBe(1);
        expect(client.metrics.websearchHits).toBe(0);
      });

      test('routes to websearch for content queries', async () => {
        const mockWebResult = {
          content: [{ type: 'text', text: '{"query": "long query"}' }]
        };
        mockWebsearchMethod.mockResolvedValue(mockWebResult);

        const result = await client.executeHybrid('searchCases', {
          query: 'find all cases about artificial intelligence liability in autonomous vehicles'
        }, {
          strategy: 'smart'
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed._hybrid_metadata.source).toBe('web_search_primary');
        expect(client.metrics.websearchHits).toBeGreaterThan(0);
      });
    });
  });

  describe('Query Analysis Tests', () => {
    test('detects case_id as preferNative', () => {
      const analysis = client.analyzeQuery({ case_id: 12345 });
      expect(analysis.preferNative).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.9);
      expect(analysis.reason).toContain('case_id');
    });

    test('detects cik as preferNative', () => {
      const analysis = client.analyzeQuery({ cik: '0000320193' });
      expect(analysis.preferNative).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.9);
      expect(analysis.reason).toContain('cik');
    });

    test('detects citation as preferNative', () => {
      const analysis = client.analyzeQuery({ citation: '410 U.S. 113' });
      expect(analysis.preferNative).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.9);
      expect(analysis.reason).toContain('citation');
    });

    test('detects ticker as preferNative', () => {
      const analysis = client.analyzeQuery({ ticker: 'AAPL' });
      expect(analysis.preferNative).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.9);
      expect(analysis.reason).toContain('ticker');
    });

    test('detects court + docket_number as preferNative', () => {
      const analysis = client.analyzeQuery({ court: 'scotus', docket_number: '21-123' });
      expect(analysis.preferNative).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.85);
      expect(analysis.reason).toContain('court + docket_number');
    });

    test('detects long natural language query as preferWebsearch', () => {
      const analysis = client.analyzeQuery({
        query: 'find all recent court cases about artificial intelligence liability'
      });
      expect(analysis.preferNative).toBe(false);
      expect(analysis.confidence).toBeGreaterThan(0.7);
    });

    test('detects include_snippet flag as preferWebsearch', () => {
      const analysis = client.analyzeQuery({ query: 'AI', include_snippet: true });
      expect(analysis.preferNative).toBe(false);
      expect(analysis.confidence).toBeGreaterThan(0.85);
      expect(analysis.reason).toContain('Content-focused');
    });
  });

  describe('Cache Tests', () => {
    test('cache hit returns cached result', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"cached": true}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      // First call - cache miss
      await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'test-key'
      });

      // Second call - cache hit
      const result = await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'test-key'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.cached).toBe(true);
      expect(parsed._hybrid_metadata.source).toBe('cache');
      expect(client.metrics.cacheHits).toBe(1);
      expect(mockNativeClient.searchCases).toHaveBeenCalledTimes(1); // Only called once
    });

    test('cache miss executes hybrid call', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"cached": false}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      const result = await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'new-key'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.cached).toBe(false);
      expect(client.metrics.cacheHits).toBe(0);
      expect(mockNativeClient.searchCases).toHaveBeenCalledTimes(1);
    });

    test('cache expires after timeout', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"expired": true}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      // First call with very short TTL
      await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'expire-key',
        cacheTTL: 10 // 10ms
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Second call should be cache miss
      await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'expire-key'
      });

      expect(client.metrics.cacheHits).toBe(0);
      expect(mockNativeClient.searchCases).toHaveBeenCalledTimes(2);
    });

    test('cache disabled when HYBRID_ENABLE_CACHE=false', async () => {
      client.enableCache = false;
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"data": "test"}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      // First call
      await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'disabled-key'
      });

      // Second call
      await client.executeHybrid('searchCases', { query: 'test' }, {
        strategy: 'native_first',
        cacheKey: 'disabled-key'
      });

      expect(client.metrics.cacheHits).toBe(0);
      expect(mockNativeClient.searchCases).toHaveBeenCalledTimes(2);
    });
  });

  describe('Metrics Tests', () => {
    test('metrics increment correctly', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"data": "test"}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      await client.executeHybrid('searchCases', { query: 'test1' });
      await client.executeHybrid('searchCases', { query: 'test2' });

      expect(client.metrics.totalRequests).toBe(2);
      expect(client.metrics.nativeAPIHits).toBe(2);
    });

    test('success rates calculate correctly', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"data": "test"}' }]
      };
      mockNativeClient.searchCases
        .mockResolvedValueOnce(mockNativeResult)
        .mockRejectedValueOnce(new Error('Failed'));

      const mockWebResult = {
        content: [{ type: 'text', text: '{"data": "web"}' }]
      };
      mockWebsearchMethod.mockResolvedValue(mockWebResult);

      await client.executeHybrid('searchCases', { query: 'test1' });
      await client.executeHybrid('searchCases', { query: 'test2' });

      const metrics = client.getMetrics();
      expect(metrics.nativeSuccessRate).toBe(0.5); // 1 success out of 2 attempts
      expect(metrics.websearchSuccessRate).toBe(1.0); // 1 success out of 1 attempt
    });

    test('cache hit rate calculates correctly', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"data": "test"}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      // 2 unique queries, 1 repeated
      await client.executeHybrid('searchCases', { query: 'q1' }, { cacheKey: 'k1' });
      await client.executeHybrid('searchCases', { query: 'q2' }, { cacheKey: 'k2' });
      await client.executeHybrid('searchCases', { query: 'q1' }, { cacheKey: 'k1' }); // Cache hit

      const metrics = client.getMetrics();
      expect(metrics.cacheHitRate).toBeCloseTo(0.333, 2); // 1 hit out of 3 requests
    });
  });

  describe('Utility Methods', () => {
    test('clearCache empties cache', () => {
      client.setInCache('key1', { data: 'test1' });
      client.setInCache('key2', { data: 'test2' });

      expect(client.getFromCache('key1')).toBeDefined();

      client.clearCache();

      expect(client.getFromCache('key1')).toBeNull();
      expect(client.getFromCache('key2')).toBeNull();
    });

    test('resetMetrics clears all metrics', async () => {
      const mockNativeResult = {
        content: [{ type: 'text', text: '{"data": "test"}' }]
      };
      mockNativeClient.searchCases.mockResolvedValue(mockNativeResult);

      await client.executeHybrid('searchCases', { query: 'test' });

      expect(client.metrics.totalRequests).toBe(1);

      client.resetMetrics();

      expect(client.metrics.totalRequests).toBe(0);
      expect(client.metrics.nativeAPIHits).toBe(0);
      expect(client.metrics.lastReset).toBeDefined();
    });
  });
});

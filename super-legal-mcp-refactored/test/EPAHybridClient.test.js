/**
 * EPAHybridClient.test.js
 *
 * Unit tests for EPAHybridClient with focus on circuit breaker and retry logic
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { EPAHybridClient } from '../src/api-clients/EPAHybridClient.js';

describe('EPAHybridClient', () => {
  let client;
  let mockNativeClient;
  let mockWebsearchClient;
  const exaKey = 'test-exa-key';
  const rateLimiter = { requests: [] };

  beforeEach(() => {
    // Create client
    client = new EPAHybridClient(rateLimiter, exaKey);

    // Mock native client methods
    mockNativeClient = {
      searchFacilities: jest.fn(),
      getFacilityComplianceReport: jest.fn(),
      searchViolations: jest.fn()
    };
    client.nativeClient = mockNativeClient;

    // Mock websearch client methods
    mockWebsearchClient = {
      searchFacilitiesWeb: jest.fn(),
      getFacilityComplianceReportWeb: jest.fn(),
      searchViolationsWeb: jest.fn()
    };
    client.websearchClient = mockWebsearchClient;

    // Disable logging for tests
    client.verboseLogging = false;
  });

  // ==========================================
  // SECTION 1: CIRCUIT BREAKER TESTS
  // ==========================================

  describe('Circuit Breaker', () => {
    test('opens after threshold failures', async () => {
      // Mock native client to always fail
      mockNativeClient.searchFacilities.mockRejectedValue(
        Object.assign(new Error('500 Internal Server Error'), { statusCode: 500 })
      );

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await client.executeNativeWithRetry('searchFacilities', {});
        } catch (error) {
          // Expected to fail
        }
      }

      expect(client.circuitBreaker.state).toBe('open');
      expect(client.isCircuitOpen()).toBe(true);
      expect(client.circuitBreaker.failures).toBe(3);
    });

    test('stays closed below threshold', async () => {
      // Mock native client to fail twice
      mockNativeClient.searchFacilities
        .mockRejectedValueOnce(Object.assign(new Error('500 Error'), { statusCode: 500 }))
        .mockRejectedValueOnce(Object.assign(new Error('500 Error'), { statusCode: 500 }));

      // Trigger 2 failures (below threshold of 3)
      for (let i = 0; i < 2; i++) {
        try {
          await client.executeNativeWithRetry('searchFacilities', {});
        } catch (error) {
          // Expected
        }
      }

      expect(client.circuitBreaker.state).toBe('closed');
      expect(client.isCircuitOpen()).toBe(false);
      expect(client.circuitBreaker.failures).toBe(2);
    });

    test('resets after timeout', () => {
      // Manually set circuit to open
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.lastFailureTime = Date.now() - 400000; // 6 minutes ago

      expect(client.isCircuitOpen()).toBe(false);
      expect(client.circuitBreaker.state).toBe('half-open');
    });

    test('remains open before timeout', () => {
      // Manually set circuit to open
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.lastFailureTime = Date.now() - 60000; // 1 minute ago

      expect(client.isCircuitOpen()).toBe(true);
      expect(client.circuitBreaker.state).toBe('open');
    });

    test('resets on success after half-open', async () => {
      // Set circuit to half-open
      client.circuitBreaker.state = 'half-open';
      client.circuitBreaker.failures = 2;

      // Mock successful call
      mockNativeClient.searchFacilities.mockResolvedValue({
        content: [{ type: 'text', text: '{"success": true}' }]
      });

      await client.executeNativeWithRetry('searchFacilities', {});

      expect(client.circuitBreaker.state).toBe('closed');
      expect(client.circuitBreaker.failures).toBe(0);
    });

    test('throws when circuit is open', async () => {
      // Manually open circuit
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.lastFailureTime = Date.now();

      await expect(client.executeNativeWithRetry('searchFacilities', {}))
        .rejects.toThrow('Circuit breaker open - native EPA API unavailable');
    });

    test('manual reset works', () => {
      // Open circuit
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.failures = 5;
      client.circuitBreaker.lastFailureTime = Date.now();

      // Reset
      client.resetCircuitBreaker();

      expect(client.circuitBreaker.state).toBe('closed');
      expect(client.circuitBreaker.failures).toBe(0);
      expect(client.circuitBreaker.lastFailureTime).toBe(null);
    });
  });

  // ==========================================
  // SECTION 2: RETRY LOGIC TESTS
  // ==========================================

  describe('Retry Logic', () => {
    test('retries on 500 errors with exponential backoff', async () => {
      let attempts = 0;

      mockNativeClient.searchFacilities.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw Object.assign(new Error('500 Internal Server Error'), { statusCode: 500 });
        }
        return { content: [{ type: 'text', text: '{"success": true}' }] };
      });

      const result = await client.executeNativeWithRetry('searchFacilities', {});

      expect(attempts).toBe(3);
      expect(result).toBeDefined();
      expect(client.circuitBreaker.state).toBe('closed');
    });

    test('does not retry on 404 errors', async () => {
      let attempts = 0;

      mockNativeClient.searchFacilities.mockImplementation(async () => {
        attempts++;
        throw Object.assign(new Error('404 Not Found'), { statusCode: 404 });
      });

      await expect(client.executeNativeWithRetry('searchFacilities', {}))
        .rejects.toThrow('404 Not Found');

      expect(attempts).toBe(1); // No retries on 4xx
    });

    test('does not retry on 400 errors', async () => {
      let attempts = 0;

      mockNativeClient.searchFacilities.mockImplementation(async () => {
        attempts++;
        throw Object.assign(new Error('400 Bad Request'), { statusCode: 400 });
      });

      await expect(client.executeNativeWithRetry('searchFacilities', {}))
        .rejects.toThrow('400 Bad Request');

      expect(attempts).toBe(1);
    });

    test('exhausts all retries on persistent 500 errors', async () => {
      let attempts = 0;

      mockNativeClient.searchFacilities.mockImplementation(async () => {
        attempts++;
        throw Object.assign(new Error('500 Internal Server Error'), { statusCode: 500 });
      });

      await expect(client.executeNativeWithRetry('searchFacilities', {}))
        .rejects.toThrow('500 Internal Server Error');

      expect(attempts).toBe(3); // 1 initial + 2 retries
      expect(client.circuitBreaker.state).toBe('open'); // Should open circuit after 3 failures
    });

    test('exponential backoff increases delay', async () => {
      const delays = [];
      let attempts = 0;

      // Override sleep to track delays
      client.sleep = jest.fn(async (ms) => {
        delays.push(ms);
        return Promise.resolve();
      });

      mockNativeClient.searchFacilities.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw Object.assign(new Error('500 Error'), { statusCode: 500 });
        }
        return { content: [{ type: 'text', text: '{"success": true}' }] };
      });

      await client.executeNativeWithRetry('searchFacilities', {});

      expect(delays.length).toBe(2); // 2 delays (after 1st and 2nd attempts)
      expect(delays[0]).toBe(1000); // Initial delay
      expect(delays[1]).toBe(2000); // Doubled delay
    });
  });

  // ==========================================
  // SECTION 3: ROUTING STRATEGY TESTS
  // ==========================================

  describe('Routing Strategies', () => {
    test('registry_id triggers native-first with cache', async () => {
      const spy = jest.spyOn(client, 'executeHybrid');

      mockNativeClient.searchFacilities.mockResolvedValue({
        content: [{ type: 'text', text: '{"facilities": []}' }]
      });

      await client.searchFacilities({ registry_id: '110000012345', limit: 5 });

      expect(spy).toHaveBeenCalledWith('searchFacilities', expect.any(Object), {
        strategy: 'native_first',
        cacheKey: 'epa_facility_110000012345',
        cacheTTL: 7200000
      });
    });

    test('facility_name search uses websearch-first', async () => {
      const spy = jest.spyOn(client, 'executeHybrid');

      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"facilities": []}' }]
      });

      await client.searchFacilities({ facility_name: 'Acme Corp', limit: 5 });

      expect(spy).toHaveBeenCalledWith('searchFacilities', expect.any(Object), {
        strategy: 'websearch_first',
        cacheKey: 'epa_search_Acme Corp_all',
        cacheTTL: 7200000
      });
    });

    test('violations search uses websearch-first', async () => {
      const spy = jest.spyOn(client, 'executeHybrid');

      mockWebsearchClient.searchViolationsWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"count": 0, "results": []}' }]
      });

      await client.searchViolations({ facility_id: '110000012345' });

      expect(spy).toHaveBeenCalledWith('searchViolations', expect.any(Object), {
        strategy: 'websearch_first',
        cacheKey: 'epa_violations_110000012345',
        cacheTTL: 7200000
      });
    });

    test('compliance report uses websearch-first', async () => {
      const spy = jest.spyOn(client, 'executeHybrid');

      mockWebsearchClient.getFacilityComplianceReportWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"facility": {}, "compliance_summary": {}}' }]
      });

      await client.getFacilityCompliance({ facility_id: '110000012345' });

      expect(spy).toHaveBeenCalledWith('getFacilityComplianceReportWeb', expect.any(Object), {
        strategy: 'websearch_first',
        cacheKey: 'epa_compliance_110000012345',
        cacheTTL: 7200000
      });
    });
  });

  // ==========================================
  // SECTION 4: WEBSEARCH-FIRST STRATEGY TESTS
  // ==========================================

  describe('Websearch-First Strategy', () => {
    test('returns websearch result when native enhancement fails', async () => {
      const wsResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Test"}]}' }]
      };
      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue(wsResult);
      mockNativeClient.searchFacilities.mockRejectedValue(new Error('Native failed'));

      const result = await client.websearchFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { facility_name: 'Test' }
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.facilities[0].name).toBe('Test');
      expect(parsed._hybrid_metadata.source).toBe('web_search_primary');
      expect(client.metrics.websearchHits).toBe(1);
    });

    test('enhances websearch with native data when circuit closed', async () => {
      const wsResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Test"}]}' }]
      };
      const nativeResult = {
        content: [{ type: 'text', text: '{"compliance_summary": {"Status": "Compliant", "QtrsInNC": 0}}' }]
      };

      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue(wsResult);
      mockNativeClient.searchFacilities.mockResolvedValue(nativeResult);

      const result = await client.websearchFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { facility_name: 'Test' }
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed._native_compliance).toBeDefined();
      expect(parsed._native_compliance.status).toBe('Compliant');
      expect(parsed._hybrid_metadata.source).toBe('hybrid_enhanced');
    });

    test('skips native enhancement when circuit open', async () => {
      // Open circuit
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.lastFailureTime = Date.now();

      const wsResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Test"}]}' }]
      };
      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue(wsResult);

      const result = await client.websearchFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { facility_name: 'Test' }
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed._native_compliance).toBeUndefined();
      expect(parsed._hybrid_metadata.source).toBe('web_search_primary');
      expect(mockNativeClient.searchFacilities).not.toHaveBeenCalled();
    });

    test('throws when websearch fails (no fallback to unreliable native)', async () => {
      mockWebsearchClient.searchFacilitiesWeb.mockRejectedValue(new Error('Websearch failed'));

      await expect(client.websearchFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { facility_name: 'Test' }
      )).rejects.toThrow('Websearch failed');

      expect(client.metrics.websearchErrors).toBe(1);
    });
  });

  // ==========================================
  // SECTION 5: NATIVE-FIRST STRATEGY TESTS
  // ==========================================

  describe('Native-First Strategy (with circuit breaker)', () => {
    test('succeeds with native API when circuit closed', async () => {
      const nativeResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Test"}]}' }]
      };
      mockNativeClient.searchFacilities.mockResolvedValue(nativeResult);

      const result = await client.nativeFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { registry_id: '110000012345' }
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.facilities[0].name).toBe('Test');
      expect(parsed._hybrid_metadata.source).toBe('native_api');
      expect(client.metrics.nativeAPIHits).toBe(1);
    });

    test('falls back to websearch when native fails', async () => {
      mockNativeClient.searchFacilities.mockRejectedValue(
        Object.assign(new Error('500 Error'), { statusCode: 500 })
      );
      const wsResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Web Result"}]}' }]
      };
      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue(wsResult);

      const result = await client.nativeFirstStrategy(
        'searchFacilities',
        'searchFacilitiesWeb',
        { registry_id: '110000012345' }
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.facilities[0].name).toBe('Web Result');
      expect(parsed._hybrid_metadata.source).toBe('web_search_fallback');
      expect(client.metrics.nativeAPIErrors).toBeGreaterThan(0);
      expect(client.metrics.websearchHits).toBe(1);
    });
  });

  // ==========================================
  // SECTION 6: RESULT MERGING TESTS
  // ==========================================

  describe('Result Merging', () => {
    test('merges native compliance data into websearch results', () => {
      const wsResult = {
        content: [{ type: 'text', text: '{"facilities": [{"name": "Test"}]}' }]
      };
      const nativeResult = {
        content: [{ type: 'text', text: '{"compliance_summary": {"Status": "Violation", "QtrsInNC": 4, "FormalActions": 2, "TotalPenalties": "$50,000"}}' }]
      };

      const merged = client.mergeResults(wsResult, nativeResult);
      const parsed = JSON.parse(merged.content[0].text);

      expect(parsed._native_compliance).toBeDefined();
      expect(parsed._native_compliance.status).toBe('Violation');
      expect(parsed._native_compliance.quarters_in_noncompliance).toBe(4);
      expect(parsed._native_compliance.formal_actions).toBe(2);
      expect(parsed._native_compliance.total_penalties).toBe('$50,000');
      expect(parsed._hybrid_metadata.source).toBe('hybrid_enhanced');
    });

    test('handles merge errors gracefully', () => {
      const wsResult = {
        content: [{ type: 'text', text: 'invalid json' }]
      };
      const nativeResult = {
        content: [{ type: 'text', text: '{"compliance_summary": {}}' }]
      };

      const result = client.mergeResults(wsResult, nativeResult);

      // Should return original websearch result on merge error
      expect(result).toBe(wsResult);
    });
  });

  // ==========================================
  // SECTION 7: BACKWARD COMPATIBILITY TESTS
  // ==========================================

  describe('Backward Compatibility', () => {
    test('searchFacilitiesWeb wrapper calls searchFacilities', async () => {
      const spy = jest.spyOn(client, 'searchFacilities');
      mockWebsearchClient.searchFacilitiesWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"facilities": []}' }]
      });

      await client.searchFacilitiesWeb({ facility_name: 'Test' });

      expect(spy).toHaveBeenCalledWith({ facility_name: 'Test' });
    });

    test('getFacilityComplianceWeb wrapper calls getFacilityCompliance', async () => {
      const spy = jest.spyOn(client, 'getFacilityCompliance');
      mockWebsearchClient.getFacilityComplianceReportWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"facility": {}}' }]
      });

      await client.getFacilityComplianceWeb({ facility_id: '123' });

      expect(spy).toHaveBeenCalledWith({ facility_id: '123' });
    });

    test('searchViolationsWeb wrapper calls searchViolations', async () => {
      const spy = jest.spyOn(client, 'searchViolations');
      mockWebsearchClient.searchViolationsWeb.mockResolvedValue({
        content: [{ type: 'text', text: '{"count": 0}' }]
      });

      await client.searchViolationsWeb({ facility_id: '123' });

      expect(spy).toHaveBeenCalledWith({ facility_id: '123' });
    });
  });

  // ==========================================
  // SECTION 8: METRICS TESTS
  // ==========================================

  describe('Metrics', () => {
    test('getMetrics includes EPA-specific data', () => {
      // Simulate some activity
      client.metrics.nativeAPIHits = 5;
      client.metrics.nativeAPIErrors = 2;
      client.metrics.websearchHits = 10;
      client.metrics.websearchErrors = 1;
      client.circuitBreaker.state = 'closed';

      const metrics = client.getMetrics();

      expect(metrics.epaSpecific).toBeDefined();
      expect(metrics.epaSpecific.nativeAPIHits).toBe(5);
      expect(metrics.epaSpecific.nativeAPIErrors).toBe(2);
      expect(metrics.epaSpecific.websearchHits).toBe(10);
      expect(metrics.epaSpecific.websearchErrors).toBe(1);
      expect(metrics.epaSpecific.circuitBreakerState).toBe('closed');
      expect(metrics.epaSpecific.nativeAPIReliability).toBe('healthy');
    });

    test('reliability marked as degraded when circuit open', () => {
      client.circuitBreaker.state = 'open';

      const metrics = client.getMetrics();

      expect(metrics.epaSpecific.nativeAPIReliability).toBe('degraded');
    });
  });

  // ==========================================
  // SECTION 9: CACHE TESTS
  // ==========================================

  describe('Cache', () => {
    test('clearEPACache removes only EPA entries', () => {
      // Add some cache entries
      client.cache.set('epa_facility_123', { data: 'test1' });
      client.cache.set('epa_compliance_456', { data: 'test2' });
      client.cache.set('cl_case_789', { data: 'test3' }); // Non-EPA entry

      client.clearEPACache();

      expect(client.cache.has('epa_facility_123')).toBe(false);
      expect(client.cache.has('epa_compliance_456')).toBe(false);
      expect(client.cache.has('cl_case_789')).toBe(true); // Should remain
    });

    test('uses longer cache TTL for EPA data', () => {
      expect(client.defaultCacheTTL).toBe(7200000); // 2 hours
    });
  });
});

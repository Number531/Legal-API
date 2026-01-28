/**
 * Unit tests for API Configuration module
 * Tests configuration exports and rate limiter functionality
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { apiConfigs, rateLimiterConfigs, DEFAULT_CACHE_TTL, DATE_REGEX, COURT_ID_REGEX } from '../../../src/config/apiConfig.js';

describe('API Configuration', () => {
  describe('apiConfigs', () => {
    test('should export all required API configurations', () => {
      const expectedApis = [
        'courtlistener',
        'sec_edgar', 
        'federal_register',
        'uspto_patents',
        'govinfo',
        'exa'
      ];

      expectedApis.forEach(api => {
        expect(apiConfigs).toHaveProperty(api);
        expect(apiConfigs[api]).toHaveProperty('baseUrl');
        expect(apiConfigs[api]).toHaveProperty('requiresAuth');
        expect(apiConfigs[api]).toHaveProperty('rateLimits');
        expect(apiConfigs[api]).toHaveProperty('headers');
      });
    });

    test('should have correct base URLs', () => {
      expect(apiConfigs.courtlistener.baseUrl).toBe('https://www.courtlistener.com/api/rest/v4');
      expect(apiConfigs.sec_edgar.baseUrl).toBe('https://data.sec.gov');
      expect(apiConfigs.federal_register.baseUrl).toBe('https://www.federalregister.gov/api/v1');
      expect(apiConfigs.uspto_patents.baseUrl).toBe('https://search.patentsview.org/api/v1');
      expect(apiConfigs.govinfo.baseUrl).toBe('https://api.govinfo.gov');
      expect(apiConfigs.exa.baseUrl).toBe('https://api.exa.ai');
    });

    test('should have correct authentication requirements', () => {
      expect(apiConfigs.courtlistener.requiresAuth).toBe(true);
      expect(apiConfigs.sec_edgar.requiresAuth).toBe(false);
      expect(apiConfigs.federal_register.requiresAuth).toBe(false);
      expect(apiConfigs.uspto_patents.requiresAuth).toBe(true);
      expect(apiConfigs.govinfo.requiresAuth).toBe(true);
      expect(apiConfigs.exa.requiresAuth).toBe(true);
    });

    test('should have proper User-Agent headers', () => {
      Object.values(apiConfigs).forEach(config => {
        expect(config.headers).toHaveProperty('User-Agent');
        expect(config.headers['User-Agent']).toMatch(/Enhanced.*Legal.*MCP|Mozilla.*Enhanced.*Legal.*MCP|Super.*Legal.*MCP/i);
      });
    });

    test('should have Accept headers for JSON', () => {
      Object.values(apiConfigs).forEach(config => {
        expect(config.headers).toHaveProperty('Accept');
        expect(config.headers.Accept).toBe('application/json');
      });
    });
  });

  describe('Rate Limiter Configurations', () => {
    beforeEach(() => {
      // Reset rate limiter request arrays before each test
      Object.values(rateLimiterConfigs).forEach(limiter => {
        limiter.requests = [];
      });
    });

    test('should export all rate limiter configurations', () => {
      const expectedLimiters = [
        'sec_edgar',
        'federal_register', 
        'uspto_patents',
        'govinfo',
        'exa'
      ];

      expectedLimiters.forEach(limiter => {
        expect(rateLimiterConfigs).toHaveProperty(limiter);
        expect(rateLimiterConfigs[limiter]).toHaveProperty('requests');
        expect(rateLimiterConfigs[limiter]).toHaveProperty('enforce');
        expect(typeof rateLimiterConfigs[limiter].enforce).toBe('function');
      });
    });

    test('SEC EDGAR rate limiter should enforce 9 requests per second', async () => {
      const limiter = rateLimiterConfigs.sec_edgar;
      const startTime = Date.now();
      
      // Mock Date.now to control timing
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      // Add 8 requests (should not trigger rate limiting)
      for (let i = 0; i < 8; i++) {
        await limiter.enforce();
      }
      
      expect(limiter.requests).toHaveLength(8);
      
      // 9th request should still pass
      await limiter.enforce();
      expect(limiter.requests).toHaveLength(9);

      mockNow.mockRestore();
    });

    test('Federal Register rate limiter should enforce 5 requests per second', async () => {
      const limiter = rateLimiterConfigs.federal_register;
      const startTime = Date.now();
      
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      // Add 4 requests
      for (let i = 0; i < 4; i++) {
        await limiter.enforce();
      }
      
      expect(limiter.requests).toHaveLength(4);
      
      // 5th request should still pass
      await limiter.enforce();
      expect(limiter.requests).toHaveLength(5);

      mockNow.mockRestore();
    });

    test('USPTO rate limiter should enforce 40 requests per minute', async () => {
      const limiter = rateLimiterConfigs.uspto_patents;
      const startTime = Date.now();
      
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      // Add 39 requests
      for (let i = 0; i < 39; i++) {
        await limiter.enforce();
      }
      
      expect(limiter.requests).toHaveLength(39);
      
      // 40th request should still pass
      await limiter.enforce();
      expect(limiter.requests).toHaveLength(40);

      mockNow.mockRestore();
    });

    test('GovInfo rate limiter should enforce 9 requests per second', async () => {
      const limiter = rateLimiterConfigs.govinfo;
      const startTime = Date.now();
      
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      // Add 8 requests
      for (let i = 0; i < 8; i++) {
        await limiter.enforce();
      }
      
      expect(limiter.requests).toHaveLength(8);
      
      // 9th request should still pass
      await limiter.enforce();
      expect(limiter.requests).toHaveLength(9);

      mockNow.mockRestore();
    });

    test('Exa rate limiter should enforce 5 requests per second', async () => {
      const limiter = rateLimiterConfigs.exa;
      const startTime = Date.now();
      
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      // Add 4 requests
      for (let i = 0; i < 4; i++) {
        await limiter.enforce();
      }
      
      expect(limiter.requests).toHaveLength(4);
      
      // 5th request should still pass
      await limiter.enforce();
      expect(limiter.requests).toHaveLength(5);

      mockNow.mockRestore();
    });

    test('rate limiters should clean up old requests', async () => {
      const limiter = rateLimiterConfigs.sec_edgar;
      const startTime = Date.now();
      
      const mockNow = jest.spyOn(Date, 'now');
      
      // Add requests at startTime
      mockNow.mockReturnValue(startTime);
      for (let i = 0; i < 5; i++) {
        await limiter.enforce();
      }
      expect(limiter.requests).toHaveLength(5);
      
      // Move time forward by 2 seconds
      mockNow.mockReturnValue(startTime + 2000);
      await limiter.enforce();
      
      // Old requests should be cleaned up (older than 1 second)
      expect(limiter.requests).toHaveLength(1);

      mockNow.mockRestore();
    });
  });

  describe('Constants', () => {
    test('should export DEFAULT_CACHE_TTL', () => {
      expect(DEFAULT_CACHE_TTL).toBe(15 * 60 * 1000); // 15 minutes in milliseconds
    });

    test('should export DATE_REGEX', () => {
      expect(DATE_REGEX).toBeInstanceOf(RegExp);
      expect(DATE_REGEX.test('2023-12-25')).toBe(true);
      expect(DATE_REGEX.test('2023-1-1')).toBe(false);
      expect(DATE_REGEX.test('invalid-date')).toBe(false);
    });

    test('should export COURT_ID_REGEX', () => {
      expect(COURT_ID_REGEX).toBeInstanceOf(RegExp);
      expect(COURT_ID_REGEX.test('ca1')).toBe(true);
      expect(COURT_ID_REGEX.test('scotus')).toBe(true);
      expect(COURT_ID_REGEX.test('invalid-court')).toBe(false);
      expect(COURT_ID_REGEX.test('COURT')).toBe(false);
    });
  });
});
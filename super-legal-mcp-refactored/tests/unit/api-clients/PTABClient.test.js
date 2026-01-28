/**
 * Unit tests for PTAB (Patent Trial and Appeal Board) API Client
 * Tests PTAB client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PTABClient } from '../../../src/api-clients/PTABClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
}));

import { makeApiRequest } from '../../../src/utils/apiHelpers.js';

describe('PTABClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new PTABClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchProceedings', () => {
    test('should search PTAB proceedings successfully with basic query', async () => {
      const mockResponse = {
        totalCount: 1,
        results: [{
          proceedingNumber: 'IPR2023-00001',
          proceedingType: 'IPR',
          patentNumber: '1234567',
          status: 'INSTITUTED'
        }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { proceeding_type: 'IPR', patent_number: '1234567', limit: 10 };
      const result = await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({
          proceedingType: 'IPR',
          patentNumber: '1234567',
          limit: 10
        }),
        expect.objectContaining({ apiType: 'ptab', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).total_count).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].proceedingNumber).toBe('IPR2023-00001');
    });

    test('should handle empty arguments', async () => {
      const mockResponse = { totalCount: 0, results: [] };
      makeApiRequest.mockResolvedValue(mockResponse);

      const result = await client.searchProceedings();

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({ limit: 25 }), // Default limit
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).total_count).toBe(0);
    });

    test('should handle API errors', async () => {
      makeApiRequest.mockRejectedValue(new Error('PTAB API is down'));

      await expect(client.searchProceedings({ query: 'error' }))
        .rejects.toThrow('PTAB API is down');
    });

    test('should limit results to maximum of 100', async () => {
      const mockResponse = { totalCount: 1, results: [{ proceedingNumber: 'IPR2023-00001' }] };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { limit: 150 };
      await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({ limit: 100 }), // Should cap at 100
        expect.any(Object)
      );
    });
  });

  describe('searchProceedings - Additional Tests', () => {
    test('should handle date range filtering', async () => {
      const mockResponse = { totalCount: 0, results: [] };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = {
        date_filed_after: '2023-01-01',
        date_filed_before: '2023-12-31'
      };
      await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({
          filedDateStart: '2023-01-01',
          filedDateEnd: '2023-12-31'
        }),
        expect.any(Object)
      );
    });

    test('should filter by proceeding status', async () => {
      const mockResponse = { totalCount: 0, results: [] };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = {
        status: 'INSTITUTED'
      };
      await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({
          status: 'INSTITUTED'
        }),
        expect.any(Object)
      );
    });

    test('should search by petitioner and patent owner', async () => {
      const mockResponse = { totalCount: 0, results: [] };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = {
        petitioner: 'Apple Inc.',
        patent_owner: 'Samsung'
      };
      await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({
          petitioner: 'Apple Inc.',
          patentOwner: 'Samsung'
        }),
        expect.any(Object)
      );
    });

    test('should enforce rate limiting', async () => {
      const mockResponse = { totalCount: 0, results: [] };
      makeApiRequest.mockResolvedValue(mockResponse);

      await client.searchProceedings({});
      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
    });

    test('should search proceedings with ALL parameters simultaneously', async () => {
      const mockResponse = {
        totalCount: 1,
        results: [{
          proceedingNumber: 'IPR2024-00500',
          proceedingType: 'IPR',
          patentNumber: '9876543',
          petitioner: 'Google LLC',
          patentOwner: 'Microsoft Corp',
          filedDate: '2024-03-15',
          status: 'PENDING'
        }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = {
        proceeding_type: 'IPR',
        patent_number: '9876543',
        petitioner: 'Google LLC',
        patent_owner: 'Microsoft Corp',
        date_filed_after: '2024-01-01',
        date_filed_before: '2024-12-31',
        status: 'PENDING',
        limit: 5
      };
      const result = await client.searchProceedings(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/proceedings/search',
        expect.objectContaining({
          proceedingType: 'IPR',
          patentNumber: '9876543',
          petitioner: 'Google LLC',
          patentOwner: 'Microsoft Corp',
          filedDateStart: '2024-01-01',
          filedDateEnd: '2024-12-31',
          status: 'PENDING',
          limit: 5
        }),
        expect.objectContaining({ apiType: 'ptab', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).total_count).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].proceedingNumber).toBe('IPR2024-00500');
    });
  });

  describe('getDecisions', () => {
    test('should get PTAB decisions successfully for a proceeding', async () => {
      const mockResponse = {
        results: [{
          decisionId: 'DEC2023-00001',
          proceedingNumber: 'IPR2023-00123',
          decisionType: 'institution',
          decisionDate: '2023-05-01'
        }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { proceeding_number: 'IPR2023-00123', decision_type: 'institution' };
      const result = await client.getDecisions(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/decisions',
        expect.objectContaining({
          proceedingNumber: 'IPR2023-00123',
          decisionType: 'institution'
        }),
        expect.objectContaining({ apiType: 'ptab', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).proceeding).toBe('IPR2023-00123');
      expect(JSON.parse(result.content[0].text).decisions[0].decisionType).toBe('institution');
    });

    test('should get all decision types if "all" is specified', async () => {
      const mockResponse = {
        results: [{ decisionType: 'institution' }, { decisionType: 'final' }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { proceeding_number: 'IPR2023-00123', decision_type: 'all' };
      await client.getDecisions(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/decisions',
        expect.not.objectContaining({ decisionType: expect.any(String) }), // Should not include decisionType param
        expect.any(Object)
      );
      expect(JSON.parse(makeApiRequest.mock.calls[0][1]).proceedingNumber).toBe('IPR2023-00123');
    });

    test('should throw error if proceeding_number is missing', async () => {
      await expect(client.getDecisions({})).rejects.toThrow("proceeding_number is required (e.g., 'IPR2023-00123')");
    });

    test('should handle API errors', async () => {
      makeApiRequest.mockRejectedValue(new Error('Decision not found'));

      await expect(client.getDecisions({ proceeding_number: 'IPR2023-00000' }))
        .rejects.toThrow('Decision not found');
    });
  });
});
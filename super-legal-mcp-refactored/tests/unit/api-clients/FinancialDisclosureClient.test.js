/**
 * Unit tests for Financial Disclosure API Client
 * Tests Financial Disclosure client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FinancialDisclosureClient } from '../../../src/api-clients/FinancialDisclosureClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
  fetchAllPages: jest.fn()
}));

// Mock the validation helpers
jest.mock('../../../src/utils/validation.js', () => ({
  validateLimit: jest.fn((limit, max) => Math.min(limit, max || 20)) // Simple pass-through mock
}));

import { makeApiRequest } from '../../../src/utils/apiHelpers.js';
import { validateLimit } from '../../../src/utils/validation.js';

describe('FinancialDisclosureClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new FinancialDisclosureClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchFinancialDisclosures', () => {
    test('should search financial disclosures successfully with judge name', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = {
        count: 1,
        results: [{ id: 1, person_name: 'Judge Test', year: 2023, report_type: 'Annual' }]
      };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse);

      const args = { judge_name: 'Judge Test', year: 2023, limit: 10 };
      const result = await client.searchFinancialDisclosures(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 100);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/people/',
        expect.objectContaining({ name: 'Judge Test', limit: 1 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/financial-disclosures/',
        expect.objectContaining({ person: 101, year: 2023, limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(1);
      expect(JSON.parse(result.content[0].text).disclosures[0].person_name).toBe('Judge Test');
    });

    test('should return error if judge not found', async () => {
      makeApiRequest.mockResolvedValueOnce({ results: [] }); // No judge found

      const args = { judge_name: 'NonExistent Judge' };
      const result = await client.searchFinancialDisclosures(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.error).toContain('No judge found');
      expect(responseData.count).toBe(0);
    });

    test('should return error if no disclosures found for judge', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce({ results: [] }); // No disclosures found

      const args = { judge_name: 'Judge Test', year: 2023 };
      const result = await client.searchFinancialDisclosures(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.error).toContain('No financial disclosures found');
      expect(responseData.count).toBe(0);
    });

    test('should search disclosures without judge name', async () => {
      const mockDisclosureResponse = {
        count: 1,
        results: [{ id: 1, person_name: 'Judge Test', year: 2023, report_type: 'Annual' }]
      };
      makeApiRequest.mockResolvedValueOnce(mockDisclosureResponse);

      const args = { year: 2023, report_type: 'Annual', limit: 10 };
      const result = await client.searchFinancialDisclosures(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/financial-disclosures/',
        expect.objectContaining({ year: 2023, report_type: 'Annual', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });
  });

  describe('getFinancialDisclosureDetails', () => {
    test('should get disclosure details and related data', async () => {
      const mockDisclosure = { id: 1, person_name: 'Judge Test', has_investments: true };
      const mockInvestments = { results: [{ id: 10, description: 'Stock' }] };
      const mockGifts = { results: [{ id: 20, source: 'Friend' }] };
      const mockPositions = { results: [{ id: 30, position: 'Director' }] };
      const mockIncome = { results: [{ id: 40, source_type: 'Consulting' }] };
      const mockAgreements = { results: [{ id: 50, parties_and_terms: 'Agreement' }] };
      const mockSpouseIncome = { results: [{ id: 60, source_type: 'Spouse Job' }] };
      const mockReimbursements = { results: [{ id: 70, source: 'Travel' }] };
      const mockDebts = { results: [{ id: 80, creditor_name: 'Bank' }] };
      const mockDisclosurePositions = { results: [{ id: 90, position: 'Board Member' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockDisclosure)
        .mockResolvedValueOnce(mockInvestments)
        .mockResolvedValueOnce(mockGifts)
        .mockResolvedValueOnce(mockPositions)
        .mockResolvedValueOnce(mockIncome)
        .mockResolvedValueOnce(mockAgreements)
        .mockResolvedValueOnce(mockSpouseIncome)
        .mockResolvedValueOnce(mockReimbursements)
        .mockResolvedValueOnce(mockDebts)
        .mockResolvedValueOnce(mockDisclosurePositions);

      const args = { disclosure_id: 1 };
      const result = await client.getFinancialDisclosureDetails(args);

      expect(makeApiRequest).toHaveBeenCalledWith('/financial-disclosures/1/', {}, expect.any(Object));
      expect(makeApiRequest).toHaveBeenCalledWith('/investments/', expect.objectContaining({ financial_disclosure: 1 }), expect.any(Object));
      expect(makeApiRequest).toHaveBeenCalledWith('/gifts/', expect.objectContaining({ financial_disclosure: 1 }), expect.any(Object));
      // ... and so on for all related endpoints

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.disclosure.id).toBe(1);
      expect(responseData.investments).toHaveLength(1);
      expect(responseData.gifts).toHaveLength(1);
      expect(responseData.positions).toHaveLength(1);
      expect(responseData.non_investment_income).toHaveLength(1);
      expect(responseData.agreements).toHaveLength(1);
      expect(responseData.spouse_incomes).toHaveLength(1);
      expect(responseData.reimbursements).toHaveLength(1);
      expect(responseData.debts).toHaveLength(1);
      expect(responseData.disclosure_positions).toHaveLength(1);
    });

    test('should handle missing disclosure_id', async () => {
      await expect(client.getFinancialDisclosureDetails({})).rejects.toThrow('Financial disclosure ID is required');
    });

    test('should handle API errors gracefully for related data', async () => {
      const mockDisclosure = { id: 1, person_name: 'Judge Test', has_investments: true };
      makeApiRequest
        .mockResolvedValueOnce(mockDisclosure)
        .mockRejectedValueOnce(new Error('Investments error')) // Simulate error for investments
        .mockResolvedValueOnce({ results: [] }) // Other calls succeed
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] });

      const args = { disclosure_id: 1 };
      const result = await client.getFinancialDisclosureDetails(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.investments).toEqual([]); // Should be empty due to error
      expect(responseData.gifts).toEqual([]); // Other arrays should be empty if no data
    });
  });

  describe('searchJudgeInvestments', () => {
    test('should search judge investments by judge name and company', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockInvestmentResponse = { count: 1, results: [{ id: 10, description: 'Apple Inc.' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockInvestmentResponse);

      const args = { judge_name: 'Judge Test', company_name: 'Apple', year: 2023, limit: 10 };
      const result = await client.searchJudgeInvestments(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/investments/',
        expect.objectContaining({ financial_disclosure__in: '1', description__icontains: 'Apple', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).investments[0].description).toBe('Apple Inc.');
    });

    test('should filter by min_value code', async () => {
      const mockInvestmentResponse = { count: 0, results: [] };
      makeApiRequest.mockResolvedValueOnce(mockInvestmentResponse);

      const args = { min_value: 1000001 }; // Corresponds to P2, P3, P4
      await client.searchJudgeInvestments(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/investments/',
        expect.objectContaining({ gross_value_code__in: ["P2", "P3", "P4"] }),
        expect.any(Object)
      );
    });
  });

  describe('getJudgeGifts', () => {
    test('should get judge gifts by judge name', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockGiftsResponse = { count: 1, results: [{ id: 20, source: 'Family' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockGiftsResponse);

      const args = { judge_name: 'Judge Test', year: 2023, limit: 10 };
      const result = await client.getJudgeGifts(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/gifts/',
        expect.objectContaining({ financial_disclosure__in: '1', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).gifts[0].source).toBe('Family');
    });
  });

  describe('getJudgePositions', () => {
    test('should get judge positions by judge name and organization', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockPositionsResponse = { count: 1, results: [{ id: 30, name_of_organization: 'University' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockPositionsResponse);

      const args = { judge_name: 'Judge Test', organization: 'University', year: 2023, limit: 10 };
      const result = await client.getJudgePositions(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/positions/',
        expect.objectContaining({ financial_disclosure__in: '1', name_of_organization__icontains: 'University', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).positions[0].name_of_organization).toBe('University');
    });
  });

  describe('searchJudgeSpouseIncome', () => {
    test('should search judge spouse income by judge name and source type', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockSpouseIncomeResponse = { count: 1, results: [{ id: 60, source_type: 'Teaching' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockSpouseIncomeResponse);

      const args = { judge_name: 'Judge Test', source_type: 'Teaching', year: 2023, limit: 10 };
      const result = await client.searchJudgeSpouseIncome(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/spouse-incomes/',
        expect.objectContaining({ financial_disclosure__in: '1', source_type__icontains: 'Teaching', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).spouse_incomes[0].source_type).toBe('Teaching');
    });
  });

  describe('searchJudgeReimbursements', () => {
    test('should search judge reimbursements by judge name and source', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockReimbursementResponse = { count: 1, results: [{ id: 70, source: 'Conference' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockReimbursementResponse);

      const args = { judge_name: 'Judge Test', source: 'Conference', year: 2023, limit: 10 };
      const result = await client.searchJudgeReimbursements(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/reimbursements/',
        expect.objectContaining({ financial_disclosure__in: '1', source__icontains: 'Conference', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).reimbursements[0].source).toBe('Conference');
    });
  });

  describe('searchJudgeDebts', () => {
    test('should search judge debts by judge name and creditor', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockDebtResponse = { count: 1, results: [{ id: 80, creditor_name: 'Mortgage Co.' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockDebtResponse);

      const args = { judge_name: 'Judge Test', creditor_name: 'Mortgage', year: 2023, limit: 10 };
      const result = await client.searchJudgeDebts(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/debts/',
        expect.objectContaining({ financial_disclosure__in: '1', creditor_name__icontains: 'Mortgage', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).debts[0].creditor_name).toBe('Mortgage Co.');
    });
  });

  describe('getDisclosurePositions', () => {
    test('should get disclosure positions by disclosure ID', async () => {
      const mockPositionsResponse = { count: 1, results: [{ id: 90, position: 'Trustee' }] };
      makeApiRequest.mockResolvedValueOnce(mockPositionsResponse);

      const args = { disclosure_id: 1, limit: 10 };
      const result = await client.getDisclosurePositions(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/disclosure-positions/',
        expect.objectContaining({ financial_disclosure: 1, limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).disclosure_positions[0].position).toBe('Trustee');
    });

    test('should get disclosure positions by judge name and year', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      const mockDisclosureResponse = { results: [{ id: 1, person: 101 }] };
      const mockPositionsResponse = { count: 1, results: [{ id: 90, position: 'Trustee' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce(mockDisclosureResponse)
        .mockResolvedValueOnce(mockPositionsResponse);

      const args = { judge_name: 'Judge Test', year: 2023, limit: 10 };
      const result = await client.getDisclosurePositions(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/disclosure-positions/',
        expect.objectContaining({ financial_disclosure__in: '1', limit: 10 }),
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).disclosure_positions[0].position).toBe('Trustee');
    });

    test('should return error if no disclosures found for judge when getting positions', async () => {
      const mockJudgeResponse = { results: [{ id: 101, name: 'Judge Test' }] };
      makeApiRequest
        .mockResolvedValueOnce(mockJudgeResponse)
        .mockResolvedValueOnce({ results: [] }); // No disclosures found

      const args = { judge_name: 'Judge Test', year: 2023 };
      const result = await client.getDisclosurePositions(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.error).toContain('No financial disclosures found');
      expect(responseData.count).toBe(0);
    });
  });
});
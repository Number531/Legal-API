/**
 * Unit tests for EPA ECHO (Enforcement and Compliance History Online) API Client
 * Tests EPAComplianceClient methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { EPAComplianceClient } from '../../../src/api-clients/EPAComplianceClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
}));

import { makeApiRequest } from '../../../src/utils/apiHelpers.js';

describe('EPAComplianceClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new EPAComplianceClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchFacilities', () => {
    test('should search facilities successfully with basic query', async () => {
      const mockResponse = {
        Results: {
          QueryRows: 1,
          Facilities: [{
            FacName: 'Test Facility',
            FRSID: '12345',
            FacParentCo: 'Test Corp',
            FacCity: 'Anytown',
            FacState: 'NY',
            FacZip: '12345',
            ComplianceStatus: 'In Compliance',
            QtrsWithNC: '0',
            FormalEACount: '0',
            TotalPenalties: '0',
            HPVFlag: 'N',
            CAAFlag: 'Y',
            CWAFlag: 'N',
            RCRAFlag: 'Y'
          }]
        }
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { facility_name: 'Test Facility', limit: 10 };
      const result = await client.searchFacilities(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_facilities',
        expect.objectContaining({
          p_fn: 'Test Facility',
          p_rows: 10,
          output: 'JSON'
        }),
        expect.objectContaining({ apiType: 'epa_echo', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).total_facilities).toBe(1);
      expect(JSON.parse(result.content[0].text).facilities[0].name).toBe('Test Facility');
      expect(JSON.parse(result.content[0].text).facilities[0].programs.clean_air).toBe(true);
      expect(JSON.parse(result.content[0].text).facilities[0].programs.clean_water).toBe(false);
    });

    test('should handle all search parameters', async () => {
      const mockResponse = { Results: { QueryRows: 0, Facilities: [] } };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = {
        facility_name: 'Plant',
        company_name: 'Chemicals Inc',
        city: 'Houston',
        state: 'TX',
        zip_code: '77001',
        compliance_status: 'violation',
        violations_last_3_years: true,
        limit: 20
      };
      await client.searchFacilities(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_facilities',
        expect.objectContaining({
          p_fn: 'Plant',
          p_owname: 'Chemicals Inc',
          p_ct: 'Houston',
          p_st: 'TX',
          p_zip: '77001',
          p_qnc: 'Y',
          p_qiv: '12',
          p_rows: 20
        }),
        expect.any(Object)
      );
    });

    test('should handle empty arguments', async () => {
      const mockResponse = { Results: { QueryRows: 0, Facilities: [] } };
      makeApiRequest.mockResolvedValue(mockResponse);

      const result = await client.searchFacilities();

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_facilities',
        expect.objectContaining({ p_rows: 50 }), // Default limit
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).total_facilities).toBe(0);
    });

    test('should handle API errors', async () => {
      makeApiRequest.mockRejectedValue(new Error('EPA ECHO API is down'));

      await expect(client.searchFacilities({ facility_name: 'error' }))
        .rejects.toThrow('EPA ECHO API is down');
    });

    test('should identify high priority violators', async () => {
      const mockResponse = {
        Results: {
          QueryRows: 2,
          Facilities: [{ HPVFlag: 'N' }, { HPVFlag: 'Y' }]
        }
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const result = await client.searchFacilities({});
      expect(JSON.parse(result.content[0].text).high_priority_violators).toBe(1);
    });

    test('should include query_id and page_number for pagination', async () => {
      const mockResponse = {
        Results: {
          QueryRows: 100,
          QueryID: 'test_qid',
          Message: { QueryID: 'test_qid_msg' }, // Sometimes QueryID is nested
          Facilities: []
        }
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query_id: 'abc-123', page_number: 2, limit: 50 };
      const result = await client.searchFacilities(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_facilities',
        expect.objectContaining({
          p_qid: 'abc-123',
          pageno: 2,
          p_rows: 50
        }),
        expect.any(Object)
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.query_id).toBe('test_qid'); // Prioritize direct QueryID
    });

    test('should prioritize direct QueryID over nested QueryID in response', async () => {
      const mockResponse = {
        Results: {
          QueryRows: 100,
          QueryID: 'direct_qid',
          Message: { QueryID: 'nested_qid' },
          Facilities: []
        }
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query_id: 'abc-123', page_number: 2, limit: 50 };
      const result = await client.searchFacilities(args);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.query_id).toBe('direct_qid');
    });

    test('should use nested QueryID if direct QueryID is missing', async () => {
      const mockResponse = {
        Results: {
          QueryRows: 100,
          Message: { QueryID: 'nested_qid' },
          Facilities: []
        }
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query_id: 'abc-123', page_number: 2, limit: 50 };
      const result = await client.searchFacilities(args);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.query_id).toBe('nested_qid');
    });
  });

  describe('getFacilityComplianceReport', () => {
    test('should get compliance report successfully with all details', async () => {
      const mockDfrResponse = {
        Facility: { FRSID: '123', Name: 'Test Facility' },
        ComplianceSummary: { Status: 'In Compliance' },
        ThreeYearComplianceHistory: []
      };
      const mockViolationsResponse = { Violations: [{ id: 'V1', type: 'Air' }] };
      const mockEnforcementResponse = { EnforcementActions: [{ id: 'E1', type: 'Formal' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockDfrResponse)
        .mockResolvedValueOnce(mockViolationsResponse)
        .mockResolvedValueOnce(mockEnforcementResponse);

      const args = { facility_id: '123', include_violations: true, include_enforcement: true };
      const result = await client.getFacilityComplianceReport(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/dfr_rest_services.get_dfr',
        expect.objectContaining({ p_id: '123' }),
        expect.objectContaining({ apiType: 'epa_echo', rateLimiter: mockRateLimiter })
      );
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_violations',
        expect.objectContaining({ p_id: '123' }),
        expect.any(Object)
      );
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_enforcement',
        expect.objectContaining({ p_id: '123' }),
        expect.any(Object)
      );

      const report = JSON.parse(result.content[0].text);
      expect(report.facility).toEqual(mockDfrResponse.Facility);
      expect(report.compliance_summary).toEqual(mockDfrResponse.ComplianceSummary);
      expect(report.three_year_compliance).toEqual(mockDfrResponse.ThreeYearComplianceHistory);
      expect(report.violations).toEqual(mockViolationsResponse.Violations);
      expect(report.enforcement_actions).toEqual(mockEnforcementResponse.EnforcementActions);
    });

    test('should not include violations or enforcement if requested', async () => {
      const mockDfrResponse = {
        Facility: { FRSID: '123' },
        ComplianceSummary: {},
        ThreeYearComplianceHistory: []
      };
      makeApiRequest.mockResolvedValueOnce(mockDfrResponse);

      const args = { facility_id: '123', include_violations: false, include_enforcement: false };
      const result = await client.getFacilityComplianceReport(args);

      expect(makeApiRequest).toHaveBeenCalledTimes(1); // Only DFR call
      expect(makeApiRequest).not.toHaveBeenCalledWith(expect.stringContaining('violations'), expect.any(Object));
      expect(makeApiRequest).not.toHaveBeenCalledWith(expect.stringContaining('enforcement'), expect.any(Object));

      const report = JSON.parse(result.content[0].text);
      expect(report.violations).toBeUndefined();
      expect(report.enforcement_actions).toBeUndefined();
    });

    test('should throw error if facility_id is missing', async () => {
      await expect(client.getFacilityComplianceReport({})).rejects.toThrow('facility_id is required');
    });

    test('should handle API errors for DFR gracefully', async () => {
      makeApiRequest.mockRejectedValueOnce(new Error('DFR not found'));

      await expect(client.getFacilityComplianceReport({ facility_id: 'invalid' }))
        .rejects.toThrow('DFR not found');
    });

    test('should handle API errors for violations/enforcement gracefully', async () => {
      const mockDfrResponse = {
        Facility: { FRSID: '123' },
        ComplianceSummary: {},
        ThreeYearComplianceHistory: []
      };
      makeApiRequest
        .mockResolvedValueOnce(mockDfrResponse)
        .mockRejectedValueOnce(new Error('Violations error'))
        .mockRejectedValueOnce(new Error('Enforcement error'));

      const args = { facility_id: '123', include_violations: true, include_enforcement: true };
      const result = await client.getFacilityComplianceReport(args);

      const report = JSON.parse(result.content[0].text);
      expect(report.violations).toEqual([]); // Should be empty array on error
      expect(report.enforcement_actions).toEqual([]); // Should be empty array on error
    });
  });

  describe('searchViolations', () => {
    test('should search violations for a facility', async () => {
      const mockResponse = {
        Violations: [
          { id: 'V1', Program: 'CWA', ViolationDate: '2023-01-01' },
          { id: 'V2', Program: 'CAA', ViolationDate: '2023-06-01' }
        ]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { facility_id: '456', limit: 10 };
      const result = await client.searchViolations(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/echo_rest_services.get_violations',
        expect.objectContaining({ p_id: '456' }),
        expect.objectContaining({ apiType: 'epa_echo', rateLimiter: mockRateLimiter })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.count).toBe(2);
      expect(responseData.results[0].id).toBe('V1');
    });

    test('should filter violations by program (client-side)', async () => {
      const mockResponse = {
        Violations: [
          { id: 'V1', Program: 'CWA', ViolationDate: '2023-01-01' },
          { id: 'V2', Program: 'CAA', ViolationDate: '2023-06-01' },
          { id: 'V3', Program: 'CWA', ViolationDate: '2023-09-01' }
        ]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { facility_id: '456', program: 'CWA' };
      const result = await client.searchViolations(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.count).toBe(2);
      expect(responseData.results.every(v => v.Program === 'CWA')).toBe(true);
    });

    test('should filter violations by date range (client-side)', async () => {
      const mockResponse = {
        Violations: [
          { id: 'V1', Program: 'CWA', ViolationDate: '2023-01-01' },
          { id: 'V2', Program: 'CAA', ViolationDate: '2023-06-01' },
          { id: 'V3', Program: 'CWA', ViolationDate: '2023-09-01' }
        ]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { facility_id: '456', date_after: '2023-05-01', date_before: '2023-07-01' };
      const result = await client.searchViolations(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.count).toBe(1);
      expect(responseData.results[0].id).toBe('V2');
    });

    test('should apply limit to client-side filtered results', async () => {
      const mockResponse = {
        Violations: Array.from({ length: 50 }, (_, i) => ({ id: `V${i}`, Program: 'CWA', ViolationDate: `2023-01-${(i+1).toString().padStart(2, '0')}` }))
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { facility_id: '456', program: 'CWA', limit: 5 };
      const result = await client.searchViolations(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.count).toBe(5);
      expect(responseData.results).toHaveLength(5);
    });

    test('should throw error if facility_id is missing', async () => {
      await expect(client.searchViolations({})).rejects.toThrow('facility_id is required');
    });

    test('should handle API errors', async () => {
      makeApiRequest.mockRejectedValue(new Error('Violations API error'));

      await expect(client.searchViolations({ facility_id: 'invalid' }))
        .rejects.toThrow('Violations API error');
    });
  });
});
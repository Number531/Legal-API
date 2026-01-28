/**
 * Unit tests for EPA Web Search Client (Exa-only)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EPAWebSearchClient } from '../../../src/api-clients/EPAWebSearchClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('EPAWebSearchClient (Exa-only)', () => {
  let client;
  let mockRateLimiter;
  let consoleWarnSpy;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    process.env.EXA_API_KEY = 'test-exa-key';
    client = new EPAWebSearchClient(mockRateLimiter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  describe('constructor', () => {
    test('initializes with rate limiter and EXA key', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
      expect(client.exaApiKey).toBe('test-exa-key');
    });

    test('warns if EXA_API_KEY not configured', () => {
      delete process.env.EXA_API_KEY;
      new EPAWebSearchClient(mockRateLimiter);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not configured'));
    });
  });

  describe('searchFacilitiesWeb', () => {
    test('calls Exa with correct domain restriction and maps facilities', async () => {
      const text = [
        'Facility Name: ACME Chemical Plant',
        'Registry ID: 123456789',
        'Address: 100 Main St',
        'City: Dayton',
        'State: OH',
        'Compliance Status: High Priority Violator',
        'Total Penalties: $1,250,000',
        'Quarters in Noncompliance: 8',
        'CAA CWA RCRA'
      ].join('\n');

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'ACME Chemical Plant - ECHO',
        url: 'https://echo.epa.gov/dfr?p_id=123456789',
        text,
        score: 0.97
      }] }) });

      const result = await client.searchFacilitiesWeb({ facility_name: 'ACME', state: 'OH', limit: 1, include_full_text: true });

      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.includeDomains).toEqual(['echo.epa.gov', 'www.epa.gov']);
      expect(body.query).toContain('site:echo.epa.gov');
      expect(body.numResults).toBe(1);

      const data = JSON.parse(result.content[0].text);
      expect(data.total_facilities).toBe(1);
      const f = data.facilities[0];
      expect(f.name).toMatch(/acme/i);
      expect(f.epa_registry_id).toBe('123456789');
      expect(f.location.city).toBe('Dayton');
      expect(f.location.state).toBe('OH');
      expect(f.compliance_status).toMatch(/high priority/i);
      expect(f.total_penalties).toBe(1250000);
      expect(f.programs.clean_air).toBe(true);
      expect(f.programs.clean_water).toBe(true);
      expect(f.programs.rcra).toBe(true);
      expect(f.full_text).toBeDefined();
    });
  });

  describe('getFacilityComplianceReportWeb', () => {
    test('parses facility header, compliance, violations and enforcement', async () => {
      const text = [
        'Facility Name: ACME Chemical Plant',
        'FRSID 123456789',
        'Location: 100 Main St, Dayton, OH',
        'Compliance Status: In Noncompliance',
        'Quarters in Noncompliance: 4',
        'Formal Enforcement Actions: 2',
        'Total Penalties: $500,000',
        '',
        'Violations:',
        'Program: CAA',
        'Date: 2023-03-15',
        'Description: Emissions exceedance.',
        '',
        'Enforcement Action: Consent Decree',
        'Date: 2023-06-01'
      ].join('\n');

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'DFR - ACME',
        url: 'https://echo.epa.gov/dfr?p_id=123456789',
        text
      }] }) });

      const res = await client.getFacilityComplianceReportWeb({ facility_id: '123456789', include_violations: true, include_enforcement: true, include_full_text: true });
      const data = JSON.parse(res.content[0].text);

      expect(data.facility.registry_id).toBe('123456789');
      expect(data.facility.full_text).toBeDefined();
      expect(data.compliance_summary.Status).toMatch(/noncompliance/i);
      expect(data.compliance_summary.QtrsInNC).toBe('4');
      expect(data.compliance_summary.FormalActions).toBe('2');
      expect(data.compliance_summary.TotalPenalties).toBe('500,000');
      expect(Array.isArray(data.three_year_compliance)).toBe(true);
      expect(Array.isArray(data.violations)).toBe(true);
      expect(data.violations.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.enforcement_actions)).toBe(true);
      expect(data.enforcement_actions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('searchViolationsWeb', () => {
    test('filters by program and date range and applies limit', async () => {
      const text = [
        'Violations:',
        'Program: CAA',
        'Date: 2023-03-15',
        'Description: Emissions exceedance.',
        '',
        'Program: CWA',
        'Date: 2022-01-10',
        'Description: Discharge exceedance.'
      ].join('\n');

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'DFR - ACME',
        url: 'https://echo.epa.gov/dfr?p_id=123456789',
        text
      }] }) });

      const res = await client.searchViolationsWeb({ facility_id: '123456789', program: 'CAA', date_after: '2023-01-01', date_before: '2023-12-31', limit: 1 });
      const data = JSON.parse(res.content[0].text);
      expect(data.facility_id).toBe('123456789');
      expect(data.count).toBe(1);
      expect(data.results[0].Program).toBe('CAA');
      expect(data.results[0].Date).toBe('2023-03-15');
    });
  });

  describe('executeExaSearch errors', () => {
    test('throws when EXA_API_KEY missing', async () => {
      delete process.env.EXA_API_KEY;
      const c = new EPAWebSearchClient(mockRateLimiter);
      await expect(c.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API key not configured');
    });

    test('throws on non-ok Exa response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: () => Promise.resolve('Bad Request') });
      await expect(client.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API error: 400 - Bad Request');
    });
  });
});



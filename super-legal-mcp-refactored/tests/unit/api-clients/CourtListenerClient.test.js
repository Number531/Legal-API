/**
 * Unit tests for CourtListener API Client
 * Tests CourtListener client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CourtListenerClient } from '../../../src/api-clients/CourtListenerClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
  fetchAllPages: jest.fn()
}));

// Mock the validation helpers
jest.mock('../../../src/utils/validation.js', () => ({
  validateDate: jest.fn(),
  validateCourtId: jest.fn(),
  validateLimit: jest.fn((limit, max) => Math.min(limit, max || 20)) // Simple pass-through mock
}));

import { makeApiRequest, fetchAllPages } from '../../../src/utils/apiHelpers.js';
import { validateDate, validateCourtId, validateLimit } from '../../../src/utils/validation.js';

describe('CourtListenerClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new CourtListenerClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchCases', () => {
    test('should search cases successfully with basic query', async () => {
      const mockResponse = {
        results: [{ id: 1, case_name: 'Test Case', court: 'ca1', date_filed: '2023-01-01' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query: 'test', limit: 10 };
      const result = await client.searchCases(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 100);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/search/',
        expect.objectContaining({ q: 'test', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Test Case');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });

    test('should call validateDate for date parameters', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { date_filed_after: '2022-01-01', date_filed_before: '2022-12-31' };
      await client.searchCases(args);

      expect(validateDate).toHaveBeenCalledWith('2022-01-01', 'date_filed_after');
      expect(validateDate).toHaveBeenCalledWith('2022-12-31', 'date_filed_before');
    });

    test('should call validateCourtId for court parameter', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { court: 'ca1' };
      await client.searchCases(args);

      expect(validateCourtId).toHaveBeenCalledWith('ca1');
    });

    test('should fetch all pages if fetch_all_pages is true', async () => {
      const page1 = { results: [{ id: 1 }], next: 'http://next.url?page=2' };
      const page2 = { results: [{ id: 2 }], next: null };
      fetchAllPages.mockResolvedValueOnce([page1.results[0], page2.results[0]]);

      const args = { query: 'test', limit: 30, fetch_all_pages: true };
      const result = await client.searchCases(args);

      expect(validateLimit).toHaveBeenCalledWith(30, 100);
      expect(fetchAllPages).toHaveBeenCalledWith(
        '/search/',
        expect.objectContaining({ q: 'test', limit: 20 }), // fetchAllPages uses its own limit
        2, // Math.ceil(30/20)
        'courtlistener',
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).count).toBe(2);
      expect(JSON.parse(result.content[0].text).total_available).toBe("Multiple pages fetched");
    });

    test('should slice results to validated limit when fetching all pages', async () => {
      const longResults = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      fetchAllPages.mockResolvedValueOnce(longResults);

      const args = { query: 'test', limit: 15, fetch_all_pages: true };
      const result = await client.searchCases(args);

      expect(JSON.parse(result.content[0].text).count).toBe(15);
    });
  });

  describe('getCaseDetails', () => {
    test('should get case details successfully', async () => {
      const mockCaseData = { id: 123, case_name: 'Detailed Case', court: 'ca1', absolute_url: '/case/123/' };
      makeApiRequest.mockResolvedValue(mockCaseData);

      const args = { case_id: 123 };
      const result = await client.getCaseDetails(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/clusters/123/',
        {},
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Detailed Case');
      expect(JSON.parse(result.content[0].text).id).toBe(123);
    });

    test('should throw error for invalid case_id', async () => {
      await expect(client.getCaseDetails({ case_id: 'abc' })).rejects.toThrow('Invalid case_id. Must be a positive integer.');
      await expect(client.getCaseDetails({ case_id: 0 })).rejects.toThrow('Invalid case_id. Must be a positive integer.');
      await expect(client.getCaseDetails({ case_id: -5 })).rejects.toThrow('Invalid case_id. Must be a positive integer.');
    });
  });

  describe('lookupCitation', () => {
    test('should find case by citation', async () => {
      const mockSearchResponse = {
        results: [
          { id: 1, case_name: 'Cited Case', citation: '123 F. Supp. 456', absolute_url: '/case/1/' },
          { id: 2, case_name: 'Similar Case', citation: '124 F. Supp. 789', absolute_url: '/case/2/' }
        ]
      };
      makeApiRequest.mockResolvedValue(mockSearchResponse);

      const args = { citation: '123 F. Supp. 456' };
      const result = await client.lookupCitation(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/search/',
        expect.objectContaining({ q: '123 F. Supp. 456', type: 'o', limit: 5 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.found).toBe(true);
      expect(responseData.case.case_name).toBe('Cited Case');
      expect(responseData.alternative_results).toHaveLength(1);
    });

    test('should return message if no cases found for citation', async () => {
      makeApiRequest.mockResolvedValue({ results: [] });

      const args = { citation: 'NonExistent Citation' };
      const result = await client.lookupCitation(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.found).toBe(false);
      expect(responseData.message).toBe('No cases found matching the citation');
    });
  });

  describe('searchJudges', () => {
    test('should search judges successfully', async () => {
      const mockResponse = {
        results: [{ id: 1, name_first: 'John', name_last: 'Doe', absolute_url: '/person/1/' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { name: 'John Doe', limit: 10 };
      const result = await client.searchJudges(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 100);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/people/',
        expect.objectContaining({ name: 'John Doe', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('John Doe');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });

    test('should call validateCourtId for court parameter', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { court: 'ca1' };
      await client.searchJudges(args);

      expect(validateCourtId).toHaveBeenCalledWith('ca1');
    });

    test('should fetch all pages if fetch_all_pages is true', async () => {
      const page1 = { results: [{ id: 1, name_first: 'A', name_last: 'B' }], next: 'http://next.url?page=2' };
      const page2 = { results: [{ id: 2, name_first: 'C', name_last: 'D' }], next: null };
      fetchAllPages.mockResolvedValueOnce([page1.results[0], page2.results[0]]);

      const args = { name: 'test', limit: 30, fetch_all_pages: true };
      const result = await client.searchJudges(args);

      expect(validateLimit).toHaveBeenCalledWith(30, 100);
      expect(fetchAllPages).toHaveBeenCalledWith(
        '/people/',
        expect.objectContaining({ name: 'test', limit: 20 }),
        2,
        'courtlistener',
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).count).toBe(2);
    });
  });

  describe('getJudgeDetails', () => {
    test('should get judge details successfully', async () => {
      const mockJudgeData = { id: 456, name_first: 'Jane', name_last: 'Smith', absolute_url: '/person/456/' };
      makeApiRequest.mockResolvedValue(mockJudgeData);

      const args = { judge_id: 456 };
      const result = await client.getJudgeDetails(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/people/456/',
        {},
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Jane Smith');
      expect(JSON.parse(result.content[0].text).id).toBe(456);
    });

    test('should throw error for invalid judge_id', async () => {
      await expect(client.getJudgeDetails({ judge_id: 'abc' })).rejects.toThrow('Invalid judge_id. Must be a positive integer.');
      await expect(client.getJudgeDetails({ judge_id: 0 })).rejects.toThrow('Invalid judge_id. Must be a positive integer.');
    });
  });

  describe('getCourtInfo', () => {
    test('should get court info successfully', async () => {
      const mockCourtData = { id: 'ca1', short_name: 'CA1', full_name: 'U.S. Court of Appeals for the First Circuit', absolute_url: '/court/ca1/' };
      makeApiRequest.mockResolvedValue(mockCourtData);

      const args = { court_id: 'ca1' };
      const result = await client.getCourtInfo(args);

      expect(validateCourtId).toHaveBeenCalledWith('ca1');
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/courts/ca1/',
        {},
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('U.S. Court of Appeals for the First Circuit');
      expect(JSON.parse(result.content[0].text).id).toBe('ca1');
    });
  });

  describe('listCourts', () => {
    test('should list courts successfully', async () => {
      const mockResponse = {
        results: [{ id: 'ca1', short_name: 'CA1', full_name: 'U.S. Court of Appeals for the First Circuit' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { limit: 10 };
      const result = await client.listCourts(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 300);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/courts/',
        expect.objectContaining({ limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('CA1');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });

    test('should fetch all courts if fetch_all is true', async () => {
      const mockResponse = {
        results: [{ id: 'ca1', short_name: 'CA1' }, { id: 'ca2', short_name: 'CA2' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { fetch_all: true };
      const result = await client.listCourts(args);

      expect(validateLimit).toHaveBeenCalledWith(20, 300); // Default limit for validateLimit
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/courts/',
        expect.objectContaining({ limit: 300 }), // Max limit when fetch_all is true
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(2);
    });
  });

  describe('searchOpinions', () => {
    test('should search opinions successfully', async () => {
      const mockResponse = {
        results: [{ id: 1, author_str: 'Judge A', type: 'majority', plain_text: 'Opinion text' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query: 'contract law', limit: 10 };
      const result = await client.searchOpinions(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 100);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/opinions/',
        expect.objectContaining({ text: 'contract law', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Opinion text');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });
  });

  describe('getOpinionWithCitations', () => {
    test('should get opinion with citations successfully', async () => {
      const mockOpinionData = { id: 1, author_str: 'Judge A', plain_text: 'Opinion text', html_with_citations: '<html>', cluster: 100 };
      const mockCitingResponse = { results: [{ citing_opinion: 2, citing_opinion_name: 'Citing Case' }] };
      const mockCitedResponse = { results: [{ cited_opinion: 3, cited_opinion_name: 'Cited Case' }] };

      makeApiRequest
        .mockResolvedValueOnce(mockOpinionData)
        .mockResolvedValueOnce(mockCitingResponse)
        .mockResolvedValueOnce(mockCitedResponse);

      const args = { opinion_id: 1, include_citing_cases: true, include_cited_cases: true, citation_depth: 1 };
      const result = await client.getOpinionWithCitations(args);

      expect(makeApiRequest).toHaveBeenCalledWith('/opinions/1/', {}, expect.any(Object));
      expect(makeApiRequest).toHaveBeenCalledWith('/opinion-citations/', { cited_opinion: 1, limit: 50 }, expect.any(Object));
      expect(makeApiRequest).toHaveBeenCalledWith('/opinion-citations/', { citing_opinion: 1, limit: 50 }, expect.any(Object));

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.opinion.id).toBe(1);
      expect(responseData.citations.citing_this_opinion).toHaveLength(1);
      expect(responseData.citations.cited_by_this_opinion).toHaveLength(1);
    });

    test('should throw error for invalid opinion_id', async () => {
      await expect(client.getOpinionWithCitations({ opinion_id: 'abc' })).rejects.toThrow('Invalid opinion_id. Must be a positive integer.');
    });

    test('should throw error for invalid citation_depth', async () => {
      await expect(client.getOpinionWithCitations({ opinion_id: 1, citation_depth: 0 })).rejects.toThrow('Citation depth must be between 1 and 3.');
      await expect(client.getOpinionWithCitations({ opinion_id: 1, citation_depth: 4 })).rejects.toThrow('Citation depth must be between 1 and 3.');
    });

    test('should handle errors fetching citing/cited cases gracefully', async () => {
      const mockOpinionData = { id: 1, author_str: 'Judge A', plain_text: 'Opinion text', html_with_citations: '<html>', cluster: 100 };
      makeApiRequest
        .mockResolvedValueOnce(mockOpinionData)
        .mockRejectedValueOnce(new Error('Citing error'))
        .mockRejectedValueOnce(new Error('Cited error'));

      const args = { opinion_id: 1, include_citing_cases: true, include_cited_cases: true };
      const result = await client.getOpinionWithCitations(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.citations.citing_this_opinion).toEqual([]);
      expect(responseData.citations.cited_by_this_opinion).toEqual([]);
    });
  });

  describe('searchAudio', () => {
    test('should search audio successfully', async () => {
      const mockResponse = {
        results: [{ id: 1, case_name: 'Audio Case', duration: 300, stt_status: 'COMPLETE' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query: 'oral argument', limit: 10 };
      const result = await client.searchAudio(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 50);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/audio/',
        expect.objectContaining({ q: 'oral argument', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Audio Case');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });

    test('should call validateDate for date parameters', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { date_argued_after: '2022-01-01', date_argued_before: '2022-12-31' };
      await client.searchAudio(args);

      expect(validateDate).toHaveBeenCalledWith('2022-01-01', 'date_argued_after');
      expect(validateDate).toHaveBeenCalledWith('2022-12-31', 'date_argued_before');
    });

    test('should call validateCourtId for court parameter', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { court: 'ca1' };
      await client.searchAudio(args);

      expect(validateCourtId).toHaveBeenCalledWith('ca1');
    });

    test('should convert min_duration to seconds', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { min_duration: 5 }; // 5 minutes
      await client.searchAudio(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/audio/',
        expect.objectContaining({ duration_gte: 300 }), // 5 * 60
        expect.any(Object)
      );
    });

    test('should set stt_status based on has_transcript', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      await client.searchAudio({ has_transcript: true });
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/audio/',
        expect.objectContaining({ stt_status: 'COMPLETE' }),
        expect.any(Object)
      );

      makeApiRequest.mockClear();
      await client.searchAudio({ has_transcript: false });
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/audio/',
        expect.objectContaining({ stt_status: null }),
        expect.any(Object)
      );
    });
  });

  describe('getAudioDetails', () => {
    test('should get audio details successfully', async () => {
      const mockAudioData = { id: 123, case_name: 'Audio Case', duration: 3600, stt_status: 'COMPLETE', absolute_url: '/audio/123/' };
      makeApiRequest.mockResolvedValue(mockAudioData);

      const args = { audio_id: 123 };
      const result = await client.getAudioDetails(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        '/audio/123/',
        {},
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Audio Case');
      expect(JSON.parse(result.content[0].text).id).toBe(123);
      expect(JSON.parse(result.content[0].text).duration_formatted).toBe('60:00');
      expect(JSON.parse(result.content[0].text).has_transcript).toBe(true);
    });

    test('should throw error for invalid audio_id', async () => {
      await expect(client.getAudioDetails({ audio_id: 'abc' })).rejects.toThrow('Invalid audio_id. Must be a positive integer.');
      await expect(client.getAudioDetails({ audio_id: 0 })).rejects.toThrow('Invalid audio_id. Must be a positive integer.');
    });
  });

  describe('searchDockets', () => {
    test('should search dockets successfully', async () => {
      const mockResponse = {
        results: [{ id: 1, docket_number: '1:23-cv-00001', case_name: 'Docket Case', court: 'nysd' }],
        next: null
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { docket_number: '1:23-cv-00001', limit: 10 };
      const result = await client.searchDockets(args);

      expect(validateLimit).toHaveBeenCalledWith(10, 100);
      expect(makeApiRequest).toHaveBeenCalledWith(
        '/dockets/',
        expect.objectContaining({ docket_number: '1:23-cv-00001', limit: 10 }),
        expect.objectContaining({ apiType: 'courtlistener', rateLimiter: mockRateLimiter })
      );
      expect(result.content[0].text).toContain('Docket Case');
      expect(JSON.parse(result.content[0].text).count).toBe(1);
    });

    test('should call validateDate for date parameters', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { date_filed_after: '2022-01-01', date_filed_before: '2022-12-31' };
      await client.searchDockets(args);

      expect(validateDate).toHaveBeenCalledWith('2022-01-01', 'date_filed_after');
      expect(validateDate).toHaveBeenCalledWith('2022-12-31', 'date_filed_before');
    });

    test('should call validateCourtId for court parameter', async () => {
      const mockResponse = { results: [], next: null };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { court: 'nysd' };
      await client.searchDockets(args);

      expect(validateCourtId).toHaveBeenCalledWith('nysd');
    });
  });
});
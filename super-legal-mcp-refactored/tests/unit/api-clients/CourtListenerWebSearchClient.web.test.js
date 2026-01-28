/**
 * Comprehensive tests for CourtListenerWebSearchClient (Exa-only)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CourtListenerWebSearchClient } from '../../../src/api-clients/CourtListenerWebSearchClient.js';

global.fetch = jest.fn();

describe('CourtListenerWebSearchClient (web features)', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    process.env.EXA_API_KEY = 'test-exa-key';
    client = new CourtListenerWebSearchClient(mockRateLimiter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.EXA_API_KEY;
  });

  describe('getOpinionWithCitationsWeb', () => {
    test('parses cited-by and cites-to sections', async () => {
      const text = [
        'Some header',
        'Cited by',
        'See /opinion/1001/example and /opinion/1002/example',
        'Cites to',
        'See /opinion/2001/example'
      ].join('\n');
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'Smith v. Jones - CourtListener', url: 'https://www.courtlistener.com/opinion/9999/smith-v-jones/', text
      }] }) });

      const res = await client.getOpinionWithCitationsWeb({ opinion_id: 9999 });
      const data = JSON.parse(res.content[0].text);
      expect(data.opinion.id).toBe(9999);
      expect(data.citations.citing_this_opinion.map(x => x.opinion_id)).toEqual(expect.arrayContaining([1001, 1002]));
      expect(data.citations.cited_by_this_opinion.map(x => x.opinion_id)).toEqual(expect.arrayContaining([2001]));
    });
  });

  describe('searchDocketsWeb', () => {
    test('maps docket results and filters by filed date', async () => {
      const r1 = { title: 'Acme v. Doe - Docket - CourtListener', url: 'https://www.courtlistener.com/docket/12345/acme-v-doe/', text: 'Docket Number: 1:23-cv-00123\nCourt: nysd\nFiled: 2023-06-12' };
      const r2 = { title: 'Beta v. Roe - Docket - CourtListener', url: 'https://www.courtlistener.com/docket/67890/beta-v-roe/', text: 'Docket Number: 2:21-cv-00789\nCourt: cacd\nFiled: 2021-02-10' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [r1, r2] }) });

      const res = await client.searchDocketsWeb({ case_name: 'v.', date_filed_after: '2022-01-01' });
      const data = JSON.parse(res.content[0].text);
      expect(data.count).toBe(1);
      expect(data.dockets[0].id).toBe(12345);
      expect(data.dockets[0].docket_number).toBe('1:23-cv-00123');
    });
  });

  describe('audio web', () => {
    test('searchAudioWeb filters by min_duration and maps fields', async () => {
      const t1 = 'Case Name: Doe v. Roe\nArgued: 2023-03-01\nDuration: 1:20:00\nTranscript available';
      const t2 = 'Case Name: Foo v. Bar\nArgued: 2023-03-02\nDuration: 00:05:00';
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [
        { title: 'Doe v. Roe - Audio', url: 'https://www.courtlistener.com/audio/555/doe-v-roe/', text: t1 },
        { title: 'Foo v. Bar - Audio', url: 'https://www.courtlistener.com/audio/556/foo-v-bar/', text: t2 }
      ] }) });

      const res = await client.searchAudioWeb({ query: 'v.', min_duration: 30, has_transcript: true });
      const data = JSON.parse(res.content[0].text);
      expect(data.audio_files.length).toBe(1);
      expect(data.audio_files[0].id).toBe(555);
      expect(data.audio_files[0].has_transcript).toBe(true);
    });

    test('getAudioDetailsWeb maps single audio page', async () => {
      const text = 'Case Name: Roe v. Wade\nArgued: 1973-01-22\nDuration: 01:00:00\nTranscript';
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [
        { title: 'Roe v. Wade - Audio', url: 'https://www.courtlistener.com/audio/108/roe-v-wade/', text }
      ] }) });
      const res = await client.getAudioDetailsWeb({ audio_id: 108 });
      const data = JSON.parse(res.content[0].text);
      expect(data.id).toBe(108);
      expect(data.case_name).toMatch(/Roe/);
      expect(data.duration_seconds).toBe(3600);
    });
  });

  describe('judges web', () => {
    test('searchJudgesWeb maps judge summaries', async () => {
      const r = { title: 'Hon. Jane Smith - CourtListener', url: 'https://www.courtlistener.com/person/4321/jane-smith/', text: 'Position: Judge' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [r] }) });
      const res = await client.searchJudgesWeb({ name: 'Jane Smith', limit: 1 });
      const data = JSON.parse(res.content[0].text);
      expect(data.judges.length).toBe(1);
      expect(data.judges[0].id).toBe(4321);
      expect(data.judges[0].name).toMatch(/Jane Smith/);
    });

    test('getJudgeDetailsWeb maps details', async () => {
      const r = { title: 'Hon. John Doe - CourtListener', url: 'https://www.courtlistener.com/person/765/john-doe/', text: 'Born: 1950-01-01\nDied: 2020-12-31' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [r] }) });
      const res = await client.getJudgeDetailsWeb({ judge_id: 765 });
      const data = JSON.parse(res.content[0].text);
      expect(data.id).toBe(765);
      expect(data.name).toMatch(/John Doe/);
      expect(data.date_birth).toBe('1950-01-01');
      expect(data.date_death).toBe('2020-12-31');
    });
  });

  describe('courts web', () => {
    test('getCourtInfoWeb maps court info', async () => {
      const r = { title: 'United States Court of Appeals for the Ninth Circuit - CourtListener', url: 'https://www.courtlistener.com/court/ca9/', text: 'Short Name: 9th Cir.\nFull Name: United States Court of Appeals for the Ninth Circuit\nJurisdiction: Federal' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [r] }) });
      const res = await client.getCourtInfoWeb({ court_id: 'ca9' });
      const data = JSON.parse(res.content[0].text);
      expect(data.id).toBe('ca9');
      expect(data.short_name).toMatch(/9th Cir/);
      expect(data.full_name).toMatch(/Appeals/);
      expect(data.jurisdiction).toMatch(/Federal/);
    });

    test('listCourtsWeb maps multiple courts', async () => {
      const r1 = { title: 'United States Court of Appeals for the Ninth Circuit - CourtListener', url: 'https://www.courtlistener.com/court/ca9/' };
      const r2 = { title: 'United States Court of Appeals for the Second Circuit - CourtListener', url: 'https://www.courtlistener.com/court/ca2/' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [r1, r2] }) });
      const res = await client.listCourtsWeb({ jurisdiction: 'Federal', limit: 2 });
      const data = JSON.parse(res.content[0].text);
      expect(data.courts.length).toBe(2);
      expect(data.courts[0].id).toBe('ca9');
      expect(data.courts[1].id).toBe('ca2');
    });
  });

  describe('case details web', () => {
    test('getCaseDetailsWeb maps minimal details from opinion page', async () => {
      const text = 'Filed: 2021-07-01\nUnited States Court of Appeals for the Ninth Circuit';
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [
        { title: 'Acme v. Doe - CourtListener', url: 'https://www.courtlistener.com/opinion/2468/acme-v-doe/', text }
      ] }) });
      const res = await client.getCaseDetailsWeb({ case_id: 2468 });
      const data = JSON.parse(res.content[0].text);
      expect(data.id).toBe(2468);
      expect(data.case_name).toMatch(/Acme v. Doe/);
      expect(data.court).toMatch(/Appeals/);
      expect(data.date_filed).toBe('2021-07-01');
    });
  });
});



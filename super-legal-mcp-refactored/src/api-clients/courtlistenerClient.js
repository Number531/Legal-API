/**
 * CourtListener API Client
 * Handles all CourtListener and Financial Disclosure related API calls
 */

import { makeApiRequest, fetchAllPages } from '../utils/apiHelpers.js';
import { validateDate, validateCourtId, validateLimit } from '../utils/validation.js';

export class CourtListenerClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  // ===== CASE SEARCH METHODS =====

  async searchCases(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { 
      query, 
      court, 
      limit = 10, 
      date_filed_after, 
      date_filed_before,
      case_name,
      docket_number,
      citation,
      neutral_citation,
      fetch_all_pages = false
    } = args;

    // Validate inputs
    if (date_filed_after) validateDate(date_filed_after, 'date_filed_after');
    if (date_filed_before) validateDate(date_filed_before, 'date_filed_before');
    if (court) validateCourtId(court);
    
    const validatedLimit = validateLimit(limit, 100);

    const params = {
      q: query,
      type: 'o', // Opinion search
      order_by: 'score desc',
      limit: fetch_all_pages ? 20 : validatedLimit
    };

    if (court) params.court = court;
    if (date_filed_after) params.filed_after = date_filed_after;
    if (date_filed_before) params.filed_before = date_filed_before;
    if (case_name) params.case_name = case_name;
    if (docket_number) params.docket_number = docket_number;
    if (citation) params.citation = citation;
    if (neutral_citation) params.neutral_citation = neutral_citation;

    let results;
    
    if (fetch_all_pages) {
      results = await fetchAllPages('/search/', params, Math.ceil(validatedLimit / 20), 'courtlistener', this.rateLimiter);
      results = results.slice(0, validatedLimit);
    } else {
      const response = await makeApiRequest('/search/', params, { 
        apiType: 'courtlistener', 
        rateLimiter: this.rateLimiter 
      });
      results = response.results;
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: results.length,
          total_available: fetch_all_pages ? "Multiple pages fetched" : undefined,
          results: results.map((result) => ({
            id: result.id,
            case_name: result.case_name || result.caseName,
            court: result.court,
            date_filed: result.date_filed || result.dateFiled,
            citation: result.citation,
            absolute_url: result.absolute_url?.startsWith('http') 
              ? result.absolute_url 
              : `https://www.courtlistener.com${result.absolute_url}`,
            snippet: result.snippet
          }))
        }, null, 2)
      }]
    };
  }

  async getCaseDetails(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { case_id } = args;
    
    if (!Number.isInteger(case_id) || case_id < 1) {
      throw new Error("Invalid case_id. Must be a positive integer.");
    }

    const caseData = await makeApiRequest(`/clusters/${case_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: caseData.id,
          case_name: caseData.case_name,
          case_name_short: caseData.case_name_short,
          court: caseData.court,
          date_filed: caseData.date_filed,
          date_blocked: caseData.date_blocked,
          date_modified: caseData.date_modified,
          citation_count: caseData.citation_count,
          precedential_status: caseData.precedential_status,
          source: caseData.source,
          appeal_from: caseData.appeal_from,
          attorneys: caseData.attorneys,
          nature_of_suit: caseData.nature_of_suit,
          judges: caseData.judges,
          posture: caseData.posture,
          absolute_url: `https://www.courtlistener.com${caseData.absolute_url}`,
          resource_uri: caseData.resource_uri,
          opinions: caseData.opinions
        }, null, 2)
      }]
    };
  }

  async lookupCitation(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { citation } = args;
    
    // Search for the citation
    const searchResponse = await makeApiRequest('/search/', {
      q: citation,
      type: 'o',
      order_by: 'score desc',
      limit: 5
    }, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    if (searchResponse.results.length === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            message: "No cases found matching the citation",
            citation: citation
          }, null, 2)
        }]
      };
    }

    // Return the top matching result with details
    const topResult = searchResponse.results[0];
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          found: true,
          exact_match: topResult.citation === citation,
          case: {
            id: topResult.id,
            case_name: topResult.case_name || topResult.caseName,
            court: topResult.court,
            date_filed: topResult.date_filed || topResult.dateFiled,
            citation: topResult.citation,
            absolute_url: topResult.absolute_url?.startsWith('http') 
              ? topResult.absolute_url 
              : `https://www.courtlistener.com${topResult.absolute_url}`,
            snippet: topResult.snippet
          },
          alternative_results: searchResponse.results.slice(1).map((result) => ({
            case_name: result.case_name || result.caseName,
            citation: result.citation,
            court: result.court
          }))
        }, null, 2)
      }]
    };
  }

  // ===== JUDGE METHODS =====

  async searchJudges(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { 
      name, 
      court, 
      appointer, 
      selection_method, 
      political_affiliation,
      limit = 10,
      fetch_all_pages = false
    } = args;

    if (court) validateCourtId(court);
    const validatedLimit = validateLimit(limit, 100);

    const params = {
      name: name,
      limit: fetch_all_pages ? 20 : validatedLimit
    };

    if (court) params.court = court;
    if (appointer) params.appointer = appointer;
    if (selection_method) params.selection_method = selection_method;
    if (political_affiliation) params.political_affiliation = political_affiliation;

    let results;
    
    if (fetch_all_pages) {
      results = await fetchAllPages('/people/', params, Math.ceil(validatedLimit / 20), 'courtlistener', this.rateLimiter);
      results = results.slice(0, validatedLimit);
    } else {
      const response = await makeApiRequest('/people/', params, {
        apiType: 'courtlistener',
        rateLimiter: this.rateLimiter
      });
      results = response.results;
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: results.length,
          judges: results.map((judge) => ({
            id: judge.id,
            name: `${judge.name_first} ${judge.name_middle || ''} ${judge.name_last} ${judge.name_suffix || ''}`.trim(),
            name_full: judge.name_full,
            date_birth: judge.date_birth,
            date_death: judge.date_death,
            positions_count: judge.positions?.length || 0,
            absolute_url: `https://www.courtlistener.com${judge.absolute_url}`,
            aba_rating: judge.aba_rating
          }))
        }, null, 2)
      }]
    };
  }

  async getJudgeDetails(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { judge_id } = args;
    
    if (!Number.isInteger(judge_id) || judge_id < 1) {
      throw new Error("Invalid judge_id. Must be a positive integer.");
    }

    const judgeData = await makeApiRequest(`/people/${judge_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: judgeData.id,
          name: `${judgeData.name_first} ${judgeData.name_middle || ''} ${judgeData.name_last} ${judgeData.name_suffix || ''}`.trim(),
          name_full: judgeData.name_full,
          date_birth: judgeData.date_birth,
          date_death: judgeData.date_death,
          date_granularity_birth: judgeData.date_granularity_birth,
          date_granularity_death: judgeData.date_granularity_death,
          gender: judgeData.gender,
          race: judgeData.race,
          aba_rating: judgeData.aba_rating,
          political_affiliations: judgeData.political_affiliations,
          educations: judgeData.educations,
          positions: judgeData.positions?.map((pos) => ({
            id: pos.id,
            position_type: pos.position_type,
            court: pos.court,
            date_nominated: pos.date_nominated,
            date_elected: pos.date_elected,
            date_recess_appointment: pos.date_recess_appointment,
            date_start: pos.date_start,
            date_retirement: pos.date_retirement,
            date_termination: pos.date_termination,
            appointer: pos.appointer,
            judicial_committee_action: pos.judicial_committee_action,
            nomination_process: pos.nomination_process,
            selection_method: pos.selection_method,
            how_selected: pos.how_selected
          })),
          absolute_url: `https://www.courtlistener.com${judgeData.absolute_url}`
        }, null, 2)
      }]
    };
  }

  // ===== COURT METHODS =====

  async getCourtInfo(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { court_id } = args;
    
    validateCourtId(court_id);

    const courtData = await makeApiRequest(`/courts/${court_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: courtData.id,
          pacer_court_id: courtData.pacer_court_id,
          pacer_has_rss_feed: courtData.pacer_has_rss_feed,
          fjc_court_id: courtData.fjc_court_id,
          date_established: courtData.date_established,
          date_dissolved: courtData.date_dissolved,
          position: courtData.position,
          citation_string: courtData.citation_string,
          short_name: courtData.short_name,
          full_name: courtData.full_name,
          url: courtData.url,
          start_date: courtData.start_date,
          end_date: courtData.end_date,
          jurisdiction: courtData.jurisdiction,
          has_opinion_scraper: courtData.has_opinion_scraper,
          has_oral_argument_scraper: courtData.has_oral_argument_scraper,
          absolute_url: `https://www.courtlistener.com${courtData.absolute_url}`,
          resource_uri: courtData.resource_uri
        }, null, 2)
      }]
    };
  }

  async listCourts(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { jurisdiction, limit = 20, fetch_all = false } = args;
    
    const validatedLimit = validateLimit(limit, 300);

    const params = {
      limit: fetch_all ? 300 : validatedLimit
    };

    if (jurisdiction) params.jurisdiction = jurisdiction;

    const response = await makeApiRequest('/courts/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.results.length,
          courts: response.results.map((court) => ({
            id: court.id,
            short_name: court.short_name,
            full_name: court.full_name,
            jurisdiction: court.jurisdiction,
            citation_string: court.citation_string,
            in_use: court.in_use,
            has_opinion_scraper: court.has_opinion_scraper,
            has_oral_argument_scraper: court.has_oral_argument_scraper,
            position: court.position,
            start_date: court.start_date,
            end_date: court.end_date
          }))
        }, null, 2)
      }]
    };
  }

  // ===== OPINION METHODS =====

  async searchOpinions(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { query, type, per_curiam, status, sha1, limit = 10 } = args;
    
    const validatedLimit = validateLimit(limit, 100);

    const params = {
      limit: validatedLimit
    };

    if (query) params.text = query;
    if (type) params.type = type;
    if (per_curiam !== undefined) params.per_curiam = per_curiam;
    if (status) params.status = status;
    if (sha1) params.sha1 = sha1;

    const response = await makeApiRequest('/opinions/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.results.length,
          opinions: response.results.map((opinion) => ({
            id: opinion.id,
            author: opinion.author,
            author_str: opinion.author_str,
            per_curiam: opinion.per_curiam,
            joined_by: opinion.joined_by,
            type: opinion.type,
            status: opinion.status,
            sha1: opinion.sha1,
            date_created: opinion.date_created,
            date_modified: opinion.date_modified,
            absolute_url: `https://www.courtlistener.com${opinion.absolute_url}`,
            download_url: opinion.download_url,
            local_path: opinion.local_path,
            plain_text: opinion.plain_text ? opinion.plain_text.substring(0, 500) + '...' : null,
            html: opinion.html ? opinion.html.substring(0, 500) + '...' : null,
            html_lawbox: opinion.html_lawbox ? opinion.html_lawbox.substring(0, 500) + '...' : null,
            html_columbia: opinion.html_columbia ? opinion.html_columbia.substring(0, 500) + '...' : null,
            html_with_citations: opinion.html_with_citations ? opinion.html_with_citations.substring(0, 500) + '...' : null,
            extracted_by_ocr: opinion.extracted_by_ocr,
            cluster: opinion.cluster
          }))
        }, null, 2)
      }]
    };
  }

  async getOpinionWithCitations(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      opinion_id,
      include_citing_cases = true,
      include_cited_cases = true,
      citation_depth = 1
    } = args;

    if (!Number.isInteger(opinion_id) || opinion_id < 1) {
      throw new Error("Invalid opinion_id. Must be a positive integer.");
    }

    if (citation_depth < 1 || citation_depth > 3) {
      throw new Error("Citation depth must be between 1 and 3.");
    }

    // Get the opinion details
    const opinionData = await makeApiRequest(`/opinions/${opinion_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    const result = {
      opinion: {
        id: opinionData.id,
        author: opinionData.author_str,
        type: opinionData.type,
        status: opinionData.status,
        text: opinionData.plain_text,
        html: opinionData.html_with_citations,
        date_created: opinionData.date_created,
        cluster_id: opinionData.cluster,
        absolute_url: `https://www.courtlistener.com${opinionData.absolute_url}`
      },
      citations: {}
    };

    // Get citing cases if requested
    if (include_citing_cases) {
      try {
        const citingResponse = await makeApiRequest('/opinion-citations/', {
          cited_opinion: opinion_id,
          limit: 50
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        result.citations.citing_this_opinion = citingResponse.results.map((citation) => ({
          opinion_id: citation.citing_opinion,
          case_name: citation.citing_opinion_name,
          relationship: 'cites'
        }));
      } catch (error) {
        console.error('Error fetching citing cases:', error);
        result.citations.citing_this_opinion = [];
      }
    }

    // Get cited cases if requested
    if (include_cited_cases) {
      try {
        const citedResponse = await makeApiRequest('/opinion-citations/', {
          citing_opinion: opinion_id,
          limit: 50
        }, {
          apiType: 'courtlistener',
          rateLimiter: this.rateLimiter
        });
        
        result.citations.cited_by_this_opinion = citedResponse.results.map((citation) => ({
          opinion_id: citation.cited_opinion,
          case_name: citation.cited_opinion_name,
          relationship: 'cited'
        }));
      } catch (error) {
        console.error('Error fetching cited cases:', error);
        result.citations.cited_by_this_opinion = [];
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  // ===== AUDIO METHODS =====

  async searchAudio(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      query,
      judge_name,
      court,
      date_argued_after,
      date_argued_before,
      min_duration,
      has_transcript,
      limit = 10
    } = args;

    if (date_argued_after) validateDate(date_argued_after, 'date_argued_after');
    if (date_argued_before) validateDate(date_argued_before, 'date_argued_before');
    if (court) validateCourtId(court);
    
    const validatedLimit = validateLimit(limit, 50);

    const params = {
      limit: validatedLimit
    };

    if (query) params.q = query;
    if (judge_name) params.judge = judge_name;
    if (court) params.court = court;
    if (date_argued_after) params.argued_after = date_argued_after;
    if (date_argued_before) params.argued_before = date_argued_before;
    if (min_duration) params.duration_gte = min_duration * 60; // Convert to seconds
    if (has_transcript !== undefined) params.stt_status = has_transcript ? 'COMPLETE' : null;

    const response = await makeApiRequest('/audio/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.results.length,
          audio_files: response.results.map((audio) => ({
            id: audio.id,
            case_name: audio.case_name,
            court: audio.court,
            date_argued: audio.date_argued,
            duration_seconds: audio.duration,
            duration_minutes: Math.round(audio.duration / 60),
            panel_judges: audio.panel_judges,
            download_url: audio.download_url,
            has_transcript: audio.stt_status === 'COMPLETE',
            processing_complete: audio.processing_complete,
            file_hash_sha1: audio.sha1,
            absolute_url: `https://www.courtlistener.com${audio.absolute_url}`,
            transcript_preview: audio.stt_transcript ? 
              audio.stt_transcript.substring(0, 200) + '...' : null
          }))
        }, null, 2)
      }]
    };
  }

  async getAudioDetails(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { audio_id } = args;
    
    if (!Number.isInteger(audio_id) || audio_id < 1) {
      throw new Error("Invalid audio_id. Must be a positive integer.");
    }

    const audioData = await makeApiRequest(`/audio/${audio_id}/`, {}, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: audioData.id,
          case_name: audioData.case_name,
          case_name_short: audioData.case_name_short,
          court: audioData.court,
          docket: audioData.docket,
          date_argued: audioData.date_argued,
          date_reargued: audioData.date_reargued,
          date_created: audioData.date_created,
          date_modified: audioData.date_modified,
          duration: audioData.duration,
          duration_formatted: `${Math.floor(audioData.duration / 60)}:${(audioData.duration % 60).toString().padStart(2, '0')}`,
          judges: audioData.judges,
          panel_judges: audioData.panel,
          download_url: audioData.download_url,
          local_path: audioData.local_path,
          file_size_mp3: audioData.file_size_mp3,
          file_size_bytes: audioData.file_size_bytes,
          stt_status: audioData.stt_status,
          has_transcript: audioData.stt_status === 'COMPLETE',
          stt_transcript: audioData.stt_transcript,
          stt_google_response: audioData.stt_google_response,
          processing_complete: audioData.processing_complete,
          date_blocked: audioData.date_blocked,
          sha1: audioData.sha1,
          absolute_url: `https://www.courtlistener.com${audioData.absolute_url}`
        }, null, 2)
      }]
    };
  }

  // ===== DOCKET METHODS =====

  async searchDockets(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      case_name,
      party_name,
      docket_number,
      court,
      date_filed_after,
      date_filed_before,
      limit = 10
    } = args;

    if (date_filed_after) validateDate(date_filed_after, 'date_filed_after');
    if (date_filed_before) validateDate(date_filed_before, 'date_filed_before');
    if (court) validateCourtId(court);
    
    const validatedLimit = validateLimit(limit, 100);

    const params = {
      limit: validatedLimit
    };

    if (case_name) params.case_name = case_name;
    if (party_name) params.party_name = party_name;
    if (docket_number) params.docket_number = docket_number;
    if (court) params.court = court;
    if (date_filed_after) params.filed_after = date_filed_after;
    if (date_filed_before) params.filed_before = date_filed_before;

    const response = await makeApiRequest('/dockets/', params, {
      apiType: 'courtlistener',
      rateLimiter: this.rateLimiter
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          count: response.results.length,
          dockets: response.results.map((docket) => ({
            id: docket.id,
            docket_number: docket.docket_number,
            case_name: docket.case_name,
            court: docket.court,
            date_filed: docket.date_filed,
            date_last_filing: docket.date_last_filing,
            date_terminated: docket.date_terminated,
            status: docket.date_terminated ? 'terminated' : 'active',
            cause: docket.cause,
            nature_of_suit: docket.nature_of_suit,
            jury_demand: docket.jury_demand,
            absolute_url: `https://www.courtlistener.com${docket.absolute_url}`,
            pacer_url: docket.pacer_url
          }))
        }, null, 2)
      }]
    };
  }

  // ===== FINANCIAL DISCLOSURE METHODS =====
  // (These methods will be included in the next part due to length)
}
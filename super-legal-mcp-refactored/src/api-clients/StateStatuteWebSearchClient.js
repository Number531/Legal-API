/**
 * State Statute Web Search Client
 * Extends BaseWebSearchClient for enhanced state legislation searches
 * Replaces direct Exa implementation with standardized architecture
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { StateStatuteSchemas } from './schemas/StateStatuteSchemas.js';

export class StateStatuteWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    if (!this.exaApiKey) {
      console.warn('EXA_API_KEY not configured. State statute web search will not be available.');
    }

    // Preserve comprehensive state data configuration
    this.stateData = {
      'AL': { name: 'Alabama', domains: ['legislature.state.al.us', 'alisondb.legislature.state.al.us'] },
      'AK': { name: 'Alaska', domains: ['akleg.gov', 'www.akleg.gov'] },
      'AZ': { name: 'Arizona', domains: ['azleg.gov', 'www.azleg.gov'] },
      'AR': { name: 'Arkansas', domains: ['arkleg.state.ar.us', 'portal.arkansas.gov'] },
      'CA': { name: 'California', domains: ['leginfo.legislature.ca.gov', 'codes.findlaw.com'] },
      'CO': { name: 'Colorado', domains: ['leg.colorado.gov', 'law.colorado.gov'] },
      'CT': { name: 'Connecticut', domains: ['cga.ct.gov', 'www.cga.ct.gov'] },
      'DE': { name: 'Delaware', domains: ['delcode.delaware.gov'] },
      'FL': { name: 'Florida', domains: ['leg.state.fl.us', 'www.flsenate.gov'] },
      'GA': { name: 'Georgia', domains: ['legis.ga.gov', 'www.legis.ga.gov'] },
      'HI': { name: 'Hawaii', domains: ['capitol.hawaii.gov', 'www.capitol.hawaii.gov'] },
      'ID': { name: 'Idaho', domains: ['legislature.idaho.gov'] },
      'IL': { name: 'Illinois', domains: ['ilga.gov', 'www.ilga.gov'] },
      'IN': { name: 'Indiana', domains: ['iga.in.gov', 'www.in.gov'] },
      'IA': { name: 'Iowa', domains: ['legis.iowa.gov', 'www.legis.iowa.gov'] },
      'KS': { name: 'Kansas', domains: ['kslegislature.org', 'www.kslegislature.org', 'ksrevisor.org'] },
      'KY': { name: 'Kentucky', domains: ['legislature.ky.gov', 'www.lrc.ky.gov', 'apps.legislature.ky.gov'] },
      'LA': { name: 'Louisiana', domains: ['legis.la.gov', 'www.legis.la.gov'] },
      'ME': { name: 'Maine', domains: ['legislature.maine.gov', 'www.mainelegislature.org'] },
      'MD': { name: 'Maryland', domains: ['mgaleg.maryland.gov', 'mlis.state.md.us'] },
      'MA': { name: 'Massachusetts', domains: ['malegislature.gov', 'www.malegislature.gov'] },
      'MI': { name: 'Michigan', domains: ['legislature.mi.gov', 'www.legislature.mi.gov'] },
      'MN': { name: 'Minnesota', domains: ['revisor.mn.gov', 'www.revisor.mn.gov'] },
      'MS': { name: 'Mississippi', domains: ['billstatus.ls.state.ms.us', 'legislature.ms.gov'] },
      'MO': { name: 'Missouri', domains: ['revisor.mo.gov', 'www.moga.mo.gov'] },
      'MT': { name: 'Montana', domains: ['leg.mt.gov', 'laws.leg.mt.gov'] },
      'NE': { name: 'Nebraska', domains: ['nebraskalegislature.gov', 'www.nebraskalegislature.gov'] },
      'NV': { name: 'Nevada', domains: ['leg.state.nv.us', 'www.leg.state.nv.us'] },
      'NH': { name: 'New Hampshire', domains: ['gencourt.state.nh.us', 'www.gencourt.state.nh.us'] },
      'NJ': { name: 'New Jersey', domains: ['njleg.state.nj.us', 'www.njleg.state.nj.us', 'pub.njleg.gov'] },
      'NM': { name: 'New Mexico', domains: ['nmlegis.gov', 'www.nmlegis.gov', 'nmonesource.com'] },
      'NY': { name: 'New York', domains: ['nysenate.gov', 'assembly.state.ny.us', 'public.leginfo.state.ny.us'] },
      'NC': { name: 'North Carolina', domains: ['ncleg.gov', 'www.ncleg.gov'] },
      'ND': { name: 'North Dakota', domains: ['legis.nd.gov', 'www.legis.nd.gov', 'ndlegis.gov'] },
      'OH': { name: 'Ohio', domains: ['legislature.ohio.gov', 'codes.ohio.gov'] },
      'OK': { name: 'Oklahoma', domains: ['oklegislature.gov', 'www.oklegislature.gov', 'oscn.net'] },
      'OR': { name: 'Oregon', domains: ['oregonlegislature.gov', 'www.oregonlegislature.gov'] },
      'PA': { name: 'Pennsylvania', domains: ['legis.state.pa.us', 'www.legis.state.pa.us', 'palrb.gov'] },
      'RI': { name: 'Rhode Island', domains: ['webserver.rilin.state.ri.us', 'rilegislature.gov'] },
      'SC': { name: 'South Carolina', domains: ['scstatehouse.gov', 'www.scstatehouse.gov'] },
      'SD': { name: 'South Dakota', domains: ['sdlegislature.gov', 'legis.sd.gov'] },
      'TN': { name: 'Tennessee', domains: ['capitol.tn.gov', 'www.capitol.tn.gov'] },
      'TX': { name: 'Texas', domains: ['capitol.texas.gov', 'statutes.capitol.texas.gov'] },
      'UT': { name: 'Utah', domains: ['le.utah.gov', 'legislature.utah.gov'] },
      'VT': { name: 'Vermont', domains: ['legislature.vermont.gov'] },
      'VA': { name: 'Virginia', domains: ['lis.virginia.gov', 'law.lis.virginia.gov'] },
      'WA': { name: 'Washington', domains: ['leg.wa.gov', 'app.leg.wa.gov'] },
      'WV': { name: 'West Virginia', domains: ['legis.state.wv.us', 'www.legis.state.wv.us', 'code.wvlegislature.gov', 'wvlegislature.gov', 'www.wvlegislature.gov'] },
      'WI': { name: 'Wisconsin', domains: ['docs.legis.wisconsin.gov', 'legis.wisconsin.gov'] },
      'WY': { name: 'Wyoming', domains: ['legisweb.state.wy.us', 'wyoleg.gov'] },
      'DC': { name: 'District of Columbia', domains: ['dccouncil.us', 'code.dccouncil.us'] }
    };

    // Statute search enhancements - simplified for neural search
    this.statuteTypes = {
      'code': 'statute code',
      'bill': 'bill legislation',
      'resolution': 'resolution',
      'amendment': 'amendment',
      'regulation': 'regulation administrative'
    };

    // Subject area mappings - simplified for neural search
    this.subjectAreas = {
      'criminal': 'criminal penal',
      'civil': 'civil procedure',
      'business': 'business corporations',
      'family': 'family domestic relations',
      'property': 'property real estate',
      'tax': 'tax revenue',
      'education': 'education school',
      'health': 'health public health',
      'environmental': 'environmental natural resources',
      'employment': 'labor employment'
    };

    // Add confidence thresholds for permissive extraction
    this.confidenceLevels = {
      HIGH: 0.8,
      MEDIUM: 0.5,
      LOW: 0.2,
      MINIMAL: 0.1
    };

    // State-specific extraction patterns
    this.statePatterns = {
      statute_number: [
        /(?:§|Section|Sec\.?)\s*([\d.-]+)/i,
        /Title\s+(\d+)[,\s]+(?:Chapter|Ch\.?)\s+(\d+)/i,
        /(?:Chapter|Ch\.?)\s+(\d+)[,\s]+(?:Article|Art\.?)\s+(\d+)/i
      ],
      effective_date: [
        /Effective\s+(?:Date|on)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
        /Enacted[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
        /Approved[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
      ],
      last_amended: [
        /(?:Last\s+)?Amended[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4})/i,
        /(?:As\s+)?Amended\s+through[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4})/i
      ]
    };

    // Register State Statute schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(StateStatuteSchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }
  }

  /**
   * Create base statute result structure - never returns null
   * @param {Object} baseData - Base data to include
   * @returns {Object} Statute result structure
   */
  createStatuteResult(baseData = {}) {
    return {
      ...baseData,
      _extraction_metadata: {
        confidence: 0,
        source: null,
        extraction_method: null,
        attempted_patterns: [],
        successful_patterns: [],
        state_jurisdiction: null
      },
      _advisory_flags: [],
      _quality_score: 0
    };
  }

  /**
   * Search state statutes with BaseWebSearchClient enhancements
   * @param {Object} args
   * @param {string} args.state - Two-letter state code (e.g., 'PA', 'CA')
   * @param {string} args.query - Search query for statutes
   * @param {string} [args.statute_type] - Type of statute (code, bill, resolution, etc.)
   * @param {string} [args.subject_area] - Subject area (criminal, civil, business, etc.)
   * @param {string} [args.section_number] - Specific section number
   * @param {number} [args.year] - Year specification
   * @param {number} [args.limit=10] - Number of results (1-15)
   * @param {boolean} [args.include_text=false] - Include full text content
   * @param {boolean} [args.include_snippet=true] - Include smart snippet
   */
  async searchStateStatute(args) {
    if (!args || typeof args !== 'object') args = {};
    const {
      state,
      query,
      statute_type,
      subject_area,
      section_number,
      year,
      limit = 10,
      include_text = false,
      include_snippet = true
    } = args;

    // Enhanced validation with helpful guidance
    if (!state || typeof state !== 'string') {
      throw new Error('State code is required. Example: {state: "CA", query: "criminal procedure"}');
    }

    const stateUpper = state.toUpperCase();
    const stateInfo = this.stateData[stateUpper];
    if (!stateInfo) {
      const samples = Object.keys(this.stateData).slice(0, 8).join(', ');
      throw new Error(`Invalid state: ${state}. Available: ${samples}...`);
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required. Example: "criminal procedure", "family law", "business corporations"');
    }

    const validatedLimit = validateLimit(limit, 15);

    // Build enhanced search query
    const searchQuery = this.buildStatuteQuery({
      stateInfo,
      query: query.trim(),
      statute_type,
      subject_area,
      section_number,
      year
    });

    try {
      // Execute search using BaseWebSearchClient
      const results = await this.executeExaSearch(searchQuery, validatedLimit, {
        dataType: 'state_statute',
        domain: 'state_law',
        summaryQuery: this.generateStatuteHighlightQuery(query, subject_area, statute_type),
        numSentences: 7,
        includeDomains: stateInfo.domains,
        includeFullText: include_text
      });
      
      // Map results with state-specific processing using permissive approach
      const statutes = results
        .filter(r => this.isValidStatuteDomain(r.url, stateInfo.domains))
        .map(r => this.mapStatuteResultPermissive(r, stateUpper, include_text, include_snippet));
        // No .filter(Boolean) - all results pass through

      // Add quality assessment
      const qualityAssessment = this.assessStatuteResultQuality(statutes);

      // Sort by confidence but keep all results
      statutes.sort((a, b) =>
        (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            search_type: 'state_statute_web',
            state: stateInfo.name,
            state_code: stateUpper,
            query: query,
            search_query: searchQuery,
            total_results: statutes.length,
            quality_summary: qualityAssessment,
            statutes: statutes  // All results included
          }, null, 2)
        }]
      };

    } catch (error) {
      console.error(`State statute search failed for ${stateUpper}:`, error.message);
      throw error;
    }
  }

  // ===== Enhanced Helper Methods =====

  /**
   * Build state statute specific search query
   */
  buildStatuteQuery(params) {
    const { stateInfo, query, statute_type, subject_area, section_number, year } = params;

    // Start with state domain restriction
    let searchQuery = `(${stateInfo.domains.map(d => `site:${d}`).join(' OR ')})`;

    // Add the main query term
    searchQuery += ` "${query}"`;

    // Add statute type specificity
    if (statute_type && this.statuteTypes[statute_type]) {
      searchQuery += ` (${this.statuteTypes[statute_type]})`;
    }

    // Add subject area context
    if (subject_area && this.subjectAreas[subject_area]) {
      searchQuery += ` (${this.subjectAreas[subject_area]})`;
    }

    // Add section number if specified - simplified for better matching
    if (section_number) {
      searchQuery += ` "${section_number}"`;
    }

    // Add year specification
    if (year) {
      searchQuery += ` ${year}`;
    }

    return searchQuery.trim();
  }

  /**
   * Generate statute-specific highlight query - simplified for better relevance
   */
  generateStatuteHighlightQuery(query, subject_area, statute_type) {
    let highlights = query;

    // Add specific terms only if provided
    if (statute_type && this.statuteTypes[statute_type]) {
      highlights += ` ${this.statuteTypes[statute_type]}`;
    }

    if (subject_area && this.subjectAreas[subject_area]) {
      highlights += ` ${this.subjectAreas[subject_area]}`;
    }

    // Add only essential legal terms
    highlights += ' penalty violation enforcement';

    return highlights.trim();
  }

  /**
   * Validate result is from appropriate statute domain
   */
  isValidStatuteDomain(url, domains) {
    const urlLower = (url || '').toLowerCase();
    return domains.some(domain => urlLower.includes(domain.toLowerCase())) ||
           urlLower.includes('.gov') || urlLower.includes('legislature');
  }

  /**
   * Map statute search result with enhanced metadata
   */
  mapStatuteResult(result, state, includeText, includeSnippet) {
    // Use feature flag for gradual rollout
    if (process.env.STATE_STATUTE_PERMISSIVE_MODE === 'true') {
      return this.mapStatuteResultPermissive(result, state, includeText, includeSnippet);
    }

    // Legacy behavior for backwards compatibility
    if (!result || !result.title) return null;

    const mapped = {
      title: result.title,
      url: result.url,
      published_date: result.publishedDate || null,
      state: state,
      result_type: 'statute',
      metadata: this.extractStatuteMetadata(result, state),
      score: result.score || null
    };

    // Add content quality assessment
    const isHighlightMode = result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0;
    mapped._content_quality = {
      source: isHighlightMode ? 'highlights' : 'full_text',
      confidence: this.calculateExtractionConfidence(this.extractContentFromResult(result), 'statute'),
      highlight_count: isHighlightMode ? result.highlights.length : 0
    };

    // Add snippet extraction
    if (includeSnippet) {
      if (isHighlightMode) {
        mapped.snippet = this.extractSmartSnippetFromHighlights([result], 600);
      } else {
        mapped.snippet = this.extractSmartSnippet(this.extractContentFromResult(result), 600);
      }
    }

    if (includeText && result.text) {
      mapped.full_text = result.text;
    }

    return mapped;
  }

  /**
   * Map statute search result with permissive extraction - never returns null
   * @param {Object} result - Search result
   * @param {string} state - State code
   * @param {boolean} includeText - Include full text
   * @param {boolean} includeSnippet - Include snippet
   * @returns {Object} Always returns a statute structure
   */
  mapStatuteResultPermissive(result, state, includeText, includeSnippet) {
    // Always return base structure - never null
    const statuteResult = this.createStatuteResult({
      state: state || 'Unknown',
      title: result?.title || '',
      url: result?.url || '',
      published_date: result?.publishedDate || null,
      data_quality: {
        has_url: !!result?.url,
        has_title: !!result?.title,
        has_content: !!(result?.text || result?.highlights?.length),
        is_official_source: this.isOfficialStateSource(result?.url, state),
        confidence: 0
      },
      metadata: {},
      advisory_flags: []
    });

    // Assess input quality
    if (!result) {
      statuteResult._advisory_flags.push('no_result_data');
      statuteResult._extraction_metadata.confidence = 0.05;
      return statuteResult;
    }

    // Calculate confidence based on data availability
    let confidence = 0;
    if (result.url) confidence += 0.2;
    if (this.isOfficialStateSource(result.url, state)) confidence += 0.3;
    if (result.title) confidence += 0.2;
    if (result.highlights?.length > 0) confidence += 0.2;
    if (result.text) confidence += 0.1;

    statuteResult.data_quality.confidence = confidence;

    // Handle missing title gracefully
    if (!result.title) {
      statuteResult._advisory_flags.push('missing_title');
      // Try to extract title from content
      const extractedTitle = this.extractTitleFromContent(result);
      if (extractedTitle) {
        statuteResult.title = extractedTitle;
        statuteResult._extraction_metadata.successful_patterns.push('content_title_extraction');
        confidence += 0.1;
      } else {
        statuteResult.title = `${state} Statute (Untitled)`;
        statuteResult._advisory_flags.push('generated_title');
      }
    }

    // Add low confidence flag if needed
    if (confidence < 0.5) {
      statuteResult._advisory_flags.push('low_confidence');
    }

    // Extract statute metadata with confidence scoring
    const extractedMetadata = this.extractStatuteMetadataPermissive(result, state);
    statuteResult.metadata = extractedMetadata.data;
    statuteResult.extraction_confidence = extractedMetadata.confidence;

    // Map key fields
    statuteResult.statute_number = extractedMetadata.data.statute_number;
    statuteResult.chapter = extractedMetadata.data.chapter;
    statuteResult.section = extractedMetadata.data.section;
    statuteResult.effective_date = extractedMetadata.data.effective_date;
    statuteResult.last_amended = extractedMetadata.data.last_amended;

    // Add content based on parameters
    if (includeSnippet || !includeText) {
      statuteResult.snippet = this.extractStatuteSnippet(result);
    }
    if (includeText && result?.text) {
      statuteResult.full_text = result.text;
    }

    // Add highlight quality if available
    if (result?._highlight_quality) {
      statuteResult.highlight_quality = result._highlight_quality;
    }

    return statuteResult;  // ALWAYS returns a structure
  }

  /**
   * Extract statute-specific metadata
   */
  extractStatuteMetadata(result, state) {
    const metadata = { state };
    const text = this.extractContentFromResult(result);
    const url = result.url || '';

    // Extract statute citation
    const citation = text.match(/(\d+[\w\s]*§\s*[\d\.-]+)|([A-Z]+\s*Code\s*§\s*[\d\.-]+)/i);
    if (citation) {
      metadata.citation = citation[0];
    }

    // Extract chapter/title
    const chapter = text.match(/Chapter\s+(\d+[\w]*)/i) || text.match(/Title\s+(\d+[\w]*)/i);
    if (chapter) {
      metadata.chapter = chapter[1];
    }

    // Extract section number
    const section = text.match(/§\s*([\d\.-]+)/i) || text.match(/Section\s+([\d\.-]+)/i);
    if (section) {
      metadata.section = section[1];
    }

    // Extract effective date
    const effectiveDate = text.match(/effective\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
    if (effectiveDate) {
      metadata.effective_date = effectiveDate[1];
    }

    // Detect subject area
    const subjects = Object.keys(this.subjectAreas);
    for (const subject of subjects) {
      if (text.toLowerCase().includes(subject) || url.toLowerCase().includes(subject)) {
        metadata.subject_area = subject;
        break;
      }
    }

    return metadata;
  }

  /**
   * Extract statute metadata with permissive patterns and confidence scoring
   * @param {Object} result - Search result
   * @param {string} state - State code
   * @returns {Object} Extraction with data and confidence
   */
  extractStatuteMetadataPermissive(result, state) {
    const metadata = {};
    const confidenceFactors = [];
    const contentText = this.extractContentFromResult(result);
    const url = result?.url || '';

    // Statute number extraction with multiple patterns
    for (const pattern of this.statePatterns.statute_number) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.statute_number = match[0];
        metadata.statute_number_confidence =
          this.statePatterns.statute_number.indexOf(pattern) === 0 ? 1.0 : 0.8;
        confidenceFactors.push(metadata.statute_number_confidence);

        // Extract components if available
        if (match[1]) metadata.section = match[1];
        if (match[2]) metadata.chapter = match[2];
        break;
      }
    }

    // Title/Chapter extraction from URL patterns
    const urlPatterns = {
      california: /(?:code|codes)\/([a-z]+)\/(?:section|chapter)\/([0-9.-]+)/i,
      texas: /statutes\/docs\/([A-Z]{2})\/htm\/([A-Z]{2}\.\d+)/i,
      new_york: /(?:laws|law)\/([A-Z]{3})\/article\/(\d+)/i,
      florida: /statutes\/(\d{4})\/Chapters\/(\d+-\d+)\/Section\/([0-9.]+)/i,
      generic: /(?:title|chapter|ch|article|art)[^\d]*(\d+)/i
    };

    for (const [stateName, pattern] of Object.entries(urlPatterns)) {
      if (state?.toLowerCase().includes(stateName.replace('_', ' ')) || stateName === 'generic') {
        const match = url.match(pattern);
        if (match) {
          if (!metadata.statute_number) {
            metadata.statute_number = match[0];
            metadata.statute_number_confidence = 0.6;
            confidenceFactors.push(0.6);
          }
          metadata.url_structure = stateName;
          break;
        }
      }
    }

    // Effective date extraction
    for (const pattern of this.statePatterns.effective_date) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.effective_date = this.normalizeDate(match[1]);
        metadata.effective_date_confidence =
          this.statePatterns.effective_date.indexOf(pattern) === 0 ? 0.9 : 0.7;
        confidenceFactors.push(metadata.effective_date_confidence);
        break;
      }
    }

    // Last amended date extraction
    for (const pattern of this.statePatterns.last_amended) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.last_amended = this.normalizeDate(match[1]);
        metadata.last_amended_confidence = 0.8;
        confidenceFactors.push(0.8);
        break;
      }
    }

    // Legislative session extraction
    const sessionPattern = /(?:Regular|Special|Extraordinary)\s+Session\s+(\d{4})/i;
    const sessionMatch = contentText.match(sessionPattern);
    if (sessionMatch) {
      metadata.legislative_session = sessionMatch[0];
      metadata.session_year = sessionMatch[1];
      confidenceFactors.push(0.7);
    }

    // Bill/Act number extraction
    const billPatterns = [
      /(?:House|Senate|Assembly)\s+Bill\s+(?:No\.?\s*)?(\d+)/i,
      /(?:HB|SB|AB)\s*(\d+)/i,
      /Act\s+(?:No\.?\s*)?(\d+)\s+of\s+(\d{4})/i
    ];

    for (const pattern of billPatterns) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.bill_number = match[0];
        metadata.bill_number_confidence = 0.8;
        confidenceFactors.push(0.8);
        break;
      }
    }

    // Calculate overall confidence
    const overallConfidence = confidenceFactors.length > 0
      ? confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length
      : 0.3;  // Base confidence if no specific extractions

    return {
      data: metadata,
      confidence: overallConfidence,
      extraction_count: Object.keys(metadata).filter(k => !k.includes('_confidence')).length
    };
  }

  /**
   * Extract content from result (handles both highlights and text)
   */
  extractContentFromResult(result) {
    if (result.highlights && result.highlights.length > 0) {
      return result.highlights.join(' ');
    }
    return result.text || result.title || '';
  }

  /**
   * Extract smart snippet from full text
   */
  extractSmartSnippet(text, maxLength = 600) {
    // Always return something meaningful
    if (!text) {
      return '[No content available]';
    }

    if (text.length <= maxLength) {
      return text;
    }

    // Try to cut at sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('. ');

    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }

    return truncated + '...';
  }

  /**
   * Extract title from content when missing
   * @param {Object} result - Search result
   * @returns {string|null} Extracted title or null
   */
  extractTitleFromContent(result) {
    const contentText = this.extractContentFromResult(result);

    // Try to find title-like patterns
    const titlePatterns = [
      /^([A-Z][A-Z\s]+)$/m,  // All caps line
      /Title:\s*(.+)/i,       // Labeled title
      /Chapter\s+\d+[:\s]+(.+)/i,  // Chapter title
      /Article\s+\d+[:\s]+(.+)/i,  // Article title
      /Section\s+[\d.]+[:\s]+(.+)/i  // Section title
    ];

    for (const pattern of titlePatterns) {
      const match = contentText.match(pattern);
      if (match && match[1].length > 5 && match[1].length < 200) {
        return match[1].trim();
      }
    }

    // Fallback: Use first sentence if reasonable length
    const firstSentence = contentText.match(/^[^.!?]{10,150}[.!?]/);
    if (firstSentence) {
      return firstSentence[0].trim();
    }

    return null;
  }

  /**
   * Check if URL is from official state source
   * @param {string} url - URL to check
   * @param {string} state - State code
   * @returns {boolean} Whether source is official
   */
  isOfficialStateSource(url, state) {
    if (!url || !state) return false;

    const stateInfo = this.stateData[state.toUpperCase()];
    if (!stateInfo) return false;

    // Check against known official domains for this state
    const urlLower = url.toLowerCase();
    const isKnownDomain = stateInfo.domains.some(domain =>
      urlLower.includes(domain.toLowerCase())
    );

    // Also check for generic government indicators
    const isGovDomain = urlLower.includes('.gov') &&
      (urlLower.includes(state.toLowerCase()) ||
       urlLower.includes(stateInfo.name.toLowerCase()));

    return isKnownDomain || isGovDomain;
  }

  /**
   * Extract smart snippet for statute
   * @param {Object} result - Search result
   * @param {number} maxLength - Maximum snippet length
   * @returns {string} Extracted snippet
   */
  extractStatuteSnippet(result, maxLength = 800) {
    if (!result) return '';

    // Prioritize highlights if available
    if (result.highlights && result.highlights.length > 0) {
      return this.extractSmartSnippetFromHighlights(
        [result],
        maxLength
      );
    }

    // Fallback to text extraction
    const text = result.text || result.title || '';
    if (!text) return '';

    // Try to find the most relevant portion
    const relevantPatterns = [
      /(?:shall|must|may|prohibited|required|unlawful).{0,200}/gi,
      /(?:penalty|violation|misdemeanor|felony|fine).{0,200}/gi,
      /(?:Definition|Definitions|As used in).{0,300}/gi
    ];

    for (const pattern of relevantPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0].length >= 50) {
        return matches[0].substring(0, maxLength);
      }
    }

    // Default to beginning of text
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  /**
   * Normalize date formats
   * @param {string} dateStr - Date string to normalize
   * @returns {string|null} Normalized date or null
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Handle various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];  // YYYY-MM-DD format
      }

      // Handle year-only format
      if (/^\d{4}$/.test(dateStr)) {
        return `${dateStr}-01-01`;
      }

      return dateStr;  // Return as-is if can't parse
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Assess quality of statute result set
   * @param {Array} results - Array of statute results
   * @returns {Object} Quality assessment
   */
  assessStatuteResultQuality(results) {
    if (!results || results.length === 0) {
      return {
        total_results: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        official_source_coverage: '0%',
        statute_number_coverage: '0%',
        recommendation: 'No statutes to assess'
      };
    }

    const highConfidence = results.filter(r => r.data_quality?.confidence >= 0.8);
    const mediumConfidence = results.filter(r =>
      r.data_quality?.confidence >= 0.5 && r.data_quality?.confidence < 0.8
    );
    const lowConfidence = results.filter(r => r.data_quality?.confidence < 0.5);

    const officialSources = results.filter(r => r.data_quality?.is_official_source);
    const withStatuteNumbers = results.filter(r => r.metadata?.statute_number);
    const withDates = results.filter(r =>
      r.metadata?.effective_date || r.metadata?.last_amended
    );
    const withTitles = results.filter(r =>
      r.title && !r._advisory_flags?.includes('generated_title')
    );

    return {
      total_results: results.length,
      high_confidence: highConfidence.length,
      medium_confidence: mediumConfidence.length,
      low_confidence: lowConfidence.length,
      official_source_coverage: (officialSources.length / results.length * 100).toFixed(1) + '%',
      statute_number_coverage: (withStatuteNumbers.length / results.length * 100).toFixed(1) + '%',
      date_coverage: (withDates.length / results.length * 100).toFixed(1) + '%',
      title_coverage: (withTitles.length / results.length * 100).toFixed(1) + '%',
      recommendation: this.generateStatuteQualityRecommendation(results)
    };
  }

  /**
   * Generate quality recommendation for statute results
   * @param {Array} results - Array of statute results
   * @returns {string} Quality recommendation
   */
  generateStatuteQualityRecommendation(results) {
    const avgConfidence = results.reduce((sum, r) =>
      sum + (r.data_quality?.confidence || 0), 0
    ) / results.length;

    const officialPercentage = results.filter(r =>
      r.data_quality?.is_official_source
    ).length / results.length;

    if (avgConfidence >= 0.7 && officialPercentage >= 0.8) {
      return 'High quality results from official state sources';
    } else if (avgConfidence >= 0.5 && officialPercentage >= 0.5) {
      return 'Moderate quality - mix of official and secondary sources';
    } else if (avgConfidence >= 0.3) {
      return 'Low quality - verify statute details from official sources';
    } else {
      return 'Very low quality - consider using more specific search terms';
    }
  }
}
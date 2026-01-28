/**
 * FTC Web Search Client
 * Powered by Exa WebSearch API
 * 
 * Provides enhanced search capabilities for:
 * - Hart-Scott-Rodino (HSR) early termination notices
 * - FTC enforcement actions and consent orders
 * 
 * Features:
 * - Direct web content search via FTC.gov
 * - Smart snippet extraction with FTC-specific patterns
 * - Metadata extraction (case numbers, defendants, relief amounts)
 * - Enhanced filtering and date range support
 */

import { validateDate, validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { FTCSchemas } from './schemas/FTCSchemas.js';

export class FTCWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Register FTC schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(FTCSchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // FTC-specific configuration
    this.ftcDomains = ['ftc.gov'];
    this.enforcementTypes = ['consent order', 'complaint', 'settlement', 'administrative action'];
    this.hsrTerms = ['Hart-Scott-Rodino', 'early termination', 'premerger notification', 'HSR'];
    this.enforcementTerms = ['enforcement', 'complaint', 'consent order', 'settlement', 'settles', 'violation', 'penalty', 'fine', 'relief'];

    // Feature flag for permissive mode
    this.usePermissiveExtraction = process.env.FTC_PERMISSIVE_MODE !== 'false';

    // FTC-specific extraction patterns
    this.ftcPatterns = {
      caseNumber: [
        /case\s*(?:no\.?|number)?\s*(\d{3,4}-\d{3,4})/i,
        /matter\s*(?:no\.?|number)?\s*(\d{7,10})/i,
        /file\s*(?:no\.?|number)?\s*(\d{3}-\d{4})/i,
        /docket\s*(?:no\.?|number)?\s*(\d{4,5})/i
      ],
      docketNumber: [
        /docket\s*(?:no\.?|number)?\s*([A-Z]?\d{4,5})/i,
        /case\s*docket\s*(\d{4,5})/i,
        /administrative\s*docket\s*(?:no\.?)?\s*(\d{4,5})/i
      ],
      enforcementType: [
        /consent\s+order/i,
        /final\s+order/i,
        /administrative\s+complaint/i,
        /federal\s+court\s+complaint/i,
        /settlement/i,
        /civil\s+penalty/i
      ],
      competitionType: [
        /merger\s+review/i,
        /acquisition/i,
        /monopolization/i,
        /anticompetitive/i,
        /horizontal\s+agreement/i,
        /vertical\s+restraint/i
      ]
    };
  }

  /**
   * Create base FTC result structure
   */
  createFTCResult(resultType = 'general') {
    return {
      title: 'FTC Document',
      url: '',
      published_date: null,
      result_type: resultType,
      data_quality: {
        has_url: false,
        has_title: false,
        has_content: false,
        is_ftc_domain: false,
        confidence: 0
      },
      metadata: {
        case_number: null,
        docket_number: null,
        enforcement_type: null,
        competition_type: null,
        respondents: [],
        industries: [],
        remedies: []
      },
      advisory_flags: [],
      extraction_confidence: 0
    };
  }

  /**
   * Search FTC competition matters including antitrust cases, mergers, and HSR filings via FTC.gov
   */
  async searchCompetitionMattersWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      date_after,
      date_before,
      include_hsr = true,
      limit = 10,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    // Build consolidated competition/HSR query
    const query = this.buildCompetitionMattersQuery({ search, date_after, date_before, include_hsr });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_competition_matter',
      domain: 'antitrust',
      summaryQuery: 'antitrust competition merger acquisition HSR Hart-Scott-Rodino premerger notification monopoly market',
      numSentences: 4,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for competition matters with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_competition_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_competition_matters_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            date_after,
            date_before,
            include_hsr
          },
          results: filtered
        }, null, 2)
      }]
    };
  }

  /**
   * Search FTC enforcement actions, cases, and consent orders via FTC.gov
   */
  async searchEnforcementCasesWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      defendant_name,
      date_filed_after,
      date_filed_before,
      include_consent_orders = true,
      limit = 25,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_filed_after) validateDate(date_filed_after, 'date_filed_after');
    if (date_filed_before) validateDate(date_filed_before, 'date_filed_before');
    const validatedLimit = validateLimit(limit, 25);

    // Build consolidated enforcement/cases query
    const query = this.buildEnforcementCasesQuery({
      search,
      defendant_name,
      date_after: date_filed_after,
      date_before: date_filed_before,
      include_consent_orders
    });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_enforcement_case',
      domain: 'enforcement',
      summaryQuery: 'enforcement action complaint consent order settlement case proceeding violation penalty defendant',
      numSentences: 4,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for enforcement and cases with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_enforcement_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_enforcement_cases_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            defendant_name,
            date_filed_after,
            date_filed_before
          },
          results: filtered
        }, null, 2)
      }]
    };
  }

  /**
   * Build HSR-specific search query
   */
  buildHSRQuery({ date_after, date_before }) {
    let query = 'site:ftc.gov "Hart-Scott-Rodino" "early termination" ';
    query += '("premerger notification" OR "HSR Act" OR "waiting period") ';
    
    // Add date constraints if provided
    if (date_after || date_before) {
      query += `${date_after || '2020-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  /**
   * Build FTC-specific search queries with site restriction
   */
  buildFTCQuery(args) {
    const { search_type, defendant_name, date_after, date_before, include_consent_orders } = args;

    // Start with site restriction to FTC.gov
    let query = 'site:ftc.gov ';

    if (search_type === 'hsr_terminations') {
      // HSR early termination specific query
      query += '"Hart-Scott-Rodino" "early termination" ';
      query += '("premerger notification" OR "HSR Act" OR "waiting period") ';
      
      // Add date constraints if provided
      if (date_after || date_before) {
        query += `${date_after || '2020-01-01'}..${date_before || '2025-12-31'} `;
      }
      
    } else if (search_type === 'enforcement') {
      // Enforcement actions specific query
      query += 'enforcement ';
      
      // Add defendant name if provided
      if (defendant_name) {
        query += `"${defendant_name}" `;
      }
      
      // Add consent orders if requested
      if (include_consent_orders) {
        query += '("consent order" OR "consent agreement" OR "administrative complaint") ';
      }
      
      // Add general enforcement terms
      query += '(complaint OR settlement OR violation OR "civil penalty") ';
      
      // Add date constraints if provided
      if (date_after || date_before) {
        query += `${date_after || '2020-01-01'}..${date_before || '2025-12-31'} `;
      }
    }

    return query.trim();
  }


  /**
   * Check if URL is from FTC domain
   */
  isFTCDomain(url) {
    if (!url) return false;
    return this.ftcDomains.some(domain => url.toLowerCase().includes(domain));
  }

  /**
   * Map FTC result to standardized format
   */
  mapFTCResult(result, searchType, includeText = false, includeSnippet = false) {
    if (!result) return null;

    try {
      const mapped = {
        title: result.title || '',
        url: result.url || '',
        published_date: result.publishedDate || null
      };

      // Add type-specific metadata
      if (searchType === 'hsr_termination') {
        Object.assign(mapped, this.extractHSRMetadata(result));
      } else if (searchType === 'enforcement') {
        Object.assign(mapped, this.extractEnforcementMetadata(result));
      }

      // Add snippet if requested
      if (includeSnippet && (result.text || result.snippet)) {
        mapped.snippet = this.extractSmartSnippet(result.text || result.snippet, searchType);
      }

      // Add full text if requested
      if (includeText && result.text) {
        mapped.full_text = result.text;
      }

      return mapped;
    } catch (error) {
      console.warn('Error mapping FTC result:', error);
      return null;
    }
  }

  /**
   * Map FTC result to standardized format (Permissive Mode)
   * Always returns a structure, never null
   */
  mapFTCResultPermissive(result, searchType, includeText, includeSnippet) {
    // Always return a structure, never null
    const baseResult = this.createFTCResult(searchType);

    // Handle null/undefined input gracefully
    if (!result) {
      baseResult.advisory_flags.push('empty_result');
      baseResult.title = `FTC ${searchType.replace('_', ' ')} Result (No Data)`;
      return baseResult;
    }

    // Extract basic fields with fallbacks
    baseResult.url = result.url || '';
    baseResult.published_date = result.publishedDate || result.published_date || null;

    // Generate or extract title
    baseResult.title = this.extractFTCTitle(result, searchType);

    // Calculate confidence based on available data
    let confidence = 0;
    if (result.url) {
      baseResult.data_quality.has_url = true;
      confidence += 0.25;
    }
    if (result.title) {
      baseResult.data_quality.has_title = true;
      confidence += 0.20;
    }
    if (result.text || result.highlights?.length > 0) {
      baseResult.data_quality.has_content = true;
      confidence += 0.25;
    }
    if (this.isFTCDomain(result.url)) {
      baseResult.data_quality.is_ftc_domain = true;
      confidence += 0.30;
    }

    baseResult.data_quality.confidence = confidence;

    // Extract metadata with confidence scoring
    const metadataExtraction = this.extractFTCMetadataPermissive(result, searchType);
    baseResult.metadata = { ...baseResult.metadata, ...metadataExtraction.data };
    baseResult.extraction_confidence = metadataExtraction.confidence;

    // Add advisory flags based on quality
    if (!result.url) {
      baseResult.advisory_flags.push('missing_url');
    }
    if (!this.isFTCDomain(result.url)) {
      baseResult.advisory_flags.push('non_ftc_domain');
    }
    if (confidence < 0.5) {
      baseResult.advisory_flags.push('low_confidence');
    }
    if (!baseResult.metadata.case_number && searchType === 'enforcement') {
      baseResult.advisory_flags.push('case_number_not_extracted');
    }

    // Add content based on parameters
    if (includeSnippet || !includeText) {
      baseResult.snippet = this.extractFTCSnippet(result);
    }
    if (includeText && result.text) {
      baseResult.full_text = result.text;
    }

    return baseResult;
  }

  /**
   * Extract FTC title with fallbacks
   */
  extractFTCTitle(result, searchType) {
    // Priority 1: Use existing title
    if (result?.title) {
      return result.title;
    }

    // Priority 2: Extract from URL
    if (result?.url) {
      const urlTitle = this.extractTitleFromURL(result.url);
      if (urlTitle) return urlTitle;
    }

    // Priority 3: Extract from content
    if (result?.text || result?.highlights?.length > 0) {
      const contentTitle = this.extractTitleFromContent(result);
      if (contentTitle) return contentTitle;
    }

    // Priority 4: Generate contextual title
    return this.generateFTCTitle(result, searchType);
  }

  /**
   * Extract title from FTC URL patterns
   */
  extractTitleFromURL(url) {
    if (!url) return null;

    // Extract from FTC URL patterns
    const patterns = [
      /\/news-events\/news\/press-releases\/[\d\/]+\/(.+?)(?:\.html)?$/i,
      /\/legal-library\/browse\/cases-proceedings\/(.+?)$/i,
      /\/policy\/(.+?)$/i,
      /\/advice-guidance\/(.+?)$/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .trim();
      }
    }

    return null;
  }

  /**
   * Extract title from content
   */
  extractTitleFromContent(result) {
    const content = result?.text || result?.highlights?.[0] || '';
    if (!content) return null;

    // Look for title-like patterns in content
    const titlePatterns = [
      /^(.{1,100})/m, // First line, up to 100 chars
      /FTC\s+(.{1,80})/i, // Lines starting with FTC
      /In\s+the\s+Matter\s+of\s+(.{1,60})/i // Legal case format
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1].trim().length > 10) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Generate contextual FTC title
   */
  generateFTCTitle(result, searchType) {
    const typeMap = {
      'enforcement': 'FTC Enforcement Action',
      'competition': 'FTC Competition Matter',
      'guidance': 'FTC Guidance Document',
      'rulemaking': 'FTC Rulemaking',
      'news': 'FTC News Release',
      'alert': 'FTC Consumer Alert'
    };

    const baseTitle = typeMap[searchType] || 'FTC Document';

    // Add date if available
    if (result?.publishedDate) {
      const date = new Date(result.publishedDate).toLocaleDateString();
      return `${baseTitle} - ${date}`;
    }

    return baseTitle;
  }

  /**
   * Extract FTC snippet
   */
  extractFTCSnippet(result) {
    if (result?.highlights?.length > 0) {
      return result.highlights.join(' ').substring(0, 500);
    }
    if (result?.text) {
      return result.text.substring(0, 500);
    }
    return 'No content available';
  }

  /**
   * Extract FTC metadata with confidence scoring
   */
  extractFTCMetadataPermissive(result, searchType) {
    const metadata = {};
    let confidence = 0;
    let extractionCount = 0;
    let attemptCount = 0;

    const content = result?.text || result?.highlights?.join(' ') || '';

    // Extract case number with multiple patterns
    attemptCount++;
    const caseNumber = this.extractCaseNumberPermissive(content, result?.url);
    if (caseNumber.value) {
      metadata.case_number = caseNumber.value;
      metadata.case_number_confidence = caseNumber.confidence;
      confidence += caseNumber.confidence * 0.25;
      extractionCount++;
    }

    // Extract docket number
    attemptCount++;
    const docketNumber = this.extractDocketNumberPermissive(content, result?.url);
    if (docketNumber.value) {
      metadata.docket_number = docketNumber.value;
      metadata.docket_number_confidence = docketNumber.confidence;
      confidence += docketNumber.confidence * 0.25;
      extractionCount++;
    }

    // Extract enforcement type
    attemptCount++;
    const enforcementType = this.extractEnforcementType(content);
    if (enforcementType) {
      metadata.enforcement_type = enforcementType.value;
      metadata.enforcement_type_confidence = enforcementType.confidence;
      confidence += enforcementType.confidence * 0.15;
      extractionCount++;
    }

    // Extract respondents/companies
    attemptCount++;
    const respondents = this.extractRespondents(content);
    if (respondents.length > 0) {
      metadata.respondents = respondents;
      confidence += 0.15;
      extractionCount++;
    }

    // Extract industries
    attemptCount++;
    const industries = this.extractIndustries(content);
    if (industries.length > 0) {
      metadata.industries = industries;
      confidence += 0.10;
      extractionCount++;
    }

    // Extract remedies/penalties
    attemptCount++;
    const remedies = this.extractRemedies(content);
    if (remedies.length > 0) {
      metadata.remedies = remedies;
      confidence += 0.10;
      extractionCount++;
    }

    // Calculate final confidence
    if (attemptCount > 0) {
      confidence = confidence / attemptCount;
    }

    return {
      data: metadata,
      confidence: confidence,
      extraction_rate: extractionCount / attemptCount
    };
  }

  /**
   * Extract case number with permissive approach
   */
  extractCaseNumberPermissive(content, url) {
    // Never return null - always return structure
    const result = { value: null, confidence: 0, source: null };

    if (!content && !url) return result;

    // Try URL extraction first (highest confidence)
    if (url) {
      const urlMatch = url.match(/(\d{3,4}-\d{3,4}|\d{7,10})/);
      if (urlMatch) {
        result.value = urlMatch[1];
        result.confidence = 0.9;
        result.source = 'url';
        return result;
      }
    }

    // Try content patterns
    for (const pattern of this.ftcPatterns.caseNumber) {
      const match = content.match(pattern);
      if (match) {
        result.value = match[1];
        result.confidence = 0.7;
        result.source = 'content';
        return result;
      }
    }

    // Fallback: Look for any number pattern
    const fallbackMatch = content.match(/\b(\d{3,4}[-]\d{3,4})\b/);
    if (fallbackMatch) {
      result.value = fallbackMatch[1];
      result.confidence = 0.3;
      result.source = 'fallback';
    }

    return result;
  }

  /**
   * Extract docket number with permissive approach
   */
  extractDocketNumberPermissive(content, url) {
    const result = { value: null, confidence: 0, source: null };

    if (!content && !url) return result;

    // Try content patterns
    for (const pattern of this.ftcPatterns.docketNumber) {
      const match = content.match(pattern);
      if (match) {
        result.value = match[1];
        result.confidence = 0.8;
        result.source = 'content';
        return result;
      }
    }

    return result;
  }

  /**
   * Extract enforcement type
   */
  extractEnforcementType(content) {
    if (!content) return null;

    for (const pattern of this.ftcPatterns.enforcementType) {
      const match = content.match(pattern);
      if (match) {
        return {
          value: match[0],
          confidence: 0.8
        };
      }
    }

    return null;
  }

  /**
   * Extract respondents/companies
   */
  extractRespondents(content) {
    if (!content) return [];

    const respondents = [];
    const patterns = [
      /In\s+the\s+Matter\s+of\s+([A-Z][a-zA-Z\s&,.-]+?)(?:\s*,|\s*$)/gi,
      /([A-Z][a-zA-Z\s&,.-]+?)\s+settles/gi,
      /([A-Z][a-zA-Z\s&,.-]+?)\s+agrees/gi
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const respondent = match[1].trim();
        if (respondent.length > 2 && !respondents.includes(respondent)) {
          respondents.push(respondent);
        }
      }
    }

    return respondents.slice(0, 5); // Limit to 5 respondents
  }

  /**
   * Extract industries
   */
  extractIndustries(content) {
    if (!content) return [];

    const industryKeywords = [
      'technology', 'healthcare', 'pharmaceutical', 'financial', 'retail',
      'telecommunications', 'automotive', 'energy', 'agriculture', 'manufacturing'
    ];

    const industries = [];
    for (const keyword of industryKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        industries.push(keyword);
      }
    }

    return industries;
  }

  /**
   * Extract remedies/penalties
   */
  extractRemedies(content) {
    if (!content) return [];

    const remedies = [];
    const patterns = [
      /\$([0-9,]+(?:\.[0-9]{2})?)\s*(?:million|thousand)?/gi,
      /(cease\s+and\s+desist)/gi,
      /(civil\s+penalty)/gi,
      /(injunctive\s+relief)/gi,
      /(disgorgement)/gi
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const remedy = match[0].trim();
        if (!remedies.includes(remedy)) {
          remedies.push(remedy);
        }
      }
    }

    return remedies.slice(0, 10); // Limit to 10 remedies
  }

  /**
   * Extract HSR-specific metadata
   */
  extractHSRMetadata(result) {
    return {
      termination_date: this.extractHSRDate(result),
      companies: this.extractCompanies(result),
      transaction_value: this.extractTransactionValue(result),
      hsr_number: this.extractHSRNumber(result)
    };
  }

  /**
   * Extract enforcement-specific metadata
   */
  extractEnforcementMetadata(result) {
    return {
      case_number: this.extractCaseNumber(result),
      defendants: this.extractDefendants(result),
      violation_type: this.extractViolationType(result),
      relief_amount: this.extractReliefAmount(result),
      action_type: this.extractActionType(result)
    };
  }

  /**
   * Validate HSR termination result
   */
  isValidHSRResult(result) {
    if (!result.url || !result.url.includes('ftc.gov')) return false;
    
    const titleText = `${result.title || ''} ${result.text || ''}`.toLowerCase();
    return this.hsrTerms.some(term => titleText.includes(term.toLowerCase()));
  }

  /**
   * Validate enforcement action result
   */
  isValidEnforcementResult(result, includeConsentOrders = true) {
    if (!result.url || !result.url.includes('ftc.gov')) return false;
    
    const titleText = `${result.title || ''} ${result.text || ''}`.toLowerCase();
    
    // Check for enforcement terms
    const hasEnforcementTerm = this.enforcementTerms.some(term => 
      titleText.includes(term.toLowerCase())
    );
    
    return hasEnforcementTerm;
  }


  /**
   * Extract smart snippets with FTC-specific patterns
   */
  extractSmartSnippet(text, type = 'general', maxLength = 500) {
    if (!text || typeof text !== 'string') return '';

    // Clean the text
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // FTC-specific patterns based on document type
    let meaningfulSections = [];

    if (type === 'hsr') {
      meaningfulSections = [
        /early\s+termination[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /hart-scott-rodino[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /premerger\s+notification[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /transaction\s+description[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /companies\s+involved[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is
      ];
    } else if (type === 'enforcement') {
      meaningfulSections = [
        /complaint\s+summary[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /enforcement\s+action[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /consent\s+order[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /violation[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /relief[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /settlement[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is
      ];
    } else {
      // General FTC patterns
      meaningfulSections = [
        /summary[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /background[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /overview[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
        /purpose[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is
      ];
    }

    // Try to extract from meaningful sections
    for (const pattern of meaningfulSections) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        const snippet = match[1].trim();
        if (snippet.length >= 50) {
          return snippet.length > maxLength 
            ? snippet.substring(0, maxLength - 3) + '...'
            : snippet;
        }
      }
    }

    // Skip common boilerplate patterns
    const skipPatterns = [
      /^federal trade commission/i,
      /^for immediate release/i,
      /^contact:/i,
      /^news release/i,
      /^media contact/i,
      /^\s*\d+\s*$/
    ];

    // Find first meaningful paragraph
    const paragraphs = cleaned.split(/\n\n+/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      
      // Skip if matches boilerplate
      if (skipPatterns.some(p => p.test(trimmed))) continue;
      
      // Skip if too short
      if (trimmed.length < 50) continue;
      
      // Good paragraph found
      return trimmed.length > maxLength
        ? trimmed.substring(0, maxLength - 3) + '...'
        : trimmed;
    }

    // Fallback to beginning
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength - 3) + '...'
      : cleaned;
  }

  /**
   * Extract HSR termination date
   */
  extractHSRDate(result) {
    const text = result.text || result.title || '';
    const datePattern = /early\s+termination.*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i;
    const match = text.match(datePattern);
    return match ? match[1] : null;
  }

  /**
   * Extract companies involved in HSR transaction
   */
  extractCompanies(result) {
    const text = result.text || result.title || '';
    const companies = [];
    
    // Pattern 1: "COMPANIES INVOLVED: CompanyA and CompanyB"
    const involvedPattern = /COMPANIES INVOLVED:\s*([^\n]+)/i;
    let match = text.match(involvedPattern);
    if (match) {
      const companiesList = match[1].split(/\s+and\s+/i);
      companiesList.forEach(company => {
        const cleaned = company.trim().replace(/,$/, '');  // Only remove trailing comma, keep periods
        if (cleaned.length > 3 && cleaned.length < 100) {
          companies.push(cleaned);
        }
      });
    }
    
    // Pattern 2: Extract from title like "Microsoft Corporation and Activision Blizzard"
    if (companies.length === 0) {
      const titlePattern = /([A-Z][a-zA-Z\s&,.-]*(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.|\s+Corporation)?)\s+and\s+([A-Z][a-zA-Z\s&,.-]*(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.|\s+Corporation)?)/i;
      match = text.match(titlePattern);
      if (match) {
        companies.push(match[1].trim(), match[2].trim());
      }
    }
    
    // Pattern 3: Extract individual company names with common suffixes
    if (companies.length === 0) {
      const companyPattern = /([A-Z][a-zA-Z\s&,.-]+(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.|\s+Corporation))/g;
      let match;
      while ((match = companyPattern.exec(text)) !== null && companies.length < 5) {
        const company = match[1].trim();
        if (company.length > 3 && company.length < 100 && !companies.includes(company)) {
          companies.push(company);
        }
      }
    }
    
    return companies;
  }

  /**
   * Extract transaction value if mentioned
   */
  extractTransactionValue(result) {
    const text = result.text || result.title || '';
    const valuePattern = /\$\s*(\d+(?:\.\d+)?)\s*(billion|million|thousand)/i;
    const match = text.match(valuePattern);
    return match ? `$${match[1]} ${match[2].toLowerCase()}` : null;
  }

  /**
   * Extract HSR filing number
   */
  extractHSRNumber(result) {
    const text = result.text || result.title || '';
    
    // Pattern 1: "HSR-2023-015:" format
    const hsrPattern1 = /(HSR-\d{4}-\d{3})/i;
    let match = text.match(hsrPattern1);
    if (match) {
      return match[1].toUpperCase();
    }
    
    // Pattern 2: "HSR 2023 015" or similar loose format
    const hsrPattern2 = /HSR[\s-]*(\d{4})[\s-]*(\d{3})/i;
    match = text.match(hsrPattern2);
    if (match) {
      return `HSR-${match[1]}-${match[2]}`;
    }
    
    // Pattern 3: Simple "HSR" followed by numbers
    const hsrPattern3 = /(HSR|hsr)[\s-#]*(\d+)/i;
    match = text.match(hsrPattern3);
    if (match) {
      return `HSR-${match[2]}`;
    }
    
    return null;
  }

  /**
   * Extract FTC case number
   */
  extractCaseNumber(result) {
    const text = result.text || result.title || '';
    const casePatterns = [
      /CASE\s+NO\.?\s*([A-Z]?\d{1,4}-?\d{1,4})/i,
      /case\s+no\.?\s*([A-Z]?\d{1,4}-?\d{1,4})/i,
      /docket\s+no\.?\s*([A-Z]?\d{1,4}-?\d{1,4})/i,
      /file\s+no\.?\s*([A-Z]?\d{1,4}-?\d{1,4})/i,
      /matter\s+no\.?\s*([A-Z]?\d{1,4}-?\d{1,4})/i,
      // Handle simple formats like "C-4365"
      /\b([A-Z]-\d{4})\b/,
      // Handle formats with colon like "C-4365:"
      /([A-Z]-\d{4}):/
    ];
    
    for (const pattern of casePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  /**
   * Extract defendants/respondents
   */
  extractDefendants(result) {
    const text = result.text || result.title || '';
    const defendants = [];
    
    // Pattern 1: "DEFENDANTS: Facebook, Inc."
    const defendantsPattern = /DEFENDANTS:\s*([^\n(]+)/i;  // Stop at newline or opening paren
    let match = text.match(defendantsPattern);
    if (match) {
      const defendant = match[1].trim().replace(/,$/, '');  // Only remove trailing comma, keep periods
      if (defendant.length > 3 && defendant.length < 100) {
        defendants.push(defendant);
      }
    }
    
    // Pattern 2: Extract from title with "Against" or similar
    if (defendants.length === 0) {
      const againstPatterns = [
        /(?:against|defendant[s]?|respondent[s]?)[:\s]+([A-Z][a-zA-Z\s&,.-]+(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.)?)/i,
        /([A-Z][a-zA-Z\s&,.-]+(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.)?)\s+(?:violated|charged|settled)/i
      ];
      
      for (const pattern of againstPatterns) {
        match = text.match(pattern);
        if (match) {
          const defendant = match[1].trim();
          if (defendant.length > 3 && defendant.length < 100) {
            defendants.push(defendant);
            break;
          }
        }
      }
    }
    
    // Pattern 3: Extract company names from enforcement context
    if (defendants.length === 0) {
      const companyPattern = /([A-Z][a-zA-Z\s&,.-]+(?:\s+Inc\.|\s+LLC|\s+Corp\.|\s+Co\.|\s+Corporation))/;
      match = text.match(companyPattern);
      if (match) {
        const defendant = match[1].trim();
        if (defendant.length > 3 && defendant.length < 100) {
          defendants.push(defendant);
        }
      }
    }
    
    return defendants;
  }

  /**
   * Extract violation type
   */
  extractViolationType(result) {
    const text = result.text || result.title || '';
    const violationTypes = [
      'antitrust', 'privacy', 'consumer protection', 'deceptive practices',
      'unfair practices', 'merger', 'price fixing', 'monopolization',
      'data security', 'advertising', 'telemarketing', 'identity theft'
    ];
    
    for (const violation of violationTypes) {
      if (text.toLowerCase().includes(violation)) {
        return violation;
      }
    }
    
    return 'General violation';
  }

  /**
   * Extract relief amount (monetary penalty)
   */
  extractReliefAmount(result) {
    const text = result.text || result.title || '';
    const amountPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(million|billion|thousand)?/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s+dollars?/g
    ];
    
    const amounts = [];
    for (const pattern of amountPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null && amounts.length < 3) {
        amounts.push(match[2] ? `$${match[1]} ${match[2]}` : `$${match[1]}`);
      }
    }
    
    return amounts.length > 0 ? amounts : null;
  }

  /**
   * Extract action type (complaint, consent order, etc.)
   */
  extractActionType(result) {
    const text = result.text || result.title || '';
    const actionTypes = ['consent order', 'complaint', 'settlement', 'administrative action', 'civil penalty'];
    
    for (const actionType of actionTypes) {
      if (text.toLowerCase().includes(actionType)) {
        return actionType;
      }
    }
    
    return 'enforcement action';
  }

  /**
   * Search FTC guidance, policy statements, and business compliance resources via FTC.gov
   */
  async searchGuidancePolicyWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      date_after,
      date_before,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 20);

    // Build consolidated guidance/policy query
    const query = this.buildGuidancePolicyQuery({ search, date_after, date_before });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_guidance',
      domain: 'regulatory',
      summaryQuery: 'guidance policy statement advisory opinion business compliance best practices interpretation',
      numSentences: 5,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for guidance and policy with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_guidance_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_guidance_policy_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: filtered
        }, null, 2)
      }]
    };
  }


  /**
   * Search FTC rulemaking including proposed and final rules via FTC.gov
   */
  async searchRulemakingWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      date_after,
      date_before,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 20);

    // Build rulemaking-specific query
    const query = this.buildRulemakingQuery({ search, date_after, date_before });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_rulemaking',
      domain: 'regulatory',
      summaryQuery: 'rule rulemaking proposed final regulation standard requirement CFR Federal Register',
      numSentences: 5,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for rulemaking with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_rulemaking_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_rulemaking_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: filtered
        }, null, 2)
      }]
    };
  }


  /**
   * Search FTC news and press releases via web search
   */
  async searchNewsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      date_after,
      date_before,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 20);

    // Build news-specific query
    const query = this.buildNewsQuery({ search, date_after, date_before });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_news',
      domain: 'regulatory',
      summaryQuery: 'news press release announcement enforcement action settlement update',
      numSentences: 4,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for news with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_news_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_news_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: filtered
        }, null, 2)
      }]
    };
  }





  /**
   * Search FTC consumer alerts via web search
   */
  async searchConsumerAlertsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      date_after,
      date_before,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate date parameters
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 20);

    // Build consumer alerts-specific query
    const query = this.buildConsumerAlertsQuery({ search, date_after, date_before });

    // Use BaseWebSearchClient's executeExaSearch
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'ftc_consumer_alert',
      domain: 'consumer_protection',
      summaryQuery: 'alert warning scam fraud deception consumer protection safety',
      numSentences: 4,
      includeDomains: this.ftcDomains,
      includeFullText: include_text
    });

    // Filter and map results for consumer alerts with permissive extraction
    const filtered = results
      .filter(r => this.isFTCDomain(r.url))
      .map(r => this.mapFTCResultPermissive(r, 'ftc_consumer_web'));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'ftc_consumer_alerts_web',
          query: query,
          total_results: filtered.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: filtered
        }, null, 2)
      }]
    };
  }




  // New consolidated query builders
  buildEnforcementCasesQuery({ search, defendant_name, date_after, date_before, include_consent_orders }) {
    let query = 'site:ftc.gov ';
    query += '(inurl:"/enforcement" OR inurl:"/cases" OR inurl:"/legal-library") ';
    query += '("enforcement" OR "complaint" OR "case" OR "proceeding" OR "settlement") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (defendant_name) {
      query += `"${defendant_name}" `;
    }
    
    if (include_consent_orders) {
      query += '("consent order" OR "consent agreement" OR "administrative complaint") ';
    }
    
    query += '(violation OR "civil penalty" OR defendant OR respondent) ';
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildCompetitionMattersQuery({ search, date_after, date_before, include_hsr }) {
    let query = 'site:ftc.gov ';
    query += '("competition" OR "antitrust" OR "merger" OR "monopoly") ';
    
    if (include_hsr) {
      query += '("HSR" OR "Hart-Scott-Rodino" OR "premerger notification" OR "early termination") ';
    }
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildGuidancePolicyQuery({ search, date_after, date_before }) {
    let query = 'site:ftc.gov ';
    query += '(inurl:"/business-guidance" OR inurl:"/tips-advice" OR inurl:"/policy" OR inurl:"/advisory-opinions") ';
    query += '("guidance" OR "policy" OR "advisory opinion" OR "compliance" OR "best practices") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildRulemakingQuery({ search, date_after, date_before }) {
    let query = 'site:ftc.gov ';
    query += '(inurl:"/rules" OR inurl:"/rulemaking" OR inurl:"/legal-library/rules") ';
    query += '("rule" OR "rulemaking" OR "proposed" OR "final" OR "regulation") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildConsumerAlertsQuery({ search, date_after, date_before }) {
    let query = 'site:ftc.gov ';
    query += '(inurl:"/consumer-advice" OR inurl:"/news/alerts") ';
    query += '("alert" OR "warning" OR "scam" OR "fraud") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildNewsQuery({ search, date_after, date_before }) {
    let query = 'site:ftc.gov ';
    query += '(inurl:"/news" OR inurl:"/press-releases" OR inurl:"/events") ';
    query += '("news" OR "press release" OR "announcement" OR "event" OR "workshop") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  /**
   * Assess the quality of an FTC result and provide confidence scoring
   */
  assessFTCResultQuality(result, searchType) {
    const assessment = {
      confidence: 0,
      qualityScore: 0,
      issues: [],
      strengths: []
    };

    // Base confidence scoring
    let score = 0;
    let maxScore = 0;

    // Title quality (20 points max)
    maxScore += 20;
    if (result.case_name && result.case_name.trim().length > 0) {
      if (result.case_name !== 'Unknown FTC Document') {
        score += 20;
        assessment.strengths.push('Has meaningful case name');
      } else {
        score += 5;
        assessment.issues.push('Generic case name - extracted from URL/content');
      }
    } else {
      assessment.issues.push('Missing case name');
    }

    // URL quality (15 points max)
    maxScore += 15;
    if (result.absolute_url) {
      score += 15;
      assessment.strengths.push('Has valid URL');
    } else {
      assessment.issues.push('Missing URL');
    }

    // Content quality (25 points max)
    maxScore += 25;
    if (result.snippet && result.snippet.length > 100) {
      score += 25;
      assessment.strengths.push('Has substantial snippet content');
    } else if (result.snippet && result.snippet.length > 20) {
      score += 15;
      assessment.strengths.push('Has basic snippet content');
    } else {
      score += 5;
      assessment.issues.push('Limited or missing snippet content');
    }

    // Metadata quality (25 points max)
    maxScore += 25;
    let metadataScore = 0;
    if (result.case_number) {
      metadataScore += 8;
      assessment.strengths.push('Has case number');
    }
    if (result.docket_number) {
      metadataScore += 7;
      assessment.strengths.push('Has docket number');
    }
    if (result.enforcement_type && result.enforcement_type !== 'Unknown') {
      metadataScore += 5;
      assessment.strengths.push('Has enforcement type');
    }
    if (result.respondents && result.respondents.length > 0) {
      metadataScore += 5;
      assessment.strengths.push('Has respondent information');
    }
    score += metadataScore;

    // Search type specific adjustments (15 points max)
    maxScore += 15;
    if (searchType === 'ftc_enforcement_web') {
      if (result.enforcement_type || result.case_number) {
        score += 15;
        assessment.strengths.push('Contains enforcement-specific data');
      } else {
        score += 5;
        assessment.issues.push('Limited enforcement data for enforcement search');
      }
    } else if (searchType === 'ftc_consumer_web') {
      if (result.snippet && (result.snippet.includes('consumer') || result.snippet.includes('complaint'))) {
        score += 15;
        assessment.strengths.push('Contains consumer-related content');
      } else {
        score += 8;
        assessment.issues.push('Limited consumer context for consumer search');
      }
    } else {
      score += 10; // Default for other search types
    }

    // Calculate final scores
    assessment.confidence = Math.round((score / maxScore) * 100);
    assessment.qualityScore = score;

    // Add overall assessment
    if (assessment.confidence >= 85) {
      assessment.strengths.push('High quality result with comprehensive data');
    } else if (assessment.confidence >= 70) {
      assessment.strengths.push('Good quality result with most key data present');
    } else if (assessment.confidence >= 50) {
      assessment.issues.push('Moderate quality - some important data missing');
    } else {
      assessment.issues.push('Low quality - significant data gaps');
    }

    return assessment;
  }

  /**
   * Generate quality-based recommendations for FTC results
   */
  generateFTCQualityRecommendation(assessment, searchType) {
    const recommendations = [];

    // Confidence-based recommendations
    if (assessment.confidence < 50) {
      recommendations.push('Consider refining search query for better results');
      recommendations.push('Try alternative search terms or filters');
    } else if (assessment.confidence < 70) {
      recommendations.push('Result is usable but may benefit from additional verification');
    }

    // Issue-specific recommendations
    for (const issue of assessment.issues) {
      if (issue.includes('case name')) {
        recommendations.push('Case name may need manual review or correction');
      } else if (issue.includes('URL')) {
        recommendations.push('Source URL verification recommended');
      } else if (issue.includes('snippet')) {
        recommendations.push('Consider accessing full document for complete information');
      } else if (issue.includes('enforcement data')) {
        recommendations.push('Try more specific enforcement-related search terms');
      } else if (issue.includes('consumer context')) {
        recommendations.push('Add consumer-specific keywords to improve relevance');
      }
    }

    // Search type specific recommendations
    if (searchType === 'ftc_enforcement_web' && assessment.confidence < 75) {
      recommendations.push('For enforcement searches, include company names or case numbers');
    } else if (searchType === 'ftc_consumer_web' && assessment.confidence < 75) {
      recommendations.push('For consumer searches, include specific complaint types or industries');
    }

    // Positive reinforcement for high quality
    if (assessment.confidence >= 85) {
      recommendations.push('Excellent result quality - reliable for analysis');
    }

    return recommendations;
  }
}
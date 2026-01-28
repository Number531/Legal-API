/**
 * GovInfo Web Search Client
 * Powered by Exa WebSearch API
 * 
 * Provides enhanced search capabilities for:
 * - United States Code (USC) search by title, section, or keyword
 * - Specific USC section retrieval with full text
 * - USC title structure and organization
 * - Complete USC title directory
 * 
 * Features:
 * - Direct web content search via govinfo.gov and authoritative USC sources
 * - Smart snippet extraction with legal/statutory patterns
 * - Metadata extraction (USC citations, sections, amendments)
 * - Real-time content via liveCrawl
 * - Default limit of 5 for optimal token usage
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { GovInfoSchemas } from './schemas/GovInfoSchemas.js';
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';

export class GovInfoWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // GovInfo/USC-specific configuration
    this.domains = [
      'govinfo.gov',
      'uscode.house.gov', 
      'law.cornell.edu/uscode',
      'congress.gov',
      'constitution.congress.gov',
      'gpo.gov'
    ];
    
    // USC title mappings (1-54)
    this.uscTitles = {
      1: "General Provisions",
      2: "The Congress",
      3: "The President", 
      4: "Flag and Seal, Seat of Government, and the States",
      5: "Government Organization and Employees",
      6: "Domestic Security",
      7: "Agriculture",
      8: "Aliens and Nationality",
      9: "Arbitration",
      10: "Armed Forces",
      11: "Bankruptcy",
      12: "Banks and Banking",
      13: "Census",
      14: "Coast Guard",
      15: "Commerce and Trade",
      16: "Conservation",
      17: "Copyrights",
      18: "Crimes and Criminal Procedure",
      19: "Customs Duties",
      20: "Education",
      21: "Food and Drugs",
      22: "Foreign Relations and Intercourse",
      23: "Highways",
      24: "Hospitals and Asylums",
      25: "Indians",
      26: "Internal Revenue Code",
      27: "Intoxicating Liquors", 
      28: "Judiciary and Judicial Procedure",
      29: "Labor",
      30: "Mineral Lands and Mining",
      31: "Money and Finance",
      32: "National Guard",
      33: "Navigation and Navigable Waters",
      34: "Crime Control and Law Enforcement",
      35: "Patents",
      36: "Patriotic and National Observances",
      37: "Pay and Allowances of the Uniformed Services",
      38: "Veterans' Benefits",
      39: "Postal Service",
      40: "Public Buildings, Property, and Works",
      41: "Public Contracts",
      42: "The Public Health and Welfare",
      43: "Public Lands",
      44: "Public Printing and Documents",
      45: "Railroads",
      46: "Shipping",
      47: "Telecommunications",
      48: "Territories and Insular Possessions",
      49: "Transportation",
      50: "War and National Defense",
      51: "National and Commercial Space Programs",
      52: "Voting and Elections",
      53: "[Reserved]",
      54: "National Park Service"
    };
    
    // Legal/statutory terms for query enhancement
    this.legalTerms = [
      'section', 'subsection', 'chapter', 'title', 'USC', 'United States Code',
      'statute', 'law', 'legal', 'regulation', 'provision', 'definition',
      'requirement', 'prohibition', 'penalty', 'exception', 'effective',
      'amendment', 'enacted', 'codified', 'CFR'
    ];

    // Register GovInfo/USC schemas for structured data extraction
    // Use simplified schema for natural language queries (usc_search_result)
    if (this.contentStrategy) {
      // Register simplified schema for USC search results (optimized for natural language)
      this.contentStrategy.registerSchema('usc_search_result', GovInfoSchemas.usc_search_result_simple);

      // Register other schemas (excluding the complex USC search result schema)
      Object.entries(GovInfoSchemas).forEach(([dataType, schema]) => {
        if (dataType !== 'usc_search_result' && dataType !== 'usc_search_result_simple') {
          this.contentStrategy.registerSchema(dataType, schema);
        }
      });
    }

    // Feature flag for enhanced summary queries (default: OFF for safety)
    // Set ENHANCED_SUMMARY_QUERIES=true in environment to enable
    this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

    // Initialize SummaryQueryBuilder (only used if feature enabled)
    if (this.USE_ENHANCED_QUERIES) {
      this.summaryQueryBuilder = new SummaryQueryBuilder();
      console.log('[GovInfo] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts');
    } else {
      this.summaryQueryBuilder = null;
      console.log('[GovInfo] Enhanced summary queries DISABLED - using static keyword queries (default)');
    }
  }

  /**
   * Search United States Code by title, section, or keyword
   */
  async searchUSCodeWeb(args = {}) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      title,
      section,
      search_term,
      year = 2023,
      limit,
      include_text = false,
      include_snippet = false
    } = args;

    // Smart default limits - default to 5 for all types
    let finalLimit = limit !== undefined ? limit : 5;
    finalLimit = validateLimit(finalLimit, 100);

    // No validation required - buildUSCQuery provides smart fallbacks with "United States Code" context

    try {
      // Build USC-specific search query
      const query = this.buildUSCQuery({
        search_term,
        title,
        section,
        year
      });

      // Build summary query (enhanced or static based on feature flag)
      const baseTerms = 'USC United States Code section subsection statute law provision requirement';
      let summaryQuery = baseTerms;

      if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
        try {
          const userTerm = search_term || (title && `Title ${title}`) || 'United States Code';
          if (userTerm) {
            summaryQuery = this.summaryQueryBuilder.build({
              userSearchTerm: userTerm,
              dataType: 'usc_search_result',
              schema: GovInfoSchemas.USCSearchResultSchema || null,
              baseTerms: baseTerms
            });
          }
        } catch (error) {
          console.warn('[GovInfo] Enhanced query build failed for searchUSCodeWeb, using fallback:', error.message);
        }
      }

      // Execute Exa search with schema-based structured extraction
      const searchResults = await this.executeExaSearch(query, finalLimit, {
        dataType: 'usc_search_result',
        domain: 'legal_statute',
        summaryQuery: summaryQuery,
        numSentences: 5,
        includeDomains: this.domains,
        includeFullText: include_text
      });

      // Process and format results
      const processedResults = await this.processUSCResults(searchResults, {
        title,
        section,
        search_term,
        include_text,
        include_snippet
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            search_criteria: {
              title,
              section,
              search_term,
              year,
              include_text,
              include_snippet
            },
            count: processedResults.length,
            results: processedResults
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('USC search error:', error);
      throw new Error(`USC search failed: ${error.message}`);
    }
  }

  /**
   * Get specific section of United States Code
   */
  async getUSCSectionWeb(args = {}) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};
    
    const {
      title,
      section,
      year = 2023,
      format = 'json',
      include_text = true
    } = args;

    // Smart fallback for empty parameters - return popular USC sections
    if (!title || !section) {
      console.warn('[GovInfo WebSearch] Missing USC section parameters - using default Title 42 § 1983', {
        receivedTitle: title,
        receivedSection: section,
        allArgs: Object.keys(args)
      });
      const defaultTitle = 42; // Public Health and Welfare - most commonly searched
      const defaultSection = 1983; // Civil rights under color of law - highly relevant
      return this.getUSCSectionWeb({
        title: defaultTitle,
        section: defaultSection,
        year,
        format,
        include_text
      });
    }

    if (title < 1 || title > 54) {
      throw new Error('Invalid title number. Must be between 1 and 54');
    }

    try {
      // Build precise section query
      const titleName = this.uscTitles[title] || `Title ${title}`;
      const query = this.buildUSCSectionQuery(title, section, titleName);

      // Build summary query (enhanced or static based on feature flag)
      const baseTerms = 'USC United States Code section subsection statute text definition requirement';
      let summaryQuery = baseTerms;

      if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
        try {
          const userTerm = title && section ? `${title} USC ${section}` : 'United States Code section';
          if (userTerm) {
            summaryQuery = this.summaryQueryBuilder.build({
              userSearchTerm: userTerm,
              dataType: 'usc_section',
              schema: GovInfoSchemas.USCSectionSchema || null,
              baseTerms: baseTerms
            });
          }
        } catch (error) {
          console.warn('[GovInfo] Enhanced query build failed for getUSCSectionWeb, using fallback:', error.message);
        }
      }

      // Execute targeted search for the specific section with schema-based extraction
      const searchResults = await this.executeExaSearch(query, 5, {
        dataType: 'usc_section',
        domain: 'legal_statute',
        summaryQuery: summaryQuery,
        numSentences: 7,
        includeDomains: this.domains,
        includeFullText: include_text
      });

      // Process section-specific results
      const sectionResult = await this.processSectionResults(searchResults, {
        title,
        section,
        format,
        year
      });

      return {
        content: [{
          type: "text", 
          text: JSON.stringify(sectionResult, null, 2)
        }]
      };
    } catch (error) {
      console.error('Get USC section error:', error);
      throw new Error(`Failed to get USC section: ${error.message}`);
    }
  }

  /**
   * Get table of contents/structure for a USC title
   */
  async getUSCTitleStructureWeb(args = {}) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};
    
    const {
      title,
      year = 2023,
      include_chapters = true,
      include_sections = false
    } = args;

    // Smart fallback for empty parameters - return Title 42 structure (most commonly searched)
    if (!title) {
      const defaultTitle = 42; // Public Health and Welfare - comprehensive and commonly referenced
      return this.getUSCTitleStructureWeb({
        title: defaultTitle,
        year,
        include_chapters,
        include_sections
      });
    }

    if (title < 1 || title > 54) {
      throw new Error('Invalid title number. Must be between 1 and 54');
    }

    try {
      const titleName = this.uscTitles[title] || `Title ${title}`;
      
      // Build structure query focusing on table of contents
      const query = this.buildTitleStructureQuery(title, titleName);

      // Build summary query (enhanced or static based on feature flag)
      const baseTerms = 'USC title chapter structure table of contents organization';
      let summaryQuery = baseTerms;

      if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
        try {
          const userTerm = title ? `Title ${title} ${titleName || 'United States Code'}` : 'USC structure';
          if (userTerm) {
            summaryQuery = this.summaryQueryBuilder.build({
              userSearchTerm: userTerm,
              dataType: 'usc_title_structure',
              schema: GovInfoSchemas.USCTitleStructureSchema || null,
              baseTerms: baseTerms
            });
          }
        } catch (error) {
          console.warn('[GovInfo] Enhanced query build failed for getUSCTitleStructureWeb, using fallback:', error.message);
        }
      }

      // Execute search for structure information with schema-based extraction
      const searchResults = await this.executeExaSearch(query, 5, {
        dataType: 'usc_title_structure',
        domain: 'legal_statute',
        summaryQuery: summaryQuery,
        numSentences: 7,
        includeDomains: this.domains,
        includeFullText: true
      });

      // Process structure results
      const structure = await this.processTitleStructureResults(searchResults, {
        title,
        titleName,
        year,
        include_chapters,
        include_sections
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(structure, null, 2)
        }]
      };
    } catch (error) {
      console.error('Get USC title structure error:', error);
      throw new Error(`Failed to get USC title structure: ${error.message}`);
    }
  }

  /**
   * List all titles of the United States Code
   */
  async listUSCTitlesWeb(args = {}) {
    const {
      year = 2023,
      include_enacted = false,
      include_descriptions = true
    } = args;

    try {
      // For title listing, we can use our static mapping combined with live verification
      const titles = Object.entries(this.uscTitles).map(([number, name]) => {
        const titleInfo = {
          number: parseInt(number),
          name: name,
          package_id: `USCODE-${year}-title${number}`,
          available: number !== "53" // Title 53 is reserved
        };

        if (include_enacted) {
          // Static data about positive law enactment status
          const enactedTitles = [1, 3, 4, 5, 9, 10, 11, 13, 14, 17, 18, 23, 26, 28, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 44, 46, 49, 51, 54];
          titleInfo.enacted_positive_law = enactedTitles.includes(parseInt(number));
        }

        if (include_descriptions && name !== "[Reserved]") {
          titleInfo.description = `United States Code Title ${number}: ${name}`;
        }

        return titleInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            year: year,
            total_titles: titles.length,
            available_count: titles.filter(t => t.available).length,
            include_enacted,
            include_descriptions,
            titles: titles
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('List USC titles error:', error);
      throw new Error(`Failed to list USC titles: ${error.message}`);
    }
  }

  // Helper Methods

  /**
   * Build USC-specific search query
   */
  buildUSCQuery({ search_term, title, section, year }) {
    // NATURAL LANGUAGE APPROACH: Keep queries simple for Exa semantic search
    // Avoid exact phrases and operators - they break semantic matching
    // Based on Python working example: natural language works better than structured queries

    let query = search_term || '';

    // If specific title/section provided, include them naturally without exact phrases
    if (title && section) {
      query = `${query} USC Title ${title} Section ${section}`.trim();
    } else if (title) {
      query = `${query} USC Title ${title}`.trim();
    } else if (section) {
      query = `${query} USC Section ${section}`.trim();
    }

    // Add year if provided (naturally)
    if (year) {
      query = `${query} ${year}`.trim();
    }

    // If query is still empty, provide default
    if (!query) {
      query = 'United States Code recent provisions';
    }

    // NOTE: We do NOT add site: operators here
    // Domain filtering is handled via includeDomains parameter to avoid conflicts

    return query;
  }

  /**
   * Build precise USC section query
   */
  buildUSCSectionQuery(title, section, titleName) {
    return [
      `${title} USC ${section}`,
      `${title} U.S.C. § ${section}`,
      `Title ${title} section ${section}`,
      `"${titleName}"`,
      `United States Code`,
      section
    ].join(' ');
  }

  /**
   * Build title structure query
   */
  buildTitleStructureQuery(title, titleName) {
    return [
      `Title ${title}`,
      `"${titleName}"`,
      'table of contents',
      'chapter',
      'structure',
      'United States Code',
      'USC'
    ].join(' ');
  }




  /**
   * Process USC search results
   */
  async processUSCResults(searchResults, criteria) {
    if (!searchResults || !Array.isArray(searchResults)) return [];

    // ENHANCED: Parse expected citation for section validation
    const expected = this.parseUSCCitation(criteria.search_term);

    const processedResults = searchResults.map(result => {
      // PRIORITY 1: Try Exa schema extraction (from enhanced queries with ContentStrategy)
      // This leverages AI-powered extraction which is more flexible than regex
      let metadata = {
        uscCitation: null,
        titleNumber: null,
        sectionNumber: null,
        chapter: null,
        extractionMethod: null
      };

      // Check if Exa returned schema-extracted fields
      if (result.summary && typeof result.summary === 'object') {
        if (result.summary.usc_citation || result.summary.title_number) {
          metadata.uscCitation = result.summary.usc_citation || null;
          metadata.titleNumber = result.summary.title_number || null;
          metadata.sectionNumber = result.summary.section_number || null;
          metadata.chapter = result.summary.chapter || null;
          metadata.extractionMethod = 'exa_schema';
        }
      }

      // PRIORITY 2: Fallback to regex extraction if schema extraction failed
      // This maintains backward compatibility and handles cases where Exa schema extraction doesn't work
      if (!metadata.uscCitation && !metadata.titleNumber) {
        const regexMetadata = this.extractUSCMetadata(result);
        metadata.uscCitation = regexMetadata.uscCitation;
        metadata.titleNumber = regexMetadata.titleNumber;
        metadata.sectionNumber = regexMetadata.sectionNumber;
        metadata.chapter = regexMetadata.chapter;
        metadata.extractionMethod = 'regex_fallback';
      }

      // ENHANCED: Section validation (validate extracted section matches search intent)
      let sectionMatch = false;
      let titleMatch = false;
      let matchConfidence = 0.0;

      if (expected && expected.section) {
        // Validate section number match
        sectionMatch = metadata.sectionNumber === expected.section;
        if (sectionMatch) matchConfidence += 0.7;

        // Validate title number match (bonus points)
        if (expected.title && metadata.titleNumber === expected.title) {
          titleMatch = true;
          matchConfidence += 0.3;
        }
      } else {
        // No expected section - all results are valid, lower confidence
        matchConfidence = 0.5;
      }

      const processedResult = {
        id: result.id,
        title: result.title,
        url: result.url,
        published_date: result.publishedDate,
        usc_citation: metadata.uscCitation,
        title_number: metadata.titleNumber,
        section_number: metadata.sectionNumber,
        chapter: metadata.chapter,
        score: result.score,
        _extraction_method: metadata.extractionMethod,  // Debug info
        _section_match: sectionMatch,  // Debug: Does section match search?
        _title_match: titleMatch,  // Debug: Does title match search?
        _match_confidence: matchConfidence  // Match quality 0.0-1.0
      };

      if (criteria.include_snippet && result.snippet) {
        processedResult.snippet = result.snippet;
      }

      if (criteria.include_text && result.text) {
        processedResult.text = result.text;
        processedResult.text_length = result.text.length;
      }

      return processedResult;
    });

    // ENHANCED: Filter and sort results by section match
    // Keep exact matches + top 2 non-matches for context
    const exactMatches = processedResults.filter(r => r._section_match);
    const otherResults = processedResults
      .filter(r => !r._section_match)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 2);  // Keep top 2 non-matching results

    // If we have exact matches, prioritize them
    if (exactMatches.length > 0) {
      return [...exactMatches, ...otherResults].sort((a, b) => b._match_confidence - a._match_confidence);
    }

    // If no exact matches, return all sorted by confidence
    return processedResults.sort((a, b) => b._match_confidence - a._match_confidence);
  }

  /**
   * Process USC section results 
   */
  async processSectionResults(searchResults, criteria) {
    const { title, section, format, year } = criteria;

    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      throw new Error(`Section ${section} not found in Title ${title}`);
    }

    // Find the best match for the specific section
    const bestResult = searchResults[0];

    // PRIORITY 1: Try Exa schema extraction
    let metadata = {
      uscCitation: null,
      titleNumber: null,
      sectionNumber: null,
      extractionMethod: null
    };

    if (bestResult.summary && typeof bestResult.summary === 'object') {
      if (bestResult.summary.usc_citation || bestResult.summary.section_number) {
        metadata.uscCitation = bestResult.summary.usc_citation || null;
        metadata.titleNumber = bestResult.summary.title_number || null;
        metadata.sectionNumber = bestResult.summary.section_number || null;
        metadata.extractionMethod = 'exa_schema';
      }
    }

    // PRIORITY 2: Fallback to regex extraction
    if (!metadata.uscCitation) {
      const regexMetadata = this.extractUSCMetadata(bestResult);
      metadata = { ...regexMetadata, extractionMethod: 'regex_fallback' };
    }

    return {
      title: title,
      section: section,
      year: year,
      section_title: bestResult.title,
      usc_citation: metadata.uscCitation || `${title} U.S.C. § ${section}`,
      url: bestResult.url,
      published_date: bestResult.publishedDate,
      format: format,
      text: bestResult.text || 'Full text not available',
      metadata: metadata,
      _extraction_method: metadata.extractionMethod  // Debug info
    };
  }

  /**
   * Process title structure results
   */
  async processTitleStructureResults(searchResults, criteria) {
    const { title, titleName, year, include_chapters, include_sections } = criteria;

    const structure = {
      title_number: title,
      title_name: titleName,
      year: year,
      sources: [],
      chapters: include_chapters ? {} : undefined,
      sections: include_sections ? [] : undefined
    };

    if (searchResults && Array.isArray(searchResults)) {
      searchResults.forEach(result => {
        structure.sources.push({
          title: result.title,
          url: result.url,
          published_date: result.publishedDate
        });

        // Extract chapter/section info from content if available
        if (result.text && include_chapters) {
          const chapters = this.extractChapterInfo(result.text);
          Object.assign(structure.chapters, chapters);
        }
      });
    }

    return structure;
  }

  /**
   * Parse USC citation from search term (SEC-style preprocessing)
   * Extracts title and section numbers for precise searching
   * @param {string} search_term - User's search query
   * @returns {Object|null} Parsed citation or null if no citation found
   */
  parseUSCCitation(search_term) {
    if (!search_term) return null;

    // Pattern 1: Full citation - "42 USC 1983" or "42 U.S.C. § 1983"
    const fullCitationPatterns = [
      /(\d+)\s+USC\s+(?:§\s*)?(\d+[a-z]?)/i,
      /(\d+)\s+U\.?S\.?C\.?\s*§?\s*(\d+[a-z]?)/i,
      /Title\s+(\d+)[,\s]+Section\s+(\d+[a-z]?)/i
    ];

    for (const pattern of fullCitationPatterns) {
      const match = search_term.match(pattern);
      if (match) {
        return {
          title: parseInt(match[1]),
          section: match[2],
          hasExactCitation: true,
          confidence: 1.0,
          source: 'explicit_citation'
        };
      }
    }

    // Pattern 2: Section only - "section 1983" (needs title inference)
    const sectionMatch = search_term.match(/section\s+(\d+[a-z]?)/i);
    if (sectionMatch) {
      const inferredTitle = this.inferUSCTitle(search_term);
      return {
        title: inferredTitle,
        section: sectionMatch[1],
        hasExactCitation: false,
        confidence: 0.6,
        source: 'inferred_title',
        warning: `Inferred Title ${inferredTitle} from keywords - specify full citation for accuracy`
      };
    }

    return null;
  }

  /**
   * Infer USC title from keywords (for "section 1983" queries)
   * @param {string} keywords - Search keywords
   * @returns {number} Inferred title number
   */
  inferUSCTitle(keywords) {
    const lower = keywords.toLowerCase();

    // Common USC title patterns
    const titlePatterns = {
      42: ['civil rights', 'discrimination', 'color of law', '1983', 'public health', 'social security', 'clean air', 'clean water'],
      18: ['crimes', 'criminal', 'fraud', 'obstruction', 'conspiracy', 'murder', 'theft'],
      26: ['tax', 'internal revenue', 'irs', '501', 'exempt', 'deduction'],
      15: ['securities', 'ftc', 'commerce', 'consumer', 'antitrust'],
      29: ['labor', 'employment', 'erisa', 'wage', 'overtime', 'flsa'],
      7: ['agriculture', 'farm', 'food', 'usda'],
      20: ['education', 'school', 'student', 'title ix']
    };

    // Find best matching title
    for (const [title, patterns] of Object.entries(titlePatterns)) {
      if (patterns.some(pattern => lower.includes(pattern))) {
        return parseInt(title);
      }
    }

    // Default to Title 42 (most commonly searched - civil rights, public health)
    return 42;
  }

  /**
   * Assess USC result quality and precision
   * Provides metrics on section match rate, domain distribution, and overall quality
   * @param {Array} results - Processed USC search results
   * @param {Object} expected - Expected citation (from parseUSCCitation)
   * @returns {Object} Quality assessment metrics
   */
  assessUSCResultQuality(results, expected) {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return {
        total: 0,
        exact_section_matches: 0,
        govinfo_results: 0,
        cornell_results: 0,
        precision: '0.0%',
        avg_confidence: 0.0,
        message: 'No results to assess'
      };
    }

    // Count exact section matches
    const exactMatches = results.filter(r => r._section_match === true).length;

    // Count domain distribution
    const govInfoCount = results.filter(r => r.url?.includes('govinfo.gov')).length;
    const cornellCount = results.filter(r => r.url?.includes('cornell.edu')).length;
    const uscodeCount = results.filter(r => r.url?.includes('uscode.house.gov')).length;
    const otherCount = results.length - govInfoCount - cornellCount - uscodeCount;

    // Calculate average match confidence
    const avgConfidence = results.reduce((sum, r) => sum + (r._match_confidence || 0), 0) / results.length;

    // Calculate precision (exact matches / total)
    const precision = ((exactMatches / results.length) * 100).toFixed(1);

    return {
      total: results.length,
      exact_section_matches: exactMatches,
      title_matches: results.filter(r => r._title_match === true).length,
      govinfo_results: govInfoCount,
      cornell_results: cornellCount,
      uscode_results: uscodeCount,
      other_results: otherCount,
      precision: `${precision}%`,
      avg_confidence: parseFloat(avgConfidence.toFixed(2)),
      expected_section: expected ? `${expected.title} USC ${expected.section}` : 'Not specified',
      extraction_methods: {
        exa_schema: results.filter(r => r._extraction_method === 'exa_schema').length,
        regex_fallback: results.filter(r => r._extraction_method === 'regex_fallback').length
      }
    };
  }

  /**
   * Extract USC metadata from search result
   */
  extractUSCMetadata(result) {
    const title = result.title || '';
    const text = result.text || '';
    const url = result.url || '';
    
    const metadata = {
      uscCitation: null,
      titleNumber: null,
      sectionNumber: null,
      chapter: null,
      effectiveDate: null
    };

    // Extract USC citation patterns
    const citationPatterns = [
      /(\d+)\s+U\.?S\.?C\.?\s*§?\s*(\d+[a-z]?)/gi,
      /Title\s+(\d+)[,\s]+Section\s+(\d+[a-z]?)/gi,
      /(\d+)\s+USC\s+(\d+[a-z]?)/gi
    ];

    for (const pattern of citationPatterns) {
      const match = (title + ' ' + text).match(pattern);
      if (match) {
        const fullMatch = match[0];
        const parts = fullMatch.match(/(\d+).*?(\d+[a-z]?)/i);
        if (parts) {
          metadata.titleNumber = parseInt(parts[1]);
          metadata.sectionNumber = parts[2];
          metadata.uscCitation = fullMatch;
          break;
        }
      }
    }

    // Extract chapter information
    const chapterMatch = (title + ' ' + text).match(/Chapter\s+(\d+)/i);
    if (chapterMatch) {
      metadata.chapter = parseInt(chapterMatch[1]);
    }

    return metadata;
  }

  /**
   * Extract chapter information from content
   */
  extractChapterInfo(text) {
    const chapters = {};
    const chapterMatches = text.match(/Chapter\s+(\d+)[:\-\s]*(.*?)(?=Chapter|\n\n|$)/gi);
    
    if (chapterMatches) {
      chapterMatches.forEach(match => {
        const parts = match.match(/Chapter\s+(\d+)[:\-\s]*(.*)/i);
        if (parts) {
          const chapterNum = parseInt(parts[1]);
          const chapterTitle = parts[2] ? parts[2].trim().split('\n')[0] : '';
          chapters[chapterNum] = {
            title: chapterTitle,
            number: chapterNum
          };
        }
      });
    }

    return chapters;
  }
}
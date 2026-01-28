/**
 * EPA Web Search Client (Schema-Based)
 * Replaces ECHO API by querying official EPA domains using schema-based extraction.
 * Uses structured data extraction with EPA-specific schemas.
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { EPASchemas } from './schemas/EPASchemas.js';
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';

export class EPAWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Register EPA schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(EPASchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    this.domain = 'environmental';

    // Feature flag for enhanced summary queries (default: OFF for safety)
    // Set ENHANCED_SUMMARY_QUERIES=true in environment to enable
    this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

    // Initialize SummaryQueryBuilder (only used if feature enabled)
    if (this.USE_ENHANCED_QUERIES) {
      this.summaryQueryBuilder = new SummaryQueryBuilder();
      console.log('[EPA] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts');
    } else {
      this.summaryQueryBuilder = null;
      console.log('[EPA] Enhanced summary queries DISABLED - using static keyword queries (default)');
    }
  }

  /**
   * Search EPA facilities via Exa with schema-based extraction
   * Mirrors shape of EPAComplianceClient.searchFacilities output
   */
  async searchFacilitiesWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const {
      facility_name,
      company_name,
      city,
      state,
      zip_code,
      compliance_status,
      violations_last_3_years,
      limit = 3,
      include_full_text = false
    } = args;

    // Validate that at least one location/identifier is provided
    // company_name alone is too broad - requires state to narrow results
    const hasLocationOrIdentifier = facility_name || city || zip_code || (company_name && state);
    if (!hasLocationOrIdentifier) {
      // Provide specific guidance based on what was provided
      if (company_name && !state) {
        throw new Error(
          `company_name "${company_name}" requires a state parameter for targeted EPA searches. ` +
          `Example: search_epa_facilities({ company_name: "${company_name}", state: "NJ" }). ` +
          'Common BMS facility states: NJ (New Brunswick), NY, IN (Mount Vernon), PR (Humacao).'
        );
      }
      throw new Error(
        'At least one location identifier required: facility_name, city, zip_code, or (company_name + state). ' +
        'Example: search_epa_facilities({ state: "NJ", city: "New Brunswick" }) or ' +
        'search_epa_facilities({ company_name: "Bristol-Myers Squibb", state: "NJ" }). ' +
        'Tip: For company searches, always include the state where facilities are located.'
      );
    }

    const validatedLimit = validateLimit(limit, 10);

    // Build domain-targeted query with wildcard subdomain support
    // Using site:epa.gov instead of site:www.epa.gov allows finding ECHO and other EPA subdomain pages
    let query = 'site:epa.gov ';
    if (facility_name) query += `"${facility_name}" `;
    if (company_name) query += `"${company_name}" `;
    if (city) query += `"${city}" `;
    if (state) query += `"${state}" `;
    if (zip_code) query += `"${zip_code}" `;
    if (compliance_status === 'violation') query += ' ("noncompliance" OR "violations") ';
    if (violations_last_3_years) query += ' ("last 12 quarters" OR "12 quarters") ';

    // Add fallback keywords to improve search quality when specific terms are provided
    // These help guide the search toward facility-related pages
    query += ' facility compliance';

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'compliance status violations penalties enforcement noncompliance quarters facility emissions permit NPDES';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        // Extract user's search term from most specific to least specific
        const userTerm = facility_name || company_name || `${city || ''} ${state || ''}`.trim();
        if (userTerm) {
          summaryQuery = this.summaryQueryBuilder.build({
            userSearchTerm: userTerm,
            dataType: 'epa_facility',
            schema: EPASchemas.epa_facility || null,
            baseTerms: baseTerms
          });
        }
      } catch (error) {
        console.warn('[EPA] Enhanced query build failed for searchFacilitiesWeb, using fallback:', error.message);
      }
    }

    const results = await this.executeExaSearch(query.trim(), validatedLimit, {
      dataType: 'epa_facility',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 6,
      includeDomains: ['epa.gov'],  // Wildcard to include all EPA subdomains (www, echo, enviro, etc.)
      includeFullText: include_full_text
    });

    // Map to facility summary using highlights
    const facilities = results
      .filter(r => (r.url || '').includes('epa.gov'))
      .map(r => this.mapFacilityFromHighlights(r, include_full_text));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          facilities,
          total_facilities: facilities.length,
          query_id: null,
          high_priority_violators: facilities.filter(f => f.compliance?.current_status?.toLowerCase?.().includes('high priority')).length
        }, null, 2)
      }]
    };
  }

  /**
   * Get compliance report via Exa using schema-based extraction
   * Mirrors shape of EPAComplianceClient.getFacilityComplianceReport output
   */
  async getFacilityComplianceReportWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { facility_id, include_violations = true, include_enforcement = true, include_full_text = false } = args;
    if (!facility_id) {
      throw new Error(
        'facility_id is required for EPA compliance reports. ' +
        'Example: get_epa_facility_compliance_report({ facility_id: "110070688053" }). ' +
        'Tip: Get facility_id from search_epa_facilities results first.'
      );
    }

    // Search for Detailed Facility Report or facility page mentioning this ID
    const query = `site:www.epa.gov ("p_id=${facility_id}" OR "FRSID ${facility_id}" OR "Registry ID ${facility_id}")`;

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'facility name registry ID compliance status violations enforcement actions penalties quarters noncompliance';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: facility_id,
          dataType: 'epa_compliance',
          schema: EPASchemas.epa_compliance || null,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[EPA] Enhanced query build failed for getFacilityComplianceReportWeb, using fallback:', error.message);
      }
    }

    const results = await this.executeExaSearch(query, 5, {
      dataType: 'epa_compliance',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 8,
      includeDomains: ['www.epa.gov'],
      includeFullText: true
    });

    const top = results.find(r => (r.url || '').includes('epa.gov')) || results[0];
    if (!top) {
      return { content: [{ type: 'text', text: JSON.stringify({ facility: {}, compliance_summary: {}, three_year_compliance: [], violations: [], enforcement_actions: [] }, null, 2) }] };
    }

    const contentText = this.extractContentFromResult(top);
    const report = {
      facility: this.extractFacilityFromHighlights(top, include_full_text),
      compliance_summary: this.extractComplianceFromHighlights(top),
      three_year_compliance: this.extractThreeYearFromHighlights(top)
    };

    if (include_violations) report.violations = this.extractViolationsFromHighlights(top);
    if (include_enforcement) report.enforcement_actions = this.extractEnforcementFromHighlights(top);

    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
  }

  /**
   * Search violations via Exa with schema-based extraction and filter client-side
   * Mirrors shape of EPAComplianceClient.searchViolations output
   */
  async searchViolationsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { facility_id, program, date_after, date_before, limit = 15 } = args;
    if (!facility_id) {
      throw new Error(
        'facility_id is required for EPA violation searches. ' +
        'Example: search_epa_violations({ facility_id: "110070688053", program: "CAA" }). ' +
        'Tip: Get facility_id from search_epa_facilities results first, then search violations.'
      );
    }

    const query = `site:echo.epa.gov ("p_id=${facility_id}" OR "FRSID ${facility_id}" OR "Registry ID ${facility_id}")`;

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'violations program date enforcement actions penalties description clean air clean water RCRA SDWA';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: facility_id,
          dataType: 'epa_violation',
          schema: EPASchemas.epa_violation || null,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[EPA] Enhanced query build failed for searchViolationsWeb, using fallback:', error.message);
      }
    }

    const results = await this.executeExaSearch(query, 5, {
      dataType: 'epa_violation',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 7,
      includeDomains: ['echo.epa.gov', 'www.epa.gov'],
      includeFullText: false
    });

    const top = results.find(r => (r.url || '').includes('echo.epa.gov')) || results[0];
    const violationsAll = this.extractViolationsFromHighlights(top);

    let violations = violationsAll;
    if (program) {
      const p = String(program).toUpperCase();
      violations = violations.filter(v => (v.Program || '').toUpperCase().includes(p));
    }
    if (date_after) violations = violations.filter(v => !v.Date || v.Date >= date_after);
    if (date_before) violations = violations.filter(v => !v.Date || v.Date <= date_before);

    const max = Math.min(Number(limit) || 200, violations.length);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ facility_id, count: max, results: violations.slice(0, max) }, null, 2)
      }]
    };
  }

  // ===== Enhanced Mapping Methods using Highlights =====

  /**
   * Extract content from Exa result (highlights or full text)
   */
  extractContentFromResult(result) {
    if (result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0) {
      return result.highlights.join(' ');
    }
    return result.text || result.title || '';
  }

  /**
   * Map facility information from highlights
   */
  mapFacilityFromHighlights(result, includeFullText) {
    const contentText = this.extractContentFromResult(result);
    const title = result.title || '';
    const fullText = includeFullText ? result.text : null;

    // Extract key facility information using highlights context
    const name = this.extractFromHighlights(contentText, 'facility_name') || 
                 this.extractFirst(/Facility\s*Name\s*:?\s*([^\n]+)/i, contentText) || 
                 title || 'Unknown Facility';
    
    const registry = this.extractFromHighlights(contentText, 'registry_id') ||
                     this.extractFirst(/(FRSID|Registry\s*ID)\s*:?\s*(\d{5,})/i, contentText, 2);
    
    const address = this.extractFromHighlights(contentText, 'address') ||
                    this.extractFirst(/Address\s*:?\s*([^\n]+)/i, contentText);
    
    const city = this.extractFromHighlights(contentText, 'city') ||
                 this.extractFirst(/City\s*:?\s*([^\n\r]+)/i, contentText);
    
    const state = this.extractFromHighlights(contentText, 'state') ||
                  this.extractFirst(/State\s*:?\s*([A-Z]{2})/i, contentText);
    
    const status = this.extractFromHighlights(contentText, 'compliance_status') ||
                   this.extractFirst(/Compliance\s*Status\s*:?\s*([^\n]+)/i, contentText);
    
    // Extract monetary values using BaseWebSearchClient method
    const penaltyData = this.extractMonetaryValue(contentText, {});
    const totalPen = penaltyData?.value || null;
    
    const qnc = this.extractFromHighlights(contentText, 'quarters_noncompliance') ||
                this.extractFirst(/Quarters\s*in\s*Noncompliance\s*:?\s*(\d+)/i, contentText);

    const mapped = {
      name,
      epa_registry_id: registry || null,
      location: { address: address || null, city: city || null, state: state || null },
      compliance_status: status || null,
      total_penalties: totalPen,
      clean_air: /Clean\s*Air|CAA/i.test(contentText),
      clean_water: /Clean\s*Water|CWA/i.test(contentText)
    };

    // Add quality metadata if available
    if (result._highlight_quality) {
      mapped._highlight_quality = result._highlight_quality;
    }

    if (includeFullText && fullText) mapped.full_text = fullText;

    // Extended shape (like EPAComplianceClient small result set)
    mapped.company = this.extractFromHighlights(contentText, 'company') ||
                     this.extractFirst(/Company\s*:?\s*([^\n]+)/i, contentText) || null;
    
    mapped.compliance = {
      current_status: status || null,
      quarters_in_noncompliance: qnc ? Number(qnc) : null,
      formal_enforcement_actions: this.extractFirst(/Formal\s*Enforcement\s*Actions\s*:?\s*(\d+)/i, contentText) || null,
      total_penalties: totalPen
    };
    
    mapped.programs = {
      clean_air: /CAA/i.test(contentText),
      clean_water: /CWA/i.test(contentText),
      rcra: /RCRA/i.test(contentText)
    };
    
    return mapped;
  }

  /**
   * Extract facility header from highlights
   */
  extractFacilityFromHighlights(result, includeFullText) {
    const contentText = this.extractContentFromResult(result);
    const fullText = includeFullText ? result.text : null;

    const name = this.extractFromHighlights(contentText, 'facility_name') ||
                 this.extractFirst(/Facility\s*Name\s*:?\s*([^\n]+)/i, contentText);
    
    const registry = this.extractFromHighlights(contentText, 'registry_id') ||
                     this.extractFirst(/(FRSID|Registry\s*ID)\s*:?\s*(\d{5,})/i, contentText, 2);
    
    const location = this.extractFromHighlights(contentText, 'address') ||
                     this.extractFirst(/Location\s*:?\s*([^\n]+)/i, contentText);
    
    const address = this.extractFirst(/Address\s*:?\s*([^\n]+)/i, contentText) || location;

    const facility = { 
      name: name || null, 
      registry_id: registry || null, 
      address: address || null 
    };
    
    if (includeFullText && fullText) facility.full_text = fullText;
    return facility;
  }

  /**
   * Extract compliance summary from highlights
   */
  extractComplianceFromHighlights(result) {
    const contentText = this.extractContentFromResult(result);

    return {
      Status: this.extractFromHighlights(contentText, 'compliance_status') ||
              this.extractFirst(/Compliance\s*Status\s*:?\s*([^\n]+)/i, contentText) || null,
      
      QtrsInNC: this.extractFromHighlights(contentText, 'quarters_noncompliance') ||
                this.extractFirst(/Quarters\s*in\s*Noncompliance\s*:?\s*(\d+)/i, contentText) || null,
      
      FormalActions: this.extractFromHighlights(contentText, 'formal_actions') ||
                     this.extractFirst(/Formal\s*Enforcement\s*Actions\s*:?\s*(\d+)/i, contentText) || null,
      
      TotalPenalties: this.extractFromHighlights(contentText, 'penalties') ||
                      this.extractFirst(/Total\s*Penalties\s*:?\s*\$?([\d,]+)/i, contentText) || null
    };
  }

  /**
   * Extract three year compliance history from highlights
   */
  extractThreeYearFromHighlights(result) {
    const contentText = this.extractContentFromResult(result);
    
    // Look for quarterly compliance patterns in highlights
    const quarterPatterns = [
      /Q[1-4]\s*\d{4}.*?(?:compliance|noncompliance|violation)/gi,
      /\d{4}\s*Q[1-4].*?(?:compliance|noncompliance|violation)/gi,
      /quarter.*?\d{4}.*?(?:compliance|noncompliance|violation)/gi
    ];
    
    const entries = [];
    for (const pattern of quarterPatterns) {
      const matches = contentText.match(pattern) || [];
      entries.push(...matches.map(m => m.trim()));
    }
    
    // Remove duplicates and limit results
    const uniqueEntries = [...new Set(entries)];
    return uniqueEntries.slice(0, 50);
  }

  /**
   * Extract violations from highlights with improved accuracy
   */
  extractViolationsFromHighlights(result) {
    if (!result) return [];
    
    const contentText = this.extractContentFromResult(result);
    const entries = [];

    // Use highlights-aware extraction for better context
    const violationSections = this.identifyViolationSections(contentText);
    
    for (const section of violationSections) {
      const violation = this.parseViolationSection(section);
      if (violation && violation.Program) {
        entries.push(violation);
      }
      if (entries.length >= 200) break;
    }

    // Fallback to regex if highlights didn't capture violations well
    if (entries.length === 0) {
      const regex = /(Program|ViolProgram)\s*:?\s*([^\n]+).*?(Date|ViolDate)\s*:?\s*([A-Za-z0-9\-\/ ,]+).*?Description\s*:?\s*([^\n]+)/gis;
      let m;
      while ((m = regex.exec(contentText)) !== null) {
        entries.push({ 
          Program: (m[2] || '').trim(), 
          Date: (m[4] || '').trim(), 
          Description: (m[5] || '').trim() 
        });
        if (entries.length >= 200) break;
      }
    }

    return entries;
  }

  /**
   * Extract enforcement actions from highlights
   */
  extractEnforcementFromHighlights(result) {
    if (!result) return [];
    
    const contentText = this.extractContentFromResult(result);
    const entries = [];

    // Look for enforcement patterns in highlights
    const enforcementSections = this.identifyEnforcementSections(contentText);
    
    for (const section of enforcementSections) {
      const enforcement = this.parseEnforcementSection(section);
      if (enforcement && enforcement.Action) {
        entries.push(enforcement);
      }
      if (entries.length >= 200) break;
    }

    // Fallback to regex if needed
    if (entries.length === 0) {
      const regex = /(Enforcement\s*Action|Case)\s*:?\s*([^\n]+).*?(Date)\s*:?\s*([A-Za-z0-9\-\/ ,]+)/gis;
      let m;
      while ((m = regex.exec(contentText)) !== null) {
        entries.push({ 
          Action: (m[2] || '').trim(), 
          Date: (m[4] || '').trim() 
        });
        if (entries.length >= 200) break;
      }
    }

    return entries;
  }

  // ===== Specialized Extraction Methods =====

  /**
   * Extract specific data types from highlights with context awareness
   */
  extractFromHighlights(text, dataType) {
    if (!text) return null;

    // Context-aware extraction based on data type
    switch (dataType) {
      case 'facility_name':
        return this.extractFirst(/(?:Facility(?:\s+Name)?|Name)\s*:?\s*([^\n\r]+)/i, text) ||
               this.extractFirst(/^([^,\n\r]+(?:Plant|Facility|Company|Corp|Inc|LLC))/i, text);

      case 'registry_id': 
        return this.extractFirst(/(FRSID|Registry\s*ID|FRS\s*ID)\s*:?\s*(\d{5,})/i, text, 2) ||
               this.extractFirst(/\b(\d{11})\b/, text); // 11-digit FRS IDs

      case 'compliance_status':
        return this.extractFirst(/(?:Compliance\s*Status|Status)\s*:?\s*([^\n\r]+)/i, text) ||
               this.extractFirst(/\b(High\s*Priority\s*Violator|No\s*Violations|In\s*Compliance|Noncompliance)/i, text);

      case 'quarters_noncompliance':
        return this.extractFirst(/Quarters?\s*(?:in\s*)?(?:Non)?compliance\s*:?\s*(\d+)/i, text) ||
               this.extractFirst(/(\d+)\s*Quarters?\s*(?:in\s*)?(?:Non)?compliance/i, text);

      case 'penalties':
        const penalty = this.extractMonetaryValue(text, {});
        return penalty ? penalty.formatted_value : null;

      case 'address':
        return this.extractFirst(/(?:Address|Location)\s*:?\s*([^\n\r]+)/i, text);

      case 'city':
        return this.extractFirst(/City\s*:?\s*([^\n\r,]+)/i, text);

      case 'state':
        return this.extractFirst(/State\s*:?\s*([A-Z]{2})\b/i, text);

      case 'company':
        return this.extractFirst(/Company\s*:?\s*([^\n\r]+)/i, text);

      default:
        return null;
    }
  }

  /**
   * Identify violation sections in text for better parsing
   */
  identifyViolationSections(text) {
    const sections = [];
    const violationMarkers = [
      /violation[s]?/gi,
      /noncompliance/gi,
      /enforcement/gi,
      /program.*?(CAA|CWA|RCRA|SDWA)/gi
    ];

    for (const marker of violationMarkers) {
      const matches = [...text.matchAll(marker)];
      for (const match of matches) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 200);
        sections.push(text.slice(start, end));
      }
    }

    return sections;
  }

  /**
   * Parse individual violation section
   */
  parseViolationSection(section) {
    const program = this.extractFirst(/(?:Program|ViolProgram)\s*:?\s*([^\n]+)/i, section) ||
                    this.extractFirst(/\b(CAA|CWA|RCRA|SDWA|Clean\s*Air|Clean\s*Water)\b/i, section);
    
    const date = this.extractFirst(/(?:Date|ViolDate)\s*:?\s*([A-Za-z0-9\-\/ ,]+)/i, section) ||
                 this.extractDate(section, {})?.value;
    
    const description = this.extractFirst(/Description\s*:?\s*([^\n]+)/i, section) ||
                        section.slice(0, 100);

    if (program) {
      return {
        Program: program.trim(),
        Date: date?.trim() || null,
        Description: description?.trim() || null
      };
    }
    return null;
  }

  /**
   * Identify enforcement sections in text
   */
  identifyEnforcementSections(text) {
    const sections = [];
    const enforcementMarkers = [
      /enforcement\s*action[s]?/gi,
      /case\s*(?:number|id)?/gi,
      /consent\s*decree/gi,
      /penalty/gi
    ];

    for (const marker of enforcementMarkers) {
      const matches = [...text.matchAll(marker)];
      for (const match of matches) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 200);
        sections.push(text.slice(start, end));
      }
    }

    return sections;
  }

  /**
   * Parse individual enforcement section
   */
  parseEnforcementSection(section) {
    const action = this.extractFirst(/(?:Enforcement\s*Action|Case|Action)\s*:?\s*([^\n]+)/i, section) ||
                   this.extractFirst(/\b(Consent\s*Decree|Administrative\s*Order|Civil\s*Action)\b/i, section);
    
    const date = this.extractFirst(/Date\s*:?\s*([A-Za-z0-9\-\/ ,]+)/i, section) ||
                 this.extractDate(section, {})?.value;

    if (action) {
      return {
        Action: action.trim(),
        Date: date?.trim() || null
      };
    }
    return null;
  }

  // Keep minimal regex helper for ID extraction only
  extractFirst(re, text, groupIndex = 1) {
    if (!text) return null;
    const m = text.match(re);
    return m ? (m[groupIndex] || '').trim() : null;
  }

  /**
   * Override extractDataFromText for EPA-specific data types
   */
  extractDataFromText(text, dataType, options = {}) {
    const baseData = {
      source_text: text,
      source_url: options.sourceUrl,
      extraction_confidence: this.calculateExtractionConfidence(text, dataType)
    };

    switch (dataType) {
      case 'facility_info':
        return {
          ...baseData,
          facility_name: this.extractFromHighlights(text, 'facility_name'),
          registry_id: this.extractFromHighlights(text, 'registry_id'),
          compliance_status: this.extractFromHighlights(text, 'compliance_status'),
          address: this.extractFromHighlights(text, 'address')
        };

      case 'compliance_info':
        return {
          ...baseData,
          status: this.extractFromHighlights(text, 'compliance_status'),
          quarters_noncompliance: this.extractFromHighlights(text, 'quarters_noncompliance'),
          penalties: this.extractFromHighlights(text, 'penalties')
        };

      default:
        return super.extractDataFromText(text, dataType, options);
    }
  }
}
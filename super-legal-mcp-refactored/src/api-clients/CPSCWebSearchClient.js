/**
 * CPSC Web Search Client
 * Powered by Exa WebSearch API
 *
 * Migrated to schema-based architecture (Phase 3.7b)
 * Uses CPSCSchemas for structured data extraction via Exa summary parameter
 *
 * Provides enhanced search capabilities for:
 * - Product recall searches with safety-critical content extraction
 * - Hazard type filtering and categorization
 * - Manufacturer and product identification
 * - Recall remedy and action information
 *
 * Features:
 * - Direct web content search via cpsc.gov
 * - Smart snippet extraction with safety-critical patterns
 * - Metadata extraction (recall numbers, hazard types, remedy actions)
 * - Conditional content fetching for performance optimization
 */

import { validateLimit, validateDate } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { CPSCSchemas } from './schemas/CPSCSchemas.js';

export class CPSCWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Register CPSC schemas for schema-based extraction
    if (this.contentStrategy) {
      Object.entries(CPSCSchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // CPSC-specific configuration
    this.domains = ['cpsc.gov'];
    
    // Hazard type mappings for CPSC terminology
    this.hazardMappings = {
      'fire': 'FIRE OR BURN OR IGNITION OR FLAME OR THERMAL',
      'choking': 'CHOKING OR CHOKE OR SUFFOCATION OR ASPHYXIATION',
      'laceration': 'LACERATION OR CUT OR SHARP OR BLADE OR EDGE',
      'fall': 'FALL OR DROP OR TIP OR COLLAPSE OR STABILITY',
      'entanglement': 'ENTANGLEMENT OR STRANGULATION OR CORD OR STRING',
      'chemical': 'CHEMICAL OR TOXIC OR POISON OR LEAD OR MERCURY',
      'electrical': 'ELECTRICAL OR SHOCK OR ELECTROCUTION OR SHORT CIRCUIT',
      'impact': 'IMPACT OR STRIKE OR HIT OR CRUSH OR BLUNT FORCE',
      'ingestion': 'INGESTION OR SWALLOW OR DIGEST OR SMALL PARTS'
    };
    
    // Product category mappings
    this.productCategories = {
      'toys': 'toy OR doll OR game OR plaything OR children',
      'furniture': 'furniture OR chair OR table OR dresser OR bookshelf',
      'appliances': 'appliance OR refrigerator OR washer OR dryer OR oven',
      'electronics': 'electronic OR battery OR charger OR cord OR device',
      'clothing': 'clothing OR apparel OR garment OR fabric OR textile',
      'tools': 'tool OR equipment OR machinery OR saw OR drill',
      'sports': 'sports OR athletic OR exercise OR bike OR helmet',
      'automotive': 'automotive OR car OR vehicle OR tire OR seat'
    };
    
    // Safety-critical terms for biasing
    this.safetyTerms = [
      'recall', 'hazard', 'injury', 'death', 'defect', 'safety',
      'remedy', 'repair', 'fix', 'return', 'refund', 'replace',
      'CPSC', 'Consumer Product Safety Commission', 'investigation',
      'incident', 'accident', 'emergency', 'hospital', 'medical'
    ];

    // Add confidence thresholds for permissive extraction
    this.confidenceLevels = {
      HIGH: 0.8,
      MEDIUM: 0.5,
      LOW: 0.2,
      MINIMAL: 0.1
    };

    // Feature flag for permissive mode
    this.usePermissiveExtraction = process.env.CPSC_PERMISSIVE_MODE !== 'false';

    // CPSC-specific extraction patterns
    this.cpscPatterns = {
      recall_number: [
        /recall\s*#?:?\s*(\d{2}-\d{3,4})/i,         // Standard format: 23-456
        /cpsc\s*recall\s*(\d{2}-\d{3,4})/i,        // CPSC recall 23-456
        /recall\s*(?:no\.?|number)\s*:?\s*(\d+[-]\d+)/i,  // Various formats
        /(?:announcement|notice)\s*#?\s*(\d{2}-\d{3,4})/i  // Announcement numbers
      ],
      hazard_type: [
        /hazard[:\s]*([^.!?\n]{10,100})/i,
        /danger[:\s]*([^.!?\n]{10,100})/i,
        /risk[:\s]*([^.!?\n]{10,100})/i,
        /injury[:\s]*([^.!?\n]{10,100})/i,
        /death[:\s]*([^.!?\n]{10,100})/i
      ],
      remedy_action: [
        /remedy[:\s]*([^.!?\n]{10,200})/i,
        /consumers?\s+should\s+([^.!?\n]{10,200})/i,
        /immediately\s+([^.!?\n]{10,150})/i,
        /(?:stop|cease|discontinue)\s+([^.!?\n]{10,100})/i,
        /(?:return|refund|repair|replace)/gi
      ],
      manufacturer: [
        /manufacturer[:\s]*([^\n,]+)/i,
        /(?:made|manufactured|distributed)\s+by\s+([^\n,]+)/i,
        /company[:\s]*([^\n,]+)/i,
        /firm[:\s]*([^\n,]+)/i
      ],
      product_name: [
        /product[:\s]*([^\n,]+)/i,
        /(?:model|brand)[:\s]*([^\n,]+)/i,
        /item[:\s]*([^\n,]+)/i
      ],
      incident_count: [
        /(\d+)\s+(?:reports?|incidents?|injuries?|deaths?)/i,
        /(\d+)\s+(?:consumers?|people|individuals?)\s+(?:injured|hurt|affected)/i
      ]
    };

    // Safety priority levels for different hazard types
    this.safetyPriority = {
      'death': 'CRITICAL',
      'serious injury': 'HIGH',
      'fire': 'HIGH',
      'choking': 'CRITICAL',
      'laceration': 'MEDIUM',
      'children': 'HIGH',
      'infant': 'CRITICAL'
    };

    // Rollout configuration
    this.rolloutConfig = {
      usePermissiveExtraction: process.env.CPSC_PERMISSIVE_MODE === 'true',
      prioritizeSafetyCritical: process.env.CPSC_PRIORITIZE_SAFETY_CRITICAL !== 'false',
      autoSafetyAdvisory: process.env.CPSC_AUTO_SAFETY_ADVISORY !== 'false'
    };
  }

  /**
   * Create base CPSC result structure
   */
  createCPSCResult(searchType = 'general') {
    return {
      title: 'CPSC Safety Document',
      url: '',
      published_date: null,
      result_type: searchType,
      data_quality: {
        has_url: false,
        has_title: false,
        has_content: false,
        is_cpsc_domain: false,
        confidence: 0
      },
      metadata: {
        recall_number: null,
        hazard_type: null,
        remedy_action: null,
        manufacturer: null,
        product_name: null,
        incident_count: null,
        safety_priority: null,
        age_group_affected: null
      },
      advisory_flags: [],
      extraction_confidence: 0,
      safety_critical: false
    };
  }

  /**
   * Search product recalls via web search
   */
  async searchRecallsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      product_name,
      search_term, // Alternative to product_name for flexibility
      recalling_firm,
      hazard,
      hazard_type, // Alternative to hazard for flexibility
      recall_id,
      date_after,
      date_start, // Alternative to date_after for backward compatibility
      date_before,
      date_end, // Alternative to date_before for backward compatibility
      product_category,
      limit = 10,
      include_snippet = false,
      include_text = false
    } = args;

    // Validate inputs
    const validatedLimit = validateLimit(limit, 10);
    
    // Use flexible parameter names
    const searchTerm = product_name || search_term;
    const hazardTerm = hazard || hazard_type;
    const startDate = date_after || date_start;
    const endDate = date_before || date_end;

    // Validate dates if provided
    if (startDate) {
      validateDate(startDate, 'start date');
    }
    if (endDate) {
      validateDate(endDate, 'end date');
    }

    const query = this.buildCPSCQuery({
      searchTerm,
      recalling_firm,
      hazardTerm,
      recall_id,
      product_category,
      startDate,
      endDate
    });

    // Use BaseWebSearchClient's executeExaSearch with schema-based extraction
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_recall',
      domain: 'product_safety',
      summaryQuery: 'CPSC recall hazard injury defect safety remedy repair consumer product recall number manufacturer',
      numSentences: 4,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'recall', include_text, include_snippet)
        : this.mapCPSCResult(r, 'recall', include_text, include_snippet)
      );
      // NO .filter(Boolean) - all results pass through

    // Add quality assessment
    const qualityAssessment = this.usePermissiveExtraction
      ? this.assessCPSCResultQuality(processedResults)
      : null;

    // Sort by safety criticality first, then confidence
    if (this.usePermissiveExtraction) {
      processedResults.sort((a, b) => {
        // Safety critical items first
        if (a.safety_critical && !b.safety_critical) return -1;
        if (!a.safety_critical && b.safety_critical) return 1;
        // Then by confidence
        return (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0);
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_recalls_web',
          query: query,
          total_results: processedResults.length,
          ...(qualityAssessment && { quality_summary: qualityAssessment }),
          safety_advisory: this.usePermissiveExtraction
            ? this.generateSafetyAdvisory(processedResults)
            : null,
          filters_applied: {
            product_name: searchTerm,
            recalling_firm,
            hazard: hazardTerm,
            recall_id,
            product_category,
            date_range: startDate || endDate ? `${startDate || 'any'} to ${endDate || 'any'}` : null
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Build CPSC-specific search query
   */
  buildCPSCQuery({ searchTerm, recalling_firm, hazardTerm, recall_id, product_category, startDate, endDate }) {
    let query = 'site:cpsc.gov/recalls';
    const queryParts = [];

    // Add product search term
    if (searchTerm) {
      queryParts.push(`"${searchTerm}"`);
    }

    // Add recalling firm
    if (recalling_firm) {
      queryParts.push(`"${recalling_firm}"`);
    }

    // Add hazard type with mapping
    if (hazardTerm) {
      const mappedHazard = this.hazardMappings[hazardTerm.toLowerCase()] || hazardTerm;
      queryParts.push(`(${mappedHazard})`);
    }

    // Add recall ID
    if (recall_id) {
      queryParts.push(`"${recall_id}"`);
    }

    // Add product category with mapping
    if (product_category) {
      const mappedCategory = this.productCategories[product_category.toLowerCase()] || product_category;
      queryParts.push(`(${mappedCategory})`);
    }

    // Add date constraints (handled at search level, not query level for Exa)
    if (startDate || endDate) {
      queryParts.push('recall date');
    }

    // Add safety-critical biasing terms
    const biasingTerms = this.safetyTerms.slice(0, 5).join(' OR ');
    queryParts.push(`(${biasingTerms})`);

    // Combine all parts
    if (queryParts.length > 0) {
      query += ' ' + queryParts.join(' ');
    }

    return query;
  }


  /**
   * Check if URL is from CPSC domain
   */
  isCPSCDomain(url) {
    if (!url) return false;
    return this.domains.some(domain => url.toLowerCase().includes(domain));
  }

  /**
   * Map CPSC result to standardized format
   */
  mapCPSCResult(result, searchType, includeText, includeSnippet) {
    // Use permissive version if feature flag is enabled
    if (this.usePermissiveExtraction) {
      return this.mapCPSCResultPermissive(result, searchType, includeText, includeSnippet);
    }

    // Legacy behavior for backwards compatibility
    if (!result) return null;

    try {
      const mapped = {
        title: result.title || '',
        url: result.url || '',
        published_date: result.publishedDate || null
      };

      // Extract CPSC-specific metadata
      const metadata = this.extractCPSCMetadata(result);
      if (metadata) {
        Object.assign(mapped, metadata);
      }

      // Add snippet if requested
      if (includeSnippet && (result.text || result.snippet)) {
        mapped.snippet = this.extractSmartSnippet(result.text || result.snippet);
      }

      // Add full text if requested
      if (includeText && result.text) {
        mapped.full_text = result.text;
      }

      return mapped;
    } catch (error) {
      console.warn('Error mapping CPSC result:', error);
      return null;
    }
  }

  /**
   * Map CPSC result with permissive pattern - always returns structure
   */
  mapCPSCResultPermissive(result, searchType, includeText, includeSnippet) {
    // Always return a structure, never null
    const baseResult = this.createCPSCResult(searchType);

    // Handle null/undefined input gracefully
    if (!result) {
      baseResult.advisory_flags.push('empty_result');
      baseResult.title = `CPSC ${searchType.replace('_', ' ')} (No Data)`;
      return baseResult;
    }

    // Extract basic fields with fallbacks
    baseResult.url = result.url || '';
    baseResult.published_date = result.publishedDate || result.published_date || null;
    baseResult.title = result.title || this.generateCPSCTitle(result, searchType);

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
    if (this.isCPSCDomain(result.url)) {
      baseResult.data_quality.is_cpsc_domain = true;
      confidence += 0.30;
    }

    baseResult.data_quality.confidence = confidence;

    // Extract metadata with confidence scoring
    const metadataExtraction = this.extractCPSCMetadataPermissive(result, searchType);
    baseResult.metadata = { ...baseResult.metadata, ...metadataExtraction.data };
    baseResult.extraction_confidence = metadataExtraction.confidence;

    // Determine safety criticality
    baseResult.safety_critical = this.assessSafetyCriticality(baseResult.metadata);

    // Add advisory flags based on quality and safety
    if (!result.url) {
      baseResult.advisory_flags.push('missing_url');
    }
    if (!this.isCPSCDomain(result.url)) {
      baseResult.advisory_flags.push('non_cpsc_domain');
    }
    if (confidence < 0.5) {
      baseResult.advisory_flags.push('low_confidence');
    }
    if (!baseResult.metadata.recall_number && searchType === 'recall') {
      baseResult.advisory_flags.push('recall_number_not_extracted');
    }
    if (baseResult.safety_critical) {
      baseResult.advisory_flags.push('safety_critical_content');
    }

    // Add content based on parameters
    if (includeSnippet || !includeText) {
      baseResult.snippet = this.extractCPSCSnippet(result, searchType);
    }
    if (includeText && result.text) {
      baseResult.full_text = result.text;
    }

    return baseResult;
  }

  /**
   * Generate contextual title for CPSC result
   */
  generateCPSCTitle(result, searchType) {
    const typeMap = {
      'recall': 'CPSC Product Recall',
      'enforcement': 'CPSC Enforcement Action',
      'injury_data': 'CPSC Injury Report',
      'standard': 'CPSC Safety Standard',
      'guidance': 'CPSC Business Guidance',
      'news': 'CPSC News Release',
      'report': 'CPSC Safety Report'
    };

    const baseTitle = typeMap[searchType] || 'CPSC Safety Document';

    // Try to extract specific product or company from URL/content
    if (result?.url) {
      const urlTitle = this.extractTitleFromURL(result.url);
      if (urlTitle) return `${baseTitle}: ${urlTitle}`;
    }

    // Add date if available
    if (result?.publishedDate) {
      const date = new Date(result.publishedDate).toLocaleDateString();
      return `${baseTitle} - ${date}`;
    }

    return baseTitle;
  }

  /**
   * Extract title from CPSC URL patterns
   */
  extractTitleFromURL(url) {
    if (!url) return null;

    // Extract from CPSC URL patterns
    const patterns = [
      /\/news\/(\d{4})\/(.+?)(?:\.html)?$/i,
      /\/recalls\/(\d{4})\/(.+?)$/i,
      /\/Business--Manufacturing\/Business-Education\/(.+?)$/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[2] || match[1];
      }
    }

    return null;
  }

  /**
   * Extract CPSC snippet with safety context
   */
  extractCPSCSnippet(result, searchType, maxLength = 600) {
    if (!result) return '';

    // Prioritize highlights if available
    if (result.highlights && result.highlights.length > 0) {
      return result.highlights.join(' ').substring(0, maxLength);
    }

    // Fallback to text extraction
    const text = result.text || result.title || '';
    if (!text) return '';

    // Try to find the most relevant portion based on search type
    const relevantPatterns = {
      'recall': [
        /recall.{0,200}/gi,
        /hazard.{0,200}/gi,
        /remedy.{0,200}/gi
      ],
      'enforcement': [
        /enforcement.{0,200}/gi,
        /violation.{0,200}/gi,
        /penalty.{0,200}/gi
      ],
      'injury_data': [
        /injur.{0,200}/gi,
        /incident.{0,200}/gi,
        /death.{0,200}/gi
      ]
    };

    const patterns = relevantPatterns[searchType] || [/safety.{0,200}/gi];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches[0].length >= 50) {
        return matches[0].substring(0, maxLength);
      }
    }

    // Default to beginning of text
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  /**
   * Extract CPSC-specific metadata from result
   */
  extractCPSCMetadata(result) {
    const metadata = {};
    const text = (result.text || result.title || result.snippet || '').toLowerCase();
    const originalText = result.text || result.title || result.snippet || '';

    try {
      // Extract recall number (format: ##-###, ##-####, or similar)
      const recallNumberMatch = originalText.match(/recall\s*#?:?\s*(\d{2}-\d{3,4})/i);
      if (recallNumberMatch) {
        metadata.recall_number = recallNumberMatch[1];
      }

      // Extract recall ID (various formats)
      const recallIdMatch = originalText.match(/recall\s*(?:id|number)\s*:?\s*([a-z0-9-]{3,})/i);
      if (recallIdMatch) {
        metadata.recall_id = recallIdMatch[1];
      }

      // Extract units affected
      const unitsMatch = originalText.match(/(\d+(?:,\d+)*)\s*(?:units?|products?|items?)/i);
      if (unitsMatch) {
        metadata.units_affected = unitsMatch[1].replace(/,/g, '');
      }

      // Extract manufacturer/company
      const companyPatterns = [
        /(?:manufactured by|made by|company|firm):?\s*([^.]+)/i,
        /^([^.]+?)\s+(?:recalls?|has recalled)/i
      ];
      
      for (const pattern of companyPatterns) {
        const match = originalText.match(pattern);
        if (match && match[1]) {
          const manufacturer = match[1].trim().replace(/['"]/g, '');
          // Only set if it looks like a company name (not too long)
          if (manufacturer.length < 50 && manufacturer.length > 2) {
            metadata.manufacturer = manufacturer;
            break;
          }
        }
      }

      // Extract hazard type
      const hazardPatterns = Object.keys(this.hazardMappings);
      for (const hazard of hazardPatterns) {
        if (text.includes(hazard)) {
          metadata.hazard_type = hazard;
          break;
        }
      }

      // Extract remedy action
      const remedyPatterns = [
        /(?:remedy|action|fix|solution):?\s*([^.]+)/i,
        /consumers should\s+([^.]+)/i,
        /(?:return|refund|replace|repair)\s+([^.]*)/i
      ];
      
      for (const pattern of remedyPatterns) {
        const match = originalText.match(pattern);
        if (match) {
          metadata.remedy = match[1].trim();
          break;
        }
      }

      // Extract injury count
      const injuryMatch = originalText.match(/(\d+)\s*(?:injur(?:y|ies)|incident|report)/i);
      if (injuryMatch) {
        metadata.injuries_reported = parseInt(injuryMatch[1]);
      }

    } catch (error) {
      console.warn('Error extracting CPSC metadata:', error);
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  /**
   * Extract CPSC metadata with permissive pattern and confidence scoring
   */
  extractCPSCMetadataPermissive(result, searchType) {
    const metadata = {};
    let confidence = 0;
    let extractionCount = 0;
    let attemptCount = 0;

    const content = result?.text || result?.highlights?.join(' ') || result?.title || '';

    // Extract recall number with multiple patterns
    attemptCount++;
    const recallNumber = this.extractRecallNumberPermissive(content, result?.url);
    if (recallNumber.value) {
      metadata.recall_number = recallNumber.value;
      metadata.recall_number_confidence = recallNumber.confidence;
      confidence += recallNumber.confidence * 0.25;
      extractionCount++;
    }

    // Extract hazard type with confidence
    attemptCount++;
    const hazardType = this.extractHazardTypePermissive(content);
    if (hazardType.value) {
      metadata.hazard_type = hazardType.value;
      metadata.hazard_type_confidence = hazardType.confidence;
      metadata.safety_priority = this.determineSafetyPriority(hazardType.value);
      confidence += hazardType.confidence * 0.20;
      extractionCount++;
    }

    // Extract remedy action
    attemptCount++;
    const remedyAction = this.extractRemedyActionPermissive(content);
    if (remedyAction.value) {
      metadata.remedy_action = remedyAction.value;
      metadata.remedy_confidence = remedyAction.confidence;
      confidence += remedyAction.confidence * 0.15;
      extractionCount++;
    }

    // Extract manufacturer with fallbacks
    attemptCount++;
    const manufacturer = this.extractManufacturerPermissive(content);
    if (manufacturer.value) {
      metadata.manufacturer = manufacturer.value;
      metadata.manufacturer_confidence = manufacturer.confidence;
      confidence += manufacturer.confidence * 0.15;
      extractionCount++;
    }

    // Extract product name
    attemptCount++;
    const productName = this.extractProductNamePermissive(content);
    if (productName.value) {
      metadata.product_name = productName.value;
      metadata.product_confidence = productName.confidence;
      confidence += productName.confidence * 0.15;
      extractionCount++;
    }

    // Extract incident count (critical for safety assessment)
    attemptCount++;
    const incidentCount = this.extractIncidentCountPermissive(content);
    if (incidentCount.value) {
      metadata.incident_count = incidentCount.value;
      metadata.incident_confidence = incidentCount.confidence;
      confidence += incidentCount.confidence * 0.10;
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
   * Extract recall number with confidence scoring
   */
  extractRecallNumberPermissive(content, url) {
    const result = { value: null, confidence: 0, source: null };

    if (!content && !url) return result;

    // Try URL extraction first (highest confidence)
    if (url) {
      const urlMatch = url.match(/(\d{2}-\d{3,4})/);
      if (urlMatch) {
        result.value = urlMatch[1];
        result.confidence = 0.9;
        result.source = 'url';
        return result;
      }
    }

    // Try content patterns
    for (const pattern of this.cpscPatterns.recall_number) {
      const match = content.match(pattern);
      if (match) {
        result.value = match[1];
        result.confidence = 0.7;
        result.source = 'content';
        return result;
      }
    }

    return result;
  }

  /**
   * Extract hazard type with confidence scoring
   */
  extractHazardTypePermissive(content) {
    const result = { value: null, confidence: 0, keywords: [] };

    if (!content) return result;

    // Check for explicit hazard statements
    for (const pattern of this.cpscPatterns.hazard_type) {
      const match = content.match(pattern);
      if (match && match[1].length > 5) {
        result.value = match[1].trim();
        result.confidence = 0.8;
        return result;
      }
    }

    // Check for hazard keywords from mappings
    const lowerContent = content.toLowerCase();
    const hazardMatches = [];

    for (const [hazardType, keywords] of Object.entries(this.hazardMappings)) {
      const keywordList = keywords.toLowerCase().split(' OR ');
      for (const keyword of keywordList) {
        if (lowerContent.includes(keyword.trim())) {
          hazardMatches.push({ type: hazardType, keyword: keyword.trim() });
        }
      }
    }

    if (hazardMatches.length > 0) {
      // Sort by priority (death, fire, choking first)
      const priorityOrder = ['fire', 'choking', 'chemical', 'electrical', 'fall'];
      const sortedMatches = hazardMatches.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.type);
        const bIndex = priorityOrder.indexOf(b.type);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });

      result.value = sortedMatches[0].type;
      result.confidence = 0.6;
      result.keywords = hazardMatches.map(m => m.keyword);
    }

    return result;
  }

  /**
   * Extract remedy action with confidence scoring
   */
  extractRemedyActionPermissive(content) {
    const result = { value: null, confidence: 0, source: null };

    if (!content) return result;

    // Try patterns in order of confidence
    for (const pattern of this.cpscPatterns.remedy_action) {
      const match = content.match(pattern);
      if (match) {
        result.value = match[1] || match[0];
        result.confidence = 0.7;
        result.source = 'pattern';
        return result;
      }
    }

    return result;
  }

  /**
   * Extract manufacturer with confidence scoring
   */
  extractManufacturerPermissive(content) {
    const result = { value: null, confidence: 0, source: null };

    if (!content) return result;

    for (const pattern of this.cpscPatterns.manufacturer) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].length > 2 && match[1].length < 100) {
        result.value = match[1].trim().replace(/['"]/g, '');
        result.confidence = 0.7;
        result.source = 'pattern';
        return result;
      }
    }

    return result;
  }

  /**
   * Extract product name with confidence scoring
   */
  extractProductNamePermissive(content) {
    const result = { value: null, confidence: 0, source: null };

    if (!content) return result;

    for (const pattern of this.cpscPatterns.product_name) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].length > 2 && match[1].length < 100) {
        result.value = match[1].trim();
        result.confidence = 0.6;
        result.source = 'pattern';
        return result;
      }
    }

    return result;
  }

  /**
   * Extract incident count with confidence scoring
   */
  extractIncidentCountPermissive(content) {
    const result = { value: null, confidence: 0, source: null };

    if (!content) return result;

    for (const pattern of this.cpscPatterns.incident_count) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.value = parseInt(match[1]);
        result.confidence = 0.8;
        result.source = 'pattern';
        return result;
      }
    }

    return result;
  }

  /**
   * Assess safety criticality of metadata
   */
  assessSafetyCriticality(metadata) {
    // Critical if involves death, serious injury, or children
    const criticalKeywords = ['death', 'fatal', 'serious injury', 'children', 'infant', 'baby'];
    const hazard = (metadata.hazard_type || '').toLowerCase();
    const remedyText = (metadata.remedy_action || '').toLowerCase();

    for (const keyword of criticalKeywords) {
      if (hazard.includes(keyword) || remedyText.includes(keyword)) {
        return true;
      }
    }

    // Critical if high incident count
    if (metadata.incident_count && parseInt(metadata.incident_count) > 10) {
      return true;
    }

    // Critical hazard types
    const criticalHazards = ['fire', 'choking', 'chemical', 'electrical'];
    if (criticalHazards.includes(hazard)) {
      return true;
    }

    return false;
  }

  /**
   * Determine safety priority level based on hazard type
   */
  determineSafetyPriority(hazardType) {
    if (!hazardType) return null;

    const hazard = hazardType.toLowerCase();

    // Check against priority mappings
    for (const [keyword, priority] of Object.entries(this.safetyPriority)) {
      if (hazard.includes(keyword)) {
        return priority;
      }
    }

    // Default priority for general hazards
    return 'MEDIUM';
  }

  /**
   * Generate safety advisory for results
   */
  generateSafetyAdvisory(results) {
    const safetyResults = results.filter(r => r.safety_critical);
    const highPriorityCount = results.filter(r =>
      r.metadata?.safety_priority === 'CRITICAL' || r.metadata?.safety_priority === 'HIGH'
    ).length;

    if (safetyResults.length === 0) {
      return null;
    }

    if (highPriorityCount > 0) {
      return {
        level: 'HIGH',
        message: `${highPriorityCount} safety-critical recall(s) found. Review immediately for consumer safety.`,
        action: 'Prioritize review of recalls involving death, serious injury, or children\'s products.'
      };
    }

    return {
      level: 'MEDIUM',
      message: `${safetyResults.length} safety-related recall(s) identified.`,
      action: 'Review recalls for potential safety impact to consumers.'
    };
  }

  /**
   * Extract smart snippet prioritizing safety-critical content
   */
  extractSmartSnippet(text, maxLength = 500) {
    if (!text || typeof text !== 'string') return '';

    try {
      // Clean and normalize text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      
      if (cleanText.length <= maxLength) {
        return cleanText;
      }

      // Priority sections for safety-critical content
      const prioritySections = [
        /HAZARD[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i,
        /DEFECT SUMMARY[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i,
        /REMEDY[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i,
        /DESCRIPTION OF PRODUCT[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i,
        /(?:INJURY|INCIDENT)[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i,
        /CONSUMER CONTACT[:\s]*([^.]*\.?[^.]*\.?[^.]*\.?)/i
      ];

      // Try to extract priority content
      for (const pattern of prioritySections) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const section = match[0].substring(0, maxLength - 3);
          return section + (cleanText.length > maxLength ? '...' : '');
        }
      }

      // If no priority sections found, take the beginning
      const snippet = cleanText.substring(0, maxLength - 3);
      return snippet + (cleanText.length > maxLength ? '...' : '');

    } catch (error) {
      console.warn('Error extracting smart snippet:', error);
      return text.substring(0, maxLength);
    }
  }

  /**
   * Search CPSC enforcement actions including violations, penalties, and enforcement reports via web search
   */
  async searchEnforcementWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      company_name,
      date_after,
      date_before,
      include_violations = true,
      include_penalties = true,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildEnforcementQuery({ search, company_name, date_after, date_before, include_violations, include_penalties });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_enforcement',
      domain: 'product_safety',
      summaryQuery: 'enforcement violation penalty fine settlement section 15 noncompliance CPSC regulatory company',
      numSentences: 5,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'enforcement', include_text, include_snippet)
        : this.mapCPSCResult(r, 'enforcement', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_enforcement_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            company_name,
            date_after,
            date_before,
            include_violations,
            include_penalties
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }



  /**
   * Search CPSC injury data and statistics including NEISS data via web search
   */
  async searchInjuryDataWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search = '',
      product_code,
      injury_type,
      age_group,
      date_after,
      date_before,
      include_neiss = true,
      limit = 20,
      include_text = false,
      include_snippet = false
    } = args;

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildInjuryDataQuery({ search, product_code, injury_type, age_group, date_after, date_before, include_neiss });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_injury_data',
      domain: 'product_safety',
      summaryQuery: 'injury data statistics NEISS emergency department hospital surveillance product safety count',
      numSentences: 5,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'injury_data', include_text, include_snippet)
        : this.mapCPSCResult(r, 'injury_data', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_injury_data_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            product_code,
            injury_type,
            age_group,
            date_after,
            date_before,
            include_neiss
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }


  /**
   * Search CPSC safety standards and regulations via web search
   */
  async searchSafetyStandardsWeb(args) {
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

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildSafetyStandardsQuery({ search, date_after, date_before });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_safety_standard',
      domain: 'product_safety',
      summaryQuery: 'safety standard regulation rule requirement CFR mandatory voluntary product testing',
      numSentences: 5,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'standard', include_text, include_snippet)
        : this.mapCPSCResult(r, 'standard', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_safety_standards_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search CPSC business guidance via web search
   */
  async searchBusinessGuidanceWeb(args) {
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

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildBusinessGuidanceQuery({ search, date_after, date_before });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_business_guidance',
      domain: 'product_safety',
      summaryQuery: 'business guidance manufacturer importer compliance requirements certification testing labeling',
      numSentences: 5,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'guidance', include_text, include_snippet)
        : this.mapCPSCResult(r, 'guidance', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_business_guidance_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search CPSC news, press releases, and announcements via web search
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

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildNewsQuery({ search, date_after, date_before });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_news',
      domain: 'product_safety',
      summaryQuery: 'news press release announcement recall enforcement safety alert event meeting publication date',
      numSentences: 4,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'news', include_text, include_snippet)
        : this.mapCPSCResult(r, 'news', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_news_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search CPSC reports and studies including research and analysis via web search
   */
  async searchReportsStudiesWeb(args) {
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

    // Validate dates if provided
    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildReportsStudiesQuery({ search, date_after, date_before });

    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'cpsc_report',
      domain: 'product_safety',
      summaryQuery: 'report study research analysis statistics commission statement policy position findings authors',
      numSentences: 5,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isCPSCDomain(r.url))
      .map(r => this.usePermissiveExtraction
        ? this.mapCPSCResultPermissive(r, 'report', include_text, include_snippet)
        : this.mapCPSCResult(r, 'report', include_text, include_snippet)
      );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'cpsc_reports_studies_web',
          query: query,
          total_results: processedResults.length,
          search_params: {
            search,
            date_after,
            date_before
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  // Consolidated query builders
  buildEnforcementQuery({ search, company_name, date_after, date_before, include_violations, include_penalties }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/enforcement" OR inurl:"/violations" OR inurl:"/penalties") ';
    
    const terms = [];
    if (include_violations) {
      terms.push('"violation" OR "section 15" OR "notice"');
    }
    if (include_penalties) {
      terms.push('"civil penalty" OR "fine" OR "settlement"');
    }
    if (terms.length > 0) {
      query += `(${terms.join(' OR ')}) `;
    } else {
      query += '("enforcement" OR "violation" OR "penalty") ';
    }
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (company_name) {
      query += `"${company_name}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildInjuryDataQuery({ search, product_code, injury_type, age_group, date_after, date_before, include_neiss }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/data" OR inurl:"/statistics" OR inurl:"/injury") ';
    
    if (include_neiss) {
      query += 'NEISS "emergency department" ';
    }
    
    query += '("injury data" OR "statistics" OR "surveillance") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (product_code) {
      query += `"product code ${product_code}" `;
    }
    
    if (injury_type) {
      query += `"${injury_type}" `;
    }
    
    if (age_group) {
      query += `"age ${age_group}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildSafetyStandardsQuery({ search, date_after, date_before }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/regulations" OR inurl:"/standards" OR inurl:"/rules") ';
    query += '("safety standard" OR "regulation" OR "rule" OR "CFR" OR "requirement") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildBusinessGuidanceQuery({ search, date_after, date_before }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/business" OR inurl:"/guidance" OR inurl:"/manufacturers" OR inurl:"/regulatory") ';
    query += '("business guidance" OR "compliance" OR "requirements" OR "small business") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildNewsQuery({ search, date_after, date_before }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/news" OR inurl:"/press" OR inurl:"/releases" OR inurl:"/events" OR inurl:"/meetings") ';
    query += '("news" OR "press release" OR "announcement" OR "event" OR "meeting" OR "calendar") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  buildReportsStudiesQuery({ search, date_after, date_before }) {
    let query = 'site:cpsc.gov ';
    query += '(inurl:"/reports" OR inurl:"/studies" OR inurl:"/research" OR inurl:"/commission" OR inurl:"/statements") ';
    query += '("report" OR "study" OR "research" OR "analysis" OR "commission statement" OR "policy") ';
    
    if (search && search.trim()) {
      query += `"${search.trim()}" `;
    }
    
    if (date_after || date_before) {
      query += `${date_after || '2000-01-01'}..${date_before || '2025-12-31'} `;
    }
    
    return query.trim();
  }

  /**
   * Assess CPSC result quality with safety focus
   */
  assessCPSCResultQuality(results) {
    const total = results.length;
    if (total === 0) {
      return {
        total_results: 0,
        recommendation: 'No CPSC results found'
      };
    }

    const highConfidence = results.filter(r => r.data_quality?.confidence >= 0.7).length;
    const mediumConfidence = results.filter(r =>
      r.data_quality?.confidence >= 0.4 && r.data_quality?.confidence < 0.7
    ).length;
    const lowConfidence = results.filter(r => r.data_quality?.confidence < 0.4).length;

    const cpscDomainCount = results.filter(r => r.data_quality?.is_cpsc_domain).length;
    const cpscPercentage = (cpscDomainCount / total * 100).toFixed(1);

    const withRecallNumbers = results.filter(r => r.metadata?.recall_number).length;
    const recallNumberCoverage = (withRecallNumbers / total * 100).toFixed(1);

    const safetyCriticalCount = results.filter(r => r.safety_critical).length;
    const hazardsCovered = new Set(
      results.map(r => r.metadata?.hazard_type).filter(Boolean)
    ).size;

    const avgConfidence = results.reduce((sum, r) =>
      sum + (r.data_quality?.confidence || 0), 0
    ) / total;

    return {
      total_results: total,
      high_confidence: highConfidence,
      medium_confidence: mediumConfidence,
      low_confidence: lowConfidence,
      cpsc_domain_coverage: `${cpscPercentage}%`,
      recall_number_coverage: `${recallNumberCoverage}%`,
      safety_critical_count: safetyCriticalCount,
      unique_hazards_identified: hazardsCovered,
      average_confidence: avgConfidence.toFixed(2),
      recommendation: this.generateCPSCQualityRecommendation(
        avgConfidence, cpscPercentage, safetyCriticalCount
      )
    };
  }

  /**
   * Generate quality recommendation for CPSC results
   */
  generateCPSCQualityRecommendation(avgConfidence, cpscPercentage, safetyCriticalCount) {
    if (safetyCriticalCount > 0 && avgConfidence >= 0.6) {
      return 'HIGH PRIORITY: Safety-critical recalls identified - immediate review recommended';
    } else if (avgConfidence >= 0.7 && parseFloat(cpscPercentage) >= 80) {
      return 'High quality CPSC results - official consumer safety data';
    } else if (avgConfidence >= 0.5) {
      return 'Moderate quality - verify safety details for critical recalls';
    } else {
      return 'Low quality - additional verification strongly recommended for safety data';
    }
  }
}
/**
 * FDA Web Search Client
 * Extends BaseWebSearchClient for standardized Exa integration
 *
 * Provides enhanced search capabilities for:
 * - Drug adverse events (FAERS data)
 * - Medical device events (MAUDE data)
 * - Drug labeling and prescribing information
 * - Product recalls and enforcement actions
 *
 * Features:
 * - FDA-specific summary queries for safety-critical content
 * - Smart snippet extraction with pharmaceutical safety patterns
 * - Metadata extraction (NDC numbers, recall classes, approval dates)
 * - OpenFDA query syntax conversion to web search
 * - Schema-based structured data extraction
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { FDASchemas } from './schemas/FDASchemas.js';
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';

export class FDAWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Register FDA schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(FDASchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // Feature flag for enhanced summary queries (default: OFF for safety)
    // Set ENHANCED_SUMMARY_QUERIES=true in environment to enable
    this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

    // Initialize SummaryQueryBuilder (only used if feature enabled)
    if (this.USE_ENHANCED_QUERIES) {
      this.summaryQueryBuilder = new SummaryQueryBuilder();
      console.log('[FDA] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts');
    } else {
      this.summaryQueryBuilder = null;
      console.log('[FDA] Enhanced summary queries DISABLED - using static keyword queries (default)');
    }

    // FDA-specific configuration
    this.fdaDomains = ['fda.gov', 'accessdata.fda.gov', 'clinicaltrials.gov'];
    
    // Product area mappings
    this.productAreas = {
      'drug': 'drug OR pharmaceutical OR medication',
      'device': 'device OR medical device OR implant',
      'food': 'food OR dietary supplement OR nutrition'
    };
    
    // OpenFDA field mappings to natural language
    this.fieldMappings = {
      // Drug adverse events
      'patient.drug.medicinalproduct': 'drug name',
      'patient.drug.activesubstance.activesubstancename': 'active ingredient',
      'serious': 'serious adverse event',
      'receivedate': 'report date',
      
      // Device events  
      'device.manufacturer_d_name': 'manufacturer',
      'device.brand_name': 'device brand',
      'device.generic_name': 'device type',
      
      // Drug labels
      'openfda.brand_name': 'brand name',
      'openfda.generic_name': 'generic name',
      'openfda.substance_name': 'active ingredient',
      
      // Recalls
      'reason_for_recall': 'recall reason',
      'classification': 'recall class',
      'status': 'recall status'
    };
    
    // Safety-critical terms for biasing
    this.safetyTerms = [
      'warning', 'adverse event', 'side effect', 'contraindication',
      'recall', 'safety alert', 'black box warning', 'risk',
      'serious injury', 'death', 'FDA alert'
    ];
  }

  /**
   * Search drug adverse events (FAERS data) via web search
   */
  async searchDrugAdverseEventsWeb(args) {
    // Handle empty parameters like EPA does
    if (!args || typeof args !== 'object') args = {};

    const {
      search = '',
      limit = 5,
      skip = 0,
      sort,
      count,
      include_snippet = false,
      include_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    // Convert openFDA search to web query
    const query = this.buildFDAQuery({
      search,
      dataType: 'adverse_events',
      biasTerms: ['FAERS', 'adverse event', 'drug safety', 'side effect']
    });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'FAERS adverse event drug safety side effect death serious hospitalization warning FDA';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_adverse_event',
          schema: FDASchemas.fda_adverse_event,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms; // Fallback to static query
      }
    }

    // Use BaseWebSearchClient's executeExaSearch with FDA-specific options
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'fda_adverse_event',
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'adverse_event', include_text, include_snippet));

    // Add quality assessment without filtering
    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_adverse_events_web',
          original_search: search || '(no search specified)',
          query: query,
          total_results: processedResults.length,
          quality_summary: {
            ...qualityAssessment,
            advisory: search ? null : 'No search term provided - showing general adverse event results'
          },
          results: processedResults // All results included with confidence scores
        }, null, 2)
      }]
    };
  }

  /**
   * Search medical device events (MAUDE data) via web search
   */
  async searchDeviceEventsWeb(args) {
    // Handle empty parameters like EPA does
    if (!args || typeof args !== 'object') args = {};

    const {
      search = '',
      limit = 5,
      skip = 0,
      sort,
      count,
      include_snippet = false,
      include_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    // Convert openFDA search to web query
    const query = this.buildFDAQuery({
      search,
      dataType: 'device_events',
      biasTerms: ['MAUDE', 'device event', 'medical device', 'device safety']
    });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'MAUDE device event medical device safety malfunction death injury FDA recall';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_device_event',
          schema: FDASchemas.fda_device_event,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    // Use BaseWebSearchClient's executeExaSearch with FDA-specific options
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'fda_device_event',
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'device_event', include_text, include_snippet));

    // Add quality assessment without filtering
    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_device_events_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search drug labeling and prescribing information via web search
   */
  async searchDrugLabelsWeb(args) {
    // Handle empty parameters like EPA does
    if (!args || typeof args !== 'object') args = {};

    const {
      search = '',
      limit = 5,
      skip = 0,
      sort,
      count,
      include_snippet = false,
      include_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    // Convert openFDA search to web query
    const query = this.buildFDAQuery({
      search,
      dataType: 'drug_labels',
      biasTerms: ['prescribing information', 'drug label', 'medication guide', 'package insert']
    });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'prescribing information drug label warnings contraindications dosage administration adverse reactions black box';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_drug_label',
          schema: FDASchemas.fda_drug_label,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    // Use BaseWebSearchClient's executeExaSearch with FDA-specific options
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'fda_drug_label',
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 5,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'drug_label', include_text, include_snippet));

    // Add quality assessment without filtering
    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_drug_labels_web',
          original_search: search || '(no search specified)',
          query: query,
          total_results: processedResults.length,
          quality_summary: {
            ...qualityAssessment,
            advisory: search ? null : 'No search term provided - showing general drug labeling results'
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA recalls and enforcement actions via web search
   */
  async searchRecallsWeb(args) {
    // Handle empty parameters like EPA does
    if (!args || typeof args !== 'object') args = {};

    const {
      product_area = 'drug',
      search = '',
      limit = 5,
      skip = 0,
      sort,
      count,
      include_snippet = false,
      include_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    // Convert openFDA search to web query
    const query = this.buildFDAQuery({
      search,
      dataType: 'recalls',
      productArea: product_area,
      biasTerms: ['recall', 'enforcement', 'safety alert', 'withdrawal']
    });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'recall enforcement safety alert withdrawal contamination defect FDA class risk voluntary';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_recall',
          schema: FDASchemas.fda_recall,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    // Use BaseWebSearchClient's executeExaSearch with FDA-specific options
    const results = await this.executeExaSearch(query, validatedLimit, {
      dataType: 'fda_recall',
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'recall', include_text, include_snippet));

    // Add quality assessment without filtering
    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_recalls_web',
          original_search: search,
          product_area: product_area,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Build FDA-specific query for web search (enhanced for parameter-less calls)
   * @private
   */
  buildFDAQuery(args) {
    const { search, dataType, productArea, biasTerms = [] } = args;

    let query = `(site:fda.gov OR site:accessdata.fda.gov) `;

    // Add converted openFDA search terms if provided
    if (search?.trim()) {
      const convertedSearch = this.convertOpenFDASearch(search);
      query += `"${convertedSearch}" `;
    } else {
      // If no search provided, use time-based relevance for recent content
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      query += `(${currentYear} OR ${lastYear} OR recent OR latest) `;
    }

    // Add product area if specified
    if (productArea && this.productAreas[productArea]) {
      query += `(${this.productAreas[productArea]}) `;
    }

    // Add data type specific biasing terms
    if (biasTerms.length > 0) {
      query += `(${biasTerms.join(' OR ')}) `;
    }

    // Add general safety biasing
    query += `(${this.safetyTerms.slice(0, 5).join(' OR ')})`;

    return query.trim();
  }

  /**
   * Convert openFDA Lucene-style search to natural language
   * @private
   */
  convertOpenFDASearch(search) {
    if (!search || typeof search !== 'string') return '';
    
    let converted = search;
    
    // Replace field mappings
    for (const [fdaField, naturalLanguage] of Object.entries(this.fieldMappings)) {
      const regex = new RegExp(`${fdaField.replace(/\./g, '\\.')}:([^\\s]+)`, 'gi');
      converted = converted.replace(regex, `${naturalLanguage} "$1"`);
    }
    
    // Clean up any remaining openFDA syntax
    converted = converted.replace(/\w+\.\w+:/g, ''); // Remove any remaining field: syntax
    converted = converted.replace(/[()]/g, ''); // Remove parentheses
    converted = converted.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    
    return converted || search; // Fallback to original if conversion fails
  }

  /**
   * Map Exa result to FDA document format (permissive version)
   * Always returns a structure with confidence scoring and advisory flags
   * @private
   */
  mapFDAResultPermissive(result, resultType, includeText, includeSnippet) {
    // Always return base structure - never null
    const baseResult = {
      title: result?.title || 'FDA Document',
      url: result?.url || '',
      published_date: result?.publishedDate || result?.published_date || null,
      result_type: resultType,
      data_quality: {
        has_url: !!result?.url,
        has_title: !!result?.title,
        has_content: !!(result?.text || result?.highlights?.length),
        confidence: 0
      },
      metadata: {},
      advisory_flags: [],
      score: result?.score || 0
    };

    // Calculate confidence based on available data
    let confidence = 0;
    if (result?.url) confidence += 0.3;
    if (result?.title) confidence += 0.2;
    if (result?.highlights?.length > 0) confidence += 0.3;
    if (result?.text) confidence += 0.2;

    baseResult.data_quality.confidence = confidence;

    // Add advisory flags for missing critical data
    if (!result?.url) {
      baseResult.advisory_flags.push('missing_url');
    }
    if (!result?.title) {
      baseResult.advisory_flags.push('missing_title');
    }
    if (confidence < 0.5) {
      baseResult.advisory_flags.push('low_confidence');
    }

    // Extract metadata with confidence scoring
    const extractedMetadata = this.extractFDAMetadataPermissive(result, resultType);
    baseResult.metadata = extractedMetadata.data;
    baseResult.extraction_confidence = extractedMetadata.confidence;

    // Add content based on parameters
    if (includeSnippet || !includeText) {
      baseResult.snippet = this.extractSmartSnippet(result);
    }
    // full_text field removed to prevent token overflow
    // snippet provides sufficient context for FDA results

    // Add highlight quality if available
    if (result?._highlight_quality) {
      baseResult.highlight_quality = result._highlight_quality;
    }

    return baseResult; // ALWAYS returns a structure
  }

  /**
   * Map Exa result to FDA document format (legacy version)
   * @private
   */
  mapFDAResult(result, resultType, includeText, includeSnippet) {
    if (!result || !result.url) return null;

    // Extract FDA-specific metadata
    const mapped = {
      title: result.title || 'Untitled FDA Document',
      url: result.url,
      published_date: result.publishedDate || result.published_date || null,
      result_type: resultType,
      metadata: this.extractFDAMetadata(result, resultType),
      score: result.score
    };

    // Add highlight quality metadata if available
    if (result._highlight_quality) {
      mapped.highlight_quality = result._highlight_quality;
    }

    // Add content based on parameters and what's available
    if (includeSnippet || !includeText) {
      // Use BaseWebSearchClient's extractSnippet method
      mapped.snippet = this.extractSnippet([result], 600);
    }

    if (includeText && result.text) {
      mapped.full_text = result.text;
    }

    return mapped;
  }

  /**
   * Extract FDA-specific metadata with confidence scoring (permissive version)
   * @private
   */
  extractFDAMetadataPermissive(result, resultType) {
    const metadata = {};
    const confidenceFactors = [];
    const text = result?.text || result?.title || '';

    // NDC Number extraction with multiple patterns
    const ndcPatterns = [
      /NDC[:\s]*(\d{4,5}[-\s]\d{3,4}[-\s]\d{1,2})/i,
      /NDC[:\s]*(\d{5}-\d{4}-\d{2})/i,
      /NDC[:\s]*(\d{5}-\d{3}-\d{2})/i,
      /National Drug Code[:\s]*(\d+[-\s]\d+[-\s]\d+)/i
    ];

    for (const pattern of ndcPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.ndc_number = match[1].replace(/\s/g, '-');
        metadata.ndc_confidence = ndcPatterns.indexOf(pattern) === 0 ? 1.0 : 0.8;
        confidenceFactors.push(metadata.ndc_confidence);
        break;
      }
    }

    // Recall classification with flexible patterns
    const classPatterns = [
      { pattern: /Class\s+(I{1,3})\s+recall/i, confidence: 1.0 },
      { pattern: /Class\s+([123])\s+recall/i, confidence: 0.9 },
      { pattern: /recall.*Class\s+(I{1,3})/i, confidence: 0.8 },
      { pattern: /(Class\s+I{1,3}|Class\s+[123])/i, confidence: 0.7 }
    ];

    for (const { pattern, confidence } of classPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.recall_class = match[1].replace(/\d/, d => 'I'.repeat(parseInt(d)));
        metadata.recall_class_confidence = confidence;
        confidenceFactors.push(confidence);
        break;
      }
    }

    // Adverse event severity detection with confidence
    const severityIndicators = {
      high: ['death', 'fatal', 'life-threatening', 'permanent disability'],
      medium: ['hospitalization', 'serious', 'severe'],
      low: ['mild', 'moderate', 'non-serious']
    };

    let severityConfidence = 0;
    for (const [level, terms] of Object.entries(severityIndicators)) {
      for (const term of terms) {
        if (text.toLowerCase().includes(term)) {
          metadata.severity_level = level;
          severityConfidence = level === 'high' ? 1.0 : level === 'medium' ? 0.7 : 0.5;
          metadata.severity_confidence = severityConfidence;
          confidenceFactors.push(severityConfidence);
          break;
        }
      }
      if (metadata.severity_level) break;
    }

    // Company and date extraction with fallbacks
    const companyPatterns = [
      /Company\s+Name[:\s]*([^\n\r]+)/i,
      /Manufacturer[:\s]*([^\n\r]+)/i,
      /Firm[:\s]*([^\n\r]+)/i,
      /Sponsor[:\s]*([^\n\r]+)/i
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.company = match[1].trim();
        metadata.company_confidence = companyPatterns.indexOf(pattern) === 0 ? 1.0 : 0.7;
        confidenceFactors.push(metadata.company_confidence);
        break;
      }
    }

    // Extract result-type specific metadata
    switch (resultType) {
      case 'adverse_event':
        // Extract outcome information
        const outcomeMatch = text.match(/outcome[:\s]*([^\n\r.]+)/i);
        if (outcomeMatch) {
          metadata.outcome = outcomeMatch[1].trim();
          metadata.outcome_confidence = 0.8;
          confidenceFactors.push(0.8);
        }

        // Detect serious events
        if (text.match(/serious|death|fatal|hospitalization|life-threatening/i)) {
          metadata.serious = true;
          metadata.serious_confidence = 0.9;
          confidenceFactors.push(0.9);
        }
        break;

      case 'recall':
        // Extract recall reason with multiple attempts
        let reasonMatch = text.match(/Recall\s+Reason\s+Description[\s\n\r]*([^\n\r*]+)/i);
        if (!reasonMatch) {
          reasonMatch = text.match(/Reason\s+for\s+Announcement[:\s]*([^\n\r*]+)/i);
        }
        if (!reasonMatch) {
          reasonMatch = text.match(/may\s+contain[^.]+|contamination[^.]+|defect[^.]+/i);
        }
        if (reasonMatch) {
          metadata.recall_reason = reasonMatch[0].trim();
          metadata.recall_reason_confidence = reasonMatch.index === 0 ? 1.0 : 0.7;
          confidenceFactors.push(metadata.recall_reason_confidence);
        }

        // Extract product type
        const productTypeMatch = text.match(/Product\s+Type[:\s]*([^\n\r*]+)/i);
        if (productTypeMatch) {
          metadata.product_type = productTypeMatch[1].trim();
          metadata.product_type_confidence = 0.8;
          confidenceFactors.push(0.8);
        }
        break;

      case 'drug_label':
        // Extract brand name
        const brandMatch = text.match(/brand\s+name[^:]*:[\s]*([^\n\r*]+)/i);
        if (brandMatch) {
          metadata.brand_name = brandMatch[1].trim();
          metadata.brand_name_confidence = 0.9;
          confidenceFactors.push(0.9);
        }

        // Extract strength
        const strengthMatch = text.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL))/i);
        if (strengthMatch) {
          metadata.strength = strengthMatch[1].trim();
          metadata.strength_confidence = 0.8;
          confidenceFactors.push(0.8);
        }
        break;
    }

    // Calculate overall confidence
    const overallConfidence = confidenceFactors.length > 0
      ? confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length
      : 0.3; // Base confidence if no specific extractions

    return {
      data: metadata,
      confidence: overallConfidence,
      extraction_count: Object.keys(metadata).length
    };
  }

  /**
   * Extract smart snippet from result with fallbacks
   * @private
   */
  extractSmartSnippet(result) {
    if (!result) return '';

    // Use BaseWebSearchClient's extractSnippet method which handles summary/text
    return this.extractSnippet([result], 600);
  }

  /**
   * Extract FDA-specific metadata from document (legacy version)
   * @private
   */
  extractFDAMetadata(result, resultType) {
    const metadata = {};
    const text = result.text || result.title || '';
    
    // Common FDA metadata - updated patterns based on real FDA content
    const ndcMatch = text.match(/NDC[^a-zA-Z0-9]*(\d{4,5}[-\s]\d{3,4}[-\s]\d{1,2})/i);
    if (ndcMatch) metadata.ndc_number = ndcMatch[1].replace(/\s/g, '-');
    
    // Company announcement date (common in FDA recalls)
    const announcementMatch = text.match(/Company\s+Announcement\s+Date[:\s]*([^\\n\\r]+)/i);
    if (announcementMatch) metadata.announcement_date = announcementMatch[1].trim();
    
    // FDA publish date
    const fdaDateMatch = text.match(/FDA\s+Publish\s+Date[:\s]*([^\\n\\r]+)/i);
    if (fdaDateMatch) metadata.fda_publish_date = fdaDateMatch[1].trim();
    
    // Company name (from FDA structure)
    const companyMatch = text.match(/Company\s+Name[:\s]*([^\\n\\r]+)/i);
    if (companyMatch) metadata.company_name = companyMatch[1].trim();
    
    // Result-type specific metadata based on real FDA content structure
    switch (resultType) {
      case 'adverse_event':
        // Serious event detection - look for serious outcomes or death
        if (text.match(/serious|death|fatal|hospitalization|life-threatening/i)) {
          metadata.serious = true;
        }
        
        // Extract specific adverse outcomes
        const outcomeMatch = text.match(/outcome[:\s]*([^\\n\\r.]+)/i);
        if (outcomeMatch) metadata.outcome = outcomeMatch[1].trim();
        
        break;
        
      case 'device_event':
        // Device name from FDA device event structure
        let deviceMatch = text.match(/device[^:]*:[\\s]*([^\\n\\r]+)/i);
        if (!deviceMatch) {
          deviceMatch = text.match(/product[\\s]+description[:\\s]*([^\\n\\r*]+)/i);
        }
        if (deviceMatch) metadata.device_name = deviceMatch[1].trim();
        
        // Manufacturer from company name field
        if (metadata.company_name) {
          metadata.manufacturer = metadata.company_name;
        }
        break;
        
      case 'drug_label':
        // Extract brand name and generic name
        const brandMatch = text.match(/brand\\s+name[^:]*:[\\s]*([^\\n\\r*]+)/i);
        if (brandMatch) metadata.brand_name = brandMatch[1].trim();
        
        // Look for dosage and strength in product description
        const productMatch = text.match(/product\\s+description[^:]*:[\\s]*([^\\n\\r*]+)/i);
        if (productMatch) {
          metadata.product_description = productMatch[1].trim();
          
          // Extract strength from product description
          const strengthMatch = productMatch[1].match(/(\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|g|ml|mL))/i);
          if (strengthMatch) metadata.strength = strengthMatch[1].trim();
        }
        break;
        
      case 'recall':
        // Extract recall reason from structured FDA content
        let reasonMatch = text.match(/Recall\\s+Reason\\s+Description[\\s\\n\\r]*([^\\n\\r*]+)/i);
        if (!reasonMatch) {
          reasonMatch = text.match(/Reason\\s+for\\s+Announcement[:\\s]*([^\\n\\r*]+)/i);
        }
        if (!reasonMatch) {
          // Look for reason in risk statement
          reasonMatch = text.match(/may\\s+contain[^.]+|contamination[^.]+|defect[^.]+/i);
        }
        if (reasonMatch) metadata.recall_reason = reasonMatch[0].trim();
        
        // Extract product type
        const productTypeMatch = text.match(/Product\\s+Type[:\\s]*([^\\n\\r*]+)/i);
        if (productTypeMatch) metadata.product_type = productTypeMatch[1].trim();
        
        // Look for lot numbers
        const lotMatch = text.match(/lot[\\s#]*([A-Z0-9-]+)/i);
        if (lotMatch) metadata.lot_number = lotMatch[1];
        
        // Extract recall classification if mentioned
        const classMatch = text.match(/class\\s+(I{1,3}|[123])(?:\\s+recall)?/i);
        if (classMatch) {
          metadata.recall_class = classMatch[1].replace(/\d/, (d) => 'I'.repeat(parseInt(d)));
        }
        
        break;
    }
    
    return metadata;
  }

  /**
   * Search FDA warning letters via web search
   */
  async searchWarningLettersWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false, 
      date_after, 
      date_before 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildWarningLetterQuery({ search, date_after, date_before });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'warning letter violation cGMP inspection FDA enforcement consent decree';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_warning_letter',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'warning_letter', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_warning_letters_web',
          original_search: search || '(no search specified)',
          query: query,
          total_results: processedResults.length,
          quality_summary: {
            ...qualityAssessment,
            advisory: search ? null : 'No search term provided - showing general warning letter results'
          },
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA drug safety communications via web search
   */
  async searchDrugSafetyCommunicationsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false, 
      date_after, 
      date_before 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildDrugSafetyCommQuery({ search, date_after, date_before });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'drug safety communication FDA alert MedWatch warning risk';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_safety_communication',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 5,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'drug_safety_comm', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_drug_safety_communications_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA device safety communications via web search
   */
  async searchDeviceSafetyCommunicationsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false, 
      date_after, 
      date_before 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildDeviceSafetyCommQuery({ search, date_after, date_before });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'device safety communication FDA alert medical device warning recall';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_device_safety_communication',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 5,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'device_safety_comm', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_device_safety_communications_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA drug shortages via web search
   */
  async searchDrugShortagesWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildDrugShortageQuery({ search });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'drug shortage unavailable discontinued supply manufacturing';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_drug_shortage',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'drug_shortage', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_drug_shortages_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA 510(k) premarket notifications via web search
   */
  async search510kWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false, 
      date_after, 
      date_before 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.build510kQuery({ search, date_after, date_before });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = '510k premarket notification predicate device substantial equivalence clearance';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_510k',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, '510k', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_510k_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA PMA approvals via web search
   */
  async searchPMAApprovalsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false, 
      date_after, 
      date_before 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildPMAQuery({ search, date_after, date_before });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'PMA premarket approval medical device Class III high risk FDA approval';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_pma',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'pma_approval', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_pma_approvals_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA Orange Book via web search
   */
  async searchOrangeBookWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildOrangeBookQuery({ search });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'Orange Book therapeutic equivalence AB rating generic bioequivalence patent exclusivity';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_orange_book',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'orange_book', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_orange_book_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search FDA Purple Book via web search
   */
  async searchPurpleBookWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    
    const { 
      search = '', 
      limit = 5, 
      include_snippet = false, 
      include_text = false 
    } = args;

    const validatedLimit = validateLimit(limit, 10);

    const query = this.buildPurpleBookQuery({ search });

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'Purple Book biological product biosimilar interchangeable reference product biologic';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: search,
          dataType: 'fda_purple_book',
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[FDA] Enhanced query build failed, using fallback:', error.message);
        summaryQuery = baseTerms;
      }
    }

    const results = await this.executeExaSearch(query, validatedLimit, {
      domain: 'pharmaceutical_safety',
      summaryQuery: summaryQuery,
      numSentences: 4,
      includeDomains: this.fdaDomains,
      includeFullText: include_text
    });
    
    const processedResults = results
      .filter(r => this.isFDADomain(r.url))
      .map(r => this.mapFDAResultPermissive(r, 'purple_book', include_text, include_snippet));

    const qualityAssessment = this.assessFDAResultQuality(processedResults);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'fda_purple_book_web',
          original_search: search,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Build FDA warning letter query for web search
   * @private
   */
  buildWarningLetterQuery(args) {
    const { search, date_after, date_before } = args;
    let query = `(site:fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `"warning letter" (violation OR cGMP OR adulterated OR misbranded OR consent)`;
    return query.trim();
  }

  /**
   * Build drug safety communication query for web search
   * @private
   */
  buildDrugSafetyCommQuery(args) {
    const { search, date_after, date_before } = args;
    let query = `(site:fda.gov/drugs/drug-safety-and-availability) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `("drug safety communication" OR "MedWatch" OR "safety alert") (risk OR warning OR alert)`;
    return query.trim();
  }

  /**
   * Build device safety communication query for web search
   * @private
   */
  buildDeviceSafetyCommQuery(args) {
    const { search, date_after, date_before } = args;
    let query = `(site:fda.gov/medical-devices/safety) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `("safety communication" OR "device alert" OR "safety notice") ("medical device" OR "device safety")`;
    return query.trim();
  }

  /**
   * Build drug shortage query for web search
   * @private
   */
  buildDrugShortageQuery(args) {
    const { search } = args;
    let query = `(site:fda.gov/drugs/drug-shortages) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `("drug shortage" OR "currently in shortage" OR "resolved shortage") (discontinued OR unavailable OR supply)`;
    return query.trim();
  }

  /**
   * Build 510(k) query for web search
   * @private
   */
  build510kQuery(args) {
    const { search, date_after, date_before } = args;
    let query = `(site:fda.gov/medical-devices OR site:accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `"510(k)" ("premarket notification" OR "substantial equivalence" OR "clearance")`;
    return query.trim();
  }

  /**
   * Build PMA query for web search
   * @private
   */
  buildPMAQuery(args) {
    const { search, date_after, date_before } = args;
    let query = `(site:fda.gov/medical-devices OR site:accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `"PMA" ("premarket approval" OR "Class III" OR "high risk device")`;
    return query.trim();
  }

  /**
   * Build Orange Book query for web search
   * @private
   */
  buildOrangeBookQuery(args) {
    const { search } = args;
    let query = `(site:fda.gov/drugs OR site:accessdata.fda.gov/scripts/cder/ob) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `("Orange Book" OR "therapeutic equivalence" OR "AB rating") (generic OR patent OR exclusivity)`;
    return query.trim();
  }

  /**
   * Build Purple Book query for web search
   * @private
   */
  buildPurpleBookQuery(args) {
    const { search } = args;
    let query = `(site:fda.gov/drugs OR site:purplebooksearch.fda.gov) `;
    
    if (search?.trim()) {
      query += `"${search}" `;
    }
    
    query += `("Purple Book" OR "biological product" OR "biosimilar") (interchangeable OR "reference product")`;
    return query.trim();
  }

  /**
   * Check if URL is from FDA domain
   * @private
   */
  isFDADomain(url) {
    if (!url) return false;
    return this.fdaDomains.some(domain => url.includes(domain));
  }

  /**
   * Assess the quality of FDA search results without filtering
   * @private
   */
  assessFDAResultQuality(results) {
    if (!results || results.length === 0) {
      return {
        total_results: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        critical_data_coverage: '0%',
        recommendation: 'No results to assess'
      };
    }

    const highConfidence = results.filter(r => r.data_quality?.confidence >= 0.8);
    const mediumConfidence = results.filter(r =>
      r.data_quality?.confidence >= 0.5 && r.data_quality?.confidence < 0.8
    );
    const lowConfidence = results.filter(r => r.data_quality?.confidence < 0.5);

    const criticalDataPresent = results.filter(r => {
      switch(r.result_type) {
        case 'adverse_event':
          return r.metadata?.severity_level || r.metadata?.outcome || r.metadata?.serious;
        case 'recall':
          return r.metadata?.recall_class || r.metadata?.recall_reason || r.metadata?.product_type;
        case 'drug_label':
          return r.metadata?.ndc_number || r.metadata?.brand_name || r.metadata?.strength;
        case 'device_event':
          return r.metadata?.device_name || r.metadata?.manufacturer;
        case 'warning_letter':
          return r.metadata?.company || r.metadata?.violations;
        default:
          return Object.keys(r.metadata || {}).length > 0;
      }
    });

    return {
      total_results: results.length,
      high_confidence: highConfidence.length,
      medium_confidence: mediumConfidence.length,
      low_confidence: lowConfidence.length,
      critical_data_coverage: (criticalDataPresent.length / results.length * 100).toFixed(1) + '%',
      recommendation: this.generateQualityRecommendation(results)
    };
  }

  /**
   * Generate quality recommendation based on result analysis
   * @private
   */
  generateQualityRecommendation(results) {
    if (!results || results.length === 0) {
      return 'No results available';
    }

    const avgConfidence = results.reduce((sum, r) =>
      sum + (r.data_quality?.confidence || 0), 0
    ) / results.length;

    const hasHighQuality = results.some(r => r.data_quality?.confidence >= 0.8);
    const criticalDataCount = results.filter(r => {
      return Object.keys(r.metadata || {}).length > 2; // Has substantial metadata
    }).length;

    if (avgConfidence >= 0.7 && hasHighQuality) {
      return 'High quality results - proceed with confidence';
    } else if (avgConfidence >= 0.5 || criticalDataCount >= results.length * 0.5) {
      return 'Moderate quality - consider additional verification for critical decisions';
    } else if (avgConfidence >= 0.3) {
      return 'Low quality - results may need manual review or refinement';
    } else {
      return 'Very low quality - consider refining search parameters or using alternative sources';
    }
  }
}




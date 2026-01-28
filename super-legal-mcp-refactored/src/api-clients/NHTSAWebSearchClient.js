/**
 * NHTSA Web Search Client
 * Powered by Exa WebSearch API
 *
 * Migrated to schema-based architecture (Phase 3.8b)
 * Uses NHTSASchemas for structured data extraction via Exa summary parameter
 *
 * Provides enhanced search capabilities for:
 * - VIN decoding and vehicle information
 * - Vehicle recalls by VIN or make/model/year
 * - Consumer complaints and defect reports
 * - NCAP safety ratings and crash test data
 *
 * Features:
 * - Direct web content search via nhtsa.gov and vpic.nhtsa.dot.gov
 * - Smart snippet extraction with automotive safety patterns
 * - Metadata extraction (campaign IDs, recall numbers, safety ratings)
 * - Conditional content fetching for performance optimization
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { NHTSASchemas } from './schemas/NHTSASchemas.js';

export class NHTSAWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Register NHTSA schemas for schema-based extraction
    if (this.contentStrategy) {
      Object.entries(NHTSASchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // NHTSA-specific configuration
    this.domains = ['nhtsa.gov', 'vpic.nhtsa.dot.gov', 'static.nhtsa.gov'];
    
    // Vehicle component mappings
    this.componentMappings = {
      'engine': 'ENGINE OR MOTOR OR POWERTRAIN',
      'brake': 'BRAKE OR BRAKING SYSTEM',
      'airbag': 'AIRBAG OR AIR BAG OR SRS',
      'steering': 'STEERING OR WHEEL OR COLUMN',
      'suspension': 'SUSPENSION OR STRUT OR SHOCK',
      'transmission': 'TRANSMISSION OR GEARBOX',
      'fuel': 'FUEL SYSTEM OR GAS TANK',
      'electrical': 'ELECTRICAL OR WIRING OR BATTERY'
    };
    
    // Safety-critical terms for biasing
    this.safetyTerms = [
      'recall', 'defect', 'safety', 'crash', 'injury', 'death',
      'investigation', 'campaign', 'remedy', 'fix', 'repair',
      'NHTSA', 'ODI', 'preliminary evaluation', 'engineering analysis'
    ];

    // NHTSA document types
    this.documentTypes = {
      'recall': 'recall campaign OR safety recall',
      'investigation': 'defect investigation OR preliminary evaluation',
      'complaint': 'consumer complaint OR defect report',
      'rating': 'safety rating OR crash test OR NCAP',
      'vin_decode': 'vehicle specifications OR VIN decode'
    };

    // Add confidence thresholds for permissive extraction
    this.confidenceLevels = {
      HIGH: 0.8,
      MEDIUM: 0.5,
      LOW: 0.2,
      MINIMAL: 0.1
    };

    // NHTSA-specific extraction patterns
    this.nhtsaPatterns = {
      campaign_id: [
        // Core patterns - flexible with format
        /\b(\d{2,4}[VET]-?\d{3,4})\b/i,  // Most common: 23V-456, 23V456, 2023V-7041
        /\b([A-Z]{2,4}-?\d{2,4}[A-Z]-?\d{3,4})\b/i,  // With prefix: RCAK-23V-704

        // Context-based patterns (permissive)
        /(?:Recall|Campaign|NHTSA|ODI|RCAK|RCRIT)[^\d]*(\d{2,4}[A-Z]?-?\d{3,4})/i,
        /(?:Campaign|Recall)\s+(?:Number|ID|#)[:\s]*(\d{2,4}[A-Z]-?\d{3,4})/i,

        // Loose patterns for edge cases
        /\b(\d{2,4}-\d{3,4})\b/,  // Simple number-dash-number
        /ID[:\s#]*([A-Z0-9-]{4,12})/i,  // Any ID followed by reasonable identifier

        // Super permissive catch-all
        /\b([A-Z0-9]{2,4}-[A-Z0-9]{3,4})\b/i
      ],
      recall_number: [
        /Recall\s+(\d{2,4}[VET]-\d{3,4})/i,
        /Recall\s+Number[:\s]*(\d{2,4}[A-Z]-\d{3,4})/i,
        /Campaign[:\s]*(\d{2,4}[A-Z]-\d{3,4})/i,
        /Safety\s+Recall[:\s]*(\d{2,4}[A-Z]-\d{3,4})/i
      ],
      vin_pattern: [
        /\b[A-HJ-NPR-Z0-9]{17}\b/,  // Standard 17-character VIN
        /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i
      ],
      investigation_id: [
        /([A-Z]{2}\d{2}-\d{3})/,  // PE23-001, EA22-005
        /Investigation\s+(\S+\d{2}-\d{3})/i,
        /ODI\s+Number[:\s]*(\S+)/i
      ]
    };
  }

  /**
   * Decode VIN via web search
   */
  async decodeVinWeb(args) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      vin,
      include_snippet = false,
      include_text = false
    } = args;

    // Handle invalid VIN (provided but too short) - fallback to general VIN decoder search
    if (vin && String(vin).length < 11) {
      const fallbackQuery = this.buildNHTSAQuery({
        searchType: 'vin_decode',
        generalTerms: ['VIN decoder', 'vehicle information', 'NHTSA VIN'],
        biasTerms: ['VIN decode', 'vehicle specifications', 'make model year']
      });

      const results = await this.executeExaSearch(fallbackQuery, 5, {
        dataType: 'nhtsa_vin_decode',
        domain: 'automotive',
        summaryQuery: 'VIN decode vehicle specifications make model year engine transmission drive type fuel',
        numSentences: 7,
        includeDomains: this.domains,
        includeFullText: include_text
      });

      const processedResults = results
        .filter(r => this.isNHTSADomain(r.url))
        .map(r => this.mapNHTSAResult(r, 'vin_decode', include_text, include_snippet));

      // Add quality assessment
      const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

      // Sort by confidence but keep all results
      processedResults.sort((a, b) =>
        (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            search_type: 'nhtsa_vin_decode_web',
            vin: vin,
            query: fallbackQuery,
            total_results: processedResults.length,
            quality_summary: qualityAssessment,
            safety_advisory: qualityAssessment.safety_critical_count > 0
              ? 'SAFETY CRITICAL: Review vehicle information immediately'
              : null,
            results: processedResults
          }, null, 2)
        }]
      };
    }

    const query = this.buildNHTSAQuery({
      searchType: 'vin_decode',
      vin,
      biasTerms: ['VIN decode', 'vehicle specifications', 'make model year']
    });

    const results = await this.executeExaSearch(query, 5, {
      dataType: 'nhtsa_vin_decode',
      domain: 'automotive',
      summaryQuery: 'VIN decode vehicle specifications make model year engine transmission drive type fuel',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    // Extract structured VIN data using parent class capabilities
    const structuredVinData = this.extractStructuredDataFromHighlights(
      results, 
      'vehicle_info',
      { sourceUrl: results[0]?.url, vinPattern: vin }
    );

    // Process results with permissive mapping
    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'vin_decode', include_text, include_snippet));

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    // Enhance results with structured data
    const enhancedResults = {
      search_type: 'nhtsa_vin_decode_web',
      vin: vin,
      query: query,
      total_results: processedResults.length,
      quality_summary: qualityAssessment,
      safety_advisory: qualityAssessment.safety_critical_count > 0
        ? 'SAFETY CRITICAL: Review vehicle information immediately'
        : null,
      results: processedResults
    };

    // Add structured vehicle information if extracted successfully
    if (structuredVinData && structuredVinData.length > 0) {
      enhancedResults.structured_data = {
        vehicle_specifications: structuredVinData,
        extraction_confidence: structuredVinData[0]?.extraction_confidence || 0.5
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(enhancedResults, null, 2)
      }]
    };
  }

  /**
   * Get models for a make via web search
   */
  async getModelsForMakeWeb(args) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      make,
      year,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart fallback for empty make - show popular US make
    if (!make) {
      const defaultMake = 'Ford'; // Most popular US make
      return this.getModelsForMakeWeb({
        make: defaultMake,
        year: year || 2023,
        include_snippet,
        include_text
      });
    }

    const query = this.buildNHTSAQuery({
      searchType: 'models',
      make,
      year,
      biasTerms: ['vehicle models', 'make model', 'specifications']
    });

    const results = await this.executeExaSearch(query, 10, {
      dataType: 'nhtsa_vehicle_model',
      domain: 'automotive',
      summaryQuery: 'vehicle models make model specifications trim engine body styles year',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'vehicle_models', include_text, include_snippet));

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'nhtsa_models_web',
          make: make,
          year: year,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          safety_advisory: qualityAssessment.safety_critical_count > 0
            ? 'SAFETY CRITICAL: Review vehicle information immediately'
            : null,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Get recalls by VIN via web search
   */
  async getRecallsByVinWeb(args) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      vin,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart fallback for empty VIN - show recent recalls
    if (!vin) {
      const fallbackQuery = this.buildNHTSAQuery({
        searchType: 'recall',
        generalTerms: ['vehicle recall', 'NHTSA safety campaign', 'automotive defect'],
        biasTerms: ['recall', 'safety campaign', 'defect', 'remedy']
      });

      const results = await this.executeExaSearch(fallbackQuery, 15, {
        dataType: 'nhtsa_recall',
        domain: 'automotive',
        summaryQuery: 'recall defect NHTSA safety investigation campaign remedy manufacturer make model component',
        numSentences: 7,
        includeDomains: this.domains,
        includeFullText: include_text
      });

      const processedResults = results
        .filter(r => this.isNHTSADomain(r.url))
        .map(r => this.mapNHTSAResult(r, 'recall', include_text, include_snippet));

      // Add quality assessment
      const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

      // Sort by confidence but keep all results
      processedResults.sort((a, b) =>
        (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            search_type: 'nhtsa_recalls_vin_web',
            vin: null,
            query: fallbackQuery,
            total_results: processedResults.length,
            quality_summary: qualityAssessment,
            safety_advisory: qualityAssessment.safety_critical_count > 0
              ? 'SAFETY CRITICAL: Review recall information immediately'
              : null,
            results: processedResults
          }, null, 2)
        }]
      };
    }

    const query = this.buildNHTSAQuery({
      searchType: 'recall',
      vin,
      biasTerms: ['recall', 'safety campaign', 'defect', 'remedy']
    });

    const results = await this.executeExaSearch(query, 15, {
      dataType: 'nhtsa_recall',
      domain: 'automotive',
      summaryQuery: 'recall defect NHTSA safety investigation campaign remedy manufacturer make model component',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'recall', include_text, include_snippet));

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'nhtsa_recalls_vin_web',
          vin: vin,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          safety_advisory: qualityAssessment.safety_critical_count > 0
            ? 'SAFETY CRITICAL: Review recall information immediately'
            : null,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Get recalls by make/model/year via web search
   */
  async getRecallsByMakeModelYearWeb(args) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      make,
      model,
      year,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart fallback for empty parameters - show recent recalls for popular vehicle
    if (!make || !model || !year) {
      const defaultMake = make || 'Toyota';
      const defaultModel = model || 'Camry';
      const defaultYear = year || 2023;
      
      return this.getRecallsByMakeModelYearWeb({
        make: defaultMake,
        model: defaultModel,
        year: defaultYear,
        include_snippet,
        include_text
      });
    }

    const query = this.buildNHTSAQuery({
      searchType: 'recall',
      make,
      model,
      year,
      biasTerms: ['recall', 'safety campaign', 'defect', 'remedy']
    });

    const results = await this.executeExaSearch(query, 20, {
      dataType: 'nhtsa_recall',
      domain: 'automotive',
      summaryQuery: 'recall defect NHTSA safety investigation campaign remedy manufacturer make model component',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'recall', include_text, include_snippet));

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'nhtsa_recalls_vehicle_web',
          make: make,
          model: model,
          year: year,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          safety_advisory: qualityAssessment.safety_critical_count > 0
            ? 'SAFETY CRITICAL: Review recall information immediately'
            : null,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Search consumer complaints via web search
   */
  async searchComplaintsWeb(args) {
    // Handle empty parameters gracefully (EPA pattern) 
    if (!args || typeof args !== 'object') args = {};

    const {
      make,
      model,
      year,
      vin,
      limit = 50,
      start = 0,
      include_snippet = false,
      include_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 100);

    // Allow empty search - will return recent complaints
    const query = this.buildNHTSAQuery({
      searchType: 'complaint',
      make,
      model,
      year,
      vin,
      biasTerms: ['complaint', 'consumer report', 'defect', 'problem']
    });

    const results = await this.executeExaSearch(query, Math.min(validatedLimit + start, 100), {
      dataType: 'nhtsa_complaint',
      domain: 'automotive',
      summaryQuery: 'complaint consumer report defect problem NHTSA ODI investigation crash fire injury component',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'complaint', include_text, include_snippet))
      .slice(start, start + validatedLimit);

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'nhtsa_complaints_web',
          search_params: { make, model, year, vin },
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          safety_advisory: qualityAssessment.safety_critical_count > 0
            ? 'SAFETY CRITICAL: Review complaint information immediately'
            : null,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Get safety ratings via web search
   */
  async getSafetyRatingsWeb(args) {
    // Handle empty parameters gracefully (EPA pattern)
    if (!args || typeof args !== 'object') args = {};

    const {
      year,
      make,
      model,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart fallback for empty parameters - show top-rated vehicles
    if (!year || !make || !model) {
      const defaultYear = year || 2023;
      const defaultMake = make || 'Honda';
      const defaultModel = model || 'Accord';
      
      return this.getSafetyRatingsWeb({
        year: defaultYear,
        make: defaultMake,
        model: defaultModel,
        include_snippet,
        include_text
      });
    }

    const query = this.buildNHTSAQuery({
      searchType: 'rating',
      year,
      make,
      model,
      biasTerms: ['safety rating', 'NCAP', 'crash test', '5-star', 'overall rating']
    });

    const results = await this.executeExaSearch(query, 10, {
      dataType: 'nhtsa_safety_rating',
      domain: 'automotive',
      summaryQuery: 'safety rating NCAP crash test 5-star overall rating NHTSA frontal side rollover',
      numSentences: 7,
      includeDomains: this.domains,
      includeFullText: include_text
    });

    const processedResults = results
      .filter(r => this.isNHTSADomain(r.url))
      .map(r => this.mapNHTSAResult(r, 'safety_rating', include_text, include_snippet));

    // Add quality assessment
    const qualityAssessment = this.assessNHTSAResultQuality(processedResults);

    // Sort by confidence but keep all results
    processedResults.sort((a, b) =>
      (b.data_quality?.confidence || 0) - (a.data_quality?.confidence || 0)
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_type: 'nhtsa_safety_ratings_web',
          year: year,
          make: make,
          model: model,
          query: query,
          total_results: processedResults.length,
          quality_summary: qualityAssessment,
          safety_advisory: qualityAssessment.safety_critical_count > 0
            ? 'SAFETY CRITICAL: Review safety rating information immediately'
            : null,
          results: processedResults
        }, null, 2)
      }]
    };
  }

  /**
   * Build NHTSA-specific search query
   */
  buildNHTSAQuery(args) {
    const { searchType, make, model, year, vin, biasTerms = [] } = args;

    let query = `(site:nhtsa.gov OR site:vpic.nhtsa.dot.gov)`;

    // Add vehicle identifiers
    if (vin) {
      query += ` "${vin}"`;
    } else {
      if (make) query += ` "${make}"`;
      if (model) query += ` "${model}"`;
      if (year) query += ` ${year}`;
    }

    // Add document type terms
    if (this.documentTypes[searchType]) {
      query += ` (${this.documentTypes[searchType]})`;
    }

    // Add biasing terms
    if (biasTerms.length > 0) {
      query += ` (${biasTerms.join(' OR ')})`;
    }

    // Smart fallback for empty search - provide recent NHTSA activity
    if (!vin && !make && !model && !year) {
      query += ' recall safety defect recent investigation campaign';
    }

    return query;
  }

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
   * Check if URL is from NHTSA domain
   */
  isNHTSADomain(url) {
    if (!url || typeof url !== 'string') return false;
    return this.domains.some(domain => url.includes(domain));
  }

  /**
   * Create base NHTSA result structure
   */
  createNHTSAResult(baseData = {}) {
    return {
      ...baseData,
      _extraction_metadata: {
        confidence: 0,
        source: null,
        extraction_method: null,
        attempted_patterns: [],
        successful_patterns: [],
        safety_critical: false
      },
      _advisory_flags: [],
      _quality_score: 0
    };
  }

  /**
   * Map NHTSA search result to consistent format (permissive)
   */
  mapNHTSAResultPermissive(result, resultType, includeText, includeSnippet) {
    // Always return base structure - never null
    const nhtsaResult = this.createNHTSAResult({
      title: result?.title || 'NHTSA Safety Document',
      url: result?.url || '',
      published_date: result?.publishedDate || null,
      result_type: resultType,
      data_quality: {
        has_url: !!result?.url,
        has_title: !!result?.title,
        has_content: !!(result?.text || result?.highlights?.length),
        is_nhtsa_domain: this.isNHTSADomain(result?.url),
        confidence: 0
      },
      metadata: {},
      advisory_flags: []
    });

    // Assess input quality
    if (!result) {
      nhtsaResult._advisory_flags.push('no_result_data');
      nhtsaResult._extraction_metadata.confidence = 0.05;
      return nhtsaResult;
    }

    // Calculate confidence based on data availability
    let confidence = 0;
    if (result.url) confidence += 0.2;
    if (this.isNHTSADomain(result.url)) confidence += 0.3;
    if (result.title) confidence += 0.2;
    if (result.highlights?.length > 0) confidence += 0.2;
    if (result.text) confidence += 0.1;

    nhtsaResult.data_quality.confidence = confidence;

    // Handle missing title gracefully
    if (!result.title) {
      nhtsaResult._advisory_flags.push('missing_title');
      // Try to extract title from content
      const extractedTitle = this.extractTitleFromContent(result);
      if (extractedTitle) {
        nhtsaResult.title = extractedTitle;
        nhtsaResult._extraction_metadata.successful_patterns.push('content_title_extraction');
        confidence += 0.1;
      } else {
        // Generate contextual title based on result type
        nhtsaResult.title = this.generateNHTSATitle(resultType);
        nhtsaResult._advisory_flags.push('generated_title');
      }
    }

    // Mark as safety-critical for certain types
    if (['recall', 'defect_investigation', 'safety_complaint'].includes(resultType)) {
      nhtsaResult._extraction_metadata.safety_critical = true;
    }

    // Add low confidence flag if needed
    if (confidence < 0.5) {
      nhtsaResult._advisory_flags.push('low_confidence');
    }

    // Extract NHTSA metadata with confidence scoring
    const extractedMetadata = this.extractNHTSAMetadataPermissive(result, resultType);
    nhtsaResult.metadata = extractedMetadata.data;
    nhtsaResult.extraction_confidence = extractedMetadata.confidence;

    // Map key fields
    nhtsaResult.campaign_id = extractedMetadata.data.campaign_id;
    nhtsaResult.recall_number = extractedMetadata.data.recall_number;
    nhtsaResult.investigation_id = extractedMetadata.data.investigation_id;
    nhtsaResult.vin = extractedMetadata.data.vin;
    nhtsaResult.make = extractedMetadata.data.make;
    nhtsaResult.model = extractedMetadata.data.model;
    nhtsaResult.year = extractedMetadata.data.year;

    // Add content based on parameters
    if (includeSnippet || !includeText) {
      nhtsaResult.snippet = this.extractNHTSASnippet(result, resultType);
    }
    if (includeText && result?.text) {
      nhtsaResult.full_text = result.text;
    }

    // Add highlight quality if available
    if (result?._highlight_quality) {
      nhtsaResult.highlight_quality = result._highlight_quality;
    }

    return nhtsaResult;  // ALWAYS returns a structure
  }

  /**
   * Map NHTSA search result to consistent format
   */
  mapNHTSAResult(result, resultType, includeText, includeSnippet) {
    // Use feature flag for gradual rollout
    if (process.env.NHTSA_PERMISSIVE_MODE === 'true') {
      return this.mapNHTSAResultPermissive(result, resultType, includeText, includeSnippet);
    }

    // Legacy behavior for backwards compatibility
    if (!result || !result.title) return null;

    // Determine content source and quality
    const isHighlightMode = result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0;
    const contentSource = isHighlightMode ? 'highlights' : 'full_text';
    const content = this.extractContentFromResult(result);

    const mapped = {
      title: result.title,
      url: result.url,
      published_date: result.publishedDate || null,
      result_type: resultType,
      metadata: this.extractNHTSAMetadata(result),
      score: result.score || null
    };

    // Add content quality metadata for transparency
    mapped._content_quality = {
      source: contentSource,
      confidence: this.calculateExtractionConfidence(content, resultType),
      highlight_count: isHighlightMode ? result.highlights.length : 0
    };

    // Add snippet if requested - use parent class method for highlights
    if (includeSnippet) {
      if (isHighlightMode) {
        mapped.snippet = this.extractSmartSnippetFromHighlights([result], 500);
      } else if (content) {
        mapped.snippet = this.extractSmartSnippet(content, 500);
      }
    }

    // Add full text if requested
    if (includeText && result.text) {
      mapped.full_text = result.text;
      // If we have full text but no snippet, create one
      if (!mapped.snippet && includeSnippet) {
        mapped.snippet = this.extractSmartSnippet(result.text, 500);
      }
    }

    return mapped;
  }

  /**
   * Extract NHTSA-specific metadata with confidence scoring
   */
  extractNHTSAMetadata(result) {
    const metadata = {};
    const text = this.extractContentFromResult(result);
    const url = result.url || '';
    const title = result.title || '';

    // Track extraction sources for confidence scoring
    const extractionSources = [];
    let confidence = 0.0;

    // Extract NHTSA campaign ID (format: ##V-###, ##E-###, etc.)
    const campaignId = text.match(/(\d{2}[VET]-\d{3})/);
    if (campaignId) {
      metadata.nhtsa_campaign_id = campaignId[1];
      confidence += 0.25;
      extractionSources.push('campaign_id');
    }

    // Extract recall number
    const recallNumber = text.match(/Recall Number:?\s*([A-Z0-9-]+)/i);
    if (recallNumber) {
      metadata.recall_number = recallNumber[1];
      confidence += 0.2;
      extractionSources.push('recall_number');
    }

    // Extract component
    const component = text.match(/Component:?\s*([^\\n]+)/i);
    if (component) {
      metadata.component = component[1].trim();
      confidence += 0.15;
      extractionSources.push('component');
    }

    // Extract potential units affected
    const unitsAffected = text.match(/Units Affected:?\s*([\\d,]+)/i);
    if (unitsAffected) {
      metadata.potential_units_affected = unitsAffected[1].replace(/,/g, '');
      confidence += 0.15;
      extractionSources.push('units_affected');
    }

    // Extract manufacturer recall date
    const mfrRecallDate = text.match(/Manufacturer Recall Date:?\s*([\\d\\/\\-]+)/i);
    if (mfrRecallDate) {
      metadata.manufacturer_recall_date = mfrRecallDate[1];
      confidence += 0.1;
      extractionSources.push('mfr_date');
    }

    // Extract NHTSA action date
    const actionDate = text.match(/NHTSA Action Date:?\s*([\\d\\/\\-]+)/i);
    if (actionDate) {
      metadata.nhtsa_action_date = actionDate[1];
      confidence += 0.1;
      extractionSources.push('action_date');
    }

    // Extract safety rating (5-star system)
    const overallRating = text.match(/Overall Rating:?\s*([1-5])\s*star/i);
    if (overallRating) {
      metadata.overall_safety_rating = parseInt(overallRating[1]);
      confidence += 0.2;
      extractionSources.push('safety_rating');
    }

    // Boost confidence for NHTSA domain URLs
    if (url.includes('nhtsa.gov') || url.includes('vpic.nhtsa.dot.gov')) {
      confidence += 0.2;
      extractionSources.push('official_domain');
    }

    // Boost confidence for NHTSA-specific titles
    if (title.match(/nhtsa|recall|campaign|safety/i)) {
      confidence += 0.1;
      extractionSources.push('relevant_title');
    }

    // Add confidence metadata (similar to FederalRegisterWebSearchClient pattern)
    const metadataConfidence = this.assessNHTSAMetadataConfidence(result, metadata, extractionSources);
    metadata._confidence = {
      overall_score: Math.min(confidence, 1.0),
      field_count: Object.keys(metadata).length - 1, // Exclude _confidence itself
      sources: extractionSources,
      quality_indicators: metadataConfidence
    };

    return metadata;
  }

  /**
   * Assess confidence in NHTSA metadata extraction (similar to FederalRegisterWebSearchClient)
   */
  assessNHTSAMetadataConfidence(result, metadata, extractionSources) {
    const indicators = {
      domain_authority: false,
      structured_content: false,
      multiple_fields: false,
      official_patterns: false
    };

    let confidence = 0.5; // Base confidence

    // Check domain authority
    const url = result.url || '';
    if (url.includes('nhtsa.gov') || url.includes('vpic.nhtsa.dot.gov')) {
      indicators.domain_authority = true;
      confidence += 0.3;
    }

    // Check for structured content patterns
    const text = this.extractContentFromResult(result);
    const structuredPatterns = ['Campaign ID:', 'Recall Number:', 'Component:', 'Units Affected:'];
    const foundPatterns = structuredPatterns.filter(pattern => text.includes(pattern));
    if (foundPatterns.length >= 2) {
      indicators.structured_content = true;
      confidence += 0.2;
    }

    // Check for multiple extracted fields
    const fieldCount = Object.keys(metadata).filter(key => !key.startsWith('_')).length;
    if (fieldCount >= 3) {
      indicators.multiple_fields = true;
      confidence += 0.2;
    }

    // Check for official NHTSA patterns
    if (text.match(/\d{2}[VET]-\d{3}/) || text.match(/NHTSA|National Highway Traffic Safety Administration/i)) {
      indicators.official_patterns = true;
      confidence += 0.1;
    }

    return {
      confidence: Math.min(confidence, 1.0),
      indicators,
      extraction_method: result.highlights ? 'highlights' : 'full_text',
      field_coverage: fieldCount / 7 // Total possible fields
    };
  }

  /**
   * Extract smart snippet with NHTSA-specific patterns
   */
  extractSmartSnippet(text, maxLength = 500) {
    if (!text || text.length < 50) return '';

    // Clean and normalize text
    let cleanText = text.replace(/\\s+/g, ' ').trim();

    // NHTSA safety priority patterns
    const priorityPatterns = [
      /DEFECT SUMMARY[:\\s]*([^\\n]{100,500})/i,
      /CONSEQUENCE[:\\s]*([^\\n]{100,500})/i,
      /REMEDY[:\\s]*([^\\n]{100,500})/i,
      /SAFETY RISK[:\\s]*([^\\n]{100,500})/i,
      /MANUFACTURER RESPONSE[:\\s]*([^\\n]{100,500})/i,
      /AFFECTED VEHICLES[:\\s]*([^\\n]{100,500})/i,
      /SUMMARY[:\\s]*([^\\n]{100,400})/i,
      /DESCRIPTION[:\\s]*([^\\n]{100,400})/i
    ];

    // Try to find priority content
    for (const pattern of priorityPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const snippet = match[1].trim();
        if (snippet.length >= 50) {
          return snippet.length > maxLength 
            ? snippet.substring(0, maxLength) + '...'
            : snippet;
        }
      }
    }

    // Fallback: use beginning of text if no priority patterns found
    if (cleanText.length > maxLength) {
      const truncated = cleanText.substring(0, maxLength);
      const lastSentence = truncated.lastIndexOf('. ');
      if (lastSentence > maxLength * 0.7) {
        return truncated.substring(0, lastSentence + 1);
      }
      return truncated + '...';
    }

    return cleanText;
  }

  /**
   * Extract NHTSA metadata with confidence scoring (permissive)
   */
  extractNHTSAMetadataPermissive(result, resultType) {
    const metadata = {};
    const confidenceFactors = [];
    const contentText = this.extractContentFromResult(result);
    const url = result?.url || '';
    const title = result?.title || '';

    // Enhanced campaign ID extraction - try multiple sources, keep best match
    const searchTexts = [
      { text: title || '', confidence: 0.9, source: 'title' },
      { text: url || '', confidence: 0.95, source: 'url' },
      { text: (contentText || '').substring(0, 500), confidence: 0.85, source: 'content_header' },
      { text: contentText || '', confidence: 0.7, source: 'content_body' }
    ];

    let bestCampaignMatch = null;
    let bestCampaignConfidence = 0;

    for (const searchItem of searchTexts) {
      if (!searchItem.text) continue;

      for (const pattern of this.nhtsaPatterns.campaign_id) {
        // Use matchAll to find all instances and pick the best one
        const matches = searchItem.text.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
          if (match && match[1]) {
            const candidateId = match[1].toUpperCase().replace(/^0+/, ''); // Remove leading zeros

            // Permissive validation - just check it looks reasonable
            if (candidateId.length >= 4 && candidateId.length <= 12) {
              let confidence = searchItem.confidence;

              // Boost confidence if it matches expected NHTSA formats
              if (/^\d{2,4}[VET]-?\d{3,4}$/.test(candidateId)) {
                confidence = Math.min(confidence + 0.1, 1.0);
              }

              if (confidence > bestCampaignConfidence) {
                bestCampaignMatch = {
                  id: candidateId,
                  confidence: confidence,
                  source: searchItem.source
                };
                bestCampaignConfidence = confidence;
              }
            }
          }
        }
      }
    }

    // Apply the best campaign ID match found
    if (bestCampaignMatch) {
      metadata.campaign_id = bestCampaignMatch.id;
      metadata.campaign_id_confidence = bestCampaignMatch.confidence;
      metadata.campaign_id_source = bestCampaignMatch.source;
      confidenceFactors.push(bestCampaignMatch.confidence);

      // Also set as recall number if appropriate
      if (resultType === 'recall' && !metadata.recall_number) {
        metadata.recall_number = bestCampaignMatch.id;
      }
    }

    // If still no campaign ID, try contextual extraction
    if (!metadata.campaign_id && contentText) {
      const contextualPattern = /(?:this|the|our|investigation|recall|campaign|case|matter|proceeding|action|docket|file|reference|ref|no|number|#)\s*(?:is|:|\s)\s*([A-Z0-9][A-Z0-9-]{3,11})\b/i;
      const contextMatch = contentText.match(contextualPattern);
      if (contextMatch && contextMatch[1]) {
        metadata.campaign_id = contextMatch[1].toUpperCase();
        metadata.campaign_id_confidence = 0.5;  // Lower confidence for contextual match
        metadata.campaign_id_source = 'contextual';
        confidenceFactors.push(0.5);
      }
    }

    // VIN extraction
    for (const pattern of this.nhtsaPatterns.vin_pattern) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.vin = match[1] || match[0];
        metadata.vin_confidence = 0.9;
        confidenceFactors.push(0.9);
        break;
      }
    }

    // Investigation ID extraction
    for (const pattern of this.nhtsaPatterns.investigation_id) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.investigation_id = match[1];
        metadata.investigation_confidence = 0.9;
        confidenceFactors.push(0.9);
        break;
      }
    }

    // Extract vehicle info from URL first (highest confidence)
    const urlVehicleInfo = this.extractVehicleFromURL(url);
    if (urlVehicleInfo) {
      // Only set if we don't already have the data or URL data is more complete
      if (!metadata.year && urlVehicleInfo.year) {
        metadata.year = urlVehicleInfo.year;
        metadata.year_confidence = urlVehicleInfo.confidence;
        metadata.year_source = urlVehicleInfo.source;
      }
      if (!metadata.make && urlVehicleInfo.make) {
        metadata.make = urlVehicleInfo.make;
        metadata.make_confidence = urlVehicleInfo.confidence;
        metadata.make_source = urlVehicleInfo.source;
      }
      if (!metadata.model && urlVehicleInfo.model) {
        metadata.model = urlVehicleInfo.model;
        metadata.model_confidence = urlVehicleInfo.confidence;
        metadata.model_source = urlVehicleInfo.source;
      }

      // Only add to confidence if we extracted meaningful data
      if (urlVehicleInfo.make && urlVehicleInfo.model) {
        confidenceFactors.push(urlVehicleInfo.confidence);
      } else if (urlVehicleInfo.year) {
        confidenceFactors.push(urlVehicleInfo.confidence * 0.7); // Partial data gets lower weight
      }
    }

    // Vehicle make/model/year extraction from content (if not found in URL)
    if (!metadata.make || !metadata.model || !metadata.year) {
      const vehiclePatterns = [
        /(\d{4})\s+([A-Z][a-z]+)\s+([A-Z][a-zA-Z\s]+)/,  // 2023 Toyota Camry
        /Make:\s*([^\n,]+).*Model:\s*([^\n,]+).*Year:\s*(\d{4})/is,
        /([A-Z][a-z]+)\s+([A-Z][a-zA-Z\s]+)\s+\((\d{4})\)/,  // Toyota Camry (2023)
        // More permissive patterns
        /\b([A-Z][a-z]{3,15})\s+([A-Z][a-zA-Z\s]{3,25})\s+(\d{4})\b/,  // Make Model Year
        /\b(\d{4})\s+([A-Z][a-z]{2,15})[^\w]*([A-Z][a-zA-Z\s]{2,25})\b/  // Year Make Model
      ];

      for (const pattern of vehiclePatterns) {
        const match = contentText.match(pattern);
        if (match) {
          let year, make, model, confidence = 0.8;

          if (pattern.source && pattern.source.includes('Make:')) {
            make = match[1].trim();
            model = match[2].trim();
            year = parseInt(match[3]);
            confidence = 0.9; // Structured data has higher confidence
          } else if (match[1].length === 4 && parseInt(match[1]) >= 1900) {
            year = parseInt(match[1]);
            make = match[2].trim();
            model = match[3].trim();
          } else if (match[3] && match[3].length === 4 && parseInt(match[3]) >= 1900) {
            make = match[1].trim();
            model = match[2].trim();
            year = parseInt(match[3]);
          } else {
            continue; // Skip if we can't parse the pattern properly
          }

          // Only set if we don't already have better data
          if (!metadata.make && make) metadata.make = make;
          if (!metadata.model && model) metadata.model = model;
          if (!metadata.year && year) metadata.year = year;

          if (make && model && year) {
            metadata.vehicle_confidence = confidence;
            confidenceFactors.push(confidence);
            break;
          }
        }
      }
    }

    // Component extraction for recalls/investigations
    const componentPattern = /(?:Component|System|Part):\s*([^\n]+)/i;
    const componentMatch = contentText.match(componentPattern);
    if (componentMatch) {
      metadata.component = componentMatch[1].trim();
      metadata.component_confidence = 0.7;
      confidenceFactors.push(0.7);
    }

    // Manufacturer extraction
    const mfrPatterns = [
      /Manufacturer:\s*([^\n]+)/i,
      /(?:Made|Manufactured|Built)\s+by\s+([^\n,]+)/i,
      /MFR:\s*([^\n]+)/i
    ];

    for (const pattern of mfrPatterns) {
      const match = contentText.match(pattern);
      if (match) {
        metadata.manufacturer = match[1].trim();
        metadata.manufacturer_confidence = 0.8;
        confidenceFactors.push(0.8);
        break;
      }
    }

    // Safety rating extraction (for NCAP results)
    const ratingPattern = /(\d)\s*(?:star|★)/i;
    const ratingMatch = contentText.match(ratingPattern);
    if (ratingMatch && resultType === 'safety_rating') {
      metadata.star_rating = parseInt(ratingMatch[1]);
      metadata.rating_confidence = 0.9;
      confidenceFactors.push(0.9);
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
   * Extract title from content when missing
   */
  extractTitleFromContent(result) {
    const contentText = this.extractContentFromResult(result);

    // Try to find title-like patterns
    const titlePatterns = [
      /Recall\s+(\d{2}[VET]-\d{3})/i,  // Recall number as title
      /Investigation\s+([A-Z]{2}\d{2}-\d{3})/i,  // Investigation ID
      /(\d{4}\s+[A-Z][a-z]+\s+[A-Z][a-zA-Z\s]+)\s+Recall/i,  // Vehicle recall
      /^([A-Z][A-Z\s]+)$/m  // All caps line
    ];

    for (const pattern of titlePatterns) {
      const match = contentText.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    // Fallback: Use first sentence if reasonable
    const firstSentence = contentText.match(/^[^.!?]{10,100}[.!?]/);
    if (firstSentence) {
      return firstSentence[0].trim();
    }

    return null;
  }

  /**
   * Extract vehicle information from NHTSA URLs
   * @param {string} url - URL to extract vehicle info from
   * @returns {Object|null} Vehicle information with confidence
   */
  extractVehicleFromURL(url) {
    if (!url || typeof url !== 'string') return null;

    // Decode URL first to handle encoded characters
    const decodedUrl = decodeURIComponent(url);

    // Multiple patterns to handle various NHTSA URL formats
    const patterns = [
      // Standard NHTSA vehicle paths
      /\/vehicle\/(\d{4})\/([^\/]+)\/([^\/\?]+)/i,
      /\/Recalls\/vehicle\/(\d{4})\/([^\/]+)\/([^\/\?]+)/i,

      // General year-make-model patterns
      /(\d{4})[\/_-]([^\/\-_]+)[\/_-]([^\/\-_\.\?]+)/i,

      // Query parameters
      /year=(\d{4})[&\s].*make=([^&]+)[&\s].*model=([^&]+)/i,

      // Any reasonable vehicle pattern in URL
      /\b(\d{4})\b.*?\b([A-Z][a-z]+)\b.*?\b([A-Z][a-z]+[\s\w]*)\b/i
    ];

    for (const pattern of patterns) {
      const match = decodedUrl.match(pattern);
      if (match) {
        // Clean up extracted values
        const year = parseInt(match[1]);
        const make = match[2].replace(/[%+_-]/g, ' ').trim();
        const model = match[3].replace(/[%+_-]/g, ' ').trim();

        // Basic validation - be permissive but reasonable
        if (year >= 1900 && year <= 2050 && make && model && make.length > 1 && model.length > 1) {
          return {
            year: year,
            make: make,
            model: model,
            confidence: 0.95,
            source: 'url_extraction'
          };
        }
      }
    }

    // Even if we can't extract all three, try to get partial info
    const yearMatch = decodedUrl.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      // Look for make names near the year
      const makeMatch = decodedUrl.match(new RegExp(`${yearMatch[1]}[^a-zA-Z]*([A-Z][a-z]{2,20})`, 'i'));
      if (makeMatch) {
        return {
          year: parseInt(yearMatch[1]),
          make: makeMatch[1],
          model: null,
          confidence: 0.7,
          source: 'url_partial'
        };
      }

      return {
        year: parseInt(yearMatch[1]),
        make: null,
        model: null,
        confidence: 0.5,
        source: 'url_year_only'
      };
    }

    return null;
  }

  /**
   * Generate contextual title based on result type
   */
  generateNHTSATitle(resultType) {
    const titles = {
      'recall': 'Vehicle Safety Recall',
      'defect_investigation': 'NHTSA Defect Investigation',
      'vin_decode': 'Vehicle Information',
      'vehicle_models': 'Vehicle Models',
      'safety_rating': 'NCAP Safety Rating',
      'safety_complaint': 'Consumer Safety Complaint'
    };
    return titles[resultType] || 'NHTSA Safety Document';
  }

  /**
   * Extract smart snippet for NHTSA content
   */
  extractNHTSASnippet(result, resultType, maxLength = 600) {
    if (!result) return '';

    // Prioritize highlights if available
    if (result.highlights && result.highlights.length > 0) {
      return this.extractSmartSnippetFromHighlights([result], maxLength);
    }

    // Fallback to text extraction
    const text = result.text || result.title || '';
    if (!text) return '';

    // Try to find the most relevant portion based on result type
    const relevantPatterns = {
      'recall': [
        /recall.{0,200}/gi,
        /remedy.{0,200}/gi,
        /defect.{0,200}/gi
      ],
      'defect_investigation': [
        /investigation.{0,200}/gi,
        /complaint.{0,200}/gi,
        /failure.{0,200}/gi
      ],
      'safety_rating': [
        /star.{0,200}/gi,
        /crash.{0,200}/gi,
        /test.{0,200}/gi
      ]
    };

    const patterns = relevantPatterns[resultType] || [/safety.{0,200}/gi];

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
   * Assess quality of NHTSA result set
   */
  assessNHTSAResultQuality(results) {
    if (!results || results.length === 0) {
      return {
        total_results: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        nhtsa_domain_coverage: '0%',
        campaign_id_coverage: '0%',
        safety_critical_count: 0,
        recommendation: 'No NHTSA results to assess'
      };
    }

    const highConfidence = results.filter(r => r.data_quality?.confidence >= 0.8);
    const mediumConfidence = results.filter(r =>
      r.data_quality?.confidence >= 0.5 && r.data_quality?.confidence < 0.8
    );
    const lowConfidence = results.filter(r => r.data_quality?.confidence < 0.5);

    const nhtsaDomainResults = results.filter(r => r.data_quality?.is_nhtsa_domain);
    const withCampaignIds = results.filter(r => r.metadata?.campaign_id);
    const safetyCritical = results.filter(r => r._extraction_metadata?.safety_critical);
    const withVehicleInfo = results.filter(r =>
      r.metadata?.make && r.metadata?.model && r.metadata?.year
    );

    return {
      total_results: results.length,
      high_confidence: highConfidence.length,
      medium_confidence: mediumConfidence.length,
      low_confidence: lowConfidence.length,
      nhtsa_domain_coverage: (nhtsaDomainResults.length / results.length * 100).toFixed(1) + '%',
      campaign_id_coverage: (withCampaignIds.length / results.length * 100).toFixed(1) + '%',
      vehicle_info_coverage: (withVehicleInfo.length / results.length * 100).toFixed(1) + '%',
      safety_critical_count: safetyCritical.length,
      recommendation: this.generateNHTSAQualityRecommendation(results)
    };
  }

  /**
   * Generate quality recommendation for NHTSA results
   */
  generateNHTSAQualityRecommendation(results) {
    const avgConfidence = results.reduce((sum, r) =>
      sum + (r.data_quality?.confidence || 0), 0
    ) / results.length;

    const nhtsaPercentage = results.filter(r =>
      r.data_quality?.is_nhtsa_domain
    ).length / results.length;

    const safetyCriticalCount = results.filter(r =>
      r._extraction_metadata?.safety_critical
    ).length;

    if (safetyCriticalCount > 0 && avgConfidence >= 0.7) {
      return 'High priority safety information - immediate review recommended';
    } else if (avgConfidence >= 0.7 && nhtsaPercentage >= 0.8) {
      return 'High quality NHTSA results - official safety data';
    } else if (avgConfidence >= 0.5) {
      return 'Moderate quality - verify critical safety details';
    } else {
      return 'Low quality - additional verification strongly recommended for safety data';
    }
  }
}
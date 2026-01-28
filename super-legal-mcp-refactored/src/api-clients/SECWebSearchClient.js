/**
 * SEC Web Search Client - Schema-Based Implementation
 * Uses Exa's AI-powered summary with schema-based structured data extraction
 */

import { validateDate, validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { SECSchemas } from './schemas/SECSchemas.js';
import { SummaryQueryBuilder } from './SummaryQueryBuilder.js';

export class SECWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter) {
    super(rateLimiter, process.env.EXA_API_KEY);

    // Register SEC schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(SECSchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // Feature flag for enhanced summary queries (default: OFF for safety)
    // Set ENHANCED_SUMMARY_QUERIES=true in environment to enable
    this.USE_ENHANCED_QUERIES = process.env.ENHANCED_SUMMARY_QUERIES === 'true';

    // Initialize SummaryQueryBuilder (only used if feature enabled)
    if (this.USE_ENHANCED_QUERIES) {
      this.summaryQueryBuilder = new SummaryQueryBuilder();
      console.log('[SEC] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts');
    } else {
      this.summaryQueryBuilder = null;
      console.log('[SEC] Enhanced summary queries DISABLED - using static keyword queries (default)');
    }

    this.domain = 'securities';

    // Add confidence thresholds
    this.confidenceLevels = {
      HIGH: 0.8,
      MEDIUM: 0.5,
      LOW: 0.2,
      MINIMAL: 0.1
    };

    // Feature flag for permissive mode
    this.usePermissiveExtraction = process.env.SEC_PERMISSIVE_MODE !== 'false';
  }

  /**
   * Create base extraction result structure with confidence metadata
   * @private
   */
  createExtractionResult(baseData = {}) {
    return {
      ...baseData,
      _extraction_metadata: {
        confidence: 0,
        source: null,
        extraction_method: null,
        attempted_patterns: [],
        successful_patterns: []
      },
      _advisory_flags: [],
      _quality_score: 0
    };
  }

  /**
   * Search SEC filings via Exa with highlights-based extraction
   */
  async searchSECFilingsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const {
      company_identifier,
      filing_type = 'all',
      date_after,
      date_before,
      limit,
      include_text = false,
      include_snippet = false
    } = args;

    // Smart limit based on content type
    let smartLimit = 5;  // Default for metadata/snippets
    if (include_text === true) {
      smartLimit = 2;  // Reduce when full text requested
    }
    const finalLimit = limit || smartLimit;

    // Handle missing company_identifier gracefully instead of throwing
    const hasCompanyIdentifier = company_identifier && String(company_identifier).trim().length > 0;

    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(finalLimit, 20);

    // PHASE 2: Resolve company identifier to ticker/CIK for optimal search
    // Company names with special characters (& . ,) often fail in Exa searches
    // Resolution converts "JPMorgan Chase & Co." → "JPM" for better matching
    let searchIdentifier = company_identifier;
    let resolvedCIK = null;
    let resolutionSource = 'original';

    if (hasCompanyIdentifier) {
      try {
        const resolved = await this._resolveCompanyIdentifier(company_identifier);
        searchIdentifier = resolved.identifier;
        resolvedCIK = resolved.cik;
        resolutionSource = resolved.source;

        if (resolved.source === 'resolved') {
          console.log(`[SEC] Resolved "${resolved.originalInput}" → ticker: ${resolved.identifier}, CIK: ${resolved.cik}`);
        }
      } catch (error) {
        console.warn(`[SEC] Company identifier resolution failed, using original: ${error.message}`);
        // Fallback to original identifier on error
      }
    }

    // Build targeted search query
    let query = 'site:sec.gov ';  // Broader search to include non-Archives SEC content
    if (hasCompanyIdentifier) query += `"${searchIdentifier}" `;  // Use resolved identifier
    if (filing_type && filing_type !== 'all') query += `"Form ${filing_type}" `;
    query += hasCompanyIdentifier ? '("FORM" OR "Form" OR "Filing") ' : 'SEC filing EDGAR 2024 2025 ';

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'SEC filing form 10-K 10-Q 8-K company revenue income financial statements accession CIK filing date';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        // Extract user search term (use resolved identifier for better context)
        const userTerm = hasCompanyIdentifier ? searchIdentifier : null;
        if (userTerm) {
          summaryQuery = this.summaryQueryBuilder.build({
            userSearchTerm: userTerm,
            dataType: 'sec_filing',
            schema: SECSchemas.sec_filing,
            baseTerms: baseTerms
          });
        }
      } catch (error) {
        console.warn('[SEC] Enhanced query build failed for searchSECFilingsWeb, using fallback:', error.message);
      }
    }

    // Execute search with schema-based extraction
    const results = await this.executeExaSearch(query.trim(), validatedLimit, {
      dataType: 'sec_filing',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 8,
      includeDomains: ['www.sec.gov', 'sec.gov'],
      includeFullText: include_text
    });

    // Map results using permissive schema-based extraction
    const filingsAll = results
      .filter(r => r.url?.includes('sec.gov'))  // Broader SEC domain check
      .map(r => this.usePermissiveExtraction
        ? this.mapFilingFromHighlightsPermissive(r, include_text, include_snippet)
        : this.mapFilingFromHighlights(r, include_text, include_snippet)
      )
      .filter(r => this.usePermissiveExtraction ? true : Boolean(r));  // Permissive: no filtering

    // Apply client-side filters (permissive mode: keep filings even if metadata extraction failed)
    let filings = filingsAll;
    if (filing_type && filing_type !== 'all') {
      // In permissive mode, if NO filings have form types extracted, keep all filings
      // This prevents filtering out all results when extraction fails
      const filingsWithFormType = filingsAll.filter(f => f.form && f.form.length > 0);

      if (this.usePermissiveExtraction && filingsWithFormType.length === 0) {
        // Permissive: keep all filings if extraction failed, add advisory
        console.warn(`[SEC] Form type extraction failed for all ${filingsAll.length} filings - keeping all results (permissive mode)`);
        filings = filingsAll;  // Keep all
      } else {
        // Normal: filter by form type
        filings = filings.filter(f =>
          (f.form || '').toUpperCase().includes(filing_type.toUpperCase())
        );
      }
    }
    if (date_after) filings = filings.filter(f => !f.filingDate || f.filingDate >= date_after);
    if (date_before) filings = filings.filter(f => !f.filingDate || f.filingDate <= date_before);

    filings = filings.slice(0, validatedLimit);

    // Build company info from first result
    const first = filings[0] || {};
    const company = {
      name: first.company || company_identifier || 'Unknown Company',
      cik: resolvedCIK || first.cik || null,  // Prefer resolved CIK from ticker lookup
      ticker: null,
      sic: null,
      sicDescription: null
    };

    // Add quality assessment using new permissive method
    const qualityAssessment = this.usePermissiveExtraction
      ? this.assessSECFilingQuality(filingsAll)
      : null;

    const response = {
      company,
      filings: filings.map(f => ({
        accessionNumber: f.accessionNumber || null,
        filingDate: f.filingDate || null,
        form: f.form || null,
        primaryDocument: f.primaryDocument || null,
        reportDate: f.reportDate || null,
        edgar_url: f.url || null,
        ...(f.snippet && f.snippet.length > 0 && { snippet: f.snippet }),
        ...(f.full_text && { full_text: f.full_text }),
        ...(f._extraction_quality && { _extraction_quality: f._extraction_quality }),
        ...(this.usePermissiveExtraction && f.data_quality && { data_quality: f.data_quality }),
        ...(this.usePermissiveExtraction && f.advisory_flags && { advisory_flags: f.advisory_flags })
      })),
      search_criteria: { filing_type, date_after, date_before, limit: validatedLimit },
      // Resolution metadata for debugging and transparency
      ...(hasCompanyIdentifier && {
        _resolution: {
          original_input: company_identifier,
          resolved_identifier: searchIdentifier,
          resolution_source: resolutionSource,
          resolved_cik: resolvedCIK,
          ...(resolutionSource === 'resolved' && {
            note: `Company name "${company_identifier}" automatically resolved to ticker "${searchIdentifier}" for optimal search performance`
          })
        }
      }),
      ...(qualityAssessment && { quality_summary: qualityAssessment }),
      ...(this.usePermissiveExtraction && !hasCompanyIdentifier && {
        advisory: 'No company identifier provided - showing general SEC results'
      })
    };

    // Calculate quality metadata (legacy method for backward compatibility)
    const qualityMetadata = this.assessSECQueryRelevance(company_identifier || '', results, response.filings, args);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...response,
          ...qualityMetadata
        }, null, 2)
      }]
    };
  }

  /**
   * Get company facts using highlights-based financial data extraction
   */
  async getSECCompanyFactsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { company_identifier, concept } = args;

    if (!company_identifier || String(company_identifier).trim().length === 0) {
      throw new Error(
        'company_identifier is required for SEC searches. ' +
        'Example: search_sec_filings({ company_identifier: "JPMorgan Chase", filing_type: "10-K" }). ' +
        'Accepts: Company name (e.g., "Apple Inc."), ticker (e.g., "AAPL"), or CIK (e.g., "0000320193"). ' +
        'Tip: Company names are automatically resolved to tickers for optimal results.'
      );
    }

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = 'revenue net income earnings EBITDA assets liabilities cash flow financial results quarterly annual';
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: company_identifier,
          dataType: 'sec_financial',
          schema: SECSchemas.sec_financial,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[SEC] Enhanced query build failed for getSECCompanyFactsWeb, using fallback:', error.message);
      }
    }

    // Search for financial filings with schema-based extraction
    const query = `site:sec.gov/Archives "${company_identifier}" (10-K OR 10-Q)`;
    const results = await this.executeExaSearch(query, 10, {
      dataType: 'sec_financial',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 10,
      includeDomains: ['www.sec.gov', 'sec.gov']
    });

    // Extract financial metrics from highlights
    const metrics = this.extractFinancialMetricsFromHighlights(results);

    let parsed = {};
    if (concept) {
      const conceptKey = String(concept).toLowerCase();
      const conceptData = Object.keys(metrics)
        .filter(k => k.toLowerCase().includes(conceptKey))
        .reduce((o, k) => { o[k] = metrics[k]; return o; }, {});

      parsed = {
        company: { name: company_identifier, cik: null },
        concept: concept,
        data: conceptData,
        available_concepts: Object.keys(metrics)
      };
    } else {
      parsed = {
        company: { name: company_identifier, cik: null },
        taxonomies: ['us-gaap (extracted from highlights)'],
        concept_counts: { 'highlights_extraction': Object.keys(metrics).length },
        key_metrics: metrics
      };
    }

    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  }

  /**
   * Get XBRL frames using highlights-based concept extraction
   */
  async getSECXBRLFramesWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { taxonomy = 'us-gaap', concept, unit = 'USD', period, limit = 5 } = args;
    if (!concept) {
      throw new Error(
        'concept is required for XBRL frames. ' +
        'Example: get_sec_xbrl_frames({ concept: "Assets", period: "CY2023Q4I" }). ' +
        'Common concepts: Assets, Revenues, NetIncomeLoss, AccountsPayableCurrent.'
      );
    }
    if (!period) {
      throw new Error(
        'period is required for XBRL frames. ' +
        'Example: get_sec_xbrl_frames({ concept: "Assets", period: "CY2023Q4I" }). ' +
        'Format: CY2023Q4I (Q4 2023 instant), CY2023 (full year).'
      );
    }

    const validatedLimit = validateLimit(limit, 100);

    // Search for concept mentions across SEC filings with better financial context
    const conceptSearchTerms = {
      'Revenues': 'revenue sales "net sales" "total revenue"',
      'Assets': 'assets "total assets" "current assets"',
      'NetIncomeLoss': '"net income" "net loss" earnings profit',
      'CashAndCashEquivalents': 'cash "cash equivalent"'
    }[concept] || concept;

    // Build summary query (enhanced or static based on feature flag)
    const baseTerms = `${concept} ${unit} financial data quarterly annual period`;
    let summaryQuery = baseTerms;

    if (this.USE_ENHANCED_QUERIES && this.summaryQueryBuilder) {
      try {
        // Use concept as search term for XBRL frames
        summaryQuery = this.summaryQueryBuilder.build({
          userSearchTerm: concept,
          dataType: 'sec_xbrl_concept',
          schema: SECSchemas.sec_xbrl_concept,
          baseTerms: baseTerms
        });
      } catch (error) {
        console.warn('[SEC] Enhanced query build failed for getSECXBRLFramesWeb, using fallback:', error.message);
      }
    }

    const query = `site:sec.gov/Archives/edgar/data (${conceptSearchTerms}) ${unit} financial statement 10-K 10-Q`;
    const results = await this.executeExaSearch(query, Math.min(validatedLimit, 50), {
      dataType: 'sec_xbrl_concept',
      domain: this.domain,
      summaryQuery: summaryQuery,
      numSentences: 6,
      includeDomains: ['www.sec.gov', 'sec.gov']
    });

    // Extract concept values from highlights
    const data = this.extractConceptValuesFromHighlights(results, concept, unit);

    const output = {
      taxonomy,
      tag: concept,
      label: concept,
      description: `Concept extracted from SEC filings via highlights`,
      unit,
      period,
      count: data.length,
      data: data.slice(0, validatedLimit),
      extraction_method: 'highlights_based',
      confidence: data.length > 0 ? 0.8 : 0.3
    };

    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
  }

  /**
   * Search company tickers (unchanged - uses direct API)
   */
  async searchSECCompanyTickersWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { search_term, exchange } = args;
    if (!search_term || String(search_term).trim().length === 0) {
      throw new Error(
        'search_term is required for SEC company ticker lookup. ' +
        'Example: search_sec_company_tickers({ search_term: "Apple" }). ' +
        'This helps find CIK numbers and verify company identifiers.'
      );
    }

    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Super Legal MCP (contact@example.com)'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch company tickers: ${response.status} ${response.statusText}`);
    }
    const tickersResponse = await response.json();
    const companies = Object.values(tickersResponse);
    const searchTermUpper = String(search_term).toUpperCase();

    let results = companies.filter(company =>
      String(company.ticker).toUpperCase().includes(searchTermUpper) ||
      String(company.title).toUpperCase().includes(searchTermUpper)
    );

    if (exchange) {
      results = results.filter(c => String(c.exchange).toUpperCase() === String(exchange).toUpperCase());
    }

    results.sort((a, b) => {
      const t = searchTermUpper;
      if (String(a.ticker).toUpperCase() === t) return -1;
      if (String(b.ticker).toUpperCase() === t) return 1;
      if (String(a.ticker).toUpperCase().startsWith(t)) return -1;
      if (String(b.ticker).toUpperCase().startsWith(t)) return 1;
      return String(a.title).localeCompare(String(b.title));
    });

    const payload = {
      search_term,
      count: results.length,
      results: results.slice(0, 50).map(company => ({
        ticker: company.ticker,
        name: company.title,
        cik: String(company.cik_str).padStart(10, '0'),
        exchange: company.exchange
      }))
    };

    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }

  // ===== HIGHLIGHTS-BASED EXTRACTION METHODS =====

  /**
   * Map SEC filing from highlights instead of complex regex
   */
  mapFilingFromHighlights(result, includeFullText, includeSnippet) {
    const url = result.url || '';
    const highlights = result.highlights || [];
    const text = result.text || '';

    if (!url.includes('/Archives/')) return null;

    // Extract structured data from URL (most reliable)
    const urlMatch = url.match(/\/Archives\/edgar\/data\/(\d+)\/(\d+)\/([^\/?#]+)/i);
    const cik = urlMatch ? urlMatch[1] : null;
    const accDigits = urlMatch ? urlMatch[2] : null;
    const primary = urlMatch ? urlMatch[3] : null;

    // Format accession number
    let accessionNumber = null;
    if (accDigits && /^\d{18}$/.test(accDigits)) {
      accessionNumber = `${accDigits.slice(0,10)}-${accDigits.slice(10,12)}-${accDigits.slice(12)}`;
    }

    // Extract filing information from highlights
    const filingInfo = this.extractFilingInfoFromHighlights(highlights, result.title, text);

    const mapped = {
      url,
      cik: cik ? String(cik).padStart(10, '0') : null,
      accessionNumber,
      primaryDocument: primary || null,
      form: filingInfo.form || null,
      filingDate: filingInfo.filingDate || null,
      reportDate: filingInfo.reportDate || null,
      company: filingInfo.company || null
    };
    
    // Add highlights as snippet
    if (includeSnippet) {
      mapped.snippet = this.extractSnippet([result], 500);
    }
    
    // Add full text if requested
    if (includeFullText && text) {
      mapped.full_text = text;
    }
    
    // Add quality metadata
    if (result._highlight_quality) {
      mapped._extraction_quality = result._highlight_quality;
    }
    
    return mapped;
  }

  /**
   * Map SEC filing from highlights with permissive approach (never returns null)
   * @private
   */
  mapFilingFromHighlightsPermissive(result, includeFullText, includeSnippet) {
    // Always return base structure - never null
    const baseFiling = {
      title: result?.title || 'SEC Filing',
      url: result?.url || '',
      published_date: result?.publishedDate || null,
      data_quality: {
        has_url: !!result?.url,
        has_title: !!result?.title,
        has_content: !!(result?.summary || result?.text || result?.highlights?.length),
        is_edgar_archive: result?.url?.includes('/Archives/') || false,
        confidence: 0
      },
      metadata: {},
      advisory_flags: [],
      score: result?.score || 0
    };

    // Calculate confidence based on data availability
    let confidence = 0;
    if (result?.url) confidence += 0.25;
    if (result?.url?.includes('/Archives/')) confidence += 0.25;  // EDGAR archive bonus
    if (result?.title) confidence += 0.15;
    if (result?.highlights?.length > 0) confidence += 0.25;
    if (result?.text) confidence += 0.1;

    baseFiling.data_quality.confidence = confidence;

    // Add advisory flags for quality issues
    if (!result?.url?.includes('/Archives/')) {
      baseFiling.advisory_flags.push('non_edgar_archive_url');
    }
    if (!result?.url) {
      baseFiling.advisory_flags.push('missing_url');
    }
    if (confidence < 0.5) {
      baseFiling.advisory_flags.push('low_confidence');
    }

    // Extract filing metadata with confidence scoring
    const extractedMetadata = this.extractSECMetadataPermissive(result);
    baseFiling.metadata = extractedMetadata.data;
    baseFiling.extraction_confidence = extractedMetadata.confidence;

    // Map to SEC filing structure
    baseFiling.accessionNumber = extractedMetadata.data.accession_number;
    baseFiling.form = extractedMetadata.data.form_type;
    baseFiling.filingDate = extractedMetadata.data.filing_date;
    baseFiling.company = extractedMetadata.data.company_name;
    baseFiling.cik = extractedMetadata.data.cik;

    // Add content based on parameters
    if (includeSnippet || !includeFullText) {
      baseFiling.snippet = this.extractSnippet([result], 600);
    }
    if (includeFullText && result?.text) {
      baseFiling.full_text = result.text;
    }

    return baseFiling;  // ALWAYS returns a structure
  }

  /**
   * Extract filing information from highlights using context understanding
   */
  extractFilingInfoFromHighlights(highlights, title, fullText) {
    const info = {
      form: null,
      filingDate: null,
      reportDate: null,
      company: null
    };

    // Combine all text sources
    const allText = [title, ...highlights, fullText].filter(Boolean).join(' ');

    // Form type extraction (improved patterns)
    const formMatch = allText.match(/\b(10-K|10-Q|8-K|20-F|DEF\s*14A|S-1|Form\s*[0-9A-Z\-]+)\b/i);
    if (formMatch) {
      info.form = formMatch[1].replace(/Form\s*/i, '').trim();
    }

    // Date extraction with multiple patterns
    const filingDateMatch = allText.match(/(?:filed|filing\s*date)[:\s]*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) || 
                           allText.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    if (filingDateMatch) {
      info.filingDate = filingDateMatch[1];
    }

    const reportDateMatch = allText.match(/(?:report\s*date|period\s*end)[:\s]*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (reportDateMatch) {
      info.reportDate = reportDateMatch[1];
    }

    // Company name from title
    if (title) {
      const titleParts = title.split(/[-|\u2013]/);
      if (titleParts.length > 0) {
        info.company = titleParts[0].trim();
      }
    }

    return info;
  }

  /**
   * Extract financial metrics from highlights using AI understanding
   */
  extractFinancialMetricsFromHighlights(results) {
    const metrics = {};

    for (const result of results) {
      const highlights = result.highlights || [];
      const url = result.url || '';

      // Extract filing metadata
      const filingDate = this.extractDateFromText(url + ' ' + highlights.join(' '));
      const accessionNumber = this.extractAccessionFromUrl(url);

      for (const highlight of highlights) {
        if (!highlight || highlight.length < 50) continue;

        // Use structured data extraction from BaseWebSearchClient
        const financialData = this.extractStructuredDataFromHighlights([{...result, highlights: [highlight]}], 'monetary_value');
        
        // Categorize financial data based on context
        const contextLower = highlight.toLowerCase();
        
        if (contextLower.includes('revenue') || contextLower.includes('sales')) {
          if (!metrics.Revenues) metrics.Revenues = [];
          financialData.forEach(data => {
            if (data.value) {
              metrics.Revenues.push({
                value: data.value,
                accessionNumber,
                filingDate,
                context: highlight.substring(0, 200),
                confidence: data.extraction_confidence
              });
            }
          });
        }

        if (contextLower.includes('net income') || contextLower.includes('net loss')) {
          if (!metrics.NetIncomeLoss) metrics.NetIncomeLoss = [];
          financialData.forEach(data => {
            if (data.value) {
              metrics.NetIncomeLoss.push({
                value: contextLower.includes('loss') ? -Math.abs(data.value) : data.value,
                accessionNumber,
                filingDate,
                context: highlight.substring(0, 200),
                confidence: data.extraction_confidence
              });
            }
          });
        }

        if (contextLower.includes('assets')) {
          if (!metrics.Assets) metrics.Assets = [];
          financialData.forEach(data => {
            if (data.value) {
              metrics.Assets.push({
                value: data.value,
                accessionNumber,
                filingDate,
                context: highlight.substring(0, 200),
                confidence: data.extraction_confidence
              });
            }
          });
        }

        // Add more financial categories as needed
        if (contextLower.includes('cash')) {
          if (!metrics.CashAndCashEquivalents) metrics.CashAndCashEquivalents = [];
          financialData.forEach(data => {
            if (data.value) {
              metrics.CashAndCashEquivalents.push({
                value: data.value,
                accessionNumber,
                filingDate,
                context: highlight.substring(0, 200),
                confidence: data.extraction_confidence
              });
            }
          });
        }
      }
    }

    return metrics;
  }

  /**
   * Extract concept values from highlights
   */
  extractConceptValuesFromHighlights(results, concept, unit) {
    const data = [];

    for (const result of results) {
      const highlights = result.highlights || [];
      const url = result.url || '';

      // Extract basic metadata
      const cik = this.extractCikFromUrl(url);
      const accessionNumber = this.extractAccessionFromUrl(url);
      const filingDate = this.extractDateFromText(url + ' ' + highlights.join(' '));

      for (const highlight of highlights) {
        // More permissive concept matching for financial terms
        const conceptVariations = {
          'Revenues': ['revenue', 'sales', 'net sales', 'total revenue', 'operating revenue'],
          'RevenuefromContractwithCustomerExcludingAssessedTax': ['revenue', 'sales'],
          'Assets': ['asset', 'total assets', 'current assets'],
          'NetIncomeLoss': ['net income', 'net loss', 'earnings', 'profit'],
          'CashAndCashEquivalents': ['cash', 'cash equivalent']
        };

        const searchTerms = conceptVariations[concept] || [concept.toLowerCase()];
        const highlightLower = (highlight || '').toLowerCase();
        const hasRelevantContent = searchTerms.some(term => highlightLower.includes(term));

        if (!highlight || !hasRelevantContent) continue;

        // Extract monetary values from this specific highlight
        const values = this.extractStructuredDataFromHighlights([{...result, highlights: [highlight]}], 'monetary_value');
        
        values.forEach(valueData => {
          if (valueData.value) {
            data.push({
              entityName: null,
              cik: cik,
              value: valueData.value,
              accessionNumber: accessionNumber,
              filingDate: filingDate,
              form: this.extractFormFromText(highlight),
              unit: unit,
              context: highlight.substring(0, 300),
              extraction_confidence: valueData.extraction_confidence
            });
          }
        });
      }
    }

    return data;
  }

  /**
   * Extract content from result, prioritizing highlights over text
   * This matches EPA/FDA successful pattern for handling Exa responses
   * @private
   */
  extractContentFromResult(result) {
    // CRITICAL FIX: Extract from ALL available content sources
    // Priority: summary (schema-based) > highlights > text > title

    // Priority 1: Check structured summary (from schema-based extraction)
    if (result.summary) {
      if (typeof result.summary === 'object' && result.summary !== null) {
        // Flatten object into searchable text
        const summaryText = Object.values(result.summary)
          .filter(v => v !== null && v !== undefined)
          .map(v => typeof v === 'object' ? JSON.stringify(v) : String(v))
          .join(' ');
        if (summaryText.trim().length > 0) {
          return summaryText;
        }
      } else if (typeof result.summary === 'string' && result.summary.trim().length > 0) {
        return result.summary;
      }
    }

    // Priority 2: Check highlights array (like EPA/FDA)
    if (result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0) {
      const highlightsText = result.highlights.join(' ');
      return highlightsText;
    }

    // Priority 3: Check text field
    if (result.text && result.text.trim().length > 0) {
      return result.text;
    }

    // Priority 4: Fallback to title
    return result.title || '';
  }

  /**
   * Extract SEC metadata with confidence scoring (permissive version)
   * @private
   */
  extractSECMetadataPermissive(result) {
    const metadata = {};
    const confidenceFactors = [];
    const text = this.extractContentFromResult(result);  // FIXED: Now uses highlights
    const url = result?.url || '';

    // ========================================
    // PHASE 1: URL-BASED EXTRACTION (HIGH PRIORITY)
    // Prioritize URL extraction - most reliable for SEC EDGAR URLs
    // ========================================

    // CIK extraction - Try URL first (highest confidence)
    if (url) {
      const cikFromUrl = this.extractCikFromUrl(url);
      if (cikFromUrl) {
        metadata.cik = cikFromUrl;
        metadata.cik_confidence = 0.95;  // URL-based extraction is very reliable
        confidenceFactors.push(metadata.cik_confidence);
      }
    }

    // If URL extraction failed, try text patterns
    if (!metadata.cik) {
      const cikPatterns = [
        /CIK[:\s]*(\d{10})/i,                    // Standard 10-digit CIK
        /CIK[:\s]*(\d{7,10})/i,                  // Variable length CIK
        /Central Index Key[:\s]*(\d+)/i,         // Full name format
        /cik=(\d+)/i                             // Query parameter format
      ];

      for (const pattern of cikPatterns) {
        const match = (text + ' ' + url).match(pattern);
        if (match) {
          metadata.cik = match[1].padStart(10, '0');  // Normalize to 10 digits
          metadata.cik_confidence = cikPatterns.indexOf(pattern) === 0 ? 1.0 : 0.8;
          confidenceFactors.push(metadata.cik_confidence);
          break;
        }
      }
    }

    // ========================================
    // PHASE 2: FORM TYPE EXTRACTION (NARRATIVE-FRIENDLY)
    // Enhanced with narrative patterns to handle AI summaries
    // ========================================

    const formPatterns = [
      // Tier 1: Labeled format (highest confidence)
      { pattern: /Form\s+(10-K|10-Q|8-K|DEF 14A|S-1|424B\d)/i, confidence: 1.0 },
      { pattern: /FORM\s+TYPE[:\s]*([A-Z0-9\-]+)/i, confidence: 0.9 },

      // Tier 2: Narrative with context (good confidence)
      { pattern: /(10-K|10-Q|8-K|DEF 14A|S-1)\s+(?:annual|quarterly|current)\s+report/i, confidence: 0.85 },
      { pattern: /(?:annual|quarterly|current)\s+report\s+(?:on\s+)?(?:form\s+)?(10-K|10-Q|8-K)/i, confidence: 0.85 },

      // Tier 3: Verb-based narrative (moderate confidence)
      { pattern: /file[ds]?\s+(?:an?\s+)?(10-K|10-Q|8-K|DEF 14A|S-1)/i, confidence: 0.75 },
      { pattern: /submit(?:ted|s)?\s+(?:an?\s+)?(10-K|10-Q|8-K)/i, confidence: 0.75 },

      // Tier 4: Simple keyword match (lower confidence, last resort)
      { pattern: /\b(10-K|10-Q|8-K|DEF\s*14A|S-1)\b/i, confidence: 0.6 },
      { pattern: /type[:\s]*"?(10-K|10-Q|8-K|[A-Z0-9\-]+)"?/i, confidence: 0.7 }
    ];

    for (const { pattern, confidence } of formPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.form_type = match[1].toUpperCase().replace(/\s+/g, ' ');  // Normalize spaces
        metadata.form_confidence = confidence;
        confidenceFactors.push(confidence);
        break;
      }
    }

    // ========================================
    // PHASE 3: ACCESSION NUMBER EXTRACTION (URL PRIORITY)
    // Try URL extraction first, then text patterns
    // ========================================

    // Try URL-based extraction first (most reliable)
    if (url) {
      const accessionFromUrl = this.extractAccessionFromUrl(url);
      if (accessionFromUrl) {
        metadata.accession_number = accessionFromUrl;
        metadata.accession_confidence = 0.95;
        confidenceFactors.push(metadata.accession_confidence);
      }
    }

    // If URL extraction failed, try text patterns
    if (!metadata.accession_number) {
      const accessionPatterns = [
        /(\d{10}-\d{2}-\d{6})/,                  // Standard format (dash-separated)
        /Accession\s+Number[:\s]*(\S+)/i,        // Labeled format
        /AccessionNumber[:\s]*(\S+)/i,           // No space variant
        /(\d{18})/                                // 18-digit format (no dashes)
      ];

      for (const pattern of accessionPatterns) {
        const match = (text + ' ' + url).match(pattern);
        if (match) {
          // If 18-digit format, convert to standard dash format
          if (/^\d{18}$/.test(match[1])) {
            const digits = match[1];
            metadata.accession_number = `${digits.slice(0,10)}-${digits.slice(10,12)}-${digits.slice(12)}`;
          } else {
            metadata.accession_number = match[1];
          }
          metadata.accession_confidence = accessionPatterns.indexOf(pattern) === 0 ? 1.0 : 0.7;
          confidenceFactors.push(metadata.accession_confidence);
          break;
        }
      }
    }

    // ========================================
    // PHASE 4: FILING DATE EXTRACTION (FILENAME PRIORITY)
    // Try filename extraction first, then text patterns
    // ========================================

    // Try extracting date from SEC filename patterns (very common)
    if (url) {
      // Pattern 1: tsla-20250630.htm → 2025-06-30
      const filenameDateMatch = url.match(/[-_](\d{8})\.(?:htm|html|txt)/i);
      if (filenameDateMatch) {
        const d = filenameDateMatch[1];
        metadata.filing_date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
        metadata.filing_date_confidence = 0.90;  // Filename dates are reliable
        confidenceFactors.push(metadata.filing_date_confidence);
      }

      // Pattern 2: /2025/06/30/ in URL path
      if (!metadata.filing_date) {
        const urlDateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (urlDateMatch) {
          metadata.filing_date = `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
          metadata.filing_date_confidence = 0.85;
          confidenceFactors.push(metadata.filing_date_confidence);
        }
      }
    }

    // If filename extraction failed, try text patterns
    if (!metadata.filing_date) {
      const datePatterns = [
        /Filing\s+Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
        /Filed[:\s]*(\d{4}-\d{2}-\d{2})/i,
        /Date\s+Filed[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /(\d{4}-\d{2}-\d{2})\s+(?:Filed|Filing)/i,
        // Add general ISO date pattern as last resort
        /\b(\d{4}-\d{2}-\d{2})\b/
      ];

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          metadata.filing_date = this.normalizeDate(match[1]);
          metadata.filing_date_confidence = datePatterns.indexOf(pattern) <= 1 ? 0.9 : 0.6;
          confidenceFactors.push(metadata.filing_date_confidence);
          break;
        }
      }
    }

    // Company name extraction
    const companyPatterns = [
      /Company\s+Name[:\s]*([^\n\r]+)/i,
      /Registrant\s+Name[:\s]*([^\n\r]+)/i,
      /^([A-Z][A-Z\s&.,]+(?:INC|CORP|LLC|LP|LTD))/m,
      /<TITLE>([^<]+)<\/TITLE>/i
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.company_name = match[1].trim();
        metadata.company_confidence = companyPatterns.indexOf(pattern) <= 1 ? 0.9 : 0.6;
        confidenceFactors.push(metadata.company_confidence);
        break;
      }
    }

    // Calculate overall confidence
    const overallConfidence = confidenceFactors.length > 0
      ? confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length
      : 0.3;  // Base confidence if no extractions

    return {
      data: metadata,
      confidence: overallConfidence,
      extraction_count: Object.keys(metadata).length
    };
  }

  // Helper methods for URL/text extraction
  extractCikFromUrl(url) {
    const match = url.match(/data\/(\d+)\//);
    return match ? String(match[1]).padStart(10, '0') : null;
  }

  extractAccessionFromUrl(url) {
    const match = url.match(/data\/\d+\/(\d+)\//);
    if (match && match[1] && /^\d{18}$/.test(match[1])) {
      const digits = match[1];
      return `${digits.slice(0,10)}-${digits.slice(10,12)}-${digits.slice(12)}`;
    }
    return null;
  }

  extractDateFromText(text) {
    const match = text.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    return match ? match[1] : null;
  }

  extractFormFromText(text) {
    const match = text.match(/\b(10-K|10-Q|8-K|20-F|DEF\s*14A|S-1)\b/i);
    return match ? match[1] : null;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   * @private
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Handle MM/DD/YYYY format
    const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const month = mmddyyyy[1].padStart(2, '0');
      const day = mmddyyyy[2].padStart(2, '0');
      const year = mmddyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return dateStr; // Return as-is if can't normalize
  }

  // SEC-specific quality assessment (enhanced from original)
  assessSECQueryRelevance(companyQuery, rawResults, mappedFilings, toolArgs) {
    const baseAssessment = this.assessQueryRelevance(companyQuery, mappedFilings, toolArgs);
    
    // SEC-specific enhancements with highlights awareness
    const secMetadata = {
      filing_type_analysis: this.analyzeFilingTypes(toolArgs.filing_type, mappedFilings),
      company_identification: this.analyzeCompanyIdentification(companyQuery, mappedFilings),
      temporal_coverage: this.analyzeFilingTemporalCoverage(mappedFilings, toolArgs),
      filing_completeness: this.assessFilingCompleteness(mappedFilings),
      highlight_extraction_quality: this.assessHighlightExtractionQuality(rawResults)
    };
    
    baseAssessment._search_quality.query_suggestions = this.generateSECSuggestions(
      companyQuery, mappedFilings, toolArgs, rawResults
    );
    
    baseAssessment._search_quality.sec_metadata = secMetadata;
    
    return baseAssessment;
  }

  /**
   * Assess quality of highlight-based extraction for SEC data
   */
  assessHighlightExtractionQuality(rawResults) {
    if (!rawResults || rawResults.length === 0) {
      return { quality: 'none', confidence: 0 };
    }

    let totalHighlights = 0;
    let financialHighlights = 0;
    let structuredHighlights = 0;

    for (const result of rawResults) {
      const highlights = result.highlights || [];
      totalHighlights += highlights.length;

      for (const highlight of highlights) {
        if (!highlight) continue;

        // Check for financial data indicators
        if (/\$[\d,]+|\d+\s*(million|billion|thousand)|revenue|income|assets/i.test(highlight)) {
          financialHighlights++;
        }

        // Check for structured SEC data
        if (/10-[KQ]|8-K|CIK|accession|filing\s*date/i.test(highlight)) {
          structuredHighlights++;
        }
      }
    }

    const financialRatio = totalHighlights > 0 ? financialHighlights / totalHighlights : 0;
    const structuredRatio = totalHighlights > 0 ? structuredHighlights / totalHighlights : 0;
    
    let quality = 'poor';
    let confidence = financialRatio * 0.6 + structuredRatio * 0.4;

    if (confidence >= 0.7) quality = 'excellent';
    else if (confidence >= 0.5) quality = 'good';
    else if (confidence >= 0.3) quality = 'fair';

    return {
      quality,
      confidence: Math.round(confidence * 100) / 100,
      metrics: {
        total_highlights: totalHighlights,
        financial_highlights: financialHighlights,
        structured_highlights: structuredHighlights,
        financial_ratio: Math.round(financialRatio * 100) / 100,
        structured_ratio: Math.round(structuredRatio * 100) / 100
      }
    };
  }

  /**
   * Assess quality of SEC filing results (permissive version)
   * @private
   */
  assessSECFilingQuality(filings) {
    if (!filings || filings.length === 0) {
      return {
        total_filings: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        edgar_archive_coverage: '0%',
        form_type_coverage: '0%',
        recommendation: 'No filings to assess'
      };
    }

    const highConfidence = filings.filter(f => f.data_quality?.confidence >= 0.8);
    const mediumConfidence = filings.filter(f =>
      f.data_quality?.confidence >= 0.5 && f.data_quality?.confidence < 0.8
    );
    const lowConfidence = filings.filter(f => f.data_quality?.confidence < 0.5);

    const edgarArchiveFilings = filings.filter(f => f.data_quality?.is_edgar_archive);
    const filingsWithFormType = filings.filter(f => f.metadata?.form_type);
    const filingsWithCIK = filings.filter(f => f.metadata?.cik);
    const filingsWithDate = filings.filter(f => f.metadata?.filing_date);

    return {
      total_filings: filings.length,
      high_confidence: highConfidence.length,
      medium_confidence: mediumConfidence.length,
      low_confidence: lowConfidence.length,
      edgar_archive_coverage: (edgarArchiveFilings.length / filings.length * 100).toFixed(1) + '%',
      form_type_coverage: (filingsWithFormType.length / filings.length * 100).toFixed(1) + '%',
      cik_coverage: (filingsWithCIK.length / filings.length * 100).toFixed(1) + '%',
      date_coverage: (filingsWithDate.length / filings.length * 100).toFixed(1) + '%',
      recommendation: this.generateSECQualityRecommendation(filings)
    };
  }

  /**
   * Generate quality recommendation for SEC filings
   * @private
   */
  generateSECQualityRecommendation(filings) {
    const avgConfidence = filings.reduce((sum, f) =>
      sum + (f.data_quality?.confidence || 0), 0
    ) / filings.length;

    const edgarPercentage = filings.filter(f =>
      f.data_quality?.is_edgar_archive
    ).length / filings.length;

    if (avgConfidence >= 0.7 && edgarPercentage >= 0.8) {
      return 'High quality SEC filings - official EDGAR sources';
    } else if (avgConfidence >= 0.5) {
      return 'Moderate quality - verify filing details for accuracy';
    } else if (avgConfidence >= 0.3) {
      return 'Low quality - manual verification recommended';
    } else {
      return 'Very low quality - consider refining search parameters';
    }
  }

  // Inherit other methods from the original implementation where they don't use complex regex
  analyzeFilingTypes(requestedType, filings) {
    if (!filings.length) {
      return {
        total_filings: 0,
        filing_types_found: [],
        type_distribution: {},
        requested_type: requestedType,
        relevance: 'none',
        advisory: 'no_filings_found'
      };
    }
    
    const filingTypes = filings.map(f => f.form).filter(Boolean);
    const typeDistribution = {};
    
    filingTypes.forEach(type => {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });
    
    const analysis = {
      total_filings: filings.length,
      filing_types_found: Object.keys(typeDistribution),
      type_distribution: typeDistribution,
      requested_type: requestedType
    };
    
    if (requestedType && requestedType !== 'all') {
      const matchingFilings = filings.filter(f => 
        f.form && f.form.toLowerCase() === requestedType.toLowerCase()
      );
      analysis.type_match_ratio = matchingFilings.length / filings.length;
      analysis.exact_matches = matchingFilings.length;
      analysis.relevance = analysis.type_match_ratio >= 0.7 ? 'high' : 
                          analysis.type_match_ratio >= 0.3 ? 'medium' : 'low';
    } else {
      analysis.relevance = 'general';
    }
    
    return analysis;
  }

  analyzeCompanyIdentification(companyQuery, filings) {
    if (!companyQuery) {
      return {
        query_type: 'none',
        query_value: null,
        filings_found: filings.length,
        identification_confidence: 'unspecified',
        advisory: 'no_company_specified'
      };
    }
    
    const queryLower = companyQuery.toLowerCase();
    const isTickerPattern = /^[A-Z]{1,5}$/.test(companyQuery);
    const isCIKPattern = /^\d{1,10}$/.test(companyQuery);
    
    return {
      query_type: isTickerPattern ? 'ticker' : isCIKPattern ? 'cik' : 'company_name',
      query_value: companyQuery,
      filings_found: filings.length,
      identification_confidence: filings.length > 0 ? 'confirmed' : 'unconfirmed'
    };
  }

  analyzeFilingTemporalCoverage(filings, toolArgs) {
    if (!filings.length) {
      return {
        total_with_dates: 0,
        date_range: { oldest: null, newest: null },
        recent_filings: 0,
        year_filings: 0,
        recency_score: 0,
        advisory: 'no_filings_found'
      };
    }
    
    const dates = filings
      .map(f => f.filingDate)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a);
    
    if (!dates.length) {
      return {
        total_with_dates: 0,
        date_range: { oldest: null, newest: null },
        recent_filings: 0,
        year_filings: 0,
        recency_score: 0,
        advisory: 'no_dates_found'
      };
    }
    
    const now = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
    
    const recentFilings = dates.filter(d => (now - d) < sixMonths).length;
    const yearFilings = dates.filter(d => (now - d) < oneYear).length;
    
    return {
      total_with_dates: dates.length,
      date_range: {
        oldest: dates[dates.length - 1]?.toISOString()?.split('T')[0],
        newest: dates[0]?.toISOString()?.split('T')[0]
      },
      recent_filings: recentFilings,
      year_filings: yearFilings,
      recency_score: recentFilings / dates.length
    };
  }

  assessFilingCompleteness(filings) {
    if (!filings.length) return { score: 0, issues: ['No filings found'] };
    
    const issues = [];
    let completenessScore = 1.0;
    
    const missingAccession = filings.filter(f => !f.accessionNumber).length;
    if (missingAccession > 0) {
      issues.push(`${missingAccession} filings missing accession numbers`);
      completenessScore -= 0.2;
    }
    
    const missingDates = filings.filter(f => !f.filingDate).length;
    if (missingDates > 0) {
      issues.push(`${missingDates} filings missing filing dates`);
      completenessScore -= 0.2;
    }
    
    const missingForms = filings.filter(f => !f.form).length;
    if (missingForms > 0) {
      issues.push(`${missingForms} filings missing form types`);
      completenessScore -= 0.2;
    }
    
    return {
      score: Math.max(0, completenessScore),
      issues: issues,
      complete_filings: filings.length - Math.max(missingAccession, missingDates, missingForms)
    };
  }

  generateSECSuggestions(companyQuery, filings, toolArgs, rawResults) {
    const suggestions = [];
    
    if (!filings.length) {
      if (companyQuery) {
        suggestions.push("Try searching by ticker symbol or CIK number");
        if (!/^[A-Z]{1,5}$/.test(companyQuery) && !/^\d{1,10}$/.test(companyQuery)) {
          suggestions.push("Use exact company name or try partial name matching");
        }
      }
      return suggestions.join('; ');
    }
    
    // Highlight quality suggestions
    const highlightQuality = this.assessHighlightExtractionQuality(rawResults);
    if (highlightQuality.confidence < 0.5) {
      suggestions.push("Consider using more specific financial terms in search");
    }
    
    // Filing type suggestions
    const filingTypeAnalysis = this.analyzeFilingTypes(toolArgs.filing_type, filings);
    if (filingTypeAnalysis.relevance === 'low' || filingTypeAnalysis.relevance === 'medium') {
      if (!toolArgs.filing_type || toolArgs.filing_type === 'all') {
        const topTypes = Object.entries(filingTypeAnalysis.type_distribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([type]) => type);
        suggestions.push(`Specify filing_type: ${topTypes.join(', ')} for targeted results`);
      }
    }
    
    // Content enhancement suggestions
    if (!toolArgs.include_snippet && !toolArgs.include_text) {
      suggestions.push("Enable include_snippet for SEC filing summaries");
    }
    
    return suggestions.length > 0 ? suggestions.join('; ') : '';
  }

  /**
   * Determine if company identifier is a ticker symbol, CIK number, or company name
   * @param {string} identifier - The company identifier to analyze
   * @returns {{type: 'ticker'|'cik'|'name', value: string}} Classification result
   * @private
   */
  _isTickerOrCIK(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      return { type: 'name', value: identifier || '' };
    }

    const trimmed = identifier.trim();

    // CIK: Exactly 10 digits (with or without leading zeros)
    // Examples: "0000019617", "19617"
    if (/^\d{1,10}$/.test(trimmed)) {
      return { type: 'cik', value: trimmed.padStart(10, '0') };
    }

    // Ticker: 1-5 uppercase letters, no spaces or special characters
    // Examples: "TSLA", "AAPL", "JPM", "MSFT", "BRK.B" (with period), "BF.A"
    // Allow optional period for dual-class stocks (e.g., BRK.B, BF.A)
    if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(trimmed)) {
      return { type: 'ticker', value: trimmed };
    }

    // Everything else is treated as a company name
    // Examples: "Tesla Inc", "JPMorgan Chase & Co.", "Apple Inc."
    return { type: 'name', value: trimmed };
  }

  /**
   * Resolve company identifier to ticker/CIK for optimal search performance
   *
   * Company names with special characters (& . ,) often fail in Exa searches.
   * This method resolves them to ticker symbols which have no special characters.
   *
   * @param {string} identifier - Company name, ticker, or CIK
   * @returns {Promise<{identifier: string, cik: string|null, source: 'original'|'resolved', originalInput: string}>}
   * @private
   *
   * @example
   * // Ticker unchanged
   * await _resolveCompanyIdentifier('JPM')
   * // → { identifier: 'JPM', cik: '0000019617', source: 'original' }
   *
   * @example
   * // Company name resolved to ticker
   * await _resolveCompanyIdentifier('JPMorgan Chase & Co.')
   * // → { identifier: 'JPM', cik: '0000019617', source: 'resolved' }
   */
  async _resolveCompanyIdentifier(identifier) {
    const originalInput = identifier;

    // Classify the input
    const classification = this._isTickerOrCIK(identifier);

    // If already ticker or CIK, return as-is (no resolution needed)
    if (classification.type === 'ticker' || classification.type === 'cik') {
      return {
        identifier: classification.value,
        cik: classification.type === 'cik' ? classification.value : null,
        source: 'original',
        originalInput
      };
    }

    // Company name detected - try to resolve with normalization fallback
    const companyName = classification.value;

    // First attempt: original name
    let result = await this._tryResolveCompanyName(companyName, originalInput);
    if (result.source === 'resolved') {
      return result;
    }

    // Second attempt: normalized name (handles "Johnson & Johnson" → "Johnson and Johnson")
    const normalizedName = this._normalizeCompanyName(companyName);
    if (normalizedName !== companyName) {
      console.log(`[SEC] Trying normalized company name: "${normalizedName}"`);
      result = await this._tryResolveCompanyName(normalizedName, originalInput);
      if (result.source === 'resolved') {
        return result;
      }
    }

    // Both attempts failed - return original for web search fallback
    return {
      identifier: companyName,
      cik: null,
      source: 'original',
      originalInput,
      warning: 'No ticker found for company name'
    };
  }

  /**
   * Normalize company name for better SEC resolution
   * Handles special characters and common suffixes that may cause search failures
   *
   * @param {string} name - Company name to normalize
   * @returns {string} Normalized company name
   *
   * @example
   * _normalizeCompanyName('Johnson & Johnson')  // → 'Johnson and Johnson'
   * _normalizeCompanyName('Apple, Inc.')        // → 'Apple'
   * _normalizeCompanyName('JPMorgan Chase & Co.') // → 'JPMorgan Chase and Co'
   */
  _normalizeCompanyName(name) {
    if (!name || typeof name !== 'string') return name;

    let normalized = name;

    // Replace & with "and" (common in company names like "Johnson & Johnson")
    normalized = normalized.replace(/\s*&\s*/g, ' and ');

    // Remove common suffixes that may cause search issues
    const suffixPatterns = [
      /,?\s*Inc\.?$/i,      // "Apple, Inc." → "Apple"
      /,?\s*Corp\.?$/i,     // "Microsoft Corp." → "Microsoft"
      /,?\s*Co\.?$/i,       // "JPMorgan Chase & Co." → "JPMorgan Chase"
      /,?\s*Ltd\.?$/i,      // "Samsung, Ltd." → "Samsung"
      /,?\s*LLC$/i,         // "SpaceX, LLC" → "SpaceX"
      /,?\s*L\.?P\.?$/i,    // "XYZ, L.P." → "XYZ"
      /,?\s*PLC$/i,         // "Shell PLC" → "Shell"
    ];

    for (const pattern of suffixPatterns) {
      normalized = normalized.replace(pattern, '');
    }

    // Remove remaining special characters that might cause issues (but keep alphanumerics, spaces, hyphens)
    normalized = normalized.replace(/[^\w\s-]/g, '');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Try to resolve a company name to ticker via SEC API
   * @private
   */
  async _tryResolveCompanyName(companyName, originalInput) {
    try {
      const response = await this.searchSECCompanyTickersWeb({
        search_term: companyName
      });

      const responseData = JSON.parse(response.content[0].text);

      if (responseData.results && responseData.results.length > 0) {
        const firstMatch = responseData.results[0];
        return {
          identifier: firstMatch.ticker,
          cik: firstMatch.cik,
          source: 'resolved',
          originalInput,
          resolvedName: firstMatch.name
        };
      }

      return { source: 'not_found', originalInput };
    } catch (error) {
      console.warn(`[SEC] Resolution attempt failed for "${companyName}":`, error.message);
      return { source: 'error', error: error.message, originalInput };
    }
  }

}
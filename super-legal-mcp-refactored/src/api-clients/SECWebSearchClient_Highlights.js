/**
 * SEC Web Search Client - Highlights-Based Implementation
 * Uses Exa's AI-powered highlights instead of regex parsing for better accuracy
 */

import { validateDate, validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class SECWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter) {
    super(rateLimiter, process.env.EXA_API_KEY);
    this.domain = 'securities';
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
      limit = 10,
      include_text = false,
      include_snippet = false
    } = args;

    if (!company_identifier || String(company_identifier).trim().length === 0) {
      throw new Error('company_identifier is required for SEC filings search');
    }

    if (date_after) validateDate(date_after, 'date_after');
    if (date_before) validateDate(date_before, 'date_before');
    const validatedLimit = validateLimit(limit, 20);

    // Build targeted search query
    let query = 'site:sec.gov/Archives ';
    if (company_identifier) query += `"${company_identifier}" `;
    if (filing_type && filing_type !== 'all') query += `"Form ${filing_type}" `;
    query += '("FORM" OR "Form" OR "Filing") ';

    // Execute search with highlights optimization
    const results = await this.executeExaSearch(query.trim(), validatedLimit, {
      domain: this.domain,
      highlightQuery: 'SEC filing form 10-K 10-Q 8-K company revenue income financial statements accession CIK filing date',
      numSentences: 8,
      highlightsPerUrl: 3,
      includeDomains: ['www.sec.gov', 'sec.gov'],
      includeFullText: include_text
    });

    // Map results using highlights-based extraction
    const filingsAll = results
      .filter(r => (r.url || '').includes('sec.gov/Archives'))
      .map(r => this.mapFilingFromHighlights(r, include_text, include_snippet))
      .filter(Boolean);

    // Apply client-side filters
    let filings = filingsAll;
    if (filing_type && filing_type !== 'all') {
      filings = filings.filter(f => 
        (f.form || '').toUpperCase().includes(filing_type.toUpperCase())
      );
    }
    if (date_after) filings = filings.filter(f => !f.filingDate || f.filingDate >= date_after);
    if (date_before) filings = filings.filter(f => !f.filingDate || f.filingDate <= date_before);

    filings = filings.slice(0, validatedLimit);

    // Build company info from first result
    const first = filings[0] || {};
    const company = {
      name: first.company || company_identifier || 'Unknown Company',
      cik: first.cik || null,
      ticker: null,
      sic: null,
      sicDescription: null
    };

    const response = {
      company,
      filings: filings.map(f => ({
        accessionNumber: f.accessionNumber || null,
        filingDate: f.filingDate || null,
        form: f.form || null,
        primaryDocument: f.primaryDocument || null,
        reportDate: f.reportDate || null,
        edgar_url: f.url || null,
        ...(f.snippet && { snippet: f.snippet }),
        ...(f.full_text && { full_text: f.full_text }),
        ...(f._extraction_quality && { _extraction_quality: f._extraction_quality })
      })),
      search_criteria: { filing_type, date_after, date_before, limit: validatedLimit }
    };

    // Calculate quality metadata
    const qualityMetadata = this.assessSECQueryRelevance(company_identifier || '', results, response.filings, args);
    const highlightQuality = this.assessHighlightSpecificQuality(results, query, 
      'SEC filing form 10-K 10-Q 8-K company revenue income financial statements accession CIK filing date');

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          ...response,
          ...qualityMetadata,
          _highlight_quality: highlightQuality
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
      throw new Error('company_identifier is required');
    }

    // Search for financial filings with targeted highlights
    const query = `site:sec.gov/Archives "${company_identifier}" (10-K OR 10-Q)`;
    const results = await this.executeExaSearch(query, 10, {
      domain: this.domain,
      highlightQuery: 'revenue net income earnings EBITDA assets liabilities cash flow financial results quarterly annual',
      numSentences: 10,
      highlightsPerUrl: 4,
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
    const { taxonomy = 'us-gaap', concept, unit = 'USD', period, limit = 100 } = args;
    if (!concept) throw new Error('concept is required');
    if (!period) throw new Error('period is required');

    const validatedLimit = validateLimit(limit, 100);

    // Search for concept mentions across SEC filings
    const query = `site:sec.gov/Archives ${concept} ${unit}`;
    const results = await this.executeExaSearch(query, Math.min(validatedLimit, 50), {
      domain: this.domain,
      highlightQuery: `${concept} ${unit} financial data quarterly annual period`,
      numSentences: 6,
      highlightsPerUrl: 2,
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
      throw new Error('search_term is required');
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
    if (includeSnippet && highlights.length > 0) {
      mapped.snippet = this.extractSmartSnippetFromHighlights([result], 500);
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
        if (!highlight || !highlight.toLowerCase().includes(concept.toLowerCase())) continue;

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

  // Inherit other methods from the original implementation where they don't use complex regex
  analyzeFilingTypes(requestedType, filings) {
    if (!filings.length) return { no_filings: true };
    
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
    if (!companyQuery) return { no_company_specified: true };
    
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
    if (!filings.length) return { no_filings: true };
    
    const dates = filings
      .map(f => f.filingDate)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a);
    
    if (!dates.length) return { no_dates: true };
    
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
}
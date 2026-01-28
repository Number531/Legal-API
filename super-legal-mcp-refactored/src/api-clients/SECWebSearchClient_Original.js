/**
 * SEC Web Search Client (Exa-only)
 * Queries sec.gov Archives via Exa and parses filing metadata as a fallback to EDGAR API.
 */

import { validateDate, validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class SECWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter) {
    super(rateLimiter, process.env.EXA_API_KEY);
    // Domain-specific configuration for SEC filings
    this.domain = 'securities';
  }

  /**
   * Search SEC filings via Exa (domain-restricted to sec.gov Archives)
   * Mirrors shape of SecEdgarClient.searchSECFilings output where feasible
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

    // Build an Exa query that targets SEC Archives
    let query = 'site:sec.gov/Archives ';
    if (company_identifier) query += `"${company_identifier}" `;
    if (filing_type && filing_type !== 'all') query += `"Form ${filing_type}" `;
    // Add light biasing terms
    query += '("FORM" OR "Form" OR "Filing") ';

    // Use highlights-based extraction with financial focus
    const results = await this.executeExaSearch(query.trim(), validatedLimit, {
      domain: this.domain,
      highlightQuery: 'filing form SEC 10-K 10-Q 8-K revenue earnings income assets liabilities cash flow financial statements',
      numSentences: 8,
      highlightsPerUrl: 3,
      includeDomains: ['www.sec.gov', 'sec.gov'],
      includeFullText: include_text,
      fallbackToText: true
    });

    // Map results to filings
    const filingsAll = results
      .filter(r => (r.url || '').includes('sec.gov/Archives'))
      .map(r => this.mapFilingFromHighlights(r, include_text, include_snippet))
      .filter(Boolean);

    // Apply client-side filters
    let filings = filingsAll;
    if (filing_type && filing_type !== 'all') {
      filings = filings.filter(f => (f.form || '').toUpperCase() === filing_type.toUpperCase());
    }
    if (date_after) filings = filings.filter(f => !f.filingDate || f.filingDate >= date_after);
    if (date_before) filings = filings.filter(f => !f.filingDate || f.filingDate <= date_before);

    filings = filings.slice(0, validatedLimit);

    // Best-effort company summary from first result
    const first = filings[0] || {};
    const company = {
      name: first.company || (company_identifier || 'Unknown Company'),
      cik: first.cik || null,
      ticker: null,
      sic: null,
      sicDescription: null
    };

    const response = {
      company,
      filings: filings.map(f => {
        const mapped = {
          accessionNumber: f.accessionNumber || null,
          filingDate: f.filingDate || null,
          form: f.form || null,
          primaryDocument: f.primaryDocument || null,
          reportDate: f.reportDate || null,
          edgar_url: f.url || null
        };
        
        // Include snippet if present
        if (f.snippet) {
          mapped.snippet = f.snippet;
        }
        
        // Include full text if present
        if (f.full_text) {
          mapped.full_text = f.full_text;
        }
        
        return mapped;
      }),
      search_criteria: { filing_type, date_after, date_before, limit: validatedLimit }
    };

    // Calculate quality metadata using highlights assessment
    const qualityMetadata = this.assessSECQueryRelevance(company_identifier || '', results, response.filings, args);
    
    // Add highlight-specific quality assessment
    const highlightQuality = this.assessHighlightSpecificQuality(results, query, 
      'filing form SEC 10-K 10-Q 8-K revenue earnings income assets liabilities cash flow financial statements');

    return {
      content: [{ type: 'text', text: JSON.stringify({
        ...response,
        ...qualityMetadata,
        _highlight_quality: highlightQuality
      }, null, 2) }]
    };
  }

  /**
   * Get company facts by parsing recent 10-K/10-Q filings (best-effort XBRL surrogate)
   * Attempts to extract key metrics like Revenues, Net Income, Assets, Liabilities, Cash
   */
  async getSECCompanyFactsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { company_identifier, concept } = args;

    if (!company_identifier || String(company_identifier).trim().length === 0) {
      throw new Error('company_identifier is required');
    }

    // Prefer 10-K and 10-Q for facts
    const filings = await this.searchSECFilingsWeb({
      company_identifier,
      filing_type: 'all',
      limit: 10,
      include_text: true
    });

    let parsed = {};
    try {
      const payload = JSON.parse(filings.content?.[0]?.text || '{}');
      const results = Array.isArray(payload.filings) ? payload.filings : [];

      // Fetch full text via Exa for top few filings (the Exa results already have text when available)
      const enriched = await this.enrichFilingsWithText(results.slice(0, 5));

      // Extract metrics across filings (best-effort)
      const metrics = this.extractKeyFinancialFactsFromFilings(enriched);

      // If a specific concept requested, filter to that
      if (concept) {
        const conceptKey = String(concept).toLowerCase();
        const conceptData = Object.keys(metrics)
          .filter(k => k.toLowerCase().includes(conceptKey))
          .reduce((o, k) => { o[k] = metrics[k]; return o; }, {});

        parsed = {
          company: payload.company || { name: company_identifier, cik: null },
          concept: concept,
          data: conceptData,
          available_concepts: Object.keys(metrics)
        };
      } else {
        parsed = {
          company: payload.company || { name: company_identifier, cik: null },
          taxonomies: ['us-gaap (parsed)'],
          concept_counts: { 'us-gaap (parsed)': Object.keys(metrics).length },
          key_metrics: metrics
        };
      }
    } catch (e) {
      parsed = { company: { name: company_identifier, cik: null }, key_metrics: {} };
    }

    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  }

  /**
   * Get concept values across companies for a period (best-effort via web text)
   * Returns a structure similar to XBRL frames with limited accuracy.
   */
  async getSECXBRLFramesWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { taxonomy = 'us-gaap', concept, unit = 'USD', period, limit = 100 } = args;
    if (!concept) throw new Error('concept is required');
    if (!period) throw new Error('period is required');

    const validatedLimit = validateLimit(limit, 100);

    // Heuristic query: target concept mentions on SEC Archives
    const query = `site:sec.gov/Archives ${concept} ${unit}`;
    const results = await this.executeExaSearch(query, Math.min(validatedLimit, 50), true);

    // Map to simple data records
    const data = results.map(r => this.mapConceptValueFromText(r, concept, unit)).filter(Boolean);

    const output = {
      taxonomy,
      tag: concept,
      label: concept,
      description: null,
      unit,
      period,
      count: data.length,
      data: data.slice(0, validatedLimit)
    };

    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
  }

  /**
   * Search company tickers via website JSON (company_tickers.json)
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

  // ===== Helpers =====
  // executeExaSearch is now inherited from BaseWebSearchClient

  mapFilingFromResult(result, includeFullText, includeSnippet) {
    const url = result.url || '';
    const text = result.text || '';

    if (!url.includes('/Archives/')) return null;

    // Try to extract CIK, accession (digits-only), and primary document from URL
    // e.g., https://www.sec.gov/Archives/edgar/data/0000036270/000003627024000012/chem-20240630.htm
    const m = url.match(/\/Archives\/edgar\/data\/(\d+)\/(\d+)\/([^\/?#]+)/i);
    const cik = m ? m[1] : this.extractFirst(/CIK[\s:]*([0-9]{7,10})/i, text);
    const accDigits = m ? m[2] : this.extractFirst(/ACCESSION\s*NUMBER\s*[:#]?[\s]*([0-9\-]+)/i, text)?.replace(/-/g, '');
    const primary = m ? m[3] : null;

    let accessionNumber = null;
    if (accDigits && /^\d{18}$/.test(accDigits)) {
      accessionNumber = `${accDigits.slice(0,10)}-${accDigits.slice(10,12)}-${accDigits.slice(12)}`;
    } else if (accDigits && /\d{10}-\d{2}-\d{6}/.test(accDigits)) {
      accessionNumber = accDigits;
    }

    // Form type and dates
    const form = this.extractFirst(/\b(Form\s*[0-9A-Z\-]+|10-K|10-Q|8-K|20-F|DEF\s*14A|S-1)\b/i, result.title || text);
    const filingDate = this.extractFirst(/Filed\s*[:\-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, text) || this.extractFirst(/Filing\s*Date\s*[:\-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, text);
    const reportDate = this.extractFirst(/Report\s*Date\s*[:\-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, text) || null;
    const company = this.extractFirst(/(Company|Registrant)\s*Name\s*[:\-]\s*([^\n]+)/i, text) || (result.title || '').split('-')[0]?.trim();

    const mapped = {
      url,
      cik: cik ? String(cik).padStart(10, '0') : null,
      accessionNumber,
      primaryDocument: primary || null,
      form: form ? form.replace(/Form\s*/i, '').trim() : null,
      filingDate: filingDate || null,
      reportDate,
      company: company || null
    };
    
    // Add snippet if requested (500 char preview of meaningful content)
    if (includeSnippet && text) {
      mapped.snippet = this.extractSmartSnippet(text, 500);
    }
    
    // Add full text if requested
    if (includeFullText && text) {
      mapped.full_text = text;
    }
    
    return mapped;
  }

  extractFirst(re, text, groupIndex = 1) {
    const m = String(text || '').match(re);
    if (!m) return null;
    return (m[groupIndex] || '').trim();
  }

  /**
   * Extract a smart snippet from SEC filing text
   * Skips headers, tables, and looks for meaningful business content
   */
  extractSmartSnippet(text, maxLength = 500) {
    if (!text) return null;
    
    // Clean up the text
    let cleaned = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\t/g, ' ') // Remove tabs
      .trim();
    
    // Try to find business summary or meaningful sections first
    const meaningfulSections = [
      /business\s+overview[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
      /executive\s+summary[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
      /management\s+discussion[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
      /forward[\s-]looking\s+statements[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
      /business\s+description[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is
    ];
    
    for (const regex of meaningfulSections) {
      const match = cleaned.match(regex);
      if (match && match[1] && match[1].trim().length > 100) {
        const section = match[1].trim();
        return section.length > maxLength ? section.substring(0, maxLength) + '...' : section;
      }
    }
    
    // Skip common boilerplate sections at the start
    const skipPatterns = [
      /^(UNITED STATES SECURITIES AND EXCHANGE COMMISSION|SEC|FORM \d|FILING DATE|ACCESSION NUMBER|CIK|COMPANY|REGISTRANT)/i,
      /^(Table of Contents|INDEX|PART [IVX]+|ITEM \d)/i,
      /^\s*\d+\s*$/,
      /^\s*[A-Z\s]{10,}\s*$/  // Skip all-caps headers
    ];
    
    const paragraphs = cleaned.split(/\n+/).filter(p => p.trim().length > 50);
    
    for (const paragraph of paragraphs) {
      // Skip if it matches any skip pattern
      const shouldSkip = skipPatterns.some(pattern => pattern.test(paragraph.trim()));
      if (shouldSkip) continue;
      
      // Skip if it's mostly numbers/tables (likely financial data)
      const numberDensity = (paragraph.match(/\d+[,.]?\d*/g) || []).length / paragraph.split(/\s+/).length;
      if (numberDensity > 0.3) continue;
      
      // This looks like meaningful content
      const trimmed = paragraph.trim();
      return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed;
    }
    
    // Fallback: just take first meaningful chunk
    const fallback = cleaned.substring(0, maxLength * 2);
    const sentences = fallback.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      let snippet = '';
      for (const sentence of sentences) {
        if (snippet.length + sentence.length > maxLength) break;
        snippet += sentence;
      }
      return snippet || cleaned.substring(0, maxLength) + '...';
    }
    
    return cleaned.substring(0, maxLength) + (cleaned.length > maxLength ? '...' : '');
  }

  async enrichFilingsWithText(filings) {
    // For each filing, ensure we have some text content via Exa
    const enriched = [];
    for (const f of filings) {
      const url = f.edgar_url || f.url;
      if (!url) { enriched.push(f); continue; }
      try {
        const res = await this.executeExaSearch(`url:${url}`, 1, true);
        const page = res[0];
        enriched.push({ ...f, _page_text: page?.text || '' });
      } catch {
        enriched.push(f);
      }
    }
    return enriched;
  }

  extractKeyFinancialFactsFromFilings(filings) {
    const metrics = {};
    for (const f of filings) {
      const text = f._page_text || '';
      if (!text) continue;
      const add = (key, value, meta = {}) => {
        if (value == null) return;
        if (!metrics[key]) metrics[key] = [];
        metrics[key].push({ value, accessionNumber: f.accessionNumber || null, filingDate: f.filingDate || null, form: f.form || null, ...meta });
      };
      add('Revenues', this.findMoneyNear(text, /(Net\s+Sales|Revenue|Total\s+Revenue)/i));
      add('NetIncomeLoss', this.findNetIncomeLoss(text));
      add('Assets', this.findMoneyNear(text, /(Total\s+assets)/i));
      add('Liabilities', this.findMoneyNear(text, /(Total\s+liabilities)/i));
      add('CashAndCashEquivalents', this.findMoneyNear(text, /(Cash\s+and\s+cash\s+equivalents)/i));
    }
    return metrics;
  }

  findMoneyNear(text, anchorRegex) {
    if (!text) return null;
    const lines = text.split(/\n+/);
    for (let i = 0; i < lines.length; i++) {
      if (anchorRegex.test(lines[i])) {
        // Prefer value on the SAME line as the anchor
        const sameLineVal = this.extractMoneyFromLine(lines[i]);
        if (sameLineVal != null) return sameLineVal;
        // Fallback: look at next two lines only if same line has none
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const val = this.extractMoneyFromLine(lines[j]);
          if (val != null) return val;
        }
      }
    }
    return null;
  }

  extractMoney(s) {
    if (!s) return null;
    // Match numbers like $1,234,567 or (1,234) or 1,234,567
    const m = s.match(/\$?\(?\b\d{1,3}(,\d{3})*(\.\d+)?\)?\b/);
    if (!m) return null;
    let num = m[0].replace(/[$,]/g, '');
    let negative = false;
    if (/^\(.*\)$/.test(m[0])) { negative = true; num = num.replace(/[()]/g, ''); }
    const val = parseFloat(num);
    return isNaN(val) ? null : (negative ? -val : val);
  }

  extractMoneyFromLine(line) {
    if (!line) return null;
    // Find all candidate money tokens on the line and prefer the last one (often the value)
    const re = /\$?\(?\b\d{1,3}(,\d{3})*(\.\d+)?\)?\b/g;
    const matches = line.match(re) || [];
    if (matches.length === 0) return null;
    // Use the last match
    const token = matches[matches.length - 1];
    // Reuse extractMoney logic for sign handling
    return this.extractMoney(token);
  }

  findNetIncomeLoss(text) {
    if (!text) return null;
    const lines = text.split(/\n+/);
    const re = /(Net\s*income\s*\(loss\)|Net\s+income|Net\s+loss)/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (re.test(line)) {
        // Prefer explicit parenthetical value as negative if present: (1,234,567)
        const paren = line.match(/\((\d{1,3}(?:,\d{3})*(?:\.\d+)?)\)/);
        if (paren && paren[1]) {
          const n = parseFloat(paren[1].replace(/,/g, ''));
          if (!isNaN(n)) return -Math.abs(n);
        }
        const val = this.extractMoneyFromLine(line);
        if (val == null) continue;
        const isLoss = /loss/i.test(line);
        return isLoss ? -Math.abs(val) : val;
      }
    }
    return null;
  }

  mapConceptValueFromText(result, concept, unit) {
    const url = result.url || '';
    const text = result.text || '';
    const value = this.findMoneyNear(text, new RegExp(concept.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'));
    if (value == null) return null;
    const cik = this.extractFirst(/CIK[\s:]*([0-9]{7,10})/i, text) || (url.match(/data\/(\d+)\//)?.[1] || null);
    const accn = this.extractFirst(/ACCESSION\s*NUMBER\s*[:#]?[\s]*([0-9\-]+)/i, text) || (url.match(/data\/\d+\/(\d+)\//)?.[1] || null);
    const filingDate = this.extractFirst(/Filed\s*[:\-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, text) || null;
    const form = this.extractFirst(/\b(10-K|10-Q|8-K|20-F|DEF\s*14A|S-1)\b/i, text) || null;
    return {
      entityName: null,
      cik: cik ? String(cik).padStart(10, '0') : null,
      value,
      accessionNumber: accn || null,
      filingDate,
      form,
      unit
    };
  }

  /**
   * Assess query relevance specific to SEC filing searches
   * @param {string} companyQuery - Company identifier or query
   * @param {Array} rawResults - Raw Exa results
   * @param {Array} mappedFilings - Processed SEC filings
   * @param {Object} toolArgs - Tool arguments
   * @returns {Object} SEC specific quality metadata
   */
  assessSECQueryRelevance(companyQuery, rawResults, mappedFilings, toolArgs) {
    const baseAssessment = this.assessQueryRelevance(companyQuery, mappedFilings, toolArgs);
    
    // SEC specific enhancements
    const secMetadata = {
      filing_type_analysis: this.analyzeFilingTypes(toolArgs.filing_type, mappedFilings),
      company_identification: this.analyzeCompanyIdentification(companyQuery, mappedFilings),
      temporal_coverage: this.analyzeFilingTemporalCoverage(mappedFilings, toolArgs),
      filing_completeness: this.assessFilingCompleteness(mappedFilings),
      edgar_accessibility: this.assessEdgarAccessibility(mappedFilings)
    };
    
    // Override suggestions with SEC specific ones
    baseAssessment._search_quality.query_suggestions = this.generateSECSuggestions(
      companyQuery, mappedFilings, toolArgs
    );
    
    // Add SEC metadata
    baseAssessment._search_quality.sec_metadata = secMetadata;
    
    return baseAssessment;
  }

  /**
   * Analyze filing type relevance
   */
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

  /**
   * Analyze company identification quality
   */
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

  /**
   * Analyze temporal coverage of filings
   */
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
    
    const analysis = {
      total_with_dates: dates.length,
      date_range: {
        oldest: dates[dates.length - 1]?.toISOString()?.split('T')[0],
        newest: dates[0]?.toISOString()?.split('T')[0]
      },
      recent_filings: recentFilings,
      year_filings: yearFilings,
      recency_score: recentFilings / dates.length
    };
    
    // Check date filter compliance
    if (toolArgs.date_after) {
      const afterDate = new Date(toolArgs.date_after);
      const compliantFilings = dates.filter(d => d >= afterDate).length;
      analysis.date_after_compliance = compliantFilings / dates.length;
    }
    
    if (toolArgs.date_before) {
      const beforeDate = new Date(toolArgs.date_before);
      const compliantFilings = dates.filter(d => d <= beforeDate).length;
      analysis.date_before_compliance = compliantFilings / dates.length;
    }
    
    return analysis;
  }

  /**
   * Assess filing completeness
   */
  assessFilingCompleteness(filings) {
    if (!filings.length) return { score: 0, issues: ['No filings found'] };
    
    const issues = [];
    let completenessScore = 1.0;
    
    // Check for missing accession numbers
    const missingAccession = filings.filter(f => !f.accessionNumber).length;
    if (missingAccession > 0) {
      issues.push(`${missingAccession} filings missing accession numbers`);
      completenessScore -= 0.2;
    }
    
    // Check for missing filing dates
    const missingDates = filings.filter(f => !f.filingDate).length;
    if (missingDates > 0) {
      issues.push(`${missingDates} filings missing filing dates`);
      completenessScore -= 0.2;
    }
    
    // Check for missing form types
    const missingForms = filings.filter(f => !f.form).length;
    if (missingForms > 0) {
      issues.push(`${missingForms} filings missing form types`);
      completenessScore -= 0.2;
    }
    
    // Check for EDGAR URL accessibility
    const missingUrls = filings.filter(f => !f.edgar_url).length;
    if (missingUrls > 0) {
      issues.push(`${missingUrls} filings missing EDGAR URLs`);
      completenessScore -= 0.1;
    }
    
    return {
      score: Math.max(0, completenessScore),
      issues: issues,
      complete_filings: filings.length - Math.max(missingAccession, missingDates, missingForms)
    };
  }

  /**
   * Assess EDGAR accessibility
   */
  assessEdgarAccessibility(filings) {
    const withUrls = filings.filter(f => f.edgar_url).length;
    const accessibilityRatio = filings.length > 0 ? withUrls / filings.length : 0;
    
    return {
      filings_with_urls: withUrls,
      total_filings: filings.length,
      accessibility_ratio: accessibilityRatio,
      accessibility_score: accessibilityRatio >= 0.9 ? 'high' : 
                          accessibilityRatio >= 0.7 ? 'medium' : 'low'
    };
  }

  /**
   * Generate SEC specific suggestions
   */
  generateSECSuggestions(companyQuery, filings, toolArgs) {
    const suggestions = [];
    
    // No results suggestions
    if (!filings.length) {
      if (companyQuery) {
        suggestions.push("Try searching by ticker symbol or CIK number");
        if (!/^[A-Z]{1,5}$/.test(companyQuery) && !/^\d{1,10}$/.test(companyQuery)) {
          suggestions.push("Use exact company name or try partial name matching");
        }
      }
      return suggestions.join('; ');
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
      } else {
        suggestions.push(`Consider filing_type: '10-K', '10-Q', or '8-K' for common filings`);
      }
    }
    
    // Date range suggestions
    const temporalAnalysis = this.analyzeFilingTemporalCoverage(filings, toolArgs);
    if (temporalAnalysis.recency_score < 0.3 && !toolArgs.date_after) {
      suggestions.push("Add date_after for recent filings only");
    }
    
    // Company identification suggestions
    const companyAnalysis = this.analyzeCompanyIdentification(companyQuery, filings);
    if (companyAnalysis.identification_confidence === 'unconfirmed') {
      suggestions.push("Verify company identifier (ticker, CIK, or exact name)");
    }
    
    // Completeness suggestions
    const completeness = this.assessFilingCompleteness(filings);
    if (completeness.score < 0.8) {
      suggestions.push("Some filings may have incomplete metadata");
    }
    
    // Coverage suggestions
    if (filings.length === toolArgs.limit) {
      suggestions.push(`Increase limit beyond ${toolArgs.limit} for more comprehensive coverage`);
    }
    
    // Content suggestions
    if (!toolArgs.include_snippet && !toolArgs.include_text) {
      suggestions.push("Enable include_snippet for filing summaries");
    }
    
    return suggestions.length > 0 ? suggestions.join('; ') : '';
  }

  // Override parent methods for SEC specificity
  isExactDocumentMatch(query, result) {
    const queryLower = query.toLowerCase();
    
    // Check ticker symbol match
    if (/^[A-Z]{1,5}$/.test(query)) {
      return (result.form || '').toLowerCase().includes(queryLower) ||
             (result.accessionNumber || '').includes(query);
    }
    
    // Check CIK match
    if (/^\d{1,10}$/.test(query)) {
      return (result.accessionNumber || '').includes(query);
    }
    
    // Check filing form match
    if (/^(10-K|10-Q|8-K|DEF 14A)$/i.test(query)) {
      return (result.form || '').toLowerCase() === queryLower;
    }
    
    return super.isExactDocumentMatch(query, result);
  }

  hasRecentResults(results, daysThreshold = 365) {
    if (!results || results.length === 0) return false;
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    return results.some(result => {
      const resultDate = new Date(result.filingDate || '1900-01-01');
      return resultDate >= thresholdDate;
    });
  }
}



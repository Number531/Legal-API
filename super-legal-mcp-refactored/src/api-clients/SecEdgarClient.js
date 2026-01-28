/**
 * SEC EDGAR API Client
 * Handles all SEC EDGAR related API calls for corporate filings and financial data
 */

import { makeApiRequest } from '../utils/apiHelpers.js';
import { resolveToCIK, filterSECFilings, extractKeyFinancialFacts } from '../utils/apiHelpers.js';
import { makeSECApiRequest } from '../utils/secApiHelper.js';

export class SecEdgarClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  async searchSECFilings(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { 
      company_identifier, 
      filing_type = "all", 
      date_after, 
      date_before, 
      include_facts = false,
      limit = 10 
    } = args;

    try {
      console.error(`[SEC Client] searchSECFilings called with:`, JSON.stringify(args));
      
      // First, resolve company identifier to CIK
      console.error(`[SEC Client] Resolving company identifier: ${company_identifier}`);
      const cik = await resolveToCIK(company_identifier, this.rateLimiter);
      console.error(`[SEC Client] Resolved to CIK: ${cik}`);
      
      // Get company submissions (uses specialized SEC handler)
      const submissionsResponse = await makeSECApiRequest(
        `/submissions/CIK${cik.padStart(10, '0')}.json`,
        this.rateLimiter
      );

      // Convert columnar format to array of objects
      const recentFilingsData = submissionsResponse.filings?.recent || {};
      const recentFilings = [];
      
      // SEC returns data in columnar format - convert to row format
      const numFilings = recentFilingsData.form?.length || 0;
      for (let i = 0; i < numFilings; i++) {
        recentFilings.push({
          accessionNumber: recentFilingsData.accessionNumber?.[i],
          filingDate: recentFilingsData.filingDate?.[i],
          reportDate: recentFilingsData.reportDate?.[i],
          form: recentFilingsData.form?.[i],
          primaryDocument: recentFilingsData.primaryDocument?.[i],
          primaryDocDescription: recentFilingsData.primaryDocDescription?.[i]
        });
      }
      
      console.error(`[SEC Client] Found ${recentFilings.length} recent filings`);
      
      // Filter filings by criteria
      let filings = filterSECFilings(
        recentFilings,
        filing_type,
        date_after,
        date_before
      ).slice(0, limit);

      // Optionally include financial facts
      let companyFacts = null;
      if (include_facts) {
        try {
          companyFacts = await makeSECApiRequest(
            `/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`,
            this.rateLimiter
          );
        } catch (error) {
          console.warn('Financial facts not available for this company:', error);
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            company: {
              name: submissionsResponse.name,
              cik: submissionsResponse.cik,
              sic: submissionsResponse.sic,
              sicDescription: submissionsResponse.sicDescription,
              ticker: submissionsResponse.tickers?.[0] || "No ticker available"
            },
            filings: filings.map((filing) => ({
              accessionNumber: filing.accessionNumber,
              filingDate: filing.filingDate,
              form: filing.form,
              primaryDocument: filing.primaryDocument,
              reportDate: filing.reportDate,
              edgar_url: `https://www.sec.gov/Archives/edgar/data/${cik}/${filing.accessionNumber.replace(/-/g, '')}/${filing.primaryDocument}`
            })),
            financial_facts: companyFacts ? extractKeyFinancialFacts(companyFacts) : {},
            search_criteria: { filing_type, date_after, date_before, limit }
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('SEC filing search error:', error);
      throw new Error(`SEC filing search failed: ${error.message}`);
    }
  }

  async getSECCompanyFacts(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { company_identifier, concept } = args;

    try {
      const cik = await resolveToCIK(company_identifier, this.rateLimiter);
      
      // Get all company facts
      const factsResponse = await makeSECApiRequest(
        `/api/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`,
        this.rateLimiter
      );

      // If specific concept requested, filter to that
      if (concept) {
        const conceptData = {};
        
        // Check us-gaap taxonomy
        if (factsResponse.facts['us-gaap']?.[concept]) {
          conceptData['us-gaap'] = factsResponse.facts['us-gaap'][concept];
        }
        
        // Check ifrs-full taxonomy
        if (factsResponse.facts['ifrs-full']?.[concept]) {
          conceptData['ifrs-full'] = factsResponse.facts['ifrs-full'][concept];
        }
        
        // Check dei taxonomy
        if (factsResponse.facts['dei']?.[concept]) {
          conceptData['dei'] = factsResponse.facts['dei'][concept];
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              company: {
                name: factsResponse.entityName,
                cik: factsResponse.cik
              },
              concept: concept,
              data: conceptData,
              available_concepts: {
                'us-gaap': Object.keys(factsResponse.facts['us-gaap'] || {}).slice(0, 20),
                'ifrs-full': Object.keys(factsResponse.facts['ifrs-full'] || {}).slice(0, 20),
                'dei': Object.keys(factsResponse.facts['dei'] || {}).slice(0, 20)
              }
            }, null, 2)
          }]
        };
      }

      // Return summary of all facts
      const summary = {
        company: {
          name: factsResponse.entityName,
          cik: factsResponse.cik
        },
        taxonomies: Object.keys(factsResponse.facts),
        concept_counts: {}
      };

      for (const taxonomy of Object.keys(factsResponse.facts)) {
        summary.concept_counts[taxonomy] = Object.keys(factsResponse.facts[taxonomy]).length;
      }

      // Extract key financial metrics
      summary.key_metrics = extractKeyFinancialFacts(factsResponse);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(summary, null, 2)
        }]
      };
    } catch (error) {
      console.error('SEC company facts error:', error);
      throw new Error(`SEC company facts failed: ${error.message}`);
    }
  }

  async getSECXBRLFrames(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { 
      taxonomy = 'us-gaap',
      concept,
      unit = 'USD',
      period,
      limit = 100
    } = args;

    try {
      // Format period correctly for XBRL frames API
      // Accepts formats like: CY2021, CY2021Q1, CY2021Q4I (I = instant)
      let formattedPeriod = period;
      
      // If it's just a year like "2023", convert to "CY2023Q4I" (year-end instant)
      if (/^\d{4}$/.test(period)) {
        formattedPeriod = `CY${period}Q4I`;
      }
      // If it's like "2023Q1", convert to "CY2023Q1I"
      else if (/^\d{4}Q\d$/.test(period)) {
        formattedPeriod = `CY${period}I`;
      }
      // If it already has CY prefix, ensure it has the I suffix for instant
      else if (/^CY\d{4}(Q\d)?$/.test(period)) {
        formattedPeriod = `${period}I`;
      }
      
      // Build the frames endpoint URL
      const endpoint = `/api/xbrl/frames/${taxonomy}/${concept}/${unit}/${formattedPeriod}.json`;
      
      const framesResponse = await makeSECApiRequest(
        endpoint,
        this.rateLimiter
      );

      // Sort by value descending and limit results
      const sortedData = (framesResponse.data || [])
        .sort((a, b) => (b.val || 0) - (a.val || 0))
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            taxonomy: framesResponse.taxonomy,
            tag: framesResponse.tag,
            label: framesResponse.label,
            description: framesResponse.description,
            unit: framesResponse.uom,
            period: period,
            count: framesResponse.data?.length || 0,
            data: sortedData.map(item => ({
              entityName: item.entityName,
              cik: item.cik,
              value: item.val,
              accessionNumber: item.accn,
              filingDate: item.filed,
              form: item.form
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('SEC XBRL frames error:', error);
      throw new Error(`SEC XBRL frames failed: ${error.message}`);
    }
  }

  async searchSECCompanyTickers(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const { search_term, exchange } = args;

    try {
      // Get all company tickers - this endpoint is at www.sec.gov not data.sec.gov
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

      // Convert to array and search
      const companies = Object.values(tickersResponse);
      const searchTermUpper = search_term.toUpperCase();
      
      let results = companies.filter(company => 
        company.ticker.includes(searchTermUpper) ||
        company.title.toUpperCase().includes(searchTermUpper)
      );

      // Filter by exchange if specified
      if (exchange) {
        results = results.filter(company => 
          company.exchange === exchange.toUpperCase()
        );
      }

      // Sort by relevance (exact ticker matches first, then by name)
      results.sort((a, b) => {
        if (a.ticker === searchTermUpper) return -1;
        if (b.ticker === searchTermUpper) return 1;
        if (a.ticker.startsWith(searchTermUpper)) return -1;
        if (b.ticker.startsWith(searchTermUpper)) return 1;
        return a.title.localeCompare(b.title);
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            search_term: search_term,
            count: results.length,
            results: results.slice(0, 50).map(company => ({
              ticker: company.ticker,
              name: company.title,
              cik: String(company.cik_str).padStart(10, '0'),
              exchange: company.exchange
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('SEC ticker search error:', error);
      throw new Error(`SEC ticker search failed: ${error.message}`);
    }
  }
}
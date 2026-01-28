/**
 * PTAB (Patent Trial and Appeal Board) API Client
 * Provides access to PTAB proceedings and decisions
 */

import { makeApiRequest } from '../utils/apiHelpers.js';

export class PTABClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Search PTAB proceedings (IPR, PGR, CBM, Appeals, etc.)
   * @param {Object} args
   * @returns MCP-compatible content response
   */
  async searchProceedings(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      proceeding_type,
      patent_number,
      petitioner,
      patent_owner,
      date_filed_after,
      date_filed_before,
      status,
      limit = 25
    } = args;

    // Build request body for POST to /proceedings/json endpoint
    // Use text search (q parameter) since facets appear to be ignored
    const requestBody = {
      rows: Math.min(Number(limit) || 25, 100),
      start: 0
    };

    // Build search query string for text search
    let searchTerms = [];
    
    // Add filters using text search since facetMap doesn't work
    if (proceeding_type) {
      if (proceeding_type === 'IPR' || proceeding_type === 'PGR' || proceeding_type === 'CBM') {
        // Search for proceedings with this prefix
        searchTerms.push(`${proceeding_type}*`);
      } else if (proceeding_type === 'Appeal') {
        // Search for appeal proceedings
        searchTerms.push('Appeal');
      }
    }
    
    if (patent_number) {
      // Clean patent number for search
      const cleanPatent = patent_number.replace(/[^0-9]/g, '');
      searchTerms.push(cleanPatent);
    }
    
    if (petitioner) {
      searchTerms.push(`"${petitioner}"`);
    }
    
    if (patent_owner) {
      searchTerms.push(`"${patent_owner}"`);
    }
    
    if (status) {
      searchTerms.push(status);
    }
    
    // Combine search terms into query string
    if (searchTerms.length > 0) {
      requestBody.q = searchTerms.join(' ');
    }
    
    // Add date range if provided
    if (date_filed_after || date_filed_before) {
      requestBody.dateRangeMap = {
        filingDatetime: {}
      };
      if (date_filed_after) requestBody.dateRangeMap.filingDatetime.start = date_filed_after;
      if (date_filed_before) requestBody.dateRangeMap.filingDatetime.end = date_filed_before;
    }

    // Import makePostRequest for PTAB
    const { makePostRequest } = await import('../utils/apiHelpers.js');
    
    // Use POST to /proceedings/json endpoint
    const response = await makePostRequest('ptab', '/proceedings/json', requestBody, this.rateLimiter);

    // Filter results client-side to ensure they match the requested type
    let filteredResults = response?.results || [];
    
    if (proceeding_type && filteredResults.length > 0) {
      if (proceeding_type === 'IPR' || proceeding_type === 'PGR' || proceeding_type === 'CBM') {
        // Filter for proceedings that start with the requested type
        filteredResults = filteredResults.filter(result => 
          result.proceedingNumber && result.proceedingNumber.startsWith(proceeding_type)
        );
      } else if (proceeding_type === 'Appeal') {
        // Filter for appeal proceedings (exclude IPR/PGR/CBM)
        filteredResults = filteredResults.filter(result => 
          result.proceedingTypeCategory === 'Appeal' || 
          (result.proceedingNumber && !result.proceedingNumber.match(/^(IPR|PGR|CBM)/))
        );
      }
    }
    
    // Add a note if searching for IPR/PGR/CBM with no results
    let note = null;
    if (proceeding_type && ['IPR', 'PGR', 'CBM'].includes(proceeding_type)) {
      if (filteredResults.length === 0) {
        note = "Note: IPR/PGR/CBM proceedings may not be available via this API endpoint. Consider using search_ptab_ipr_proceedings, search_ptab_pgr_proceedings, or search_ptab_cbm_proceedings for web-based search of these proceeding types.";
      }
    }
    
    // Add query info for debugging
    const debugInfo = requestBody.q ? { search_query: requestBody.q } : {};

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          search_criteria: args,
          ...debugInfo,
          total_count: filteredResults.length,
          results: filteredResults,
          ...(note && { note })
        }, null, 2)
      }]
    };
  }

  /**
   * Get PTAB decisions (institution/final) for a specific proceeding
   * @param {Object} args
   * @returns MCP-compatible content response
   */
  async getDecisions(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const { proceeding_number, decision_type = 'all' } = args;

    if (!proceeding_number || typeof proceeding_number !== 'string') {
      throw new Error("proceeding_number is required (e.g., 'IPR2023-00123')");
    }

    // Build request body for POST to /documents/json endpoint
    // Use text search (q parameter) to filter by proceeding number
    const requestBody = {
      rows: 100,
      start: 0
    };
    
    // Build search query to find documents for specific proceeding
    let searchTerms = [];
    
    // Add the exact proceeding number as primary search term
    searchTerms.push(`"${proceeding_number}"`);
    
    // Add decision type filter to search query
    if (decision_type === 'institution') {
      searchTerms.push('"Institution Decision"');
    } else if (decision_type === 'final') {
      searchTerms.push('"Final Written Decision"');
    } else if (decision_type !== 'all') {
      searchTerms.push(`"${decision_type}"`);
    }
    
    // Set the query string
    requestBody.q = searchTerms.join(' ');

    // Import makePostRequest for PTAB
    const { makePostRequest } = await import('../utils/apiHelpers.js');
    
    // Use POST to /documents/json endpoint for decisions
    const response = await makePostRequest('ptab', '/documents/json', requestBody, this.rateLimiter);

    // Filter results client-side to ensure they match the requested proceeding
    let filteredResults = response?.results || [];
    
    // Filter for documents that actually belong to the requested proceeding
    if (filteredResults.length > 0) {
      filteredResults = filteredResults.filter(result => {
        // Check if the document's proceeding number matches
        if (result.proceedingNumber === proceeding_number) {
          return true;
        }
        // Also check if the proceeding number appears in document title or description
        const searchText = `${result.documentDescription || ''} ${result.title || ''}`.toLowerCase();
        return searchText.includes(proceeding_number.toLowerCase());
      });
    }
    
    // Add note if this appears to be an IPR/PGR/CBM proceeding with no results
    let note = null;
    if (proceeding_number.match(/^(IPR|PGR|CBM)\d{4}-\d{5}$/i)) {
      if (filteredResults.length === 0) {
        note = "Note: IPR/PGR/CBM decisions may not be available via this API endpoint. The PTAB API primarily contains Appeal decisions. For IPR/PGR/CBM proceedings, use the web-based search functions instead.";
      }
    }
    
    // Add query info for debugging
    const debugInfo = requestBody.q ? { search_query: requestBody.q } : {};

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          proceeding: proceeding_number,
          decision_type: decision_type,
          ...debugInfo,
          count: filteredResults.length,
          decisions: filteredResults,
          ...(note && { note })
        }, null, 2)
      }]
    };
  }
}



/**
 * Federal Register API Client
 * Handles all Federal Register related API calls for regulations and agency notices
 */

import { makeApiRequest } from '../utils/apiHelpers.js';
import { buildFederalRegisterParams } from '../utils/apiHelpers.js';

export class FederalRegisterClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  async searchFederalRegister(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      query,
      agency,
      document_type,
      significant_only = false,
      date_range,
      cfr_title,
      limit = 20
    } = args;

    try {
      const params = buildFederalRegisterParams({
        query,
        agency,
        document_type,
        significant_only,
        date_range,
        cfr_title,
        limit
      });

      const response = await makeApiRequest(
        `/documents.json?${params.toString()}`,
        {},
        { apiType: 'federal_register', rateLimiter: this.rateLimiter }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            count: response.count || 0,
            results: (response.results || []).map((doc) => ({
              title: doc.title,
              publication_date: doc.publication_date,
              document_type: doc.type,
              agencies: (doc.agencies || []).map((a) => ({
                name: a.name,
                id: a.id
              })),
              abstract: doc.abstract,
              significant: doc.significant,
              url: doc.html_url
            })),
            search_criteria: { query, agency, document_type, significant_only, date_range, cfr_title }
          }, null, 2)
        }]
      };
    } catch (error) {
      // Use graceful error handling
      const { logError, APIError } = await import('../utils/errorHandling.js');
      
      if (error instanceof APIError && error.isAPILimitation()) {
        // This is an expected API limitation - log at debug level only
        logError(error, { api: 'Federal Register', method: 'searchFederalRegister' });
      } else {
        // Unexpected error - log normally
        console.error('Federal Register search error:', error.message);
      }
      
      throw error;
    }
  }
}
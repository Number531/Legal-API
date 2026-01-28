/**
 * FDA openFDA API Client
 * Covers core datasets: FAERS (drug adverse events), MAUDE (device events), SPL (drug labeling), recalls
 * Docs: https://open.fda.gov/apis/
 */

import { makeApiRequest } from '../utils/apiHelpers.js';

export class FDAClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.basePath = '';
  }

  // Helper to build openFDA query params
  buildOpenFdaParams({ search, limit = 2, skip = 0, sort, count, api_key }) {
    const params = {};
    if (search) params.search = search; // openFDA Lucene-like query
    if (limit !== undefined) params.limit = Math.min(Number(limit) || 2, 100);
    if (skip !== undefined) params.skip = Math.max(Number(skip) || 0, 0);
    if (sort) params.sort = sort;
    if (count) params.count = count; // for aggregation queries
    if (api_key || process.env.FDA_API_KEY) params.api_key = api_key || process.env.FDA_API_KEY;
    return params;
  }

  // Drug adverse events (FAERS)
  async searchDrugAdverseEvents(args) {
    if (!args || typeof args !== 'object') args = {};
    const params = this.buildOpenFdaParams(args);
    
    // Endpoint: /drug/event.json
    const response = await makeApiRequest('/drug/event.json', params, {
      apiType: 'fda_openfda',
      rateLimiter: this.rateLimiter
    });
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }

  // Device events (MAUDE)
  async searchDeviceEvents(args) {
    if (!args || typeof args !== 'object') args = {};
    const params = this.buildOpenFdaParams(args);
    
    // Endpoint: /device/event.json
    const response = await makeApiRequest('/device/event.json', params, {
      apiType: 'fda_openfda',
      rateLimiter: this.rateLimiter
    });
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }

  // Drug labeling (SPL)
  async searchDrugLabels(args) {
    if (!args || typeof args !== 'object') args = {};
    const params = this.buildOpenFdaParams(args);
    
    // Endpoint: /drug/label.json
    const response = await makeApiRequest('/drug/label.json', params, {
      apiType: 'fda_openfda',
      rateLimiter: this.rateLimiter
    });
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }

  // Recalls (enforcement reports) - drug/device/food via /food/enforcement.json, /drug/enforcement.json, /device/enforcement.json
  async searchRecalls(args) {
    if (!args || typeof args !== 'object') args = {};
    const { product_area = 'drug', ...rest } = args;
    const params = this.buildOpenFdaParams(rest);
    const area = ['drug', 'device', 'food'].includes(String(product_area)) ? product_area : 'drug';
    
    const response = await makeApiRequest(`/${area}/enforcement.json`, params, {
      apiType: 'fda_openfda',
      rateLimiter: this.rateLimiter
    });
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
}



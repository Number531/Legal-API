/**
 * API Helper Functions
 * Generic API request utilities with retry logic, rate limiting, and caching
 */

import https from 'https';
import { apiConfigs } from '../config/apiConfig.js';
import { getCacheKey, getFromCache, setCache } from './cache.js';

/**
 * Custom fetch wrapper for EPA ECHO API that bypasses SSL verification.
 * The EPA government CA certificate is not in Node.js's default trust store,
 * causing "self-signed certificate in certificate chain" errors.
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (headers, etc.)
 * @returns {Promise<Response>} Response object compatible with fetch API
 */
function fetchWithInsecureSSL(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false  // Bypass SSL verification
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Create a Response-like object
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          },
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Makes an API request with retry logic and caching
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {boolean} options.useCache - Whether to use caching (default: true)
 * @param {string} options.apiType - API type from config (default: 'courtlistener')
 * @param {Object} options.rateLimiter - Rate limiter instance
 * @returns {Promise<Object>} API response data
 */
export async function makeApiRequest(endpoint, params = {}, options = {}) {
  const { 
    useCache = true, 
    apiType = 'courtlistener', 
    rateLimiter
  } = options;
  
  // Set timeout and retries based on API type
  const timeout = options.timeout || (apiType === 'courtlistener' ? 30000 : 60000);
  const maxRetries = options.maxRetries || (apiType === 'courtlistener' ? 2 : 3);
  
  // Check cache first
  if (useCache) {
    const cacheKey = getCacheKey(endpoint, params);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  let url;
  let headers;
  
  // Configure based on API type
  if (apiType === 'courtlistener') {
    const baseUrl = "https://www.courtlistener.com/api/rest/v4";
    const apiToken = process.env.COURTLISTENER_API_TOKEN || "";
    
    url = new URL(`${baseUrl}${endpoint}`);
    headers = {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-CourtListener-MCP/2.0.0'
    };
    if (apiToken) {
      headers['Authorization'] = `Token ${apiToken}`;
    }
  } else {
    const config = apiConfigs[apiType];
    if (!config) {
      throw new Error(`Unknown API type: ${apiType}`);
    }
    
    url = new URL(`${config.baseUrl}${endpoint}`);
    headers = { ...config.headers };
    
    // For PTAB API, ensure API key is properly set
    if (apiType === 'ptab') {
      const apiKey = process.env.USPTO_API_KEY;
      if (apiKey) {
        headers['X-Api-Key'] = apiKey;
      } else {
        // Remove empty API key header
        delete headers['X-Api-Key'];
      }
    }
  }
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Apply rate limiting if provided
      if (rateLimiter && typeof rateLimiter.enforce === 'function') {
        await rateLimiter.enforce();
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
      );
      
      // Build fetch options
      const fetchOptions = { headers };
      
      // Choose fetch function - use insecure SSL for EPA (government CA not in default trust store)
      const fetchFn = url.toString().includes('echodata.epa.gov') 
        ? fetchWithInsecureSSL 
        : fetch;
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetchFn(url.toString(), fetchOptions),
        timeoutPromise
      ]);

      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.min(1000 * Math.pow(2, attempt), 10000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        // Import error handling (will be added at top of file)
        const { APIError, classifyHTTPError } = await import('./errorHandling.js');
        
        const classification = classifyHTTPError(response.status, endpoint, url.searchParams);
        
        const error = new APIError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          {
            ...classification,
            context: {
              endpoint,
              attempt: attempt + 1,
              maxRetries
            }
          }
        );
        
        // For persistent errors that won't be fixed by retrying, fail fast
        if (!classification.isRetryable) {
          error.shouldRetry = false;
        }
        
        lastError = error;
        
        // If this is an expected API limitation, throw immediately (no retries needed)
        if (classification.isExpected && !classification.isRetryable) {
          throw error;
        }
        
        throw error;
      }

      const data = await response.json();
      
      // Cache successful response
      if (useCache) {
        const cacheKey = getCacheKey(endpoint, params);
        setCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      lastError = error;
      
      // Don't retry if error indicates it won't help (404, 403, 5xx, timeouts)
      if (error.shouldRetry === false || error.message.includes('timeout')) {
        console.error(`API request to ${endpoint} failed with non-retryable error:`, error.message);
        throw error;
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Use graceful error logging
  const { logError, APIError } = await import('./errorHandling.js');
  
  if (lastError instanceof APIError) {
    logError(lastError, { endpoint, attempts: maxRetries });
  } else {
    console.error(`Error making API request to ${endpoint} after ${maxRetries} attempts:`, lastError);
  }
  
  throw lastError;
}

/**
 * Fetches all pages of paginated results
 * @param {string} endpoint - API endpoint path
 * @param {Object} baseParams - Base query parameters
 * @param {number} maxPages - Maximum pages to fetch (default: 10)
 * @param {string} apiType - API type from config (default: 'courtlistener')
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<Array>} All results from all pages
 */
export async function fetchAllPages(endpoint, baseParams, maxPages = 10, apiType = 'courtlistener', rateLimiter) {
  const allResults = [];
  let nextUrl = null;
  let pageCount = 0;
  
  do {
    let response;
    
    if (nextUrl) {
      // Use the full next URL
      const url = new URL(nextUrl);
      const baseUrl = apiType === 'courtlistener' 
        ? "https://www.courtlistener.com/api/rest/v4"
        : apiConfigs[apiType].baseUrl;
      
      response = await makeApiRequest(
        url.pathname.replace(baseUrl, ''),
        Object.fromEntries(url.searchParams),
        { useCache: false, apiType, rateLimiter }
      );
    } else {
      response = await makeApiRequest(endpoint, baseParams, { apiType, rateLimiter });
    }
    
    if (response.results) {
      allResults.push(...response.results);
    }
    
    nextUrl = response.next;
    pageCount++;
    
  } while (nextUrl && pageCount < maxPages);
  
  return allResults;
}

/**
 * Makes a POST request (primarily for USPTO API)
 * @param {string} apiType - API type from config
 * @param {string} endpoint - API endpoint path
 * @param {Object} body - Request body
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<Object>} API response data
 */
export async function makePostRequest(apiType, endpoint, body, rateLimiter) {
  const config = apiConfigs[apiType];
  if (!config) {
    throw new Error(`Unknown API type: ${apiType}`);
  }
  
  const url = `${config.baseUrl}${endpoint}`;

  // Apply rate limiting if provided
  if (rateLimiter && typeof rateLimiter.enforce === 'function') {
    await rateLimiter.enforce();
  }

  // Build headers, adding API key for USPTO if available
  const headers = { ...config.headers };
  
  if (apiType === 'uspto_patents') {
    const apiKey = process.env.USPTO_API_KEY;
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    } else {
      throw new Error('USPTO API key not configured. Set USPTO_API_KEY environment variable.');
    }
  }
  
  // PTAB doesn't need any API key
  if (apiType === 'ptab') {
    delete headers['X-Api-Key'];  // Remove any API key if present
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = '';
    try {
      const errorJson = JSON.parse(errorText);
      errorDetail = errorJson.detail || errorJson.error || errorJson.message || errorText;
    } catch {
      errorDetail = errorText;
    }
    
    throw new Error(`${apiType.toUpperCase()} API error ${response.status}: ${errorDetail}`);
  }

  return await response.json();
}

/**
 * Makes a request to fetch full text content from GovInfo
 * @param {string} packageId - GovInfo package ID
 * @param {string} format - Content format ('htm', 'txt', 'pdf', etc.)
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<Object>} Content data with format and package info
 */
export async function fetchGovInfoContent(packageId, format = 'htm', rateLimiter) {
  if (!process.env.GOVINFO_API_KEY) {
    throw new Error("GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.");
  }

  try {
    // Apply rate limiting
    if (rateLimiter && typeof rateLimiter.enforce === 'function') {
      await rateLimiter.enforce();
    }

    // Fetch the full document content
    const contentUrl = `https://api.govinfo.gov/packages/${packageId}/${format}?api_key=${process.env.GOVINFO_API_KEY}`;
    
    const response = await fetch(contentUrl, {
      headers: {
        'Accept': format === 'htm' ? 'text/html' : 'text/plain',
        'User-Agent': 'Super-Legal-MCP/1.0.0'
      }
    });

    if (!response.ok) {
      // If HTML fails, try plain text
      if (format === 'htm' && response.status === 404) {
        return await fetchGovInfoContent(packageId, 'txt', rateLimiter);
      }
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const content = await response.text();
    return {
      format: format,
      content: content,
      package_id: packageId
    };
  } catch (error) {
    console.error(`Error fetching GovInfo content for ${packageId}:`, error);
    throw error;
  }
}

/**
 * Federal Register API agency slug mappings
 * The API requires lowercase hyphenated agency names (slugs) instead of abbreviations
 */
const FEDERAL_REGISTER_AGENCY_SLUGS = {
  'EPA': 'environmental-protection-agency',
  'FDA': 'food-and-drug-administration',
  'FTC': 'federal-trade-commission',
  'DOJ': 'justice-department',
  'SEC': 'securities-and-exchange-commission',
  'DOL': 'labor-department',
  'HHS': 'health-and-human-services-department',
  'DOE': 'energy-department',
  'DOT': 'transportation-department',
  'OSHA': 'occupational-safety-and-health-administration',
  'CFPB': 'consumer-financial-protection-bureau',
  'FERC': 'federal-energy-regulatory-commission',
  'FCC': 'federal-communications-commission',
  'USPTO': 'patent-and-trademark-office',
  'IRS': 'internal-revenue-service'
};

/**
 * Builds query parameters for Federal Register API
 * @param {Object} params - Query parameters
 * @returns {URLSearchParams} Formatted query parameters
 */
export function buildFederalRegisterParams(params) {
  const {
    query,
    agency,
    document_type,
    significant_only = false,
    date_range,
    cfr_title,
    limit = 20
  } = params;

  const searchParams = new URLSearchParams();
  
  // Add each field separately as required by the API
  const fields = ['title', 'publication_date', 'agencies', 'abstract', 'html_url', 'type', 'significant'];
  fields.forEach(field => searchParams.append('fields[]', field));
  searchParams.append('per_page', limit.toString());

  if (query) searchParams.append('conditions[term]', query);
  if (agency) {
    // Convert agency abbreviation to slug format (e.g., 'FTC' -> 'federal-trade-commission')
    const agencySlug = FEDERAL_REGISTER_AGENCY_SLUGS[agency.toUpperCase()] || agency.toLowerCase();
    searchParams.append('conditions[agencies][]', agencySlug);
  }
  if (document_type) searchParams.append('conditions[type][]', document_type);
  if (significant_only) searchParams.append('conditions[significant]', '1');
  if (date_range) {
    const [start, end] = date_range.split('..');
    if (start) searchParams.append('conditions[publication_date][gte]', start);
    if (end) searchParams.append('conditions[publication_date][lte]', end);
  }
  if (cfr_title) searchParams.append('conditions[cfr][title]', cfr_title.toString());

  return searchParams;
}

/**
 * Resolves company identifier to CIK for SEC API
 * @param {string} identifier - Company name, ticker, or CIK
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<string>} CIK number
 */
export async function resolveToCIK(identifier, rateLimiter) {
  // Check if already a CIK
  if (/^\d{10}$/.test(identifier)) {
    return identifier;
  }
  
  // Special handling for company_tickers.json which is at www.sec.gov/files
  // NOT at the data.sec.gov API endpoint
  const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Enhanced-Legal-MCP/1.0.0)',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch company tickers: ${response.status}`);
  }
  
  const tickersResponse = await response.json();
  
  const companies = Object.values(tickersResponse);
  const upperIdentifier = identifier.toUpperCase();
  
  // Try exact ticker match first
  let company = companies.find((c) => c.ticker === upperIdentifier);
  
  // Try company name match
  if (!company) {
    company = companies.find((c) => 
      c.title.toUpperCase().includes(upperIdentifier) ||
      upperIdentifier.includes(c.title.toUpperCase())
    );
  }
  
  if (!company) {
    throw new Error(`Could not find company matching: ${identifier}`);
  }
  
  return String(company.cik_str);
}

/**
 * Filters SEC filings by criteria
 * @param {Array} filings - Array of SEC filings
 * @param {string} type - Filing type filter
 * @param {string} dateAfter - Date after filter
 * @param {string} dateBefore - Date before filter
 * @returns {Array} Filtered filings
 */
export function filterSECFilings(filings, type, dateAfter, dateBefore) {
  // Ensure filings is an array
  if (!Array.isArray(filings)) {
    console.warn('filterSECFilings: filings is not an array, returning empty array');
    return [];
  }
  
  let filtered = filings;
  
  if (type && type !== "all") {
    filtered = filtered.filter((f) => f.form === type);
  }
  
  if (dateAfter) {
    filtered = filtered.filter((f) => f.filingDate >= dateAfter);
  }
  
  if (dateBefore) {
    filtered = filtered.filter((f) => f.filingDate <= dateBefore);
  }
  
  return filtered;
}

/**
 * Extracts key financial facts from SEC company facts
 * @param {Object} facts - SEC company facts data
 * @returns {Object} Key financial metrics
 */
export function extractKeyFinancialFacts(facts) {
  const keyMetrics = {};
  
  try {
    // Extract common financial metrics
    const usgaap = facts.facts['us-gaap'] || {};
    
    // Revenue
    if (usgaap.Revenues) {
      keyMetrics.revenue = getLatestFactValue(usgaap.Revenues);
    }
    
    // Net Income
    if (usgaap.NetIncomeLoss) {
      keyMetrics.netIncome = getLatestFactValue(usgaap.NetIncomeLoss);
    }
    
    // Total Assets
    if (usgaap.Assets) {
      keyMetrics.totalAssets = getLatestFactValue(usgaap.Assets);
    }
    
    // Total Liabilities
    if (usgaap.Liabilities) {
      keyMetrics.totalLiabilities = getLatestFactValue(usgaap.Liabilities);
    }
    
    // Cash
    if (usgaap.CashAndCashEquivalentsAtCarryingValue) {
      keyMetrics.cash = getLatestFactValue(usgaap.CashAndCashEquivalentsAtCarryingValue);
    }
  } catch (error) {
    console.error('Error extracting financial facts:', error);
  }
  
  return keyMetrics;
}

/**
 * Gets the latest fact value from SEC XBRL data
 * @param {Object} fact - XBRL fact object
 * @returns {Object|null} Latest fact value with metadata
 */
export function getLatestFactValue(fact) {
  try {
    const units = Object.values(fact.units);
    if (units.length === 0) return null;
    
    const values = units[0].sort((a, b) => 
      b.end.localeCompare(a.end)
    );
    
    return values[0] ? {
      value: values[0].val,
      period: values[0].end,
      form: values[0].form
    } : null;
  } catch {
    return null;
  }
}
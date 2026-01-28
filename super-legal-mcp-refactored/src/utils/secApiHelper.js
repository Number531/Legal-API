/**
 * SEC EDGAR API Helper
 * Handles the complex URL structure of SEC EDGAR API endpoints
 * 
 * SEC API has inconsistent URL patterns:
 * - Company tickers: https://www.sec.gov/files/company_tickers.json
 * - Submissions: https://data.sec.gov/submissions/CIK{cik}.json (NO /api prefix)
 * - XBRL facts: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json (WITH /api prefix)
 * - XBRL frames: https://data.sec.gov/api/xbrl/frames/{taxonomy}/{concept}/{unit}/{period}.json
 */

/**
 * Makes SEC-specific API request with correct URL handling
 * @param {string} endpoint - The endpoint path
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Promise<Object>} Response data
 */
export async function makeSECApiRequest(endpoint, rateLimiter) {
  // Apply rate limiting if provided
  if (rateLimiter && typeof rateLimiter.enforce === 'function') {
    await rateLimiter.enforce();
  }

  let url;
  const headers = {
    'User-Agent': 'Enhanced-Legal-MCP/1.0.0 (contact@yourorg.com)',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate'
  };

  // Handle special SEC endpoints with different base URLs
  if (endpoint === '/company_tickers.json') {
    // Special case: company tickers is at www.sec.gov/files
    url = 'https://www.sec.gov/files/company_tickers.json';
  } else if (endpoint.startsWith('/submissions/')) {
    // Submissions don't use /api prefix
    url = `https://data.sec.gov${endpoint}`;
  } else if (endpoint.startsWith('/api/xbrl/')) {
    // XBRL endpoints use the full path with /api
    url = `https://data.sec.gov${endpoint}`;
  } else if (endpoint.startsWith('/xbrl/')) {
    // Some XBRL endpoints might not have /api prefix, add it
    url = `https://data.sec.gov/api${endpoint}`;
  } else {
    // Default: assume it needs /api prefix
    url = `https://data.sec.gov/api${endpoint}`;
  }

  console.error(`[SEC API] Request URL: ${url}`);
  console.error(`[SEC API] Headers:`, JSON.stringify(headers));
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    // Get response body for debugging
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = 'Could not read response body';
    }
    
    console.error(`[SEC API] Error ${response.status} ${response.statusText}`);
    console.error(`[SEC API] URL: ${url}`);
    console.error(`[SEC API] Response body: ${responseBody.substring(0, 500)}`);
    
    // Provide more helpful error messages
    if (response.status === 404) {
      throw new Error(`SEC API endpoint not found (404): ${url}. The SEC API may have changed or the endpoint format is incorrect.`);
    } else if (response.status === 403) {
      throw new Error(`SEC API access denied (403): Please ensure User-Agent header includes contact information.`);
    } else {
      throw new Error(`SEC API request failed: ${response.status} ${response.statusText} for URL: ${url}`);
    }
  }

  return await response.json();
}

export { makeSECApiRequest as default };
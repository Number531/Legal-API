/**
 * API Configuration for Enhanced Legal MCP Server
 * Contains base URLs, headers, rate limits, and other API-specific settings
 */

export const apiConfigs = {
  courtlistener: {
    baseUrl: "https://www.courtlistener.com/api/rest/v4",
    requiresAuth: true,
    rateLimits: { maxPerSecond: 10 }, // Conservative limit
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-CourtListener-MCP/2.0.0'
    }
  },

  sec_edgar: {
    baseUrl: "https://data.sec.gov",  // Note: Different endpoints use different paths
    requiresAuth: false,
    rateLimits: { maxPerSecond: 9 }, // Conservative under 10/sec limit
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Enhanced-Legal-MCP/1.0.0; +https://github.com/enhanced-legal-mcp)',
      'Accept': 'application/json'
    }
  },
  
  federal_register: {
    baseUrl: "https://www.federalregister.gov/api/v1",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 }, // Conservative
    headers: {
      'User-Agent': 'Enhanced-Legal-MCP/1.0.0',
      'Accept': 'application/json'
    }
  },

  // FTC aggregations are sourced via Federal Register; no separate base URL needed
  // ftc: { baseUrl: "https://api.ftc.gov/v0", ... } // Not used; no reliable public v0 API found
  
  uspto_patents: {
    baseUrl: "https://search.patentsview.org/api/v1",
    requiresAuth: true,
    rateLimits: { maxPerMinute: 45 }, // Official limit is 45/min
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // PTAB (Patent Trial and Appeal Board) API v3
  ptab: {
    baseUrl: "https://developer.uspto.gov/ptab-api",  // Correct URL from OpenAPI spec
    requiresAuth: false,  // No authentication required (confirmed via testing)
    // Conservative limit; adjust if official guidance differs
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      // No API key needed
    }
  },
  
  govinfo: {
    baseUrl: "https://api.govinfo.gov",
    requiresAuth: true,
    rateLimits: { maxPerSecond: 10 }, // Conservative under actual limit
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Super-Legal-MCP/1.0.0 (contact@example.com)'
    }
  },
  
  exa: {
    baseUrl: "https://api.exa.ai",
    requiresAuth: true,
    rateLimits: { maxPerSecond: 5 }, // Conservative limit
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // EPA ECHO APIs
  epa_echo: {
    baseUrl: "https://echodata.epa.gov/echo",
    requiresAuth: false,
    rateLimits: { maxPerMinute: 100 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },

  // FDA openFDA APIs
  fda_openfda: {
    baseUrl: "https://api.fda.gov",
    requiresAuth: false, // API key optional via api.data.gov for higher limits
    rateLimits: { maxPerMinute: 200 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },

  // CPSC Recalls API (saferproducts.gov)
  cpsc_recalls: {
    baseUrl: "https://www.saferproducts.gov/RestWebServices",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },

  // NHTSA APIs
  nhtsa_vpic: {
    baseUrl: "https://vpic.nhtsa.dot.gov/api",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },
  nhtsa_recalls: {
    baseUrl: "https://api.nhtsa.gov/recalls",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },
  nhtsa_complaints: {
    baseUrl: "https://api.nhtsa.gov/complaints",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  },
  nhtsa_safety_ratings: {
    baseUrl: "https://api.nhtsa.gov/SafetyRatings",
    requiresAuth: false,
    rateLimits: { maxPerSecond: 5 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
    }
  }
};

// Default cache TTL (15 minutes)
export const DEFAULT_CACHE_TTL = 15 * 60 * 1000;

// Validation regex patterns
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const COURT_ID_REGEX = /^[a-z0-9]+$/;

// Rate limiter configurations
export const rateLimiterConfigs = {
  sec_edgar: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      
      // Remove requests older than 1 second
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      
      if (this.requests.length >= 9) {
        const waitTime = 1000 - (now - this.requests[0]) + 10; // Small buffer
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.requests.push(now);
    }
  },

  federal_register: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.requests.push(now);
    }
  },

  uspto_patents: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      
      while (this.requests.length > 0 && now - this.requests[0] >= 60000) {
        this.requests.shift();
      }
      
      if (this.requests.length >= 40) {
        const waitTime = 60000 - (now - this.requests[0]) + 100;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.requests.push(now);
    }
  },

  govinfo: {
    requests: [],
    maxRequests: 9, // Conservative: 90% of 10/sec
    windowMs: 1000,
    enforce: async function() {
      const now = Date.now();
      this.requests = this.requests.filter(time => now - time < this.windowMs);
      
      if (this.requests.length >= this.maxRequests) {
        const oldestRequest = this.requests[0];
        const waitTime = this.windowMs - (now - oldestRequest);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      this.requests.push(now);
    }
  },

  exa: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      
      // Remove requests older than 1 second
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      
      // If we've made 5 requests in the last second, wait
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10; // Small buffer
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.requests.push(now);
    }
  },

  // EPA ECHO conservative limiter
  epa_echo: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 60000) {
        this.requests.shift();
      }
      if (this.requests.length >= 90) {
        const waitTime = 60000 - (now - this.requests[0]) + 50;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },

  // PTAB API conservative limiter
  ptab: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      // Keep only requests within the last 1 second
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }

      // Limit to 5 requests per second by default
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10; // small buffer
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.requests.push(now);
    }
  },

  // openFDA conservative limiter
  fda_openfda: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 60000) {
        this.requests.shift();
      }
      if (this.requests.length >= 180) {
        const waitTime = 60000 - (now - this.requests[0]) + 50;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },

  // CPSC conservative limiter
  cpsc_recalls: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },

  nhtsa_vpic: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },
  nhtsa_recalls: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },
  nhtsa_complaints: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  },
  nhtsa_safety_ratings: {
    requests: [],
    enforce: async function() {
      const now = Date.now();
      while (this.requests.length > 0 && now - this.requests[0] >= 1000) {
        this.requests.shift();
      }
      if (this.requests.length >= 5) {
        const waitTime = 1000 - (now - this.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requests.push(now);
    }
  }
};
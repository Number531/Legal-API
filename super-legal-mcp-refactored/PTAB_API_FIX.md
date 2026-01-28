# PTAB API 404 Error Fix

## Problem Diagnosis
The PTAB module is returning 404 errors because the base URL and/or endpoints are incorrect.

## Current Configuration (BROKEN)
```javascript
baseUrl: "https://developer.uspto.gov/ptab-api/v2"
endpoints: 
  - /proceedings/search
  - /decisions
```

## Correct Configuration Options

### Option 1: PTAB API v2 (Verified to Exist)
Based on USPTO documentation, the PTAB API v2 exists but may be at:
- `https://developer.uspto.gov/api/ptab/v2`
- `https://data.uspto.gov/ptab-api/v2`
- `https://developer.uspto.gov/ptab-web/api/v2`

### Option 2: PTAB E2E Search (Alternative)
The PTAB E2E system that the API synchronizes with may have different endpoints:
- Base: `https://developer.uspto.gov/ptab-web/`
- Search endpoint may be different

## Immediate Fix Needed

### Step 1: Update apiConfig.js
```javascript
// Try this first:
ptab: {
  baseUrl: "https://developer.uspto.gov/api/ptab/v2", // Changed path structure
  requiresAuth: true,
  rateLimits: { maxPerSecond: 5 },
  headers: {
    'Accept': 'application/json',
    'X-Api-Key': process.env.USPTO_API_KEY || ''
  }
}
```

### Step 2: If Still 404, Try Alternative Base URLs
```javascript
// Alternative 1:
baseUrl: "https://data.uspto.gov/ptab-api/v2"

// Alternative 2:
baseUrl: "https://developer.uspto.gov/ptab-web/api/v2"
```

### Step 3: Verify Endpoints
The actual endpoints might be:
- `/search` instead of `/proceedings/search`
- `/documents` instead of `/decisions`
- `/trials` for proceedings

## Testing Script
```javascript
// Quick test to find the right URL
const testUrls = [
  'https://developer.uspto.gov/api/ptab/v2/search',
  'https://developer.uspto.gov/ptab-api/v2/search',
  'https://developer.uspto.gov/ptab-web/api/v2/search',
  'https://data.uspto.gov/ptab-api/v2/search'
];

for (const url of testUrls) {
  try {
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': process.env.USPTO_API_KEY,
        'Accept': 'application/json'
      }
    });
    console.log(`${url}: ${response.status}`);
  } catch (error) {
    console.log(`${url}: Failed - ${error.message}`);
  }
}
```

## Root Cause
The PTAB API v2 exists (confirmed by USPTO documentation) but:
1. The base URL structure in our config is incorrect
2. The endpoint paths may be different than documented
3. The API may have moved during the 2025 transition to the new Open Data Portal

## Recommended Actions
1. **Immediate**: Update the base URL to `https://developer.uspto.gov/api/ptab/v2`
2. **Test**: Use the testing script above to find the correct URL
3. **Fallback**: If PTAB API is truly broken, we can:
   - Use PTAB E2E web scraping
   - Access PTAB data through PatentsView if available
   - Remove PTAB temporarily until API is fixed

## Note on 2025 Transition
USPTO is migrating to a new Open Data Portal throughout 2025. Both old and new systems are running in parallel, which may cause confusion about the correct endpoints.
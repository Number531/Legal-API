# PTAB Web Search Module Design
## For IPR/PGR/CBM Proceedings

## Overview
Since the PTAB API doesn't include IPR/PGR/CBM proceedings despite them being publicly available on USPTO websites, we can create a web search module similar to the Exa integration to access this data.

## Architecture

### 1. New Client: `PTABWebSearchClient.js`
```javascript
/**
 * PTAB Web Search Client
 * Searches public USPTO websites for IPR/PGR/CBM proceedings
 * that are missing from the PTAB API
 */
export class PTABWebSearchClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.searchEngineChoice = process.env.SEARCH_ENGINE || 'exa'; // or 'brave'
  }

  async searchIPRProceedings(args) {
    // Search for IPR proceedings using web search
  }

  async searchPGRProceedings(args) {
    // Search for PGR proceedings
  }

  async searchCBMProceedings(args) {
    // Search for CBM proceedings
  }

  async getSpecificProceeding(proceedingNumber) {
    // Get details for a specific IPR/PGR/CBM
  }
}
```

### 2. Search Strategy

#### Option A: Use Exa API (Recommended)
```javascript
async searchIPRProceedings(args) {
  const { 
    proceeding_number,
    patent_number,
    petitioner,
    patent_owner,
    date_range,
    limit = 10
  } = args;

  // Build sophisticated Exa query
  let query = 'site:uspto.gov ';
  
  if (proceeding_number) {
    query += `"${proceeding_number}" `;
  } else {
    query += '("IPR2023" OR "IPR2024" OR "IPR2025") ';
  }
  
  if (patent_number) {
    query += `"Patent ${patent_number}" OR "U.S. Patent No. ${patent_number}" `;
  }
  
  if (petitioner) {
    query += `"${petitioner}" petitioner `;
  }
  
  if (patent_owner) {
    query += `"${patent_owner}" "patent owner" `;
  }

  // Use Exa's neural search capabilities
  const exaParams = {
    query,
    num_results: limit,
    use_autoprompt: true,
    type: 'neural', // Better for finding specific proceedings
    include_domains: ['uspto.gov', 'ptacts.uspto.gov'],
    start_published_date: date_range?.start,
    end_published_date: date_range?.end
  };

  const response = await this.exaClient.search(exaParams);
  
  // Parse and structure results
  return this.parseIPRResults(response);
}
```

#### Option B: Use Brave Search API
```javascript
async searchWithBrave(query, limit) {
  const braveUrl = 'https://api.search.brave.com/res/v1/web/search';
  
  const params = new URLSearchParams({
    q: query,
    count: limit,
    search_lang: 'en',
    country: 'US'
  });

  const response = await fetch(`${braveUrl}?${params}`, {
    headers: {
      'X-Subscription-Token': process.env.BRAVE_API_KEY
    }
  });

  return response.json();
}
```

### 3. Result Enhancement

```javascript
async enhanceWithWebContent(searchResults) {
  // For each result, fetch the page content
  const enhanced = [];
  
  for (const result of searchResults) {
    try {
      // Extract key information from the page
      const pageData = await this.fetchPageContent(result.url);
      
      enhanced.push({
        proceeding_number: this.extractProceedingNumber(pageData),
        patent_number: this.extractPatentNumber(pageData),
        petitioner: this.extractPetitioner(pageData),
        patent_owner: this.extractPatentOwner(pageData),
        filing_date: this.extractFilingDate(pageData),
        decision_date: this.extractDecisionDate(pageData),
        status: this.extractStatus(pageData),
        source_url: result.url,
        title: result.title,
        snippet: result.snippet
      });
    } catch (error) {
      console.error(`Failed to enhance result: ${error.message}`);
    }
  }
  
  return enhanced;
}
```

### 4. Information Extraction Patterns

```javascript
const EXTRACTION_PATTERNS = {
  proceeding_number: /\b(IPR|PGR|CBM|DER)\d{4}-\d{5}\b/gi,
  patent_number: /(?:Patent No\.|U\.S\. Patent No\.|Patent)\s*([0-9,]+)/gi,
  filing_date: /(?:Filed|Filing Date)[:\s]+([A-Z][a-z]+ \d{1,2}, \d{4})/i,
  petitioner: /Petitioner[:\s]+([^v\n]+?)(?:\s+v\.|\n)/i,
  patent_owner: /Patent Owner[:\s]+([^\n]+)/i,
  final_decision: /(?:Final Written Decision|Decision)[:\s]+([^\n]+)/i
};

extractProceedingNumber(html) {
  const match = html.match(EXTRACTION_PATTERNS.proceeding_number);
  return match ? match[0] : null;
}
```

### 5. Integration with Existing System

```javascript
// In toolImplementations.js, add:

async function search_ptab_web(args) {
  const client = new PTABWebSearchClient(rateLimiterConfigs.exa);
  
  const { proceeding_type = 'IPR', ...searchArgs } = args;
  
  switch(proceeding_type.toUpperCase()) {
    case 'IPR':
      return await client.searchIPRProceedings(searchArgs);
    case 'PGR':
      return await client.searchPGRProceedings(searchArgs);
    case 'CBM':
      return await client.searchCBMProceedings(searchArgs);
    default:
      return await client.searchAllProceedingTypes(searchArgs);
  }
}
```

### 6. Tool Definition

```javascript
// In toolDefinitions.js, add:

{
  name: "search_ptab_ipr_pgr_cbm",
  description: "Search for PTAB IPR, PGR, and CBM proceedings via web search (not available in API)",
  inputSchema: {
    type: "object",
    properties: {
      proceeding_type: {
        type: "string",
        enum: ["IPR", "PGR", "CBM", "all"],
        description: "Type of PTAB proceeding"
      },
      proceeding_number: {
        type: "string",
        description: "Specific proceeding number (e.g., IPR2023-01055)"
      },
      patent_number: {
        type: "string",
        description: "Patent number involved in proceeding"
      },
      petitioner: {
        type: "string",
        description: "Name of petitioner"
      },
      patent_owner: {
        type: "string",
        description: "Name of patent owner"
      },
      year: {
        type: "string",
        description: "Year of proceeding (e.g., 2023, 2024)"
      },
      limit: {
        type: "integer",
        description: "Maximum results to return",
        default: 10
      }
    }
  }
}
```

## Implementation Benefits

1. **Immediate Access**: Get IPR/PGR/CBM data now, without waiting for API fixes
2. **Rich Context**: Web search provides full context from USPTO pages
3. **Flexible Queries**: Natural language and complex search capabilities
4. **Cross-Reference**: Can find related documents, news, and analysis
5. **No Authentication**: Works with existing Exa/Brave API keys

## Potential Challenges

1. **Rate Limits**: Must respect search API limits
2. **Data Structure**: Less structured than API responses
3. **Parsing Complexity**: HTML extraction requires robust patterns
4. **Cost**: Search APIs have usage costs
5. **Reliability**: Web structure changes could break extraction

## Testing Strategy

```javascript
// Test known IPR cases
const testCases = [
  'IPR2023-01055', // Tesla v. Autonomous Devices
  'IPR2024-00954', // Cisco v. Portsmouth Network
  'PGR2023-00039', // Crusoe Energy v. Upstream Data
];

for (const caseNum of testCases) {
  const result = await client.getSpecificProceeding(caseNum);
  console.log(`Found: ${result.proceeding_number} - ${result.status}`);
}
```

## Recommendation

✅ **YES, build this module!** It would:
1. Fill the critical gap in IPR/PGR/CBM data
2. Provide immediate value to users
3. Use existing infrastructure (Exa/Brave APIs)
4. Be relatively quick to implement
5. Serve as a backup even if the PTAB API is eventually fixed

The Exa API is particularly well-suited for this because:
- Neural search understands legal proceeding context
- Can search specific domains (uspto.gov)
- Returns structured data with snippets
- Has good rate limits for this use case

Would you like me to implement this module?
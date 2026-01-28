# WebSearch Client Conversion Patterns - Implementation Guide

## Overview
This document provides the definitive patterns and templates for converting native API clients to Exa-powered WebSearch implementations, based on analysis of successful migrations.

## Core Architecture Pattern

### 1. Class Structure

All successful WebSearch clients follow this structure:

```javascript
export class [Domain]WebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    this.rateLimiter = rateLimiter;
    this.exaApiKey = exaApiKey;
    
    if (!this.exaApiKey) {
      console.warn('EXA_API_KEY not configured. [Domain] web search will not be available.');
    }
    
    // Domain-specific configuration
    this.[domainData] = {
      // Static lookup data, domains, etc.
    };
  }
}
```

### 2. Method Signature Pattern

Primary search methods follow this pattern:

```javascript
async search[ContentType]Web(args) {
  // 1. Validate args object
  if (!args || typeof args !== 'object') {
    args = {};
  }
  
  // 2. Destructure with defaults
  const {
    required_param,  // No default
    optional_param = 'default_value',
    limit = 10,
    include_text = false,
    include_snippet = false
  } = args;
  
  // 3. Validate required parameters
  if (!required_param || typeof required_param !== 'string') {
    throw new Error('[Param] is required for [operation]');
  }
  
  // 4. Validate optional parameters
  if (date_param) validateDate(date_param, 'date_param');
  const validatedLimit = validateLimit(limit, 20);
  
  // 5. Build query
  const query = this.build[Domain]Query(args);
  
  // 6. Execute search
  const results = await this.executeExaSearch(
    query, 
    validatedLimit, 
    include_snippet || include_text
  );
  
  // 7. Filter and map results
  const filtered = results
    .filter(r => this.isValid[Domain]Result(r))
    .map(r => this.map[Domain]Result(r, include_text, include_snippet));
  
  // 8. Return standardized response
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        search_type: '[domain]_[content]_web',
        query: query,
        total_results: filtered.length,
        results: filtered
      }, null, 2)
    }]
  };
}
```

## Proven Implementation Patterns

### Pattern 1: Query Building with Site Restriction

```javascript
build[Domain]Query(args) {
  const { primary_param, filter1, filter2 } = args;
  
  // Start with site restriction
  let query = 'site:domain.gov ';
  
  // Add primary search term
  if (primary_param) {
    query += `"${primary_param}" `;
  }
  
  // Add filters as exact phrases
  if (filter1) {
    query += `"${filter1}" `;
  }
  
  // Add biasing terms for better results
  query += '(keyword1 OR keyword2) ';
  
  return query.trim();
}
```

**Examples from successful implementations:**
- SEC: `'site:sec.gov/Archives "${company}" "Form ${type}"'`
- CourtListener: `'site:courtlistener.com/opinion ${query} "${case_name}"'`
- State Statutes: `'site:${domain} "${statute}" "${chapter}"'`

### Pattern 2: executeExaSearch Method

All clients share this common pattern:

```javascript
async executeExaSearch(query, limit, includeContents = false) {
  await this.rateLimiter.acquire();
  
  const requestBody = {
    query: query,
    numResults: Math.min(limit, 20),
    includeContent: includeContents,
    useAutoprompt: false,
    type: 'keyword'
  };
  
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': this.exaApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Exa API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.results || [];
}
```

### Pattern 3: Smart Snippet Extraction

```javascript
extractSmartSnippet(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return '';
  
  // Clean the text
  let cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Domain-specific patterns (ordered by priority)
  const meaningfulSections = [
    // Executive summaries and overviews
    /executive\s+summary[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /overview[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    
    // Key business sections
    /business\s+description[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /principal\s+products[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    
    // Legal/regulatory content
    /background[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /purpose[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    
    // Financial highlights
    /financial\s+highlights[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is,
    /selected\s+financial\s+data[:\s]*(.*?)(?=\n\s*[A-Z][^a-z]*:|$)/is
  ];
  
  // Try to extract from meaningful sections
  for (const pattern of meaningfulSections) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const snippet = match[1].trim();
      if (snippet.length >= 50) {
        return snippet.length > maxLength 
          ? snippet.substring(0, maxLength - 3) + '...'
          : snippet;
      }
    }
  }
  
  // Skip common boilerplate patterns
  const skipPatterns = [
    /^table\s+of\s+contents/i,
    /^page\s+\d+/i,
    /^exhibit\s+/i,
    /^item\s+\d+\./i,
    /^\s*\d+\s*$/
  ];
  
  // Find first meaningful paragraph
  const paragraphs = cleaned.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    
    // Skip if matches boilerplate
    if (skipPatterns.some(p => p.test(trimmed))) continue;
    
    // Skip if too short
    if (trimmed.length < 50) continue;
    
    // Good paragraph found
    return trimmed.length > maxLength
      ? trimmed.substring(0, maxLength - 3) + '...'
      : trimmed;
  }
  
  // Fallback to beginning
  return cleaned.length > maxLength
    ? cleaned.substring(0, maxLength - 3) + '...'
    : cleaned;
}
```

### Pattern 4: Result Mapping

```javascript
map[Domain]Result(result, includeText = false, includeSnippet = false) {
  // Extract basic metadata
  const mapped = {
    title: result.title || 'Untitled',
    url: result.url || null,
    published_date: result.publishedDate || null,
    // Domain-specific fields
    [domain_field]: this.extract[DomainField](result)
  };
  
  // Conditionally add snippet
  if (includeSnippet && result.text) {
    mapped.snippet = this.extractSmartSnippet(result.text);
  }
  
  // Conditionally add full text
  if (includeText && result.text) {
    mapped.full_text = result.text;
  }
  
  return mapped;
}
```

## Domain-Specific Patterns

### Government Agencies (FederalRegister, FTC, FDA)

```javascript
// Common government document patterns
const govPatterns = {
  docketNumber: /Docket\s+No\.\s*([\w-]+)/i,
  frNumber: /FR\s+Doc\.\s*([\d-]+)/i,
  agency: /AGENCY:\s*([^\n]+)/i,
  action: /ACTION:\s*([^\n]+)/i,
  summary: /SUMMARY:\s*([^\n]+)/i,
  effectiveDate: /DATES?:\s*([^\n]+)/i
};

// Extract from text
extractGovMetadata(text) {
  const metadata = {};
  for (const [key, pattern] of Object.entries(govPatterns)) {
    const match = text.match(pattern);
    if (match) metadata[key] = match[1].trim();
  }
  return metadata;
}
```

### Legal Documents (CourtListener, State Courts)

```javascript
// Legal document patterns
const legalPatterns = {
  caseNumber: /No\.\s*([\d-]+)/i,
  court: /([A-Z][a-z]+\s+Court)/,
  judge: /Judge\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  parties: /^([^v]+)\s+v\.\s+(.+)$/i
};

// Parse case caption
parseCaseCaption(title) {
  const match = title.match(legalPatterns.parties);
  if (match) {
    return {
      plaintiff: match[1].trim(),
      defendant: match[2].trim()
    };
  }
  return null;
}
```

### Financial Documents (SEC)

```javascript
// Financial document patterns
const financialPatterns = {
  form: /Form\s+([\w-]+)/i,
  cik: /CIK[:\s]*([\d]+)/i,
  accession: /Accession\s+Number[:\s]*([\d-]+)/i,
  period: /Period\s+of\s+Report[:\s]*([^\n]+)/i
};

// Extract filing metadata
extractFilingMetadata(text, url) {
  const metadata = {};
  
  // Try URL parsing first (more reliable)
  const urlMatch = url.match(/\/(\d{10})(\d{10})/);
  if (urlMatch) {
    metadata.cik = urlMatch[1];
    metadata.accessionNumber = `${urlMatch[1]}-${urlMatch[2].substring(0,2)}-${urlMatch[2].substring(2)}`;
  }
  
  // Fallback to text extraction
  for (const [key, pattern] of Object.entries(financialPatterns)) {
    if (!metadata[key]) {
      const match = text.match(pattern);
      if (match) metadata[key] = match[1].trim();
    }
  }
  
  return metadata;
}
```

## Conversion Steps for Each Client Type

### FederalRegisterWebSearchClient

1. **Domain Configuration**:
   ```javascript
   this.documentTypes = ['rule', 'proposed_rule', 'notice', 'presidential_document'];
   this.baseDomain = 'federalregister.gov';
   ```

2. **Query Building**:
   ```javascript
   let query = 'site:federalregister.gov/documents ';
   if (agency) query += `"${agency}" `;
   if (document_type) query += `"${document_type.replace('_', ' ')}" `;
   if (search_term) query += `${search_term} `;
   query += '(CFR OR "Federal Register")';
   ```

3. **Snippet Patterns**:
   - SUMMARY sections
   - SUPPLEMENTARY INFORMATION
   - Background paragraphs
   - Purpose statements

### FTCWebSearchClient

1. **Domain Configuration**:
   ```javascript
   this.enforcementTypes = ['consent_order', 'complaint', 'settlement', 'opinion'];
   this.baseDomain = 'ftc.gov';
   ```

2. **Query Building**:
   ```javascript
   let query = 'site:ftc.gov ';
   if (case_type) query += `"${case_type}" `;
   if (company_name) query += `"${company_name}" `;
   query += '(enforcement OR complaint OR settlement)';
   ```

3. **Snippet Patterns**:
   - Case summaries
   - Violation descriptions
   - Relief/remedy sections
   - Commission statements

### FDAWebSearchClient

1. **Domain Configuration**:
   ```javascript
   this.contentTypes = ['recall', 'warning_letter', 'approval', 'safety_communication'];
   this.baseDomains = ['fda.gov', 'accessdata.fda.gov'];
   ```

2. **Query Building**:
   ```javascript
   let query = '(site:fda.gov OR site:accessdata.fda.gov) ';
   if (product_name) query += `"${product_name}" `;
   if (manufacturer) query += `"${manufacturer}" `;
   if (content_type === 'recall') query += 'recall "Class I" OR "Class II" OR "Class III"';
   ```

3. **Snippet Patterns**:
   - Product descriptions
   - Risk statements
   - Recommended actions
   - Distribution information

### NHTSAWebSearchClient

1. **Domain Configuration**:
   ```javascript
   this.contentTypes = ['recall', 'investigation', 'complaint', 'rating'];
   this.baseDomain = 'nhtsa.gov';
   ```

2. **Query Building**:
   ```javascript
   let query = 'site:nhtsa.gov ';
   if (make) query += `"${make}" `;
   if (model) query += `"${model}" `;
   if (year) query += `"${year}" `;
   if (content_type === 'recall') query += 'recall campaign';
   ```

3. **Snippet Patterns**:
   - Defect descriptions
   - Affected vehicles
   - Remedy descriptions
   - Safety risk assessments

## Testing Strategy

### Unit Test Structure

```javascript
describe('[Domain]WebSearchClient', () => {
  let client;
  let mockRateLimiter;
  
  beforeEach(() => {
    mockRateLimiter = { acquire: async () => {} };
    client = new [Domain]WebSearchClient(mockRateLimiter, 'test-key');
  });
  
  describe('search[Content]Web', () => {
    it('should validate required parameters', async () => {
      await expect(client.searchMethod({}))
        .rejects.toThrow('[param] is required');
    });
    
    it('should build correct query', () => {
      const query = client.buildQuery({
        param1: 'value1',
        param2: 'value2'
      });
      expect(query).toContain('site:domain.gov');
      expect(query).toContain('"value1"');
    });
    
    it('should extract smart snippets', () => {
      const text = 'SUMMARY: This is a test summary...';
      const snippet = client.extractSmartSnippet(text);
      expect(snippet).toContain('test summary');
      expect(snippet.length).toBeLessThanOrEqual(500);
    });
  });
});
```

### Integration Test Pattern

```javascript
async function testLiveSearch() {
  const client = new [Domain]WebSearchClient(rateLimiter);
  
  // Test basic search
  const basic = await client.searchMethod({
    query: 'test query',
    limit: 3
  });
  assert(basic.content[0].text, 'No response');
  
  // Test with snippets
  const withSnippets = await client.searchMethod({
    query: 'test query',
    limit: 3,
    include_snippet: true
  });
  const parsed = JSON.parse(withSnippets.content[0].text);
  assert(parsed.results[0].snippet, 'No snippet generated');
  
  // Test with full text
  const withText = await client.searchMethod({
    query: 'test query',
    limit: 2,
    include_text: true
  });
  const parsedText = JSON.parse(withText.content[0].text);
  assert(parsedText.results[0].full_text, 'No full text');
  
  console.log('✅ All integration tests passed');
}
```

## Migration Validation Checklist

### Code Quality
- [ ] Follows established class structure pattern
- [ ] Uses consistent parameter names (include_snippet, include_text)
- [ ] Implements extractSmartSnippet with domain-specific patterns
- [ ] Includes comprehensive input validation
- [ ] Has helpful error messages

### Functionality
- [ ] Basic search works without text/snippets
- [ ] Snippet extraction produces meaningful content
- [ ] Full text retrieval works when requested
- [ ] Site restriction correctly limits results
- [ ] Date filtering works (if applicable)
- [ ] Result limit is respected

### Testing
- [ ] Mock tests cover all methods
- [ ] Live tests validate actual Exa integration
- [ ] Error scenarios are tested
- [ ] Rate limiting is tested
- [ ] Snippet quality is validated

### Documentation
- [ ] Tool definition includes all parameters
- [ ] Parameter descriptions are clear
- [ ] Examples are provided
- [ ] Limitations are documented

## Performance Optimization

### Query Optimization
1. Use exact phrases with quotes for better precision
2. Add biasing terms relevant to domain
3. Limit site scope as narrowly as possible
4. Order terms by importance (Exa weights earlier terms)

### Response Optimization
1. Request text only when needed (include_snippet or include_text)
2. Limit default results to reasonable number (5-10)
3. Filter results client-side after fetch
4. Cache results when appropriate

### Rate Limiting
1. Use shared Exa rate limiter across all WebSearch clients
2. Implement exponential backoff for failures
3. Set conservative limits (5 requests/second)

## Data Quality Assurance Patterns

### Ensuring Required Fields Are Never Null

```javascript
/**
 * Pattern from PTABWebSearchClient - ensures critical fields always have values
 */
ensureValidProceedingNumber(num, result) {
  if (num && num !== 'null' && num !== null) return num;
  
  // Try URL extraction as fallback
  if (result.url) {
    const urlMatch = result.url.match(/(IPR|PGR|CBM|DER)\d{4}-\d{5}/i);
    if (urlMatch) return urlMatch[0].toUpperCase();
  }
  
  // Try text extraction as secondary fallback
  if (result.text) {
    const textMatch = result.text.match(/(IPR|PGR|CBM|DER)\d{4}-\d{5}/i);
    if (textMatch) return textMatch[0].toUpperCase();
  }
  
  // Generate descriptive placeholder
  return `TEMP_${Date.now()}`;
}

ensureValidStatus(status, text) {
  if (status && status !== 'Unknown' && status !== 'unknown' && status !== '') {
    return status;
  }
  
  // Intelligent status detection from text
  if (/final\s+written\s+decision/i.test(text)) return 'Final Written Decision';
  if (/institution\s+decision/i.test(text)) return 'Institution Decision';
  if (/instituted/i.test(text)) return 'Trial Instituted';
  if (/denied/i.test(text)) return 'Institution Denied';
  if (/settled/i.test(text)) return 'Settled';
  if (/terminated/i.test(text)) return 'Terminated';
  
  return 'Pending Review';
}

ensureValidParty(party, role) {
  if (party && party !== 'null' && party !== null && party.trim() !== '') {
    return party;
  }
  
  // Return descriptive placeholder based on role
  if (role === 'petitioner') {
    return 'Petitioner (See Document)';
  } else if (role === 'patent_owner') {
    return 'Patent Owner (See Document)';
  }
  
  return 'Party Not Identified';
}
```

### URL-Based Data Extraction

```javascript
/**
 * Extract metadata from URLs when text parsing fails
 */
extractFromUrl(url, patterns) {
  const results = {};
  
  // SEC filing pattern
  if (patterns.sec_filing) {
    const match = url.match(/\/(\d{10})(\d{10})/);
    if (match) {
      results.cik = match[1];
      results.accessionNumber = `${match[1]}-${match[2].substring(0,2)}-${match[2].substring(2)}`;
    }
  }
  
  // Court case pattern
  if (patterns.court_case) {
    const match = url.match(/\/opinion\/(\d+)/);
    if (match) {
      results.case_id = match[1];
    }
  }
  
  // Patent proceeding pattern
  if (patterns.patent) {
    const match = url.match(/(IPR|PGR|CBM)\d{4}-\d{5}/i);
    if (match) {
      results.proceeding_number = match[0].toUpperCase();
    }
  }
  
  return results;
}
```

## Advanced Domain Configuration

### Multi-Domain Targeting Strategy

```javascript
constructor(rateLimiter) {
  this.rateLimiter = rateLimiter;
  this.exaApiKey = process.env.EXA_API_KEY;
  
  // Complex domain configuration with metadata
  this.domainConfig = {
    'AL': { 
      name: 'Alabama', 
      domains: ['judicial.alabama.gov', 'acscourt.org'],
      courtTypes: ['supreme', 'appeals', 'circuit', 'district'],
      specialFeatures: ['electronic_filing', 'local_rules']
    },
    'CA': { 
      name: 'California', 
      domains: ['courts.ca.gov', 'smartrules.com', 'ceb.com'],
      courtTypes: ['supreme', 'appeals', 'superior'],
      specialFeatures: ['electronic_filing', 'local_rules', 'formatting_strict'],
      variations: {
        'los_angeles': ['lacourt.org'],
        'san_francisco': ['sfcourt.org']
      }
    }
  };
}

/**
 * Build query with multi-domain support
 */
buildMultiDomainQuery(args) {
  const { state, jurisdiction, query_term } = args;
  const config = this.domainConfig[state.toUpperCase()];
  
  if (!config) {
    throw new Error(`State ${state} not supported`);
  }
  
  // Build site restrictions
  let siteQuery = config.domains.map(d => `site:${d}`).join(' OR ');
  
  // Add jurisdiction-specific domains
  if (jurisdiction && config.variations && config.variations[jurisdiction]) {
    const extraDomains = config.variations[jurisdiction].map(d => `site:${d}`);
    siteQuery += ' OR ' + extraDomains.join(' OR ');
  }
  
  return `(${siteQuery}) ${query_term}`;
}
```

### State-Specific Feature Detection

```javascript
/**
 * Adapt behavior based on state-specific features
 */
adaptForStateFeatures(state, results) {
  const config = this.domainConfig[state];
  if (!config.specialFeatures) return results;
  
  return results.map(result => {
    // Add state-specific metadata
    if (config.specialFeatures.includes('electronic_filing')) {
      result.efiling_available = true;
    }
    
    if (config.specialFeatures.includes('formatting_strict')) {
      result.formatting_requirements = 'Strict compliance required';
    }
    
    if (config.specialFeatures.includes('new_rules_2025')) {
      result.rule_updates = 'Updated rules effective 2025';
    }
    
    return result;
  });
}
```

## Complex Data Extraction Methods

### Multi-Pattern Text Extraction

```javascript
/**
 * Pattern from EPAWebSearchClient - extract complex data from unstructured text
 */
extractFacilityHeader(text, includeFullText = false) {
  const patterns = {
    facility_name: /Facility Name:\s*([^\n]+)/i,
    company_name: /Company Name:\s*([^\n]+)/i,
    facility_id: /Registry ID:\s*(\d+)/i,
    address: /Address:\s*([^\n]+(?:\n[^:]+)*?)(?=\n[A-Z][a-z]+:|$)/i,
    coordinates: /Latitude:\s*([\d.-]+).*?Longitude:\s*([\d.-]+)/is
  };
  
  const extracted = {};
  
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      extracted[field] = match[1].trim();
    }
  }
  
  // Special handling for coordinates
  if (patterns.coordinates.test(text)) {
    const coordMatch = text.match(patterns.coordinates);
    if (coordMatch) {
      extracted.latitude = parseFloat(coordMatch[1]);
      extracted.longitude = parseFloat(coordMatch[2]);
    }
  }
  
  if (includeFullText) {
    extracted.full_text = text;
  }
  
  return extracted;
}

extractComplianceSummary(text) {
  const summaryPatterns = {
    current_status: /Current Status:\s*([^\n]+)/i,
    violations_3_years: /Violations Last 3 Years:\s*(\d+)/i,
    enforcement_actions: /Enforcement Actions:\s*(\d+)/i,
    inspection_date: /Last Inspection:\s*([^\n]+)/i
  };
  
  const summary = {};
  
  for (const [field, pattern] of Object.entries(summaryPatterns)) {
    const match = text.match(pattern);
    if (match) {
      summary[field] = field.includes('violations') || field.includes('enforcement') 
        ? parseInt(match[1]) 
        : match[1].trim();
    }
  }
  
  return summary;
}

extractThreeYearHistory(text) {
  // Extract quarterly compliance data
  const quarterPattern = /Q([1-4])\s+(\d{4})[:\s]*([^\n]+)/g;
  const quarters = [];
  let match;
  
  while ((match = quarterPattern.exec(text)) !== null) {
    quarters.push({
      quarter: `Q${match[1]}`,
      year: parseInt(match[2]),
      status: match[3].trim()
    });
  }
  
  return quarters.sort((a, b) => b.year - a.year || b.quarter.localeCompare(a.quarter));
}
```

## Response Compatibility Patterns

### Legacy API Response Mirroring

```javascript
/**
 * Maintain compatibility with existing API response formats
 */
formatAsLegacyResponse(webResults, originalFormat) {
  switch (originalFormat) {
    case 'sec_filings':
      return {
        company: this.extractCompanyInfo(webResults[0]),
        filings: webResults.map(r => ({
          accessionNumber: this.extractAccessionNumber(r),
          filingDate: this.extractFilingDate(r),
          form: this.extractFormType(r),
          primaryDocument: this.extractPrimaryDoc(r),
          reportDate: this.extractReportDate(r),
          edgar_url: r.url,
          // WebSearch enhancements
          ...(r.snippet && { snippet: r.snippet }),
          ...(r.full_text && { full_text: r.full_text })
        })),
        search_criteria: this.buildSearchCriteria(webResults)
      };
      
    case 'court_cases':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            search_type: 'courtlistener_opinions_web',
            total_results: webResults.length,
            results: webResults.map(r => ({
              case_name: r.title,
              court: this.extractCourt(r),
              date_filed: r.publishedDate,
              absolute_url: r.url,
              snippet: r.snippet,
              // Maintain nested structure
              cluster: {
                case_name: r.title,
                date_filed: r.publishedDate
              }
            }))
          }, null, 2)
        }]
      };
      
    case 'facilities':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            facilities: webResults.map(r => this.mapFacilityFromText(r)),
            total_facilities: webResults.length,
            query_id: null, // WebSearch doesn't use query IDs
            high_priority_violators: webResults.filter(r => 
              this.extractViolationStatus(r) === 'high_priority'
            ).length
          }, null, 2)
        }]
      };
  }
}
```

### Nested Data Structure Building

```javascript
/**
 * Build complex nested responses from flat web results
 */
buildComplexReport(results, options = {}) {
  const {
    include_violations = true,
    include_enforcement = true,
    include_history = true
  } = options;
  
  const report = {
    facility: this.extractFacilityHeader(results[0]?.text || ''),
    compliance_summary: this.extractComplianceSummary(results[0]?.text || ''),
  };
  
  if (include_history) {
    report.three_year_compliance = this.extractThreeYearHistory(results[0]?.text || '');
  }
  
  if (include_violations) {
    report.violations = results
      .flatMap(r => this.extractViolations(r.text || ''))
      .filter(Boolean);
  }
  
  if (include_enforcement) {
    report.enforcement_actions = results
      .flatMap(r => this.extractEnforcement(r.text || ''))
      .filter(Boolean);
  }
  
  return report;
}
```

## Error Recovery & Performance Patterns

### Graceful Degradation Strategy

```javascript
async searchWithFallback(primaryQuery, fallbackQueries = [], options = {}) {
  const { max_attempts = 3, timeout = 10000 } = options;
  
  // Try primary query first
  try {
    const results = await Promise.race([
      this.executeExaSearch(primaryQuery, options.limit, options.includeText),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Primary search timeout')), timeout)
      )
    ]);
    
    if (results.length > 0) return results;
  } catch (error) {
    console.warn(`Primary search failed: ${error.message}`);
  }
  
  // Try fallback queries
  for (const [index, fallbackQuery] of fallbackQueries.entries()) {
    try {
      const results = await this.executeExaSearch(
        fallbackQuery, 
        options.limit, 
        options.includeText
      );
      
      if (results.length > 0) {
        console.info(`Fallback query ${index + 1} succeeded`);
        return results;
      }
    } catch (error) {
      console.warn(`Fallback query ${index + 1} failed: ${error.message}`);
    }
  }
  
  // Return empty results if all attempts fail
  return [];
}

/**
 * Partial result handling
 */
handlePartialResults(results, expectedFields) {
  return results.map(result => {
    const mapped = {};
    
    // Ensure all expected fields exist
    expectedFields.forEach(field => {
      if (result[field] !== undefined) {
        mapped[field] = result[field];
      } else {
        mapped[field] = this.getDefaultValueForField(field);
      }
    });
    
    // Add data quality indicators
    mapped._data_quality = {
      completeness: this.calculateCompleteness(result, expectedFields),
      confidence: this.calculateConfidence(result),
      source: 'web_search'
    };
    
    return mapped;
  });
}

getDefaultValueForField(field) {
  const defaults = {
    'title': 'Untitled Document',
    'date': null,
    'url': null,
    'status': 'Unknown',
    'id': `TEMP_${Date.now()}`
  };
  
  return defaults[field] || null;
}
```

### Performance Monitoring

```javascript
class PerformanceTracker {
  constructor() {
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      averageResponseTime: 0
    };
  }
  
  async trackRequest(requestFn, metadata = {}) {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      const result = await requestFn();
      this.metrics.successes++;
      
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.averageResponseTime = 
        this.metrics.totalResponseTime / this.metrics.requests;
      
      // Log slow requests
      if (responseTime > 5000) {
        console.warn(`Slow request detected: ${responseTime}ms`, metadata);
      }
      
      return result;
    } catch (error) {
      this.metrics.failures++;
      
      // Log error patterns
      console.error('Request failed:', {
        error: error.message,
        metadata,
        responseTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successes / this.metrics.requests,
      failureRate: this.metrics.failures / this.metrics.requests
    };
  }
}

// Usage in WebSearch clients
constructor(rateLimiter) {
  this.rateLimiter = rateLimiter;
  this.exaApiKey = process.env.EXA_API_KEY;
  this.performanceTracker = new PerformanceTracker();
}

async executeExaSearch(query, limit, includeContents) {
  return this.performanceTracker.trackRequest(
    async () => {
      await this.rateLimiter.acquire();
      
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.exaApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          numResults: limit,
          includeContent: includeContents
        })
      });
      
      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    },
    { query, limit, includeContents }
  );
}
```

## Common Pitfalls to Avoid

1. **Don't forget conditional text inclusion**:
   ```javascript
   // WRONG
   const results = await this.executeExaSearch(query, limit, true);
   
   // RIGHT
   const results = await this.executeExaSearch(query, limit, include_snippet || include_text);
   ```

2. **Don't skip result validation**:
   ```javascript
   // WRONG
   const filtered = results.map(r => this.mapResult(r));
   
   // RIGHT
   const filtered = results
     .filter(r => (r.url || '').includes('expected-domain'))
     .map(r => this.mapResult(r));
   ```

3. **Don't forget to pass through text fields**:
   ```javascript
   // WRONG
   return { title: result.title, url: result.url };
   
   // RIGHT
   const mapped = { title: result.title, url: result.url };
   if (includeSnippet && result.text) mapped.snippet = this.extractSmartSnippet(result.text);
   if (includeText && result.text) mapped.full_text = result.text;
   return mapped;
   ```

4. **Don't use generic error messages**:
   ```javascript
   // WRONG
   throw new Error('Invalid input');
   
   // RIGHT
   throw new Error('State code is required. Please provide a two-letter state code (e.g., CA, NY, TX)');
   ```

5. **Don't ignore data quality**:
   ```javascript
   // WRONG
   return result.proceeding_number;
   
   // RIGHT
   return this.ensureValidProceedingNumber(result.proceeding_number, result);
   ```

6. **Don't forget fallback queries**:
   ```javascript
   // WRONG
   const results = await this.executeExaSearch(query, limit, includeText);
   
   // RIGHT
   const results = await this.searchWithFallback(
     query, 
     [this.buildBroaderQuery(args), this.buildSimpleQuery(args)],
     { limit, includeText }
   );
   ```

## Conclusion

This pattern guide provides the proven template for converting any native API client to an Exa-powered WebSearch implementation. Following these patterns ensures:

- Consistent interface across all clients
- Reliable snippet extraction
- Optimal performance
- Maintainable code
- Comprehensive error handling

Each new WebSearch client should follow these patterns while adapting domain-specific elements as needed.

---

*Based on analysis of: SECWebSearchClient, CourtListenerWebSearchClient, StateStatuteWebSearchClient, StateCourtRulesWebSearchClient, EPAWebSearchClient, PTABWebSearchClient*

*Last Updated: January 2025*
*Version: 1.0.0*
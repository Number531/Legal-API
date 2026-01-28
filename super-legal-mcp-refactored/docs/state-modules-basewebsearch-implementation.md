# State Modules BaseWebSearchClient Implementation Guide

## Executive Summary

This document provides a comprehensive implementation plan for converting the final two remaining web search modules to extend BaseWebSearchClient, completing the architecture standardization across all legal research tools. Based on successful patterns from SEC, FDA, FTC, CPSC, and other integrated modules.

## Current Status

### ✅ Successfully Integrated with BaseWebSearchClient (11 modules)
- SECWebSearchClient.js ✅
- FTCWebSearchClient.js ✅
- NHTSAWebSearchClient.js ✅ (issue resolved)
- UsptoWebSearchClient.js ✅
- CPSCWebSearchClient.js ✅
- CourtListenerWebSearchClient.js ✅
- FDAWebSearchClient.js ✅
- PTABWebSearchClient.js ✅
- EPAWebSearchClient.js ✅
- FederalRegisterWebSearchClient.js ✅
- GovInfoWebSearchClient.js ✅

### ❌ Remaining Modules (2 modules)
1. **StateCourtRulesWebSearchClient.js** - State court procedures and rules
2. **StateStatuteWebSearchClient.js** - State legislation searches

## Conversion Architecture Analysis

### Patterns from Successful Implementations

#### SEC Pattern (Required Parameters with Validation)
```javascript
export class SECWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter) {
    super(rateLimiter, process.env.EXA_API_KEY);
    this.domain = 'securities';
  }

  async searchSECFilingsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    // Validation for required parameters
    if (!company_identifier) {
      throw new Error('company_identifier is required');
    }
    // Use executeExaSearch with domain-specific options
    const results = await this.executeExaSearch(query.trim(), validatedLimit, {
      domain: this.domain,
      highlightQuery: 'SEC filing form 10-K...',
      numSentences: 8,
      highlightsPerUrl: 3,
      includeDomains: ['www.sec.gov', 'sec.gov']
    });
  }
}
```

#### FDA Pattern (Flexible Parameters with Smart Defaults)
```javascript
export class FDAWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);
    this.fdaDomains = ['fda.gov', 'accessdata.fda.gov'];
    // Domain-specific mappings
    this.productAreas = {
      'drug': 'drug OR pharmaceutical OR medication',
      'device': 'device OR medical device OR implant'
    };
  }
}
```

## Phase 1: StateCourtRulesWebSearchClient Conversion

### 1.1 Current Implementation Analysis

**Current Structure (Direct Exa):**
- 294 lines with comprehensive 50-state court domain configuration
- Direct Exa API calls without BaseWebSearchClient benefits
- Complex state-specific domain and court type mappings
- Extensive validation and error handling

**Key Features to Preserve:**
- Comprehensive state court domain mappings (lines 25-150+)
- Court type classifications (supreme, appeals, circuit, district, etc.)
- Special features tracking (electronic filing, local rules, formatting requirements)
- State-specific procedural variations

### 1.2 Conversion Implementation

#### New Class Structure
```javascript
/**
 * State Court Rules Web Search Client
 * Extends BaseWebSearchClient for standardized search capabilities
 * Comprehensive 50-state court rules and formatting requirements
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class StateCourtRulesWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Preserve existing comprehensive state court configuration
    this.stateCourtDomains = {
      'AL': {
        name: 'Alabama',
        domains: ['judicial.alabama.gov', 'acscourt.org'],
        courtTypes: ['supreme', 'appeals', 'circuit', 'district']
      },
      'CA': {
        name: 'California',
        domains: ['courts.ca.gov', 'smartrules.com'],
        courtTypes: ['supreme', 'appeals', 'superior'],
        specialFeatures: ['electronic_filing', 'local_rules', 'formatting_strict']
      },
      // ... preserve all 50 states
    };

    // Court rule categories for enhanced search
    this.ruleCategories = {
      'civil': 'civil procedure rules OR civil rules OR FRCP',
      'criminal': 'criminal procedure rules OR criminal rules',
      'appellate': 'appellate procedure rules OR appellate rules',
      'local': 'local rules OR local court rules',
      'administrative': 'administrative rules OR admin rules',
      'evidence': 'evidence rules OR evidentiary rules',
      'discovery': 'discovery rules OR discovery procedure',
      'filing': 'electronic filing rules OR e-filing rules',
      'formatting': 'formatting requirements OR document format'
    };
  }
}
```

#### Enhanced Search Methods
```javascript
/**
 * Search state court rules with enhanced BaseWebSearchClient capabilities
 */
async searchStateCourtRules(args) {
  // Handle empty parameters gracefully (following FDA pattern)
  if (!args || typeof args !== 'object') args = {};

  const {
    state,
    court_type,
    rule_category,
    search_term,
    local_jurisdiction,
    limit = 10,
    include_snippet = false,
    include_text = false
  } = args;

  // Enhanced validation with helpful suggestions
  if (!state || typeof state !== 'string') {
    throw new Error('State code is required for court rules search. Example: "CA", "NY", "TX"');
  }

  const stateUpper = state.toUpperCase();
  const stateData = this.stateCourtDomains[stateUpper];
  if (!stateData) {
    const availableStates = Object.keys(this.stateCourtDomains).slice(0, 10).join(', ');
    throw new Error(`Invalid state code: ${state}. Available: ${availableStates}...`);
  }

  // Build domain-specific search query
  const query = this.buildCourtRulesQuery({
    state: stateUpper,
    stateData,
    court_type,
    rule_category,
    search_term,
    local_jurisdiction
  });

  const validatedLimit = validateLimit(limit, 15);

  // Execute search using BaseWebSearchClient capabilities
  const results = await this.executeExaSearch(query, validatedLimit, {
    domain: 'state_court_rules',
    highlightQuery: this.generateCourtRulesHighlightQuery(rule_category, court_type),
    numSentences: 6,
    highlightsPerUrl: 2,
    includeDomains: stateData.domains,
    includeFullText: include_text,
    fallbackToText: true
  });

  // Map results using enhanced extraction
  const courtRules = results
    .filter(r => this.isValidCourtRuleDomain(r.url, stateData.domains))
    .map(r => this.mapCourtRuleResult(r, stateUpper, include_text, include_snippet))
    .filter(Boolean);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        search_type: 'state_court_rules_web',
        state: stateData.name,
        state_code: stateUpper,
        court_type: court_type,
        rule_category: rule_category,
        query: query,
        total_results: courtRules.length,
        court_rules: courtRules
      }, null, 2)
    }]
  };
}

/**
 * Build state court rules specific search query
 */
buildCourtRulesQuery(params) {
  const { state, stateData, court_type, rule_category, search_term, local_jurisdiction } = params;

  // Start with state-specific domain restriction
  let query = `(${stateData.domains.map(d => `site:${d}`).join(' OR ')})`;

  // Add court type specificity
  if (court_type && stateData.courtTypes.includes(court_type)) {
    const courtTypeMap = {
      'supreme': 'supreme court',
      'appeals': 'appellate court OR court of appeals',
      'superior': 'superior court',
      'circuit': 'circuit court',
      'district': 'district court',
      'county': 'county court',
      'municipal': 'municipal court'
    };
    query += ` "${courtTypeMap[court_type] || court_type}"`;
  }

  // Add rule category
  if (rule_category && this.ruleCategories[rule_category]) {
    query += ` (${this.ruleCategories[rule_category]})`;
  }

  // Add search term
  if (search_term && search_term.trim()) {
    query += ` "${search_term.trim()}"`;
  }

  // Add local jurisdiction specificity
  if (local_jurisdiction) {
    query += ` "${local_jurisdiction}"`;
  }

  // Add general rule terms if query is too broad
  if (query === `(${stateData.domains.map(d => `site:${d}`).join(' OR ')})`) {
    query += ' (rules OR procedure OR "court rules" OR "local rules")';
  }

  return query.trim();
}

/**
 * Generate court rules specific highlight query
 */
generateCourtRulesHighlightQuery(rule_category, court_type) {
  let highlights = 'court rules procedure local rules filing requirements formatting';

  if (rule_category) {
    const categoryHighlights = {
      'civil': 'civil procedure pleadings motions discovery',
      'criminal': 'criminal procedure arraignment sentencing',
      'appellate': 'appeal brief oral argument appellate procedure',
      'local': 'local rules specific requirements deadlines',
      'filing': 'electronic filing e-filing document format',
      'evidence': 'evidence admissibility hearsay expert testimony'
    };
    highlights += ` ${categoryHighlights[rule_category] || ''}`;
  }

  if (court_type) {
    highlights += ` ${court_type} court`;
  }

  return highlights.trim();
}

/**
 * Map court rule search result with state-specific metadata
 */
mapCourtRuleResult(result, state, includeText, includeSnippet) {
  if (!result || !result.title) return null;

  const mapped = {
    title: result.title,
    url: result.url,
    published_date: result.publishedDate || null,
    state: state,
    result_type: 'court_rule',
    metadata: this.extractCourtRuleMetadata(result, state),
    score: result.score || null
  };

  // Add content quality assessment
  const isHighlightMode = result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0;
  mapped._content_quality = {
    source: isHighlightMode ? 'highlights' : 'full_text',
    confidence: this.calculateExtractionConfidence(this.extractContentFromResult(result), 'court_rule'),
    highlight_count: isHighlightMode ? result.highlights.length : 0
  };

  // Add snippet if requested
  if (includeSnippet) {
    if (isHighlightMode) {
      mapped.snippet = this.extractSmartSnippetFromHighlights([result], 500);
    } else {
      mapped.snippet = this.extractSmartSnippet(this.extractContentFromResult(result), 500);
    }
  }

  // Add full text if requested
  if (includeText && result.text) {
    mapped.full_text = result.text;
  }

  return mapped;
}

/**
 * Extract court rule specific metadata
 */
extractCourtRuleMetadata(result, state) {
  const metadata = { state };
  const text = this.extractContentFromResult(result);
  const url = result.url || '';

  // Extract court type
  const courtTypes = ['supreme', 'appellate', 'superior', 'circuit', 'district', 'county'];
  for (const courtType of courtTypes) {
    if (text.toLowerCase().includes(`${courtType} court`) || url.toLowerCase().includes(courtType)) {
      metadata.court_type = courtType;
      break;
    }
  }

  // Extract rule number/reference
  const ruleRef = text.match(/Rule\s+(\d+(?:\.\d+)?)/i);
  if (ruleRef) {
    metadata.rule_number = ruleRef[1];
  }

  // Extract effective date
  const effectiveDate = text.match(/effective\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
  if (effectiveDate) {
    metadata.effective_date = effectiveDate[1];
  }

  // Detect rule category
  const categories = Object.keys(this.ruleCategories);
  for (const category of categories) {
    if (text.toLowerCase().includes(category) || url.toLowerCase().includes(category)) {
      metadata.rule_category = category;
      break;
    }
  }

  return metadata;
}
```

## Phase 2: StateStatuteWebSearchClient Conversion

### 2.1 Current Implementation Analysis

**Current Structure (Direct Exa):**
- 180+ lines with complete 50-state + DC statute domain configuration
- Direct Exa API implementation with custom fetch logic
- Comprehensive state domain mappings and validation
- Strict parameter validation (requires state and query)

### 2.2 Conversion Implementation

#### New Class Structure
```javascript
/**
 * State Statute Web Search Client
 * Extends BaseWebSearchClient for enhanced state legislation searches
 * Replaces direct Exa implementation with standardized architecture
 */

import { validateLimit } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class StateStatuteWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);

    // Preserve comprehensive state data configuration
    this.stateData = {
      'AL': { name: 'Alabama', domains: ['legislature.state.al.us', 'alisondb.legislature.state.al.us'] },
      'CA': { name: 'California', domains: ['leginfo.legislature.ca.gov'] },
      'NY': { name: 'New York', domains: ['nysenate.gov', 'assembly.state.ny.us'] },
      'TX': { name: 'Texas', domains: ['capitol.texas.gov', 'statutes.capitol.texas.gov'] },
      // ... preserve all 50 states + DC
    };

    // Statute search enhancements
    this.statuteTypes = {
      'code': 'code OR statute OR chapter OR section',
      'bill': 'bill OR legislation OR act',
      'resolution': 'resolution OR joint resolution',
      'amendment': 'amendment OR constitutional amendment',
      'regulation': 'regulation OR administrative code'
    };

    // Subject area mappings
    this.subjectAreas = {
      'criminal': 'criminal code OR penal code',
      'civil': 'civil code OR civil procedure',
      'business': 'business code OR corporations',
      'family': 'family code OR domestic relations',
      'property': 'property code OR real estate',
      'tax': 'tax code OR revenue code',
      'education': 'education code OR school code',
      'health': 'health code OR public health',
      'environmental': 'environmental code OR natural resources',
      'employment': 'labor code OR employment law'
    };
  }
}
```

#### Enhanced Search Methods
```javascript
/**
 * Search state statutes with BaseWebSearchClient enhancements
 */
async searchStateStatute(args) {
  // Handle empty parameters with better defaults (following FDA pattern)
  if (!args || typeof args !== 'object') args = {};

  const {
    state,
    query,
    statute_type,
    subject_area,
    section_number,
    year,
    limit = 10,
    include_text = false,
    include_snippet = true
  } = args;

  // Enhanced validation with helpful guidance
  if (!state || typeof state !== 'string') {
    throw new Error('State code is required. Example: {state: "CA", query: "criminal procedure"}');
  }

  const stateUpper = state.toUpperCase();
  const stateInfo = this.stateData[stateUpper];
  if (!stateInfo) {
    const samples = Object.keys(this.stateData).slice(0, 8).join(', ');
    throw new Error(`Invalid state: ${state}. Available: ${samples}...`);
  }

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Query is required. Example: "criminal procedure", "family law", "business corporations"');
  }

  // Build enhanced search query
  const searchQuery = this.buildStatuteQuery({
    stateInfo,
    query: query.trim(),
    statute_type,
    subject_area,
    section_number,
    year
  });

  const validatedLimit = validateLimit(limit, 15);

  // Execute search using BaseWebSearchClient
  const results = await this.executeExaSearch(searchQuery, validatedLimit, {
    domain: 'state_law',
    highlightQuery: this.generateStatuteHighlightQuery(query, subject_area, statute_type),
    numSentences: 7,
    highlightsPerUrl: 2,
    includeDomains: stateInfo.domains,
    includeFullText: include_text,
    fallbackToText: true
  });

  // Map results with state-specific processing
  const statutes = results
    .filter(r => this.isValidStatuteDomain(r.url, stateInfo.domains))
    .map(r => this.mapStatuteResult(r, stateUpper, include_text, include_snippet))
    .filter(Boolean);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        search_type: 'state_statute_web',
        state: stateInfo.name,
        state_code: stateUpper,
        query: query,
        search_query: searchQuery,
        total_results: statutes.length,
        statutes: statutes
      }, null, 2)
    }]
  };
}

/**
 * Build state statute specific search query
 */
buildStatuteQuery(params) {
  const { stateInfo, query, statute_type, subject_area, section_number, year } = params;

  // Start with state domain restriction
  let searchQuery = `(${stateInfo.domains.map(d => `site:${d}`).join(' OR ')})`;

  // Add the main query term
  searchQuery += ` "${query}"`;

  // Add statute type specificity
  if (statute_type && this.statuteTypes[statute_type]) {
    searchQuery += ` (${this.statuteTypes[statute_type]})`;
  }

  // Add subject area context
  if (subject_area && this.subjectAreas[subject_area]) {
    searchQuery += ` (${this.subjectAreas[subject_area]})`;
  }

  // Add section number if specified
  if (section_number) {
    searchQuery += ` ("section ${section_number}" OR "§${section_number}")`;
  }

  // Add year specification
  if (year) {
    searchQuery += ` ${year}`;
  }

  // Add general statute terms for better targeting
  searchQuery += ' (statute OR code OR law OR section OR chapter)';

  return searchQuery.trim();
}

/**
 * Generate statute-specific highlight query
 */
generateStatuteHighlightQuery(query, subject_area, statute_type) {
  let highlights = `statute code law section chapter ${query}`;

  if (subject_area) {
    highlights += ` ${subject_area}`;
  }

  if (statute_type) {
    highlights += ` ${statute_type}`;
  }

  // Add common legal terms
  highlights += ' penalty fine violation enforcement definition';

  return highlights.trim();
}

/**
 * Map statute search result with enhanced metadata
 */
mapStatuteResult(result, state, includeText, includeSnippet) {
  if (!result || !result.title) return null;

  const mapped = {
    title: result.title,
    url: result.url,
    published_date: result.publishedDate || null,
    state: state,
    result_type: 'statute',
    metadata: this.extractStatuteMetadata(result, state),
    score: result.score || null
  };

  // Add content quality assessment
  const isHighlightMode = result.highlights && Array.isArray(result.highlights) && result.highlights.length > 0;
  mapped._content_quality = {
    source: isHighlightMode ? 'highlights' : 'full_text',
    confidence: this.calculateExtractionConfidence(this.extractContentFromResult(result), 'statute'),
    highlight_count: isHighlightMode ? result.highlights.length : 0
  };

  // Add snippet extraction
  if (includeSnippet) {
    if (isHighlightMode) {
      mapped.snippet = this.extractSmartSnippetFromHighlights([result], 600);
    } else {
      mapped.snippet = this.extractSmartSnippet(this.extractContentFromResult(result), 600);
    }
  }

  if (includeText && result.text) {
    mapped.full_text = result.text;
  }

  return mapped;
}

/**
 * Extract statute-specific metadata
 */
extractStatuteMetadata(result, state) {
  const metadata = { state };
  const text = this.extractContentFromResult(result);
  const url = result.url || '';

  // Extract statute citation
  const citation = text.match(/(\d+[\w\s]*§\s*[\d\.-]+)|([A-Z]+\s*Code\s*§\s*[\d\.-]+)/i);
  if (citation) {
    metadata.citation = citation[0];
  }

  // Extract chapter/title
  const chapter = text.match(/Chapter\s+(\d+[\w]*)/i) || text.match(/Title\s+(\d+[\w]*)/i);
  if (chapter) {
    metadata.chapter = chapter[1];
  }

  // Extract section number
  const section = text.match(/§\s*([\d\.-]+)/i) || text.match(/Section\s+([\d\.-]+)/i);
  if (section) {
    metadata.section = section[1];
  }

  // Extract effective date
  const effectiveDate = text.match(/effective\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
  if (effectiveDate) {
    metadata.effective_date = effectiveDate[1];
  }

  // Detect subject area
  const subjects = Object.keys(this.subjectAreas);
  for (const subject of subjects) {
    if (text.toLowerCase().includes(subject) || url.toLowerCase().includes(subject)) {
      metadata.subject_area = subject;
      break;
    }
  }

  return metadata;
}
```

## Integration Changes Required

### 3.1 EnhancedLegalMcpServer.js Updates

```javascript
// In initializeClients method
initializeClients() {
  // ... existing clients

  // Update StateCourtRules to use BaseWebSearchClient
  this.clients.stateCourtRulesWeb = new StateCourtRulesWebSearchClient(
    this.rateLimiters.get('exa'),
    process.env.EXA_API_KEY
  );

  // Update StateStatute to use BaseWebSearchClient
  this.clients.stateStatuteWeb = new StateStatuteWebSearchClient(
    this.rateLimiters.get('exa'),
    process.env.EXA_API_KEY
  );

  console.log('📋 State modules upgraded to BaseWebSearchClient architecture');
}
```

### 3.2 toolImplementations.js Updates

```javascript
// Update existing state tool implementations
const toolImplementations = {
  // ... existing tools

  // State Court Rules - Updated to use new BaseWebSearchClient methods
  "search_state_court_rules": wrapWithConversation("search_state_court_rules", (args) =>
    stateCourtRulesWeb.searchStateCourtRules(args)
  ),

  // State Statutes - Updated to use new BaseWebSearchClient methods
  "search_state_statute": wrapWithConversation("search_state_statute", (args) =>
    stateStatuteWeb.searchStateStatute(args)
  ),

  // Additional state-specific methods if needed
  "search_state_civil_rules": wrapWithConversation("search_state_civil_rules", (args) =>
    stateCourtRulesWeb.searchStateCourtRules({...args, rule_category: 'civil'})
  ),

  "search_state_criminal_rules": wrapWithConversation("search_state_criminal_rules", (args) =>
    stateCourtRulesWeb.searchStateCourtRules({...args, rule_category: 'criminal'})
  )
};
```

### 3.3 claude-server-v2.js Updates

#### Enhanced Tool Descriptions
```javascript
enhanceToolDescription(tool) {
  // ... existing enhancements

  // State Court Rules enhancements
  if (tool.name.includes('state_court_rules') || tool.name.includes('court_rules')) {
    enhanced.description += '\n\nSTATE COURT RULES USAGE:' +
      '\n✓ state: Two-letter state code (required) - "CA", "NY", "TX"' +
      '\n✓ court_type: "supreme", "appeals", "superior", "circuit", "district"' +
      '\n✓ rule_category: "civil", "criminal", "appellate", "local", "filing"' +
      '\n✓ search_term: Specific rule or topic' +
      '\n✓ local_jurisdiction: County or city for local rules' +
      '\n\nEXAMPLES:' +
      '\n✓ {state:"CA", rule_category:"civil", search_term:"summary judgment"}' +
      '\n✓ {state:"NY", court_type:"supreme", rule_category:"discovery"}' +
      '\n✓ {state:"TX", court_type:"appeals", rule_category:"appellate"}';
  }

  // State Statute enhancements
  if (tool.name.includes('state_statute') || tool.name.includes('statute')) {
    enhanced.description += '\n\nSTATE STATUTE USAGE:' +
      '\n✓ state: Two-letter state code (required) - "CA", "NY", "TX"' +
      '\n✓ query: Search terms (required) - "criminal procedure", "family law"' +
      '\n✓ statute_type: "code", "bill", "resolution", "amendment"' +
      '\n✓ subject_area: "criminal", "civil", "business", "family", "tax"' +
      '\n✓ section_number: Specific section reference' +
      '\n\nEXAMPLES:' +
      '\n✓ {state:"CA", query:"criminal procedure", subject_area:"criminal"}' +
      '\n✓ {state:"NY", query:"business corporation", statute_type:"code"}' +
      '\n✓ {state:"TX", query:"family court", section_number:"101.001"}';
  }

  return enhanced;
}
```

#### Domain Classification Updates
```javascript
classifyLegalDomain(toolName) {
  const domains = {
    // ... existing domains

    // State-specific domains
    'search_state_court_rules': 'State Court Procedure',
    'search_state_civil_rules': 'State Civil Procedure',
    'search_state_criminal_rules': 'State Criminal Procedure',
    'search_state_statute': 'State Legislation',
    'search_state_code': 'State Statutory Law'
  };

  return domains[toolName] || 'General Legal';
}
```

#### System Prompt Updates
```javascript
getLegalSystemPrompt() {
  return `# Expert Legal Research Assistant & Academic Legal Scholar

// ... existing prompt content

## STATE LAW TOOL USAGE PROTOCOLS

### STATE COURT RULES PROTOCOL
When using state court rules tools:
- **Required Parameters**: state (two-letter code), search context
- **Court Specificity**: Specify court level (supreme, appeals, superior, etc.)
- **Rule Categories**: Use civil, criminal, appellate, local, filing categories
- **Local Rules**: Include local_jurisdiction for county/city specific rules

### STATE STATUTE PROTOCOL
When using state statute tools:
- **Required Parameters**: state (two-letter code) and query (search terms)
- **Subject Areas**: Specify criminal, civil, business, family, tax, etc.
- **Citation Format**: Include section numbers when available
- **Historical Context**: Use year parameter for specific legislative sessions

${existingPromptContent}`;
}
```

### 3.4 toolDefinitions.js Updates

```javascript
// Enhanced State Court Rules definition
{
  name: "search_state_court_rules",
  description: "Search state court rules, procedures, and local requirements using enhanced web search capabilities",
  input_schema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        description: "Two-letter state code (e.g., 'CA', 'NY', 'TX')",
        pattern: "^[A-Z]{2}$"
      },
      court_type: {
        type: "string",
        description: "Court level: supreme, appeals, superior, circuit, district, county",
        enum: ["supreme", "appeals", "appellate", "superior", "circuit", "district", "county", "municipal"]
      },
      rule_category: {
        type: "string",
        description: "Rule category: civil, criminal, appellate, local, filing, evidence, discovery",
        enum: ["civil", "criminal", "appellate", "local", "administrative", "evidence", "discovery", "filing", "formatting"]
      },
      search_term: {
        type: "string",
        description: "Specific rule topic or search terms"
      },
      local_jurisdiction: {
        type: "string",
        description: "County or city name for local rules"
      },
      limit: {
        type: "number",
        description: "Maximum results (1-15)",
        minimum: 1,
        maximum: 15
      },
      include_snippet: {
        type: "boolean",
        description: "Include content snippets in results"
      },
      include_text: {
        type: "boolean",
        description: "Include full text content"
      }
    },
    required: ["state"]
  }
},

// Enhanced State Statute definition
{
  name: "search_state_statute",
  description: "Search state statutes and legislation using enhanced web search with comprehensive coverage",
  input_schema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        description: "Two-letter state code (e.g., 'CA', 'NY', 'TX')",
        pattern: "^[A-Z]{2}$"
      },
      query: {
        type: "string",
        description: "Search terms for statute content"
      },
      statute_type: {
        type: "string",
        description: "Type of legislation: code, bill, resolution, amendment, regulation",
        enum: ["code", "bill", "resolution", "amendment", "regulation"]
      },
      subject_area: {
        type: "string",
        description: "Subject area: criminal, civil, business, family, property, tax, education, health, environmental, employment",
        enum: ["criminal", "civil", "business", "family", "property", "tax", "education", "health", "environmental", "employment"]
      },
      section_number: {
        type: "string",
        description: "Specific section or citation reference"
      },
      year: {
        type: "number",
        description: "Specific year or legislative session"
      },
      limit: {
        type: "number",
        description: "Maximum results (1-15)",
        minimum: 1,
        maximum: 15
      },
      include_snippet: {
        type: "boolean",
        description: "Include content snippets in results"
      },
      include_text: {
        type: "boolean",
        description: "Include full text content"
      }
    },
    required: ["state", "query"]
  }
}
```

## Implementation Checklist

### Phase 1: StateCourtRulesWebSearchClient ✅

#### Pre-Implementation
- [ ] **Backup Current File**: Create backup of StateCourtRulesWebSearchClient.js
- [ ] **Verify BaseWebSearchClient**: Confirm BaseWebSearchClient.js is functional
- [ ] **Review State Domains**: Validate 50-state domain configuration accuracy
- [ ] **Test Environment**: Ensure EXA_API_KEY is configured

#### Core Conversion
- [ ] **Import BaseWebSearchClient**: Add import statement
- [ ] **Extend Class**: Change class to extend BaseWebSearchClient
- [ ] **Update Constructor**: Use super(rateLimiter, exaApiKey) pattern
- [ ] **Preserve State Data**: Maintain comprehensive stateCourtDomains configuration
- [ ] **Add Rule Categories**: Implement ruleCategories mapping object
- [ ] **Convert Methods**: Replace direct Exa calls with executeExaSearch

#### Method Implementation
- [ ] **searchStateCourtRules**: Implement main search method with BaseWebSearchClient
- [ ] **buildCourtRulesQuery**: Create domain-specific query builder
- [ ] **generateCourtRulesHighlightQuery**: Implement highlight query generator
- [ ] **mapCourtRuleResult**: Create result mapping with state metadata
- [ ] **extractCourtRuleMetadata**: Implement metadata extraction
- [ ] **Parameter Validation**: Add enhanced validation with helpful errors

#### Integration Updates
- [ ] **EnhancedLegalMcpServer**: Update client initialization
- [ ] **toolImplementations**: Update method calls to use new client
- [ ] **claude-server-v2**: Add state court rules tool enhancements
- [ ] **toolDefinitions**: Update input schema and descriptions
- [ ] **System Prompt**: Add state court rules usage protocols

#### Testing & Validation
- [ ] **Unit Tests**: Test with various state/court combinations
- [ ] **Parameter Validation**: Test error handling for invalid states
- [ ] **Integration Test**: Full MCP server integration test
- [ ] **Performance Test**: Compare response times vs direct Exa
- [ ] **Content Quality**: Validate result relevance and accuracy

### Phase 2: StateStatuteWebSearchClient ✅

#### Pre-Implementation
- [ ] **Backup Current File**: Create backup of StateStatuteWebSearchClient.js
- [ ] **Validate State Data**: Confirm all 50 states + DC domain accuracy
- [ ] **Review Current Logic**: Understand existing validation and error handling
- [ ] **Test Current Implementation**: Baseline performance metrics

#### Core Conversion
- [ ] **Import BaseWebSearchClient**: Add import statement
- [ ] **Extend Class**: Change class to extend BaseWebSearchClient
- [ ] **Update Constructor**: Use super(rateLimiter, exaApiKey) pattern
- [ ] **Preserve State Data**: Maintain comprehensive stateData configuration
- [ ] **Add Statute Types**: Implement statuteTypes and subjectAreas mappings
- [ ] **Convert Methods**: Replace direct Exa calls with executeExaSearch

#### Method Implementation
- [ ] **searchStateStatute**: Implement main search method with BaseWebSearchClient
- [ ] **buildStatuteQuery**: Create comprehensive query builder
- [ ] **generateStatuteHighlightQuery**: Implement highlight optimization
- [ ] **mapStatuteResult**: Create result mapping with statute metadata
- [ ] **extractStatuteMetadata**: Implement citation and section extraction
- [ ] **Enhanced Validation**: Improve error messages and guidance

#### Integration Updates
- [ ] **EnhancedLegalMcpServer**: Update client initialization
- [ ] **toolImplementations**: Update method calls to use new client
- [ ] **claude-server-v2**: Add state statute tool enhancements
- [ ] **toolDefinitions**: Update input schema with new parameters
- [ ] **System Prompt**: Add state statute usage protocols

#### Testing & Validation
- [ ] **Multi-State Tests**: Test with different states and queries
- [ ] **Parameter Combinations**: Test statute_type and subject_area filters
- [ ] **Error Handling**: Validate helpful error messages
- [ ] **Integration Test**: Full MCP server integration
- [ ] **Performance Comparison**: Measure improvements vs direct implementation

### Integration Validation ✅

#### System Integration
- [ ] **MCP Server Startup**: Verify all clients initialize correctly
- [ ] **Tool Discovery**: Confirm enhanced descriptions appear
- [ ] **Parameter Validation**: Test tool input validation
- [ ] **Error Propagation**: Ensure proper error handling through MCP
- [ ] **Rate Limiting**: Verify BaseWebSearchClient rate limiting works

#### Performance Validation
- [ ] **Response Times**: Measure average response time improvements
- [ ] **API Call Reduction**: Confirm single-call execution (no discovery)
- [ ] **Memory Usage**: Monitor memory consumption vs previous implementation
- [ ] **Error Rates**: Track error rates and types
- [ ] **Content Quality**: Validate search result relevance

#### Documentation Updates
- [ ] **Update Conversion Doc**: Mark state modules as complete
- [ ] **Performance Metrics**: Document actual improvements achieved
- [ ] **Usage Examples**: Add state-specific examples to documentation
- [ ] **Troubleshooting**: Document common issues and solutions

## Success Metrics

### Performance Improvements Expected
- **API Call Reduction**: 50%+ reduction through single-call execution
- **Response Time**: 40-60% improvement with BaseWebSearchClient optimizations
- **Search Quality**: Enhanced relevance through domain-specific highlighting
- **Error Rate**: <3% with improved validation and error handling

### Quality Improvements Expected
- **Result Relevance**: Better targeting through enhanced query building
- **Metadata Extraction**: Richer metadata through highlights processing
- **Content Quality**: Improved snippet extraction and formatting
- **User Experience**: Better error messages and parameter guidance

### Architecture Benefits
- **Consistency**: All 13 modules using standardized BaseWebSearchClient
- **Maintainability**: Unified codebase for web search functionality
- **Extensibility**: Easy to add new features across all modules
- **Monitoring**: Centralized performance monitoring and rate limiting

## Rollback Plan

### Module Level Rollback
1. **Restore Backup**: Revert to backed up original implementation
2. **Update Imports**: Restore direct Exa imports in EnhancedLegalMcpServer
3. **Revert Tools**: Restore original toolImplementations.js calls
4. **Test Functionality**: Verify original functionality restored

### Integration Rollback
1. **claude-server-v2**: Remove state module enhancements
2. **toolDefinitions**: Restore original input schemas
3. **System Prompt**: Remove state-specific protocols
4. **Full Server Test**: Verify complete rollback functionality

### Rollback Triggers
- **Error Rate >10%**: Significant increase in search failures
- **Performance Degradation >25%**: Slower response times
- **Integration Issues**: MCP server instability
- **Content Quality Drop**: Significant reduction in result relevance

## Conclusion

This comprehensive implementation plan ensures the final two state law modules will benefit from the proven BaseWebSearchClient architecture, achieving:

1. **Complete Standardization**: All 13 web search modules using BaseWebSearchClient
2. **Enhanced Performance**: Significant improvements in speed and efficiency
3. **Better User Experience**: Improved search quality and error handling
4. **Maintainable Architecture**: Unified, extensible codebase

The detailed step-by-step approach minimizes risk while maximizing the benefits of architectural consistency across the entire legal research platform.
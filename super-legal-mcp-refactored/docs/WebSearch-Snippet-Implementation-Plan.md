# WebSearch Clients Snippet Mode Implementation Plan

## Overview
This document outlines the implementation of Exa highlights/snippet mode for WebSearch clients that currently only support full text or no text. The goal is to reduce token usage by 90-95% while maintaining search quality through contextually relevant snippets.

## Current Status

### ✅ Already Optimized
- **CourtListenerWebSearchClient**: Snippet mode implemented with highlights
- **SECWebSearchClient**: Has `include_snippet` with `extractSmartSnippet` method

### 🔴 Critical Issues - Need Immediate Attention
- **EPAWebSearchClient**: 25 results with full text = catastrophic token usage
- **PTABWebSearchClient**: 10 results, always full text = massive token usage

### 🟡 Medium Priority - Need Enhancement
- **StateCourtRulesWebSearchClient**: 5-10 results, binary text mode
- **StateStatuteWebSearchClient**: No default limit, binary text mode

---

## Phase 1: Critical Fixes (EPA & PTAB)

### A. EPAWebSearchClient Implementation

#### Pre-Implementation Checklist
- [ ] Create backup: `cp EPAWebSearchClient.js EPAWebSearchClient.js.backup`
- [ ] Review current implementation structure
- [ ] Identify all methods using `executeExaSearch`
- [ ] Note current default limits (currently 25 for facilities)

#### Core Implementation
- [ ] **Update executeExaSearch method signature**
  ```javascript
  async executeExaSearch(query, limit, includeSnippet = true, includeFullText = false)
  ```

- [ ] **Implement 3-tier contents logic**
  ```javascript
  let contents;
  if (includeFullText) {
    contents = { text: true };
  } else if (includeSnippet) {
    contents = {
      highlights: {
        query: query,
        numSentences: 3,
        highlightsPerUrl: 1
      }
    };
  }
  // If neither, contents remains undefined (metadata only)
  ```

- [ ] **Update all method signatures**
  - [ ] `searchEPAFacilitiesWeb` - Change limit from 25 to 5
  - [ ] `getEPAFacilityComplianceWeb` - Change limit from 200 to 20
  - [ ] Add `include_snippet` parameter (default: true)
  - [ ] Add `include_full_text` parameter (default: false)
  - [ ] Keep `include_text` for backward compatibility

- [ ] **Update result mapping**
  - [ ] Handle highlights array from Exa
  - [ ] Create snippet from highlights
  - [ ] Implement fallback to text substring if needed
  - [ ] Add snippet extraction method similar to SEC

#### Testing Checklist
- [ ] Test snippet mode returns ~500 char snippets
- [ ] Test full text mode still works
- [ ] Test metadata-only mode
- [ ] Verify backward compatibility with `include_text`
- [ ] Check token reduction (should be >95%)

#### Tool Definition Updates
- [ ] Update `search_epa_facilities` tool definition
- [ ] Update `get_epa_facility_compliance` tool definition
- [ ] Add `include_snippet` parameter descriptions
- [ ] Mark `include_text` as deprecated
- [ ] Update default limits in tool definitions

---

### B. PTABWebSearchClient Implementation

#### Pre-Implementation Checklist
- [ ] Create backup: `cp PTABWebSearchClient.js PTABWebSearchClient.js.backup`
- [ ] Review current implementation (currently always uses full text)
- [ ] Identify all 4 search methods (IPR, PGR, CBM, All)
- [ ] Note current default limits (currently 10)

#### Core Implementation
- [ ] **Update executeExaSearch method**
  - [ ] Add parameters: `includeSnippet`, `includeFullText`
  - [ ] Remove hardcoded `contents: { text: true }`
  - [ ] Implement 3-tier contents logic

- [ ] **Update all search methods**
  - [ ] `searchIPRProceedings` - Change limit from 10 to 3
  - [ ] `searchPGRProceedings` - Change limit from 10 to 3
  - [ ] `searchCBMProceedings` - Change limit from 10 to 3
  - [ ] `searchAllAIAProceedings` - Change limit from 10 to 3
  - [ ] Add snippet/full text parameters to each

- [ ] **Update parsing methods**
  - [ ] `parseIPRResults` - Handle highlights
  - [ ] `parsePGRResults` - Handle highlights
  - [ ] `parseCBMResults` - Handle highlights
  - [ ] `parseAllProceedingResults` - Handle highlights

- [ ] **Implement snippet extraction**
  - [ ] Extract proceeding numbers from snippets
  - [ ] Extract patent numbers from snippets
  - [ ] Extract party names from snippets
  - [ ] Handle technical patent language

#### Testing Checklist
- [ ] Test each proceeding type search
- [ ] Verify proceeding numbers extracted correctly
- [ ] Check snippet relevance for patent terms
- [ ] Measure token reduction
- [ ] Test with complex patent queries

#### Tool Definition Updates
- [ ] Update all PTAB tool definitions
- [ ] Add snippet parameters
- [ ] Reduce default limits to 3
- [ ] Add clear descriptions about token usage

---

## Phase 2: Medium Priority Enhancements

### C. StateCourtRulesWebSearchClient Implementation

#### Pre-Implementation Checklist
- [ ] Create backup
- [ ] Review 10+ search methods
- [ ] Note varying default limits (5-10)
- [ ] Identify common patterns

#### Core Implementation
- [ ] **Update executeExaSearch method**
  - [ ] Add snippet/full text parameters
  - [ ] Implement highlights logic

- [ ] **Standardize all method limits to 3**
  - [ ] `searchCourtRules` - Currently 10
  - [ ] `getFormattingRequirements` - Currently 5
  - [ ] `getElectronicFilingRules` - Currently 5
  - [ ] `searchLocalRules` - Currently 8
  - [ ] `getCourtSpecificProcedures` - Currently 8
  - [ ] `checkRuleUpdates` - Currently 10
  - [ ] `getDocumentTemplates` - Currently 5
  - [ ] `validateDocumentCompliance` - Currently 8
  - [ ] Additional methods as needed

- [ ] **Implement rule-specific snippet extraction**
  - [ ] Focus on rule numbers
  - [ ] Extract procedural requirements
  - [ ] Highlight deadlines and dates

#### Testing Checklist
- [ ] Test each search method
- [ ] Verify rule citations extracted
- [ ] Check snippet quality for legal rules
- [ ] Ensure formatting preserved

---

### D. StateStatuteWebSearchClient Implementation

#### Pre-Implementation Checklist
- [ ] Create backup
- [ ] Review search implementation
- [ ] Check current limit handling
- [ ] Understand statute structure

#### Core Implementation
- [ ] **Add default limit of 3**
  - [ ] Update `searchStateStatutes` method
  - [ ] Add limit parameter with default

- [ ] **Update executeExaSearch**
  - [ ] Add snippet/full text parameters
  - [ ] Implement highlights logic

- [ ] **Implement statute-specific snippet extraction**
  - [ ] Extract section numbers
  - [ ] Focus on relevant subsections
  - [ ] Preserve legal citations

#### Testing Checklist
- [ ] Test various state statutes
- [ ] Verify section numbers preserved
- [ ] Check snippet relevance
- [ ] Measure token reduction

---

## Implementation Guidelines

### Common Pattern for All Clients

```javascript
// 1. Update executeExaSearch signature
async executeExaSearch(query, limit, includeSnippet = true, includeFullText = false) {
  // ... existing validation ...
  
  // 2. Configure contents based on request
  let contents;
  if (includeFullText) {
    contents = { text: true };
  } else if (includeSnippet) {
    contents = {
      highlights: {
        query: query,
        numSentences: 3,  // Adjust based on domain
        highlightsPerUrl: 1
      }
    };
  }
  
  // 3. Update Exa API call
  body: JSON.stringify({
    query,
    numResults: limit,
    includeDomains: [...],
    contents: contents  // Now dynamic
  })
}

// 4. Update result mapping
mapResultWithSnippet(result, includeSnippet, includeFullText) {
  let snippet = '';
  let fullText = '';
  
  if (includeFullText && result.text) {
    fullText = result.text;
    snippet = fullText.substring(0, 500) + '...';
  } else if (includeSnippet && result.highlights) {
    snippet = Array.isArray(result.highlights)
      ? result.highlights.join(' ... ')
      : String(result.highlights || '');
  } else if (includeSnippet && result.text) {
    snippet = result.text.substring(0, 500) + '...';
  }
  
  // Return mapped result with appropriate fields
}
```

### Testing Protocol

1. **Create test script for each client**
   ```javascript
   // test-[client]-snippets.js
   - Test snippet mode (default)
   - Test full text mode
   - Test metadata only
   - Compare token usage
   - Verify backward compatibility
   ```

2. **Measure improvements**
   - Document token count before/after
   - Record response time improvements
   - Note quality of snippets

3. **Integration testing**
   - Test with comprehensive_legal_entity_analysis
   - Verify no token limit errors
   - Check multi-tool scenarios

---

## Success Metrics

### Target Improvements
- [ ] **Token Reduction**: >90% for all clients
- [ ] **Default Limits**: All reduced to 3-5 results
- [ ] **Response Time**: 50%+ faster
- [ ] **No Token Errors**: Comprehensive analysis completes without limits

### Quality Checks
- [ ] Snippets contain relevant information
- [ ] Key identifiers (case numbers, statute sections) preserved
- [ ] Backward compatibility maintained
- [ ] Tool definitions updated and clear

---

## Rollback Plan

If issues arise:
1. Restore from backup files
2. Revert git commits if used
3. Test with original implementation
4. Document issues for debugging

---

## Timeline

### Week 1
- [ ] Phase 1A: EPA implementation and testing
- [ ] Phase 1B: PTAB implementation and testing

### Week 2
- [ ] Phase 2C: StateCourtRules implementation
- [ ] Phase 2D: StateStatutes implementation
- [ ] Integration testing

### Week 3
- [ ] Final testing and validation
- [ ] Documentation updates
- [ ] Production deployment

---

## Notes

- Always test snippet extraction quality for domain-specific content
- Ensure highlights capture legally significant text
- Maintain backward compatibility with `include_text` parameter
- Document token savings in each implementation
- Consider caching frequently requested full texts

---

## Completion Tracking

### Overall Progress
- [ ] Phase 1 Complete (EPA & PTAB)
- [ ] Phase 2 Complete (State Court Rules & Statutes)
- [ ] All tool definitions updated
- [ ] Integration testing passed
- [ ] Documentation updated
- [ ] Production deployed

**Last Updated**: [Date]
**Status**: Planning Phase
**Next Action**: Begin Phase 1A - EPA Implementation
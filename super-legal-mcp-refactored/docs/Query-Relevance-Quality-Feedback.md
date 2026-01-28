# Query-Relevance Quality Feedback System

## Core Concept
The quality feedback should assess **how well the search results answer the user's specific query**, not just generic quality metrics. Claude's intelligence layer can determine this alignment between query intent and returned content.

## Universal Query-Relevance Assessment

### Base Implementation for All WebSearch Clients
```javascript
class QueryRelevanceAssessor {
  /**
   * Assess how well results match the user's query intent
   * Claude can analyze this relationship intelligently
   */
  assessQueryRelevance(userQuery, searchResults, toolArgs) {
    return {
      _search_quality: {
        // Primary: How well do results match query?
        query_relevance: this.calculateQueryAlignment(userQuery, searchResults),
        
        // Coverage: Did we find enough relevant material?
        query_coverage: this.assessQueryCoverage(userQuery, searchResults),
        
        // Confidence: How confident are we in these results for THIS query?
        answer_confidence: this.calculateAnswerConfidence(userQuery, searchResults),
        
        // Actionable suggestions for THIS specific query
        query_suggestions: this.generateQuerySpecificSuggestions(userQuery, searchResults, toolArgs),
        
        // Query-specific metadata
        query_analysis: {
          query_type: this.classifyQueryType(userQuery),
          query_intent: this.identifyQueryIntent(userQuery),
          results_alignment: this.measureAlignment(userQuery, searchResults),
          gaps_identified: this.identifyGaps(userQuery, searchResults)
        }
      }
    };
  }

  /**
   * Calculate how well results align with query terms and concepts
   */
  calculateQueryAlignment(query, results) {
    // Claude can assess if results actually address the query
    const indicators = {
      direct_matches: this.countDirectMatches(query, results),
      conceptual_matches: this.assessConceptualAlignment(query, results),
      query_answered: this.isQueryAnswered(query, results)
    };
    
    // Composite assessment
    if (indicators.query_answered && indicators.direct_matches > 0.7) {
      return "high - results directly address the query";
    } else if (indicators.conceptual_matches > 0.5) {
      return "medium - results partially address the query";
    } else if (indicators.direct_matches > 0.3) {
      return "low - limited relevance to query";
    } else {
      return "none - results don't address the query";
    }
  }

  /**
   * Assess if we have sufficient coverage for the query
   */
  assessQueryCoverage(query, results) {
    const queryComponents = this.extractQueryComponents(query);
    const coveredComponents = this.identifyCoveredComponents(queryComponents, results);
    
    const coverageRatio = coveredComponents.length / queryComponents.length;
    
    if (coverageRatio === 1) {
      return "complete - all aspects of query addressed";
    } else if (coverageRatio >= 0.75) {
      return "substantial - most query aspects covered";
    } else if (coverageRatio >= 0.5) {
      return "partial - some query aspects missing";
    } else {
      return "minimal - many query aspects not found";
    }
  }

  /**
   * Generate suggestions specific to THIS query
   */
  generateQuerySpecificSuggestions(query, results, args) {
    const suggestions = [];
    const queryIntent = this.identifyQueryIntent(query);
    const gaps = this.identifyGaps(query, results);
    
    // Suggestions based on what's MISSING for this query
    if (gaps.length > 0) {
      suggestions.push(`Missing information about: ${gaps.join(', ')}`);
    }
    
    // Suggestions based on query type
    switch(queryIntent.type) {
      case 'comparison':
        if (!args.date_range) {
          suggestions.push("Add date range to compare periods");
        }
        break;
      case 'specific_case':
        if (results.length > 10) {
          suggestions.push("Use exact case name or citation for precision");
        }
        break;
      case 'trend_analysis':
        if (!args.date_after) {
          suggestions.push("Specify date_after to analyze recent trends");
        }
        break;
      case 'comprehensive':
        if (args.limit < 10) {
          suggestions.push("Increase limit for comprehensive coverage");
        }
        break;
    }
    
    return suggestions.filter(s => s).join("; ");
  }
}
```

## Module-Specific Query Relevance

### 1. CourtListenerWebSearchClient
```javascript
assessCaseLawQueryRelevance(userQuery, results) {
  const queryAnalysis = {
    // What is the user looking for?
    seeks_precedent: /precedent|binding|mandatory/.test(userQuery),
    seeks_specific_case: /\bv\.\s|\d+\s+\w+\.\s+\d+/.test(userQuery),
    seeks_circuit_split: /circuit split|conflict|disagreement/.test(userQuery),
    seeks_recent_developments: /recent|latest|new|2024|2025/.test(userQuery),
    jurisdiction_specified: /\b(9th|first|second|circuit|district)\b/i.test(userQuery)
  };
  
  return {
    _search_quality: {
      query_relevance: this.assessCaseLawAlignment(queryAnalysis, results),
      query_coverage: this.assessJurisdictionalCoverage(queryAnalysis, results),
      answer_confidence: this.calculateLegalConfidence(queryAnalysis, results),
      query_suggestions: this.generateCaseLawSuggestions(queryAnalysis, results),
      query_analysis: {
        query_type: "case_law_search",
        intent: queryAnalysis,
        found_binding_precedent: this.hasBindingPrecedent(queryAnalysis, results),
        found_persuasive_authority: this.hasPersuasiveAuthority(results),
        jurisdictional_match: this.checkJurisdictionalMatch(queryAnalysis, results)
      }
    }
  };
}

assessCaseLawAlignment(queryAnalysis, results) {
  // Does what we found answer what the user asked?
  if (queryAnalysis.seeks_specific_case) {
    const foundExactCase = results.some(r => 
      this.isExactCaseMatch(queryAnalysis.userQuery, r)
    );
    return foundExactCase 
      ? "high - exact case found" 
      : "low - specific case not found";
  }
  
  if (queryAnalysis.seeks_circuit_split) {
    const hasConflictingOpinions = this.identifyConflicts(results);
    return hasConflictingOpinions 
      ? "high - circuit split identified"
      : "low - no conflicting authorities found";
  }
  
  // General case law search
  const relevantCases = results.filter(r => 
    this.isRelevantToQuery(queryAnalysis.userQuery, r)
  );
  
  const relevanceRatio = relevantCases.length / results.length;
  if (relevanceRatio > 0.8) return "high - cases directly on point";
  if (relevanceRatio > 0.5) return "medium - some relevant cases";
  return "low - few cases address the query";
}
```

### 2. SECWebSearchClient
```javascript
assessSecuritiesQueryRelevance(userQuery, results) {
  const queryAnalysis = {
    // What SEC information does the user need?
    seeks_specific_filing: /10-K|10-Q|8-K|DEF 14A|S-1/.test(userQuery),
    seeks_company_info: this.extractCompanyName(userQuery),
    seeks_time_period: this.extractTimePeriod(userQuery),
    seeks_material_event: /material|significant|major|acquisition|merger/.test(userQuery),
    seeks_insider_trading: /insider|Form 4|beneficial owner/.test(userQuery)
  };
  
  return {
    _search_quality: {
      query_relevance: this.assessFilingAlignment(queryAnalysis, results),
      query_coverage: this.assessFilingCompleteness(queryAnalysis, results),
      answer_confidence: this.calculateSecuritiesConfidence(queryAnalysis, results),
      query_suggestions: this.generateSecuritiesSuggestions(queryAnalysis, results),
      query_analysis: {
        query_type: "securities_filing_search",
        intent: queryAnalysis,
        found_target_company: this.foundTargetCompany(queryAnalysis, results),
        found_filing_type: this.foundRequestedFiling(queryAnalysis, results),
        time_period_matched: this.timePeriodsMatch(queryAnalysis, results),
        material_events_found: this.identifyMaterialEvents(results)
      }
    }
  };
}
```

### 3. FederalRegisterWebSearchClient
```javascript
assessRegulatoryQueryRelevance(userQuery, results) {
  const queryAnalysis = {
    // What regulatory information is sought?
    seeks_proposed_rule: /proposed rule|comment period|NPRM/.test(userQuery),
    seeks_final_rule: /final rule|effective date|codified/.test(userQuery),
    seeks_specific_agency: this.extractAgency(userQuery),
    seeks_cfr_section: /\d+\s+CFR\s+[\d.]+/.test(userQuery),
    seeks_comment_opportunity: /comment|public input|feedback/.test(userQuery)
  };
  
  return {
    _search_quality: {
      query_relevance: this.assessRegulatoryAlignment(queryAnalysis, results),
      query_coverage: this.assessRuleCoverage(queryAnalysis, results),
      answer_confidence: this.calculateRegulatoryConfidence(queryAnalysis, results),
      query_suggestions: this.generateRegulatorySuggestions(queryAnalysis, results),
      query_analysis: {
        query_type: "regulatory_search",
        intent: queryAnalysis,
        found_target_rule: this.foundTargetRule(queryAnalysis, results),
        agency_match: this.agencyMatches(queryAnalysis, results),
        comment_periods_open: this.identifyOpenComments(results),
        regulatory_timeline: this.extractTimeline(results)
      }
    }
  };
}
```

### 4. EPAWebSearchClient
```javascript
assessEnvironmentalQueryRelevance(userQuery, results) {
  const queryAnalysis = {
    // What environmental data is needed?
    seeks_violations: /violation|non-compliance|exceedance/.test(userQuery),
    seeks_specific_facility: this.extractFacilityName(userQuery),
    seeks_company_compliance: this.extractCompanyName(userQuery),
    seeks_geographic_area: this.extractLocation(userQuery),
    seeks_enforcement: /enforcement|penalty|fine|action/.test(userQuery),
    pollutant_of_interest: this.extractPollutants(userQuery)
  };
  
  return {
    _search_quality: {
      query_relevance: this.assessComplianceAlignment(queryAnalysis, results),
      query_coverage: this.assessFacilityCoverage(queryAnalysis, results),
      answer_confidence: this.calculateEnvironmentalConfidence(queryAnalysis, results),
      query_suggestions: this.generateComplianceSuggestions(queryAnalysis, results),
      query_analysis: {
        query_type: "environmental_compliance",
        intent: queryAnalysis,
        found_target_facility: this.foundTargetFacility(queryAnalysis, results),
        violations_identified: this.violationsFound(queryAnalysis, results),
        geographic_match: this.geographicMatch(queryAnalysis, results),
        enforcement_actions: this.enforcementFound(results)
      }
    }
  };
}
```

## Universal Query Intent Classification

```javascript
class QueryIntentClassifier {
  classifyQueryType(query) {
    const patterns = {
      // Information seeking patterns
      specific_lookup: /^(what is|find|get|show me|retrieve)\s+(\w+\s+)?(specific|exact|particular)/i,
      comparison: /(compare|versus|vs\.|difference between|contrast)/i,
      trend_analysis: /(trend|over time|historical|evolution|development|changes)/i,
      comprehensive: /(all|every|complete|comprehensive|exhaustive|full)/i,
      recent_updates: /(latest|recent|new|current|updated|since)/i,
      
      // Legal patterns
      precedent_search: /(precedent|binding|mandatory authority|controlling)/i,
      statutory_interpretation: /(statute|USC|interpretation|legislative)/i,
      regulatory_compliance: /(regulation|CFR|compliance|requirement)/i,
      
      // Business patterns
      due_diligence: /(due diligence|investigation|background|history)/i,
      risk_assessment: /(risk|liability|exposure|potential issues)/i,
      competitor_analysis: /(competitor|market|industry analysis)/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        return type;
      }
    }
    
    return 'general_search';
  }
  
  identifyQueryIntent(query) {
    return {
      type: this.classifyQueryType(query),
      entities: this.extractEntities(query),
      time_scope: this.extractTimeScope(query),
      geographic_scope: this.extractGeographicScope(query),
      depth_required: this.assessDepthRequired(query),
      urgency: this.assessUrgency(query)
    };
  }
  
  identifyGaps(query, results) {
    const gaps = [];
    const queryComponents = this.extractQueryComponents(query);
    const resultComponents = this.extractResultComponents(results);
    
    // What did the user ask for that we didn't find?
    queryComponents.forEach(component => {
      if (!resultComponents.has(component.type)) {
        gaps.push(component.description);
      }
    });
    
    return gaps;
  }
}
```

## Query-Result Alignment Scoring

```javascript
class QueryResultAligner {
  /**
   * Measure how well results align with query
   * This is what Claude's intelligence evaluates
   */
  measureAlignment(query, results) {
    const alignment = {
      // Direct term matching
      term_overlap: this.calculateTermOverlap(query, results),
      
      // Semantic alignment (concepts match even if words differ)
      semantic_similarity: this.calculateSemanticSimilarity(query, results),
      
      // Temporal alignment (dates match query timeframe)
      temporal_alignment: this.calculateTemporalAlignment(query, results),
      
      // Geographic alignment (locations match)
      geographic_alignment: this.calculateGeographicAlignment(query, results),
      
      // Entity alignment (companies, people, cases match)
      entity_alignment: this.calculateEntityAlignment(query, results),
      
      // Intent fulfillment (did we answer the actual question?)
      intent_fulfilled: this.assessIntentFulfillment(query, results)
    };
    
    // Weighted scoring
    const weights = {
      term_overlap: 0.2,
      semantic_similarity: 0.25,
      temporal_alignment: 0.1,
      geographic_alignment: 0.1,
      entity_alignment: 0.15,
      intent_fulfilled: 0.2
    };
    
    const score = Object.entries(alignment).reduce((total, [key, value]) => {
      return total + (value * weights[key]);
    }, 0);
    
    return {
      overall_score: score,
      breakdown: alignment,
      interpretation: this.interpretScore(score)
    };
  }
  
  interpretScore(score) {
    if (score >= 0.8) return "Excellent match - results directly answer the query";
    if (score >= 0.6) return "Good match - results substantially address the query";
    if (score >= 0.4) return "Partial match - some relevant information found";
    if (score >= 0.2) return "Weak match - limited relevance to query";
    return "Poor match - results don't address the query";
  }
}
```

## Dynamic Suggestion Generation

```javascript
class QuerySpecificSuggestionGenerator {
  generateSuggestions(query, results, alignment) {
    const suggestions = [];
    
    // Based on gaps in alignment
    if (alignment.temporal_alignment < 0.5) {
      suggestions.push(this.generateTemporalSuggestion(query));
    }
    
    if (alignment.entity_alignment < 0.5) {
      suggestions.push(this.generateEntitySuggestion(query));
    }
    
    if (alignment.semantic_similarity < 0.3) {
      suggestions.push(this.generateSemanticSuggestion(query));
    }
    
    // Based on query intent vs results
    const intent = this.identifyQueryIntent(query);
    const intentGaps = this.identifyIntentGaps(intent, results);
    
    if (intentGaps.length > 0) {
      suggestions.push(...this.generateIntentSuggestions(intentGaps));
    }
    
    // Filter and prioritize
    return this.prioritizeSuggestions(suggestions, query, results);
  }
  
  generateTemporalSuggestion(query) {
    if (/recent|latest|current/.test(query)) {
      return "Add date_after parameter for recent results";
    }
    if (/historical|evolution|over time/.test(query)) {
      return "Specify date range to track changes over time";
    }
    return "Consider adding temporal filters to match query timeframe";
  }
  
  generateEntitySuggestion(query) {
    const entities = this.extractEntities(query);
    if (entities.company) {
      return `Search specifically for "${entities.company}" with exact name or ticker`;
    }
    if (entities.person) {
      return `Add person name filter for "${entities.person}"`;
    }
    return "Use more specific entity names for precise results";
  }
  
  prioritizeSuggestions(suggestions, query, results) {
    // Rank suggestions by likely impact
    const scored = suggestions.map(s => ({
      text: s,
      impact: this.estimateImpact(s, query, results)
    }));
    
    // Return top 3 highest impact suggestions
    return scored
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(s => s.text)
      .join("; ");
  }
}
```

## Implementation Example

### Before (Generic Quality Assessment):
```javascript
_search_quality: {
  relevance: "high",  // Based on Exa scores
  coverage: "partial", // Based on limit vs total
  suggestion: "Consider adding date range"
}
```

### After (Query-Specific Assessment):
```javascript
_search_quality: {
  query_relevance: "medium - results partially address the query about recent EPA violations for BASF facilities",
  query_coverage: "partial - found 3 facilities but missing data on air quality violations specifically mentioned",
  answer_confidence: 0.65,
  query_suggestions: "Add pollutant='air' filter to find air quality violations; Specify date_after='2024-01-01' for recent violations as requested",
  query_analysis: {
    query_type: "environmental_compliance",
    query_intent: {
      company: "BASF",
      violation_type: "air quality",
      timeframe: "recent"
    },
    results_alignment: {
      company_match: true,
      violation_type_match: false,  // Missing air quality specific
      timeframe_match: false,        // Results include old data
      geographic_match: true
    },
    gaps_identified: ["air quality violations", "recent timeframe (2024)"]
  }
}
```

## Key Principles

1. **Query-Centric**: Everything relates back to "Does this answer what the user asked?"
2. **Intent-Aware**: Understand not just the words but the purpose behind the query
3. **Gap Identification**: Explicitly identify what's missing relative to the query
4. **Actionable Suggestions**: Provide specific parameter adjustments to better answer THIS query
5. **Transparent Scoring**: Show WHY results do or don't match the query

## Benefits for Claude Intelligence

This approach allows Claude to:
- Understand when to execute follow-up searches
- Identify when initial results are insufficient
- Provide transparent explanations to users about result quality
- Make intelligent decisions about tool parameter adjustments
- Know when to try alternative tools for better query matches

The quality feedback becomes a conversation between the tool and Claude about whether the user's actual question has been answered, not just whether the search executed successfully.
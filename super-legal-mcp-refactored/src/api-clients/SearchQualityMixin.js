/**
 * Search Quality Mixin for Query-Specific Relevance Assessment
 * Provides quality feedback methods focused on how well results answer user queries
 */

export class SearchQualityMixin {
  /**
   * Assess how well search results align with user query intent
   * @param {string} userQuery - Original user query
   * @param {Array} searchResults - Processed search results
   * @param {Object} toolArgs - Tool arguments used for search
   * @returns {Object} Quality metadata object
   */
  assessQueryRelevance(userQuery, searchResults, toolArgs) {
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    
    return {
      _search_quality: {
        query_relevance: this.calculateQueryAlignment(userQuery, searchResults),
        query_coverage: this.assessQueryCoverage(userQuery, searchResults, toolArgs),
        answer_confidence: this.calculateAnswerConfidence(userQuery, searchResults),
        query_suggestions: this.generateQuerySpecificSuggestions(userQuery, searchResults, toolArgs),
        query_analysis: {
          query_type: queryAnalysis.type,
          query_intent: queryAnalysis.intent,
          results_alignment: this.measureAlignment(userQuery, searchResults),
          gaps_identified: this.identifyGaps(userQuery, searchResults, toolArgs)
        }
      }
    };
  }

  /**
   * Analyze user query to understand intent and requirements
   * @param {string} query - User query
   * @returns {Object} Query analysis
   */
  analyzeUserQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Classify query type
    let type = 'general';
    if (/\bv\.\s|\d+\s+\w+\.\s+\d+|citation|precedent/.test(lowerQuery)) {
      type = 'case_law';
    } else if (/sec|10-k|10-q|8-k|filing|edgar/.test(lowerQuery)) {
      type = 'securities';
    } else if (/patent|uspto|prior art|inventor/.test(lowerQuery)) {
      type = 'patent';
    } else if (/regulation|cfr|federal register|agency/.test(lowerQuery)) {
      type = 'regulatory';
    } else if (/recent|latest|trend|2024|2025/.test(lowerQuery)) {
      type = 'temporal';
    }

    // Identify intent
    const intent = {
      seeks_specific_document: /specific|exact|particular/.test(lowerQuery),
      seeks_comprehensive_coverage: /all|comprehensive|complete|thorough/.test(lowerQuery),
      seeks_recent_developments: /recent|latest|new|current|2024|2025/.test(lowerQuery),
      seeks_comparison: /compare|versus|vs|difference|between/.test(lowerQuery),
      seeks_trend_analysis: /trend|pattern|over time|historical/.test(lowerQuery),
      has_jurisdiction_requirement: /\b(circuit|district|state|federal|9th|first|second)\b/i.test(query),
      has_temporal_requirement: /\b(since|after|before|from|until)\s+\d{4}/.test(query)
    };

    return { type, intent };
  }

  /**
   * Calculate how well results align with query intent
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @returns {string} Alignment rating
   */
  calculateQueryAlignment(userQuery, searchResults) {
    if (!searchResults || searchResults.length === 0) return 'none';
    
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    let alignmentScore = 0;
    let totalChecks = 0;

    // Check for specific document alignment
    if (queryAnalysis.intent.seeks_specific_document) {
      totalChecks++;
      const hasExactMatch = searchResults.some(r => 
        this.isExactDocumentMatch(userQuery, r)
      );
      if (hasExactMatch) alignmentScore++;
    }

    // Check temporal alignment
    if (queryAnalysis.intent.seeks_recent_developments) {
      totalChecks++;
      const hasRecentResults = this.hasRecentResults(searchResults, 365); // Last year
      if (hasRecentResults) alignmentScore++;
    }

    // Check jurisdiction alignment  
    if (queryAnalysis.intent.has_jurisdiction_requirement) {
      totalChecks++;
      const jurisdictionMatch = this.checkJurisdictionAlignment(userQuery, searchResults);
      if (jurisdictionMatch) alignmentScore++;
    }

    // Default relevance check based on result count and quality
    if (totalChecks === 0) {
      totalChecks = 1;
      alignmentScore = searchResults.length >= 3 ? 1 : 0.5;
    }

    const finalScore = alignmentScore / totalChecks;
    
    if (finalScore >= 0.8) return 'high';
    if (finalScore >= 0.5) return 'medium';
    if (finalScore >= 0.2) return 'low';
    return 'none';
  }

  /**
   * Assess how well results cover the user's query scope
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @param {Object} toolArgs - Tool arguments
   * @returns {string} Coverage assessment
   */
  assessQueryCoverage(userQuery, searchResults, toolArgs) {
    if (!searchResults || searchResults.length === 0) return 'none';
    
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    const gaps = this.identifyGaps(userQuery, searchResults, toolArgs);
    
    // Comprehensive query coverage check
    if (queryAnalysis.intent.seeks_comprehensive_coverage) {
      if (gaps.length === 0 && searchResults.length >= 10) return 'complete';
      if (gaps.length <= 1 && searchResults.length >= 5) return 'substantial';
      if (gaps.length <= 2) return 'partial';
      return 'minimal';
    }
    
    // Regular coverage assessment
    const requestedLimit = toolArgs?.limit || 10;
    const coverageRatio = searchResults.length / requestedLimit;
    
    if (coverageRatio >= 0.9 && gaps.length === 0) return 'complete';
    if (coverageRatio >= 0.7 && gaps.length <= 1) return 'substantial';
    if (coverageRatio >= 0.4 && gaps.length <= 2) return 'partial';
    if (coverageRatio >= 0.1) return 'minimal';
    return 'none';
  }

  /**
   * Calculate confidence in ability to answer user's query
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @returns {number} Confidence score 0-1
   */
  calculateAnswerConfidence(userQuery, searchResults) {
    if (!searchResults || searchResults.length === 0) return 0;
    
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    let confidence = 0;
    
    // Base confidence from result count
    const countConfidence = Math.min(searchResults.length / 5, 1) * 0.4;
    confidence += countConfidence;
    
    // Query alignment confidence
    const alignment = this.calculateQueryAlignment(userQuery, searchResults);
    const alignmentBonus = {
      'high': 0.4,
      'medium': 0.25,
      'low': 0.1,
      'none': 0
    }[alignment] || 0;
    confidence += alignmentBonus;
    
    // Temporal relevance confidence
    if (queryAnalysis.intent.seeks_recent_developments) {
      const recentBonus = this.hasRecentResults(searchResults, 180) ? 0.1 : -0.1;
      confidence += recentBonus;
    }
    
    // Specific document confidence
    if (queryAnalysis.intent.seeks_specific_document) {
      const specificBonus = searchResults.some(r => 
        this.isExactDocumentMatch(userQuery, r)
      ) ? 0.1 : -0.1;
      confidence += specificBonus;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate query-specific suggestions for improving results
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @param {Object} toolArgs - Tool arguments
   * @returns {string} Suggestions text
   */
  generateQuerySpecificSuggestions(userQuery, searchResults, toolArgs) {
    const suggestions = [];
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    const gaps = this.identifyGaps(userQuery, searchResults, toolArgs);
    
    // No results suggestions
    if (!searchResults || searchResults.length === 0) {
      suggestions.push("Try broader search terms or remove restrictive filters");
      if (toolArgs?.date_after) {
        suggestions.push("Remove date_after filter to include historical results");
      }
      return suggestions.join('; ');
    }
    
    // Gap-based suggestions
    gaps.forEach(gap => {
      switch (gap.type) {
        case 'temporal':
          suggestions.push(`Add ${gap.parameter} for ${gap.description}`);
          break;
        case 'jurisdictional':
          suggestions.push(`Search ${gap.jurisdiction} for complete coverage`);
          break;
        case 'document_type':
          suggestions.push(`Include ${gap.document_type} documents`);
          break;
        case 'scope':
          suggestions.push(gap.description);
          break;
      }
    });
    
    // Query type specific suggestions
    switch (queryAnalysis.type) {
      case 'case_law':
        if (!toolArgs?.court) {
          const courts = [...new Set(searchResults.map(r => r.court))].filter(Boolean);
          if (courts.length > 3) {
            suggestions.push(`Consider filtering by specific court (found ${courts.length} courts)`);
          }
        }
        break;
        
      case 'securities':
        if (!toolArgs?.filing_type) {
          suggestions.push("Specify filing_type (10-K, 10-Q, 8-K) for targeted results");
        }
        break;
        
      case 'regulatory':
        if (!toolArgs?.agency) {
          const agencies = [...new Set(searchResults.map(r => r.agency))].filter(Boolean);
          if (agencies.length > 2) {
            suggestions.push(`Filter by specific agency (found ${agencies.length} agencies)`);
          }
        }
        break;
    }
    
    // Limit-based suggestions
    if (searchResults.length === (toolArgs?.limit || 10)) {
      suggestions.push(`Increase limit beyond ${toolArgs?.limit || 10} for more comprehensive results`);
    }
    
    return suggestions.length > 0 ? suggestions.join('; ') : '';
  }

  /**
   * Identify gaps between query intent and current results
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @param {Object} toolArgs - Tool arguments
   * @returns {Array} Array of identified gaps
   */
  identifyGaps(userQuery, searchResults, toolArgs) {
    const gaps = [];
    const queryAnalysis = this.analyzeUserQuery(userQuery);
    
    // Temporal gaps
    if (queryAnalysis.intent.seeks_recent_developments && !this.hasRecentResults(searchResults, 180)) {
      gaps.push({
        type: 'temporal',
        parameter: 'date_after',
        description: 'recent developments coverage',
        severity: 'high'
      });
    }
    
    // Jurisdiction gaps
    if (queryAnalysis.intent.has_jurisdiction_requirement) {
      const missingJurisdictions = this.identifyMissingJurisdictions(userQuery, searchResults);
      missingJurisdictions.forEach(jurisdiction => {
        gaps.push({
          type: 'jurisdictional',
          jurisdiction: jurisdiction,
          description: `${jurisdiction} jurisdiction coverage`,
          severity: 'medium'
        });
      });
    }
    
    // Comprehensive coverage gaps
    if (queryAnalysis.intent.seeks_comprehensive_coverage) {
      if (searchResults.length < 10) {
        gaps.push({
          type: 'scope',
          description: 'Increase result limit for comprehensive coverage',
          severity: 'medium'
        });
      }
    }
    
    return gaps;
  }

  /**
   * Measure how well results align with query (0-1 score)
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results
   * @returns {number} Alignment score
   */
  measureAlignment(userQuery, searchResults) {
    const alignment = this.calculateQueryAlignment(userQuery, searchResults);
    return {
      'high': 0.9,
      'medium': 0.6,
      'low': 0.3,
      'none': 0
    }[alignment] || 0;
  }

  // Helper methods that can be overridden by specific clients
  
  /**
   * Check if result is an exact match for user query
   * @param {string} query - User query
   * @param {Object} result - Search result
   * @returns {boolean}
   */
  isExactDocumentMatch(query, result) {
    // Default implementation - can be overridden
    const queryLower = query.toLowerCase();
    const titleLower = (result.title || '').toLowerCase();
    return titleLower.includes(queryLower) || queryLower.includes(titleLower);
  }

  /**
   * Check if results contain recent documents
   * @param {Array} results - Search results
   * @param {number} daysThreshold - Days to consider "recent"
   * @returns {boolean}
   */
  hasRecentResults(results, daysThreshold = 365) {
    if (!results || results.length === 0) return false;
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    return results.some(result => {
      const resultDate = new Date(
        result.publication_date || 
        result.date_filed || 
        result.publishedDate || 
        result.date ||
        '1900-01-01'
      );
      return resultDate >= thresholdDate;
    });
  }

  /**
   * Check if results match jurisdiction requirements
   * @param {string} query - User query
   * @param {Array} results - Search results
   * @returns {boolean}
   */
  checkJurisdictionAlignment(query, results) {
    // Default implementation - can be overridden by specific clients
    const queryLower = query.toLowerCase();
    const hasJurisdictionKeyword = /\b(circuit|district|state|federal)\b/i.test(query);
    
    if (!hasJurisdictionKeyword) return true;
    
    return results.some(result => {
      const resultText = (result.title + ' ' + (result.court || '') + ' ' + (result.jurisdiction || '')).toLowerCase();
      return resultText.includes('circuit') || resultText.includes('district') || 
             resultText.includes('state') || resultText.includes('federal');
    });
  }

  /**
   * Identify missing jurisdictions based on query
   * @param {string} query - User query
   * @param {Array} results - Search results
   * @returns {Array} Missing jurisdictions
   */
  identifyMissingJurisdictions(query, results) {
    // Default implementation - can be overridden by specific clients
    const missing = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('federal') || queryLower.includes('circuit')) {
      const hasFederalResults = results.some(r => 
        (r.court || '').toLowerCase().includes('circuit') ||
        (r.jurisdiction || '').toLowerCase().includes('federal')
      );
      if (!hasFederalResults) missing.push('federal courts');
    }
    
    if (queryLower.includes('state')) {
      const hasStateResults = results.some(r => 
        (r.court || '').toLowerCase().includes('state') ||
        (r.jurisdiction || '').toLowerCase().includes('state')
      );
      if (!hasStateResults) missing.push('state courts');
    }
    
    return missing;
  }


  // ===== CONTENT-SPECIFIC QUALITY ASSESSMENT METHODS =====
  // Methods for assessing summary and text content quality (replaces highlights)

  /**
   * Assess content-specific quality metrics (summary or text)
   * Replaces assessHighlightSpecificQuality
   * @param {Array} results - Results with summary or text content
   * @param {string} originalQuery - Original search query
   * @param {string} strategyType - Content strategy type used
   * @returns {Object} Content quality assessment
   */
  assessContentSpecificQuality(results, originalQuery, strategyType) {
    if (!results || results.length === 0) {
      return {
        content_quality: 'none',
        extraction_confidence: 0,
        content_richness: 'empty',
        suggestions: ['No results to assess', 'Try broader search terms']
      };
    }

    const metrics = this.calculateContentMetrics(results, originalQuery);
    const contentAssessment = this.assessContent(results, originalQuery);
    
    return {
      content_quality: this.categorizeContentQuality(metrics.relevanceRatio, metrics.avgLength),
      extraction_confidence: this.calculateContentConfidence(metrics, contentAssessment),
      content_richness: contentAssessment.richness,
      coverage_completeness: this.assessContentCoverage(results, originalQuery),
      suggestions: this.generateContentSuggestions(metrics, contentAssessment, originalQuery, strategyType),
      metrics: {
        total_content_pieces: metrics.totalPieces,
        avg_content_length: metrics.avgLength,
        relevance_ratio: metrics.relevanceRatio,
        semantic_density: contentAssessment.semanticDensity,
        information_completeness: contentAssessment.completeness
      }
    };
  }

  /**
   * Calculate quantitative content metrics
   * Replaces calculateHighlightMetrics
   * @param {Array} results - Search results
   * @param {string} originalQuery - Original query
   * @returns {Object} Calculated metrics
   */
  calculateContentMetrics(results, originalQuery) {
    let totalPieces = 0;
    let totalLength = 0;
    let relevantPieces = 0;
    let substantivePieces = 0;

    const queryTerms = this.extractQueryTerms(originalQuery);

    for (const result of results) {
      // Get content from summary or text
      const content = result.summary || result.text || '';
      if (!content) continue;

      totalPieces++;
      const contentText = typeof content === 'object' ? JSON.stringify(content) : content;
      const length = contentText.length;
      totalLength += length;

      // Check relevance (contains query terms)
      const termMatches = queryTerms.filter(term => 
        contentText.toLowerCase().includes(term.toLowerCase())
      ).length;
      
      if (termMatches > 0) {
        relevantPieces++;
      }

      // Check if substantive (length + information density)
      if (length > 200 && this.hasInformationDensity(contentText)) {
        substantivePieces++;
      }
    }

    return {
      totalPieces,
      avgLength: totalPieces > 0 ? Math.round(totalLength / totalPieces) : 0,
      relevanceRatio: totalPieces > 0 ? relevantPieces / totalPieces : 0,
      substantiveRatio: totalPieces > 0 ? substantivePieces / totalPieces : 0,
      avgContentPerResult: results.length > 0 ? totalPieces / results.length : 0
    };
  }

  /**
   * Assess the content quality of summary/text
   * Replaces assessHighlightContent
   * @param {Array} results - Search results
   * @param {string} originalQuery - Original query
   * @returns {Object} Content assessment
   */
  assessContent(results, originalQuery) {
    let semanticDensity = 0;
    let informationTypes = new Set();
    let completeness = 0;

    const queryTerms = this.extractQueryTerms(originalQuery);
    let termCoverage = 0;
    let totalContent = 0;

    for (const result of results) {
      const content = result.summary || result.text || '';
      if (!content) continue;

      const contentText = typeof content === 'object' ? JSON.stringify(content) : content;
      totalContent++;

      // Semantic density (information-rich terms per word)
      const words = contentText.split(/\s+/).length;
      const infoTerms = this.countInformativeTerms(contentText);
      semanticDensity += words > 0 ? infoTerms / words : 0;

      // Information type detection
      this.detectInformationTypes(contentText, informationTypes);

      // Term coverage
      const contentLower = contentText.toLowerCase();
      const matchedTerms = queryTerms.filter(term => contentLower.includes(term.toLowerCase()));
      termCoverage += matchedTerms.length / Math.max(queryTerms.length, 1);
    }

    // Calculate averages and completeness
    const avgSemanticDensity = totalContent > 0 ? semanticDensity / totalContent : 0;
    const avgTermCoverage = totalContent > 0 ? termCoverage / totalContent : 0;
    
    // Completeness based on information diversity and term coverage
    completeness = (informationTypes.size / 5) * 0.6 + avgTermCoverage * 0.4;

    return {
      semanticDensity: Math.round(avgSemanticDensity * 100) / 100,
      informationTypes: Array.from(informationTypes),
      completeness: Math.min(completeness, 1.0),
      termCoverage: Math.round(avgTermCoverage * 100) / 100,
      richness: this.categorizeContentRichness(avgSemanticDensity, informationTypes.size)
    };
  }

  /**
   * Generate content-specific improvement suggestions
   * Replaces generateHighlightSuggestions
   * @param {Object} metrics - Content metrics
   * @param {Object} contentAssessment - Content assessment
   * @param {string} originalQuery - Original query
   * @param {string} strategyType - Strategy type used
   * @returns {Array} Improvement suggestions
   */
  generateContentSuggestions(metrics, contentAssessment, originalQuery, strategyType) {
    const suggestions = [];

    // Low content count
    if (metrics.totalPieces < 3) {
      suggestions.push('Increase result limit for more comprehensive coverage');
    }

    // Low relevance
    if (metrics.relevanceRatio < 0.5) {
      suggestions.push('Refine query terms to better match content');
    }

    // Short content
    if (metrics.avgLength < 150) {
      suggestions.push('Consider using text strategy for more detailed content');
    }

    // Low semantic density
    if (contentAssessment.semanticDensity < 0.15) {
      suggestions.push('Add domain-specific terms to query');
    }

    // Poor term coverage
    if (contentAssessment.termCoverage < 0.4) {
      suggestions.push('Align query more closely with expected content');
    }

    // Low information diversity
    if (contentAssessment.informationTypes.length < 3) {
      suggestions.push('Broaden query to capture diverse information types');
    }

    // Strategy-specific suggestions
    if (strategyType === 'summary_query' && metrics.avgLength < 200) {
      suggestions.push('Consider text strategy or schema-based extraction for more detail');
    }

    // Fallback suggestion
    if (suggestions.length === 0 && metrics.relevanceRatio < 0.8) {
      suggestions.push('Consider alternative search terms or filters');
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Assess content coverage completeness
   * Replaces assessHighlightCoverage
   * @param {Array} results - Search results
   * @param {string} originalQuery - Original query
   * @returns {string} Coverage assessment
   */
  assessContentCoverage(results, originalQuery) {
    const queryTerms = this.extractQueryTerms(originalQuery);
    let coveredTerms = new Set();
    let totalInformation = 0;

    for (const result of results) {
      const content = result.summary || result.text || '';
      if (!content) continue;

      const contentText = typeof content === 'object' ? JSON.stringify(content) : content;
      
      // Track covered query terms
      const contentLower = contentText.toLowerCase();
      queryTerms.forEach(term => {
        if (contentLower.includes(term.toLowerCase())) {
          coveredTerms.add(term);
        }
      });

      // Estimate information content
      totalInformation += this.estimateInformationContent(contentText);
    }

    const termCoverage = queryTerms.length > 0 ? coveredTerms.size / queryTerms.length : 0;
    const avgInformation = results.length > 0 ? totalInformation / results.length : 0;

    if (termCoverage >= 0.8 && avgInformation >= 0.7) return 'comprehensive';
    if (termCoverage >= 0.6 && avgInformation >= 0.5) return 'substantial';
    if (termCoverage >= 0.4 && avgInformation >= 0.3) return 'partial';
    return 'minimal';
  }

  /**
   * Calculate confidence in content-based extraction
   * Replaces calculateHighlightConfidence
   * @param {Object} metrics - Content metrics
   * @param {Object} contentAssessment - Content assessment
   * @returns {number} Confidence score (0-1)
   */
  calculateContentConfidence(metrics, contentAssessment) {
    let confidence = 0;

    // Base confidence from content quantity and quality
    if (metrics.totalPieces >= 5) confidence += 0.2;
    else if (metrics.totalPieces >= 2) confidence += 0.1;

    // Relevance contribution
    confidence += metrics.relevanceRatio * 0.3;

    // Content quality contribution
    confidence += contentAssessment.semanticDensity * 0.2;
    confidence += contentAssessment.completeness * 0.2;

    // Information diversity bonus
    if (contentAssessment.informationTypes.length >= 3) confidence += 0.1;

    return Math.min(Math.round(confidence * 100) / 100, 1.0);
  }

  // Helper methods for content assessment

  extractQueryTerms(query) {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !this.isStopWord(term));
  }

  hasInformationDensity(text) {
    // Check for numbers, proper nouns, technical terms
    const infoMarkers = /\d+|[A-Z][a-z]+|\$|%|Inc\.|Corp\.|LLC/g;
    const matches = (text.match(infoMarkers) || []).length;
    const words = text.split(/\s+/).length;
    return words > 0 && (matches / words) > 0.15;
  }

  countInformativeTerms(text) {
    // Count numbers, proper nouns, domain-specific terms
    const numbers = (text.match(/\d+/g) || []).length;
    const properNouns = (text.match(/\b[A-Z][a-z]+\b/g) || []).length;
    const technicalTerms = (text.match(/\b(section|regulation|act|code|filing|court|patent|claim)\b/gi) || []).length;
    
    return numbers + properNouns + technicalTerms;
  }

  detectInformationTypes(text, typesSet) {
    const textLower = text.toLowerCase();
    
    if (/\d{4}-\d{2}-\d{2}|\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(text)) typesSet.add('dates');
    if (/\$[\d,]+|\b\d+\s*(million|billion|thousand)\b/i.test(text)) typesSet.add('financial');
    if (/\b\d+\s+[A-Z][\w.]+\s+\d+\b/.test(text)) typesSet.add('citations');
    if (/court|judge|ruling|decision|opinion/i.test(text)) typesSet.add('judicial');
    if (/section|regulation|cfr|usc|act/i.test(text)) typesSet.add('regulatory');
    if (/patent|claim|inventor|prior art/i.test(text)) typesSet.add('intellectual_property');
    if (/(inc\.|corp\.|llc|company)/i.test(text)) typesSet.add('corporate');
  }

  categorizeContentQuality(relevanceRatio, avgLength) {
    if (relevanceRatio >= 0.8 && avgLength >= 300) return 'excellent';
    if (relevanceRatio >= 0.6 && avgLength >= 200) return 'good';
    if (relevanceRatio >= 0.4 && avgLength >= 100) return 'fair';
    return 'poor';
  }

  categorizeContentRichness(semanticDensity, infoTypeCount) {
    if (semanticDensity >= 0.2 && infoTypeCount >= 4) return 'rich';
    if (semanticDensity >= 0.15 && infoTypeCount >= 3) return 'moderate';
    if (semanticDensity >= 0.1 && infoTypeCount >= 2) return 'basic';
    return 'sparse';
  }

  estimateInformationContent(text) {
    // Estimate based on length, structure, and information density
    let score = 0;
    
    // Length component (diminishing returns)
    score += Math.min(text.length / 400, 0.4);
    
    // Structure component (sentences, punctuation)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
    score += Math.min(sentences / 5, 0.3);
    
    // Information density component
    score += Math.min(this.countInformativeTerms(text) / 10, 0.3);
    
    return Math.min(score, 1.0);
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word.toLowerCase());
  }
}

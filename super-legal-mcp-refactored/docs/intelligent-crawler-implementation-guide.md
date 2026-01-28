# Intelligent Document Crawler Implementation Guide

## Executive Summary

This document provides a comprehensive implementation guide for the **IntelligentCrawler** component - a new specialized tool that enables Claude to perform strategic, deep document extraction when initial searches return URLs but insufficient content. The IntelligentCrawler uses Exa's `/contents` endpoint to crawl specific high-value documents intelligently, avoiding wasteful crawling of portal pages or low-value content.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Implementation Specifications](#implementation-specifications)
4. [Integration with claude-server-v2](#integration-with-claude-server-v2)
5. [Decision Engine Logic](#decision-engine-logic)
6. [Domain-Specific Strategies](#domain-specific-strategies)
7. [Implementation Checklists](#implementation-checklists)
8. [Testing and Validation](#testing-and-validation)
9. [Performance Optimization](#performance-optimization)
10. [Maintenance and Updates](#maintenance-and-updates)

---

## Architecture Overview

### Component Hierarchy

```
IntelligentCrawler (extends BaseWebSearchClient)
├── CrawlDecisionEngine
│   ├── UrlAnalyzer
│   ├── CrawlPrioritizer  
│   └── ExtractionStrategySelector
├── DocumentExtractor
│   ├── PTABExtractor
│   ├── CourtOpinionExtractor
│   ├── SECFilingExtractor
│   └── GenericExtractor
├── CrawlCache
└── PerformanceMonitor
```

### Design Principles

1. **Claude-Controlled**: Claude decides when to invoke deep crawling
2. **Intelligent**: Only crawl high-value targets, skip portal pages
3. **Domain-Aware**: Different extraction strategies per document type
4. **Performance-Optimized**: Caching, rate limiting, selective crawling
5. **Transparent**: Clear logging and reasoning for crawl decisions

---

## Core Components

### 1. IntelligentCrawler Main Class

**File**: `src/api-clients/IntelligentCrawler.js`

```javascript
/**
 * Intelligent Document Crawler
 * Extends BaseWebSearchClient for strategic deep document extraction
 * 
 * Use Cases:
 * - PTAB decisions when search returns URL but needs full text
 * - Court opinions requiring complete analysis
 * - SEC filings needing specific section extraction
 * - Multi-page document analysis with citation following
 */

import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { CrawlDecisionEngine } from './crawl/CrawlDecisionEngine.js';
import { DocumentExtractor } from './crawl/DocumentExtractor.js';
import { CrawlCache } from './crawl/CrawlCache.js';
import { PerformanceMonitor } from './crawl/PerformanceMonitor.js';

export class IntelligentCrawler extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey = process.env.EXA_API_KEY) {
    super(rateLimiter, exaApiKey);
    
    // Initialize core components
    this.crawlDecisionEngine = new CrawlDecisionEngine();
    this.documentExtractor = new DocumentExtractor();
    this.crawlCache = new CrawlCache({ 
      maxSize: 1000, 
      ttl: 3600000 // 1 hour
    });
    this.performanceMonitor = new PerformanceMonitor();
    
    // Configuration
    this.config = {
      maxConcurrentCrawls: 3,
      crawlTimeoutMs: 30000,
      maxDocumentSize: 10 * 1024 * 1024, // 10MB
      retryAttempts: 2,
      retryDelay: 1000
    };
  }

  /**
   * Main intelligent crawling method
   * @param {Array<string>} urls - URLs to potentially crawl
   * @param {Object} context - Context about what Claude is looking for
   * @param {string} context.source_type - Type of document
   * @param {Array<string>} context.extraction_goals - What to extract
   * @param {number} context.max_depth - How deep to crawl (default: 0)
   * @param {Object} context.user_query - Original user question context
   * @returns {Promise<Object>} Crawl results with extracted content
   */
  async intelligentCrawl(urls, context) {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate inputs
      const validatedInputs = this.validateCrawlInputs(urls, context);
      if (!validatedInputs.isValid) {
        return this.createErrorResponse('INPUT_VALIDATION_FAILED', validatedInputs.errors);
      }

      // Step 2: Check cache for existing results
      const cacheResults = await this.checkCacheForUrls(urls, context);
      if (cacheResults.allCached) {
        this.performanceMonitor.recordCacheHit();
        return this.createSuccessResponse(cacheResults.data, { cached: true });
      }

      // Step 3: Evaluate which URLs should be crawled
      const crawlPlan = await this.crawlDecisionEngine.evaluate(urls, context);
      
      if (!crawlPlan.shouldCrawl) {
        return this.createSkippedResponse(crawlPlan.reason, crawlPlan.alternatives);
      }

      // Step 4: Execute crawl plan
      const crawlResults = await this.executeCrawlPlan(crawlPlan, context);
      
      // Step 5: Extract structured content
      const extractedContent = await this.documentExtractor.extractContent(
        crawlResults, 
        context.source_type,
        context.extraction_goals
      );

      // Step 6: Cache results and return
      await this.cacheCrawlResults(urls, extractedContent, context);
      
      this.performanceMonitor.recordSuccessfulCrawl(Date.now() - startTime);
      
      return this.createSuccessResponse(extractedContent, {
        crawled_urls: crawlPlan.targets.map(t => t.url),
        extraction_strategy: crawlPlan.strategy,
        performance: this.performanceMonitor.getLastCrawlMetrics()
      });

    } catch (error) {
      this.performanceMonitor.recordError(error);
      console.error('IntelligentCrawler error:', error);
      
      return this.createErrorResponse('CRAWL_EXECUTION_FAILED', {
        error: error.message,
        urls: urls,
        context: context
      });
    }
  }

  /**
   * Execute the approved crawl plan
   * @private
   */
  async executeCrawlPlan(crawlPlan, context) {
    const crawlTargets = crawlPlan.targets;
    const results = [];

    // Execute crawls in batches to respect rate limits
    const batches = this.chunkArray(crawlTargets, this.config.maxConcurrentCrawls);
    
    for (const batch of batches) {
      const batchPromises = batch.map(target => 
        this.crawlSingleTarget(target, context)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn(`Failed to crawl ${batch[index].url}:`, result.reason);
          results.push({
            url: batch[index].url,
            error: result.reason.message,
            content: null
          });
        }
      });

      // Rate limiting between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(this.config.retryDelay);
      }
    }

    return results;
  }

  /**
   * Crawl a single target using Exa Contents API
   * @private
   */
  async crawlSingleTarget(target, context) {
    // Apply rate limiting
    if (this.rateLimiter && typeof this.rateLimiter.enforce === 'function') {
      await this.rateLimiter.enforce();
    }

    const startTime = Date.now();
    
    try {
      // First, we need to get the Exa ID for the URL
      // This requires a search to get the ID, then contents call
      const searchResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.exaApiKey
        },
        body: JSON.stringify({
          query: `site:${new URL(target.url).hostname}`,
          numResults: 1,
          includeDomains: [new URL(target.url).hostname]
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Search API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const searchResult = searchData.results?.[0];
      
      if (!searchResult || !searchResult.id) {
        throw new Error('Could not find Exa ID for URL');
      }

      // Now get the full content using the ID
      const contentsResponse = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.exaApiKey
        },
        body: JSON.stringify({
          ids: [searchResult.id]
        })
      });

      if (!contentsResponse.ok) {
        throw new Error(`Contents API error: ${contentsResponse.status}`);
      }

      const contentsData = await contentsResponse.json();
      const content = contentsData.results?.[0];

      if (!content) {
        throw new Error('No content returned from Contents API');
      }

      return {
        url: target.url,
        title: content.title || searchResult.title,
        text: content.text,
        author: content.author,
        publishedDate: content.publishedDate,
        crawlTime: Date.now() - startTime,
        extractionStrategy: target.extractionStrategy,
        priority: target.priority
      };

    } catch (error) {
      throw new Error(`Failed to crawl ${target.url}: ${error.message}`);
    }
  }

  /**
   * Validate crawl inputs
   * @private
   */
  validateCrawlInputs(urls, context) {
    const errors = [];

    // Validate URLs
    if (!Array.isArray(urls) || urls.length === 0) {
      errors.push('URLs must be a non-empty array');
    }

    urls.forEach((url, index) => {
      try {
        new URL(url);
      } catch (e) {
        errors.push(`Invalid URL at index ${index}: ${url}`);
      }
    });

    // Validate context
    if (!context || typeof context !== 'object') {
      errors.push('Context must be an object');
    }

    if (!context.source_type) {
      errors.push('Context must include source_type');
    }

    const validSourceTypes = ['ptab_decision', 'court_opinion', 'sec_filing', 'federal_register', 'generic'];
    if (!validSourceTypes.includes(context.source_type)) {
      errors.push(`Invalid source_type. Must be one of: ${validSourceTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Create standardized response objects
   * @private
   */
  createSuccessResponse(data, metadata = {}) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: 'success',
          crawl_type: 'intelligent_document_crawl',
          extracted_content: data,
          metadata: metadata,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  createSkippedResponse(reason, alternatives = []) {
    return {
      content: [{
        type: "text", 
        text: JSON.stringify({
          status: 'skipped',
          reason: reason,
          alternatives: alternatives,
          message: 'Crawl was skipped based on intelligent evaluation'
        }, null, 2)
      }]
    };
  }

  createErrorResponse(errorType, details) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: 'error',
          error_type: errorType,
          details: details,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  /**
   * Utility methods
   * @private
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkCacheForUrls(urls, context) {
    // Implementation for cache checking
    const cacheKeys = urls.map(url => this.crawlCache.generateKey(url, context));
    const cachedResults = await Promise.all(
      cacheKeys.map(key => this.crawlCache.get(key))
    );
    
    const allCached = cachedResults.every(result => result !== null);
    
    return {
      allCached,
      data: allCached ? cachedResults : null
    };
  }

  async cacheCrawlResults(urls, extractedContent, context) {
    urls.forEach((url, index) => {
      const cacheKey = this.crawlCache.generateKey(url, context);
      this.crawlCache.set(cacheKey, extractedContent[index]);
    });
  }
}
```

### 2. Crawl Decision Engine

**File**: `src/api-clients/crawl/CrawlDecisionEngine.js`

```javascript
/**
 * Crawl Decision Engine
 * Intelligently evaluates which URLs are worth crawling based on:
 * - URL patterns and content indicators
 * - User context and extraction goals
 * - Performance and cost considerations
 * - Document type and expected value
 */

import { UrlAnalyzer } from './UrlAnalyzer.js';
import { ExtractionStrategySelector } from './ExtractionStrategySelector.js';

export class CrawlDecisionEngine {
  constructor() {
    this.urlAnalyzer = new UrlAnalyzer();
    this.strategySelector = new ExtractionStrategySelector();
    
    // Decision thresholds
    this.thresholds = {
      minCrawlScore: 0.6,
      maxLowPriorityTargets: 2,
      maxHighPriorityTargets: 5,
      minContentSizeBytes: 1000
    };
  }

  /**
   * Evaluate URLs for crawl worthiness
   * @param {Array<string>} urls - URLs to evaluate
   * @param {Object} context - User context and goals
   * @returns {Promise<Object>} Crawl plan with targets and reasoning
   */
  async evaluate(urls, context) {
    const evaluation = {
      shouldCrawl: false,
      targets: [],
      reason: '',
      alternatives: [],
      strategy: null,
      estimatedCost: 0,
      estimatedTime: 0
    };

    // Analyze each URL
    const urlAnalyses = await Promise.all(
      urls.map(url => this.urlAnalyzer.analyze(url, context))
    );

    // Score and prioritize URLs
    const scoredUrls = urlAnalyses.map(analysis => ({
      ...analysis,
      crawlScore: this.calculateCrawlScore(analysis, context),
      extractionStrategy: this.strategySelector.selectStrategy(analysis.documentType, context)
    }));

    // Filter URLs above threshold
    const viableTargets = scoredUrls.filter(url => 
      url.crawlScore >= this.thresholds.minCrawlScore
    );

    // Sort by priority and score
    viableTargets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return b.crawlScore - a.crawlScore;
    });

    // Apply limits
    const highPriorityTargets = viableTargets
      .filter(t => t.priority === 'high')
      .slice(0, this.thresholds.maxHighPriorityTargets);
    
    const lowPriorityTargets = viableTargets
      .filter(t => t.priority === 'low')
      .slice(0, this.thresholds.maxLowPriorityTargets);

    evaluation.targets = [...highPriorityTargets, ...lowPriorityTargets];

    // Determine if we should crawl
    if (evaluation.targets.length > 0) {
      evaluation.shouldCrawl = true;
      evaluation.strategy = this.determineOverallStrategy(evaluation.targets);
      evaluation.estimatedCost = this.estimateCrawlCost(evaluation.targets);
      evaluation.estimatedTime = this.estimateCrawlTime(evaluation.targets);
    } else {
      evaluation.reason = this.buildSkipReason(scoredUrls, context);
      evaluation.alternatives = this.suggestAlternatives(scoredUrls, context);
    }

    return evaluation;
  }

  /**
   * Calculate crawl score for a URL (0.0 to 1.0)
   * @private
   */
  calculateCrawlScore(urlAnalysis, context) {
    let score = 0.0;
    
    // Base score from document type
    const typeScores = {
      'decision_document': 0.9,
      'court_opinion': 0.85,
      'sec_filing': 0.8,
      'proceeding_page': 0.75,
      'docket_page': 0.7,
      'portal_page': 0.1,
      'api_documentation': 0.05,
      'generic': 0.3
    };
    
    score += typeScores[urlAnalysis.documentType] || 0.3;

    // Boost for specific extraction goals
    if (context.extraction_goals) {
      if (context.extraction_goals.includes('full_text') && urlAnalysis.hasFullText) {
        score += 0.2;
      }
      if (context.extraction_goals.includes('citations') && urlAnalysis.hasCitations) {
        score += 0.15;
      }
      if (context.extraction_goals.includes('parties') && urlAnalysis.hasPartyInfo) {
        score += 0.1;
      }
    }

    // Penalty for low-value indicators
    if (urlAnalysis.isPortalPage) score -= 0.6;
    if (urlAnalysis.isApiDocumentation) score -= 0.7;
    if (urlAnalysis.isStatisticalPage) score -= 0.5;

    // Boost for specific proceeding/case numbers in URL
    if (urlAnalysis.hasSpecificIdentifier) score += 0.15;

    // Boost for PDF documents (often full decisions)
    if (urlAnalysis.isPDF) score += 0.1;

    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Build explanation for why crawl was skipped
   * @private
   */
  buildSkipReason(scoredUrls, context) {
    const reasons = [];

    const belowThreshold = scoredUrls.filter(u => u.crawlScore < this.thresholds.minCrawlScore);
    if (belowThreshold.length > 0) {
      const avgScore = belowThreshold.reduce((sum, u) => sum + u.crawlScore, 0) / belowThreshold.length;
      reasons.push(`URLs scored below crawl threshold (avg: ${avgScore.toFixed(2)}, min required: ${this.thresholds.minCrawlScore})`);
    }

    const portalPages = scoredUrls.filter(u => u.isPortalPage);
    if (portalPages.length > 0) {
      reasons.push(`${portalPages.length} portal/index pages detected (low content value)`);
    }

    const duplicateTypes = this.findDuplicateTypes(scoredUrls);
    if (duplicateTypes.length > 0) {
      reasons.push(`Duplicate content types detected: ${duplicateTypes.join(', ')}`);
    }

    return reasons.join('. ');
  }

  /**
   * Suggest alternatives when crawling is skipped
   * @private
   */
  suggestAlternatives(scoredUrls, context) {
    const alternatives = [];

    // Suggest broader search if only portal pages found
    const hasOnlyPortalPages = scoredUrls.every(u => u.isPortalPage);
    if (hasOnlyPortalPages) {
      alternatives.push({
        action: 'broader_search',
        description: 'Try a more specific search query to find actual documents',
        example: `search_${context.source_type.split('_')[0]}_proceedings({ proceeding_number: "IPR2024-12345" })`
      });
    }

    // Suggest different extraction goals
    if (context.extraction_goals && context.extraction_goals.length === 1) {
      alternatives.push({
        action: 'expand_extraction_goals',
        description: 'Consider requesting additional extraction types',
        example: 'Include "metadata", "parties", and "citations" in extraction_goals'
      });
    }

    return alternatives;
  }

  findDuplicateTypes(scoredUrls) {
    const typeCounts = {};
    scoredUrls.forEach(url => {
      typeCounts[url.documentType] = (typeCounts[url.documentType] || 0) + 1;
    });
    
    return Object.keys(typeCounts).filter(type => typeCounts[type] > 2);
  }

  determineOverallStrategy(targets) {
    const strategies = targets.map(t => t.extractionStrategy);
    const strategyCounts = {};
    
    strategies.forEach(strategy => {
      strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    });

    // Return most common strategy
    return Object.keys(strategyCounts).reduce((a, b) => 
      strategyCounts[a] > strategyCounts[b] ? a : b
    );
  }

  estimateCrawlCost(targets) {
    // Estimate based on Exa API pricing and document complexity
    const baseCost = targets.length * 0.001; // Base API cost
    const complexityMultiplier = targets.reduce((sum, target) => {
      const multipliers = {
        'high': 1.5,
        'medium': 1.0,
        'low': 0.7
      };
      return sum + (multipliers[target.priority] || 1.0);
    }, 0);
    
    return baseCost * complexityMultiplier;
  }

  estimateCrawlTime(targets) {
    // Estimate in seconds
    const baseTime = targets.length * 2; // 2 seconds per target
    const complexityTime = targets.reduce((sum, target) => {
      const timeAdders = {
        'high': 3,
        'medium': 2,
        'low': 1
      };
      return sum + (timeAdders[target.priority] || 2);
    }, 0);

    return baseTime + complexityTime;
  }
}
```

### 3. URL Analyzer

**File**: `src/api-clients/crawl/UrlAnalyzer.js`

```javascript
/**
 * URL Analyzer
 * Analyzes URLs to determine document type, content indicators, and crawl value
 */

export class UrlAnalyzer {
  constructor() {
    // Document type patterns
    this.documentPatterns = {
      decision_document: [
        /decisions?/i,
        /orders?/i,
        /ruling/i,
        /opinion/i,
        /final[-_]written[-_]decision/i,
        /institution[-_]decision/i
      ],
      court_opinion: [
        /opinions?/i,
        /cases?/i,
        /judgments?/i,
        /orders?/i
      ],
      sec_filing: [
        /filings?/i,
        /10-[kq]/i,
        /8-k/i,
        /def[-_]14a/i,
        /edgar/i
      ],
      proceeding_page: [
        /(ipr|pgr|cbm|der)\d{4}-\d{5}/i,
        /proceeding/i,
        /trial/i
      ],
      portal_page: [
        /portal/i,
        /home/i,
        /index/i,
        /api[-_]catalog/i,
        /developer/i,
        /visualization/i
      ],
      api_documentation: [
        /api/i,
        /docs/i,
        /documentation/i,
        /swagger/i,
        /openapi/i
      ]
    };

    // Content indicators
    this.contentIndicators = {
      hasFullText: [/\.pdf$/i, /full[-_]text/i, /complete/i],
      hasCitations: [/citations?/i, /references?/i, /cited/i],
      hasPartyInfo: [/parties/i, /petitioner/i, /respondent/i, /plaintiff/i, /defendant/i],
      hasSpecificIdentifier: [
        /(ipr|pgr|cbm|der)\d{4}-\d{5}/i,
        /\d{2}-cv-\d{4,5}/i,
        /\d{4}-\d{4,6}/i
      ]
    };

    // Low-value indicators
    this.lowValueIndicators = [
      /statistics/i,
      /chart/i,
      /graph/i,
      /visualization/i,
      /dashboard/i,
      /report/i,
      /summary/i
    ];
  }

  /**
   * Analyze a URL for crawl characteristics
   * @param {string} url - URL to analyze
   * @param {Object} context - User context
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(url, context) {
    const parsedUrl = new URL(url);
    
    const analysis = {
      url: url,
      domain: parsedUrl.hostname,
      path: parsedUrl.pathname,
      documentType: this.determineDocumentType(url),
      priority: 'medium',
      
      // Content indicators
      hasFullText: this.checkPatterns(url, this.contentIndicators.hasFullText),
      hasCitations: this.checkPatterns(url, this.contentIndicators.hasCitations),
      hasPartyInfo: this.checkPatterns(url, this.contentIndicators.hasPartyInfo),
      hasSpecificIdentifier: this.checkPatterns(url, this.contentIndicators.hasSpecificIdentifier),
      
      // Document characteristics
      isPDF: url.toLowerCase().endsWith('.pdf'),
      isPortalPage: this.checkPatterns(url, this.documentPatterns.portal_page),
      isApiDocumentation: this.checkPatterns(url, this.documentPatterns.api_documentation),
      isStatisticalPage: this.checkPatterns(url, this.lowValueIndicators),
      
      // Domain-specific analysis
      domainTrust: this.assessDomainTrust(parsedUrl.hostname),
      expectedContentSize: this.estimateContentSize(url, context)
    };

    // Set priority based on analysis
    analysis.priority = this.determinePriority(analysis, context);

    return analysis;
  }

  /**
   * Determine document type from URL patterns
   * @private
   */
  determineDocumentType(url) {
    for (const [type, patterns] of Object.entries(this.documentPatterns)) {
      if (this.checkPatterns(url, patterns)) {
        return type;
      }
    }
    return 'generic';
  }

  /**
   * Check if URL matches any of the given patterns
   * @private
   */
  checkPatterns(url, patterns) {
    return patterns.some(pattern => pattern.test(url));
  }

  /**
   * Determine crawl priority based on analysis
   * @private
   */
  determinePriority(analysis, context) {
    // High priority conditions
    if (analysis.documentType === 'decision_document') return 'high';
    if (analysis.documentType === 'court_opinion') return 'high';
    if (analysis.hasSpecificIdentifier && context.extraction_goals?.includes('full_text')) return 'high';
    if (analysis.isPDF && analysis.documentType !== 'generic') return 'high';

    // Low priority conditions
    if (analysis.isPortalPage) return 'low';
    if (analysis.isApiDocumentation) return 'low';
    if (analysis.isStatisticalPage) return 'low';
    if (analysis.domainTrust < 0.5) return 'low';

    return 'medium';
  }

  /**
   * Assess trust level of domain (0.0 to 1.0)
   * @private
   */
  assessDomainTrust(domain) {
    const highTrustDomains = [
      'uspto.gov',
      'ptab.uspto.gov',
      'trials.uspto.gov',
      'courtlistener.com',
      'supremecourt.gov',
      'sec.gov',
      'edgar.sec.gov',
      'uscourts.gov'
    ];

    const mediumTrustDomains = [
      'google.com',
      'scholar.google.com',
      'justia.com',
      'findlaw.com'
    ];

    if (highTrustDomains.some(trusted => domain.includes(trusted))) return 1.0;
    if (mediumTrustDomains.some(trusted => domain.includes(trusted))) return 0.7;
    if (domain.endsWith('.gov')) return 0.9;
    if (domain.endsWith('.edu')) return 0.8;
    
    return 0.5; // Unknown domain
  }

  /**
   * Estimate expected content size in bytes
   * @private
   */
  estimateContentSize(url, context) {
    if (url.toLowerCase().endsWith('.pdf')) return 500000; // 500KB average for PDF
    
    const sizeEstimates = {
      'decision_document': 50000,  // 50KB
      'court_opinion': 40000,     // 40KB
      'sec_filing': 100000,       // 100KB
      'proceeding_page': 30000,   // 30KB
      'portal_page': 10000,       // 10KB
      'api_documentation': 5000,  // 5KB
      'generic': 20000            // 20KB
    };

    const documentType = this.determineDocumentType(url);
    return sizeEstimates[documentType] || sizeEstimates.generic;
  }
}
```

---

## Implementation Checklists

### Phase 1: Core Infrastructure ✅

#### 1.1 BaseWebSearchClient Integration
- [ ] **Verify BaseWebSearchClient is working** with existing modules (USPTO, EPA)
- [ ] **Confirm Exa API access** and rate limiting functionality
- [ ] **Test Exa `/contents` endpoint** with sample IDs
- [ ] **Document rate limiting requirements** for crawl operations

#### 1.2 Directory Structure Setup
- [ ] **Create crawl directory**: `src/api-clients/crawl/`
- [ ] **Verify imports work** for BaseWebSearchClient
- [ ] **Set up test directory**: `tests/crawl/`
- [ ] **Create documentation directory**: `docs/crawl/`

#### 1.3 Environment Configuration
- [ ] **Confirm EXA_API_KEY** is available
- [ ] **Test API key permissions** for both search and contents endpoints
- [ ] **Set up development/testing API keys** if needed
- [ ] **Document environment requirements**

### Phase 2: Core Components Implementation ✅

#### 2.1 IntelligentCrawler Main Class
- [ ] **Implement constructor** with all dependencies
- [ ] **Create main `intelligentCrawl` method** with full signature
- [ ] **Implement input validation** with comprehensive error handling
- [ ] **Add cache checking logic** before crawling
- [ ] **Implement Exa search-then-contents pattern** for URL crawling
- [ ] **Add response standardization** (success, error, skipped formats)
- [ ] **Implement batch crawling** with concurrency limits
- [ ] **Add comprehensive error handling** and logging

#### 2.2 CrawlDecisionEngine Implementation
- [ ] **Implement URL analysis** and scoring logic
- [ ] **Create crawl evaluation method** with threshold checks
- [ ] **Add priority system** (high/medium/low)
- [ ] **Implement skip reason generation** with alternatives
- [ ] **Add cost/time estimation** methods
- [ ] **Create strategy selection** logic
- [ ] **Add comprehensive decision logging**

#### 2.3 UrlAnalyzer Implementation
- [ ] **Define document type patterns** for all supported types
- [ ] **Implement content indicator detection** (full text, citations, etc.)
- [ ] **Add domain trust assessment** logic
- [ ] **Create priority determination** method
- [ ] **Implement content size estimation**
- [ ] **Add pattern matching utilities**
- [ ] **Create domain classification** system

#### 2.4 Supporting Components
- [ ] **Implement CrawlCache** with TTL and size limits
- [ ] **Create PerformanceMonitor** for metrics tracking
- [ ] **Implement DocumentExtractor** with strategy pattern
- [ ] **Add ExtractionStrategySelector** for domain-specific extraction
- [ ] **Create utility functions** (chunking, delays, validation)

### Phase 3: Tool Integration ✅

#### 3.1 Tool Definition
- [ ] **Create tool definition** in `toolDefinitions.js`
- [ ] **Define comprehensive input schema** with all parameters
- [ ] **Add parameter validation** and requirements
- [ ] **Create clear tool description** with usage examples
- [ ] **Add parameter documentation** with examples

#### 3.2 Tool Implementation Registration
- [ ] **Register tool** in `toolImplementations.js`
- [ ] **Create wrapper function** with error handling
- [ ] **Add conversation wrapper** integration
- [ ] **Implement parameter mapping** from args to crawler
- [ ] **Add response formatting** for MCP compatibility

#### 3.3 Server Registration
- [ ] **Register IntelligentCrawler** in `EnhancedLegalMcpServer.js`
- [ ] **Add to client initialization** with proper dependencies
- [ ] **Configure rate limiting** for crawler instance
- [ ] **Add to available tools** list
- [ ] **Test server startup** with new component

### Phase 4: claude-server-v2 Integration ✅

#### 4.1 Tool Enhancement
- [ ] **Add crawler to enhanced tools** in `enhanceToolDescription`
- [ ] **Create comprehensive usage guidance** with examples
- [ ] **Add when-to-use recommendations**
- [ ] **Add when-NOT-to-use warnings**
- [ ] **Include cost/performance guidance**

#### 4.2 Domain Classification
- [ ] **Add crawler to domain classification** system
- [ ] **Create specialized classifications** for crawl results
- [ ] **Add to legal domain mapping**
- [ ] **Update classification logic** for crawl-enhanced results

#### 4.3 System Prompt Integration
- [ ] **Add crawler usage protocol** to system prompt
- [ ] **Create tool chaining examples** (search → crawl → extract)
- [ ] **Add decision-making guidance** for Claude
- [ ] **Include performance considerations** in prompt

### Phase 5: Domain-Specific Strategies ✅

#### 5.1 PTAB Extraction Strategy
- [ ] **Implement PTAB-specific extraction** patterns
- [ ] **Add proceeding number extraction** from full documents
- [ ] **Create decision type classification** (institution, final, etc.)
- [ ] **Add party name extraction** from complete documents
- [ ] **Implement date extraction** for filing/decision dates
- [ ] **Add outcome extraction** (granted/denied/settled)

#### 5.2 Court Opinion Extraction Strategy
- [ ] **Implement court opinion parsing** patterns
- [ ] **Add citation extraction** from full opinions
- [ ] **Create holding identification** logic
- [ ] **Add judge/author extraction** 
- [ ] **Implement case parties extraction**
- [ ] **Add precedent identification**

#### 5.3 SEC Filing Extraction Strategy
- [ ] **Implement SEC document parsing** patterns
- [ ] **Add section-specific extraction** (10-K sections, etc.)
- [ ] **Create financial data extraction** logic
- [ ] **Add exhibits identification**
- [ ] **Implement risk factor extraction**

#### 5.4 Generic Extraction Strategy
- [ ] **Implement fallback extraction** for unknown types
- [ ] **Add basic metadata extraction** (title, author, date)
- [ ] **Create content summarization** logic
- [ ] **Add link/reference extraction**
- [ ] **Implement keyword extraction**

### Phase 6: Performance Optimization ✅

#### 6.1 Caching Implementation
- [ ] **Implement LRU cache** with configurable size
- [ ] **Add TTL-based expiration** for cached content
- [ ] **Create cache key generation** strategy
- [ ] **Add cache hit/miss metrics** tracking
- [ ] **Implement cache persistence** (optional)

#### 6.2 Rate Limiting
- [ ] **Integrate with existing rate limiters**
- [ ] **Add crawler-specific rate limiting**
- [ ] **Implement backoff strategies** for failures
- [ ] **Add concurrent crawl limiting**
- [ ] **Create rate limit monitoring**

#### 6.3 Performance Monitoring
- [ ] **Add crawl time tracking** per URL
- [ ] **Implement success/failure metrics**
- [ ] **Create cost tracking** per operation
- [ ] **Add cache performance metrics**
- [ ] **Implement performance alerting**

#### 6.4 Resource Management
- [ ] **Add memory usage monitoring**
- [ ] **Implement content size limits**
- [ ] **Add timeout handling** for slow crawls
- [ ] **Create resource cleanup** logic
- [ ] **Add graceful degradation** for failures

### Phase 7: Testing and Validation ✅

#### 7.1 Unit Tests
- [ ] **Test UrlAnalyzer** with various URL types
- [ ] **Test CrawlDecisionEngine** decision logic
- [ ] **Test IntelligentCrawler** main functionality
- [ ] **Test domain-specific extractors**
- [ ] **Test caching functionality**
- [ ] **Test error handling** scenarios

#### 7.2 Integration Tests
- [ ] **Test end-to-end crawl workflow**
- [ ] **Test tool integration** with MCP server
- [ ] **Test rate limiting** behavior
- [ ] **Test concurrent crawling**
- [ ] **Test cache persistence**
- [ ] **Test performance monitoring**

#### 7.3 Domain-Specific Tests
- [ ] **Test PTAB decision crawling** with real URLs
- [ ] **Test court opinion extraction** 
- [ ] **Test SEC filing parsing**
- [ ] **Test portal page detection** and skipping
- [ ] **Test PDF content extraction**

#### 7.4 Performance Tests
- [ ] **Test crawl performance** with various loads
- [ ] **Test memory usage** under load
- [ ] **Test cache performance** with different sizes
- [ ] **Test rate limiting** effectiveness
- [ ] **Test error recovery** scenarios

### Phase 8: Documentation and Deployment ✅

#### 8.1 Technical Documentation
- [ ] **Complete API documentation** for all classes
- [ ] **Document configuration options** and defaults
- [ ] **Create troubleshooting guide** 
- [ ] **Add performance tuning guide**
- [ ] **Document integration patterns**

#### 8.2 User Documentation
- [ ] **Create usage examples** for different scenarios
- [ ] **Document when to use crawler** vs. regular search
- [ ] **Add cost/performance guidelines**
- [ ] **Create best practices guide**
- [ ] **Document limitations** and workarounds

#### 8.3 Deployment Checklist
- [ ] **Test in staging environment**
- [ ] **Verify all dependencies** are available
- [ ] **Test with production API keys**
- [ ] **Monitor performance** after deployment
- [ ] **Set up alerting** for errors/performance issues

---

## Testing and Validation

### Test Scenarios

#### 1. PTAB Decision Crawling
```javascript
// Test Case: PTAB Decision Document
const testUrls = ['https://ptab.uspto.gov/decisions/IPR2023-00123-FWD.pdf'];
const testContext = {
  source_type: 'ptab_decision',
  extraction_goals: ['full_text', 'parties', 'holdings'],
  user_query: 'Get the full text of the final written decision for IPR2023-00123'
};

// Expected: Should crawl PDF and extract structured decision data
```

#### 2. Portal Page Detection
```javascript
// Test Case: Portal Page Should Be Skipped
const testUrls = ['https://developer.uspto.gov/ptab-web/'];
const testContext = {
  source_type: 'ptab_decision',
  extraction_goals: ['metadata']
};

// Expected: Should skip crawl and suggest alternatives
```

#### 3. Mixed URL Types
```javascript
// Test Case: Mixed High/Low Value URLs
const testUrls = [
  'https://ptab.uspto.gov/decisions/IPR2023-00123-FWD.pdf', // High value
  'https://developer.uspto.gov/api-catalog/', // Low value
  'https://trials.uspto.gov/IPR2023-00123' // Medium value
];

// Expected: Should crawl decision PDF and trial page, skip API catalog
```

### Performance Benchmarks

#### Expected Performance Metrics
- **URL Analysis**: < 50ms per URL
- **Crawl Decision**: < 100ms for 10 URLs
- **Single Document Crawl**: < 5 seconds
- **Batch Crawl (5 URLs)**: < 15 seconds
- **Cache Hit Response**: < 10ms
- **Memory Usage**: < 50MB for typical operation

#### Load Testing Scenarios
1. **Concurrent Crawls**: 5 simultaneous crawl requests
2. **Large Batch**: 20 URLs in single request
3. **Cache Stress**: 1000 cache operations
4. **Error Recovery**: Network failures during crawl
5. **Rate Limiting**: Sustained high-frequency requests

---

## Performance Optimization

### Caching Strategy

```javascript
// Cache Configuration
const cacheConfig = {
  maxSize: 1000,           // Maximum cache entries
  ttl: 3600000,           // 1 hour TTL
  cleanup: 300000,        // Cleanup every 5 minutes
  serializationThreshold: 1000000 // 1MB max serialized size
};

// Cache Key Strategy
generateCacheKey(url, context) {
  const key = `crawl:${this.hashUrl(url)}:${this.hashContext(context)}`;
  return key;
}
```

### Rate Limiting Integration

```javascript
// Rate Limiter Configuration
const rateLimitConfig = {
  searchRequests: {
    maxRequests: 10,
    windowMs: 60000  // 10 requests per minute
  },
  contentRequests: {
    maxRequests: 5,
    windowMs: 60000  // 5 content requests per minute
  },
  concurrentCrawls: 3  // Max 3 simultaneous crawls
};
```

### Resource Management

```javascript
// Resource Limits
const resourceLimits = {
  maxDocumentSize: 10 * 1024 * 1024,  // 10MB
  crawlTimeout: 30000,                // 30 seconds
  maxRetries: 2,                      // Retry failed crawls twice
  retryDelay: 1000,                   // 1 second between retries
  maxMemoryUsage: 100 * 1024 * 1024   // 100MB total
};
```

---

## Maintenance and Updates

### Monitoring Requirements

1. **Performance Monitoring**
   - Crawl success/failure rates
   - Average crawl times
   - Cache hit/miss ratios
   - Memory usage trends

2. **Cost Monitoring**
   - Exa API usage tracking
   - Cost per crawl operation
   - Daily/monthly usage reports

3. **Quality Monitoring**
   - Extraction accuracy rates
   - Content relevance scores
   - User satisfaction metrics

### Update Procedures

1. **Pattern Updates**
   - Regularly review URL patterns for new document types
   - Update extraction patterns based on site changes
   - Add new domain trust assessments

2. **Performance Tuning**
   - Adjust cache sizes based on usage patterns
   - Optimize crawl batch sizes
   - Fine-tune decision thresholds

3. **Feature Enhancements**
   - Add new extraction strategies for new document types
   - Implement additional content indicators
   - Enhance decision engine logic

---

## Conclusion

This implementation guide provides a comprehensive roadmap for creating the IntelligentCrawler component. The system is designed to be:

- **Intelligent**: Only crawls high-value targets
- **Efficient**: Caches results and respects rate limits
- **Extensible**: Easy to add new document types and extraction strategies
- **Transparent**: Clear logging and decision reasoning
- **Performant**: Optimized for speed and resource usage

The implementation should be done in phases, with thorough testing at each stage. The checklist format ensures nothing is missed, and the detailed code examples provide clear implementation guidance.

**Next Steps**: Begin with Phase 1 (Core Infrastructure) and work through each phase systematically, using the checklists to ensure complete implementation.
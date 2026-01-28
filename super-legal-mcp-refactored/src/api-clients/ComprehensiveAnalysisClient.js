/**
 * Comprehensive Analysis Client
 * Handles cross-API comprehensive legal entity analysis
 * Updated to use WebSearch clients for CourtListener and SEC
 */

export class ComprehensiveAnalysisClient {
  constructor(clients) {
    // Use WebSearch clients for migrated services
    this.courtListenerClient = clients.courtListener; // Now receives CourtListenerWebSearchClient
    this.secEdgarClient = clients.secEdgar; // Now receives SECWebSearchClient
    this.federalRegisterClient = clients.federalRegister;
    this.usptoClient = clients.uspto;
  }

  async comprehensiveLegalEntityAnalysis(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      entity_name,
      entity_type,
      analysis_scope = ["all"],
      date_range_years = 5,
      include_relationships = true
    } = args;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - date_range_years);

    const includeAll = analysis_scope.includes("all");
    const results = {
      entity: entity_name,
      type: entity_type,
      analysis_date: endDate.toISOString(),
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };

    try {
      // Parallel execution of all searches
      const searches = [];

      // 1. CourtListener cases (litigation) - using WebSearch client
      if (includeAll || analysis_scope.includes("litigation")) {
        searches.push(
          this.courtListenerClient.searchOpinionsWeb({
            query: entity_name,
            date_after: startDate.toISOString().split('T')[0],
            limit: 20,
            include_text: false // Use snippets for comprehensive analysis
          }).then(result => ({ type: 'litigation', data: result }))
          .catch(error => ({ type: 'litigation', error: error.message }))
        );
      }

      // 2. SEC filings (if company) - using WebSearch client
      if ((includeAll || analysis_scope.includes("securities")) && 
          (entity_type === "company" || entity_type === "organization")) {
        searches.push(
          this.secEdgarClient.searchSECFilingsWeb({
            company_identifier: entity_name,
            date_after: startDate.toISOString().split('T')[0],
            include_snippet: true, // Use snippets for comprehensive analysis
            limit: 15
          }).then(result => ({ type: 'securities', data: result }))
          .catch(error => ({ type: 'securities', error: error.message }))
        );
      }

      // 3. Federal Register mentions (regulatory)
      if (includeAll || analysis_scope.includes("regulatory")) {
        searches.push(
          this.federalRegisterClient.searchFederalRegisterWeb({
            query: entity_name,
            date_range: `${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}`,
            limit: 15
          }).then(result => ({ type: 'regulatory', data: result }))
          .catch(error => ({ type: 'regulatory', error: error.message }))
        );
      }

      // 4. USPTO patents (if relevant)
      if (includeAll || analysis_scope.includes("patents")) {
        searches.push(
          this.usptoClient.searchPatentsWeb({
            query_type: "patents",
            assignee_organization: entity_name,
            patent_date_start: startDate.toISOString().split('T')[0],
            limit: 20
          }).then(result => ({ type: 'patents', data: result }))
          .catch(error => ({ type: 'patents', error: error.message }))
        );
      }

      // Execute all searches
      const searchResults = await Promise.allSettled(searches);

      // Process results
      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const searchResult = result.value;
          if (searchResult.error) {
            results[searchResult.type] = { error: searchResult.error };
          } else {
            results[searchResult.type] = searchResult.data.content[0] ? 
              JSON.parse(searchResult.data.content[0].text) : null;
          }
        } else {
          console.error(`Search failed:`, result.reason);
        }
      });

      // Generate cross-source insights
      results.insights = this.generateCrossSourceInsights(results);

      // Include relationship analysis if requested
      if (include_relationships) {
        results.relationships = await this.analyzeEntityRelationships(entity_name, results);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }

  generateCrossSourceInsights(results) {
    const insights = {
      risk_indicators: [],
      activity_summary: {},
      notable_patterns: []
    };

    // Analyze litigation data
    if (results.litigation && !results.litigation.error) {
      const caseCount = results.litigation.count || 0;
      insights.activity_summary.total_cases = caseCount;
      
      if (caseCount > 10) {
        insights.risk_indicators.push({
          type: 'high_litigation_volume',
          severity: 'medium',
          description: `Entity involved in ${caseCount} legal cases`
        });
      }
    }

    // Analyze SEC data
    if (results.securities && !results.securities.error) {
      const filingCount = results.securities.filings?.length || 0;
      insights.activity_summary.sec_filings = filingCount;
      
      if (results.securities.financial_facts) {
        insights.activity_summary.latest_financials = results.securities.financial_facts;
      }
    }

    // Analyze regulatory data
    if (results.regulatory && !results.regulatory.error) {
      const regCount = results.regulatory.count || 0;
      insights.activity_summary.regulatory_mentions = regCount;
      
      if (regCount > 5) {
        insights.notable_patterns.push({
          pattern: 'frequent_regulatory_attention',
          description: `Entity mentioned in ${regCount} federal register documents`
        });
      }
    }

    // Analyze patent data
    if (results.patents && !results.patents.error) {
      const patentCount = results.patents.total_hits || 0;
      insights.activity_summary.patents = patentCount;
      
      if (patentCount > 50) {
        insights.notable_patterns.push({
          pattern: 'significant_ip_portfolio',
          description: `Entity holds ${patentCount} patents`
        });
      }
    }

    return insights;
  }

  async analyzeEntityRelationships(entityName, data) {
    const relationships = {
      co_parties: [],
      regulatory_connections: [],
      patent_collaborators: []
    };

    // Extract co-parties from litigation
    if (data.litigation && data.litigation.results) {
      const parties = new Set();
      data.litigation.results.forEach((case_item) => {
        const caseName = case_item.case_name || '';
        const names = caseName.split(' v. ').map((n) => n.trim());
        names.forEach((name) => {
          if (name && !name.toLowerCase().includes(entityName.toLowerCase())) {
            parties.add(name);
          }
        });
      });
      relationships.co_parties = Array.from(parties).slice(0, 10);
    }

    return relationships;
  }
}
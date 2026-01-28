/**
 * SEC Tool Formatters
 * 
 * Formats results from SEC EDGAR API tools for conversation display
 */

export const secFormatter = {
  /**
   * Format sec_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const company = args.company || args.ticker || args.cik || 'companies';
    const query = args.query || 'SEC filing search';
    
    let summary = `📊 **SEC Filing Search Complete**\n\n`;
    summary += `Company: ${company}\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} filings\n\n`;
    
    if (count > 0) {
      summary += `Financial documents ready for analysis.`;
      
      // Add filing type breakdown if available
      if (Array.isArray(result) && result.length > 0) {
        const filingTypes = {};
        result.forEach(filing => {
          const form = filing.form || filing.filing_type || 'Unknown';
          filingTypes[form] = (filingTypes[form] || 0) + 1;
        });
        
        const topTypes = Object.entries(filingTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        
        if (topTypes.length > 0) {
          summary += `\n\n**Filing Types:**\n`;
          topTypes.forEach(([type, count]) => {
            summary += `• ${type}: ${count} filings\n`;
          });
        }
      }
    } else {
      summary += `No filings found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format SEC filings results
   */
  filings: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const company = args.company || args.cik || args.ticker || 'company';
    const filingType = args.filing_type || args.form || 'filings';
    
    let summary = `📄 **SEC Filings Retrieved**\n\n`;
    summary += `Company: ${company}\n`;
    summary += `Filing Type: ${filingType}\n`;
    summary += `Results: Found ${count} filings\n\n`;
    
    if (count > 0) {
      summary += `SEC filing documents available for analysis.`;
      
      // Add recent filing info if available
      if (Array.isArray(result) && result.length > 0) {
        const recentFiling = result[0];
        if (recentFiling.filing_date || recentFiling.date) {
          const date = new Date(recentFiling.filing_date || recentFiling.date);
          summary += `\n\n**Most Recent:** ${date.toLocaleDateString()}`;
        }
        
        if (recentFiling.description) {
          summary += `\n**Description:** ${recentFiling.description.slice(0, 100)}...`;
        }
      }
    } else {
      summary += `No ${filingType} filings found for ${company}.`;
    }
    
    return summary;
  },

  /**
   * Format SEC company search results
   */
  companySearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || args.company || 'company search';
    
    let summary = `🏢 **SEC Company Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} companies\n\n`;
    
    if (count > 0) {
      summary += `Company information available for analysis.`;
      
      // Add top company results
      if (Array.isArray(result) && result.length > 0) {
        const topCompanies = result.slice(0, 3);
        summary += `\n\n**Top Results:**\n`;
        topCompanies.forEach((company, index) => {
          const name = company.name || company.company_name || `Company ${index + 1}`;
          const ticker = company.ticker ? ` (${company.ticker})` : '';
          const cik = company.cik ? ` [CIK: ${company.cik}]` : '';
          summary += `${index + 1}. ${name}${ticker}${cik}\n`;
        });
      }
    } else {
      summary += `No companies found matching "${query}".`;
    }
    
    return summary;
  },

  /**
   * Format specific SEC filing analysis
   */
  filingAnalysis: (args, result) => {
    const company = args.company || 'company';
    const filingType = args.filing_type || args.form || 'filing';
    const hasAnalysis = result && (result.analysis || result.summary || result.key_metrics);
    
    let summary = `📈 **SEC Filing Analysis Complete**\n\n`;
    summary += `Company: ${company}\n`;
    summary += `Filing: ${filingType}\n`;
    summary += `Analysis: ${hasAnalysis ? 'Complete' : 'Basic extraction'}\n\n`;
    
    if (hasAnalysis) {
      summary += `Detailed financial analysis and key metrics extracted.`;
      
      // Add key metrics if available
      if (result.key_metrics) {
        summary += `\n\n**Key Metrics Extracted:**`;
        Object.entries(result.key_metrics).slice(0, 3).forEach(([metric, value]) => {
          summary += `\n• ${metric}: ${value}`;
        });
      }
    } else {
      summary += `Basic filing information extracted and available for review.`;
    }
    
    return summary;
  },

  /**
   * Format insider trading results
   */
  insiderTrading: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const company = args.company || args.ticker || 'company';
    
    let summary = `👔 **Insider Trading Search Complete**\n\n`;
    summary += `Company: ${company}\n`;
    summary += `Results: Found ${count} insider transactions\n\n`;
    
    if (count > 0) {
      summary += `Insider trading data available for compliance analysis.`;
      
      // Add transaction type breakdown
      if (Array.isArray(result) && result.length > 0) {
        const transactionTypes = {};
        result.forEach(transaction => {
          const type = transaction.transaction_type || transaction.type || 'Unknown';
          transactionTypes[type] = (transactionTypes[type] || 0) + 1;
        });
        
        if (Object.keys(transactionTypes).length > 0) {
          summary += `\n\n**Transaction Types:**\n`;
          Object.entries(transactionTypes).forEach(([type, count]) => {
            summary += `• ${type}: ${count} transactions\n`;
          });
        }
      }
    } else {
      summary += `No insider trading activity found for ${company}.`;
    }
    
    return summary;
  }
};
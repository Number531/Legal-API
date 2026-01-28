/**
 * Federal Register Tool Formatters
 * 
 * Formats results from Federal Register API tools for conversation display
 */

export const federalRegisterFormatter = {
  /**
   * Format federal_register_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'federal register search';
    
    let summary = `🏛️ **Federal Register Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} federal documents\n\n`;
    
    if (count > 0) {
      summary += `Federal regulatory information available.`;
    } else {
      summary += `No federal documents found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format federal rules search results
   */
  rulesSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const agency = args.agency || 'agencies';
    
    let summary = `📋 **Federal Rules Search Complete**\n\n`;
    summary += `Agency: ${agency}\n`;
    summary += `Results: Found ${count} rules\n\n`;
    
    if (count > 0) {
      summary += `Federal rules and regulations available for analysis.`;
    } else {
      summary += `No rules found for specified criteria.`;
    }
    
    return summary;
  }
};
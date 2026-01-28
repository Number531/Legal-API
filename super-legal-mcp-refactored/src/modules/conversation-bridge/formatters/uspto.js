/**
 * USPTO Tool Formatters
 * 
 * Formats results from USPTO API tools for conversation display
 */

export const usptoFormatter = {
  /**
   * Format uspto_patent_search results
   */
  patentSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'patent search';
    
    let summary = `🔬 **USPTO Patent Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} patents\n\n`;
    
    if (count > 0) {
      summary += `Patent information available for analysis.`;
    } else {
      summary += `No patents found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format USPTO trademark search results
   */
  trademarkSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'trademark search';
    
    let summary = `™️ **USPTO Trademark Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} trademarks\n\n`;
    
    if (count > 0) {
      summary += `Trademark information available for analysis.`;
    } else {
      summary += `No trademarks found matching criteria.`;
    }
    
    return summary;
  }
};
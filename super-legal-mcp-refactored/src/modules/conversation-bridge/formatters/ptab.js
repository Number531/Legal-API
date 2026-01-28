/**
 * PTAB Tool Formatters
 * 
 * Formats results from Patent Trial and Appeal Board tools for conversation display
 */

export const ptabFormatter = {
  /**
   * Format ptab_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'PTAB search';
    
    let summary = `⚖️ **Patent Trial Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} PTAB proceedings\n\n`;
    
    if (count > 0) {
      summary += `Patent dispute data available for review.`;
    } else {
      summary += `No proceedings found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format PTAB proceedings results
   */
  proceedings: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const patent = args.patent || args.patent_number || 'patent';
    
    let summary = `📋 **PTAB Proceedings Retrieved**\n\n`;
    summary += `Patent: ${patent}\n`;
    summary += `Results: Found ${count} proceedings\n\n`;
    
    if (count > 0) {
      summary += `Patent trial proceedings available for analysis.`;
    } else {
      summary += `No proceedings found for specified patent.`;
    }
    
    return summary;
  }
};
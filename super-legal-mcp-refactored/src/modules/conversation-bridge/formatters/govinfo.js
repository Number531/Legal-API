/**
 * GovInfo Tool Formatters
 * 
 * Formats results from GovInfo API tools for conversation display
 */

export const govInfoFormatter = {
  /**
   * Format govinfo_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'government document search';
    
    let summary = `🏛️ **GovInfo Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} government documents\n\n`;
    
    if (count > 0) {
      summary += `Government documents available for analysis.`;
    } else {
      summary += `No documents found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format USC (United States Code) search results
   */
  uscSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const title = args.title || 'USC';
    const query = args.query || 'code search';
    
    let summary = `📖 **US Code Search Complete**\n\n`;
    summary += `Title: ${title}\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} code sections\n\n`;
    
    if (count > 0) {
      summary += `US Code provisions available for legal analysis.`;
    } else {
      summary += `No code sections found matching criteria.`;
    }
    
    return summary;
  }
};
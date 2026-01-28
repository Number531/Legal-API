/**
 * EPA Tool Formatters
 * 
 * Formats results from EPA API tools for conversation display
 */

export const epaFormatter = {
  /**
   * Format epa_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'EPA regulation search';
    
    let summary = `🌿 **EPA Regulation Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} regulatory documents\n\n`;
    
    if (count > 0) {
      summary += `Environmental compliance data available.`;
    } else {
      summary += `No regulations found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format EPA compliance search results
   */
  complianceSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const facility = args.facility || args.company || 'facilities';
    
    let summary = `🏭 **EPA Compliance Search Complete**\n\n`;
    summary += `Facility: ${facility}\n`;
    summary += `Results: Found ${count} compliance records\n\n`;
    
    if (count > 0) {
      summary += `Environmental compliance data available for analysis.`;
    } else {
      summary += `No compliance records found.`;
    }
    
    return summary;
  }
};
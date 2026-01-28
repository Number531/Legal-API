/**
 * State Statute Tool Formatters
 * 
 * Formats results from state statute search tools for conversation display
 */

export const stateStatuteFormatter = {
  /**
   * Format state_statute_search results
   */
  search: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const state = args.state || args.jurisdiction || 'multiple states';
    const query = args.query || 'statute search';
    
    let summary = `📜 **State Statute Search Complete**\n\n`;
    summary += `State: ${state}\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} statutes\n\n`;
    
    if (count > 0) {
      summary += `State law provisions available for analysis.`;
    } else {
      summary += `No statutes found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format state code search results
   */
  codeSearch: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const state = args.state || 'state';
    const code = args.code || args.title || 'code';
    
    let summary = `📚 **State Code Search Complete**\n\n`;
    summary += `State: ${state}\n`;
    summary += `Code: ${code}\n`;
    summary += `Results: Found ${count} code sections\n\n`;
    
    if (count > 0) {
      summary += `State code provisions available for review.`;
    } else {
      summary += `No code sections found.`;
    }
    
    return summary;
  }
};
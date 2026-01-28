/**
 * CourtListener Tool Formatters
 * 
 * Formats results from CourtListener API tools for conversation display
 */

export const courtListenerFormatter = {
  /**
   * Format search_cases results
   */
  searchCases: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const jurisdiction = args.jurisdiction || 'all jurisdictions';
    const query = args.query || args.case_name || 'legal search';
    
    let summary = `🏛️ **Court Case Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Jurisdiction: ${jurisdiction}\n`;
    summary += `Results: Found ${count} cases\n\n`;
    
    if (count > 0) {
      summary += `Key findings available for review.`;
      
      // Add brief summary of top results if available
      if (Array.isArray(result) && result.length > 0) {
        const topCases = result.slice(0, 3);
        summary += `\n\n**Top Results:**\n`;
        topCases.forEach((case_, index) => {
          const caseName = case_.case_name || case_.caption || `Case ${index + 1}`;
          const court = case_.court || case_.court_id || 'Unknown Court';
          summary += `${index + 1}. ${caseName} (${court})\n`;
        });
      }
    } else {
      summary += `No cases found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format get_case_details results
   */
  caseDetails: (args, result) => {
    const caseName = result?.case_name || result?.caption || args.case_id || 'case';
    const court = result?.court || result?.court_id || 'Unknown Court';
    const dateField = result?.date_filed || result?.date_created || result?.date_modified;
    
    let summary = `📋 **Case Details Retrieved**\n\n`;
    summary += `Case: ${caseName}\n`;
    summary += `Court: ${court}\n`;
    summary += `Source: CourtListener\n`;
    
    if (dateField) {
      summary += `Date: ${new Date(dateField).toLocaleDateString()}\n`;
    }
    
    summary += `\nDetailed case information available for analysis.`;
    
    // Add docket number if available
    if (result?.docket_number) {
      summary += `\n\n**Docket:** ${result.docket_number}`;
    }
    
    return summary;
  },

  /**
   * Format lookup_citation results
   */
  lookupCitation: (args, result) => {
    const citation = args.citation || 'citation';
    const found = result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0);
    
    let summary = `📖 **Citation Lookup Complete**\n\n`;
    summary += `Citation: ${citation}\n`;
    summary += `Status: ${found ? 'Found' : 'Not found'}\n\n`;
    
    if (found) {
      summary += `Citation details available for review.`;
      
      // Add case name if available
      if (result?.case_name || result?.caption) {
        summary += `\n\n**Case:** ${result.case_name || result.caption}`;
      }
      
      // Add court if available
      if (result?.court || result?.court_id) {
        summary += `\n**Court:** ${result.court || result.court_id}`;
      }
    } else {
      summary += `Citation not found in database.`;
    }
    
    return summary;
  },

  /**
   * Format search_judges results
   */
  searchJudges: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const judgeName = args.name || 'judges';
    
    let summary = `👩‍⚖️ **Judge Search Complete**\n\n`;
    summary += `Query: "${judgeName}"\n`;
    summary += `Results: Found ${count} judges\n\n`;
    
    if (count > 0) {
      summary += `Judge information available for review.`;
      
      // Add top results
      if (Array.isArray(result) && result.length > 0) {
        const topJudges = result.slice(0, 3);
        summary += `\n\n**Top Results:**\n`;
        topJudges.forEach((judge, index) => {
          const name = judge.name_full || judge.name_last || `Judge ${index + 1}`;
          const court = judge.court || 'Unknown Court';
          summary += `${index + 1}. ${name} (${court})\n`;
        });
      }
    } else {
      summary += `No judges found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format get_judge_details results
   */
  judgeDetails: (args, result) => {
    const judgeName = result?.name_full || result?.name_last || args.judge_id || 'judge';
    const court = result?.court || 'Unknown Court';
    
    let summary = `👨‍⚖️ **Judge Details Retrieved**\n\n`;
    summary += `Judge: ${judgeName}\n`;
    summary += `Court: ${court}\n`;
    summary += `Source: CourtListener\n\n`;
    summary += `Detailed judge information available for analysis.`;
    
    // Add appointment info if available
    if (result?.date_appointed) {
      summary += `\n\n**Appointed:** ${new Date(result.date_appointed).toLocaleDateString()}`;
    }
    
    if (result?.appointer) {
      summary += `\n**Appointed by:** ${result.appointer}`;
    }
    
    return summary;
  },

  /**
   * Format search_audio results
   */
  searchAudio: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    const query = args.query || 'oral arguments';
    
    let summary = `🎵 **Oral Argument Search Complete**\n\n`;
    summary += `Query: "${query}"\n`;
    summary += `Results: Found ${count} audio recordings\n\n`;
    
    if (count > 0) {
      summary += `Audio recordings and transcripts available for review.`;
    } else {
      summary += `No oral arguments found matching criteria.`;
    }
    
    return summary;
  },

  /**
   * Format get_audio_details results
   */
  audioDetails: (args, result) => {
    const caseName = result?.case_name || result?.docket?.case_name || args.audio_id || 'case';
    const duration = result?.duration ? `${Math.round(result.duration / 60)} minutes` : 'Unknown duration';
    
    let summary = `🎵 **Audio Details Retrieved**\n\n`;
    summary += `Case: ${caseName}\n`;
    summary += `Duration: ${duration}\n`;
    summary += `Source: CourtListener\n\n`;
    summary += `Audio recording and transcript available for analysis.`;
    
    return summary;
  },

  /**
   * Format search_financial_disclosures results
   */
  financialDisclosures: (args, result) => {
    const count = Array.isArray(result) ? result.length : 0;
    
    let summary = `💰 **Financial Disclosure Search Complete**\n\n`;
    summary += `Results: Found ${count} financial disclosures\n\n`;
    
    if (count > 0) {
      summary += `Financial disclosure documents available for review.`;
      
      // Add year range if available
      if (args.year) {
        summary += `\n\n**Year:** ${args.year}`;
      }
    } else {
      summary += `No financial disclosures found matching criteria.`;
    }
    
    return summary;
  }
};
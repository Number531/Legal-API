/**
 * Exa Web Search Tool Formatters
 * Formats results from Exa-based web search tools for conversation display
 */

/**
 * Format state statute search results
 */
export function formatStateStatuteSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No state statute results found",
      keyFindings: [],
      conversationDisplay: "🏛️ **State Statute Search**: No results found"
    };
  }

  try {
    const data = result.content[0]?.text;
    if (!data) {
      return {
        summary: "No statute content retrieved",
        keyFindings: [],
        conversationDisplay: "🏛️ **State Statute Search**: No content available"
      };
    }

    const keyFindings = [];
    
    // Extract key statutory provisions if available
    if (data.includes('§') || data.includes('Section')) {
      keyFindings.push("Contains specific statutory sections");
    }
    
    if (data.toLowerCase().includes('penalty') || data.toLowerCase().includes('fine')) {
      keyFindings.push("Includes penalty provisions");
    }

    if (data.toLowerCase().includes('effective date')) {
      keyFindings.push("Contains effective date information");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `State statute search found relevant provisions: ${summary}`,
      keyFindings,
      conversationDisplay: `🏛️ **State Statute Search**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting state statute results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🏛️ **State Statute Search**: Error formatting results"
    };
  }
}

/**
 * Format PTAB IPR proceedings search results
 */
export function formatPTABIPRSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No PTAB IPR proceedings found",
      keyFindings: [],
      conversationDisplay: "⚖️ **PTAB IPR Search**: No proceedings found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    if (data.toLowerCase().includes('final written decision')) {
      keyFindings.push("Contains Final Written Decision");
    }
    
    if (data.toLowerCase().includes('instituted')) {
      keyFindings.push("Institution decision available");
    }

    if (data.toLowerCase().includes('patent') && data.match(/\d{1,2}\/\d{3},\d{3}/)) {
      keyFindings.push("Patent number referenced");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `PTAB IPR search found relevant proceedings: ${summary}`,
      keyFindings,
      conversationDisplay: `⚖️ **PTAB IPR Proceedings**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting PTAB IPR results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **PTAB IPR Search**: Error formatting results"
    };
  }
}

/**
 * Format PTAB PGR proceedings search results
 */
export function formatPTABPGRSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No PTAB PGR proceedings found",
      keyFindings: [],
      conversationDisplay: "⚖️ **PTAB PGR Search**: No proceedings found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    if (data.toLowerCase().includes('post-grant review')) {
      keyFindings.push("Post-Grant Review proceeding");
    }
    
    if (data.toLowerCase().includes('final written decision')) {
      keyFindings.push("Contains Final Written Decision");
    }

    if (data.toLowerCase().includes('patent') && data.match(/\d{1,2}\/\d{3},\d{3}/)) {
      keyFindings.push("Patent number referenced");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `PTAB PGR search found relevant proceedings: ${summary}`,
      keyFindings,
      conversationDisplay: `⚖️ **PTAB PGR Proceedings**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting PTAB PGR results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **PTAB PGR Search**: Error formatting results"
    };
  }
}

/**
 * Format PTAB CBM proceedings search results
 */
export function formatPTABCBMSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No PTAB CBM proceedings found",
      keyFindings: [],
      conversationDisplay: "⚖️ **PTAB CBM Search**: No proceedings found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    if (data.toLowerCase().includes('covered business method')) {
      keyFindings.push("Covered Business Method review");
    }
    
    if (data.toLowerCase().includes('final written decision')) {
      keyFindings.push("Contains Final Written Decision");
    }

    if (data.toLowerCase().includes('financial services')) {
      keyFindings.push("Related to financial services");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `PTAB CBM search found relevant proceedings: ${summary}`,
      keyFindings,
      conversationDisplay: `⚖️ **PTAB CBM Proceedings**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting PTAB CBM results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **PTAB CBM Search**: Error formatting results"
    };
  }
}

/**
 * Format EPA facilities web search results
 */
export function formatEPAFacilitiesWeb(result) {
  if (!result || !result.content) {
    return {
      summary: "No EPA facilities found",
      keyFindings: [],
      conversationDisplay: "🏭 **EPA Facilities Search**: No facilities found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    if (data.toLowerCase().includes('violation')) {
      keyFindings.push("Compliance violations found");
    }
    
    if (data.toLowerCase().includes('enforcement')) {
      keyFindings.push("Enforcement actions present");
    }

    if (data.toLowerCase().includes('clean air act') || data.toLowerCase().includes('clean water act')) {
      keyFindings.push("Federal environmental law violations");
    }

    if (data.toLowerCase().includes('penalty') || data.toLowerCase().includes('fine')) {
      keyFindings.push("Financial penalties assessed");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `EPA facility search found compliance information: ${summary}`,
      keyFindings,
      conversationDisplay: `🏭 **EPA Facilities Search**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting EPA facilities results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🏭 **EPA Facilities Search**: Error formatting results"
    };
  }
}

/**
 * Format comprehensive analysis results
 */
export function formatComprehensiveAnalysis(result) {
  if (!result || typeof result !== 'object') {
    return {
      summary: "Comprehensive analysis completed with no results",
      keyFindings: [],
      conversationDisplay: "📊 **Comprehensive Legal Analysis**: No results available"
    };
  }

  try {
    const keyFindings = [];
    let analysisCount = 0;

    // Count different analysis types
    if (result.courtCases) {
      keyFindings.push(`Found ${Array.isArray(result.courtCases) ? result.courtCases.length : 'multiple'} court cases`);
      analysisCount++;
    }
    
    if (result.secFilings) {
      keyFindings.push(`Found ${Array.isArray(result.secFilings) ? result.secFilings.length : 'multiple'} SEC filings`);
      analysisCount++;
    }

    if (result.federalRegister) {
      keyFindings.push(`Found ${Array.isArray(result.federalRegister) ? result.federalRegister.length : 'multiple'} federal register entries`);
      analysisCount++;
    }

    if (result.patents) {
      keyFindings.push(`Found ${Array.isArray(result.patents) ? result.patents.length : 'multiple'} patents`);
      analysisCount++;
    }

    const summary = `Comprehensive analysis completed across ${analysisCount} data sources`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `📊 **Comprehensive Legal Analysis**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting comprehensive analysis results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "📊 **Comprehensive Legal Analysis**: Error formatting results"
    };
  }
}
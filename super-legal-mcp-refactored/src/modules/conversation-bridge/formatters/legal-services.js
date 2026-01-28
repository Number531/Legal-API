/**
 * Legal Services Tool Formatters
 * Formats results from filing draft and state court rules tools for conversation display
 */

/**
 * Format legal filing draft results
 */
export function formatLegalFilingDraft(result) {
  if (!result || typeof result !== 'object') {
    return {
      summary: "Unable to generate legal filing draft",
      keyFindings: [],
      conversationDisplay: "📝 **Legal Filing Draft**: Unable to generate draft"
    };
  }

  try {
    const keyFindings = [];
    
    if (result.filing_type) {
      keyFindings.push(`Filing type: ${result.filing_type}`);
    }
    
    if (result.jurisdiction) {
      keyFindings.push(`Jurisdiction: ${result.jurisdiction}`);
    }

    if (result.estimated_length) {
      keyFindings.push(`Estimated length: ${result.estimated_length} pages`);
    }

    if (result.required_attachments && result.required_attachments.length > 0) {
      keyFindings.push(`Required attachments: ${result.required_attachments.length}`);
    }

    if (result.filing_deadline) {
      keyFindings.push(`Filing deadline: ${result.filing_deadline}`);
    }

    const summary = result.summary || `Generated draft for ${result.filing_type || 'legal filing'}`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `📝 **Legal Filing Draft**\n\n**Summary:** ${summary}\n\n**Key Details:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting legal filing draft results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "📝 **Legal Filing Draft**: Error formatting results"
    };
  }
}

/**
 * Format court rules search results
 */
export function formatCourtRulesSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No court rules found",
      keyFindings: [],
      conversationDisplay: "⚖️ **Court Rules Search**: No court rules found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    // Detect rule types
    if (data.toLowerCase().includes('civil procedure')) {
      keyFindings.push("Civil procedure rules");
    }
    
    if (data.toLowerCase().includes('criminal procedure')) {
      keyFindings.push("Criminal procedure rules");
    }

    if (data.toLowerCase().includes('evidence')) {
      keyFindings.push("Evidence rules");
    }

    if (data.toLowerCase().includes('local rule')) {
      keyFindings.push("Local court rules");
    }

    if (data.toLowerCase().includes('electronic filing') || data.toLowerCase().includes('e-filing')) {
      keyFindings.push("Electronic filing requirements");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `Court rules search found relevant provisions: ${summary}`,
      keyFindings,
      conversationDisplay: `⚖️ **Court Rules Search**\n\n**Summary:** ${summary}\n\n**Key Findings:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting court rules search results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **Court Rules Search**: Error formatting results"
    };
  }
}

/**
 * Format formatting requirements results
 */
export function formatFormattingRequirements(result) {
  if (!result || !result.content) {
    return {
      summary: "No formatting requirements found",
      keyFindings: [],
      conversationDisplay: "📄 **Formatting Requirements**: No requirements found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    // Extract formatting requirements
    if (data.toLowerCase().includes('font')) {
      keyFindings.push("Font specifications provided");
    }
    
    if (data.toLowerCase().includes('margin')) {
      keyFindings.push("Margin requirements specified");
    }

    if (data.toLowerCase().includes('page limit')) {
      keyFindings.push("Page limits specified");
    }

    if (data.toLowerCase().includes('line spacing')) {
      keyFindings.push("Line spacing requirements");
    }

    if (data.toLowerCase().includes('signature')) {
      keyFindings.push("Signature requirements");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `Document formatting requirements: ${summary}`,
      keyFindings,
      conversationDisplay: `📄 **Formatting Requirements**\n\n**Summary:** ${summary}\n\n**Requirements:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting requirements results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "📄 **Formatting Requirements**: Error formatting results"
    };
  }
}

/**
 * Format electronic filing rules results
 */
export function formatElectronicFilingRules(result) {
  if (!result || !result.content) {
    return {
      summary: "No electronic filing rules found",
      keyFindings: [],
      conversationDisplay: "💻 **Electronic Filing Rules**: No rules found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    // Extract e-filing requirements
    if (data.toLowerCase().includes('pdf')) {
      keyFindings.push("PDF format requirements");
    }
    
    if (data.toLowerCase().includes('file size')) {
      keyFindings.push("File size limitations");
    }

    if (data.toLowerCase().includes('electronic signature')) {
      keyFindings.push("Electronic signature requirements");
    }

    if (data.toLowerCase().includes('technical requirements')) {
      keyFindings.push("Technical specifications provided");
    }

    if (data.toLowerCase().includes('service')) {
      keyFindings.push("Electronic service requirements");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `Electronic filing rules: ${summary}`,
      keyFindings,
      conversationDisplay: `💻 **Electronic Filing Rules**\n\n**Summary:** ${summary}\n\n**Requirements:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting electronic filing rules results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "💻 **Electronic Filing Rules**: Error formatting results"
    };
  }
}

/**
 * Format local rules search results
 */
export function formatLocalRulesSearch(result) {
  if (!result || !result.content) {
    return {
      summary: "No local rules found",
      keyFindings: [],
      conversationDisplay: "🏛️ **Local Rules Search**: No local rules found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    // Extract local rule types
    if (data.toLowerCase().includes('motion practice')) {
      keyFindings.push("Motion practice procedures");
    }
    
    if (data.toLowerCase().includes('discovery')) {
      keyFindings.push("Discovery procedures");
    }

    if (data.toLowerCase().includes('scheduling')) {
      keyFindings.push("Scheduling requirements");
    }

    if (data.toLowerCase().includes('pretrial')) {
      keyFindings.push("Pretrial procedures");
    }

    if (data.toLowerCase().includes('settlement')) {
      keyFindings.push("Settlement procedures");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `Local court rules: ${summary}`,
      keyFindings,
      conversationDisplay: `🏛️ **Local Rules Search**\n\n**Summary:** ${summary}\n\n**Key Areas:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting local rules search results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "🏛️ **Local Rules Search**: Error formatting results"
    };
  }
}

/**
 * Format court-specific procedures results
 */
export function formatCourtSpecificProcedures(result) {
  if (!result || !result.content) {
    return {
      summary: "No court-specific procedures found",
      keyFindings: [],
      conversationDisplay: "⚖️ **Court Procedures**: No procedures found"
    };
  }

  try {
    const data = result.content[0]?.text || '';
    const keyFindings = [];
    
    // Extract procedure types
    if (data.toLowerCase().includes('case management')) {
      keyFindings.push("Case management procedures");
    }
    
    if (data.toLowerCase().includes('calendar')) {
      keyFindings.push("Calendar and scheduling procedures");
    }

    if (data.toLowerCase().includes('chambers')) {
      keyFindings.push("Chambers procedures");
    }

    if (data.toLowerCase().includes('jury')) {
      keyFindings.push("Jury procedures");
    }

    if (data.toLowerCase().includes('sentencing')) {
      keyFindings.push("Sentencing procedures");
    }

    const summary = data.substring(0, 200) + (data.length > 200 ? "..." : "");

    return {
      summary: `Court-specific procedures: ${summary}`,
      keyFindings,
      conversationDisplay: `⚖️ **Court Procedures**\n\n**Summary:** ${summary}\n\n**Procedures:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting court procedures results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "⚖️ **Court Procedures**: Error formatting results"
    };
  }
}

/**
 * Format document compliance validation results
 */
export function formatDocumentComplianceValidation(result) {
  if (!result || typeof result !== 'object') {
    return {
      summary: "Document compliance validation unavailable",
      keyFindings: [],
      conversationDisplay: "✅ **Document Compliance**: Validation unavailable"
    };
  }

  try {
    const keyFindings = [];
    
    if (result.compliant === true) {
      keyFindings.push("Document meets all requirements");
    } else if (result.compliant === false) {
      keyFindings.push("Document has compliance issues");
    }
    
    if (result.errors && Array.isArray(result.errors)) {
      keyFindings.push(`${result.errors.length} errors found`);
    }

    if (result.warnings && Array.isArray(result.warnings)) {
      keyFindings.push(`${result.warnings.length} warnings found`);
    }

    if (result.formatting_score) {
      keyFindings.push(`Formatting score: ${result.formatting_score}/100`);
    }

    const summary = result.compliant 
      ? "Document passes compliance validation" 
      : `Document validation found ${(result.errors?.length || 0) + (result.warnings?.length || 0)} issues`;

    return {
      summary,
      keyFindings,
      conversationDisplay: `✅ **Document Compliance**\n\n**Summary:** ${summary}\n\n**Results:**\n${keyFindings.map(f => `• ${f}`).join('\n')}`
    };
  } catch (error) {
    return {
      summary: "Error formatting document compliance results",
      keyFindings: [`Formatting error: ${error.message}`],
      conversationDisplay: "✅ **Document Compliance**: Error formatting results"
    };
  }
}
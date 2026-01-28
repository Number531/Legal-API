/**
 * Citation Validation Utility
 * Validates and formats legal citations according to Bluebook and ALWD standards
 * Provides parsing, validation, and formatting functions for legal citations
 */

export class CitationValidator {
  constructor() {
    // Citation patterns for different legal authorities
    this.patterns = {
      // Case citations
      federal_case: {
        supreme_court: /(\d+)\s+U\.?S\.?\s+(\d+)(?:\s*,\s*(\d+))?\s*\((\d{4})\)/i,
        circuit_court: /(\d+)\s+F\.?\s*(\d)d\s+(\d+)(?:\s*,\s*(\d+))?\s*\((\w+\.?\s*Cir\.?\s+\d{4})\)/i,
        district_court: /(\d+)\s+F\.?\s*Supp\.?\s*(\d?)d?\s+(\d+)(?:\s*,\s*(\d+))?\s*\(([^)]+\d{4})\)/i
      },
      state_case: {
        general: /(\d+)\s+([A-Z][a-z]+\.?\s*(?:\d+d)?)\s+(\d+)(?:\s*,\s*(\d+))?\s*\(([^)]+\d{4})\)/i
      },
      // Statutory citations
      federal_statute: {
        usc: /(\d+)\s+U\.?S\.?C\.?\s+§?\s*(\d+(?:\([a-z0-9]+\))*)/i,
        public_law: /Pub\.?\s*L\.?\s*No\.?\s*(\d+-\d+)/i
      },
      state_statute: {
        general: /([A-Z][a-z]+\.?\s*(?:Rev\.?\s*)?(?:Stat\.?|Code))\s*(?:Ann\.?|Annotat\.?)?\s*§?\s*(\d+(?:[-\.]\d+)*)/i
      },
      // Regulatory citations
      federal_regulation: {
        cfr: /(\d+)\s+C\.?F\.?R\.?\s+§?\s*(\d+(?:\.\d+)*)/i,
        federal_register: /(\d+)\s+Fed\.?\s*Reg\.?\s+(\d+)(?:\s*,\s*(\d+))?\s*\(([^)]+\d{4})\)/i
      }
    };

    // Citation formats
    this.formats = {
      bluebook: {
        case: '{{volume}} {{reporter}} {{page}}{{pinpoint}} ({{court}} {{year}})',
        statute: '{{title}} U.S.C. § {{section}} ({{year}})',
        regulation: '{{title}} C.F.R. § {{section}} ({{year}})'
      },
      alwd: {
        case: '{{volume}} {{reporter}} {{page}}{{pinpoint}} ({{court}} {{year}})',
        statute: '{{title}} U.S.C. § {{section}} ({{year}})',
        regulation: '{{title}} C.F.R. § {{section}} ({{year}})'
      }
    };

    // Common abbreviations
    this.abbreviations = {
      courts: {
        'Supreme Court': 'U.S.',
        'First Circuit': '1st Cir.',
        'Second Circuit': '2d Cir.',
        'Third Circuit': '3d Cir.',
        'Fourth Circuit': '4th Cir.',
        'Fifth Circuit': '5th Cir.',
        'Sixth Circuit': '6th Cir.',
        'Seventh Circuit': '7th Cir.',
        'Eighth Circuit': '8th Cir.',
        'Ninth Circuit': '9th Cir.',
        'Tenth Circuit': '10th Cir.',
        'Eleventh Circuit': '11th Cir.',
        'D.C. Circuit': 'D.C. Cir.',
        'Federal Circuit': 'Fed. Cir.'
      },
      reporters: {
        'United States Reports': 'U.S.',
        'Federal Reporter': 'F.',
        'Federal Reporter Second': 'F.2d',
        'Federal Reporter Third': 'F.3d',
        'Federal Supplement': 'F. Supp.',
        'Federal Supplement Second': 'F. Supp. 2d',
        'Federal Supplement Third': 'F. Supp. 3d'
      },
      months: {
        'January': 'Jan.',
        'February': 'Feb.',
        'March': 'Mar.',
        'April': 'Apr.',
        'May': 'May',
        'June': 'June',
        'July': 'July',
        'August': 'Aug.',
        'September': 'Sept.',
        'October': 'Oct.',
        'November': 'Nov.',
        'December': 'Dec.'
      }
    };
  }

  /**
   * Validate a legal citation
   * @param {string} citation - Citation to validate
   * @param {string} format - Citation format (bluebook | alwd)
   * @returns {Object} Validation result
   */
  validateCitation(citation, format = 'bluebook') {
    if (!citation || typeof citation !== 'string') {
      return { valid: false, error: 'Citation is required and must be a string' };
    }

    const trimmedCitation = citation.trim();
    const parsed = this.parseCitation(trimmedCitation);
    
    if (!parsed.type) {
      return { 
        valid: false, 
        error: 'Citation format not recognized',
        suggestions: this.suggestCitationFormat(trimmedCitation)
      };
    }

    const formatted = this.formatCitation(parsed, format);
    const issues = this.checkCitationIssues(parsed);

    return {
      valid: issues.length === 0,
      type: parsed.type,
      parsed: parsed,
      formatted: formatted,
      issues: issues,
      original: trimmedCitation
    };
  }

  /**
   * Parse a citation into components
   * @param {string} citation - Citation to parse
   * @returns {Object} Parsed citation components
   */
  parseCitation(citation) {
    // Try federal case patterns
    for (const [type, pattern] of Object.entries(this.patterns.federal_case)) {
      const match = citation.match(pattern);
      if (match) {
        return this._parseFederalCase(match, type);
      }
    }

    // Try state case patterns
    for (const [type, pattern] of Object.entries(this.patterns.state_case)) {
      const match = citation.match(pattern);
      if (match) {
        return this._parseStateCase(match, type);
      }
    }

    // Try federal statute patterns
    for (const [type, pattern] of Object.entries(this.patterns.federal_statute)) {
      const match = citation.match(pattern);
      if (match) {
        return this._parseFederalStatute(match, type);
      }
    }

    // Try state statute patterns
    for (const [type, pattern] of Object.entries(this.patterns.state_statute)) {
      const match = citation.match(pattern);
      if (match) {
        return this._parseStateStatute(match, type);
      }
    }

    // Try federal regulation patterns
    for (const [type, pattern] of Object.entries(this.patterns.federal_regulation)) {
      const match = citation.match(pattern);
      if (match) {
        return this._parseFederalRegulation(match, type);
      }
    }

    return { type: null, raw: citation };
  }

  /**
   * Format a parsed citation according to specified standard
   * @param {Object} parsed - Parsed citation components
   * @param {string} format - Citation format (bluebook | alwd)
   * @returns {string} Formatted citation
   */
  formatCitation(parsed, format = 'bluebook') {
    if (!parsed.type) return parsed.raw;

    const template = this._getCitationTemplate(parsed.category, format);
    if (!template) return parsed.raw;

    return this._populateTemplate(template, parsed);
  }

  /**
   * Generate a properly formatted table of authorities
   * @param {Array} citations - Array of citation objects
   * @param {string} format - Citation format
   * @returns {Object} Formatted table of authorities
   */
  generateTableOfAuthorities(citations, format = 'bluebook') {
    const categorized = {
      cases: [],
      statutes: [],
      regulations: [],
      other: []
    };

    citations.forEach(citation => {
      const validated = this.validateCitation(citation.citation || citation, format);
      
      const entry = {
        citation: validated.formatted || citation.citation || citation,
        name: citation.name || this._extractCaseName(citation.citation || citation),
        pinpoint: citation.pinpoint,
        valid: validated.valid,
        issues: validated.issues
      };

      if (validated.type) {
        if (validated.parsed.category === 'case') {
          categorized.cases.push(entry);
        } else if (validated.parsed.category === 'statute') {
          categorized.statutes.push(entry);
        } else if (validated.parsed.category === 'regulation') {
          categorized.regulations.push(entry);
        } else {
          categorized.other.push(entry);
        }
      } else {
        categorized.other.push(entry);
      }
    });

    // Sort each category
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => a.citation.localeCompare(b.citation));
    });

    return {
      format: format,
      sections: [
        { title: 'Cases', citations: categorized.cases },
        { title: 'Statutes', citations: categorized.statutes },
        { title: 'Regulations', citations: categorized.regulations },
        { title: 'Other Authorities', citations: categorized.other }
      ].filter(section => section.citations.length > 0)
    };
  }

  /**
   * Check for common citation issues
   * @param {Object} parsed - Parsed citation
   * @returns {Array} Array of issues found
   */
  checkCitationIssues(parsed) {
    const issues = [];

    if (!parsed.type) {
      issues.push('Citation format not recognized');
      return issues;
    }

    // Check for missing components
    if (parsed.category === 'case') {
      if (!parsed.volume) issues.push('Missing volume number');
      if (!parsed.reporter) issues.push('Missing reporter');
      if (!parsed.page) issues.push('Missing page number');
      if (!parsed.year) issues.push('Missing year');
      if (!parsed.court && parsed.type !== 'supreme_court') {
        issues.push('Missing court identification');
      }
    }

    // Check year format
    if (parsed.year && !/^\d{4}$/.test(parsed.year)) {
      issues.push('Year should be four digits');
    }

    // Check for proper abbreviations
    if (parsed.reporter && !this._isValidReporter(parsed.reporter)) {
      issues.push('Reporter abbreviation may be incorrect');
    }

    return issues;
  }

  /**
   * Suggest citation format improvements
   * @param {string} citation - Original citation
   * @returns {Array} Array of suggestions
   */
  suggestCitationFormat(citation) {
    const suggestions = [];

    // Common patterns that might need fixing
    if (/\d+\s+U\.?S\.?\s+\d+/i.test(citation) && !/\(\d{4}\)/.test(citation)) {
      suggestions.push('Supreme Court citations should include year in parentheses');
    }

    if (/\d+\s+F\.?\s*\d*d?\s+\d+/i.test(citation) && !/Cir\.\s+\d{4}/.test(citation)) {
      suggestions.push('Federal appellate citations should include circuit and year');
    }

    if (/U\.?S\.?C\.?/i.test(citation) && !/§/.test(citation)) {
      suggestions.push('U.S.C. citations should include section symbol (§)');
    }

    return suggestions;
  }

  // ===== PRIVATE PARSING METHODS =====

  _parseFederalCase(match, type) {
    const base = {
      category: 'case',
      type: type,
      volume: match[1],
      page: match[2] || match[3],
      pinpoint: null,
      year: null,
      court: null,
      reporter: null
    };

    switch (type) {
      case 'supreme_court':
        base.reporter = 'U.S.';
        base.page = match[2];
        base.pinpoint = match[3];
        base.year = match[4];
        base.court = 'U.S.';
        break;
      case 'circuit_court':
        base.reporter = `F.${match[2]}d`;
        base.page = match[3];
        base.pinpoint = match[4];
        base.year = this._extractYear(match[5]);
        base.court = this._extractCourt(match[5]);
        break;
      case 'district_court':
        base.reporter = `F. Supp.${match[2] ? ` ${match[2]}d` : ''}`;
        base.page = match[3];
        base.pinpoint = match[4];
        base.year = this._extractYear(match[5]);
        base.court = this._extractCourt(match[5]);
        break;
    }

    return base;
  }

  _parseStateCase(match, type) {
    return {
      category: 'case',
      type: 'state_case',
      volume: match[1],
      reporter: match[2],
      page: match[3],
      pinpoint: match[4],
      year: this._extractYear(match[5]),
      court: this._extractCourt(match[5])
    };
  }

  _parseFederalStatute(match, type) {
    switch (type) {
      case 'usc':
        return {
          category: 'statute',
          type: 'usc',
          title: match[1],
          section: match[2],
          year: null
        };
      case 'public_law':
        return {
          category: 'statute',
          type: 'public_law',
          number: match[1]
        };
    }
  }

  _parseStateStatute(match, type) {
    return {
      category: 'statute',
      type: 'state_statute',
      code: match[1],
      section: match[2]
    };
  }

  _parseFederalRegulation(match, type) {
    switch (type) {
      case 'cfr':
        return {
          category: 'regulation',
          type: 'cfr',
          title: match[1],
          section: match[2],
          year: null
        };
      case 'federal_register':
        return {
          category: 'regulation',
          type: 'federal_register',
          volume: match[1],
          page: match[2],
          pinpoint: match[3],
          date: match[4]
        };
    }
  }

  _extractYear(str) {
    const yearMatch = str.match(/(\d{4})/);
    return yearMatch ? yearMatch[1] : null;
  }

  _extractCourt(str) {
    // Extract court from parenthetical
    return str.replace(/\d{4}/, '').trim();
  }

  _extractCaseName(citation) {
    // Simple heuristic to extract case name - would need enhancement
    const beforeV = citation.split(/\s+v\.?\s+/i)[0];
    return beforeV ? beforeV.trim() : null;
  }

  _getCitationTemplate(category, format) {
    return this.formats[format]?.[category];
  }

  _populateTemplate(template, parsed) {
    let result = template;
    
    Object.entries(parsed).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value || '');
    });

    // Handle pinpoint citations
    if (parsed.pinpoint) {
      result = result.replace(/{{pinpoint}}/g, `, ${parsed.pinpoint}`);
    } else {
      result = result.replace(/{{pinpoint}}/g, '');
    }

    return result.replace(/\s+/g, ' ').trim();
  }

  _isValidReporter(reporter) {
    const validReporters = Object.values(this.abbreviations.reporters);
    return validReporters.includes(reporter);
  }

  // ===== PLACEHOLDER DETECTION =====

  /**
   * Common placeholder patterns that indicate unfilled citation fields
   * @private
   */
  static PLACEHOLDER_PATTERNS = [
    /\[citation\]/gi,
    /\[court\]/gi,
    /\[year\]/gi,
    /\[pinpoint\]/gi,
    /\[volume\]/gi,
    /\[reporter\]/gi,
    /\[page\]/gi,
    /\[case name\]/gi,
    /\[party\s*name\]/gi,
    /\[statute\]/gi,
    /\[section\]/gi,
    /\[specific\s+\w+\]/gi,
    /\[CFR\s+citation\]/gi,
    /\[U\.?S\.?C\.?\s+citation\]/gi,
    /\[continue\s+with.*?\]/gi,
    /\[leading\s+\w+\s+case\]/gi,
    /\[\w+\s+coverage\s+case\]/gi,
    /\[date\]/gi,
    /\[jurisdiction\]/gi,
    /\[holding\]/gi,
    /\[X+\]/g,  // Patterns like [X], [XX], [XXX]
    /\[N\]/g,   // Common placeholder for numbers
  ];

  /**
   * Detect unfilled placeholders in a citation or legal text
   * @param {string} text - Text to check for placeholders
   * @returns {Object} Detection result with found placeholders
   *
   * @example
   * const result = validator.detectPlaceholders("See *Case Name*, [citation] ([court] [year]).");
   * // result: { hasPlaceholders: true, found: ["[citation]", "[court]", "[year]"], count: 3 }
   */
  detectPlaceholders(text) {
    if (!text || typeof text !== 'string') {
      return { hasPlaceholders: false, found: [], count: 0 };
    }

    const found = [];

    for (const pattern of CitationValidator.PLACEHOLDER_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    }

    // Deduplicate
    const unique = [...new Set(found)];

    return {
      hasPlaceholders: unique.length > 0,
      found: unique,
      count: unique.length,
      original: text
    };
  }

  /**
   * Check if a citation appears to be incomplete (contains placeholders)
   * @param {string} citation - Citation to validate
   * @returns {Object} Validation result indicating if citation is complete
   *
   * @example
   * const result = validator.isCompleteCitation("*Hartford Fire v. California*, 509 U.S. 764 (1993)");
   * // result: { isComplete: true, issues: [] }
   *
   * const result2 = validator.isCompleteCitation("*[Case Name]*, [citation] ([court] [year])");
   * // result: { isComplete: false, issues: ["Contains placeholder: [Case Name]", ...] }
   */
  isCompleteCitation(citation) {
    const placeholderResult = this.detectPlaceholders(citation);
    const issues = [];

    if (placeholderResult.hasPlaceholders) {
      placeholderResult.found.forEach(placeholder => {
        issues.push(`Contains unfilled placeholder: ${placeholder}`);
      });
    }

    // Also check for common incomplete patterns
    const incompletePatterns = [
      { pattern: /\*\*?\s*\*\*?/g, message: 'Contains empty italics markers' },
      { pattern: /,\s*,/g, message: 'Contains consecutive commas (missing content)' },
      { pattern: /\(\s*\)/g, message: 'Contains empty parentheses' },
      { pattern: /§\s*$/g, message: 'Section symbol without number' },
      { pattern: /\d+\s+\.\s+\d+/g, message: 'Malformed reporter citation' },
    ];

    for (const { pattern, message } of incompletePatterns) {
      if (pattern.test(citation)) {
        issues.push(message);
      }
    }

    return {
      isComplete: issues.length === 0,
      issues,
      original: citation
    };
  }

  /**
   * Batch validate multiple citations for completeness
   * @param {string[]} citations - Array of citations to validate
   * @returns {Object} Batch validation results
   */
  validateCitationCompleteness(citations) {
    if (!Array.isArray(citations)) {
      citations = [citations];
    }

    const results = {
      total: citations.length,
      complete: 0,
      incomplete: 0,
      details: []
    };

    for (const citation of citations) {
      const result = this.isCompleteCitation(citation);
      if (result.isComplete) {
        results.complete++;
      } else {
        results.incomplete++;
      }
      results.details.push(result);
    }

    return results;
  }

  /**
   * Clean placeholders from text by removing or highlighting them
   * @param {string} text - Text containing placeholders
   * @param {Object} options - Cleaning options
   * @param {string} options.mode - 'remove' | 'highlight' | 'flag'
   * @returns {Object} Cleaned result
   */
  cleanPlaceholders(text, options = { mode: 'flag' }) {
    const detection = this.detectPlaceholders(text);

    if (!detection.hasPlaceholders) {
      return { cleaned: text, modified: false, placeholdersRemoved: [] };
    }

    let cleaned = text;
    const { mode } = options;

    if (mode === 'remove') {
      for (const pattern of CitationValidator.PLACEHOLDER_PATTERNS) {
        cleaned = cleaned.replace(pattern, '').replace(/\s+/g, ' ').trim();
      }
    } else if (mode === 'highlight') {
      for (const placeholder of detection.found) {
        cleaned = cleaned.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `**[MISSING: ${placeholder}]**`
        );
      }
    } else if (mode === 'flag') {
      cleaned = `[INCOMPLETE CITATION - ${detection.count} placeholder(s) detected] ${text}`;
    }

    return {
      cleaned,
      modified: true,
      placeholdersRemoved: detection.found,
      originalPlaceholderCount: detection.count
    };
  }
}
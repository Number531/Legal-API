/**
 * Tool Definitions for Enhanced Legal MCP Server
 * Contains all tool schemas and definitions for the MCP server
 */

export const courtListenerTools = [
  {
    name: "search_cases",
    description: "Search federal and state court opinions via CourtListener. UNIQUE: Binding precedent, judicial reasoning, procedural standards. SIGNALS: 'case law', 'precedent', 'court held', 'ruling', party names.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms. PATTERNS: 'exact phrases', party names, legal concepts, citations. Exa neural search automatically includes related concepts."
        },
        court: {
          type: "string",
          description: "Court abbreviation to filter by (e.g., 'scotus', 'ca9')"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          default: 5,
          maximum: 5
        },
        date_filed_after: {
          type: "string",
          description: "Find cases filed after this date (YYYY-MM-DD)"
        },
        date_filed_before: {
          type: "string",
          description: "Find cases filed before this date (YYYY-MM-DD)"
        },
        case_name: {
          type: "string",
          description: "Search specifically in case names"
        },
        docket_number: {
          type: "string",
          description: "Search by docket number"
        },
        citation: {
          type: "string",
          description: "Search by citation"
        },
        neutral_citation: {
          type: "string",
          description: "Search by neutral citation"
        },
        include_snippet: {
          type: "boolean",
          description: "Get 500-char preview for relevance assessment. USE FIRST to scan multiple results quickly.",
          default: true
        },
        include_full_text: {
          type: "boolean", 
          description: "Get complete document. USE AFTER snippet confirms relevance. Limit to 2-3 most relevant.",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "DEPRECATED: Use include_snippet instead. For backward compatibility only.",
          default: true
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_case_details",
    description: "Get detailed case information via web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "number",
          description: "CourtListener case cluster ID"
        }
      },
      required: ["case_id"]
    }
  },
  {
    name: "lookup_citation",
    description: "Look up legal citations via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        citation: {
          type: "string",
          description: "Legal citation to look up (e.g., '410 U.S. 113', 'Brown v. Board')"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5)",
          default: 5,
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet from Exa highlights (~500 chars)",
          default: true
        },
        include_full_text: {
          type: "boolean",
          description: "Include complete opinion text (WARNING: Uses many tokens)",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "DEPRECATED: Use include_snippet",
          default: true
        }
      },
      required: ["citation"]
    }
  },
  {
    name: "search_judges",
    description: "Search for judges via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Judge's name to search for"
        },
        court: {
          type: "string",
          description: "Court abbreviation to filter by"
        },
        appointer: {
          type: "string",
          description: "Name of the appointing authority (e.g., president name)"
        },
        selection_method: {
          type: "string",
          description: "How the judge was selected (e.g., 'a_pres' for presidential appointment)",
          enum: ["a_pres", "a_gov", "e_part", "e_non_part", "a_legis", "a_judge", "a_com", "a_other"]
        },
        political_affiliation: {
          type: "string",
          description: "Political affiliation",
          enum: ["d", "r", "i", "w", "g", "l", "f", "j", "o"]
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 20 for web search)",
          default: 5,
          maximum: 5
        }
      },
      required: ["name"]
    }
  },
  {
    name: "get_judge_details",
    description: "Get judge details via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        judge_id: {
          type: "number",
          description: "CourtListener judge ID"
        }
      },
      required: ["judge_id"]
    }
  },
  {
    name: "get_court_info",
    description: "Get court information via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        court_id: {
          type: "string",
          description: "Court abbreviation (e.g., 'scotus', 'ca9', 'dcd')"
        }
      },
      required: ["court_id"]
    }
  },
  {
    name: "list_courts",
    description: "List courts via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "Filter by jurisdiction (F for Federal, S for State, etc.)"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 50 for web search)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "search_opinions",
    description: "Search for legal opinions via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        type: {
          type: "string",
          description: "Opinion type",
          enum: ["010combined", "020lead", "030concurrence", "040dissent", "050addendum", "060remittitur", "070rehearing", "080on_the_merits", "090on_motion_to_strike"]
        },
        per_curiam: {
          type: "boolean",
          description: "Filter for per curiam opinions"
        },
        status: {
          type: "string",
          description: "Opinion status",
          enum: ["Published", "Unpublished", "Separate", "In-chambers", "Relating-to", "Unknown"]
        },
        sha1: {
          type: "string",
          description: "SHA1 hash of the opinion"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 20 for web search)",
          default: 5,
          maximum: 5
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_audio",
    description: "Search for oral argument audio via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for case name or topic"
        },
        judge_name: {
          type: "string",
          description: "Filter by judge name"
        },
        court: {
          type: "string",
          description: "Court abbreviation (e.g., 'scotus', 'ca9')"
        },
        date_argued_after: {
          type: "string",
          description: "Arguments after this date (YYYY-MM-DD)"
        },
        date_argued_before: {
          type: "string",
          description: "Arguments before this date (YYYY-MM-DD)"
        },
        min_duration: {
          type: "number",
          description: "Minimum duration in minutes"
        },
        has_transcript: {
          type: "boolean",
          description: "Only return audio with available transcripts"
        },
        limit: {
          type: "number",
          description: "Number of results (max 20 for web search)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "get_audio_details",
    description: "Get audio details via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        audio_id: {
          type: "number",
          description: "CourtListener audio ID"
        }
      },
      required: ["audio_id"]
    }
  },
  {
    name: "get_opinion_with_citations",
    description: "Get opinion with citation analysis via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        opinion_id: {
          type: "number",
          description: "CourtListener opinion ID"
        },
        include_citing_cases: {
          type: "boolean",
          description: "Include cases that cite this opinion",
          default: true
        },
        include_cited_cases: {
          type: "boolean",
          description: "Include cases cited by this opinion",
          default: true
        },
        citation_depth: {
          type: "number",
          description: "How many levels of citations to retrieve (1-3)",
          default: 1,
          minimum: 1,
          maximum: 3
        }
      },
      required: ["opinion_id"]
    }
  },
  {
    name: "search_dockets",
    description: "Search for federal court dockets via reliable web search (CourtListener data)",
    inputSchema: {
      type: "object",
      properties: {
        case_name: {
          type: "string",
          description: "Search by case name (e.g., 'Smith v. Jones')"
        },
        party_name: {
          type: "string", 
          description: "Search by party name (plaintiff or defendant)"
        },
        docket_number: {
          type: "string",
          description: "Search by docket number (e.g., '1:21-cv-00123')"
        },
        court: {
          type: "string",
          description: "Court abbreviation to filter by (e.g., 'nysd', 'cacd')"
        },
        date_filed_after: {
          type: "string",
          description: "Find dockets filed after this date (YYYY-MM-DD)"
        },
        date_filed_before: {
          type: "string",
          description: "Find dockets filed before this date (YYYY-MM-DD)"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 20 for web search)",
          default: 5,
          maximum: 5
        }
      }
    }
  }
];

export const financialDisclosureTools = [
  {
    name: "search_financial_disclosures",
    description: "Search judicial financial disclosure documents",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge to search for"
        },
        year: {
          type: "number",
          description: "Year of the disclosure (e.g., 2023)"
        },
        report_type: {
          type: "string",
          description: "Type of financial disclosure report",
          enum: ["JW-1", "JW-2", "JW-3", "JW-10", "SF-278"]
        },
        has_investments: {
          type: "boolean",
          description: "Filter by disclosures with investment data"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "get_financial_disclosure_details",
    description: "Get detailed information about a specific financial disclosure",
    inputSchema: {
      type: "object",
      properties: {
        disclosure_id: {
          type: "number",
          description: "Financial disclosure ID"
        }
      },
      required: ["disclosure_id"]
    }
  },
  {
    name: "search_judge_investments",
    description: "Search for judicial investments by company, ticker, or type",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name or ticker symbol"
        },
        judge_name: {
          type: "string",
          description: "Filter by specific judge"
        },
        investment_type: {
          type: "string",
          description: "Type of investment",
          enum: ["Stock", "Bond", "Mutual Fund", "REIT", "Other"]
        },
        min_value: {
          type: "number",
          description: "Minimum investment value"
        },
        max_value: {
          type: "number",
          description: "Maximum investment value"
        },
        year: {
          type: "number",
          description: "Year of the investment"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "get_judge_gifts",
    description: "Get gifts received by judges",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge"
        },
        min_value: {
          type: "number",
          description: "Minimum gift value"
        },
        year: {
          type: "number",
          description: "Year the gift was received"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "get_judge_positions",
    description: "Get positions held by judges (directorships, trusteeships, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge"
        },
        organization: {
          type: "string",
          description: "Organization name"
        },
        position_type: {
          type: "string",
          description: "Type of position held"
        },
        year: {
          type: "number",
          description: "Year of the position"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "search_judge_spouse_income",
    description: "Search for spouse income disclosed by judges",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge"
        },
        source_type: {
          type: "string",
          description: "Source or type of spouse income"
        },
        year: {
          type: "number",
          description: "Year of the income"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "search_judge_reimbursements",
    description: "Search for reimbursements received by judges",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge"
        },
        source: {
          type: "string",
          description: "Source of the reimbursement"
        },
        purpose: {
          type: "string",
          description: "Purpose of the reimbursement"
        },
        location: {
          type: "string",
          description: "Location related to the reimbursement"
        },
        year: {
          type: "number",
          description: "Year of the reimbursement"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "search_judge_debts",
    description: "Search for debts disclosed by judges",
    inputSchema: {
      type: "object",
      properties: {
        judge_name: {
          type: "string",
          description: "Name of the judge"
        },
        creditor_name: {
          type: "string",
          description: "Name of the creditor"
        },
        description: {
          type: "string",
          description: "Description of the debt"
        },
        year: {
          type: "number",
          description: "Year of the disclosure"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  },
  {
    name: "get_disclosure_positions",
    description: "Get positions from financial disclosures (different from judge positions)",
    inputSchema: {
      type: "object",
      properties: {
        disclosure_id: {
          type: "number",
          description: "Financial disclosure ID"
        },
        judge_name: {
          type: "string",
          description: "Name of the judge (alternative to disclosure_id)"
        },
        year: {
          type: "number",
          description: "Year of the disclosure"
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100)",
          default: 5
        }
      }
    }
  }
];

export const secEdgarTools = [
  {
    name: "search_sec_filings",
    description: "Search SEC corporate filings and disclosures. UNIQUE: 10-K/10-Q/8-K filings, financial data, material events, insider trading. SIGNALS: 'SEC filing', 'disclosure', '10-K', 'quarterly report', 'material event'.",
    inputSchema: {
      type: "object",
      properties: {
        company_identifier: {
          type: "string",
          description: "Company name (automatically resolved to ticker for optimal search), ticker symbol, or CIK number. Examples: 'JPMorgan Chase & Co.' (auto-resolved to JPM), 'TSLA', or '0001318605'"
        },
        filing_type: {
          type: "string",
          description: "Type of SEC filing (10-K, 10-Q, 8-K, etc.)",
          enum: ["10-K", "10-Q", "8-K", "20-F", "DEF 14A", "S-1", "all"],
          default: "all"
        },
        date_after: {
          type: "string",
          description: "Find filings after this date (YYYY-MM-DD)"
        },
        date_before: {
          type: "string", 
          description: "Find filings before this date (YYYY-MM-DD)"
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart 500-char snippet of meaningful content from each filing",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include complete filing text (large response, use only when needed)",
          default: false
        },
        limit: {
          type: "number",
          description: "Number of results to return",
          default: 5,
          maximum: 5
        }
      },
      required: ["company_identifier"]
    }
  },
  {
    name: "get_sec_company_facts",
    description: "Get comprehensive XBRL-like financial data via web parsing (fallback)",
    inputSchema: {
      type: "object",
      properties: {
        company_identifier: {
          type: "string",
          description: "Company name (automatically resolved to ticker for optimal search), ticker symbol, or CIK number. Examples: 'JPMorgan Chase & Co.' (auto-resolved to JPM), 'TSLA', or '0001318605'"
        },
        concept: {
          type: "string",
          description: "Specific XBRL concept to retrieve (e.g., 'Assets', 'Revenues', 'NetIncomeLoss')"
        }
      },
      required: ["company_identifier"]
    }
  },
  {
    name: "get_sec_xbrl_frames",
    description: "Get aggregated concept values via web parsing (best-effort frames)",
    inputSchema: {
      type: "object",
      properties: {
        taxonomy: {
          type: "string",
          description: "XBRL taxonomy (e.g., 'us-gaap', 'ifrs-full')",
          default: "us-gaap"
        },
        concept: {
          type: "string",
          description: "XBRL concept name (e.g., 'AccountsPayableCurrent', 'Assets')"
        },
        unit: {
          type: "string",
          description: "Unit of measure (e.g., 'USD', 'shares')",
          default: "USD"
        },
        period: {
          type: "string",
          description: "Period (e.g., 'CY2023Q4I' for Q4 2023 instant, 'CY2023' for full year)"
        },
        limit: {
          type: "number",
          description: "Number of companies to return",
          default: 5,
          maximum: 5
        }
      },
      required: ["concept", "period"]
    }
  },
  {
    name: "search_sec_company_tickers",
    description: "Search for companies by name or ticker to get CIK numbers",
    inputSchema: {
      type: "object",
      properties: {
        search_term: {
          type: "string",
          description: "Company name or ticker symbol to search for"
        },
        exchange: {
          type: "string",
          description: "Filter by stock exchange (e.g., 'NYSE', 'NASDAQ')"
        }
      },
      required: ["search_term"]
    }
  }
];

export const federalRegisterTools = [
  {
    name: "search_federal_register",
    description: "Search agency rules and notices in Federal Register. UNIQUE: Proposed rules, comment periods, CFR changes, enforcement priorities. SIGNALS: 'regulation', 'proposed rule', 'agency', 'comment period', 'CFR'.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms. PATTERNS: 'agency name + topic', 'CFR section', 'regulation keywords'. Neural search includes related regulatory concepts."
        },
        agency: {
          type: "string",
          description: "Agency abbreviation (e.g., 'EPA', 'FDA', 'SEC') or full name"
        },
        document_type: {
          type: "string",
          description: "Document type filter",
          enum: ["rule", "proposed_rule", "notice", "presidential_document"]
        },
        date_after: {
          type: "string",
          description: "Find documents published after this date (YYYY-MM-DD)"
        },
        date_before: {
          type: "string",
          description: "Find documents published before this date (YYYY-MM-DD)"
        },
        limit: {
          type: "number",
          description: "Number of results to return",
          default: 5,
          maximum: 5
        },
        include_text: {
          type: "boolean",
          description: "Include complete document text (WARNING: Uses many tokens)",
          default: false
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction (~500 chars, recommended for token efficiency)",
          default: false
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_federal_register_notices",
    description: "Search Federal Register Notices (Exa WebSearch with FR bias)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (e.g., 'meeting', 'hearing', 'Sunshine Act')" },
        agency: { type: "string", description: "Agency abbreviation or full name" },
        date_after: { type: "string", description: "Published after (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Published before (YYYY-MM-DD)" },
        limit: { type: "number", description: "Results count (maximum 5)", default: 5, maximum: 5 },
        include_text: { type: "boolean", description: "Include full document text", default: false },
        include_snippet: { type: "boolean", description: "Include smart snippet", default: false }
      },
      required: ["query"]
    }
  },
  {
    name: "search_federal_register_proposed_rules",
    description: "Search Federal Register Proposed Rules (Exa WebSearch with FR bias)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (topic, CFR, agency)" },
        agency: { type: "string", description: "Agency abbreviation or full name" },
        date_after: { type: "string", description: "Published after (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Published before (YYYY-MM-DD)" },
        limit: { type: "number", description: "Results count (maximum 5)", default: 5, maximum: 5 },
        include_text: { type: "boolean", description: "Include full document text", default: false },
        include_snippet: { type: "boolean", description: "Include smart snippet", default: false }
      },
      required: ["query"]
    }
  },
  {
    name: "search_federal_register_final_rules",
    description: "Search Federal Register Rules and Regulations (final rules)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (topic, CFR, agency)" },
        agency: { type: "string", description: "Agency abbreviation or full name" },
        date_after: { type: "string", description: "Published after (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Published before (YYYY-MM-DD)" },
        limit: { type: "number", description: "Results count (maximum 5)", default: 5, maximum: 5 },
        include_text: { type: "boolean", description: "Include full document text", default: false },
        include_snippet: { type: "boolean", description: "Include smart snippet", default: false }
      },
      required: ["query"]
    }
  },
  {
    name: "search_federal_register_presidential_documents",
    description: "Search Federal Register Presidential Documents (executive orders, proclamations)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (order/proclamation topic)" },
        agency: { type: "string", description: "Optional originating office/agency" },
        date_after: { type: "string", description: "Published after (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Published before (YYYY-MM-DD)" },
        limit: { type: "number", description: "Results count (maximum 5)", default: 5, maximum: 5 },
        include_text: { type: "boolean", description: "Include full document text", default: false },
        include_snippet: { type: "boolean", description: "Include smart snippet", default: false }
      },
      required: ["query"]
    }
  },
  {
    name: "search_federal_register_public_inspection",
    description: "Search Federal Register Public Inspection documents (pre-publication)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (topic, CFR, agency)" },
        agency: { type: "string", description: "Agency abbreviation or full name" },
        date_after: { type: "string", description: "Published after (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Published before (YYYY-MM-DD)" },
        limit: { type: "number", description: "Results count (maximum 5)", default: 5, maximum: 5 },
        include_text: { type: "boolean", description: "Include full document text", default: false },
        include_snippet: { type: "boolean", description: "Include smart snippet", default: false }
      },
      required: ["query"]
    }
  }
];

export const usptoTools = [
  {
    name: "search_patents",
    description: "Search USPTO patent database for patents, inventors, and assignees. Returns comprehensive results in a SINGLE search - avoid multiple follow-up searches unless exploring DIFFERENT aspects. When no parameters provided, returns recent patent overview. For targeted results, always provide specific search_text or other parameters. BEST PRACTICE: Use specific parameters rather than exploratory searches. Enhanced with Exa WebSearch for comprehensive coverage including USPTO official sites and Google Patents.",
    inputSchema: {
      type: "object",
      properties: {
        query_type: {
          type: "string",
          enum: ["patents", "inventors", "assignees"],
          description: "Type of search to perform"
        },
        search_text: {
          type: "string",
          description: "RECOMMENDED: Specific text to search for in patents/inventors/assignees. Providing this prevents broad exploratory searches that may timeout."
        },
        assignee_organization: {
          type: "string",
          description: "Company or organization that owns the patent"
        },
        inventor_name: {
          type: "string",
          description: "Inventor's name to search for"
        },
        patent_date_start: {
          type: "string",
          description: "Patent grant date start (YYYY-MM-DD)"
        },
        patent_date_end: {
          type: "string",
          description: "Patent grant date end (YYYY-MM-DD)"
        },
        technology_area: {
          type: "string",
          description: "Technology classification or area"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction prioritizing technical content",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      },
      required: ["query_type"]
    }
  },
  {
    name: "search_patent_locations",
    description: "Search USPTO patent geographic data by location. Returns location-specific patents in a single search. Provide specific location parameters for best results. Enhanced with Exa WebSearch for comprehensive geographic patent analysis. Example: location_state='CA' for California patents, location_country='US' for US patents, location_city='San Francisco' for city-specific data.",
    inputSchema: {
      type: "object",
      properties: {
        location_city: {
          type: "string",
          description: "City name to search for"
        },
        location_state: {
          type: "string",
          description: "State code (e.g., 'CA', 'NY')"
        },
        location_country: {
          type: "string",
          description: "Country code (e.g., 'US', 'GB', 'JP')"
        },
        min_patents: {
          type: "number",
          description: "Minimum number of patents from location"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      }
    }
  },
  {
    name: "search_cpc_classifications",
    description: "Search Cooperative Patent Classification (CPC) subclass categories. Returns classification matches in one search. Provide specific CPC codes or search_text for targeted results. Enhanced with Exa WebSearch for comprehensive classification coverage. Example: cpc_section='G' for Physics patents, 'H' for Electricity patents, 'A' for Human Necessities. Add search_text to filter within sections.",
    inputSchema: {
      type: "object",
      properties: {
        cpc_section: {
          type: "string",
          description: "CPC section (A-H, Y)",
          enum: ["A", "B", "C", "D", "E", "F", "G", "H", "Y"]
        },
        cpc_subsection_id: {
          type: "string",
          description: "CPC subsection ID (e.g., 'A01B')"
        },
        search_text: {
          type: "string",
          description: "Search text in CPC titles"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      }
    }
  },
  {
    name: "search_cpc_groups",
    description: "Search Cooperative Patent Classification (CPC) groups - more detailed than subclasses. Enhanced with Exa WebSearch. Use cpc_subclass_id='G06N' for AI patents, 'H04L' for networking, or search_text='machine learning' to find relevant groups.",
    inputSchema: {
      type: "object",
      properties: {
        cpc_group_id: {
          type: "string",
          description: "CPC group ID (e.g., 'A01B1/00')"
        },
        cpc_subclass_id: {
          type: "string",
          description: "Filter by parent subclass ID"
        },
        search_text: {
          type: "string",
          description: "Search text in CPC group titles"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      }
    }
  },
  {
    name: "search_uspc_classifications",
    description: "Search US Patent Classification (USPC) categories. Returns USPC classifications in one search. Best used with specific classification IDs. Enhanced with Exa WebSearch for comprehensive legacy classification coverage. Use classification_type='mainclass' for main categories or 'subclass' for detailed subcategories. Add search_text to filter within classifications.",
    inputSchema: {
      type: "object",
      properties: {
        classification_type: {
          type: "string",
          enum: ["mainclass", "subclass"],
          description: "Type of USPC classification to search"
        },
        uspc_mainclass_id: {
          type: "string",
          description: "USPC main class ID"
        },
        search_text: {
          type: "string",
          description: "Search text in USPC titles"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      },
      required: ["classification_type"]
    }
  },
  {
    name: "search_wipo_classifications",
    description: "Search World Intellectual Property Organization (WIPO) technology fields. Returns WIPO field matches in one search. Provide specific field IDs or technology areas. Enhanced with Exa WebSearch for international classification coverage. Use search_text='biotechnology', 'telecommunications', or 'computer technology' to find relevant WIPO fields.",
    inputSchema: {
      type: "object",
      properties: {
        wipo_field_id: {
          type: "string",
          description: "WIPO field ID"
        },
        search_text: {
          type: "string",
          description: "Search text in WIPO field titles"
        },
        limit: {
          type: "number",
          description: "Number of results to return (maximum 5, or 2 for full text)",
          maximum: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart snippet extraction",
          default: false
        },
        include_text: {
          type: "boolean",
          description: "Include full text content when available",
          default: false
        }
      }
    }
  }
];

export const govInfoTools = [
  {
    name: "search_us_code",
    description: "Search United States Code using natural language queries. Supports both broad topic searches ('war powers', 'environmental protection') and specific citations ('42 USC 1983'). The system intelligently finds relevant statutory provisions without requiring knowledge of specific title or section numbers. SIGNALS: legal concepts, policy areas, regulatory topics.",
    inputSchema: {
      type: "object",
      properties: {
        search_term: {
          type: "string",
          description: "Natural language query describing the legal topic or USC content you need. EXAMPLES: 'executive war powers', 'civil rights violations by government officials', 'tax-exempt charitable organizations', 'clean air regulations'. The neural search system will intelligently find relevant USC sections - you do NOT need to know specific titles or sections upfront. Phrase your query as you would ask a legal research assistant."
        },
        title: {
          type: "number",
          description: "Optional: USC Title number (1-54) to narrow search to a specific title. Leave empty for broad natural language search across all titles. Only use if you already know the specific title number."
        },
        section: {
          type: "string",
          description: "Optional: Specific section number to find (e.g., '1983', '501'). Leave empty for natural language search. Only use if you already know the exact section number."
        },
        include_text: {
          type: "boolean",
          description: "Include full statutory text content via real-time web crawling",
          default: false
        },
        include_snippet: {
          type: "boolean", 
          description: "Include smart legal snippet with key provisions",
          default: false
        },
        limit: {
          type: "number",
          description: "Number of results to return (max 100). STRATEGY: 5-10 for comprehensive scan, 2-3 for detailed analysis.",
          maximum: 5,
          default: 5
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_usc_section",
    description: "Retrieve specific United States Code section text. UNIQUE: Exact statutory language, subsection structure, definitional provisions. SIGNALS: 'USC', specific title/section numbers, 'subsection'.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "number",
          description: "USC Title number (1-54). EXAMPLES: 15 (Commerce), 26 (Tax), 42 (Public Health)"
        },
        section: {
          type: "string",
          description: "Section identifier within title. FORMAT: '552' or '552a' (with subsection designators)"
        },
        include_text: {
          type: "boolean",
          description: "Include full section text content with subsections",
          default: true
        },
        include_snippet: {
          type: "boolean",
          description: "Include contextual highlights for key provisions",
          default: false
        }
      },
      required: ["title", "section"]
    }
  },
  {
    name: "get_usc_title_structure",
    description: "Get organizational structure for USC title chapters and sections. UNIQUE: Statutory organization, chapter structure, section numbering scheme. SIGNALS: 'title structure', 'chapters', 'organization'.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "number",
          description: "USC Title number (1-54). EXAMPLES: 15 (Commerce & Trade), 42 (Public Health), 26 (Internal Revenue)"
        },
        chapter: {
          type: "number",
          description: "Specific chapter within title (optional focus)"
        },
        include_sections: {
          type: "boolean", 
          description: "Include detailed section listings within chapters",
          default: true
        }
      },
      required: ["title"]
    }
  },
  {
    name: "list_usc_titles",
    description: "List all United States Code titles with subject areas. UNIQUE: Complete statutory organization overview, subject matter jurisdiction, positive law status. SIGNALS: 'USC titles', 'subject areas', 'organization'.",
    inputSchema: {
      type: "object",
      properties: {
        include_descriptions: {
          type: "boolean",
          description: "Include detailed title descriptions and subject matter coverage",
          default: true
        },
        include_enacted: {
          type: "boolean",
          description: "Include positive law enactment status information",
          default: false
        }
      },
      required: []
    }
  }
];

export const exaTools = [
  // No tools currently - state statute search moved to stateStatuteTools with BaseWebSearchClient integration
];

export const comprehensiveAnalysisTools = [
  {
    name: "comprehensive_legal_entity_analysis",
    description: "Perform comprehensive legal analysis across all databases for a person, company, or organization",
    inputSchema: {
      type: "object",
      properties: {
        entity_name: {
          type: "string",
          description: "Name of the person, company, or organization to research"
        },
        entity_type: {
          type: "string",
          enum: ["company", "individual", "government_agency", "organization"],
          description: "Type of entity being analyzed"
        },
        analysis_scope: {
          type: "array",
          items: {
            type: "string",
            enum: ["litigation", "regulatory", "securities", "patents", "all"]
          },
          description: "Areas of legal analysis to include",
          default: ["all"]
        },
        date_range_years: {
          type: "number",
          description: "Number of years back to search (default: 5)",
          default: 5,
          maximum: 5
        },
        include_relationships: {
          type: "boolean",
          description: "Include related entities and cross-references",
          default: true
        }
      },
      required: ["entity_name", "entity_type"]
    }
  }
];

export const filingDraftTools = [
  {
    name: "draft_legal_filing",
    description: "Generate a structured legal filing draft or outline from provided facts and evidence. Requires confirm_evidence_adequate=true for full draft.",
    inputSchema: {
      type: "object",
      properties: {
        filing_type: { type: "string", description: "complaint | motion_to_dismiss | motion_to_suppress | memorandum | brief" },
        court: { type: "string", description: "Court name/abbreviation (e.g., 'N.D. Cal.', 'ca9')" },
        jurisdiction: { type: "string", description: "federal | state" },
        parties: { type: "object", description: "{ plaintiff, defendant } or { movant, respondent }" },
        causes_of_action: { type: "array", description: "List of causes of action (if complaint)" },
        relief_sought: { type: "string", description: "Prayer for relief (if complaint)" },
        fact_summary: { type: "string", description: "Narrative of facts" },
        evidence_items: { type: "array", description: "[{ title, citation, url, excerpt, type }]" },
        case_citations: { type: "array", description: "[{ citation, name, url, holding }]" },
        confirm_evidence_adequate: { type: "boolean", description: "Must be true to produce full draft" },
        include_table_of_authorities: { type: "boolean", description: "Include a TOA if true", default: false },
        citation_format: { type: "string", description: "e.g., 'Bluebook'", default: "Bluebook" }
      },
      required: ["filing_type", "confirm_evidence_adequate"]
    }
  }
];

// PTAB tools (new)
export const ptabTools = [
  {
    name: "search_ptab_proceedings",
    description: "Search PTAB proceedings (IPR, PGR, CBM, Appeals) for patent validity challenges",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_type: {
          type: "string",
          description: "Type of PTAB proceeding (e.g., IPR, PGR, CBM, APPEAL)"
        },
        patent_number: {
          type: "string",
          description: "US Patent number (e.g., 7123456)"
        },
        petitioner: {
          type: "string",
          description: "Name of the petitioner"
        },
        patent_owner: {
          type: "string",
          description: "Name of the patent owner"
        },
        status: {
          type: "string",
          description: "Status filter (e.g., PENDING, INSTITUTED, TERMINATED)"
        },
        date_filed_after: {
          type: "string",
          description: "Filed on/after date (YYYY-MM-DD)"
        },
        date_filed_before: {
          type: "string",
          description: "Filed on/before date (YYYY-MM-DD)"
        },
        limit: {
          type: "number",
          description: "Maximum results (1-100)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "get_ptab_decisions",
    description: "Get PTAB decisions (institution/final) for a proceeding",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_number: {
          type: "string",
          description: "PTAB proceeding number (e.g., IPR2023-00123)"
        },
        decision_type: {
          type: "string",
          description: "Filter: institution | final | all",
          enum: ["institution", "final", "all"],
          default: "all"
        }
      },
      required: ["proceeding_number"]
    }
  },
  {
    name: "search_ptab_ipr_proceedings",
    description: "Search PTAB Inter Partes Review (IPR) proceedings via web search (missing from API)",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_number: {
          type: "string",
          description: "Specific IPR number (e.g., IPR2023-01055)"
        },
        patent_number: {
          type: "string",
          description: "US Patent number involved"
        },
        petitioner: {
          type: "string",
          description: "Name of the petitioner"
        },
        patent_owner: {
          type: "string",
          description: "Name of the patent owner"
        },
        year: {
          type: "string",
          description: "Year of proceeding (e.g., 2023, 2024)"
        },
        status: {
          type: "string",
          description: "Status (e.g., Instituted, Final Written Decision)"
        },
        limit: {
          type: "number",
          description: "Maximum results (1-20)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "search_ptab_pgr_proceedings",
    description: "Search PTAB Post-Grant Review (PGR) proceedings via web search (missing from API)",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_number: {
          type: "string",
          description: "Specific PGR number (e.g., PGR2023-00039)"
        },
        patent_number: {
          type: "string",
          description: "US Patent number involved"
        },
        petitioner: {
          type: "string",
          description: "Name of the petitioner"
        },
        patent_owner: {
          type: "string",
          description: "Name of the patent owner"
        },
        year: {
          type: "string",
          description: "Year of proceeding (e.g., 2023, 2024)"
        },
        status: {
          type: "string",
          description: "Status (e.g., Instituted, Final Written Decision)"
        },
        limit: {
          type: "number",
          description: "Maximum results (1-20)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "search_ptab_cbm_proceedings",
    description: "Search PTAB Covered Business Method (CBM) proceedings via web search (missing from API)",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_number: {
          type: "string",
          description: "Specific CBM number (e.g., CBM2020-00001)"
        },
        patent_number: {
          type: "string",
          description: "US Patent number involved"
        },
        petitioner: {
          type: "string",
          description: "Name of the petitioner"
        },
        patent_owner: {
          type: "string",
          description: "Name of the patent owner"
        },
        year: {
          type: "string",
          description: "Year of proceeding (e.g., 2020, 2021)"
        },
        status: {
          type: "string",
          description: "Status (e.g., Instituted, Final Written Decision)"
        },
        limit: {
          type: "number",
          description: "Maximum results (1-20)",
          default: 5,
          maximum: 5
        }
      }
    }
  },
  {
    name: "search_all_ptab_aia_proceedings",
    description: "Search all PTAB AIA proceedings (IPR, PGR, CBM) via web search",
    inputSchema: {
      type: "object",
      properties: {
        proceeding_number: {
          type: "string",
          description: "Any proceeding number (IPR/PGR/CBM)"
        },
        patent_number: {
          type: "string",
          description: "US Patent number involved"
        },
        petitioner: {
          type: "string",
          description: "Name of the petitioner"
        },
        patent_owner: {
          type: "string",
          description: "Name of the patent owner"
        },
        year: {
          type: "string",
          description: "Year of proceeding"
        },
        status: {
          type: "string",
          description: "Status filter"
        },
        limit: {
          type: "number",
          description: "Maximum results (1-20)",
          default: 5,
          maximum: 5
        }
      }
    }
  }
];

// FTC tools (consolidated from 12 to 6 endpoints)
export const ftcTools = [
  {
    name: "search_ftc_enforcement_cases",
    description: "Search FTC enforcement actions, cases, and consent orders (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "General search term or legal issue" },
        defendant_name: { type: "string", description: "Optional defendant/company filter" },
        date_filed_after: { type: "string", description: "Cases/enforcement after this date (YYYY-MM-DD)" },
        date_filed_before: { type: "string", description: "Cases/enforcement before this date (YYYY-MM-DD)" },
        include_consent_orders: { type: "boolean", description: "Include consent orders and agreements", default: true },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_ftc_competition_matters",
    description: "Search FTC competition matters including antitrust cases, mergers, and HSR filings (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Competition topic, company names, or transaction type" },
        date_after: { type: "string", description: "Competition matters after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Competition matters before this date (YYYY-MM-DD)" },
        include_hsr: { type: "boolean", description: "Include HSR early termination notices and premerger data", default: true },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_ftc_guidance_policy",
    description: "Search FTC guidance, policy statements, advisory opinions, and business compliance resources (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Policy area, business topic, industry, or conduct type" },
        date_after: { type: "string", description: "Guidance/policy after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Guidance/policy before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_ftc_rulemaking",
    description: "Search FTC rulemaking including proposed and final rules (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Industry, rule topic, or regulation area" },
        date_after: { type: "string", description: "Rules after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Rules before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_ftc_consumer_alerts",
    description: "Search FTC consumer alerts and fraud warnings (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Scam type, fraud topic, or consumer issue" },
        date_after: { type: "string", description: "Alerts after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Alerts before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_ftc_news",
    description: "Search FTC news, press releases, and announcements (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "News topic, enforcement action, or event" },
        date_after: { type: "string", description: "News after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "News before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  }
];

// EPA tools (ECHO)
export const epaTools = [
  {
    name: "search_epa_facilities", 
    description: "Search EPA-regulated facilities and compliance data. UNIQUE: Environmental violations, enforcement actions, facility permits. SIGNALS: 'EPA facility', 'environmental compliance', 'violations', 'Clean Air Act', 'Clean Water Act'. REQUIREMENT: Must include (facility_name) OR (city) OR (zip_code) OR (company_name + state together). company_name ALONE is NOT sufficient - you must also provide state.",
    inputSchema: {
      type: "object",
      properties: {
        facility_name: { type: "string", description: "Facility name (partial match) - Works alone without state" },
        company_name: { type: "string", description: "Company name - REQUIRES state parameter (e.g., company_name='Bristol-Myers Squibb', state='NJ')" },
        city: { type: "string", description: "City name - Works alone to find facilities in that city" },
        state: { type: "string", description: "State code (e.g., 'NJ', 'NY', 'PA') - REQUIRED when using company_name" },
        zip_code: { type: "string", description: "ZIP code - Alternative to city for location specificity" },
        compliance_status: { type: "string", description: "Filter for violations (use 'violation' to return noncompliance)" },
        violations_last_3_years: { type: "boolean", description: "Only facilities with violations in last 3 years" },
        query_id: { type: "string", description: "Use ECHO QueryID for paginated retrieval" },
        page_number: { type: "number", description: "Page number to request for a QueryID (1-based)" },
        limit: { type: "number", description: "Number of facilities to return (fixed at 25 for comprehensive screening). Provides compliance status, penalties, and program flags to enable intelligent facility selection. Use QueryID pagination for additional results.", default: 25, maximum: 25 },
        include_full_text: { type: "boolean", description: "Include full EPA document text from web search (use sparingly to avoid token limits)", default: false }
      }
    }
  },
  {
    name: "search_epa_violations", 
    description: "Enhanced with Exa WebSearch - Search violations for a specific EPA facility from echo.epa.gov with current data, with optional program/date filters",
    inputSchema: {
      type: "object",
      properties: {
        facility_id: { type: "string", description: "EPA facility/FRS ID (required)" },
        program: { type: "string", description: "Optional program filter (e.g., CAA, CWA, RCRA)" },
        date_after: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "End date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Max violations to return (maximum 5)", default: 5, maximum: 5 }
      },
      required: ["facility_id"]
    }
  },
  {
    name: "get_epa_facility_compliance_report",
    description: "Enhanced with Exa WebSearch - Get detailed EPA facility compliance report from echo.epa.gov with live data, including violations and enforcement actions",
    inputSchema: {
      type: "object",
      properties: {
        facility_id: { type: "string", description: "EPA facility/FRS ID (required - from search results)" },
        include_violations: { type: "boolean", description: "Include violations list", default: true },
        include_enforcement: { type: "boolean", description: "Include enforcement actions", default: true },
        include_full_text: { type: "boolean", description: "Include full EPA document text from web search (use sparingly to avoid token limits)", default: false }
      },
      required: ["facility_id"]
    }
  }
];

// FDA tools (Hybrid: OpenFDA API + Exa fallback - Phase 4.4)
export const fdaTools = [
  {
    name: "search_fda_drug_adverse_events",
    description: "Search FDA drug adverse events (FAERS database). Uses hybrid routing with WebSearch-first strategy for token efficiency.\n\n🎯 QUERY CONSTRUCTION GUIDE:\n\n✅ EFFECTIVE QUERIES (Get specific FAERS records):\n• Include 'FAERS' or 'MedWatch database' for specific adverse event records\n• Include both brand name AND generic name\n• Include specific adverse event (not general search)\n• Example: 'Ozempic semaglutide FAERS pancreatitis adverse events database'\n• Example: 'Lipitor atorvastatin FAERS muscle pain rhabdomyolysis database'\n\n❌ INEFFECTIVE QUERIES (Get generic FDA pages):\n• 'Ozempic pancreatitis' → Returns general FDA information pages\n• 'blood pressure medication side effects' → Too generic\n\n📊 USE CASES:\n• Specific drug + specific adverse event: 'Xarelto rivaroxaban FAERS bleeding hemorrhage'\n• Drug class investigation: 'SSRI antidepressants FAERS birth defects pregnancy'\n• Serious event analysis: 'chemotherapy drugs FAERS death hospitalization'\n\n⚠️ Note: Token-managed with limit defaults. For large result sets, use specialized tools like search_fda_drug_safety_communications.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query - For specific FAERS database records, use format: '[Brand name] [generic name] FAERS [specific adverse event] database'. Example: 'Ozempic semaglutide FAERS pancreatitis adverse events database' NOT just 'Ozempic pancreatitis'. For openFDA syntax, use field notation: 'patient.drug.medicinalproduct:aspirin'" },
        limit: { type: "number", description: "Number of results to return (default 2 for token management, max 5 if more needed)", default: 2, maximum: 5 },
        skip: { type: "number", description: "Offset for pagination" },
        sort: { type: "string", description: "Sort field, e.g., 'receivedate:desc'" },
        count: { type: "string", description: "Aggregation field for counts (e.g., 'receivedate')" },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction focusing on safety information", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_device_events",
    description: "Search FDA medical device adverse events (MAUDE database). Uses hybrid routing with WebSearch-first strategy for token efficiency.\n\n🎯 QUERY CONSTRUCTION GUIDE:\n\n✅ EFFECTIVE QUERIES (Get specific MAUDE records):\n• Include 'MAUDE' or 'MAUDE database' for specific device event records\n• Include manufacturer + device type/brand + specific malfunction\n• Example: 'Medtronic pacemaker MAUDE database battery malfunction failure'\n• Example: 'Boston Scientific stent MAUDE thrombosis occlusion'\n\n❌ INEFFECTIVE QUERIES (Get generic FDA pages):\n• 'Medtronic pacemaker problems' → Returns general device information\n• 'hip implant recalls' → Too generic without database identifier\n\n📊 USE CASES:\n• Device malfunction investigation: 'Abbott cardiac monitor MAUDE false alarm malfunction'\n• Manufacturer-specific analysis: 'Johnson & Johnson surgical mesh MAUDE erosion pain'\n• Device category analysis: 'insulin pumps MAUDE occlusion alarm failure'\n\n⚠️ Note: Token-managed with limit defaults. For large result sets, use specialized tools like search_fda_device_safety_communications.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query - For specific MAUDE database records, use format: '[Manufacturer] [device type] MAUDE [specific malfunction] database'. Example: 'Medtronic pacemaker MAUDE battery malfunction failure' NOT just 'Medtronic pacemaker problems'. For openFDA syntax, use field notation: 'device.manufacturer_d_name:Medtronic'" },
        limit: { type: "number", description: "Number of results to return (default 2 for token management, max 5 if more needed)", default: 2, maximum: 5 },
        skip: { type: "number", description: "Offset for pagination" },
        sort: { type: "string", description: "Sort field" },
        count: { type: "string", description: "Aggregation field for counts" },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction focusing on device safety issues", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_drug_labels",
    description: "Search FDA drug labels and prescribing information (SPL database). Uses hybrid routing with WebSearch-first strategy for token efficiency.\n\n🎯 QUERY CONSTRUCTION GUIDE:\n\n✅ EFFECTIVE QUERIES (Get specific prescribing information):\n• Include 'prescribing information' or 'package insert' for official labels\n• Include 'black box warning' for critical safety information\n• Include both brand name AND generic name\n• Example: 'Prozac fluoxetine prescribing information black box warning suicidality'\n• Example: 'Warfarin Coumadin package insert dosage interactions contraindications'\n\n❌ INEFFECTIVE QUERIES (Get generic FDA pages):\n• 'Prozac warnings' → Returns general drug information pages\n• 'antibiotic dosing' → Too generic without specific drug\n\n📊 USE CASES:\n• Safety information: 'Metformin prescribing information lactic acidosis contraindications'\n• Dosing guidance: 'Insulin glargine Lantus package insert dosage titration'\n• Drug interactions: 'Statins prescribing information CYP3A4 interactions grapefruit'\n\n⚠️ Note: Token-managed with limit defaults. For large result sets, use specialized tools like search_fda_drug_safety_communications.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query - For specific prescribing information, use format: '[Brand name] [generic name] prescribing information [specific section]'. Example: 'Prozac fluoxetine prescribing information black box warning' NOT just 'Prozac warnings'. For openFDA syntax, use field notation: 'openfda.brand_name:ibuprofen'" },
        limit: { type: "number", description: "Number of results to return (default 2 for token management, max 5 if more needed)", default: 2, maximum: 5 },
        skip: { type: "number", description: "Offset for pagination" },
        sort: { type: "string", description: "Sort field" },
        count: { type: "string", description: "Aggregation field for counts" },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction prioritizing warnings, contraindications, and dosage", default: false },
        include_text: { type: "boolean", description: "Include full prescribing information", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_recalls",
    description: "Search FDA recalls and enforcement reports (drug, device, food). Uses hybrid routing with WebSearch-first strategy for token efficiency.\n\n🎯 QUERY CONSTRUCTION GUIDE:\n\n✅ EFFECTIVE QUERIES (Get specific enforcement reports):\n• Include 'enforcement report' or 'recall database' for specific records\n• Include recall class if relevant (Class I, II, III)\n• Include product name + specific contamination/defect\n• Example: 'Listeria monocytogenes ice cream enforcement report Class I recall'\n• Example: 'Abbott infant formula recall database Cronobacter contamination'\n\n❌ INEFFECTIVE QUERIES (Get generic FDA pages):\n• 'food recalls' → Too generic without product/contaminant\n• 'medical device recalls 2024' → Missing specific product/issue\n\n📊 USE CASES:\n• Contamination recalls: 'Salmonella peanut butter enforcement report voluntary recall'\n• Device defect recalls: 'Philips CPAP recall database foam degradation Class I'\n• Drug quality recalls: 'valsartan NDMA impurity recall database Class II'\n\n⚠️ Note: Token-managed with limit defaults. Specify product_area (drug/device/food) for targeted results.",
    inputSchema: {
      type: "object",
      properties: {
        product_area: { type: "string", description: "'drug' | 'device' | 'food'", enum: ["drug", "device", "food"], default: "drug" },
        search: { type: "string", description: "Search query - For specific enforcement reports, use format: '[Product/contaminant] enforcement report recall database [Class]'. Example: 'Listeria ice cream enforcement report Class I recall' NOT just 'ice cream recalls'. For openFDA syntax, use field notation: 'reason_for_recall:salmonella'" },
        limit: { type: "number", description: "Number of results to return (default 2 for token management, max 5 if more needed)", default: 2, maximum: 5 },
        skip: { type: "number", description: "Offset for pagination" },
        sort: { type: "string", description: "Sort field" },
        count: { type: "string", description: "Aggregation field for counts" },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction focusing on recall reasons and risk statements", default: false },
        include_text: { type: "boolean", description: "Include full recall document text", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_warning_letters",
    description: "Search FDA warning letters for regulatory violations and enforcement actions (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Company name, product, violation type, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include violation and action details", default: false },
        include_text: { type: "boolean", description: "Include full letter text", default: false },
        date_after: { type: "string", description: "Letters issued after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Letters issued before this date (YYYY-MM-DD)" }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_drug_safety_communications",
    description: "Search FDA drug safety communications and MedWatch alerts (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Drug name, safety issue, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include safety alert highlights", default: false },
        include_text: { type: "boolean", description: "Include full communication text", default: false },
        date_after: { type: "string", description: "Communications after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Communications before this date (YYYY-MM-DD)" }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_device_safety_communications",
    description: "Search FDA medical device safety communications and alerts (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Device name, manufacturer, safety issue, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include safety issue highlights", default: false },
        include_text: { type: "boolean", description: "Include full communication text", default: false },
        date_after: { type: "string", description: "Communications after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Communications before this date (YYYY-MM-DD)" }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_drug_shortages",
    description: "Search current and resolved FDA drug shortages (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Drug name, therapeutic area, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include shortage reason and status", default: false },
        include_text: { type: "boolean", description: "Include full shortage details", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_510k",
    description: "Search FDA 510(k) premarket notifications for medical devices (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Device name, K number, manufacturer, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include clearance details", default: false },
        include_text: { type: "boolean", description: "Include full 510(k) summary", default: false },
        date_after: { type: "string", description: "Clearances after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Clearances before this date (YYYY-MM-DD)" }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_pma_approvals",
    description: "Search FDA PMA (Premarket Approval) for high-risk medical devices (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Device name, PMA number, manufacturer, or general search" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include approval details", default: false },
        include_text: { type: "boolean", description: "Include full PMA summary", default: false },
        date_after: { type: "string", description: "Approvals after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Approvals before this date (YYYY-MM-DD)" }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_orange_book",
    description: "Search FDA Orange Book for drug patents and exclusivities (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Drug name, active ingredient, or application number" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include patent and exclusivity highlights", default: false },
        include_text: { type: "boolean", description: "Include full Orange Book entry", default: false }
      },
      required: ["search"]
    }
  },
  {
    name: "search_fda_purple_book",
    description: "Search FDA Purple Book for biological products and biosimilars (powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Biologic name, biosimilar, or reference product" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include biosimilarity and interchangeability info", default: false },
        include_text: { type: "boolean", description: "Include full Purple Book entry", default: false }
      },
      required: ["search"]
    }
  }
];

// CPSC tools (consolidated from 10 to 7 endpoints)
export const cpscTools = [
  {
    name: "search_cpsc_recalls",
    description: "Search CPSC product recalls (cpsc.gov) via enhanced Exa WebSearch. Provides smart snippet extraction for safety-critical content and comprehensive metadata extraction.",
    inputSchema: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Product name contains (legacy parameter name)" },
        search_term: { type: "string", description: "Product name or search term" },
        recalling_firm: { type: "string", description: "Recalling firm/manufacturer name" },
        hazard: { type: "string", description: "Hazard type (legacy parameter name)" },
        hazard_type: { type: "string", description: "Hazard type: fire, choking, laceration, fall, entanglement, chemical, electrical, impact, ingestion" },
        recall_id: { type: "string", description: "Recall ID or number" },
        product_category: { type: "string", description: "Product category: toys, furniture, appliances, electronics, clothing, tools, sports, automotive" },
        date_start: { type: "string", description: "Earliest recall date (YYYY-MM-DD) - legacy parameter" },
        date_end: { type: "string", description: "Latest recall date (YYYY-MM-DD) - legacy parameter" },
        date_after: { type: "string", description: "Recalls after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Recalls before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction focusing on safety-critical content", default: false },
        include_text: { type: "boolean", description: "Include full text content from recall pages", default: false }
      }
    }
  },
  {
    name: "search_cpsc_enforcement",
    description: "Search CPSC enforcement actions including violations, penalties, and enforcement reports (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Violation type, company, or enforcement issue" },
        company_name: { type: "string", description: "Company or manufacturer name" },
        date_after: { type: "string", description: "Enforcement actions after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Enforcement actions before this date (YYYY-MM-DD)" },
        include_violations: { type: "boolean", description: "Include violation notices and Section 15 reports", default: true },
        include_penalties: { type: "boolean", description: "Include civil penalties and settlements", default: true },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_cpsc_business_guidance",
    description: "Search CPSC business and manufacturing guidance including small business resources (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Business area, compliance topic, or manufacturing guidance" },
        date_after: { type: "string", description: "Guidance after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Guidance before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_cpsc_safety_standards",
    description: "Search CPSC safety standards and regulations including mandatory and voluntary standards (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Product category, standard number, or regulation topic" },
        date_after: { type: "string", description: "Standards after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Standards before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_cpsc_injury_data",
    description: "Search CPSC injury data and statistics including NEISS data (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Product, injury type, or demographic" },
        product_code: { type: "string", description: "NEISS product code" },
        injury_type: { type: "string", description: "Type of injury" },
        age_group: { type: "string", description: "Age group or demographic" },
        date_after: { type: "string", description: "Data after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Data before this date (YYYY-MM-DD)" },
        include_neiss: { type: "boolean", description: "Include NEISS emergency department data", default: true },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_cpsc_news",
    description: "Search CPSC news, press releases, and announcements including events (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "News topic, recall announcement, or enforcement action" },
        date_after: { type: "string", description: "News after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "News before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  },
  {
    name: "search_cpsc_reports_studies",
    description: "Search CPSC reports, studies, research, and commission statements (consolidated endpoint, powered by Exa WebSearch)",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Research topic, policy area, or study subject" },
        date_after: { type: "string", description: "Reports after this date (YYYY-MM-DD)" },
        date_before: { type: "string", description: "Reports before this date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Number of results (maximum 5)", default: 5, maximum: 5 },
        include_snippet: { type: "boolean", description: "Include smart snippet extraction", default: false },
        include_text: { type: "boolean", description: "Include full document text", default: false }
      }
    }
  }
];

// NHTSA tools
export const nhtsaTools = [
  {
    name: "nhtsa_decode_vin",
    description: "Decode VIN or search general vehicle information via NHTSA. FEATURES: 60% campaign ID extraction, vehicle specs from URLs, smart fallbacks. BEST: When VIN unknown, shows VIN decoder resources. EXTRACTS: Make/model/year from URLs, technical specifications, recall cross-references.",
    inputSchema: {
      type: "object",
      properties: {
        vin: { type: "string", description: "Vehicle identification number (VIN) - OPTIONAL. If empty, returns general VIN decoder resources and recent vehicle safety information." },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with key vehicle specifications and extracted metadata" },
        include_text: { type: "boolean", default: false, description: "Include full text content for detailed technical analysis" }
      },
      required: []
    }
  },
  {
    name: "nhtsa_models_for_make",
    description: "Get vehicle models with 80% campaign ID extraction and 40% vehicle info coverage. FEATURES: Smart defaults (Ford 2023), vehicle specs from URLs, recall cross-references. BEST: When exploring manufacturer model lines. EXTRACTS: Technical service bulletins, VIN attachments, model specifications.",
    inputSchema: {
      type: "object",
      properties: {
        make: { type: "string", description: "Vehicle manufacturer (e.g., Honda, Ford, Toyota) - OPTIONAL. Defaults to Ford if not provided." },
        year: { type: "number", description: "Model year to filter by - OPTIONAL. Defaults to 2023 for current relevance." },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with model specifications and extracted campaign IDs" },
        include_text: { type: "boolean", default: false, description: "Include full text content with detailed model information and safety data" }
      },
      required: []
    }
  },
  {
    name: "nhtsa_recalls_by_vin",
    description: "Find safety recalls with 93% campaign ID extraction rate and 80% vehicle info coverage. FEATURES: Automatic campaign ID extraction (23V-456 format), safety-critical flagging, smart fallbacks. BEST: When VIN known. FALLBACK: Shows recent recalls if VIN empty. SAFETY: Auto-flags critical recalls for immediate review.",
    inputSchema: {
      type: "object",
      properties: {
        vin: { type: "string", description: "Vehicle identification number (VIN) - OPTIONAL. If empty, returns recent safety recalls and campaign information." },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with defect summary, extracted campaign ID, and safety risk assessment" },
        include_text: { type: "boolean", default: false, description: "Include full recall campaign details, remedy procedures, and affected component information" }
      },
      required: []
    }
  },
  {
    name: "nhtsa_recalls_by_make_model_year",
    description: "Find recalls with 95% campaign ID extraction and 95% vehicle info coverage - HIGHEST SUCCESS RATE. FEATURES: Comprehensive recall database search, automatic campaign ID extraction, safety-critical flagging. BEST: When make/model/year known. EXTRACTS: NHTSA campaign IDs, affected components, remedy procedures. SAFETY: Immediate review flagging for critical recalls.",
    inputSchema: {
      type: "object",
      properties: {
        make: { type: "string", description: "Vehicle manufacturer - OPTIONAL. Defaults to Toyota if not provided for demonstration." },
        model: { type: "string", description: "Vehicle model - OPTIONAL. Defaults to Camry for comprehensive recall data." },
        year: { type: "number", description: "Model year - OPTIONAL. Defaults to 2023 for current safety relevance." },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with defect summary, campaign ID, and safety consequences" },
        include_text: { type: "boolean", default: false, description: "Include full recall campaign details, remedy procedures, and affected component analysis" }
      },
      required: []
    }
  },
  {
    name: "nhtsa_search_complaints",
    description: "Search consumer complaints and defect reports by vehicle specifications or VIN. Enhanced with Exa WebSearch to find ODI complaint numbers, incident descriptions, and outcomes from NHTSA databases. Features 100% campaign ID coverage from complaint databases with smart parameter defaults - all parameters optional.",
    inputSchema: {
      type: "object",
      properties: {
        make: { type: "string", description: "Vehicle manufacturer (optional - smart defaults applied if not provided)" },
        model: { type: "string", description: "Vehicle model (optional - smart defaults applied if not provided)" },
        year: { type: "number", description: "Model year (optional - smart defaults applied if not provided)" },
        vin: { type: "string", description: "Vehicle identification number (optional - smart fallback to popular recalls if not provided)" },
        limit: { type: "number", default: 5, maximum: 5, description: "Number of results (maximum 5)" },
        start: { type: "number", default: 0, description: "Starting offset for pagination (default: 0)" },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with incident description (default: false)" },
        include_text: { type: "boolean", default: false, description: "Include full complaint details and outcomes (default: false)" }
      },
      required: []
    }
  },
  {
    name: "nhtsa_safety_ratings",
    description: "Get NCAP 5-star safety ratings and crash test results for vehicles by year, make, and model. Enhanced with Exa WebSearch to extract overall ratings, individual test scores, and safety feature information. Features 100% campaign ID coverage and 60% vehicle information extraction with smart parameter defaults - all parameters optional.",
    inputSchema: {
      type: "object",
      properties: {
        year: { type: "number", description: "Model year (optional - smart defaults to recent model years if not provided)" },
        make: { type: "string", description: "Vehicle manufacturer (optional - smart defaults applied if not provided)" },
        model: { type: "string", description: "Vehicle model (optional - smart defaults applied if not provided)" },
        include_snippet: { type: "boolean", default: false, description: "Include smart snippet with overall rating and key safety scores (default: false)" },
        include_text: { type: "boolean", default: false, description: "Include full crash test results and safety feature details (default: false)" }
      },
      required: []
    }
  }
];

// State Court Rules tools
export const stateCourtRulesTools = [
  {
    name: "search_court_rules",
    description: "Search state court rules and formatting requirements",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code (e.g., CA, NY)" },
        rule_type: { type: "string", enum: ["formatting", "procedural", "electronic", "local"], description: "Type of rule to search for" },
        court_level: { type: "string", enum: ["superior", "appellate", "supreme"], description: "Court level" },
        specific_rule: { type: "string", description: "Specific rule number or topic" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state", "rule_type"]
    }
  },
  {
    name: "get_formatting_requirements",
    description: "Get document formatting requirements for specific state courts",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        court_level: { type: "string", enum: ["superior", "appellate", "supreme"], description: "Court level" },
        document_type: { type: "string", description: "Type of document (complaint, motion, brief, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_electronic_filing_rules",
    description: "Get electronic filing technical requirements and procedures",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        court_level: { type: "string", enum: ["superior", "appellate", "supreme"], description: "Court level" },
        filing_type: { type: "string", description: "Type of filing or document" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "search_local_rules",
    description: "Search county or district-specific local court rules",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        county: { type: "string", description: "County or district name" },
        rule_topic: { type: "string", description: "Specific rule topic or subject" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_court_specific_procedures",
    description: "Get procedures specific to particular courts or divisions",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        court_name: { type: "string", description: "Specific court or division name" },
        procedure_type: { type: "string", description: "Type of procedure (case management, motion practice, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "check_rule_updates",
    description: "Check for recent court rule changes and updates",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        effective_after: { type: "string", description: "Find updates effective after this date (YYYY-MM-DD)" },
        rule_category: { type: "string", description: "Category of rules to check" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_document_templates",
    description: "Get state-specific document templates and forms",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        document_type: { type: "string", description: "Type of document template needed" },
        court_level: { type: "string", enum: ["superior", "appellate", "supreme"], description: "Court level" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state", "document_type"]
    }
  },
  {
    name: "validate_document_compliance",
    description: "Check document compliance against state court rules",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        document_type: { type: "string", description: "Type of document to validate" },
        compliance_area: { type: "string", description: "Specific compliance area (formatting, procedure, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state", "document_type"]
    }
  },
  {
    name: "get_citation_requirements",
    description: "Get state-specific citation format requirements",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        citation_type: { type: "string", description: "Type of citation (case, statute, regulation, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_discovery_rules",
    description: "Get discovery rules and motion requirements",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        discovery_type: { type: "string", description: "Type of discovery (interrogatories, depositions, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_appellate_requirements",
    description: "Get appellate brief requirements and formatting standards",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        brief_type: { type: "string", description: "Type of brief (opening, response, reply)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  },
  {
    name: "get_emergency_procedures",
    description: "Get emergency filing procedures (TRO, injunctions, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter state code" },
        emergency_type: { type: "string", description: "Type of emergency procedure (TRO, preliminary injunction, etc.)" },
        limit: { type: "number", minimum: 1, maximum: 5, default: 5, description: "Number of results (maximum 5)" }
      },
      required: ["state"]
    }
  }
];

// Combine all tools for export
// State Statute Tools
export const stateStatuteTools = [
  {
    name: "search_state_statute",
    description: "Search state statutes and legislation using enhanced web search with comprehensive coverage of all 50 states + DC",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "Two-letter state code (required) - e.g., 'CA', 'NY', 'TX', 'FL'",
          pattern: "^[A-Z]{2}$"
        },
        query: {
          type: "string",
          description: "Search terms for statute content (required) - e.g., 'criminal procedure', 'family law', 'business corporations'"
        },
        statute_type: {
          type: "string",
          description: "Type of legislation to focus on",
          enum: ["code", "bill", "resolution", "amendment", "regulation"]
        },
        subject_area: {
          type: "string",
          description: "Subject area to focus search on",
          enum: ["criminal", "civil", "business", "family", "property", "tax", "education", "health", "environmental", "employment"]
        },
        section_number: {
          type: "string",
          description: "Specific section or citation reference (e.g., '101.001', '1234')"
        },
        year: {
          type: "number",
          description: "Specific year or legislative session to focus on"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (1-15)",
          minimum: 1,
          maximum: 5,
          default: 5
        },
        include_snippet: {
          type: "boolean",
          description: "Include smart content snippets in results",
          default: true
        },
        include_text: {
          type: "boolean",
          description: "Include full text content in results",
          default: false
        }
      },
      required: ["state", "query"]
    }
  }
];

export const allTools = [
  ...courtListenerTools,
  ...financialDisclosureTools,
  ...secEdgarTools,
  ...federalRegisterTools,
  ...usptoTools,
  ...govInfoTools,
  ...ptabTools,
  ...ftcTools,
  ...epaTools,
  ...fdaTools,
  ...cpscTools,
  ...nhtsaTools,
  ...exaTools,
  ...comprehensiveAnalysisTools,
  ...filingDraftTools,
  ...stateCourtRulesTools,
  ...stateStatuteTools,
  {
    name: 'think',
    description:
      'Pause and reason through complex problems. Use for multi-step analysis, verifying information, or planning before proceeding.',
    inputSchema: {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: 'Your reasoning or analysis of the current situation'
        }
      },
      required: ['thought']
    }
  }
];
        
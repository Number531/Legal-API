/**
 * Conversation Management Tool Definitions
 * 
 * Defines MCP tools for managing legal research conversation sessions
 */

export const conversationToolDefinitions = {
  "start_legal_session": {
    "description": "Start a new legal research conversation session for continuity across multiple queries",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the legal research session",
          "minLength": 1,
          "maxLength": 200
        },
        "user_id": {
          "type": "string",
          "description": "User identifier for the session (optional)",
          "format": "uuid"
        },
        "context": {
          "type": "string",
          "description": "Legal context or case background",
          "enum": [
            "contract_law", 
            "corporate_law", 
            "regulatory_compliance", 
            "patent_law", 
            "environmental_law", 
            "criminal_law",
            "civil_litigation",
            "bankruptcy_law",
            "employment_law",
            "tax_law",
            "general_research"
          ]
        },
        "jurisdiction": {
          "type": "string",
          "description": "Primary jurisdiction for research (e.g., 'federal', 'california', 'new_york')"
        },
        "practice_area": {
          "type": "string",
          "description": "Legal practice area focus"
        }
      },
      "required": ["title"]
    }
  },

  "resume_legal_session": {
    "description": "Resume an existing legal research session",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversation_id": {
          "type": "string",
          "description": "ID of the conversation session to resume",
          "format": "uuid"
        }
      },
      "required": ["conversation_id"]
    }
  },

  "recall_findings": {
    "description": "Retrieve previous research findings from a legal session",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversation_id": {
          "type": "string",
          "description": "ID of the conversation session",
          "format": "uuid"
        },
        "topic": {
          "type": "string",
          "description": "Optional: Filter findings by specific topic or legal concept"
        },
        "tool_type": {
          "type": "string",
          "description": "Optional: Filter findings by research tool type",
          "enum": [
            "search_cases",
            "get_case_details", 
            "lookup_citation",
            "sec_search",
            "epa_search",
            "ptab_search",
            "state_statute_search",
            "federal_register_search",
            "uspto_patent_search",
            "govinfo_search"
          ]
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of findings to return (default: 5, max: 20)",
          "minimum": 1,
          "maximum": 20,
          "default": 5
        }
      },
      "required": ["conversation_id"]
    }
  },

  "summarize_session": {
    "description": "Get a comprehensive summary of all research conducted in a legal session",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversation_id": {
          "type": "string",
          "description": "ID of the conversation session to summarize",
          "format": "uuid"
        },
        "include_metrics": {
          "type": "boolean",
          "description": "Include detailed metrics and statistics",
          "default": true
        }
      },
      "required": ["conversation_id"]
    }
  },

  "list_conversations": {
    "description": "List available legal research conversation sessions",
    "inputSchema": {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "string",
          "description": "Optional: Filter conversations by user",
          "format": "uuid"
        },
        "limit": {
          "type": "number",
          "description": "Optional: Limit number of conversations returned",
          "minimum": 1,
          "maximum": 100,
          "default": 10
        },
        "context_filter": {
          "type": "string",
          "description": "Optional: Filter by legal context",
          "enum": [
            "contract_law", 
            "corporate_law", 
            "regulatory_compliance", 
            "patent_law", 
            "environmental_law", 
            "criminal_law",
            "civil_litigation",
            "bankruptcy_law",
            "employment_law",
            "tax_law",
            "general_research"
          ]
        },
        "since_date": {
          "type": "string",
          "description": "Optional: Only show conversations since this date (ISO 8601 format)",
          "format": "date-time"
        }
      }
    }
  },

  "get_conversation_health": {
    "description": "Get health status and metrics for the conversation bridge system",
    "inputSchema": {
      "type": "object",
      "properties": {
        "detailed": {
          "type": "boolean",
          "description": "Include detailed metrics and diagnostics",
          "default": false
        }
      }
    }
  },

  "search_conversation_history": {
    "description": "Search across conversation history for specific legal topics or findings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query for conversation content",
          "minLength": 3
        },
        "user_id": {
          "type": "string",
          "description": "Optional: Limit search to specific user's conversations",
          "format": "uuid"
        },
        "context_filter": {
          "type": "string",
          "description": "Optional: Limit search to specific legal context",
          "enum": [
            "contract_law", 
            "corporate_law", 
            "regulatory_compliance", 
            "patent_law", 
            "environmental_law", 
            "general_research"
          ]
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of results to return",
          "minimum": 1,
          "maximum": 50,
          "default": 10
        }
      },
      "required": ["query"]
    }
  },

  "export_conversation": {
    "description": "Export a conversation session to various formats",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversation_id": {
          "type": "string",
          "description": "ID of the conversation to export",
          "format": "uuid"
        },
        "format": {
          "type": "string",
          "description": "Export format",
          "enum": ["json", "markdown", "plain_text", "summary"],
          "default": "markdown"
        },
        "include_metadata": {
          "type": "boolean",
          "description": "Include technical metadata in export",
          "default": false
        }
      },
      "required": ["conversation_id"]
    }
  }
};

/**
 * Get all conversation tool names
 */
export function getConversationToolNames() {
  return Object.keys(conversationToolDefinitions);
}

/**
 * Check if a tool is a conversation management tool
 */
export function isConversationTool(toolName) {
  return toolName in conversationToolDefinitions;
}

/**
 * Get tool definition by name
 */
export function getToolDefinition(toolName) {
  return conversationToolDefinitions[toolName] || null;
}
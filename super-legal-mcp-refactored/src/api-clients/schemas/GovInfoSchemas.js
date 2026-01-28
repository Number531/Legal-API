/**
 * GovInfoSchemas.js
 * JSON Schema v7 definitions for United States Code (USC) data extraction via GovInfo
 *
 * Provides structured extraction for:
 * - USC search results (title, section, citation metadata)
 * - Specific USC sections with full text
 * - USC title structure and organization
 */

import { createSchema } from './BaseSchemas.js';

// ===== USC Search Result Schema =====
export const USCSearchResultSchema = createSchema(
  'USC Search Result',
  {
    usc_citation: {
      type: 'string',
      description: 'Official USC citation (e.g., "42 U.S.C. § 1983")',
      pattern: '^\\d+\\s+(U\\.S\\.C\\.|USC)\\s*§?\\s*\\d+[a-z]?'
    },
    title_number: {
      type: 'integer',
      minimum: 1,
      maximum: 54,
      description: 'USC title number (1-54)'
    },
    section_number: {
      type: 'string',
      description: 'Section number within the title (may include letter suffixes)'
    },
    section_title: {
      type: 'string',
      description: 'Title or heading of the section'
    },
    chapter: {
      type: 'string',
      description: 'Chapter number or designation'
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'URL to the official source on govinfo.gov or other authoritative site'
    },
    published_date: {
      type: 'string',
      description: 'Date the content was published or last updated (ISO 8601)'
    },
    snippet: {
      type: 'string',
      description: 'Brief excerpt or summary of the section content'
    },
    relevance_score: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Relevance score from search results'
    }
  },
  ['usc_citation', 'title_number']
);

// ===== USC Search Result Schema - Simple (for Natural Language Queries) =====
export const USCSearchResultSchemaSimple = createSchema(
  'USC Search Result - Simple',
  {
    // Generic fields that work better with Exa extraction for natural language queries
    content: {
      type: 'string',
      description: 'Main statutory text or summary'
    },
    citation: {
      type: 'string',
      description: 'USC citation reference (any format accepted)'
    },
    title_info: {
      type: 'object',
      description: 'Title and section information',
      properties: {
        title_number: {
          type: 'integer',
          description: 'USC title number'
        },
        section_number: {
          type: 'string',
          description: 'Section number'
        }
      }
    },
    metadata: {
      type: 'object',
      description: 'Additional document metadata (source, date, etc.)'
    },
    relevance_score: {
      type: 'integer',
      description: 'Relevance to search query (0-100)',
      minimum: 0,
      maximum: 100
    }
  },
  ['content']  // Only 'content' required - more flexible than complex schema
);

// ===== USC Section Schema =====
export const USCSectionSchema = createSchema(
  'USC Section',
  {
    title_number: {
      type: 'integer',
      minimum: 1,
      maximum: 54,
      description: 'USC title number (1-54)'
    },
    title_name: {
      type: 'string',
      description: 'Full name of the USC title (e.g., "The Public Health and Welfare")'
    },
    section_number: {
      type: 'string',
      description: 'Section number within the title (may include letter suffixes)'
    },
    section_title: {
      type: 'string',
      description: 'Official title or heading of the section'
    },
    usc_citation: {
      type: 'string',
      description: 'Official USC citation (e.g., "42 U.S.C. § 1983")',
      pattern: '^\\d+\\s+(U\\.S\\.C\\.|USC)\\s*§?\\s*\\d+[a-z]?'
    },
    chapter: {
      type: 'string',
      description: 'Chapter number or designation'
    },
    text: {
      type: 'string',
      description: 'Full text of the section'
    },
    subsections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          designation: {
            type: 'string',
            description: 'Subsection designation (e.g., "(a)", "(1)", "(A)")'
          },
          text: {
            type: 'string',
            description: 'Text of the subsection'
          }
        }
      },
      description: 'Array of subsections within this section'
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'URL to the official source'
    },
    published_date: {
      type: 'string',
      description: 'Date the content was published or last updated (ISO 8601)'
    },
    effective_date: {
      type: 'string',
      description: 'Effective date of this version of the section (ISO 8601)'
    },
    amendments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Amendment date (ISO 8601)'
          },
          public_law: {
            type: 'string',
            description: 'Public Law citation'
          },
          description: {
            type: 'string',
            description: 'Description of the amendment'
          }
        }
      },
      description: 'History of amendments to this section'
    }
  },
  ['title_number', 'section_number', 'usc_citation']
);

// ===== USC Title Structure Schema =====
export const USCTitleStructureSchema = createSchema(
  'USC Title Structure',
  {
    title_number: {
      type: 'integer',
      minimum: 1,
      maximum: 54,
      description: 'USC title number (1-54)'
    },
    title_name: {
      type: 'string',
      description: 'Full name of the USC title'
    },
    year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Year of the USC edition'
    },
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter_number: {
            type: 'string',
            description: 'Chapter number or designation'
          },
          chapter_name: {
            type: 'string',
            description: 'Chapter title or heading'
          },
          sections: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of section numbers in this chapter'
          }
        }
      },
      description: 'Chapters within this title'
    },
    total_sections: {
      type: 'integer',
      minimum: 0,
      description: 'Total number of sections in the title'
    },
    enacted_positive_law: {
      type: 'boolean',
      description: 'Whether this title has been enacted as positive law'
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          published_date: { type: 'string' }
        }
      },
      description: 'Source documents for this title structure'
    }
  },
  ['title_number', 'title_name']
);

// ===== Export all schemas =====
export const GovInfoSchemas = {
  usc_search_result: USCSearchResultSchema,
  usc_search_result_simple: USCSearchResultSchemaSimple,  // Simple schema for natural language queries
  usc_section: USCSectionSchema,
  usc_title_structure: USCTitleStructureSchema
};

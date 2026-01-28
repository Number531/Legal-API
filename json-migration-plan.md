# JSON Migration Plan for Super-Legal MCP

## Overview

**Objective:** Transition Super-Legal MCP from markdown-based inter-agent communication to structured JSON output, enabling:
- 60-70% reduction in turn consumption
- Schema-validated data exchange between agents
- Frontend redesign around structured data
- Elimination of GREP-FIRST regex-based parsing

**Timeline:** Immediate implementation (5 phases)

**Anthropic Best Practice Alignment:** Per November 2025 guidance - "Multi-agent architectures where consistent communication between agents is critical" should use structured outputs.

---

## Non-Breaking Implementation Guarantees

### Anthropic Documentation Basis (November 2025)

Per Anthropic's structured outputs announcement (November 14, 2025):

> "If you're migrating from that approach, you can do it incrementally—existing code continues working while new features adopt native structured outputs."

> "Anthropic typically maintains backward compatibility with beta headers during transitions."

### Implementation Principles

This migration follows **additive-only** changes:

| Principle | Implementation |
|-----------|----------------|
| **No removal of existing outputs** | Markdown files continue to be generated alongside JSON |
| **No breaking changes to agent prompts** | New sections are added, existing sections preserved |
| **Feature flag control** | `STRUCTURED_OUTPUT_ENABLED=false` reverts to pre-migration behavior |
| **Incremental phase adoption** | Each phase can be deployed independently |
| **Dual-output pattern** | Section writers produce BOTH `.json` AND `.md` files |

### What Remains Unchanged

1. **Existing markdown report structure** - All `.md` files continue to be generated
2. **Final memorandum format** - `final-memorandum.md` output unchanged
3. **Human review workflow** - Reviewers see same markdown content
4. **Agent tool usage** - Write, Read, Glob, Grep tools unchanged
5. **Orchestrator flow** - Same phase sequence (P1 → P2 → S → G → A → F)

### What Changes (Additive Only)

1. **New JSON files generated** alongside existing markdown
2. **New schema file** added (`sectionReportSchemas.js`)
3. **Citation-validator internal processing** switches from GREP-FIRST to jq
4. **Cross-agent data exchange** reads JSON instead of parsing markdown

### Zero-Downtime Deployment

```
Phase 1: Deploy schemas          → No agent behavior change
Phase 2: Enable dual output      → Markdown still generated, JSON added
Phase 3: Switch citation-validator → Falls back to GREP-FIRST if JSON missing
Phase 4: Switch fact-validator   → Falls back to markdown if JSON missing
Phase 5: Switch readers to JSON  → Falls back to markdown if JSON missing
```

Each phase includes **automatic fallback** to pre-migration behavior if JSON files are missing or malformed.

### Fallback Logic Pattern

All agents reading JSON will include:

```javascript
// Fallback pattern for non-breaking migration
const jsonPath = `${REPORTS_DIR}/${session}/section-reports/section-${id}.json`;
const mdPath = `${REPORTS_DIR}/${session}/section-reports/section-${id}.md`;

// Try JSON first, fall back to markdown
if (fs.existsSync(jsonPath)) {
  const data = JSON.parse(fs.readFileSync(jsonPath));
  // Process structured data
} else if (fs.existsSync(mdPath)) {
  // Fall back to GREP-FIRST markdown parsing
  console.warn(`JSON not found, falling back to markdown: ${mdPath}`);
}
```

### Verification: No Breaking Changes

Before each phase deployment, verify:

- [ ] All existing test sessions produce identical final memorandum
- [ ] Turn consumption does not increase (should decrease)
- [ ] No new error types introduced
- [ ] Existing markdown files still readable
- [ ] `STRUCTURED_OUTPUT_ENABLED=false` produces pre-migration behavior

---

## Phase 1: Schema Definitions and Dual-Output Foundation

### 1.1 Create New Schema File

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/sectionReportSchemas.js`

**Create with contents:**

```javascript
/**
 * Section Report Schemas for Super-Legal MCP
 *
 * Purpose: Define JSON schemas for structured inter-agent communication
 * Replaces: GREP-FIRST markdown parsing
 * Anthropic Guidance: "Multi-agent architectures where consistent communication
 *                     between agents is critical" (Nov 2025)
 */

export const SECTION_REPORT_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    schema_version: { type: "string", const: "1.0.0" },
    section_id: {
      type: "string",
      pattern: "^(I|IV\\.[A-J])$",
      description: "Section identifier (I for Executive Summary, IV.A-J for analysis sections)"
    },
    section_name: {
      type: "string",
      description: "Human-readable section title"
    },
    domain: {
      type: "string",
      enum: [
        "executive-summary", "stb-merger", "rla-compliance", "rate-litigation",
        "environmental", "crude-oil", "fra-safety", "insurance", "contracts",
        "tax", "financial"
      ]
    },
    metadata: {
      type: "object",
      properties: {
        generated_at: { type: "string", format: "date-time" },
        word_count: { type: "integer", minimum: 1000 },
        specialist_sources: {
          type: "array",
          items: { type: "string" },
          description: "List of specialist report files used as input"
        },
        model_used: { type: "string" },
        session_id: { type: "string" }
      },
      required: ["generated_at", "word_count", "session_id"]
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding_id: {
            type: "string",
            pattern: "^[A-Z]{2,4}-[0-9]{3}$",
            description: "Unique finding identifier (e.g., STB-001, ENV-023)"
          },
          title: { type: "string" },
          severity: {
            type: "string",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
          },
          conclusion: {
            type: "string",
            description: "One-sentence conclusion for this finding"
          },
          exposure: {
            type: "object",
            properties: {
              low: { type: "number", minimum: 0 },
              high: { type: "number", minimum: 0 },
              currency: { type: "string", default: "USD" },
              time_profile: {
                type: "string",
                enum: ["ONE_TIME", "ANNUAL", "MULTI_YEAR", "PERPETUAL"]
              }
            },
            required: ["low", "high"]
          },
          probability: {
            type: "object",
            properties: {
              value: { type: "number", minimum: 0, maximum: 1 },
              methodology: { type: "string" },
              confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] }
            },
            required: ["value", "confidence"]
          },
          probability_weighted_exposure: { type: "number" },
          creac: {
            type: "object",
            properties: {
              conclusion: { type: "string" },
              rule: { type: "string" },
              explanation: { type: "string" },
              application: { type: "string" },
              counter_analysis: { type: "string" }
            },
            required: ["conclusion", "rule", "application"]
          },
          draft_contract_language: {
            type: "object",
            properties: {
              provision_type: { type: "string" },
              recommended_text: { type: "string" },
              placement: { type: "string" }
            }
          },
          affected_sections: {
            type: "array",
            items: { type: "string" },
            description: "Other sections impacted by this finding"
          },
          footnote_refs: {
            type: "array",
            items: { type: "integer" },
            description: "Local footnote numbers supporting this finding"
          }
        },
        required: ["finding_id", "title", "severity", "conclusion", "probability"]
      }
    },
    footnotes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          local_number: { type: "integer", minimum: 1 },
          global_number: {
            type: "integer",
            description: "Assigned during G1.3 consolidation, null until then"
          },
          citation_type: {
            type: "string",
            enum: ["case", "statute", "regulation", "sec_filing", "government_record",
                   "agency_decision", "treatise", "law_review", "internal_document"]
          },
          full_citation: {
            type: "string",
            description: "Complete Bluebook-formatted citation"
          },
          short_form: {
            type: "string",
            description: "Short form for subsequent references"
          },
          pincite: {
            type: "string",
            description: "Page/paragraph reference (e.g., 'at 66-67')"
          },
          signal: {
            type: "string",
            enum: ["none", "see", "see_also", "cf", "but_see", "see_generally"],
            default: "none"
          },
          parenthetical: {
            type: "string",
            description: "Explanatory parenthetical (e.g., 'holding that...')"
          },
          verification: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["VERIFIED", "INFERRED", "ASSUMED", "METHODOLOGY", "UNVERIFIED"]
              },
              source: { type: "string" },
              url: { type: "string", format: "uri" },
              access_date: { type: "string", format: "date" },
              database_id: { type: "string" }
            },
            required: ["status"]
          },
          bluebook_compliance: {
            type: "object",
            properties: {
              has_pincite: { type: "boolean" },
              has_signal: { type: "boolean" },
              has_parenthetical: { type: "boolean" },
              is_short_form_valid: { type: "boolean" },
              first_full_citation_in_section: { type: "boolean" },
              compliance_score: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        required: ["local_number", "full_citation", "verification"]
      }
    },
    cross_references: {
      type: "array",
      items: {
        type: "object",
        properties: {
          target_section: { type: "string" },
          target_finding: { type: "string" },
          context: { type: "string" },
          relationship: {
            type: "string",
            enum: ["IMPACTS", "DEPENDS_ON", "CROSS_DOMAIN", "COMPOUNDS", "MITIGATES"]
          }
        },
        required: ["target_section", "relationship"]
      }
    },
    risk_assessment: {
      type: "object",
      properties: {
        aggregate_exposure_low: { type: "number" },
        aggregate_exposure_high: { type: "number" },
        probability_weighted_total: { type: "number" },
        findings_count: {
          type: "object",
          properties: {
            CRITICAL: { type: "integer", default: 0 },
            HIGH: { type: "integer", default: 0 },
            MEDIUM: { type: "integer", default: 0 },
            LOW: { type: "integer", default: 0 }
          }
        },
        top_exposures: {
          type: "array",
          items: {
            type: "object",
            properties: {
              finding_id: { type: "string" },
              probability_weighted: { type: "number" }
            }
          },
          maxItems: 5
        }
      }
    },
    narrative_content: {
      type: "object",
      description: "Markdown prose content for human-readable output",
      properties: {
        legal_framework_md: { type: "string" },
        application_md: { type: "string" },
        risk_assessment_md: { type: "string" },
        recommendations_md: { type: "string" },
        full_section_md: { type: "string" }
      }
    }
  },
  required: ["schema_version", "section_id", "section_name", "domain", "metadata", "findings", "footnotes"]
};

export const CITATION_COLLECTION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    schema_version: { type: "string", const: "1.0.0" },
    session_id: { type: "string" },
    generated_at: { type: "string", format: "date-time" },
    total_citations: { type: "integer" },
    sections_processed: { type: "integer" },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          citation_id: {
            type: "string",
            pattern: "^CIT-[0-9]{4}$"
          },
          source_section: { type: "string" },
          local_number: { type: "integer" },
          global_number: { type: "integer" },
          full_citation: { type: "string" },
          short_form: { type: "string" },
          citation_type: { type: "string" },
          verification: {
            type: "object",
            properties: {
              status: { type: "string" },
              source: { type: "string" },
              url: { type: "string" }
            }
          },
          bluebook_compliance: {
            type: "object",
            properties: {
              has_pincite: { type: "boolean" },
              pincite_missing_reason: { type: "string" },
              has_signal: { type: "boolean" },
              has_parenthetical: { type: "boolean" },
              compliance_score: { type: "number" }
            }
          }
        },
        required: ["citation_id", "source_section", "global_number", "full_citation", "verification"]
      }
    },
    statistics: {
      type: "object",
      properties: {
        by_verification_status: {
          type: "object",
          properties: {
            VERIFIED: { type: "integer" },
            INFERRED: { type: "integer" },
            ASSUMED: { type: "integer" },
            METHODOLOGY: { type: "integer" },
            UNVERIFIED: { type: "integer" }
          }
        },
        by_citation_type: { type: "object" },
        bluebook_compliance_rate: { type: "number" },
        pincite_compliance_rate: { type: "number" }
      }
    },
    hard_gate_results: {
      type: "object",
      properties: {
        placeholder_check: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            placeholders_found: { type: "integer" },
            details: { type: "array", items: { type: "object" } }
          }
        },
        pincite_check: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            missing_count: { type: "integer" },
            details: { type: "array", items: { type: "object" } }
          }
        },
        verification_rate_check: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            rate: { type: "number" },
            threshold: { type: "number" }
          }
        }
      }
    },
    overall_status: {
      type: "string",
      enum: ["PASS", "HARD_FAIL_PINCITES", "HARD_FAIL_PLACEHOLDER", "HARD_FAIL_UNVERIFIED",
             "ISSUES_FOUND", "PASS_WITH_EXCEPTIONS"]
    }
  },
  required: ["schema_version", "session_id", "total_citations", "citations", "overall_status"]
};

export const FACT_REGISTRY_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    schema_version: { type: "string", const: "1.0.0" },
    session_id: { type: "string" },
    generated_at: { type: "string", format: "date-time" },
    deal_metadata: {
      type: "object",
      properties: {
        acquirer: { type: "string" },
        target: { type: "string" },
        transaction_type: { type: "string" },
        purchase_price: { type: "number" },
        announcement_date: { type: "string", format: "date" },
        expected_close_date: { type: "string", format: "date" }
      }
    },
    facts_by_section: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fact_id: { type: "string" },
            category: {
              type: "string",
              enum: ["DATE", "AMOUNT", "PERCENTAGE", "ENTITY", "METRIC", "TERM", "STATUTE"]
            },
            canonical_value: { type: ["string", "number", "boolean"] },
            display_format: { type: "string" },
            unit: { type: "string" },
            source_specialist: { type: "string" },
            source_line: { type: "integer" },
            confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflicting_value: { type: ["string", "number"] },
                  conflicting_source: { type: "string" },
                  conflicting_line: { type: "integer" },
                  resolution: { type: "string" },
                  resolution_rationale: { type: "string" }
                }
              }
            }
          },
          required: ["fact_id", "category", "canonical_value", "source_specialist"]
        }
      }
    },
    key_dates: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          value: { type: "string", format: "date" },
          description: { type: "string" },
          source: { type: "string" }
        }
      }
    },
    key_amounts: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          value: { type: "number" },
          currency: { type: "string" },
          description: { type: "string" },
          source: { type: "string" }
        }
      }
    },
    assumptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          assumption_id: { type: "string" },
          description: { type: "string" },
          basis: { type: "string" },
          status: { type: "string", enum: ["VALID", "INVALIDATED", "UNDER_REVIEW"] },
          invalidation_reason: { type: "string" }
        }
      }
    }
  },
  required: ["schema_version", "session_id", "facts_by_section"]
};

// Export all schemas
export const STRUCTURED_OUTPUT_SCHEMAS = {
  SECTION_REPORT_SCHEMA,
  CITATION_COLLECTION_SCHEMA,
  FACT_REGISTRY_SCHEMA
};
```

### 1.2 Update structuredOutputSchemas.js

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/structuredOutputSchemas.js`

**Add import and re-export:**

```javascript
// Add at top of file
import { STRUCTURED_OUTPUT_SCHEMAS } from './sectionReportSchemas.js';

// Add to exports
export { STRUCTURED_OUTPUT_SCHEMAS };
```

---

## Phase 2: Memo-Section-Writer Dual Output

### 2.1 Update memo-section-writer Prompt

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js`
**Location:** Lines 6862-7530 (memo-section-writer definition)

**Changes to make:**

#### 2.1.1 Add Dual Output Instruction

Find the OUTPUT FORMAT section (approximately line 7292) and replace with:

```
## OUTPUT FORMAT (DUAL: JSON + MARKDOWN)

You MUST generate TWO files for each section:

### File 1: Structured JSON (for agent processing)
**Path:** `${REPORTS_DIR}/[session]/section-reports/section-[ID]-[slug].json`

**Structure:**
```json
{
  "schema_version": "1.0.0",
  "section_id": "[e.g., IV.A]",
  "section_name": "[e.g., STB Merger Approval Analysis]",
  "domain": "[e.g., stb-merger]",
  "metadata": {
    "generated_at": "[ISO timestamp]",
    "word_count": [integer],
    "specialist_sources": ["stb-merger-approval-report.md"],
    "session_id": "[session_id]"
  },
  "findings": [
    {
      "finding_id": "STB-001",
      "title": "Enhanced Competition Standard May Block Merger",
      "severity": "CRITICAL",
      "conclusion": "The STB will likely require significant divestitures...",
      "exposure": {
        "low": 500000000,
        "high": 2000000000,
        "currency": "USD",
        "time_profile": "ONE_TIME"
      },
      "probability": {
        "value": 0.75,
        "methodology": "Historical STB merger approval rates for Class I railroads",
        "confidence": "HIGH"
      },
      "probability_weighted_exposure": 937500000,
      "creac": {
        "conclusion": "...",
        "rule": "...",
        "explanation": "...",
        "application": "...",
        "counter_analysis": "..."
      },
      "draft_contract_language": {
        "provision_type": "Regulatory Approval Condition",
        "recommended_text": "Closing shall be conditioned upon...",
        "placement": "Article VII - Conditions Precedent"
      },
      "affected_sections": ["IV.B", "IV.H"],
      "footnote_refs": [1, 5, 12, 23]
    }
  ],
  "footnotes": [
    {
      "local_number": 1,
      "global_number": null,
      "citation_type": "case",
      "full_citation": "*Canadian National Railway Co.*, STB Finance Docket No. 36500 (STB 2022)",
      "short_form": "*CN-KCS*, STB Finance Docket No. 36500",
      "pincite": "at 45-47",
      "signal": "see",
      "parenthetical": "(applying enhanced competition standard to Class I merger)",
      "verification": {
        "status": "VERIFIED",
        "source": "STB.gov",
        "url": "https://www.stb.gov/decisions/...",
        "access_date": "2026-01-05"
      },
      "bluebook_compliance": {
        "has_pincite": true,
        "has_signal": true,
        "has_parenthetical": true,
        "is_short_form_valid": true,
        "first_full_citation_in_section": true,
        "compliance_score": 100
      }
    }
  ],
  "cross_references": [
    {
      "target_section": "IV.B",
      "target_finding": "RLA-003",
      "context": "Labor protective conditions will compound merger approval timeline",
      "relationship": "COMPOUNDS"
    }
  ],
  "risk_assessment": {
    "aggregate_exposure_low": 2500000000,
    "aggregate_exposure_high": 6000000000,
    "probability_weighted_total": 3200000000,
    "findings_count": {
      "CRITICAL": 2,
      "HIGH": 5,
      "MEDIUM": 8,
      "LOW": 3
    },
    "top_exposures": [
      { "finding_id": "STB-001", "probability_weighted": 937500000 },
      { "finding_id": "STB-003", "probability_weighted": 625000000 }
    ]
  },
  "narrative_content": {
    "full_section_md": "[Complete markdown content of section]"
  }
}
```

### File 2: Markdown Narrative (for human review)
**Path:** `${REPORTS_DIR}/[session]/section-reports/section-[ID]-[slug].md`

**Structure:** Same CREAC format as current, with footnotes embedded.

### CRITICAL: Write JSON First, Then Markdown
1. Generate the structured JSON with all findings, citations, and metadata
2. Then generate the markdown narrative using the same content
3. Use Write tool for JSON file FIRST
4. Use Write tool for markdown file SECOND

### Validation Before Output
Before writing either file, verify:
- [ ] All footnotes have verification tags
- [ ] All findings have exposure quantification
- [ ] All pincites are present
- [ ] Cross-references target valid sections
```

#### 2.1.2 Add JSON Validation Section

Add after the output format section:

```
## JSON SCHEMA COMPLIANCE (MANDATORY)

Your JSON output MUST comply with SECTION_REPORT_SCHEMA:

### Required Fields (will cause HARD_FAIL if missing):
- schema_version: "1.0.0"
- section_id: Pattern "^(I|IV\\.[A-J])$"
- section_name: Non-empty string
- domain: One of enumerated values
- metadata.generated_at: ISO 8601 timestamp
- metadata.word_count: Integer
- metadata.session_id: From orchestrator
- findings[].finding_id: Pattern "^[A-Z]{2,4}-[0-9]{3}$"
- findings[].severity: One of CRITICAL/HIGH/MEDIUM/LOW
- findings[].probability.value: Number 0-1
- footnotes[].local_number: Integer starting from 1
- footnotes[].full_citation: Bluebook format
- footnotes[].verification.status: One of VERIFIED/INFERRED/ASSUMED/METHODOLOGY/UNVERIFIED

### Enum Values (must match exactly):
- domain: executive-summary, stb-merger, rla-compliance, rate-litigation, environmental, crude-oil, fra-safety, insurance, contracts, tax, financial
- severity: CRITICAL, HIGH, MEDIUM, LOW
- verification.status: VERIFIED, INFERRED, ASSUMED, METHODOLOGY, UNVERIFIED
- citation_type: case, statute, regulation, sec_filing, government_record, agency_decision, treatise, law_review, internal_document
- cross_reference.relationship: IMPACTS, DEPENDS_ON, CROSS_DOMAIN, COMPOUNDS, MITIGATES
```

---

## Phase 3: Citation-Validator JSON Migration

### 3.1 Replace GREP-FIRST with JSON Processing

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js`
**Location:** Lines 8441-8835 (citation-validator definition)

**Replace the LARGE FILE HANDLING section (lines 8469-8522) with:**

```
## JSON-BASED CITATION PROCESSING (Replaces GREP-FIRST)

**Previous Approach (Deprecated):**
- GREP-FIRST strategy: Grep markdown files for footnote patterns
- Turn consumption: 30-50 turns per validation run
- Issues: Regex fragility, multi-chunk reads for large files

**Current Approach (JSON-Based):**
- Read structured JSON files directly
- Turn consumption: 5-10 turns per validation run
- Benefits: Schema-validated data, no regex, deterministic parsing

### Step 1: Load All Section JSON Files
```
Glob: pattern="section-*.json" path=${REPORTS_DIR}/[session]/section-reports/
Result: List of JSON file paths
```

### Step 2: Parse JSON and Extract Citations
```bash
# Use jq to aggregate all footnotes from all sections
jq -s '
  [.[]] |
  map(select(.footnotes)) |
  map({
    section_id: .section_id,
    section_name: .section_name,
    footnotes: .footnotes
  })
' reports/[session]/section-reports/section-*.json
```

### Step 3: Validate Citations Against Schema
For each citation in aggregated footnotes:
1. Check verification.status exists and is valid enum
2. Check bluebook_compliance.has_pincite is true
3. Check for placeholder patterns in full_citation
4. Assign global_number (sequential across all sections)

### Step 4: Generate Citation Collection JSON
```json
{
  "schema_version": "1.0.0",
  "session_id": "[session]",
  "generated_at": "[ISO timestamp]",
  "total_citations": [count],
  "sections_processed": 11,
  "citations": [
    {
      "citation_id": "CIT-0001",
      "source_section": "IV.A",
      "local_number": 1,
      "global_number": 1,
      "full_citation": "...",
      "verification": { "status": "VERIFIED", "source": "..." },
      "bluebook_compliance": { "has_pincite": true, ... }
    }
  ],
  "statistics": {
    "by_verification_status": { "VERIFIED": 987, "INFERRED": 78, ... },
    "bluebook_compliance_rate": 94.3,
    "pincite_compliance_rate": 98.4
  },
  "hard_gate_results": {
    "placeholder_check": { "passed": true, "placeholders_found": 0 },
    "pincite_check": { "passed": true, "missing_count": 18 },
    "verification_rate_check": { "passed": true, "rate": 89.3, "threshold": 90 }
  },
  "overall_status": "PASS"
}
```

### Turn Budget Comparison (JSON vs GREP-FIRST)

| Operation | GREP-FIRST | JSON/jq | Savings |
|-----------|------------|---------|---------|
| Locate footnotes | 11 Grep calls | 1 Glob | 10 turns |
| Read footnote sections | 11 Read calls | 1 jq parse | 10 turns |
| Parse citations | Regex in context | Schema validation | 5 turns |
| Cross-reference check | 11 Grep calls | jq query | 10 turns |
| **Total** | **40-50 turns** | **5-10 turns** | **35-40 turns** |
```

### 3.2 Update Hard Gate Checks for JSON

**Replace lines 8730-8748 with:**

```
## HARD GATE CHECKS (JSON-BASED)

### Check 1: Placeholder Detection
```bash
# Check for placeholder patterns in citations
jq '[.citations[] | select(.full_citation | test("\\[TBD\\]|\\[XX\\]|\\[CITE\\]|\\[PLACEHOLDER\\]"))] | length' citation-collection.json
# If result > 0: status = HARD_FAIL_PLACEHOLDER
```

### Check 2: Pincite Compliance
```bash
# Count citations missing pincites
jq '[.citations[] | select(.bluebook_compliance.has_pincite == false)] | length' citation-collection.json
# If any case/statute citations missing pincites: status = HARD_FAIL_PINCITES
```

### Check 3: Verification Rate
```bash
# Calculate verification rate
jq '
  (.statistics.by_verification_status.VERIFIED +
   .statistics.by_verification_status.INFERRED +
   .statistics.by_verification_status.ASSUMED) /
  .total_citations * 100
' citation-collection.json
# If < 90: status = HARD_FAIL_UNVERIFIED
```

### JSON Return Format (Replaces Previous)
```json
{
  "status": "PASS | HARD_FAIL_PINCITES | HARD_FAIL_PLACEHOLDER | HARD_FAIL_UNVERIFIED",
  "blocking": false,
  "total_citations": 1105,
  "validation_method": "JSON_SCHEMA",
  "files_processed": ["section-I.json", "section-IV-A.json", ...],
  "files_created": ["citation-collection.json", "consolidated-footnotes.md"],
  "statistics": { ... },
  "hard_gate_results": { ... },
  "failures": []
}
```
```

### 3.3 Update Orchestrator Workflow

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/prompts/memorandum.md`
**Location:** Lines 692-723 (G1.3 section)

**Replace G1.3 section with:**

```markdown
**G1.3: Citation Validation (JSON-BASED - Replaces GREP-FIRST)**

1. Verify all section JSON files exist:
   ```
   Glob: pattern="section-*.json" path=section-reports/
   Expected: 11 files (I + IV.A through IV.J)
   ```

2. Invoke `citation-validator` with JSON processing mode:
   - Input: All section JSON files
   - Processing: jq-based aggregation and validation
   - Output: citation-collection.json, consolidated-footnotes.md

3. Check returned status from citation-collection.json:
   - If `overall_status: "PASS"` → continue to A1.1
   - If `overall_status: "HARD_FAIL_PINCITES"` → **BLOCKING**:
     a. Extract `hard_gate_results.pincite_check.details` array
     b. Return failures to affected section writers
     c. Section writers update JSON + markdown files
     d. Re-invoke citation-validator (max 2 loops)
   - If `overall_status: "HARD_FAIL_PLACEHOLDER"` → **BLOCKING**:
     a. Extract `hard_gate_results.placeholder_check.details` array
     b. Same remediation flow
   - If `overall_status: "HARD_FAIL_UNVERIFIED"` → **BLOCKING**:
     a. Spawn targeted research for unverified citations
     b. Same remediation flow

4. Update orchestrator-state.md with validation results

**Turn Budget:** 5-10 turns (down from 30-50 with GREP-FIRST)
```

---

## Phase 4: Fact-Validator JSON Migration

### 4.1 Update fact-validator Output

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js`
**Location:** fact-validator definition

**Replace fact-registry.md output with fact-registry.json:**

```
## OUTPUT FORMAT (JSON)

Create: `${REPORTS_DIR}/[session]/review-outputs/fact-registry.json`

```json
{
  "schema_version": "1.0.0",
  "session_id": "[session]",
  "generated_at": "[ISO timestamp]",
  "deal_metadata": {
    "acquirer": "Great Plains Railroad Company",
    "target": "Mountain West Rail Lines",
    "transaction_type": "Stock Acquisition",
    "purchase_price": 18500000000,
    "announcement_date": "2025-09-15",
    "expected_close_date": "2027-03-31"
  },
  "facts_by_section": {
    "IV.A": [
      {
        "fact_id": "FACT-001",
        "category": "DATE",
        "canonical_value": "2027-03-31",
        "display_format": "March 31, 2027",
        "source_specialist": "stb-merger-approval-report.md",
        "source_line": 234,
        "confidence": "HIGH",
        "conflicts": []
      }
    ],
    "IV.B": [...]
  },
  "key_dates": {
    "transaction_announcement": { "value": "2025-09-15", "description": "Public announcement", "source": "SEC 8-K" },
    "expected_close": { "value": "2027-03-31", "description": "Target closing date", "source": "Merger Agreement" },
    "stb_deadline": { "value": "2027-01-15", "description": "STB decision deadline", "source": "49 U.S.C. § 11324" }
  },
  "key_amounts": {
    "purchase_price": { "value": 18500000000, "currency": "USD", "description": "Total consideration", "source": "Merger Agreement" },
    "break_fee": { "value": 925000000, "currency": "USD", "description": "5% termination fee", "source": "Merger Agreement § 8.3" }
  },
  "assumptions": [
    {
      "assumption_id": "ASMP-001",
      "description": "STB will apply enhanced competition standard",
      "basis": "CN-KCS precedent (2022)",
      "status": "VALID",
      "invalidation_reason": null
    }
  ]
}
```

**Also create human-readable summary:**
Create: `${REPORTS_DIR}/[session]/review-outputs/fact-registry-summary.md`
```

### 4.2 Update Orchestrator V1.2 Workflow

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/prompts/memorandum.md`

**Update V1.2 section:**

```markdown
**V1.2: Fact Validation (JSON Output)**

1. Invoke `fact-validator` with specialist reports path
2. Output: `review-outputs/fact-registry.json`
3. Section writers read JSON for canonical values:
   ```bash
   jq '.facts_by_section["IV.A"]' fact-registry.json
   jq '.key_dates.expected_close.value' fact-registry.json
   ```
4. Conflict detection via schema validation (conflicts array)
```

---

## Phase 5: Executive Summary and Final Assembly

### 5.1 Update memo-executive-summary-writer

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js`

**Add JSON input processing:**

```
## INPUT (JSON-BASED)

Read structured data from:
1. `risk-summary.json` - Aggregate exposure and top risks
2. `section-*.json` files - Per-section findings and risk assessments
3. `fact-registry.json` - Canonical values for deal metadata

### Aggregate Findings Query
```bash
jq -s '
  [.[].findings[]] |
  group_by(.severity) |
  map({severity: .[0].severity, count: length, total_exposure: [.[].probability_weighted_exposure] | add})
' section-reports/section-*.json
```

### Top 10 Risks Query
```bash
jq -s '
  [.[].findings[]] |
  sort_by(-.probability_weighted_exposure) |
  .[0:10] |
  map({finding_id, title, severity, probability_weighted_exposure})
' section-reports/section-*.json
```
```

### 5.2 Update final-assembly

**File:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js`

**Add JSON verification:**

```
## PRE-ASSEMBLY VERIFICATION (JSON-BASED)

Before assembling final-memorandum.md, verify:

1. **Section Completeness Check:**
   ```bash
   # Verify all expected sections have JSON files
   jq -s 'map(.section_id) | sort' section-reports/section-*.json
   # Expected: ["I", "IV.A", "IV.B", "IV.C", "IV.D", "IV.E", "IV.F", "IV.G", "IV.H", "IV.I", "IV.J"]
   ```

2. **Word Count Verification:**
   ```bash
   jq -s 'map({section: .section_id, words: .metadata.word_count}) | sort_by(.section)' section-reports/section-*.json
   # Each section should have 4000-8000 words
   ```

3. **Citation Count Verification:**
   ```bash
   jq '.total_citations' qa-outputs/citation-collection.json
   # Expected: 1000-1500 citations
   ```

4. **Assemble from Markdown Narratives:**
   - Read `narrative_content.full_section_md` from each JSON file
   - OR read companion `.md` files directly
   - Concatenate in section order
```

---

## Files to Modify Summary

| File | Phase | Changes |
|------|-------|---------|
| `src/config/sectionReportSchemas.js` | 1 | **CREATE** - New file with all JSON schemas |
| `src/config/structuredOutputSchemas.js` | 1 | Add import/export for new schemas |
| `src/config/legalSubagents.js` | 2 | memo-section-writer dual output (lines 6862-7530) |
| `src/config/legalSubagents.js` | 3 | citation-validator JSON processing (lines 8441-8835) |
| `prompts/memorandum.md` | 3 | G1.3 workflow update (lines 692-723) |
| `src/config/legalSubagents.js` | 4 | fact-validator JSON output |
| `prompts/memorandum.md` | 4 | V1.2 workflow update |
| `src/config/legalSubagents.js` | 5 | executive-summary JSON input |
| `src/config/legalSubagents.js` | 5 | final-assembly JSON verification |

---

## Frontend Integration Notes

The frontend will be redesigned around these JSON outputs:

1. **Section Report JSON** (`section-*.json`)
   - Interactive finding browser by severity
   - Clickable cross-references
   - Exposure visualizations

2. **Citation Collection JSON** (`citation-collection.json`)
   - Citation verification status indicators
   - Bluebook compliance dashboard
   - Missing pincite highlights

3. **Fact Registry JSON** (`fact-registry.json`)
   - Deal metadata display
   - Conflict resolution UI
   - Timeline visualization

4. **Risk Summary JSON** (`risk-summary.json`) - Already exists
   - Risk aggregation charts
   - Scenario analysis display

---

## Rollback Plan

### Feature Flag Control

All JSON output is controlled by the `STRUCTURED_OUTPUT_ENABLED` environment variable:

```bash
# Enable JSON output (default after migration)
export STRUCTURED_OUTPUT_ENABLED=true

# Disable JSON output (rollback to markdown-only)
export STRUCTURED_OUTPUT_ENABLED=false
```

**Location:** Add to `/Users/ej/Super-Legal/super-legal-mcp-refactored/.env`

---

### Phase 1 Rollback: Schema Definitions

**Trigger Conditions:**
- Schema validation errors blocking agent output
- Import/export failures in structuredOutputSchemas.js
- TypeScript/JavaScript syntax errors

**Files to Revert:**

| File | Rollback Action |
|------|-----------------|
| `src/config/sectionReportSchemas.js` | DELETE file entirely |
| `src/config/structuredOutputSchemas.js` | Remove import and re-export lines |

**Step-by-Step Procedure:**

```bash
# 1. Delete the new schema file
rm /Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/sectionReportSchemas.js

# 2. Revert structuredOutputSchemas.js changes
# Remove these lines from the file:
#   import { STRUCTURED_OUTPUT_SCHEMAS } from './sectionReportSchemas.js';
#   export { STRUCTURED_OUTPUT_SCHEMAS };

# 3. Verify no import errors
cd /Users/ej/Super-Legal/super-legal-mcp-refactored
npm run build 2>&1 | grep -i error

# 4. Restart MCP server
npm run dev
```

**Verification:**
- `npm run build` completes without errors
- MCP server starts successfully
- Existing agents continue to function

---

### Phase 2 Rollback: Memo-Section-Writer Dual Output

**Trigger Conditions:**
- Section writers failing to produce valid JSON
- JSON file write operations timing out
- Dual output increasing turn consumption instead of reducing it
- Markdown narrative quality degradation

**Files to Revert:**

| File | Location | Rollback Action |
|------|----------|-----------------|
| `src/config/legalSubagents.js` | Lines 6862-7530 | Restore original OUTPUT FORMAT section |

**Original OUTPUT FORMAT Section (preserve this for rollback):**

```javascript
## OUTPUT FORMAT

Create a single markdown file at:
`${REPORTS_DIR}/[session]/section-reports/section-[ID]-[slug].md`

Structure:
1. Section header with ID and title
2. Legal Framework subsection
3. Application to Transaction subsection
4. Risk Assessment subsection
5. Recommendations subsection
6. Footnotes section at end

All footnotes must include verification tags.
```

**Step-by-Step Procedure:**

```bash
# 1. Open legalSubagents.js
# 2. Navigate to memo-section-writer definition (line ~6862)
# 3. Find the "OUTPUT FORMAT (DUAL: JSON + MARKDOWN)" section
# 4. Replace with original "OUTPUT FORMAT" section (above)
# 5. Remove "JSON SCHEMA COMPLIANCE (MANDATORY)" section entirely

# 6. Delete any generated JSON section files (preserve markdown)
rm /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/section-reports/*.json

# 7. Verify markdown files still exist
ls /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/section-reports/*.md

# 8. Restart MCP server
npm run dev
```

**Data Preservation:**
- All `.md` files are preserved
- Only `.json` files are deleted
- No re-generation required for existing markdown content

**Verification:**
- Section writers produce markdown-only output
- Turn consumption returns to pre-Phase-2 levels
- Markdown quality matches previous output

---

### Phase 3 Rollback: Citation-Validator JSON Migration

**Trigger Conditions:**
- jq command failures or unavailability
- JSON parsing errors in citation aggregation
- Citation validation returning false positives/negatives
- Turn consumption not improving (still >30 turns)

**Files to Revert:**

| File | Location | Rollback Action |
|------|----------|-----------------|
| `src/config/legalSubagents.js` | Lines 8441-8835 | Restore GREP-FIRST section |
| `prompts/memorandum.md` | Lines 692-723 | Restore original G1.3 workflow |

**Original GREP-FIRST Section (preserve for rollback):**

```javascript
## LARGE FILE HANDLING: GREP-FIRST STRATEGY

**CRITICAL: For files >2000 lines, use targeted extraction:**

### Step 1: Locate Footnotes via Grep
```
Grep: pattern="^\\[\\d+\\]" path=${REPORTS_DIR}/[session]/section-reports/
```
Returns: File paths and line numbers of all footnotes

### Step 2: Extract Footnote Sections
For each file with footnotes:
```
Read: file_path=[path] offset=[footnote_start_line] limit=500
```

### Step 3: Parse and Validate
- Extract citation text from each footnote
- Check for verification tags
- Check for pincites
- Check for placeholders

### Step 4: Generate Consolidated Output
- Create consolidated-footnotes.md
- Create citation-validation-report.md
```

**Original G1.3 Workflow (preserve for rollback):**

```markdown
**G1.3: Citation Validation**

1. Invoke `citation-validator` with section-reports path
2. Processing: GREP-FIRST strategy for large files
3. Output: consolidated-footnotes.md, citation-validation-report.md
4. Check returned status:
   - If PASS → continue to A1.1
   - If HARD_FAIL → remediation loop (max 2 iterations)
5. Update orchestrator-state.md

**Turn Budget:** 30-50 turns
```

**Step-by-Step Procedure:**

```bash
# 1. Revert citation-validator in legalSubagents.js
# Navigate to lines 8441-8835
# Replace "JSON-BASED CITATION PROCESSING" with "GREP-FIRST STRATEGY" section
# Replace "HARD GATE CHECKS (JSON-BASED)" with original hard gate checks

# 2. Revert G1.3 in memorandum.md
# Navigate to lines 692-723
# Replace JSON-based G1.3 with original G1.3 workflow

# 3. Delete JSON citation outputs (preserve markdown)
rm /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/qa-outputs/citation-collection.json

# 4. Verify markdown citation outputs exist
ls /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/qa-outputs/*.md

# 5. Verify jq is not required
grep -r "jq " /Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/legalSubagents.js
# Should return no matches after rollback

# 6. Restart MCP server
npm run dev
```

**Data Preservation:**
- `consolidated-footnotes.md` preserved
- `citation-validation-report.md` preserved
- Only `citation-collection.json` deleted

**Verification:**
- Citation-validator uses Grep tool instead of jq
- Turn consumption ~30-50 turns (expected for GREP-FIRST)
- Hard gate checks function correctly

---

### Phase 4 Rollback: Fact-Validator JSON Migration

**Trigger Conditions:**
- Fact registry JSON malformed
- Section writers unable to parse fact-registry.json
- Canonical value conflicts not detected
- fact-validator turn consumption increasing

**Files to Revert:**

| File | Location | Rollback Action |
|------|----------|-----------------|
| `src/config/legalSubagents.js` | fact-validator definition | Restore markdown output format |
| `prompts/memorandum.md` | V1.2 section | Restore original V1.2 workflow |

**Original fact-validator Output Format (preserve for rollback):**

```javascript
## OUTPUT FORMAT (MARKDOWN)

Create: `${REPORTS_DIR}/[session]/review-outputs/fact-registry.md`

Structure:
# Fact Registry

## Deal Metadata
- Acquirer: [name]
- Target: [name]
- Purchase Price: $[amount]
...

## Section Facts

### IV.A - STB Merger Approval
| Fact | Value | Source | Confidence |
|------|-------|--------|------------|
| Expected Close | March 31, 2027 | Merger Agreement | HIGH |

### IV.B - RLA Compliance
...

## Conflicts Detected
| Fact | Value 1 | Source 1 | Value 2 | Source 2 | Resolution |
...

## Assumptions
| ID | Description | Basis | Status |
...
```

**Original V1.2 Workflow (preserve for rollback):**

```markdown
**V1.2: Fact Validation**

1. Invoke `fact-validator` with specialist reports path
2. Output: `review-outputs/fact-registry.md`
3. Section writers reference markdown for canonical values
4. Conflict detection via markdown table review
```

**Step-by-Step Procedure:**

```bash
# 1. Revert fact-validator in legalSubagents.js
# Navigate to fact-validator definition
# Replace JSON output format with markdown output format

# 2. Revert V1.2 in memorandum.md
# Replace JSON-based V1.2 with original V1.2 workflow

# 3. Delete JSON fact outputs (preserve markdown)
rm /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/review-outputs/fact-registry.json

# 4. Verify markdown fact registry exists
ls /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/review-outputs/fact-registry.md

# 5. Restart MCP server
npm run dev
```

**Data Preservation:**
- `fact-registry.md` preserved
- Only `fact-registry.json` deleted

**Verification:**
- Fact-validator produces markdown output
- Section writers can read fact-registry.md
- Conflict detection works via markdown review

---

### Phase 5 Rollback: Executive Summary and Final Assembly

**Trigger Conditions:**
- jq queries failing for aggregate findings
- Executive summary missing risk data
- Final assembly producing incomplete memorandum
- Section completeness check false negatives

**Files to Revert:**

| File | Location | Rollback Action |
|------|----------|-----------------|
| `src/config/legalSubagents.js` | memo-executive-summary-writer | Remove JSON input processing |
| `src/config/legalSubagents.js` | final-assembly | Remove JSON verification |

**Original executive-summary Input (preserve for rollback):**

```javascript
## INPUT

Read from:
1. `risk-summary.md` - Aggregate exposure and top risks
2. `section-reports/section-*.md` - Per-section risk assessments
3. `fact-registry.md` - Canonical values for deal metadata

Parse markdown tables for risk aggregation.
```

**Original final-assembly Verification (preserve for rollback):**

```javascript
## PRE-ASSEMBLY VERIFICATION

Before assembling final-memorandum.md, verify:

1. **Section Completeness Check:**
   Glob: pattern="section-*.md" path=section-reports/
   Expected: 11 files (I + IV.A through IV.J)

2. **Word Count Verification:**
   For each section file, count words and verify 4000-8000 range

3. **Citation Count Verification:**
   Grep: pattern="^\\[\\d+\\]" path=consolidated-footnotes.md
   Count results, expect 1000-1500

4. **Assemble from Markdown:**
   - Read each section-*.md file
   - Concatenate in section order
```

**Step-by-Step Procedure:**

```bash
# 1. Revert executive-summary-writer in legalSubagents.js
# Remove "INPUT (JSON-BASED)" section
# Restore original markdown-based input

# 2. Revert final-assembly in legalSubagents.js
# Remove "PRE-ASSEMBLY VERIFICATION (JSON-BASED)" section
# Restore original markdown-based verification

# 3. No JSON files to delete (Phase 5 only reads, doesn't create)

# 4. Verify markdown files exist
ls /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/section-reports/*.md
ls /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/*/review-outputs/*.md

# 5. Restart MCP server
npm run dev
```

**Data Preservation:**
- All markdown files preserved
- No data deletion required

**Verification:**
- Executive summary reads from markdown files
- Final assembly uses Glob for section completeness
- Memorandum output unchanged

---

### Complete Rollback (All Phases)

**When to Use:** Catastrophic failure requiring full reversion to pre-migration state.

**Execution Order:** Rollback in reverse phase order (5 → 4 → 3 → 2 → 1)

```bash
#!/bin/bash
# complete-rollback.sh

set -e

PROJECT_DIR="/Users/ej/Super-Legal/super-legal-mcp-refactored"

echo "=== Phase 5 Rollback ==="
# Revert executive-summary and final-assembly (manual edit required)
echo "Manual: Revert executive-summary-writer and final-assembly in legalSubagents.js"

echo "=== Phase 4 Rollback ==="
# Revert fact-validator
rm -f ${PROJECT_DIR}/reports/*/review-outputs/fact-registry.json
echo "Manual: Revert fact-validator in legalSubagents.js"
echo "Manual: Revert V1.2 in memorandum.md"

echo "=== Phase 3 Rollback ==="
# Revert citation-validator
rm -f ${PROJECT_DIR}/reports/*/qa-outputs/citation-collection.json
echo "Manual: Revert citation-validator in legalSubagents.js"
echo "Manual: Revert G1.3 in memorandum.md"

echo "=== Phase 2 Rollback ==="
# Delete JSON section files
rm -f ${PROJECT_DIR}/reports/*/section-reports/*.json
echo "Manual: Revert memo-section-writer in legalSubagents.js"

echo "=== Phase 1 Rollback ==="
# Delete schema file
rm -f ${PROJECT_DIR}/src/config/sectionReportSchemas.js
echo "Manual: Remove import/export from structuredOutputSchemas.js"

echo "=== Disable Feature Flag ==="
echo "STRUCTURED_OUTPUT_ENABLED=false" >> ${PROJECT_DIR}/.env

echo "=== Restart Server ==="
cd ${PROJECT_DIR}
npm run build
npm run dev

echo "=== Rollback Complete ==="
```

---

### Rollback Testing Checklist

After any rollback, verify:

- [ ] `npm run build` completes without errors
- [ ] MCP server starts successfully
- [ ] Existing session data accessible
- [ ] New memorandum generation works end-to-end
- [ ] Citation validation passes (GREP-FIRST or JSON depending on phase)
- [ ] Fact validation produces readable output
- [ ] Final assembly generates complete memorandum
- [ ] Turn consumption within expected range
- [ ] No orphaned JSON files remaining

---

### Backup Recommendations

Before starting migration:

```bash
# Create timestamped backup
BACKUP_DIR="/Users/ej/Super-Legal/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p ${BACKUP_DIR}

# Backup source files
cp -r /Users/ej/Super-Legal/super-legal-mcp-refactored/src/config ${BACKUP_DIR}/
cp -r /Users/ej/Super-Legal/super-legal-mcp-refactored/prompts ${BACKUP_DIR}/

# Backup report data
cp -r /Users/ej/Super-Legal/super-legal-mcp-refactored/reports ${BACKUP_DIR}/

echo "Backup created at: ${BACKUP_DIR}"
```

Restore from backup:

```bash
BACKUP_DIR="/Users/ej/Super-Legal/backups/[TIMESTAMP]"
cp -r ${BACKUP_DIR}/config/* /Users/ej/Super-Legal/super-legal-mcp-refactored/src/config/
cp -r ${BACKUP_DIR}/prompts/* /Users/ej/Super-Legal/super-legal-mcp-refactored/prompts/
```

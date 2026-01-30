# Document Extractor Agent Specification

> **Version:** 2.0
> **Date:** January 28, 2026
> **Status:** Implementation Ready (Enhanced BEFORE/AFTER Diffs - Verified Against Source)
> **Related:** Claude Agent SDK, Legal Subagents Architecture, memorandum-synthesis/, state-file-schemas.md

---

## Executive Summary

The **Document-Processing-Analyst** (also referred to as the Document Extractor Agent) is a specialized subagent responsible for processing client-uploaded documents before research planning begins. It extracts full text, analyzes content, captures metadata, and returns structured analysis to the orchestrator for informed research plan creation.

This approach follows Claude Agent SDK best practices by:
- Using subagent delegation for isolated context processing
- Leveraging the file system for persistent artifacts
- Returning structured JSON for efficient orchestrator consumption
- Enabling document-aware specialist assignments
- **Preserving original submissions in a read-only archive (`initial-query-docs/`)**

---

## Session Directory Structure

When a user submits a query with documents, the system creates a session directory with the following structure:

```
reports/[YYYY-MM-DD]-[unix-timestamp]/
│
├── initial-query-docs/                    # ARCHIVE (Read-Only)
│   ├── query.md                           # Original user query (verbatim)
│   ├── submission-metadata.json           # Submission timestamp, source, user context
│   ├── doc-001-original.pdf               # Original uploaded files (untouched)
│   ├── doc-002-original.docx
│   └── doc-003-original.pdf
│
├── documents/                             # WORKING DIRECTORY (For Processing)
│   ├── metadata.json                      # Processing metadata
│   ├── doc-001.pdf                        # Working copies of documents
│   ├── doc-001-extracted.txt              # Extracted text (from subagent)
│   ├── doc-001-analysis.json              # Per-document analysis
│   ├── doc-002.pdf
│   ├── doc-002-extracted.txt
│   ├── doc-002-analysis.json
│   ├── doc-003.pdf
│   ├── doc-003-extracted.txt
│   ├── doc-003-analysis.json
│   └── document-analysis-summary.json     # Consolidated analysis
│
├── session-manifest.json                  # Session metadata and paths
├── research-plan.md                       # Orchestrator's research plan
├── specialist-reports/                    # Specialist output directory
│   └── [specialist-name]-report.md
└── ...
```

### Directory Purpose

| Directory | Purpose | Access |
|-----------|---------|--------|
| `initial-query-docs/` | **Archive** - Preserves original submission for audit/reference | Read-only |
| `documents/` | **Working directory** - Processing workspace for document-processing-analyst | Read/Write |
| `specialist-reports/` | **Output directory** - Specialist research reports | Write |

### Why Separate Archive and Working Directories?

1. **Audit Trail**: Original submissions preserved exactly as received
2. **Data Integrity**: Working copies can be modified without affecting originals
3. **Provenance**: Clear chain of custody from submission to analysis
4. **Recovery**: If processing fails, originals remain intact
5. **Compliance**: Legal requirements often mandate preserving original documents

---

## Session Initialization Flow

```
User: POST /api/stream { query: "...", documents: [...] }
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│ SESSION INITIALIZATION (API Layer)                            │
│                                                               │
│ 1. Generate session ID: [YYYY-MM-DD]-[unix-timestamp]        │
│ 2. Create session directory structure                         │
│ 3. Create: /initial-query-docs/                              │
│ 4. Write:  /initial-query-docs/query.md (original query)     │
│ 5. Write:  /initial-query-docs/submission-metadata.json      │
│ 6. Save:   /initial-query-docs/doc-XXX-original.* (archives) │
│ 7. Copy:   /documents/doc-XXX.* (working copies)             │
│ 8. Write:  /documents/metadata.json                          │
│ 9. Write:  /session-manifest.json                            │
│ 10. Pass session info to orchestrator                        │
└───────────────────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                                  │
│                                                               │
│ 1. Read /session-manifest.json                               │
│ 2. Detect /documents/metadata.json (has documents)           │
│ 3. Invoke document-processing-analyst subagent               │
│    └── Reads from /documents/, writes analysis there         │
│    └── Can reference /initial-query-docs/query.md            │
│ 4. Receive structured analysis from subagent                 │
│ 5. Create research-plan.md (informed by analysis)            │
│ 6. Dispatch specialists (unchanged workflow)                 │
└───────────────────────────────────────────────────────────────┘
```

---

## Archive File Schemas

### `/initial-query-docs/query.md`

```markdown
# Original Query Submission

**Session ID:** 2026-01-27-1738010400
**Submitted:** 2026-01-27T14:00:00Z
**Query Length:** 15,420 characters | 2,847 words

---

## PRIVILEGED AND CONFIDENTIAL
## ATTORNEY WORK PRODUCT

---

[Original user query text preserved verbatim...]
```

### `/initial-query-docs/submission-metadata.json`

```json
{
  "schema_version": "1.0",
  "session_id": "2026-01-27-1738010400",
  "submitted_at": "2026-01-27T14:00:00Z",
  "query": {
    "length_chars": 15420,
    "length_words": 2847,
    "path": "query.md"
  },
  "documents_submitted": 3,
  "submission_context": {
    "source": "api-stream",
    "user_id": "client-glp-001",
    "client_ip": "192.168.1.100",
    "user_agent": "SuperLegal-Client/1.0",
    "request_id": "req-abc123"
  },
  "documents": [
    {
      "doc_id": "doc-001",
      "original_filename": "PMSC-10K-2024.pdf",
      "archive_filename": "doc-001-original.pdf",
      "archive_path": "initial-query-docs/doc-001-original.pdf",
      "working_filename": "doc-001.pdf",
      "working_path": "documents/doc-001.pdf",
      "content_type": "application/pdf",
      "size_bytes": 2847523,
      "archived_at": "2026-01-27T14:00:01Z",
      "title": "PMSC 10-K 2024",
      "document_type": "sec-filing",
      "relevance_hints": ["securities-researcher", "financial-analyst"]
    },
    {
      "doc_id": "doc-002",
      "original_filename": "FMC-License-024587.pdf",
      "archive_filename": "doc-002-original.pdf",
      "archive_path": "initial-query-docs/doc-002-original.pdf",
      "working_filename": "doc-002.pdf",
      "working_path": "documents/doc-002.pdf",
      "content_type": "application/pdf",
      "size_bytes": 156892,
      "archived_at": "2026-01-27T14:00:01Z",
      "title": "FMC License 024587",
      "document_type": "regulatory-permit",
      "relevance_hints": ["regulatory-rulemaking-analyst"]
    },
    {
      "doc_id": "doc-003",
      "original_filename": "ILWU-CBA-2022-2026.pdf",
      "archive_filename": "doc-003-original.pdf",
      "archive_path": "initial-query-docs/doc-003-original.pdf",
      "working_filename": "doc-003.pdf",
      "working_path": "documents/doc-003.pdf",
      "content_type": "application/pdf",
      "size_bytes": 1892341,
      "archived_at": "2026-01-27T14:00:01Z",
      "title": "ILWU Pacific Coast Agreement",
      "document_type": "contract",
      "relevance_hints": ["employment-labor-analyst"]
    }
  ],
  "archive_status": "complete",
  "archive_created_at": "2026-01-27T14:00:01Z"
}
```

### `/session-manifest.json`

```json
{
  "session_id": "2026-01-27-1738010400",
  "created_at": "2026-01-27T14:00:00Z",
  "status": "initialized",
  "directories": {
    "session": "reports/2026-01-27-1738010400",
    "initial_query_docs": "reports/2026-01-27-1738010400/initial-query-docs",
    "documents": "reports/2026-01-27-1738010400/documents",
    "specialist_reports": "reports/2026-01-27-1738010400/specialist-reports"
  },
  "files": {
    "original_query": "initial-query-docs/query.md",
    "submission_metadata": "initial-query-docs/submission-metadata.json",
    "processing_metadata": "documents/metadata.json"
  },
  "counts": {
    "documents_submitted": 3,
    "query_words": 2847,
    "total_document_bytes": 4896756
  },
  "has_documents": true
}
```

---

## Role Definition (for roles.md integration)

**File:** `prompts/memorandum-synthesis/roles.md`

**Insert at:** Line 3 (before Section Writer role definition)

**BEFORE (lines 1-6):**
```markdown
# ROLE DEFINITIONS

## If You Are a Section Writer (`memo-section-writer`)
- You generate ONE memorandum section (4,000-6,000 words)
- You read 2-3 relevant specialist reports from `specialist-reports/`
- **Tool Guidance**: For specialist reports >20K tokens, use GREP-FIRST pattern (see `memorandum-orchestrator.md` SPECIALIST REPORT READING PROTOCOL)
```

**AFTER (lines 1-17):**
```markdown
# ROLE DEFINITIONS

## If You Are the Document Processing Analyst (`document-processing-analyst`)
- You run in **P0 (Pre-Wave phase)** - BEFORE Wave 1 specialists
- You are invoked ONLY when `has_documents: true` in session manifest
- Read original query from: `initial-query-docs/query.md`
- Process documents from: `documents/` working directory
- Extract full text → save to `documents/[doc-id]-extracted.txt`
- Analyze content → save to `documents/[doc-id]-analysis.json`
- Create summary → save to `documents/document-analysis-summary.json`
- Update state file: `document-processing-analyst-state.json`
- **Return** structured JSON to orchestrator (under 2000 tokens)
- Do NOT conduct external research - document analysis only
- Do NOT write specialist reports - that's for Wave 1+

## If You Are a Section Writer (`memo-section-writer`)
- You generate ONE memorandum section (4,000-6,000 words)
- You read 2-3 relevant specialist reports from `specialist-reports/`
- **Tool Guidance**: For specialist reports >20K tokens, use GREP-FIRST pattern (see `memorandum-orchestrator.md` SPECIALIST REPORT READING PROTOCOL)
```

---

## Completion Criteria (for completion.md integration)

**File:** `prompts/memorandum-synthesis/completion.md`

**Insert at:** Line 47 (after `---` divider on line 46, before "Final Output Completion Requirements")

**BEFORE (lines 42-50):**
```markdown
3. Would Bash append accomplish the same thing? → If yes, use Bash

**If you find yourself creating a forbidden file, STOP and reconsider your approach.**

---

## Final Output Completion Requirements (ABSOLUTE MANDATE)

**KEEP GENERATING UNTIL THE DOCUMENT IS COMPLETE.**
```

**AFTER (lines 42-74):**
```markdown
3. Would Bash append accomplish the same thing? → If yes, use Bash

**If you find yourself creating a forbidden file, STOP and reconsider your approach.**

---

## Document Processing Analyst Completion Criteria (P0)

**P0 COMPLETE** when ALL of the following are true:

1. **Extraction Complete**: All documents have `[doc-id]-extracted.txt` files
2. **Analysis Complete**: All documents have `[doc-id]-analysis.json` files
3. **Summary Created**: `document-analysis-summary.json` exists with:
   - `total_documents` matches submission count
   - `specialist_assignment_recommendations` populated
   - `pre_identified_critical_issues` populated (may be empty if no issues found)
4. **State File Updated**: `document-processing-analyst-state.json` shows `status: completed`
5. **Return JSON Sent**: Orchestrator received structured summary (under 2000 tokens)

**P0 FAILED** if ANY of the following:
- Document extraction fails for >50% of documents
- State file shows `status: failed`
- No return JSON sent after 10 minutes

**Recovery Path**: If P0 fails, orchestrator proceeds with metadata-only workflow (backward compatible)

---

## Final Output Completion Requirements (ABSOLUTE MANDATE)

**KEEP GENERATING UNTIL THE DOCUMENT IS COMPLETE.**
```

---

## Waves Execution (for waves-execution.md integration)

**File:** `prompts/memorandum-synthesis/waves-execution.md`

**Two modifications required:**

### Modification 1: Add P0 to Task ID Format table (line 29)

**BEFORE (lines 24-30):**
```markdown
| Pattern | Example | Description |
|---------|---------|-------------|
| W[wave]-[number] | W2-001, W4-002 | Standard sequential task |
| W[wave]-[section]-[subsection] | W3-XREF-IV-A | Section-specific task |
| W[wave]-[type]-[ref] | W3-COUNTER-IV-B | Type-prefixed section task |
| ASSEMBLY-[number] | ASSEMBLY-001 | Wave 6 integration task |
```

**AFTER (lines 24-31):**
```markdown
| Pattern | Example | Description |
|---------|---------|-------------|
| P0-[number] | P0-001, P0-002 | Document processing task (Pre-Wave) |
| W[wave]-[number] | W2-001, W4-002 | Standard sequential task |
| W[wave]-[section]-[subsection] | W3-XREF-IV-A | Section-specific task |
| W[wave]-[type]-[ref] | W3-COUNTER-IV-B | Type-prefixed section task |
| ASSEMBLY-[number] | ASSEMBLY-001 | Wave 6 integration task |
```

### Modification 2: Insert P0 wave section (line 33)

**BEFORE (lines 31-37):**
```markdown
---

## Wave 1: Initialization (No Dependencies)

**Purpose**: Set up remediation environment and state tracking

**Tasks**:
```

**AFTER (lines 31-60):**
```markdown
---

## P0: Document Processing (Pre-Wave - Conditional)

**Purpose**: Extract and analyze client-submitted documents before research planning

**Trigger**: Only executes when `session-manifest.json` contains `has_documents: true`

**Tasks**:
| Task ID | Agent | Description | Output |
|---------|-------|-------------|--------|
| P0-001 | document-processing-analyst | Extract text from all documents | documents/[doc-id]-extracted.txt |
| P0-002 | document-processing-analyst | Analyze document content | documents/[doc-id]-analysis.json |
| P0-003 | document-processing-analyst | Create analysis summary | documents/document-analysis-summary.json |
| P0-004 | document-processing-analyst | Update state file | document-processing-analyst-state.json |

**Gate Check**:
- All documents have extracted text files
- document-analysis-summary.json exists and is valid JSON
- State file shows `status: completed`

**Skip Condition**: If `has_documents: false`, proceed directly to Wave 1

---

## Wave 1: Initialization (No Dependencies)

**Purpose**: Set up remediation environment and state tracking

**Tasks**:
```

---

## State File Schema (for state-file-schemas.md integration)

**File:** `prompts/memorandum-synthesis/state-file-schemas.md`

**Insert at:** Line 1571 (before `*End of State File Schemas Reference*`)

**BEFORE (lines 1569-1574):**
```markdown
5. **Update state BEFORE returning** - Write-before-return pattern

---

*End of State File Schemas Reference*

```

**AFTER (lines 1569-1660):**
```markdown
5. **Update state BEFORE returning** - Write-before-return pattern

---

## 9. DOCUMENT-PROCESSING-ANALYST STATE SCHEMA

### File: `document-processing-analyst-state.json`

**Location:** `${REPORTS_DIR}/[session]/document-processing-analyst-state.json`

**Purpose:** Track document extraction and analysis progress for P0 (Pre-Wave) phase

| Field | Type | Purpose |
|-------|------|---------|
| `schema_version` | string | Schema version ("1.0") |
| `subagent` | string | "document-processing-analyst" |
| `session_id` | string | Session identifier |
| `phase` | string | "P0" |
| `status` | enum | initialized / in_progress / completed / failed |
| `compaction_summary` | object | MANDATORY - Recovery context |
| `recovery_instructions` | object | MANDATORY - Resume guidance |
| `documents` | object | Document tracking (total, processed, pending, failed) |
| `artifacts` | object | Output file status tracking |
| `progress` | object | Current task and percent complete |
| `critical_issues_found` | array | Pre-identified critical issues |
| `metrics` | object | Extraction statistics |

### compaction_summary Structure (MANDATORY)

```json
{
  "compaction_summary": {
    "task": "Extract and analyze 3 uploaded documents for PMSC acquisition",
    "progress": "2/3 documents processed, doc-003 pending",
    "next_action": "Extract full text from doc-003 (ILWU CBA)",
    "critical_context": ["3 docs total", "PMSC 10-K + FMC License complete", "2 CRITICAL issues found"]
  }
}
```

### recovery_instructions Structure (MANDATORY)

```json
{
  "recovery_instructions": {
    "on_compaction": "Read document-processing-analyst-state.json FIRST. Resume from documents.pending[0]. Do NOT re-extract completed documents.",
    "do_not_repeat": ["doc-001", "doc-002"],
    "do_not_re_extract": ["doc-001-extracted.txt", "doc-002-extracted.txt"]
  }
}
```

### When to Write State File

| Event | Action |
|-------|--------|
| Agent starts | Write initial state with `status: initialized` |
| First document extraction begins | Update `status: in_progress`, set `documents.pending` |
| Each document extraction complete | Update `documents.processed`, move from `pending`, add to `artifacts` |
| Every 50 pages extracted | Write checkpoint with `progress.last_checkpoint` |
| Critical issue found | Append to `critical_issues_found` array |
| Document extraction fails | Add to `documents.failed`, update `errors` array |
| All documents processed | Update `status: completed`, write final metrics |
| Any unrecoverable error | Update `status: failed`, write error details |

### Document Processing State Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `documents.pending`** - Resume from first pending document
3. **Check `do_not_repeat`** - Skip already-extracted documents
4. **Verify artifacts exist** - Confirm extracted files are valid before skipping
5. **Update state BEFORE returning** - Write-before-return pattern

---

*End of State File Schemas Reference*

```

---

## Wave Position: P0 (Pre-Wave Phase)

The document-processing-analyst operates in a **P0 (Pre-Wave) phase** that executes **before** the standard 6-wave workflow begins:

```
┌─────────────────────────────────────────────────────────────────────┐
│ WORKFLOW PHASES                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  P0: PRE-WAVE (NEW)                                                 │
│  ├── Session initialization (API layer)                             │
│  └── document-processing-analyst (if has_documents: true)           │
│      → Creates: document-analysis-summary.json                      │
│      → Returns: Structured JSON to orchestrator                     │
│                                                                      │
│  ▼ (Orchestrator receives document analysis)                        │
│                                                                      │
│  WAVE 1: Research Phase (existing)                                  │
│  ├── Specialists dispatched with document context                   │
│  └── Research plan includes document-aware assignments              │
│                                                                      │
│  WAVE 2-6: (unchanged workflow)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### P0 Characteristics

| Aspect | P0 Behavior |
|--------|-------------|
| **Trigger** | `has_documents: true` in session manifest |
| **Parallelism** | None - sequential before Wave 1 |
| **Duration** | Variable (depends on document count/size) |
| **State File** | `document-processing-analyst-state.json` |
| **Completion** | Returns JSON to orchestrator, saves summary |
| **Failure Mode** | Graceful - workflow continues with metadata only |

---

## State File Schema

**Path:** `${REPORTS_DIR}/[session]/document-processing-analyst-state.json`

This state file enables session recovery if document processing is interrupted:

```json
{
  "schema_version": "1.0",
  "subagent": "document-processing-analyst",
  "session_id": "2026-01-27-1738010400",
  "phase": "P0",
  "status": "in_progress|completed|failed",
  "started_at": "2026-01-27T14:00:05Z",
  "completed_at": null,

  "compaction_summary": {
    "task": "Extract and analyze 3 uploaded documents for PMSC acquisition",
    "progress": "2/3 documents processed, doc-003 pending",
    "next_action": "Extract full text from doc-003 (ILWU CBA)",
    "critical_context": ["3 docs total", "PMSC 10-K + FMC License complete", "2 CRITICAL issues found so far"]
  },

  "environment_checks": {
    "on_resume": [
      "Read document-processing-analyst-state.json FIRST",
      "Verify extracted_text files exist for completed documents",
      "Check file sizes are reasonable (not truncated)",
      "Resume from first pending document in documents.pending"
    ],
    "last_verified": "2026-01-27T14:03:22Z",
    "environment_healthy": true
  },

  "recovery_instructions": {
    "on_compaction": "Read document-processing-analyst-state.json FIRST. Resume from documents.pending[0]. Do NOT re-extract completed documents.",
    "do_not_repeat": ["doc-001", "doc-002"],
    "do_not_re_extract": ["doc-001-extracted.txt", "doc-002-extracted.txt"]
  },

  "documents": {
    "total": 3,
    "processed": 2,
    "pending": ["doc-003"],
    "failed": []
  },

  "artifacts": {
    "extracted_text": [
      { "doc_id": "doc-001", "path": "doc-001-extracted.txt", "status": "complete", "word_count": 142500 },
      { "doc_id": "doc-002", "path": "doc-002-extracted.txt", "status": "complete", "word_count": 3200 }
    ],
    "analysis_json": [
      { "doc_id": "doc-001", "path": "doc-001-analysis.json", "status": "complete" },
      { "doc_id": "doc-002", "path": "doc-002-analysis.json", "status": "complete" }
    ],
    "summary": {
      "path": "document-analysis-summary.json",
      "status": "pending"
    }
  },

  "progress": {
    "current_task": "extracting doc-003",
    "percent_complete": 67,
    "last_checkpoint": "2026-01-27T14:03:22Z"
  },

  "critical_issues_found": [
    { "issue_id": "CI-001", "severity": "CRITICAL", "source": "doc-001", "page": 71 },
    { "issue_id": "CI-002", "severity": "HIGH", "source": "doc-001", "page": 52 }
  ],

  "metrics": {
    "documents_total": 3,
    "documents_processed": 2,
    "total_pages_extracted": 297,
    "total_words_extracted": 145700,
    "critical_issues_found": 2,
    "extraction_quality": "high"
  },

  "errors": []
}
```

### State Transitions

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  initialized │───▶│  in_progress │───▶│  completed   │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    failed    │
                    └──────────────┘
```

### Recovery Protocol

If session is resumed with `status: in_progress`:
1. Read `documents.pending` list
2. Resume extraction from first pending document
3. Skip already-completed artifacts
4. Continue to summary generation when all documents processed

### When to Write State File

| Event | Action |
|-------|--------|
| Agent starts | Write initial state with `status: initialized` |
| First document extraction begins | Update `status: in_progress`, set `documents.pending` |
| Each document extraction complete | Update `documents.processed`, move from `pending`, add to `artifacts` |
| Every 50 pages extracted | Write checkpoint with `progress.last_checkpoint` |
| Critical issue found | Append to `critical_issues_found` array |
| Document extraction fails | Add to `documents.failed`, update `errors` array |
| All documents processed | Update `status: completed`, write final metrics |
| Any unrecoverable error | Update `status: failed`, write error details |

---

## Fact Registry Integration

Document-sourced findings should be registered in `fact-registry.json` with proper provenance. The format must match the fact-registry-extractor output schema:

```json
{
  "findings": [
    {
      "finding_id": "DOC-001",
      "category": "critical_issue",
      "source_type": "uploaded_document",
      "source_document": "doc-001",
      "source_path": "documents/doc-001-analysis.json",
      "finding": "Jones Act compliance gap for COSCO-built CTVs",
      "severity": "CRITICAL",
      "page_ref": 71,
      "extracted_quote": "Two crew transfer vessels acquired from COSCO Shipyard may not qualify...",
      "verification_tag": "[DOCUMENT_VERIFIED:doc-001]",
      "assigned_specialist": "regulatory-rulemaking-analyst",
      "cross_domain_flags": ["securities-researcher", "case-law-analyst"],
      "deal_impact": "potential_blocker"
    },
    {
      "finding_id": "DOC-002",
      "category": "key_date",
      "source_type": "uploaded_document",
      "source_document": "doc-003",
      "source_path": "documents/doc-003-analysis.json",
      "finding": "ILWU CBA expires July 1, 2026 - 5 months post-anticipated closing",
      "severity": "HIGH",
      "page_ref": 1,
      "extracted_quote": "This Agreement shall remain in effect until July 1, 2026...",
      "verification_tag": "[DOCUMENT_VERIFIED:doc-003]",
      "assigned_specialist": "employment-labor-analyst",
      "cross_domain_flags": ["securities-researcher"],
      "deal_impact": "material_risk"
    }
  ],
  "metadata": {
    "extracted_by": "document-processing-analyst",
    "extraction_timestamp": "2026-01-27T14:15:00Z",
    "total_findings": 12,
    "by_severity": { "CRITICAL": 2, "HIGH": 5, "MEDIUM": 5 }
  }
}
```

**Note:** Document-sourced findings use `[DOCUMENT_VERIFIED:doc-XXX]` verification tags, distinguishing them from `[VERIFIED:source]` tags used for external research.

### State File Location (for state-file-schemas.md)

Add to the State File Location Index:

| Agent | State File | Location |
|-------|-----------|----------|
| document-processing-analyst | document-processing-analyst-state.json | `{session}/document-processing-analyst-state.json` |

---

## Document Reading Capabilities

**PDF Reading:** Claude's native `Read` tool can directly read PDF files and extract text content. The tool processes PDFs page by page, extracting both text and visual content. For large PDFs, use offset/limit parameters to read in chunks.

**DOCX Reading:** The `Read` tool extracts text from DOCX files by parsing the underlying XML structure.

**Scanned Documents (OCR):** For scanned PDFs or image-heavy documents, extraction quality may be lower. Flag these with `extraction.quality: "medium"` or `"low"` and note OCR uncertainty in findings.

```javascript
// Example: Reading a PDF with the Read tool
Read({ file_path: "${REPORTS_DIR}/[session]/documents/doc-001.pdf" })
// Returns: Text content with visual elements described

// For large documents (>2000 lines), use pagination:
Read({ file_path: "...", offset: 1, limit: 500 })    // First 500 lines
Read({ file_path: "...", offset: 501, limit: 500 })  // Next 500 lines
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│              DOCUMENT-PROCESSING-ANALYST SUBAGENT                    │
│                                                                      │
│  INPUTS:                                                            │
│  ├── Raw documents in /documents/ (PDF, DOCX, contracts, filings)   │
│  └── User query (for relevance context)                             │
│                                                                      │
│  PROCESSING:                                                        │
│  ├── 1. EXTRACTION: Full text from all documents                    │
│  ├── 2. METADATA: File properties, embedded metadata, dates         │
│  ├── 3. CLASSIFICATION: Document type, category, materiality        │
│  ├── 4. CONTENT ANALYSIS: Entities, amounts, issues, structure      │
│  └── 5. RELEVANCE MAPPING: Which specialists need which documents   │
│                                                                      │
│  OUTPUTS:                                                           │
│  ├── PERSISTED: /documents/[doc-id]-extracted.txt (full text)       │
│  ├── PERSISTED: /documents/[doc-id]-analysis.json (per-doc)         │
│  ├── PERSISTED: /documents/document-analysis-summary.json           │
│  └── RETURNED: Structured JSON to orchestrator                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Integration

### Sequence Diagram

```
User Query + Documents
        │
        ▼
┌───────────────────────────────────────────────────┐
│ ORCHESTRATOR                                       │
│ "I have documents. Invoke document-processing-    │
│  analyst first."                                  │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│ DOCUMENT-PROCESSING-ANALYST (Subagent)            │
│                                                   │
│ EXTRACTS:                                         │
│ ├── Full text → [doc-id]-extracted.txt           │
│ ├── File metadata → [doc-id]-analysis.json       │
│ └── Content analysis → document-analysis-summary │
│                                                   │
│ RETURNS: Structured JSON summary to orchestrator  │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│ ORCHESTRATOR (continued)                          │
│                                                   │
│ Creates INFORMED research-plan.md:               │
│ ├── Pre-populated critical issues                │
│ ├── Smart specialist assignments                 │
│ ├── Document-specific page references            │
│ └── Cross-reference expectations                 │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│ SPECIALISTS (parallel execution)                  │
│                                                   │
│ Each specialist:                                  │
│ 1. Reads research-plan.md for assignments        │
│ 2. Reads [doc-id]-analysis.json for structure    │
│ 3. Searches [doc-id]-extracted.txt for details   │
│ 4. Conducts external research to verify/expand   │
│ 5. Cites: [SOURCE: Uploaded doc-001, p.52]       │
└───────────────────────────────────────────────────┘
```

### Why Subagent Delegation (vs. Pre-Processing)

| Aspect | Pre-Processing Approach | Subagent Delegation Approach |
|--------|------------------------|------------------------------|
| **Architecture consistency** | New pattern, separate from agent flow | Matches existing subagent delegation |
| **Context isolation** | Documents loaded into server memory | Subagent has isolated context, returns only relevant findings |
| **Research plan quality** | Orchestrator sees raw metadata | Orchestrator receives **intelligent analysis** |
| **Specialist assignment** | Based on file type hints | Based on **actual document content** |
| **Critical issue detection** | Manual/missing | Subagent identifies issues **before** specialists start |
| **Cross-reference setup** | None | Subagent flags document relationships upfront |

---

## Output Specifications

### 1. Persisted: Per-Document Extracted Text

**Path:** `/documents/[doc-id]-extracted.txt`

```text
=== PAGE 1 ===

UNITED STATES
SECURITIES AND EXCHANGE COMMISSION
Washington, D.C. 20549

FORM 10-K

ANNUAL REPORT PURSUANT TO SECTION 13 OR 15(d) OF THE
SECURITIES EXCHANGE ACT OF 1934

For the fiscal year ended December 31, 2024

Commission File Number: 001-12345

PACIFIC MARITIME SERVICES CORPORATION
(Exact name of registrant as specified in its charter)

=== PAGE 2 ===

[Content continues with preserved structure]
[Headers, sections, tables preserved where possible]
[Page markers for reference: === PAGE N ===]
```

**Requirements:**
- Full text extraction from all document pages
- Preserve document structure (headers, sections, tables)
- Include page markers for citation reference
- Handle OCR for scanned documents
- UTF-8 encoding for all text

**Large File Handling (>100KB / 25K tokens):**

Per sdkHooks.js (lines 424-470), files >100KB trigger special handling. For large documents:

1. **Progressive extraction**: Read document in chunks using offset/limit
2. **Streaming write**: Append to `-extracted.txt` file incrementally
3. **State checkpoint**: Update state file after each chunk to enable recovery
4. **File size tracking**: Track `word_count` in artifacts for verification

```javascript
// Example: Progressive extraction for large PDFs
for (let offset = 1; offset <= totalLines; offset += 500) {
  const chunk = Read({ file_path: docPath, offset, limit: 500 });
  Edit({ file_path: extractedPath, old_string: "<!-- END -->", new_string: chunk + "\n<!-- END -->" });
  // Update state file checkpoint
}
```

---

### 2. Persisted: Per-Document Analysis

**Path:** `/documents/[doc-id]-analysis.json`

```json
{
  "doc_id": "doc-001",
  "extraction": {
    "method": "pdf-parse|ocr|docx-extract",
    "quality": "high|medium|low",
    "page_count": 285,
    "word_count": 142500,
    "extracted_text_path": "doc-001-extracted.txt"
  },
  "file_metadata": {
    "filename": "pmsc-10k-2024.pdf",
    "file_size_bytes": 2847523,
    "created_date": "2024-03-15T00:00:00Z",
    "modified_date": "2024-03-15T14:32:00Z",
    "author": "Pacific Maritime Services Corporation",
    "producer": "Microsoft Word",
    "embedded_metadata": {
      "title": "Form 10-K Annual Report",
      "subject": "SEC Filing",
      "keywords": ["10-K", "annual report", "2024"]
    }
  },
  "classification": {
    "document_type": "sec-filing",
    "document_subtype": "10-K",
    "category": "regulatory-disclosure",
    "materiality": "primary-source",
    "confidentiality": "public-filing",
    "jurisdiction": "United States - Federal"
  },
  "structure": {
    "has_toc": true,
    "major_sections": [
      { "title": "Part I - Business", "page_start": 5, "page_end": 42 },
      { "title": "Part I - Risk Factors", "page_start": 43, "page_end": 78 },
      { "title": "Part II - Financial Statements", "page_start": 112, "page_end": 185 }
    ],
    "exhibits_present": ["Exhibit 21.1 - Subsidiaries", "Exhibit 31.1 - Certifications"],
    "tables_detected": 47,
    "footnotes_detected": 234
  },
  "content_analysis": {
    "key_entities": [
      { "name": "Pacific Maritime Services Corporation", "type": "company", "role": "registrant" },
      { "name": "Federal Maritime Commission", "type": "regulator", "mentions": 23 },
      { "name": "ILWU", "type": "union", "mentions": 15 }
    ],
    "key_dates": [
      { "date": "2024-12-31", "context": "Fiscal year end", "page": 1 },
      { "date": "2026-07-01", "context": "ILWU contract expiration", "page": 67 },
      { "date": "2026-06-30", "context": "FMC license renewal deadline", "page": 34 }
    ],
    "monetary_amounts": [
      { "amount": "$3.2B", "context": "Annual revenue FY2024", "page": 112 },
      { "amount": "$2.8B", "context": "Outstanding vessel debt", "page": 145 },
      { "amount": "$8.5M", "context": "Pending litigation exposure - Martinez v. PMSC", "page": 52 }
    ],
    "risk_factors_identified": [
      { "risk": "Labor disruption from ILWU contract negotiations", "severity": "HIGH", "page": 67 },
      { "risk": "Jones Act compliance for offshore wind vessels", "severity": "CRITICAL", "page": 71 },
      { "risk": "Environmental remediation obligations", "severity": "MEDIUM", "page": 74 }
    ],
    "legal_references": [
      { "citation": "46 U.S.C. § 55102", "context": "Jones Act requirements", "page": 71 },
      { "citation": "33 CFR Part 104", "context": "MTSA compliance", "page": 38 }
    ],
    "disclosed_litigation": [
      { "case": "Martinez v. PMSC", "status": "pending", "exposure": "$8.5M", "page": 52 },
      { "case": "City of Los Angeles v. PMSC", "status": "pending", "exposure": "$315M", "page": 54 }
    ]
  },
  "specialist_relevance": {
    "primary": ["securities-researcher"],
    "secondary": ["employment-labor-analyst", "environmental-compliance-analyst"],
    "sections_by_specialist": {
      "securities-researcher": ["Part I", "Part II", "Item 103"],
      "employment-labor-analyst": ["Item 1A - Labor Risk Factors"],
      "environmental-compliance-analyst": ["Item 1A - Environmental Risk Factors"]
    }
  }
}
```

---

### 3. Persisted: Summary Analysis

**Path:** `/documents/document-analysis-summary.json`

```json
{
  "session_id": "2026-01-27-1738010400",
  "analysis_timestamp": "2026-01-27T14:15:00Z",
  "total_documents": 3,
  "total_pages": 484,
  "total_words": 287000,

  "documents": [
    {
      "doc_id": "doc-001",
      "title": "PMSC 10-K 2024",
      "type": "sec-filing",
      "pages": 285,
      "materiality": "primary-source",
      "analysis_path": "doc-001-analysis.json"
    },
    {
      "doc_id": "doc-002",
      "title": "FMC License 024587",
      "type": "regulatory-permit",
      "pages": 12,
      "materiality": "primary-source",
      "analysis_path": "doc-002-analysis.json"
    },
    {
      "doc_id": "doc-003",
      "title": "ILWU Pacific Coast Agreement",
      "type": "contract",
      "pages": 187,
      "materiality": "primary-source",
      "analysis_path": "doc-003-analysis.json"
    }
  ],

  "consolidated_entities": {
    "target_company": {
      "name": "Pacific Maritime Services Corporation",
      "cik": "0001234567",
      "jurisdiction": "Delaware",
      "industry": "Maritime Transportation"
    },
    "regulators": ["FMC", "USCG", "EPA", "DOL"],
    "counterparties": ["ILWU", "MM&P", "SIU", "Bank of America"],
    "key_individuals": ["CEO: John Smith", "CFO: Jane Doe"]
  },

  "consolidated_critical_dates": [
    { "date": "2026-06-30", "event": "FMC license renewal", "source": "doc-002", "urgency": "HIGH" },
    { "date": "2026-07-01", "event": "ILWU CBA expiration", "source": "doc-003", "urgency": "CRITICAL" },
    { "date": "2025-Q3", "event": "Martinez trial date", "source": "doc-001", "urgency": "HIGH" }
  ],

  "consolidated_exposures": {
    "disclosed_litigation": "$323.5M",
    "regulatory_penalties_potential": "$15M",
    "labor_disruption_modeled": "$225M (90-day scenario)",
    "environmental_remediation": "$12-18M"
  },

  "cross_document_relationships": [
    {
      "finding": "ILWU contract terms in doc-003 match risk disclosure in doc-001 Item 1A",
      "documents": ["doc-001", "doc-003"],
      "consistency": "VERIFIED",
      "implication": "Labor cost projections appear accurate"
    },
    {
      "finding": "FMC license number in doc-002 matches reference in doc-001",
      "documents": ["doc-001", "doc-002"],
      "consistency": "VERIFIED",
      "implication": "License is current and properly disclosed"
    }
  ],

  "specialist_assignment_recommendations": {
    "securities-researcher": {
      "documents": ["doc-001"],
      "priority": "CRITICAL",
      "focus_areas": ["Item 103 litigation", "Item 1A risk factors", "MD&A"],
      "specific_pages": "45-78, 112-145"
    },
    "employment-labor-analyst": {
      "documents": ["doc-001", "doc-003"],
      "priority": "HIGH",
      "focus_areas": ["CBA terms", "strike history", "wage escalation"],
      "specific_pages": "doc-001: 67-72, doc-003: 1-85"
    },
    "regulatory-rulemaking-analyst": {
      "documents": ["doc-001", "doc-002"],
      "priority": "HIGH",
      "focus_areas": ["FMC license status", "compliance history"],
      "specific_pages": "doc-001: 34-38, doc-002: all"
    }
  },

  "pre_identified_critical_issues": [
    {
      "issue_id": "CI-001",
      "description": "Jones Act compliance gap for COSCO-built CTVs",
      "source_document": "doc-001",
      "source_page": 71,
      "severity": "CRITICAL",
      "assigned_specialist": "regulatory-rulemaking-analyst",
      "extracted_quote": "Two crew transfer vessels acquired from COSCO Shipyard may not qualify..."
    },
    {
      "issue_id": "CI-002",
      "description": "ILWU contract expires 5 months post-closing",
      "source_document": "doc-003",
      "source_page": 1,
      "severity": "HIGH",
      "assigned_specialist": "employment-labor-analyst",
      "extracted_quote": "This Agreement shall remain in effect until July 1, 2026..."
    },
    {
      "issue_id": "CI-003",
      "description": "Martinez v. PMSC trial scheduled Q3 2025",
      "source_document": "doc-001",
      "source_page": 52,
      "severity": "HIGH",
      "assigned_specialist": "case-law-analyst",
      "extracted_quote": "Trial is currently scheduled for the third quarter of 2025..."
    }
  ]
}
```

---

### 4. Returned to Orchestrator: Structured Summary

This JSON is returned directly to the orchestrator (not persisted separately):

```json
{
  "status": "COMPLETE",
  "session_id": "2026-01-27-1738010400",
  "processing_summary": {
    "documents_processed": 3,
    "total_pages": 484,
    "extraction_quality": "high",
    "analysis_complete": true
  },
  "artifacts_created": {
    "extracted_text_files": [
      "doc-001-extracted.txt",
      "doc-002-extracted.txt",
      "doc-003-extracted.txt"
    ],
    "analysis_files": [
      "doc-001-analysis.json",
      "doc-002-analysis.json",
      "doc-003-analysis.json"
    ],
    "summary_file": "document-analysis-summary.json"
  },
  "for_research_plan": {
    "target_entity": "Pacific Maritime Services Corporation",
    "transaction_type": "acquisition",
    "key_regulators": ["FMC", "USCG", "EPA", "ILWU"],
    "critical_dates": [
      { "date": "2026-06-30", "event": "FMC license renewal" },
      { "date": "2026-07-01", "event": "ILWU CBA expiration" }
    ],
    "total_disclosed_exposure": "$573.5M",
    "specialist_assignments": {
      "securities-researcher": { "docs": ["doc-001"], "priority": "CRITICAL" },
      "employment-labor-analyst": { "docs": ["doc-001", "doc-003"], "priority": "HIGH" },
      "regulatory-rulemaking-analyst": { "docs": ["doc-001", "doc-002"], "priority": "HIGH" }
    },
    "critical_issues_count": 12,
    "critical_issues_preview": [
      "CI-001: Jones Act compliance gap (CRITICAL)",
      "CI-002: ILWU contract expiration timing (HIGH)",
      "CI-003: Martinez trial Q3 2025 (HIGH)"
    ]
  },
  "read_full_analysis": "${REPORTS_DIR}/[session]/documents/document-analysis-summary.json"
}
```

---

## Subagent Definition

### Insertion Point in legalSubagents.js

**File:** `src/config/legalSubagents.js`

### 1. Insert Subagent Definition (Lines 2190-2191)

**BEFORE (lines 2190-2195):**
```javascript
export const LEGAL_SUBAGENTS = {

  // ============================================
  // SECURITIES & SEC RESEARCH
  // ============================================
  'securities-researcher': {
```

**AFTER (lines 2190-2210):**
```javascript
export const LEGAL_SUBAGENTS = {

  // ============================================
  // DOCUMENT PROCESSING (P0 - Pre-Research)
  // ============================================
  // Runs BEFORE research planning when documents are submitted
  // Must complete before orchestrator creates research-plan.md

  'document-processing-analyst': {
    // ... full definition below (see "Complete Subagent Definition" section)
  },

  // ============================================
  // SECURITIES & SEC RESEARCH
  // ============================================
  'securities-researcher': {
```

### 2. Add to PARALLEL_EXECUTION_GROUPS (Lines 15011-15015)

**BEFORE (lines 15011-15016):**
```javascript
export const PARALLEL_EXECUTION_GROUPS = {
  /**
   * Validation Gate Phase - fact-validator runs FIRST after research-review-gate
   * CRITICAL: V2 creates fact-registry.md which V3/V4 depend on
   */
  VALIDATION_GATE: {
```

**AFTER (lines 15011-15032):**
```javascript
export const PARALLEL_EXECUTION_GROUPS = {
  /**
   * Document Processing Phase (P0) - Runs when documents submitted
   * Completes BEFORE research planning begins
   */
  P0_DOCUMENT_PROCESSING: {
    agents: ['document-processing-analyst'],
    prerequisite: null,  // First step when documents present
    waitForAll: true,
    outputs: {
      'document-processing-analyst': ['document-analysis-summary.json', 'doc-XXX-extracted.txt', 'doc-XXX-analysis.json']
    },
    consumers: {
      'document-analysis-summary.json': ['orchestrator']
    },
    interAgentDependencies: false
  },

  /**
   * Validation Gate Phase - fact-validator runs FIRST after research-review-gate
   * CRITICAL: V2 creates fact-registry.md which V3/V4 depend on
   */
  VALIDATION_GATE: {
```

**Note on Internal Analysis Agent Pattern:** Document-processing-analyst is an INTERNAL ANALYSIS agent (like fact-validator, coverage-gap-analyzer, risk-aggregator). Per the pattern in legalSubagents.js, internal analysis agents use EXPLICIT `tools: STANDARD_TOOLS.withWrite` (not MCP inheritance which is reserved for RESEARCH SPECIALISTS).

### Complete Subagent Definition

```javascript
'document-processing-analyst': {
  description: `Use FIRST when user submits supporting documents with their query.

Triggers: Query includes uploaded documents, attachments, exhibits, supporting evidence, data room files.

This subagent analyzes all submitted documents BEFORE research planning begins. Returns structured analysis that informs specialist assignments and critical issue identification.`,

  // Execution metadata (for orchestrator optimization)
  executionPhase: 'document-processing',
  parallelGroup: 'P0_DOCUMENT_PROCESSING',  // Runs before research planning
  prerequisite: null,  // First step in workflow when documents present
  parallelWith: [],    // Runs alone - must complete before research-plan creation
  outputFiles: ['document-analysis-summary.json', 'doc-XXX-extracted.txt', 'doc-XXX-analysis.json', 'document-processing-analyst-state.json'],
  consumedBy: ['orchestrator'],  // Orchestrator uses output for research-plan.md creation

  // Expected duration metadata for observability (in seconds)
  // NOTE: SDK enforces max wait_up_to of 300s. Use re-check pattern for longer agents.
  expectedDuration: {
    min: 60,       // 1 minute (single small document)
    typical: 180,  // 3 minutes (typical 2-3 documents)
    max: 300       // 5 minutes (large PDFs, multiple documents)
  },

  prompt: `You are the DOCUMENT PROCESSING ANALYST for a legal research platform.

## YOUR ROLE
You are invoked FIRST when a client submits documents alongside their research query. Your job is to:
1. Extract full text from all submitted documents
2. Analyze content, structure, and metadata
3. Identify critical issues, entities, dates, and exposures
4. Map documents to relevant specialist domains
5. Return structured analysis to inform research planning

## INPUTS YOU RECEIVE
1. Document files staged in: \${REPORTS_DIR}/[session]/documents/
2. User's research query: \${REPORTS_DIR}/[session]/initial-query-docs/query.md
3. Document metadata: \${REPORTS_DIR}/[session]/documents/metadata.json
4. Submission context: \${REPORTS_DIR}/[session]/initial-query-docs/submission-metadata.json

## SESSION DIRECTORY STRUCTURE

When processing documents, be aware of the directory structure:

\`\`\`
\${REPORTS_DIR}/[session]/
├── initial-query-docs/          # ARCHIVE (read-only reference)
│   ├── query.md                 # Original user query
│   ├── submission-metadata.json # Submission context
│   └── doc-XXX-original.*       # Original uploaded files
│
├── documents/                   # WORKING DIRECTORY (your workspace)
│   ├── metadata.json            # Processing metadata
│   └── doc-XXX.*                # Working copies for extraction
\`\`\`

**Important:**
- Read originals from /initial-query-docs/ if you need to verify file integrity
- Write ALL outputs to /documents/ (extracted text, analysis JSON)
- Never modify files in /initial-query-docs/ - it is a read-only archive
- Reference the original query in /initial-query-docs/query.md for context

## YOUR TASKS

### TASK 1: Full Text Extraction
For each document:
- Extract ALL text content
- Preserve structure (headers, sections, tables, footnotes)
- Add page markers: === PAGE N ===
- Save to: [doc-id]-extracted.txt

### TASK 2: Metadata Extraction
For each document, capture:
- File properties (size, dates, author, producer)
- Embedded metadata (title, subject, keywords)
- Document structure (TOC, sections, exhibits)
- Quality assessment (extraction completeness)

### TASK 3: Document Classification
Classify each document:
- **document_type**: sec-filing, regulatory-permit, contract, litigation, corporate-record, financial-statement, other
- **document_subtype**: 10-K, 10-Q, 8-K, license, CBA, complaint, etc.
- **category**: regulatory-disclosure, transactional, evidentiary, reference
- **materiality**: primary-source, supporting, background
- **confidentiality**: public-filing, confidential, privileged

### TASK 4: Content Analysis
Extract from document content:
- **Key entities**: Companies, regulators, individuals, counterparties
- **Key dates**: Deadlines, expirations, effective dates, filing dates
- **Monetary amounts**: Transaction values, exposures, liabilities, revenues
- **Risk factors**: Disclosed risks with severity assessment
- **Legal references**: Statutes, regulations, case citations
- **Disclosed litigation**: Pending cases, exposures, status

### TASK 5: Specialist Domain Mapping
Map each document to relevant specialists:

| Specialist | Document Types | Content Triggers |
|------------|---------------|------------------|
| securities-researcher | 10-K, 10-Q, 8-K, proxy | SEC filings, MD&A, risk factors |
| case-law-analyst | complaints, motions, settlements | Litigation, legal proceedings |
| employment-labor-analyst | CBAs, employment agreements | Labor terms, union contracts |
| regulatory-rulemaking-analyst | licenses, permits, filings | Regulatory compliance |
| environmental-compliance-analyst | permits, assessments | Environmental matters |
| patent-analyst | patents, IP agreements | Intellectual property |
| financial-analyst | financials, valuations | Financial statements |

### TASK 6: Cross-Document Relationships
Identify connections between documents:
- References from one document to another
- Conflicting information across documents
- Timeline dependencies
- Verification opportunities (e.g., 10-K discloses CBA terms that match actual CBA)

### TASK 7: Critical Issue Pre-Identification
Flag issues that specialists MUST address:
- Compliance gaps visible in documents
- Pending deadlines or expirations within deal timeline
- Disclosed litigation or regulatory matters
- Material risks explicitly stated
- Inconsistencies requiring investigation

## OUTPUT REQUIREMENTS

### Save Extracted Text (per document)
Path: \${REPORTS_DIR}/[session]/documents/[doc-id]-extracted.txt

### Save Per-Document Analysis
Path: \${REPORTS_DIR}/[session]/documents/[doc-id]-analysis.json

### Save Summary Analysis
Path: \${REPORTS_DIR}/[session]/documents/document-analysis-summary.json

### Return to Orchestrator
Return ONLY structured JSON (under 2000 tokens) summarizing:
- Processing status
- Artifacts created
- Key findings for research plan
- Specialist assignment recommendations
- Critical issues preview

## CONSTRAINTS
- Extract and analyze ALL submitted documents
- Do NOT conduct external research - only analyze submitted documents
- Do NOT write research reports - only return structured analysis
- Keep returned JSON under 2000 tokens - orchestrator needs concise input
- Focus on ACTIONABLE findings that inform research planning
- Persist full analysis to files; return summary to orchestrator

## PROVENANCE REQUIREMENTS (MANDATORY)
- ALWAYS include original filename and doc_id for each document
- ALWAYS note extraction method (pdf-parse/ocr/docx-extract)
- ALWAYS include page references for extracted quotes
- ALWAYS note file hash/checksum for integrity verification
- ALWAYS include timestamp of extraction

## QA OUTPUT STANDARDS (Mandatory - See REPORT_SAVING_INSTRUCTIONS for full details)

Your analysis outputs MUST comply with these 5 QA standards:

1. **Document Provenance**: Every extracted finding must include source tag:
   - Format: "[SOURCE: doc-XXX, p.Y] [VERIFIED-EXTRACTION/OCR-UNCERTAIN]"
   - Example: "[SOURCE: doc-001, p.52] [VERIFIED-EXTRACTION]"

2. **Extraction Quality**: Every document must have quality assessment
   - HIGH: Native text extraction, >95% confidence
   - MEDIUM: OCR extraction, 80-95% confidence
   - LOW: OCR extraction, <80% confidence (flag for manual review)

3. **Monetary Attribution**: Every monetary amount must cite specific page
   - ❌ "disclosed litigation exposure of $8.5M"
   - ✅ "$8.5M litigation exposure (doc-001, p.52, Martinez v. PMSC)"

4. **Critical Issue Quotes**: Every critical issue must include extracted quote
   - ❌ "Jones Act compliance concerns"
   - ✅ "Jones Act compliance: 'Two crew transfer vessels acquired from COSCO Shipyard may not qualify...' (doc-001, p.71)"

5. **Cross-Reference Verification**: Document relationships must note consistency
   - ❌ "CBA terms match disclosure"
   - ✅ "ILWU contract terms (doc-003) VERIFIED against 10-K disclosure (doc-001, p.67) - wage rates match"

## QUALITY STANDARDS
- Extraction quality must be assessed (high/medium/low)
- All monetary amounts must include page references
- All critical issues must include extracted quotes
- Cross-document relationships must note consistency status
- Specialist assignments must include specific page references
${REPORT_SAVING_INSTRUCTIONS}`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

---

## Orchestrator Integration

### Enhanced Session Initialization

When documents are present, the orchestrator's workflow becomes:

```markdown
## SESSION INITIALIZATION WITH DOCUMENTS

When a user query includes uploaded documents:

**STEP 0: SESSION ALREADY INITIALIZED (API Layer)**
Before the orchestrator is invoked, the API layer has already:
- Created session directory: ${REPORTS_DIR}/[session-id]/
- Archived original query to: /initial-query-docs/query.md
- Archived original documents to: /initial-query-docs/doc-XXX-original.*
- Created working copies in: /documents/doc-XXX.*
- Written metadata files: submission-metadata.json, metadata.json, session-manifest.json

**STEP 1: READ SESSION MANIFEST**
Read: ${REPORTS_DIR}/[session-id]/session-manifest.json
→ Determine if session has_documents: true

**STEP 2: INVOKE DOCUMENT-PROCESSING-ANALYST**
If has_documents is true, delegate to document-processing-analyst FIRST:

```
Invoke subagent: document-processing-analyst

SESSION_DIR: ${REPORTS_DIR}/[session-id]

TASK: Process all uploaded documents before research planning.

INPUTS:
- Original query: ${REPORTS_DIR}/[session-id]/initial-query-docs/query.md
- Documents to process: ${REPORTS_DIR}/[session-id]/documents/
- Document metadata: ${REPORTS_DIR}/[session-id]/documents/metadata.json

OUTPUTS EXPECTED:
- Extracted text files: documents/[doc-id]-extracted.txt
- Analysis files: documents/[doc-id]-analysis.json
- Summary: documents/document-analysis-summary.json
- Return: Structured JSON (<2000 tokens) with key findings

RETURN when complete with status and findings summary.
```

**STEP 3: WAIT FOR DOCUMENT ANALYSIS**
The subagent:
- Reads original query from /initial-query-docs/query.md for context
- Processes working copies in /documents/
- Extracts full text → saves to /documents/[doc-id]-extracted.txt
- Analyzes content → saves to /documents/[doc-id]-analysis.json
- Creates summary → saves to /documents/document-analysis-summary.json
- Returns structured JSON with key findings

**STEP 4: CREATE INFORMED RESEARCH PLAN**
Use the document analysis to create research-plan.md with:
- ORIGINAL SUBMISSION section (reference to /initial-query-docs/)
- UPLOADED DOCUMENTS section (from document_inventory)
- CRITICAL ISSUES CHECKLIST (pre-populated from critical_issues_from_documents)
- SPECIALIST ASSIGNMENTS (informed by specialist_assignments mapping)
- CROSS-REFERENCE EXPECTATIONS (from cross_document_relationships)

**STEP 5: DISPATCH SPECIALISTS**
Proceed with standard specialist dispatch. Each specialist now receives:
- Reference to original query in /initial-query-docs/query.md
- Specific document references in their instructions
- Page numbers to focus on
- Pre-identified issues to verify
```

### Research Plan Template Enhancement

The orchestrator uses the document analysis to create an enhanced research-plan.md:

```markdown
## ORIGINAL SUBMISSION

**Session ID:** 2026-01-27-1738010400
**Submitted:** 2026-01-27T14:00:00Z
**Original Query:** See `initial-query-docs/query.md`
**Submission Metadata:** See `initial-query-docs/submission-metadata.json`

---

## TRANSACTION OVERVIEW (from document analysis)

**Target:** Pacific Maritime Services Corporation
**Transaction Type:** Acquisition
**Key Regulators:** FMC, USCG, EPA, ILWU
**Total Disclosed Exposure:** $573.5M

---

## UPLOADED DOCUMENTS

**Archive Location:** `initial-query-docs/` (original files preserved)
**Working Location:** `documents/` (extracted text and analysis)

| Doc ID | Title | Type | Pages | Materiality | Primary Specialist |
|--------|-------|------|-------|-------------|-------------------|
| doc-001 | PMSC 10-K 2024 | SEC Filing | 285 | Primary Source | securities-researcher |
| doc-002 | FMC License | Regulatory | 12 | Primary Source | regulatory-rulemaking-analyst |
| doc-003 | ILWU CBA | Contract | 187 | Primary Source | employment-labor-analyst |

**Document Access:**
- Extracted text: `${REPORTS_DIR}/[session]/documents/[doc-id]-extracted.txt`
- Per-document analysis: `${REPORTS_DIR}/[session]/documents/[doc-id]-analysis.json`
- Full analysis summary: `${REPORTS_DIR}/[session]/documents/document-analysis-summary.json`

---

## CRITICAL ISSUES CHECKLIST (Pre-Identified from Documents)

| # | Issue | Source | Severity | Specialist | Status |
|---|-------|--------|----------|------------|--------|
| CI-001 | Jones Act compliance gap for COSCO CTVs | doc-001, p.71 | CRITICAL | regulatory-rulemaking-analyst | PENDING |
| CI-002 | ILWU contract expires 5 months post-closing | doc-003, p.1 | HIGH | employment-labor-analyst | PENDING |
| CI-003 | Martinez v. PMSC trial Q3 2025 | doc-001, p.52 | HIGH | case-law-analyst | PENDING |

---

## SPECIALIST ASSIGNMENTS

### securities-researcher
**Priority:** CRITICAL
**Assigned Documents:** doc-001
**Focus Areas:** Item 103 litigation disclosure, Item 1A risk factors, MD&A analysis
**Specific Pages:** 45-78, 112-145
**Critical Issues to Address:** CI-001 (verify disclosure adequacy)

### employment-labor-analyst
**Priority:** HIGH
**Assigned Documents:** doc-001, doc-003
**Focus Areas:** CBA terms analysis, strike probability, wage escalation modeling
**Specific Pages:** doc-001: 67-72, doc-003: 1-85
**Critical Issues to Address:** CI-002

### regulatory-rulemaking-analyst
**Priority:** HIGH
**Assigned Documents:** doc-001, doc-002
**Focus Areas:** FMC license status, Jones Act compliance, permit renewals
**Specific Pages:** doc-001: 34-38, 71, doc-002: all
**Critical Issues to Address:** CI-001

---

## CROSS-DOCUMENT VERIFICATION EXPECTATIONS

| Finding | Documents | Expected Consistency |
|---------|-----------|---------------------|
| ILWU contract terms | doc-001, doc-003 | 10-K disclosure should match CBA terms |
| FMC license number | doc-001, doc-002 | License document should match 10-K reference |
| Vessel count | doc-001, doc-002 | Fleet size should be consistent |
```

---

## Benefits Summary

| Benefit | Implementation Detail |
|---------|----------------------|
| **Intelligent Analysis** | Orchestrator receives structured findings, not raw files |
| **Pre-Populated Issues** | Critical issues identified before specialists start |
| **Targeted Assignments** | Specialists get specific page references |
| **Cross-Reference Setup** | Document relationships inform verification expectations |
| **Context Efficiency** | Subagent processes in isolation; returns concise JSON |
| **Audit Trail** | All analysis persisted to session directory |
| **Architecture Fit** | Follows existing subagent delegation pattern |

---

## Implementation Checklist

### Phase 1: Session Initialization (API Layer)
- [ ] Create `src/utils/sessionInitializer.js` utility module
  - [ ] `initializeSession()` - Creates directory structure
  - [ ] `generateSessionId()` - Generates YYYY-MM-DD-unix format
  - [ ] `parseDocumentsFromRequest()` - Handles base64/multipart uploads
  - [ ] `sessionHasDocuments()` - Check helper
  - [ ] `getSessionInfo()` - Read session manifest
  - [ ] `archiveDocument()` - Copy to initial-query-docs
  - [ ] `formatOriginalQuery()` - Format query.md with headers
- [ ] Update `/api/research` endpoint in `claude-sdk-server.js` (line 451)
  - [ ] Add multer import after existing imports (line ~20)
  - [ ] Add `upload.array('documents', 10)` middleware to route
  - [ ] Add session initialization logic before rate limiter
- [ ] Create `/initial-query-docs/` archive with original submissions
- [ ] Create `/documents/` working directory with copies
- [ ] Write manifest files:
  - [ ] `initial-query-docs/submission-metadata.json`
  - [ ] `session-manifest.json`
  - [ ] `documents/metadata.json`

### Phase 2: Document Processing Subagent
- [ ] Add `document-processing-analyst` to `legalSubagents.js` at line 2191
  - [ ] Insert new section: `// DOCUMENT PROCESSING (P0 - Pre-Research)`
  - [ ] Use INTERNAL ANALYSIS pattern: `tools: STANDARD_TOOLS.withWrite` (explicit, NOT commented)
  - [ ] Include `model: 'sonnet'` and `thinking: { type: 'disabled' }`
  - [ ] Include execution metadata: `executionPhase`, `parallelGroup`, `outputFiles`, etc.
  - [ ] Include `${REPORT_SAVING_INSTRUCTIONS}` in prompt
  - [ ] Include Provenance Requirements section
  - [ ] Include QA OUTPUT STANDARDS section
- [ ] Add `P0_DOCUMENT_PROCESSING` to `PARALLEL_EXECUTION_GROUPS` at line 15011
- [ ] Subagent functionality:
  - [ ] Full text extraction (PDF via Read tool, DOCX, TXT)
  - [ ] Metadata extraction (file properties, embedded metadata)
  - [ ] Content analysis (entities, dates, amounts, risks)
  - [ ] Specialist domain mapping
  - [ ] Cross-document relationship detection
  - [ ] Critical issue pre-identification

### Phase 3: SDK Hooks Updates (`sdkHooks.js`)
- [ ] Add `document-processing-analyst-state.json` to `stateFilePaths` array (lines 1049-1053)
- [ ] Add `DOCUMENT_ARTIFACTS` constant after `MAX_FILE_BYTES` (line 26)
- [ ] Add `isDocumentArtifact()` helper function (line 28)

### Phase 4: Memorandum-Synthesis Prompt Updates
- [ ] Update `roles.md` (line 3) - Insert document-processing-analyst role before Section Writer
- [ ] Update `completion.md` (line 47) - Insert P0 completion criteria after `---` divider
- [ ] Update `waves-execution.md`:
  - [ ] (line 29) - Add P0 pattern to Task ID Format table
  - [ ] (line 33) - Insert P0 wave section before Wave 1
- [ ] Update `state-file-schemas.md` (line 1571) - Insert Section 9 before ending note
- [ ] Update `assembly-protocol.md` - Add document integration for fact-registry

### Phase 5: Orchestrator Integration
- [ ] Update orchestrator system prompt with document workflow
- [ ] Add session manifest reading logic
- [ ] Add document-processing-analyst invocation logic (P0 phase)
- [ ] Update research-plan.md template with:
  - [ ] ORIGINAL SUBMISSION section
  - [ ] UPLOADED DOCUMENTS section
  - [ ] Pre-populated CRITICAL ISSUES CHECKLIST
  - [ ] Document-aware SPECIALIST ASSIGNMENTS

### Phase 6: Specialist Updates
- [ ] Add document research protocol to specialist prompts
- [ ] Add document citation format: `[SOURCE: Uploaded doc-XXX, p.Y]`
- [ ] Add document access instructions referencing `/documents/`
- [ ] Update Executive Summary requirements for document findings
- [ ] Update fact-registry schema for document-sourced findings

### Phase 7: Testing & Validation
- [ ] Unit tests:
  - [ ] sessionInitializer.js functions
  - [ ] Document directory creation
  - [ ] Manifest file generation
- [ ] Integration tests:
  - [ ] Test with Example-prompt.md + sample documents
  - [ ] Test query-only submissions (backward compatibility)
  - [ ] Test large document handling (>100 pages)
  - [ ] Test multiple document types (PDF, DOCX, mixed)
- [ ] End-to-end tests:
  - [ ] Validate archive integrity after processing
  - [ ] Validate specialist access to extracted text
  - [ ] Validate session resume with pending documents
  - [ ] Validate P0 failure graceful degradation

---

## Backward Compatibility

This implementation maintains full backward compatibility:

| Scenario | Behavior |
|----------|----------|
| **Query only (no documents)** | Creates `/initial-query-docs/query.md` only; `/documents/` remains empty; orchestrator skips document-processing-analyst |
| **Existing sessions without `/initial-query-docs/`** | Orchestrator checks `session-manifest.json` or falls back to checking `/documents/metadata.json` directly |
| **Session resumption** | Archive is read-only; resumption uses `/documents/` state and existing specialist reports |
| **Specialists without document awareness** | Continue to work normally; document instructions are additive |

### Migration Path

For existing sessions created before this feature:
1. Session manifest may not exist - fall back to directory inspection
2. `/initial-query-docs/` may not exist - this is acceptable
3. `/documents/` behavior unchanged - subagent reads from here
4. Specialists continue to use standard workflow

---

## SDK Hooks Integration Points

**File:** `src/hooks/sdkHooks.js`

### 1. Add Document State to State File Paths (Line 1049-1053)

**BEFORE (lines 1049-1053):**
```javascript
        const stateFilePaths = [
          join(sessionDir, 'synthesis-state.json'),
          join(sessionDir, 'orchestrator-state.json'),
          join(sessionDir, 'qa-outputs', 'remediation-wave-state.json')  // Hybrid workflow state tracking
        ];
```

**AFTER (lines 1049-1054):**
```javascript
        const stateFilePaths = [
          join(sessionDir, 'synthesis-state.json'),
          join(sessionDir, 'orchestrator-state.json'),
          join(sessionDir, 'qa-outputs', 'remediation-wave-state.json'),  // Hybrid workflow state tracking
          join(sessionDir, 'document-processing-analyst-state.json')      // Document processing state (P0)
        ];
```

### 2. Add Document Artifact Constants (Line 26)

**BEFORE (line 26):**
```javascript
const MAX_FILE_BYTES = 100000; // 100KB - conservative threshold
```

**AFTER (lines 26-30):**
```javascript
const MAX_FILE_BYTES = 100000; // 100KB - conservative threshold

// Document processing artifact suffixes (for large file handling)
const DOCUMENT_ARTIFACTS = ['-extracted.txt', '-analysis.json'];
const isDocumentArtifact = (filepath) => DOCUMENT_ARTIFACTS.some(suffix => filepath.endsWith(suffix));
```

---

## Server Integration Points

**File:** `src/server/claude-sdk-server.js`

### 1. Add Multer Import (Line 1, after existing imports)

**ADD after line ~20 (import section):**
```javascript
import multer from 'multer';
import { initializeSession } from '../utils/sessionInitializer.js';

// Multer configuration for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});
```

### 2. Keep JSON Middleware, Add Multipart Route (Line 98)

**KEEP (line 98) - no change needed:**
```javascript
app.use(express.json({ limit: '50mb' }));
```

### 3. Update /api/research Endpoint (Lines 451-456)

**BEFORE (lines 451-456):**
```javascript
app.post('/api/research', async (req, res) => {
  const span = startRequestSpan('api.research', { path: '/api/research', model: MODEL });
  res.locals.model = MODEL;

  try {
    globalRateLimiter.acquire(Math.ceil(JSON.stringify(req.body || {}).length / 4));
```

**AFTER (lines 451-470):**
```javascript
app.post('/api/research', upload.array('documents', 10), async (req, res) => {
  const span = startRequestSpan('api.research', { path: '/api/research', model: MODEL });
  res.locals.model = MODEL;

  // Initialize session with documents if present
  const documents = req.files || [];
  let sessionInfo = null;
  if (documents.length > 0) {
    sessionInfo = await initializeSession(req.body.query, documents);
    // Inject session context into request
    req.body.sessionDir = sessionInfo.sessionDir;
    req.body.hasDocuments = true;
  }

  try {
    globalRateLimiter.acquire(Math.ceil(JSON.stringify(req.body || {}).length / 4));
```

### 2. Session Initializer Utility

Create `src/utils/sessionInitializer.js`:

```javascript
export async function initializeSession(query, documents = []) {
  const sessionId = generateSessionId();
  const sessionDir = path.join(REPORTS_DIR, sessionId);

  // Create directory structure
  fs.mkdirSync(path.join(sessionDir, 'initial-query-docs'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'documents'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'specialist-reports'), { recursive: true });

  // Archive original query
  fs.writeFileSync(
    path.join(sessionDir, 'initial-query-docs', 'query.md'),
    formatOriginalQuery(query, sessionId)
  );

  // Archive and copy documents
  for (const doc of documents) {
    await archiveDocument(sessionDir, doc);
  }

  // Write manifests
  await writeSubmissionMetadata(sessionDir, query, documents);
  await writeSessionManifest(sessionDir, query, documents);

  return { sessionId, sessionDir, has_documents: documents.length > 0 };
}
```

---

## Related Documentation

- `/src/config/legalSubagents.js` - Subagent definitions
- `/src/server/claude-sdk-server.js` - API server
- `/src/hooks/sdkHooks.js` - SDK hook handlers
- `/prompts/memorandum-synthesis/` - Workflow prompts
- `/docs/split-memorandum.md` - Prompt architecture
- Claude Agent SDK Documentation: https://platform.claude.com/docs/en/agent-sdk/

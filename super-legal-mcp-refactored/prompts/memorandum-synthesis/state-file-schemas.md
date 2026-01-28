# STATE FILE SCHEMAS REFERENCE (v1.0)

> **Sync Note:** This document centralizes state file schemas from `src/config/legalSubagents.js`.
> When schemas are updated in legalSubagents.js, this document should be updated to match.

---

## Table of Contents

1. [Common Fields (All State Files)](#1-common-fields-all-state-files)
2. [Validation Agents](#2-validation-agents)
   - 2.1 [research-review-state.json](#21-research-review-statejson)
   - 2.2 [fact-validator-state.json](#22-fact-validator-statejson)
   - 2.3 [coverage-gap-analyzer-state.json](#23-coverage-gap-analyzer-statejson)
   - 2.4 [risk-aggregator-state.json](#24-risk-aggregator-statejson)
3. [Generation Agents](#3-generation-agents)
   - 3.1 [section-writer-state-IV-{X}.json](#31-section-writer-state-iv-xjson)
   - 3.2 [executive-summary-state.json](#32-executive-summary-statejson)
   - 3.3 [citation-validator-state.json](#33-citation-validator-statejson)
4. [Assembly Agents](#4-assembly-agents)
   - 4.1 [assembly-state.json](#41-assembly-statejson)
   - 4.2 [synthesis-state.json](#42-synthesis-statejson)
5. [QA Agents](#5-qa-agents)
   - 5.1 [qa-diagnostic-state.json](#51-qa-diagnostic-statejson)
6. [State File Location Index](#6-state-file-location-index)
7. [Recovery Protocol Quick Reference](#7-recovery-protocol-quick-reference)

---

## 1. Common Fields (All State Files)

All state files MUST include these mandatory fields for compaction recovery:

| Field | Type | Purpose |
|-------|------|---------|
| `schema_version` / `*_version` | string | Compatibility marker (e.g., "3.0", "2.2") |
| `agent` / `agent_type` | string | Agent identifier |
| `session_id` / `session_directory` | string | Session directory path |
| `status` | enum | `initialized`, `in_progress`, `complete`, `blocked` |
| `started_at` | ISO timestamp | When agent started |
| `last_updated` / `last_checkpoint` | ISO timestamp | Last state file update |
| `compaction_summary` | object | **MANDATORY** - Instant context restoration |
| `recovery_instructions` | object | **MANDATORY** - What to skip on resume |

### compaction_summary Structure (MANDATORY)

```json
{
  "compaction_summary": {
    "task": "[description from orchestrator]",
    "progress": "[X/N items, Y% complete]",
    "next_action": "[immediate next step]",
    "critical_context": ["[key fact 1]", "[key fact 2]"]
  }
}
```

### environment_checks Structure (MANDATORY for complex agents)

```json
{
  "environment_checks": {
    "on_resume": [
      "Read state file",
      "Verify output files exist for items_complete",
      "Check file sizes are reasonable",
      "Validate no truncation markers"
    ],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  }
}
```

### blocking_issue Structure (when applicable)

```json
{
  "blocking_issue": {
    "type": "FILE_SIZE_LIMIT | TOOL_ERROR | MISSING_INPUT",
    "description": "[details]",
    "resolution_status": "UNRESOLVED | RESOLVED",
    "resolution_method": "[how to fix]"
  }
}
```

### recovery_instructions Structure (MANDATORY)

```json
{
  "recovery_instructions": {
    "on_compaction": "[instruction for context recovery]",
    "do_not_repeat": ["[item1]", "[item2]"]
  }
}
```

---

## 2. Validation Agents

### 2.1 research-review-state.json

**Location:** `{session_directory}/research-review-state.json`

**Agent:** research-review-analyst

**Internal Phases:** PHASE_0 through PHASE_10 (11 phases)
- PHASE_0_PREREQUISITE
- PHASE_1_REPORT_INVENTORY
- PHASE_2_COMPLETENESS_REVIEW
- PHASE_2.5_OBJECTIVITY
- PHASE_3_HIGH_SEVERITY
- PHASE_4_FINANCIAL_AGGREGATION
- PHASE_5_SECTION_COVERAGE
- PHASE_6_CROSS_REFERENCES
- PHASE_7_DEAL_BLOCKING
- PHASE_8_STATE_UPDATE
- PHASE_9_PLAN_UPDATE
- PHASE_10_RETURN

```json
{
  "review_version": "2.1",
  "agent": "research-review-analyst",
  "session_directory": "{session_directory}",
  "started_at": "[ISO timestamp]",
  "last_updated": "[ISO timestamp]",
  "current_phase": "PHASE_3_HIGH_SEVERITY",

  "compaction_summary": {
    "task": "Review specialist reports and prepare synthesis handoff",
    "progress": "Phase 3, scanned 12/17 reports for HIGH findings",
    "next_action": "Continue HIGH severity extraction from report 13",
    "critical_context": ["17 reports total", "8 HIGH findings so far", "No deal blockers yet"]
  },

  "recovery_instructions": {
    "on_compaction": "Read research-review-state.json FIRST. Resume from current_phase.",
    "do_not_repeat": ["PHASE_0", "PHASE_1", "PHASE_2", "PHASE_2.5"],
    "do_not_rescan_reports": ["securities-researcher-report.md", "corporate-structure-report.md"]
  },

  "phases": {
    "PHASE_0_PREREQUISITE": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "deal_metadata_valid": true
    },
    "PHASE_1_REPORT_INVENTORY": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "reports_found": 17,
      "reports_list": ["securities-researcher-report.md", "..."]
    },
    "PHASE_2_COMPLETENESS_REVIEW": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "reports_reviewed": 17,
      "reports_passing": 15,
      "reports_failing": ["report-x.md", "report-y.md"]
    },
    "PHASE_2.5_OBJECTIVITY": {
      "status": "complete",
      "objectivity_score": 87
    },
    "PHASE_3_HIGH_SEVERITY": {
      "status": "in_progress",
      "reports_scanned": 12,
      "reports_remaining": 5,
      "high_findings_extracted": 8
    },
    "PHASE_4_FINANCIAL_AGGREGATION": { "status": "pending" },
    "PHASE_5_SECTION_COVERAGE": { "status": "pending" },
    "PHASE_6_CROSS_REFERENCES": { "status": "pending" },
    "PHASE_7_DEAL_BLOCKING": { "status": "pending" },
    "PHASE_8_STATE_UPDATE": { "status": "pending" },
    "PHASE_9_PLAN_UPDATE": { "status": "pending" },
    "PHASE_10_RETURN": { "status": "pending" }
  },
  "metrics": {
    "high_findings_count": 8,
    "total_exposure_gross": 145000000,
    "total_exposure_weighted": 89000000,
    "deal_blockers_found": 0
  },
  "errors": []
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 0 complete | Write initial state with deal metadata validation |
| Phase 1 complete | Update with report inventory |
| Phase 2 complete | Update with completeness review results |
| Phase 2.5 complete | Update with objectivity scores |
| Every 5 HIGH findings extracted | Update Phase 3 progress |
| Phase 4 complete | Update with financial aggregation |
| Phase 5 complete | Update with coverage matrix |
| Phase 6 complete | Update with cross-references |
| Phase 7 complete | Update with deal-blocking assessment |
| Phases 8-10 | Final updates |
| Any error | Add to errors array with timestamp |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Identify What NOT to Repeat** - Check `recovery_instructions.do_not_repeat` and `do_not_rescan_reports`
3. **Resume from Correct Position** - Use `compaction_summary.next_action`
4. **Skip completed phases** - Check `phases[X].status`
5. **Verify** - Cross-check with orchestrator-state.md

---

### 2.2 fact-validator-state.json

**Location:** `{session_directory}/review-outputs/fact-validator-state.json`

**Agent:** fact-validator

**Internal Phases:** phase_1 through phase_6
- phase_1_input_loading
- phase_2_fact_enrichment
- phase_3_conflict_detection
- phase_4_section_mapping
- phase_5_output_files
- phase_6_return_status

```json
{
  "agent": "fact-validator",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Validate facts and detect conflicts across specialist reports",
    "progress": "Phase 3, scanning for conflicts",
    "next_action": "Continue conflict detection from category: name_variations",
    "critical_context": ["127 facts extracted", "3 conflicts found so far"]
  },

  "phases_complete": {
    "phase_1_input_loading": true,
    "phase_2_fact_enrichment": true,
    "phase_3_conflict_detection": false,
    "phase_4_section_mapping": false,
    "phase_5_output_files": false,
    "phase_6_return_status": false
  },

  "categories_processed": {
    "key_dates": { "status": "complete", "facts_count": 23 },
    "quantitative_facts": { "status": "complete", "facts_count": 45 },
    "liability_exposures": { "status": "complete", "facts_count": 31 },
    "entity_names": { "status": "complete", "facts_count": 18 },
    "assumption_status": { "status": "complete", "facts_count": 10 }
  },

  "conflicts_detected": [
    { "category": "key_dates", "fact": "Closing date", "conflict": "2026-03-15 vs 2026-04-01", "severity": "MAJOR" },
    { "category": "quantitative_facts", "fact": "Employee count", "conflict": "1,247 vs 1,312", "severity": "MINOR" }
  ],

  "recovery_instructions": {
    "on_compaction": "Read fact-validator-state.json FIRST. Resume from current incomplete phase.",
    "do_not_repeat": ["phase_1", "phase_2", "key_dates", "quantitative_facts", "liability_exposures"],
    "do_not_reextract_categories": ["key_dates", "quantitative_facts", "liability_exposures", "entity_names", "assumption_status"]
  },

  "metrics": {
    "facts_total": 127,
    "facts_processed": 127,
    "conflicts_found": 2,
    "sections_mapped": 0,
    "last_checkpoint": "2026-01-18T10:45:00Z"
  }
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (input loaded) | Write initial state with fact counts |
| After EACH category enriched (Phase 2) | Update categories_processed, do_not_repeat |
| After EACH conflict found (Phase 3) | Add to conflicts_detected array |
| Phase 4 complete (sections mapped) | Update with section mapping |
| Before return | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `phases_complete`** - Skip phases marked true
3. **Check `categories_processed`** - Skip categories with status "complete"
4. **Use `compaction_summary.next_action`** for immediate guidance
5. **DO NOT re-extract** categories in `do_not_reextract_categories`

---

### 2.3 coverage-gap-analyzer-state.json

**Location:** `{session_directory}/review-outputs/coverage-gap-analyzer-state.json`

**Agent:** coverage-gap-analyzer

**Internal Phases:** phase_1 through phase_7
- phase_1_plan_extraction
- phase_2_execution_inventory
- phase_3_alignment_check
- phase_4_conflict_detection
- phase_5_gap_generation
- phase_6_output_files
- phase_7_return_status

```json
{
  "agent": "coverage-gap-analyzer",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Verify research coverage and detect inter-specialist conflicts",
    "progress": "Phase 3, checking critical issue 8/15",
    "next_action": "Continue critical issues verification from issue 9",
    "critical_context": ["15 specialist assignments planned", "12 reports executed", "2 conflicts found"]
  },

  "phases_complete": {
    "phase_1_plan_extraction": true,
    "phase_2_execution_inventory": true,
    "phase_3_alignment_check": false,
    "phase_4_conflict_detection": false,
    "phase_5_gap_generation": false,
    "phase_6_output_files": false,
    "phase_7_return_status": false
  },

  "critical_issues_checked": {
    "issue_1": { "status": "verified", "specialist": "securities-researcher" },
    "issue_2": { "status": "verified", "specialist": "employment-labor-analyst" },
    "issue_3": { "status": "gap", "missing_specialist": "cfius-national-security-analyst" }
  },

  "conflicts_detected": [
    { "type": "regulatory_timing", "specialists": ["securities-researcher", "regulatory-rulemaking-analyst"], "severity": "HIGH" }
  ],

  "recovery_instructions": {
    "on_compaction": "Read coverage-gap-analyzer-state.json FIRST. Resume from current incomplete phase.",
    "do_not_repeat": ["phase_1", "phase_2", "issue_1", "issue_2"],
    "do_not_reverify_issues": ["issue_1", "issue_2"]
  },

  "metrics": {
    "critical_issues_total": 15,
    "critical_issues_checked": 8,
    "gaps_found": 3,
    "conflicts_found": 2,
    "last_checkpoint": "2026-01-18T11:30:00Z"
  }
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (plan extracted) | Write initial state with critical issues count |
| Phase 2 complete (inventory done) | Update with execution counts |
| After EACH critical issue checked (Phase 3) | Update critical_issues_checked, do_not_repeat |
| After EACH conflict detected (Phase 4) | Add to conflicts_detected array |
| Phase 5 complete (gaps generated) | Update with gaps list |
| Before return | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `phases_complete`** - Skip phases marked true
3. **Check `critical_issues_checked`** - Skip issues already verified
4. **Use `compaction_summary.next_action`** for immediate guidance
5. **DO NOT re-verify** issues in `do_not_reverify_issues`

---

### 2.4 risk-aggregator-state.json

**Location:** `{session_directory}/review-outputs/risk-aggregator-state.json`

**Agent:** risk-aggregator

**Internal Phases:** phase_1 through phase_8
- phase_1_input_loading
- phase_2_time_classification
- phase_3_category_aggregation
- phase_4_probability_weighting
- phase_5_correlation_adjustment
- phase_6_recommendations
- phase_7_output_files
- phase_8_return_status

```json
{
  "agent": "risk-aggregator",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Aggregate and classify quantified risk exposures",
    "progress": "Phase 4, weighting exposure 23/45",
    "next_action": "Continue probability weighting from exposure 24",
    "critical_context": ["45 exposures total", "$127M gross", "$78M weighted so far"]
  },

  "phases_complete": {
    "phase_1_input_loading": true,
    "phase_2_time_classification": true,
    "phase_3_category_aggregation": true,
    "phase_4_probability_weighting": false,
    "phase_5_correlation_adjustment": false,
    "phase_6_recommendations": false,
    "phase_7_output_files": false,
    "phase_8_return_status": false
  },

  "exposures_classified": {
    "exposure_1": { "status": "complete", "type": "ONE_TIME", "category": "regulatory_penalties", "amount": 12000000 },
    "exposure_2": { "status": "complete", "type": "PERPETUAL", "category": "litigation_exposure", "amount": 8500000 }
  },

  "aggregations_in_progress": {
    "regulatory_penalties": { "gross": 45000000, "weighted": 28000000 },
    "litigation_exposure": { "gross": 32000000, "weighted": 18000000 },
    "deal_adjustments": { "gross": 25000000, "weighted": 15000000 },
    "remediation_costs": { "gross": 15000000, "weighted": 9000000 }
  },

  "recovery_instructions": {
    "on_compaction": "Read risk-aggregator-state.json FIRST. Resume from current incomplete phase.",
    "do_not_repeat": ["phase_1", "phase_2", "phase_3", "exposure_1", "exposure_2"],
    "do_not_reclassify_exposures": ["exposure_1", "exposure_2"]
  },

  "metrics": {
    "exposures_total": 45,
    "exposures_classified": 45,
    "exposures_weighted": 23,
    "gross_total": 127000000,
    "probability_weighted_so_far": 78000000,
    "last_checkpoint": "2026-01-18T11:45:00Z"
  }
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (input loaded) | Write initial state with exposures count |
| Phase 2 complete (time classified) | Update with classification results |
| Phase 3 complete (categories aggregated) | Update with aggregations_in_progress |
| After EACH exposure weighted (Phase 4) | Update exposures_weighted, do_not_repeat |
| Phase 5 complete (correlations applied) | Update with correlation adjustments |
| Phase 6 complete (recommendations) | Update with holdback recommendations |
| Before return | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `phases_complete`** - Skip phases marked true
3. **Check `exposures_classified`** - Skip exposures already classified
4. **Use `aggregations_in_progress`** - Don't recalculate completed categories
5. **DO NOT re-classify** exposures in `do_not_reclassify_exposures`

---

## 3. Generation Agents

### 3.1 section-writer-state-IV-{X}.json

**Location:** `{session_directory}/section-writer-state-IV-{section_id}.json`

**Naming Convention:**
- section_id = LETTER ONLY (A, B, C, D, E, F, G, H, I, J)
- File name = `section-writer-state-IV-{section_id}.json`
- Example: section_id="A" -> `section-writer-state-IV-A.json`
- ALWAYS use HYPHEN (IV-A), NEVER use DOT (IV.A) in filenames

**Agent:** memo-section-writer

**Internal Phases:** phase_1 through phase_6 + subsections A-F
- phase_1_inputs
- phase_2_validation
- phase_3_structure
- phase_4_analysis (with subsections A-F)
- phase_5_quality
- phase_6_finalize

```json
{
  "agent": "memo-section-writer",
  "section_id": "A",
  "section_name": "Corporate Structure Analysis",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Write section IV-A (Corporate Structure) from specialist reports",
    "progress": "Phase 4, subsection C complete",
    "next_action": "Write subsection D: Cross-Domain Implications",
    "critical_context": ["section_id=A", "3 HIGH findings identified", "Using fact-registry values"]
  },

  "phases_complete": {
    "phase_1_inputs": true,
    "phase_2_validation": true,
    "phase_3_structure": true,
    "phase_4_analysis": false,
    "phase_5_quality": false,
    "phase_6_finalize": false
  },

  "subsections_status": {
    "A_legal_framework": "complete",
    "B_application": "complete",
    "C_risk_assessment": "complete",
    "D_cross_domain": "pending",
    "E_recommendations": "pending",
    "F_footnotes": "pending"
  },

  "recovery_instructions": {
    "on_compaction": "Read section-writer-state-IV-{section_id}.json FIRST (e.g., section-writer-state-IV-A.json). Resume from first 'pending' subsection.",
    "do_not_repeat": ["A_legal_framework", "B_application", "C_risk_assessment"],
    "do_not_reread_reports": ["securities-analysis-report.md", "corporate-structure-report.md"]
  },

  "metrics": {
    "word_count": 2847,
    "findings_written": "2/3",
    "footnotes_count": 12,
    "last_checkpoint": "2026-01-18T10:30:00Z"
  },

  "input_files_read": [
    "specialist-reports/securities-analysis-report.md",
    "specialist-reports/corporate-structure-report.md",
    "review-outputs/fact-registry.md"
  ]
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (inputs loaded) | Write initial state with input_files_read |
| Phase 3 complete (structure created) | Update with output file path |
| After EACH subsection (A-F) | Update subsections_status, do_not_repeat, metrics |
| Every 1,000 words written | Checkpoint save with word_count |
| Phase 5 complete (quality checks) | Update with quality verification |
| Before return | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `phases_complete`** - Skip completed phases
3. **Check `subsections_status`** - Skip completed subsections (A-F)
4. **Use `compaction_summary.next_action`** for immediate guidance
5. **Append** to existing section file (don't overwrite)

---

### 3.2 executive-summary-state.json

**Location:** `{session_directory}/executive-summary-state.json`

**Agent:** memo-executive-summary-writer

**Internal Phases:** phase_1 through phase_6
- phase_1_input_loading
- phase_2_section_synthesis
- phase_3_aggregate_calculations
- phase_4_document_structure
- phase_5_quality_check
- phase_6_output

```json
{
  "agent": "memo-executive-summary-writer",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Synthesize executive summary from section reports",
    "progress": "Phase 2, read 6/10 sections",
    "next_action": "Read Section IV.G and extract key findings",
    "critical_context": ["Deal viability warning NOT required", "Gross exposure ~$47M"]
  },

  "phases_complete": {
    "phase_1_input_loading": true,
    "phase_2_section_synthesis": false,
    "phase_3_aggregate_calculations": false,
    "phase_4_document_structure": false,
    "phase_5_quality_check": false,
    "phase_6_output": false
  },

  "sections_read": {
    "IV-A": { "status": "complete", "key_finding": "Entity consolidation required" },
    "IV-B": { "status": "complete", "key_finding": "Wage claims exposure $12M" },
    "IV-C": { "status": "complete", "key_finding": "Clean environmental record" },
    "IV-D": { "status": "complete", "key_finding": "IP assignments incomplete" },
    "IV-E": { "status": "complete", "key_finding": "Regulatory approval needed" },
    "IV-F": { "status": "complete", "key_finding": "Tax loss carryforwards at risk" },
    "IV-G": { "status": "pending", "key_finding": null },
    "IV-H": { "status": "pending", "key_finding": null },
    "IV-I": { "status": "pending", "key_finding": null },
    "IV-J": { "status": "pending", "key_finding": null }
  },

  "recovery_instructions": {
    "on_compaction": "Read executive-summary-state.json FIRST. Resume from first section with status 'pending'.",
    "do_not_repeat": ["IV-A", "IV-B", "IV-C", "IV-D", "IV-E", "IV-F"],
    "do_not_recalculate": ["gross_exposure_preliminary"]
  },

  "metrics": {
    "sections_total": 10,
    "sections_read": 6,
    "word_count": 1250,
    "last_checkpoint": "2026-01-18T11:00:00Z"
  },

  "aggregations_in_progress": {
    "gross_exposure_preliminary": "$35M",
    "probability_weighted_preliminary": "$18M"
  }
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (inputs loaded) | Write initial state with section inventory |
| After EACH section read (Phase 2) | Update sections_read, do_not_repeat, key_finding |
| Phase 3 complete (calculations) | Update with aggregations |
| After EACH document section (Phase 4) | Update progress |
| Before return | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `sections_read`** - Skip sections with status "complete"
3. **Use `key_finding`** from completed sections (don't re-extract)
4. **Use `aggregations_in_progress`** - Don't recalculate preliminary totals
5. **Resume** from first section with status "pending"

---

### 3.3 citation-validator-state.json

**Location:** `{session_directory}/citation-validator-state.json`

**Agent:** citation-validator

**Internal Phases:** PHASE_1 through PHASE_6
- PHASE_1_DISCOVERY
- PHASE_2_FOOTNOTE_EXTRACTION
- PHASE_3_GLOBAL_RENUMBERING
- PHASE_4_VALIDATION_CHECKS
- PHASE_5_OUTPUT_FILES
- PHASE_6_RETURN_STATUS

```json
{
  "validator_version": "1.0",
  "session_directory": "{session_directory}",
  "started_at": "[ISO timestamp]",
  "last_updated": "[ISO timestamp]",
  "current_phase": "PHASE_2_FOOTNOTE_EXTRACTION",
  "last_completed_step": "2.C",

  "compaction_summary": {
    "task": "Validate and consolidate citations for [Matter Name] memorandum",
    "progress": "3/10 sections processed, 87 footnotes collected",
    "next_action": "Extract footnotes from Section IV.D",
    "critical_context": ["Section IV.A-IV.C complete", "0 placeholders found so far"]
  },

  "environment_checks": {
    "on_resume": [
      "Read citation-validator-state.json FIRST",
      "Verify sections in do_not_repeat are already processed",
      "Grep consolidated-footnotes.md for last footnote number",
      "Resume from current_phase, not from beginning"
    ],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  },

  "sections_status": {
    "section_IV_A": { "status": "complete", "footnotes_extracted": 35, "last_global_number": 35 },
    "section_IV_B": { "status": "complete", "footnotes_extracted": 28, "last_global_number": 63 },
    "section_IV_C": { "status": "complete", "footnotes_extracted": 24, "last_global_number": 87 },
    "section_IV_D": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_E": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_F": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_G": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_H": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_I": { "status": "pending", "footnotes_extracted": 0 },
    "section_IV_J": { "status": "pending", "footnotes_extracted": 0 }
  },

  "recovery_instructions": {
    "on_compaction": "Read citation-validator-state.json FIRST. Check sections_status. Resume from first 'pending' section.",
    "do_not_repeat": ["section_IV_A", "section_IV_B", "section_IV_C"],
    "do_not_repeat_footnotes": "1-87"
  },

  "phases": {
    "PHASE_1_DISCOVERY": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "sections_found": 10,
      "executive_summary_verified": true
    },
    "PHASE_2_FOOTNOTE_EXTRACTION": {
      "status": "in_progress",
      "sections_processed": 3,
      "sections_remaining": 7,
      "footnotes_collected": 87
    },
    "PHASE_3_GLOBAL_RENUMBERING": { "status": "pending" },
    "PHASE_4_VALIDATION_CHECKS": { "status": "pending" },
    "PHASE_5_OUTPUT_FILES": { "status": "pending" },
    "PHASE_6_RETURN_STATUS": { "status": "pending" }
  },

  "metrics": {
    "total_sections": 10,
    "sections_processed": 3,
    "footnotes_collected": 87,
    "placeholders_found": 0,
    "pincites_missing": 0,
    "verification_tags_missing": 0
  },

  "errors": []
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (discovery) | Write initial state with section inventory |
| After EACH section extraction (Phase 2) | Update sections_status, do_not_repeat, metrics |
| Every 50 footnotes collected | Checkpoint save with current progress |
| Phase 3 complete (renumbering) | Update with global number mapping |
| Phase 4 complete (validation) | Update with validation results |
| Phase 5 complete (output files) | Update with files_created |
| Any error encountered | Add to errors array with timestamp |
| Before returning to orchestrator | Final state with all metrics |

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Run `environment_checks.on_resume`** steps
3. **Check `sections_status`** - Resume from first "pending" section
4. **Use `metrics.footnotes_collected + 1`** as next global footnote number
5. **DO NOT re-process** sections in `do_not_repeat`

#### Footnote Renumbering - Atomic Operation (Race Condition Prevention)

Renumbering and state update MUST be atomic to prevent duplicate footnote numbers after recovery:

1. Write footnote to consolidated-footnotes.md
2. **IMMEDIATELY** update state file with new `last_global_number`
3. State file update MUST occur within same tool call as footnote write
4. **On recovery:** Verify `consolidated-footnotes.md` line count matches `metrics.footnotes_collected`
   - If mismatch: Use file line count as authoritative source
   - Recalculate `last_global_number` from actual file content

**Verification command:**
```bash
# Compare state vs actual
STATE_COUNT=$(grep -o '"footnotes_collected": [0-9]*' citation-validator-state.json | grep -o '[0-9]*')
FILE_COUNT=$(grep -c "^\[" consolidated-footnotes.md 2>/dev/null || echo "0")
[ "$STATE_COUNT" -eq "$FILE_COUNT" ] && echo "CONSISTENT" || echo "MISMATCH: state=$STATE_COUNT, file=$FILE_COUNT"
```

This prevents: Duplicate footnote numbers when compaction happens between file write and state update.

---

## 4. Assembly Agents

### 4.1 assembly-state.json

**Location:** `{session_directory}/assembly-state.json`

**Agent:** (internal assembly phase)

**Internal Phases:** 3-Phase Model
- PHASE_1_DISCOVERY
- PHASE_2_INITIALIZE
- PHASE_3_BASH_ASSEMBLY

```json
{
  "assembly_version": "3.0",
  "assembly_method": "bash-cat",
  "session_directory": "{session_directory}",
  "started_at": "[ISO timestamp]",
  "last_updated": "[ISO timestamp]",
  "current_phase": "PHASE_3_BASH_ASSEMBLY",
  "phases": {
    "PHASE_1_DISCOVERY": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "section_count": 13,
      "files_verified": ["research-plan.md", "executive-summary.md", "consolidated-footnotes.md"]
    },
    "PHASE_2_INITIALIZE": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "title_page_written": true,
      "toc_appended": true,
      "matter_name": "[extracted from research-plan.md]"
    },
    "PHASE_3_BASH_ASSEMBLY": {
      "status": "complete",
      "completed_at": "[ISO timestamp]",
      "bash_commands_executed": 5,
      "cat_exit_code": 0
    }
  },
  "metrics": {
    "line_count": 12500,
    "file_size_kb": 485,
    "sections_count": 13,
    "footnote_count": 287
  },
  "errors": []
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete | Write initial state with discovery results |
| Phase 2 complete | Update with title/TOC status |
| Phase 3 complete | Update with bash assembly metrics (or error) |
| Any error | Add to errors array with timestamp and details |

#### Recovery Protocol

1. **Read `assembly-state.json`**
2. **Check `current_phase` status**
3. **If PHASE_3 failed** - Re-run bash assembly from start (atomic operation)
4. **If PHASE_3 complete** - Verify final-memorandum.md exists and size matches

---

### 4.2 synthesis-state.json

**Location:** `{session_directory}/synthesis-state.json`

**Agent:** memo-final-synthesis

**Internal Phases:** PHASE_1 through PHASE_6
- PHASE_1_DISCOVERY
- PHASE_2_LOADING
- PHASE_3_VERIFICATION
- PHASE_4_ASSEMBLY
- PHASE_5_QUALITY
- PHASE_6_FINAL

```json
{
  "synthesis_version": "2.2",
  "session_directory": "{session_directory}",
  "started_at": "[ISO timestamp]",
  "last_updated": "[ISO timestamp]",
  "current_phase": "PHASE_4_ASSEMBLY",
  "last_completed_step": "4.7",

  "compaction_summary": {
    "task": "Synthesize M&A memorandum for [Target] acquisition",
    "progress": "38,500/70,000 words, 7/10 sections",
    "next_action": "Generate Section IV-H",
    "critical_context": ["Key finding 1 with $XM exposure", "Key finding 2"]
  },

  "environment_checks": {
    "on_resume": [
      "Read synthesis-state.json",
      "Verify final-memorandum.md exists",
      "Grep section count: ## IV\\.[A-M]",
      "Check for broken state before continuing"
    ],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  },

  "blocking_issue": {
    "type": "FILE_SIZE_LIMIT | TOOL_ERROR | MISSING_INPUT | null",
    "file": "final-memorandum.md",
    "size_bytes": 242285,
    "size_tokens_estimated": 60572,
    "sdk_limit_tokens": 25000,
    "description": "Agent SDK Read tool cannot load file before Edit operation due to 25k token limit",
    "resolution_status": "UNRESOLVED_BLOCKING | null",
    "resolution_method": "Must use Bash cat >> to append directly to final-memorandum.md - NO separate pending files",
    "sections_appended_via_bash": [],
    "verification_command": "wc -w final-memorandum.md && grep -c '## IV\\.' final-memorandum.md"
  },

  "input_files_verified": {
    "fact_registry": true,
    "risk_summary": true,
    "executive_summary": true,
    "consolidated_footnotes": true,
    "section_reports": 10,
    "missing_files": []
  },

  "verification_status": {
    "word_count_check": { "target": 55000, "actual": 38500, "passed": false },
    "placeholder_check": { "target": 0, "actual": 0, "passed": true },
    "cross_ref_check": { "target": 20, "actual": 15, "passed": false },
    "sections_check": { "target": 10, "actual": 7, "passed": false },
    "footnotes_check": { "target": 250, "actual": 312, "passed": true }
  },

  "decisions_made": [
    {"decision": "Appended Section IV-B directly to final-memorandum.md via Bash", "reason": "File exceeded 25K Read limit - verified wc increased from 45000 to 52000 words", "timestamp": "[ISO]"}
  ],

  "section_summary": {
    "IV-A_corporate_structure": {
      "aggregate_exposure": "$45M expected value ($65M gross)",
      "key_findings": [
        "Finding 1: Delaware subsidiary compliance gap - $12M exposure",
        "Finding 2: IP assignment chain incomplete - $33M at risk"
      ],
      "critical_recommendations": [
        "Complete IP assignment cure within 60 days (CRITICAL)",
        "Delaware subsidiary audit before closing"
      ],
      "cross_domain_impacts": [
        "Links to Section IV-C IP portfolio valuation",
        "Affects Section IV-F debt covenant calculations"
      ],
      "confidence": "HIGH (8/10)"
    }
  },

  "recovery_instructions": {
    "on_compaction": "Read this file first. Run environment_checks.on_resume. Use compaction_summary.next_action",
    "do_not_repeat": ["IV-A", "IV-B", "IV-C", "IV-D", "IV-E", "IV-F", "IV-G"]
  },

  "phases": {
    "PHASE_1_DISCOVERY": {
      "status": "complete",
      "section_count": 10,
      "specialist_count": 17,
      "files_verified": ["research-plan.md", "fact-registry.md", "risk-summary.json"]
    },
    "PHASE_2_LOADING": {
      "status": "complete",
      "sections_loaded": 10,
      "total_section_words": 48500,
      "footnote_count": 312
    },
    "PHASE_3_VERIFICATION": {
      "status": "complete",
      "missing_high_findings": 0,
      "fact_conflicts": 0
    },
    "PHASE_4_ASSEMBLY": {
      "status": "in_progress",
      "sections_appended": 7,
      "words_written": 38500,
      "cross_refs_written": 15
    },
    "PHASE_5_QUALITY": {
      "status": "pending"
    },
    "PHASE_6_FINAL": {
      "status": "pending"
    }
  },
  "metrics": {
    "word_count": 0,
    "line_count": 0,
    "sections_integrated": 0,
    "cross_references_written": 0,
    "placeholders_resolved": 0,
    "footnotes_included": 0,
    "output_token_limit": 64000,
    "read_tool_token_limit": 25000
  },
  "errors": []
}
```

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (discovery) | Write initial state with file inventory |
| Phase 2 complete (inputs loaded) | Update with input_files_verified |
| Phase 3 complete (verification) | Update with verification_status |
| After EACH section appended (Phase 4) | Update sections in do_not_repeat, metrics.sections_integrated |
| Every 10,000 words written | Checkpoint save with word_count |
| Phase 5 complete (quality check) | Update with verification_status results |
| Any blocking issue | Add to blocking_issue with workaround strategy |
| Any error | Add to errors array with timestamp |
| Before return | Final state with all metrics and COMPLETE status |

#### Recovery Protocol

1. **Read synthesis-state.json FIRST** (MANDATORY)
2. **Run `environment_checks.on_resume`** steps
3. **Check `blocking_issue`** for unresolved issues
4. **Use `compaction_summary.next_action`** for immediate guidance
5. **Append** to existing final-memorandum.md (do NOT overwrite)

---

## 5. QA Agents

### 5.1 qa-diagnostic-state.json

**Location:** `{session_directory}/qa-diagnostic-state.json`

**Agent:** memo-qa-diagnostic

**Internal Phases:** phase_1 through phase_6
- phase_1_prerequisite
- phase_2_dimension_scoring (12 dimensions: dim_0 through dim_11)
- phase_3_issue_cataloging
- phase_4_remediation_planning
- phase_5_output_files
- phase_6_return_status

```json
{
  "agent": "memo-qa-diagnostic",
  "status": "in_progress",

  "qa_cycle": {
    "current_cycle": 1,
    "max_cycles": 3,
    "cycle_history": [
      {
        "cycle": 1,
        "score": 82.4,
        "outcome": "REMEDIATE",
        "issues_before": 9,
        "issues_resolved": 0,
        "issues_remaining": 9,
        "timestamp": "[ISO]"
      }
    ]
  },

  "gate_attempts": {
    "A1_to_A2": { "attempts": 1, "max": 3, "last_failure_reason": null }
  },

  "certification_projection": {
    "probability": 85,
    "rationale": "All CRITICAL issues have clear remediation paths"
  },

  "compaction_summary": {
    "task": "Diagnostic assessment of final memorandum",
    "progress": "Phase 2, scored 7/12 dimensions",
    "next_action": "Score Dimension 7: Cross-Reference Architecture",
    "critical_context": ["Aggregate score 78% so far", "3 CRITICAL issues found"]
  },

  "phases_complete": {
    "phase_1_prerequisite": true,
    "phase_2_dimension_scoring": false,
    "phase_3_issue_cataloging": false,
    "phase_4_remediation_planning": false,
    "phase_5_output_files": false,
    "phase_6_return_status": false
  },

  "dimensions_scored": {
    "dim_0_questions_presented": { "status": "complete", "score": 85 },
    "dim_1_creac_structure": { "status": "complete", "score": 72 },
    "dim_2_objectivity": { "status": "complete", "score": 90 },
    "dim_3_brief_answer": { "status": "complete", "score": 80 },
    "dim_4_exec_summary": { "status": "complete", "score": 75 },
    "dim_5_citation_quality": { "status": "complete", "score": 68 },
    "dim_6_quantification": { "status": "complete", "score": 82 },
    "dim_7_cross_reference": { "status": "pending", "score": null },
    "dim_8_risk_tables": { "status": "pending", "score": null },
    "dim_9_draft_contracts": { "status": "pending", "score": null },
    "dim_10_formatting": { "status": "pending", "score": null },
    "dim_11_completeness": { "status": "pending", "score": null }
  },

  "recovery_instructions": {
    "on_compaction": "Read qa-diagnostic-state.json FIRST. Resume from first dimension with status 'pending'.",
    "do_not_repeat": ["dim_0", "dim_1", "dim_2", "dim_3", "dim_4", "dim_5", "dim_6"],
    "do_not_rescore": true
  },

  "issues_found": [
    { "dimension": 1, "severity": "CRITICAL", "description": "Missing CREAC in Section IV.B" },
    { "dimension": 5, "severity": "HIGH", "description": "12 citations missing pincites" },
    { "dimension": 6, "severity": "MEDIUM", "description": "DCF assumptions not disclosed" }
  ],

  "scoring_breakdown": {
    "dimension_contributions": {
      "dim_0": { "score": 4, "max": 5, "weight": 0.05, "deductions": [], "contribution": 4 },
      "dim_1": { "score": 8, "max": 10, "weight": 0.10, "deductions": [], "contribution": 8 },
      "dim_2": { "score": 7, "max": 8, "weight": 0.08, "deductions": ["-1% advocacy language"], "contribution": 7 },
      "dim_3": { "score": 5, "max": 5, "weight": 0.05, "deductions": [], "contribution": 5 },
      "dim_4": { "score": 5, "max": 7, "weight": 0.07, "deductions": ["-2% word count over target"], "contribution": 5 },
      "dim_5": { "score": 10, "max": 12, "weight": 0.12, "deductions": ["-2% pincites cap"], "contribution": 10 },
      "dim_6": { "score": 10, "max": 10, "weight": 0.10, "deductions": [], "contribution": 10 },
      "dim_7": { "score": 8, "max": 8, "weight": 0.08, "deductions": [], "contribution": 8 },
      "dim_8": { "score": 8, "max": 8, "weight": 0.08, "deductions": [], "contribution": 8 },
      "dim_9": { "score": 8, "max": 10, "weight": 0.10, "deductions": ["-2% missing provision"], "contribution": 8 },
      "dim_10": { "score": 7, "max": 7, "weight": 0.07, "deductions": [], "contribution": 7 },
      "dim_11": { "score": 10, "max": 10, "weight": 0.10, "deductions": [], "contribution": 10 }
    },
    "aggregate_calculation": {
      "base_score": 90,
      "quality_bonuses": [
        { "name": "exceptional_quantification", "amount": 5.0 },
        { "name": "citation_transparency", "amount": 3.0 }
      ],
      "red_flag_deductions": [],
      "final_score": 82.4
    }
  },

  "dimension_5_citation_detail": {
    "total_citations": 1423,
    "pincites": {
      "present": 251,
      "missing": 1172,
      "percentage": 17.6
    },
    "verification_tags": {
      "present": 1177,
      "missing": 246
    },
    "issue_type_caps_applied": {
      "missing_pincites": { "raw": -1172, "cap": -2, "applied": -2 },
      "missing_tags": { "raw": -123, "cap": -3, "applied": -1.23 },
      "missing_signals": { "raw": -50, "cap": -2, "applied": -0.25 }
    }
  },

  "dimension_1_creac_detail": {
    "header_count_detected": 37,
    "detection_method": "grep -cEi pattern",
    "scoring_threshold_applied": "35-49 → 8/10",
    "headers_by_type": {
      "conclusion": 12,
      "rule": 15,
      "explanation": 14,
      "application": 12,
      "counter_analysis": 18
    },
    "sections_with_complete_creac": ["IV.A", "IV.B", "IV.C"],
    "sections_missing_creac": ["IV.D", "IV.E"]
  },

  "dimension_4_exec_summary_detail": {
    "word_count_actual": 4200,
    "word_count_target": { "min": 2500, "max": 3500 },
    "deviation": 700,
    "deduction_calculated": -1.4
  },

  "dimension_7_cross_ref_detail": {
    "placeholder_count": 0,
    "placeholder_locations": [],
    "xref_count": 45,
    "orphaned_findings_count": 3
  },

  "dimension_9_provision_detail": {
    "total_provisions": 24,
    "by_severity": { "CRITICAL": 8, "HIGH": 6, "MEDIUM": 4, "LOW": 6 },
    "provision_types": ["escrow", "indemnity", "rep_warranty", "earnout"]
  },

  "remediation_task_linkage": {
    "total_issues": 9,
    "issues_by_task": {
      "W2-001": ["CRITICAL-001", "CRITICAL-002"],
      "W3-001-SCAN": ["CRITICAL-003"],
      "W4-001": ["MEDIUM-001"]
    },
    "task_success_criteria": {
      "W2-001": [
        "12 questions in Under/Does/When format",
        "Questions ordered by severity",
        "Each question incorporates ≥3 specific facts"
      ]
    },
    "task_output_files": {
      "W2-001": "remediation-outputs/W2-001-questions-presented.md",
      "W3-001-SCAN": "scripts/CREAC-insertion-map.json"
    }
  },

  "metrics": {
    "dimensions_total": 12,
    "dimensions_scored": 7,
    "aggregate_score_so_far": 78,
    "critical_issues": 1,
    "high_issues": 1,
    "medium_issues": 1,
    "last_checkpoint": "2026-01-18T12:00:00Z",
    "remediation_tier_detail": {
      "tier_assigned": "TIER_3_FULL",
      "rationale": "Score 82.4% < 88% threshold",
      "score_thresholds": { "TIER_1": ">=94%", "TIER_2": "88-93%", "TIER_3": "<88%" },
      "post_remediation_projection": "93-95%"
    }
  },

  "script_execution_tracking": {
    "pre_qa_validate": {
      "executed": false,
      "status": "not_run",
      "exit_code": null,
      "timestamp": null,
      "blocking_checks_failed": [],
      "warnings": []
    },
    "apply_creac_headers": {
      "executed": false,
      "status": "not_run",
      "min_headers_target": 50,
      "headers_before": null,
      "headers_after": null,
      "output_file": null,
      "timestamp": null
    },
    "validate_provisions": {
      "executed": false,
      "status": "not_run",
      "coverage_percentage": null,
      "findings_missing_provisions": null,
      "output_file": "provision-gaps.json",
      "timestamp": null
    },
    "analyze_xrefs": {
      "executed": false,
      "status": "not_run",
      "orphaned_findings_count": null,
      "output_file": "xref-matrix.json",
      "timestamp": null
    },
    "detect_counter_analysis": {
      "executed": false,
      "status": "not_run",
      "detections_count": null,
      "output_file": "counter-analysis-locations.json",
      "timestamp": null
    },
    "extract_citations": {
      "executed": false,
      "status": "not_run",
      "total_citations": null,
      "low_confidence_count": null,
      "output_file": "citation-registry.json",
      "timestamp": null,
      "iteration_count": 0,
      "exit_code": null
    },
    "scan_citation_tags": {
      "executed": false,
      "status": "not_run",
      "coverage_percentage": null,
      "high_unverified_count": null,
      "triggers_hard_fail": false,
      "output_file": "citation-tag-report.json",
      "timestamp": null,
      "iteration_count": 0,
      "exit_code": null,
      "depends_on": "extract_citations"
    },
    "extract_fact_registry": {
      "executed": false,
      "status": "not_run",
      "total_facts": null,
      "conflict_count": null,
      "output_file": "fact-registry.json",
      "timestamp": null,
      "iteration_count": 0,
      "exit_code": null
    },
    "aggregate_risk_tables": {
      "executed": false,
      "status": "not_run",
      "total_findings": null,
      "deal_blocking_count": null,
      "output_file": "risk-summary.json",
      "timestamp": null,
      "iteration_count": 0,
      "exit_code": null
    }
  }
}
```

> **Script Execution Tracking (CRITICAL for Compaction Recovery)**
>
> The `script_execution_tracking` object prevents duplicate script execution after context compaction.
> On resume, orchestrator MUST check this object before invoking any validation scripts.
>
> **Status Values:**
> - `not_run`: Script has not been executed
> - `running`: Script is currently executing (set before invocation)
> - `complete`: Script finished successfully (exit code 0)
> - `failed`: Script finished with blocking issues (exit code 1)
> - `error`: Script encountered an error (exit code 2)

#### When to Write State File

| Event | Action |
|-------|--------|
| Phase 1 complete (prereqs verified) | Write initial state with memorandum verification |
| After EACH dimension scored (Phase 2) | Update dimensions_scored, do_not_repeat, aggregate_score |
| Every issue found | Add to issues_found array |
| Phase 3 complete (issues cataloged) | Update with full issue list |
| Phase 4 complete (remediation planned) | Update with tier and wave structure |
| Before return | Final state with all metrics |
| **Script Invocation** | Update script_execution_tracking BEFORE and AFTER each script run |

#### Script Execution State Updates

| Script | When to Update | Fields to Set |
|--------|----------------|---------------|
| pre-qa-validate.py | Before: status="running" | After: executed=true, exit_code, blocking_checks_failed, warnings |
| apply-creac-headers.py | Before: status="running" | After: executed=true, headers_before, headers_after, output_file |
| validate-provisions.py | Before: status="running" | After: executed=true, coverage_percentage, findings_missing_provisions |
| analyze-xrefs.py | Before: status="running" | After: executed=true, orphaned_findings_count |
| detect-counter-analysis.py | Before: status="running" | After: executed=true, detections_count |
| extract-citations.py | Before: status="running" | After: executed=true, exit_code, total_citations, low_confidence_count, iteration_count++ |
| scan-citation-tags.py | Before: status="running", check depends_on | After: executed=true, exit_code, coverage_percentage, high_unverified_count, triggers_hard_fail, iteration_count++ |
| extract-fact-registry.py | Before: status="running" | After: executed=true, exit_code, total_facts, conflict_count, iteration_count++ |
| aggregate-risk-tables.py | Before: status="running" | After: executed=true, exit_code, total_findings, deal_blocking_count, iteration_count++ |

#### P5/P6 Script Re-Invocation Rules

**P5 Dependency Chain:**
```
extract-citations.py (P5-1)
        │
        ▼ depends_on (MUST succeed with exit 0 or 1)
scan-citation-tags.py (P5-2)
```

**When to Re-Invoke P5/P6 Scripts:**

| Scenario | Action | Reset Fields |
|----------|--------|--------------|
| Memorandum content changed | Re-run ALL P5-P6 | Set all executed=false, increment iteration_count |
| Citation remediation applied | Re-run P5-1, then P5-2 | Reset extract_citations and scan_citation_tags |
| Fact conflict resolved | Re-run P6-1 only | Reset extract_fact_registry |
| Risk table updated | Re-run P6-2 only | Reset aggregate_risk_tables |

**Iteration Count Usage:**
- `iteration_count >= 3` → Flag for manual review (potential infinite loop)
- Track across compaction to detect runaway remediation cycles

**P5 Dependency Enforcement:**
```
BEFORE running scan-citation-tags.py:
  IF script_execution_tracking.extract_citations.executed == false:
    → Run extract-citations.py FIRST
  IF script_execution_tracking.extract_citations.exit_code == 2:
    → HALT - P5-1 failed with script error, do not run P5-2
```

**On Resume After Compaction:**
```
IF script_execution_tracking.[script].executed == true:
  → Do NOT re-run script
  → Use cached results from output_file path

IF script_execution_tracking.[script].status == "running":
  → Script was interrupted mid-execution
  → Re-run script from scratch
```

#### Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `qa_cycle.current_cycle`** - Verify cycle number (prevents reset after compaction)
3. **Check `dimensions_scored`** - Skip dimensions with status "complete"
4. **Use `aggregate_score_so_far`** as running total
5. **Resume** from first dimension with status "pending"
6. **DO NOT re-score** dimensions in `do_not_repeat`
7. **If `qa_cycle.current_cycle >= qa_cycle.max_cycles`** - CERTIFY_WITH_LIMITATIONS, do not start new cycle

---

## 6. State File Location Index

| Agent | State File | Location |
|-------|-----------|----------|
| research-review-analyst | research-review-state.json | `{session}/research-review-state.json` |
| fact-validator | fact-validator-state.json | `{session}/review-outputs/fact-validator-state.json` |
| coverage-gap-analyzer | coverage-gap-analyzer-state.json | `{session}/review-outputs/coverage-gap-analyzer-state.json` |
| risk-aggregator | risk-aggregator-state.json | `{session}/review-outputs/risk-aggregator-state.json` |
| memo-section-writer | section-writer-state-IV-{X}.json | `{session}/section-writer-state-IV-{X}.json` |
| memo-executive-summary-writer | executive-summary-state.json | `{session}/executive-summary-state.json` |
| citation-validator | citation-validator-state.json | `{session}/citation-validator-state.json` |
| (assembly) | assembly-state.json | `{session}/assembly-state.json` |
| memo-final-synthesis | synthesis-state.json | `{session}/synthesis-state.json` |
| memo-qa-diagnostic | qa-diagnostic-state.json | `{session}/qa-diagnostic-state.json` |

---

## 7. Recovery Protocol Quick Reference

### Universal 5-Step Recovery Protocol

For ALL agents after context compaction:

1. **Read State File FIRST** (MANDATORY)
   - Location varies by agent (see Location Index above)
   - If state file missing, use file inspection fallback

2. **Run `environment_checks.on_resume`** steps
   - Verify output files exist for items_complete
   - Check file sizes are reasonable
   - Validate no truncation markers

3. **Check `blocking_issue`** for unresolved issues
   - If `resolution_status` = "UNRESOLVED", address blocker first
   - Use `resolution_method` for guidance

4. **Use `compaction_summary.next_action`** for immediate guidance
   - This tells you exactly what to do next
   - Skip items in `recovery_instructions.do_not_repeat`

5. **Append** to existing output files (do NOT overwrite)
   - Never restart from beginning
   - Continue from discovered position

### File Inspection Fallback

When state file is missing or corrupted:

```bash
# Discover output files
ls -la {session}/*-state.json 2>/dev/null
ls -la {session}/section-reports/*.md 2>/dev/null

# Extract progress indicators
grep -c "^## IV\." final-memorandum.md 2>/dev/null  # Count sections
wc -w final-memorandum.md 2>/dev/null               # Word count
tail -5 final-memorandum.md 2>/dev/null             # Check for truncation
```

Then create state file from discovered information and proceed.

### File Integrity Verification (Before Adding to do_not_repeat)

**CRITICAL**: Before marking a task as complete and adding to `do_not_repeat`, verify file integrity:

1. **Check file exists**
   ```bash
   test -f {output_file} && echo "EXISTS" || echo "MISSING"
   ```

2. **Verify word count >= minimum threshold**
   ```bash
   WORDS=$(wc -w < {output_file})
   # Section reports: MIN 3000 words
   # Executive summary: MIN 6000 words
   # Final memorandum: MIN 50000 words
   ```

3. **Check for truncation markers**
   ```bash
   # Suspicious endings (truncation indicators)
   tail -3 {output_file} | grep -E "^\.\.\.$|^…$|^\[continue" && echo "TRUNCATED"

   # Missing expected footer
   grep -q "END OF" {output_file} || echo "MISSING_FOOTER"
   ```

4. **If ANY check fails:**
   - Do NOT add to `do_not_repeat`
   - Do NOT mark task as complete
   - Log incomplete file in state file
   - On resume, regenerate this output

| File Type | Min Words | Required Footer | Truncation Check |
|-----------|-----------|-----------------|------------------|
| Section report | 3,000 | `---` or `## Footnotes` | `[continue`, `...` at end |
| Executive summary | 6,000 | Section references | `[TBD]`, `...` at end |
| Final memorandum | 50,000 | `END OF MEMORANDUM` | Incomplete section headers |

---

## 8. ORCHESTRATOR STATE SCHEMA

### File: `orchestrator-state.md`

The orchestrator maintains its own state file for tracking phase completion across context compaction events.

| Field | Type | Purpose |
|-------|------|---------|
| `session_id` | string | Unique session identifier |
| `current_phase` | string | Active phase (e.g., "A1", "A2.DIAGNOSTIC") |
| `phases_completed` | object | Completion status per phase |
| `gate_attempts` | object | Attempt counters for gates |
| `last_updated` | ISO timestamp | State freshness indicator |

### phases_completed Structure

```json
{
  "phases_completed": {
    "P1": { "status": "COMPLETE", "timestamp": "2026-01-21T10:00:00Z" },
    "P2": { "status": "COMPLETE", "sections_completed": 17, "timestamp": "..." },
    "V": { "status": "COMPLETE", "validators_passed": 4, "timestamp": "..." },
    "G": { "status": "COMPLETE", "timestamp": "..." },
    "A1": { "status": "COMPLETE", "word_count": 52000, "timestamp": "..." },
    "A2": { "status": "IN_PROGRESS", "qa_cycles": 1, "timestamp": "..." }
  }
}
```

### gate_attempts Structure

```json
{
  "gate_attempts": {
    "A1_to_A2": { "attempts": 1, "max_attempts": 3, "last_failure_reason": null },
    "A2_DIAGNOSTIC": { "cycles": 1, "max_cycles": 3 }
  }
}
```

### Required Update Pattern

Orchestrator MUST update this file:
1. BEFORE invoking any phase
2. AFTER receiving phase completion status
3. On ANY gate pass/fail decision

### Orchestrator State Recovery Protocol

1. **Read State File FIRST** (MANDATORY)
2. **Check `phases_completed`** - Skip phases with status "COMPLETE"
3. **Check `gate_attempts`** - Respect max attempt limits
4. **Resume from `current_phase`** - Do not restart from P1
5. **Update state BEFORE returning** - Write-before-return pattern

---

*End of State File Schemas Reference*

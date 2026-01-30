# WAVE EXECUTION PROTOCOL

## Wave Overview

The remediation workflow executes in 6 sequential waves. Each wave has specific
dependencies and must complete before the next wave begins.

---

## Wave Dependencies

| Wave | Depends On | Type | Primary Agent | Description |
|------|------------|------|---------------|-------------|
| 1 | None | Agent-only | memo-remediation-writer | Initialize state, prep environment |
| 2 | Wave 1 | Agent-only | memo-executive-summary-writer (W2-001/002), memo-remediation-writer | Questions Presented, Brief Answers |
| 3 | Wave 2 | HYBRID | Scripts + memo-remediation-writer | CREAC, provisions, counter-analysis |
| 4 | Wave 3 | Agent-only | memo-remediation-writer | Language/format fixes |
| 5 | Wave 4 | Agent-only | citation-validator (sequential) | Citation cleanup, appendices |
| 6 | Wave 5 | Agent+Manifest | memo-remediation-writer (ASSEMBLY-001) | Final assembly |

---

## Task ID Format

All remediation tasks use consistent ID conventions:

| Pattern | Example | Description |
|---------|---------|-------------|
| W[wave]-[number] | W2-001, W4-002 | Standard sequential task |
| W[wave]-[section]-[subsection] | W3-XREF-IV-A | Section-specific task |
| W[wave]-[type]-[ref] | W3-COUNTER-IV-B | Type-prefixed section task |
| ASSEMBLY-[number] | ASSEMBLY-001 | Wave 6 integration task |

---

## Wave 1: Initialization (No Dependencies)

**Purpose**: Set up remediation environment and state tracking

**Tasks**:
| Task ID | Description | Output |
|---------|-------------|--------|
| W1-001 | Initialize remediation-wave-state.json | qa-outputs/remediation-wave-state.json |
| W1-002 | Verify remediation-dispatch.md exists | Validation pass/fail |

**Gate Check**:
- remediation-wave-state.json exists and is valid JSON
- remediation-dispatch.md contains task table

---

## Wave 2: Executive Summary Elements (Depends: Wave 1)

**Purpose**: Fix Questions Presented and Brief Answers sections

**Tasks**:
| Task ID | Agent | Priority | Target Section | Description | Output |
|---------|-------|----------|----------------|-------------|--------|
| W2-001 | memo-executive-summary-writer | HIGH | II | Format Questions Presented with "Under...does...when" | remediation-outputs/W2-001.md |
| W2-002 | memo-executive-summary-writer | HIGH | III | Expand Brief Answers with "Probably...because" | remediation-outputs/W2-002.md |
| W2-003 | memo-remediation-writer | MEDIUM | [varies] | Counter-Analysis additions | remediation-outputs/W2-003.md |
| W2-004 | memo-remediation-writer | MEDIUM | [varies] | Probability methodology | remediation-outputs/W2-004.md |

**Gate Check**:
```bash
# Verify W2-001 output format
grep -c "Under.*does.*when" remediation-outputs/W2-001.md  # Expected: >= 12

# Verify W2-002 output format
grep -c "Probably.*because" remediation-outputs/W2-002.md  # Expected: >= 12
```

### Wave 2: Risk Assessment Tables (W2-RISK-001 through W2-RISK-006)

**Purpose**: Generate standardized 5-column risk assessment tables for each Section IV subsection.

**Task Definitions**:

| Task ID | Target Section | Minimum Rows | Success Criteria |
|---------|----------------|--------------|------------------|
| W2-RISK-001 | IV.A Bankruptcy Patterns | 5 | Table with `\| Finding \| Severity \| Probability \| Exposure \| Mitigation \|` header present |
| W2-RISK-002 | IV.B Environmental Violations | 8 | Table covers all CRITICAL/HIGH environmental risks |
| W2-RISK-003 | IV.C Remediation Costs | 6 | Table covers all facility size categories |
| W2-RISK-004 | IV.D IP Retention | 5 | Table covers all HIGH/CRITICAL IP risks |
| W2-RISK-005 | IV.E Environmental Offset | 10 | Table covers all major offset mechanisms |
| W2-RISK-006 | IV.F Strategic Recommendations | 5 | Table covers deal execution risks |

**Operation Type**: INSERT (new content, not replacement)

**Insertion Point**: After section introduction, before first `### A.` subsection header.

**Table Format**:
```
| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| [1-sentence description] | CRITICAL/HIGH/MEDIUM/LOW | [%] with basis | [$range] | [action + owner] |
```

**Wave 2 Gate Check** (updated):
```bash
# Questions format
grep -cE "Under .* does .* when" final-memorandum-v2.md  # Expected: 12

# Risk tables present
grep -c "| Finding | Severity | Probability | Exposure | Mitigation |" final-memorandum-v2.md  # Expected: 6

# Provisions drafted
grep -c "DRAFT CONTRACT PROVISION" final-memorandum-v2.md  # Expected: 3
```

---

## Wave 3: Hybrid Processing (Depends: Wave 2)

**Purpose**: Script-assisted structural improvements

**CRITICAL**: Wave 3 uses hybrid workflow - scripts handle bulk mechanical operations,
agents handle semantic validation and quality checks.

### Script Tasks (Execute First)

| Task ID | Script | Description | Output |
|---------|--------|-------------|--------|
| W3-000-PRECHECK | pre-qa-validate.py | Pre-QA validation | Validation report |
| W3-CREAC | apply-creac-headers.py | Insert CREAC markdown headers | final-memorandum-creac.md |
| W3-PROVISION-SCAN | validate-provisions.py | Identify missing provisions | provision-gaps.json |
| W3-COUNTER-SCAN | detect-counter-analysis.py | Detect scattered counter-analysis | counter-analysis-locations.json |
| W3-CITE-EXTRACT | extract-citations.py | Extract citation registry | citation-registry.json |

### Agent Tasks (Execute After Scripts)

| Task ID | Agent | Priority | Description | Output |
|---------|-------|----------|-------------|--------|
| W3-001-VALIDATE | memo-remediation-writer | HIGH | CREAC semantic validation | remediation-outputs/W3-001-VALIDATE.md |
| W3-COUNTER-[section] | memo-remediation-writer | MEDIUM | Consolidate counter-analysis | remediation-outputs/W3-COUNTER-IV-*.md |
| W3-PROVISION-[section] | memo-remediation-writer | HIGH | Draft missing provisions | remediation-outputs/W3-PROVISION-IV-*.md |

**Gate Check**:
```bash
# All script outputs exist
ls provision-gaps.json counter-analysis-locations.json citation-registry.json

# CREAC validation passed
grep "STATUS: PASS" remediation-outputs/W3-001-VALIDATE.md
```

---

## Wave 4: Language and Format Fixes (Depends: Wave 3)

**Purpose**: Agent-only fixes for objectivity and formatting issues

**Tasks**:
| Task ID | Agent | Priority | Target Section | Description | Output |
|---------|-------|----------|----------------|-------------|--------|
| W4-001 | memo-remediation-writer | MEDIUM | [varies] | Neutralize advocacy language | remediation-outputs/W4-001.md |
| W4-002 | memo-remediation-writer | MEDIUM | II | Format 12 Questions with "Under...Does...When" | remediation-outputs/W4-002.md |
| W4-003 | memo-remediation-writer | LOW | [varies] | Add missing pincites | remediation-outputs/W4-003.md |

**Gate Check**:
```bash
# Verify questions reformatted
grep -c "Under.*Does.*When" remediation-outputs/W4-002.md  # Expected: 12
```

---

## Wave 5: Citation and Appendix Cleanup (Depends: Wave 4)

**Purpose**: Sequential citation validation and appendix generation

**IMPORTANT**: Wave 5 tasks run SEQUENTIALLY (not parallel) due to dependencies.

**Tasks**:
| Task ID | Agent | Priority | Description | Output |
|---------|-------|----------|-------------|--------|
| W5-001 | citation-validator | HIGH | Validate all citations | remediation-outputs/W5-001.md |
| W5-002 | citation-validator | HIGH | Add verification tags | remediation-outputs/W5-002.md |
| W5-003 | memo-remediation-writer | MEDIUM | Generate APPENDIX C | remediation-outputs/W5-003.md |

**Gate Check**:
```bash
# All W5 tasks complete with SUCCESS
for task in W5-001 W5-002 W5-003; do
  grep "STATUS: SUCCESS" remediation-outputs/${task}.md
done
```

---

## Wave 6: Final Assembly (Depends: Wave 4 AND Wave 5)

**Purpose**: Merge all remediation outputs into final-memorandum-v2.md

**CRITICAL**: Wave 6 is the most failure-prone wave. Follow ASSEMBLY-001 protocol exactly.

**Tasks**:
| Task ID | Agent | Priority | Description | Output |
|---------|-------|----------|-------------|--------|
| ASSEMBLY-001 | memo-remediation-writer | CRITICAL | Merge all W2-W5 outputs | final-memorandum-v2.md |

**Prerequisites (MANDATORY)**:
1. Wave 4 status == "completed"
2. Wave 5 status == "completed"
3. All W5-001, W5-002, W5-003 validated
4. All remediation-outputs/W*-*.md files exist

**Gate Check**:
```bash
# Zero placeholders remaining
grep -c "\[Omitted long context line\]" final-memorandum-v2.md  # Expected: 0
grep -c "\[INSERT" final-memorandum-v2.md                        # Expected: 0

# Word count check
wc -w < final-memorandum-v2.md  # Expected: >= 125,000
```

---

## Wave Execution Flow

```
Wave 1 (Init)
    |
    v
Wave 2 (Exec Summary)
    |
    v
Wave 3 (Hybrid - Scripts then Agents)
    |
    v
Wave 4 (Language Fixes)
    |
    +--------------------+
    |                    |
    v                    v
Wave 5 (Citations)   [Wait for W4]
    |                    |
    +--------------------+
    |
    v
Wave 6 (Assembly - requires BOTH Wave 4 and Wave 5)
```

---

## Inter-Wave Communication

Waves communicate through:
1. **State file**: remediation-wave-state.json tracks progress
2. **Output files**: remediation-outputs/*.md contain completed work
3. **Dispatch file**: remediation-dispatch.md defines all tasks

**Recovery on Compaction**:
1. Read remediation-wave-state.json
2. Identify current wave from metrics.current_wave
3. Resume from first pending task in current wave
4. Do NOT repeat tasks in do_not_repeat list

---

## Error Handling

| Error Type | Wave Behavior |
|------------|---------------|
| Task failure | Mark task failed, continue wave if non-blocking |
| Script error | Block wave, set blocking_issue in state |
| Gate check fail | Block next wave, resolve before proceeding |
| >2 task failures | Set wave status = "blocked", escalate |

**Blocking Issue Protocol**:
```json
{
  "blocking_issue": {
    "type": "SCRIPT_FAILURE",
    "task_id": "W3-CREAC",
    "description": "apply-creac-headers.py exit code 1",
    "resolution_status": "UNRESOLVED"
  }
}
```

Do NOT proceed to next wave until blocking_issue.resolution_status = "RESOLVED".

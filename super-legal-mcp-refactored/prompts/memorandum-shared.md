# SHARED REFERENCE

Common reference data for all legal research system agents.

---

## STATUS CODE REFERENCE

| Status Code | Returning Agents | Action |
|-------------|------------------|--------|
| `PROCEED` | research-review-analyst | Continue to next phase |
| `REMEDIATE` | research-review-analyst, section-report-reviewer | Spawn remedial work (max 2 iterations) |
| `GAPS_FOUND` | coverage-gap-analyzer | Spawn targeted specialists (max 2 iterations) |
| `CONFLICTS_FOUND` | fact-validator | Spawn conflict resolution research |
| `CONFLICTS_DETECTED` | coverage-gap-analyzer | Flag for section writers, continue |
| `PASS` | fact-validator, section-report-reviewer, citation-validator | Proceed to next phase |
| `ISSUES_FOUND` | citation-validator | Spawn research OR mark [ASSUMED], continue |
| `HARD_FAIL_PINCITES` | citation-validator | **BLOCKING**: Fix missing pincites, re-invoke (max 2 loops) |
| `HARD_FAIL_PLACEHOLDER` | citation-validator | **BLOCKING**: Fix placeholder text, re-invoke (max 2 loops) |
| `HARD_FAIL_UNVERIFIED` | citation-validator | **BLOCKING**: >10% unverifiable, research or mark [ASSUMED] |
| `PASS_WITH_EXCEPTIONS` | citation-validator | Max loops reached, proceed with documented exceptions |
| `ASSUMPTIONS_INVALIDATED` | fact-validator, research-plan-refiner | Propagate to section writers, continue |
| `DEAL_BLOCKING_ESCALATION` | research-plan-refiner, research-review-analyst | **Auto-document**, add warning, continue |
| `REFINED` | research-plan-refiner | Apply updates to remaining specialists |
| `NO_CHANGES_NEEDED` | research-plan-refiner | Continue unchanged |
| `COMPREHENSIVE` | coverage-gap-analyzer | Proceed to section-generation |
| `TIMELINE_INFEASIBLE` | research-review-analyst | Auto-document as deal-blocking warning |
| `COMPLETE` | memo-section-writer, memo-executive-summary-writer, memo-final-synthesis | Section/summary/memo generated successfully |
| `INCOMPLETE` | memo-section-writer, memo-final-synthesis | Truncated, requires remediation |
| `MISSING_COMPONENTS` | memo-final-synthesis | Input files missing |
| `SESSION_DIRECTORY_REQUIRED` | Any research specialist | **CRITICAL ERROR**: session-initialization not completed |

---

## TOOL CAPABILITY MATRIX (CRITICAL)

Agents MUST understand tool limitations before attempting operations:

| Tool | Token/Size Limit | Use For | Do NOT Use For |
|------|------------------|---------|----------------|
| **Read** | 25,000 tokens | Small files (<100KB) | Large files (>100KB) |
| **Bash** | **UNLIMITED** | Large file ops, concatenation, verification | Reading for analysis |
| **Grep** | **UNLIMITED** | Searching large files | Writing files |
| **Glob** | **UNLIMITED** | File pattern matching (e.g., `**/*.md`) | Content search |
| **Edit** | Requires Read first | Small file edits | Large files (Read will fail) |
| **Write** | No limit | Creating new files | When Edit is available |
| **WebFetch** | Per-request | Fetching URL content for analysis | Bulk downloads |
| **WebSearch** | Per-request | Web search queries for research | When local sources suffice |
| **Task** | Spawns subagent | Complex multi-step subtasks | Simple single operations |

### CRITICAL: When Read Fails

If you encounter:
> "File content (XXXXX tokens) exceeds maximum allowed tokens (25000)"

**DO NOT STOP WORK.** Switch immediately to:
1. `Bash: cat file.md >> output.md` - For concatenation/assembly
2. `Grep: pattern` - For searching content
3. `Bash: wc -w file.md` - For verification

**WRONG**: "I cannot proceed because the file exceeds the Read limit"
**CORRECT**: "I will use Bash/Grep which have no token limits"

---

## COMPACTION RECOVERY PROTOCOL (ALL AGENTS)

After session compaction, follow this protocol EXACTLY:

### Step 1: Locate State Files

```bash
# Find all state files in session directory
ls -la {session_directory}/*-state.json
```

### Step 2: Read and Validate Each State File

For each state file found:
1. Parse JSON (if invalid → use file inspection fallback)
2. Extract `recovery_instructions.do_not_repeat` array
3. Extract `compaction_summary.next_action`
4. Extract `progress.items_complete` and `progress.current_item`

### Step 3: Skip Completed Work

**CRITICAL**: Items in `do_not_repeat` array are ALREADY DONE. Do NOT redo them.

```
do_not_repeat: ["IV-A", "IV-B", "IV-C"]
→ Skip IV-A, IV-B, IV-C
→ Start from IV-D
```

### do_not_repeat vs do_not_repeat_unless_remediation

Two-tier skip logic for remediation cycles:

| Field | Purpose | Cleared When? |
|-------|---------|---------------|
| `do_not_repeat` | Items to skip PERMANENTLY | Never cleared |
| `do_not_repeat_unless_remediation` | Items to skip UNLESS remediation active | On remediation cycle start |

**On remediation cycle start:**
1. Clear `do_not_repeat_unless_remediation` array
2. Keep `do_not_repeat` intact
3. Items in `do_not_repeat_unless_remediation` may now be re-evaluated

**Example:**
```json
{
  "do_not_repeat": ["IV-A", "IV-B"],  // Never redo
  "do_not_repeat_unless_remediation": ["IV-C", "IV-D"]  // Cleared for remediation
}
```

This prevents: After remediation, items that need re-evaluation are still skipped.

### Step 4: Resume from Correct Position

Use `compaction_summary.next_action` for immediate guidance:
- If it says "Generate Section IV-D" → Start there
- If it says "Verify section count" → Run verification
- If it says "BLOCKED on [issue]" → Address blocker first

### Step 5: Verify Before Continuing

Before proceeding with work:
1. Check output files exist for completed items
2. Verify file sizes are reasonable (not truncated)
3. If discrepancy found → log and use file inspection fallback

### Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|----------------|------------------|
| Re-reading all specialist reports | Wastes tokens, already summarized | Read state file summary instead |
| Re-generating completed sections | Duplicates work | Check do_not_repeat first |
| Ignoring state file timestamps | May use stale state | Verify timestamp is recent |
| Skipping validation after recovery | May have corrupted state | Always validate before proceeding |

---

## STATE FILE INITIALIZATION (MANDATORY)

> **Complete Schema Reference:** For all 10 agent-specific state file schemas with full JSON examples, see [state-file-schemas.md](memorandum-synthesis/state-file-schemas.md).
> This section provides the GENERIC v3.0 template. Agent-specific schemas include additional fields.

On FIRST invocation (state file does not exist):

### 1. Create Initial State File BEFORE Starting Work

**EXTENDED AGENT STATE SCHEMA (v3.0)**

```json
{
  "schema_version": "3.0",
  "agent_type": "[agent-name]",
  "session_id": "[session_directory]",
  "status": "initialized | in_progress | complete | blocked",
  "started_at": "[ISO timestamp]",
  "last_checkpoint": "[ISO timestamp]",

  "environment_checks": {
    "on_resume": [
      "Read state file",
      "Verify output files exist for items_complete",
      "Check file sizes are reasonable",
      "Validate no truncation markers"
    ],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  },

  "blocking_issue": null,

  "progress": {
    "items_complete": [],
    "items_pending": [],
    "current_item": null,
    "total_expected": 0
  },

  "compaction_summary": {
    "task": "[description from orchestrator]",
    "progress": "0/N items, 0% complete",
    "next_action": "[first major step]",
    "critical_context": []
  },

  "recovery_instructions": {
    "on_compaction": "Read this file. Run environment_checks.on_resume steps.",
    "do_not_repeat": []
  },

  "metrics": {
    "word_count": 0,
    "items_processed": 0
  }
}
```

**blocking_issue structure** (when not null):
```json
{
  "type": "FILE_SIZE_LIMIT | TOOL_ERROR | MISSING_INPUT",
  "description": "[details]",
  "resolution_status": "UNRESOLVED | RESOLVED",
  "resolution_method": "[how to fix]"
}
```

### Progress Tracking Structure

The `progress` object provides explicit progress tracking (replaces undefined `phases_complete`):

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `items_complete` | array | Completed work identifiers | `["IV-A", "IV-B"]` |
| `items_pending` | array | Remaining work identifiers | `["IV-C", "IV-D", "IV-E"]` |
| `current_item` | string | Currently processing | `"IV-C"` |
| `total_expected` | number | Total items for % calc | `10` |

**Usage by Agent Type:**

| Agent | items_complete contains | items_pending contains |
|-------|-------------------------|------------------------|
| memo-section-writer | Subsection letters (A-F) | Remaining subsections |
| memo-final-synthesis | Section IDs (IV-A, IV-B) | Remaining sections |
| fact-validator | Fact categories | Remaining categories |
| citation-validator | Section IDs processed | Remaining sections |
| research-review-analyst | Report filenames | Remaining reports |
| coverage-gap-analyzer | Issue IDs verified | Remaining issues |
| risk-aggregator | Exposure IDs classified | Remaining exposures |

### Environment Verification Protocol (ALL AGENTS)

Every agent MUST verify environment on resume:

**Step 1: Read environment_checks.on_resume array**
Execute each step in order. If ANY fails, set `environment_healthy = false`.

**Step 2: Validate Output Files**
For each item in `progress.items_complete`:
1. Check file exists: `test -f {output_path}`
2. Check file size: `wc -c {output_path} > 0`
3. Check no truncation: `tail -1 {output_path}` ends properly

**Step 3: If environment_healthy = false**
1. Log: "Environment verification failed at step [X]"
2. Use file inspection fallback (see FILE INSPECTION FALLBACK PROTOCOL below)
3. Reconstruct state from discovered files
4. Create new state file with `status: "recovered_from_inspection"`

**Agent-Specific Verification Commands:**

| Agent | Verification Command | Pass Criteria |
|-------|---------------------|---------------|
| memo-section-writer | `grep -c "^### [A-F]\." section.md` | Count matches items_complete.length |
| memo-final-synthesis | `grep -c "^## IV\." final-memorandum.md` | Count matches items_complete.length |
| fact-validator | `jq '.facts_by_section \| keys' fact-registry.json` | Keys match items_complete |
| citation-validator | `jq '.sections_processed' citation-collection.json` | Matches items_complete |

### 2. Write State File Location

Write to: `{session_directory}/[agent]-state.json`

Example paths:
- `{session}/section-writer-state-IV-A.json`
- `{session}/review-outputs/fact-validator-state.json`
- `{session}/synthesis-state.json`

### 3. Log Initialization

After creating state file: "State file initialized at [path]"

### Validation on Recovery

When reading existing state file:
1. Parse JSON (if invalid → use file inspection fallback)
2. **Verify `started_at` timestamp is within 6 hours** (MANDATORY - see below)
3. Run `environment_checks.on_resume` steps (see Environment Verification Protocol above)
4. For each item in `progress.items_complete`, verify output file exists
5. If ANY validation fails → set `environment_healthy = false`, use file inspection fallback

### Timestamp Validation (MANDATORY)

The `started_at` timestamp check MUST be in every agent's `environment_checks.on_resume` array:

```json
"environment_checks": {
  "on_resume": [
    "Verify started_at within 6 hours",  // MANDATORY FIRST CHECK
    "Read state file",
    "Verify output files exist for items_complete",
    "Check file sizes are reasonable",
    "Validate no truncation markers"
  ]
}
```

**Rationale:** Sessions older than 6 hours may have stale data, file system changes, or context drift that makes recovery unreliable.

### State File Not Found Fallback

If agent state file does NOT exist during recovery:
1. Inspect output files to determine progress
2. Check file word counts, section counts
3. Create state file from discovered state
4. Proceed from discovered position

---

## FILE INSPECTION FALLBACK PROTOCOL (DETAILED)

When state file is missing, corrupted, or inconsistent, use this protocol to reconstruct progress:

### Step 1: Discover Output Files

```bash
# For section writers
ls -la {session}/section-reports/section-IV-*.md 2>/dev/null | wc -l

# For synthesis agents
ls -la {session}/final-memorandum.md 2>/dev/null && wc -w {session}/final-memorandum.md

# For validators
ls -la {session}/review-outputs/*.md 2>/dev/null
```

### Step 2: Extract Progress Indicators

| Agent Type | Inspection Command | What It Reveals |
|------------|-------------------|-----------------|
| memo-section-writer | `grep -c "^## IV\." section-IV-{X}.md` | Subsection count |
| memo-section-writer | `grep -c "^### [A-F]\." section-IV-{X}.md` | A-F structure complete? |
| memo-final-synthesis | `grep "^## IV\." final-memorandum.md \| wc -l` | Sections assembled |
| memo-final-synthesis | `grep -q "END OF MEMORANDUM"` | Footer present? |
| fact-validator | `grep -c "^| FACT-" fact-registry.md` | Facts extracted |
| citation-validator | `grep -c "^\[VERIFIED\|INFERRED\|ASSUMED\|UNVERIFIED\]" footnotes.md` | Tags assigned |

### Step 3: Reconstruct State File

Create state file from discovered information:

```json
{
  "schema_version": "3.0",
  "agent_type": "[agent-name]",
  "session_id": "[session_directory]",
  "status": "recovered_from_inspection",
  "started_at": "[ISO timestamp]",
  "last_checkpoint": "[ISO timestamp]",

  "environment_checks": {
    "on_resume": ["Verify recovered state matches files"],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  },

  "blocking_issue": null,

  "progress": {
    "items_complete": ["IV-A", "IV-B"],
    "items_pending": ["IV-C", "IV-D"],
    "current_item": "IV-C",
    "total_expected": 10
  },

  "compaction_summary": {
    "task": "[inferred from files]",
    "progress": "[reconstructed from inspection]",
    "next_action": "[derived from incomplete items]",
    "critical_context": ["Recovered via file inspection"]
  },

  "recovery_instructions": {
    "on_compaction": "State was reconstructed via file inspection",
    "do_not_repeat": ["items found complete via inspection"]
  },

  "metrics": {
    "word_count": 12500,
    "items_processed": 2
  }
}
```

### Step 4: Validate Before Proceeding

Before continuing work after file inspection recovery:

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Output file integrity | `wc -w {file}` | Word count > 0 |
| Structure completeness | `grep -c "^##"` | Expected section headers present |
| No truncation | `tail -5 {file}` | Last lines are complete sentences |
| No placeholders | `grep -E "\[(TODO\|TBD)\]"` | Zero matches |

### Step 5: Log Recovery and Continue

After reconstruction:
1. Write reconstructed state file to standard location
2. Log: "State recovered via file inspection at [path]"
3. Continue from first incomplete item identified

### File Inspection Triggers

Use file inspection fallback when:
- State file does not exist
- State file JSON is malformed (parse error)
- State file timestamp > 6 hours old
- State file claims completion but output file missing
- State file section count != actual section count

**IMPORTANT**: File inspection is a FALLBACK, not primary. Always attempt state file recovery first.

---

## WRITE FAILURE RECOVERY PROTOCOL

When Write tool fails, follow this protocol:

### Common Write Failures

| Error | Cause | Recovery |
|-------|-------|----------|
| "File too large for Edit" | File > 25K tokens | Switch to Bash append |
| "Permission denied" | Path issue | Verify directory exists, use absolute path |
| "Disk full" | System limit | Log BLOCKED status, escalate |
| "File exists" (on create) | Duplicate attempt | Read existing, decide: append or overwrite |

### Write Failure Recovery Steps

1. **Log the failure** in state file:
   ```json
   {
     "write_failures": [{
       "timestamp": "[ISO]",
       "file": "[path]",
       "error": "[message]",
       "recovery_attempted": "[method]"
     }]
   }
   ```

2. **Attempt alternative** based on failure type:
   - Size limit → Use `Bash: cat content.md >> target.md`
   - Permission → Verify path with `Bash: ls -la $(dirname {path})`
   - Exists → Read file first, then decide action

3. **Verify recovery** after alternative:
   ```bash
   test -f {path} && wc -w {path}
   ```

4. **If all alternatives fail**:
   - Return status `BLOCKED`
   - Include specific blocker in response
   - Do NOT claim COMPLETE

### Bash Append Pattern (for large files)

When Write/Edit fails due to size:

```bash
# Create content in temp file
cat << 'EOF' > /tmp/section-content.md
[section content here]
EOF

# Append to final file
cat /tmp/section-content.md >> {session}/final-memorandum.md

# Verify append succeeded
wc -w {session}/final-memorandum.md
tail -3 {session}/final-memorandum.md

# Clean up temp
rm /tmp/section-content.md
```

**CRITICAL**: After any Bash append, always verify with `wc -w` and `tail` to confirm content was written.

---

## PLACEHOLDER TEXT PATTERNS (PROHIBITED)

citation-validator and memo-qa-diagnostic will flag these patterns as defects:

| Pattern | Type | Fix |
|---------|------|-----|
| `[XREF:...]` | Cross-reference placeholder | Use domain reference or native format |
| `[TODO:...]` | Incomplete marker | Complete the work |
| `[TBD]` or `[TBD:...]` | To be determined | Determine and fill in |
| `[NEEDS:...]` | Research needed | Complete research |
| `[MISSING:...]` | Missing content | Add content |
| `[INSERT:...]` | Placeholder for later | Insert now |
| `[CITE NEEDED]` | Missing citation | Add citation with verification tag |
| `See Section [X]` | Unknown section | Use domain reference |
| `(to be completed)` | Incomplete marker | Complete now |
| `...` (trailing) | Truncation indicator | Complete the thought |
| `[continue]` | Continuation marker | Continue and complete |

### Self-Check Before Completion

Before returning `COMPLETE` status, grep for these patterns:
```bash
grep -E "\[(TODO|TBD|NEEDS|MISSING|INSERT|XREF|CITE).*\]|\(to be completed\)|See Section \[" output.md
```

If ANY matches found → Do NOT return COMPLETE → Fix all placeholders first

---

## ITERATION LIMITS (DETAILED)

> **Authoritative Reference:** These iteration limits are the system standard.
> Agents in legalSubagents.js should enforce these limits.
> See also: [state-file-schemas.md](memorandum-synthesis/state-file-schemas.md) for state file recovery after max iterations.

### When Iteration Counter Increments

The iteration counter increments when:
1. **Agent is RE-INVOKED** by orchestrator (not on first invocation)
2. **After processing REMEDIATE/GAPS_FOUND status** and spawning follow-up work
3. **NOT** when agent returns PASS/PROCEED/COMPLETE on first try

**Decision Tree:**
```
Agent invoked (iteration = 0 initially)
    ↓
Returns status
    ↓
Is status PASS/PROCEED/COMPLETE/COMPREHENSIVE?
    → YES: Phase complete, do NOT increment
    → NO: Continue below
    ↓
Is status REMEDIATE/GAPS_FOUND/CONFLICTS_FOUND?
    → YES: Spawn remedial work, then INCREMENT counter
    ↓
Is counter < max_iterations?
    → YES: Re-invoke agent with remediation context, INCREMENT counter
    → NO: Proceed with documented issues (At Limit behavior)
```

### Iteration Limits Table

| Phase | Agent | Max | Increment Trigger | At Limit Behavior |
|-------|-------|-----|-------------------|-------------------|
| V1 | research-review-analyst | 2 | After REMEDIATE status processed | Proceed, document unresolved |
| V2 | fact-validator | 1 | N/A (single-shot) | Document conflicts, proceed |
| V3 | coverage-gap-analyzer | 2 | After GAPS_FOUND resolved | Document gaps with warning |
| G2 | section-report-reviewer | 2 | After REMEDIATE sections fixed | Proceed, flag incomplete |
| G4 | citation-validator | 2 | After HARD_FAIL issues fixed | PASS_WITH_EXCEPTIONS |
| A2 | memo-qa-diagnostic | 3 | After remediation wave complete | Escalate HUMAN_REVIEW |

### Why fact-validator Has Max=1

fact-validator is **single-shot by design**:
- Conflicts are DOCUMENTED, not resolved by re-invocation
- Resolution requires HUMAN decision on which value is authoritative
- Re-invoking with same inputs produces same conflicts
- If conflicts found: Status = CONFLICTS_FOUND, proceed to section generation with documented conflicts

### Spawned Work vs Parent Iteration

Spawned specialists (from GAPS_FOUND) have **separate** iteration counters:
- coverage-gap-analyzer iteration: 1
- Spawns: targeted-specialist (iteration: 0)
- targeted-specialist completes
- coverage-gap-analyzer re-evaluates (iteration stays 1)
- If still GAPS_FOUND: coverage-gap-analyzer iteration → 2

### Coverage Gap Specialist Spawning Limits

To prevent exponential specialist spawning:

| Limit | Value | On Exceed |
|-------|-------|-----------|
| Max specialists spawned per iteration | 3 | Document remaining gaps, do not spawn more |
| Max total specialists spawned (all iterations) | 5 | PROCEED with GAPS_DOCUMENTED, no more spawns |
| Max spawning rounds | 2 | After round 2, no more spawning regardless of gaps |

**Priority for spawning:** HIGH severity gaps first, then MEDIUM, skip LOW.

This prevents: Iteration 1 spawns 5 specialists, iteration 2 spawns 5 more = 10+ specialists.

---

## DEAL_METADATA FORMAT

```markdown
## DEAL_METADATA

| Field | Value |
|-------|-------|
| Matter Name | [project code name from query] |
| Deal Value | $[X]M |
| Closing Date | [YYYY-MM-DD] |
| Acquirer | [Company Name] |
| Target | [Company Name] |
| Transaction Type | [Asset Purchase/Stock Purchase/Merger] |
```

---

## SESSION DIRECTORY STRUCTURE

```
reports/[YYYY-MM-DD]-[timestamp]/
├── research-plan.md                   <- session-initialization
├── questions-presented.md             <- session-initialization
├── orchestrator-state.md              <- orchestrator (continuous)
│
├── specialist-reports/                <- specialist-research phase
│   ├── securities-researcher-report.md
│   ├── case-law-analyst-report.md
│   ├── cfius-national-security-analyst-report.md
│   ├── privacy-data-protection-analyst-report.md
│   ├── employment-labor-analyst-report.md
│   ├── tax-structure-analyst-report.md
│   ├── cybersecurity-compliance-analyst-report.md
│   ├── ai-governance-analyst-report.md
│   └── [other specialists...]
│
├── review-outputs/                    <- validation phase
│   ├── fact-registry.md               <- fact-validator
│   ├── conflict-report.md             <- fact-validator
│   ├── coverage-gaps.md               <- coverage-gap-analyzer
│   ├── risk-summary.json              <- risk-aggregator
│   ├── research-review-report.md      <- research-review-analyst
│   └── objectivity-review.md          <- research-review-analyst
│
├── section-reports/                   <- section-generation phase
│   ├── section-IV-A-*.md
│   ├── section-IV-B-*.md
│   └── [through section-IV-J-*.md]
│
├── qa-outputs/                        <- quality-assessment phase
│   ├── section-review-report.md       <- section-report-reviewer
│   ├── diagnostic-assessment.md       <- memo-qa-diagnostic
│   ├── remediation-plan.md            <- memo-qa-diagnostic
│   ├── final-qa-certificate.md        <- memo-qa-certifier
│   └── delivery-decision.md           <- memo-qa-certifier
│
├── remediation-outputs/               <- quality-assessment-remediation
│   └── [task outputs...]
│
├── executive-summary.md               <- memo-executive-summary-writer
├── consolidated-footnotes.md          <- citation-validator
├── final-memorandum.md                <- memo-final-synthesis
├── synthesis-state.json               <- memo-final-synthesis (recovery)
└── final-memorandum-v2.md             <- post-remediation (if needed)
```

---

## FILE NAMING RULES

| Agent Type | Output File | Format |
|------------|-------------|--------|
| Research specialists | `specialist-reports/[agent-name]-report.md` | Kebab-case |
| Section writers | `section-reports/section-IV-[letter]-[slug].md` | Section ID + slug |
| Validators | `review-outputs/[output-type].md` | Descriptive name |
| QA agents | `qa-outputs/[output-type].md` | Descriptive name |
| Synthesis | `final-memorandum.md` | Fixed name |

### Section Numbering Convention

- **Display format:** `IV.A` (dot notation) - used in document headers and cross-references
- **Filename format:** `IV-A` (hyphen notation) - used in file names (no dots allowed)
- Example: Section `IV.A` content is saved as `section-IV-A-cfius.md`

| Context | Format | Example |
|---------|--------|---------|
| Document headers | Dot notation | `## IV.A. CFIUS Analysis` |
| Cross-references | Dot notation | `See Section IV.A` |
| File names | Hyphen notation | `section-IV-A-cfius.md` |
| State file keys | Hyphen notation | `"items_complete": ["IV-A", "IV-B"]` |

### CRITICAL: File Naming Rules (Loop Prevention)

**Never mix formats. State files ALWAYS use hyphen notation.**

| Context | Format | Example | WRONG |
|---------|--------|---------|-------|
| State files | HYPHEN | `section-writer-state-IV-A.json` | `section-writer-state-IV.A.json` |
| Glob patterns | HYPHEN | `section-writer-state-IV-*.json` | `section-writer-state-IV.*.json` |
| Output files | HYPHEN | `section-IV-A-cfius.md` | `section-IV.A-cfius.md` |
| Document headers | DOT | `## IV.A. Corporate Structure` | N/A (display only) |
| JSON keys in arrays | HYPHEN | `["IV-A", "IV-B", "IV-C"]` | `["IV.A", "IV.B", "IV.C"]` |

**Why this matters:**
- Glob patterns `IV-*` will FAIL to match `IV.A` files
- State file lookups will return "file not found" for wrong format
- Recovery after compaction will restart from beginning instead of resuming

**Verification command:**
```bash
# Check for format violations in state files
grep -r "IV\.[A-Z]" {session}/*.json && echo "FORMAT ERROR: Found dot notation in state files"
```

---

## AGENT-TO-OUTPUT MAPPING

| Agent | Primary Output | Secondary Outputs |
|-------|----------------|-------------------|
| orchestrator | orchestrator-state.md | research-plan.md, questions-presented.md |
| cfius-national-security-analyst | cfius-national-security-analyst-report.md | - |
| privacy-data-protection-analyst | privacy-data-protection-analyst-report.md | - |
| [... all 17 specialists ...] | [specialist]-report.md | - |
| fact-validator | fact-registry.md | conflict-report.md |
| coverage-gap-analyzer | coverage-gaps.md | - |
| risk-aggregator | risk-summary.json | - |
| research-review-analyst | research-review-report.md | objectivity-review.md |
| memo-section-writer | section-IV-[X]-[slug].md | - |
| memo-executive-summary-writer | executive-summary.md | - |
| citation-validator | consolidated-footnotes.md | citation-issues.md |
| memo-final-synthesis | final-memorandum.md | synthesis-state.json |
| memo-qa-diagnostic | diagnostic-assessment.md | remediation-plan.md |
| memo-qa-certifier | final-qa-certificate.md | delivery-decision.md |

---

## CANONICAL FACT DEFINITION (v3.0)

> **CRITICAL:** This section ensures both the Creator (fact-validator) and Consumer (synthesis agents)
> use identical schema definitions for the Fact Registry.

### Required Fields for Each Canonical Fact

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `fact_id` | string | Unique identifier | `FACT-SEC-001` |
| `category` | enum | Legal domain | `securities`, `environmental`, `tax` |
| `statement` | string | The canonical fact | "Target filed 10-K on 2024-03-15" |
| `source_type` | enum | Authority level | `primary_source`, `expert_opinion`, `industry_standard` |
| `source_citation` | string | Full Bluebook citation | "Tesla, Inc., Annual Report (Form 10-K) 47 (Mar. 15, 2024)" |
| `confidence` | number | 0.0-1.0 | `0.95` |
| `verification_status` | enum | Validation state | `VERIFIED`, `ASSUMED`, `CONFLICTED` |
| `related_facts` | array | Cross-references | `["FACT-ENV-003", "FACT-TAX-012"]` |

### Fact Registry Schema (fact-registry.md)

```markdown
## FACT REGISTRY

### Securities Domain
| ID | Statement | Source | Confidence | Status |
|----|-----------|--------|------------|--------|
| FACT-SEC-001 | [statement] | [citation] | [0.0-1.0] | [status] |

### Environmental Domain
[... same structure ...]
```

### Usage Rules

| Agent | Role | Usage |
|-------|------|-------|
| `fact-validator` | **Creator** | Populate registry using this schema exactly |
| Synthesis agents | **Consumer** | Reference facts by ID; never paraphrase |
| All agents | Conflict Resolution | Document both values with `CONFLICTED` status |

---

## SPLIT PROMPT FILE INDEX

This system uses modular prompt files for maintainability. Here's how they relate:

| File | Purpose | Used By |
|------|---------|---------|
| `memorandum.md` | Main orchestrator documentation | Orchestrator, fallback for all agents |
| `memorandum-shared.md` | Common reference data | All agents via getMemoContext |
| `memorandum-orchestrator.md` | Orchestrator-specific phases | Orchestrator only |
| `memorandum-qa.md` | QA dimensions and scoring | memo-qa-diagnostic agent |
| `memorandum-synthesis/completion.md` | Completion requirements | memo-final-synthesis agent |
| `memorandum-synthesis/citations.md` | Citation standards | citation-validator agent |
| `memorandum-synthesis/state-file-schemas.md` | All state file schemas | All agents with state files |
| `memorandum-synthesis/formatting.md` | Output formatting rules | Section writers, synthesis |
| `memorandum-synthesis/memorandum-format.md` | Document structure | memo-final-synthesis |
| `memorandum-synthesis/legal-standards.md` | Legal analysis standards | Section writers |
| `memorandum-synthesis/roles.md` | Agent role definitions | All synthesis agents |
| `memorandum-synthesis/structure.md` | Memorandum structure | memo-final-synthesis |
| `research-review.md` | Orchestrator review phase protocol | research-review-analyst |

### Feature Flag
When `USE_SPLIT_PROMPTS=true`, agents load modular prompts via `getMemoContext()`.
When `USE_SPLIT_PROMPTS=false`, agents use full embedded prompts.

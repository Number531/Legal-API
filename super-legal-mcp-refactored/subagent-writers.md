# Parallel Memorandum Generation: Final Implementation Plan

## Executive Summary

**Goal**: Improve memorandum quality through context isolation using parallel general-purpose section writers.

**Key Design Decisions** (User-confirmed):
- General-purpose section writers (not domain-specific) - adapts to any prompt
- Priority: **Quality** through focused context per section
- Local footnote numbering, renumbered during synthesis
- Dedicated Executive Summary writer subagent

**Anthropic Best Practice Alignment** (Dec 2025):
- Multi-agent outperforms single-agent by 90.2% (Anthropic Engineering)
- Context isolation prevents drift in long documents
- Synthesis step critical after parallel work
- Dynamic task decomposition (Cookbook pattern)

---

## Research Findings

### Anthropic Official Guidance (December 2025)

**From "How we built our multi-agent research system" (Anthropic Engineering)**:
- Multi-agent Opus 4 + Sonnet 4 subagents **outperformed single-agent by 90.2%** on research evals
- Token usage explains **80% of performance variance**
- Subagents provide **context isolation** - the big win, not just speed
- "Even generally-intelligent agents face limits when operating as individuals; groups of agents can accomplish far more."

**From Claude Agent SDK Best Practices**:
1. Orchestrator + single-responsibility subagents pattern
2. Context isolation prevents drift
3. **Synthesis step is critical** after parallel work
4. Progressive saves protect against token limits

**From Anthropic Cookbook orchestrator_workers.ipynb**:
- Parallel execution for independent tasks
- Model selection: Opus for orchestrator, Sonnet/Haiku for workers
- Synthesis phase where orchestrator combines worker outputs
- Dynamic task decomposition (not pre-defined templates)

---

## Current vs. Proposed Architecture

### Current Architecture (Bottleneck Identified)
```
User Query
    ↓
Orchestrator → Creates research-plan.md
    ↓
8 Domain Specialists (PARALLEL) → Each saves domain report
    ↓
research-review-analyst → Quality gate
    ↓
Orchestrator → Synthesizes final-memorandum.md  ← BOTTLENECK
```

**Current bottleneck**: Single agent writes entire 60-120KB memorandum
- Hits 32K output token limits → triggers auto-continuation
- Context rot during long generation
- Sequential section writing (slow)

---

## Final Architecture

### Phase 1: Research (Existing - No Changes)
```
User Query → Orchestrator → 8 Domain Specialists (PARALLEL) → research-review-analyst
```

### Phase 2: Section Generation (NEW - PARALLEL)
```
                    Orchestrator (Opus/Sonnet)
                          ↓
    Analyzes research-plan.md, determines section assignments
    Creates section prompts + SHARED CONTEXT BRIEF (key findings summary)
                          ↓
    ┌─────────┬─────────┬─────────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓         ↓         ↓
 Section   Section   Section   Section   Section   Section
 Writer    Writer    Writer    Writer    Writer    Writer
   #1        #2        #3        #4        #5        #6
(Sonnet)  (Sonnet)  (Sonnet)  (Sonnet)  (Sonnet)  (Sonnet)
    ↓         ↓         ↓         ↓         ↓         ↓
    └─────────┴─────────┴─────────┴─────────┴─────────┘
                          ↓
    Each saves: reports/[session]/sections/section-[N].md
    Uses local footnotes + CROSS-REF PLACEHOLDERS
```

**General-Purpose Section Writer** behavior:
- Receives: Section topic, relevant specialist reports, **SHARED CONTEXT BRIEF**
- Reads: ONLY the specialist reports relevant to their section (focused context)
- Writes: 3-8K words with Bluebook citations, local footnote numbering
- **CROSS-REF PLACEHOLDERS**: `[XREF:DOMAIN → IMPACT: description]`
- Saves: `reports/[session]/sections/[section-slug].md`
- Returns: Brief summary + HIGH severity findings + file path

### Phase 3: Cross-Domain Integration (NEW - SEQUENTIAL)
```
            Interdisciplinary Integration Agent (Opus)
                          ↓
    Reads ALL section files from session/sections/
                          ↓
    ┌─────────────────────────────────────────────────┐
    │ 1. Collect all HIGH severity findings           │
    │ 2. Resolve [XREF] placeholders with citations   │
    │ 3. Write Cross-Reference Matrix                 │
    │ 4. Add Cross-Section Impact statements          │
    │ 5. Ensure legal doctrine connections            │
    │ 6. Save cross-references.md + edit sections     │
    └─────────────────────────────────────────────────┘
                          ↓
    Each section now has resolved cross-references
    Cross-Reference Matrix ready for assembly
```

**Why This Solves Interdisciplinary Analysis**:
- Section writers leave PLACEHOLDERS for cross-references they can't resolve
- Integration agent has FULL visibility across all sections
- Cross-Reference Matrix built AFTER all section content exists
- Legal doctrine connections added with proper citations

### Phase 4: Executive Summary (NEW - DEDICATED)
```
                Executive Summary Writer (Opus)
                          ↓
    Reads all section files + cross-references.md
    Synthesizes 2,000-5,000 word Board Briefing
    Creates risk matrix, key findings, recommendations
                          ↓
    Saves: reports/[session]/sections/executive-summary.md
```

### Phase 5: Synthesis & Assembly (NEW - SEQUENTIAL)
```
                Synthesis Agent (Sonnet)
                          ↓
    ┌─────────────────────────────────────────────────┐
    │ 1. Read all section files in order              │
    │ 2. Renumber footnotes sequentially (1-400)      │
    │ 3. Insert Cross-Reference Matrix                │
    │ 4. Write section transitions                    │
    │ 5. Add document headers/footers                 │
    │ 6. Assemble into final-memorandum.md            │
    └─────────────────────────────────────────────────┘
                          ↓
    Saves: reports/[session]/final-memorandum.md
```

---

## Handling Interdisciplinary Analysis (CRITICAL)

### The Problem
The current `memorandum.md` requires extensive cross-domain analysis:
- **Cross-Reference Matrix**: Maps findings across all 10 legal domains
- **33+ Cross-Reference Patterns**: e.g., Environmental → Securities → MAE
- **Cross-Section Impact**: Required for every HIGH severity finding
- **Validation**: "Every HIGH severity finding has cross-references to at least 2 other sections"

### The Solution: Three-Layer Approach

#### Layer 1: Shared Context Brief (Before Section Writing)
The orchestrator creates a **SHARED CONTEXT BRIEF** summarizing:
- All HIGH severity findings from specialist reports
- Key entities and their cross-domain exposure
- Identified legal doctrines that span multiple domains
- Materiality thresholds and penalty benchmarks

Each section writer receives this brief, enabling them to:
- Reference other domain findings they know about
- Leave `[XREF]` placeholders for connections they can't fully resolve

#### Layer 2: Cross-Reference Placeholders (During Section Writing)
Section writers use standardized placeholders:
```markdown
[XREF:SECURITIES → CFIUS: 12 quarters RCRA violations constitute "known trend" under Item 303]
[XREF:MAE → ENVIRONMENTAL: Creates buyer leverage per Akorn standard]
[XREF:EMPLOYMENT → ANTITRUST: Non-compete scope may raise HSR concerns]
```

These placeholders signal interdisciplinary connections without requiring the section writer to have full context of other sections.

#### Layer 3: Integration Agent Resolution (After All Sections Complete)
The **Interdisciplinary Integration Agent** (Opus model for complex reasoning):

1. **Collects** all HIGH severity findings from all sections
2. **Resolves** all `[XREF]` placeholders with proper legal citations
3. **Writes** the Cross-Reference Matrix per the 33+ patterns in memorandum.md
4. **Injects** Cross-Section Impact statements into each section
5. **Validates** that every HIGH severity finding has 2+ cross-references

**Example Resolution**:
```markdown
# Before (section writer placeholder):
[XREF:SECURITIES → CFIUS: RCRA violations trigger Item 303 disclosure]

# After (integration agent resolution):
**CROSS-SECTION IMPACT**: This environmental compliance finding directly affects:
- **Section IV.G (Securities Analysis)**: 12 quarters of RCRA violations constitutes
  a "known trend" under Item 303 of Regulation S-K, meaning it cannot be excluded
  from MAE through the "disclosed matters" carve-out per *Akorn, Inc. v. Fresenius
  Kabi AG*, 2018 Del. Ch. LEXIS 325
- **Contract Provision Article 10.1(a) (MAE Definition)**: Creates buyer leverage
  to narrow environmental exceptions, requiring Target to accept carve-out for
  "known environmental violations"
```

### Cross-Reference Pattern Coverage

The Integration Agent applies all patterns from `memorandum.md`:

| Category | Patterns | Example |
|----------|----------|---------|
| Transactional (M&A) | 1-7 | Environmental → Securities → MAE |
| Litigation | L1-L5 | Claims → Evidence → Summary Judgment |
| Regulatory | R1-R5 | Violation → Investigation → Expanded Scope |
| General Corporate | G1-G5 | Compliance Gap → Board Knowledge → Caremark |

### Why This Architecture Works

| Challenge | Solution |
|-----------|----------|
| Section writers lack cross-domain context | Shared Context Brief + Placeholders |
| Cross-Reference Matrix needs all findings | Integration Agent runs AFTER all sections |
| Legal doctrine connections need citations | Opus model with legal reasoning |
| Footnote numbering for cross-references | Added during synthesis phase |

---

## Implementation Steps

### Step 1: Create General-Purpose Section Writer Subagent
**File**: `src/config/legalSubagents.js`

Add new subagent definition:
```javascript
'memo-section-writer': {
  description: `General-purpose memorandum section writer.
    Invoked by orchestrator with specific section assignment.
    Reads relevant specialist reports, writes one section with local footnotes.`,

  prompt: `You are a Legal Memorandum Section Writer...
    [Section-specific prompt template with dynamic placeholders]
    - Read ONLY the specialist reports provided
    - Write your assigned section (3-8K words)
    - Use local footnote numbering (1, 2, 3...)
    - Save to the specified path
    - Return summary to orchestrator`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet'
}
```

### Step 2: Create Interdisciplinary Integration Agent
**File**: `src/config/legalSubagents.js`

```javascript
'memo-integration-agent': {
  description: `Handles cross-domain analysis after all sections complete.
    Resolves [XREF] placeholders, writes Cross-Reference Matrix,
    injects Cross-Section Impact statements.`,

  prompt: `You are an Interdisciplinary Legal Integration Specialist.

## Your Role
After all section writers complete, you integrate cross-domain analysis:

1. **Collect HIGH Severity Findings**:
   - Read all section files from session/sections/
   - Extract all findings marked HIGH or CRITICAL severity
   - Build a master list of cross-domain exposure

2. **Resolve [XREF] Placeholders**:
   Find all placeholders like:
   [XREF:SECURITIES → CFIUS: RCRA violations trigger Item 303]

   Replace with full Cross-Section Impact statements:
   **CROSS-SECTION IMPACT**: This [category] finding directly affects:
   - **Section [X.Y] ([category])**: [Analysis with legal citation]
   - **Contract Provision [Article]**: [Transaction structure impact]
   - **Disclosure Obligation under [rule]**: [Consequence statement]

3. **Write Cross-Reference Matrix**:
   Create the matrix table per memorandum.md format:
   | Finding | Source Section | Impacts Section(s) | Legal Doctrine | Contract Provision |

4. **Apply Cross-Reference Patterns**:
   - Transactional: Patterns 1-7 (Environmental → Securities → MAE)
   - Litigation: Patterns L1-L5 (Claims → Evidence → Summary Judgment)
   - Regulatory: Patterns R1-R5 (Violation → Investigation → Expanded)
   - Corporate: Patterns G1-G5 (Compliance Gap → Board → Caremark)

5. **Validate Completeness**:
   - Every HIGH severity finding has 2+ cross-references
   - Every transaction-affecting finding links to contract provisions
   - All legal doctrine connections have case citations

## Output
- Edit each section file to resolve placeholders
- Save cross-references.md with the Cross-Reference Matrix
- Return validation summary to orchestrator`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'opus'  // Complex cross-domain reasoning
}
```

### Step 3: Create Executive Summary Writer Subagent
**File**: `src/config/legalSubagents.js`

```javascript
'memo-executive-summary-writer': {
  description: `Writes Board Briefing / Executive Summary.
    Reads all section files + cross-references and synthesizes summary.`,

  prompt: `You are an Executive Summary Writer...
    - Read all section files from session directory
    - Read cross-references.md for interdisciplinary connections
    - Synthesize key findings across all domains
    - Write 2,000-5,000 word Board Briefing
    - Include risk matrix and recommendations
    - Reference cross-domain impacts in executive summary`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'opus'  // Higher intelligence for cross-domain synthesis
}
```

### Step 4: Final Assembly (Orchestrator Direct)
**No separate subagent** — the orchestrator handles assembly directly using `memorandum.md` as its system prompt.

This avoids instruction duplication and ensures the final memorandum follows the exact format specified in `memorandum.md`.

The orchestrator will:
- Read all section files in order
- Renumber footnotes sequentially (1 through N)
- Resolve [XREF] placeholders
- Add transitions between sections
- Assemble `final-memorandum.md`

### Step 5: Update Orchestration Logic
**File**: `src/config/legalSubagents.js` (SUBAGENT_SYSTEM_PROMPT_SECTION)

Update orchestrator instructions to include new memorandum generation workflow:

```markdown
## MEMORANDUM GENERATION PROTOCOL (After Research Complete)

**STEP 7: Generate Memorandum Sections (PARALLEL)**
After research-review-analyst returns PROCEED:

1. Analyze research-plan.md to determine section assignments
2. For each major section, spawn `memo-section-writer` with:
   - Section topic and scope
   - Paths to relevant specialist reports
   - Output path: `reports/[session]/sections/[section-slug].md`
3. Maximum 6-8 section writers in parallel
4. Each uses local footnote numbering (1, 2, 3...)

**STEP 8: Cross-Domain Integration**
After all section writers complete:
1. Spawn `memo-integration-agent`
2. Resolves all [XREF] placeholders across sections
3. Writes Cross-Reference Matrix
4. Injects Cross-Section Impact statements
5. Wait for completion

**STEP 9: Generate Executive Summary**
After integration complete:
1. Spawn `memo-executive-summary-writer`
2. Provide all section file paths + cross-references.md
3. Wait for completion

**STEP 10: Assemble Final Memorandum (Orchestrator Direct)**
The orchestrator handles assembly directly (no separate subagent):
1. Read all section files in order
2. Renumber footnotes sequentially (1 through N)
3. Resolve [XREF] placeholders, add transitions
4. Output: `reports/[session]/final-memorandum.md`
```

### Step 6: Create Section File Structure
**Directory structure for each session**:
```
reports/[YYYY-MM-DD]-[timestamp]/
├── research-plan.md
├── [specialist reports...]
├── sections/                    ← NEW
│   ├── section-01-cfius.md
│   ├── section-02-privacy.md
│   ├── section-03-cyber.md
│   ├── section-04-ip.md
│   ├── section-05-employment.md
│   ├── section-06-commercial.md
│   ├── section-07-antitrust.md
│   ├── section-08-tax.md
│   └── executive-summary.md
├── cross-references.md          ← NEW (from integration agent)
└── final-memorandum.md
```

### Step 7: Add Footnote Renumbering Utility
**File**: `src/utils/footnoteRenumberer.js` (NEW)

```javascript
/**
 * Renumbers footnotes across multiple section files sequentially
 * Input: Array of section file contents with local footnotes
 * Output: Combined content with footnotes 1-N
 */
export function renumberFootnotes(sections) {
  let globalFootnoteNum = 0;
  const renumberedSections = [];
  const allFootnotes = [];

  for (const section of sections) {
    const { content, footnotes, mapping } = extractAndRenumber(
      section.content,
      globalFootnoteNum
    );
    renumberedSections.push(content);
    allFootnotes.push(...footnotes);
    globalFootnoteNum += footnotes.length;
  }

  return { sections: renumberedSections, footnotes: allFootnotes };
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/config/legalSubagents.js` | Add 3 new subagents: `memo-section-writer`, `memo-integration-agent`, `memo-executive-summary-writer` (orchestrator handles final assembly directly) |
| `src/config/legalSubagents.js` | Update SUBAGENT_SYSTEM_PROMPT_SECTION with memorandum generation protocol |
| `src/utils/footnoteRenumberer.js` | NEW: Footnote renumbering utility |
| `prompts/memorandum.md` | Add section writer instructions template |

---

## Expected Benefits

| Metric | Current (Single Agent) | New (Parallel Writers) |
|--------|------------------------|------------------------|
| Context per section | Full 100K+ context | 15-25K focused context |
| Token limit hits | Frequent (auto-continuation) | Rare (sections are small) |
| Quality drift | High (context rot) | Low (isolated contexts) |
| Generation time | ~45 min sequential | ~15 min parallel |
| Coherence | Degrades toward end | Consistent throughout |

---

## Rollout Strategy

1. **Phase 1**: Implement section writer subagent (general-purpose)
2. **Phase 2**: Test with 2-3 sections manually assigned
3. **Phase 3**: Add executive summary writer
4. **Phase 4**: Add synthesis/assembly agent
5. **Phase 5**: Full integration with orchestrator auto-assignment

---

## Sources

- **Anthropic Engineering**: "How we built our multi-agent research system" (Jun 2025)
  - https://www.anthropic.com/engineering/multi-agent-research-system

- **Anthropic Cookbook**: orchestrator_workers.ipynb pattern
  - https://github.com/anthropics/anthropic-cookbook/blob/main/patterns/agents/orchestrator_workers.ipynb

- **Claude Agent SDK Best Practices** (Dec 2025)
  - https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
  - https://www.anthropic.com/engineering/claude-code-best-practices

- **DeepWiki**: Agent System & Subagents documentation
  - https://deepwiki.com/anthropics/claude-code/3.8-agent-system-and-subagents

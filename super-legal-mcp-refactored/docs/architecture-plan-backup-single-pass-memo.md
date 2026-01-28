# Architecture Analysis: Single-Pass vs Multi-Stage Memo Generation

> **BACKUP FILE** - Original plan from `/Users/ej/.claude/plans/quiet-splashing-candle.md`
> Created: 2025-12-25
> Purpose: Enable reversion if single-pass implementation is unsuccessful

## Executive Summary

Evaluating whether to consolidate the current 7-stage memo generation pipeline into a single-pass generator using Sonnet 4.5's 1M context window.

---

## Current Architecture (Multi-Stage)

```
Research Reports (17×)
    ↓
memo-section-writer (×10-15 parallel)  ← Writes sections with [XREF] placeholders
    ↓
memo-integration-agent                  ← Reads all sections, creates cross-reference matrix
    ↓
memo-xref-resolver                      ← Replaces [XREF:...] placeholders
    ↓
memo-executive-summary-writer           ← Reads all sections, writes Board Briefing
    ↓
Orchestrator                            ← Assembles final memo, renumbers footnotes
    ↓
memo-qa-evaluator                       ← Quality assessment
```

**Subagent invocations per session:** 14-19 memo subagents + QA

---

## Developer Perspective: Redundant Generation Analysis

### Content Duplication Identified

| Stage | What It Reads | What It Writes | Duplication |
|-------|---------------|----------------|-------------|
| Research Specialists | Raw data | Reports with 2-5K word Executive Summaries | Original content |
| Section Writers (×10-15) | 2-3 reports each | 4-6K word sections | **Re-synthesizes report content** |
| Integration Agent | All sections | Cross-reference matrix | **Re-reads all sections** |
| XREF Resolver | All sections + matrix | Edited sections | **Re-reads and re-writes all sections** |
| Executive Summary Writer | All sections | 4-5K word summary | **Re-reads all sections** |
| Orchestrator | All sections | Assembled memo + renumbered footnotes | **Re-reads all sections** |
| QA Evaluator | Final memo | Assessment | Necessary final pass |

### Token Cost Analysis

**Current (Multi-Stage):**
- Section writers: 10-15 × (input ~25K + output ~8K + thinking ~4K) = **370-555K tokens**
- Integration: input ~80K + output ~20K + thinking ~4K = **104K tokens**
- XREF Resolver: input ~80K + output ~80K (edits) = **160K tokens**
- Exec Summary: input ~80K + output ~6K + thinking ~4K = **90K tokens**
- Orchestrator: input ~100K + output ~120K = **220K tokens**
- **Total memo generation: ~944K-1.1M tokens**

**Single-Pass (1M Context):**
- Input: 17 reports × 10K = **170K tokens**
- Output: 85K words ≈ **100K tokens**
- **Total: ~270K tokens** (with thinking disabled)

**Potential savings: 70-75% token reduction**

### Redundancy Issues

1. **Section writers duplicate research synthesis** - Research specialists already wrote executive summaries; section writers re-synthesize the same content
2. **Four consecutive "read all sections" passes** - Integration, XREF resolver, Exec Summary, Orchestrator each read the same content
3. **Footnote renumbering is post-hoc** - Could be done correctly the first time with unified generation
4. **[XREF] placeholder system adds complexity** - Requires two agents (integration + resolver) to accomplish what one agent with full context could do natively

---

## Legal Team Perspective: Quality & Compliance Analysis

### Why Multi-Stage Was Originally Chosen

From `legalSubagents.js` lines 1136-1144:

| Metric | Single Agent (Old) | Parallel Writers |
|--------|-------------------|------------------|
| Context per section | 100K+ (compacted 5-10x) | 15-25K (focused) |
| Quality consistency | **Degrades toward end** | Uniform throughout |
| Cross-reference accuracy | Based on compressed context | Based on full sections |
| Generation time | ~45 min sequential | ~15 min parallel |

**Original problem:** With 200K context limit, a single agent couldn't hold all research AND generate a complete 60-85K word memo without severe context compression, leading to quality degradation in later sections.

### How 1M Context Changes This

**Before (200K limit):**
- Research reports: ~170K tokens
- Remaining for output: ~30K tokens
- **Result:** Must compress/summarize, losing detail

**Now (1M context):**
- Research reports: ~170K tokens
- Available for output: **830K tokens**
- Complete memo: ~100K tokens
- **Headroom: 730K tokens** - No compression needed

### Quality Implications

| Factor | Multi-Stage | Single-Pass (1M) |
|--------|-------------|------------------|
| **Cross-references** | Placeholder system, two-agent resolution | Native references, single coherent voice |
| **Footnote numbering** | Local → global renumbering | Global from start, no renumbering errors |
| **Voice consistency** | 10-15 different "voices" per section | Unified voice throughout |
| **Cross-section awareness** | Requires explicit integration pass | Agent sees all sections simultaneously |
| **Error recovery** | Can re-run individual section | Must restart entire memo (mitigated by checkpointing) |

### Compliance with memorandum.md Requirements

**60,000-85,000 words requirement:**
- Single agent can generate this within 1M context
- Progressive save pattern already exists (REPORT_SAVING_INSTRUCTIONS)
- Auto-continuation system handles token limit edge cases

**250-400 footnotes requirement:**
- Single agent can maintain global counter
- No risk of renumbering errors

**Cross-Reference Matrix requirement:**
- Single agent writes matrix as it goes OR at end with full visibility
- No [XREF] placeholder needed

**Bluebook citation format:**
- Same requirements apply regardless of architecture
- Single agent maintains consistent citation style

---

## Proposed Simplified Architecture

```
Research Reports (17×)
    ↓
memo-generator (1M context, Sonnet 4.5)  ← Single-pass complete memo
    ↓
xref-review-agent (optional QA)           ← Validates cross-references
    ↓
memo-qa-evaluator                         ← Quality assessment
```

**Subagent invocations:** 2-3 (vs 14-19 current)

### New memo-generator Subagent

```javascript
'memo-generator': {
  description: `Single-pass legal memorandum generator using 1M context.
    Reads ALL research specialist reports simultaneously.
    Writes complete memorandum with native cross-references.
    Uses global footnote numbering from start.
    MUST BE USED after research-review-analyst returns PROCEED.`,

  prompt: `You are a Legal Memorandum Generator with 1M token context.

    ## Your Role
    - Read ALL research specialist reports (17+ domains)
    - Generate complete legal memorandum in a single coherent pass
    - Write native cross-references (no placeholders)
    - Use global footnote numbering (1, 2, 3... through 250-400)

    ## Output Requirements (from memorandum.md)
    - 60,000-85,000 words total
    - 250-400 Bluebook footnotes
    - Board Briefing (4,000-5,000 words, no footnotes)
    - 10 Detailed Analysis sections (4,000-6,000 words each)
    - Cross-Reference Matrix
    - Scenario Analysis (base/downside/severe)

    ## Progressive Save Pattern
    [Include REPORT_SAVING_INSTRUCTIONS adapted for memo]

    ## Cross-Reference Format (Native - No Placeholders)
    Write cross-references directly:
    "See Section IV.G (Securities Analysis) at pp. 45-47..."
    NOT: "[XREF:ENVIRONMENTAL → SECURITIES: ...]"

    ## Constraints
    - Save progressively to reports/[session]/final-memorandum.md
    - Use Edit tool to append sections as completed
    - Generate ALL footnotes (no truncation)
    - Complete ALL sections before returning`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',  // Sonnet 4.5 with 1M context beta
  thinking: { type: 'disabled' }  // Cost control
}
```

### Converted xref-review-agent

```javascript
'xref-review-agent': {
  description: `Post-generation cross-reference validator.
    Runs AFTER memo-generator completes.
    Validates existing cross-references, suggests additions.
    Does NOT use placeholder system.`,

  prompt: `You are a Cross-Reference Quality Reviewer.

    ## Your Role
    - Read completed final-memorandum.md
    - Validate all cross-section references are accurate
    - Identify missing cross-references between domains
    - Suggest additions (do not insert without orchestrator approval)

    ## Validation Checklist
    - Every HIGH severity finding has cross-section impact statement
    - Page/section references are accurate
    - No orphaned references (pointing to non-existent sections)
    - Cross-Reference Matrix is complete

    ## Output
    Save review to: reports/[session]/xref-review.md
    Return: PASS (no issues) or REVIEW (issues found with locations)`,

  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

---

## Trade-off Analysis

### Advantages of Single-Pass

| Factor | Benefit |
|--------|---------|
| **Token cost** | 70-75% reduction (~270K vs ~1M tokens) |
| **Subagent invocations** | 2-3 vs 14-19 |
| **Voice consistency** | Unified throughout |
| **Cross-references** | Native, no placeholders |
| **Footnotes** | Global numbering, no renumbering pass |
| **Complexity** | Simpler pipeline, fewer failure modes |
| **Latency** | Faster (no sequential stages) |

### Disadvantages of Single-Pass

| Factor | Risk | Mitigation |
|--------|------|------------|
| **Single point of failure** | If generation fails, restart entire memo | Progressive save pattern; checkpoints every section |
| **No parallel execution** | Can't use 6-8 writers simultaneously | 1M context makes parallel unnecessary; single pass is faster than coordinating parallel |
| **Debugging harder** | Can't isolate which "section writer" failed | Progressive saves show exactly where failure occurred |
| **Output token limit** | 64K output limit may truncate | Auto-continuation system already handles this |
| **Memory pressure** | 1M context may stress model | 270K actual usage is well under limit |

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Truncation at 64K output | Medium | High | Auto-continuation (already implemented) |
| Quality degradation in late sections | Low | Medium | 1M context eliminates compression that caused this |
| Cross-reference errors | Low | Medium | xref-review-agent validates post-generation |
| Complete generation failure | Low | High | Progressive saves allow resumption from checkpoint |

---

## Implementation Recommendation

### Phase 1: Create memo-generator Subagent
- Add new subagent definition with 1M context
- Include progressive save pattern
- Disable thinking for cost control

### Phase 2: Convert xref-resolver to xref-review-agent
- Change from "resolver" (construction) to "reviewer" (validation)
- Remove [XREF] placeholder logic
- Add validation checklist

### Phase 3: Update SUBAGENT_SYSTEM_PROMPT_SECTION
- Replace STEPs 7-12 with single memo-generator invocation
- Keep STEP 13 (self-review) and STEP 14 (QA)
- Add optional xref-review step

### Phase 4: Remove Deprecated Subagents
- Remove: memo-section-writer, memo-integration-agent, memo-xref-resolver
- Keep: memo-executive-summary-writer (can be absorbed into memo-generator OR kept for targeted regeneration)

### Phase 5: Update Workflow Documentation
- Update session directory structure
- Simplify verification checks
- Update remediation protocol

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/config/legalSubagents.js` | Add memo-generator, convert xref-resolver to xref-review-agent, remove section writers |
| `src/config/legalSubagents.js` | Update SUBAGENT_SYSTEM_PROMPT_SECTION STEPs 7-12 |
| `prompts/memorandum.md` | No changes needed (output requirements unchanged) |

---

## Decision Required

**Proceed with single-pass memo-generator architecture?**

- **YES**: Implement phases 1-5, reduce token cost by 70-75%
- **NO**: Keep multi-stage architecture, accept higher token cost for modularity
- **HYBRID**: Keep memo-generator for generation, retain section writers for targeted section regeneration on failure

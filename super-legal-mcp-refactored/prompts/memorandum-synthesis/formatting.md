# OUTPUT FORMATTING REQUIREMENTS

## CROSS-REFERENCE HANDLING

### During Section Generation (Parallel Writers)

Section writers run in parallel and cannot know final section numbers. Use this protocol:

**If target section is KNOWN (in orchestrator-provided list):**
- Write native format: `See Section IV-X (Domain Name)`

**If target section is UNKNOWN (not yet written):**
- Use domain reference: `See the Securities Analysis section for Item 303 analysis`
- memo-final-synthesis will convert to final section numbers

### During Final Assembly (memo-final-synthesis)

Convert domain references to native cross-references:
1. Build section index from all section files
2. Find domain references ("See the [Domain] section")
3. Replace with native format: `See Section IV-X (Domain) at §Y.Z`
4. Verify all cross-references resolve to actual sections

### Cross-Reference Format

**CORRECT:**
```
See Section IV-G (Securities Analysis) §2.1, analyzing Item 303 disclosure obligations.
```

**ACCEPTABLE (during parallel generation):**
```
See the Securities Analysis section for Item 303 disclosure analysis.
```

**INCORRECT (placeholder format):**
```
[XREF:Securities→Disclosure] or See Section [TBD]
```

### Example Native Cross-References

> *See* Section IV.G (Securities Analysis) S2.1, analyzing Item 303 disclosure obligations triggered by the environmental violations discussed above.

> The RCRA violations identified in Section IV.J (Environmental) constitute a "known trend" under Item 303 of Regulation S-K, creating additional securities disclosure obligations per *Akorn, Inc. v. Fresenius Kabi AG*, 2018 Del. Ch. LEXIS 325.

---

## Output Cleanliness Requirements

### PROHIBITED META-COMMENTARY:
- "I'll now synthesize..." / "Let me now provide..."
- "Based on the conversation..." / "Based on my review..."
- "Document Status:" / "Completion Status:"
- Word counts, line counts as status updates

**CRITICAL RULE:** Document output must contain ONLY legal content.

### First Line Requirements
- First line of output should be "PRIVILEGED AND CONFIDENTIAL" or document header
- NOT meta-commentary like "I'll now generate..."

---

## Executive Summary Format (Gold Standard - Decision-Focused)

The executive summary is a **constrained, decision-focused document** for board-level readers.

### Format Constraints

| Constraint | Requirement |
|------------|-------------|
| **Target Range** | 2,500-3,500 words |
| **Acceptable Range** | 2,000-4,000 words (no penalty) |
| **Extended Range** | 4,001-5,000 words (-1% per 500 words, requires justification) |
| **Maximum** | 5,000 words (hard limit) |
| **Tone** | Factual, objective, decision-focused, jargon-free |
| **Quantification** | Dollar figures, percentages, and probabilities throughout |

### Word Count Guidance

| Word Count | Status | QA Impact |
|------------|--------|-----------|
| 2,500-3,500 | Target | No penalty |
| 2,000-2,499 | Acceptable (brief) | No penalty |
| 3,501-4,000 | Acceptable (detailed) | No penalty |
| 4,001-4,500 | Extended | -1% (requires justification in state file) |
| 4,501-5,000 | Extended | -2% (requires justification in state file) |
| >5,000 | Exceeds maximum | REJECTED - must reduce |

### Executive Summary Structure

```markdown
# EXECUTIVE SUMMARY & BOARD BRIEFING

## I. TRANSACTION RECOMMENDATION

**Recommendation**: PROCEED WITH CONDITIONS

**Risk Rating**: [HIGH/MEDIUM/LOW] - [2-sentence rationale]

**Critical Conditions**:
1. CBA resolution before closing - See **Section IV.F S3.2**
2. CFIUS clearance - See **Section IV.A S2.1**

---

## I.B. BRIEF ANSWERS TO QUESTIONS PRESENTED

| Q# | Question (Abbreviated) | Answer | Rationale | Section |
|----|------------------------|--------|-----------|---------|
| 1 | Under CFIUS, is filing mandatory? | **Probably Yes** | Foreign ownership >25% triggers mandatory review | IV.A |

**Answer Scale:**
- **Yes** - High confidence based on clear legal authority
- **Probably Yes** - More likely than not, but uncertainty exists
- **Uncertain** - Genuine legal uncertainty, split authority
- **Probably No** - More likely not, but risk remains
- **No** - High confidence in negative answer

---

## II. CRITICAL ISSUES MATRIX

| # | Issue | Severity | Exposure | Section Reference |
|---|-------|----------|----------|-------------------|
| 1 | CBA expiration during closing | HIGH | $47-89M | Section IV.F S3.2 |
```

**Note:** Executive summary is 2,500-3,500 words of SYNTHESIS, not repetition. Every sentence should inform the go/no-go decision.

---

## Advisory Language Mandate

Present findings with source attribution throughout. You are providing **legal research and analysis, not binding legal advice.**

### Recommendations Guidance

The "E. Recommendations" subsection IS required in each section. Write recommendations as:

**CORRECT (Research-based, conditional):**
- "Based on [authority], the legal standard suggests [action] when [condition]"
- "Given the [X]% probability of [outcome] per [source], consider [action]"
- "The precedent in [case] indicates that [action] would [outcome]"

**INCORRECT (Advisory, binding):**
- "You should..." or "We recommend..."
- "The client must..." or "It is required that..."
- "We advise..." or "Our recommendation is..."

### Distinction

| Type | Acceptable? | Example |
|------|-------------|---------|
| Conditional recommendation | YES | "If CFIUS filing is required, timeline suggests [action]" |
| Research-based suggestion | YES | "Based on Akorn precedent, [condition] may trigger [outcome]" |
| Binding advice | NO | "You must file with CFIUS" |
| Direct recommendation | NO | "We recommend filing with CFIUS" |

The recommendations subsection presents **legal options with supporting authority**, not binding advice.

### REQUIRED ADVISORY LANGUAGE PATTERNS:
- "Based on [specific case/statute], the applicable standard is..."
- "Per [case name], the court established that..."
- "According to [statute], the requirement is..."
- "Research indicates that under [authority]..."

### LANGUAGE TO AVOID:
- "You are required to..." (implies direct legal advice)
- "We recommend..." (implies advisory relationship)
- "Your legal obligation is..." (implies direct representation)

# LEGAL STANDARDS & REQUIREMENTS

## FACT REGISTRY DEPENDENCY (CRITICAL)

All agents generating memorandum content MUST use canonical values from the Fact Registry.

### Prerequisite
**fact-registry.md is created by fact-validator agent (V2 phase).**
- fact-validator MUST complete before section writers start
- If fact-registry.md does not exist, return `MISSING_COMPONENTS` status
- Do NOT proceed with default/assumed values

### Usage Protocol
1. **BEFORE writing any section:** Read `review-outputs/fact-registry.md`
2. **For ANY quantified value:** Cross-check against Fact Registry
3. **If value conflicts:** Use Fact Registry value, NOT specialist report value
4. **If value missing:** Flag in state file, use [ASSUMED:...] tag

### Validation Statement (Required in each section)

Include at bottom of each section:
```
**Fact Registry Verification**: All quantified values in this section verified against
fact-registry.md as of [timestamp]. Values used: [list key values and their sources].
```

### If fact-registry.md Does Not Exist

```json
{
  "status": "MISSING_COMPONENTS",
  "missing": ["review-outputs/fact-registry.md"],
  "reason": "fact-validator (V2) must complete before section generation",
  "action": "Orchestrator must run V2 phase first"
}
```

### Fact Consistency Rules
| Scenario | Action |
|----------|--------|
| Fact in registry | Use registry value exactly |
| Fact not in registry | Extract from specialist report, note as unverified |
| Conflicting values | Use registry value, note conflict exists |
| CONFLICTED status | Document both values, explain uncertainty |

### Edge Case: Partial Conflicts

When fact-registry has a RANGE but specialist report has a POINT value:

| Registry Value | Specialist Value | Action |
|----------------|------------------|--------|
| $45M-$50M | $47M | Use $47M (within range) - no conflict |
| $45M-$50M | $52M | **CONFLICT**: Document both, use registry range |
| $45M-$50M | $55M-$60M | **CONFLICT**: Document both ranges, flag for review |

**Rule**: If specialist value falls WITHIN registry range, use specialist value (more precise). If OUTSIDE range, flag as conflict.

### Edge Case: Multiple Specialist Reports (No Registry)

If fact-registry.md does not exist AND multiple specialist reports have conflicting values:

**Tiebreaker Hierarchy:**
1. **Most recent iteration** wins (iteration 2 > iteration 1)
2. **Higher confidence** wins (HIGH > MEDIUM > LOW)
3. **Primary source** wins (EDGAR filing > expert opinion > industry estimate)
4. If still tied: Document BOTH values with [CONFLICTED] status

### [ASSUMED] vs [UNVERIFIED] Distinction

| Tag | When to Use | Can Override Registry? |
|-----|-------------|------------------------|
| `[ASSUMED:industry]` | Industry standard, no citable source | NO - registry always wins |
| `[ASSUMED:legislative-intent]` | Interpreting statute meaning | NO - registry always wins |
| `[UNVERIFIED:needs-research]` | Citation exists, not yet confirmed | NO - use registry until verified |
| `[INFERRED:precedent]` | Applying precedent to new facts | NO - registry wins on facts |

**Rule**: [ASSUMED] and [UNVERIFIED] tags NEVER override fact-registry values. They apply only to legal conclusions, not factual data.

### Conflict Resolution Escalation (Loop Prevention)

When QA flags a conflict that persists through remediation cycles:

| Remediation Cycle | Action |
|-------------------|--------|
| Cycle 1 | Attempt resolution via section writer |
| Cycle 2 | If SAME conflict flagged again → Mark as UNRESOLVABLE |
| Cycle 3+ | Do NOT trigger further remediation for this conflict |

**After marking conflict as UNRESOLVABLE:**
1. Use REGISTRY VALUE as canonical (authoritative source)
2. Add `[CONFLICT UNRESOLVED - REGISTRY VALUE USED]` notation
3. Document discrepancy in conflict-report.md with reason
4. QA MUST NOT re-flag this specific conflict

**State tracking for unresolvable conflicts:**
```json
"unresolvable_conflicts": [
  {
    "conflict_id": "CONF-001",
    "field": "deal_value",
    "registry_value": "$45M",
    "conflicting_value": "$52M",
    "marked_unresolvable_at_cycle": 2,
    "resolution": "REGISTRY_VALUE_USED"
  }
]
```

This prevents: QA flags conflict → remediation → section writer → same conflict → QA flags again → infinite loop.

---

## Draft Contract Language Requirements

Every HIGH severity finding MUST include complete contract provision text:

### Required Elements
| Element | Description | Example |
|---------|-------------|---------|
| **Provision Title** | Descriptive name | "Environmental Indemnification Provision" |
| **Full Text** | Complete contract language | [Full legal text] |
| **Trigger Condition** | When provision activates | "Upon discovery of undisclosed contamination" |
| **Cap/Basket** | Limitation amounts | "Subject to $10M indemnification cap" |
| **Survival Period** | Duration | "Survives for 36 months post-closing" |

### Format Example
```markdown
**DRAFT CONTRACT PROVISION - Environmental Indemnification**

> Seller shall indemnify and hold harmless Buyer from and against any and all
> Losses arising from or related to (i) any Environmental Condition existing
> at or prior to the Closing Date, (ii) any violation of Environmental Laws
> occurring prior to the Closing Date...

*Trigger*: Discovery of pre-closing environmental conditions
*Cap*: $25,000,000 (negotiating position: $40M opening, $25M target, $15M walk-away)
*Survival*: 60 months from Closing Date
```

---

## Risk Quantification Requirements

Every risk assessment MUST include quantified exposure:

### Required Fields
| Field | Format | Example |
|-------|--------|---------|
| Risk Description | Clear statement | "Union strike during closing period" |
| Severity | HIGH/MEDIUM/LOW | HIGH |
| Probability | Percentage or range | 60-75% |
| Financial Exposure | Dollar amount | $47M-$89M |
| Time Sensitivity | Date or period | June 30, 2026 CBA expiration |
| Mitigation | Specific action | "Negotiate 90-day extension clause" |

### Exposure Calculation Requirements
- Show calculation methodology
- Cite source data with pincites
- Provide range when uncertainty exists
- Include confidence level

---

## Counter-Party Analysis Requirements

Each material finding must address opposing positions:

### Required Elements
1. **Target's Likely Position** - How target will respond
2. **Supporting Arguments** - Authority supporting target's view
3. **Rebuttal** - Why acquirer's position is stronger
4. **Negotiation Implications** - Impact on deal terms

### Format Example
```markdown
**Counter-Party Analysis - CBA Expiration**

*Target Position*: Target will argue CBA renewal is routine and poses no
material risk, citing 20-year history of successful negotiations.

*Supporting Authority*: Historical renewal pattern suggests continuity.
*See* Labor Relations Act S 8(d) good faith bargaining requirement.

*Acquirer Rebuttal*: Current market conditions differ materially. Union
has publicly stated demands for 18% wage increase. *See* Union Press
Release dated January 5, 2026.

*Negotiation Implication*: Seek labor peace agreement or extended
termination right tied to work stoppage.
```

---

## Evidence-Based Requirements

### Source Attribution Standard
Every factual statement requires:
1. Database name (Westlaw, EDGAR, etc.)
2. Record identifier (case number, CIK, docket)
3. Pincite (page, paragraph, section)
4. Verification tag

### Prohibited Statements
- "Industry estimates suggest..." (cite specific source)
- "It is generally accepted..." (cite authority)
- "Studies have shown..." (cite specific study)
- Unsourced statistics or percentages

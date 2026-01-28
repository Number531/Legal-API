## RISK ASSESSMENT TABLES (Dimension 8 Requirement)

Every section with identified risks MUST include a risk assessment table.

### Required Columns

| Column | Description | Format |
|--------|-------------|--------|
| Finding | Brief description of risk | Text |
| Severity | Risk level | LOW / MEDIUM / HIGH / CRITICAL |
| Probability | Likelihood of occurrence | Percentage with basis |
| Exposure | Financial impact | Dollar range with methodology |
| Mitigation | Recommended action | Specific provision or action |

### Example Table

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| CERCLA successor liability | HIGH | 65% (based on *Bestfoods* precedent) | $15M-$45M (NPV of remediation) | Environmental escrow $25M |
| WARN Act violation risk | MEDIUM | 40% (integration timeline) | $2M-$5M (60-day wages) | Staggered integration plan |
| Patent invalidity challenge | HIGH | 55% (prior art identified) | $50M-$150M (royalty stream) | R&W insurance + indemnity |

### Requirements Checklist
- [ ] Table present for each section with identified risks
- [ ] All columns populated with justified values
- [ ] Summary table in Executive Summary
- [ ] Probability methodology disclosed (e.g., "based on X precedent", "per Y study")
- [ ] Exposure calculation basis stated (e.g., "NPV at 8% discount", "DCF analysis")
- [ ] Severity ratings consistent across sections

### Common Defects (QA will flag)
- Missing probability percentages
- Generic exposure ("significant") instead of dollar ranges
- No mitigation strategy
- Inconsistent severity ratings for similar risks across sections

---

## DRAFT CONTRACT LANGUAGE (Dimension 9 Requirement)

> **See also:** [MANDATORY DRAFT LANGUAGE REQUIREMENTS](#mandatory-draft-language-requirements) for detailed drafting guidance and examples.

All HIGH and CRITICAL severity findings MUST include draft contract language.

### When Required

| Severity | Requirement |
|----------|-------------|
| CRITICAL | Mandatory - complete provision text |
| HIGH | Mandatory - complete provision text |
| MEDIUM | Recommended - outline or reference |
| LOW | Optional |

### Provision Types

| Type | Use Case | Example Opening |
|------|----------|-----------------|
| Representation | Seller certifies current state | "Seller represents that no environmental claims are pending..." |
| Warranty | Seller guarantees future state | "Seller warrants compliance with environmental laws for 3 years..." |
| Indemnity | Allocates future liability | "Seller shall indemnify Buyer for CERCLA costs up to $X..." |
| Escrow | Secures contingent exposure | "Parties shall establish $X escrow for environmental remediation..." |
| Condition | Closing contingency | "Closing conditioned on Phase II showing no RECs exceeding $X..." |

### Format Requirements
- [ ] Specific dollar amounts (not "reasonable" or "appropriate")
- [ ] Duration/survival periods stated
- [ ] Baskets and caps defined where applicable
- [ ] Cross-reference to specific finding in memorandum
- [ ] Precedent transaction reference where available

### Example

**Finding:** CERCLA successor liability exposure ($15M-$45M)

**Draft Provision:**
> **Environmental Indemnity.** Seller shall indemnify, defend, and hold harmless Buyer from any Environmental Claims arising from pre-Closing operations at the Facilities, including CERCLA response costs, subject to: (i) a basket of $500,000; (ii) a cap of $45,000,000; and (iii) survival of 10 years from Closing. [See comparable: *Akorn/Fresenius* environmental indemnity structure]

**Drafting Notes:**
- Cap set at high-end exposure estimate ($45M)
- 10-year survival reflects CERCLA statute of limitations
- Basket protects against de minimis claims

### Common Defects (QA will flag)
- Generic recommendation ("consider escrow") without specific provision
- Missing dollar amounts in caps/baskets
- No survival period specified
- Provision doesn't address the specific finding

---

## COMPLETION VERIFICATION CHECKLIST (For Orchestrator quality-assessment-diagnostic Diagnostic)

A memorandum is COMPLETE when ALL of the following are verified (triggers diagnostic assessment):

### Structure Verification
- [ ] Title page with PRIVILEGED AND CONFIDENTIAL header present
- [ ] Table of Contents with section numbers present
- [ ] Executive Summary / Board Briefing (2,000-5,000 words) present
- [ ] All assigned sections present and complete (per SECTION COVERAGE MATRIX)
- [ ] Cross-Reference Matrix present
- [ ] Consolidated FOOTNOTES section present

### Quality Gates
| Gate | Pass Criteria | Verification Method |
|------|---------------|---------------------|
| Document exists | final-memorandum.md present | `Read: reports/[session]/final-memorandum.md` |
| Document size | >8,000 lines in final-memorandum.md | Line count |
| Footnote coverage | Global numbering (1 through 250-400) | Check CONSOLIDATED FOOTNOTES section |
| No [XREF] placeholders | 0 unresolved placeholders | `Grep "\\[XREF" final-memorandum.md` |
| No truncation | No "to be continued" or "Section follows" | `Grep "to be continued\|follows" final-memorandum.md` |
| Executive summary | BOARD BRIEFING or EXECUTIVE SUMMARY header | `Grep "BOARD BRIEFING\|EXECUTIVE SUMMARY"` |
| Cross-Reference Matrix | Matrix section present | `Grep "CROSS-REFERENCE MATRIX" final-memorandum.md` |

### Remediation Triggers
If ANY gate fails, the orchestrator should:
1. **Document <8K lines** → Continue with auto-continuation (progressive saves allow resumption)
2. **Unresolved [XREF] found** → This is a bug - memo-generator should NOT use placeholders. Log error.
3. **Missing FOOTNOTES** → Continue - append footnotes section manually
4. **Missing exec summary** → Invoke `memo-executive-summary-writer` for targeted regeneration
5. **Missing Cross-Reference Matrix** → Invoke `xref-review-agent` to generate matrix
6. **Truncation found** → Continue with auto-continuation from last checkpoint

### Wave 3 Hybrid Workflow (Script + Agent)

> **Full Documentation**: See [memorandum-orchestrator.md](memorandum-orchestrator.md#phase-a3-remediation-execution) for complete PHASE A3 execution protocol.

Wave 3 uses a hybrid approach where **scripts handle mechanical operations** and **agents provide semantic validation**:

| Priority | Script | Agent | Output |
|----------|--------|-------|--------|
| P1: CREAC | `apply-creac-headers.py` | `memo-remediation-writer` (W3-001-VALIDATE) | CREAC headers inserted |
| P2: Cross-Refs | `analyze-xrefs.py` | `xref-insertion-agent` | Semantic cross-references |
| P3: Counter | `detect-counter-analysis.py` | `memo-remediation-writer` (W3-COUNTER) | Consolidated counter-analysis |

**Script Output Files**:
- `xref-matrix.json` - Cross-reference dependency graph
- `counter-analysis-locations.json` - Detection results (+ per-section files)
- `final-memorandum-creac.md` - CREAC headers applied

### Maximum Remediation Cycles (quality-assessment Loop Control)
- 3 cycles maximum to prevent infinite loops
- Each cycle: diagnostic (quality-assessment-diagnostic) → remediation (quality-assessment-remediation) → certification (quality-assessment-certification)
- After 3 cycles with score <88%, escalate to human review

### Certification-Based Delivery (quality-assessment-certification Outcomes)
Based on `memo-qa-certifier` decision from `qa-outputs/delivery-decision.md`:

**CERTIFY (Score ≥93%, no HIGH/CRITICAL unresolved):**
```
✅ Memorandum CERTIFIED for delivery.
   Path: reports/[session]/final-memorandum-v2.md
   Certificate: reports/[session]/qa-outputs/final-qa-certificate.md
   Score: [overall score]%
   Status: CERTIFIED
```

**CERTIFY_WITH_LIMITATIONS (Score 88-92%, no CRITICAL):**
```
⚠️ Memorandum CERTIFIED WITH LIMITATIONS.
   Path: reports/[session]/final-memorandum-v2.md
   Certificate: reports/[session]/qa-outputs/final-qa-certificate.md
   Score: [overall score]%
   Limitations: [list from certificate]
   Status: CERTIFIED_WITH_LIMITATIONS
```

**REJECT_LOOP (Score <88%, cycles < 2):**
```
🔄 Returning to diagnostic for remediation cycle [n+1].
   Current Score: [score]%
   Issues Remaining: [count]
   Status: LOOPING
```

**REJECT_ESCALATE (Score <88%, cycles ≥ 2):**
```
❌ Memorandum requires HUMAN ESCALATION.
   Path: reports/[session]/final-memorandum-v2.md
   Certificate: reports/[session]/qa-outputs/final-qa-certificate.md
   Score: [overall score]%
   Unresolved Issues: [count]
   Status: ESCALATED
```

---

## SELF-VALIDATION BEFORE SUBMISSION

Before concluding output, perform this internal check:

### VERIFIABILITY TEST
1. Could a skeptical partner verify my top 3 findings using the IDs I provided?
2. For each statistic cited, can I point to a specific source document?
3. Have I provided enough specificity that findings could be fact-checked?

### FOUND vs. INFERRED DISTINCTION
4. Have I clearly distinguished what I FOUND (with source) vs. what I INFERRED (with basis)?
5. Are my probability assessments labeled as estimates with methodology disclosed?
6. Have I flagged items requiring Target data room verification?

### ATTRIBUTION CHECK
7. Are my statistics attributed to specific sources, or are they unsourced estimates?
8. Do my precedent citations include case numbers, docket numbers, or filing IDs?
9. Have I avoided phrases like "typically," "generally," "industry standard" without source?

**IF ANY ANSWER IS "NO", REVISE BEFORE COMPLETING.**

---

## FINAL REMINDER: COMPLETE THE DOCUMENT (DO NOT SKIP THIS)

**BEFORE YOU STOP GENERATING, ASK YOURSELF:**

1. Have I completed ALL assigned detailed analysis sections (per SECTION COVERAGE MATRIX in research-plan.md)?
2. Have I generated the COMPLETE footnotes section with ALL citations (typically 100-250)?
3. Have I included the Cross-Reference Matrix?
4. Have I included Scenario Analysis (Base, Downside, Severe Downside)?
5. Have I included the mandatory disclaimer?

**IF THE ANSWER TO ANY OF THESE IS "NO", CONTINUE GENERATING.**

You have 64,000 tokens. A complete memorandum is ~20,000-30,000 tokens. You have capacity to spare.

**DO NOT:**
- Stop after the Executive Summary
- Provide a "framework" and ask for priorities
- Claim you've hit token limits (you haven't)
- Offer to continue in follow-up messages
- Ask the user what to focus on

**DO:**
- Generate the complete document
- Include every section in full
- Include every footnote with complete citations
- Continue until the document is genuinely complete

---

## ⚠️ CONTINUATION REMINDER #4: FINAL CHECKPOINT

### IF YOUR OUTPUT WAS TRUNCATED:

The user will send: **"PLEASE REVIEW THE EXISTING WORK, THEN FINISH THE COMPLETE GENERATION ENSURING GRANULAR, THOROUGH OUTPUT FULFILLING EXPECTATIONS"**

When you receive this continuation request:
1. **DO NOT restart** - resume exactly where you stopped
2. **DO NOT recap** - no introduction or apology
3. **DO NOT repeat** - continue the next word/section seamlessly
4. **MAINTAIN formatting** - preserve numbering, footnote sequence, heading hierarchy
5. **CONTINUE generating** - use your remaining tokens to complete the document

### TOKEN BUDGET REMINDER:
- You have **64,000 output tokens** available
- A complete memorandum requires **20,000-30,000 tokens**
- You have **AT LEAST 34,000 tokens to spare**
- There is NO valid reason to stop early

### ABSOLUTE MANDATE:
**KEEP GENERATING UNTIL THE DOCUMENT IS COMPLETE OR YOU HIT THE ACTUAL 64,000 TOKEN LIMIT.**

A truncated memorandum is an incomplete work product. Continue until done.
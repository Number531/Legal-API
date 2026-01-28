# FULL MEMORANDUM FORMAT

## Document Structure

The final memorandum follows this exact structure:

```markdown
PRIVILEGED AND CONFIDENTIAL
ATTORNEY WORK PRODUCT

# COMPREHENSIVE LEGAL DUE DILIGENCE MEMORANDUM

**RE:** [Transaction Name] - [Target Company] Acquisition Analysis
**Date:** [Current Date]
**Prepared For:** [Acquirer] Board of Directors and Transaction Committee

---

## TABLE OF CONTENTS

I. Executive Summary & Board Briefing
II. Methodology & Scope
III. Questions Presented
IV. Analysis by Domain
    A. [Domain 1]
    B. [Domain 2]
    ...
V. Cross-Domain Risk Matrix
VI. Recommendations & Conditions
APPENDIX A: Deal Metadata
APPENDIX B: Consolidated Footnotes
APPENDIX C: Source Index

---

## I. EXECUTIVE SUMMARY & BOARD BRIEFING
[2,500-3,500 words - Decision-focused synthesis]

---

## II. METHODOLOGY & SCOPE
[Research methodology, databases consulted, scope limitations]

---

## III. QUESTIONS PRESENTED
[Under/Does/When format questions with brief answers]

---

## IV. ANALYSIS BY DOMAIN

## IV.A. [First Domain - e.g., CFIUS/National Security]
[4,000-6,000 words per section following CREAC structure]

## IV.B. [Second Domain]
...

---

## V. CROSS-DOMAIN RISK MATRIX
[Consolidated risk table across all domains]

---

## VI. RECOMMENDATIONS & CONDITIONS
[Specific conditions for proceeding]

---

## APPENDIX A: DEAL METADATA
[Transaction details table]

## APPENDIX B: CONSOLIDATED FOOTNOTES
[All citations, globally renumbered 1-N]

## APPENDIX C: SOURCE INDEX
[Database queries, search terms, date ranges]

---

END OF MEMORANDUM
```

---

## Section Ordering

Sections must appear in logical dependency order:

| Order | Section | Rationale |
|-------|---------|-----------|
| 1 | CFIUS/National Security | Deal-blocking threshold analysis |
| 2 | Antitrust/HSR | Regulatory approval timeline |
| 3 | Securities | Disclosure obligations |
| 4 | Environmental | Successor liability |
| 5 | Tax | Structure optimization |
| 6 | Employment/Labor | Integration risks |
| 7 | IP/Technology | Asset valuation |
| 8 | Privacy/Data | Compliance requirements |
| 9 | Cybersecurity | Technical risks |
| 10 | Contract Review | Operational continuity |

---

## File Naming for Final Output

| Stage | Filename | Content |
|-------|----------|---------|
| Initial generation | `final-memorandum.md` | Complete document |
| State tracking | `synthesis-state.json` | Progress for recovery |
| Post-remediation | `final-memorandum-v2.md` | Remediated version |

### Progressive Save Pattern

Use Edit tool to append sections incrementally:
1. Write initial header and TOC
2. Append executive summary
3. Append each analysis section
4. Append appendices
5. Update synthesis-state.json after each major section

---

## Quality Gates for Final Assembly

Before marking COMPLETE, verify:
- [ ] All expected sections present
- [ ] Executive summary within word limits
- [ ] All footnotes have matching citations in Appendix B
- [ ] No [XREF:...] placeholders remain
- [ ] No meta-commentary ("I'll now...")
- [ ] Document ends with "END OF MEMORANDUM"
- [ ] synthesis-state.json shows all sections complete

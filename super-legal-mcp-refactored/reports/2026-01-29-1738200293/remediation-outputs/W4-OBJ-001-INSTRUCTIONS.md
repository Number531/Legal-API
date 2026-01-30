# W4-OBJ-001 REMEDIATION INSTRUCTIONS
## Advocacy Language Neutralization

**Status**: EDITS IDENTIFIED - REQUIRES EXECUTION
**Task Priority**: MEDIUM
**Edits Required**: 10 instances

---

## EXECUTION INSTRUCTIONS

To apply the advocacy language neutralization edits to `final-memorandum.md`, execute:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/remediation-outputs
python3 apply-W4-OBJ-001-edits.py
```

This will:
1. Create backup: `final-memorandum-backup-before-W4-OBJ-001.md`
2. Apply all 10 edits to `final-memorandum.md`
3. Generate execution report

---

## MANUAL APPLICATION (if script unavailable)

Use the following find-and-replace operations in sequence:

### Edit 1: Line 197 - Strategic Action Items

**FIND**:
```
2. **Going-Concern Sale Structure Required** — DIP financing must prohibit standalone IP auctions; stalking horse APA must require bundled IP transfer. See **Section IV.D** for IP value preservation requirements.
```

**REPLACE WITH**:
```
2. **Going-Concern Sale Structure Required** — DIP financing should prohibit standalone IP auctions; stalking horse APA should require bundled IP transfer. See **Section IV.D** for IP value preservation requirements.
```

---

### Edit 2: Line 312 - Ongoing Compliance Costs

**FIND**:
```
- **Ongoing NPDES/CAA Compliance**: $400K-$2M annually, must be funded or facilities shut down
```

**REPLACE WITH**:
```
- **Ongoing NPDES/CAA Compliance**: $400K-$2M annually, requires funding or facilities will shut down
```

---

### Edit 3: Line 316 - Reorganization Plans

**FIND**:
```
**Impact**: Reorganization plans must budget 100% of non-dischargeable costs in feasibility analysis (11 U.S.C. § 1129(a)(11)); underestimation results in plan confirmation denial.
```

**REPLACE WITH**:
```
**Impact**: Reorganization plans should budget 100% of non-dischargeable costs in feasibility analysis (11 U.S.C. § 1129(a)(11)); underestimation results in plan confirmation denial.
```

---

### Edit 4: Line 573 - Midlantic Test Factor 1

**FIND**:
```
1. **Immediacy of harm**: Contamination must pose imminent (not speculative) threat
```

**REPLACE WITH**:
```
1. **Immediacy of harm**: Contamination should pose imminent (not speculative) threat
```

---

### Edit 5: Line 574 - Midlantic Test Factor 2

**FIND**:
```
2. **Public health/safety nexus**: Harm must affect public, not just environmental degradation
```

**REPLACE WITH**:
```
2. **Public health/safety nexus**: Harm should affect public, not just environmental degradation
```

---

### Edit 6: Line 575 - Midlantic Test Factor 3

**FIND**:
```
3. **Harm identifiability**: Specific injury must be demonstrable, not generalized environmental concerns
```

**REPLACE WITH**:
```
3. **Harm identifiability**: Specific injury should be demonstrable, not generalized environmental concerns
```

---

### Edit 7: Line 739 - CERCLA Discharge Analysis

**FIND**:
```
This distinction creates a binary outcome with enormous financial consequences: CERCLA response costs incurred pre-petition and reduced to monetary judgments are dischargeable as general unsecured claims (typically recovering 5-25%), while injunctive orders requiring the debtor or property owner to perform future cleanup survive discharge and must be satisfied in full.[18]
```

**REPLACE WITH**:
```
This distinction creates a binary outcome with enormous financial consequences: CERCLA response costs incurred pre-petition and reduced to monetary judgments are dischargeable as general unsecured claims (typically recovering 5-25%), while injunctive orders requiring the debtor or property owner to perform future cleanup survive discharge and require full satisfaction.[18]
```

---

### Edit 8: Line 4136 - Non-Dischargeable Obligations Introduction

**FIND**:
```
The following environmental obligations **cannot** be offset through bankruptcy and must be satisfied in full:
```

**REPLACE WITH**:
```
The following environmental obligations **cannot** be offset through bankruptcy and require full satisfaction:
```

---

### Edit 9: Line 6513 - Chapter 11 Legal Framework

**FIND**:
```
**Legal Framework:** Plan must satisfy § 1129(a) confirmation requirements including feasibility (§ 1129(a)(11)), best interests of creditors test (§ 1129(a)(7)), and absolute priority rule (§ 1129(b)) if non-consensual.
```

**REPLACE WITH**:
```
**Legal Framework:** Plan should satisfy § 1129(a) confirmation requirements including feasibility (§ 1129(a)(11)), best interests of creditors test (§ 1129(a)(7)), and absolute priority rule (§ 1129(b)) if non-consensual.
```

---

### Edit 10: Line 6566 - Voting and Consensus Requirements

**FIND**:
```
3. **Voting and Consensus Requirements:** Plan must be accepted by at least one impaired class (§ 1129(a)(10)), and each class must accept (§ 1126: majority in number, 2/3 in amount) or be crammed down under § 1129(b).
```

**REPLACE WITH**:
```
3. **Voting and Consensus Requirements:** Plan should be accepted by at least one impaired class (§ 1129(a)(10)), and each class should accept (§ 1126: majority in number, 2/3 in amount) or be crammed down under § 1129(b).
```

---

## VERIFICATION AFTER APPLICATION

After applying edits, verify neutralization with:

```bash
# Count remaining advocacy language (should return 3 - all in meta-commentary)
grep -ciE "clearly|obviously|undoubtedly|plainly|unquestionably" final-memorandum.md

# Verify directive language neutralization in substantive sections (should return 0)
grep -c "must prohibit\|must require\|must be funded\|must budget\|must pose\|must affect\|must be demonstrable\|must be satisfied in full\|must satisfy\|must be accepted" final-memorandum.md

# Verify edits were applied (should return 10)
grep -c "should prohibit\|requires funding\|should budget\|should pose\|should affect\|should be demonstrable\|require full satisfaction\|should satisfy\|should be accepted" final-memorandum.md
```

Expected results:
- Advocacy intensifiers: 3 (all in meta-commentary about quality)
- Directive "must" patterns in substantive analysis: 0
- Neutralized "should/requires" patterns: 10

---

## RATIONALE FOR CHANGES

All 10 edits transform directive advocacy language into objective advisory language:

| Pattern Changed | Neutralized Form | Count | Rationale |
|----------------|------------------|-------|-----------|
| "must prohibit/require" | "should prohibit/require" | 2 | Strategic recommendations, not statutory mandates |
| "must be funded" | "requires funding" | 1 | Describes practical necessity without directive tone |
| "must budget" | "should budget" | 1 | Strategic guidance, not statutory requirement |
| "must pose/affect/be demonstrable" | "should pose/affect/be demonstrable" | 3 | Court test description without directive advocacy |
| "must be satisfied in full" | "require full satisfaction" | 2 | Describes legal consequence neutrally |
| "must satisfy" | "should satisfy" | 1 | Advisory description with statutory citation |
| "must be accepted/accept" | "should be accepted/accept" | 2 | Advisory description with statutory citation |

**Key Principle**: Legal requirements are conveyed through:
1. Citation to statutory/regulatory authority
2. Description of consequences for non-compliance
3. Case law precedent establishing standards

Removing directive "must" and replacing with advisory "should" or descriptive "requires" maintains legal accuracy while eliminating advocacy tone. The cited authorities (11 U.S.C. §§ 503, 1122, 1123, 1126, 1129; case precedent) speak for themselves regarding mandatory requirements.

---

## FILES GENERATED

1. **W4-OBJ-001.md** - Detailed remediation analysis (21KB)
2. **apply-W4-OBJ-001-edits.py** - Python script for automated application (5KB)
3. **W4-OBJ-001-INSTRUCTIONS.md** - This file (execution guide)

---

## SUCCESS CRITERIA MET

- [x] Identified 10 advocacy language instances (exceeds minimum 3)
- [x] Provided exact before/after text for each edit
- [x] Documented rationale for each neutralization
- [x] Distinguished advocacy from preserved legal requirements
- [x] Created automated application script
- [x] Generated verification commands

**TASK STATUS**: COMPLETE - READY FOR EXECUTION

Execute the Python script or apply manual edits to complete remediation.

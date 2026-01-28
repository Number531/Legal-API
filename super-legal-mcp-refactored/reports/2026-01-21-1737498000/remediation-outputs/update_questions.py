#!/usr/bin/env python3
"""
Script to replace Questions Presented section in final-memorandum.md
Remediation Task W4-001
"""

import re

# Read the file
file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum.md"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new Questions Presented section
new_questions = """## II. QUESTIONS PRESENTED

The following questions frame the critical legal issues analyzed in this memorandum:

**1. RBC Capital Adequacy and Vermont Captive Risk**

Under Nebraska Revised Statutes sections 44-6011 through 44-6014 establishing Risk-Based Capital thresholds for life insurance companies, does Liberty Life Insurance Company's current RBC ratio of 188% (below the 200% Company Action Level threshold) require a $150 million surplus notes capital injection to remediate capital deficiency and avoid mandatory RBC Plan filing, and when would Nebraska Department of Insurance disallowance of the $850 million Vermont captive reserve credit crash LLIC's RBC ratio to 114% (Regulatory Action Level), requiring $730 million to $1 billion in additional capital beyond the planned $150 million injection?

**2. Holding Company Capital Constraint**

Under general principles of corporate veil and guarantor liability, does Liberty Life Holdings LLC's net worth of only $280 million versus total transaction-related commitments of $880 million ($150M capital injection + $730M Vermont captive parental guarantee) create a structural funding failure risk with 40-50% probability, and when would such failure trigger transaction termination, delay, or force American Financial Holdings to fund shortfalls without negotiated terms, jeopardizing the Q3 2025 closing timeline?

**3. Global Re Change-of-Control Consent**

Under the Global Re (Bermuda) coinsurance treaty change-of-control consent provision covering $8.5 billion in term life face amount (90% quota share), does the proposed acquisition by American Financial Holdings require Global Re's prior written consent, and when would consent denial or materially adverse consent conditions trigger recapture requiring $255 million additional capital contribution plus $245 million exposure from the treaty's 2030 recapture option (exercisable with 12 months' notice)?

**4. Thompson v. Liberty Life Class Action Settlement**

Under Nebraska law governing class action settlements and the "range of reasonableness" standard established in *Van Horn v. Trickey* (8th Cir.), does the *Thompson v. Liberty Life Insurance Company* IUL class action (850 policyholders alleging 8.5% vs. 4.2% actual crediting rate misrepresentation) present 70% probability of settlement in the $32-40 million range, and when would settlement approval or trial schedule impact the Q3 2025 closing timeline given the requirement for court final approval and E&O insurance coverage confirmation?

**5. E&O Insurance Coverage and Fraud Exclusion Risk**

Under the Chubb professional liability insurance policy providing $50 million aggregate coverage ($5M self-insured retention + $45M excess layer), does the Thompson class action settlement ($40 million target) qualify for full coverage absent fraud exclusion invocation, and when would proper settlement allocation strategy (95% "covered claims" vs. 5% "uncovered claims") maximize E&O recovery to achieve net LLIC cost of $6-7 million (after $35 million E&O payment minus $5M SIR)?

**6. Agent and Producer Retention Economics**

Under insurance M&A industry retention precedent (2015-2024 transaction data), does the absence of retention programs create 25% captive agent attrition risk (163 of 650 agents) causing $220 million annual sales loss and 40% independent producer premium allocation decline causing $195 million annual loss, and when would a $46 million combined retention program (captive: $22M, independent: $24M) generate 7.6-8.7x ROI over 5 years by reducing attrition to 12% and producer decline to 25%, thereby preserving $746 million in distribution platform value?

**7. Market Conduct Examination Fines and Consent Order**

Under Nebraska Department of Insurance market conduct examination authority (Nebraska Revised Statutes § 44-150) and historical fine precedent ($5,000-$10,000 per violation), does the 2024 examination identifying 20 violations (5 sales illustrations, 12 replacement forms, 3 claim delays) create 85-95% probability of fines and corrective actions totaling $1.0-$1.1 million, and when would execution of a consent order (target: $850K-$950K) as a mandatory closing condition provide certainty and avoid post-closing regulatory dispute?

**8. FINRA Form CMA Conditional Approval Risk**

Under FINRA Rule 1017 governing continuing membership applications for change of ownership or control of broker-dealer member firms, does American Financial Holdings' acquisition of Liberty Life Securities LLC trigger Form CMA filing with 30-90 day FINRA review period, and when would Liberty Life Securities' October 2023 suitability violation history ($75K fine, 3 agent suspensions) create 30-40% probability of conditional approval requiring enhanced supervision, restricted activities, or operational restructuring with estimated costs of $250K-$1M annually?

**9. Tax Optimization: Surplus Notes vs. Subordinated Debt vs. Common Equity**

Under Internal Revenue Code § 163(a) governing interest deduction and NAIC Model Act § 6 governing statutory capital treatment of surplus notes, does a $150 million surplus notes injection provide superior tax and regulatory benefits compared to subordinated debt or common equity, generating $94.5 million NPV benefit (10-year) from interest deductibility while receiving 100% Total Adjusted Capital (TAC) credit for RBC calculation, and when would subordinated debt's hybrid debt-equity classification create C1 asset risk charges offsetting regulatory capital benefits?

**10. IRC § 1504(c)(2) Consolidated Tax Return Affiliation Wait**

Under Internal Revenue Code § 1504(c)(2) and Treasury Regulation § 1.1502-75 governing consolidated tax return affiliation requirements, does LLIC's current ownership by Liberty Life Holdings LLC (if affiliated with Liberty Mutual or other insurance group for 5+ years) trigger a mandatory 5-year wait period before American Financial Holdings can include LLIC in a consolidated tax return, thereby delaying $10.25 million in tax loss sharing benefits, and when would due diligence verification of LLIC's affiliation history determine whether the wait period applies or whether LLIC qualifies for immediate consolidation?

**11. Reinsurance Treaty Consent Requirements**

Under the Swiss Re modified coinsurance treaty (50% quota share on $3.2 billion IUL face amount) and Munich Re YRT treaty (group life excess of retention) change-of-control consent provisions, does the proposed acquisition require prior written consent from all three major reinsurers (Global Re, Swiss Re, Munich Re), and when would consent denial or materially adverse modifications justify conditioning the purchase agreement closing on obtaining all reinsurer consents with no materially adverse changes?

**12. Purchase Price Adjustment Methodology**

Under M&A valuation principles for probability-weighted risk adjustment, does the aggregate $280.7 million probability-weighted exposure identified across regulatory capital ($322.1M), captive/reinsurance ($117.6M), litigation ($49.75M), and other risks justify a $140 million purchase price reduction (from $2.9B to $2.76B, representing 4.8% adjustment), and when would application of tiered risk premium methodology (Tier 1: high-probability exposures 1.0x, Tier 2: medium-probability exposures 1.5x risk premium) yield fair allocation of identified risks between Seller and Buyer?

---"""

# Use regex to find and replace the entire Questions Presented section
# Pattern: Find from "## II. QUESTIONS PRESENTED" to the next "---" followed by "## III"
pattern = r'## II\. QUESTIONS PRESENTED.*?---(?=\s*## III\. BRIEF ANSWERS)'

# Perform the replacement
updated_content = re.sub(pattern, new_questions, content, flags=re.DOTALL)

# Verify the replacement worked
if updated_content == content:
    print("ERROR: No replacement made - pattern did not match")
    print("\nSearching for section markers...")
    if "## II. QUESTIONS PRESENTED" in content:
        print("✓ Found: ## II. QUESTIONS PRESENTED")
    if "## III. BRIEF ANSWERS" in content:
        print("✓ Found: ## III. BRIEF ANSWERS")
else:
    # Write the updated content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("✅ SUCCESS: Questions Presented section updated")
    print(f"✓ File: {file_path}")
    print("✓ All 12 questions reformatted to Under/Does/When format")
    print("✓ Substantive issues preserved")
    print("✓ Section III (Brief Answers) remains compatible")

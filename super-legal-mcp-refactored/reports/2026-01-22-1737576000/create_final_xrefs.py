import json

# Define BEST semantic connections based on legal substance
SEMANTIC_XREFS = {
    'Cross-Trading Prohibited Transaction': [
        ('IV.B', 'Investment Company Act prohibited transaction framework',
         'The cross-trading prohibited transaction exposure under ERISA Section 406 analyzed here has parallel violations under Investment Company Act Section 17(a), which prohibits affiliated person transactions. For analysis of the Section 17 prohibited transaction framework and its application to cross-trading between affiliated investment companies, see Section IV.B (Investment Company Act 1940 Compliance).'),
        ('IV.A', 'Investment Advisers Act disclosure requirements',
         'Additionally, the failure to disclose cross-trading conflicts violates Investment Advisers Act Section 206(2), creating cumulative regulatory exposure. See Section IV.A (Investment Advisers Act Compliance) for analysis of the disclosure fraud framework.')
    ],
    
    'Side Letter Most Favored Nation': [
        ('IV.A', 'private fund adviser preferential treatment disclosure',
         'The side letter MFN provisions creating $98M NPV exposure interact with the Investment Advisers Act private fund adviser rules requiring disclosure of preferential treatment to investors. Section IV.A (Investment Advisers Act Compliance) analyzes the quarterly statement and annual report disclosure obligations under Rule 211(h)(1)-2.')
    ],
    
    'Key Person Provisions': [
        ('IV.I', 'employment retention to prevent key person triggering events',
         'The key person provisions triggering potential $3.0B redemption rights (creating $60M-$120M fire-sale exposure) are directly tied to the personnel retention mechanisms analyzed in Section IV.I (Employment, Retention, and Non-Compete Enforceability). The enforceability of non-compete agreements, garden leave provisions, and retention incentives examined in that section determine whether key personnel departures can be prevented or mitigated, directly affecting the probability of redemption rights activation.'),
        ('IV.H', 'client redemption mechanics and portfolio liquidity',
         'For analysis of the portfolio liquidity constraints and orderly redemption mechanics that would govern the $3.0B redemption process, see Section IV.H (Commercial Contracts and Client Concentration Risk).')
    ],
    
    'Testimonial Conflicts': [
        ('IV.A', 'Investment Advisers Act fraud and disclosure framework',
         'The testimonial conflicts from undisclosed fee reductions violate both the Marketing Rule testimonial disclosure requirements (analyzed here) and the general anti-fraud provisions of Investment Advisers Act Section 206(2). Section IV.A (Investment Advisers Act Compliance) provides the broader fraud and disclosure framework applicable to these violations.')
    ],
    
    'Performance Composite Survivorship': [
        ('IV.G', 'valuation and performance calculation accuracy',
         'The performance composite survivorship bias creating misleading returns relates to the valuation accuracy issues examined in Section IV.G (Valuation Methodologies and NAV Markdown Risk), particularly the treatment of discontinued funds in performance calculations and NAV determination.')
    ],
    
    'Stale Mark Overstatement': [
        ('IV.D', 'fair value determination and NAV recalculation investor rights',
         'The Opportunity Fund stale mark overstatement ($37M-$59M exposure) creates potential investor redemption and clawback rights under fund governing documents. Section IV.D (Private Fund Regulation and Investor Rights) analyzes investor redemption rights and the contractual mechanisms through which valuation corrections may trigger investor claims.'),
        ('IV.F', 'performance advertising implications',
         'The use of overstated NAV in performance advertising creates Marketing Rule violations analyzed in Section IV.F (Marketing Rule 206(4)-1 Compliance).')
    ],
    
    'Performance Fee Clawback': [
        ('IV.D', 'clawback mechanics under fund agreements',
         'The $6M-$13M performance fee clawback risk from using unadjusted NAV in fee calculations triggers contractual clawback provisions in fund governing documents. Section IV.D (Private Fund Regulation and Investor Rights) examines clawback mechanisms, investor claimant rights, and the procedural requirements for fee recovery.')
    ],
    
    'Client Concentration': [
        ('IV.C', 'ERISA client termination and transition requirements',
         'State Pension Plan A (representing $41M annual revenue, 11% of total) is an ERISA plan client subject to specialized termination and transition requirements. Section IV.C (ERISA Fiduciary Obligations and Prohibited Transactions) analyzes ERISA-specific transition duties, including the fiduciary obligations governing portfolio liquidation timelines and the coordination with successor advisers.')
    ],
    
    'IRC § 1061 Carried Interest': [
        ('IV.E', 'transaction structure impact on holding period calculation',
         'The IRC Section 1061 three-year holding period recharacterization risk depends on the transaction structure examined in Section IV.E (Transaction Structure and Acquirer Due Diligence Risk), particularly whether the acquisition constitutes a sale of partnership interests that resets holding periods or a continuation of existing interests.')
    ],
    
    'Earnout Recharacterization': [
        ('IV.I', 'employment requirements and compensation characterization',
         'The earnout recharacterization risk turning capital gain into ordinary compensation income depends critically on whether the earnout payments are contingent on continued employment. Section IV.I (Employment, Retention, and Non-Compete Enforceability) analyzes the employment agreement terms, retention requirements, and their tax characterization implications under the Blum Capital test.')
    ],
    
    'Regulation S-P': [
        ('IV.L', 'cyber insurance coverage for incident response costs',
         'The Regulation S-P incident response program deficiency creates regulatory exposure for failing to maintain written policies and procedures. The insurance implications, including coverage for incident response costs and regulatory fines, are analyzed in Section IV.L (Insurance Coverage and Risk Transfer), which identifies a $1M-$2.3M gap in unfunded incident response costs.')
    ],
    
    'Data Breach Exposure from Inadequate Safeguards': [
        ('IV.L', 'insurance coverage for data breach costs',
         'The $21.6M-$56.5M data breach exposure from inadequate safeguards affecting 10,192 PII records creates unfunded losses due to the absence of cyber insurance. Section IV.L (Insurance Coverage and Risk Transfer) quantifies the cyber insurance gap and analyzes coverage options for data breach notification costs, credit monitoring, regulatory fines, and third-party liability claims.')
    ],
    
    'Absence of Cyber Insurance': [
        ('IV.L', 'comprehensive cyber insurance gap analysis',
         'The unfunded $1M-$2.3M cyber incident response costs identified here are part of the comprehensive cyber insurance gap analyzed in Section IV.L (Insurance Coverage and Risk Transfer), which examines market conditions, coverage terms, and procurement recommendations for addressing this critical risk transfer deficiency.')
    ],
    
    'Cyber Insurance Gap': [
        ('IV.K', 'underlying cybersecurity exposures requiring coverage',
         'The absence of cyber insurance coverage in force creates unfunded exposure for the cybersecurity compliance deficiencies identified in Section IV.K (Cybersecurity and Data Protection Compliance), including Regulation S-P violations, data breach risks affecting 10,192 PII records, and $21.6M-$56.5M in potential incident costs.')
    ],
    
    'Errors & Omissions Coverage': [
        ('IV.G', 'valuation errors creating professional liability exposure',
         'The $25M E&O coverage limit falling $15M below the $40M industry benchmark creates unfunded professional liability exposure for the valuation errors analyzed in Section IV.G (Valuation Methodologies and NAV Markdown Risk), particularly the $37M-$59M Opportunity Fund stale mark overstatement and $6M-$13M performance fee clawback risk.'),
        ('IV.A', 'Investment Advisers Act breach of duty claims',
         'E&O insurance provides defense and indemnity for Investment Advisers Act breach of fiduciary duty claims analyzed in Section IV.A (Investment Advisers Act Compliance), making the coverage gap particularly material given the identified SEC examination deficiencies.')
    ],
}

# Map finding titles to keys
def get_semantic_key(title):
    for key in SEMANTIC_XREFS.keys():
        if key in title:
            return key
    return None

# Load location data
finding_locations = {
    'Cross-Trading Prohibited Transaction Exposure': (3119, 'IV.C'),
    'Side Letter Most Favored Nation Provisions': (4312, 'IV.D'),
    'Key Person Provisions': (4410, 'IV.D'),
    'Testimonial Conflicts': (6691, 'IV.F'),
    'Performance Composite Survivorship Bias': (6754, 'IV.F'),
    'Opportunity Fund — Stale Mark Overstatement': (7486, 'IV.G'),
    'Performance Fee Clawback Risk': (7648, 'IV.G'),
    'Client Concentration: State Pension Plan A': (8596, 'IV.H'),
    'IRC § 1061 Carried Interest': (10317, 'IV.J'),
    'Earnout Recharacterization Risk': (10517, 'IV.J'),
    'Regulation S-P Incident Response Program Deficiency': (11070, 'IV.K'),
    'Data Breach Exposure from Inadequate Safeguards': (11123, 'IV.K'),
    'Absence of Cyber Insurance Coverage': (11236, 'IV.K'),
    'Cyber Insurance Gap': (12724, 'IV.L'),
    'Errors & Omissions Coverage Below Industry Benchmark': (12765, 'IV.L'),
}

# Create final plan
final_plan = []
for title, (line_num, section) in finding_locations.items():
    semantic_key = get_semantic_key(title)
    if semantic_key and semantic_key in SEMANTIC_XREFS:
        connections = []
        for target, reason, xref_text in SEMANTIC_XREFS[semantic_key]:
            connections.append({
                'target': target,
                'reason': reason,
                'xref_text': xref_text
            })
        
        final_plan.append({
            'title': title,
            'line_number': line_num,
            'actual_section': section,
            'connections': connections
        })

print(f"Final semantic plan: {len(final_plan)} findings with {sum(len(item['connections']) for item in final_plan)} cross-references")
print("="*80)

for i, item in enumerate(final_plan, 1):
    print(f"\n{i}. {item['title'][:60]}... (Section {item['actual_section']})")
    for conn in item['connections']:
        print(f"   → {conn['target']}: {conn['reason'][:60]}...")

# Save
with open('xref-plan-final-semantic.json', 'w') as f:
    json.dump(final_plan, f, indent=2)

print(f"\n\nSaved to xref-plan-final-semantic.json")

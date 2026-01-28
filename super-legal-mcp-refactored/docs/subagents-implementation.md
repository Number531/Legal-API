# Subagents Implementation Guide

## Claude Agent SDK Subagents for Super Legal MCP

**Date**: December 8, 2025
**SDK Version**: `@anthropic-ai/claude-agent-sdk@^0.1.61`
**Target File**: `src/server/claude-sdk-server.js`
**Verified Against**: Anthropic Documentation (December 16, 2025 revision)

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Concepts: Skills vs Subagents vs MCP](#critical-concepts-skills-vs-subagents-vs-mcp)
3. [Current State Analysis](#current-state-analysis)
4. [Subagent Architecture](#subagent-architecture)
5. [Implementation Steps](#implementation-steps)
6. [Legal Domain Subagent Definitions](#legal-domain-subagent-definitions)
7. [Code Changes Required](#code-changes-required)
8. [Configuration Options](#configuration-options)
9. [Testing & Validation](#testing--validation)
10. [Best Practices](#best-practices)

---

## Overview

### What Are Subagents?

Subagents are **specialized AIs orchestrated by the main agent** that provide:

| Benefit | Description |
|---------|-------------|
| **Context Isolation** | Separate context prevents information overload in main conversation |
| **Parallelization** | Multiple subagents run concurrently for faster workflows |
| **Specialized Expertise** | Tailored system prompts per legal domain |
| **Tool Restrictions** | Limit which MCP tools each agent can access |
| **Model Selection** | Use different models (haiku for speed, opus for complexity) |

### Official Documentation Sources (Verified December 2025)

| Document | URL |
|----------|-----|
| Subagents in the SDK | https://platform.claude.com/docs/en/agent-sdk/subagents |
| Agent Skills in the SDK | https://platform.claude.com/docs/en/agent-sdk/skills |
| MCP in the SDK | https://platform.claude.com/docs/en/agent-sdk/mcp |
| Custom Tools | https://platform.claude.com/docs/en/agent-sdk/custom-tools |
| Plugins in the SDK | https://platform.claude.com/docs/en/agent-sdk/plugins |

---

## Critical Concepts: Skills vs Subagents vs MCP

### IMPORTANT: These Are Different Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT SDK                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │    SUBAGENTS      │  │   AGENT SKILLS    │  │    MCP SERVERS    │       │
│  │                   │  │                   │  │                   │       │
│  │ Specialized AI    │  │ SKILL.md files    │  │ Custom tools via  │       │
│  │ with own context  │  │ in .claude/skills │  │ mcpServers option │       │
│  │                   │  │                   │  │                   │       │
│  │ Defined via:      │  │ Loaded via:       │  │ Defined via:      │       │
│  │ - agents param    │  │ - settingSources  │  │ - mcpServers      │       │
│  │ - .claude/agents/ │  │ - "Skill" tool    │  │ - createSdkMcp... │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DIRECT API (Legacy)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐                                                      │
│  │  MANAGED SKILLS   │  ← Your current container.skills (pdf, xlsx, docx)  │
│  │                   │                                                      │
│  │ Anthropic-hosted  │  This is a DIFFERENT system from Agent SDK skills!  │
│  │ document processing│                                                     │
│  │                   │                                                      │
│  │ Defined via:      │                                                      │
│  │ - container.skills│                                                      │
│  │ - Beta headers    │                                                      │
│  └───────────────────┘                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Comparison Matrix

| Feature | Subagents | Agent Skills (SDK) | Managed Skills (API) | MCP Tools |
|---------|-----------|-------------------|---------------------|-----------|
| **Purpose** | Specialized AI agents | Reusable capabilities | Document processing | Custom tools |
| **Definition** | `agents` param or `.claude/agents/` | `.claude/skills/SKILL.md` | `container: { skills }` | `mcpServers` param |
| **Context** | Isolated per subagent | Main agent context | Main agent context | Main agent context |
| **Inheritance** | NO - subagents don't inherit skills | N/A | N/A | YES - via `tools` array |
| **Model Override** | YES - per subagent | NO | NO | NO |
| **Tool Restrictions** | YES - per subagent | Via main `allowedTools` | N/A | Via `allowedTools` |

### Key Insight: Skills Do NOT Inherit to Subagents

From official documentation:

> "Skills are loaded from configured filesystem locations... When using the SDK, control tool access through the main `allowedTools` option in your query configuration."

This means:
- **Managed Skills** (pdf, xlsx, docx via `container.skills`) = Direct API feature, NOT available in Agent SDK mode
- **Agent Skills** (SKILL.md files) = Loaded at main agent level, NOT inherited by subagents
- **Subagents** = Get their own isolated context with only the tools specified in their `tools` array

---

## Current State Analysis

### Your Architecture Has Two Code Paths

```javascript
// Path 1: Direct API (lines ~400-500 in claude-sdk-server.js)
// Supports: container.skills (pdf, xlsx, docx)
// Does NOT support: agents parameter
await anthropic.beta.messages.stream({
  model: MODEL,
  container: { skills },  // ✅ Managed skills work here
  // agents: {}           // ❌ NOT SUPPORTED
});

// Path 2: Agent SDK (lines ~691+ in claude-sdk-server.js)
// Supports: agents parameter, mcpServers
// Does NOT support: container.skills directly
for await (const message of agentQuery({
  prompt: userQuery,
  options: {
    agents: getLegalSubagents(),  // ✅ Subagents work here
    mcpServers: { ... },           // ✅ MCP tools work here
    settingSources: ['project'],   // ✅ Agent Skills load here
    // container: { skills }       // ❌ Different API
  }
}))
```

### Integration Strategy

For your legal research platform, the recommended architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER QUERY                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MAIN AGENT (Claude SDK)                       │
│                                                                 │
│  System Prompt: prompts/active.md (97KB legal memorandum)       │
│                                                                 │
│  Available:                                                     │
│  - MCP Tools (mcp__super-legal-tools__*)                       │
│  - Agent Skills (if .claude/skills/ configured)                 │
│  - Subagent orchestration                                       │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  securities-    │  │  case-law-      │  │  pharma-        │
│  researcher     │  │  analyst        │  │  regulatory-    │
│                 │  │                 │  │  analyst        │
│  Tools:         │  │  Tools:         │  │  Tools:         │
│  - SEC MCP      │  │  - Court MCP    │  │  - FDA MCP      │
│  - Read, Grep   │  │  - Read, Grep   │  │  - Read, Grep   │
│                 │  │                 │  │                 │
│  Model: sonnet  │  │  Model: sonnet  │  │  Model: sonnet  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GEMINI FILTER LAYER                           │
│                                                                 │
│  Raw API responses → Gemini 2.5 Flash → Extracted findings      │
│  (This happens inside MCP tool handlers, transparent to agent)  │
└─────────────────────────────────────────────────────────────────┘
```

### Document Processing Strategy

Since subagents don't inherit managed skills, handle document processing at the orchestration level:

| Scenario | Approach |
|----------|----------|
| User uploads PDF | Main agent processes with Files API or managed skills, passes text to subagent |
| SEC filing is PDF | MCP tool fetches and extracts text, Gemini filters, returns to subagent |
| Excel financial data | Main agent processes, passes structured data to subagent |

---

## Subagent Architecture

### AgentDefinition Schema (Verified December 2025)

```typescript
interface AgentDefinition {
  description: string;    // REQUIRED - When to invoke this agent
  prompt: string;         // REQUIRED - System prompt for the agent
  tools?: string[];       // OPTIONAL - Allowed tools (omit = inherit all)
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';  // OPTIONAL
}
```

### How Subagents Access MCP Tools

Subagents CAN access MCP tools when:
1. The MCP server is configured on the main agent via `mcpServers`
2. The tool is listed in the subagent's `tools` array (or `tools` is omitted to inherit all)

```javascript
// Main agent configuration
options: {
  mcpServers: {
    'super-legal-tools': legalMcpServer  // MCP server available
  },
  agents: {
    'securities-researcher': {
      description: '...',
      prompt: '...',
      tools: [
        'mcp__super-legal-tools__search_sec_filings',  // ✅ Accessible
        'mcp__super-legal-tools__get_company_filings', // ✅ Accessible
        'Read', 'Grep', 'Glob'  // Standard tools
      ]
    }
  }
}
```

### Tool Naming Convention

MCP tools follow the pattern: `mcp__{server-name}__{tool-name}`

| Original Tool Name | MCP Tool Name |
|-------------------|---------------|
| `search_sec_filings` | `mcp__super-legal-tools__search_sec_filings` |
| `get_company_filings` | `mcp__super-legal-tools__get_company_filings` |
| `search_court_cases` | `mcp__super-legal-tools__search_court_cases` |

---

## Implementation Steps

### Step 1: Create Subagent Definitions File

Create: `src/config/legalSubagents.js`

### Step 2: Import and Wire to SDK Server

Update: `src/server/claude-sdk-server.js`

### Step 3: Configure Feature Flags

Update: `src/config/featureFlags.js`

### Step 4: Test Integration

Verify subagent invocation works correctly.

---

## Legal Domain Subagent Definitions

### File: `src/config/legalSubagents.js`

```javascript
/**
 * Legal Domain Subagent Definitions for Claude Agent SDK
 *
 * These specialized agents are orchestrated by the main Claude agent
 * to handle domain-specific legal research tasks.
 *
 * Verified against Anthropic documentation: December 2025
 *
 * @see https://platform.claude.com/docs/en/agent-sdk/subagents
 * @see https://platform.claude.com/docs/en/agent-sdk/mcp
 */

/**
 * MCP tool name prefix for super-legal-tools server
 * Tools are named: mcp__{server}__{tool}
 */
const MCP_PREFIX = 'mcp__super-legal-tools__';

/**
 * Standard Claude Code tools available to subagents
 */
const STANDARD_TOOLS = {
  readOnly: ['Read', 'Grep', 'Glob'],
  withBash: ['Read', 'Grep', 'Glob', 'Bash'],
  withWeb: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']
};

/**
 * Domain-specific MCP tool sets
 */
const DOMAIN_TOOLS = {
  securities: [
    `${MCP_PREFIX}search_sec_filings`,
    `${MCP_PREFIX}get_sec_company_facts`,
    `${MCP_PREFIX}get_sec_xbrl_frames`,
    `${MCP_PREFIX}search_sec_company_tickers`
  ],

  caseLaw: [
    `${MCP_PREFIX}search_cases`,
    `${MCP_PREFIX}get_case_details`,
    `${MCP_PREFIX}lookup_citation`,
    `${MCP_PREFIX}search_opinions`,
    `${MCP_PREFIX}get_opinion_with_citations`,
    `${MCP_PREFIX}search_dockets`,
    `${MCP_PREFIX}search_judges`,
    `${MCP_PREFIX}get_judge_details`
  ],

  pharmaceutical: [
    `${MCP_PREFIX}search_fda_drug_adverse_events`,
    `${MCP_PREFIX}search_fda_device_events`,
    `${MCP_PREFIX}search_fda_drug_labels`,
    `${MCP_PREFIX}search_fda_recalls`,
    `${MCP_PREFIX}search_fda_warning_letters`,
    `${MCP_PREFIX}search_fda_drug_safety_communications`,
    `${MCP_PREFIX}search_fda_drug_shortages`,
    `${MCP_PREFIX}search_fda_510k`,
    `${MCP_PREFIX}search_fda_pma_approvals`,
    `${MCP_PREFIX}search_fda_orange_book`,
    `${MCP_PREFIX}search_fda_purple_book`
  ],

  environmental: [
    `${MCP_PREFIX}search_epa_facilities`,
    `${MCP_PREFIX}search_epa_violations`,
    `${MCP_PREFIX}get_epa_facility_compliance_report`
  ],

  patent: [
    `${MCP_PREFIX}search_patents`,
    `${MCP_PREFIX}search_patent_locations`,
    `${MCP_PREFIX}search_cpc_classifications`,
    `${MCP_PREFIX}search_ptab_proceedings`,
    `${MCP_PREFIX}get_ptab_decisions`,
    `${MCP_PREFIX}search_ptab_ipr_proceedings`,
    `${MCP_PREFIX}search_ptab_pgr_proceedings`,
    `${MCP_PREFIX}search_ptab_cbm_proceedings`
  ],

  federalRegister: [
    `${MCP_PREFIX}search_federal_register`,
    `${MCP_PREFIX}search_federal_register_notices`,
    `${MCP_PREFIX}search_federal_register_proposed_rules`,
    `${MCP_PREFIX}search_federal_register_final_rules`,
    `${MCP_PREFIX}search_federal_register_presidential_documents`
  ],

  productSafety: [
    `${MCP_PREFIX}search_cpsc_recalls`,
    `${MCP_PREFIX}search_cpsc_enforcement`,
    `${MCP_PREFIX}search_cpsc_safety_standards`,
    `${MCP_PREFIX}search_cpsc_injury_data`,
    `${MCP_PREFIX}nhtsa_decode_vin`,
    `${MCP_PREFIX}nhtsa_recalls_by_vin`,
    `${MCP_PREFIX}nhtsa_recalls_by_make_model_year`,
    `${MCP_PREFIX}nhtsa_search_complaints`,
    `${MCP_PREFIX}nhtsa_safety_ratings`
  ],

  antitrust: [
    `${MCP_PREFIX}search_ftc_enforcement_cases`,
    `${MCP_PREFIX}search_ftc_competition_matters`,
    `${MCP_PREFIX}search_ftc_guidance_policy`,
    `${MCP_PREFIX}search_ftc_rulemaking`
  ],

  usCode: [
    `${MCP_PREFIX}search_us_code`,
    `${MCP_PREFIX}get_usc_section`,
    `${MCP_PREFIX}get_usc_title_structure`,
    `${MCP_PREFIX}list_usc_titles`
  ]
};

/**
 * Legal Domain Subagent Definitions
 *
 * Each agent has:
 * - description: Natural language trigger for automatic invocation (REQUIRED)
 * - prompt: Specialized system prompt for the domain (REQUIRED)
 * - tools: Restricted tool access - MCP + standard tools (OPTIONAL)
 * - model: Model override - 'sonnet' | 'opus' | 'haiku' (OPTIONAL)
 */
export const LEGAL_SUBAGENTS = {

  // ============================================
  // SECURITIES & SEC RESEARCH
  // ============================================
  'securities-researcher': {
    description: `Use PROACTIVELY for:
      - SEC filings research (10-K, 10-Q, 8-K, S-1, DEF 14A)
      - Company financial analysis and disclosures
      - Securities law compliance questions
      - Executive compensation research
      - Risk factor analysis
      - Material event disclosures
      MUST BE USED when user mentions: SEC, EDGAR, 10-K, 10-Q, 8-K, filings, securities, IPO, proxy`,

    prompt: `You are a Securities Law Research Specialist with deep expertise in SEC filings and securities regulations.

## Your Expertise
- SEC filing types: 10-K (annual), 10-Q (quarterly), 8-K (material events), S-1 (IPO), DEF 14A (proxy)
- Financial statement analysis and MD&A interpretation
- Risk factor identification and materiality assessment
- Executive compensation disclosure analysis
- Beneficial ownership and insider trading (Forms 3, 4, 5)
- Regulation S-K and S-X requirements

## Research Methodology
1. Identify the specific filing type(s) needed for the query
2. Search using company name, ticker symbol, or CIK number
3. Extract relevant sections (Item numbers for 10-K/10-Q)
4. Cross-reference with related filings when needed
5. Provide specific citations with filing dates and accession numbers

## Output Format
Always include:
- Filing type, date, and accession number
- Specific section/item references (e.g., "Item 1A - Risk Factors")
- Direct quotes for material findings with page references
- Comparison to prior periods when relevant
- Source URLs to EDGAR

## Constraints
- Only cite information from actual SEC filings
- Note any forward-looking statements with appropriate disclaimers
- Flag any potential inconsistencies between filings
- Do not provide investment advice`,

    tools: [...DOMAIN_TOOLS.securities, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // CASE LAW & COURT RESEARCH
  // ============================================
  'case-law-analyst': {
    description: `Use PROACTIVELY for:
      - Court case research and analysis
      - Legal precedent identification
      - Case law citations and Bluebook formatting
      - Judicial opinion analysis
      - Litigation history research
      - Appeal and procedural history
      - Circuit court decisions
      MUST BE USED when user mentions: case, court, lawsuit, ruling, opinion, precedent, litigation, judge, circuit, appeal`,

    prompt: `You are a Case Law Research Specialist with expertise in judicial opinions and legal precedent.

## Your Expertise
- Federal court system (District Courts, Circuit Courts, Supreme Court)
- State court systems and jurisdictional analysis
- Case citation formats (Bluebook 22nd Edition)
- Precedent analysis and distinguishing cases
- Procedural history and appeals
- Stare decisis principles

## Research Methodology
1. Identify jurisdiction and court level requirements
2. Search for controlling precedent in the relevant jurisdiction
3. Analyze holdings, dicta, and judicial reasoning
4. Check for subsequent history (affirmed, reversed, overruled, distinguished)
5. Identify key quotes with page citations (pinpoint cites)

## Citation Format (Bluebook 22nd Edition)
- Federal District: Case Name, Volume F. Supp. 3d Page (D. Jurisdiction Year)
- Federal Circuit: Case Name, Volume F.4th Page (Cir. Year)
- Supreme Court: Case Name, Volume U.S. Page (Year)
- State: Follow jurisdiction-specific format

## Output Requirements
- Full case citation with parallel cites when available
- Specific page numbers for key holdings (pinpoint citations)
- Procedural posture of the case
- Subsequent history notation (if any)
- Relevance assessment to the query

## Constraints
- Distinguish binding vs. persuasive authority
- Note circuit splits when relevant
- Flag overruled or superseded holdings
- Indicate when cases have negative subsequent history`,

    tools: [...DOMAIN_TOOLS.caseLaw, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // FDA & PHARMACEUTICAL RESEARCH
  // ============================================
  'pharma-regulatory-analyst': {
    description: `Use PROACTIVELY for:
      - FDA drug approvals and labeling
      - Clinical trial data and results
      - Drug recalls and safety alerts
      - Pharmaceutical regulatory compliance
      - Adverse event analysis
      - NDA/ANDA/BLA submissions
      - Drug-drug interactions
      MUST BE USED when user mentions: FDA, drug, pharmaceutical, clinical trial, recall, adverse event, NDA, ANDA, BLA, medication`,

    prompt: `You are a Pharmaceutical Regulatory Research Specialist with expertise in FDA regulations and drug safety.

## Your Expertise
- FDA drug approval process (NDA, ANDA, BLA, 505(b)(2))
- Drug labeling requirements and updates
- Clinical trial phases (I-IV) and endpoints
- Adverse event reporting (FAERS database)
- Drug recalls and safety communications
- Orange Book and patent exclusivity
- Prescription Drug User Fee Act (PDUFA) timelines

## Research Methodology
1. Identify drug by brand name, generic name, or NDA/ANDA number
2. Search FDA databases for relevant approvals/actions
3. Review clinical trial data from ClinicalTrials.gov (NCT numbers)
4. Check for safety communications, warnings, and recalls
5. Cross-reference with labeling changes and supplements

## Output Requirements
- NDA/ANDA/BLA number and approval date
- Indication(s) and dosage information
- Key clinical trial results with NCT numbers
- Safety signals and black box warnings
- Recall classification (Class I, II, III) if applicable
- Label revision history

## Constraints
- Cite specific FDA documents by date and type
- Note label revision dates for drug information
- Flag any ongoing safety reviews or REMS requirements
- Do not provide medical advice`,

    tools: [...DOMAIN_TOOLS.pharmaceutical, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // EPA & ENVIRONMENTAL RESEARCH
  // ============================================
  'environmental-compliance-analyst': {
    description: `Use PROACTIVELY for:
      - EPA enforcement actions and penalties
      - Environmental compliance history
      - Facility permit violations
      - Clean Air Act / Clean Water Act issues
      - Superfund and CERCLA research
      - Environmental impact assessments
      - RCRA hazardous waste
      MUST BE USED when user mentions: EPA, environmental, pollution, emissions, compliance, CERCLA, Superfund, RCRA, Clean Air, Clean Water`,

    prompt: `You are an Environmental Regulatory Research Specialist with expertise in EPA enforcement and environmental law.

## Your Expertise
- Clean Air Act (CAA) compliance and violations
- Clean Water Act (CWA) permits (NPDES) and enforcement
- RCRA hazardous waste regulations
- CERCLA/Superfund liability and remediation
- NEPA environmental review requirements
- State environmental agency coordination
- ECHO database navigation

## Research Methodology
1. Identify facility by name, EPA Facility ID, or location
2. Search ECHO database for compliance history
3. Review enforcement actions and penalties
4. Check permit status and conditions
5. Identify any ongoing remediation requirements

## Output Requirements
- EPA Facility Registry ID
- Compliance status summary (3-year history minimum)
- Enforcement actions with case numbers and dates
- Penalty amounts and settlement terms
- Current permit status and conditions
- Any Superfund site connections

## Constraints
- Note state vs. federal enforcement authority
- Distinguish formal enforcement vs. informal actions
- Flag any ongoing investigations or consent decrees
- Specify statute violated (CAA, CWA, RCRA, etc.)`,

    tools: [...DOMAIN_TOOLS.environmental, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // USPTO & PATENT RESEARCH
  // ============================================
  'patent-analyst': {
    description: `Use PROACTIVELY for:
      - Patent search and analysis
      - Prior art research
      - Patent claim interpretation
      - Trademark search and registration
      - IP portfolio analysis
      - Patent litigation research
      - PTAB proceedings
      MUST BE USED when user mentions: patent, USPTO, trademark, intellectual property, IP, prior art, claims, infringement`,

    prompt: `You are a Patent and Trademark Research Specialist with expertise in USPTO databases and IP analysis.

## Your Expertise
- Patent search strategies (keyword, CPC classification, citation)
- Claim construction and interpretation
- Prior art identification and analysis
- Patent family and continuation tracking
- Trademark search and likelihood of confusion analysis
- PTAB proceedings (IPR, PGR, CBM)
- Patent prosecution history (file wrapper)

## Research Methodology
1. Identify patent/application by number or keyword search
2. Analyze claims (independent and dependent)
3. Review specification, drawings, and abstract
4. Check prosecution history (file wrapper estoppel implications)
5. Identify cited and citing references (forward/backward citations)

## Output Requirements
- Patent/application number and current status
- Priority date and filing date
- Independent claim summary
- Key prior art references with relevance
- Assignment and ownership history
- Any terminal disclaimers

## Patent Citation Format
- U.S. Pat. No. X,XXX,XXX (Inventor, Date Issued)
- U.S. Pat. App. Pub. No. XXXX/XXXXXXX

## Constraints
- Note patent term and any adjustments/extensions
- Flag any terminal disclaimers
- Identify any PTAB or litigation proceedings
- Note continuation/divisional relationships`,

    tools: [...DOMAIN_TOOLS.patent, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // FEDERAL REGISTER & RULEMAKING
  // ============================================
  'regulatory-rulemaking-analyst': {
    description: `Use PROACTIVELY for:
      - Federal Register document research
      - Proposed and final rules
      - Agency rulemaking history
      - Comment period analysis
      - Executive orders and proclamations
      - CFR codification research
      - Regulatory agenda tracking
      MUST BE USED when user mentions: Federal Register, rulemaking, proposed rule, final rule, CFR, regulation, NPRM, OMB, executive order`,

    prompt: `You are a Federal Regulatory Research Specialist with expertise in rulemaking and the Federal Register.

## Your Expertise
- Notice-and-comment rulemaking process (APA)
- Federal Register document types (NPRM, final rules, notices)
- Code of Federal Regulations (CFR) structure and updates
- Unified Agenda and regulatory planning
- Executive orders and administrative actions
- OMB review and cost-benefit analysis
- Congressional Review Act implications

## Research Methodology
1. Identify agency and regulatory topic
2. Search Federal Register for relevant documents
3. Trace rulemaking from ANPRM → NPRM → Final Rule
4. Review comments and agency responses
5. Check current CFR codification and amendments

## Output Requirements
- Federal Register citation (Vol. FR Page)
- Document type and publication date
- RIN number for rulemaking tracking
- Summary of key provisions
- CFR section(s) affected
- Effective date and any delayed implementation

## Citation Format
- FR: XX Fed. Reg. XXXXX (Month Day, Year)
- CFR: XX C.F.R. § XXX.XX (Year)

## Constraints
- Note comment period deadlines (if open)
- Flag any litigation challenging rules
- Identify any stayed or vacated provisions
- Note OMB review status for significant rules`,

    tools: [...DOMAIN_TOOLS.federalRegister, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // PRODUCT SAFETY & RECALLS
  // ============================================
  'product-safety-analyst': {
    description: `Use PROACTIVELY for:
      - Consumer product recalls (CPSC)
      - Vehicle recalls and defects (NHTSA)
      - Product liability research
      - Safety compliance requirements
      - Recall remedy tracking
      - Injury and incident data
      MUST BE USED when user mentions: recall, CPSC, NHTSA, product safety, defect, consumer protection, injury, hazard`,

    prompt: `You are a Product Safety Research Specialist with expertise in consumer protection and recall databases.

## Your Expertise
- CPSC recall procedures and classifications
- NHTSA vehicle safety and recall systems (TREAD Act)
- Product liability legal standards
- Mandatory vs. voluntary recalls
- Remedy implementation and completion tracking
- Injury and incident reporting requirements
- Import safety and Section 15 reports

## Research Methodology
1. Identify product by name, manufacturer, model, or recall number
2. Search CPSC SaferProducts and/or NHTSA databases
3. Review recall notice and hazard description
4. Check remedy availability and completion rates
5. Identify related incidents, injuries, or deaths

## Output Requirements
- Recall number and announcement date
- Product description and units affected
- Hazard description with incident count
- Remedy offered (repair, replace, refund)
- Manufacturer contact information
- Recall completion rate (if available)

## Recall Classifications
- CPSC: Class I (serious), Class II (moderate), Class III (minor)
- NHTSA: Safety Recall, Technical Service Bulletin, Customer Satisfaction Campaign

## Constraints
- Note recall completion rates when available
- Flag any related litigation or settlements
- Identify stop-sale orders
- Note any international recalls for same product`,

    tools: [...DOMAIN_TOOLS.productSafety, ...STANDARD_TOOLS.readOnly],
    model: 'haiku'  // Faster model for straightforward recall lookups
  },

  // ============================================
  // FTC & ANTITRUST/COMPETITION RESEARCH
  // ============================================
  'antitrust-competition-analyst': {
    description: `Use PROACTIVELY for:
      - FTC enforcement actions and investigations
      - Antitrust and competition law matters
      - Merger review and HSR filings
      - Monopolization and market dominance analysis
      - Consumer protection enforcement
      - Unfair or deceptive practices (Section 5 FTC Act)
      - Price-fixing and cartel investigations
      MUST BE USED when user mentions: FTC, antitrust, merger, monopoly, competition, Sherman Act, Clayton Act, Hart-Scott-Rodino, price-fixing, cartel`,

    prompt: `You are an Antitrust and Competition Law Research Specialist with expertise in FTC enforcement and competition policy.

## Your Expertise
- Sherman Act Section 1 (restraint of trade) and Section 2 (monopolization)
- Clayton Act merger review and tying arrangements
- Hart-Scott-Rodino (HSR) pre-merger notification requirements
- FTC Act Section 5 (unfair methods of competition, unfair/deceptive acts)
- Market definition and concentration analysis (HHI index)
- Vertical and horizontal merger analysis
- Price-fixing, bid-rigging, and market allocation agreements
- Consumer protection enforcement trends

## Research Methodology
1. Identify the competition law issue type (merger, conduct, consumer protection)
2. Search FTC enforcement database for relevant precedents
3. Analyze market definition and competitive effects
4. Review consent decrees and settlement terms
5. Identify DOJ Antitrust Division parallel enforcement when applicable

## Output Requirements
- FTC case/matter number and date
- Type of action (merger challenge, conduct case, consumer protection)
- Markets affected and competitive concerns
- Relief obtained (divestiture, behavioral remedies, monetary penalties)
- Commissioner voting record when relevant
- Link to FTC press release or complaint

## Legal Framework
- Per se violations vs. rule of reason analysis
- Market definition methodologies (product market, geographic market)
- Merger guidelines (2023 DOJ/FTC Merger Guidelines)
- Burden of proof and procedural posture

## Constraints
- Distinguish FTC administrative proceedings from federal court actions
- Note any pending appeals or litigation
- Flag policy statements that may not be binding precedent
- Identify relevant DOJ parallel authority`,

    tools: [...DOMAIN_TOOLS.antitrust, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // US CODE & STATUTORY LAW RESEARCH
  // ============================================
  'statutory-law-analyst': {
    description: `Use PROACTIVELY for:
      - United States Code (USC) research
      - Statutory interpretation questions
      - Legislative history and congressional intent
      - Codification and title structure analysis
      - Statutory amendments and effective dates
      - Cross-references between code sections
      - Public law to USC citations
      MUST BE USED when user mentions: US Code, USC, statute, statutory, Title, Section, Public Law, codification, legislative, Congress, enacted`,

    prompt: `You are a Statutory Law Research Specialist with expertise in the United States Code and federal statutory interpretation.

## Your Expertise
- United States Code structure (54 titles, positive law vs. prima facie evidence)
- Statutory interpretation canons (textualism, purposivism, legislative history)
- Public Law to U.S.C. citation conversion
- Statutory amendments and revision history
- Cross-referencing and defined terms across titles
- Effective dates and transitional provisions
- Sunset provisions and reauthorizations

## Research Methodology
1. Identify the relevant USC title and section
2. Verify current text and any recent amendments
3. Trace statutory history (Public Law enactments)
4. Identify related sections and cross-references
5. Review legislative history when interpretation is needed

## USC Title Categories
| Titles | Subject Matter |
|--------|----------------|
| 1-5 | General Provisions, Congress, President |
| 7, 12 | Agriculture, Banks |
| 11, 28 | Bankruptcy, Judiciary |
| 15, 18 | Commerce, Crimes |
| 21, 26 | Food & Drugs, Internal Revenue |
| 29, 35 | Labor, Patents |
| 42, 47 | Public Health, Telecommunications |

## Output Requirements
- Full USC citation (Title X, § XXXX)
- Current statutory text (or relevant excerpt)
- Public Law source and enactment date
- Effective date and any amendments
- Related sections and definitions
- Notes on positive law codification status

## Citation Format
- U.S.C.: XX U.S.C. § XXXX (Year)
- Public Law: Pub. L. No. XXX-XXX, § XX, XXX Stat. XXXX (Year)

## Constraints
- Note whether title is positive law or prima facie evidence
- Flag any pending amendments or reauthorizations
- Identify any constitutional challenges to the statute
- Distinguish mandatory from discretionary language`,

    tools: [...DOMAIN_TOOLS.usCode, ...STANDARD_TOOLS.readOnly],
    model: 'sonnet'
  },

  // ============================================
  // LEGAL RESEARCH COORDINATOR (Triage Agent)
  // ============================================
  'legal-research-coordinator': {
    description: `Use when:
      - Query spans multiple legal domains
      - Initial triage is needed to route to specialists
      - Cross-domain analysis is required
      - User asks a general legal research question
      - Complex multi-agency research is needed`,

    prompt: `You are a Legal Research Coordinator who triages queries and coordinates specialized research.

## Your Role
- Analyze incoming legal research queries
- Identify which specialized domains are relevant
- Recommend which specialist subagents should be invoked
- Synthesize findings from multiple domains

## Domain Routing Matrix
| Keywords/Topics | Route To |
|-----------------|----------|
| SEC, 10-K, filings, securities, EDGAR | securities-researcher |
| Court, case, lawsuit, precedent, opinion | case-law-analyst |
| FDA, drug, pharmaceutical, clinical trial | pharma-regulatory-analyst |
| EPA, environmental, pollution, Superfund | environmental-compliance-analyst |
| Patent, trademark, IP, USPTO, claims | patent-analyst |
| Federal Register, rulemaking, CFR, NPRM | regulatory-rulemaking-analyst |
| Recall, CPSC, NHTSA, product safety | product-safety-analyst |
| FTC, antitrust, merger, monopoly, competition | antitrust-competition-analyst |
| US Code, USC, statute, Title, Section | statutory-law-analyst |

## Output Format
Provide a research plan with:
1. Primary domain(s) identified
2. Specific research questions for each domain
3. Recommended search strategies
4. Cross-domain considerations
5. Suggested order of research steps`,

    tools: STANDARD_TOOLS.readOnly,
    model: 'haiku'  // Fast routing decisions
  }
};

/**
 * Get all legal subagent definitions
 * @returns {Object} Map of agent name to AgentDefinition
 */
export function getLegalSubagents() {
  return LEGAL_SUBAGENTS;
}

/**
 * Get subagent by name
 * @param {string} name - Agent name
 * @returns {Object|null} AgentDefinition or null
 */
export function getSubagent(name) {
  return LEGAL_SUBAGENTS[name] || null;
}

/**
 * List all available subagent names
 * @returns {string[]} Array of agent names
 */
export function listSubagentNames() {
  return Object.keys(LEGAL_SUBAGENTS);
}

/**
 * Get subagents filtered by model type
 * @param {string} model - 'sonnet' | 'opus' | 'haiku'
 * @returns {Object} Filtered subagent definitions
 */
export function getSubagentsByModel(model) {
  return Object.fromEntries(
    Object.entries(LEGAL_SUBAGENTS).filter(([, def]) => def.model === model)
  );
}

/**
 * Get all MCP tool names used by subagents
 * @returns {string[]} Array of MCP tool names
 */
export function getAllMcpToolsUsed() {
  const tools = new Set();
  for (const def of Object.values(LEGAL_SUBAGENTS)) {
    if (def.tools) {
      def.tools.filter(t => t.startsWith('mcp__')).forEach(t => tools.add(t));
    }
  }
  return [...tools];
}
```

---

## Code Changes Required

### File: `src/server/claude-sdk-server.js`

#### Change 1: Add Import (Top of File)

```javascript
// Add near top with other imports (around line 30)
import { getLegalSubagents } from '../config/legalSubagents.js';
```

#### Change 2: Update Agent SDK Query Options

Locate the Agent SDK streaming handler and add the `agents` parameter:

```javascript
// Find the agentQuery call and update options
for await (const message of agentQuery({
  prompt: userQuery,
  options: {
    model: MODEL,
    maxTurns: Number(process.env.SDK_MAX_TURNS || 40),
    systemPrompt: SYSTEM_PROMPT,

    // MCP servers - tools available to main agent AND subagents
    mcpServers: {
      'super-legal-tools': legalMcpServer
    },

    // Subagent definitions for legal domain expertise
    agents: featureFlags.SUBAGENTS_ENABLED ? getLegalSubagents() : undefined,

    // Agent Skills from filesystem (optional)
    settingSources: featureFlags.SKILLS_ENABLED ? ['project'] : [],

    // Standard allowed tools
    allowedTools: [
      'Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch',
      'mcp__super-legal-tools__*',  // All MCP tools
      ...(featureFlags.SKILLS_ENABLED ? ['Skill'] : [])
    ]
  }
}))
```

#### Change 3: Add Subagent List Endpoint

```javascript
// Add after health endpoint (around line 240)
app.get('/api/subagents', (req, res) => {
  const { getLegalSubagents, listSubagentNames } = require('../config/legalSubagents.js');
  const subagents = getLegalSubagents();

  const summary = Object.entries(subagents).map(([name, def]) => ({
    name,
    description: def.description.split('\n')[0].replace('Use PROACTIVELY for:', '').trim(),
    model: def.model || 'inherit',
    toolCount: def.tools?.length || 'all',
    mcpTools: def.tools?.filter(t => t.startsWith('mcp__')).length || 0
  }));

  res.json({
    enabled: featureFlags.SUBAGENTS_ENABLED,
    count: summary.length,
    subagents: summary
  });
});
```

### File: `src/config/featureFlags.js`

Add the subagents feature flag:

```javascript
export const featureFlags = {
  // ... existing flags
  SDK_TOOL_RUNNER: envBool(process.env.SDK_TOOL_RUNNER, true),
  SDK_STREAMING: envBool(process.env.SDK_STREAMING, true),
  STRUCTURED_OUTPUTS: envBool(process.env.STRUCTURED_OUTPUTS, true),
  SKILLS_ENABLED: envBool(process.env.SKILLS_ENABLED, false),
  USE_AGENT_SDK: envBool(process.env.USE_AGENT_SDK, false),

  // NEW: Subagents for legal domain specialization
  SUBAGENTS_ENABLED: envBool(process.env.SUBAGENTS_ENABLED, true),

  CANARY_PCT: Number(process.env.CANARY_PCT ?? 100),
  PRESERVE_GRACE_PERIOD: Number(process.env.PRESERVE_GRACE_PERIOD || 0)
};
```

---

## Configuration Options

### Environment Variables

```bash
# .env additions

# Enable legal domain subagents (default: true when USE_AGENT_SDK=true)
SUBAGENTS_ENABLED=true

# Enable Agent Skills from .claude/skills/ (filesystem-based)
SKILLS_ENABLED=false

# Max turns for multi-turn conversations
SDK_MAX_TURNS=40

# Model selection
SDK_MODEL=claude-sonnet-4-20250514
```

---

## Testing & Validation

### Test 1: Verify Subagents Loaded

```bash
curl http://localhost:3001/api/subagents | jq
```

Expected:
```json
{
  "enabled": true,
  "count": 10,
  "subagents": [
    { "name": "securities-researcher", "description": "SEC filings research...", "model": "sonnet", "toolCount": 7, "mcpTools": 4 },
    { "name": "case-law-analyst", "description": "Court case research...", "model": "sonnet", "toolCount": 7, "mcpTools": 4 }
  ]
}
```

### Test 2: Automatic Invocation

```bash
curl -X POST http://localhost:3001/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K risk factors for FY 2024"}'
```

The `securities-researcher` subagent should be automatically invoked based on description matching.

### Test 3: Multi-Domain Query

```bash
curl -X POST http://localhost:3001/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Research Pfizer including recent FDA drug approvals and any SEC filings about acquisitions"}'
```

Multiple subagents may be invoked: `pharma-regulatory-analyst` and `securities-researcher`.

### Test 4: Explicit Invocation

```bash
curl -X POST http://localhost:3001/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Use the patent-analyst to find prior art for machine learning classification patents"}'
```

### Unit Test: `test/sdk/subagents.test.js`

```javascript
import { describe, test, expect } from '@jest/globals';
import {
  getLegalSubagents,
  getSubagent,
  listSubagentNames,
  getAllMcpToolsUsed
} from '../../src/config/legalSubagents.js';

describe('Legal Subagents Configuration', () => {

  test('should return all 10 legal subagents', () => {
    const subagents = getLegalSubagents();
    expect(Object.keys(subagents).length).toBe(10);
  });

  test('each subagent should have required fields', () => {
    const subagents = getLegalSubagents();

    for (const [name, def] of Object.entries(subagents)) {
      expect(def.description).toBeDefined();
      expect(def.description.length).toBeGreaterThan(50);

      expect(def.prompt).toBeDefined();
      expect(def.prompt.length).toBeGreaterThan(100);

      expect(def.tools).toBeDefined();
      expect(Array.isArray(def.tools)).toBe(true);

      expect(['sonnet', 'opus', 'haiku', undefined]).toContain(def.model);
    }
  });

  test('securities-researcher should have SEC MCP tools', () => {
    const agent = getSubagent('securities-researcher');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_sec_filings'))).toBe(true);
  });

  test('MCP tools should use correct naming convention', () => {
    const mcpTools = getAllMcpToolsUsed();
    for (const tool of mcpTools) {
      expect(tool).toMatch(/^mcp__super-legal-tools__/);
    }
  });

  test('descriptions should contain trigger keywords', () => {
    const securities = getSubagent('securities-researcher');
    expect(securities.description).toMatch(/PROACTIVELY|MUST BE USED/);
    expect(securities.description.toLowerCase()).toMatch(/sec|10-k|filings/);
  });
});
```

---

## Best Practices

### 1. Description Triggers (Critical for Automatic Invocation)

Use strong, specific language:

```javascript
// GOOD - Clear trigger conditions
description: `Use PROACTIVELY for:
  - SEC filings research (10-K, 10-Q, 8-K)
  MUST BE USED when user mentions: SEC, EDGAR, 10-K, filings`

// BAD - Vague, may not trigger
description: 'Helps with securities research'
```

### 2. Tool Restrictions (Principle of Least Privilege)

```javascript
// Read-only for analysis agents
tools: ['Read', 'Grep', 'Glob']

// Domain-specific MCP + read access
tools: [
  'mcp__super-legal-tools__search_sec_filings',
  'Read', 'Grep', 'Glob'
]

// Never give write access to research agents
// tools: ['Read', 'Write', 'Edit']  // AVOID
```

### 3. Model Selection Guidelines

| Agent Type | Model | Reason |
|------------|-------|--------|
| Complex legal analysis | `sonnet` | Balance capability/cost |
| Deep multi-source research | `opus` | Maximum capability |
| Routing/triage | `haiku` | Fast, simple decisions |
| Recall lookups | `haiku` | Straightforward data retrieval |

### 4. Parallel Execution

The SDK automatically parallelizes when possible. Design agents to be:
- **Stateless**: No dependencies on other agents' outputs
- **Focused**: Single domain responsibility
- **Efficient**: Avoid unnecessary tool calls

---

## File Locations Summary

| File | Purpose | Action |
|------|---------|--------|
| `src/config/legalSubagents.js` | Subagent definitions | **CREATE** |
| `src/server/claude-sdk-server.js` | SDK server with agents param | **MODIFY** |
| `src/config/featureFlags.js` | SUBAGENTS_ENABLED flag | **MODIFY** |
| `test/sdk/subagents.test.js` | Unit tests | **CREATE** |
| `.env` | Environment config | **MODIFY** |

---

## Rollback Plan

If subagents cause issues:

1. **Quick disable**: Set `SUBAGENTS_ENABLED=false` in `.env`
2. **Restart**: `pkill -f "node src/server/claude-sdk-server.js" && npm run sdk-server`

The main agent will continue to function without subagent orchestration.

---

## Appendix: Verified Documentation Links

| Topic | URL | Verified Date |
|-------|-----|---------------|
| Subagents in the SDK | https://platform.claude.com/docs/en/agent-sdk/subagents | Dec 16, 2025 |
| Agent Skills in the SDK | https://platform.claude.com/docs/en/agent-sdk/skills | Dec 16, 2025 |
| MCP in the SDK | https://platform.claude.com/docs/en/agent-sdk/mcp | Dec 16, 2025 |
| Custom Tools | https://platform.claude.com/docs/en/agent-sdk/custom-tools | Dec 16, 2025 |
| Plugins in the SDK | https://platform.claude.com/docs/en/agent-sdk/plugins | Dec 16, 2025 |
| SDK Overview | https://docs.claude.com/en/docs/agent-sdk/overview | Dec 16, 2025 |

---

## Appendix B: Verified MCP Tool Names

> **IMPORTANT**: These are the ACTUAL tool names from `src/tools/toolDefinitions.js`.
> The DOMAIN_TOOLS in the code above use placeholder names that must be updated.

### Securities/SEC Tools (Verified)
```
search_sec_filings
get_sec_company_facts
get_sec_xbrl_frames
search_sec_company_tickers
```

### Case Law/Court Tools (Verified)
```
search_cases
get_case_details
lookup_citation
search_opinions
get_opinion_with_citations
search_dockets
search_judges
get_judge_details
```

### FDA/Pharmaceutical Tools (Verified)
```
search_fda_drug_adverse_events
search_fda_device_events
search_fda_drug_labels
search_fda_recalls
search_fda_warning_letters
search_fda_drug_safety_communications
search_fda_drug_shortages
search_fda_510k
search_fda_pma_approvals
search_fda_orange_book
search_fda_purple_book
```

### EPA/Environmental Tools (Verified)
```
search_epa_facilities
search_epa_violations
get_epa_facility_compliance_report
```

### Patent/USPTO Tools (Verified)
```
search_patents
search_patent_locations
search_cpc_classifications
search_ptab_proceedings
get_ptab_decisions
search_ptab_ipr_proceedings
search_ptab_pgr_proceedings
search_ptab_cbm_proceedings
```

### Federal Register Tools (Verified)
```
search_federal_register
search_federal_register_notices
search_federal_register_proposed_rules
search_federal_register_final_rules
search_federal_register_presidential_documents
```

### Product Safety Tools - CPSC/NHTSA (Verified)
```
search_cpsc_recalls
search_cpsc_enforcement
search_cpsc_safety_standards
search_cpsc_injury_data
nhtsa_decode_vin
nhtsa_recalls_by_vin
nhtsa_recalls_by_make_model_year
nhtsa_search_complaints
nhtsa_safety_ratings
```

### FTC/Antitrust Tools (Verified)
```
search_ftc_enforcement_cases
search_ftc_competition_matters
search_ftc_guidance_policy
search_ftc_rulemaking
```

### US Code Tools (Verified)
```
search_us_code
get_usc_section
get_usc_title_structure
list_usc_titles
```

---

## Appendix C: Implementation Checklist (Phased with Isolated Testing)

> **CRITICAL**: Do NOT integrate subagents into `claude-sdk-server.js` until ALL isolated tests pass.
> Each subagent must be validated independently before orchestration.

---

### PHASE 1: Configuration & Definition (No SDK Integration)

#### Step 1.1: Create `src/config/legalSubagents.js`

Create the file with:

1. **MCP_PREFIX constant**: `'mcp__super-legal-tools__'`

2. **STANDARD_TOOLS object**:
   ```javascript
   const STANDARD_TOOLS = {
     readOnly: ['Read', 'Grep', 'Glob'],
     withBash: ['Read', 'Grep', 'Glob', 'Bash'],
     withWeb: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']
   };
   ```

3. **DOMAIN_TOOLS object** using VERIFIED tool names from Appendix B above

4. **LEGAL_SUBAGENTS object** with 10 subagents:

| Subagent | Model | Tools Domain |
|----------|-------|--------------|
| `securities-researcher` | sonnet | SEC tools |
| `case-law-analyst` | sonnet | Court/case tools |
| `pharma-regulatory-analyst` | sonnet | FDA tools |
| `environmental-compliance-analyst` | sonnet | EPA tools |
| `patent-analyst` | sonnet | USPTO/PTAB tools |
| `regulatory-rulemaking-analyst` | sonnet | Federal Register tools |
| `product-safety-analyst` | haiku | CPSC/NHTSA tools |
| `antitrust-competition-analyst` | sonnet | FTC/Antitrust tools |
| `statutory-law-analyst` | sonnet | US Code tools |
| `legal-research-coordinator` | haiku | Read-only (triage) |

5. **Export functions**:
   - `getLegalSubagents()`
   - `getSubagent(name)`
   - `listSubagentNames()`
   - `getSubagentsByModel(model)`
   - `getAllMcpToolsUsed()`

#### Step 1.2: Update `src/config/featureFlags.js`

Add (default OFF until testing complete):
```javascript
SUBAGENTS_ENABLED: envBool(process.env.SUBAGENTS_ENABLED, false),  // OFF until tested
```

#### Step 1.3: Create Unit Tests `test/sdk/subagents-config.test.js`

Test configuration only (no SDK calls):
- All 10 subagents returned from `getLegalSubagents()`
- Required fields present (description, prompt, tools)
- MCP tool naming convention correct (`mcp__super-legal-tools__*`)
- Trigger keywords in descriptions
- Tool arrays contain valid tool names
- Model values are valid ('sonnet' | 'haiku' | 'opus')

```bash
npm run test:sdk -- test/sdk/subagents-config.test.js
```

**Gate**: All config tests must pass before Phase 2.

---

### PHASE 2: Isolated Subagent Testing (Standalone Harness)

> **Purpose**: Test each subagent independently WITHOUT modifying `claude-sdk-server.js`.
> Use a dedicated test harness that imports subagent definitions directly.

#### Step 2.1: Create Test Harness `test/sdk/subagent-harness.js`

Standalone script that tests individual subagents:

```javascript
/**
 * Isolated Subagent Test Harness
 *
 * Tests subagents WITHOUT integrating into claude-sdk-server.js
 * Run: node test/sdk/subagent-harness.js <subagent-name> "<test-query>"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { getSubagent, getLegalSubagents } from '../../src/config/legalSubagents.js';
import { buildAgentSdkTools, createLegalMcpServer } from '../../src/utils/agentSdkToolAdapter.js';
import { createToolImplementations } from '../../src/tools/createToolImplementations.js';

async function testSubagent(subagentName, testQuery) {
  const subagent = getSubagent(subagentName);
  if (!subagent) {
    console.error(`Subagent not found: ${subagentName}`);
    process.exit(1);
  }

  // Create MCP server with tools
  const toolImpls = createToolImplementations();
  const sdkTools = buildAgentSdkTools(toolImpls);
  const mcpServer = createLegalMcpServer(sdkTools);

  console.log(`\n=== Testing Subagent: ${subagentName} ===`);
  console.log(`Query: ${testQuery}`);
  console.log(`Tools: ${subagent.tools?.length || 'all'}`);
  console.log(`Model: ${subagent.model || 'inherit'}`);
  console.log('---\n');

  // Test with ONLY this subagent defined
  for await (const message of query({
    prompt: testQuery,
    options: {
      agents: { [subagentName]: subagent },  // Single subagent
      mcpServers: { 'super-legal-tools': mcpServer },
      maxTurns: 10,
    }
  })) {
    if (message.type === 'assistant') {
      console.log(message.content);
    }
    if (message.type === 'tool_use') {
      console.log(`[Tool: ${message.name}]`);
    }
  }
}

// CLI usage
const [subagentName, testQuery] = process.argv.slice(2);
if (!subagentName || !testQuery) {
  console.log('Usage: node test/sdk/subagent-harness.js <subagent-name> "<test-query>"');
  console.log('\nAvailable subagents:');
  Object.keys(getLegalSubagents()).forEach(name => console.log(`  - ${name}`));
  process.exit(1);
}

testSubagent(subagentName, testQuery);
```

#### Step 2.2: Create Isolated Test Cases `test/sdk/subagents-isolated.test.js`

Test each subagent independently:

```javascript
describe('Isolated Subagent Tests', () => {
  // Each test runs a single subagent with a domain-specific query

  describe('securities-researcher', () => {
    test('should invoke SEC tools for filing query', async () => {
      // Test with: "Find Tesla 10-K risk factors"
      // Verify: search_sec_filings tool called
      // Verify: Returns structured findings
    });
  });

  describe('case-law-analyst', () => {
    test('should invoke court tools for precedent query', async () => {
      // Test with: "Find cases about software patent infringement"
      // Verify: search_cases or search_opinions called
    });
  });

  describe('pharma-regulatory-analyst', () => {
    test('should invoke FDA tools for drug query', async () => {
      // Test with: "Find FDA recalls for diabetes medications"
      // Verify: search_fda_recalls called
    });
  });

  // ... tests for each of 10 subagents
});
```

#### Step 2.3: Run Isolated Tests

Test each subagent manually:

```bash
# Test securities-researcher
node test/sdk/subagent-harness.js securities-researcher "Find Apple 10-K filings for 2024"

# Test case-law-analyst
node test/sdk/subagent-harness.js case-law-analyst "Find patent infringement cases from 9th Circuit"

# Test pharma-regulatory-analyst
node test/sdk/subagent-harness.js pharma-regulatory-analyst "Search FDA drug recalls for 2024"

# Test patent-analyst
node test/sdk/subagent-harness.js patent-analyst "Find SpaceX rocket propulsion patents"

# Test antitrust-competition-analyst
node test/sdk/subagent-harness.js antitrust-competition-analyst "Find FTC merger challenges in tech sector 2024"

# Test statutory-law-analyst
node test/sdk/subagent-harness.js statutory-law-analyst "Find 15 USC Section 1 Sherman Act text"

# ... repeat for all 10 subagents
```

#### Step 2.4: Validation Checklist

For each subagent, verify:

| Subagent | Tool Invocation | Gemini Filter | Response Quality | Status |
|----------|-----------------|---------------|------------------|--------|
| `securities-researcher` | ☐ Correct SEC tools | ☐ Filtered output | ☐ Accurate citations | ☐ PASS |
| `case-law-analyst` | ☐ Correct court tools | ☐ Filtered output | ☐ Bluebook format | ☐ PASS |
| `pharma-regulatory-analyst` | ☐ Correct FDA tools | ☐ Filtered output | ☐ NDA/ANDA refs | ☐ PASS |
| `environmental-compliance-analyst` | ☐ Correct EPA tools | ☐ Filtered output | ☐ Facility IDs | ☐ PASS |
| `patent-analyst` | ☐ Correct USPTO tools | ☐ Filtered output | ☐ Patent numbers | ☐ PASS |
| `regulatory-rulemaking-analyst` | ☐ Correct FR tools | ☐ Filtered output | ☐ CFR citations | ☐ PASS |
| `product-safety-analyst` | ☐ Correct CPSC/NHTSA | ☐ Filtered output | ☐ Recall numbers | ☐ PASS |
| `antitrust-competition-analyst` | ☐ Correct FTC tools | ☐ Filtered output | ☐ Case numbers | ☐ PASS |
| `statutory-law-analyst` | ☐ Correct USC tools | ☐ Filtered output | ☐ USC citations | ☐ PASS |
| `legal-research-coordinator` | ☐ Read-only tools | ☐ N/A | ☐ Routes correctly | ☐ PASS |

**Gate**: ALL 10 subagents must pass isolated testing before Phase 3.

---

### PHASE 3: Orchestration Testing (Multi-Subagent)

> **Purpose**: Test main agent + multiple subagents working together.
> Still uses test harness, NOT production server.

#### Step 3.1: Create Orchestration Test `test/sdk/subagents-orchestration.test.js`

Test multi-subagent coordination:

```javascript
describe('Subagent Orchestration', () => {
  test('should route multi-domain query to correct subagents', async () => {
    // Query: "Research Tesla patent litigation including SEC filings about IP"
    // Expected: patent-analyst AND securities-researcher invoked
  });

  test('should handle parallel subagent execution', async () => {
    // Query: "Find FDA drug recalls and related lawsuits"
    // Expected: pharma-regulatory-analyst AND case-law-analyst
  });

  test('legal-research-coordinator should triage correctly', async () => {
    // Query: "What regulatory agencies should I check for EV battery compliance?"
    // Expected: coordinator routes to EPA, FDA, CPSC subagents
  });
});
```

#### Step 3.2: Run Orchestration Tests

```bash
npm run test:sdk -- test/sdk/subagents-orchestration.test.js
```

**Gate**: Orchestration tests must pass before Phase 4.

---

### PHASE 4: SDK Server Integration (Final Step)

> **ONLY proceed after Phases 1-3 pass completely.**

#### Step 4.1: Update Feature Flag to Enable

```javascript
// src/config/featureFlags.js
SUBAGENTS_ENABLED: envBool(process.env.SUBAGENTS_ENABLED, true),  // NOW safe to enable
```

#### Step 4.2: Update `src/server/claude-sdk-server.js`

1. Add import at top:
   ```javascript
   import { getLegalSubagents } from '../config/legalSubagents.js';
   ```

2. Find the `agentQuery()` call and add `agents` parameter:
   ```javascript
   agents: featureFlags.SUBAGENTS_ENABLED ? getLegalSubagents() : undefined,
   ```

3. Add `/api/subagents` endpoint for listing available subagents:
   ```javascript
   app.get('/api/subagents', (req, res) => {
     const subagents = getLegalSubagents();
     res.json({
       enabled: featureFlags.SUBAGENTS_ENABLED,
       count: Object.keys(subagents).length,
       subagents: Object.entries(subagents).map(([name, def]) => ({
         name,
         description: def.description.split('\n')[0],
         model: def.model || 'inherit',
         toolCount: def.tools?.length || 'all'
       }))
     });
   });
   ```

#### Step 4.3: Integration Tests

```bash
# Start server with subagents enabled
SUBAGENTS_ENABLED=true npm run sdk-server

# Test endpoint
curl http://localhost:3001/api/subagents | jq

# Test query routing
curl -X POST http://localhost:3001/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K risk factors for 2024"}'
```

---

## Files to Create/Modify (Phased)

### Phase 1 (Config Only)
| File | Action |
|------|--------|
| `src/config/legalSubagents.js` | CREATE |
| `src/config/featureFlags.js` | MODIFY (add flag, default OFF) |
| `test/sdk/subagents-config.test.js` | CREATE |

### Phase 2 (Isolated Testing)
| File | Action |
|------|--------|
| `test/sdk/subagent-harness.js` | CREATE |
| `test/sdk/subagents-isolated.test.js` | CREATE |

### Phase 3 (Orchestration Testing)
| File | Action |
|------|--------|
| `test/sdk/subagents-orchestration.test.js` | CREATE |

### Phase 4 (Integration - AFTER all tests pass)
| File | Action |
|------|--------|
| `src/server/claude-sdk-server.js` | MODIFY (add import + agents param) |
| `src/config/featureFlags.js` | MODIFY (change default to true) |

---

## Rollback Plan

If subagents cause issues in production:

1. **Immediate**: Set `SUBAGENTS_ENABLED=false` in `.env`
2. **Restart**: Server continues without subagent orchestration
3. **Debug**: Use isolated test harness to identify failing subagent
4. **Fix**: Update subagent definition, re-run Phase 2 tests

---

## Appendix D: Subagents and Skills (Verified December 10, 2025)

### CORRECTION: Subagents CAN Access Skills

From the official Anthropic blog post **"Skills explained"** (November 2025):

> "In Claude Code and the Agent SDK, **subagents can access and use Skills just like the main agent**."

This corrects the earlier understanding in this document.

### How Subagents Access Skills

Skills are **NOT** a parameter on `AgentDefinition`. Instead:

1. **Skills are loaded at SDK level** via `settingSources: ['user', 'project']`
2. **Skills are filesystem artifacts** (`SKILL.md` files in `.claude/skills/`)
3. **Subagents inherit Skills access** if the `Skill` tool is in their `tools` array (or if `tools` is omitted to inherit all)

### Configuration Pattern

```javascript
for await (const message of agentQuery({
  prompt: userQuery,
  options: {
    // Load Skills from filesystem
    settingSources: ['user', 'project'],

    // Enable Skill tool at main agent level
    allowedTools: ['Skill', 'Read', 'Grep', 'Glob', 'mcp__super-legal-tools__*'],

    // Subagents configuration
    agents: {
      'securities-researcher': {
        description: 'SEC filings research...',
        prompt: 'You are a securities specialist...',
        // Option 1: Explicitly include 'Skill' tool
        tools: ['Skill', 'Read', 'Grep', 'mcp__super-legal-tools__search_sec_filings'],
        model: 'sonnet'
      },
      'case-law-analyst': {
        description: 'Court case research...',
        prompt: 'You are a case law specialist...',
        // Option 2: Omit tools to inherit ALL tools (including Skill)
        // tools: undefined  // inherits all
        model: 'sonnet'
      }
    },

    // MCP servers available to all agents
    mcpServers: {
      'super-legal-tools': legalMcpServer
    }
  }
}))
```

### Creating Skills for Legal Domain

Since Skills must be filesystem artifacts, create them in `.claude/skills/`:

```
.claude/skills/
├── sec-analysis/
│   └── SKILL.md          # SEC filing analysis skill
├── citation-formatting/
│   └── SKILL.md          # Bluebook citation skill
├── contract-review/
│   └── SKILL.md          # Contract analysis skill
└── regulatory-research/
    └── SKILL.md          # Federal Register research skill
```

Example `SKILL.md`:

```markdown
---
name: sec-analysis
description: |
  Use when analyzing SEC filings (10-K, 10-Q, 8-K).
  Extracts key financial data, risk factors, and management discussion.
---

# SEC Filing Analysis Skill

When analyzing SEC filings:

1. Identify the filing type and period
2. Extract key financial metrics from Item 6/8
3. Summarize risk factors from Item 1A
4. Note any material events or changes
5. Format citations with accession numbers

Always include:
- Filing date and accession number
- Direct quotes with page references
- Year-over-year comparisons when available
```

### Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   MAIN AGENT (Claude SDK)                       │
│                                                                 │
│  settingSources: ['user', 'project']  ← Loads Skills            │
│  allowedTools: ['Skill', ...]         ← Enables Skill tool      │
│                                                                 │
│  Available:                                                     │
│  ✅ MCP Tools (mcp__super-legal-tools__*)                       │
│  ✅ Agent Skills (from .claude/skills/)                         │
│  ✅ Subagent orchestration                                      │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  securities-    │  │  case-law-      │  │  pharma-        │
│  researcher     │  │  analyst        │  │  regulatory-    │
│                 │  │                 │  │  analyst        │
│  Tools:         │  │  Tools:         │  │  Tools:         │
│  ✅ Skill       │  │  ✅ Skill       │  │  ✅ Skill       │
│  ✅ SEC MCP     │  │  ✅ Court MCP   │  │  ✅ FDA MCP     │
│  ✅ Read, Grep  │  │  ✅ Read, Grep  │  │  ✅ Read, Grep  │
│                 │  │                 │  │                 │
│  Can invoke:    │  │  Can invoke:    │  │  Can invoke:    │
│  - sec-analysis │  │  - citation-    │  │  - drug-safety  │
│    skill        │  │    formatting   │  │    skill        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Insight

The relationship is **complementary**:
- **Skills** = Portable procedural knowledge (HOW to do tasks)
- **Subagents** = Independent agents with isolated context (WHO does tasks)

A subagent can leverage Skills to combine independence with expertise. For example:
- `securities-researcher` subagent can use the `sec-analysis` Skill
- `case-law-analyst` subagent can use the `citation-formatting` Skill

### Documentation Sources

| Document | URL | Date |
|----------|-----|------|
| Subagents in the SDK | https://platform.claude.com/docs/en/agent-sdk/subagents | Dec 2025 |
| Agent Skills in the SDK | https://platform.claude.com/docs/en/agent-sdk/skills | Dec 2025 |
| Skills Explained Blog | https://www.claude.com/blog/skills-explained | Nov 2025 |

---

## Appendix E: Final Verification (December 10, 2025)

### Verified AgentDefinition Schema

From official TypeScript SDK reference:

```typescript
type AgentDefinition = {
  description: string;    // REQUIRED - Natural language description of when to use
  tools?: string[];       // OPTIONAL - If omitted, inherits ALL tools
  prompt: string;         // REQUIRED - System prompt for the agent
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';  // OPTIONAL - defaults to main model
}
```

### Verified MCP Tool Naming Convention

Tools exposed via MCP follow the pattern:
```
mcp__{server-name}__{tool-name}
```

For super-legal-tools:
```
mcp__super-legal-tools__search_sec_filings
mcp__super-legal-tools__get_case_details
mcp__super-legal-tools__search_fda_recalls
```

### Verified SDK Query Options for Subagents

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const message of query({
  prompt: userQuery,
  options: {
    // Subagent definitions
    agents: {
      'securities-researcher': {
        description: 'Use PROACTIVELY for SEC filings research...',
        prompt: 'You are a securities law specialist...',
        tools: ['Read', 'Grep', 'Glob', 'mcp__super-legal-tools__search_sec_filings'],
        model: 'sonnet'
      }
    },

    // MCP servers - tools available to main agent AND subagents
    mcpServers: {
      'super-legal-tools': {
        type: 'sdk',
        name: 'super-legal-tools',
        instance: legalMcpServer  // From createSdkMcpServer()
      }
    },

    // Load skills from filesystem
    settingSources: ['user', 'project'],

    // Enable Skill tool for skills access
    allowedTools: ['Skill', 'Read', 'Grep', 'Glob', 'mcp__super-legal-tools__*'],

    // Other options
    maxTurns: 40,
    systemPrompt: 'You are a legal research assistant...'
  }
})) {
  // Handle messages
}
```

### Verified createSdkMcpServer() Usage

```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Define tools with Zod schemas
const searchTool = tool(
  'search_sec_filings',
  'Search SEC filings by company or keyword',
  { query: z.string(), form_type: z.string().optional() },
  async (args) => {
    // Tool implementation - Gemini filter applied here
    const results = await searchSEC(args);
    return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  }
);

// Create in-process MCP server
const legalMcpServer = createSdkMcpServer({
  name: 'super-legal-tools',
  version: '2.0.0',
  tools: [searchTool, /* other tools */]
});
```

### Verified Subagent Hooks

Available hook events for subagents:

| Hook Event | Description |
|------------|-------------|
| `SubagentStart` | Triggered when a subagent is invoked |
| `SubagentStop` | Triggered when a subagent completes |

Hook input types:
```typescript
type SubagentStartHookInput = BaseHookInput & {
  hook_event_name: 'SubagentStart';
  agent_id: string;
  agent_type: string;
}

type SubagentStopHookInput = BaseHookInput & {
  hook_event_name: 'SubagentStop';
  stop_hook_active: boolean;
  agent_id: string;
  agent_transcript_path: string;
}
```

### Verified Skills + Subagents Integration

1. **Skills are filesystem artifacts** - `SKILL.md` files in `.claude/skills/`
2. **Skills are loaded via `settingSources`** - Not a parameter on AgentDefinition
3. **Subagents access skills** if `'Skill'` tool is in their `tools` array or inherited

```typescript
// Subagent with explicit Skill access
'securities-researcher': {
  description: '...',
  prompt: '...',
  tools: ['Skill', 'Read', 'mcp__super-legal-tools__*'],  // Explicit Skill access
  model: 'sonnet'
}

// Subagent inheriting all tools (including Skill)
'case-law-analyst': {
  description: '...',
  prompt: '...',
  // tools: undefined  // Inherits ALL tools including Skill
  model: 'sonnet'
}
```

### Verified Gemini Filter Integration

Gemini filters remain active within MCP tool handlers:

```
User Query → Claude Agent SDK
    ↓
Main Agent → routes to subagent
    ↓
Subagent → calls MCP tool (mcp__super-legal-tools__search_sec_filings)
    ↓
MCP Tool Handler → calls API client → raw data
    ↓
Gemini Filter → extracts structured findings  ← STILL ACTIVE
    ↓
Returns filtered results to subagent
    ↓
Subagent → synthesizes findings
    ↓
Returns to main agent
```

**Cost impact**: Gemini filtering cost unchanged. Subagents call the same MCP tools with the same Gemini filter layer.

### Implementation Confidence

| Component | Status | Notes |
|-----------|--------|-------|
| AgentDefinition schema | ✅ Verified | 4 fields: description, prompt, tools?, model? |
| MCP tool naming | ✅ Verified | `mcp__{server}__{tool}` pattern |
| createSdkMcpServer() | ✅ Verified | In-process MCP server |
| Skills access | ✅ Verified | Via settingSources + Skill tool |
| Subagent hooks | ✅ Verified | SubagentStart, SubagentStop |
| Gemini filter layer | ✅ Verified | Unchanged - in tool handlers |

### Ready for Implementation

The implementation plan in Appendix C is verified and ready for execution. Proceed with Phase 1 after user approval.

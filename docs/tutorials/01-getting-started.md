# Tutorial 1: Getting Started with Super-Legal

This tutorial walks you through setting up Super-Legal and running your first legal research query.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Claude Desktop or Claude Code CLI

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Number531/Legal-API.git
cd Legal-API/super-legal-mcp-refactored
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# Required
ANTHROPIC_API_KEY=your_key_here

# Recommended for full functionality
COURTLISTENER_API_TOKEN=your_token_here
EXA_API_KEY=your_key_here
```

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
Super-Legal MCP Server running on port 3000
51 tools registered
```

## Connecting to Claude Desktop

Add to your Claude Desktop configuration (`~/.claude/mcp_settings.json`):

```json
{
  "mcpServers": {
    "super-legal": {
      "command": "node",
      "args": ["/path/to/super-legal-mcp-refactored/src/server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop to load the server.

---

## Your First Query

### Example 1: Search Case Law

Ask Claude:
```
Search for recent Supreme Court cases about patent eligibility under 35 USC 101.
```

Claude will use the `search_cases` tool:
```
Searching CourtListener for patent eligibility cases...

Found 5 relevant cases:
1. Alice Corp. v. CLS Bank (2014) - Abstract ideas not patentable
2. Mayo v. Prometheus (2012) - Laws of nature exception
3. Bilski v. Kappos (2010) - Business method patents
...
```

### Example 2: Look Up a Citation

Ask Claude:
```
What did the Supreme Court hold in 410 U.S. 113?
```

Claude will use `lookup_citation`:
```
410 U.S. 113 is Roe v. Wade (1973).

The Court held that the Constitution protects a woman's
right to choose to have an abortion before viability...
```

### Example 3: Search SEC Filings

Ask Claude:
```
Find 10-K filings from Apple Inc. mentioning supply chain risks.
```

Claude will use `search_sec_filings`:
```
Searching SEC EDGAR for Apple 10-K filings...

Found 3 relevant filings:
1. 10-K (2024) - Supply chain concentration in China
2. 10-K (2023) - Semiconductor shortage impacts
3. 10-K (2022) - COVID-related disruptions
...
```

---

## Understanding Tool Selection

Super-Legal automatically selects the right tools based on your query:

| Query Type | Tools Used |
|------------|------------|
| "Find cases about..." | `search_cases`, `search_opinions` |
| "What does 15 USC 78 say?" | `search_us_code`, `get_usc_section` |
| "SEC filings for..." | `search_sec_filings` |
| "Patent for..." | `search_patents` |
| "FDA recalls of..." | `search_fda_recalls` |
| "EPA violations at..." | `search_epa_violations` |

---

## Tips for Effective Queries

### Be Specific

**Less effective:**
```
Find antitrust cases
```

**More effective:**
```
Find federal appellate court cases from 2020-2024
involving horizontal price-fixing under Section 1
of the Sherman Act
```

### Use Legal Terms

The system understands legal terminology:
- "Sherman Act Section 1" vs "price fixing law"
- "10b-5" vs "securities fraud"
- "CERCLA" vs "environmental cleanup"

### Request Specific Outputs

```
Search for cases about ERISA fiduciary duties.
For each case, provide:
- Full citation
- Court and date
- Key holding
- Relevant facts
```

---

## Next Steps

- [Tutorial 2: Legal Research Workflows](02-legal-research-workflows.md)
- [Tutorial 3: M&A Due Diligence](03-ma-due-diligence.md)
- [Tutorial 4: Memorandum Generation](04-memorandum-generation.md)
- [API Reference](../API-REFERENCE.md)

# M&A Due Diligence Test Prompt

## Hypothetical Scenario

**Transaction:** Apex Industrial Holdings (NYSE: APEX) acquiring GreenTech Manufacturing Corp (NASDAQ: GRNM)
- All-stock merger with $3.2B enterprise value
- Target: Specialty chemicals and sustainable materials manufacturer
- Facilities in Houston TX, Pittsburgh PA, Newark NJ, Los Angeles CA
- EPA-regulated facilities with RCRA permits
- Recent FDA warning letters for pharmaceutical-grade materials division

---

## Test Prompt for claude-server-v2.js

Copy and paste this prompt to test multi-tool parallel execution:

```
I am conducting M&A due diligence for Apex Industrial Holdings' proposed acquisition
of GreenTech Manufacturing Corp, a specialty chemicals manufacturer.

Please perform the following parallel searches:

1. SEC FILINGS: Search for 10-K annual reports from chemical manufacturing companies
   (try Eastman Chemical, Albemarle, or LyondellBasell) focusing on environmental
   liability risk factors

2. EPA COMPLIANCE: Search EPA facilities in Houston, TX and Pittsburgh, PA for
   chemical manufacturing facilities with violation history

3. CASE LAW: Search federal court cases involving chemical manufacturing
   environmental liability litigation

4. FDA WARNINGS: Search FDA warning letters issued to pharmaceutical chemical
   manufacturers in the past 3 years

5. FEDERAL REGISTER: Search for recent EPA rulemaking affecting industrial
   chemical manufacturing regulations

Please execute these searches in parallel and provide a summary of findings
relevant to the transaction's due diligence.
```

---

## Expected Tool Calls

| # | Tool | Expected Behavior |
|---|------|-------------------|
| 1 | `search_sec_filings` | Returns 10-K filings with environmental risk disclosures |
| 2 | `search_epa_facilities` | Returns Houston/Pittsburgh facilities via native ECHO API |
| 3 | `search_cases` | Returns environmental litigation cases |
| 4 | `search_fda_warning_letters` | Returns pharmaceutical manufacturing warnings |
| 5 | `search_federal_register` | Returns EPA rulemaking notices |

---

## Success Criteria

After the streaming fix, you should see in the server logs:

1. **NO "awaiting complete inputs" errors**
2. All 5 tools marked with `ready = true` during streaming
3. Log message: `🔧 Stream complete. Processing 5 tool calls...`
4. All tools execute in parallel after `message_stop`
5. Results returned from all 5 domains

---

## Simplified Single-Domain Tests

If you want to test individual domains first:

### EPA Only
```
Search EPA facilities in Houston, TX with chemical manufacturing violations in the past 3 years.
```

### SEC Only
```
Search SEC 10-K filings for Eastman Chemical Company focusing on environmental risk factors.
```

### FDA Only
```
Search FDA warning letters issued to pharmaceutical manufacturers in 2024.
```

### Case Law Only
```
Search federal court cases involving environmental contamination liability against chemical manufacturers.
```

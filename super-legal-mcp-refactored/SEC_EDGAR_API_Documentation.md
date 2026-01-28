# SEC EDGAR Data API - Official Documentation

**Created:** August 12, 2025  
**Topic:** SEC EDGAR Data API Structure and Endpoints  
**Version:** Current as of 2024-2025  

## Table of Contents
1. [Overview](#overview)
2. [Base URL and Authentication](#base-url-and-authentication)
3. [API Endpoints](#api-endpoints)
4. [Working Examples](#working-examples)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Usage Guidelines](#usage-guidelines)
7. [References](#references)

## Overview

The SEC EDGAR Data API provides free, public access to SEC filing data through RESTful APIs that deliver JSON-formatted data. These APIs are hosted at `data.sec.gov` and do not require any authentication or API keys.

**Key Features:**
- Real-time updates with minimal delay
- No authentication required
- JSON format responses
- Comprehensive filing history and XBRL financial data

## Base URL and Authentication

**Base URL:** `https://data.sec.gov`

**Authentication:** None required - completely public API

**Required Headers:**
- `User-Agent`: Must include contact information (e.g., "Company Name contact@domain.com")

## API Endpoints

### 1. Company Submissions Endpoint

**Purpose:** Provides entity filing history and metadata

**URL Structure:**
```
https://data.sec.gov/submissions/CIK{cik}.json
```

**Format Requirements:**
- CIK must be 10 digits with leading zeros
- Example: CIK0000320193 for Apple Inc.

**Response Contains:**
- Company metadata (current name, former names)
- Stock exchange and ticker information
- At least one year of filings or up to 1,000 most recent filings
- Filing dates, forms, and document references

**Update Frequency:** Real-time with typical delay of less than 1 second

### 2. Company Facts Endpoint (XBRL)

**Purpose:** Returns all company XBRL data in a single call

**URL Structure:**
```
https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
```

**Format Requirements:**
- CIK must be 10 digits with leading zeros
- Uses `/api/` prefix unlike submissions endpoint

**Response Contains:**
- All XBRL facts for the company
- Financial statement data from forms 10-Q, 10-K, 8-K, 20-F, 40-F, 6-K

**Update Frequency:** Real-time with typical delay of under 1 minute

### 3. Company Concept Endpoint (XBRL)

**Purpose:** Returns specific XBRL concept data for a company

**URL Structure:**
```
https://data.sec.gov/api/xbrl/companyconcept/CIK{cik}/{taxonomy}/{tag}.json
```

**Example:**
```
https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/AccountsPayableCurrent.json
```

**Parameters:**
- `{cik}`: 10-digit CIK with leading zeros
- `{taxonomy}`: e.g., us-gaap, ifrs-full, dei, srt
- `{tag}`: Specific XBRL tag name

### 4. XBRL Frames Endpoint

**Purpose:** Aggregates facts across reporting entities for a specific concept and period

**URL Structure:**
```
https://data.sec.gov/api/xbrl/frames/{concept}/{period}.json
```

## Working Examples

### Python Example - Apple Inc. Submissions
```python
import requests
import json

# Required headers
headers = {
    'User-Agent': 'YourCompany contact@yourdomain.com'
}

# Apple Inc. CIK: 0000320193
url = 'https://data.sec.gov/submissions/CIK0000320193.json'

response = requests.get(url, headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"Company: {data['name']}")
    print(f"CIK: {data['cik']}")
    print(f"Ticker: {data['tickers']}")
else:
    print(f"Error: {response.status_code}")
```

### Python Example - Apple Inc. Company Facts (XBRL)
```python
import requests

headers = {
    'User-Agent': 'YourCompany contact@yourdomain.com'
}

# Note: Uses /api/ prefix for XBRL endpoints
url = 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json'

response = requests.get(url, headers=headers)
if response.status_code == 200:
    data = response.json()
    # Access XBRL facts
    facts = data['facts']
    print("Available taxonomies:", list(facts.keys()))
else:
    print(f"Error: {response.status_code}")
```

### Verified Working URLs

**Submissions (NO /api/ prefix):**
- ✅ `https://data.sec.gov/submissions/CIK0000320193.json` (Apple)
- ❌ `https://data.sec.gov/api/submissions/CIK0000320193.json` (INCORRECT)

**XBRL Data (WITH /api/ prefix):**
- ✅ `https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json` (Apple Facts)
- ✅ `https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/Assets.json` (Apple Assets)

## Common Issues and Solutions

### 404 Errors

**Issue:** Requests to `data.sec.gov/api/submissions/CIK{cik}.json` return 404 errors

**Solution:** Remove the `/api/` prefix from submissions endpoints. The correct URL is:
```
https://data.sec.gov/submissions/CIK{cik}.json
```

**Key URL Structure Rules:**
- Submissions endpoint: NO `/api/` prefix
- XBRL endpoints: USE `/api/` prefix

### 403 Forbidden Errors

**Issue:** Server returns 403 Forbidden

**Common Causes:**
1. Missing or invalid User-Agent header
2. Exceeding rate limits (10 requests per second)
3. Improper Host header configuration

**Solutions:**
1. Always include a valid User-Agent header with contact information
2. Implement rate limiting in your code
3. Use GET requests instead of HEAD requests

### CIK Formatting

**Issue:** CIK not formatted correctly

**Solution:** Always use 10-digit CIK with leading zeros
- ✅ Correct: `CIK0000320193`
- ❌ Incorrect: `CIK320193`

## Usage Guidelines

### Rate Limits
- Maximum 10 requests per second per user
- SEC reserves the right to block excessive requests

### Required Headers
```python
headers = {
    'User-Agent': 'Your Company Name contact@yourcompany.com'
}
```

### Best Practices
1. Always include descriptive User-Agent with contact information
2. Implement proper error handling for 4xx/5xx responses
3. Use appropriate delays between requests
4. Cache responses when appropriate
5. Use GET requests instead of HEAD requests

### Data Update Schedule
- **Submissions API:** Updated real-time with < 1 second delay
- **XBRL APIs:** Updated real-time with < 1 minute delay
- **Peak Times:** Delays may be longer during heavy filing periods

## Bulk Data Access

For large-scale data access, consider bulk download files:

**Company Facts Bulk Data:**
```
https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip
```

**Submissions Bulk Data:**
```
https://www.sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip
```

## References

1. **Official SEC API Documentation**
   - Main Documentation: https://www.sec.gov/edgar/sec-api-documentation
   - Developer Resources: https://www.sec.gov/about/developer-resources
   - EDGAR APIs Overview: https://www.sec.gov/search-filings/edgar-application-programming-interfaces

2. **Data Access Portal**
   - Primary Data Portal: https://data.sec.gov
   - Accessing EDGAR Data Guide: https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data

3. **Technical Resources**
   - SEC EDGAR API Wrapper Documentation: https://sec-edgar-api.readthedocs.io/
   - API Implementation Examples: Multiple Stack Overflow and GitHub resources

4. **Policy and Guidelines**
   - SEC Developer Resources: https://www.sec.gov/about/developer-resources
   - EDGAR Access Guidelines: Available in official SEC documentation

**Note:** This documentation is compiled from official SEC sources and verified working examples as of August 2025. URL structures and endpoints are confirmed through multiple authoritative sources and practical testing examples found in the developer community.
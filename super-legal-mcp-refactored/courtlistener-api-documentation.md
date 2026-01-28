# CourtListener API v4.2 Documentation
## Comprehensive Guide to Public Endpoints and Capabilities

**Created:** August 12, 2025  
**API Version:** v4.2  
**Base URL:** `https://www.courtlistener.com/api/rest/v4/`  
**Documentation Source:** CourtListener.com official documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication and Rate Limits](#authentication-and-rate-limits)
3. [Public API Endpoints](#public-api-endpoints)
4. [Oral Arguments and Transcripts](#oral-arguments-and-transcripts)
5. [Endpoints Requiring Special Access](#endpoints-requiring-special-access)
6. [Bulk Data and Webhooks](#bulk-data-and-webhooks)
7. [API Usage Examples](#api-usage-examples)
8. [Recent Updates (2025)](#recent-updates-2025)
9. [References](#references)

---

## Overview

CourtListener provides a comprehensive REST API for accessing federal and state case law, PACER data, oral argument recordings, judge information, and financial disclosures. The API is currently at version 4.2 and represents the largest collection of legal data available through a public API.

### Key Features
- Federal and state case law access
- PACER/RECAP archive with nearly half a billion objects
- Oral argument audio with live transcripts (new in 2025)
- Judge biographical and financial disclosure data
- Advanced search capabilities powered by ElasticSearch
- Webhook system for real-time updates

---

## Authentication and Rate Limits

### Authentication Methods
- **Token Authentication:** Required for most production usage
- **Session Authentication:** Available when browsing while logged in
- **Anonymous Access:** Limited to experimentation

### Rate Limits
- **Authenticated Users:** 5,000 queries per hour
- **Unauthenticated Users:** 100 queries per day
- **Special Access Users:** Higher limits available

### Authentication Header Example
```bash
--header 'Authorization: Token <your-token-here>'
```

---

## Public API Endpoints

### Core Legal Data APIs

#### Case Law Endpoints
| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/clusters/` | Opinion clusters (groups of related opinions) | Public access |
| `/api/rest/v4/opinions/` | Individual court opinions | Public access |
| `/api/rest/v4/courts/` | Court information | Joined into nearly every other API |
| `/api/rest/v4/citations/` | Citation data | Public access |
| `/api/rest/v4/opinionscited/` | Opinion citation relationships | Public access |

#### Search and Discovery
| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/search/` | Unified search endpoint | ElasticSearch powered |
| `/api/rest/v4/tags/` | Tag management | Public access |

#### Court and Jurisdiction Data
| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/courts/` | Court information and metadata | Public access |
| `/api/rest/v4/originating-court-information/` | Originating court details | Public access |

### Judge and People APIs

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/people/` | Judge and person information | Public access |
| `/api/rest/v4/positions/` | Judicial positions | Public access |
| `/api/rest/v4/retention-events/` | Retention event data | Public access |
| `/api/rest/v4/disclosuretypeahead/` | Person disclosure search | Public access |

### Financial Disclosure APIs

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/financial-disclosures/` | Main disclosure documents | Public access |
| `/api/rest/v4/investments/` | Investment disclosures | Public access |
| `/api/rest/v4/gifts/` | Gift disclosures | Public access |
| `/api/rest/v4/agreements/` | Agreement disclosures | Public access |
| `/api/rest/v4/debts/` | Debt disclosures | Public access |
| `/api/rest/v4/non-investment-income/` | Non-investment income | Public access |
| `/api/rest/v4/reimbursements/` | Reimbursement disclosures | Public access |
| `/api/rest/v4/spouse-income/` | Spouse income disclosures | Public access |

### PACER/RECAP Public Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/dockets/` | Federal case dockets | Public access |
| `/api/rest/v4/recap-fetch/` | PACER data scraping interface | Public access |

### Additional System Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/rest/v4/visualizations/` | Data visualizations | Public access |
| `/api/rest/v4/json-versions/` | JSON version data | Public access |

---

## Oral Arguments and Transcripts

### Key Information (Updated 2025)

**🎉 Major Update:** As of July 2025, CourtListener now provides live transcripts for oral arguments, generated through a partnership with OpenAI. Transcripts are available just minutes after courts share audio.

### Audio Endpoint
| Endpoint | Purpose | Transcript Availability |
|----------|---------|------------------------|
| `/api/rest/v4/audio/` | Oral argument recordings | ✅ Transcripts now available |

### Transcript Features
- **Real-time Generation:** Transcripts available minutes after audio release
- **Searchable Content:** Full-text search through transcript content
- **Synchronized Playback:** Click transcript lines to jump to corresponding audio
- **Accessibility:** Enhanced access for deaf and hard of hearing professionals

### Transcript Access Methods

1. **Search API Integration:**
   - Transcripts are searchable via `/api/rest/v4/search/`
   - The `snippet` field in search results contains audio transcription
   - Example searches: "Miranda rights", "42 U.S.C. 1396A"

2. **Audio Endpoint Fields:**
   - Make an HTTP OPTIONS request to `/api/rest/v4/audio/` to discover all available fields
   - Transcript fields are included in the audio object response

3. **Hierarchical Structure:**
   - Audio objects sit below Docket objects in the database hierarchy
   - Access pattern: Docket → Audio → Transcript content

### Transcript Availability Status

**Do all oral arguments have transcripts?**
- ✅ **New recordings:** All new oral arguments have transcripts generated automatically
- ⚠️ **Historical recordings:** Transcript availability for historical recordings varies
- 📅 **Coverage:** Collect audio hourly from Supreme Court and Federal Circuit Courts

**Fields Indicating Transcript Availability:**
- Use HTTP OPTIONS request on `/api/rest/v4/audio/` to discover transcript-related fields
- Search API responses include transcript content in snippet field when available

---

## Endpoints Requiring Special Access

The following endpoints require special permission and are **NOT** included in public implementation requirements:

### PACER/RECAP Restricted Endpoints
- `/api/rest/v4/docket-entries/` - **Special access required**
- `/api/rest/v4/recap-documents/` - **Special access required**  
- `/api/rest/v4/parties/` - **Special access required**
- `/api/rest/v4/attorneys/` - **Special access required**
- `/api/rest/v4/recap/` - Upload endpoint, **special access required**

### How to Request Special Access
- Contact CourtListener with your username and use case
- Explain your research, journalism, or organizational needs
- Access granted based on legitimate use requirements

---

## Bulk Data and Webhooks

### Bulk Data (Excluded from API Implementation)
- **PostgreSQL Exports:** Updated January 24, 2025 with improved quote handling
- **Supreme Court Data:** Available in bulk format
- **Maintenance Windows:** Thursday nights 21:00-23:59 PT

### Webhook System (Excluded from API Implementation)
- **Versions:** v1 and v2 available
- **Real-time Updates:** Push notifications for data changes
- **Configuration:** User-configurable endpoints
- **Reliability:** Automatic retry with 8-attempt limit

---

## API Usage Examples

### 1. Discover Available Fields
```bash
curl -v \
  -X OPTIONS \
  --header 'Authorization: Token <your-token>' \
  "https://www.courtlistener.com/api/rest/v4/audio/"
```

### 2. Get Supreme Court Opinions
```bash
curl -v \
  --header 'Authorization: Token <your-token>' \
  "https://www.courtlistener.com/api/rest/v4/opinions/?cluster__docket__court=scotus"
```

### 3. Search Oral Argument Transcripts
```bash
curl -v \
  --header 'Authorization: Token <your-token>' \
  "https://www.courtlistener.com/api/rest/v4/search/?type=oa&q=Miranda%20rights"
```

### 4. Get Judge Information
```bash
curl -v \
  --header 'Authorization: Token <your-token>' \
  "https://www.courtlistener.com/api/rest/v4/people/?name_last=Roberts"
```

### 5. Financial Disclosures
```bash
curl -v \
  --header 'Authorization: Token <your-token>' \
  "https://www.courtlistener.com/api/rest/v4/financial-disclosures/?person=<person-id>"
```

---

## Recent Updates (2025)

### July 2025: Oral Argument Transcripts Launch
- **New Feature:** Live transcript generation for oral arguments
- **Partnership:** OpenAI integration for transcript generation  
- **Availability:** Transcripts available minutes after audio release
- **Search Integration:** Transcripts fully searchable through existing search API

### January 2025: Bulk Data Improvements
- **PostgreSQL Exports:** Enhanced quote handling for better parsing reliability
- **Quote Character:** Changed from backticks to double quotes as default
- **ESCAPE Option:** Added support for embedded double quotes
- **Shell Scripts:** Updated import scripts for better compatibility

### API v4 Enhancements
- **Deep Pagination:** Cursor-based pagination for large datasets
- **UTC Timestamps:** All dates and times now in UTC (changed from PST)
- **Search Improvements:** ElasticSearch replaces Solr for better performance
- **PACER Integration:** All PACER cases now searchable (v3 limitation removed)

---

## Complete List of Viable Public Endpoints

### Summary of Implementation-Ready Endpoints

**Case Law & Opinions:**
- `/api/rest/v4/clusters/`
- `/api/rest/v4/opinions/`
- `/api/rest/v4/citations/`
- `/api/rest/v4/opinionscited/`

**Oral Arguments & Audio:**
- `/api/rest/v4/audio/` ✨ (includes transcripts)

**Dockets & PACER (Public Access):**
- `/api/rest/v4/dockets/`
- `/api/rest/v4/recap-fetch/`

**Judges & Court Information:**
- `/api/rest/v4/people/`
- `/api/rest/v4/positions/`
- `/api/rest/v4/retention-events/`
- `/api/rest/v4/courts/`
- `/api/rest/v4/originating-court-information/`

**Financial Disclosures:**
- `/api/rest/v4/financial-disclosures/`
- `/api/rest/v4/investments/`
- `/api/rest/v4/gifts/`
- `/api/rest/v4/agreements/`
- `/api/rest/v4/debts/`
- `/api/rest/v4/non-investment-income/`
- `/api/rest/v4/reimbursements/`
- `/api/rest/v4/spouse-income/`

**Search & Discovery:**
- `/api/rest/v4/search/`
- `/api/rest/v4/tags/`

**System & Visualization:**
- `/api/rest/v4/visualizations/`
- `/api/rest/v4/json-versions/`
- `/api/rest/v4/disclosuretypeahead/`

**Total Public Endpoints:** 23 viable endpoints for implementation

---

## References

1. **CourtListener REST API v4.2 Documentation**  
   URL: https://www.courtlistener.com/help/api/rest/  
   Accessed: August 12, 2025

2. **CourtListener APIs and Bulk Data Overview**  
   URL: https://www.courtlistener.com/help/api/  
   Accessed: August 12, 2025

3. **Oral Argument Transcripts Announcement**  
   URL: https://free.law/2025/07/31/oral-argument-transcripts  
   Date: July 31, 2025

4. **CourtListener V4 API Migration Guide**  
   URL: https://www.courtlistener.com/help/api/rest/v4/migration-guide/  
   Accessed: August 12, 2025

5. **Free Law Project - CourtListener GitHub Repository**  
   URL: https://github.com/freelawproject/courtlistener  
   Accessed: August 12, 2025

---

**Note:** This documentation reflects the current state of the CourtListener API as of August 2025. For the most up-to-date field information for any endpoint, always perform an HTTP OPTIONS request to discover available fields and filtering options.
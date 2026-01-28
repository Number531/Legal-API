# FTC and CPSC Endpoint Consolidation Analysis

## Overview
After implementing 19 new endpoints (10 FTC + 9 CPSC), analysis revealed significant redundancies that could complicate tool selection. This document outlines the redundancies and consolidation strategy.

## FTC Redundancies and Consolidation

### Current State (12 endpoints)
1. `search_ftc_news_web` - General news and updates
2. `search_ftc_enforcement_web` - Enforcement actions, orders, judgments
3. `search_ftc_cases_web` - Legal cases, complaints, settlements
4. `search_ftc_rulemaking_web` - Proposed and final rules
5. `search_ftc_guidance_web` - Business guidance, compliance tips
6. `search_ftc_policy_web` - Policy statements, strategic priorities
7. `search_ftc_consumer_alerts_web` - Consumer protection alerts
8. `search_ftc_competition_matters_web` - Antitrust, merger reviews
9. `search_ftc_advisory_opinions_web` - Advisory opinions, interpretations
10. `search_ftc_reports_studies_web` - Research reports, market studies
11. `search_ftc_hsr_premerger_web` - HSR filings, premerger notifications
12. `search_ftc_workshops_events_web` - Public workshops, hearings

### Identified Redundancies

#### 1. HSR/Premerger and Competition Overlap
- `search_ftc_hsr_premerger_web` is a subset of `search_ftc_competition_matters_web`
- **Solution**: Merge HSR into competition matters with enhanced query building

#### 2. Enforcement and Cases Overlap
- `search_ftc_enforcement_web` and `search_ftc_cases_web` have 80% content overlap
- Both search for legal actions, settlements, orders
- **Solution**: Merge into single `search_ftc_enforcement_cases_web`

#### 3. Guidance and Policy Overlap
- `search_ftc_guidance_web` and `search_ftc_policy_web` have significant overlap
- Both cover compliance, best practices, strategic direction
- **Solution**: Merge into `search_ftc_guidance_policy_web`

### Consolidated Structure (6 endpoints)
1. `search_ftc_news_web` - General news and updates
2. `search_ftc_enforcement_cases_web` - All enforcement actions, cases, settlements
3. `search_ftc_rulemaking_web` - Proposed and final rules
4. `search_ftc_guidance_policy_web` - Guidance, policy statements, compliance
5. `search_ftc_consumer_alerts_web` - Consumer protection alerts
6. `search_ftc_competition_matters_web` - Antitrust, mergers, HSR filings

### Dropped Endpoints (3)
- `search_ftc_advisory_opinions_web` - Covered by guidance_policy
- `search_ftc_reports_studies_web` - Too general, covered by other searches
- `search_ftc_workshops_events_web` - Low value, covered by news

## CPSC Redundancies and Consolidation

### Current State (10 endpoints)
1. `search_cpsc_recalls_web` - Product recalls (existing)
2. `search_cpsc_violations_web` - Violation notices
3. `search_cpsc_civil_penalties_web` - Civil penalty settlements
4. `search_cpsc_business_guidance_web` - Business compliance guidance
5. `search_cpsc_safety_standards_web` - Product safety standards
6. `search_cpsc_injury_data_web` - Injury statistics, NEISS data
7. `search_cpsc_news_releases_web` - Press releases, announcements
8. `search_cpsc_regulatory_robot_web` - Small business guidance
9. `search_cpsc_public_calendar_web` - Commission meetings, events
10. `search_cpsc_enforcement_reports_web` - Enforcement statistics

### Identified Redundancies

#### 1. Business Guidance Duplication
- `search_cpsc_business_guidance_web` and `search_cpsc_regulatory_robot_web` overlap
- Both target business compliance
- **Solution**: Merge into single business guidance endpoint

#### 2. News and Calendar Overlap
- `search_cpsc_news_releases_web` and `search_cpsc_public_calendar_web` overlap
- Events often announced in news
- **Solution**: Merge into single news/updates endpoint

#### 3. Enforcement Reports and Violations
- `search_cpsc_enforcement_reports_web` overlaps with violations and penalties
- **Solution**: Create unified enforcement endpoint

### Consolidated Structure (7 endpoints)
1. `search_cpsc_recalls_web` - Product recalls
2. `search_cpsc_enforcement_web` - Violations, penalties, enforcement reports
3. `search_cpsc_business_guidance_web` - All business compliance guidance
4. `search_cpsc_safety_standards_web` - Product safety standards
5. `search_cpsc_injury_data_web` - Injury statistics, NEISS data
6. `search_cpsc_news_web` - News releases, announcements, events
7. `search_cpsc_reports_studies_web` - Research reports, studies

## Benefits of Consolidation

### Reduced Complexity
- FTC: 12 → 6 endpoints (50% reduction)
- CPSC: 10 → 7 endpoints (30% reduction)
- Total tools: 100 → 87 (13% reduction)

### Improved Tool Selection
- Clearer distinction between endpoint purposes
- Less confusion for the model when selecting tools
- Reduced overlap in search results

### Maintained Coverage
- All original search capabilities preserved
- Enhanced query builders compensate for consolidation
- More efficient parameter usage

## Implementation Strategy

### Phase 1: Update Client Methods
1. Merge redundant methods in FTCWebSearchClient.js
2. Merge redundant methods in CPSCWebSearchClient.js
3. Enhance query builders to cover merged functionality

### Phase 2: Update Tool Definitions
1. Remove redundant tool definitions from toolDefinitions.js
2. Update descriptions for consolidated tools
3. Adjust parameter schemas if needed

### Phase 3: Update Tool Implementations
1. Update mappings in toolImplementations.js
2. Remove redundant implementations
3. Test consolidated endpoints

### Phase 4: Update Domain Classifications
1. Update claude-server-v2.js domain classifications
2. Ensure proper categorization for consolidated tools

## Testing Requirements
- Verify each consolidated endpoint covers all original functionality
- Test parameter handling for merged endpoints
- Ensure no loss of search precision
- Validate error handling remains consistent
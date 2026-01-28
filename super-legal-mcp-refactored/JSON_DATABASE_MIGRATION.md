# JSON to Database Migration Guide

## Super-Legal MCP Refactored — Production Database Integration

**Document Version:** 1.0
**Date:** January 26, 2026
**Author:** Architecture Team
**Status:** Implementation Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [Migration Strategy](#5-migration-strategy)
6. [Code Changes Required](#6-code-changes-required)
7. [Data Abstraction Layer](#7-data-abstraction-layer)
8. [Historical Data Migration](#8-historical-data-migration)
9. [Validation & Testing](#9-validation--testing)
10. [Rollback Procedures](#10-rollback-procedures)
11. [Performance Considerations](#11-performance-considerations)
12. [Security & Compliance](#12-security--compliance)
13. [Implementation Timeline](#13-implementation-timeline)
14. [Appendices](#14-appendices)
15. [SDK Hooks & Subagent Integration](#15-sdk-hooks--subagent-integration)
16. [Alignment Verification Checklist](#16-alignment-verification-checklist)
17. [Claude Agent SDK Best Practices Alignment](#17-claude-agent-sdk-best-practices-alignment-january-2026)
18. [Claude Cookbook Production Patterns](#18-claude-cookbook-production-patterns-january-2026)
19. [Multi-Tenant Architecture](#19-multi-tenant-architecture)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive migration plan for transitioning the Super-Legal MCP platform from local JSON/Markdown file storage to a PostgreSQL database backend. The migration enables:

- **Cross-session analytics** and reporting
- **Real-time dashboard capabilities**
- **Concurrent access** without file locking issues
- **ACID-compliant transactions** for data integrity
- **Indexed queries** replacing grep-based searches
- **Automatic versioning** and audit trails
- **Scalable multi-tenant architecture**

### 1.2 Scope

| In Scope | Out of Scope |
|----------|--------------|
| Session metadata persistence | Real-time streaming architecture |
| Report content storage | External API integrations |
| Agent state management | UI/Dashboard development |
| QA issue tracking | Authentication/authorization redesign |
| Risk finding aggregation | Cloud infrastructure provisioning |
| Historical data migration | Mobile client support |

### 1.3 Success Criteria

- [ ] Zero data loss during migration
- [ ] All 43+ historical sessions successfully migrated
- [ ] Query response time < 100ms for common operations
- [ ] Dual-write mode operational for 2-week validation period
- [ ] All existing workflows function without modification
- [ ] Rollback executable within 5 minutes

---

## 2. Current State Analysis

### 2.1 File Storage Architecture

```
reports/
├── 2026-01-26-1737849600/          # Session directory
│   ├── research-plan.md            # Research execution plan
│   ├── synthesis-state.json        # Orchestrator state
│   ├── final-memorandum.md         # Primary deliverable (~154,000 words)
│   ├── final-memorandum-v2.md      # Post-remediation version
│   │
│   ├── specialist-reports/         # Domain expert outputs (T1-T9)
│   │   ├── T1-medicare-regulatory-compliance-report.md
│   │   ├── T2-healthcare-fraud-case-law-fca-report.md
│   │   └── ... (9 files)
│   │
│   ├── section-reports/            # Legal section analyses (IV.A-IV.L)
│   │   ├── section-IV-A-federal-healthcare-fraud-abuse.md
│   │   ├── section-writer-state-IV-A.json
│   │   └── ... (24 files: 12 reports + 12 states)
│   │
│   ├── review-outputs/             # Validation phase outputs
│   │   ├── fact-registry.md
│   │   ├── coverage-gaps.md
│   │   ├── risk-summary.json
│   │   └── ... (8 files)
│   │
│   ├── qa-outputs/                 # Quality assurance outputs
│   │   ├── diagnostic-assessment.md
│   │   ├── qa-diagnostic-state.json
│   │   ├── final-qa-certificate.md
│   │   ├── delivery-decision.md
│   │   └── ... (6 files)
│   │
│   └── remediation-outputs/        # Post-QA corrections
│       ├── W1-001-VALIDATE.md
│       ├── apply-creac-headers.py
│       └── ... (10 files)
│
└── ... (43 session directories)
```

### 2.2 File Types and Sizes

| File Type | Count per Session | Avg Size | Total Storage |
|-----------|-------------------|----------|---------------|
| Markdown Reports | 30-40 | 15 KB | 450-600 KB |
| Final Memorandum | 1-2 | 800 KB | 800-1600 KB |
| JSON State Files | 15-20 | 5 KB | 75-100 KB |
| Python Scripts | 2-5 | 3 KB | 6-15 KB |
| **Total per Session** | **48-67** | — | **1.3-2.3 MB** |
| **Total (43 sessions)** | **2,064-2,881** | — | **56-99 MB** |

### 2.3 Current Data Relationships

```
Session (Directory)
    │
    ├─── 1:N ──→ Specialist Reports (T1-T9)
    │                 │
    │                 └─── Feeds ──→ Section Reports
    │
    ├─── 1:N ──→ Section Reports (IV.A-IV.L)
    │                 │
    │                 ├─── 1:1 ──→ Section Writer State
    │                 │
    │                 └─── Aggregates ──→ Final Memorandum
    │
    ├─── 1:1 ──→ Final Memorandum
    │                 │
    │                 └─── Triggers ──→ QA Diagnostic
    │
    ├─── 1:N ──→ QA Issues (W1-W5)
    │                 │
    │                 └─── Resolves ──→ QA Certificate
    │
    └─── 1:N ──→ Risk Findings (per section)
```

### 2.4 Current Database Infrastructure

Existing PostgreSQL tables in `src/db/postgres.js`:

```sql
-- Already implemented
CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    memo JSONB
);

CREATE TABLE tool_calls (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    tool_name TEXT,
    arguments JSONB,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    uri TEXT,
    source TEXT,
    content TEXT,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Pain Points with Current Architecture

| Issue | Impact | Severity |
|-------|--------|----------|
| No cross-session queries | Cannot analyze trends across matters | HIGH |
| File locking on concurrent access | Race conditions during parallel agent execution | HIGH |
| Grep-based searches | Slow, regex-dependent, no indexing | MEDIUM |
| Manual version tracking | v1, v2, v3 suffixes prone to error | MEDIUM |
| No audit trail | Cannot track who changed what when | MEDIUM |
| Backup complexity | Must sync entire directory tree | LOW |
| No aggregation queries | Manual JSON parsing for metrics | LOW |

---

## 3. Target Architecture

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Claude    │  │   GPT-5     │  │   Gemini    │              │
│  │   Agents    │  │ Orchestrator│  │   Agents    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │           DATA ABSTRACTION LAYER              │              │
│  │  ┌─────────────┐  ┌─────────────────────────┐ │              │
│  │  │   Session   │  │      Report             │ │              │
│  │  │   Manager   │  │      Repository         │ │              │
│  │  └─────────────┘  └─────────────────────────┘ │              │
│  │  ┌─────────────┐  ┌─────────────────────────┐ │              │
│  │  │   State     │  │      QA Issue           │ │              │
│  │  │   Store     │  │      Tracker            │ │              │
│  │  └─────────────┘  └─────────────────────────┘ │              │
│  └───────────────────────┬───────────────────────┘              │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     PERSISTENCE LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│  │  │ sessions │ │ reports  │ │  states  │ │qa_issues │       │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│  │  │  risks   │ │   runs   │ │tool_calls│ │ evidence │       │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              File System (Backup/Archive)                   │ │
│  │  reports/{session}/  ← Read-only after migration            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Design Principles

1. **Dual-Write During Transition**: Write to both file and database
2. **Read Abstraction**: Check database first, fallback to file
3. **JSONB for Flexibility**: Preserve existing JSON structure in database
4. **Explicit Versioning**: Database-managed version numbers
5. **Cascade Deletes**: Maintain referential integrity
6. **Indexed Queries**: Replace grep with SQL indexes

---

## 4. Database Schema Design

### 4.1 Core Tables

```sql
-- ============================================================
-- SESSIONS TABLE
-- Master record for each legal research session
-- ============================================================
CREATE TABLE sessions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session Identification
    session_key VARCHAR(50) UNIQUE NOT NULL,  -- '2026-01-26-1737849600'

    -- Transaction Metadata
    transaction_name TEXT,                     -- 'ComfortCare Partners LLC Acquisition...'
    transaction_type VARCHAR(50),              -- 'M&A', 'Due Diligence', 'Regulatory'
    client_matter_id VARCHAR(100),             -- External matter reference

    -- Status Tracking
    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'review', 'qa_pending',
                          'remediation', 'certified', 'delivered', 'archived')),

    -- Quality Metrics
    initial_score DECIMAL(5,2),               -- Pre-remediation score (86.7)
    final_score DECIMAL(5,2),                 -- Post-remediation score (97.4)
    quality_tier VARCHAR(30),                 -- 'TIER_3_GOLD_STANDARD'

    -- Document Metrics
    word_count INTEGER,                       -- 154,324
    section_count INTEGER,                    -- 12
    footnote_count INTEGER,                   -- 974
    cross_reference_count INTEGER,            -- 242

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    certified_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Flexible Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_sessions_quality ON sessions(final_score DESC);
CREATE INDEX idx_sessions_metadata ON sessions USING GIN(metadata);

-- ============================================================
-- REPORTS TABLE
-- All markdown content (specialist reports, sections, QA docs)
-- ============================================================
CREATE TABLE reports (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Report Classification
    report_type VARCHAR(50) NOT NULL
        CHECK (report_type IN ('specialist', 'section', 'review',
                               'qa', 'remediation', 'synthesis', 'final')),
    report_key VARCHAR(100) NOT NULL,         -- 'section-IV-A', 'T1-medicare'

    -- Content
    title TEXT,                               -- 'Federal Healthcare Fraud & Abuse'
    content TEXT NOT NULL,                    -- Full markdown content
    content_hash VARCHAR(64),                 -- SHA-256 for deduplication

    -- Metrics
    word_count INTEGER,
    line_count INTEGER,
    finding_count INTEGER,

    -- Versioning
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    superseded_by UUID REFERENCES reports(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Flexible Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Unique constraint per version
    CONSTRAINT uq_report_version UNIQUE (session_id, report_type, report_key, version)
);

-- Indexes
CREATE INDEX idx_reports_session ON reports(session_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_current ON reports(session_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_reports_content_hash ON reports(content_hash);
CREATE INDEX idx_reports_metadata ON reports USING GIN(metadata);

-- Full-text search index on content
CREATE INDEX idx_reports_content_fts ON reports
    USING GIN(to_tsvector('english', content));

-- ============================================================
-- AGENT_STATES TABLE
-- JSON state files for agent progress tracking
-- ============================================================
CREATE TABLE agent_states (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Agent Identification
    agent_type VARCHAR(50) NOT NULL,          -- 'section-writer', 'qa-diagnostic'
    state_key VARCHAR(100) NOT NULL,          -- 'section-writer-IV-A'

    -- State Data (preserves full JSON structure)
    state_data JSONB NOT NULL,

    -- Quick Recovery Fields (extracted from state_data)
    compaction_summary TEXT,                  -- Instant context on interruption
    phases_complete JSONB,                    -- {phase_1: true, phase_2: false}
    progress_percentage DECIMAL(5,2),         -- 0.00 to 100.00

    -- Recovery Instructions
    recovery_instructions JSONB,              -- What not to repeat

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint
    CONSTRAINT uq_agent_state UNIQUE (session_id, agent_type, state_key)
);

-- Indexes
CREATE INDEX idx_states_session ON agent_states(session_id);
CREATE INDEX idx_states_agent ON agent_states(agent_type);
CREATE INDEX idx_states_progress ON agent_states(progress_percentage);
CREATE INDEX idx_states_data ON agent_states USING GIN(state_data);

-- ============================================================
-- QA_ISSUES TABLE
-- Quality assurance findings and remediation tracking
-- ============================================================
CREATE TABLE qa_issues (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Issue Identification
    issue_id VARCHAR(30) NOT NULL,            -- 'W1-001', 'W3-002-R2'

    -- Classification
    severity VARCHAR(10) NOT NULL
        CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    dimension INTEGER CHECK (dimension BETWEEN 1 AND 12),
    dimension_name VARCHAR(50),               -- 'CREAC Structure', 'Citation Quality'

    -- Issue Details
    title TEXT NOT NULL,                      -- 'Missing CREAC Structural Headers'
    description TEXT,                         -- Full issue description
    location TEXT,                            -- File/line reference

    -- Scoring Impact
    pre_score DECIMAL(4,2),                   -- 3.0 (out of 10)
    post_score DECIMAL(4,2),                  -- 10.0 (out of 10)
    weight_multiplier DECIMAL(3,1),           -- 2.0 (2x weight)
    weighted_impact DECIMAL(5,2),             -- Points gained/lost

    -- Remediation Tracking
    status VARCHAR(20) DEFAULT 'identified'
        CHECK (status IN ('identified', 'assigned', 'in_progress',
                          'remediated', 'verified', 'wont_fix')),
    remediation_wave VARCHAR(10),             -- 'W1', 'W3', 'W4-001'
    remediation_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Unique constraint
    CONSTRAINT uq_qa_issue UNIQUE (session_id, issue_id)
);

-- Indexes
CREATE INDEX idx_qa_session ON qa_issues(session_id);
CREATE INDEX idx_qa_severity ON qa_issues(severity);
CREATE INDEX idx_qa_status ON qa_issues(status);
CREATE INDEX idx_qa_dimension ON qa_issues(dimension);
CREATE INDEX idx_qa_wave ON qa_issues(remediation_wave);

-- ============================================================
-- RISK_FINDINGS TABLE
-- Quantified risk findings with scenario analysis
-- ============================================================
CREATE TABLE risk_findings (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Location
    section_key VARCHAR(20) NOT NULL,         -- 'IV.A', 'IV.B'
    section_name VARCHAR(100),                -- 'Federal Healthcare Fraud & Abuse'

    -- Finding Details
    finding_id VARCHAR(30),                   -- 'F-IV.A-001'
    finding_name TEXT NOT NULL,               -- 'STARK Physician Self-Referral Exposure'
    finding_description TEXT,

    -- Classification
    severity VARCHAR(10)
        CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    legal_domain VARCHAR(50),                 -- 'Federal Healthcare', 'Employment'

    -- Quantification
    probability DECIMAL(5,4),                 -- 0.2500 = 25%
    probability_basis TEXT,                   -- 'Based on Tuomey precedent'

    -- Exposure Analysis
    gross_exposure DECIMAL(15,2),             -- $15,000,000.00
    net_exposure DECIMAL(15,2),               -- After mitigation
    weighted_impact DECIMAL(15,2),            -- probability x gross

    -- Three-Scenario Analysis
    scenario_p10 DECIMAL(15,2),               -- Optimistic (10th percentile)
    scenario_p50 DECIMAL(15,2),               -- Base case (50th percentile)
    scenario_p90 DECIMAL(15,2),               -- Stress case (90th percentile)

    -- Mitigation
    mitigation_strategy TEXT,
    mitigation_cost DECIMAL(15,2),
    residual_risk DECIMAL(15,2),

    -- Contract Provisions
    draft_provision TEXT,                     -- Recommended contract language
    escrow_recommendation DECIMAL(15,2),      -- Suggested holdback amount

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_risks_session ON risk_findings(session_id);
CREATE INDEX idx_risks_section ON risk_findings(section_key);
CREATE INDEX idx_risks_severity ON risk_findings(severity);
CREATE INDEX idx_risks_exposure ON risk_findings(weighted_impact DESC);
CREATE INDEX idx_risks_domain ON risk_findings(legal_domain);

-- ============================================================
-- CROSS_REFERENCES TABLE
-- Links between findings across sections
-- ============================================================
CREATE TABLE cross_references (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Source Reference
    source_section VARCHAR(20) NOT NULL,      -- 'IV.A'
    source_finding_id VARCHAR(30),            -- 'F-IV.A-001'
    source_line INTEGER,                      -- Line number in document

    -- Target Reference
    target_section VARCHAR(20) NOT NULL,      -- 'IV.B'
    target_finding_id VARCHAR(30),            -- 'F-IV.B-003'
    target_line INTEGER,

    -- Relationship
    relationship_type VARCHAR(30),            -- 'impacts', 'depends_on', 'contradicts'
    description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicates
    CONSTRAINT uq_cross_ref UNIQUE (session_id, source_section, source_finding_id,
                                    target_section, target_finding_id)
);

-- Indexes
CREATE INDEX idx_xref_session ON cross_references(session_id);
CREATE INDEX idx_xref_source ON cross_references(source_section);
CREATE INDEX idx_xref_target ON cross_references(target_section);

-- ============================================================
-- AUDIT_LOG TABLE
-- Track all changes for compliance
-- ============================================================
CREATE TABLE audit_log (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Reference
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Change Details
    action VARCHAR(10) NOT NULL               -- 'INSERT', 'UPDATE', 'DELETE'
        CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],                    -- Array of field names changed

    -- Context
    user_id VARCHAR(100),                     -- 'agent:section-writer-IV-A'
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_session ON audit_log(session_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_time ON audit_log(created_at DESC);

-- Partition by month for performance (optional)
-- CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 4.2 Audit Trigger Function

```sql
-- ============================================================
-- AUDIT TRIGGER FUNCTION
-- Automatically log all changes
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    changed_cols TEXT[];
    session_uuid UUID;
BEGIN
    -- Extract session_id if present
    IF TG_OP = 'DELETE' THEN
        session_uuid := OLD.session_id;
    ELSE
        session_uuid := NEW.session_id;
    END IF;

    -- Calculate changed fields for UPDATE
    IF TG_OP = 'UPDATE' THEN
        SELECT array_agg(key)
        INTO changed_cols
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key;
    END IF;

    -- Insert audit record
    INSERT INTO audit_log (table_name, record_id, session_id, action,
                           old_data, new_data, changed_fields, user_id)
    VALUES (
        TG_TABLE_NAME,
        CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
        session_uuid,
        TG_OP,
        CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        changed_cols,
        current_setting('app.current_user', TRUE)
    );

    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_reports AFTER INSERT OR UPDATE OR DELETE ON reports
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_states AFTER INSERT OR UPDATE OR DELETE ON agent_states
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_qa_issues AFTER INSERT OR UPDATE OR DELETE ON qa_issues
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_risks AFTER INSERT OR UPDATE OR DELETE ON risk_findings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 4.3 Materialized Views for Analytics

```sql
-- ============================================================
-- SESSION SUMMARY VIEW
-- Pre-aggregated metrics for dashboard
-- ============================================================
CREATE MATERIALIZED VIEW session_summary AS
SELECT
    s.id,
    s.session_key,
    s.transaction_name,
    s.status,
    s.initial_score,
    s.final_score,
    s.final_score - s.initial_score AS score_improvement,
    s.quality_tier,
    s.created_at,
    s.certified_at,
    COUNT(DISTINCT r.id) FILTER (WHERE r.report_type = 'section') AS section_count,
    COUNT(DISTINCT r.id) FILTER (WHERE r.report_type = 'specialist') AS specialist_count,
    COUNT(DISTINCT q.id) AS total_issues,
    COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'verified') AS resolved_issues,
    COUNT(DISTINCT q.id) FILTER (WHERE q.severity = 'CRITICAL') AS critical_issues,
    SUM(rf.weighted_impact) AS total_weighted_exposure,
    COUNT(DISTINCT rf.id) AS total_findings
FROM sessions s
LEFT JOIN reports r ON s.id = r.session_id AND r.is_current = TRUE
LEFT JOIN qa_issues q ON s.id = q.session_id
LEFT JOIN risk_findings rf ON s.id = rf.session_id
GROUP BY s.id;

CREATE UNIQUE INDEX idx_session_summary_id ON session_summary(id);

-- Refresh command (run periodically or on-demand)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY session_summary;

-- ============================================================
-- RISK AGGREGATION VIEW
-- Cross-session risk analysis
-- ============================================================
CREATE MATERIALIZED VIEW risk_aggregation AS
SELECT
    rf.legal_domain,
    rf.severity,
    COUNT(*) AS finding_count,
    AVG(rf.probability) AS avg_probability,
    SUM(rf.gross_exposure) AS total_gross_exposure,
    SUM(rf.weighted_impact) AS total_weighted_exposure,
    AVG(rf.scenario_p50) AS avg_base_case,
    COUNT(DISTINCT rf.session_id) AS session_count
FROM risk_findings rf
JOIN sessions s ON rf.session_id = s.id
WHERE s.status IN ('certified', 'delivered')
GROUP BY rf.legal_domain, rf.severity;

CREATE INDEX idx_risk_agg_domain ON risk_aggregation(legal_domain);

-- ============================================================
-- QA METRICS VIEW
-- Quality improvement tracking
-- ============================================================
CREATE MATERIALIZED VIEW qa_metrics AS
SELECT
    q.dimension,
    q.dimension_name,
    q.severity,
    COUNT(*) AS issue_count,
    AVG(q.post_score - q.pre_score) AS avg_improvement,
    COUNT(*) FILTER (WHERE q.status = 'verified') AS resolved_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE q.status = 'verified') / COUNT(*), 2) AS resolution_rate,
    AVG(EXTRACT(EPOCH FROM (q.verified_at - q.created_at)) / 3600) AS avg_resolution_hours
FROM qa_issues q
GROUP BY q.dimension, q.dimension_name, q.severity;

CREATE INDEX idx_qa_metrics_dim ON qa_metrics(dimension);
```

### 4.4 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ENTITY RELATIONSHIP DIAGRAM                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   sessions   │
                              │──────────────│
                              │ id (PK)      │
                              │ session_key  │
                              │ status       │
                              │ final_score  │
                              │ quality_tier │
                              │ metadata     │
                              └──────┬───────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          │ 1:N                      │ 1:N                      │ 1:N
          ▼                          ▼                          ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    reports      │       │  agent_states   │       │   qa_issues     │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ session_id (FK) │       │ session_id (FK) │       │ session_id (FK) │
│ report_type     │       │ agent_type      │       │ issue_id        │
│ report_key      │       │ state_key       │       │ severity        │
│ content         │       │ state_data      │       │ dimension       │
│ version         │       │ phases_complete │       │ status          │
│ is_current      │       │ progress_%      │       │ pre/post_score  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
          │
          │ (self-ref)
          │ superseded_by
          ▼
    ┌───────────┐
    │ (version) │
    └───────────┘

          │                          │
          │ 1:N                      │ 1:N
          ▼                          ▼
┌─────────────────┐       ┌─────────────────┐
│ risk_findings   │       │cross_references │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ session_id (FK) │       │ session_id (FK) │
│ section_key     │       │ source_section  │
│ finding_name    │       │ target_section  │
│ severity        │       │ relationship    │
│ probability     │       └─────────────────┘
│ gross_exposure  │
│ scenario_p10    │
│ scenario_p50    │
│ scenario_p90    │
└─────────────────┘

                              ┌──────────────┐
                              │  audit_log   │
                              │──────────────│
                              │ id (PK)      │
                              │ table_name   │
                              │ record_id    │
                              │ action       │
                              │ old/new_data │
                              │ created_at   │
                              └──────────────┘
```

---

## 5. Migration Strategy

### 5.1 Three-Phase Approach

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: DUAL-WRITE                                                         │
│ Duration: 2 weeks                                                           │
│ ─────────────────────────────────────────────────────────────────────────── │
│ • Write to BOTH file system AND database                                    │
│ • Read from file system (primary)                                           │
│ • Validate database writes match file content                               │
│ • Zero risk: files remain source of truth                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: READ ABSTRACTION                                                   │
│ Duration: 2 weeks                                                           │
│ ─────────────────────────────────────────────────────────────────────────── │
│ • Write to BOTH file system AND database                                    │
│ • Read from database (primary), fallback to file                            │
│ • Monitor query performance and accuracy                                    │
│ • Files serve as backup only                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DATABASE PRIMARY                                                   │
│ Duration: Permanent                                                         │
│ ─────────────────────────────────────────────────────────────────────────── │
│ • Write to database only                                                    │
│ • Read from database only                                                   │
│ • Archive files to cold storage                                             │
│ • Full database-backed architecture                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Phase 1: Dual-Write Implementation

**Configuration Flag:**
```javascript
// src/config/storageConfig.js
module.exports = {
    STORAGE_MODE: process.env.STORAGE_MODE || 'dual_write', // 'file_only', 'dual_write', 'db_primary', 'db_only'
    FILE_PATH: process.env.REPORTS_PATH || './reports',
    ENABLE_FILE_FALLBACK: true,
    VALIDATE_DUAL_WRITES: true
};
```

**Dual-Write Wrapper:**
```javascript
// src/db/storage.js
const { Pool } = require('pg');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('../config/storageConfig');

class StorageManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 10
        });
    }

    async saveReport(sessionKey, reportType, reportKey, content, metadata = {}) {
        const wordCount = content.split(/\s+/).length;
        const contentHash = crypto.createHash('sha256').update(content).digest('hex');

        const results = { file: null, db: null, validated: false };

        // Phase 1: Always write to file
        if (['file_only', 'dual_write'].includes(config.STORAGE_MODE)) {
            const filePath = `${config.FILE_PATH}/${sessionKey}/${reportType}/${reportKey}.md`;
            await fs.ensureDir(`${config.FILE_PATH}/${sessionKey}/${reportType}`);
            await fs.writeFile(filePath, content);
            results.file = filePath;
        }

        // Phase 1+: Write to database
        if (['dual_write', 'db_primary', 'db_only'].includes(config.STORAGE_MODE)) {
            const query = `
                INSERT INTO reports (session_id, report_type, report_key, content,
                                     content_hash, word_count, metadata)
                SELECT s.id, $2, $3, $4, $5, $6, $7
                FROM sessions s WHERE s.session_key = $1
                ON CONFLICT (session_id, report_type, report_key, version)
                DO UPDATE SET
                    content = EXCLUDED.content,
                    content_hash = EXCLUDED.content_hash,
                    word_count = EXCLUDED.word_count,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING id
            `;
            const result = await this.pool.query(query, [
                sessionKey, reportType, reportKey, content,
                contentHash, wordCount, JSON.stringify(metadata)
            ]);
            results.db = result.rows[0]?.id;
        }

        // Validation (Phase 1 only)
        if (config.VALIDATE_DUAL_WRITES && config.STORAGE_MODE === 'dual_write') {
            const dbContent = await this.pool.query(
                `SELECT content FROM reports WHERE id = $1`, [results.db]
            );
            results.validated = dbContent.rows[0]?.content === content;
            if (!results.validated) {
                console.error(`[STORAGE] Validation failed for ${sessionKey}/${reportType}/${reportKey}`);
            }
        }

        return results;
    }

    async getReport(sessionKey, reportType, reportKey) {
        // Phase 2+: Try database first
        if (['db_primary', 'db_only'].includes(config.STORAGE_MODE)) {
            const query = `
                SELECT r.content, r.metadata, r.version, r.updated_at
                FROM reports r
                JOIN sessions s ON r.session_id = s.id
                WHERE s.session_key = $1
                  AND r.report_type = $2
                  AND r.report_key = $3
                  AND r.is_current = TRUE
            `;
            const result = await this.pool.query(query, [sessionKey, reportType, reportKey]);
            if (result.rows.length > 0) {
                return result.rows[0];
            }
        }

        // Fallback to file (Phase 1, or Phase 2 fallback)
        if (config.ENABLE_FILE_FALLBACK || config.STORAGE_MODE === 'file_only') {
            const filePath = `${config.FILE_PATH}/${sessionKey}/${reportType}/${reportKey}.md`;
            if (await fs.pathExists(filePath)) {
                return {
                    content: await fs.readFile(filePath, 'utf8'),
                    metadata: {},
                    version: 1,
                    source: 'file'
                };
            }
        }

        return null;
    }

    async saveAgentState(sessionKey, agentType, stateKey, stateData) {
        const results = { file: null, db: null };

        // Extract quick-recovery fields
        const compactionSummary = stateData.compaction_summary || null;
        const phasesComplete = stateData.phases_complete || {};
        const progressPct = this._calculateProgress(phasesComplete);

        // File write
        if (['file_only', 'dual_write'].includes(config.STORAGE_MODE)) {
            const filePath = `${config.FILE_PATH}/${sessionKey}/${stateKey}.json`;
            await fs.ensureDir(`${config.FILE_PATH}/${sessionKey}`);
            await fs.writeJson(filePath, stateData, { spaces: 2 });
            results.file = filePath;
        }

        // Database write
        if (['dual_write', 'db_primary', 'db_only'].includes(config.STORAGE_MODE)) {
            const query = `
                INSERT INTO agent_states (session_id, agent_type, state_key, state_data,
                                          compaction_summary, phases_complete, progress_percentage)
                SELECT s.id, $2, $3, $4, $5, $6, $7
                FROM sessions s WHERE s.session_key = $1
                ON CONFLICT (session_id, agent_type, state_key)
                DO UPDATE SET
                    state_data = EXCLUDED.state_data,
                    compaction_summary = EXCLUDED.compaction_summary,
                    phases_complete = EXCLUDED.phases_complete,
                    progress_percentage = EXCLUDED.progress_percentage,
                    updated_at = NOW()
                RETURNING id
            `;
            const result = await this.pool.query(query, [
                sessionKey, agentType, stateKey, JSON.stringify(stateData),
                compactionSummary, JSON.stringify(phasesComplete), progressPct
            ]);
            results.db = result.rows[0]?.id;
        }

        return results;
    }

    _calculateProgress(phasesComplete) {
        const phases = Object.values(phasesComplete);
        if (phases.length === 0) return 0;
        const completed = phases.filter(p => p === true).length;
        return (completed / phases.length) * 100;
    }
}

module.exports = new StorageManager();
```

### 5.3 Session Lifecycle Management

```javascript
// src/db/sessionManager.js
class SessionManager {
    constructor(pool) {
        this.pool = pool;
    }

    async createSession(transactionName, metadata = {}) {
        const timestamp = Math.floor(Date.now() / 1000);
        const date = new Date().toISOString().split('T')[0];
        const sessionKey = `${date}-${timestamp}`;

        const query = `
            INSERT INTO sessions (session_key, transaction_name, metadata)
            VALUES ($1, $2, $3)
            RETURNING id, session_key, created_at
        `;
        const result = await this.pool.query(query, [
            sessionKey, transactionName, JSON.stringify(metadata)
        ]);

        // Also create directory for file storage (Phase 1-2)
        await fs.ensureDir(`${config.FILE_PATH}/${sessionKey}`);

        return result.rows[0];
    }

    async updateSessionStatus(sessionKey, status, metrics = {}) {
        const query = `
            UPDATE sessions SET
                status = $2,
                initial_score = COALESCE($3, initial_score),
                final_score = COALESCE($4, final_score),
                quality_tier = COALESCE($5, quality_tier),
                word_count = COALESCE($6, word_count),
                section_count = COALESCE($7, section_count),
                footnote_count = COALESCE($8, footnote_count),
                cross_reference_count = COALESCE($9, cross_reference_count),
                certified_at = CASE WHEN $2 = 'certified' THEN NOW() ELSE certified_at END,
                delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END,
                updated_at = NOW()
            WHERE session_key = $1
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            sessionKey, status,
            metrics.initial_score, metrics.final_score, metrics.quality_tier,
            metrics.word_count, metrics.section_count,
            metrics.footnote_count, metrics.cross_reference_count
        ]);
        return result.rows[0];
    }

    async getSession(sessionKey) {
        const query = `
            SELECT s.*,
                   COUNT(DISTINCT r.id) as report_count,
                   COUNT(DISTINCT q.id) as issue_count
            FROM sessions s
            LEFT JOIN reports r ON s.id = r.session_id
            LEFT JOIN qa_issues q ON s.id = q.session_id
            WHERE s.session_key = $1
            GROUP BY s.id
        `;
        const result = await this.pool.query(query, [sessionKey]);
        return result.rows[0];
    }

    async listSessions(filters = {}) {
        let query = `
            SELECT s.session_key, s.transaction_name, s.status,
                   s.final_score, s.quality_tier, s.created_at
            FROM sessions s
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (filters.status) {
            query += ` AND s.status = $${paramIdx++}`;
            params.push(filters.status);
        }
        if (filters.minScore) {
            query += ` AND s.final_score >= $${paramIdx++}`;
            params.push(filters.minScore);
        }
        if (filters.since) {
            query += ` AND s.created_at >= $${paramIdx++}`;
            params.push(filters.since);
        }

        query += ' ORDER BY s.created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramIdx++}`;
            params.push(filters.limit);
        }

        const result = await this.pool.query(query, params);
        return result.rows;
    }
}

module.exports = SessionManager;
```

---

## 6. Code Changes Required

### 6.1 Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/db/postgres.js` | Extend | Add new table creation, connection pooling |
| `src/config/storageConfig.js` | **NEW** | Storage mode configuration |
| `src/db/storage.js` | **NEW** | Storage abstraction layer |
| `src/db/sessionManager.js` | **NEW** | Session lifecycle management |
| `src/db/reportRepository.js` | **NEW** | Report CRUD operations |
| `src/db/qaIssueTracker.js` | **NEW** | QA issue management |
| `src/db/riskFindingStore.js` | **NEW** | Risk finding persistence |
| `src/orchestrator/*.js` | Modify | Replace file writes with storage calls |
| `src/tools/memo-*.js` | Modify | Replace file reads with storage calls |
| `scripts/migrate-historical.js` | **NEW** | Historical data migration script |

### 6.2 Orchestrator Integration

```javascript
// src/orchestrator/sectionWriter.js (example modification)

// BEFORE:
async function writeSectionReport(sessionKey, sectionKey, content) {
    const filePath = `reports/${sessionKey}/section-reports/section-${sectionKey}.md`;
    await fs.writeFile(filePath, content);
    return filePath;
}

// AFTER:
const storage = require('../db/storage');

async function writeSectionReport(sessionKey, sectionKey, content, metadata = {}) {
    const result = await storage.saveReport(
        sessionKey,
        'section',
        `section-${sectionKey}`,
        content,
        {
            ...metadata,
            section_key: sectionKey,
            generated_by: 'section-writer'
        }
    );
    return result;
}
```

### 6.3 QA Tool Integration

```javascript
// src/tools/memo-qa-diagnostic.js (example modification)

// BEFORE:
async function saveQADiagnostic(sessionKey, diagnostic) {
    const filePath = `reports/${sessionKey}/qa-outputs/diagnostic-assessment.md`;
    await fs.writeFile(filePath, formatDiagnostic(diagnostic));

    const statePath = `reports/${sessionKey}/qa-outputs/qa-diagnostic-state.json`;
    await fs.writeJson(statePath, diagnostic.state);
}

// AFTER:
const storage = require('../db/storage');
const qaTracker = require('../db/qaIssueTracker');

async function saveQADiagnostic(sessionKey, diagnostic) {
    // Save report
    await storage.saveReport(
        sessionKey,
        'qa',
        'diagnostic-assessment',
        formatDiagnostic(diagnostic),
        { score: diagnostic.score, issue_count: diagnostic.issues.length }
    );

    // Save state
    await storage.saveAgentState(
        sessionKey,
        'qa-diagnostic',
        'qa-diagnostic-state',
        diagnostic.state
    );

    // Track individual issues
    for (const issue of diagnostic.issues) {
        await qaTracker.createIssue(sessionKey, {
            issue_id: issue.id,
            severity: issue.severity,
            dimension: issue.dimension,
            title: issue.title,
            description: issue.description,
            pre_score: issue.pre_score
        });
    }

    // Update session status
    await sessionManager.updateSessionStatus(sessionKey, 'qa_pending', {
        initial_score: diagnostic.score
    });
}
```

---

## 7. Data Abstraction Layer

### 7.1 Repository Pattern Implementation

```javascript
// src/db/repositories/reportRepository.js
class ReportRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(sessionId, data) {
        const query = `
            INSERT INTO reports (session_id, report_type, report_key, title,
                                 content, word_count, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            sessionId, data.report_type, data.report_key, data.title,
            data.content, data.word_count, JSON.stringify(data.metadata || {})
        ]);
        return result.rows[0];
    }

    async findBySessionAndKey(sessionId, reportType, reportKey) {
        const query = `
            SELECT * FROM reports
            WHERE session_id = $1 AND report_type = $2 AND report_key = $3
            AND is_current = TRUE
        `;
        const result = await this.pool.query(query, [sessionId, reportType, reportKey]);
        return result.rows[0];
    }

    async findAllBySession(sessionId, reportType = null) {
        let query = `SELECT * FROM reports WHERE session_id = $1 AND is_current = TRUE`;
        const params = [sessionId];

        if (reportType) {
            query += ` AND report_type = $2`;
            params.push(reportType);
        }

        query += ` ORDER BY report_key`;
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async createVersion(reportId, newContent, metadata = {}) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Get current version
            const current = await client.query(
                `SELECT * FROM reports WHERE id = $1`, [reportId]
            );
            const currentVersion = current.rows[0];

            // Mark current as not current
            await client.query(
                `UPDATE reports SET is_current = FALSE WHERE id = $1`, [reportId]
            );

            // Create new version
            const newVersion = await client.query(`
                INSERT INTO reports (session_id, report_type, report_key, title,
                                     content, word_count, metadata, version, is_current)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                RETURNING *
            `, [
                currentVersion.session_id, currentVersion.report_type,
                currentVersion.report_key, currentVersion.title,
                newContent, newContent.split(/\s+/).length,
                JSON.stringify(metadata), currentVersion.version + 1
            ]);

            // Link versions
            await client.query(
                `UPDATE reports SET superseded_by = $1 WHERE id = $2`,
                [newVersion.rows[0].id, reportId]
            );

            await client.query('COMMIT');
            return newVersion.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async search(searchTerm, sessionId = null) {
        let query = `
            SELECT r.*, s.session_key,
                   ts_headline('english', r.content, plainto_tsquery($1)) as snippet
            FROM reports r
            JOIN sessions s ON r.session_id = s.id
            WHERE to_tsvector('english', r.content) @@ plainto_tsquery($1)
            AND r.is_current = TRUE
        `;
        const params = [searchTerm];

        if (sessionId) {
            query += ` AND r.session_id = $2`;
            params.push(sessionId);
        }

        query += ` ORDER BY ts_rank(to_tsvector('english', r.content), plainto_tsquery($1)) DESC`;

        const result = await this.pool.query(query, params);
        return result.rows;
    }
}

module.exports = ReportRepository;
```

### 7.2 QA Issue Tracker

```javascript
// src/db/repositories/qaIssueTracker.js
class QAIssueTracker {
    constructor(pool) {
        this.pool = pool;
    }

    async createIssue(sessionKey, issue) {
        const query = `
            INSERT INTO qa_issues (session_id, issue_id, severity, dimension,
                                   dimension_name, title, description, pre_score)
            SELECT s.id, $2, $3, $4, $5, $6, $7, $8
            FROM sessions s WHERE s.session_key = $1
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            sessionKey, issue.issue_id, issue.severity, issue.dimension,
            issue.dimension_name, issue.title, issue.description, issue.pre_score
        ]);
        return result.rows[0];
    }

    async assignToWave(sessionKey, issueId, wave) {
        const query = `
            UPDATE qa_issues SET
                remediation_wave = $3,
                status = 'assigned',
                assigned_at = NOW(),
                updated_at = NOW()
            WHERE session_id = (SELECT id FROM sessions WHERE session_key = $1)
            AND issue_id = $2
            RETURNING *
        `;
        const result = await this.pool.query(query, [sessionKey, issueId, wave]);
        return result.rows[0];
    }

    async markRemediated(sessionKey, issueId, notes = null) {
        const query = `
            UPDATE qa_issues SET
                status = 'remediated',
                remediation_notes = COALESCE($3, remediation_notes),
                updated_at = NOW()
            WHERE session_id = (SELECT id FROM sessions WHERE session_key = $1)
            AND issue_id = $2
            RETURNING *
        `;
        const result = await this.pool.query(query, [sessionKey, issueId, notes]);
        return result.rows[0];
    }

    async verify(sessionKey, issueId, postScore) {
        const query = `
            UPDATE qa_issues SET
                status = 'verified',
                post_score = $3,
                verified_at = NOW(),
                updated_at = NOW()
            WHERE session_id = (SELECT id FROM sessions WHERE session_key = $1)
            AND issue_id = $2
            RETURNING *
        `;
        const result = await this.pool.query(query, [sessionKey, issueId, postScore]);
        return result.rows[0];
    }

    async getSessionIssues(sessionKey, filters = {}) {
        let query = `
            SELECT q.* FROM qa_issues q
            JOIN sessions s ON q.session_id = s.id
            WHERE s.session_key = $1
        `;
        const params = [sessionKey];
        let paramIdx = 2;

        if (filters.status) {
            query += ` AND q.status = $${paramIdx++}`;
            params.push(filters.status);
        }
        if (filters.severity) {
            query += ` AND q.severity = $${paramIdx++}`;
            params.push(filters.severity);
        }
        if (filters.wave) {
            query += ` AND q.remediation_wave = $${paramIdx++}`;
            params.push(filters.wave);
        }

        query += ` ORDER BY
            CASE q.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
            END,
            q.dimension
        `;

        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async calculateResolutionRate(sessionKey) {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'verified') as resolved,
                COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND status != 'verified') as critical_unresolved,
                ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'verified') / NULLIF(COUNT(*), 0), 2) as resolution_rate
            FROM qa_issues q
            JOIN sessions s ON q.session_id = s.id
            WHERE s.session_key = $1
        `;
        const result = await this.pool.query(query, [sessionKey]);
        return result.rows[0];
    }
}

module.exports = QAIssueTracker;
```

### 7.3 Risk Finding Store

```javascript
// src/db/repositories/riskFindingStore.js
class RiskFindingStore {
    constructor(pool) {
        this.pool = pool;
    }

    async addFinding(sessionKey, finding) {
        const query = `
            INSERT INTO risk_findings (
                session_id, section_key, section_name, finding_id, finding_name,
                finding_description, severity, legal_domain, probability, probability_basis,
                gross_exposure, weighted_impact, scenario_p10, scenario_p50, scenario_p90,
                mitigation_strategy, draft_provision, escrow_recommendation
            )
            SELECT s.id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            FROM sessions s WHERE s.session_key = $1
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            sessionKey, finding.section_key, finding.section_name,
            finding.finding_id, finding.finding_name, finding.finding_description,
            finding.severity, finding.legal_domain, finding.probability,
            finding.probability_basis, finding.gross_exposure,
            finding.probability * finding.gross_exposure, // weighted_impact
            finding.scenario_p10, finding.scenario_p50, finding.scenario_p90,
            finding.mitigation_strategy, finding.draft_provision,
            finding.escrow_recommendation
        ]);
        return result.rows[0];
    }

    async getSessionFindings(sessionKey, groupBy = null) {
        let query = `
            SELECT rf.* FROM risk_findings rf
            JOIN sessions s ON rf.session_id = s.id
            WHERE s.session_key = $1
            ORDER BY rf.weighted_impact DESC
        `;
        const result = await this.pool.query(query, [sessionKey]);

        if (groupBy === 'section') {
            return this._groupBySection(result.rows);
        } else if (groupBy === 'severity') {
            return this._groupBySeverity(result.rows);
        }
        return result.rows;
    }

    async getAggregateExposure(sessionKey) {
        const query = `
            SELECT
                COUNT(*) as finding_count,
                SUM(gross_exposure) as total_gross_exposure,
                SUM(weighted_impact) as total_weighted_exposure,
                SUM(scenario_p10) as total_p10,
                SUM(scenario_p50) as total_p50,
                SUM(scenario_p90) as total_p90,
                COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count,
                COUNT(*) FILTER (WHERE severity = 'HIGH') as high_count,
                COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_count,
                COUNT(*) FILTER (WHERE severity = 'LOW') as low_count
            FROM risk_findings rf
            JOIN sessions s ON rf.session_id = s.id
            WHERE s.session_key = $1
        `;
        const result = await this.pool.query(query, [sessionKey]);
        return result.rows[0];
    }

    async getTopFindings(sessionKey, limit = 10) {
        const query = `
            SELECT rf.* FROM risk_findings rf
            JOIN sessions s ON rf.session_id = s.id
            WHERE s.session_key = $1
            ORDER BY rf.weighted_impact DESC
            LIMIT $2
        `;
        const result = await this.pool.query(query, [sessionKey, limit]);
        return result.rows;
    }

    _groupBySection(findings) {
        return findings.reduce((acc, f) => {
            if (!acc[f.section_key]) acc[f.section_key] = [];
            acc[f.section_key].push(f);
            return acc;
        }, {});
    }

    _groupBySeverity(findings) {
        return findings.reduce((acc, f) => {
            if (!acc[f.severity]) acc[f.severity] = [];
            acc[f.severity].push(f);
            return acc;
        }, {});
    }
}

module.exports = RiskFindingStore;
```

---

## 8. Historical Data Migration

### 8.1 Migration Script

```javascript
// scripts/migrate-historical.js
const fs = require('fs-extra');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});

const REPORTS_PATH = './reports';

async function migrateAllSessions() {
    console.log('Starting historical data migration...');

    // Get all session directories
    const sessions = await fs.readdir(REPORTS_PATH);
    const sessionDirs = sessions.filter(s => /^\d{4}-\d{2}-\d{2}-\d+$/.test(s));

    console.log(`Found ${sessionDirs.length} sessions to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const sessionKey of sessionDirs) {
        try {
            await migrateSession(sessionKey);
            migrated++;
            console.log(`[${migrated}/${sessionDirs.length}] Migrated: ${sessionKey}`);
        } catch (err) {
            failed++;
            console.error(`[ERROR] Failed to migrate ${sessionKey}:`, err.message);
        }
    }

    console.log(`\nMigration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateSession(sessionKey) {
    const sessionPath = path.join(REPORTS_PATH, sessionKey);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create session record
        const timestamp = parseInt(sessionKey.split('-').pop());
        const sessionResult = await client.query(`
            INSERT INTO sessions (session_key, created_at, status)
            VALUES ($1, to_timestamp($2), 'archived')
            ON CONFLICT (session_key) DO UPDATE SET updated_at = NOW()
            RETURNING id
        `, [sessionKey, timestamp]);

        const sessionId = sessionResult.rows[0].id;

        // 2. Migrate specialist reports
        await migrateDirectory(client, sessionId, sessionPath, 'specialist-reports', 'specialist');

        // 3. Migrate section reports
        await migrateDirectory(client, sessionId, sessionPath, 'section-reports', 'section');

        // 4. Migrate review outputs
        await migrateDirectory(client, sessionId, sessionPath, 'review-outputs', 'review');

        // 5. Migrate QA outputs
        await migrateDirectory(client, sessionId, sessionPath, 'qa-outputs', 'qa');

        // 6. Migrate remediation outputs
        await migrateDirectory(client, sessionId, sessionPath, 'remediation-outputs', 'remediation');

        // 7. Migrate root-level files
        await migrateRootFiles(client, sessionId, sessionPath);

        // 8. Migrate state files
        await migrateStateFiles(client, sessionId, sessionPath);

        // 9. Extract and update session metrics from final memorandum
        await extractSessionMetrics(client, sessionId, sessionPath);

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function migrateDirectory(client, sessionId, sessionPath, dirName, reportType) {
    const dirPath = path.join(sessionPath, dirName);

    if (!await fs.pathExists(dirPath)) {
        return;
    }

    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        const reportKey = file.replace('.md', '');
        const wordCount = content.split(/\s+/).length;
        const contentHash = crypto.createHash('sha256').update(content).digest('hex');

        await client.query(`
            INSERT INTO reports (session_id, report_type, report_key, content,
                                 word_count, content_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (session_id, report_type, report_key, version) DO NOTHING
        `, [sessionId, reportType, reportKey, content, wordCount, contentHash]);
    }
}

async function migrateRootFiles(client, sessionId, sessionPath) {
    const rootFiles = [
        { file: 'final-memorandum.md', type: 'final', key: 'final-memorandum' },
        { file: 'final-memorandum-v2.md', type: 'final', key: 'final-memorandum', version: 2 },
        { file: 'executive-summary.md', type: 'synthesis', key: 'executive-summary' },
        { file: 'research-plan.md', type: 'synthesis', key: 'research-plan' },
        { file: 'consolidated-footnotes.md', type: 'synthesis', key: 'consolidated-footnotes' }
    ];

    for (const { file, type, key, version = 1 } of rootFiles) {
        const filePath = path.join(sessionPath, file);

        if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, 'utf8');
            const wordCount = content.split(/\s+/).length;
            const contentHash = crypto.createHash('sha256').update(content).digest('hex');

            await client.query(`
                INSERT INTO reports (session_id, report_type, report_key, content,
                                     word_count, content_hash, version, is_current)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (session_id, report_type, report_key, version) DO NOTHING
            `, [sessionId, type, key, content, wordCount, contentHash, version, version === 2]);
        }
    }
}

async function migrateStateFiles(client, sessionId, sessionPath) {
    const files = await fs.readdir(sessionPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(sessionPath, file);
        const stateData = await fs.readJson(filePath);
        const stateKey = file.replace('.json', '');

        // Determine agent type from file name
        let agentType = 'unknown';
        if (stateKey.includes('section-writer')) agentType = 'section-writer';
        else if (stateKey.includes('qa-diagnostic')) agentType = 'qa-diagnostic';
        else if (stateKey.includes('synthesis')) agentType = 'synthesis';
        else if (stateKey.includes('executive')) agentType = 'executive-summary';

        const compactionSummary = stateData.compaction_summary || null;
        const phasesComplete = stateData.phases_complete || {};

        await client.query(`
            INSERT INTO agent_states (session_id, agent_type, state_key, state_data,
                                      compaction_summary, phases_complete)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (session_id, agent_type, state_key) DO NOTHING
        `, [sessionId, agentType, stateKey, JSON.stringify(stateData),
            compactionSummary, JSON.stringify(phasesComplete)]);
    }

    // Also check subdirectories for state files
    const subdirs = ['section-reports', 'qa-outputs', 'review-outputs'];
    for (const subdir of subdirs) {
        const subdirPath = path.join(sessionPath, subdir);
        if (await fs.pathExists(subdirPath)) {
            const subFiles = await fs.readdir(subdirPath);
            const subJsonFiles = subFiles.filter(f => f.endsWith('.json'));

            for (const file of subJsonFiles) {
                const filePath = path.join(subdirPath, file);
                const stateData = await fs.readJson(filePath);
                const stateKey = `${subdir}/${file.replace('.json', '')}`;

                await client.query(`
                    INSERT INTO agent_states (session_id, agent_type, state_key, state_data)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (session_id, agent_type, state_key) DO NOTHING
                `, [sessionId, subdir, stateKey, JSON.stringify(stateData)]);
            }
        }
    }
}

async function extractSessionMetrics(client, sessionId, sessionPath) {
    // Try to extract metrics from QA certificate or final memorandum
    const qaPath = path.join(sessionPath, 'qa-outputs', 'final-qa-certificate.md');
    const deliveryPath = path.join(sessionPath, 'qa-outputs', 'delivery-decision.md');

    let metrics = {};

    if (await fs.pathExists(qaPath)) {
        const content = await fs.readFile(qaPath, 'utf8');

        // Extract score
        const scoreMatch = content.match(/Final Score[:\s]*(\d+\.?\d*)%/i);
        if (scoreMatch) metrics.final_score = parseFloat(scoreMatch[1]);

        // Extract quality tier
        const tierMatch = content.match(/TIER\s*\d[:\s]*([^\n]+)/i);
        if (tierMatch) metrics.quality_tier = tierMatch[0].trim();

        // Extract word count
        const wordMatch = content.match(/Word Count[:\s]*(\d+(?:,\d+)?)/i);
        if (wordMatch) metrics.word_count = parseInt(wordMatch[1].replace(/,/g, ''));

        // Extract footnote count
        const footnoteMatch = content.match(/Footnotes[:\s]*(\d+)/i);
        if (footnoteMatch) metrics.footnote_count = parseInt(footnoteMatch[1]);
    }

    if (await fs.pathExists(deliveryPath)) {
        const content = await fs.readFile(deliveryPath, 'utf8');

        // Check for certification
        if (content.includes('CERTIFIED') || content.includes('CERTIFY')) {
            metrics.status = 'certified';
        }
    }

    if (Object.keys(metrics).length > 0) {
        const updates = [];
        const values = [sessionId];
        let paramIdx = 2;

        for (const [key, value] of Object.entries(metrics)) {
            updates.push(`${key} = $${paramIdx++}`);
            values.push(value);
        }

        await client.query(`
            UPDATE sessions SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $1
        `, values);
    }
}

// Run migration
migrateAllSessions()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
```

### 8.2 Migration Validation Script

```javascript
// scripts/validate-migration.js
const fs = require('fs-extra');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function validateMigration() {
    console.log('Validating migration...\n');

    const issues = [];

    // 1. Check session count
    const dbSessions = await pool.query('SELECT COUNT(*) FROM sessions');
    const fileSessions = (await fs.readdir('./reports'))
        .filter(s => /^\d{4}-\d{2}-\d{2}-\d+$/.test(s));

    console.log(`Sessions - DB: ${dbSessions.rows[0].count}, Files: ${fileSessions.length}`);
    if (parseInt(dbSessions.rows[0].count) !== fileSessions.length) {
        issues.push(`Session count mismatch: DB=${dbSessions.rows[0].count}, Files=${fileSessions.length}`);
    }

    // 2. Check report count per session
    const dbReports = await pool.query(`
        SELECT s.session_key, COUNT(r.id) as report_count
        FROM sessions s
        LEFT JOIN reports r ON s.id = r.session_id
        GROUP BY s.session_key
    `);

    for (const row of dbReports.rows) {
        const sessionPath = `./reports/${row.session_key}`;
        const fileCount = await countMdFiles(sessionPath);

        if (parseInt(row.report_count) !== fileCount) {
            issues.push(`Report count mismatch for ${row.session_key}: DB=${row.report_count}, Files=${fileCount}`);
        }
    }

    // 3. Validate content hashes for sample
    console.log('\nValidating content hashes...');
    const sampleReports = await pool.query(`
        SELECT r.id, s.session_key, r.report_type, r.report_key, r.content_hash
        FROM reports r
        JOIN sessions s ON r.session_id = s.id
        ORDER BY RANDOM()
        LIMIT 50
    `);

    for (const report of sampleReports.rows) {
        const filePath = getFilePath(report);
        if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, 'utf8');
            const fileHash = crypto.createHash('sha256').update(content).digest('hex');

            if (fileHash !== report.content_hash) {
                issues.push(`Hash mismatch for ${filePath}`);
            }
        }
    }

    // 4. Check state files
    const dbStates = await pool.query('SELECT COUNT(*) FROM agent_states');
    console.log(`\nState files in DB: ${dbStates.rows[0].count}`);

    // Summary
    console.log('\n=== Validation Summary ===');
    if (issues.length === 0) {
        console.log('✅ All validations passed!');
    } else {
        console.log(`❌ Found ${issues.length} issues:`);
        issues.forEach(i => console.log(`  - ${i}`));
    }

    return issues.length === 0;
}

async function countMdFiles(dirPath) {
    let count = 0;

    if (!await fs.pathExists(dirPath)) return 0;

    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = `${dirPath}/${item.name}`;
        if (item.isDirectory()) {
            count += await countMdFiles(itemPath);
        } else if (item.name.endsWith('.md')) {
            count++;
        }
    }

    return count;
}

function getFilePath(report) {
    const base = `./reports/${report.session_key}`;

    if (report.report_type === 'specialist') {
        return `${base}/specialist-reports/${report.report_key}.md`;
    } else if (report.report_type === 'section') {
        return `${base}/section-reports/${report.report_key}.md`;
    } else if (report.report_type === 'qa') {
        return `${base}/qa-outputs/${report.report_key}.md`;
    } else if (report.report_type === 'final') {
        return `${base}/${report.report_key}.md`;
    }
    return `${base}/${report.report_key}.md`;
}

validateMigration()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Validation error:', err);
        process.exit(1);
    });
```

---

## 9. Validation & Testing

### 9.1 Test Suite

```javascript
// tests/db/storage.test.js
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const StorageManager = require('../../src/db/storage');

describe('StorageManager', () => {
    const testSessionKey = 'test-2026-01-26-999999';

    before(async () => {
        // Create test session
        await StorageManager.pool.query(`
            INSERT INTO sessions (session_key, transaction_name)
            VALUES ($1, 'Test Transaction')
        `, [testSessionKey]);
    });

    after(async () => {
        // Cleanup
        await StorageManager.pool.query(`
            DELETE FROM sessions WHERE session_key = $1
        `, [testSessionKey]);
    });

    describe('saveReport', () => {
        it('should save report to both file and database in dual_write mode', async () => {
            const content = '# Test Report\n\nThis is test content.';
            const result = await StorageManager.saveReport(
                testSessionKey, 'section', 'test-section', content, { test: true }
            );

            expect(result.file).to.include(testSessionKey);
            expect(result.db).to.be.a('string');
            expect(result.validated).to.be.true;
        });

        it('should retrieve report from database', async () => {
            const report = await StorageManager.getReport(
                testSessionKey, 'section', 'test-section'
            );

            expect(report.content).to.include('Test Report');
            expect(report.metadata).to.deep.include({ test: true });
        });
    });

    describe('saveAgentState', () => {
        it('should save state with extracted fields', async () => {
            const state = {
                compaction_summary: 'Test summary',
                phases_complete: { phase_1: true, phase_2: false },
                data: { key: 'value' }
            };

            const result = await StorageManager.saveAgentState(
                testSessionKey, 'test-agent', 'test-state', state
            );

            expect(result.db).to.be.a('string');

            // Verify extracted fields
            const dbState = await StorageManager.pool.query(`
                SELECT compaction_summary, progress_percentage
                FROM agent_states WHERE id = $1
            `, [result.db]);

            expect(dbState.rows[0].compaction_summary).to.equal('Test summary');
            expect(parseFloat(dbState.rows[0].progress_percentage)).to.equal(50);
        });
    });
});
```

### 9.2 Integration Test

```javascript
// tests/integration/workflow.test.js
const { describe, it } = require('mocha');
const { expect } = require('chai');
const SessionManager = require('../../src/db/sessionManager');
const StorageManager = require('../../src/db/storage');
const QAIssueTracker = require('../../src/db/qaIssueTracker');

describe('Full Workflow Integration', () => {
    let sessionKey;

    it('should create session', async () => {
        const session = await SessionManager.createSession('Integration Test Transaction');
        sessionKey = session.session_key;

        expect(sessionKey).to.match(/^\d{4}-\d{2}-\d{2}-\d+$/);
    });

    it('should save specialist reports', async () => {
        const reports = [
            { key: 'T1-medicare', content: '# Medicare Report\n\nContent...' },
            { key: 'T2-fraud', content: '# Fraud Report\n\nContent...' }
        ];

        for (const { key, content } of reports) {
            await StorageManager.saveReport(sessionKey, 'specialist', key, content);
        }

        const session = await SessionManager.getSession(sessionKey);
        expect(parseInt(session.report_count)).to.be.at.least(2);
    });

    it('should track QA issues', async () => {
        await QAIssueTracker.createIssue(sessionKey, {
            issue_id: 'W1-001',
            severity: 'CRITICAL',
            dimension: 2,
            dimension_name: 'CREAC Structure',
            title: 'Missing CREAC headers',
            pre_score: 3.0
        });

        const issues = await QAIssueTracker.getSessionIssues(sessionKey);
        expect(issues).to.have.length(1);
        expect(issues[0].severity).to.equal('CRITICAL');
    });

    it('should verify issue resolution', async () => {
        await QAIssueTracker.verify(sessionKey, 'W1-001', 10.0);

        const rates = await QAIssueTracker.calculateResolutionRate(sessionKey);
        expect(parseFloat(rates.resolution_rate)).to.equal(100);
    });

    it('should update session to certified', async () => {
        await SessionManager.updateSessionStatus(sessionKey, 'certified', {
            initial_score: 86.7,
            final_score: 97.4,
            quality_tier: 'TIER_3_GOLD_STANDARD'
        });

        const session = await SessionManager.getSession(sessionKey);
        expect(session.status).to.equal('certified');
        expect(parseFloat(session.final_score)).to.equal(97.4);
    });
});
```

### 9.3 Performance Benchmark

```javascript
// tests/performance/benchmark.js
const { performance } = require('perf_hooks');

async function benchmark() {
    console.log('Running performance benchmarks...\n');

    // 1. Session creation
    let start = performance.now();
    for (let i = 0; i < 100; i++) {
        await SessionManager.createSession(`Benchmark ${i}`);
    }
    console.log(`Session creation (100x): ${(performance.now() - start).toFixed(2)}ms`);

    // 2. Report insertion
    start = performance.now();
    const content = 'x'.repeat(50000); // ~50KB
    for (let i = 0; i < 100; i++) {
        await StorageManager.saveReport(testSessionKey, 'section', `bench-${i}`, content);
    }
    console.log(`Report insertion (100x 50KB): ${(performance.now() - start).toFixed(2)}ms`);

    // 3. Full-text search
    start = performance.now();
    for (let i = 0; i < 100; i++) {
        await ReportRepository.search('healthcare compliance');
    }
    console.log(`Full-text search (100x): ${(performance.now() - start).toFixed(2)}ms`);

    // 4. Session listing with aggregates
    start = performance.now();
    for (let i = 0; i < 100; i++) {
        await SessionManager.listSessions({ status: 'certified', limit: 20 });
    }
    console.log(`Session listing (100x): ${(performance.now() - start).toFixed(2)}ms`);

    // Targets
    console.log('\n=== Performance Targets ===');
    console.log('Session creation: < 50ms');
    console.log('Report insertion: < 100ms');
    console.log('Full-text search: < 200ms');
    console.log('Session listing: < 50ms');
}
```

---

## 10. Rollback Procedures

### 10.1 Phase 1 Rollback (Dual-Write)

```bash
#!/bin/bash
# scripts/rollback-phase1.sh

echo "Rolling back to file-only storage..."

# 1. Update environment
export STORAGE_MODE=file_only

# 2. Restart application
pm2 restart super-legal-mcp

# 3. Verify
curl http://localhost:3000/health

echo "Rollback complete. Database writes disabled."
```

### 10.2 Phase 2 Rollback (Read Abstraction)

```bash
#!/bin/bash
# scripts/rollback-phase2.sh

echo "Rolling back to dual-write mode..."

# 1. Update environment
export STORAGE_MODE=dual_write
export ENABLE_FILE_FALLBACK=true

# 2. Restart application
pm2 restart super-legal-mcp

# 3. Verify file system is primary
curl http://localhost:3000/storage/status

echo "Rollback complete. File system is now primary read source."
```

### 10.3 Full Database Rollback

```sql
-- scripts/rollback-full.sql

-- WARNING: This will DELETE all database records
-- Only use if files are confirmed intact

BEGIN;

-- Truncate in dependency order
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE cross_references CASCADE;
TRUNCATE TABLE risk_findings CASCADE;
TRUNCATE TABLE qa_issues CASCADE;
TRUNCATE TABLE agent_states CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE sessions CASCADE;

-- Reset sequences
ALTER SEQUENCE audit_log_id_seq RESTART WITH 1;

COMMIT;

-- Verify
SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
UNION ALL SELECT 'reports', COUNT(*) FROM reports
UNION ALL SELECT 'agent_states', COUNT(*) FROM agent_states;
```

### 10.4 Rollback Verification Checklist

```markdown
## Rollback Verification Checklist

### Pre-Rollback
- [ ] Confirm file system has all data (run validate-migration.js)
- [ ] Notify team of rollback window
- [ ] Take database backup: `pg_dump > backup-$(date +%Y%m%d).sql`

### During Rollback
- [ ] Update STORAGE_MODE environment variable
- [ ] Restart application servers
- [ ] Monitor error logs for 5 minutes

### Post-Rollback
- [ ] Verify new sessions create files
- [ ] Verify existing sessions readable
- [ ] Run smoke test on QA workflow
- [ ] Confirm grep-based searches work
- [ ] Check agent state recovery

### Sign-Off
- [ ] Engineering lead approval
- [ ] QA verification complete
- [ ] Incident report filed (if applicable)
```

---

## 11. Performance Considerations

### 11.1 Index Strategy

| Table | Index | Purpose | Expected Improvement |
|-------|-------|---------|---------------------|
| `reports` | `idx_reports_content_fts` | Full-text search | 100x vs grep |
| `reports` | `idx_reports_session` | Session lookup | B-tree O(log n) |
| `qa_issues` | `idx_qa_session_status` | Issue filtering | 10x vs file scan |
| `risk_findings` | `idx_risks_exposure` | Top findings sort | Pre-sorted |
| `sessions` | `idx_sessions_created` | Recent sessions | Time-based filter |

### 11.2 Connection Pooling

```javascript
// Recommended pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                    // Maximum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Fail fast on connection issues
    maxUses: 7500               // Recycle connections
});
```

### 11.3 Query Optimization

```sql
-- Use EXPLAIN ANALYZE to identify slow queries
EXPLAIN ANALYZE
SELECT r.*, s.session_key
FROM reports r
JOIN sessions s ON r.session_id = s.id
WHERE r.report_type = 'section'
AND r.is_current = TRUE
ORDER BY r.created_at DESC
LIMIT 20;

-- Expected output should show Index Scan, not Seq Scan
```

### 11.4 Materialized View Refresh Schedule

```sql
-- Refresh session_summary every 5 minutes
SELECT cron.schedule('refresh-session-summary', '*/5 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY session_summary
$$);

-- Refresh risk_aggregation every hour
SELECT cron.schedule('refresh-risk-agg', '0 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY risk_aggregation
$$);
```

---

## 12. Security & Compliance

### 12.1 Access Control

```sql
-- Create application role with limited permissions
CREATE ROLE super_legal_app LOGIN PASSWORD 'secure_password_here';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE super_legal TO super_legal_app;
GRANT USAGE ON SCHEMA public TO super_legal_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO super_legal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO super_legal_app;

-- Restrict DELETE (require elevated role)
REVOKE DELETE ON sessions, reports FROM super_legal_app;

-- Create admin role for deletions
CREATE ROLE super_legal_admin LOGIN PASSWORD 'admin_password_here';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO super_legal_admin;
```

### 12.2 Data Encryption

```sql
-- Enable pgcrypto for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt client matter IDs
UPDATE sessions SET
    client_matter_id = pgp_sym_encrypt(
        client_matter_id::text,
        current_setting('app.encryption_key')
    )::text
WHERE client_matter_id IS NOT NULL;
```

### 12.3 Audit Compliance

The `audit_log` table captures:
- All INSERT/UPDATE/DELETE operations
- Old and new values (for UPDATE)
- Timestamp and user context
- Cascade-preserved for referential integrity

```sql
-- Query audit trail for a specific session
SELECT
    al.created_at,
    al.table_name,
    al.action,
    al.changed_fields,
    al.user_id
FROM audit_log al
WHERE al.session_id = (SELECT id FROM sessions WHERE session_key = '2026-01-26-1737849600')
ORDER BY al.created_at DESC;
```

### 12.4 Data Retention Policy

```sql
-- Archive old sessions (> 2 years)
INSERT INTO archived_sessions
SELECT * FROM sessions WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '2 years';

-- Purge audit logs (> 7 years for legal compliance)
DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '7 years';
```

---

## 13. Implementation Timeline

### 13.1 Gantt Chart

```
Week 1-2: Schema & Infrastructure
├── Day 1-2:   Create database schema (tables, indexes, triggers)
├── Day 3-4:   Implement StorageManager with dual-write
├── Day 5-7:   Implement repository classes
├── Day 8-10:  Write unit tests
└── Day 11-14: Deploy to staging, run integration tests

Week 3-4: Phase 1 - Dual Write
├── Day 15-17: Deploy dual-write to production
├── Day 18-21: Monitor for validation failures
├── Day 22-24: Fix any discrepancies
└── Day 25-28: Run historical migration script

Week 5-6: Phase 2 - Read Abstraction
├── Day 29-31: Switch reads to database-first
├── Day 32-35: Monitor query performance
├── Day 36-38: Optimize slow queries
└── Day 39-42: Validate all workflows

Week 7-8: Phase 3 - Database Primary
├── Day 43-45: Disable file writes (db_only mode)
├── Day 46-49: Final validation and load testing
├── Day 50-52: Archive file system to cold storage
└── Day 53-56: Documentation and training
```

### 13.2 Milestone Checklist

```markdown
## Migration Milestones

### M1: Schema Ready (End of Week 1)
- [ ] All tables created in production database
- [ ] Indexes and triggers deployed
- [ ] Connection pooling configured
- [ ] Unit tests passing

### M2: Dual-Write Operational (End of Week 2)
- [ ] StorageManager deployed
- [ ] All file writes also persist to database
- [ ] Validation logging enabled
- [ ] Zero validation failures for 48 hours

### M3: Historical Migration Complete (End of Week 4)
- [ ] All 43+ sessions migrated
- [ ] Validation script shows 100% match
- [ ] Performance benchmarks met
- [ ] Rollback procedure tested

### M4: Database Primary (End of Week 6)
- [ ] Reads served from database
- [ ] File fallback working
- [ ] Query response times < 100ms
- [ ] All integration tests passing

### M5: Migration Complete (End of Week 8)
- [ ] File writes disabled
- [ ] Files archived to cold storage
- [ ] Documentation updated
- [ ] Team trained on new architecture
```

---

## 14. Appendices

### 14.1 Environment Variables

```bash
# .env additions for database migration

# Storage Configuration
STORAGE_MODE=dual_write          # file_only, dual_write, db_primary, db_only
ENABLE_FILE_FALLBACK=true        # Allow file reads when DB unavailable
VALIDATE_DUAL_WRITES=true        # Log validation failures in dual_write mode
REPORTS_PATH=./reports           # Base path for file storage

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/super_legal
PG_POOL_MAX=20                   # Maximum connections
PG_POOL_IDLE_TIMEOUT=30000       # Idle connection timeout (ms)

# Security
DB_ENCRYPTION_KEY=your-32-char-key-here  # For sensitive field encryption

# Monitoring
ENABLE_QUERY_LOGGING=false       # Log all SQL queries (dev only)
SLOW_QUERY_THRESHOLD=500         # Log queries slower than 500ms
```

### 14.2 SQL Quick Reference

```sql
-- Common queries for operations team

-- 1. Session status overview
SELECT status, COUNT(*),
       ROUND(AVG(final_score), 1) as avg_score
FROM sessions
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 2. Recent sessions with issues
SELECT s.session_key, s.final_score, COUNT(q.id) as issue_count
FROM sessions s
LEFT JOIN qa_issues q ON s.id = q.session_id AND q.status != 'verified'
WHERE s.created_at > NOW() - INTERVAL '7 days'
GROUP BY s.id
HAVING COUNT(q.id) > 0
ORDER BY s.created_at DESC;

-- 3. Top risk exposures across all sessions
SELECT rf.finding_name, rf.severity,
       SUM(rf.weighted_impact) as total_exposure,
       COUNT(DISTINCT rf.session_id) as session_count
FROM risk_findings rf
GROUP BY rf.finding_name, rf.severity
ORDER BY total_exposure DESC
LIMIT 10;

-- 4. Agent progress for active sessions
SELECT s.session_key, a.agent_type, a.progress_percentage, a.updated_at
FROM agent_states a
JOIN sessions s ON a.session_id = s.id
WHERE s.status = 'in_progress'
ORDER BY a.updated_at DESC;

-- 5. Full-text search for specific content
SELECT s.session_key, r.report_key,
       ts_headline('english', r.content, plainto_tsquery('STARK violation')) as snippet
FROM reports r
JOIN sessions s ON r.session_id = s.id
WHERE to_tsvector('english', r.content) @@ plainto_tsquery('STARK violation')
LIMIT 10;
```

### 14.3 Monitoring Queries

```sql
-- Database health dashboard queries

-- Connection pool status
SELECT count(*) as active_connections,
       max_conn as max_connections,
       count(*) * 100.0 / max_conn as utilization_pct
FROM pg_stat_activity,
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') m
WHERE datname = 'super_legal'
GROUP BY max_conn;

-- Table sizes
SELECT
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as data_size,
    pg_size_pretty(pg_indexes_size(relid)) as index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Slow queries (requires pg_stat_statements)
SELECT
    calls,
    round(total_exec_time::numeric, 2) as total_ms,
    round(mean_exec_time::numeric, 2) as avg_ms,
    query
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'super_legal')
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index usage
SELECT
    schemaname, relname as table_name, indexrelname as index_name,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 14.4 Troubleshooting Guide

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| Validation failures in dual-write | Content encoding mismatch | Check UTF-8 handling in file writes |
| Slow report insertions | Missing index on session_key | Run `CREATE INDEX CONCURRENTLY` |
| Connection pool exhausted | Long-running queries | Enable statement timeout, check for locks |
| Full-text search returns nothing | Index not built | Run `REINDEX INDEX idx_reports_content_fts` |
| Agent state not found | Wrong agent_type classification | Check state file naming convention |
| Audit log growing too fast | High update frequency | Consider batching state updates |
| Migration script hangs | Large file parsing | Increase Node.js heap: `--max-old-space-size=4096` |

---

---

## 15. SDK Hooks & Subagent Integration

This section documents the critical integration points between the database migration and the existing `sdkHooks.js` and `legalSubagents.js` configurations.

### 15.1 Current sdkHooks.js Integration Points

The `src/hooks/sdkHooks.js` file contains several file-based operations that must transition to database:

| Current Pattern | File Location | Database Equivalent |
|-----------------|---------------|---------------------|
| `sessionSaveLog` Map | In-memory | `audit_log` table |
| `appendAuditLog()` | `reports/{session}/session-audit.log` | `audit_log` table |
| State file reads | `reports/{session}/*-state.json` | `agent_states` table |
| Report save tracking | `reports/{session}/**/*.md` | `reports` table |

**Modified sdkHooks.js Functions:**

```javascript
// src/hooks/sdkHooks.js - Database-integrated version

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Database-backed audit log (replaces file-based appendAuditLog)
 */
async function appendAuditLogDB(sessionId, entry) {
    if (!sessionId) return;

    try {
        await pool.query(`
            INSERT INTO audit_log (table_name, record_id, session_id, action, new_data, user_id)
            SELECT 'hook_event', gen_random_uuid(), s.id, $2, $3, $4
            FROM sessions s WHERE s.session_key = $1
        `, [sessionId, entry.event, JSON.stringify(entry), entry.agent_id || 'system']);
    } catch (err) {
        // Fallback to file if DB unavailable (Phase 1-2)
        appendAuditLog(sessionId, entry);
    }
}

/**
 * Enhanced postToolUseHandler with database tracking
 */
export async function postToolUseHandler(input, toolUseID, { signal }) {
    const { tool_name, tool_input, tool_response, session_id } = input;

    // ... existing logic ...

    // Database-backed report tracking (replaces sessionSaveLog Map)
    if (tool_name === 'Write' && tool_input?.file_path?.includes('/reports/')) {
        const sessionKey = extractSessionKey(tool_input.file_path);
        const reportType = extractReportType(tool_input.file_path);
        const reportKey = extractReportKey(tool_input.file_path);

        // Phase 1: Dual-write to database
        if (process.env.STORAGE_MODE !== 'file_only') {
            await pool.query(`
                INSERT INTO reports (session_id, report_type, report_key, content, word_count)
                SELECT s.id, $2, $3, $4, $5
                FROM sessions s WHERE s.session_key = $1
                ON CONFLICT (session_id, report_type, report_key, version)
                DO UPDATE SET content = $4, word_count = $5, updated_at = NOW()
            `, [sessionKey, reportType, reportKey, tool_input.content,
                tool_input.content?.split(/\s+/).length || 0]);
        }
    }

    // Database-backed audit log
    await appendAuditLogDB(session_id, entry);

    return { continue: true };
}

/**
 * Enhanced sessionStartHandler with database state recovery
 */
export async function sessionStartHandler(input, toolUseID, { signal }) {
    const { session_id, source } = input;

    // STATE FILE VERIFICATION ON RESUME/COMPACT - Database-first approach
    if (source === 'resume' || source === 'compact') {
        try {
            // Try database first for faster state recovery
            const dbState = await pool.query(`
                SELECT a.state_data, a.compaction_summary, a.phases_complete,
                       s.status, s.final_score
                FROM agent_states a
                JOIN sessions s ON a.session_id = s.id
                WHERE s.session_key = $1
                ORDER BY a.updated_at DESC
                LIMIT 1
            `, [session_id]);

            if (dbState.rows.length > 0) {
                const state = dbState.rows[0];
                if (state.state_data?.blocking_issue?.resolution_status === 'UNRESOLVED') {
                    return {
                        continue: true,
                        additionalContext: buildBlockingWarning('database', state.state_data.blocking_issue)
                    };
                }
            }

            // Fallback to file-based state if not in database
            // ... existing file-based logic ...

        } catch (err) {
            // Database unavailable - fall back to file
            console.warn(`[SessionStart] Database state check failed: ${err.message}`);
        }
    }

    return { continue: true };
}

// Helper functions
function extractSessionKey(filePath) {
    const match = filePath.match(/reports\/(\d{4}-\d{2}-\d{2}-\d+)/);
    return match ? match[1] : null;
}

function extractReportType(filePath) {
    if (filePath.includes('/specialist-reports/')) return 'specialist';
    if (filePath.includes('/section-reports/')) return 'section';
    if (filePath.includes('/review-outputs/')) return 'review';
    if (filePath.includes('/qa-outputs/')) return 'qa';
    if (filePath.includes('/remediation-outputs/')) return 'remediation';
    if (filePath.includes('final-memorandum')) return 'final';
    if (filePath.includes('executive-summary')) return 'synthesis';
    return 'other';
}

function extractReportKey(filePath) {
    const filename = filePath.split('/').pop();
    return filename.replace(/\.md$|\.json$/, '');
}
```

### 15.2 State File Schema Preservation

The `prompts/memorandum-synthesis/state-file-schemas.md` defines mandatory fields that must be preserved in JSONB:

**Critical State File Fields (MUST preserve in `agent_states.state_data`):**

```sql
-- Verify schema preservation with JSON path queries
SELECT
    state_key,
    state_data->'compaction_summary' IS NOT NULL as has_compaction_summary,
    state_data->'recovery_instructions' IS NOT NULL as has_recovery_instructions,
    state_data->'phases_complete' IS NOT NULL as has_phases_complete,
    state_data->'environment_checks'->'environment_healthy' as env_healthy,
    state_data->'blocking_issue'->'resolution_status' as blocking_status
FROM agent_states
WHERE session_id = (SELECT id FROM sessions WHERE session_key = '2026-01-26-1737849600');
```

**State File Type Mapping:**

| Agent Type | State File | Location in Current System | Database `state_key` |
|------------|-----------|---------------------------|---------------------|
| research-review-analyst | research-review-state.json | `{session}/` | `research-review-state` |
| fact-validator | fact-validator-state.json | `{session}/review-outputs/` | `review-outputs/fact-validator-state` |
| coverage-gap-analyzer | coverage-gap-analyzer-state.json | `{session}/review-outputs/` | `review-outputs/coverage-gap-analyzer-state` |
| risk-aggregator | risk-aggregator-state.json | `{session}/review-outputs/` | `review-outputs/risk-aggregator-state` |
| memo-section-writer | section-writer-state-IV-{X}.json | `{session}/` | `section-writer-state-IV-{X}` |
| memo-executive-summary-writer | executive-summary-state.json | `{session}/` | `executive-summary-state` |
| citation-validator | citation-validator-state.json | `{session}/` | `citation-validator-state` |
| (assembly) | assembly-state.json | `{session}/` | `assembly-state` |
| memo-final-synthesis | synthesis-state.json | `{session}/` | `synthesis-state` |
| memo-qa-diagnostic | qa-diagnostic-state.json | `{session}/` | `qa-diagnostic-state` |
| orchestrator | orchestrator-state.md | `{session}/` | `orchestrator-state` |
| qa-remediation | remediation-wave-state.json | `{session}/qa-outputs/` | `qa-outputs/remediation-wave-state` |

### 15.3 legalSubagents.js Report Path Mapping

The `REPORTS_DIR` constant in `legalSubagents.js` uses this structure:

```javascript
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
// Session format: ${REPORTS_DIR}/[YYYY-MM-DD]-[unix-timestamp]/
```

**Database `report_type` and `report_key` Derivation:**

| File Path Pattern | `report_type` | `report_key` Example |
|-------------------|---------------|----------------------|
| `{session}/research-plan.md` | `synthesis` | `research-plan` |
| `{session}/specialist-reports/{topic}-report.md` | `specialist` | `medicare-compliance-report` |
| `{session}/section-reports/section-IV-{X}-{slug}.md` | `section` | `section-IV-A-federal-healthcare` |
| `{session}/review-outputs/{name}.md` | `review` | `fact-registry` |
| `{session}/qa-outputs/{name}.md` | `qa` | `diagnostic-assessment` |
| `{session}/remediation-outputs/{name}.md` | `remediation` | `W1-001-VALIDATE` |
| `{session}/final-memorandum.md` | `final` | `final-memorandum` |
| `{session}/executive-summary.md` | `synthesis` | `executive-summary` |

### 15.4 Compaction Recovery Database Query

When context compaction occurs, the `preCompactHandler` in sdkHooks.js must inject recovery context. Database-backed version:

```javascript
/**
 * Database-backed preCompactHandler for faster recovery context injection
 */
export async function preCompactHandler(input, toolUseID, { signal }) {
    const { session_id, trigger } = input;

    let recoveryContext = null;

    try {
        // Fetch all active state files from database
        const states = await pool.query(`
            SELECT
                a.state_key,
                a.compaction_summary,
                a.phases_complete,
                a.state_data->'recovery_instructions'->'do_not_repeat' as do_not_repeat,
                a.progress_percentage
            FROM agent_states a
            JOIN sessions s ON a.session_id = s.id
            WHERE s.session_key = $1
            AND a.state_data->>'status' IN ('in_progress', 'initialized')
            ORDER BY a.updated_at DESC
            LIMIT 3
        `, [session_id]);

        if (states.rows.length > 0) {
            recoveryContext = buildRecoveryContextFromDB(states.rows);
        }
    } catch (err) {
        // Fallback to file-based approach
        console.warn(`[PreCompact] Database query failed: ${err.message}`);
    }

    if (recoveryContext) {
        return { continue: true, additionalContext: recoveryContext };
    }
    return { continue: true };
}

function buildRecoveryContextFromDB(stateRows) {
    const lines = [
        '## COMPACTION RECOVERY CONTEXT (Database-Backed)',
        '',
        'The following state was preserved before compaction:',
        ''
    ];

    for (const row of stateRows) {
        lines.push(`### ${row.state_key}`);
        if (row.compaction_summary) {
            lines.push(`- **Task**: ${row.compaction_summary.task || 'Unknown'}`);
            lines.push(`- **Progress**: ${row.compaction_summary.progress || row.progress_percentage + '%'}`);
            lines.push(`- **Next Action**: ${row.compaction_summary.next_action || 'Read state'}`);
        }
        if (row.do_not_repeat?.length > 0) {
            lines.push(`- **DO NOT REPEAT**: ${row.do_not_repeat.join(', ')}`);
        }
        lines.push('');
    }

    lines.push('**CRITICAL**: Query database for full state before continuing work.');
    return lines.join('\n');
}
```

### 15.5 QA Diagnostic State Integration

The `qa-diagnostic-state.json` has complex nested structures that must be fully preserved:

```sql
-- QA diagnostic state extraction queries
-- For qa_issues table population from state_data

INSERT INTO qa_issues (session_id, issue_id, severity, dimension, dimension_name,
                       title, description, pre_score, status)
SELECT
    s.id,
    issue->>'issue_id',
    issue->>'severity',
    (issue->>'dimension')::int,
    issue->>'dimension_name',
    issue->>'title',
    issue->>'description',
    (issue->>'pre_score')::decimal,
    'identified'
FROM sessions s
JOIN agent_states a ON s.id = a.session_id
CROSS JOIN LATERAL jsonb_array_elements(a.state_data->'issues_found') as issue
WHERE a.state_key = 'qa-diagnostic-state'
AND s.session_key = $1;

-- Remediation wave state tracking
INSERT INTO qa_issues (session_id, issue_id, severity, status, remediation_wave)
SELECT
    s.id,
    task_key,
    task_value->>'priority',
    task_value->>'status',
    SUBSTRING(task_key FROM 'W(\d+)')
FROM sessions s
JOIN agent_states a ON s.id = a.session_id
CROSS JOIN LATERAL jsonb_each(a.state_data->'task_registry') as t(task_key, task_value)
WHERE a.state_key = 'qa-outputs/remediation-wave-state'
AND s.session_key = $1;
```

### 15.6 Script Execution Tracking Integration

The `script_execution_tracking` object in `qa-diagnostic-state.json` must be queryable:

```sql
-- Check script execution status before re-running
SELECT
    state_data->'script_execution_tracking'->$2->>'status' as script_status,
    state_data->'script_execution_tracking'->$2->>'executed' as executed,
    state_data->'script_execution_tracking'->$2->>'exit_code' as exit_code,
    state_data->'script_execution_tracking'->$2->>'iteration_count' as iterations
FROM agent_states a
JOIN sessions s ON a.session_id = s.id
WHERE s.session_key = $1
AND a.state_key = 'qa-diagnostic-state';

-- Example: Check if apply-creac-headers.py was already executed
-- $2 = 'apply_creac_headers'
```

### 15.7 Permission Handler Database Integration

The `permissionRequestHandler` auto-approves writes to `/reports/`. Database version adds logging:

```javascript
export async function permissionRequestHandler(input, toolUseID, { signal }) {
    const { tool_name, tool_input, session_id, hook_event_name } = input;

    // Auto-allow writes to session's reports directory
    if (tool_name === 'Write' && tool_input?.file_path?.includes('/reports/')) {
        // Log to database for audit trail
        try {
            await pool.query(`
                INSERT INTO audit_log (table_name, record_id, session_id, action, new_data, user_id)
                SELECT 'permission', gen_random_uuid(), s.id, 'auto_allow', $2, 'system'
                FROM sessions s WHERE s.session_key = $1
            `, [session_id, JSON.stringify({
                tool: tool_name,
                file_path: tool_input.file_path,
                reason: 'Trusted reports directory'
            })]);
        } catch (err) {
            // Non-fatal
        }

        return {
            hookSpecificOutput: {
                hookEventName: hook_event_name,
                permissionDecision: 'allow',
                permissionDecisionReason: 'Auto-approved: writes to reports/ directory'
            }
        };
    }

    // ... rest of handler
}
```

### 15.8 Progressive Save Strategy (64K/25K Limit Mitigation)

The `legalSubagents.js` prompts enforce a **progressive save strategy** to mitigate:
- **64K output token limit**: Agents cannot output >64K tokens in a single response
- **25K Read tool limit**: Read tool cannot handle files >25K lines in a single call

**Database Integration for Progressive Saves:**

```javascript
/**
 * Track incremental writes for large reports (>100KB)
 * Enables recovery without re-reading massive files
 */
async function trackProgressiveSave(sessionKey, reportKey, appendedContent, totalLines) {
    await pool.query(`
        INSERT INTO progressive_writes (session_id, report_key, chunk_number, content_chunk, lines_written)
        SELECT s.id, $2,
               COALESCE((SELECT MAX(chunk_number) + 1 FROM progressive_writes pw
                         JOIN sessions s2 ON pw.session_id = s2.id
                         WHERE s2.session_key = $1 AND pw.report_key = $2), 1),
               $3, $4
        FROM sessions s WHERE s.session_key = $1
    `, [sessionKey, reportKey, appendedContent, totalLines]);
}

// Called by postToolUseHandler when Bash 'cat >>' is used for large files
```

**New Table for Progressive Writes:**

```sql
CREATE TABLE progressive_writes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    report_key VARCHAR(100) NOT NULL,
    chunk_number INTEGER NOT NULL,
    content_chunk TEXT,
    lines_written INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_progressive_chunk UNIQUE (session_id, report_key, chunk_number)
);

CREATE INDEX idx_progressive_session_report ON progressive_writes(session_id, report_key);
```

### 15.9 Large File Handling Protocol

Files exceeding 100KB must use `Bash cat >>` instead of Read/Edit tools. The database must handle this:

```javascript
/**
 * Large file detection in preToolUseHandler
 * Files >100KB bypass Read/Edit and use Bash streaming
 */
const LARGE_FILE_THRESHOLD = 100 * 1024; // 100KB

export async function preToolUseHandler(input, toolUseID, { signal }) {
    const { tool_name, tool_input, session_id } = input;

    // Intercept Read/Edit attempts on large files
    if (['Read', 'Edit'].includes(tool_name) && tool_input?.file_path?.includes('/reports/')) {
        try {
            const stats = await stat(tool_input.file_path);
            if (stats.size > LARGE_FILE_THRESHOLD) {
                // Log to database for audit
                await pool.query(`
                    INSERT INTO audit_log (table_name, record_id, session_id, action, new_data)
                    SELECT 'large_file_intercept', gen_random_uuid(), s.id, 'tool_redirect', $2
                    FROM sessions s WHERE s.session_key = $1
                `, [session_id, JSON.stringify({
                    attempted_tool: tool_name,
                    file_path: tool_input.file_path,
                    file_size: stats.size,
                    redirect_to: 'Bash'
                })]);

                return {
                    continue: true,
                    additionalContext: `⚠️ LARGE FILE (${(stats.size/1024).toFixed(0)}KB): Use Bash 'cat >>' for appending or 'head -n X' for reading portions.`
                };
            }
        } catch (err) {
            // File doesn't exist yet - allow tool to proceed
        }
    }
    return { continue: true };
}
```

### 15.10 Write-Before-Return Protocol Enforcement

**MANDATORY**: All agents must write state files before returning control to orchestrator.

```sql
-- Verify write-before-return compliance
-- If agent_states.updated_at is stale relative to orchestrator resumption, flag violation

CREATE VIEW state_write_compliance AS
SELECT
    s.session_key,
    a.state_key,
    a.updated_at as last_state_write,
    r.created_at as report_created,
    CASE
        WHEN a.updated_at > r.created_at - INTERVAL '30 seconds' THEN 'COMPLIANT'
        ELSE 'POTENTIAL_VIOLATION'
    END as compliance_status
FROM sessions s
JOIN agent_states a ON s.id = a.session_id
JOIN reports r ON s.id = r.session_id
    AND r.report_type = 'synthesis'
    AND r.report_key = 'orchestrator-state'
WHERE a.state_data->>'status' = 'complete';
```

### 15.11 Universal 5-Step Recovery Protocol Database Support

The `state-file-schemas.md` defines a **Universal 5-Step Recovery Protocol** that must be database-queryable:

```sql
-- Database query implementing the 5-step recovery protocol
WITH recovery_context AS (
    SELECT
        a.state_key,
        a.state_data->>'status' as agent_status,
        a.compaction_summary,
        a.phases_complete,
        a.state_data->'recovery_instructions'->'do_not_repeat' as do_not_repeat,
        a.state_data->'environment_checks'->'environment_healthy' as env_healthy,
        a.state_data->'blocking_issue' as blocking_issue,
        ROW_NUMBER() OVER (PARTITION BY a.agent_type ORDER BY a.updated_at DESC) as rn
    FROM agent_states a
    JOIN sessions s ON a.session_id = s.id
    WHERE s.session_key = $1
    AND a.state_data->>'status' IN ('in_progress', 'initialized', 'blocked')
)
SELECT
    state_key,
    -- Step 1: Check environment
    CASE WHEN env_healthy::boolean THEN 'PASS' ELSE 'FAIL' END as step_1_environment,
    -- Step 2: Check blocking issues
    CASE WHEN blocking_issue->>'resolution_status' = 'UNRESOLVED' THEN 'BLOCKED' ELSE 'CLEAR' END as step_2_blocking,
    -- Step 3: Get compaction summary
    compaction_summary->'next_action' as step_3_next_action,
    -- Step 4: Check phases completed
    phases_complete as step_4_phases,
    -- Step 5: Get do-not-repeat list
    do_not_repeat as step_5_do_not_repeat
FROM recovery_context
WHERE rn = 1;
```

### 15.12 All 41 Agent Types Reference

The `legalSubagents.js` defines **41 agent types**. Only 10 maintain state files, but all should be tracked:

| Agent Category | Count | State File? | Database Tracking |
|----------------|-------|-------------|-------------------|
| Research specialists (T1-T9) | 9 | ❌ | Reports table only |
| Section writers (IV.A-IV.L) | 12 | ✅ | agent_states + reports |
| Review analysts | 4 | ✅ | agent_states |
| Synthesis/Assembly | 3 | ✅ | agent_states |
| QA diagnostic/remediation | 5 | ✅ | agent_states + qa_issues |
| Orchestrator | 1 | ✅ | agent_states (orchestrator-state) |
| Utility agents | 7 | ❌ | audit_log only |
| **TOTAL** | **41** | **10** | All tracked via audit_log |

```sql
-- Track all agent invocations (not just state-maintaining ones)
INSERT INTO audit_log (table_name, record_id, session_id, action, new_data, user_id)
SELECT 'agent_invocation', gen_random_uuid(), s.id, 'invoke', $2, $3
FROM sessions s WHERE s.session_key = $1;

-- $2 = JSON with agent_type, invocation_timestamp, parent_agent
-- $3 = agent_id (e.g., 'memo-section-writer-IV-A')
```

---

## 16. Alignment Verification Checklist

Before deploying database migration, verify these alignment points:

### 16.1 State File Schema Compatibility

- [ ] All 11 state file types have corresponding `agent_states` records
- [ ] `compaction_summary` JSONB structure preserved exactly
- [ ] `recovery_instructions.do_not_repeat` arrays queryable
- [ ] `phases_complete` boolean maps intact
- [ ] `blocking_issue` structure preserved for hook detection
- [ ] `environment_checks.environment_healthy` accessible via JSON path

### 16.2 sdkHooks.js Integration

- [ ] `appendAuditLog()` writes to both file and database (Phase 1-2)
- [ ] `sessionSaveLog` Map replaced with database queries (Phase 3)
- [ ] `sessionStartHandler` checks database for state on resume
- [ ] `preCompactHandler` injects recovery context from database
- [ ] `postToolUseHandler` tracks report saves to database
- [ ] `permissionRequestHandler` logs auto-approvals to database

### 16.3 legalSubagents.js Compatibility

- [ ] `REPORTS_DIR` path patterns map to `report_type` + `report_key`
- [ ] Session key format `YYYY-MM-DD-{unix}` matches `sessions.session_key`
- [ ] Specialist report paths → `specialist` type
- [ ] Section report paths → `section` type with `IV-{X}` key
- [ ] Review output paths → `review` type
- [ ] QA output paths → `qa` type
- [ ] Remediation output paths → `remediation` type

### 16.4 QA Workflow Compatibility

- [ ] `qa-diagnostic-state.json` fully preserved in JSONB
- [ ] `remediation-wave-state.json` tracks wave status
- [ ] `script_execution_tracking` queryable for compaction recovery
- [ ] `dimensions_scored` progress resumable from database
- [ ] `issues_found` extractable to `qa_issues` table
- [ ] `scoring_breakdown` preserved for audit

### 16.5 Recovery Protocol Database Support

- [ ] State files readable from database on agent resume
- [ ] `do_not_repeat` lists queryable to prevent duplicate work
- [ ] `compaction_summary.next_action` available for immediate guidance
- [ ] Wave 6 prerequisite checks work against database state
- [ ] File integrity verification can use database word counts

### 16.6 Progressive Save & Large File Handling

- [ ] `progressive_writes` table created for chunked report assembly
- [ ] Large file threshold (100KB) detection in `preToolUseHandler`
- [ ] Bash `cat >>` appends tracked in database for recovery
- [ ] 64K output token limit mitigation documented
- [ ] 25K Read tool limit workarounds implemented

### 16.7 Write-Before-Return Protocol

- [ ] State file writes verified before orchestrator resume
- [ ] `state_write_compliance` view created for violation detection
- [ ] Audit trail captures all agent-to-orchestrator handoffs
- [ ] Blocked agents flagged with `blocking_issue` JSONB structure

### 16.8 All Agent Types Tracked

- [ ] All 41 agent types logged via `audit_log` on invocation
- [ ] 10 state-maintaining agents have `agent_states` records
- [ ] 31 non-state agents tracked via audit trail only
- [ ] Agent hierarchy (parent/child) preserved in metadata

### 16.9 Checkpoint Trigger Compatibility

- [ ] Section completion checkpoints trigger database writes
- [ ] Phase transitions logged with timestamps
- [ ] Partial progress (e.g., "3 of 12 sections") queryable
- [ ] Environment health checks stored before each agent start

### 16.10 Mandatory Field Validation

- [ ] `compaction_summary` required on all state writes (DB constraint)
- [ ] `recovery_instructions` required on all state writes (DB constraint)
- [ ] `phases_complete` JSONB structure validated
- [ ] `environment_checks.environment_healthy` boolean required

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Architecture Team | Initial release |
| 1.1 | 2026-01-26 | Architecture Team | Added SDK Hooks & Subagent Integration (Section 15-16) |
| 1.2 | 2026-01-26 | Architecture Team | Added progressive save, large file handling, 41-agent coverage (Sections 15.8-15.12, 16.6-16.10) |
| 1.3 | 2026-01-26 | Architecture Team | Added Claude Agent SDK best practices alignment (Section 17) |

---

## 17. Claude Agent SDK Best Practices Alignment (January 2026)

This section documents alignment with industry best practices for database integration in agentic AI workflows, based on Claude Agent SDK documentation and the LangGraph checkpointer pattern.

### 17.1 Session Management Pattern

The Claude Agent SDK session management aligns with our migration design:

```javascript
// SDK pattern - capture session ID
for await (const message of response) {
  if (message.type === 'system' && message.subtype === 'init') {
    const sessionId = message.session_id;
    // Our migration: Store to sessions.session_key
  }
}

// Our implementation mirrors this pattern
await pool.query(`
    INSERT INTO sessions (session_key, status, created_at)
    VALUES ($1, 'in_progress', NOW())
    ON CONFLICT (session_key) DO UPDATE SET updated_at = NOW()
`, [sessionId]);
```

**Alignment verified:**
- ✅ `sessions.session_key` maps to SDK `session_id`
- ✅ Session forking supported via `superseded_by` pattern in `reports` table
- ✅ Resume capability via `session_key` lookup

### 17.2 LangGraph Checkpointer Pattern Compatibility

Our schema aligns with the industry-standard LangGraph PostgresSaver pattern:

| LangGraph Field | Our Schema | Location |
|-----------------|------------|----------|
| `thread_id` | `session_key` | `sessions` table |
| `checkpoint_id` | `state_key` | `agent_states` table |
| `channel_values` | `state_data` | `agent_states.state_data` JSONB |
| `channel_versions` | `phases_complete` | `agent_states.phases_complete` JSONB |
| `metadata` | `metadata` | All tables have JSONB metadata |
| `parent_config` | `superseded_by` | `reports` table for versioning |

```sql
-- LangGraph-compatible checkpoint query pattern
SELECT
    s.session_key as thread_id,
    a.state_key as checkpoint_id,
    a.state_data as channel_values,
    a.phases_complete as channel_versions,
    a.updated_at as ts,
    a.state_data->'recovery_instructions' as pending_sends
FROM agent_states a
JOIN sessions s ON a.session_id = s.id
WHERE s.session_key = $1
ORDER BY a.updated_at DESC
LIMIT 1;
```

### 17.3 Production Agent State Store Abstraction

Following the `ProductionAgent` pattern from best practices:

```javascript
// src/db/agentStateStore.js
export class AgentStateStore {
    constructor(pool) {
        this.pool = pool;
    }

    async load(sessionKey, agentType) {
        const result = await this.pool.query(`
            SELECT state_data, compaction_summary, phases_complete
            FROM agent_states a
            JOIN sessions s ON a.session_id = s.id
            WHERE s.session_key = $1 AND a.agent_type = $2
            ORDER BY a.updated_at DESC LIMIT 1
        `, [sessionKey, agentType]);

        return result.rows[0]?.state_data || null;
    }

    async save(sessionKey, agentType, stateKey, stateData) {
        // CRITICAL: Enforce mandatory fields per state-file-schemas.md
        if (!stateData.compaction_summary || !stateData.recovery_instructions) {
            throw new Error('State must include compaction_summary and recovery_instructions');
        }

        await this.pool.query(`
            INSERT INTO agent_states (
                session_id, agent_type, state_key, state_data,
                compaction_summary, phases_complete, progress_percentage, recovery_instructions
            )
            SELECT s.id, $2, $3, $4,
                   $4->>'compaction_summary',
                   $4->'phases_complete',
                   ($4->>'progress_percentage')::decimal,
                   $4->'recovery_instructions'
            FROM sessions s WHERE s.session_key = $1
            ON CONFLICT (session_id, agent_type, state_key)
            DO UPDATE SET
                state_data = EXCLUDED.state_data,
                compaction_summary = EXCLUDED.compaction_summary,
                phases_complete = EXCLUDED.phases_complete,
                progress_percentage = EXCLUDED.progress_percentage,
                recovery_instructions = EXCLUDED.recovery_instructions,
                updated_at = NOW()
        `, [sessionKey, agentType, stateKey, JSON.stringify(stateData)]);
    }
}
```

### 17.4 Claude Code Tasks (v2.1.16+) Integration

The new Tasks primitive in Claude Code v2.1.16+ aligns with our architecture:

| Tasks Feature | Our Implementation |
|---------------|-------------------|
| Dependency graphs (DAGs) | `qa_issues.remediation_wave` ordering |
| Filesystem persistence | Database primary (Phase 3) |
| Cross-session sharing | `sessions` table + `session_key` |
| Task blocking | `agent_states.state_data.blocking_issue` |

```sql
-- Task dependency query (mirrors Claude Code Tasks DAG)
SELECT
    qi.issue_id,
    qi.severity,
    qi.remediation_wave,
    qi.status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM qa_issues blocker
            WHERE blocker.session_id = qi.session_id
            AND blocker.remediation_wave < qi.remediation_wave
            AND blocker.status NOT IN ('verified', 'wont_fix')
        ) THEN 'blocked'
        ELSE 'ready'
    END as task_status
FROM qa_issues qi
WHERE qi.session_id = (SELECT id FROM sessions WHERE session_key = $1)
ORDER BY qi.remediation_wave, qi.severity;
```

### 17.5 Context Window Management

Best practice: "Claude's context window is the most important resource to manage."

Our database migration supports aggressive context management:

```sql
-- Compaction-safe state recovery query
-- Returns minimal context needed to resume work
SELECT
    a.compaction_summary,                           -- Instant context
    a.state_data->'recovery_instructions'->'do_not_repeat' as do_not_repeat,
    a.state_data->'recovery_instructions'->'next_action' as next_action,
    a.progress_percentage
FROM agent_states a
JOIN sessions s ON a.session_id = s.id
WHERE s.session_key = $1
AND a.state_data->>'status' IN ('in_progress', 'initialized')
ORDER BY a.updated_at DESC
LIMIT 3;

-- This returns ~500 tokens vs ~50,000 tokens for full state
-- Enables /clear and /compact without losing progress
```

### 17.6 Write-Before-Return Protocol Enforcement

Database constraint to enforce write-before-return:

```sql
-- Audit trigger to detect protocol violations
CREATE OR REPLACE FUNCTION check_write_before_return()
RETURNS TRIGGER AS $$
BEGIN
    -- If a report is being created without recent state update, flag it
    IF NOT EXISTS (
        SELECT 1 FROM agent_states a
        WHERE a.session_id = NEW.session_id
        AND a.updated_at > NOW() - INTERVAL '5 minutes'
    ) THEN
        INSERT INTO audit_log (table_name, record_id, session_id, action, new_data)
        VALUES ('write_protocol_violation', NEW.id, NEW.session_id, 'warning',
                jsonb_build_object('report_key', NEW.report_key, 'created_at', NEW.created_at));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_write_before_return
    AFTER INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION check_write_before_return();
```

### 17.7 Best Practices Checklist

- [ ] Session IDs map to `sessions.session_key` (SDK alignment)
- [ ] Checkpoint pattern compatible with LangGraph PostgresSaver
- [ ] State store abstraction layer implemented
- [ ] Mandatory fields enforced (`compaction_summary`, `recovery_instructions`)
- [ ] Task dependency ordering via `remediation_wave`
- [ ] Compaction-safe recovery queries available
- [ ] Write-before-return protocol auditable
- [ ] Context window management queries optimized for token efficiency

---

## 18. Claude Cookbook Production Patterns (January 2026)

This section documents alignment with the official Anthropic Claude Cookbook patterns for memory management, context compaction, and state persistence.

### 18.1 Memory Tool Database Backend

The Claude Cookbook `memory_20250818` tool is **client-side**, meaning you control storage. Our database migration replaces the filesystem backend with PostgreSQL.

**Cookbook Pattern → Database Implementation:**

| Memory Tool Command | Filesystem (Cookbook) | PostgreSQL (Our Migration) |
|---------------------|----------------------|---------------------------|
| `view /memories` | `Path.iterdir()` | `SELECT state_key FROM agent_states WHERE session_id = $1` |
| `create /path/file.md` | `Path.write_text()` | `INSERT INTO agent_states (state_data) VALUES ($1)` |
| `str_replace` | Read-modify-write | `UPDATE agent_states SET state_data = jsonb_set(...)` |
| `delete /path` | `shutil.rmtree()` | `DELETE FROM agent_states WHERE state_key = $1` |

```javascript
// src/db/memoryToolHandler.js - Database-backed memory tool
export class DatabaseMemoryHandler {
    constructor(pool, sessionKey) {
        this.pool = pool;
        this.sessionKey = sessionKey;
    }

    async executeToolUse(toolInput) {
        const { command, path } = toolInput;

        // Validate path (prevent directory traversal attacks)
        this._validatePath(path);

        switch (command) {
            case 'view':
                return this._view(path);
            case 'create':
                return this._create(path, toolInput.file_text);
            case 'str_replace':
                return this._strReplace(path, toolInput.old_str, toolInput.new_str);
            case 'delete':
                return this._delete(path);
            default:
                throw new Error(`Unknown memory command: ${command}`);
        }
    }

    async _view(path) {
        // List directory or read file
        if (path === '/memories' || path.endsWith('/')) {
            const result = await this.pool.query(`
                SELECT DISTINCT state_key as name
                FROM agent_states a
                JOIN sessions s ON a.session_id = s.id
                WHERE s.session_key = $1
                AND state_key LIKE $2
                ORDER BY state_key
            `, [this.sessionKey, path.replace('/memories', '') + '%']);

            return result.rows.map(r => `- ${r.name}`).join('\n') || '(empty)';
        }

        // Read specific memory file
        const result = await this.pool.query(`
            SELECT state_data->>'content' as content
            FROM agent_states a
            JOIN sessions s ON a.session_id = s.id
            WHERE s.session_key = $1 AND state_key = $2
        `, [this.sessionKey, path]);

        return result.rows[0]?.content || 'File not found';
    }

    async _create(path, content) {
        // Security: Validate content before storing
        this._validateContent(content);

        await this.pool.query(`
            INSERT INTO agent_states (session_id, agent_type, state_key, state_data)
            SELECT s.id, 'memory', $2, jsonb_build_object('content', $3, 'created_at', NOW())
            FROM sessions s WHERE s.session_key = $1
            ON CONFLICT (session_id, agent_type, state_key)
            DO UPDATE SET state_data = jsonb_set(agent_states.state_data, '{content}', to_jsonb($3::text))
        `, [this.sessionKey, path, content]);

        return `File created at ${path}`;
    }

    _validatePath(path) {
        // Prevent directory traversal
        if (path.includes('..') || !path.startsWith('/memories')) {
            throw new Error(`Invalid path: ${path}`);
        }
    }

    _validateContent(content) {
        // Memory poisoning prevention (from cookbook best practices)
        const DANGEROUS_PATTERNS = [
            'ignore previous instructions',
            'system override',
            'disregard safety'
        ];

        const contentLower = content.toLowerCase();
        for (const pattern of DANGEROUS_PATTERNS) {
            if (contentLower.includes(pattern)) {
                throw new Error(`Dangerous pattern detected: ${pattern}`);
            }
        }
    }
}
```

### 18.2 Context Compaction Database Integration

The Claude Cookbook `compaction_control` parameter manages context automatically. Our database stores compaction summaries for recovery.

**Compaction Configuration Alignment:**

| Threshold Range | Use Case | Our Implementation |
|-----------------|----------|-------------------|
| 5k-20k tokens | Sequential processing (QA waves) | `qa_issues` per-wave processing |
| 50k-100k tokens | Multi-phase workflows (memo synthesis) | `agent_states.compaction_summary` |
| 100k+ tokens | Complex analysis | Full state preservation in JSONB |

```sql
-- Store compaction summary in database for recovery
CREATE OR REPLACE FUNCTION store_compaction_summary(
    p_session_key VARCHAR,
    p_agent_type VARCHAR,
    p_summary_text TEXT
) RETURNS void AS $$
BEGIN
    UPDATE agent_states a
    SET
        compaction_summary = p_summary_text,
        state_data = jsonb_set(
            state_data,
            '{last_compaction}',
            jsonb_build_object(
                'timestamp', NOW(),
                'summary_length', LENGTH(p_summary_text),
                'trigger', 'context_token_threshold'
            )
        ),
        updated_at = NOW()
    FROM sessions s
    WHERE a.session_id = s.id
    AND s.session_key = p_session_key
    AND a.agent_type = p_agent_type;
END;
$$ LANGUAGE plpgsql;
```

### 18.3 Cookbook Summary Template for Legal QA

Custom summary prompt aligned with legal due diligence workflow:

```javascript
const LEGAL_QA_SUMMARY_PROMPT = `
Summarize the QA session progress for context recovery:

## 1. Task Overview
- Matter: [transaction name]
- Current phase: [diagnostic/remediation/certification]
- Target score: 93% (certification threshold)

## 2. Current State
- Sections reviewed: [X of 12]
- Issues found: [count by severity]
- Current score: [percentage]
- Files modified: [list]

## 3. Important Discoveries
- Critical findings requiring attention
- Decisions made and rationale
- Remediation waves completed

## 4. Next Steps
- Immediate actions required
- Blocked items
- Priority ordering

## 5. Context to Preserve
- Cross-references identified
- Risk quantification data
- Draft provision language
`;
```

### 18.4 Memory Organization Pattern

Following cookbook best practices, organize memories by domain:

```
/memories/
├── patterns/
│   ├── creac_structure.md          → agent_states: 'memory/patterns/creac_structure'
│   ├── risk_quantification.md      → agent_states: 'memory/patterns/risk_quantification'
│   └── citation_format.md          → agent_states: 'memory/patterns/citation_format'
├── project_rules/
│   ├── comfortcare_guidelines.md   → agent_states: 'memory/project_rules/comfortcare'
│   └── healthcare_ma_checklist.md  → agent_states: 'memory/project_rules/healthcare_ma'
├── session_state.md                → agent_states: 'memory/session_state'
└── learned_patterns.md             → agent_states: 'memory/learned_patterns'
```

**Database Query for Memory Navigation:**

```sql
-- List memory directory structure
SELECT
    CASE
        WHEN state_key LIKE 'memory/patterns/%' THEN 'patterns/'
        WHEN state_key LIKE 'memory/project_rules/%' THEN 'project_rules/'
        ELSE ''
    END as directory,
    state_key as file_path,
    LENGTH(state_data->>'content') as size_bytes,
    updated_at
FROM agent_states a
JOIN sessions s ON a.session_id = s.id
WHERE s.session_key = $1
AND a.agent_type = 'memory'
ORDER BY state_key;
```

### 18.5 When to Use Database vs. Compaction

**Use Database Storage (Our Migration):**
- ✅ Full audit trail requirements (legal compliance)
- ✅ Cross-session pattern learning
- ✅ Multi-agent coordination
- ✅ Recovery after crashes
- ✅ Historical analytics

**Use Context Compaction:**
- ✅ Within-session context management
- ✅ Sequential entity processing (tickets, issues)
- ✅ Token budget optimization
- ✅ Real-time responsiveness

**Our Architecture Combines Both:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTEXT MANAGEMENT                          │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐│
│  │  Within-Session     │    │  Cross-Session                  ││
│  │  (Compaction)       │    │  (Database)                     ││
│  │                     │    │                                 ││
│  │  • Token threshold  │───▶│  • compaction_summary stored    ││
│  │  • Summary prompt   │    │  • Full state in JSONB          ││
│  │  • Clear tool uses  │    │  • Recovery instructions        ││
│  │                     │    │  • Audit trail                  ││
│  └─────────────────────┘    └─────────────────────────────────┘│
│                                                                 │
│  Trigger: context_token_threshold exceeded                      │
│  Action: 1) Generate summary  2) Store to database 3) Clear ctx │
└─────────────────────────────────────────────────────────────────┘
```

### 18.6 Security: Memory Poisoning Prevention

Following cookbook security guidance:

```sql
-- Add check constraint to prevent dangerous content
ALTER TABLE agent_states
ADD CONSTRAINT check_memory_content
CHECK (
    agent_type != 'memory' OR (
        NOT (LOWER(state_data->>'content') LIKE '%ignore previous instructions%')
        AND NOT (LOWER(state_data->>'content') LIKE '%system override%')
        AND NOT (LOWER(state_data->>'content') LIKE '%disregard safety%')
    )
);

-- Audit trigger for memory writes
CREATE TRIGGER audit_memory_writes
    AFTER INSERT OR UPDATE ON agent_states
    FOR EACH ROW
    WHEN (NEW.agent_type = 'memory')
    EXECUTE FUNCTION audit_memory_operation();
```

### 18.7 Cookbook Alignment Checklist

- [ ] Memory tool commands map to database operations (view, create, str_replace, delete)
- [ ] Path validation prevents directory traversal attacks
- [ ] Content validation prevents memory poisoning
- [ ] Compaction summaries stored in `agent_states.compaction_summary`
- [ ] Custom summary prompts preserve domain-specific information
- [ ] Memory organized by directory structure (patterns, project_rules, session)
- [ ] Cross-session learning enabled via persistent memory storage
- [ ] Audit trail maintained for all memory operations

---

## 19. Multi-Tenant Architecture

This section details the production multi-tenant architecture for the Super-Legal MCP platform, supporting 10-100 concurrent clients with SOC 2 Type II compliance.

### 19.1 Architecture Overview

**Design Decisions:**

| Requirement | Decision | Rationale |
|-------------|----------|-----------|
| Client Scale | 10-100 tenants | Medium scale, connection pooling critical |
| Data Isolation | Row-level isolation | Cost-effective, easy cross-tenant analytics |
| Compliance | SOC 2 Type II | Comprehensive audit logging, access controls |
| API Keys | Platform-managed | Central credential management |
| Retention | 1yr active / 3yr archive | Legal industry balance of access vs. cost |
| Rate Limiting | Concurrent session limits | Prevent resource monopolization |
| Infrastructure | Managed PostgreSQL (RDS/Cloud SQL) | Automated backups, failover, encryption |
| Audit Trail | Comprehensive | All operations logged for compliance |
| Encryption | Database-level TDE | Transparent, managed service handles |
| Onboarding | Admin dashboard | Manual tenant provisioning |

### 19.2 Tenant Schema Design

```sql
-- =============================================================================
-- TENANT MANAGEMENT TABLES
-- =============================================================================

-- Core tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_code VARCHAR(50) UNIQUE NOT NULL,  -- Short identifier (e.g., 'comfortcare')
    api_key_hash VARCHAR(64) NOT NULL,        -- SHA-256 of platform-issued API key
    anthropic_api_key_encrypted BYTEA,        -- Encrypted Anthropic key (platform-managed)

    -- Subscription & Limits
    plan_tier VARCHAR(20) DEFAULT 'standard', -- 'standard', 'professional', 'enterprise'
    max_concurrent_sessions INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    contact_email VARCHAR(255),
    settings JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    suspended_at TIMESTAMPTZ,

    CONSTRAINT valid_plan_tier CHECK (plan_tier IN ('standard', 'professional', 'enterprise'))
);

-- Tenant API keys (support multiple keys per tenant for rotation)
CREATE TABLE tenant_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    api_key_hash VARCHAR(64) NOT NULL,        -- SHA-256 hash
    key_prefix VARCHAR(8) NOT NULL,           -- First 8 chars for identification (e.g., 'slm_live_')
    name VARCHAR(100),                        -- Human-readable name ('Production Key', 'Development Key')

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                   -- Optional expiration

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    UNIQUE(api_key_hash)
);

-- =============================================================================
-- MODIFIED SESSIONS TABLE WITH TENANT ISOLATION
-- =============================================================================

-- Sessions now include tenant_id for row-level isolation
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_key VARCHAR(50) NOT NULL,         -- '2026-01-26-1737849600'

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress',
    final_score DECIMAL(5,2),
    quality_tier VARCHAR(30),

    -- Matter details
    matter_name VARCHAR(255),
    matter_type VARCHAR(50) DEFAULT 'ma_due_diligence',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,                  -- When moved to cold storage

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Unique session key per tenant (different tenants can have same session_key)
    UNIQUE(tenant_id, session_key),

    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'paused', 'completed', 'failed', 'archived'))
);

-- Row-Level Security for automatic tenant isolation
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sessions ON sessions
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Child tables inherit tenant isolation through session_id foreign key
-- No need for tenant_id on child tables - join through sessions

-- =============================================================================
-- INDEXES FOR MULTI-TENANT QUERIES
-- =============================================================================

CREATE INDEX idx_tenants_api_key ON tenants(api_key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_tenant_api_keys_hash ON tenant_api_keys(api_key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_tenant_status ON sessions(tenant_id, status);
CREATE INDEX idx_sessions_tenant_created ON sessions(tenant_id, created_at DESC);
```

### 19.3 Authentication Middleware

```javascript
// src/middleware/tenantAuth.js
import crypto from 'crypto';

/**
 * Tenant authentication middleware for claude-sdk-server.js
 * Validates API key and sets tenant context for all subsequent operations
 */
export const authenticateTenant = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Missing X-API-Key header'
        });
    }

    // Validate key format (e.g., 'slm_live_xxxxxxxx')
    if (!apiKey.match(/^slm_(live|test)_[a-zA-Z0-9]{32}$/)) {
        return res.status(401).json({
            error: 'Invalid API key format',
            message: 'API key must match pattern: slm_[live|test]_[32 chars]'
        });
    }

    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 8);

    try {
        // Look up tenant by API key
        const result = await req.app.locals.pool.query(`
            SELECT
                t.id as tenant_id,
                t.client_name,
                t.client_code,
                t.plan_tier,
                t.max_concurrent_sessions,
                t.anthropic_api_key_encrypted,
                t.settings,
                k.id as key_id,
                k.name as key_name
            FROM tenants t
            JOIN tenant_api_keys k ON k.tenant_id = t.id
            WHERE k.api_key_hash = $1
              AND k.is_active = TRUE
              AND t.is_active = TRUE
              AND (k.expires_at IS NULL OR k.expires_at > NOW())
        `, [apiKeyHash]);

        if (result.rows.length === 0) {
            // Log failed authentication attempt
            await logAuditEvent(req.app.locals.pool, {
                event_type: 'AUTH_FAILED',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                metadata: { key_prefix: keyPrefix, reason: 'invalid_or_inactive' }
            });

            return res.status(403).json({
                error: 'Invalid API key',
                message: 'API key not found, inactive, or expired'
            });
        }

        const tenant = result.rows[0];

        // Decrypt Anthropic API key
        const anthropicApiKey = decrypt(tenant.anthropic_api_key_encrypted);

        // Attach tenant context to request
        req.tenant = {
            id: tenant.tenant_id,
            clientName: tenant.client_name,
            clientCode: tenant.client_code,
            planTier: tenant.plan_tier,
            maxConcurrentSessions: tenant.max_concurrent_sessions,
            anthropicApiKey,
            settings: tenant.settings,
            keyId: tenant.key_id,
            keyName: tenant.key_name
        };

        // Update last_used_at for the API key
        await req.app.locals.pool.query(
            'UPDATE tenant_api_keys SET last_used_at = NOW() WHERE id = $1',
            [tenant.key_id]
        );

        // Set Row-Level Security context
        await req.app.locals.pool.query(
            `SET LOCAL app.current_tenant_id = $1`,
            [tenant.tenant_id]
        );

        // Log successful authentication
        await logAuditEvent(req.app.locals.pool, {
            tenant_id: tenant.tenant_id,
            event_type: 'AUTH_SUCCESS',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            metadata: { key_name: tenant.key_name }
        });

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
};

/**
 * Concurrent session limit enforcement
 */
export const enforceSessionLimits = async (req, res, next) => {
    const { tenant } = req;

    try {
        const activeCount = await req.app.locals.pool.query(`
            SELECT COUNT(*) as count
            FROM sessions
            WHERE tenant_id = $1
              AND status = 'in_progress'
        `, [tenant.id]);

        const currentActive = parseInt(activeCount.rows[0].count, 10);

        if (currentActive >= tenant.maxConcurrentSessions) {
            return res.status(429).json({
                error: 'Session limit exceeded',
                message: `Maximum ${tenant.maxConcurrentSessions} concurrent sessions allowed`,
                current_sessions: currentActive,
                max_sessions: tenant.maxConcurrentSessions
            });
        }

        next();
    } catch (error) {
        console.error('Session limit check error:', error);
        next();  // Fail open for availability
    }
};
```

### 19.4 Server Integration

```javascript
// Modifications to claude-sdk-server.js

import { authenticateTenant, enforceSessionLimits } from './middleware/tenantAuth.js';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

// Initialize connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                    // 10-100 clients × concurrent sessions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

// Make pool available to middleware
app.locals.pool = pool;

// Apply authentication to all /api routes
app.use('/api', authenticateTenant);

// Apply session limits to session-creating endpoints
app.post('/api/stream', enforceSessionLimits, async (req, res) => {
    const { query, sessionId: clientSessionId, matterName } = req.body;
    const tenant = req.tenant;

    // Generate or use provided session key
    const sessionKey = clientSessionId ||
        `${new Date().toISOString().split('T')[0]}-${Date.now()}`;

    // Create Anthropic client with tenant's API key
    const anthropicClient = new Anthropic({
        apiKey: tenant.anthropicApiKey
    });

    // Create/update session in database (tenant_id from authenticated context)
    const session = await pool.query(`
        INSERT INTO sessions (tenant_id, session_key, matter_name, status)
        VALUES ($1, $2, $3, 'in_progress')
        ON CONFLICT (tenant_id, session_key)
        DO UPDATE SET updated_at = NOW()
        RETURNING id, session_key
    `, [tenant.id, sessionKey, matterName]);

    const sessionDbId = session.rows[0].id;

    // Log session start
    await logAuditEvent(pool, {
        tenant_id: tenant.id,
        session_id: sessionDbId,
        event_type: 'SESSION_START',
        operation: 'stream',
        ip_address: req.ip,
        metadata: { matter_name: matterName }
    });

    // ... rest of streaming logic using anthropicClient
    // All subsequent database operations automatically scoped by session_id
});

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
});
```

### 19.5 Comprehensive Audit Trail (SOC 2 Type II)

```sql
-- =============================================================================
-- AUDIT LOG TABLE FOR SOC 2 COMPLIANCE
-- =============================================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,

    -- Who
    tenant_id UUID REFERENCES tenants(id),    -- NULL for system events
    session_id UUID REFERENCES sessions(id),  -- NULL for non-session events
    api_key_id UUID REFERENCES tenant_api_keys(id),

    -- What
    event_type VARCHAR(50) NOT NULL,
    operation VARCHAR(100),
    resource_type VARCHAR(50),                -- 'session', 'report', 'agent_state', 'tenant'
    resource_id UUID,

    -- When
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Where
    ip_address INET,
    user_agent TEXT,

    -- Details
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Request context
    request_id UUID,                          -- Correlation ID for request tracing

    -- Indexing for compliance queries
    CONSTRAINT valid_event_type CHECK (event_type IN (
        -- Authentication events
        'AUTH_SUCCESS', 'AUTH_FAILED', 'API_KEY_CREATED', 'API_KEY_REVOKED',
        -- Session events
        'SESSION_START', 'SESSION_COMPLETE', 'SESSION_FAILED', 'SESSION_PAUSED',
        -- Data access events
        'REPORT_READ', 'REPORT_WRITE', 'REPORT_DELETE',
        'STATE_READ', 'STATE_WRITE', 'STATE_DELETE',
        -- Agent events
        'AGENT_INVOKED', 'AGENT_COMPLETED', 'AGENT_FAILED',
        'TOOL_CALLED', 'TOOL_COMPLETED', 'TOOL_FAILED',
        -- Admin events
        'TENANT_CREATED', 'TENANT_UPDATED', 'TENANT_SUSPENDED',
        'CONFIG_CHANGED', 'PERMISSION_CHANGED'
    ))
);

-- Indexes for SOC 2 audit queries
CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_session ON audit_log(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_event_type ON audit_log(event_type, timestamp DESC);
CREATE INDEX idx_audit_ip_time ON audit_log(ip_address, timestamp DESC);

-- Partition by month for efficient retention management
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Continue for each month...

-- =============================================================================
-- AUDIT LOGGING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_session_id UUID,
    p_event_type VARCHAR(50),
    p_operation VARCHAR(100) DEFAULT NULL,
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_request_id UUID DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_audit_id BIGINT;
BEGIN
    INSERT INTO audit_log (
        tenant_id, session_id, event_type, operation,
        resource_type, resource_id, ip_address, user_agent,
        metadata, request_id
    ) VALUES (
        p_tenant_id, p_session_id, p_event_type, p_operation,
        p_resource_type, p_resource_id, p_ip_address, p_user_agent,
        p_metadata, p_request_id
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;
```

### 19.6 JavaScript Audit Helper

```javascript
// src/utils/auditLog.js

/**
 * Log audit event for SOC 2 compliance
 * Called throughout the application for comprehensive event tracking
 */
export async function logAuditEvent(pool, {
    tenant_id = null,
    session_id = null,
    event_type,
    operation = null,
    resource_type = null,
    resource_id = null,
    ip_address = null,
    user_agent = null,
    metadata = {},
    request_id = null
}) {
    try {
        await pool.query(`
            SELECT log_audit_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            tenant_id,
            session_id,
            event_type,
            operation,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            JSON.stringify(metadata),
            request_id
        ]);
    } catch (error) {
        // Audit logging should never block operations
        console.error('Audit log error (non-blocking):', error.message);
    }
}

/**
 * Create audit-wrapped database operations
 */
export function createAuditedOperations(pool, tenantContext) {
    return {
        async writeReport(sessionId, reportKey, content) {
            const result = await pool.query(`
                INSERT INTO reports (session_id, report_key, content, content_hash)
                VALUES ($1, $2, $3, encode(sha256($3::bytea), 'hex'))
                ON CONFLICT (session_id, report_key)
                DO UPDATE SET content = $3,
                              content_hash = encode(sha256($3::bytea), 'hex'),
                              version = reports.version + 1,
                              updated_at = NOW()
                RETURNING id
            `, [sessionId, reportKey, content]);

            await logAuditEvent(pool, {
                tenant_id: tenantContext.id,
                session_id: sessionId,
                event_type: 'REPORT_WRITE',
                operation: 'upsert',
                resource_type: 'report',
                resource_id: result.rows[0].id,
                metadata: { report_key: reportKey, content_length: content.length }
            });

            return result.rows[0];
        },

        async readReport(sessionId, reportKey) {
            const result = await pool.query(`
                SELECT id, content, version, updated_at
                FROM reports
                WHERE session_id = $1 AND report_key = $2
            `, [sessionId, reportKey]);

            if (result.rows.length > 0) {
                await logAuditEvent(pool, {
                    tenant_id: tenantContext.id,
                    session_id: sessionId,
                    event_type: 'REPORT_READ',
                    operation: 'select',
                    resource_type: 'report',
                    resource_id: result.rows[0].id,
                    metadata: { report_key: reportKey }
                });
            }

            return result.rows[0] || null;
        },

        async invokeAgent(sessionId, agentType, input) {
            const startTime = Date.now();

            await logAuditEvent(pool, {
                tenant_id: tenantContext.id,
                session_id: sessionId,
                event_type: 'AGENT_INVOKED',
                operation: agentType,
                metadata: { input_length: JSON.stringify(input).length }
            });

            // Return completion logger
            return {
                complete: async (output) => {
                    await logAuditEvent(pool, {
                        tenant_id: tenantContext.id,
                        session_id: sessionId,
                        event_type: 'AGENT_COMPLETED',
                        operation: agentType,
                        metadata: {
                            duration_ms: Date.now() - startTime,
                            output_length: JSON.stringify(output).length
                        }
                    });
                },
                fail: async (error) => {
                    await logAuditEvent(pool, {
                        tenant_id: tenantContext.id,
                        session_id: sessionId,
                        event_type: 'AGENT_FAILED',
                        operation: agentType,
                        metadata: {
                            duration_ms: Date.now() - startTime,
                            error: error.message
                        }
                    });
                }
            };
        }
    };
}
```

### 19.7 Data Retention & Archival

```sql
-- =============================================================================
-- RETENTION POLICY: 1 YEAR ACTIVE, 3 YEARS ARCHIVE
-- =============================================================================

-- Archive table for cold storage (same structure, separate table)
CREATE TABLE sessions_archive (LIKE sessions INCLUDING ALL);
CREATE TABLE reports_archive (LIKE reports INCLUDING ALL);
CREATE TABLE agent_states_archive (LIKE agent_states INCLUDING ALL);

-- Automated archival procedure (run monthly)
CREATE OR REPLACE FUNCTION archive_old_sessions() RETURNS INTEGER AS $$
DECLARE
    v_cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '1 year';
    v_archived_count INTEGER := 0;
BEGIN
    -- Move sessions older than 1 year to archive
    WITH archived AS (
        DELETE FROM sessions
        WHERE completed_at < v_cutoff_date
          AND status = 'completed'
        RETURNING *
    )
    INSERT INTO sessions_archive SELECT * FROM archived;

    GET DIAGNOSTICS v_archived_count = ROW_COUNT;

    -- Archive related reports (cascade through session_id)
    WITH archived_reports AS (
        DELETE FROM reports r
        WHERE NOT EXISTS (
            SELECT 1 FROM sessions s WHERE s.id = r.session_id
        )
        RETURNING *
    )
    INSERT INTO reports_archive SELECT * FROM archived_reports;

    -- Archive related agent_states
    WITH archived_states AS (
        DELETE FROM agent_states a
        WHERE NOT EXISTS (
            SELECT 1 FROM sessions s WHERE s.id = a.session_id
        )
        RETURNING *
    )
    INSERT INTO agent_states_archive SELECT * FROM archived_states;

    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- Delete archived data older than 3 years
CREATE OR REPLACE FUNCTION purge_expired_archives() RETURNS INTEGER AS $$
DECLARE
    v_cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '3 years';
    v_purged_count INTEGER := 0;
BEGIN
    DELETE FROM sessions_archive WHERE completed_at < v_cutoff_date;
    GET DIAGNOSTICS v_purged_count = ROW_COUNT;

    -- Cascade to reports_archive and agent_states_archive
    DELETE FROM reports_archive r
    WHERE NOT EXISTS (
        SELECT 1 FROM sessions_archive s WHERE s.id = r.session_id
    );

    DELETE FROM agent_states_archive a
    WHERE NOT EXISTS (
        SELECT 1 FROM sessions_archive s WHERE s.id = a.session_id
    );

    RETURN v_purged_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available) or external scheduler
-- SELECT cron.schedule('archive-monthly', '0 2 1 * *', 'SELECT archive_old_sessions()');
-- SELECT cron.schedule('purge-quarterly', '0 3 1 1,4,7,10 *', 'SELECT purge_expired_archives()');
```

### 19.8 Managed PostgreSQL Comparison

| Provider | Service | Pros | Cons | Recommendation |
|----------|---------|------|------|----------------|
| **AWS** | RDS PostgreSQL | Mature, Multi-AZ, automated backups, IAM integration | Higher cost, AWS lock-in | Best for AWS-centric deployments |
| **Google Cloud** | Cloud SQL | Good GKE integration, automatic storage increases | Fewer instance types | Best for GCP deployments |
| **Azure** | Azure Database for PostgreSQL | AAD integration, Flexible Server option | Newer service, fewer features | Best for Azure shops |
| **Railway** | Railway PostgreSQL | Developer-friendly, simple pricing, good DX | Smaller scale, less enterprise features | Best for startups/MVPs |
| **Supabase** | Supabase PostgreSQL | Built-in auth, realtime, generous free tier | Opinionated stack | Best if using Supabase ecosystem |
| **Neon** | Neon Serverless | Branching, autoscaling, serverless | Newer, cold starts | Best for variable workloads |

**Recommendation for Super-Legal MCP:**
- **Production (10-100 clients):** AWS RDS PostgreSQL or Google Cloud SQL
- **Development/Staging:** Railway or Neon (cost-effective)
- **Key requirements:** Automated backups, encryption at rest (TDE), connection pooling support

### 19.9 Connection Pooling Configuration

```javascript
// For 10-100 tenants with max 5 concurrent sessions each
// Worst case: 500 concurrent connections needed

// Option 1: Direct pooling (smaller scale)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 100,                   // Max connections in pool
    min: 10,                    // Keep 10 warm connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: true }
});

// Option 2: PgBouncer (recommended for scale)
// Deploy PgBouncer as connection multiplexer
// Application connects to PgBouncer, PgBouncer manages DB connections
const poolWithBouncer = new Pool({
    connectionString: process.env.PGBOUNCER_URL,  // Points to PgBouncer
    max: 50,  // PgBouncer handles the rest
});

// Option 3: AWS RDS Proxy (if using AWS)
// Automatic connection pooling, IAM auth, failover handling
const poolWithRdsProxy = new Pool({
    connectionString: process.env.RDS_PROXY_URL,
    ssl: { rejectUnauthorized: true }
});
```

### 19.10 Admin Dashboard API Endpoints

```javascript
// src/routes/admin.js
// Manual tenant onboarding via admin dashboard

import express from 'express';
import crypto from 'crypto';
import { encrypt } from '../utils/encryption.js';
import { logAuditEvent } from '../utils/auditLog.js';

const router = express.Router();

// Admin authentication middleware (separate from tenant auth)
const authenticateAdmin = async (req, res, next) => {
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.ADMIN_SECRET_TOKEN) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.use(authenticateAdmin);

/**
 * Create new tenant
 * POST /admin/tenants
 */
router.post('/tenants', async (req, res) => {
    const { clientName, clientCode, contactEmail, planTier, anthropicApiKey } = req.body;

    // Validate required fields
    if (!clientName || !clientCode || !anthropicApiKey) {
        return res.status(400).json({
            error: 'Missing required fields: clientName, clientCode, anthropicApiKey'
        });
    }

    // Generate platform API key for tenant
    const apiKey = `slm_live_${crypto.randomBytes(16).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Encrypt Anthropic API key
    const anthropicKeyEncrypted = encrypt(anthropicApiKey);

    try {
        const client = await req.app.locals.pool.connect();

        try {
            await client.query('BEGIN');

            // Create tenant
            const tenantResult = await client.query(`
                INSERT INTO tenants (
                    client_name, client_code, api_key_hash,
                    anthropic_api_key_encrypted, contact_email, plan_tier
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, client_name, client_code, plan_tier, created_at
            `, [clientName, clientCode, apiKeyHash, anthropicKeyEncrypted, contactEmail, planTier || 'standard']);

            const tenant = tenantResult.rows[0];

            // Create initial API key record
            await client.query(`
                INSERT INTO tenant_api_keys (
                    tenant_id, api_key_hash, key_prefix, name
                ) VALUES ($1, $2, $3, $4)
            `, [tenant.id, apiKeyHash, apiKey.substring(0, 8), 'Primary API Key']);

            await client.query('COMMIT');

            // Audit log
            await logAuditEvent(req.app.locals.pool, {
                tenant_id: tenant.id,
                event_type: 'TENANT_CREATED',
                operation: 'create',
                resource_type: 'tenant',
                resource_id: tenant.id,
                ip_address: req.ip,
                metadata: { client_code: clientCode, plan_tier: planTier }
            });

            // Return tenant info with API key (only time key is shown in plaintext)
            res.status(201).json({
                tenant: {
                    id: tenant.id,
                    clientName: tenant.client_name,
                    clientCode: tenant.client_code,
                    planTier: tenant.plan_tier,
                    createdAt: tenant.created_at
                },
                apiKey: apiKey,  // ⚠️ Only returned once, must be stored by admin
                warning: 'Store this API key securely. It cannot be retrieved again.'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        if (error.constraint === 'tenants_client_code_key') {
            return res.status(409).json({ error: 'Client code already exists' });
        }
        console.error('Tenant creation error:', error);
        res.status(500).json({ error: 'Failed to create tenant' });
    }
});

/**
 * List all tenants
 * GET /admin/tenants
 */
router.get('/tenants', async (req, res) => {
    try {
        const result = await req.app.locals.pool.query(`
            SELECT
                t.id, t.client_name, t.client_code, t.plan_tier,
                t.max_concurrent_sessions, t.is_active, t.created_at,
                COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_sessions,
                COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'in_progress') as active_sessions
            FROM tenants t
            LEFT JOIN sessions s ON s.tenant_id = t.id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);

        res.json({ tenants: result.rows });
    } catch (error) {
        console.error('List tenants error:', error);
        res.status(500).json({ error: 'Failed to list tenants' });
    }
});

/**
 * Rotate API key for tenant
 * POST /admin/tenants/:id/rotate-key
 */
router.post('/tenants/:id/rotate-key', async (req, res) => {
    const { id } = req.params;
    const { keyName } = req.body;

    // Generate new API key
    const newApiKey = `slm_live_${crypto.randomBytes(16).toString('hex')}`;
    const newApiKeyHash = crypto.createHash('sha256').update(newApiKey).digest('hex');

    try {
        const client = await req.app.locals.pool.connect();

        try {
            await client.query('BEGIN');

            // Revoke old keys
            await client.query(`
                UPDATE tenant_api_keys
                SET is_active = FALSE, revoked_at = NOW()
                WHERE tenant_id = $1 AND is_active = TRUE
            `, [id]);

            // Create new key
            await client.query(`
                INSERT INTO tenant_api_keys (
                    tenant_id, api_key_hash, key_prefix, name
                ) VALUES ($1, $2, $3, $4)
            `, [id, newApiKeyHash, newApiKey.substring(0, 8), keyName || 'Rotated API Key']);

            await client.query('COMMIT');

            // Audit log
            await logAuditEvent(req.app.locals.pool, {
                tenant_id: id,
                event_type: 'API_KEY_REVOKED',
                operation: 'rotate',
                resource_type: 'api_key',
                ip_address: req.ip
            });

            res.json({
                apiKey: newApiKey,
                warning: 'Old API key has been revoked. Store new key securely.'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Key rotation error:', error);
        res.status(500).json({ error: 'Failed to rotate API key' });
    }
});

/**
 * Suspend/reactivate tenant
 * PATCH /admin/tenants/:id/status
 */
router.patch('/tenants/:id/status', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        await req.app.locals.pool.query(`
            UPDATE tenants
            SET is_active = $2,
                suspended_at = CASE WHEN $2 = FALSE THEN NOW() ELSE NULL END,
                updated_at = NOW()
            WHERE id = $1
        `, [id, isActive]);

        await logAuditEvent(req.app.locals.pool, {
            tenant_id: id,
            event_type: isActive ? 'TENANT_UPDATED' : 'TENANT_SUSPENDED',
            operation: 'status_change',
            resource_type: 'tenant',
            resource_id: id,
            ip_address: req.ip,
            metadata: { is_active: isActive }
        });

        res.json({ success: true, isActive });

    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ error: 'Failed to update tenant status' });
    }
});

export default router;
```

### 19.11 Multi-Tenant Architecture Checklist

**Schema & Data Isolation:**
- [ ] `tenants` table created with platform-managed API key hashes
- [ ] `tenant_api_keys` table supports key rotation without downtime
- [ ] `sessions` table includes `tenant_id` foreign key
- [ ] Row-Level Security enabled on sessions table
- [ ] All child tables inherit tenant isolation through `session_id`
- [ ] Unique constraint on `(tenant_id, session_key)` prevents collisions

**Authentication & Authorization:**
- [ ] API key format validation (`slm_[live|test]_[32 chars]`)
- [ ] SHA-256 hashing for API key storage (never store plaintext)
- [ ] Anthropic API key encryption with master key
- [ ] Concurrent session limits enforced per tenant
- [ ] Failed authentication attempts logged

**SOC 2 Type II Compliance:**
- [ ] Comprehensive audit logging for all operations
- [ ] Authentication events (success, failure)
- [ ] Data access events (read, write, delete)
- [ ] Admin actions (tenant creation, config changes)
- [ ] Agent invocations and completions
- [ ] Audit log partitioned by month for retention
- [ ] IP address and user agent captured

**Data Retention:**
- [ ] 1-year active retention implemented
- [ ] 3-year archive storage configured
- [ ] Automated archival procedure scheduled (monthly)
- [ ] Automated purge procedure scheduled (quarterly)
- [ ] Archive tables created with same structure

**Infrastructure:**
- [ ] Managed PostgreSQL service selected
- [ ] Connection pooling configured (direct or PgBouncer)
- [ ] TDE encryption enabled (managed service)
- [ ] Automated backups configured
- [ ] Failover/high availability enabled

**Admin Dashboard:**
- [ ] Tenant creation endpoint implemented
- [ ] API key rotation endpoint implemented
- [ ] Tenant listing endpoint implemented
- [ ] Tenant suspension endpoint implemented
- [ ] Admin authentication separated from tenant auth

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Architecture Team | Initial release |
| 1.1 | 2026-01-26 | Architecture Team | Added SDK Hooks & Subagent Integration (Section 15-16) |
| 1.2 | 2026-01-26 | Architecture Team | Added progressive save, large file handling, 41-agent coverage (Sections 15.8-15.12, 16.6-16.10) |
| 1.3 | 2026-01-26 | Architecture Team | Added Claude Agent SDK best practices alignment (Section 17) |
| 1.4 | 2026-01-26 | Architecture Team | Added Claude Cookbook production patterns (Section 18) |
| 1.5 | 2026-01-27 | Architecture Team | Added Multi-Tenant Architecture (Section 19): row-level isolation, SOC 2 audit trail, tenant onboarding, retention policies, managed PostgreSQL comparison |

---

**END OF MIGRATION GUIDE**

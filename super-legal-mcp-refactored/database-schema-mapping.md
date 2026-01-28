# Database Schema Mapping - Super Legal MCP

## Overview

This document provides a comprehensive mapping of all database structures used in the super-legal-mcp-refactored system, including both the existing PostgreSQL schema and the new Supabase conversation infrastructure.

## Database Systems

The application uses two database systems:

1. **PostgreSQL** - For legal research run tracking and evidence storage
2. **Supabase** - For conversation management and real-time streaming

---

## PostgreSQL Schema (Existing)

### Connection Configuration
```javascript
// src/db/postgres.js
const connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL
```

### Table: `runs`

**Purpose:** Tracks legal research runs and AI model executions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing unique identifier |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Timestamp when run was created |
| `model` | `text` | NOT NULL | AI model used (e.g., 'claude-3', 'gpt-4') |
| `query` | `text` | NOT NULL | User's legal research query |
| `memo_json` | `jsonb` | NULLABLE | Structured legal memo data |
| `final_text` | `text` | NULLABLE | Final formatted legal analysis text |
| `status` | `text` | NOT NULL, DEFAULT 'running' | Run status ('running', 'completed', 'failed') |

**Indexes:**
```sql
-- Primary key index (automatic)
CREATE INDEX runs_pkey ON runs (id);

-- Performance indexes (recommended)
CREATE INDEX idx_runs_status ON runs (status);
CREATE INDEX idx_runs_created_at ON runs (created_at DESC);
CREATE INDEX idx_runs_model ON runs (model);
```

**Example Data:**
```json
{
  "id": 123,
  "created_at": "2025-08-22T10:30:00Z",
  "model": "claude-3.5-sonnet",
  "query": "contract law breach remedies",
  "memo_json": {
    "case_law": [...],
    "statutes": [...],
    "analysis": "..."
  },
  "final_text": "Legal Analysis: Contract Breach Remedies...",
  "status": "completed"
}
```

### Table: `tool_calls`

**Purpose:** Logs all MCP tool invocations during legal research

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing unique identifier |
| `run_id` | `bigint` | NOT NULL, FOREIGN KEY → runs(id) CASCADE DELETE | Associated research run |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | When tool was called |
| `tool_name` | `text` | NOT NULL | Name of MCP tool used |
| `args` | `jsonb` | NOT NULL | Tool arguments and parameters |

**Relationships:**
- **Many-to-One** with `runs` table (one run can have multiple tool calls)
- **Cascade Delete** - deleting a run removes all associated tool calls

**Indexes:**
```sql
-- Primary key and foreign key indexes (automatic)
CREATE INDEX tool_calls_pkey ON tool_calls (id);
CREATE INDEX tool_calls_run_id_fkey ON tool_calls (run_id);

-- Performance indexes (recommended)
CREATE INDEX idx_tool_calls_tool_name ON tool_calls (tool_name);
CREATE INDEX idx_tool_calls_created_at ON tool_calls (created_at DESC);
CREATE INDEX idx_tool_calls_run_tool ON tool_calls (run_id, tool_name);
```

**Example Data:**
```json
{
  "id": 456,
  "run_id": 123,
  "created_at": "2025-08-22T10:31:15Z",
  "tool_name": "courtlistener_search",
  "args": {
    "query": "contract breach",
    "jurisdiction": "federal",
    "date_range": "2020-2025"
  }
}
```

### Table: `evidence`

**Purpose:** Stores legal evidence and source documents found during research

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing unique identifier |
| `run_id` | `bigint` | NOT NULL, FOREIGN KEY → runs(id) CASCADE DELETE | Associated research run |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | When evidence was collected |
| `uri` | `text` | NOT NULL | Source URI/URL of the evidence |
| `source` | `text` | NULLABLE | Source system (e.g., 'courtlistener', 'sec') |
| `snippet` | `text` | NULLABLE | Relevant text excerpt |
| `hash` | `text` | NULLABLE | Content hash for deduplication |

**Relationships:**
- **Many-to-One** with `runs` table (one run can collect multiple pieces of evidence)
- **Cascade Delete** - deleting a run removes all associated evidence

**Indexes:**
```sql
-- Primary key and foreign key indexes (automatic)
CREATE INDEX evidence_pkey ON evidence (id);
CREATE INDEX evidence_run_id_fkey ON evidence (run_id);

-- Performance indexes (recommended)
CREATE INDEX idx_evidence_source ON evidence (source);
CREATE INDEX idx_evidence_hash ON evidence (hash) WHERE hash IS NOT NULL;
CREATE INDEX idx_evidence_uri ON evidence (uri);
CREATE INDEX idx_evidence_run_created ON evidence (run_id, created_at DESC);
```

**Example Data:**
```json
{
  "id": 789,
  "run_id": 123,
  "created_at": "2025-08-22T10:32:00Z",
  "uri": "https://www.courtlistener.com/opinion/12345/",
  "source": "courtlistener",
  "snippet": "In contract law, breach occurs when...",
  "hash": "abc123def456"
}
```

---

## Supabase Schema (New Conversation Infrastructure)

### Connection Configuration
```javascript
// Environment variables
SUPABASE_URL=https://jluwnohozbtsvzfiysnf.supabase.co
SUPABASE_ACCESS_TOKEN=sbp_fb89e74a7cbdefb2f3d1331d14613b4adfee3457
```

### Table: `conversations`

**Purpose:** Manages conversation sessions and metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique conversation identifier |
| `session_id` | `text` | NOT NULL, UNIQUE | Human-readable session identifier |
| `user_id` | `uuid` | NULLABLE, FOREIGN KEY → auth.users(id) | Associated user (Supabase Auth) |
| `title` | `text` | NULLABLE | Conversation title/subject |
| `created_at` | `timestamptz` | DEFAULT NOW() | When conversation was created |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Last activity timestamp |
| `metadata` | `jsonb` | DEFAULT '{}' | Flexible metadata storage |

**Row Level Security (RLS):**
```sql
-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
```

**Indexes:**
```sql
CREATE INDEX idx_conversations_user_activity ON conversations (user_id, updated_at DESC);
CREATE INDEX idx_conversations_session ON conversations (session_id);
CREATE INDEX idx_conversations_user_created ON conversations (user_id, created_at DESC);
```

**Real-time Subscriptions:**
```sql
ALTER publication supabase_realtime ADD TABLE conversations;
```

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "legal-session-2025-08-22-123",
  "user_id": "user-uuid-here",
  "title": "Contract Law Research Session",
  "created_at": "2025-08-22T10:00:00Z",
  "updated_at": "2025-08-22T10:30:00Z",
  "metadata": {
    "legal_context": "contract_disputes",
    "jurisdiction": "federal",
    "research_type": "case_law"
  }
}
```

### Table: `conversation_messages`

**Purpose:** Stores complete messages with proper sequencing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier |
| `conversation_id` | `uuid` | NOT NULL, FOREIGN KEY → conversations(id) CASCADE DELETE | Parent conversation |
| `role` | `text` | NOT NULL, CHECK (role IN ('user', 'assistant', 'system')) | Message sender role |
| `content` | `text` | NOT NULL | Message content |
| `sequence_number` | `integer` | NOT NULL | Message order in conversation |
| `created_at` | `timestamptz` | DEFAULT NOW() | When message was created |
| `metadata` | `jsonb` | DEFAULT '{}' | Message-specific metadata |

**Constraints:**
```sql
-- Ensure unique sequence numbers per conversation
CREATE UNIQUE INDEX idx_messages_conversation_sequence_unique 
ON conversation_messages (conversation_id, sequence_number);
```

**Row Level Security (RLS):**
```sql
-- Users can only access messages from their conversations
CREATE POLICY "Users can view own messages" ON conversation_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

**Indexes:**
```sql
CREATE INDEX idx_messages_conversation_seq ON conversation_messages (conversation_id, sequence_number);
CREATE INDEX idx_messages_conversation_created ON conversation_messages (conversation_id, created_at);
CREATE INDEX idx_messages_role_conversation ON conversation_messages (conversation_id, role, sequence_number);
CREATE INDEX idx_messages_content_fts ON conversation_messages USING gin(to_tsvector('english', content));
```

**Triggers:**
```sql
-- Auto-update conversation timestamp when messages change
CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
```

**Example Data:**
```json
{
  "id": "message-uuid-1",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "user",
  "content": "What are the key principles of contract law?",
  "sequence_number": 1,
  "created_at": "2025-08-22T10:05:00Z",
  "metadata": {
    "type": "question",
    "legal_area": "contracts"
  }
}
```

### Table: `message_chunks`

**Purpose:** Handles real-time streaming of message content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique chunk identifier |
| `message_id` | `uuid` | NOT NULL, FOREIGN KEY → conversation_messages(id) CASCADE DELETE | Parent message |
| `chunk_content` | `text` | NOT NULL | Partial message content |
| `chunk_index` | `integer` | NOT NULL | Order of chunk in message |
| `is_final` | `boolean` | DEFAULT false | Whether this is the last chunk |
| `created_at` | `timestamptz` | DEFAULT NOW() | When chunk was created |

**Indexes:**
```sql
CREATE INDEX idx_chunks_message_idx ON message_chunks (message_id, chunk_index);
CREATE INDEX idx_chunks_final ON message_chunks (message_id, is_final);
CREATE INDEX idx_chunks_message_created ON message_chunks (message_id, created_at);
```

**Triggers:**
```sql
-- Auto-reconstruct complete message when final chunk is received
CREATE TRIGGER handle_message_chunk_completion
  AFTER INSERT ON message_chunks
  FOR EACH ROW EXECUTE FUNCTION handle_chunk_completion();
```

**Row Level Security (RLS):**
```sql
-- Users can only access chunks from their messages
CREATE POLICY "Users can view own message chunks" ON message_chunks
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM conversation_messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
```

**Example Data:**
```json
{
  "id": "chunk-uuid-1",
  "message_id": "message-uuid-2",
  "chunk_content": "Contract law is governed by several key principles: ",
  "chunk_index": 0,
  "is_final": false,
  "created_at": "2025-08-22T10:06:01Z"
}
```

### Table: `message_attachments`

**Purpose:** Manages document uploads and file metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique attachment identifier |
| `message_id` | `uuid` | NOT NULL, FOREIGN KEY → conversation_messages(id) CASCADE DELETE | Parent message |
| `file_name` | `text` | NOT NULL | Original filename |
| `file_type` | `text` | NOT NULL | MIME type |
| `file_size` | `integer` | NOT NULL | File size in bytes |
| `storage_path` | `text` | NOT NULL | Supabase Storage path |
| `extracted_content` | `text` | NULLABLE | Searchable text content |
| `processing_status` | `text` | DEFAULT 'pending', CHECK (processing_status IN ('pending', 'processed', 'failed')) | Processing state |
| `uploaded_by` | `uuid` | NULLABLE, FOREIGN KEY → auth.users(id) | User who uploaded |
| `created_at` | `timestamptz` | DEFAULT NOW() | Upload timestamp |
| `metadata` | `jsonb` | DEFAULT '{}' | File-specific metadata |

**Indexes:**
```sql
CREATE INDEX idx_attachments_message ON message_attachments (message_id);
CREATE INDEX idx_attachments_status ON message_attachments (processing_status);
CREATE INDEX idx_attachments_user ON message_attachments (uploaded_by);
CREATE INDEX idx_attachments_content_fts ON message_attachments USING gin(to_tsvector('english', extracted_content));
CREATE INDEX idx_attachments_filename_fts ON message_attachments USING gin(to_tsvector('english', file_name));
```

**Row Level Security (RLS):**
```sql
-- Users can only access their own attachments
CREATE POLICY "Users can view own attachments" ON message_attachments
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload attachments" ON message_attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());
```

**Supabase Storage Integration:**
```sql
-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Example Data:**
```json
{
  "id": "attachment-uuid-1",
  "message_id": "message-uuid-1",
  "file_name": "contract_analysis.pdf",
  "file_type": "application/pdf",
  "file_size": 2048000,
  "storage_path": "user-123/contract_analysis.pdf",
  "extracted_content": "This document analyzes contract formation...",
  "processing_status": "processed",
  "uploaded_by": "user-uuid-here",
  "created_at": "2025-08-22T10:07:00Z",
  "metadata": {
    "pages": 15,
    "processing_time_ms": 3500,
    "legal_document_type": "contract_analysis"
  }
}
```

### Table: `document_versions`

**Purpose:** Supports document versioning and collaboration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique version identifier |
| `parent_attachment_id` | `uuid` | NOT NULL, FOREIGN KEY → message_attachments(id) CASCADE DELETE | Original attachment |
| `version_number` | `integer` | NOT NULL | Version sequence number |
| `file_name` | `text` | NOT NULL | Version filename |
| `storage_path` | `text` | NOT NULL | Storage location |
| `changes_description` | `text` | NULLABLE | Description of changes |
| `created_by` | `uuid` | NULLABLE, FOREIGN KEY → auth.users(id) | User who created version |
| `created_at` | `timestamptz` | DEFAULT NOW() | Version creation time |

**Indexes:**
```sql
CREATE INDEX idx_versions_parent ON document_versions (parent_attachment_id);
CREATE INDEX idx_versions_created_by ON document_versions (created_by);
CREATE INDEX idx_versions_parent_version ON document_versions (parent_attachment_id, version_number);
```

**Row Level Security (RLS):**
```sql
-- Users can only access their own document versions
CREATE POLICY "Users can view own document versions" ON document_versions
  FOR SELECT USING (created_by = auth.uid());
```

**Example Data:**
```json
{
  "id": "version-uuid-1",
  "parent_attachment_id": "attachment-uuid-1",
  "version_number": 2,
  "file_name": "contract_analysis_v2.pdf",
  "storage_path": "user-123/versions/contract_analysis_v2.pdf",
  "changes_description": "Added liability clause analysis",
  "created_by": "user-uuid-here",
  "created_at": "2025-08-22T11:00:00Z"
}
```

---

## Database Functions

### PostgreSQL Functions

#### `ensureSchema()`
```javascript
// src/db/postgres.js
async function ensureSchema() {
  // Creates tables if they don't exist
  // Called on application startup
}
```

### Supabase Functions

#### `get_conversation_with_messages(conv_id UUID)`
```sql
-- Returns complete conversation with all messages
SELECT c.*, m.role, m.content, m.sequence_number
FROM conversations c
LEFT JOIN conversation_messages m ON c.id = m.conversation_id
WHERE c.id = conv_id
ORDER BY m.sequence_number;
```

#### `reconstruct_message(msg_id UUID)`
```sql
-- Rebuilds complete message from streaming chunks
SELECT string_agg(chunk_content, '' ORDER BY chunk_index)
FROM message_chunks
WHERE message_id = msg_id;
```

#### `cleanup_streaming_artifacts(msg_id UUID)`
```sql
-- Removes completed streaming chunks
DELETE FROM message_chunks 
WHERE message_id = msg_id AND is_final = true;
```

#### `create_conversation_with_message()`
```sql
-- Creates conversation and initial message atomically
-- Returns both conversation_id and message_id
```

#### `get_conversation_context(conv_id UUID, message_limit INTEGER)`
```sql
-- Gets recent conversation history for AI context
SELECT role, content, sequence_number, created_at
FROM conversation_messages 
WHERE conversation_id = conv_id
ORDER BY sequence_number DESC
LIMIT message_limit;
```

---

## Data Relationships

### PostgreSQL Relationships
```
runs (1) ←→ (∞) tool_calls
runs (1) ←→ (∞) evidence
```

### Supabase Relationships
```
auth.users (1) ←→ (∞) conversations
conversations (1) ←→ (∞) conversation_messages
conversation_messages (1) ←→ (∞) message_chunks
conversation_messages (1) ←→ (∞) message_attachments
message_attachments (1) ←→ (∞) document_versions
auth.users (1) ←→ (∞) message_attachments
auth.users (1) ←→ (∞) document_versions
```

---

## Migration Scripts

### Initial Setup
```sql
-- PostgreSQL (handled by ensureSchema())
-- Supabase (applied via migrations)
-- Migration files in chronological order:
-- 001_create_base_schema.sql
-- 002_add_document_support.sql  
-- 003_add_indexes_and_search.sql
-- 004_implement_row_level_security.sql
-- 005_create_functions.sql
-- 006_enable_realtime.sql
```

### Rollback Procedures
```sql
-- Each migration includes rollback commands
-- Stored in separate rollback files for safety
```

---

## Performance Considerations

### Query Patterns

**High-Frequency Queries:**
1. Get conversation history: `conversation_id → messages`
2. Stream message chunks: `message_id → chunks`
3. Search conversations: `user_id + text search`
4. Legal research tracking: `run_id → tool_calls + evidence`

**Optimized Indexes:**
- All foreign keys have indexes
- Full-text search on message content
- Composite indexes for common query patterns
- Time-based indexes for pagination

### Real-time Performance
- WebSocket connections for streaming
- Row-level filtering reduces bandwidth
- Automatic connection management
- Optimized subscription patterns

---

## Security Model

### Authentication
- **PostgreSQL**: Application-level (connection string)
- **Supabase**: Built-in Auth with JWT tokens

### Authorization
- **PostgreSQL**: Connection-based security
- **Supabase**: Row Level Security (RLS) policies

### Data Protection
- **Encryption**: TLS in transit, at-rest encryption
- **Access Control**: User-scoped data access
- **Audit Trail**: Automatic timestamp tracking

---

## Environment Variables

### Required Configuration
```bash
# PostgreSQL
PG_CONNECTION_STRING=postgresql://user:pass@host:port/db
# OR
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://jluwnohozbtsvzfiysnf.supabase.co
SUPABASE_ACCESS_TOKEN=sbp_fb89e74a7cbdefb2f3d1331d14613b4adfee3457
```

### Optional Configuration
```bash
# Connection pooling
PG_POOL_MAX=5
SUPABASE_POOL_MAX=10

# Performance tuning
SUPABASE_REALTIME_ENABLED=true
CONVERSATION_CHUNK_SIZE=100
```

---

## Monitoring and Maintenance

### Health Checks
```sql
-- PostgreSQL table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname = 'public';

-- Supabase table sizes and performance
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public';
```

### Backup Strategy
- **PostgreSQL**: Regular pg_dump backups
- **Supabase**: Automatic daily backups, point-in-time recovery

### Performance Monitoring
- Query execution times
- Connection pool usage
- Real-time subscription metrics
- Storage usage tracking

This comprehensive schema mapping provides a complete reference for all database structures in the super-legal-mcp-refactored system, enabling efficient development, maintenance, and integration of new features.
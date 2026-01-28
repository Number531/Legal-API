# Supabase Conversation Streaming Infrastructure Implementation Guide

## Overview

This document outlines the comprehensive implementation plan for a conversation streaming system using Supabase, designed to support real-time chat functionality with document upload capabilities and advanced features for the super-legal-mcp-refactored project.

## Architecture Design

### Three-Table Structure Rationale

We've chosen a three-table architecture for optimal performance, maintainability, and feature extensibility:

1. **conversations** - Session metadata and conversation management
2. **messages** - Complete message storage with sequence ordering
3. **message_chunks** - Real-time streaming chunk storage

This structure provides:
- Clean service boundaries for microservices architecture
- Purpose-built indexes for different access patterns
- Efficient real-time streaming capabilities
- Easy maintenance and lifecycle management
- Scalable foundation for production use

## Database Schema

### Core Tables

#### 1. Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

**Purpose**: Manages conversation sessions and metadata
**Key Features**:
- Unique session identifiers for conversation tracking
- User association for multi-user support
- Flexible metadata storage via JSONB
- Automatic timestamp management

#### 2. Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

**Purpose**: Stores complete messages with proper sequencing
**Key Features**:
- Foreign key relationship to conversations
- Role-based message categorization
- Sequential ordering for conversation flow
- Cascading deletion for data consistency

#### 3. Message Chunks Table
```sql
CREATE TABLE message_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  chunk_content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Handles real-time streaming of message content
**Key Features**:
- Links to parent messages for reconstruction
- Indexed chunk ordering for streaming
- Final chunk identification for completion
- Automatic cleanup with message deletion

### Document Support Extensions

#### 4. Message Attachments Table
```sql
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  extracted_content TEXT, -- For searchable content
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

**Purpose**: Manages document uploads and file metadata
**Key Features**:
- Integration with Supabase Storage
- Content extraction for full-text search
- Processing status tracking
- User attribution for uploads

#### 5. Document Versions Table
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_attachment_id UUID REFERENCES message_attachments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  changes_description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Supports document versioning and collaboration
**Key Features**:
- Parent-child relationships for version tracking
- Change documentation
- User attribution for versions

### Performance Optimization

#### Optimized Indexes
```sql
-- Conversation queries
CREATE INDEX idx_conversations_user_activity ON conversations (user_id, updated_at DESC);
CREATE INDEX idx_conversations_session ON conversations (session_id);

-- Message queries
CREATE INDEX idx_messages_conversation_seq ON messages (conversation_id, sequence_number);
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at);

-- Streaming queries
CREATE INDEX idx_chunks_message_idx ON message_chunks (message_id, chunk_index);
CREATE INDEX idx_chunks_final ON message_chunks (message_id, is_final);

-- Document queries
CREATE INDEX idx_attachments_message ON message_attachments (message_id);
CREATE INDEX idx_attachments_status ON message_attachments (processing_status);

-- Full-text search
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_attachments_content_fts ON message_attachments USING gin(to_tsvector('english', extracted_content));
```

#### Database Functions

##### Conversation Management
```sql
-- Get complete conversation with messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(conv_id UUID)
RETURNS TABLE(
  conversation_id UUID,
  session_id TEXT,
  title TEXT,
  message_id UUID,
  role TEXT,
  content TEXT,
  sequence_number INTEGER,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.session_id,
    c.title,
    m.id as message_id,
    m.role,
    m.content,
    m.sequence_number,
    m.created_at as message_created_at
  FROM conversations c
  JOIN messages m ON c.id = m.conversation_id
  WHERE c.id = conv_id
  ORDER BY m.sequence_number;
END;
$$ LANGUAGE plpgsql;
```

##### Message Reconstruction
```sql
-- Reconstruct message from chunks
CREATE OR REPLACE FUNCTION reconstruct_message(msg_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT string_agg(chunk_content, '' ORDER BY chunk_index)
    FROM message_chunks
    WHERE message_id = msg_id
  );
END;
$$ LANGUAGE plpgsql;
```

##### Cleanup Operations
```sql
-- Clean up completed streaming chunks
CREATE OR REPLACE FUNCTION cleanup_streaming_artifacts(msg_id UUID)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM message_chunks 
  WHERE message_id = msg_id AND is_final = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Security Implementation

### Row Level Security (RLS) Policies

#### Conversations
```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
```

#### Messages
```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only access messages from their conversations
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

#### Message Chunks
```sql
-- Enable RLS
ALTER TABLE message_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only access chunks from their messages
CREATE POLICY "Users can view own message chunks" ON message_chunks
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
```

#### Document Attachments
```sql
-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own documents
CREATE POLICY "Users can view own attachments" ON message_attachments
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload attachments" ON message_attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());
```

### Supabase Storage Configuration

#### Storage Buckets
```sql
-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create storage policies
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Real-time Subscriptions

### Subscription Configuration

#### Conversation Updates
```typescript
const conversationSubscription = supabase
  .channel('conversations')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'conversations' },
    (payload) => handleConversationUpdate(payload)
  )
  .subscribe();
```

#### Message Streaming
```typescript
const messageSubscription = supabase
  .channel('messages')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => handleNewMessage(payload)
  )
  .subscribe();
```

#### Chunk Streaming
```typescript
const chunkSubscription = supabase
  .channel('message_chunks')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'message_chunks' },
    (payload) => handleMessageChunk(payload)
  )
  .subscribe();
```

## Frontend Integration

### Core Components

#### Document Upload Component
```typescript
interface DocumentUploaderProps {
  conversationId: string;
  onUpload: (attachment: MessageAttachment) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ conversationId, onUpload }) => {
  const handleFileUpload = async (file: File) => {
    // 1. Upload to Supabase Storage
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${auth.user.id}/${conversationId}/${file.name}`, file);

    if (uploadError) throw uploadError;

    // 2. Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: currentMessageId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storageData.path,
        uploaded_by: auth.user.id,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    onUpload(attachment);
  };

  return (
    <div className="upload-zone">
      <input 
        type="file" 
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => e.files?.[0] && handleFileUpload(e.files[0])}
      />
    </div>
  );
};
```

#### Message Streaming Component
```typescript
const MessageStream: React.FC<{ messageId: string }> = ({ messageId }) => {
  const [content, setContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const subscription = supabase
      .channel(`message_${messageId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'message_chunks',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          const chunk = payload.new as MessageChunk;
          setContent(prev => prev + chunk.chunk_content);
          if (chunk.is_final) {
            setIsComplete(true);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [messageId]);

  return (
    <div className={`message-content ${isComplete ? 'complete' : 'streaming'}`}>
      {content}
      {!isComplete && <span className="cursor">|</span>}
    </div>
  );
};
```

## Testing Strategy

### Unit Tests
- Database function validation
- RLS policy verification
- Schema constraint testing
- Index performance validation

### Integration Tests
- Real-time subscription functionality
- Document upload and processing pipeline
- Cross-table query performance
- Concurrent user scenarios

### Load Testing
- Multiple concurrent conversations
- High-frequency message streaming
- Large document upload handling
- Database performance under load

## Deployment Strategy

### Migration Scripts
```sql
-- Migration: 001_create_base_schema.sql
BEGIN;

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create message_chunks table
CREATE TABLE message_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  chunk_content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
```

### Rollback Procedures
```sql
-- Rollback: 001_create_base_schema.sql
BEGIN;

DROP TABLE IF EXISTS message_chunks;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

COMMIT;
```

## Monitoring and Analytics

### Performance Metrics
- Average message streaming latency
- Document processing time
- Query response times
- Concurrent user capacity

### Health Checks
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('conversations', 'messages', 'message_chunks');

-- Check index usage
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('conversations', 'messages', 'message_chunks');
```

### Alerting Configuration
- Database connection pool exhaustion
- Storage bucket capacity warnings
- Real-time subscription failures
- Query performance degradation

## Implementation Checklist

### Phase 1: Core Database Schema ✅
- [ ] Create conversations table with proper constraints
- [ ] Create messages table with foreign key relationships
- [ ] Create message_chunks table for streaming support
- [ ] Add all primary and foreign key constraints
- [ ] Create unique indexes for session_id and other lookup fields

### Phase 2: Document Support Tables ✅
- [ ] Create message_attachments table
- [ ] Create document_versions table for versioning
- [ ] Set up Supabase Storage bucket configuration
- [ ] Configure file upload size limits and type restrictions

### Phase 3: Performance Optimization ✅
- [ ] Create all optimized indexes for query patterns
- [ ] Set up composite indexes for multi-column queries
- [ ] Create full-text search indexes for content
- [ ] Implement query performance benchmarks

### Phase 4: Security Implementation ✅
- [ ] Enable Row Level Security on all tables
- [ ] Create user-scoped RLS policies for conversations
- [ ] Create user-scoped RLS policies for messages
- [ ] Create user-scoped RLS policies for message_chunks
- [ ] Create user-scoped RLS policies for attachments
- [ ] Configure Supabase Storage security policies

### Phase 5: Database Functions ✅
- [ ] Implement get_conversation_with_messages function
- [ ] Implement reconstruct_message function
- [ ] Implement cleanup_streaming_artifacts function
- [ ] Create conversation activity update triggers
- [ ] Create document processing status update functions

### Phase 6: Real-time Subscriptions ✅
- [ ] Configure conversation-level subscriptions
- [ ] Configure message-level subscriptions
- [ ] Configure chunk-level subscriptions for streaming
- [ ] Set up document processing status subscriptions
- [ ] Implement connection pooling and rate limiting

### Phase 7: Frontend Integration ✅
- [ ] Create document upload component
- [ ] Create message streaming display component
- [ ] Create conversation list component
- [ ] Implement real-time typing indicators
- [ ] Create document preview and management interface

### Phase 8: Testing Implementation ✅
- [ ] Write unit tests for all database functions
- [ ] Create integration tests for streaming functionality
- [ ] Implement load tests for concurrent users
- [ ] Create document processing pipeline tests
- [ ] Set up automated performance regression tests

### Phase 9: Production Deployment ✅
- [ ] Create migration scripts for schema deployment
- [ ] Set up rollback procedures and contingency plans
- [ ] Configure production monitoring and alerting
- [ ] Implement backup and disaster recovery procedures
- [ ] Document operational procedures and runbooks

### Phase 10: Advanced Features ✅
- [ ] Implement conversation search and filtering
- [ ] Add conversation export and sharing capabilities
- [ ] Create advanced document collaboration features
- [ ] Implement AI-powered conversation summarization
- [ ] Add conversation analytics and insights

## Success Metrics

### Performance Targets
- Sub-100ms message streaming latency
- 99.9% uptime for conversation retrieval
- Support for documents up to 100MB
- Real-time collaboration for multiple users
- Full-text search response under 200ms

### Scalability Goals
- Support 10,000+ concurrent conversations
- Handle 1M+ messages per day
- Process 100GB+ of documents monthly
- Maintain performance with 100+ concurrent users

### User Experience Metrics
- Message delivery success rate > 99.95%
- Document upload success rate > 99.9%
- Real-time update latency < 50ms
- Search response time < 100ms
- Zero data loss tolerance

This comprehensive implementation plan provides a solid foundation for building a production-ready conversation streaming system with document support, designed to scale with your application's growth while maintaining excellent performance and user experience.
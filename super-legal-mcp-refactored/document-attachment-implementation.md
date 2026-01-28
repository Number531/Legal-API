# Document Attachment Implementation Guide for Legal MCP System

## Executive Summary

This implementation guide details how to add document upload and context-aware processing capabilities to the super-legal-mcp-refactored system. The design leverages existing database schemas, maintains atomic operations, and seamlessly integrates with the current conversation bridge architecture while enabling powerful document-enhanced legal research capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema (Already Exists!)](#database-schema-already-exists)
3. [Core Components Implementation](#core-components-implementation)
4. [Integration Points](#integration-points)
5. [API Endpoints](#api-endpoints)
6. [Security and Privacy](#security-and-privacy)
7. [Use Cases and Examples](#use-cases-and-examples)
8. [Performance Considerations](#performance-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Migration Path](#migration-path)

---

## Architecture Overview

### Design Principles

1. **Atomic Operations**: All document operations use single database transactions
2. **Non-blocking Processing**: Document extraction happens asynchronously
3. **Zero-break Integration**: Existing functionality remains unchanged
4. **Privacy-first**: Documents scoped to conversations with RLS
5. **Tool Enhancement**: Legal tools gain document context automatically

### System Flow

```
User Upload → Frontend → API Endpoint → Document Processor → Supabase Storage
                                              ↓
                                    Text Extraction & Indexing
                                              ↓
                                    Database (Atomic Insert)
                                              ↓
                                    Session Context Update
                                              ↓
                                    Tool Enhancement (Context Injection)
                                              ↓
                                    Claude Analysis with Document Awareness
```

### Component Architecture

```javascript
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload UI    │  │ Document     │  │ Search       │     │
│  │ Component    │  │ Viewer       │  │ Interface    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload       │  │ Search       │  │ Analysis     │     │
│  │ Endpoint     │  │ Endpoint     │  │ Endpoint     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 Document Processing Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Document     │  │ Text         │  │ Document     │     │
│  │ Processor    │  │ Extractor    │  │ Indexer      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┐
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer                             │
│  ┌──────────────┐                    ┌──────────────┐      │
│  │ Supabase     │                    │ Supabase     │      │
│  │ Storage      │                    │ Database     │      │
│  │ (Files)      │                    │ (Metadata)   │      │
│  └──────────────┘                    └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Enhanced Tool Execution Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Context      │  │ Document     │  │ Cross-       │     │
│  │ Injection    │  │ Analysis     │  │ Reference    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Already Exists!)

### Existing Tables in `/src/modules/conversation-bridge/supabase/schemas.js`

```sql
-- Table: message_attachments (Already defined!)
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  extracted_content text,  -- Full text for search
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments (message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_status ON message_attachments (processing_status);
CREATE INDEX IF NOT EXISTS idx_attachments_fulltext ON message_attachments USING GIN (to_tsvector('english', extracted_content));

-- Table: document_versions (For tracking changes)
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_attachment_id uuid NOT NULL REFERENCES message_attachments(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  changes_description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_attachment ON document_versions (parent_attachment_id, version_number);
```

### Supabase Storage Bucket Configuration

```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);

-- RLS Policy for document access
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'legal-documents' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'legal-documents' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);
```

---

## Core Components Implementation

### 1. Document Processor Class

Create `/src/modules/document-processor/DocumentProcessor.js`:

```javascript
/**
 * Document Processor for Legal MCP System
 * Handles document upload, extraction, and indexing with atomic operations
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createHash } from 'crypto';
import { PassThrough } from 'stream';

export class DocumentProcessor {
  constructor(supabaseClient, conversationBridge) {
    this.supabase = supabaseClient;
    this.bridge = conversationBridge;
    
    // Configuration
    this.config = {
      supportedFormats: {
        'application/pdf': { extractor: 'pdf', maxSize: 10485760 },
        'application/msword': { extractor: 'docx', maxSize: 10485760 },
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extractor: 'docx', maxSize: 10485760 },
        'text/plain': { extractor: 'text', maxSize: 5242880 },
        'text/markdown': { extractor: 'text', maxSize: 5242880 },
        'text/csv': { extractor: 'csv', maxSize: 5242880 }
      },
      extraction: {
        maxContentLength: 500000,  // 500KB of text
        chunkSize: 5000,  // For chunked processing
        timeout: 30000  // 30 second timeout
      }
    };

    // Extraction strategies
    this.extractors = {
      pdf: this.extractPDF.bind(this),
      docx: this.extractDOCX.bind(this),
      text: this.extractText.bind(this),
      csv: this.extractCSV.bind(this)
    };
  }

  /**
   * Main entry point for document processing
   * Maintains atomic operations throughout
   */
  async processUpload(file, conversationId, messageId, userId = null) {
    const startTime = Date.now();
    
    try {
      // 1. Validate file
      this.validateFile(file);
      
      // 2. Generate secure storage path
      const storagePath = this.generateStoragePath(conversationId, messageId, file.name);
      
      // 3. Upload to Supabase Storage (atomic operation)
      const uploadResult = await this.uploadToStorage(file, storagePath);
      
      // 4. Extract text content (async but tracked)
      const extractedContent = await this.extractContent(file);
      
      // 5. Generate metadata
      const metadata = await this.generateMetadata(file, extractedContent);
      
      // 6. Store in database (atomic operation)
      const attachment = await this.storeAttachment({
        message_id: messageId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: storagePath,
        extracted_content: extractedContent,
        processing_status: 'processed',
        uploaded_by: userId,
        metadata: {
          ...metadata,
          processing_time_ms: Date.now() - startTime,
          storage_url: uploadResult.publicUrl
        }
      });
      
      // 7. Index for search (non-blocking)
      setImmediate(() => this.indexDocument(attachment));
      
      // 8. Log to conversation bridge (non-blocking)
      if (this.bridge && conversationId) {
        setImmediate(() => this.bridge.logToConversationSafe(
          'document_upload',
          { file_name: file.name, file_type: file.type },
          { attachment_id: attachment.id, status: 'success' },
          conversationId
        ));
      }
      
      return attachment;
      
    } catch (error) {
      console.error('Document processing error:', error);
      
      // Store failed attachment record for tracking
      await this.storeAttachment({
        message_id: messageId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: null,
        extracted_content: null,
        processing_status: 'failed',
        uploaded_by: userId,
        metadata: {
          error: error.message,
          processing_time_ms: Date.now() - startTime
        }
      });
      
      throw error;
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file) {
    // Check file exists
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Check file type
    const format = this.config.supportedFormats[file.type];
    if (!format) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: ${Object.keys(this.config.supportedFormats).join(', ')}`);
    }
    
    // Check file size
    if (file.size > format.maxSize) {
      throw new Error(`File too large. Maximum size: ${format.maxSize / 1048576}MB`);
    }
    
    // Check file name
    if (!file.name || file.name.length > 255) {
      throw new Error('Invalid file name');
    }
    
    return true;
  }

  /**
   * Generate secure storage path
   */
  generateStoragePath(conversationId, messageId, fileName) {
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(`${conversationId}-${messageId}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    
    // Sanitize filename
    const safeName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);
    
    return `conversations/${conversationId}/messages/${messageId}/${timestamp}_${hash}_${safeName}`;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadToStorage(file, storagePath) {
    const { data, error } = await this.supabase.storage
      .from('legal-documents')
      .upload(storagePath, file.buffer || file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      });
    
    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    // Get public URL (signed URL for private bucket)
    const { data: urlData } = this.supabase.storage
      .from('legal-documents')
      .createSignedUrl(storagePath, 86400); // 24 hour expiry
    
    return {
      path: data.path,
      publicUrl: urlData?.signedUrl
    };
  }

  /**
   * Extract text content from file
   */
  async extractContent(file) {
    const format = this.config.supportedFormats[file.type];
    if (!format || !format.extractor) {
      return null;
    }
    
    const extractor = this.extractors[format.extractor];
    if (!extractor) {
      console.warn(`No extractor for format: ${format.extractor}`);
      return null;
    }
    
    try {
      // Set timeout for extraction
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extraction timeout')), this.config.extraction.timeout)
      );
      
      const extractionPromise = extractor(file);
      
      const content = await Promise.race([extractionPromise, timeoutPromise]);
      
      // Truncate if too long
      if (content && content.length > this.config.extraction.maxContentLength) {
        return content.substring(0, this.config.extraction.maxContentLength) + '\n[Content truncated]';
      }
      
      return content;
      
    } catch (error) {
      console.error('Content extraction error:', error);
      return null;
    }
  }

  /**
   * PDF extraction
   */
  async extractPDF(file) {
    try {
      const buffer = file.buffer || Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      
      return this.cleanExtractedText(data.text);
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw error;
    }
  }

  /**
   * DOCX extraction
   */
  async extractDOCX(file) {
    try {
      const buffer = file.buffer || Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      
      return this.cleanExtractedText(result.value);
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw error;
    }
  }

  /**
   * Plain text extraction
   */
  async extractText(file) {
    try {
      const buffer = file.buffer || Buffer.from(await file.arrayBuffer());
      const text = buffer.toString('utf-8');
      
      return this.cleanExtractedText(text);
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  /**
   * CSV extraction with structure preservation
   */
  async extractCSV(file) {
    try {
      const buffer = file.buffer || Buffer.from(await file.arrayBuffer());
      const text = buffer.toString('utf-8');
      
      // Parse CSV to identify structure
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim());
      
      // Convert to searchable text while preserving structure
      const structured = {
        headers: headers,
        rowCount: lines.length - 1,
        preview: lines.slice(0, 10).join('\n')
      };
      
      return JSON.stringify(structured, null, 2);
    } catch (error) {
      console.error('CSV extraction error:', error);
      throw error;
    }
  }

  /**
   * Clean extracted text
   */
  cleanExtractedText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
      .replace(/[^\x20-\x7E\n]/g, '')  // Remove non-printable characters
      .trim();
  }

  /**
   * Generate document metadata
   */
  async generateMetadata(file, extractedContent) {
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadTimestamp: new Date().toISOString(),
      contentHash: null,
      wordCount: 0,
      pageCount: null,
      entities: [],
      language: 'en',
      classification: this.classifyDocument(file.name, extractedContent)
    };
    
    if (extractedContent) {
      // Generate content hash for deduplication
      metadata.contentHash = createHash('sha256')
        .update(extractedContent)
        .digest('hex');
      
      // Word count
      metadata.wordCount = extractedContent.split(/\s+/).length;
      
      // Extract entities
      metadata.entities = this.extractEntities(extractedContent);
    }
    
    return metadata;
  }

  /**
   * Extract legal entities from content
   */
  extractEntities(content) {
    const entities = {
      companies: [],
      cases: [],
      statutes: [],
      dates: [],
      amounts: [],
      parties: []
    };
    
    // Company names (simplified pattern)
    const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|LLP|LP|Company|Co)\.?))\b/g;
    const companies = content.match(companyPattern) || [];
    entities.companies = [...new Set(companies)].slice(0, 10);
    
    // Case citations
    const casePattern = /\b(\w+\s+v\.\s+\w+(?:,\s+\d+\s+[A-Z]\.\d+\s+\d+)?)\b/g;
    const cases = content.match(casePattern) || [];
    entities.cases = [...new Set(cases)].slice(0, 10);
    
    // Statute references
    const statutePattern = /\b(\d+\s+U\.S\.C\.\s+§\s*\d+|\d+\s+C\.F\.R\.\s+§\s*\d+)\b/g;
    const statutes = content.match(statutePattern) || [];
    entities.statutes = [...new Set(statutes)].slice(0, 10);
    
    // Dates
    const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{1,2},\s+\d{4})\b/g;
    const dates = content.match(datePattern) || [];
    entities.dates = [...new Set(dates)].slice(0, 10);
    
    // Dollar amounts
    const amountPattern = /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand|M|B|K))?/gi;
    const amounts = content.match(amountPattern) || [];
    entities.amounts = [...new Set(amounts)].slice(0, 10);
    
    return entities;
  }

  /**
   * Classify document type
   */
  classifyDocument(fileName, content) {
    const classifications = {
      contract: /agreement|contract|terms|conditions|party|parties|whereas/i,
      litigation: /plaintiff|defendant|court|motion|brief|complaint|answer/i,
      patent: /patent|invention|claims|embodiment|prior art/i,
      regulatory: /regulation|compliance|section|subsection|cfr|usc/i,
      corporate: /bylaws|incorporation|shareholder|director|meeting/i,
      employment: /employment|employee|employer|compensation|benefits/i,
      nda: /confidential|non-disclosure|proprietary|trade secret/i,
      policy: /policy|procedure|guideline|standard|requirement/i
    };
    
    const fullText = `${fileName} ${content || ''}`;
    
    for (const [type, pattern] of Object.entries(classifications)) {
      if (pattern.test(fullText)) {
        return type;
      }
    }
    
    return 'general';
  }

  /**
   * Store attachment in database (atomic operation)
   */
  async storeAttachment(attachmentData) {
    const { data, error } = await this.supabase
      .from('message_attachments')
      .insert(attachmentData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database storage failed: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Index document for search (async, non-blocking)
   */
  async indexDocument(attachment) {
    if (!attachment.extracted_content) return;
    
    try {
      // Create search vectors
      const searchData = {
        attachment_id: attachment.id,
        content_vector: attachment.extracted_content,
        entities: attachment.metadata?.entities || {},
        classification: attachment.metadata?.classification || 'general',
        indexed_at: new Date().toISOString()
      };
      
      // Store in search index (could be separate table or search service)
      // For now, the extracted_content with GIN index provides full-text search
      
      console.log(`Document indexed: ${attachment.file_name}`);
    } catch (error) {
      console.error('Document indexing error:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Search documents within a conversation
   */
  async searchDocuments(conversationId, query, options = {}) {
    const { limit = 5, includeContent = false } = options;
    
    // Use PostgreSQL full-text search
    const { data, error } = await this.supabase
      .from('message_attachments')
      .select(`
        id,
        file_name,
        file_type,
        created_at,
        metadata,
        ${includeContent ? 'extracted_content' : ''}
      `)
      .eq('message_id', conversationId)
      .textSearch('extracted_content', query)
      .limit(limit);
    
    if (error) {
      console.error('Document search error:', error);
      return [];
    }
    
    return data;
  }

  /**
   * Get all documents for a conversation
   */
  async getConversationDocuments(conversationId) {
    const { data, error } = await this.supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', conversationId)
      .eq('processing_status', 'processed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversation documents:', error);
      return [];
    }
    
    return data;
  }
}
```

### 2. Enhanced Session with Document Support

Create `/src/modules/document-processor/EnhancedSession.js`:

```javascript
/**
 * Enhanced Conversation Session with Document Support
 */

export class DocumentAwareSession {
  constructor(baseSession, supabaseClient) {
    this.session = baseSession;
    this.supabase = supabaseClient;
    this.documentCache = new Map();
    this.documentIndex = new DocumentSearchIndex();
  }

  /**
   * Add document to session context
   */
  async addDocument(attachment) {
    // Cache document
    this.documentCache.set(attachment.id, attachment);
    
    // Update search index
    await this.documentIndex.addDocument({
      id: attachment.id,
      name: attachment.file_name,
      content: attachment.extracted_content,
      metadata: attachment.metadata
    });
    
    // Extract entities and add to session context
    if (attachment.metadata?.entities) {
      this.mergeEntities(attachment.metadata.entities);
    }
    
    // Add to conversation history for context
    this.session.conversationHistory.push({
      role: 'system',
      content: this.formatDocumentContext(attachment)
    });
    
    console.log(`Document added to session: ${attachment.file_name}`);
  }

  /**
   * Format document for conversation context
   */
  formatDocumentContext(attachment) {
    const { file_name, file_type, metadata } = attachment;
    const classification = metadata?.classification || 'document';
    const wordCount = metadata?.wordCount || 0;
    
    let context = `📎 Document uploaded: "${file_name}" (${classification})`;
    
    if (wordCount > 0) {
      context += `\n- Word count: ${wordCount.toLocaleString()}`;
    }
    
    if (metadata?.entities) {
      const { companies, cases, statutes } = metadata.entities;
      if (companies?.length > 0) {
        context += `\n- Companies mentioned: ${companies.slice(0, 3).join(', ')}`;
      }
      if (cases?.length > 0) {
        context += `\n- Cases cited: ${cases.slice(0, 3).join(', ')}`;
      }
      if (statutes?.length > 0) {
        context += `\n- Statutes referenced: ${statutes.slice(0, 3).join(', ')}`;
      }
    }
    
    return context;
  }

  /**
   * Merge extracted entities into session context
   */
  mergeEntities(entities) {
    for (const [type, items] of Object.entries(entities)) {
      if (Array.isArray(items)) {
        items.forEach(item => {
          this.session.researchContext.entities.add(`${type}:${item}`);
        });
      }
    }
  }

  /**
   * Search documents with semantic matching
   */
  async searchDocuments(query, options = {}) {
    const results = await this.documentIndex.search(query, {
      limit: options.limit || 5,
      threshold: options.threshold || 0.7
    });
    
    // Enhance results with snippets
    return results.map(result => {
      const doc = this.documentCache.get(result.id);
      if (!doc) return result;
      
      return {
        ...result,
        fileName: doc.file_name,
        fileType: doc.file_type,
        snippet: this.extractSnippet(doc.extracted_content, query),
        relevanceScore: result.score
      };
    });
  }

  /**
   * Extract relevant snippet from document
   */
  extractSnippet(content, query, contextLength = 200) {
    if (!content) return '';
    
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);
    
    if (index === -1) {
      // If exact match not found, return beginning
      return content.substring(0, contextLength) + '...';
    }
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + queryLower.length + contextLength / 2);
    
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Get document context for tool execution
   */
  async getDocumentContext(toolName, args) {
    const relevantDocs = await this.findRelevantDocuments(toolName, args);
    
    if (relevantDocs.length === 0) return null;
    
    return {
      documentCount: relevantDocs.length,
      documents: relevantDocs.map(doc => ({
        id: doc.id,
        name: doc.file_name,
        type: doc.metadata?.classification,
        preview: doc.extracted_content?.substring(0, 500)
      })),
      fullContent: this.shouldIncludeFullContent(toolName) 
        ? relevantDocs.map(d => d.extracted_content) 
        : null
    };
  }

  /**
   * Find documents relevant to a tool call
   */
  async findRelevantDocuments(toolName, args) {
    // Tool-specific relevance logic
    const relevanceRules = {
      'search_cases': ['litigation', 'contract'],
      'search_sec_filings': ['corporate', 'regulatory'],
      'search_patents': ['patent'],
      'comprehensive_legal_entity_analysis': ['corporate', 'contract'],
      'search_federal_register': ['regulatory', 'policy']
    };
    
    const relevantTypes = relevanceRules[toolName] || [];
    
    const allDocs = Array.from(this.documentCache.values());
    
    return allDocs.filter(doc => {
      const classification = doc.metadata?.classification;
      return relevantTypes.length === 0 || relevantTypes.includes(classification);
    });
  }

  /**
   * Determine if full content should be included
   */
  shouldIncludeFullContent(toolName) {
    const fullContentTools = [
      'comprehensive_legal_entity_analysis',
      'analyze_uploaded_documents',
      'compare_with_precedents'
    ];
    
    return fullContentTools.includes(toolName);
  }
}

/**
 * Simple document search index
 */
class DocumentSearchIndex {
  constructor() {
    this.documents = new Map();
    this.invertedIndex = new Map();
  }

  /**
   * Add document to index
   */
  async addDocument(doc) {
    this.documents.set(doc.id, doc);
    
    // Tokenize and index
    const tokens = this.tokenize(doc.content);
    tokens.forEach(token => {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token).add(doc.id);
    });
  }

  /**
   * Search documents
   */
  async search(query, options = {}) {
    const queryTokens = this.tokenize(query);
    const scores = new Map();
    
    // Calculate relevance scores
    queryTokens.forEach(token => {
      const docIds = this.invertedIndex.get(token) || new Set();
      docIds.forEach(docId => {
        scores.set(docId, (scores.get(docId) || 0) + 1);
      });
    });
    
    // Sort by score and return top results
    const results = Array.from(scores.entries())
      .map(([id, score]) => ({
        id,
        score: score / queryTokens.length,
        document: this.documents.get(id)
      }))
      .filter(r => r.score >= (options.threshold || 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10);
    
    return results;
  }

  /**
   * Simple tokenizer
   */
  tokenize(text) {
    if (!text) return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }
}
```

### 3. Tool Enhancement with Document Context

Create `/src/modules/document-processor/ToolEnhancer.js`:

```javascript
/**
 * Tool Enhancer for Document Context Injection
 */

export class DocumentAwareToolEnhancer {
  constructor(documentProcessor) {
    this.processor = documentProcessor;
  }

  /**
   * Enhance tool with document context
   */
  enhanceToolWithDocuments(toolName, originalTool) {
    return async (args) => {
      // Get document context if conversation_id is provided
      if (args.conversation_id) {
        const documents = await this.processor.getConversationDocuments(args.conversation_id);
        
        if (documents.length > 0) {
          // Add document summaries to args
          args._document_context = {
            count: documents.length,
            summaries: documents.map(d => ({
              id: d.id,
              name: d.file_name,
              type: d.file_type,
              classification: d.metadata?.classification,
              wordCount: d.metadata?.wordCount,
              entities: d.metadata?.entities
            }))
          };
          
          // For specific tools, include full or partial content
          const contentInjection = this.getContentInjectionStrategy(toolName);
          
          if (contentInjection === 'full') {
            args._document_content = documents.map(d => ({
              id: d.id,
              name: d.file_name,
              content: d.extracted_content
            }));
          } else if (contentInjection === 'partial') {
            args._document_excerpts = await this.extractRelevantExcerpts(
              documents, 
              args
            );
          }
          
          // Add cross-reference hints
          args._cross_references = this.generateCrossReferences(documents, toolName);
        }
      }
      
      // Execute original tool with enhanced args
      const result = await originalTool(args);
      
      // Post-process result with document context
      return this.enhanceResultWithDocuments(result, args._document_context);
    };
  }

  /**
   * Determine content injection strategy
   */
  getContentInjectionStrategy(toolName) {
    const strategies = {
      // Full content for analysis tools
      'comprehensive_legal_entity_analysis': 'full',
      'analyze_uploaded_documents': 'full',
      'compare_with_precedents': 'full',
      
      // Partial content for search tools
      'search_cases': 'partial',
      'search_sec_filings': 'partial',
      'search_patents': 'partial',
      
      // No content injection for simple lookups
      'get_case_details': 'none',
      'lookup_citation': 'none'
    };
    
    return strategies[toolName] || 'none';
  }

  /**
   * Extract relevant excerpts from documents
   */
  async extractRelevantExcerpts(documents, args) {
    const excerpts = [];
    
    for (const doc of documents) {
      if (!doc.extracted_content) continue;
      
      // Extract based on query terms if available
      const queryTerms = this.extractQueryTerms(args);
      const relevantParagraphs = this.findRelevantParagraphs(
        doc.extracted_content,
        queryTerms
      );
      
      if (relevantParagraphs.length > 0) {
        excerpts.push({
          documentId: doc.id,
          documentName: doc.file_name,
          excerpts: relevantParagraphs.slice(0, 3)  // Top 3 paragraphs
        });
      }
    }
    
    return excerpts;
  }

  /**
   * Extract query terms from args
   */
  extractQueryTerms(args) {
    const terms = [];
    
    // Common query fields
    const queryFields = ['query', 'search_term', 'keywords', 'company_name', 'case_name'];
    
    queryFields.forEach(field => {
      if (args[field]) {
        const fieldTerms = args[field]
          .toLowerCase()
          .split(/\s+/)
          .filter(t => t.length > 2);
        terms.push(...fieldTerms);
      }
    });
    
    return [...new Set(terms)];
  }

  /**
   * Find relevant paragraphs in content
   */
  findRelevantParagraphs(content, queryTerms) {
    if (!content || queryTerms.length === 0) return [];
    
    const paragraphs = content.split(/\n\n+/);
    const scored = [];
    
    paragraphs.forEach(para => {
      if (para.length < 50) return;  // Skip short paragraphs
      
      const paraLower = para.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        const occurrences = (paraLower.match(new RegExp(term, 'g')) || []).length;
        score += occurrences;
      });
      
      if (score > 0) {
        scored.push({ paragraph: para, score });
      }
    });
    
    // Sort by score and return top paragraphs
    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.paragraph);
  }

  /**
   * Generate cross-references between documents and tool context
   */
  generateCrossReferences(documents, toolName) {
    const references = [];
    
    documents.forEach(doc => {
      const entities = doc.metadata?.entities || {};
      
      // Map entities to tool-specific references
      if (toolName.includes('case') && entities.cases) {
        entities.cases.forEach(caseRef => {
          references.push({
            type: 'case',
            reference: caseRef,
            sourceDocument: doc.file_name
          });
        });
      }
      
      if (toolName.includes('sec') && entities.companies) {
        entities.companies.forEach(company => {
          references.push({
            type: 'company',
            reference: company,
            sourceDocument: doc.file_name
          });
        });
      }
      
      if (toolName.includes('patent') && doc.metadata?.classification === 'patent') {
        references.push({
          type: 'patent',
          reference: doc.file_name,
          sourceDocument: doc.file_name
        });
      }
    });
    
    return references;
  }

  /**
   * Enhance tool result with document references
   */
  enhanceResultWithDocuments(result, documentContext) {
    if (!documentContext || !result) return result;
    
    // Add document context to result metadata
    if (typeof result === 'object' && !Array.isArray(result)) {
      result._document_context = {
        documentsReferenced: documentContext.count,
        documentTypes: [...new Set(documentContext.summaries.map(d => d.classification))]
      };
    }
    
    return result;
  }
}
```

---

## Integration Points

### 1. Server Integration (`claude-server-v2.js`)

```javascript
// Add to imports
import multer from 'multer';
import { DocumentProcessor } from '../modules/document-processor/DocumentProcessor.js';
import { DocumentAwareSession } from '../modules/document-processor/EnhancedSession.js';
import { DocumentAwareToolEnhancer } from '../modules/document-processor/ToolEnhancer.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 5  // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Initialize document processor
const documentProcessor = new DocumentProcessor(supabaseClient, conversationBridge);
const toolEnhancer = new DocumentAwareToolEnhancer(documentProcessor);

// Enhance existing session creation
class EnhancedClaudeLegalResearch extends ClaudeLegalResearch {
  async createSession(sessionId = null) {
    const baseSession = super.createSession(sessionId);
    return new DocumentAwareSession(baseSession, this.supabaseClient);
  }
  
  // Override tool fetching to add document enhancement
  async getMCPTools() {
    const tools = await super.getMCPTools();
    
    // Enhance each tool with document context
    return tools.map(tool => ({
      ...tool,
      _enhanced: true,
      _documentAware: true
    }));
  }
}
```

### 2. Tool Wrapper Enhancement

```javascript
// Enhanced tool implementation wrapper
export function createDocumentAwareToolImplementations(clients, conversationBridge, documentProcessor) {
  const baseImplementations = createToolImplementations(clients, conversationBridge);
  const enhancer = new DocumentAwareToolEnhancer(documentProcessor);
  
  const enhancedImplementations = {};
  
  for (const [toolName, toolImpl] of Object.entries(baseImplementations)) {
    enhancedImplementations[toolName] = enhancer.enhanceToolWithDocuments(
      toolName,
      toolImpl
    );
  }
  
  // Add document-specific tools
  enhancedImplementations.analyze_uploaded_documents = async (args) => {
    const documents = await documentProcessor.getConversationDocuments(args.conversation_id);
    
    if (documents.length === 0) {
      return { message: 'No documents found for analysis' };
    }
    
    // Perform analysis based on document types
    const analysis = {
      documentCount: documents.length,
      documentTypes: {},
      entities: {},
      risks: [],
      recommendations: []
    };
    
    documents.forEach(doc => {
      const type = doc.metadata?.classification || 'unknown';
      analysis.documentTypes[type] = (analysis.documentTypes[type] || 0) + 1;
      
      // Merge entities
      if (doc.metadata?.entities) {
        Object.entries(doc.metadata.entities).forEach(([entityType, items]) => {
          if (!analysis.entities[entityType]) {
            analysis.entities[entityType] = new Set();
          }
          items.forEach(item => analysis.entities[entityType].add(item));
        });
      }
    });
    
    // Convert sets to arrays
    Object.keys(analysis.entities).forEach(key => {
      analysis.entities[key] = Array.from(analysis.entities[key]);
    });
    
    // Identify risks based on document content
    if (analysis.documentTypes.contract > 0) {
      analysis.risks.push('Review contract terms for potential liabilities');
    }
    if (analysis.documentTypes.regulatory > 0) {
      analysis.risks.push('Ensure regulatory compliance requirements are met');
    }
    
    // Generate recommendations
    analysis.recommendations = generateDocumentRecommendations(analysis);
    
    return analysis;
  };
  
  return enhancedImplementations;
}

function generateDocumentRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.entities.companies?.length > 0) {
    recommendations.push(`Run entity analysis on: ${analysis.entities.companies.slice(0, 3).join(', ')}`);
  }
  
  if (analysis.entities.cases?.length > 0) {
    recommendations.push(`Research cited cases: ${analysis.entities.cases.slice(0, 3).join(', ')}`);
  }
  
  if (analysis.documentTypes.contract > 0) {
    recommendations.push('Perform comprehensive contract review for key terms and obligations');
  }
  
  return recommendations;
}
```

---

## API Endpoints

### Document Upload Endpoint

```javascript
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    const { conversationId, messageId } = req.body;
    const file = req.file;
    const userId = req.user?.id || null;  // From auth middleware
    
    if (!file) {
      return res.status(400).json({ 
        error: 'No file provided',
        code: 'MISSING_FILE' 
      });
    }
    
    if (!conversationId || !messageId) {
      return res.status(400).json({ 
        error: 'conversationId and messageId are required',
        code: 'MISSING_PARAMS'
      });
    }
    
    // Process upload
    const attachment = await documentProcessor.processUpload(
      file,
      conversationId,
      messageId,
      userId
    );
    
    // Update session if active
    if (research.sessionManager) {
      const session = research.sessionManager.getSession(conversationId);
      if (session instanceof DocumentAwareSession) {
        await session.addDocument(attachment);
      }
    }
    
    // Return success response
    res.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.file_name,
        fileType: attachment.file_type,
        fileSize: attachment.file_size,
        extractedContentLength: attachment.extracted_content?.length || 0,
        processingStatus: attachment.processing_status,
        classification: attachment.metadata?.classification,
        entities: attachment.metadata?.entities,
        uploadedAt: attachment.created_at
      }
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    
    // Determine error code
    let errorCode = 'UPLOAD_FAILED';
    if (error.message.includes('Unsupported file type')) {
      errorCode = 'UNSUPPORTED_TYPE';
    } else if (error.message.includes('File too large')) {
      errorCode = 'FILE_TOO_LARGE';
    } else if (error.message.includes('Storage')) {
      errorCode = 'STORAGE_ERROR';
    }
    
    res.status(500).json({ 
      error: error.message,
      code: errorCode
    });
  }
});
```

### Document Search Endpoint

```javascript
app.get('/api/documents/search', async (req, res) => {
  try {
    const { conversationId, query, limit = 5 } = req.query;
    
    if (!conversationId || !query) {
      return res.status(400).json({ 
        error: 'conversationId and query are required',
        code: 'MISSING_PARAMS'
      });
    }
    
    // Search in session if available
    const session = research.sessionManager?.getSession(conversationId);
    
    let results;
    if (session instanceof DocumentAwareSession) {
      // Use enhanced session search
      results = await session.searchDocuments(query, { limit });
    } else {
      // Fallback to direct database search
      results = await documentProcessor.searchDocuments(
        conversationId,
        query,
        { limit, includeContent: false }
      );
    }
    
    res.json({
      success: true,
      query,
      resultCount: results.length,
      results: results.map(r => ({
        id: r.id || r.attachment_id,
        fileName: r.fileName || r.file_name,
        fileType: r.fileType || r.file_type,
        relevanceScore: r.relevanceScore || r.score,
        snippet: r.snippet || r.preview
      }))
    });
    
  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'SEARCH_FAILED'
    });
  }
});
```

### Document List Endpoint

```javascript
app.get('/api/documents/list/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const documents = await documentProcessor.getConversationDocuments(conversationId);
    
    res.json({
      success: true,
      conversationId,
      documentCount: documents.length,
      documents: documents.map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        uploadedAt: doc.created_at,
        processingStatus: doc.processing_status,
        hasExtractedContent: !!doc.extracted_content,
        classification: doc.metadata?.classification,
        wordCount: doc.metadata?.wordCount
      }))
    });
    
  } catch (error) {
    console.error('Document list error:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'LIST_FAILED'
    });
  }
});
```

### Document Download Endpoint

```javascript
app.get('/api/documents/download/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get attachment metadata
    const { data: attachment, error } = await supabaseClient
      .from('message_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();
    
    if (error || !attachment) {
      return res.status(404).json({ 
        error: 'Document not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Generate signed URL for download
    const { data: urlData, error: urlError } = supabaseClient.storage
      .from('legal-documents')
      .createSignedUrl(attachment.storage_path, 3600);  // 1 hour expiry
    
    if (urlError || !urlData) {
      return res.status(500).json({ 
        error: 'Failed to generate download URL',
        code: 'URL_GENERATION_FAILED'
      });
    }
    
    res.json({
      success: true,
      downloadUrl: urlData.signedUrl,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      expiresIn: 3600
    });
    
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'DOWNLOAD_FAILED'
    });
  }
});
```

---

## Security and Privacy

### 1. Row Level Security (RLS) Policies

```sql
-- Enable RLS on message_attachments table
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see attachments for their conversations
CREATE POLICY "Users can view their own attachments" ON message_attachments
FOR SELECT USING (
  uploaded_by = auth.uid() OR
  message_id IN (
    SELECT cm.id FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy: Users can only upload to their conversations
CREATE POLICY "Users can upload to their conversations" ON message_attachments
FOR INSERT WITH CHECK (
  message_id IN (
    SELECT cm.id FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update their attachments" ON message_attachments
FOR UPDATE USING (uploaded_by = auth.uid());

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their attachments" ON message_attachments
FOR DELETE USING (uploaded_by = auth.uid());
```

### 2. Content Security

```javascript
// Content sanitization for extracted text
function sanitizeExtractedContent(content) {
  if (!content) return '';
  
  // Remove potential script injections
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove SQL-like patterns
  content = content.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi, '[REDACTED]');
  
  // Remove potential path traversal
  content = content.replace(/\.\.\//g, '');
  
  // Limit maximum length
  if (content.length > 500000) {
    content = content.substring(0, 500000) + '\n[Content truncated for security]';
  }
  
  return content;
}
```

### 3. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// Document upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,  // Maximum 10 uploads per window
  message: 'Too many document uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to upload endpoint
app.post('/api/documents/upload', uploadLimiter, upload.single('document'), async (req, res) => {
  // ... upload logic
});
```

---

## Use Cases and Examples

### Use Case 1: Contract Review with Precedent Analysis

```javascript
// User uploads employment contract
POST /api/documents/upload
{
  conversationId: "conv_123",
  messageId: "msg_456",
  file: employment_contract.pdf
}

// Claude query with document context
"Review my uploaded employment contract and find similar wrongful termination cases in California"

// System flow:
1. Document processor extracts contract terms
2. Session adds document to context
3. Tool 'search_cases' receives document context:
   - Non-compete clause identified
   - Severance terms extracted
   - Arbitration clause noted
4. Tool searches with enhanced query:
   - Original: "wrongful termination California"
   - Enhanced: "wrongful termination California non-compete severance arbitration"
5. Claude provides personalized analysis citing specific contract sections
```

### Use Case 2: Regulatory Compliance Check

```javascript
// User uploads privacy policy
POST /api/documents/upload
{
  conversationId: "conv_789",
  messageId: "msg_012",
  file: privacy_policy.docx
}

// Claude query
"Check if my privacy policy complies with GDPR and CCPA requirements"

// System flow:
1. Extract policy sections
2. Identify data handling practices
3. Tool 'search_federal_register' gets context:
   - Data retention periods mentioned
   - Third-party sharing identified
   - User rights sections found
4. Cross-reference with regulations
5. Generate compliance report with specific gaps
```

### Use Case 3: Patent Prior Art Search

```javascript
// User uploads patent application
POST /api/documents/upload
{
  conversationId: "conv_345",
  messageId: "msg_678",
  file: patent_application.pdf
}

// Claude query
"Find prior art that might affect my patent application"

// System flow:
1. Extract technical claims and descriptions
2. Identify key innovations and methods
3. Tool 'search_patents' enhanced with:
   - Technical terminology from application
   - Specific claim language
   - Field of invention
4. Search USPTO with targeted queries
5. Compare findings with application claims
6. Identify potential conflicts and opportunities
```

### Use Case 4: Multi-Document Analysis

```javascript
// User uploads multiple documents
POST /api/documents/upload (multiple requests)
- merger_agreement.pdf
- due_diligence_report.pdf  
- financial_statements.xlsx

// Claude query
"Analyze the merger documents and identify any red flags or risks"

// Tool: analyze_uploaded_documents
{
  conversation_id: "conv_901",
  analysis_type: "risk_assessment"
}

// Returns comprehensive analysis:
{
  documentCount: 3,
  documentTypes: {
    "contract": 1,
    "corporate": 2
  },
  entities: {
    companies: ["AcquirerCo", "TargetCo", "SubsidiaryCo"],
    amounts: ["$50M", "$2.3M contingent", "$500K escrow"],
    dates: ["March 1, 2024", "December 31, 2024"]
  },
  risks: [
    "Contingent liability of $2.3M identified in due diligence",
    "Change of control provisions may trigger early debt repayment",
    "Environmental compliance issues noted at subsidiary location"
  ],
  recommendations: [
    "Review environmental remediation costs before closing",
    "Negotiate escrow increase to cover contingent liabilities",
    "Obtain lender consent for change of control"
  ]
}
```

---

## Performance Considerations

### 1. Async Processing Pipeline

```javascript
// Non-blocking document processing
async function processDocumentAsync(file, conversationId, messageId) {
  // Immediate response to user
  const placeholder = await createPlaceholderAttachment(file, messageId);
  
  // Process in background
  setImmediate(async () => {
    try {
      // Extract content
      const content = await extractContent(file);
      
      // Update with extracted content
      await updateAttachmentContent(placeholder.id, content);
      
      // Index for search
      await indexDocument(placeholder.id, content);
      
      // Notify session if active
      notifySession(conversationId, placeholder.id);
      
    } catch (error) {
      // Mark as failed
      await markAttachmentFailed(placeholder.id, error);
    }
  });
  
  return placeholder;
}
```

### 2. Caching Strategy

```javascript
class DocumentCache {
  constructor(maxSize = 100, ttl = 3600000) {  // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  set(key, value) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
}
```

### 3. Batch Processing

```javascript
// Batch document operations
async function batchProcessDocuments(documents, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(doc => processDocument(doc))
    );
    
    results.push(...batchResults);
    
    // Brief pause between batches to avoid overload
    if (i + batchSize < documents.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
```

---

## Testing Strategy

### 1. Unit Tests

```javascript
// Test document processor
describe('DocumentProcessor', () => {
  let processor;
  
  beforeEach(() => {
    processor = new DocumentProcessor(mockSupabase, mockBridge);
  });
  
  test('validates file types correctly', () => {
    const validFile = { 
      type: 'application/pdf', 
      size: 1024 * 1024,
      name: 'test.pdf' 
    };
    expect(() => processor.validateFile(validFile)).not.toThrow();
    
    const invalidFile = { 
      type: 'application/exe', 
      size: 1024,
      name: 'test.exe' 
    };
    expect(() => processor.validateFile(invalidFile)).toThrow('Unsupported file type');
  });
  
  test('extracts PDF content', async () => {
    const pdfFile = await loadTestFile('sample.pdf');
    const content = await processor.extractPDF(pdfFile);
    
    expect(content).toContain('expected text from PDF');
    expect(content.length).toBeGreaterThan(0);
  });
  
  test('handles extraction timeout', async () => {
    const largeFile = await loadTestFile('large.pdf');
    processor.config.extraction.timeout = 100; // Very short timeout
    
    const content = await processor.extractContent(largeFile);
    expect(content).toBeNull();
  });
});
```

### 2. Integration Tests

```javascript
// Test document upload flow
describe('Document Upload Integration', () => {
  test('complete upload flow', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .field('conversationId', 'test_conv_123')
      .field('messageId', 'test_msg_456')
      .attach('document', 'test/fixtures/contract.pdf');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.attachment).toHaveProperty('id');
    expect(response.body.attachment.processingStatus).toBe('processed');
    
    // Verify database record
    const attachment = await getAttachment(response.body.attachment.id);
    expect(attachment).toBeDefined();
    expect(attachment.extracted_content).toBeTruthy();
  });
  
  test('tool enhancement with documents', async () => {
    // Upload document first
    const uploadResponse = await uploadTestDocument('test_conv_123');
    
    // Execute tool with document context
    const toolResponse = await executeToolWithContext('search_cases', {
      conversation_id: 'test_conv_123',
      query: 'breach of contract'
    });
    
    // Verify document context was included
    expect(toolResponse._document_context).toBeDefined();
    expect(toolResponse._document_context.count).toBe(1);
  });
});
```

### 3. Performance Tests

```javascript
// Test performance under load
describe('Performance', () => {
  test('handles concurrent uploads', async () => {
    const files = Array(10).fill(null).map((_, i) => ({
      name: `test_${i}.pdf`,
      buffer: generateTestPDF(1024 * 1024)  // 1MB each
    }));
    
    const startTime = Date.now();
    
    const results = await Promise.allSettled(
      files.map(file => processor.processUpload(file, 'conv_1', 'msg_1'))
    );
    
    const duration = Date.now() - startTime;
    
    expect(results.filter(r => r.status === 'fulfilled').length).toBeGreaterThan(8);
    expect(duration).toBeLessThan(30000);  // Should complete in 30 seconds
  });
  
  test('search performance with many documents', async () => {
    // Add 100 documents to conversation
    await seedDocuments('test_conv', 100);
    
    const startTime = Date.now();
    const results = await documentProcessor.searchDocuments(
      'test_conv',
      'contract terms',
      { limit: 10 }
    );
    const duration = Date.now() - startTime;
    
    expect(results.length).toBeLessThanOrEqual(10);
    expect(duration).toBeLessThan(1000);  // Should return in < 1 second
  });
});
```

---

## Migration Path

### Phase 1: Backend Implementation (Week 1)
1. Deploy document processor module
2. Verify Supabase schemas exist
3. Add document upload endpoints
4. Test with Postman/curl

### Phase 2: Tool Enhancement (Week 2)
1. Implement tool enhancer
2. Update tool wrappers
3. Add document-specific tools
4. Test enhanced tool execution

### Phase 3: Session Integration (Week 3)
1. Extend conversation sessions
2. Add document search capabilities
3. Implement cross-referencing
4. Test with real documents

### Phase 4: Frontend Integration (Week 4)
1. Add upload UI components
2. Implement document viewer
3. Add search interface
4. Complete end-to-end testing

### Phase 5: Production Rollout
1. Enable for beta users
2. Monitor performance metrics
3. Gather user feedback
4. Iterate on features

---

## Monitoring and Metrics

### Key Metrics to Track

```javascript
const documentMetrics = {
  // Upload metrics
  uploadsTotal: 0,
  uploadsSuccess: 0,
  uploadsFailed: 0,
  averageUploadTime: 0,
  averageFileSize: 0,
  
  // Extraction metrics
  extractionSuccess: 0,
  extractionFailed: 0,
  averageExtractionTime: 0,
  
  // Search metrics
  searchQueries: 0,
  averageSearchTime: 0,
  averageResultCount: 0,
  
  // Storage metrics
  totalStorageUsed: 0,
  totalDocuments: 0,
  documentsByType: {},
  
  // Tool enhancement metrics
  toolsEnhancedWithDocs: 0,
  averageDocumentContext: 0
};

// Track metrics
function trackDocumentMetric(metric, value) {
  documentMetrics[metric] = value;
  
  // Send to monitoring service
  if (process.env.MONITORING_ENABLED) {
    sendToMonitoring('document_metrics', {
      metric,
      value,
      timestamp: Date.now()
    });
  }
}
```

---

## Conclusion

This implementation provides a comprehensive document attachment system that:

1. **Maintains Atomic Operations**: All database operations remain atomic, avoiding streaming complexity
2. **Leverages Existing Infrastructure**: Uses already-defined database schemas
3. **Enhances Legal Research**: Provides context-aware tool execution
4. **Ensures Security**: Implements RLS, content sanitization, and rate limiting
5. **Optimizes Performance**: Uses async processing, caching, and batch operations
6. **Enables Powerful Use Cases**: Contract review, compliance checking, prior art search, and more

The system seamlessly integrates with the existing conversation bridge architecture while adding significant value through document-enhanced legal research capabilities.

Total implementation effort: ~2-3 weeks for full production deployment.

---

## Implementation Checklist

### Pre-Implementation Verification
- [ ] **Verify Database Access**
  - [ ] Confirm Supabase credentials are configured
  - [ ] Test connection to Supabase
  - [ ] Verify `message_attachments` table exists
  - [ ] Verify `document_versions` table exists
  - [ ] Check storage bucket configuration

- [ ] **Review Current Architecture**
  - [ ] Understand conversation bridge implementation
  - [ ] Review existing tool wrapper pattern
  - [ ] Check session management implementation
  - [ ] Identify integration points in `claude-server-v2.js`

### Phase 1: Core Infrastructure (Days 1-3)

#### Day 1: Document Processor Setup
- [ ] **Create Document Processor Module**
  - [ ] Create `/src/modules/document-processor/` directory
  - [ ] Implement `DocumentProcessor.js` class
  - [ ] Add PDF extraction with `pdf-parse`
  - [ ] Add DOCX extraction with `mammoth`
  - [ ] Add plain text and CSV extractors
  - [ ] Implement content sanitization functions

- [ ] **Install Required Dependencies**
  ```bash
  npm install pdf-parse mammoth multer express-rate-limit
  ```

- [ ] **Configure Supabase Storage**
  - [ ] Create `legal-documents` bucket in Supabase
  - [ ] Set bucket permissions (private)
  - [ ] Configure file size limits (10MB)
  - [ ] Set allowed MIME types

#### Day 2: Database and Storage Integration
- [ ] **Implement Storage Functions**
  - [ ] `uploadToStorage()` method
  - [ ] `generateStoragePath()` with secure naming
  - [ ] Signed URL generation for downloads
  - [ ] Storage error handling

- [ ] **Implement Database Operations**
  - [ ] `storeAttachment()` with atomic insert
  - [ ] `getConversationDocuments()` query
  - [ ] `searchDocuments()` with full-text search
  - [ ] Add database indexes for performance

- [ ] **Add Metadata Generation**
  - [ ] Content hash generation
  - [ ] Entity extraction (companies, cases, statutes)
  - [ ] Document classification logic
  - [ ] Word count and statistics

#### Day 3: Testing Core Functions
- [ ] **Unit Test Document Processor**
  - [ ] Test file validation
  - [ ] Test each extractor (PDF, DOCX, text, CSV)
  - [ ] Test metadata generation
  - [ ] Test error handling
  - [ ] Test timeout handling

- [ ] **Integration Test Storage**
  - [ ] Test file upload to Supabase
  - [ ] Test signed URL generation
  - [ ] Test large file handling
  - [ ] Test concurrent uploads

### Phase 2: Session Enhancement (Days 4-6)

#### Day 4: Enhanced Session Implementation
- [ ] **Create Enhanced Session Classes**
  - [ ] Implement `EnhancedSession.js`
  - [ ] Create `DocumentAwareSession` class
  - [ ] Implement `DocumentSearchIndex` class
  - [ ] Add document caching logic

- [ ] **Implement Session Methods**
  - [ ] `addDocument()` to session context
  - [ ] `searchDocuments()` within session
  - [ ] `getDocumentContext()` for tools
  - [ ] `extractSnippet()` for previews

#### Day 5: Session Integration
- [ ] **Integrate with Existing Sessions**
  - [ ] Modify `ConversationSession` in `claude-server-v2.js`
  - [ ] Update session creation logic
  - [ ] Add document tracking to memory management
  - [ ] Test session persistence

- [ ] **Add Entity Management**
  - [ ] Merge document entities with session entities
  - [ ] Track document references across conversation
  - [ ] Implement entity deduplication

#### Day 6: Session Testing
- [ ] **Test Session Functions**
  - [ ] Test document addition to session
  - [ ] Test document search within session
  - [ ] Test memory limits with documents
  - [ ] Test session cleanup with documents

### Phase 3: Tool Enhancement (Days 7-9)

#### Day 7: Tool Enhancer Implementation
- [ ] **Create Tool Enhancement Module**
  - [ ] Implement `ToolEnhancer.js`
  - [ ] Create `DocumentAwareToolEnhancer` class
  - [ ] Define content injection strategies
  - [ ] Implement cross-reference generation

- [ ] **Implement Enhancement Methods**
  - [ ] `enhanceToolWithDocuments()` wrapper
  - [ ] `extractRelevantExcerpts()` for context
  - [ ] `generateCrossReferences()` logic
  - [ ] `enhanceResultWithDocuments()` for output

#### Day 8: Tool Integration
- [ ] **Update Tool Implementations**
  - [ ] Modify `toolImplementations.js`
  - [ ] Wrap all 89 tools with document enhancement
  - [ ] Add document-specific tools:
    - [ ] `analyze_uploaded_documents`
    - [ ] `compare_with_precedents`
    - [ ] `extract_document_entities`
  - [ ] Test enhanced tool execution

- [ ] **Configure Tool Strategies**
  - [ ] Define which tools get full content
  - [ ] Define which tools get partial content
  - [ ] Configure relevance matching rules

#### Day 9: Tool Testing
- [ ] **Test Enhanced Tools**
  - [ ] Test tools with document context
  - [ ] Test document-specific tools
  - [ ] Test cross-referencing
  - [ ] Verify no performance degradation

### Phase 4: API Endpoints (Days 10-12)

#### Day 10: Upload Endpoints
- [ ] **Implement Upload Endpoint**
  - [ ] Add `POST /api/documents/upload`
  - [ ] Configure multer middleware
  - [ ] Add file validation
  - [ ] Implement error responses

- [ ] **Add Rate Limiting**
  - [ ] Configure upload rate limiter
  - [ ] Set appropriate limits (10 uploads/15min)
  - [ ] Test rate limiting

#### Day 11: Query Endpoints
- [ ] **Implement Search Endpoint**
  - [ ] Add `GET /api/documents/search`
  - [ ] Implement query parsing
  - [ ] Add result formatting
  - [ ] Test search functionality

- [ ] **Implement List Endpoint**
  - [ ] Add `GET /api/documents/list/:conversationId`
  - [ ] Format document metadata
  - [ ] Add pagination support
  - [ ] Test listing functionality

- [ ] **Implement Download Endpoint**
  - [ ] Add `GET /api/documents/download/:attachmentId`
  - [ ] Generate signed URLs
  - [ ] Add security checks
  - [ ] Test download functionality

#### Day 12: API Testing
- [ ] **End-to-End API Tests**
  - [ ] Test complete upload flow
  - [ ] Test search with various queries
  - [ ] Test download with signed URLs
  - [ ] Test error handling
  - [ ] Test concurrent operations

### Phase 5: Security Implementation (Days 13-14)

#### Day 13: Security Policies
- [ ] **Implement RLS Policies**
  - [ ] Enable RLS on `message_attachments`
  - [ ] Create SELECT policy
  - [ ] Create INSERT policy
  - [ ] Create UPDATE/DELETE policies
  - [ ] Test policy enforcement

- [ ] **Add Content Security**
  - [ ] Implement content sanitization
  - [ ] Add script injection prevention
  - [ ] Add SQL injection prevention
  - [ ] Add path traversal prevention

#### Day 14: Security Testing
- [ ] **Security Audit**
  - [ ] Test file type validation
  - [ ] Test file size limits
  - [ ] Test malicious content handling
  - [ ] Test unauthorized access attempts
  - [ ] Test rate limiting effectiveness

### Phase 6: Integration Testing (Days 15-17)

#### Day 15: Integration with Claude
- [ ] **Update Claude Server**
  - [ ] Modify `claude-server-v2.js`
  - [ ] Add document processor initialization
  - [ ] Update session creation
  - [ ] Test Claude with documents

- [ ] **Update System Prompts**
  - [ ] Add document awareness to prompts
  - [ ] Include document reference guidelines
  - [ ] Test prompt effectiveness

#### Day 16: End-to-End Workflows
- [ ] **Test Complete Use Cases**
  - [ ] Contract review workflow
  - [ ] Compliance check workflow
  - [ ] Patent search workflow
  - [ ] Multi-document analysis

- [ ] **Performance Testing**
  - [ ] Test with large documents (5-10MB)
  - [ ] Test with many documents (50+)
  - [ ] Measure response times
  - [ ] Check memory usage

#### Day 17: Bug Fixes and Optimization
- [ ] **Address Issues Found**
  - [ ] Fix any bugs discovered
  - [ ] Optimize slow operations
  - [ ] Improve error messages
  - [ ] Update documentation

### Phase 7: Frontend Integration (Days 18-20)

#### Day 18: Upload UI
- [ ] **Create Upload Component**
  - [ ] Design file upload interface
  - [ ] Add drag-and-drop support
  - [ ] Show upload progress
  - [ ] Display success/error states

#### Day 19: Document Management UI
- [ ] **Create Document List**
  - [ ] Display uploaded documents
  - [ ] Add search interface
  - [ ] Include download buttons
  - [ ] Show document metadata

- [ ] **Add Document Preview**
  - [ ] Display extracted content
  - [ ] Show document entities
  - [ ] Highlight search matches

#### Day 20: Frontend Testing
- [ ] **Test UI Components**
  - [ ] Test file upload flow
  - [ ] Test document search
  - [ ] Test download functionality
  - [ ] Test error handling
  - [ ] Test responsive design

### Phase 8: Production Preparation (Days 21)

#### Production Checklist
- [ ] **Documentation**
  - [ ] Update API documentation
  - [ ] Create user guide
  - [ ] Document troubleshooting steps
  - [ ] Add code comments

- [ ] **Monitoring Setup**
  - [ ] Add logging for uploads
  - [ ] Track extraction metrics
  - [ ] Monitor storage usage
  - [ ] Set up alerts

- [ ] **Performance Optimization**
  - [ ] Enable caching where appropriate
  - [ ] Optimize database queries
  - [ ] Implement connection pooling
  - [ ] Test under load

- [ ] **Deployment Preparation**
  - [ ] Update environment variables
  - [ ] Verify production database
  - [ ] Test backup procedures
  - [ ] Create rollback plan

### Post-Implementation Tasks

- [ ] **User Training**
  - [ ] Create training materials
  - [ ] Conduct user sessions
  - [ ] Gather initial feedback
  - [ ] Document FAQs

- [ ] **Monitoring & Iteration**
  - [ ] Monitor system performance
  - [ ] Track usage metrics
  - [ ] Collect user feedback
  - [ ] Plan improvements

- [ ] **Future Enhancements**
  - [ ] OCR for scanned documents
  - [ ] Support for more file types
  - [ ] Advanced entity extraction
  - [ ] Document comparison tools
  - [ ] Batch upload interface

### Success Metrics

- [ ] **Functional Success**
  - [ ] All file types upload successfully
  - [ ] Text extraction works for 95%+ of documents
  - [ ] Search returns relevant results
  - [ ] Tools receive document context

- [ ] **Performance Metrics**
  - [ ] Upload completes in < 5 seconds for 5MB files
  - [ ] Search returns results in < 1 second
  - [ ] No memory leaks after 100+ uploads
  - [ ] System remains responsive under load

- [ ] **Security Metrics**
  - [ ] No unauthorized access to documents
  - [ ] All uploads properly sanitized
  - [ ] Rate limiting prevents abuse
  - [ ] RLS policies enforced correctly

- [ ] **User Experience**
  - [ ] Intuitive upload interface
  - [ ] Clear progress indicators
  - [ ] Helpful error messages
  - [ ] Seamless integration with legal research

### Risk Mitigation

- [ ] **Backup Plans**
  - [ ] Regular database backups configured
  - [ ] Document storage backups enabled
  - [ ] Code version control maintained
  - [ ] Rollback procedures documented

- [ ] **Contingency Planning**
  - [ ] Fallback for extraction failures
  - [ ] Manual review process for failed documents
  - [ ] Support contact for issues
  - [ ] Escalation procedures defined

---

This checklist provides a comprehensive step-by-step implementation plan that can be tracked and managed throughout the development process.
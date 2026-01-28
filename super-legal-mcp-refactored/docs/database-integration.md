# Database Integration for Claude Agent SDK Session Persistence

> Best practices and implementation patterns for seamless database integration with Claude Agent SDK sessions. Compiled from Anthropic documentation and cookbook examples as of January 2026.

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture Tiers](#storage-architecture-tiers)
3. [SQLite Implementation (Development/Simple Deployments)](#sqlite-implementation)
4. [Session Manager Class](#session-manager-class)
5. [Integration with /api/stream Endpoint](#integration-with-apistream-endpoint)
6. [Production: PostgreSQL + Redis Hybrid](#production-postgresql--redis-hybrid)
7. [Environment Configuration](#environment-configuration)
8. [Key Recommendations](#key-recommendations)
9. [Reconnection and Retry Logic](#reconnection-and-retry-logic)

---

## Overview

The Claude Agent SDK supports session resumption via the `resume` option, but persistent storage of session state requires custom implementation. This document outlines patterns for:

- Persisting session state across server restarts
- Resuming interrupted sessions after disconnects
- Archiving completed sessions for audit/analytics
- Scaling from development to production

---

## Storage Architecture Tiers

### Development - Simple Local Persistence

```javascript
{
  everything: SQLite  // Single file, no external dependencies
}
```

### Production - Layered Approach

```javascript
{
  sessions: Redis,             // Fast access for active sessions
  data: PostgreSQL,            // Persistent storage for completed sessions
  vectors: PostgreSQLVector    // AI features (embeddings, if needed)
}
```

---

## SQLite Implementation

Best for development and simple deployments. Uses `better-sqlite3` for synchronous, high-performance operations.

### Installation

```bash
npm install better-sqlite3
```

### Schema Initialization

```javascript
// src/utils/sessionPersistence.js

import Database from 'better-sqlite3';

const SESSION_DB_PATH = process.env.SESSION_DB_PATH || './data/sessions.db';

// Initialize SQLite database
const db = new Database(SESSION_DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT,
    conversation_history TEXT,  -- JSON blob
    accumulated_text TEXT,
    total_usage TEXT,           -- JSON blob
    total_turns INTEGER DEFAULT 0,
    continuation_attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_stop_reason TEXT,
    is_complete BOOLEAN DEFAULT FALSE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
`);

// Prepared statements for session operations
const sessionStore = {
  save: db.prepare(`
    INSERT OR REPLACE INTO sessions
    (id, user_id, prompt, conversation_history, accumulated_text, total_usage,
     total_turns, continuation_attempts, updated_at, last_stop_reason, is_complete)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `),

  load: db.prepare(`SELECT * FROM sessions WHERE id = ?`),

  listByUser: db.prepare(`
    SELECT id, prompt, created_at, updated_at, total_turns, is_complete
    FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50
  `),

  cleanup: db.prepare(`
    DELETE FROM sessions WHERE updated_at < datetime('now', ?) AND is_complete = TRUE
  `)
};

export { db, sessionStore };
```

---

## Session Manager Class

A full-featured session manager with compression support for large text fields.

### Installation

```bash
npm install better-sqlite3
# zlib is built into Node.js
```

### Implementation

```javascript
// src/utils/sessionPersistence.js

import Database from 'better-sqlite3';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const compress = promisify(gzip);
const decompress = promisify(gunzip);

export class SessionManager {
  constructor(dbPath = './data/sessions.db') {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');  // Better concurrent access
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      -- Main sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        prompt TEXT,
        conversation_history BLOB,  -- Compressed JSON
        accumulated_text BLOB,      -- Compressed (can be very large)
        metadata TEXT,              -- JSON blob for flexible fields
        total_usage_input INTEGER DEFAULT 0,
        total_usage_output INTEGER DEFAULT 0,
        total_usage_cache_read INTEGER DEFAULT 0,
        total_usage_cache_creation INTEGER DEFAULT 0,
        total_turns INTEGER DEFAULT 0,
        continuation_attempts INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_stop_reason TEXT,
        status TEXT DEFAULT 'active'  -- active, complete, error, abandoned
      );

      -- Checkpoints for long-running sessions (supports rewind)
      CREATE TABLE IF NOT EXISTS session_checkpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        checkpoint_id TEXT NOT NULL,
        turn_number INTEGER,
        accumulated_text_snapshot BLOB,  -- Compressed
        usage_snapshot TEXT,             -- JSON
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      -- Indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
      CREATE INDEX IF NOT EXISTS idx_checkpoints_session ON session_checkpoints(session_id);
      CREATE INDEX IF NOT EXISTS idx_checkpoints_id ON session_checkpoints(checkpoint_id);
    `);
  }

  /**
   * Save or update a session
   */
  async saveSession(session) {
    const compressedHistory = session.conversationHistory?.length
      ? await compress(JSON.stringify(session.conversationHistory))
      : null;
    const compressedText = session.accumulatedText
      ? await compress(session.accumulatedText)
      : null;

    this.db.prepare(`
      INSERT INTO sessions
      (id, user_id, prompt, conversation_history, accumulated_text, metadata,
       total_usage_input, total_usage_output, total_usage_cache_read,
       total_usage_cache_creation, total_turns, continuation_attempts,
       updated_at, last_stop_reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        conversation_history = excluded.conversation_history,
        accumulated_text = excluded.accumulated_text,
        metadata = excluded.metadata,
        total_usage_input = excluded.total_usage_input,
        total_usage_output = excluded.total_usage_output,
        total_usage_cache_read = excluded.total_usage_cache_read,
        total_usage_cache_creation = excluded.total_usage_cache_creation,
        total_turns = excluded.total_turns,
        continuation_attempts = excluded.continuation_attempts,
        updated_at = datetime('now'),
        last_stop_reason = excluded.last_stop_reason,
        status = excluded.status
    `).run(
      session.id,
      session.userId || null,
      session.prompt || null,
      compressedHistory,
      compressedText,
      JSON.stringify(session.metadata || {}),
      session.totalUsage?.input_tokens || 0,
      session.totalUsage?.output_tokens || 0,
      session.totalUsage?.cache_read_input_tokens || 0,
      session.totalUsage?.cache_creation_input_tokens || 0,
      session.totalTurns || 0,
      session.continuationAttempts || 0,
      session.lastStopReason || null,
      session.status || 'active'
    );

    return session.id;
  }

  /**
   * Load a session by ID
   */
  async loadSession(sessionId) {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!row) return null;

    let conversationHistory = [];
    let accumulatedText = '';

    try {
      if (row.conversation_history) {
        conversationHistory = JSON.parse(
          (await decompress(row.conversation_history)).toString()
        );
      }
      if (row.accumulated_text) {
        accumulatedText = (await decompress(row.accumulated_text)).toString();
      }
    } catch (err) {
      console.warn(`Failed to decompress session ${sessionId}:`, err.message);
    }

    return {
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      conversationHistory,
      accumulatedText,
      metadata: JSON.parse(row.metadata || '{}'),
      totalUsage: {
        input_tokens: row.total_usage_input,
        output_tokens: row.total_usage_output,
        cache_read_input_tokens: row.total_usage_cache_read,
        cache_creation_input_tokens: row.total_usage_cache_creation
      },
      totalTurns: row.total_turns,
      continuationAttempts: row.continuation_attempts,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastStopReason: row.last_stop_reason,
      status: row.status
    };
  }

  /**
   * Create a checkpoint for potential rewind
   */
  async createCheckpoint(sessionId, checkpointId, turnNumber, textSnapshot, usageSnapshot) {
    const compressed = await compress(textSnapshot || '');
    this.db.prepare(`
      INSERT INTO session_checkpoints
      (session_id, checkpoint_id, turn_number, accumulated_text_snapshot, usage_snapshot)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      sessionId,
      checkpointId,
      turnNumber,
      compressed,
      JSON.stringify(usageSnapshot || {})
    );
  }

  /**
   * Get a specific checkpoint
   */
  async getCheckpoint(sessionId, checkpointId) {
    const row = this.db.prepare(`
      SELECT * FROM session_checkpoints
      WHERE session_id = ? AND checkpoint_id = ?
    `).get(sessionId, checkpointId);

    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      checkpointId: row.checkpoint_id,
      turnNumber: row.turn_number,
      accumulatedTextSnapshot: row.accumulated_text_snapshot
        ? (await decompress(row.accumulated_text_snapshot)).toString()
        : '',
      usageSnapshot: JSON.parse(row.usage_snapshot || '{}'),
      createdAt: row.created_at
    };
  }

  /**
   * List all checkpoints for a session
   */
  listCheckpoints(sessionId) {
    return this.db.prepare(`
      SELECT id, checkpoint_id, turn_number, created_at
      FROM session_checkpoints
      WHERE session_id = ?
      ORDER BY turn_number ASC
    `).all(sessionId);
  }

  /**
   * List sessions for a user
   */
  listUserSessions(userId, limit = 50) {
    return this.db.prepare(`
      SELECT id, prompt, status, total_turns,
             total_usage_input + total_usage_output as total_tokens,
             created_at, updated_at
      FROM sessions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  /**
   * Get active (resumable) sessions
   */
  getActiveSessions(userId = null) {
    if (userId) {
      return this.db.prepare(`
        SELECT id, prompt, total_turns, updated_at
        FROM sessions
        WHERE user_id = ? AND status = 'active'
        ORDER BY updated_at DESC
      `).all(userId);
    }
    return this.db.prepare(`
      SELECT id, user_id, prompt, total_turns, updated_at
      FROM sessions
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT 100
    `).all();
  }

  /**
   * Mark session as complete
   */
  markComplete(sessionId, status = 'complete') {
    this.db.prepare(`
      UPDATE sessions SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, sessionId);
  }

  /**
   * Cleanup old completed sessions
   */
  cleanupOldSessions(maxAgeDays = 30) {
    const result = this.db.prepare(`
      DELETE FROM sessions
      WHERE updated_at < datetime('now', '-' || ? || ' days')
      AND status IN ('complete', 'error', 'abandoned')
    `).run(maxAgeDays);

    console.log(`Cleaned up ${result.changes} old sessions`);
    return result.changes;
  }

  /**
   * Get session statistics
   */
  getStats() {
    return this.db.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(total_usage_input) as total_input_tokens,
        SUM(total_usage_output) as total_output_tokens,
        AVG(total_turns) as avg_turns_per_session
      FROM sessions
    `).get();
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

// Singleton instance
let _instance = null;

export function getSessionManager(dbPath) {
  if (!_instance) {
    _instance = new SessionManager(dbPath);
  }
  return _instance;
}
```

---

## Integration with /api/stream Endpoint

Add session persistence to the existing streaming endpoint in `claude-sdk-server.js`.

### Import and Initialize

```javascript
// At top of claude-sdk-server.js, add:
import { getSessionManager } from '../utils/sessionPersistence.js';

// After other initializations (around line 94):
const sessionManager = getSessionManager(process.env.SESSION_DB_PATH);
```

### Modify the Stream Handler

```javascript
// Inside app.all('/api/stream', ...)
// After line 786 (let lastSessionId = null;), add:

// Load existing session if resuming
let persistedSession = null;
if (resumeSessionId) {
  try {
    persistedSession = await sessionManager.loadSession(resumeSessionId);
    if (persistedSession) {
      accumulatedText = persistedSession.accumulatedText || '';
      totalUsage = persistedSession.totalUsage || {
        input_tokens: 0, output_tokens: 0,
        cache_read_input_tokens: 0, cache_creation_input_tokens: 0
      };
      totalTurns = persistedSession.totalTurns || 0;
      continuationAttempt = persistedSession.continuationAttempts || 0;

      console.log(`📂 [Session] Loaded persisted session: ${resumeSessionId}`);
      console.log(`   Turns: ${totalTurns}, Tokens: ${totalUsage.input_tokens + totalUsage.output_tokens}`);

      send({
        type: 'session_restored',
        session_id: resumeSessionId,
        turns: totalTurns,
        tokens: totalUsage.input_tokens + totalUsage.output_tokens,
        continuation_attempts: continuationAttempt
      });
    }
  } catch (err) {
    console.warn(`Failed to load session ${resumeSessionId}:`, err.message);
  }
}
```

### Save After Each Turn

```javascript
// Inside the while (shouldContinue) loop, after processing resultMessage (around line 915)
// Add session persistence:

if (resultMessage) {
  // ... existing result processing ...

  // Persist session state after each turn
  try {
    await sessionManager.saveSession({
      id: lastSessionId,
      userId: req.headers['x-user-id'] || req.body?.user_id || 'anonymous',
      prompt: userQuery,
      accumulatedText,
      totalUsage,
      totalTurns,
      continuationAttempts: continuationAttempt,
      lastStopReason,
      status: shouldContinue ? 'active' : (isTruncated ? 'incomplete' : 'complete'),
      metadata: {
        model: MODEL,
        endpoint: '/api/stream',
        truncation_info: {
          detected: isTruncated,
          by_stop_reason: isTruncatedByStopReason,
          by_pattern: isTruncatedByPattern,
          by_token_limit: outputTokensNearMax
        }
      }
    });

    // Notify client of persistence
    send({
      type: 'session_persisted',
      session_id: lastSessionId,
      turns: totalTurns,
      can_resume: true
    });

    // Create checkpoint every 5 turns for long sessions
    if (totalTurns % 5 === 0) {
      await sessionManager.createCheckpoint(
        lastSessionId,
        `checkpoint-${totalTurns}`,
        totalTurns,
        accumulatedText,
        totalUsage
      );
    }
  } catch (err) {
    console.warn(`Failed to persist session ${lastSessionId}:`, err.message);
  }
}
```

### Add Session Management Endpoints

```javascript
// Add new endpoints for session management

// List user's sessions
app.get('/api/sessions', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const sessions = sessionManager.listUserSessions(userId);
  res.json({ sessions });
});

// Get session details
app.get('/api/sessions/:id', async (req, res) => {
  const session = await sessionManager.loadSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Don't return full accumulated text in list view
  const { accumulatedText, conversationHistory, ...summary } = session;
  summary.text_length = accumulatedText?.length || 0;
  summary.history_length = conversationHistory?.length || 0;

  res.json(summary);
});

// Get session checkpoints
app.get('/api/sessions/:id/checkpoints', (req, res) => {
  const checkpoints = sessionManager.listCheckpoints(req.params.id);
  res.json({ checkpoints });
});

// Get active sessions (admin)
app.get('/api/sessions/active', (req, res) => {
  const sessions = sessionManager.getActiveSessions();
  res.json({ sessions });
});

// Get session statistics
app.get('/api/sessions/stats', (req, res) => {
  const stats = sessionManager.getStats();
  res.json(stats);
});
```

---

## Production: PostgreSQL + Redis Hybrid

For high-scale deployments, use Redis for active sessions and PostgreSQL for archival.

### Installation

```bash
npm install pg ioredis
```

### Implementation

```javascript
// src/utils/sessionPersistenceProduction.js

import { Pool } from 'pg';
import Redis from 'ioredis';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const compress = promisify(gzip);
const decompress = promisify(gunzip);

export class ProductionSessionManager {
  constructor() {
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });

    this.SESSION_TTL = 86400; // 24 hours for active sessions
  }

  async initSchema() {
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS archived_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        prompt TEXT,
        accumulated_text BYTEA,
        total_usage JSONB,
        total_turns INTEGER DEFAULT 0,
        continuation_attempts INTEGER DEFAULT 0,
        last_stop_reason TEXT,
        status TEXT DEFAULT 'complete',
        metadata JSONB,
        created_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_archived_user ON archived_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_archived_status ON archived_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_archived_completed ON archived_sessions(completed_at);
    `);
  }

  /**
   * Save active session to Redis
   */
  async saveActiveSession(session) {
    const serialized = JSON.stringify({
      ...session,
      accumulatedText: session.accumulatedText
        ? (await compress(session.accumulatedText)).toString('base64')
        : null
    });

    await this.redis.setex(
      `session:${session.id}`,
      this.SESSION_TTL,
      serialized
    );
  }

  /**
   * Load active session from Redis
   */
  async loadActiveSession(sessionId) {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    if (session.accumulatedText) {
      session.accumulatedText = (
        await decompress(Buffer.from(session.accumulatedText, 'base64'))
      ).toString();
    }

    return session;
  }

  /**
   * Archive completed session to PostgreSQL
   */
  async archiveSession(session) {
    const compressedText = session.accumulatedText
      ? await compress(session.accumulatedText)
      : null;

    await this.pgPool.query(`
      INSERT INTO archived_sessions
      (id, user_id, prompt, accumulated_text, total_usage, total_turns,
       continuation_attempts, last_stop_reason, status, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        accumulated_text = EXCLUDED.accumulated_text,
        total_usage = EXCLUDED.total_usage,
        total_turns = EXCLUDED.total_turns,
        status = EXCLUDED.status,
        completed_at = NOW()
    `, [
      session.id,
      session.userId,
      session.prompt,
      compressedText,
      JSON.stringify(session.totalUsage),
      session.totalTurns,
      session.continuationAttempts,
      session.lastStopReason,
      session.status,
      JSON.stringify(session.metadata || {}),
      session.createdAt
    ]);

    // Remove from Redis after archiving
    await this.redis.del(`session:${session.id}`);
  }

  /**
   * Load session - tries Redis first, then PostgreSQL
   */
  async loadSession(sessionId) {
    // Try Redis first (active sessions)
    let session = await this.loadActiveSession(sessionId);
    if (session) return session;

    // Fall back to PostgreSQL (archived sessions)
    const result = await this.pgPool.query(
      'SELECT * FROM archived_sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      accumulatedText: row.accumulated_text
        ? (await decompress(row.accumulated_text)).toString()
        : '',
      totalUsage: row.total_usage,
      totalTurns: row.total_turns,
      continuationAttempts: row.continuation_attempts,
      lastStopReason: row.last_stop_reason,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
      completedAt: row.completed_at
    };
  }

  /**
   * Extend TTL for active session (call on each interaction)
   */
  async touchSession(sessionId) {
    await this.redis.expire(`session:${sessionId}`, this.SESSION_TTL);
  }

  /**
   * List user's archived sessions
   */
  async listArchivedSessions(userId, limit = 50) {
    const result = await this.pgPool.query(`
      SELECT id, prompt, status, total_turns, total_usage,
             created_at, completed_at
      FROM archived_sessions
      WHERE user_id = $1
      ORDER BY completed_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Get active session IDs for a user
   */
  async getActiveSessionIds(userId) {
    const keys = await this.redis.keys(`session:*`);
    const activeSessions = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          activeSessions.push({
            id: session.id,
            prompt: session.prompt?.substring(0, 100),
            totalTurns: session.totalTurns,
            updatedAt: session.updatedAt
          });
        }
      }
    }

    return activeSessions;
  }

  /**
   * Cleanup old archived sessions
   */
  async cleanupArchived(maxAgeDays = 90) {
    const result = await this.pgPool.query(`
      DELETE FROM archived_sessions
      WHERE completed_at < NOW() - INTERVAL '${maxAgeDays} days'
      RETURNING id
    `);

    return result.rowCount;
  }

  /**
   * Close connections
   */
  async close() {
    await this.redis.quit();
    await this.pgPool.end();
  }
}
```

---

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Session Storage Configuration
SESSION_STORAGE_TYPE=sqlite              # sqlite | postgres | redis-postgres

# SQLite (Development)
SESSION_DB_PATH=./data/sessions.db

# PostgreSQL (Production)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Production - for active sessions)
REDIS_URL=redis://localhost:6379

# Cleanup Settings
SESSION_CLEANUP_DAYS=30                  # Auto-cleanup threshold for completed sessions
SESSION_CHECKPOINT_INTERVAL=5            # Create checkpoint every N turns

# Compression
SESSION_COMPRESS_THRESHOLD=1000          # Compress text larger than N chars
```

---

## Key Recommendations

### From Anthropic Documentation and Cookbook

1. **Compress Large Text Fields**
   - Accumulated text can exceed 100,000 characters
   - Use gzip compression for storage efficiency
   - Decompress on load

2. **Use Checkpoints for Long-Running Sessions**
   - Create periodic snapshots during auto-continuation
   - Enables "rewind" functionality
   - Store at meaningful intervals (every 5 turns)

3. **Index Critical Fields**
   - `user_id` - for user session lookups
   - `updated_at` - for sorting and cleanup
   - `status` - for filtering active/complete sessions

4. **Separate Active vs Archived**
   - Redis for sub-second access to active sessions
   - PostgreSQL for durable archival
   - Move to archive on completion

5. **Include Flexible Metadata Field**
   - JSON blob for future fields without migrations
   - Store model, endpoint, truncation info
   - Useful for analytics and debugging

6. **Handle Compression Failures Gracefully**
   - Wrap decompress in try/catch
   - Log warnings but don't fail the request
   - Return empty string on failure

7. **Implement Automatic Cleanup**
   - Schedule daily cleanup job
   - Remove completed sessions older than threshold
   - Preserve active sessions indefinitely

---

## Reconnection and Retry Logic

Complement session persistence with connection resilience.

### Exponential Backoff Configuration

```javascript
const RECONNECTION_CONFIG = {
  maxRetries: Number(process.env.SDK_MAX_RETRIES || 5),
  baseDelayMs: Number(process.env.SDK_RETRY_DELAY_MS || 1000),
  maxDelayMs: Number(process.env.SDK_MAX_RETRY_DELAY_MS || 30000),
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'Connection error',
    'socket hang up',
    'network error',
    'overloaded_error'
  ]
};
```

### Retry Wrapper

```javascript
function isRetryableError(error) {
  const message = error?.message || String(error);
  return RECONNECTION_CONFIG.retryableErrors.some(e =>
    message.toLowerCase().includes(e.toLowerCase())
  );
}

async function withRetry(fn, options = {}) {
  const { maxRetries = RECONNECTION_CONFIG.maxRetries, sessionId = null } = options;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt, sessionId);
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        RECONNECTION_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RECONNECTION_CONFIG.maxDelayMs
      );

      console.log(`🔄 [Reconnect] Attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      // Notify client of retry
      if (options.send) {
        options.send({
          type: 'reconnecting',
          attempt: attempt + 1,
          maxAttempts: maxRetries,
          session_id: sessionId,
          delay_ms: delay,
          reason: error.message
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

---

## Summary

| Deployment | Storage | Use Case |
|------------|---------|----------|
| Development | SQLite | Single file, no dependencies |
| Small Production | SQLite + WAL | Up to ~100 concurrent users |
| Medium Production | PostgreSQL | 100-10,000 users |
| Large Production | Redis + PostgreSQL | 10,000+ users, sub-second latency |

The key insight from Anthropic's documentation is that session persistence should be **transparent to the agent** - the SDK handles the conversation context via `resume`, while your infrastructure handles durability and recovery.

---

# Part 2: Super-Legal Architecture Mapping

> Architecture analysis mapping the current file-based system (legalSubagents.js + memorandum.md) to a database-integrated architecture for seamless persistence and recovery.

## Table of Contents (Part 2)

10. [Current Architecture Overview](#current-architecture-overview)
11. [Session Directory Structure](#session-directory-structure)
12. [State Files Analysis](#state-files-analysis)
13. [Database Schema Design](#database-schema-design)
14. [Hybrid Integration Strategy](#hybrid-integration-strategy)
15. [Migration Path](#migration-path)
16. [Implementation Considerations](#implementation-considerations)

---

## Current Architecture Overview

### File-Based Workflow

The system uses a **session-directory-centric** architecture where all artifacts are stored in:

```
reports/[YYYY-MM-DD]-[unix-timestamp]/
```

### Key Architectural Principles (from legalSubagents.js)

1. **Session Directory as Single Source of Truth** (line 1123)
   - All specialists receive the same session directory
   - Never regenerate timestamps mid-session

2. **Progressive Save Pattern** (SAVE.1 → SAVE.4)
   - SAVE.1: Create file immediately with structure
   - SAVE.2: Append findings incrementally via Edit tool
   - SAVE.3: Finalize with executive summary
   - SAVE.4: Return JSON status (~200 tokens)

3. **Phase-Based Execution** (from memorandum.md lines 13-24)
   ```
   session-initialization → specialist-research → validation → generation → assembly-qa
   ```

4. **State Tracking** via markdown files:
   - `orchestrator-state.md` - Execution state
   - `research-plan.md` - Plan + refinement log
   - `fact-registry.md` - Canonical values

---

## Session Directory Structure

### Complete Directory Tree (from memorandum.md lines 1252-1303)

```
reports/[session]/
├── research-plan.md                  ← SESSION_INIT: Research plan
├── questions-presented.md            ← SESSION_INIT: Legal questions
├── orchestrator-state.md             ← STATE: Execution tracking
│
├── specialist-reports/               ← RESEARCH: 17 specialist outputs
│   ├── securities-researcher-report.md
│   ├── case-law-analyst-report.md
│   ├── [all 17 specialists...]
│   └── [specialist]-supplemental-[N].md
│
├── review-outputs/                   ← VALIDATION: Quality checks
│   ├── fact-registry.md              ← Canonical facts
│   ├── conflict-report.md            ← Fact conflicts
│   ├── coverage-gaps.md              ← Gap analysis
│   ├── risk-summary.json             ← Pre-aggregated risks
│   ├── research-review-report.md     ← Quality review
│   └── objectivity-review.md         ← Objectivity validation
│
├── section-reports/                  ← GENERATION: 10 memo sections
│   ├── section-IV-A-cfius.md
│   ├── section-IV-B-privacy.md
│   └── [sections C-J...]
│
├── qa-outputs/                       ← QA: Assessment & remediation
│   ├── section-review-report.md
│   ├── diagnostic-assessment.md
│   ├── remediation-plan.md
│   ├── remediation-dispatch.md
│   ├── citations-validation-report.md
│   ├── final-qa-certificate.md
│   └── delivery-decision.md
│
├── remediation-outputs/              ← REMEDIATION: Task outputs
│   └── [TASK-ID].md
│
├── executive-summary.md              ← SYNTHESIS: 2,500-3,500 words
├── consolidated-footnotes.md         ← CITATIONS: Bluebook format
├── final-memorandum.md               ← OUTPUT: Final document
├── synthesis-state.json              ← RECOVERY: Resume state
└── final-memorandum-v2.md            ← REMEDIATION: Post-QA version
```

### File Categories for Database Mapping

| Category | Files | Purpose | DB Priority |
|----------|-------|---------|-------------|
| **Session State** | orchestrator-state.md, synthesis-state.json | Execution tracking, recovery | HIGH |
| **Plan & Context** | research-plan.md, questions-presented.md | Research coordination | HIGH |
| **Specialist Reports** | specialist-reports/*.md (17 files) | Research artifacts | MEDIUM |
| **Validation Outputs** | review-outputs/*.md (6 files) | Quality assurance | HIGH |
| **Section Drafts** | section-reports/*.md (10 files) | Memo components | MEDIUM |
| **QA Outputs** | qa-outputs/*.md (8 files) | Quality assessment | MEDIUM |
| **Final Outputs** | executive-summary.md, final-memorandum.md | Deliverables | LOW (keep as files) |

---

## State Files Analysis

### 1. orchestrator-state.md

**Location:** `reports/[session]/orchestrator-state.md`

**Structure** (from memorandum.md lines 200-220):

```markdown
## DEAL_METADATA

| Field | Value |
|-------|-------|
| Matter Name | [project code name] |
| Deal Value | $[X]M |
| Closing Date | [YYYY-MM-DD] |
| Acquirer | [Company Name] |
| Target | [Company Name] |
| Transaction Type | [Asset Purchase/Stock Purchase/Merger] |

## SESSION_METRICS

| Phase | Start | End | Duration | Status |
|-------|-------|-----|----------|--------|
| session-initialization | [ISO] | [ISO] | [ms] | COMPLETE |
| specialist-research | [ISO] | - | - | IN_PROGRESS |
| validation | - | - | - | PENDING |
| generation | - | - | - | PENDING |
| assembly-qa | - | - | - | PENDING |

## Orchestrator Execution State
- research-review-gate iterations: 0/2
- fact-validation iterations: 0/1
- coverage-gap-analysis iterations: 0/2
- section-review-gate iterations: 0/2
- citation-validation iterations: 0/1
- Deal-blocking warnings: []
```

**Database Mapping:**

```sql
-- sessions table (core)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- [YYYY-MM-DD]-[unix-timestamp]
  user_id TEXT,
  matter_name TEXT,
  deal_value DECIMAL,
  closing_date DATE,
  acquirer TEXT,
  target TEXT,
  transaction_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- session_phases table
CREATE TABLE session_phases (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  phase TEXT NOT NULL,  -- session-initialization, specialist-research, etc.
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETE, ERROR
  UNIQUE(session_id, phase)
);

-- session_iterations table
CREATE TABLE session_iterations (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  gate_name TEXT NOT NULL,  -- research-review-gate, fact-validation, etc.
  current_iteration INTEGER DEFAULT 0,
  max_iterations INTEGER NOT NULL,
  UNIQUE(session_id, gate_name)
);

-- deal_blocking_warnings table
CREATE TABLE deal_blocking_warnings (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  warning_type TEXT,
  description TEXT,
  source_specialist TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. research-plan.md

**Purpose:** Research coordination, specialist assignments, refinement log

**Key Sections:**
- LEGAL DOMAINS IDENTIFIED
- CRITICAL ISSUES CHECKLIST
- KEY TRANSACTION PARAMETERS
- SPECIALIST ASSIGNMENTS (T1-T17)
- REFINEMENT LOG (continuous updates)

**Database Mapping:**

```sql
-- research_plans table
CREATE TABLE research_plans (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) UNIQUE,
  query_text TEXT,  -- Original user query
  complexity TEXT,  -- Simple/Moderate/Complex
  output_targets JSONB,  -- Word counts, footnote targets
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- legal_domains table
CREATE TABLE legal_domains (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  domain_name TEXT NOT NULL,
  scope_description TEXT,
  priority TEXT,  -- HIGH/MEDIUM/LOW
  UNIQUE(session_id, domain_name)
);

-- critical_issues table
CREATE TABLE critical_issues (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  issue_number INTEGER,
  description TEXT,
  domain TEXT,
  why_critical TEXT,
  expected_exposure DECIMAL,
  status TEXT DEFAULT 'PENDING'
);

-- specialist_assignments table
CREATE TABLE specialist_assignments (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  task_id TEXT,  -- T1, T2, etc.
  specialist_type TEXT NOT NULL,
  task_description TEXT,
  execution_mode TEXT,  -- Parallel/Sequential
  priority TEXT,
  status TEXT DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETE, ERROR
  agent_id TEXT,  -- Claude Agent SDK session ID
  report_path TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, task_id)
);

-- refinement_log table
CREATE TABLE refinement_log (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  iteration_number INTEGER,
  triggering_specialist TEXT,
  instruction_updates JSONB,
  priority_adjustments JSONB,
  status TEXT,  -- REFINED, NO_CHANGES_NEEDED
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. fact-registry.md

**Purpose:** Single source of truth for canonical facts

**Structure** (from memorandum.md lines 1310-1327):

```markdown
## Key Dates (USE THESE VALUES)
| Fact | Canonical Value | Source |
|------|-----------------|--------|
| CBA Expiration | 2026-06-30 | employment-labor-analyst:L47 |

## Quantitative Facts (USE THESE VALUES)
| Fact | Canonical Value | Source |
|------|-----------------|--------|
| Fleet Size | 515 | securities-researcher:L156 |
```

**Database Mapping:**

```sql
-- fact_registry table
CREATE TABLE fact_registry (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  fact_category TEXT,  -- dates, quantitative, qualitative
  fact_name TEXT NOT NULL,
  canonical_value TEXT NOT NULL,
  source_specialist TEXT,
  source_line INTEGER,
  verification_status TEXT,  -- VERIFIED, INFERRED, ASSUMED
  conflict_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, fact_name)
);

-- fact_conflicts table
CREATE TABLE fact_conflicts (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  fact_name TEXT,
  value_1 TEXT,
  source_1 TEXT,
  value_2 TEXT,
  source_2 TEXT,
  resolution TEXT,  -- RESOLVED, REQUIRES_ATTORNEY_REVIEW
  resolved_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. synthesis-state.json

**Purpose:** Resume state for compaction recovery (memo-final-synthesis)

**Database Mapping:**

```sql
-- synthesis_state table
CREATE TABLE synthesis_state (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) UNIQUE,
  current_phase TEXT,  -- PHASE_1 through PHASE_6
  sections_completed JSONB,  -- Array of section IDs
  accumulated_tokens INTEGER,
  last_checkpoint_id TEXT,
  resume_data JSONB,  -- Full state for recovery
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Database Schema Design

### Complete Schema (PostgreSQL)

```sql
-- ============================================
-- CORE SESSION TABLES
-- ============================================

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT,
  matter_name TEXT,
  deal_value DECIMAL,
  closing_date DATE,
  acquirer TEXT,
  target TEXT,
  transaction_type TEXT,
  complexity TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_phases (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT DEFAULT 'PENDING',
  error_message TEXT,
  UNIQUE(session_id, phase)
);

CREATE TABLE session_iterations (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  gate_name TEXT NOT NULL,
  current_iteration INTEGER DEFAULT 0,
  max_iterations INTEGER NOT NULL,
  last_status TEXT,
  UNIQUE(session_id, gate_name)
);

-- ============================================
-- RESEARCH PLANNING TABLES
-- ============================================

CREATE TABLE research_plans (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  query_text TEXT,
  complexity TEXT,
  output_targets JSONB,
  assumptions JSONB,
  data_gaps JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_domains (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  domain_number INTEGER,
  domain_name TEXT NOT NULL,
  scope_description TEXT,
  priority TEXT,
  UNIQUE(session_id, domain_name)
);

CREATE TABLE critical_issues (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  issue_number INTEGER,
  description TEXT NOT NULL,
  domain TEXT,
  why_critical TEXT,
  expected_exposure DECIMAL,
  status TEXT DEFAULT 'PENDING',
  covered_by_specialist TEXT
);

CREATE TABLE specialist_assignments (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  specialist_type TEXT NOT NULL,
  task_description TEXT,
  focus_areas JSONB,
  key_authorities JSONB,
  cross_references JSONB,
  execution_mode TEXT DEFAULT 'Parallel',
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING',
  agent_id TEXT,
  report_path TEXT,
  word_count INTEGER,
  footnote_count INTEGER,
  high_severity_findings INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, task_id)
);

CREATE TABLE refinement_log (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  iteration_number INTEGER,
  triggering_specialist TEXT,
  completed_reports JSONB,
  pending_specialists JSONB,
  instruction_updates JSONB,
  priority_adjustments JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FACT REGISTRY TABLES
-- ============================================

CREATE TABLE fact_registry (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  fact_category TEXT NOT NULL,
  fact_name TEXT NOT NULL,
  canonical_value TEXT NOT NULL,
  data_type TEXT,  -- date, number, text, percentage
  source_specialist TEXT,
  source_line INTEGER,
  verification_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, fact_name)
);

CREATE TABLE fact_conflicts (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  fact_name TEXT NOT NULL,
  value_1 TEXT,
  source_1 TEXT,
  value_2 TEXT,
  source_2 TEXT,
  resolution TEXT,
  resolved_value TEXT,
  requires_attorney_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT STORAGE TABLES
-- ============================================

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,  -- specialist_report, section_report, qa_output, etc.
  document_name TEXT NOT NULL,
  file_path TEXT,  -- Relative path within session directory
  content_compressed BYTEA,  -- Compressed markdown content (optional)
  word_count INTEGER,
  footnote_count INTEGER,
  status TEXT DEFAULT 'DRAFT',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, document_type, document_name)
);

CREATE TABLE document_checkpoints (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  checkpoint_id TEXT NOT NULL,
  turn_number INTEGER,
  content_snapshot_compressed BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VALIDATION OUTPUTS TABLES
-- ============================================

CREATE TABLE risk_summary (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  total_quantified_exposure DECIMAL,
  probability_weighted_exposure DECIMAL,
  high_severity_count INTEGER,
  medium_severity_count INTEGER,
  low_severity_count INTEGER,
  deal_blockers INTEGER DEFAULT 0,
  risk_items JSONB,
  escrow_recommendation DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coverage_gaps (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  gap_type TEXT,
  description TEXT,
  severity TEXT,
  recommended_action TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QA OUTPUTS TABLES
-- ============================================

CREATE TABLE qa_assessments (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  assessment_type TEXT,  -- section_review, diagnostic, certification
  overall_score DECIMAL,
  status TEXT,
  issues JSONB,
  remediation_tasks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE remediation_tasks (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  wave_number INTEGER,
  task_type TEXT,
  target_document TEXT,
  description TEXT,
  status TEXT DEFAULT 'PENDING',
  output_path TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, task_id)
);

-- ============================================
-- SYNTHESIS STATE TABLE
-- ============================================

CREATE TABLE synthesis_state (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  current_phase TEXT,
  sections_completed JSONB,
  sections_pending JSONB,
  accumulated_tokens INTEGER DEFAULT 0,
  last_checkpoint_id TEXT,
  resume_context JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USAGE TRACKING
-- ============================================

CREATE TABLE session_usage (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  total_turns INTEGER DEFAULT 0,
  total_duration_ms INTEGER DEFAULT 0,
  total_cost_usd DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_specialist_assignments_status ON specialist_assignments(status);
CREATE INDEX idx_documents_session_type ON documents(session_id, document_type);
CREATE INDEX idx_fact_registry_session ON fact_registry(session_id);
CREATE INDEX idx_remediation_tasks_status ON remediation_tasks(status);
```

---

## Hybrid Integration Strategy

### Recommended Approach: Database State + File Content

Keep **content files** on disk (reports, memoranda) while storing **state and metadata** in database.

### Why Hybrid?

| Aspect | Database | File System |
|--------|----------|-------------|
| **State Tracking** | Excellent - ACID, queryable | Poor - race conditions |
| **Large Documents** | Expensive storage | Cheap, efficient |
| **Read by Agents** | Requires serialization | Native Read/Glob/Grep |
| **Recovery** | Built-in | Manual |
| **Search** | Full-text indexes | grep |

### Implementation Pattern

```javascript
// src/utils/hybridSessionManager.js

import { SessionManager } from './sessionPersistence.js';
import { promises as fs } from 'fs';
import path from 'path';

export class HybridSessionManager {
  constructor(dbPath, reportsDir) {
    this.db = new SessionManager(dbPath);
    this.reportsDir = reportsDir;
  }

  /**
   * Create a new session - DB record + file directory
   */
  async createSession(sessionId, dealMetadata) {
    // 1. Create DB session record
    await this.db.createSession({
      id: sessionId,
      ...dealMetadata,
      status: 'active'
    });

    // 2. Create file directory structure
    const sessionDir = path.join(this.reportsDir, sessionId);
    await fs.mkdir(path.join(sessionDir, 'specialist-reports'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'review-outputs'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'section-reports'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'qa-outputs'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'remediation-outputs'), { recursive: true });

    // 3. Initialize phases in DB
    const phases = [
      'session-initialization', 'specialist-research', 'validation',
      'generation', 'assembly-qa'
    ];
    for (const phase of phases) {
      await this.db.initializePhase(sessionId, phase);
    }

    return sessionId;
  }

  /**
   * Update specialist assignment status
   */
  async updateSpecialistStatus(sessionId, taskId, status, metadata = {}) {
    await this.db.updateSpecialistAssignment(sessionId, taskId, {
      status,
      ...metadata,
      ...(status === 'IN_PROGRESS' ? { started_at: new Date() } : {}),
      ...(status === 'COMPLETE' ? { completed_at: new Date() } : {})
    });
  }

  /**
   * Register document in DB after file write
   */
  async registerDocument(sessionId, documentType, documentName, filePath, metadata = {}) {
    // File content stays on disk, metadata in DB
    const stats = await fs.stat(path.join(this.reportsDir, sessionId, filePath));

    await this.db.registerDocument({
      session_id: sessionId,
      document_type: documentType,
      document_name: documentName,
      file_path: filePath,
      word_count: metadata.word_count,
      footnote_count: metadata.footnote_count,
      status: metadata.status || 'COMPLETE',
      metadata: metadata
    });
  }

  /**
   * Add fact to registry
   */
  async registerFact(sessionId, fact) {
    await this.db.addFact({
      session_id: sessionId,
      fact_category: fact.category,
      fact_name: fact.name,
      canonical_value: fact.value,
      source_specialist: fact.source,
      source_line: fact.line,
      verification_tag: fact.verification
    });
  }

  /**
   * Get session state for recovery
   */
  async getSessionState(sessionId) {
    const session = await this.db.getSession(sessionId);
    const phases = await this.db.getPhases(sessionId);
    const specialists = await this.db.getSpecialistAssignments(sessionId);
    const documents = await this.db.getDocuments(sessionId);

    return {
      session,
      phases: Object.fromEntries(phases.map(p => [p.phase, p])),
      specialists: Object.fromEntries(specialists.map(s => [s.task_id, s])),
      documents: documents,
      resumable: session.status === 'active'
    };
  }

  /**
   * Sync orchestrator-state.md with DB
   */
  async syncOrchestratorState(sessionId) {
    const state = await this.getSessionState(sessionId);
    const mdContent = this.generateOrchestratorStateMd(state);

    const filePath = path.join(this.reportsDir, sessionId, 'orchestrator-state.md');
    await fs.writeFile(filePath, mdContent, 'utf8');
  }

  generateOrchestratorStateMd(state) {
    return `## DEAL_METADATA

| Field | Value |
|-------|-------|
| Matter Name | ${state.session.matter_name || 'N/A'} |
| Deal Value | $${state.session.deal_value || 'N/A'}M |
| Closing Date | ${state.session.closing_date || 'N/A'} |
| Acquirer | ${state.session.acquirer || 'N/A'} |
| Target | ${state.session.target || 'N/A'} |
| Transaction Type | ${state.session.transaction_type || 'N/A'} |

## SESSION_METRICS

| Phase | Start | End | Duration | Status |
|-------|-------|-----|----------|--------|
${Object.values(state.phases).map(p =>
  `| ${p.phase} | ${p.start_time || '-'} | ${p.end_time || '-'} | ${p.duration_ms || '-'} | ${p.status} |`
).join('\n')}

## Orchestrator Execution State
${state.iterations ? Object.entries(state.iterations).map(([gate, data]) =>
  `- ${gate} iterations: ${data.current}/${data.max}`
).join('\n') : '- No iterations tracked'}
- Deal-blocking warnings: ${state.warnings?.length || 0}
`;
  }
}
```

---

## Migration Path

### Phase 1: Add Database Layer (Non-Breaking)

1. Install dependencies:
   ```bash
   npm install better-sqlite3 pg ioredis
   ```

2. Create database schema (development: SQLite, production: PostgreSQL)

3. Add `HybridSessionManager` to `claude-sdk-server.js`

4. Wrap existing file operations with DB registration

### Phase 2: State Synchronization

1. On session creation:
   - Create DB record
   - Create file directory
   - Initialize phases

2. On specialist completion:
   - Update DB status
   - Register document metadata
   - Extract and store facts

3. On phase transition:
   - Update DB phase status
   - Sync orchestrator-state.md from DB

### Phase 3: Recovery Integration

1. On server restart:
   - Query active sessions from DB
   - Resume incomplete sessions using Agent SDK `resume` option

2. On disconnect:
   - Session state already in DB
   - File checkpoints preserved
   - Resume with full context

### Phase 4: Gradual File Elimination (Optional)

For frequently-accessed state files, consider full DB storage:
- `fact-registry.md` → fact_registry table (query by session)
- `synthesis-state.json` → synthesis_state table
- Keep `research-plan.md` as file (agents need to Read it)

---

## Implementation Considerations

### 1. Agent Tool Compatibility

Agents use `Read`, `Glob`, `Grep`, `Write`, `Edit` tools. The hybrid approach maintains file compatibility:

```
Agent reads research-plan.md → File exists on disk ✓
Agent writes specialist-report.md → File + DB registration ✓
Orchestrator queries specialist status → DB query ✓
```

### 2. Atomic Operations

For critical state updates, use transactions:

```javascript
async updatePhaseAndRegisterDocument(sessionId, phase, document) {
  await this.db.transaction(async (tx) => {
    await tx.updatePhase(sessionId, phase, 'COMPLETE');
    await tx.registerDocument(sessionId, document);
  });
}
```

### 3. Compression for Large Documents

Documents > 50KB should be compressed before DB storage (if storing content):

```javascript
const compressed = await gzip(content);
await db.storeDocument(sessionId, documentName, compressed);
```

### 4. Cache Layer (Production)

For high-traffic deployments, add Redis caching for:
- Active session state
- Fact registry lookups
- Specialist assignment status

### 5. Cleanup Strategy

```javascript
// Daily cleanup job
async cleanupOldSessions(maxAgeDays = 30) {
  // 1. Get completed sessions older than threshold
  const oldSessions = await this.db.getOldCompletedSessions(maxAgeDays);

  // 2. Archive to cold storage (optional)
  for (const session of oldSessions) {
    await this.archiveSession(session.id);
  }

  // 3. Delete from active DB
  await this.db.deleteOldSessions(maxAgeDays);

  // 4. Delete file directories
  for (const session of oldSessions) {
    await fs.rm(path.join(this.reportsDir, session.id), { recursive: true });
  }
}
```

---

## Architecture Summary

| Current (File-Based) | Hybrid (Recommended) | Full Database |
|---------------------|----------------------|---------------|
| All artifacts as files | State in DB, content as files | Everything in DB |
| No recovery | Full state recovery | Full recovery |
| Race conditions possible | ACID for state | ACID for all |
| Agents read files directly | Agents read files + DB queries state | Requires content serialization |
| Simple | Moderate complexity | High complexity |

**Recommendation:** Implement the **Hybrid approach** to gain:
- Seamless session recovery
- Queryable state for monitoring/dashboards
- Maintained agent tool compatibility
- File-based content for efficiency

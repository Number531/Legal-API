/**
 * Supabase Schema Definitions
 * 
 * Defines the expected table schemas for conversation storage
 */

/**
 * Conversation table schema
 */
export const CONVERSATIONS_SCHEMA = {
  tableName: 'conversations',
  columns: {
    id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    session_id: 'text NOT NULL UNIQUE',
    user_id: 'uuid REFERENCES auth.users(id)',
    title: 'text',
    created_at: 'timestamptz DEFAULT NOW()',
    updated_at: 'timestamptz DEFAULT NOW()',
    metadata: 'jsonb DEFAULT \'{}\''
  },
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_conversations_user_activity ON conversations (user_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations (session_id)',
    'CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations (user_id, created_at DESC)'
  ]
};

/**
 * Conversation messages table schema
 */
export const CONVERSATION_MESSAGES_SCHEMA = {
  tableName: 'conversation_messages',
  columns: {
    id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    conversation_id: 'uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE',
    role: 'text NOT NULL CHECK (role IN (\'user\', \'assistant\', \'system\'))',
    content: 'text NOT NULL',
    sequence_number: 'integer NOT NULL',
    created_at: 'timestamptz DEFAULT NOW()',
    metadata: 'jsonb DEFAULT \'{}\''
  },
  constraints: [
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_conversation_sequence_unique ON conversation_messages (conversation_id, sequence_number)'
  ],
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq ON conversation_messages (conversation_id, sequence_number)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON conversation_messages (conversation_id, created_at)'
  ]
};

/**
 * Message chunks table schema (for streaming)
 */
export const MESSAGE_CHUNKS_SCHEMA = {
  tableName: 'message_chunks',
  columns: {
    id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    message_id: 'uuid NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE',
    chunk_content: 'text NOT NULL',
    chunk_index: 'integer NOT NULL',
    is_final: 'boolean DEFAULT false',
    created_at: 'timestamptz DEFAULT NOW()'
  },
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_chunks_message_idx ON message_chunks (message_id, chunk_index)',
    'CREATE INDEX IF NOT EXISTS idx_chunks_final ON message_chunks (message_id, is_final)'
  ]
};

/**
 * Message attachments table schema (for document uploads)
 */
export const MESSAGE_ATTACHMENTS_SCHEMA = {
  tableName: 'message_attachments',
  columns: {
    id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    message_id: 'uuid NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE',
    file_name: 'text NOT NULL',
    file_type: 'text NOT NULL',
    file_size: 'integer NOT NULL',
    storage_path: 'text NOT NULL',
    extracted_content: 'text',
    processing_status: 'text DEFAULT \'pending\' CHECK (processing_status IN (\'pending\', \'processed\', \'failed\'))',
    uploaded_by: 'uuid REFERENCES auth.users(id)',
    created_at: 'timestamptz DEFAULT NOW()',
    metadata: 'jsonb DEFAULT \'{}\''
  },
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments (message_id)',
    'CREATE INDEX IF NOT EXISTS idx_attachments_status ON message_attachments (processing_status)'
  ]
};

/**
 * Document versions table schema (for version control)
 */
export const DOCUMENT_VERSIONS_SCHEMA = {
  tableName: 'document_versions',
  columns: {
    id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    parent_attachment_id: 'uuid NOT NULL REFERENCES message_attachments(id) ON DELETE CASCADE',
    version_number: 'integer NOT NULL',
    file_name: 'text NOT NULL',
    storage_path: 'text NOT NULL',
    changes_description: 'text',
    created_by: 'uuid REFERENCES auth.users(id)',
    created_at: 'timestamptz DEFAULT NOW()'
  },
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_versions_attachment ON document_versions (parent_attachment_id, version_number)'
  ]
};

/**
 * Get all schema definitions
 */
export function getAllSchemas() {
  return {
    conversations: CONVERSATIONS_SCHEMA,
    conversation_messages: CONVERSATION_MESSAGES_SCHEMA,
    message_chunks: MESSAGE_CHUNKS_SCHEMA,
    message_attachments: MESSAGE_ATTACHMENTS_SCHEMA,
    document_versions: DOCUMENT_VERSIONS_SCHEMA
  };
}

/**
 * Validate table exists and has expected structure
 */
export async function validateTableSchema(supabaseClient, tableName) {
  if (!supabaseClient) {
    return { valid: false, error: 'No Supabase client available' };
  }
  
  try {
    // Test basic table access
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { 
        valid: false, 
        error: `Table '${tableName}' validation failed: ${error.message}`,
        details: error.details
      };
    }
    
    return { 
      valid: true, 
      message: `Table '${tableName}' is accessible`,
      rowCount: data?.length || 0
    };
    
  } catch (error) {
    return { 
      valid: false, 
      error: `Exception validating table '${tableName}': ${error.message}`
    };
  }
}

/**
 * Validate all required tables exist
 */
export async function validateAllTables(supabaseClient) {
  const schemas = getAllSchemas();
  const results = {};
  
  for (const [tableName, schema] of Object.entries(schemas)) {
    results[tableName] = await validateTableSchema(supabaseClient, schema.tableName);
  }
  
  const allValid = Object.values(results).every(result => result.valid);
  
  return {
    allValid,
    results,
    summary: {
      total: Object.keys(results).length,
      valid: Object.values(results).filter(r => r.valid).length,
      invalid: Object.values(results).filter(r => !r.valid).length
    }
  };
}

/**
 * Get SQL for creating all tables (for documentation/setup purposes)
 */
export function getCreateTableSQL() {
  const schemas = getAllSchemas();
  const sqlStatements = [];
  
  Object.values(schemas).forEach(schema => {
    // Create table statement
    const columns = Object.entries(schema.columns)
      .map(([name, definition]) => `  ${name} ${definition}`)
      .join(',\n');
    
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${schema.tableName} (\n${columns}\n);`);
    
    // Add indexes
    if (schema.indexes) {
      sqlStatements.push(...schema.indexes);
    }
    
    // Add constraints
    if (schema.constraints) {
      sqlStatements.push(...schema.constraints);
    }
    
    sqlStatements.push(''); // Empty line for readability
  });
  
  return sqlStatements.join('\n');
}
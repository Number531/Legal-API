import { createGpt5Server } from './gpt5ServerEnhanced.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.GPT5_PORT || 8089;

const app = createGpt5Server();

app.listen(PORT, () => {
  console.log(`🚀 Enhanced GPT-5 Orchestrator Server v2.0`);
  console.log(`📍 Listening on http://localhost:${PORT}`);
  console.log(`✨ Features: Schemas, Retry Logic, Temperature Control, Reasoning`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  - GET  /health`);
  console.log(`  - POST /api/gpt5/research`);
  console.log(`  - GET  /api/gpt5/stream`);
  console.log(`  - POST /api/gpt5/iterative`);
  console.log(`\n🔧 Configuration:`);
  console.log(`  - Model: ${process.env.GPT5_MODEL || 'gpt-5'}`);
  console.log(`  - MCP Base: ${process.env.MCP_BASE_DIR || process.cwd()}`);
  console.log(`  - Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
import { createGpt5Server } from './gpt5Server.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.GPT5_PORT || 8089;

const app = createGpt5Server();

app.listen(PORT, () => {
  console.log(`GPT-5 Orchestrator listening on http://localhost:${PORT}`);
});
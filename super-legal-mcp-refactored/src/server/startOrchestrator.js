import 'dotenv/config';
import { createGpt5Server } from './gpt5Server.js';

const PORT = Number(process.env.PORT || 8089);

async function main() {
  const app = createGpt5Server();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`GPT-5 Orchestrator listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start GPT-5 orchestrator:', e?.message || e);
  process.exit(1);
});



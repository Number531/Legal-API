import { Pool } from 'pg';

let pool = null;

export function getPool() {
  if (pool) return pool;
  const connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL || '';
  if (!connectionString) return null;
  pool = new Pool({ connectionString, max: 5 });
  return pool;
}

export async function ensureSchema() {
  const p = getPool();
  if (!p) return;
  await p.query(`
    create table if not exists runs (
      id bigserial primary key,
      created_at timestamptz not null default now(),
      model text not null,
      query text not null,
      memo_json jsonb,
      final_text text,
      status text not null default 'running'
    );
    create table if not exists tool_calls (
      id bigserial primary key,
      run_id bigint not null references runs(id) on delete cascade,
      created_at timestamptz not null default now(),
      tool_name text not null,
      args jsonb not null
    );
    create table if not exists evidence (
      id bigserial primary key,
      run_id bigint not null references runs(id) on delete cascade,
      created_at timestamptz not null default now(),
      uri text not null,
      source text,
      snippet text,
      hash text
    );
  `);
}



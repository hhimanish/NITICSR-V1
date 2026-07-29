import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

async function ensureLeadsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export type LeadInput = {
  name: string;
  email: string;
  organization?: string;
  message: string;
};

export async function saveLead(input: LeadInput) {
  await ensureLeadsTable();
  await getPool().query(
    `INSERT INTO leads (name, email, organization, message) VALUES ($1, $2, $3, $4)`,
    [input.name, input.email, input.organization || null, input.message]
  );
}

#!/usr/bin/env node
/**
 * Minimal, dependency-free SQL migration runner.
 *
 * Applies every *.sql file in db/migrations, in filename order, exactly once,
 * tracked in a `_migrations` table. Each file runs inside its own transaction.
 *
 * Usage: node scripts/migrate.mjs
 * Env:   DATABASE_URL must be set.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "db", "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Default OFF: CI and local Postgres don't speak TLS. Set PGSSLMODE=require
    // when pointing this at Render's managed Postgres from outside Render's network.
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows: applied } = await client.query("SELECT filename FROM _migrations");
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`-> applying ${file}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        ranCount++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Migration failed: ${file}`);
        throw error;
      }
    }

    console.log(ranCount === 0 ? "Already up to date." : `Applied ${ranCount} migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

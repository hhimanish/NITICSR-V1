#!/usr/bin/env node
/**
 * Seeds realistic sample CSR projects, SDG tags, and beneficiary records for
 * one organization, purely so the ESG/Compliance/Financials workspaces have
 * something to render in local dev or a demo. Every number those pages then
 * show (SDG rollup, social impact, BRSR coverage, compliance score, fund
 * utilization) is a REAL aggregation computed over these rows — this script
 * only creates the underlying project data, never a fabricated score.
 *
 * Dev/demo tool only. Refuses to run unless DATABASE_URL looks local, or
 * SEED_DEV_DATA_FORCE=1 is set (e.g. seeding a shared staging DB on purpose).
 *
 * Usage: node scripts/seed-dev-data.mjs <organization-slug-or-id>
 * Env:   DATABASE_URL must be set.
 */
import pg from "pg";

const { Pool } = pg;

const SEED_PREFIX = "[Seed]";

const SDG_BY_CATEGORY = {
  education: [4],
  healthcare: [3],
  rural_development: [1, 11],
  environment: [13, 15],
  water_sanitation: [6],
  skill_development: [8],
  gender_equality: [5],
  disaster_relief: [11],
  poverty_hunger: [1, 2],
};

const PROJECTS = [
  {
    category: "education",
    title: `${SEED_PREFIX} Digital Classrooms for Rural Schools`,
    budget: 4500000,
    status: "completed",
    beneficiaries: [{ category: "students", count: 3200 }],
  },
  {
    category: "healthcare",
    title: `${SEED_PREFIX} Mobile Health Camps — Tier 3 Districts`,
    budget: 3200000,
    status: "completed",
    beneficiaries: [{ category: "patients", count: 8100 }],
  },
  {
    category: "water_sanitation",
    title: `${SEED_PREFIX} Community Water Purification Units`,
    budget: 2800000,
    status: "active",
    beneficiaries: [{ category: "households", count: 1450 }],
  },
  {
    category: "skill_development",
    title: `${SEED_PREFIX} Vocational Training for Youth`,
    budget: 1900000,
    status: "active",
    beneficiaries: [{ category: "youth", count: 640 }],
  },
  {
    category: "gender_equality",
    title: `${SEED_PREFIX} Women's Self-Help Group Livelihood Program`,
    budget: 2100000,
    status: "completed",
    beneficiaries: [{ category: "women", count: 970 }],
  },
  {
    category: "environment",
    title: `${SEED_PREFIX} Watershed Restoration & Afforestation`,
    budget: 3600000,
    status: "proposed",
    beneficiaries: [{ category: "farmers", count: 520 }],
  },
];

function looksLocal(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

async function main() {
  const orgArg = process.argv[2];
  if (!orgArg) {
    console.error("Usage: node scripts/seed-dev-data.mjs <organization-slug-or-id>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!looksLocal(process.env.DATABASE_URL) && process.env.SEED_DEV_DATA_FORCE !== "1") {
    console.error(
      "DATABASE_URL doesn't look local. Refusing to seed sample data into what may be a " +
        "shared or production database. Set SEED_DEV_DATA_FORCE=1 to override."
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();

  try {
    const { rows: orgRows } = await client.query(
      `SELECT id, name FROM organizations WHERE (id::text = $1 OR slug = $1) AND deleted_at IS NULL`,
      [orgArg]
    );
    if (orgRows.length === 0) {
      console.error(`No organization found for "${orgArg}".`);
      process.exit(1);
    }
    const organizationId = orgRows[0].id;
    console.log(`Seeding sample CSR data for "${orgRows[0].name}" (${organizationId})`);

    await client.query("BEGIN");

    // Idempotent: clear any previously seeded demo projects for this org first.
    await client.query(
      `DELETE FROM csr_projects WHERE corporate_org_id = $1 AND title LIKE $2`,
      [organizationId, `${SEED_PREFIX}%`]
    );

    for (const p of PROJECTS) {
      const { rows: catRows } = await client.query(`SELECT id FROM csr_categories WHERE key = $1`, [p.category]);
      if (catRows.length === 0) throw new Error(`Unknown csr_category key: ${p.category}`);

      const { rows: projectRows } = await client.query(
        `INSERT INTO csr_projects (corporate_org_id, csr_category_id, title, budget_amount, status, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '180 days')
         RETURNING id`,
        [organizationId, catRows[0].id, p.title, p.budget, p.status]
      );
      const projectId = projectRows[0].id;

      for (const sdgId of SDG_BY_CATEGORY[p.category] ?? []) {
        await client.query(
          `INSERT INTO project_sdgs (csr_project_id, sdg_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [projectId, sdgId]
        );
      }

      for (const b of p.beneficiaries) {
        await client.query(
          `INSERT INTO beneficiaries (csr_project_id, category, count_estimate) VALUES ($1, $2, $3)`,
          [projectId, b.category, b.count]
        );
      }

      console.log(`  -> ${p.title} (${p.status})`);
    }

    await client.query("COMMIT");
    console.log(`Seeded ${PROJECTS.length} sample project(s).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

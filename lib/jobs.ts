import { getPool } from "@/lib/db";

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

export async function enqueueJob(jobType: string, payload: Record<string, unknown> = {}) {
  const { rows } = await getPool().query(
    `INSERT INTO jobs (job_type, payload) VALUES ($1, $2) RETURNING id`,
    [jobType, JSON.stringify(payload)]
  );
  return rows[0].id as string;
}

/**
 * Polls for due jobs and runs them against the provided handler map. Meant to
 * be invoked by a periodic trigger (see .github/workflows/process-jobs.yml)
 * rather than a long-running worker process, since this project doesn't run
 * one — Render's web service only serves HTTP requests.
 */
export async function processJobs(handlers: Record<string, JobHandler>, limit = 20) {
  const pool = getPool();
  const { rows: jobs } = await pool.query(
    `UPDATE jobs SET status = 'processing'
      WHERE id IN (
        SELECT id FROM jobs
         WHERE status = 'pending' AND run_after <= now()
         ORDER BY run_after ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING *`,
    [limit]
  );

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    const handler = handlers[job.job_type];
    try {
      if (!handler) throw new Error(`No handler registered for job_type "${job.job_type}"`);
      await handler(job.payload);
      await pool.query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [job.id]);
      succeeded++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const message = error instanceof Error ? error.message : "Unknown error";

      if (attempts >= job.max_attempts) {
        await pool.query(
          `UPDATE jobs SET status = 'dead_letter', attempts = $2, last_error = $3 WHERE id = $1`,
          [job.id, attempts, message]
        );
      } else {
        // Exponential-ish backoff: 1m, 2m, 4m, 8m...
        const backoffMinutes = Math.pow(2, attempts - 1);
        await pool.query(
          `UPDATE jobs
              SET status = 'pending', attempts = $2, last_error = $3,
                  run_after = now() + ($4 || ' minutes')::interval
            WHERE id = $1`,
          [job.id, attempts, message, backoffMinutes]
        );
      }
      failed++;
    }
  }

  return { processed: jobs.length, succeeded, failed };
}

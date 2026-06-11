require("dotenv").config();
const { pool } = require("../config/db");

async function addMetricsJobsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS metrics_generation_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      records_processed INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_jobs_brand_id ON metrics_generation_jobs (brand_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_jobs_status ON metrics_generation_jobs (status);
  `;

  try {
    await pool.query(sql);
    console.log("metrics_generation_jobs table created successfully.");
  } catch (error) {
    console.error("Error creating metrics_generation_jobs table:", error);
  } finally {
    await pool.end();
  }
}

addMetricsJobsTable();

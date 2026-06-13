require('dotenv').config();
const { pool } = require('../config/db');

async function up() {
  console.log('Connecting to database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected. Starting transaction...');
    await client.query('BEGIN');

    // Campaign Intelligence Summaries Table
    // Acts as a persisted cache for historical performance to keep AI strategist fast.
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_intelligence_summaries (
        brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        goal VARCHAR(255) NOT NULL,
        campaign_count INTEGER NOT NULL DEFAULT 0,
        best_channel VARCHAR(50),
        avg_ctr DECIMAL(8,4),
        avg_conversion_rate DECIMAL(8,4),
        total_revenue DECIMAL(14,2),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (brand_id, goal)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_intel_brand_id ON campaign_intelligence_summaries (brand_id);
    `);

    await client.query('COMMIT');
    console.log('Campaign Intelligence storage table created successfully.');
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

up()
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Top level failure:', err);
    process.exit(1);
  });

require('dotenv').config();
const { pool } = require('../config/db');

async function up() {
  console.log('Connecting to database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database.');
    await client.query('BEGIN');

    // Business Insights Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        estimated_impact DECIMAL(14,2),
        supporting_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_business_insights_brand_id ON business_insights (brand_id);
      CREATE INDEX IF NOT EXISTS idx_business_insights_type ON business_insights (type);
      CREATE INDEX IF NOT EXISTS idx_business_insights_severity ON business_insights (severity);
    `);

    // Strategist Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategist_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Strategist Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategist_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES strategist_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Campaign Drafts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES strategist_sessions(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        draft_json JSONB NOT NULL,
        change_summary TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('V2 Intelligence Layer tables created successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating V2 Intelligence Layer tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };

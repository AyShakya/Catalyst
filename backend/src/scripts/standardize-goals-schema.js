require('dotenv').config();
const { pool } = require('../config/db');

async function up() {
  console.log('Connecting to database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected. Starting transaction...');
    await client.query('BEGIN');

    const allowedGoals = "'RETENTION', 'ACQUISITION', 'UPSELL', 'WIN_BACK', 'BRAND_AWARENESS'";

    // 1. Update existing non-conforming goals to 'RETENTION' as fallback
    console.log('Normalizing existing campaign goals...');
    await client.query(`
      UPDATE campaigns 
      SET goal = 'RETENTION' 
      WHERE goal NOT IN (${allowedGoals}) OR goal IS NULL
    `);

    await client.query(`
      UPDATE campaign_intelligence_summaries 
      SET goal = 'RETENTION' 
      WHERE goal NOT IN (${allowedGoals})
    `);

    // 2. Add CHECK constraint on campaigns table
    console.log('Adding CHECK constraint to campaigns table...');
    await client.query(`
      ALTER TABLE campaigns 
      ADD CONSTRAINT check_campaign_goal 
      CHECK (goal IN (${allowedGoals}))
    `);

    // 3. Add CHECK constraint on campaign_intelligence_summaries
    console.log('Adding CHECK constraint to campaign_intelligence_summaries...');
    await client.query(`
      ALTER TABLE campaign_intelligence_summaries 
      ADD CONSTRAINT check_intel_goal 
      CHECK (goal IN (${allowedGoals}))
    `);

    await client.query('COMMIT');
    console.log('Campaign goals standardized in database.');
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

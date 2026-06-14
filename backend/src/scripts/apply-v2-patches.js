require('dotenv').config();
const { pool } = require('../config/db');

async function patch() {
  console.log('Connecting to database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected. Starting transaction...');
    await client.query('BEGIN');

    // 1. Add filter_plan column to campaigns if it doesn't exist
    console.log('Checking for filter_plan column in campaigns table...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' AND column_name = 'filter_plan'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding filter_plan column to campaigns table...');
      await client.query('ALTER TABLE campaigns ADD COLUMN filter_plan JSONB');
    } else {
      console.log('filter_plan column already exists.');
    }

    // 2. Update CHECK constraints for status and event_type
    console.log('Updating status and event_type constraints to include PURCHASED...');
    
    // Drop old constraints if they exist (they might have different names depending on PG version)
    // We'll use a safer approach: add PURCHASED to the domain or just re-apply the constraint
    
    // For communications.status
    await client.query('ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_status_check');
    await client.query(`
      ALTER TABLE communications 
      ADD CONSTRAINT communications_status_check 
      CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED', 'FAILED'))
    `);

    // For communication_events.event_type
    await client.query('ALTER TABLE communication_events DROP CONSTRAINT IF EXISTS communication_events_event_type_check');
    await client.query(`
      ALTER TABLE communication_events 
      ADD CONSTRAINT communication_events_event_type_check 
      CHECK (event_type IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED', 'FAILED'))
    `);

    await client.query('COMMIT');
    console.log('Database patched successfully for V2 changes.');
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Patch failed:', err);
    throw err;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

patch();

require("dotenv").config();
const { pool } = require("../config/db");

async function applyConstraint() {
  console.log("Connecting to Database...");
  let client;
  try {
    client = await pool.connect();
    console.log("Database connected. Starting transaction...");
    await client.query("BEGIN");

    // 1. Deduplicate table (in case there are existing duplicates)
    console.log("Deduplicating communication_events table...");
    await client.query(`
      DELETE FROM communication_events a 
      USING communication_events b 
      WHERE a.id < b.id 
        AND a.communication_id = b.communication_id 
        AND a.event_type = b.event_type;
    `);

    // 2. Add Unique Constraint
    console.log("Applying Unique Constraint (communication_id, event_type)...");
    await client.query("ALTER TABLE communication_events DROP CONSTRAINT IF EXISTS unique_communication_event");
    await client.query("ALTER TABLE communication_events ADD CONSTRAINT unique_communication_event UNIQUE(communication_id, event_type)");

    await client.query("COMMIT");
    console.log("Constraint applied successfully!");
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Migration failed:", error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

applyConstraint();

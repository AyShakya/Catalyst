const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = require("./app");
const { pool } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  await pool.query("SELECT 1");

  // Reset any stuck 'RUNNING' jobs back to 'PENDING' due to sudden process crashes
  await pool.query(
    "UPDATE metrics_generation_jobs SET status = 'PENDING' WHERE status = 'RUNNING'"
  ).catch(err => console.error("Failed to reset stuck jobs on startup:", err));

  // Initialize and trigger Queue Manager background worker
  const queueManager = require("./services/analytics/queue-manager");
  queueManager.triggerWorker();

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
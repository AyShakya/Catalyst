require("dotenv").config();

const app = require("./app");
const { pool } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  await pool.query("SELECT 1");

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function main() {
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  await pool.query(schema);
  console.log("PostgreSQL schema created successfully.");
  await pool.end();
}

main().catch(async (error) => {
  console.error("Failed to initialize PostgreSQL schema:", error);
  await pool.end().catch(() => {});
  process.exit(1);
});
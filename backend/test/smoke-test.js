#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const pg = require("pg");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function waitForBackend(maxAttempts = 30, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // keep retrying until the API is ready
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Backend not reachable at ${BACKEND_URL}/health`);
}

async function main() {
  await waitForBackend();

  const customerCsvPath = path.join(__dirname, "customer.csv");
  const orderCsvPath = path.join(__dirname, "order.csv");

  const customerCsv = fs.readFileSync(customerCsvPath, "utf8");
  const orderCsv = fs.readFileSync(orderCsvPath, "utf8");

  const brandName = `Smoke Test Brand ${new Date().toISOString()}`;
  const brandResult = await pool.query(
    "INSERT INTO brands (name) VALUES ($1) RETURNING id, name",
    [brandName]
  );
  const brand = brandResult.rows[0];

  console.log(`Created brand: ${brand.name} (${brand.id})`);

  const payload = {
    brand_id: brand.id,
    customer_csv: Buffer.from(customerCsv).toString("base64"),
    order_csv: Buffer.from(orderCsv).toString("base64"),
  };

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const uploadResult = await response.json();
  console.log("\nUpload response:");
  console.log(JSON.stringify(uploadResult, null, 2));

  const counts = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM customers WHERE brand_id = $1", [brand.id]),
    pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE brand_id = $1", [brand.id]),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM customer_metrics cm
       INNER JOIN customers c ON c.id = cm.customer_id
       WHERE c.brand_id = $1`,
      [brand.id]
    ),
    pool.query("SELECT COUNT(*)::int AS count FROM dataset_summary WHERE brand_id = $1", [brand.id]),
    pool.query("SELECT COUNT(*)::int AS count FROM metric_distributions WHERE brand_id = $1", [brand.id]),
    pool.query("SELECT COUNT(*)::int AS count FROM metrics_generation_jobs WHERE brand_id = $1", [brand.id]),
    pool.query(
      "SELECT status, records_processed, started_at, completed_at, error_message FROM metrics_generation_jobs WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1",
      [brand.id]
    ),
  ]);

  console.log("\nDatabase verification:");
  console.log({
    customers: counts[0].rows[0].count,
    orders: counts[1].rows[0].count,
    customer_metrics: counts[2].rows[0].count,
    dataset_summary: counts[3].rows[0].count,
    metric_distributions: counts[4].rows[0].count,
    metrics_generation_jobs: counts[5].rows[0].count,
    latest_job: counts[6].rows[0] || null,
  });

  const historyResponse = await fetch(
    `${BACKEND_URL}/api/metrics/history/${brand.id}?limit=5`
  );
  const historyResult = await historyResponse.json();

  console.log("\nMetrics history response:");
  console.log(JSON.stringify(historyResult, null, 2));
}

main()
  .catch((error) => {
    console.error("Smoke test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

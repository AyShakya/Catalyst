const { query } = require("../config/db");

/**
 * Creates a new brand (First step for a new marketer).
 */
async function createBrand(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Brand name is required" });

    const result = await query(
      "INSERT INTO brands (name) VALUES ($1) RETURNING *",
      [name]
    );

    res.status(201).json({ status: "success", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to create brand" });
  }
}

/**
 * Gets brand details and data ingestion status.
 */
async function getBrandDashboard(req, res) {
  try {
    const { id } = req.params;

    const brandResult = await query("SELECT * FROM brands WHERE id = $1", [id]);
    if (brandResult.rows.length === 0) return res.status(404).json({ error: "Brand not found" });

    // Get latest metrics job status
    const jobResult = await query(
      "SELECT status, started_at, completed_at, records_processed, error_message FROM metrics_generation_jobs WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1",
      [id]
    );

    res.json({
      status: "success",
      data: {
        brand: brandResult.rows[0],
        ingestion: jobResult.rows[0] || { status: 'NO_DATA' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Retrieves metrics and distributions for interactive charts.
 */
async function getBrandAnalytics(req, res) {
  try {
    const { id } = req.params;

    const [summary, distributions] = await Promise.all([
      query("SELECT * FROM dataset_summary WHERE brand_id = $1", [id]),
      query("SELECT metric_name, bucket_label, customer_count FROM metric_distributions WHERE brand_id = $1 ORDER BY metric_name", [id])
    ]);

    res.json({
      status: "success",
      data: {
        summary: summary.rows[0] || null,
        distributions: groupDistributions(distributions.rows)
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

function groupDistributions(rows) {
  return rows.reduce((acc, row) => {
    if (!acc[row.metric_name]) acc[row.metric_name] = [];
    acc[row.metric_name].push({ label: row.bucket_label, count: row.customer_count });
    return acc;
  }, {});
}

async function listBrands(req, res) {
  try {
    const result = await query("SELECT * FROM brands ORDER BY name ASC");
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to list brands" });
  }
}

module.exports = { createBrand, getBrandDashboard, getBrandAnalytics, listBrands };

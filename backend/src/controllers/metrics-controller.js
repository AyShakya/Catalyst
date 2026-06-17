const { query } = require("../config/db");

/**
 * Fetches data for the Customer Health Matrix (Scatter Plot).
 * Returns a sampled set of customers with their loyalty and churn scores.
 */
async function getHealthMatrix(req, res) {
  try {
    const { brandId } = req.params;
    const limit = parseInt(req.query.limit || 500, 10);

    const sql = `
      SELECT 
        cm.customer_id, 
        cm.loyalty_score, 
        cm.churn_score, 
        cm.total_spend,
        c.name as customer_name
      FROM customer_metrics cm
      INNER JOIN customers c ON cm.customer_id = c.id
      WHERE c.brand_id = $1
      ORDER BY cm.customer_id
      LIMIT $2
    `;

    const result = await query(sql, [brandId, limit]);

    res.json({
      status: "success",
      data: result.rows.map(row => ({
        id: row.customer_id,
        loyalty: parseFloat(row.loyalty_score),
        churn: parseFloat(row.churn_score),
        spend: parseFloat(row.total_spend),
        name: row.customer_name
      }))
    });
  } catch (error) {
    console.error("Error fetching health matrix data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches the Customer Value Pyramid (Spend Percentiles).
 */
async function getValuePyramid(req, res) {
  try {
    const { brandId } = req.params;

    const sql = `
      SELECT 
        total_customers,
        p50_spend,
        p75_spend,
        p90_spend,
        p95_spend
      FROM dataset_summary
      WHERE brand_id = $1
    `;

    const result = await query(sql, [brandId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No data found for this brand" });
    }

    const row = result.rows[0];

    res.json({
      status: "success",
      data: [
        { label: "All Customers", value: 100, threshold: 0 },
        { label: "Top 50%", value: 50, threshold: parseFloat(row.p50_spend) },
        { label: "Top 25%", value: 25, threshold: parseFloat(row.p75_spend) },
        { label: "Top 10%", value: 10, threshold: parseFloat(row.p90_spend) },
        { label: "Top 5%", value: 5, threshold: parseFloat(row.p95_spend) }
      ]
    });
  } catch (error) {
    console.error("Error fetching value pyramid data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getHealthMatrix,
  getValuePyramid
};

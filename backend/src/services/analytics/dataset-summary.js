const { query } = require("../../config/db");

async function generateDatasetSummary(brandId) {
  const sql = `
    INSERT INTO dataset_summary (
      brand_id,
      total_customers,
      total_orders,
      total_revenue,
      avg_spend,
      median_spend,
      avg_orders_per_customer,
      avg_order_value,
      avg_days_since_purchase,
      avg_loyalty_score,
      avg_churn_score,
      p50_spend,
      p75_spend,
      p90_spend,
      p95_spend,
      generated_at
    )
    SELECT
      $1,
      COUNT(DISTINCT customer_id) as total_customers,
      SUM(total_orders)::INTEGER as total_orders,
      SUM(total_spend)::NUMERIC(14,2) as total_revenue,
      AVG(total_spend)::NUMERIC(14,2) as avg_spend,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spend)::NUMERIC(14,2) as median_spend,
      AVG(total_orders)::NUMERIC(14,4) as avg_orders_per_customer,
      AVG(avg_order_value)::NUMERIC(14,2) as avg_order_value,
      AVG(days_since_last_purchase)::NUMERIC(14,2) as avg_days_since_purchase,
      AVG(loyalty_score)::NUMERIC(6,2) as avg_loyalty_score,
      AVG(churn_score)::NUMERIC(6,2) as avg_churn_score,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spend)::NUMERIC(14,2) as p50_spend,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_spend)::NUMERIC(14,2) as p75_spend,
      PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY total_spend)::NUMERIC(14,2) as p90_spend,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_spend)::NUMERIC(14,2) as p95_spend,
      NOW()
    FROM customer_metrics cm
    INNER JOIN customers c ON cm.customer_id = c.id
    WHERE c.brand_id = $1
    ON CONFLICT (brand_id)
    DO UPDATE SET
      total_customers = EXCLUDED.total_customers,
      total_orders = EXCLUDED.total_orders,
      total_revenue = EXCLUDED.total_revenue,
      avg_spend = EXCLUDED.avg_spend,
      median_spend = EXCLUDED.median_spend,
      avg_orders_per_customer = EXCLUDED.avg_orders_per_customer,
      avg_order_value = EXCLUDED.avg_order_value,
      avg_days_since_purchase = EXCLUDED.avg_days_since_purchase,
      avg_loyalty_score = EXCLUDED.avg_loyalty_score,
      avg_churn_score = EXCLUDED.avg_churn_score,
      p50_spend = EXCLUDED.p50_spend,
      p75_spend = EXCLUDED.p75_spend,
      p90_spend = EXCLUDED.p90_spend,
      p95_spend = EXCLUDED.p95_spend,
      generated_at = NOW();
  `;

  await query(sql, [brandId]);

  const result = await query(
    "SELECT * FROM dataset_summary WHERE brand_id = $1",
    [brandId]
  );

  return result.rows[0] || null;
}

module.exports = { generateDatasetSummary };

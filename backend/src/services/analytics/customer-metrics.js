const { query } = require("../../config/db");

async function calculateCustomerMetrics(brandId, db = { query }) {
  const calculateSQL = `
    WITH customer_base AS (
      SELECT id AS customer_id
      FROM customers
      WHERE brand_id = $1
    ),
    order_stats AS (
      SELECT
        cb.customer_id,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.amount), 0) as total_spend,
        COALESCE(AVG(o.amount), 0) as avg_order_value,
        MAX(o.amount) as highest_order_value,
        MIN(o.amount) as lowest_order_value,
        MIN(o.order_date) as first_purchase_date,
        MAX(o.order_date) as last_purchase_date
      FROM customer_base cb
      LEFT JOIN orders o
        ON o.customer_id = cb.customer_id
       AND o.brand_id = $1
      GROUP BY cb.customer_id
    ),
    gaps_calculation AS (
      SELECT
        customer_id,
        total_orders,
        total_spend,
        avg_order_value,
        highest_order_value,
        lowest_order_value,
        first_purchase_date,
        last_purchase_date,
        CASE
          WHEN last_purchase_date IS NULL THEN NULL
          ELSE (CURRENT_DATE - last_purchase_date)::INTEGER
        END as days_since_last_purchase,
        CASE
          WHEN total_orders <= 1 THEN NULL
          ELSE (last_purchase_date - first_purchase_date)::NUMERIC / (total_orders - 1)
        END as avg_days_between_orders
      FROM order_stats
    ),
    frequency_calculation AS (
      SELECT
        customer_id,
        total_orders,
        total_spend,
        avg_order_value,
        highest_order_value,
        lowest_order_value,
        first_purchase_date,
        last_purchase_date,
        days_since_last_purchase,
        avg_days_between_orders,
        total_spend as customer_lifetime_value,
        (
          total_orders::NUMERIC /
          GREATEST(
            (
              (EXTRACT(YEAR FROM age(last_purchase_date, first_purchase_date)) * 12) +
              EXTRACT(MONTH FROM age(last_purchase_date, first_purchase_date)) + 1
            )::NUMERIC,
            1
          )
        )::NUMERIC(14,4) as purchase_frequency
      FROM gaps_calculation
    ),
    percentile_ranks AS (
      SELECT
        $1 as brand_id,
        PERCENTILE_CONT(0.0) WITHIN GROUP (ORDER BY total_spend) as p0_spend,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_spend) as p25_spend,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total_spend) as p50_spend,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_spend) as p75_spend,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total_spend) as p90_spend,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_spend) as p95_spend,
        PERCENTILE_CONT(1.0) WITHIN GROUP (ORDER BY total_spend) as p100_spend,
        AVG(avg_days_between_orders) FILTER (WHERE avg_days_between_orders IS NOT NULL) as avg_gap_days
      FROM frequency_calculation
    ),
    loyalty_churn_calculation AS (
      SELECT
        fc.customer_id,
        fc.total_orders,
        fc.total_spend,
        fc.avg_order_value,
        fc.highest_order_value,
        fc.lowest_order_value,
        fc.first_purchase_date,
        fc.last_purchase_date,
        fc.days_since_last_purchase,
        fc.avg_days_between_orders,
        fc.customer_lifetime_value,
        fc.purchase_frequency,
        pr.p0_spend,
        pr.p25_spend,
        pr.p50_spend,
        pr.p75_spend,
        pr.p90_spend,
        pr.p95_spend,
        pr.p100_spend,
        pr.avg_gap_days,
        ROUND(
          (
            (
              CASE
                WHEN pr.p100_spend > pr.p0_spend THEN
                  (LEAST(fc.total_spend, pr.p100_spend) - pr.p0_spend) / (pr.p100_spend - pr.p0_spend) * 40
                ELSE 0
              END +
              CASE
                WHEN fc.purchase_frequency > 0 THEN LEAST(fc.purchase_frequency, 10) * 4
                ELSE 0
              END +
              CASE
                WHEN pr.avg_gap_days > 0 AND fc.avg_days_between_orders IS NOT NULL AND fc.days_since_last_purchase IS NOT NULL THEN
                  GREATEST(0, (1 - LEAST(fc.days_since_last_purchase::NUMERIC / pr.avg_gap_days, 1)) * 20)
                ELSE 0
              END
            )
          )::NUMERIC,
          2
        )::NUMERIC(6,2) as loyalty_score,
        ROUND(
          (
            CASE
              WHEN pr.avg_gap_days > 0 AND fc.avg_days_between_orders IS NOT NULL AND fc.avg_days_between_orders > 0 AND fc.days_since_last_purchase IS NOT NULL THEN
                LEAST(
                  ((fc.days_since_last_purchase::NUMERIC / fc.avg_days_between_orders) * 100),
                  100
                )
              ELSE 0
            END
          )::NUMERIC,
          2
        )::NUMERIC(6,2) as churn_score
      FROM frequency_calculation fc
      CROSS JOIN percentile_ranks pr
    )
    INSERT INTO customer_metrics (
      customer_id,
      total_spend,
      total_orders,
      avg_order_value,
      highest_order_value,
      lowest_order_value,
      first_purchase_date,
      last_purchase_date,
      days_since_last_purchase,
      customer_lifetime_value,
      avg_days_between_orders,
      purchase_frequency,
      loyalty_score,
      churn_score,
      updated_at
    )
    SELECT
      customer_id,
      total_spend,
      total_orders,
      avg_order_value,
      highest_order_value,
      lowest_order_value,
      first_purchase_date,
      last_purchase_date,
      days_since_last_purchase,
      customer_lifetime_value,
      avg_days_between_orders,
      purchase_frequency,
      loyalty_score,
      churn_score,
      NOW()
    FROM loyalty_churn_calculation
    ON CONFLICT (customer_id)
    DO UPDATE SET
      total_spend = EXCLUDED.total_spend,
      total_orders = EXCLUDED.total_orders,
      avg_order_value = EXCLUDED.avg_order_value,
      highest_order_value = EXCLUDED.highest_order_value,
      lowest_order_value = EXCLUDED.lowest_order_value,
      first_purchase_date = EXCLUDED.first_purchase_date,
      last_purchase_date = EXCLUDED.last_purchase_date,
      days_since_last_purchase = EXCLUDED.days_since_last_purchase,
      customer_lifetime_value = EXCLUDED.customer_lifetime_value,
      avg_days_between_orders = EXCLUDED.avg_days_between_orders,
      purchase_frequency = EXCLUDED.purchase_frequency,
      loyalty_score = EXCLUDED.loyalty_score,
      churn_score = EXCLUDED.churn_score,
      updated_at = NOW();
  `;

  await db.query(calculateSQL, [brandId]);

  const countResult = await db.query(
    "SELECT COUNT(*) as count FROM customer_metrics WHERE customer_id IN (SELECT id FROM customers WHERE brand_id = $1)",
    [brandId]
  );

  return {
    metrics_calculated: parseInt(countResult.rows[0].count, 10),
  };
}

module.exports = { calculateCustomerMetrics };

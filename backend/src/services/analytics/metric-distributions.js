const { query } = require("../../config/db");

const DISTRIBUTION_BUCKETS = {
  total_spend: [
    { label: "0-1000", min: 0, max: 1000 },
    { label: "1000-5000", min: 1000, max: 5000 },
    { label: "5000-10000", min: 5000, max: 10000 },
    { label: "10000+", min: 10000, max: Infinity },
  ],
  total_orders: [
    { label: "1", min: 1, max: 1 },
    { label: "2-5", min: 2, max: 5 },
    { label: "6-10", min: 6, max: 10 },
    { label: "10+", min: 10, max: Infinity },
  ],
  days_since_last_purchase: [
    { label: "0-30", min: 0, max: 30 },
    { label: "31-60", min: 31, max: 60 },
    { label: "61-90", min: 61, max: 90 },
    { label: "90+", min: 90, max: Infinity },
  ],
  loyalty_score: [
    { label: "0-25", min: 0, max: 25 },
    { label: "26-50", min: 26, max: 50 },
    { label: "51-75", min: 51, max: 75 },
    { label: "76-100", min: 76, max: 100 },
  ],
  churn_score: [
    { label: "0-25", min: 0, max: 25 },
    { label: "26-50", min: 26, max: 50 },
    { label: "51-75", min: 51, max: 75 },
    { label: "76-100", min: 76, max: 100 },
  ],
};

async function generateMetricDistributions(brandId) {
  await query("DELETE FROM metric_distributions WHERE brand_id = $1", [brandId]);

  for (const [metricName, buckets] of Object.entries(DISTRIBUTION_BUCKETS)) {
    for (const bucket of buckets) {
      const count = await getCustomerCountInBucket(
        brandId,
        metricName,
        bucket.min,
        bucket.max
      );

      await query(
        `INSERT INTO metric_distributions 
        (brand_id, metric_name, bucket_label, customer_count, generated_at)
        VALUES ($1, $2, $3, $4, NOW())`,
        [brandId, metricName, bucket.label, count]
      );
    }
  }

  const result = await query(
    "SELECT COUNT(*) as distribution_count FROM metric_distributions WHERE brand_id = $1",
    [brandId]
  );

  return {
    distributions_generated: parseInt(result.rows[0].distribution_count),
  };
}

async function getCustomerCountInBucket(brandId, metricName, minValue, maxValue) {
  let fieldName = metricName;
  let sqlFragment = `
    SELECT COUNT(*)::INTEGER as count
    FROM customer_metrics cm
    INNER JOIN customers c ON cm.customer_id = c.id
    WHERE c.brand_id = $1
  `;

  if (metricName === "total_spend") {
    sqlFragment += ` AND cm.total_spend >= $2 AND cm.total_spend < $3`;
  } else if (metricName === "total_orders") {
    sqlFragment += ` AND cm.total_orders >= $2 AND cm.total_orders < $3`;
  } else if (metricName === "days_since_last_purchase") {
    sqlFragment += ` AND cm.days_since_last_purchase >= $2 AND cm.days_since_last_purchase < $3`;
  } else if (metricName === "loyalty_score") {
    sqlFragment += ` AND cm.loyalty_score >= $2 AND cm.loyalty_score <= $3`;
  } else if (metricName === "churn_score") {
    sqlFragment += ` AND cm.churn_score >= $2 AND cm.churn_score <= $3`;
  }

  const result = await query(sqlFragment, [brandId, minValue, maxValue]);
  return result.rows[0].count;
}

module.exports = { generateMetricDistributions };

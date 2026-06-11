const { query } = require("../../config/db");

const FALLBACK_SEGMENTS = [
  {
    segment_name: "VIP",
    description: "High-value customers with strong loyalty (loyalty_score > 75 AND total_spend > p90)",
  },
  {
    segment_name: "Inactive",
    description: "Dormant customers (days_since_last_purchase > 90)",
  },
  {
    segment_name: "Frequent Buyers",
    description: "Regular purchasers (total_orders > 10)",
  },
  {
    segment_name: "At Risk",
    description: "Churning customers (churn_score > 75)",
  },
  {
    segment_name: "New Customers",
    description: "Recently acquired (days_since_last_purchase < 30 AND total_orders = 1)",
  },
  {
    segment_name: "High Spenders",
    description: "Top revenue generators (total_spend > p95)",
  },
];

async function seedSegmentRegistry(db = { query }) {
  for (const segment of FALLBACK_SEGMENTS) {
    await db.query(
      `INSERT INTO segment_registry (segment_name, description)
       VALUES ($1, $2)
       ON CONFLICT (segment_name)
       DO UPDATE SET description = EXCLUDED.description`,
      [segment.segment_name, segment.description]
    );
  }

  const result = await db.query(
    "SELECT COUNT(*) as count FROM segment_registry"
  );

  return {
    segments_seeded: parseInt(result.rows[0].count),
  };
}

module.exports = { seedSegmentRegistry };

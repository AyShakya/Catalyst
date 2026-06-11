const { query } = require("../../config/db");

async function getAudienceDiscoveryContext(brandId, db = { query }) {
  const [summaryResult, distributionsResult, registryResult, segmentResult] = await Promise.all([
    db.query("SELECT * FROM dataset_summary WHERE brand_id = $1", [brandId]),
    db.query(
      `SELECT metric_name, bucket_label, customer_count
       FROM metric_distributions
       WHERE brand_id = $1
       ORDER BY metric_name, bucket_label`,
      [brandId]
    ),
    db.query(
      `SELECT metric_name, field_type, allowed_operators, is_attribute
       FROM metric_registry
       ORDER BY metric_name`
    ),
    db.query(
      `SELECT segment_name, description
       FROM segment_registry
       ORDER BY segment_name`
    ),
  ]);

  return {
    dataset_summary: summaryResult.rows[0] || null,
    metric_distributions: groupDistributions(distributionsResult.rows),
    metric_registry: registryResult.rows,
    segment_registry: segmentResult.rows,
  };
}

function groupDistributions(rows) {
  return rows.reduce((groups, row) => {
    if (!groups[row.metric_name]) {
      groups[row.metric_name] = [];
    }

    groups[row.metric_name].push({
      bucket_label: row.bucket_label,
      customer_count: row.customer_count,
    });

    return groups;
  }, {});
}

module.exports = { getAudienceDiscoveryContext };

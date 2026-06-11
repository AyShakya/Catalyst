const { query } = require("../../config/db");
const { buildAudienceQuery } = require("./query-builder");

/**
 * Generates an audience preview snapshot based on a filter plan.
 * 
 * @param {string} brandId - UUID of the brand
 * @param {Object} filterPlan - Validated filter plan
 * @param {Object} datasetSummary - Brand dataset summary for context
 * @returns {Object} Audience snapshot metrics
 */
async function generateAudiencePreview(brandId, filterPlan, datasetSummary) {
  const { sql: baseSql, params } = buildAudienceQuery(brandId, filterPlan, datasetSummary);

  const previewSql = `
    WITH audience_ids AS (
      ${baseSql}
    )
    SELECT 
      COUNT(*)::int AS audience_size,
      COALESCE(AVG(total_spend), 0)::numeric(14,2) AS avg_spend,
      COALESCE(AVG(total_orders), 0)::numeric(14,2) AS avg_orders,
      COALESCE(AVG(loyalty_score), 0)::numeric(6,2) AS avg_loyalty,
      COALESCE(AVG(churn_score), 0)::numeric(6,2) AS avg_churn
    FROM customer_metrics
    WHERE customer_id IN (SELECT customer_id FROM audience_ids)
  `;

  const result = await query(previewSql, params);
  const metrics = result.rows[0];

  return {
    audience_size: parseInt(metrics.audience_size, 10),
    avg_spend: parseFloat(metrics.avg_spend),
    avg_orders: parseFloat(metrics.avg_orders),
    avg_loyalty: parseFloat(metrics.avg_loyalty),
    avg_churn: parseFloat(metrics.avg_churn),
  };
}

module.exports = { generateAudiencePreview };

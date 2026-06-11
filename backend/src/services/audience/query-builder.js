const { query } = require("../../config/db");

const OPERATOR_MAP = {
  ">": ">",
  "<": "<",
  "=": "=",
  ">=": ">=",
  "<=": "<=",
  "!=": "<>",
  "IN": "IN",
};

const FIELD_MAP = {
  total_spend: "cm.total_spend",
  total_orders: "cm.total_orders",
  avg_order_value: "cm.avg_order_value",
  purchase_frequency: "cm.purchase_frequency",
  days_since_last_purchase: "cm.days_since_last_purchase",
  loyalty_score: "cm.loyalty_score",
  churn_score: "cm.churn_score",
  city: "c.city",
  state: "c.state",
  country: "c.country",
};

/**
 * Translates a validated filter plan into a parameterized SQL query.
 * 
 * @param {string} brandId - UUID of the brand
 * @param {Object} filterPlan - Validated filter plan (from AI or Segment)
 * @param {Object} [datasetSummary] - Optional summary to resolve dynamic values like p90
 * @returns {Object} { sql: string, params: Array }
 */
function buildAudienceQuery(brandId, filterPlan, datasetSummary = null) {
  const params = [brandId];
  let paramIndex = 2;

  // 1. Resolve Segment to Filters if necessary
  let logic = filterPlan.logic || "AND";
  let filters = filterPlan.filters || [];

  if (logic === "SEGMENT") {
    const resolved = resolveSegment(filterPlan.segment_name, datasetSummary);
    logic = resolved.logic;
    filters = resolved.filters;
  }

  // 2. Build JOINs and WHERE clauses
  const conditions = [];
  let needsCustomerJoin = false;

  for (const filter of filters) {
    const sqlField = FIELD_MAP[filter.field];
    if (!sqlField) continue;

    if (sqlField.startsWith("c.")) {
      needsCustomerJoin = true;
    }

    const sqlOp = OPERATOR_MAP[filter.operator];
    if (!sqlOp) continue;

    if (sqlOp === "IN") {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      const placeholders = values.map(() => `$${paramIndex++}`).join(", ");
      conditions.push(`${sqlField} IN (${placeholders})`);
      params.push(...values);
    } else {
      conditions.push(`${sqlField} ${sqlOp} $${paramIndex++}`);
      params.push(filter.value);
    }
  }

  // 3. Assemble Final SQL
  let sql = `
    SELECT cm.customer_id
    FROM customer_metrics cm
    INNER JOIN customers c ON c.id = cm.customer_id
    WHERE c.brand_id = $1
  `;

  if (conditions.length > 0) {
    const joiner = ` ${logic} `;
    sql += ` AND (${conditions.join(joiner)})`;
  }

  return { sql, params };
}

/**
 * Hardcoded segment definitions for V1 Fallback.
 * These should ideally move to a segment_registry.definition JSONB column in V2.
 */
function resolveSegment(segmentName, summary) {
  const p90 = summary?.p90_spend || 5000;
  const p95 = summary?.p95_spend || 10000;

  const definitions = {
    "VIP": {
      logic: "AND",
      filters: [
        { field: "loyalty_score", operator: ">", value: 75 },
        { field: "total_spend", operator: ">", value: p90 }
      ]
    },
    "Inactive": {
      logic: "AND",
      filters: [{ field: "days_since_last_purchase", operator: ">", value: 90 }]
    },
    "Frequent Buyers": {
      logic: "AND",
      filters: [{ field: "total_orders", operator: ">", value: 10 }]
    },
    "At Risk": {
      logic: "AND",
      filters: [{ field: "churn_score", operator: ">", value: 75 }]
    },
    "New Customers": {
      logic: "AND",
      filters: [
        { field: "days_since_last_purchase", operator: "<", value: 30 },
        { field: "total_orders", operator: "=", value: 1 }
      ]
    },
    "High Spenders": {
      logic: "AND",
      filters: [{ field: "total_spend", operator: ">", value: p95 }]
    }
  };

  return definitions[segmentName] || { logic: "AND", filters: [] };
}

module.exports = { buildAudienceQuery };

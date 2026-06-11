const { query } = require("../../config/db");

const NUMBER_OPERATORS = [">", "<", "=", ">=", "<=", "!="];
const ATTRIBUTE_OPERATORS = ["=", "!=", "IN"];

const METRIC_REGISTRY = [
  {
    metric_name: "total_spend",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "total_orders",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "avg_order_value",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "purchase_frequency",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "days_since_last_purchase",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "loyalty_score",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "churn_score",
    field_type: "number",
    allowed_operators: NUMBER_OPERATORS,
    is_attribute: false,
  },
  {
    metric_name: "city",
    field_type: "string",
    allowed_operators: ATTRIBUTE_OPERATORS,
    is_attribute: true,
  },
  {
    metric_name: "state",
    field_type: "string",
    allowed_operators: ATTRIBUTE_OPERATORS,
    is_attribute: true,
  },
  {
    metric_name: "country",
    field_type: "string",
    allowed_operators: ATTRIBUTE_OPERATORS,
    is_attribute: true,
  },
];

async function seedMetricRegistry(db = { query }) {
  for (const metric of METRIC_REGISTRY) {
    await db.query(
      `INSERT INTO metric_registry
        (metric_name, field_type, allowed_operators, is_attribute)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (metric_name)
       DO UPDATE SET
        field_type = EXCLUDED.field_type,
        allowed_operators = EXCLUDED.allowed_operators,
        is_attribute = EXCLUDED.is_attribute`,
      [
        metric.metric_name,
        metric.field_type,
        metric.allowed_operators,
        metric.is_attribute,
      ]
    );
  }

  const result = await db.query("SELECT COUNT(*) as count FROM metric_registry");

  return {
    registry_entries_seeded: parseInt(result.rows[0].count, 10),
  };
}

module.exports = { METRIC_REGISTRY, seedMetricRegistry };

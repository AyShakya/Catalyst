const { query } = require("../../config/db");
const { validateOrderRecord } = require("../../utils/validation");

const MAX_ERROR_DETAILS = 50;

async function ingestOrders(records, brandId, db = { query }) {
  const results = {
    successful: 0,
    failed: 0,
    duplicates: 0,
    total_records: records.length,
    error_details_truncated: false,
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const validation = validateOrderRecord(record);

    if (!validation.isValid) {
      results.failed++;
      addError(results, {
        row: i + 2,
        record: record.external_order_id,
        errors: validation.errors,
      });
      continue;
    }

    try {
      const customer = await findCustomerByExternalId(
        brandId,
        record.external_customer_id,
        db
      );

      if (!customer) {
        results.failed++;
        addError(results, {
          row: i + 2,
          record: record.external_order_id,
          error: `Customer not found: ${record.external_customer_id}`,
        });
        continue;
      }

      const existing = await findExistingOrder(
        brandId,
        record.external_order_id,
        db
      );

      if (existing) {
        results.duplicates++;
      } else {
        await createOrder(brandId, customer.id, record, db);
        results.successful++;
      }
    } catch (error) {
      results.failed++;
      addError(results, {
        row: i + 2,
        record: record.external_order_id,
        error: error.message,
      });
    }
  }

  return results;
}

async function findCustomerByExternalId(brandId, externalId, db = { query }) {
  const res = await db.query(
    "SELECT id FROM customers WHERE brand_id = $1 AND external_customer_id = $2",
    [brandId, externalId]
  );
  return res.rows[0] || null;
}

async function findExistingOrder(brandId, externalOrderId, db = { query }) {
  const res = await db.query(
    "SELECT id FROM orders WHERE brand_id = $1 AND external_order_id = $2",
    [brandId, externalOrderId]
  );
  return res.rows[0] || null;
}

async function createOrder(brandId, customerId, record, db = { query }) {
  await db.query(
    `INSERT INTO orders 
    (brand_id, customer_id, external_order_id, amount, currency, order_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      brandId,
      customerId,
      record.external_order_id,
      parseFloat(record.amount) || 0,
      record.currency || "USD",
      record.order_date,
      record.status || "COMPLETED",
    ]
  );
}

function addError(results, error) {
  if (results.errors.length < MAX_ERROR_DETAILS) {
    results.errors.push(error);
    return;
  }

  results.error_details_truncated = true;
}

module.exports = { ingestOrders };

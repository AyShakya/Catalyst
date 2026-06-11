const { query } = require("../../config/db");
const { validateCustomerRecord } = require("../../utils/validation");

const MAX_ERROR_DETAILS = 50;

async function ingestCustomers(records, brandId, db = { query }) {
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
    const validation = validateCustomerRecord(record);

    if (!validation.isValid) {
      results.failed++;
      addError(results, {
        row: i + 2,
        record: record.external_customer_id || record.email,
        errors: validation.errors,
      });
      continue;
    }

    try {
      const existing = await findExistingCustomer(
        brandId,
        record.external_customer_id,
        record.email,
        record.phone,
        db
      );

      if (existing) {
        await updateCustomer(existing.id, record, db);
        results.duplicates++;
      } else {
        await createCustomer(brandId, record, db);
        results.successful++;
      }
    } catch (error) {
      results.failed++;
      addError(results, {
        row: i + 2,
        record: record.external_customer_id || record.email,
        error: error.message,
      });
    }
  }

  return results;
}

async function findExistingCustomer(
  brandId,
  externalId,
  email,
  phone,
  db = { query }
) {
  if (externalId) {
    const res = await db.query(
      "SELECT id FROM customers WHERE brand_id = $1 AND external_customer_id = $2",
      [brandId, externalId]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  if (email) {
    const res = await db.query(
      "SELECT id FROM customers WHERE brand_id = $1 AND email = $2",
      [brandId, email]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  if (phone) {
    const res = await db.query(
      "SELECT id FROM customers WHERE brand_id = $1 AND phone = $2",
      [brandId, phone]
    );
    if (res.rows.length > 0) return res.rows[0];
  }

  return null;
}

async function createCustomer(brandId, record, db = { query }) {
  const res = await db.query(
    `INSERT INTO customers 
    (brand_id, external_customer_id, name, email, phone, city, state, country)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      brandId,
      record.external_customer_id || null,
      record.name || null,
      record.email || null,
      record.phone || null,
      record.city || null,
      record.state || null,
      record.country || null,
    ]
  );
  return res.rows[0].id;
}

async function updateCustomer(customerId, record, db = { query }) {
  await db.query(
    `UPDATE customers 
    SET name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        country = COALESCE($6, country),
        updated_at = NOW()
    WHERE id = $7`,
    [
      record.name || null,
      record.email || null,
      record.phone || null,
      record.city || null,
      record.state || null,
      record.country || null,
      customerId,
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

module.exports = { ingestCustomers };

const { query } = require("../../config/db");
const { validateOrderRecord } = require("../../utils/validation");
const format = require("pg-format");

const MAX_ERROR_DETAILS = 50;
const CHUNK_SIZE = 1000;

async function ingestOrders(records, brandId, db = { query }) {
  const results = {
    successful: 0,
    failed: 0,
    duplicates: 0,
    total_records: records.length,
    error_details_truncated: false,
    errors: [],
  };

  const validRecords = [];

  // Phase 1: In-memory Validation and collection of external_customer_ids
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
    
    validRecords.push(record);
  }

  // Phase 2: Bulk Customer ID Lookup
  const externalCustomerIds = [...new Set(validRecords.map(r => r.external_customer_id))];
  const customerMap = new Map();
  
  if (externalCustomerIds.length > 0) {
    try {
      const lookupSql = format(
        "SELECT id, external_customer_id FROM customers WHERE brand_id = %L AND external_customer_id IN (%L)",
        brandId,
        externalCustomerIds
      );
      const lookupRes = await db.query(lookupSql);
      lookupRes.rows.forEach(row => {
        customerMap.set(row.external_customer_id, row.id);
      });
    } catch (lookupError) {
      console.error("Bulk customer lookup error:", lookupError);
      // If lookup fails, we can't map orders
      results.failed = results.total_records;
      addError(results, { error: `Bulk customer lookup failed: ${lookupError.message}` });
      return results;
    }
  }

  // Phase 3: Chunked Bulk Upserts
  const preparedOrders = [];
  for (const record of validRecords) {
    const internalCustomerId = customerMap.get(record.external_customer_id);
    
    if (!internalCustomerId) {
      results.failed++;
      addError(results, {
        record: record.external_order_id,
        error: `Customer not found: ${record.external_customer_id}. Orders require pre-existing customers.`,
      });
      continue;
    }
    
    preparedOrders.push([
      brandId,
      internalCustomerId,
      record.external_order_id,
      parseFloat(record.amount) || 0,
      record.currency || "USD",
      record.order_date,
      record.status || "COMPLETED"
    ]);
  }

  for (let i = 0; i < preparedOrders.length; i += CHUNK_SIZE) {
    const chunk = preparedOrders.slice(i, i + CHUNK_SIZE);
    
    try {
      // Bulk Insert with Upsert on (brand_id, external_order_id)
      const sql = format(
        `INSERT INTO orders 
         (brand_id, customer_id, external_order_id, amount, currency, order_date, status)
         VALUES %L
         ON CONFLICT (brand_id, external_order_id) 
         WHERE external_order_id IS NOT NULL
         DO NOTHING`,
        chunk
      );
      
      await db.query(sql);
      results.successful += chunk.length;
    } catch (error) {
      console.error("Bulk order ingestion error:", error);
      results.failed += chunk.length;
      addError(results, {
        error: `Chunk processing failed: ${error.message}`,
      });
    }
  }

  return results;
}

function addError(results, error) {
  if (results.errors.length < MAX_ERROR_DETAILS) {
    results.errors.push(error);
    return;
  }

  results.error_details_truncated = true;
}

module.exports = { ingestOrders };

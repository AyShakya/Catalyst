const { query } = require("../../config/db");
const { validateCustomerRecord } = require("../../utils/validation");
const format = require("pg-format");

const MAX_ERROR_DETAILS = 50;
const CHUNK_SIZE = 1000;

async function ingestCustomers(records, brandId, db = { query }) {
  const results = {
    successful: 0,
    failed: 0,
    duplicates: 0,
    total_records: records.length,
    error_details_truncated: false,
    errors: [],
  };

  const validRecords = [];

  // Phase 1: In-memory Validation
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
    
    // Prepare for bulk insert
    validRecords.push([
      brandId,
      record.external_customer_id || null,
      record.name || null,
      record.email || null,
      record.phone || null,
      record.city || null,
      record.state || null,
      record.country || null
    ]);
  }

  // Phase 2: Chunked Bulk Upserts
  for (let i = 0; i < validRecords.length; i += CHUNK_SIZE) {
    const chunk = validRecords.slice(i, i + CHUNK_SIZE);
    
    try {
      // Bulk Insert with Upsert on (brand_id, external_customer_id)
      // We use ON CONFLICT DO UPDATE for external_customer_id
      // For email/phone, if they conflict we might hit a constraint error
      // In a more robust system, we would handle multiple unique constraints
      const sql = format(
        `INSERT INTO customers 
         (brand_id, external_customer_id, name, email, phone, city, state, country)
         VALUES %L
         ON CONFLICT (brand_id, external_customer_id) 
         WHERE external_customer_id IS NOT NULL
         DO UPDATE SET
           name = COALESCE(EXCLUDED.name, customers.name),
           email = COALESCE(EXCLUDED.email, customers.email),
           phone = COALESCE(EXCLUDED.phone, customers.phone),
           city = COALESCE(EXCLUDED.city, customers.city),
           state = COALESCE(EXCLUDED.state, customers.state),
           country = COALESCE(EXCLUDED.country, customers.country),
           updated_at = NOW()`,
        chunk
      );
      
      await db.query(sql);
      results.successful += chunk.length;
    } catch (error) {
      console.error("Bulk customer ingestion error:", error);
      // If a whole chunk fails, we mark them as failed
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

module.exports = { ingestCustomers };

const express = require("express");
const { getClient } = require("../config/db");
const { parseCSV } = require("../utils/csv-parser");
const { ingestCustomers } = require("../services/upload/customer-ingestion");
const { ingestOrders } = require("../services/upload/order-ingestion");
const queueManager = require("../services/analytics/queue-manager");

const router = express.Router();

router.post("/", async (req, res) => {
  let client;

  try {
    const brandId = req.body.brand_id;
    const customerCsv = req.body.customer_csv;
    const orderCsv = req.body.order_csv;

    if (!brandId) {
      return res
        .status(400)
        .json({ error: "brand_id is required in request body" });
    }

    if (!customerCsv && !orderCsv) {
      return res.status(400).json({
        error: "At least one of customer_csv or order_csv is required",
      });
    }

    const customerRecords = customerCsv
      ? await parseUploadedCSV(customerCsv, "customer_csv")
      : null;
    const orderRecords = orderCsv
      ? await parseUploadedCSV(orderCsv, "order_csv")
      : null;

    const results = {
      customers: null,
      orders: null,
      metrics: null,
    };

    client = await getClient();
    await client.query("BEGIN");

    const brandExists = await doesBrandExist(brandId, client);
    if (!brandExists) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "brand_id was not found" });
    }

    if (customerRecords) {
      results.customers = await ingestCustomers(customerRecords, brandId, client);
    }

    if (orderRecords) {
      results.orders = await ingestOrders(orderRecords, brandId, client);
    }

    await client.query("COMMIT");
    client.release();
    client = null;

    // Queue the metrics regeneration in the background
    const job = await queueManager.queueJob(brandId);
    results.metrics = { job_id: job.id, status: job.status };

    res.json({
      status: "success",
      data: results,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Upload error:", error);
    res.status(error.statusCode || 500).json({
      error: error.message,
      status: "failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

async function parseUploadedCSV(csvBase64, fieldName) {
  if (typeof csvBase64 !== "string" || csvBase64.trim() === "") {
    const error = new Error(`${fieldName} must be a non-empty base64 string`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedBase64 = csvBase64.replace(/\s/g, "");
  if (
    normalizedBase64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)
  ) {
    const error = new Error(`${fieldName} must be valid base64`);
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(normalizedBase64, "base64");
  const records = await parseCSV(buffer);

  if (records.length === 0) {
    const error = new Error(`${fieldName} did not contain any records`);
    error.statusCode = 400;
    throw error;
  }

  return records;
}

async function doesBrandExist(brandId, db) {
  const result = await db.query("SELECT 1 FROM brands WHERE id = $1", [brandId]);
  return result.rows.length > 0;
}

module.exports = router;

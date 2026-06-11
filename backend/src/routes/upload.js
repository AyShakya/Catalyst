const express = require("express");
const { parseCSV } = require("../utils/csv-parser");
const { ingestCustomers } = require("../services/upload/customer-ingestion");
const { ingestOrders } = require("../services/upload/order-ingestion");

const router = express.Router();

router.post("/upload", async (req, res) => {
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

    const results = {
      customers: null,
      orders: null,
    };

    if (customerCsv) {
      const customerBuffer = Buffer.from(customerCsv, "base64");
      const customerRecords = await parseCSV(customerBuffer);
      results.customers = await ingestCustomers(customerRecords, brandId);
    }

    if (orderCsv) {
      const orderBuffer = Buffer.from(orderCsv, "base64");
      const orderRecords = await parseCSV(orderBuffer);
      results.orders = await ingestOrders(orderRecords, brandId);
    }

    res.json({
      status: "success",
      data: results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message,
      status: "failed",
    });
  }
});

module.exports = router;

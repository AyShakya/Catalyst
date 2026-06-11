const express = require("express");
const {
  regenerateMetrics,
  getMetricsJobHistory,
} = require("../services/analytics/metrics-generator");

const router = express.Router();

router.post("/rebuild", async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res
        .status(400)
        .json({ error: "brand_id is required in request body" });
    }

    const result = await regenerateMetrics(brand_id);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Metrics rebuild error:", error);
    res.status(500).json({
      error: error.message,
      status: "failed",
    });
  }
});

router.get("/history/:brand_id", async (req, res) => {
  try {
    const { brand_id } = req.params;
    const limit = req.query.limit || 10;

    const jobs = await getMetricsJobHistory(brand_id, parseInt(limit));

    res.json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching metrics history:", error);
    res.status(500).json({
      error: error.message,
      status: "failed",
    });
  }
});

module.exports = router;

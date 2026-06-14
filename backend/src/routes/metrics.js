const express = require("express");
const { query } = require("../config/db");
const {
  regenerateMetrics,
  getMetricsJobHistory,
} = require("../services/analytics/metrics-generator");
const { getHealthMatrix, getValuePyramid } = require("../controllers/metrics-controller");

const router = express.Router();

router.get("/brands/:brandId/health-matrix", getHealthMatrix);
router.get("/brands/:brandId/value-pyramid", getValuePyramid);

router.post("/rebuild", async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res
        .status(400)
        .json({ error: "brand_id is required in request body" });
    }

    if (!(await doesBrandExist(brand_id))) {
      return res.status(404).json({ error: "brand_id was not found" });
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
    const limit = parseLimit(req.query.limit);

    if (!(await doesBrandExist(brand_id))) {
      return res.status(404).json({ error: "brand_id was not found" });
    }

    const jobs = await getMetricsJobHistory(brand_id, limit);

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

function parseLimit(rawLimit) {
  const parsedLimit = parseInt(rawLimit || 10, 10);

  if (Number.isNaN(parsedLimit)) {
    return 10;
  }

  return Math.min(Math.max(parsedLimit, 1), 100);
}

async function doesBrandExist(brandId) {
  const result = await query("SELECT 1 FROM brands WHERE id = $1", [brandId]);
  return result.rows.length > 0;
}

module.exports = router;

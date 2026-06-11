const express = require("express");
const { createBrand, getBrandDashboard, getBrandAnalytics } = require("../controllers/brand-controller");

const router = express.Router();

router.post("/", createBrand);
router.get("/:id", getBrandDashboard);
router.get("/:id/analytics", getBrandAnalytics);

module.exports = router;

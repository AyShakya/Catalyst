const express = require("express");
const { createBrand, getBrandDashboard, getBrandAnalytics, listBrands } = require("../controllers/brand-controller");

const router = express.Router();

router.post("/", createBrand);
router.get("/", listBrands);
router.get("/:id", getBrandDashboard);
router.get("/:id/analytics", getBrandAnalytics);

module.exports = router;

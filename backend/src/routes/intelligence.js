const express = require("express");
const { getOpportunityFeed, getExecutiveBrief } = require("../controllers/intelligence-controller");

const router = express.Router();

router.get("/:brandId/opportunities", getOpportunityFeed);
router.get("/:brandId/executive-brief", getExecutiveBrief);

module.exports = router;

const express = require("express");
const { proposeCampaign, updateCampaign, getCampaign, deleteCampaign, executeCampaign, getCampaignMetrics, listCampaigns } = require("../controllers/campaign-controller");

const router = express.Router();

router.post("/propose", proposeCampaign);
router.get("/", listCampaigns);
router.get("/:id", getCampaign);
router.get("/:id/metrics", getCampaignMetrics);
router.patch("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);
router.post("/:id/execute", executeCampaign);

module.exports = router;

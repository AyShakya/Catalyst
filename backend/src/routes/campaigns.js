const express = require("express");
const { proposeCampaign, updateCampaign, getCampaign, deleteCampaign, executeCampaign, getCampaignMetrics, listCampaigns, getCampaignMilestones, getCampaignActivity } = require("../controllers/campaign-controller");

const router = express.Router();

router.post("/propose", proposeCampaign);
router.get("/", listCampaigns);
router.get("/:id", getCampaign);
router.get("/:id/metrics", getCampaignMetrics);
router.get("/:id/milestones", getCampaignMilestones);
router.get("/:id/activity", getCampaignActivity);
router.patch("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);
router.post("/:id/execute", executeCampaign);

module.exports = router;

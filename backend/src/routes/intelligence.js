const express = require("express");
const intelligenceController = require("../controllers/intelligence-controller");

const router = express.Router();

router.get("/:brandId/opportunities", intelligenceController.getOpportunityFeed);
router.get("/:brandId/executive-brief", intelligenceController.getExecutiveBrief);

// Strategist Chat
router.post("/:brandId/chat", intelligenceController.chatWithStrategist);

// Session State
router.get("/session/:sessionId", intelligenceController.getStrategistSession);

// Launch Campaign from Strategist
router.post("/:brandId/launch", intelligenceController.launchStrategistCampaign);

module.exports = router;

const express = require("express");
const intelligenceController = require("../controllers/intelligence-controller");
const strategistController = require("../controllers/strategist-controller");

const router = express.Router();

/**
 * @route   GET /api/intelligence/:brandId/opportunities
 * @desc    Proactively tells marketers what they should do based on deterministic rules.
 */
router.get("/:brandId/opportunities", intelligenceController.getOpportunityFeed);

/**
 * @route   GET /api/intelligence/:brandId/executive-brief
 * @desc    Provides a business-level summary of health, risks, and recommendations.
 */
router.get("/:brandId/executive-brief", intelligenceController.getExecutiveBrief);

router.post("/:brandId/strategist/chat/stream", strategistController.chatWithStrategistStream);

/**
 * @route   POST /api/intelligence/:brandId/strategist/chat
 * @desc    Interactive chat with the AI Marketing Strategist. 
 *          Maintains a persistent session and draft versioning.
 */
router.post("/:brandId/strategist/chat", strategistController.chatWithStrategist);

/**
 * @route   GET /api/intelligence/:brandId/strategist/session/:sessionId
 * @desc    Retrieves the full history and latest campaign draft for a strategist session.
 */
router.get("/:brandId/strategist/session/:sessionId", strategistController.getStrategistSession);

/**
 * @route   GET /api/intelligence/:brandId/strategist/sessions
 * @desc    Retrieves all active sessions for a given brand.
 */
router.get("/:brandId/strategist/sessions", strategistController.getActiveSessions);

/**
 * @route   DELETE /api/intelligence/:brandId/strategist/session/:sessionId
 * @desc    Closes/rejects an active session.
 */
router.delete("/:brandId/strategist/session/:sessionId", strategistController.closeSession);

/**
 * @route   POST /api/intelligence/:brandId/strategist/launch
 * @desc    Converts the latest strategist draft into a formal campaign and locks the session.
 */
router.post("/:brandId/strategist/launch", strategistController.launchStrategistCampaign);

module.exports = router;

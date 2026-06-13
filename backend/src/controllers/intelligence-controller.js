const opportunityFeedService = require("../services/intelligence/opportunity-feed");
const executiveBriefService = require("../services/intelligence/executive-brief");
const strategistChatService = require("../services/intelligence/strategist-chat");

async function getOpportunityFeed(req, res) {
  try {
    const { brandId } = req.params;
    
    await opportunityFeedService.refreshOpportunities(brandId);
    const opportunities = await opportunityFeedService.getOpportunities(brandId);
    
    res.json({
      status: "success",
      data: opportunities
    });
  } catch (error) {
    console.error("Error in getOpportunityFeed:", error);
    res.status(500).json({ error: "Failed to fetch opportunity feed" });
  }
}

async function getExecutiveBrief(req, res) {
  try {
    const { brandId } = req.params;
    const brief = await executiveBriefService.generateBrief(brandId);
    
    res.json({
      status: "success",
      data: brief
    });
  } catch (error) {
    console.error("Error in getExecutiveBrief:", error);
    res.status(500).json({ error: "Failed to generate executive brief" });
  }
}

async function chatWithStrategist(req, res) {
  try {
    const { brandId } = req.params;
    const { sessionId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await strategistChatService.processMessage(brandId, sessionId, message);

    res.json({
      status: "success",
      data: result
    });
  } catch (error) {
    console.error("Error in chatWithStrategist:", error);
    res.status(500).json({ error: "Strategist failed to respond" });
  }
}

async function getStrategistSession(req, res) {
  try {
    const { sessionId } = req.params;
    const sessionState = await strategistChatService.getSessionState(sessionId);

    res.json({
      status: "success",
      data: sessionState
    });
  } catch (error) {
    console.error("Error in getStrategistSession:", error);
    res.status(500).json({ error: "Failed to fetch session state" });
  }
}

async function launchStrategistCampaign(req, res) {
  try {
    const { brandId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const result = await strategistChatService.launchCampaign(brandId, sessionId);

    res.json({
      status: "success",
      data: result
    });
  } catch (error) {
    console.error("Error in launchStrategistCampaign:", error);
    res.status(500).json({ error: error.message || "Failed to launch campaign" });
  }
}

module.exports = { 
  getOpportunityFeed, 
  getExecutiveBrief,
  chatWithStrategist,
  getStrategistSession,
  launchStrategistCampaign
};

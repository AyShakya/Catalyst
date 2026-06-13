const opportunityFeedService = require("../services/intelligence/opportunity-feed");
const executiveBriefService = require("../services/intelligence/executive-brief");

async function getOpportunityFeed(req, res) {
  try {
    const { brandId } = req.params;
    
    // Refresh opportunities (Deterministic, fast)
    // In a real production app, we might want to refresh this in the background
    // but for now, we'll do it on-demand as requested in spec "On dashboard load"
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

module.exports = { getOpportunityFeed, getExecutiveBrief };

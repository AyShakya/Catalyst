const { query } = require("../../config/db");
const aiService = require("../ai/ai-service");
const campaignIntelligenceService = require("./campaign-intelligence");

/**
 * Weekly Executive Brief Service
 * Generates AI-powered business summaries.
 */
class ExecutiveBriefService {
  /**
   * Generates a concise executive brief for the brand.
   * @param {string} brandId 
   */
  async generateBrief(brandId) {
    try {
      // 1. Gather all required context data
      const [summaryResult, insightsResult, campaignIntell] = await Promise.all([
        query("SELECT * FROM dataset_summary WHERE brand_id = $1", [brandId]),
        query("SELECT * FROM business_insights WHERE brand_id = $1 ORDER BY severity = 'CRITICAL' DESC, severity = 'HIGH' DESC, created_at DESC LIMIT 5", [brandId]),
        campaignIntelligenceService.getCampaignIntelligenceSummary(brandId)
      ]);

      if (summaryResult.rows.length === 0) {
        return {
          brief: "Insufficient data to generate an executive brief. Please upload customer and order data to get started.",
          status: "INCOMPLETE_DATA"
        };
      }

      const summary = summaryResult.rows[0];
      const insights = insightsResult.rows;

      // Calculate active campaigns (simplified: campaigns created in last 30 days)
      const activeCampaignsRes = await query(
        "SELECT COUNT(*) as count FROM campaigns WHERE brand_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
        [brandId]
      );
      const activeCampaigns = activeCampaignsRes.rows[0].count;

      // Construct Executive Context
      const executiveContext = {
        total_revenue: summary.total_revenue,
        total_customers: summary.total_customers,
        active_campaigns: parseInt(activeCampaigns),
        best_performing_goal: Object.keys(campaignIntell).sort((a, b) => campaignIntell[b].avg_conversion_rate - campaignIntell[a].avg_conversion_rate)[0] || "N/A",
        top_opportunities: insights.map(i => i.title),
        risk_metrics: {
          avg_churn_score: summary.avg_churn_score,
          avg_loyalty_score: summary.avg_loyalty_score
        }
      };

      // 2. Call AI to generate the brief
      const messages = [
        {
          role: "system",
          content: this._buildSystemPrompt()
        },
        {
          role: "user",
          content: JSON.stringify({
            executive_context: executiveContext,
            business_insights: insights.map(i => ({ title: i.title, description: i.description, severity: i.severity })),
            campaign_intelligence: campaignIntell
          }, null, 2)
        }
      ];

      const aiResponse = await aiService.callModel(messages, {
        temperature: 0.5,
        response_format: { type: "json_object" } // Even though it's prose, we can ask for a structured response
      });

      return {
        brief: aiResponse.executive_summary,
        key_metrics: executiveContext,
        generated_at: new Date()
      };

    } catch (error) {
      console.error("Error generating executive brief:", error);
      return {
        brief: "An error occurred while generating your executive brief. Our team has been notified.",
        status: "ERROR",
        fallback: true
      };
    }
  }

  _buildSystemPrompt() {
    return [
      "You are a Senior Business Consultant for Catalyst CRM.",
      "Your task is to generate a concise 'Weekly Executive Brief' for a business owner or marketing director.",
      "Focus on:",
      "- Business health (revenue, customer base)",
      "- Opportunities (growth areas found in insights)",
      "- Risks (churn, loyalty gaps)",
      "- Recommended actions (specific, actionable next steps)",
      "",
      "CONSTRAINTS:",
      "- Maximum 150 words.",
      "- Maintain a professional, executive tone.",
      "- Use the provided data accurately.",
      "- Return a JSON object with a single key: 'executive_summary'."
    ].join("\n");
  }
}

module.exports = new ExecutiveBriefService();

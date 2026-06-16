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
      // 0. Check Cache First (Lazy Evaluation)
      // We consider a brief valid if it was generated within the last 7 days
      const cacheResult = await query(
        "SELECT * FROM executive_briefs WHERE brand_id = $1 ORDER BY generated_at DESC LIMIT 1",
        [brandId]
      );
      
      if (cacheResult.rows.length > 0) {
        const cachedBrief = cacheResult.rows[0];
        const ageInMs = new Date() - new Date(cachedBrief.generated_at);
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        
        if (ageInDays < 7) {
          console.log(`Returning cached executive brief for brand ${brandId} (Age: ${ageInDays.toFixed(1)} days)`);
          return {
            brief: cachedBrief.brief_text,
            key_metrics: cachedBrief.key_metrics,
            generated_at: cachedBrief.generated_at,
            cached: true
          };
        }
      }

      console.log(`Generating new executive brief for brand ${brandId}`);

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

      const generatedBrief = aiResponse.executive_summary;
      const generatedAt = new Date();

      // 3. Save to Cache
      await query(
        `INSERT INTO executive_briefs (brand_id, brief_text, key_metrics, generated_at) 
         VALUES ($1, $2, $3, $4)`,
        [brandId, generatedBrief, JSON.stringify(executiveContext), generatedAt]
      );

      return {
        brief: generatedBrief,
        key_metrics: executiveContext,
        generated_at: generatedAt,
        cached: false
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
      "- Maintain a professional, executive tone and proper business grammar.",
      "- Use the provided data accurately.",
      "- Return a JSON object with a single key: 'executive_summary'.",
      "- Structure the response with clear line breaks. Start with an executive paragraph summary, and then list recommended actions clearly using numbered points (e.g., '1) Action item...\\n2) Action item...') each on a new line."
    ].join("\n");
  }
}

module.exports = new ExecutiveBriefService();

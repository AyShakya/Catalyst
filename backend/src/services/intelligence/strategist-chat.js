const { query } = require("../../config/db");
const aiService = require("../ai/ai-service");
const campaignIntelligenceService = require("./campaign-intelligence");
const { generateAudiencePreview } = require("../audience/audience-preview");
const { calculateForecast } = require("../audience/forecasting-engine");
const { validateFilterPlan } = require("../audience/filter-validator");

/**
 * Continuous Strategist Chat Service
 * Handles interactive campaign refinement with draft versioning.
 */
class StrategistChatService {
  /**
   * Processes a user message in a strategist session.
   * 
   * @param {string} brandId 
   * @param {string} sessionId - Existing or new session ID
   * @param {string} message - User prompt
   */
  async processMessage(brandId, sessionId, message) {
    try {
      // 1. Ensure Session exists and is NOT launched
      let actualSessionId = sessionId;
      if (!actualSessionId) {
        const sessionRes = await query(
          "INSERT INTO strategist_sessions (brand_id) VALUES ($1) RETURNING id",
          [brandId]
        );
        actualSessionId = sessionRes.rows[0].id;
      } else {
        const checkRes = await query(
          "SELECT status FROM strategist_sessions WHERE id = $1",
          [actualSessionId]
        );
        if (checkRes.rows[0]?.status === 'LAUNCHED') {
          throw new Error("This strategist session is locked as the campaign has already been launched.");
        }
      }

      // 2. Fetch Latest Draft and History
      const [draftRes, historyRes, contextRes, registryRes] = await Promise.all([
        query(
          "SELECT * FROM campaign_drafts WHERE session_id = $1 ORDER BY version DESC LIMIT 1",
          [actualSessionId]
        ),
        query(
          "SELECT role, content FROM strategist_messages WHERE session_id = $1 ORDER BY created_at ASC",
          [actualSessionId]
        ),
        this._getBrandContext(brandId),
        query("SELECT metric_name, field_type, allowed_operators FROM metric_registry")
      ]);

      const currentDraft = draftRes.rows[0]?.draft_json || null;
      const history = historyRes.rows;
      const { summary, distributions, intelligence } = contextRes;
      const registry = registryRes.rows;

      // 3. Construct AI Prompt
      const messages = this._constructMessages(message, history, currentDraft, {
        summary,
        distributions,
        intelligence,
        registry
      });

      // 4. Call AI
      const aiResponse = await aiService.callModel(messages, {
        response_format: { type: "json_object" },
        temperature: 0.5
      });

      // 5. SECURITY LAYER: Validate AI Filters against Registry
      const validation = validateFilterPlan({ filters: aiResponse.draft.filters }, registry);
      if (!validation.isValid) {
        console.warn("AI generated invalid filters, retrying with error context...", validation.errors);
        // Minimal fallback for V1: use existing filters if new ones are invalid
        aiResponse.draft.filters = currentDraft?.filters || [];
      } else {
        aiResponse.draft.filters = validation.plan.filters;
      }

      // 6. TRUTH LAYER: Recompute Audience Snapshot and Forecast
      const snapshot = await generateAudiencePreview(brandId, { filters: aiResponse.draft.filters }, summary);
      const forecast = calculateForecast(snapshot.audience_size);

      const finalDraft = {
        ...aiResponse.draft,
        audience_snapshot: snapshot,
        forecast: {
          delivered: forecast.forecast_delivered,
          opened: forecast.forecast_opened,
          clicked: forecast.forecast_clicked,
          conversions: forecast.forecast_purchased,
          revenue: forecast.forecast_purchased * (snapshot.avg_spend || summary.avg_order_value || 0)
        }
      };

      // 7. Save Progress
      const nextVersion = (draftRes.rows[0]?.version || 0) + 1;
      
      await query("BEGIN");
      await query(
        "INSERT INTO strategist_messages (session_id, role, content) VALUES ($1, 'USER', $2)",
        [actualSessionId, message]
      );
      await query(
        "INSERT INTO strategist_messages (session_id, role, content) VALUES ($1, 'ASSISTANT', $2)",
        [actualSessionId, aiResponse.assistant_message]
      );
      await query(
        `INSERT INTO campaign_drafts (session_id, version, draft_json, change_summary) 
         VALUES ($1, $2, $3, $4)`,
        [actualSessionId, nextVersion, JSON.stringify(finalDraft), aiResponse.change_summary]
      );
      await query("UPDATE strategist_sessions SET updated_at = NOW() WHERE id = $1", [actualSessionId]);
      await query("COMMIT");

      return {
        sessionId: actualSessionId,
        version: nextVersion,
        assistantMessage: aiResponse.assistant_message,
        draft: finalDraft,
        history: [...history, { role: 'USER', content: message }, { role: 'ASSISTANT', content: aiResponse.assistant_message }]
      };

    } catch (error) {
      await query("ROLLBACK").catch(() => {});
      console.error("Strategist Chat Error:", error);
      throw error;
    }
  }

  /**
   * Finalizes the strategist session and creates a formal campaign for execution.
   */
  async launchCampaign(brandId, sessionId) {
    const sessionRes = await query(
      "SELECT status FROM strategist_sessions WHERE id = $1",
      [sessionId]
    );
    
    if (sessionRes.rows[0]?.status === 'LAUNCHED') {
      throw new Error("Campaign has already been launched for this session.");
    }

    const draftRes = await query(
      "SELECT * FROM campaign_drafts WHERE session_id = $1 ORDER BY version DESC LIMIT 1",
      [sessionId]
    );

    if (draftRes.rows.length === 0) {
      throw new Error("No draft found to launch.");
    }

    const draft = draftRes.rows[0].draft_json;

    await query("BEGIN");

    // 1. Create Formal Campaign
    const ALLOWED_GOALS = ['RETENTION', 'ACQUISITION', 'UPSELL', 'WIN_BACK', 'BRAND_AWARENESS'];
    const goal = ALLOWED_GOALS.includes(draft.goal?.toUpperCase()) ? draft.goal.toUpperCase() : 'RETENTION';

    const insertSQL = `
      INSERT INTO campaigns (
        brand_id, goal, campaign_name, campaign_prompt, channel, 
        message_template, reasoning, status, audience_size, 
        forecast_delivered, forecast_opened, forecast_clicked, 
        forecast_purchased, filter_plan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;

    const campaignRes = await query(insertSQL, [
      brandId,
      goal,
      draft.campaign_name,
      'Strategist Session Campaign',
      draft.channel,
      draft.message,
      draft.reasoning,
      'DRAFT', // Starts as DRAFT, then move to executeCampaign flow
      draft.audience_snapshot.audience_size,
      draft.forecast.delivered,
      draft.forecast.opened,
      draft.forecast.clicked,
      draft.forecast.conversions,
      JSON.stringify({ filters: draft.filters })
    ]);

    // 2. Lock Session
    await query(
      "UPDATE strategist_sessions SET status = 'LAUNCHED', updated_at = NOW() WHERE id = $1",
      [sessionId]
    );

    await query("COMMIT");

    return {
      campaignId: campaignRes.rows[0].id,
      status: 'LAUNCHED'
    };
  }

  /**
   * Fetches the latest state of a session.
   */
  async getSessionState(sessionId) {
    const [sessionRes, messagesRes, draftRes] = await Promise.all([
      query("SELECT status FROM strategist_sessions WHERE id = $1", [sessionId]),
      query(
        "SELECT role, content, created_at FROM strategist_messages WHERE session_id = $1 ORDER BY created_at ASC",
        [sessionId]
      ),
      query(
        "SELECT * FROM campaign_drafts WHERE session_id = $1 ORDER BY version DESC LIMIT 1",
        [sessionId]
      )
    ]);

    return {
      status: sessionRes.rows[0]?.status || 'ACTIVE',
      messages: messagesRes.rows,
      latestDraft: draftRes.rows[0]
    };
  }

  _constructMessages(userMessage, history, currentDraft, context) {
    const systemPrompt = `
      You are the Catalyst AI Marketing Strategist. Your goal is to help a marketer refine their campaign strategy.
      
      CORE PRINCIPLES:
      1. DATA-DRIVEN: Use provided brand data to make decisions.
      2. PERSISTENCE: Work against the "CURRENT DRAFT". Refine the existing draft based on feedback.
      3. STRATEGIC: Recommend channels based on "HISTORICAL PERFORMANCE".
      4. SECURITY: You MUST only use fields and operators defined in the "METRIC REGISTRY".
      5. FILTER MANIPULATION: You have full control over the "filters" array. You can add, REMOVE, or update filters.
      6. REASONING: Explain your audience choice and filters clearly.
      
      METRIC REGISTRY (ALLOWED FIELDS):
      ${JSON.stringify(context.registry)}

      OUTPUT FORMAT:
      Always return a valid JSON object:
      {
        "assistant_message": "...",
        "change_summary": "...",
        "draft": {
          "campaign_name": "...",
          "goal": "...",
          "filters": [{"field": "...", "operator": "...", "value": "..."}],
          "channel": "EMAIL/SMS/WHATSAPP",
          "message": "...",
          "reasoning": "..."
        }
      }

      BRAND CONTEXT:
      ${JSON.stringify(context.summary)}
      
      DISTRIBUTIONS:
      ${JSON.stringify(context.distributions)}
      
      HISTORICAL PERFORMANCE:
      ${JSON.stringify(context.intelligence)}

      CURRENT DRAFT:
      ${currentDraft ? JSON.stringify(currentDraft) : "None yet. Create the initial strategy."}
    `;

    const messages = [{ role: "system", content: systemPrompt }];
    history.slice(-6).forEach(msg => messages.push({ role: msg.role.toLowerCase(), content: msg.content }));
    messages.push({ role: "user", content: userMessage });

    return messages;
  }

  async _getBrandContext(brandId) {
    const [summaryRes, distRes, intel] = await Promise.all([
      query("SELECT * FROM dataset_summary WHERE brand_id = $1", [brandId]),
      query("SELECT metric_name, bucket_label, customer_count FROM metric_distributions WHERE brand_id = $1", [brandId]),
      campaignIntelligenceService.getCampaignIntelligenceSummary(brandId)
    ]);

    return {
      summary: summaryRes.rows[0] || {},
      distributions: distRes.rows,
      intelligence: intel
    };
  }
}

module.exports = new StrategistChatService();

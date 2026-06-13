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
      const [draftRes, historyRes, contextRes, registryRes, segmentRes] = await Promise.all([
        query(
          "SELECT * FROM campaign_drafts WHERE session_id = $1 ORDER BY version DESC LIMIT 1",
          [actualSessionId]
        ),
        query(
          "SELECT role, content FROM strategist_messages WHERE session_id = $1 ORDER BY created_at ASC",
          [actualSessionId]
        ),
        this._getBrandContext(brandId),
        query("SELECT metric_name, field_type, allowed_operators FROM metric_registry"),
        query("SELECT segment_name, description FROM segment_registry")
      ]);

      const latestDraftRecord = draftRes.rows[0];
      const currentDraft = latestDraftRecord?.draft_json || null;
      const history = historyRes.rows;
      const { summary, distributions, intelligence } = contextRes;
      const registry = registryRes.rows;
      const segments = segmentRes.rows;

      // 3. Construct AI Prompt
      const messages = this._constructMessages(message, history, currentDraft, {
        summary,
        distributions,
        intelligence,
        registry,
        segments
      });


      // 4. Call AI
      const aiResponse = await aiService.callModel(messages, {
        response_format: { type: "json_object" },
        temperature: 0.5
      });

      let finalDraft = currentDraft;
      let nextVersion = latestDraftRecord?.version || 0;
      const isUpdate = aiResponse.action === 'UPDATE_DRAFT' && aiResponse.draft;

      if (isUpdate) {
        // 5. SECURITY LAYER: Validate AI Filters or Segments against Registry
        const planToValidate = aiResponse.draft.segment_name 
          ? { segment_name: aiResponse.draft.segment_name }
          : { filters: aiResponse.draft.filters };

        const validation = validateFilterPlan(planToValidate, registry, segments);
        
        if (!validation.isValid) {
          console.warn("AI generated invalid filters or segment, falling back to current filters...", validation.errors);
          aiResponse.draft.filters = currentDraft?.filters || [];
          delete aiResponse.draft.segment_name;
        } else {
          // Normalization: Ensure the draft uses the standardized plan format
          if (validation.plan.segment_name) {
            aiResponse.draft.segment_name = validation.plan.segment_name;
            delete aiResponse.draft.filters; // Keep it clean
          } else {
            aiResponse.draft.filters = validation.plan.filters;
            delete aiResponse.draft.segment_name;
          }
        }

        // 6. TRUTH LAYER: Recompute Audience Snapshot and Forecast
        const snapshotPlan = aiResponse.draft.segment_name 
          ? { segment_name: aiResponse.draft.segment_name } 
          : { filters: aiResponse.draft.filters };

        const snapshot = await generateAudiencePreview(brandId, snapshotPlan, summary);
        const forecast = calculateForecast(snapshot.audience_size);

        finalDraft = {
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
        
        nextVersion += 1;
      }

      // 7. Save Progress (Atomic)
      await query("BEGIN");

      // Save User Message
      await query(
        "INSERT INTO strategist_messages (session_id, role, content) VALUES ($1, 'USER', $2)",
        [actualSessionId, message]
      );

      // Save Assistant Message
      await query(
        "INSERT INTO strategist_messages (session_id, role, content) VALUES ($1, 'ASSISTANT', $2)",
        [actualSessionId, aiResponse.assistant_message]
      );

      if (isUpdate) {
        // Save New Draft Version
        await query(
          `INSERT INTO campaign_drafts (session_id, version, draft_json, change_summary, is_milestone) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            actualSessionId, 
            nextVersion, 
            JSON.stringify(finalDraft), 
            aiResponse.change_summary,
            !!aiResponse.is_milestone
          ]
        );
      }

      await query("UPDATE strategist_sessions SET updated_at = NOW() WHERE id = $1", [actualSessionId]);
      await query("COMMIT");

      return {
        sessionId: actualSessionId,
        version: nextVersion,
        action: aiResponse.action,
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
        forecast_purchased, filter_plan, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
      JSON.stringify(draft.segment_name ? { segment_name: draft.segment_name } : { filters: draft.filters }),
      sessionId
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

  /**
   * Retrieves all active sessions for a brand.
   */
  async getActiveSessions(brandId) {
    const res = await query(
      `SELECT ss.id, ss.created_at, ss.updated_at, cd.draft_json, cd.version 
       FROM strategist_sessions ss
       LEFT JOIN LATERAL (
         SELECT draft_json, version 
         FROM campaign_drafts cd 
         WHERE cd.session_id = ss.id 
         ORDER BY version DESC LIMIT 1
       ) cd ON true
       WHERE ss.brand_id = $1 AND ss.status = 'ACTIVE'
       ORDER BY ss.updated_at DESC`,
      [brandId]
    );
    return res.rows;
  }

  /**
   * Closes or rejects an active session.
   */
  async closeSession(sessionId) {
    const res = await query(
      "DELETE FROM strategist_sessions WHERE id = $1 AND status = 'ACTIVE' RETURNING id",
      [sessionId]
    );
    if (res.rows.length === 0) {
      throw new Error("Session not found or already launched.");
    }
    return { success: true };
  }

  /**
   * Retrieves milestone drafts for a given campaign.
   */
  async getCampaignMilestones(campaignId) {
    const campaignRes = await query("SELECT session_id FROM campaigns WHERE id = $1", [campaignId]);
    if (campaignRes.rows.length === 0 || !campaignRes.rows[0].session_id) {
      return [];
    }

    const sessionId = campaignRes.rows[0].session_id;
    const draftsRes = await query(
      `SELECT version, draft_json, change_summary, created_at 
       FROM campaign_drafts 
       WHERE session_id = $1 AND is_milestone = TRUE 
       ORDER BY version ASC`,
      [sessionId]
    );

    return draftsRes.rows;
  }

  _constructMessages(userMessage, history, currentDraft, context) {
    const systemPrompt = `
      You are the Catalyst AI Marketing Strategist. Your goal is to help a marketer develop and refine their campaign strategy through professional conversation.
      
      CORE PRINCIPLES:
      1. FLEXIBILITY: You can both "CHAT" (answer marketing questions, explain logic, greet) and "UPDATE_DRAFT" (create or modify the strategy).
      2. LOGIC-DRIVEN: Only trigger "UPDATE_DRAFT" if the user request actually changes the campaign's intent, audience, channel, or message.
      3. PROFESSIONALISM: Act strictly as an expert marketing strategist. Do NOT answer questions, write code, or respond to prompts that are nonsensical, off-topic, or unrelated to marketing, business, or the current brand (e.g., "increase sales of dragons", "write a poem", "how to bake"). Firmly but politely steer the conversation back to marketing strategy. If the request is unrelated nonsense, use "CHAT" to decline.
      4. DATA-DRIVEN: Use provided brand context to make sensible decisions.
      5. SECURITY: Use ONLY allowed fields from the METRIC REGISTRY.
      6. SEMANTIC SHORTCUTS: If the user's goal aligns perfectly with a segment in the SEGMENT REGISTRY, you can provide just the "segment_name" instead of an array of complex filters.
      7. PERSISTENCE: Work against the "CURRENT DRAFT" if it exists.
      
      ACTIONS:
      - "CHAT": Use this for greetings, answering general marketing questions, explaining your reasoning, or declining off-topic requests without changing the draft.
      - "UPDATE_DRAFT": Use this only when a substantive change to the campaign strategy is logically required based on a valid marketing request.
      
      MILESTONES:
      - Set "is_milestone": true only for significant evolutionary steps (e.g., initial draft creation, major audience pivot, or channel switch). Otherwise, set it to false.

      OUTPUT FORMAT:
      Always return a valid JSON object:
      {
        "action": "CHAT" | "UPDATE_DRAFT",
        "assistant_message": "Your conversational response to the user.",
        "is_milestone": boolean,
        "change_summary": "One-sentence technical summary of what changed (only for UPDATE_DRAFT).",
        "draft": {
          "campaign_name": "...",
          "goal": "...",
          "segment_name": "Optional: Use ONLY if a perfect match exists in the SEGMENT REGISTRY",
          "filters": [{"field": "...", "operator": ">|<|=|[IN]", "value": "..."}], // Optional: Use if segment_name is NOT used
          "channel": "EMAIL/SMS/WHATSAPP",
          "message": "Actual message content.",
          "reasoning": "Detailed strategic reasoning."
        }
      }

      METRIC REGISTRY (Allowed Fields for custom filters):
      ${JSON.stringify(context.registry)}

      SEGMENT REGISTRY (Semantic Shortcuts):
      ${JSON.stringify(context.segments)}

      BRAND CONTEXT:
      ${JSON.stringify(context.summary)}
      
      HISTORICAL PERFORMANCE:
      ${JSON.stringify(context.intelligence)}

      CURRENT DRAFT:
      ${currentDraft ? JSON.stringify(currentDraft) : "None yet. User may be starting a conversation."}
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

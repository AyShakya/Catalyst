const strategistChatService = require("../services/intelligence/strategist-chat");

/**
 * Encapsulates response logic for Strategist-related endpoints.
 * This ensures that even if internal service logic changes, the API 
 * remains stable and modular.
 */
class StrategistResponseFormatter {
  static formatChatResponse(result) {
    return {
      sessionId: result.sessionId,
      version: result.version,
      message: result.assistantMessage,
      draft: this.formatDraft(result.draft),
      history: result.history
    };
  }

  static formatSessionState(state) {
    return {
      status: state.status,
      history: state.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at
      })),
      latestDraft: state.latestDraft ? this.formatDraft(state.latestDraft.draft_json, state.latestDraft.version) : null
    };
  }

  static formatDraft(draft, version) {
    if (!draft) return null;
    return {
      version: version || draft.version,
      name: draft.campaign_name,
      goal: draft.goal,
      channel: draft.channel,
      message: draft.message,
      reasoning: draft.reasoning,
      filters: draft.filters,
      audience: {
        size: draft.audience_snapshot?.audience_size || 0,
        avgSpend: draft.audience_snapshot?.avg_spend || 0,
        avgLoyalty: draft.audience_snapshot?.avg_loyalty || 0,
        avgChurn: draft.audience_snapshot?.avg_churn || 0
      },
      forecast: {
        delivered: draft.forecast?.delivered || 0,
        opened: draft.forecast?.opened || 0,
        clicked: draft.forecast?.clicked || 0,
        conversions: draft.forecast?.conversions || 0,
        revenue: draft.forecast?.revenue || 0
      }
    };
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
      data: StrategistResponseFormatter.formatChatResponse(result)
    });
  } catch (error) {
    console.error("Error in chatWithStrategist:", error.message);
    res.status(error.statusCode || 500).json({ 
      error: error.message || "Strategist failed to respond",
      code: error.code || "STRATEGIST_ERROR"
    });
  }
}

async function getStrategistSession(req, res) {
  try {
    const { sessionId } = req.params;
    const sessionState = await strategistChatService.getSessionState(sessionId);

    res.json({
      status: "success",
      data: StrategistResponseFormatter.formatSessionState(sessionState)
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
      data: {
        campaignId: result.campaignId,
        status: result.status,
        message: "Campaign launched successfully and strategist session locked."
      }
    });
  } catch (error) {
    console.error("Error in launchStrategistCampaign:", error.message);
    res.status(400).json({ error: error.message || "Failed to launch campaign" });
  }
}

async function getActiveSessions(req, res) {
  try {
    const { brandId } = req.params;
    const sessions = await strategistChatService.getActiveSessions(brandId);
    
    const formattedSessions = sessions.map(s => ({
      id: s.id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      latestDraft: StrategistResponseFormatter.formatDraft(s.draft_json, s.version)
    }));

    res.json({
      status: "success",
      data: formattedSessions
    });
  } catch (error) {
    console.error("Error in getActiveSessions:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
}

async function closeSession(req, res) {
  try {
    const { sessionId } = req.params;
    await strategistChatService.closeSession(sessionId);
    res.json({ status: "success", message: "Session closed successfully" });
  } catch (error) {
    console.error("Error in closeSession:", error.message);
    res.status(400).json({ error: error.message || "Failed to close session" });
  }
}

module.exports = {
  chatWithStrategist,
  getStrategistSession,
  launchStrategistCampaign,
  getActiveSessions,
  closeSession
};

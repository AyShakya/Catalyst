const { query } = require("../config/db");
const { refreshCampaignMetrics } = require("../services/analytics/campaign-analytics");

/**
 * Handles incoming events from the Channel Service.
 * 
 * Request Schema:
 * {
 *   "communicationId": "uuid",
 *   "channelMessageId": "string",
 *   "event": "DELIVERED | OPENED | CLICKED | FAILED",
 *   "timestamp": "iso-date",
 *   "payload": {}
 * }
 */
async function handleWebhookEvent(req, res) {
  const { communicationId, event, timestamp, payload } = req.body;

  if (!communicationId || !event) {
    return res.status(400).json({ error: "communicationId and event are required" });
  }

  try {
    // 1. Fetch communication to verify existence and get campaign_id
    const commResult = await query(
      "SELECT id, campaign_id, status FROM communications WHERE id = $1",
      [communicationId]
    );

    if (commResult.rows.length === 0) {
      return res.status(404).json({ error: "Communication record not found" });
    }

    const comm = commResult.rows[0];

    // 2. Security/Idempotency: Don't record same event twice
    const duplicateCheck = await query(
      "SELECT id FROM communication_events WHERE communication_id = $1 AND event_type = $2",
      [communicationId, event]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.json({ status: "ignored", message: "Duplicate event received" });
    }

    // 3. START TRANSACTION
    await query("BEGIN");

    // Update status only if it's a "forward" transition (simplified logic)
    // E.g. don't update to DELIVERED if already OPENED
    const statusPriority = { 'SENT': 1, 'DELIVERED': 2, 'OPENED': 3, 'CLICKED': 4, 'FAILED': 0 };
    const currentPriority = statusPriority[comm.status] || 0;
    const incomingPriority = statusPriority[event] || 0;

    if (incomingPriority > currentPriority || event === 'FAILED') {
      await query(
        "UPDATE communications SET status = $1, updated_at = NOW() WHERE id = $2",
        [event, communicationId]
      );
    }

    // Always record the event audit trail
    await query(
      "INSERT INTO communication_events (communication_id, event_type, timestamp, payload) VALUES ($1, $2, $3, $4)",
      [communicationId, event, timestamp || new Date(), JSON.stringify(payload || {})]
    );

    await query("COMMIT");

    // 4. Trigger Analytics Refresh (Asynchronous/Background)
    setImmediate(() => {
      refreshCampaignMetrics(comm.campaign_id).catch(err => 
        console.error(`Background analytics error for campaign ${comm.campaign_id}:`, err)
      );
    });

    res.json({ status: "success", message: "Event processed" });

  } catch (error) {
    await query("ROLLBACK");
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { handleWebhookEvent };

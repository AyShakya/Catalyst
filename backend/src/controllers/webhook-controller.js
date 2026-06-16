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
  const isBatch = Array.isArray(req.body);
  const events = isBatch ? req.body : [req.body];

  if (events.length === 0) {
    return res.status(400).json({ error: "No events provided" });
  }

  // Basic validation of the first item to ensure correct structure
  if (!events[0] || !events[0].communicationId || !events[0].event) {
    return res.status(400).json({ error: "communicationId and event are required" });
  }

  try {
    const campaignIdsToRefresh = new Set();
    
    // We will run the entire batch processing in a single transaction for efficiency
    await query("BEGIN");

    for (const evt of events) {
      const { communicationId, event, timestamp, payload } = evt;
      if (!communicationId || !event) continue;

      // 1. Fetch communication to verify existence and get campaign_id
      const commResult = await query(
        "SELECT id, campaign_id, status FROM communications WHERE id = $1",
        [communicationId]
      );

      if (commResult.rows.length === 0) {
        console.warn(`[Webhook] Communication record not found for ID: ${communicationId}`);
        continue;
      }

      const comm = commResult.rows[0];
      campaignIdsToRefresh.add(comm.campaign_id);

      // 2. Security/Idempotency: Don't record same event twice
      const duplicateCheck = await query(
        "SELECT id FROM communication_events WHERE communication_id = $1 AND event_type = $2",
        [communicationId, event]
      );

      if (duplicateCheck.rows.length > 0) {
        continue; // Skip duplicate event
      }

      // 3. Update status only if it's a "forward" transition
      const statusPriority = { 'SENT': 1, 'DELIVERED': 2, 'OPENED': 3, 'CLICKED': 4, 'PURCHASED': 5, 'FAILED': 0 };
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
    }

    await query("COMMIT");

    // 4. Trigger Analytics Refresh (Asynchronous/Background) once per affected campaign
    for (const campaignId of campaignIdsToRefresh) {
      setImmediate(() => {
        refreshCampaignMetrics(campaignId).catch(err => 
          console.error(`Background analytics error for campaign ${campaignId}:`, err)
        );
      });
    }

    res.json({ status: "success", message: `${events.length} event(s) processed` });

  } catch (error) {
    await query("ROLLBACK").catch(() => {});
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { handleWebhookEvent };

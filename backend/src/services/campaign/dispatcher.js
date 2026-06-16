const { query } = require("../../config/db");

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";

/**
 * Dispatches all PENDING communications for a campaign.
 * 
 * @param {string} campaignId - UUID of the campaign
 */
async function dispatchCampaign(campaignId) {
  try {
    // 1. Fetch Campaign and its PENDING communications with customer data
    const campaignResult = await query("SELECT * FROM campaigns WHERE id = $1", [campaignId]);
    if (campaignResult.rows.length === 0) throw new Error("Campaign not found");
    const campaign = campaignResult.rows[0];

    const commsResult = await query(`
      SELECT comm.id, comm.customer_id, c.name, c.email, c.phone
      FROM communications comm
      INNER JOIN customers c ON c.id = comm.customer_id
      WHERE comm.campaign_id = $1 AND comm.status = 'PENDING'
    `, [campaignId]);

    const communications = commsResult.rows;
    console.log(`Starting dispatch for campaign ${campaignId}. Total tasks: ${communications.length}`);

    // 2. Process communications (try batching first, fall back to singular if it fails)
    const BATCH_SIZE = 100;
    let useBatch = true;

    for (let i = 0; i < communications.length; i += BATCH_SIZE) {
      const chunk = communications.slice(i, i + BATCH_SIZE);
      
      if (useBatch) {
        const ok = await processDispatchBatch(campaign, chunk);
        if (!ok) {
          useBatch = false;
          // Fallback for this chunk
          for (const comm of chunk) {
            await processDispatch(campaign, comm);
          }
        }
      } else {
        // Singular fallback
        for (const comm of chunk) {
          await processDispatch(campaign, comm);
        }
      }
    }

    // 3. Update campaign status if all dispatched (simplified for V1)
    await query("UPDATE campaigns SET status = 'RUNNING' WHERE id = $1", [campaignId]);

    // Recalculate metrics immediately after dispatching so 'sent' values are populated
    try {
      const { refreshCampaignMetrics } = require("../analytics/campaign-analytics");
      await refreshCampaignMetrics(campaignId);
    } catch (metricErr) {
      console.error(`Error refreshing metrics after dispatch for ${campaignId}:`, metricErr);
    }

    console.log(`Dispatch completed for campaign ${campaignId}`);

  } catch (error) {
    console.error(`Error in campaign dispatch for ${campaignId}:`, error);
  }
}

/**
 * Dispatches a batch of communications.
 * Returns true if successful, false if it failed and needs singular fallback.
 */
async function processDispatchBatch(campaign, comms) {
  const batchData = comms.map(comm => {
    const message = renderTemplate(campaign.message_template, {
      name: comm.name || "Customer",
      email: comm.email,
      phone: comm.phone
    });
    const recipient = getRecipient(campaign.channel, comm);
    return {
      communicationId: comm.id,
      campaignId: campaign.id,
      customerId: comm.customer_id,
      channel: campaign.channel,
      recipient,
      message
    };
  });

  try {
    const response = await fetch(`${CHANNEL_SERVICE_URL}/messages/send-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: batchData })
    });

    if (!response.ok) {
      throw new Error(`Batch endpoint returned status ${response.status}`);
    }

    const result = await response.json();
    if (result.status === "success" && Array.isArray(result.results)) {
      await query("BEGIN");

      for (const resItem of result.results) {
        if (resItem.accepted) {
          await query(
            "UPDATE communications SET status = 'SENT', updated_at = NOW(), sent_at = NOW() WHERE id = $1",
            [resItem.communicationId]
          );
          await query(
            "INSERT INTO communication_events (communication_id, event_type, payload) VALUES ($1, 'SENT', $2)",
            [resItem.communicationId, JSON.stringify({ channelMessageId: resItem.channelMessageId })]
          );
        } else {
          await query(
            "UPDATE communications SET status = 'FAILED', updated_at = NOW() WHERE id = $1",
            [resItem.communicationId]
          );
          await query(
            "INSERT INTO communication_events (communication_id, event_type, payload) VALUES ($1, 'FAILED', $2)",
            [resItem.communicationId, JSON.stringify({ error: resItem.error || "Channel Service rejected request" })]
          );
        }
      }

      await query("COMMIT");
      return true;
    } else {
      throw new Error("Invalid batch response format");
    }
  } catch (error) {
    console.warn(`[Dispatcher] Batch dispatch failed: ${error.message}. Falling back to singular dispatch...`);
    return false;
  }
}

/**
 * Personalizes and sends a single communication.
 */
async function processDispatch(campaign, comm) {
  const message = renderTemplate(campaign.message_template, {
    name: comm.name || "Customer",
    email: comm.email,
    phone: comm.phone
  });

  const recipient = getRecipient(campaign.channel, comm);

  try {
    const response = await fetch(`${CHANNEL_SERVICE_URL}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        communicationId: comm.id,
        campaignId: campaign.id,
        customerId: comm.customer_id,
        channel: campaign.channel,
        recipient: recipient,
        message: message
      })
    });

    const result = await response.json().catch(() => ({ accepted: false }));

    if (response.ok && result.accepted) {
      // Success: Update status and record SENT event
      await query("BEGIN");
      
      await query(
        "UPDATE communications SET status = 'SENT', updated_at = NOW(), sent_at = NOW() WHERE id = $1",
        [comm.id]
      );

      await query(
        "INSERT INTO communication_events (communication_id, event_type, payload) VALUES ($1, 'SENT', $2)",
        [comm.id, JSON.stringify({ channelMessageId: result.channelMessageId })]
      );

      await query("COMMIT");
    } else {
      // Failure at Channel Service
      await updateStatus(comm.id, 'FAILED', { error: result.error || "Channel Service rejected request" });
    }

  } catch (error) {
    // Network or other error
    console.error(`Failed to dispatch communication ${comm.id}:`, error.message);
    await updateStatus(comm.id, 'FAILED', { error: error.message });
  }
}

/**
 * Simple template renderer: replaces {{key}} with data[key]
 */
function renderTemplate(template, data) {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
    // Simple fallbacks for common marketing fields
    if (key === 'name') return "valued customer";
    return match; // Keep the placeholder if no logic applies
  });
}

/**
 * Helper to get the correct recipient field based on channel
 */
function getRecipient(channel, comm) {
  switch (channel) {
    case 'EMAIL': return comm.email;
    case 'SMS': 
    case 'WHATSAPP': return comm.phone;
    default: return comm.email || comm.phone;
  }
}

/**
 * Helper to update communication status
 */
async function updateStatus(commId, status, payload = {}) {
  await query("BEGIN");
  await query(
    "UPDATE communications SET status = $1, updated_at = NOW() WHERE id = $2",
    [status, commId]
  );
  await query(
    "INSERT INTO communication_events (communication_id, event_type, payload) VALUES ($1, $2, $3)",
    [commId, status, JSON.stringify(payload)]
  );
  await query("COMMIT");
}

module.exports = { dispatchCampaign };

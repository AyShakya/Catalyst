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

    // 2. Process each communication
    for (const comm of communications) {
      await processDispatch(campaign, comm);
    }

    // 3. Update campaign status if all dispatched (simplified for V1)
    await query("UPDATE campaigns SET status = 'RUNNING' WHERE id = $1", [campaignId]);
    console.log(`Dispatch completed for campaign ${campaignId}`);

  } catch (error) {
    console.error(`Error in campaign dispatch for ${campaignId}:`, error);
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
    return data[key] !== undefined ? data[key] : match;
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

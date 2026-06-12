const { query } = require("../config/db");
const { calculateForecast } = require("../services/audience/forecasting-engine");
const { generateCampaignStrategy } = require("../services/audience/ai-strategist");
const { buildAudienceQuery } = require("../services/audience/query-builder");
const { dispatchCampaign } = require("../services/campaign/dispatcher");

/**
 * Creates a campaign proposal using AI Pass 2.
 */
async function proposeCampaign(req, res) {
  try {
    const { brand_id: brandId, goal, audience_preview: audiencePreview, filter_plan: filterPlan } = req.body;

    if (!brandId || !goal || !audiencePreview || !filterPlan) {
      return res.status(400).json({ error: "brand_id, goal, audience_preview, and filter_plan are required" });
    }

    // 1. AI Pass 2: Campaign Strategy
    const strategy = await generateCampaignStrategy(goal, audiencePreview);

    // 2. Deterministic Forecast
    const forecast = calculateForecast(audiencePreview.audience_size);

    // 3. Persist as DRAFT
    const insertSQL = `
      INSERT INTO campaigns (
        brand_id, goal, campaign_name, campaign_prompt, channel, 
        message_template, reasoning, status, audience_size, 
        forecast_delivered, forecast_opened, forecast_clicked, 
        forecast_purchased, filter_plan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      brandId,
      goal,
      strategy.campaign_name,
      goal, // campaign_prompt
      strategy.channel,
      strategy.message_template,
      strategy.reasoning,
      'DRAFT',
      audiencePreview.audience_size,
      forecast.forecast_delivered,
      forecast.forecast_opened,
      forecast.forecast_clicked,
      forecast.forecast_purchased,
      JSON.stringify(filterPlan)
    ];

    const result = await query(insertSQL, values);
    const campaign = result.rows[0];

    res.status(201).json({
      status: "success",
      data: {
        campaign,
        forecast,
        ai: {
          model: strategy.model
        }
      }
    });
  } catch (error) {
    console.error("Campaign proposal error:", error);
    res.status(error.statusCode || 500).json({
      error: error.message,
      status: "failed"
    });
  }
}

/**
 * Updates an existing campaign (User modification).
 */
async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Allowed fields for manual update
    const allowedFields = ['campaign_name', 'channel', 'message_template', 'status'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    values.push(id);
    const updateSQL = `
      UPDATE campaigns 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateSQL, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      status: "success",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Campaign update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Deletes a campaign (Rejection).
 */
async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM campaigns WHERE id = $1 RETURNING id", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      status: "success",
      message: "Campaign rejected and deleted"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Campaign Execution Phase 1: Audience Freezing and PII Retrieval.
 * 
 * Process:
 * 1. Identify audience using frozen filter_plan.
 * 2. Store customer IDs in campaign_audience (The Snapshot).
 * 3. Map to individual PII (Name, Email, Phone) and create PENDING communications.
 * 4. This abstracts PII from the user dashboard while ensuring delivery.
 */
async function executeCampaign(req, res) {
  const { id } = req.params;

  try {
    // 1. Fetch Campaign Context
    const campaignResult = await query("SELECT * FROM campaigns WHERE id = $1", [id]);
    if (campaignResult.rows.length === 0) return res.status(404).json({ error: "Campaign not found" });
    
    const campaign = campaignResult.rows[0];
    if (campaign.status !== 'DRAFT' && campaign.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot execute campaign in ${campaign.status} status` });
    }

    const summaryResult = await query("SELECT * FROM dataset_summary WHERE brand_id = $1", [campaign.brand_id]);
    const summary = summaryResult.rows[0] || null;

    // 2. Generate SQL for specific audience
    const { sql: audienceSql, params: audienceParams } = buildAudienceQuery(
      campaign.brand_id, 
      campaign.filter_plan, 
      summary
    );

    // 3. START TRANSACTION: Freeze audience and create communication tasks
    await query("BEGIN");

    // Clear any existing snapshot for this campaign (idempotency)
    await query("DELETE FROM campaign_audience WHERE campaign_id = $1", [id]);
    await query("DELETE FROM communications WHERE campaign_id = $1", [id]);

    // Freeze into campaign_audience
    // We adjust the SQL to include the campaign_id literal
    const campaignIdParamIndex = audienceParams.length + 1;
    const freezeSql = `
      INSERT INTO campaign_audience (campaign_id, customer_id)
      ${audienceSql.replace('SELECT cm.customer_id', `SELECT $${campaignIdParamIndex}, cm.customer_id`)}
    `;
    await query(freezeSql, [...audienceParams, id]);

    // Populate communications (retrieving channel from campaign)
    const commSql = `
      INSERT INTO communications (campaign_id, customer_id, channel, status)
      SELECT $1, customer_id, $2, 'PENDING'
      FROM campaign_audience
      WHERE campaign_id = $1
    `;
    await query(commSql, [id, campaign.channel]);

    // Update campaign status
    await query("UPDATE campaigns SET status = 'RUNNING' WHERE id = $1", [id]);

    await query("COMMIT");

    // 4. Trigger Dispatch Phase (Asynchronous)
    setImmediate(() => {
      dispatchCampaign(id).catch(err => console.error(`Dispatch background error for campaign ${id}:`, err));
    });

    res.json({
      status: "success",
      message: "Campaign execution started. Audience frozen and dispatching in progress.",
      data: {
        campaign_id: id,
        status: 'RUNNING'
      }
    });

  } catch (error) {
    await query("ROLLBACK");
    console.error("Campaign execution error:", error);
    res.status(500).json({ 
      error: "Campaign execution failed during audience freezing",
      details: error.message 
    });
  }
}

async function getCampaignMetrics(req, res) {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM campaign_metrics WHERE campaign_id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.json({
        status: "success",
        data: {
          campaign_id: id,
          total_sent: 0,
          total_delivered: 0,
          total_opened: 0,
          total_clicked: 0,
          delivery_rate: 0,
          open_rate: 0,
          ctr: 0,
          conversion_rate: 0,
          calculated_at: new Date()
        }
      });
    }

    res.json({
      status: "success",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCampaign(req, res) {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM campaigns WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      status: "success",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function listCampaigns(req, res) {
  try {
    const { brand_id } = req.query;
    if (!brand_id) return res.status(400).json({ error: "brand_id query param is required" });

    const result = await query("SELECT * FROM campaigns WHERE brand_id = $1 ORDER BY created_at DESC", [brand_id]);
    res.json({
      status: "success",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { proposeCampaign, updateCampaign, deleteCampaign, executeCampaign, getCampaign, getCampaignMetrics, listCampaigns };

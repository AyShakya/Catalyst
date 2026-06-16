const { query } = require("../config/db");
const { calculateForecast } = require("../services/audience/forecasting-engine");
const { generateCampaignStrategy } = require("../services/audience/ai-strategist");
const { buildAudienceQuery } = require("../services/audience/query-builder");
const { dispatchCampaign } = require("../services/campaign/dispatcher");
const campaignIntelligenceService = require("../services/intelligence/campaign-intelligence");

/**
 * Creates a campaign proposal using AI Pass 2.
 */
/**
 * LEGACY V1 CODE - DEPRECATED
 * Proposes a campaign using the old linear 2-pass AI Strategist.
 * Replaced by the Continuous Strategist Chat flow in V2.
 */
async function proposeCampaign(req, res) {
  try {
    const { brand_id: brandId, goal, audience_preview: audiencePreview, filter_plan: filterPlan } = req.body;

    if (!brandId || !goal || !audiencePreview || !filterPlan) {
      return res.status(400).json({ error: "brand_id, goal, audience_preview, and filter_plan are required" });
    }

    // 1. Fetch full campaign intelligence context
    const intelligenceSummary = await campaignIntelligenceService.getCampaignIntelligenceSummary(brandId);

    // 2. AI Pass 2: Campaign Strategy
    const strategy = await generateCampaignStrategy(goal, audiencePreview, intelligenceSummary);

    // 3. Deterministic Forecast
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
      strategy.goal_category || 'RETENTION', // Standardized category from AI
      strategy.campaign_name,
      goal, // Raw user prompt preserved here
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
    const result = await query(`
      SELECT m.*, 
             COALESCE((
               SELECT COUNT(*)::integer 
               FROM communications 
               WHERE campaign_id = m.campaign_id AND status = 'PURCHASED'
             ), 0) as total_purchased
      FROM campaign_metrics m
      WHERE m.campaign_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.json({
        status: "success",
        data: {
          campaign_id: id,
          total_sent: 0,
          total_delivered: 0,
          total_opened: 0,
          total_clicked: 0,
          total_purchased: 0,
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

    const result = await query(`
      SELECT c.*, 
             COALESCE(m.total_sent, 0) as sent,
             COALESCE(m.total_delivered, 0) as delivered,
             COALESCE(m.total_opened, 0) as opened,
             COALESCE(m.total_clicked, 0) as clicked,
             COALESCE(m.revenue_generated, 0) as revenue
      FROM campaigns c
      LEFT JOIN campaign_metrics m ON c.id = m.campaign_id
      WHERE c.brand_id = $1 
      ORDER BY c.created_at DESC
    `, [brand_id]);
    
    res.json({
      status: "success",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCampaignMilestones(req, res) {
  try {
    const { id } = req.params;
    const { query } = require("../config/db");
    
    const campaignRes = await query("SELECT session_id, created_at, campaign_name FROM campaigns WHERE id = $1", [id]);
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const { session_id: sessionId, created_at: createdAt, campaign_name: campaignName } = campaignRes.rows[0];

    // If no session (Legacy V1), return the campaign creation as the sole milestone
    if (!sessionId) {
      return res.json({
        status: "success",
        data: [{
          version: 1,
          change_summary: `Initial Strategy: ${campaignName}`,
          created_at: createdAt
        }]
      });
    }

    // Fetch milestones from drafts
    const draftsRes = await query(
      `SELECT version, change_summary, created_at 
       FROM campaign_drafts 
       WHERE session_id = $1 AND is_milestone = TRUE 
       ORDER BY version ASC`,
      [sessionId]
    );

    let milestones = draftsRes.rows;

    // If v1 is missing from milestones, fetch it and prepend it
    const hasV1 = milestones.some(m => m.version === 1);
    if (!hasV1) {
      const v1Res = await query(
        "SELECT version, change_summary, created_at FROM campaign_drafts WHERE session_id = $1 AND version = 1",
        [sessionId]
      );
      if (v1Res.rows.length > 0) {
        const v1 = v1Res.rows[0];
        v1.change_summary = v1.change_summary || `Initial Strategy: ${campaignName}`;
        milestones = [v1, ...milestones];
      } else if (milestones.length === 0) {
        // Absolute fallback: use campaign data
        milestones = [{
          version: 1,
          change_summary: `Initial Strategy: ${campaignName}`,
          created_at: createdAt
        }];
      }
    }

    res.json({
      status: "success",
      data: milestones
    });
  } catch (error) {
    console.error("Error in getCampaignMilestones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCampaignActivity(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT ce.id, ce.event_type as status, ce.timestamp as updated_at, cust.name as customer_name, cust.email as customer_email, cust.phone as customer_phone
      FROM communication_events ce
      JOIN communications c ON ce.communication_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.campaign_id = $1
      ORDER BY ce.timestamp DESC
      LIMIT 5
    `, [id]);

    res.json({
      status: "success",
      data: result.rows
    });
  } catch (error) {
    console.error("Error in getCampaignActivity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { proposeCampaign, updateCampaign, deleteCampaign, executeCampaign, getCampaign, getCampaignMetrics, listCampaigns, getCampaignMilestones, getCampaignActivity };

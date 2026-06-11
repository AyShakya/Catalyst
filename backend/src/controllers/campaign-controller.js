const { query } = require("../config/db");
const { calculateForecast } = require("../services/audience/forecasting-engine");
const { generateCampaignStrategy } = require("../services/audience/ai-strategist");

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

module.exports = { proposeCampaign, updateCampaign, getCampaign };

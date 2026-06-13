const { query } = require("../../config/db");
const opportunityFeedService = require("../intelligence/opportunity-feed");
const campaignIntelligenceService = require("../intelligence/campaign-intelligence");

/**
 * Recalculates and persists metrics for a campaign.
 * 
 * Formulas (per spec):
 * - Delivery Rate: delivered / sent
 * - Open Rate: opened / delivered
 * - CTR: clicked / opened
 * - Conversion Rate: clicked / delivered (per spec MVP)
 * 
 * @param {string} campaignId 
 */
async function refreshCampaignMetrics(campaignId) {
  try {
    // 1. Aggregate unique communication counts per state
    const aggregationSql = `
      SELECT 
        COUNT(DISTINCT id) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED')) as total_sent,
        COUNT(DISTINCT id) FILTER (WHERE status IN ('DELIVERED', 'OPENED', 'CLICKED')) as total_delivered,
        COUNT(DISTINCT id) FILTER (WHERE status IN ('OPENED', 'CLICKED')) as total_opened,
        COUNT(DISTINCT id) FILTER (WHERE status = 'CLICKED') as total_clicked
      FROM communications
      WHERE campaign_id = $1
    `;

    const aggResult = await query(aggregationSql, [campaignId]);
    const counts = aggResult.rows[0];

    const sent = parseInt(counts.total_sent) || 0;
    const delivered = parseInt(counts.total_delivered) || 0;
    const opened = parseInt(counts.total_opened) || 0;
    const clicked = parseInt(counts.total_clicked) || 0;

    // 2. Calculate Rates (Deterministic)
    const delivery_rate = sent > 0 ? delivered / sent : 0;
    const open_rate = delivered > 0 ? opened / delivered : 0;
    const ctr = opened > 0 ? clicked / opened : 0;
    const conversion_rate = delivered > 0 ? clicked / delivered : 0;

    // 3. Upsert into campaign_metrics
    const upsertSql = `
      INSERT INTO campaign_metrics (
        campaign_id, total_sent, total_delivered, total_opened, total_clicked,
        delivery_rate, open_rate, ctr, conversion_rate, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (campaign_id) DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opened = EXCLUDED.total_opened,
        total_clicked = EXCLUDED.total_clicked,
        delivery_rate = EXCLUDED.delivery_rate,
        open_rate = EXCLUDED.open_rate,
        ctr = EXCLUDED.ctr,
        conversion_rate = EXCLUDED.conversion_rate,
        calculated_at = NOW()
    `;

    await query(upsertSql, [
      campaignId, sent, delivered, opened, clicked,
      delivery_rate, open_rate, ctr, conversion_rate
    ]);

    // After campaign metrics are updated, refresh business intelligence opportunities
    try {
      const brandRes = await query("SELECT brand_id FROM campaigns WHERE id = $1", [campaignId]);
      if (brandRes.rows.length > 0) {
        const brandId = brandRes.rows[0].brand_id;
        // Refresh opportunities
        await opportunityFeedService.refreshOpportunities(brandId);
        // Refresh campaign intelligence (Async/Background)
        setImmediate(() => {
          campaignIntelligenceService.refreshIntelligence(brandId).catch(err => 
            console.error(`Background intel refresh error for brand ${brandId}:`, err)
          );
        });
      }
    } catch (oppError) {
      console.error(`Failed to refresh intelligence for campaign ${campaignId}:`, oppError);
    }

    console.log(`Metrics refreshed for campaign ${campaignId}`);

  } catch (error) {
    console.error(`Failed to refresh metrics for ${campaignId}:`, error.message);
  }
}

module.exports = { refreshCampaignMetrics };

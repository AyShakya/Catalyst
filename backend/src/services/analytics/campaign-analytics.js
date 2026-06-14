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
    // 1. Aggregate unique communication counts and revenue
    // Attribution logic: Sum order amounts for customers with 'PURCHASED' status, 
    // where the order was created after the campaign was sent.
    const aggregationSql = `
      WITH counts AS (
        SELECT 
          COUNT(DISTINCT id) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED', 'FAILED')) as total_sent,
          COUNT(DISTINCT id) FILTER (WHERE status IN ('DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED')) as total_delivered,
          COUNT(DISTINCT id) FILTER (WHERE status IN ('OPENED', 'CLICKED', 'PURCHASED')) as total_opened,
          COUNT(DISTINCT id) FILTER (WHERE status IN ('CLICKED', 'PURCHASED')) as total_clicked,
          COUNT(DISTINCT id) FILTER (WHERE status = 'PURCHASED') as total_purchased
        FROM communications
        WHERE campaign_id = $1
      ),
      revenue AS (
        SELECT COALESCE(SUM(o.amount), 0) as total_revenue
        FROM communications comm
        JOIN orders o ON o.customer_id = comm.customer_id
        WHERE comm.campaign_id = $1 
          AND comm.status = 'PURCHASED'
          AND o.created_at >= comm.sent_at
      )
      SELECT * FROM counts, revenue
    `;

    const aggResult = await query(aggregationSql, [campaignId]);
    const metrics = aggResult.rows[0];

    const sent = parseInt(metrics.total_sent) || 0;
    const delivered = parseInt(metrics.total_delivered) || 0;
    const opened = parseInt(metrics.total_opened) || 0;
    const clicked = parseInt(metrics.total_clicked) || 0;
    const revenue = parseFloat(metrics.total_revenue) || 0;

    // 2. Calculate Rates (Deterministic)
    const delivery_rate = sent > 0 ? delivered / sent : 0;
    const open_rate = delivered > 0 ? opened / delivered : 0;
    const ctr = opened > 0 ? clicked / opened : 0;
    const conversion_rate = delivered > 0 ? (parseInt(metrics.total_purchased) || 0) / delivered : 0;

    // 3. Upsert into campaign_metrics
    const upsertSql = `
      INSERT INTO campaign_metrics (
        campaign_id, total_sent, total_delivered, total_opened, total_clicked,
        delivery_rate, open_rate, ctr, conversion_rate, revenue_generated, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (campaign_id) DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opened = EXCLUDED.total_opened,
        total_clicked = EXCLUDED.total_clicked,
        delivery_rate = EXCLUDED.delivery_rate,
        open_rate = EXCLUDED.open_rate,
        ctr = EXCLUDED.ctr,
        conversion_rate = EXCLUDED.conversion_rate,
        revenue_generated = EXCLUDED.revenue_generated,
        calculated_at = NOW()
    `;

    await query(upsertSql, [
      campaignId, sent, delivered, opened, clicked,
      delivery_rate, open_rate, ctr, conversion_rate, revenue
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

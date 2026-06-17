const { query, getClient } = require("../../config/db");

/**
 * Campaign Intelligence Layer
 * Aggregates historical campaign performance to help AI learn.
 */
class CampaignIntelligenceService {
  /**
   * Refreshes the persisted campaign intelligence summary for a brand.
   * This runs asynchronously to keep the main flows fast.
   * @param {string} brandId 
   */
  async refreshIntelligence(brandId) {
    try {
      // 1. Calculate the latest intelligence summary
      const calculationSql = `
        SELECT 
          c.goal,
          COUNT(c.id) as campaign_count,
          (
            SELECT channel 
            FROM campaigns c2
            JOIN campaign_metrics cm2 ON c2.id = cm2.campaign_id
            WHERE c2.brand_id = $1 AND c2.goal = c.goal
            GROUP BY channel
            ORDER BY AVG(cm2.conversion_rate) DESC NULLS LAST
            LIMIT 1
          ) as best_channel,
          AVG(cm.ctr) as avg_ctr,
          AVG(cm.conversion_rate) as avg_conversion_rate,
          SUM(cm.revenue_generated) as total_revenue
        FROM campaigns c
        JOIN campaign_metrics cm ON c.id = cm.campaign_id
        WHERE c.brand_id = $1
        GROUP BY c.goal
      `;

      const result = await query(calculationSql, [brandId]);

      // 2. Persist the results in the storage table
      // Start a transaction for the upserts
      const client = await getClient();
      try {
        await client.query("BEGIN");
        
        // Clear existing summaries for this brand to handle changed goals
        await client.query("DELETE FROM campaign_intelligence_summaries WHERE brand_id = $1", [brandId]);

        for (const row of result.rows) {
          await client.query(
            `INSERT INTO campaign_intelligence_summaries 
             (brand_id, goal, campaign_count, best_channel, avg_ctr, avg_conversion_rate, total_revenue, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              brandId, 
              row.goal, 
              parseInt(row.campaign_count), 
              row.best_channel, 
              row.avg_ctr, 
              row.avg_conversion_rate, 
              row.total_revenue
            ]
          );
        }

        await client.query("COMMIT");
      } catch (txnError) {
        await client.query("ROLLBACK").catch(() => {});
        throw txnError;
      } finally {
        client.release();
      }
      console.log(`Campaign intelligence refreshed for brand ${brandId}`);
    } catch (error) {
      console.error(`Failed to refresh campaign intelligence for ${brandId}:`, error);
    }
  }

  /**
   * Retrieves the latest intelligence summary from storage.
   * @param {string} brandId 
   */
  async getCampaignIntelligenceSummary(brandId) {
    try {
      const result = await query(
        "SELECT * FROM campaign_intelligence_summaries WHERE brand_id = $1",
        [brandId]
      );
      
      const summary = {};
      result.rows.forEach(row => {
        summary[row.goal] = {
          count: row.campaign_count,
          best_channel: row.best_channel,
          avg_ctr: parseFloat(row.avg_ctr || 0),
          avg_conversion_rate: parseFloat(row.avg_conversion_rate || 0),
          total_revenue: parseFloat(row.total_revenue || 0),
          updated_at: row.updated_at
        };
      });

      // Fallback: If no summaries found in storage, return empty object
      // (The system will eventually refresh them via async triggers)
      return summary;
    } catch (error) {
      console.error("Error retrieving campaign intelligence:", error);
      return {}; 
    }
  }
}

module.exports = new CampaignIntelligenceService();

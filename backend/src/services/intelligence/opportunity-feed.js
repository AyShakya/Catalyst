const { query } = require("../../config/db");

/**
 * Business Intelligence Layer - Opportunity Feed
 * Deterministic rules to generate actionable insights.
 */
class OpportunityFeedService {
  /**
   * Generates and stores opportunities for a given brand.
   * @param {string} brandId 
   * @param {object} db Optional database client for transactions
   */
  async refreshOpportunities(brandId, db = { query }) {
    try {
      // 1. Get base data for thresholds
      const summaryResult = await db.query(
        "SELECT * FROM dataset_summary WHERE brand_id = $1",
        [brandId]
      );
      
      if (summaryResult.rows.length === 0) {
        console.warn(`No dataset summary found for brand ${brandId}. Skipping opportunity generation.`);
        return [];
      }
      
      const summary = summaryResult.rows[0];
      const p90_spend = summary.p90_spend || 0;
      
      // Get average purchase frequency across all customers
      const avgFreqResult = await db.query(
        "SELECT AVG(purchase_frequency) as avg_freq FROM customer_metrics cm JOIN customers c ON cm.customer_id = c.id WHERE c.brand_id = $1",
        [brandId]
      );
      const avg_purchase_frequency = avgFreqResult.rows[0].avg_freq || 0;

      const opportunities = [];

      // Detector 1: VIP Churn Risk
      // Rule: loyalty_score > 75 AND days_since_last_purchase > 90
      const vipChurnRisk = await this.detectVIPChurnRisk(brandId, db);
      if (vipChurnRisk) opportunities.push(vipChurnRisk);

      // Detector 2: One-Time Buyers
      // Rule: total_orders = 1
      const oneTimeBuyers = await this.detectOneTimeBuyers(brandId, db);
      if (oneTimeBuyers) opportunities.push(oneTimeBuyers);

      // Detector 3: High Spend Low Frequency
      // Rule: total_spend > p90_spend AND purchase_frequency < average_purchase_frequency
      const highSpendLowFreq = await this.detectHighSpendLowFreq(brandId, p90_spend, avg_purchase_frequency, db);
      if (highSpendLowFreq) opportunities.push(highSpendLowFreq);

      // Detector 4: High Churn Segment
      // Rule: churn_score > 75
      const highChurnSegment = await this.detectHighChurnSegment(brandId, db);
      if (highChurnSegment) opportunities.push(highChurnSegment);

      // Detector 5: Regional Opportunity
      // Rule: largest customer concentration by city
      const regionalOpp = await this.detectRegionalOpportunity(brandId, db);
      if (regionalOpp) opportunities.push(regionalOpp);

      // Save to database
      await this.saveOpportunities(brandId, opportunities, db);

      return opportunities;
    } catch (error) {
      console.error("Error generating opportunities:", error);
      // Graceful fallback: return empty array but don't crash
      return [];
    }
  }

  async detectVIPChurnRisk(brandId, db = { query }) {
    const sql = `
      SELECT 
        COUNT(*) as affected_customers,
        SUM(customer_lifetime_value) as total_clv
      FROM customer_metrics cm
      JOIN customers c ON cm.customer_id = c.id
      WHERE c.brand_id = $1
      AND cm.loyalty_score > 75
      AND cm.days_since_last_purchase > 90
    `;
    const result = await db.query(sql, [brandId]);
    const { affected_customers, total_clv } = result.rows[0];

    if (parseInt(affected_customers) > 0) {
      return {
        type: 'VIP_CHURN_RISK',
        title: 'High Value Customers Becoming Inactive',
        description: `${affected_customers} high-value customers haven't purchased in over 90 days.`,
        severity: 'HIGH',
        estimated_impact: parseFloat(total_clv || 0),
        supporting_data: { affected_customers: parseInt(affected_customers) }
      };
    }
    return null;
  }

  async detectOneTimeBuyers(brandId, db = { query }) {
    const sql = `
      SELECT 
        COUNT(*) as affected_customers,
        AVG(avg_order_value) as avg_aov
      FROM customer_metrics cm
      JOIN customers c ON cm.customer_id = c.id
      WHERE c.brand_id = $1
      AND cm.total_orders = 1
    `;
    const result = await db.query(sql, [brandId]);
    const { affected_customers, avg_aov } = result.rows[0];

    if (parseInt(affected_customers) > 0) {
      return {
        type: 'ONE_TIME_BUYERS',
        title: 'Repeat Purchase Opportunity',
        description: `${affected_customers} customers have only made one purchase.`,
        severity: 'MEDIUM',
        estimated_impact: parseInt(affected_customers) * parseFloat(avg_aov || 0),
        supporting_data: { affected_customers: parseInt(affected_customers), avg_order_value: parseFloat(avg_aov || 0) }
      };
    }
    return null;
  }

  async detectHighSpendLowFreq(brandId, p90_spend, avg_purchase_frequency, db = { query }) {
    const sql = `
      SELECT 
        COUNT(*) as affected_customers,
        SUM(total_spend) as total_affected_spend
      FROM customer_metrics cm
      JOIN customers c ON cm.customer_id = c.id
      WHERE c.brand_id = $1
      AND cm.total_spend > $2
      AND cm.purchase_frequency < $3
    `;
    const result = await db.query(sql, [brandId, p90_spend, avg_purchase_frequency]);
    const { affected_customers, total_affected_spend } = result.rows[0];

    if (parseInt(affected_customers) > 0) {
      return {
        type: 'HIGH_SPEND_LOW_FREQ',
        title: 'Retention Opportunity',
        description: `${affected_customers} top-spending customers purchase less frequently than average.`,
        severity: 'HIGH',
        estimated_impact: parseFloat(total_affected_spend || 0) * 0.1, // Hypothetical 10% lift
        supporting_data: { affected_customers: parseInt(affected_customers) }
      };
    }
    return null;
  }

  async detectHighChurnSegment(brandId, db = { query }) {
    const sql = `
      SELECT 
        COUNT(*) as affected_customers
      FROM customer_metrics cm
      JOIN customers c ON cm.customer_id = c.id
      WHERE c.brand_id = $1
      AND cm.churn_score > 75
    `;
    const result = await db.query(sql, [brandId]);
    const { affected_customers } = result.rows[0];

    if (parseInt(affected_customers) > 0) {
      return {
        type: 'HIGH_CHURN_SEGMENT',
        title: 'Immediate Re-engagement Opportunity',
        description: `${affected_customers} customers show high churn risk.`,
        severity: 'CRITICAL',
        estimated_impact: 0, // Hard to estimate without more context
        supporting_data: { affected_customers: parseInt(affected_customers) }
      };
    }
    return null;
  }

  async detectRegionalOpportunity(brandId, db = { query }) {
    const sql = `
      SELECT 
        city,
        COUNT(*) as customer_count
      FROM customers
      WHERE brand_id = $1
      AND city IS NOT NULL
      GROUP BY city
      ORDER BY customer_count DESC
      LIMIT 1
    `;
    const result = await db.query(sql, [brandId]);
    
    if (result.rows.length > 0) {
      const { city, customer_count } = result.rows[0];
      return {
        type: 'REGIONAL_OPPORTUNITY',
        title: 'Regional Campaign Opportunity',
        description: `Largest customer concentration is in ${city} with ${customer_count} customers.`,
        severity: 'MEDIUM',
        estimated_impact: 0,
        supporting_data: { city, customer_count: parseInt(customer_count) }
      };
    }
    return null;
  }

  async saveOpportunities(brandId, opportunities, db = { query }) {
    await db.query("DELETE FROM business_insights WHERE brand_id = $1", [brandId]);
    
    for (const opp of opportunities) {
      await db.query(
        `INSERT INTO business_insights 
         (brand_id, type, title, description, severity, estimated_impact, supporting_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [brandId, opp.type, opp.title, opp.description, opp.severity, opp.estimated_impact, opp.supporting_data]
      );
    }
  }

  async getOpportunities(brandId, db = { query }) {
    const result = await db.query(
      "SELECT * FROM business_insights WHERE brand_id = $1 ORDER BY created_at DESC",
      [brandId]
    );
    return result.rows;
  }
}

module.exports = new OpportunityFeedService();

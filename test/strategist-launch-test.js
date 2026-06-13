require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const path = require('path');
const { pool } = require(path.join(__dirname, '../backend/src/config/db'));
const strategistChatService = require(path.join(__dirname, '../backend/src/services/intelligence/strategist-chat'));

async function runTest() {
  console.log("Starting Strategist Launch Flow Test...");
  
  let brandId;
  try {
    // 1. Setup Test Brand
    const brandRes = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING id", ["Launch Test Brand"]);
    brandId = brandRes.rows[0].id;
    
    // Seed context
    await pool.query(`INSERT INTO dataset_summary (brand_id, total_customers, avg_order_value) VALUES ($1, 1000, 500)`, [brandId]);
    await pool.query(`INSERT INTO metric_registry (metric_name, field_type, allowed_operators) VALUES ('loyalty_score', 'number', ARRAY['>=']) ON CONFLICT DO NOTHING`);

    // 2. Initial Chat
    console.log("Turn 1: Creating strategy...");
    const res1 = await strategistChatService.processMessage(brandId, null, "Bring back high loyalty customers.");
    const sessionId = res1.sessionId;
    console.log(`Session created: ${sessionId}`);

    // 3. Launch Campaign
    console.log("\nLaunching campaign from strategist...");
    const launchRes = await strategistChatService.launchCampaign(brandId, sessionId);
    console.log(`Campaign created: ${launchRes.campaignId}`);
    console.log(`Session status: ${launchRes.status}`);

    // 4. Verify Immutability: Try to chat again
    console.log("\nVerifying immutability (expecting error)...");
    try {
      await strategistChatService.processMessage(brandId, sessionId, "Wait, change the channel to SMS.");
      console.log("FAILED: Chat was allowed after launch!");
    } catch (err) {
      console.log(`SUCCESS: Got expected error - "${err.message}"`);
    }

    // 5. Verify Campaign Content
    const campRes = await pool.query("SELECT * FROM campaigns WHERE id = $1", [launchRes.campaignId]);
    const campaign = campRes.rows[0];
    console.log("\n--- Launched Campaign Details ---");
    console.log(`Name: ${campaign.campaign_name}`);
    console.log(`Channel: ${campaign.channel}`);
    console.log(`Filters: ${campaign.filter_plan}`);
    
    console.log("\nTest Completed Successfully.");
  } catch (error) {
    console.error("Test Failed:", error);
  } finally {
    if (brandId) {
      await pool.query("DELETE FROM brands WHERE id = $1", [brandId]);
    }
    await pool.end();
  }
}

runTest();

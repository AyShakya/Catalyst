require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const path = require('path');
const { pool } = require(path.join(__dirname, '../backend/src/config/db'));
const strategistChatService = require(path.join(__dirname, '../backend/src/services/intelligence/strategist-chat'));

async function runTest() {
  console.log("Starting Strategist Chat V2 Test...");
  
  let brandId;
  try {
    // 1. Setup Test Brand
    const brandRes = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING id", ["Test Brand"]);
    brandId = brandRes.rows[0].id;
    console.log(`Created test brand: ${brandId}`);

    // 2. Seed context data
    await pool.query(`
      INSERT INTO dataset_summary (brand_id, total_customers, total_orders, total_revenue, avg_spend)
      VALUES ($1, 1000, 5000, 500000, 500)
    `, [brandId]);

    await pool.query(`
      INSERT INTO metric_distributions (brand_id, metric_name, bucket_label, customer_count)
      VALUES ($1, 'total_spend', '1000-5000', 200)
    `, [brandId]);

    // 3. Test Message 1: Initial Draft
    console.log("\n--- Turn 1: Initial Request ---");
    const res1 = await strategistChatService.processMessage(brandId, null, "Bring back inactive VIP customers.");
    console.log("Assistant:", res1.assistantMessage);
    console.log("Draft Version:", res1.version);
    console.log("Campaign Name:", res1.draft.campaign_name);
    console.log("Filters:", JSON.stringify(res1.draft.filters));

    // 4. Test Message 2: Refinement
    console.log("\n--- Turn 2: Refinement ---");
    const res2 = await strategistChatService.processMessage(brandId, res1.sessionId, "Do not use discounts, focus on high-quality messaging.");
    console.log("Assistant:", res2.assistantMessage);
    console.log("Draft Version:", res2.version);
    console.log("Change Summary:", res2.draft.reasoning);

    // 5. Verify Draft Versioning
    const draftsRes = await pool.query("SELECT version, change_summary FROM campaign_drafts WHERE session_id = $1 ORDER BY version ASC", [res1.sessionId]);
    console.log("\n--- Draft Versioning History ---");
    draftsRes.rows.forEach(d => console.log(`v${d.version}: ${d.change_summary}`));

    console.log("\nTest Completed Successfully.");
  } catch (error) {
    console.error("Test Failed:", error);
  } finally {
    if (brandId) {
      // Cleanup
      await pool.query("DELETE FROM brands WHERE id = $1", [brandId]);
      console.log("Cleaned up test data.");
    }
    await pool.end();
  }
}

runTest();

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const path = require('path');
const { pool } = require(path.join(__dirname, '../backend/src/config/db'));
const strategistChatService = require(path.join(__dirname, '../backend/src/services/intelligence/strategist-chat'));

async function runTest() {
  console.log("Starting Conversational Strategist Test...");
  
  let brandId;
  try {
    const brandRes = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING id", ["Conversational Test Brand"]);
    brandId = brandRes.rows[0].id;

    // Turn 1: Conversational Greeting
    console.log("\n--- Turn 1: Conversational Greeting ---");
    const res1 = await strategistChatService.processMessage(brandId, null, "Hello, who are you?");
    console.log("Action:", res1.action);
    console.log("Assistant:", res1.assistantMessage);
    console.log("Version:", res1.version);

    // Turn 2: Campaign Creation
    console.log("\n--- Turn 2: Campaign Creation ---");
    const res2 = await strategistChatService.processMessage(brandId, res1.sessionId, "I want to target VIPs with a new email campaign.");
    console.log("Action:", res2.action);
    console.log("Assistant:", res2.assistantMessage);
    console.log("Version:", res2.version);
    console.log("Is Milestone:", (await pool.query("SELECT is_milestone FROM campaign_drafts WHERE session_id = $1 ORDER BY version DESC LIMIT 1", [res1.sessionId])).rows[0].is_milestone);

    // Turn 3: Asking "Why?" (Conversation)
    console.log("\n--- Turn 3: Asking 'Why?' ---");
    const res3 = await strategistChatService.processMessage(brandId, res1.sessionId, "Why did you choose those filters?");
    console.log("Action:", res3.action);
    console.log("Assistant:", res3.assistantMessage);
    console.log("Version:", res3.version); // Should be same as res2

    // Turn 4: Substantive Change
    console.log("\n--- Turn 4: Substantive Change ---");
    const res4 = await strategistChatService.processMessage(brandId, res1.sessionId, "Switch the channel to SMS and only target customers in Mumbai.");
    console.log("Action:", res4.action);
    console.log("Assistant:", res4.assistantMessage);
    console.log("Version:", res4.version); // Should be res2.version + 1

    // Turn 5: Nonsense / Off-topic
    console.log("\n--- Turn 5: Nonsense Input ---");
    const res5 = await strategistChatService.processMessage(brandId, res1.sessionId, "How do I make a chocolate cake?");
    console.log("Action:", res5.action);
    console.log("Assistant:", res5.assistantMessage);
    console.log("Version:", res5.version); // Should be same as res4

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

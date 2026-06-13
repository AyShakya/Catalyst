require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = "http://localhost:5000/api";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runE2E() {
  let brandId;
  let sessionId;
  let campaignId;

  try {
    console.log("=== Phase 1: Data Ingestion ===");
    console.log("1.1 Creating Brand...");
    const brandRes = await axios.post(`${BACKEND_URL}/brands`, { name: "Multi-Scenario E2E Brand" });
    brandId = brandRes.data.data.id;
    console.log(`Brand created: ${brandId}`);

    console.log("1.2 Uploading Data...");
    const customerCsv = Buffer.from(fs.readFileSync(path.join(__dirname, 'customer.csv'), 'utf8')).toString('base64');
    const orderCsv = Buffer.from(fs.readFileSync(path.join(__dirname, 'order.csv'), 'utf8')).toString('base64');
    
    await axios.post(`${BACKEND_URL}/upload`, {
      brand_id: brandId,
      customer_csv: customerCsv,
      order_csv: orderCsv
    });
    console.log("Data uploaded and metrics generation triggered.");

    console.log("Waiting for metrics generation to complete (8 seconds)...");
    await delay(8000);

    console.log("\n=== Phase 2: Intelligence Layer & Executive Brief ===");
    const briefRes = await axios.get(`${BACKEND_URL}/intelligence/${brandId}/executive-brief`);
    console.log("Executive Brief Generated Successfully.");

    console.log("\n=== Phase 3: Strategist Chat (Multi-Scenario) ===");
    
    // Scenario 1: Vague Prompt
    console.log("\n3.1 Scenario: Vague Initial Prompt");
    const chat1Res = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/chat`, {
      message: "Help me get more sales."
    });
    sessionId = chat1Res.data.data.sessionId;
    const msg1 = chat1Res.data.data.history[chat1Res.data.data.history.length - 1];
    console.log("Assistant:", msg1.content);
    console.log("Audience Selected:", chat1Res.data.data.draft?.audience?.size, "customers");

    // Scenario 2: Semantic Shortcut / Predefined Segment
    console.log("\n3.2 Scenario: Semantic Shortcut (Predefined Segment)");
    const chat2Res = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/chat`, {
      sessionId: sessionId,
      message: "Actually, let's just focus on our VIP segment using SMS."
    });
    const msg2 = chat2Res.data.data.history[chat2Res.data.data.history.length - 1];
    console.log("Assistant:", msg2.content);
    console.log("Audience Selected:", chat2Res.data.data.draft?.audience?.size, "customers");

    // Scenario 3: Casual Chat / Why?
    console.log("\n3.3 Scenario: Casual Chat (Asking 'Why?')");
    const chat3Res = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/chat`, {
      sessionId: sessionId,
      message: "Why did you choose SMS instead of email?"
    });
    const msg3 = chat3Res.data.data.history[chat3Res.data.data.history.length - 1];
    console.log("Assistant:", msg3.content);
    
    // Scenario 4: Nonsense Rejection
    console.log("\n3.4 Scenario: Nonsense / Off-topic");
    const chat4Res = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/chat`, {
      sessionId: sessionId,
      message: "Can you help me fix my washing machine?"
    });
    const msg4 = chat4Res.data.data.history[chat4Res.data.data.history.length - 1];
    console.log("Assistant:", msg4.content);

    // Scenario 5: Specific Filter Refinement
    console.log("\n3.5 Scenario: Specific Filter Refinement");
    const chat5Res = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/chat`, {
      sessionId: sessionId,
      message: "Keep the SMS channel, but change the filters. Only target people who have spent more than 500 dollars overall."
    });
    const msg5 = chat5Res.data.data.history[chat5Res.data.data.history.length - 1];
    console.log("Assistant:", msg5.content);
    console.log("Filters Applied:", JSON.stringify(chat5Res.data.data.draft?.filters));
    
    console.log("\n=== Phase 4: Campaign Launch & Execution ===");
    console.log("4.1 Launching Campaign...");
    const launchRes = await axios.post(`${BACKEND_URL}/intelligence/${brandId}/strategist/launch`, {
      sessionId: sessionId
    });
    campaignId = launchRes.data.data.campaignId;
    console.log(`Campaign locked and launched: ${campaignId}`);

    console.log("4.2 Executing Campaign (Dispatching messages)...");
    await axios.post(`${BACKEND_URL}/campaigns/${campaignId}/execute`);
    console.log("Dispatcher triggered.");

    console.log("\n=== Phase 5: Event Capture & Analytics ===");
    console.log("Campaign execution started. Waiting for channel service webhooks to process (20 seconds)...");
    await delay(20000);

    console.log("5.1 Checking Campaign Metrics...");
    const metricsRes = await axios.get(`${BACKEND_URL}/campaigns/${campaignId}/metrics`);
    console.log("Metrics:", JSON.stringify(metricsRes.data.data, null, 2));

    console.log("\n=== E2E Flow Completed Successfully ===");

  } catch (error) {
    console.error("E2E Test Failed:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  } finally {
    if (brandId) {
      // await axios.delete(`${BACKEND_URL}/brands/${brandId}`); // If teardown is needed
    }
  }
}

runE2E();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const pg = require("pg");
const axios = require("axios");

dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const CHANNEL_SERVICE_URL = "http://localhost:3001";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required in backend/.env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
let backendProcess = null;
let channelServiceProcess = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isServiceHealthy(url) {
  try {
    const response = await axios.get(`${url}/health`).catch(err => err.response);
    return response && (response.status === 200 || response.status === 404); // 404 is fine if health check not implemented but server is up
  } catch (error) {
    return false;
  }
}

async function waitForService(url, name, maxAttempts = 30, delayMs = 1000) {
  console.log(`Waiting for ${name} at ${url}...`);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await axios.get(url);
      console.log(`${name} is UP!`);
      return;
    } catch (error) {
      if (error.response || error.code === 'ECONNREFUSED') {
         if (error.code !== 'ECONNREFUSED') {
            console.log(`${name} is UP (returned ${error.response.status})!`);
            return;
         }
      }
    }

    if (attempt < maxAttempts) {
      await delay(delayMs);
    }
  }

  throw new Error(`${name} not reachable at ${url}`);
}

async function startBackend() {
  console.log("Starting Backend...");
  const serverPath = path.join(__dirname, "..", "backend", "src", "server.js");
  backendProcess = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, "..", "backend"),
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT: 3000 },
  });

  await waitForService("http://localhost:3000", "Backend");
}

async function startChannelService() {
  console.log("Starting Channel Service...");
  const serverPath = path.join(__dirname, "..", "channel_service", "server.js");
  channelServiceProcess = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, "..", "channel_service"),
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT: 3001, CRM_WEBHOOK_URL: "http://localhost:3000/api/webhook/events" },
  });

  await waitForService("http://localhost:3001/messages", "Channel Service");
}

async function main() {
  try {
    await startBackend();
    await startChannelService();

    console.log("\n=== Step 1: Data Ingestion ===");
    const brandName = `Test Brand ${Date.now()}`;
    const brandRes = await axios.post(`${BACKEND_URL}/api/brands`, { name: brandName });
    const brandId = brandRes.data.data.id;
    console.log(`Brand created: ${brandId}`);

    const customerCsv = fs.readFileSync(path.join(__dirname, "customer.csv"), "utf8");
    const orderCsv = fs.readFileSync(path.join(__dirname, "order.csv"), "utf8");

    await axios.post(`${BACKEND_URL}/api/upload`, {
      brand_id: brandId,
      customer_csv: Buffer.from(customerCsv).toString("base64"),
      order_csv: Buffer.from(orderCsv).toString("base64"),
    });
    console.log("Data uploaded.");

    console.log("Waiting for metrics generation (5 seconds)...");
    await delay(5000);

    console.log("\n=== Step 2: Create and Execute Campaign ===");
    // Propose a simple campaign
    const proposeRes = await axios.post(`${BACKEND_URL}/api/campaigns/propose`, {
      brand_id: brandId,
      goal: "Test campaign for channel service",
      audience_preview: { audience_size: 10 },
      filter_plan: { rules: [] }
    });
    const campaignId = proposeRes.data.data.campaign.id;
    console.log(`Campaign proposed: ${campaignId}`);

    // Execute the campaign
    console.log("Executing campaign...");
    await axios.post(`${BACKEND_URL}/api/campaigns/${campaignId}/execute`);
    console.log("Campaign execution triggered.");

    console.log("\n=== Step 3: Verify Channel Service Interaction ===");
    console.log("Waiting 10 seconds for events to process...");
    await delay(10000);

    // Check backend communications
    const commsRes = await pool.query("SELECT * FROM communications WHERE campaign_id = $1", [campaignId]);
    console.log(`Total communications in backend: ${commsRes.rows.length}`);
    
    const statuses = commsRes.rows.map(c => c.status);
    console.log(`Backend communication statuses: ${Array.from(new Set(statuses)).join(", ")}`);

    // Check backend events
    const eventsRes = await pool.query(`
      SELECT ce.* 
      FROM communication_events ce
      JOIN communications c ON c.id = ce.communication_id
      WHERE c.campaign_id = $1
    `, [campaignId]);
    console.log(`Total events in backend: ${eventsRes.rows.length}`);
    
    const eventTypes = eventsRes.rows.map(e => e.event_type);
    console.log(`Backend event types: ${Array.from(new Set(eventTypes)).join(", ")}`);

    // Check channel service messages
    const channelMsgsRes = await axios.get(`${CHANNEL_SERVICE_URL}/messages`);
    const relevantMsgs = channelMsgsRes.data.filter(m => m.campaign_id === campaignId);
    console.log(`Total messages in Channel Service: ${relevantMsgs.length}`);

    if (relevantMsgs.length > 0 && eventsRes.rows.length > 0) {
      console.log("\nSUCCESS: Channel Service interaction verified!");
    } else {
      console.log("\nFAILURE: No messages or events found.");
      process.exitCode = 1;
    }

  } catch (error) {
    console.error("Test Failed:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    process.exitCode = 1;
  } finally {
    console.log("\nCleaning up...");
    if (backendProcess) backendProcess.kill();
    if (channelServiceProcess) channelServiceProcess.kill();
    await pool.end();
    console.log("Cleanup complete.");
  }
}

main();

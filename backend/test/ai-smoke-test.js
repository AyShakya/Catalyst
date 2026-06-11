
const dotenv = require("dotenv");
const path = require("path");
const pg = require("pg");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in .env");
  process.exit(1);
}

const goal = process.argv[2];
if (!goal) {
  console.error("Error: Please provide a goal as a positional argument.");
  console.log('Example: node test/ai-smoke-test.js "Target high spenders"');
  process.exit(1);
}

async function getBrandId() {
  if (process.env.BRAND_ID) return process.env.BRAND_ID;

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const result = await pool.query(
      "SELECT brand_id FROM dataset_summary ORDER BY generated_at DESC LIMIT 1"
    );
    if (result.rows.length > 0) {
      return result.rows[0].brand_id;
    }
    
    // Fallback to any brand
    const brandResult = await pool.query("SELECT id FROM brands LIMIT 1");
    if (brandResult.rows.length > 0) {
      return brandResult.rows[0].id;
    }

    throw new Error("No brands found in database. Please run smoke-test.js first to seed data.");
  } finally {
    await pool.end();
  }
}

async function runTest() {
  try {
    const brandId = await getBrandId();
    console.log(`\n--- AI Audience Discovery Smoke Test (Pass 1) ---`);
    console.log(`Brand ID: ${brandId}`);
    console.log(`Goal: "${goal}"`);
    console.log(`Endpoint: ${BACKEND_URL}/api/audience/discover\n`);

    const response = await fetch(`${BACKEND_URL}/api/audience/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId, goal })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`\n❌ Pass 1 Error (${response.status}):`, JSON.stringify(result, null, 2));
      process.exit(1);
    }

    const { data } = result;
    const { filter_plan, ai, audience_preview } = data;

    console.log(`✅ Pass 1 Success!`);
    console.log(`Model: ${ai.model}`);
    console.log(`Total Attempts: ${ai.validation_attempts.length}`);
    
    console.log(`\n--- Filter Plan ---`);
    console.log(JSON.stringify(filter_plan, null, 2));

    console.log(`\n--- Audience Preview ---`);
    console.log(JSON.stringify(audience_preview, null, 2));

    // --- AI PASS 2: CAMPAIGN PROPOSAL ---
    console.log(`\n--- AI Campaign Strategy Smoke Test (Pass 2) ---`);
    console.log(`Endpoint: ${BACKEND_URL}/api/campaigns/propose\n`);

    const proposeResponse = await fetch(`${BACKEND_URL}/api/campaigns/propose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        brand_id: brandId, 
        goal, 
        audience_preview, 
        filter_plan 
      })
    });

    const proposeResult = await proposeResponse.json();

    if (!proposeResponse.ok) {
      console.error(`\n❌ Pass 2 Error (${proposeResponse.status}):`, JSON.stringify(proposeResult, null, 2));
      process.exit(1);
    }

    const { campaign, forecast } = proposeResult.data;

    console.log(`✅ Pass 2 Success!`);
    console.log(`Campaign ID: ${campaign.id}`);
    console.log(`Campaign Name: ${campaign.campaign_name}`);
    console.log(`Channel: ${campaign.channel}`);
    
    console.log(`\n--- Message Template ---`);
    console.log(campaign.message_template);

    console.log(`\n--- Strategic Reasoning ---`);
    console.log(campaign.reasoning);

    console.log(`\n--- Deterministic Forecast ---`);
    console.log(`Audience Size: ${campaign.audience_size}`);
    console.log(`Delivered: ${forecast.forecast_delivered}`);
    console.log(`Opened: ${forecast.forecast_opened}`);
    console.log(`Clicked: ${forecast.forecast_clicked}`);
    console.log(`Purchased: ${forecast.forecast_purchased}`);

    // --- TEST MANUAL MODIFICATION ---
    console.log(`\n--- Manual Modification Test ---`);
    const newName = `Modified: ${campaign.campaign_name}`;
    const patchResponse = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_name: newName })
    });

    const patchResult = await patchResponse.json();
    if (patchResult.data.campaign_name === newName) {
      console.log(`✅ Update Success: Campaign name changed to "${newName}"`);
    } else {
      console.log(`❌ Update Failed`);
    }

    console.log(`\n----------------------------------------\n`);

  } catch (error) {
    console.error("\n❌ Unexpected Error:", error.message);
    if (error.message.includes("fetch")) {
      console.error("Tip: Make sure the backend server is running (npm run dev)");
    }
    process.exit(1);
  }
}

runTest();

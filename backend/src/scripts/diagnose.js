require("dotenv").config();
const { query } = require("../config/db");

async function diagnose() {
  try {
    console.log("--- DATABASE BRAND DIAGNOSTIC REPORT ---");
    
    // 1. Get all brands
    const brandsRes = await query("SELECT id, name FROM brands");
    console.log("\nBrands in database:");
    brandsRes.rows.forEach(b => {
      console.log(`- ID: ${b.id}, Name: "${b.name}"`);
    });

    // 2. Get campaigns with brand name
    const campaignsRes = await query(`
      SELECT c.id, c.campaign_name, c.status, c.brand_id, b.name as brand_name, c.created_at
      FROM campaigns c
      JOIN brands b ON c.brand_id = b.id
      ORDER BY c.created_at DESC
    `);
    console.log("\nCampaigns with Brand:");
    campaignsRes.rows.forEach(c => {
      console.log(`- Campaign: "${c.campaign_name}" [ID: ${c.id}] -> Brand: "${c.brand_name}" [ID: ${c.brand_id}], Created: ${c.created_at}`);
    });

    // 3. Get active strategist sessions
    const sessionsRes = await query(`
      SELECT ss.id, ss.brand_id, b.name as brand_name, ss.status
      FROM strategist_sessions ss
      JOIN brands b ON ss.brand_id = b.id
      ORDER BY ss.updated_at DESC
    `);
    console.log("\nStrategist Sessions with Brand:");
    sessionsRes.rows.forEach(s => {
      console.log(`- Session: ${s.id} -> Brand: "${s.brand_name}" [ID: ${s.brand_id}], Status: "${s.status}"`);
    });

  } catch (error) {
    console.error("Diagnostic failed with database error:", error);
  } finally {
    process.exit(0);
  }
}

diagnose();

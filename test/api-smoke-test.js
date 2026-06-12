const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting API Smoke Tests...');

  try {
    // 1. Health Check
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check:', health.data.status);

    // 2. Create Brand Test
    const brandName = `Test Brand ${Date.now()}`;
    const brandRes = await axios.post(`${API_URL}/brands`, { name: brandName });
    const brand = brandRes.data.data;
    console.log('✅ Create Brand:', brand.name, `(ID: ${brand.id})`);

    // 3. Get Analytics (Should be empty but work)
    const analyticsRes = await axios.get(`${API_URL}/brands/${brand.id}/analytics`);
    console.log('✅ Get Analytics: Success');

    // 4. List Campaigns
    const campaignsRes = await axios.get(`${API_URL}/campaigns?brand_id=${brand.id}`);
    console.log('✅ List Campaigns:', campaignsRes.data.data.length, 'found');

    console.log('\n✨ All smoke tests passed!');
  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Brand {
  id: string;
  name: string;
  industry?: string;
}

export const createBrand = async (name: string, industry?: string): Promise<Brand> => {
  const response = await axios.post(`${API_URL}/brands`, { name, industry });
  return response.data;
};

export const getBrandAnalytics = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/metrics/${brandId}`);
  return response.data;
};

export const uploadData = async (brandId: string, customerCsv?: string, orderCsv?: string) => {
  const response = await axios.post(`${API_URL}/upload/upload`, {
    brand_id: brandId,
    customer_csv: customerCsv,
    order_csv: orderCsv,
  });
  return response.data;
};

export const getCampaigns = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/campaigns?brand_id=${brandId}`);
  return response.data;
};

export const getCampaignDetails = async (campaignId: string) => {
  const response = await axios.get(`${API_URL}/campaigns/${campaignId}`);
  return response.data;
};

export const getCampaignMetrics = async (campaignId: string) => {
  const response = await axios.get(`${API_URL}/campaigns/${campaignId}/metrics`);
  return response.data;
};

// V2 Intelligence Layer
export const getOpportunityFeed = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/intelligence/${brandId}/opportunities`);
  return response.data;
};

export const getExecutiveBrief = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/intelligence/${brandId}/executive-brief`);
  return response.data;
};

export const chatWithStrategist = async (brandId: string, message: string, sessionId?: string) => {
  const response = await axios.post(`${API_URL}/intelligence/${brandId}/strategist/chat`, { message, sessionId });
  return response.data;
};

export const getStrategistSession = async (sessionId: string) => {
  const response = await axios.get(`${API_URL}/intelligence/strategist/session/${sessionId}`);
  return response.data;
};

export const launchStrategistCampaign = async (brandId: string, sessionId: string) => {
  const response = await axios.post(`${API_URL}/intelligence/${brandId}/strategist/launch`, { sessionId });
  return response.data;
};

export const executeCampaign = async (campaignId: string) => {
  const response = await axios.post(`${API_URL}/campaigns/${campaignId}/execute`);
  return response.data;
};

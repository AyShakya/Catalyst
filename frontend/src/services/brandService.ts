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
  const response = await axios.get(`${API_URL}/brands/${brandId}/analytics`);
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

export const createCampaignProposal = async (brandId: string, prompt: string) => {
  const response = await axios.post(`${API_URL}/campaigns/propose`, { brand_id: brandId, prompt });
  return response.data;
};

export const launchCampaign = async (campaignId: string) => {
  const response = await axios.post(`${API_URL}/campaigns/${campaignId}/execute`);
  return response.data;
};

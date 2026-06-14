import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Brand {
  id: string;
  name: string;
  industry?: string;
}

export const createBrand = async (name: string, industry?: string): Promise<Brand> => {
  const response = await axios.post(`${API_URL}/brands`, { name, industry });
  return response.data.data;
};

export const getBrandAnalytics = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/brands/${brandId}/analytics`);
  return response.data;
};

export const uploadData = async (brandId: string, customerCsv?: string, orderCsv?: string) => {
  const response = await axios.post(`${API_URL}/upload`, {
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

export const getCampaignMilestones = async (campaignId: string) => {
  const response = await axios.get(`${API_URL}/campaigns/${campaignId}/milestones`);
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

export const chatWithStrategist = async (brandId: string, message: string, sessionId?: string, signal?: AbortSignal) => {
  const response = await axios.post(`${API_URL}/intelligence/${brandId}/strategist/chat`, { message, sessionId }, { signal });
  return response.data;
};

type StrategistStreamHandlers = {
  onDelta?: (delta: string) => void;
  onProcessing?: (data: any) => void;
  onFinal?: (payload: any) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
};

export const chatWithStrategistStream = async (
  brandId: string,
  message: string,
  sessionId: string | undefined,
  handlers: StrategistStreamHandlers = {}
) => {
  const response = await fetch(`${API_URL}/intelligence/${brandId}/strategist/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ message, sessionId }),
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Streaming failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload: any = null;

  const emitEvent = (eventName: string, data: string) => {
    if (eventName === 'delta') {
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed.delta === 'string') {
          handlers.onDelta?.(parsed.delta);
        }
      } catch {
        // Ignore malformed delta frames and keep streaming.
      }
      return;
    }

    if (eventName === 'processing') {
      try {
        const parsed = JSON.parse(data);
        handlers.onProcessing?.(parsed);
      } catch {
        // Ignore malformed frames
      }
      return;
    }

    if (eventName === 'final') {
      try {
        finalPayload = JSON.parse(data);
        handlers.onFinal?.(finalPayload);
      } catch {
        // If the final frame is malformed, we will throw after the loop
      }
      return;
    }

    if (eventName === 'error') {
      try {
        const parsed = JSON.parse(data);
        const errorMsg = parsed.error || 'Strategist streaming failed';
        handlers.onError?.(errorMsg);
        throw new Error(errorMsg);
      } catch (e) {
        handlers.onError?.('Strategist streaming failed');
        throw e;
      }
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);

        const lines = frame.split(/\r?\n/);
        let eventName = 'message';
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        const data = dataLines.join('\n');
        if (data) {
          emitEvent(eventName, data);
        }

        frameEnd = buffer.indexOf('\n\n');
      }
    }
  } catch (e) {
    // If emitEvent threw an error, we catch it here and rethrow
    throw e;
  }

  if (!finalPayload) {
    throw new Error('Stream ended without final payload');
  }

  return finalPayload;
};

export const getStrategistSession = async (brandId: string, sessionId: string) => {
  const response = await axios.get(`${API_URL}/intelligence/${brandId}/strategist/session/${sessionId}`);
  return response.data;
};

export const getActiveSessions = async (brandId: string) => {
  const response = await axios.get(`${API_URL}/intelligence/${brandId}/strategist/sessions`);
  return response.data;
};

export const closeSession = async (brandId: string, sessionId: string) => {
  const response = await axios.delete(`${API_URL}/intelligence/${brandId}/strategist/session/${sessionId}`);
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

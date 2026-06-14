export type CampaignStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';

export interface Campaign {
  id: string;
  brand_id: string;
  campaign_name: string;
  name?: string; // Fallback for some draft structures
  goal: string;
  channel: string;
  message_template: string;
  message?: string; // Fallback
  reasoning: string;
  status: CampaignStatus;
  audience_size: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  revenue?: number;
  forecast_delivered?: number;
  forecast_opened?: number;
  forecast_clicked?: number;
  forecast_purchased?: number;
  created_at: string;
  updated_at: string;
}

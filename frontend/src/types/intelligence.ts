export interface AudienceSnapshot {
  audience_size: number;
  avg_spend: number;
  avg_order_value: number;
  avg_loyalty: number;
  avg_churn: number;
}

export interface RevenueForecast {
  delivered: number;
  opened: number;
  clicked: number;
  conversions: number;
  revenue: number;
}

export interface CampaignDraft {
  version: number;
  name: string;
  goal: string;
  channel: string;
  message: string;
  reasoning: string;
  filters?: any[];
  segment_name?: string;
  audience: AudienceSnapshot;
  forecast: RevenueForecast;
}

export interface GrowthOpportunity {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: string;
}

export interface ExecutiveBrief {
  brief: string;
}

export interface MetricDistribution {
  label: string;
  count: number;
}

export interface BrandAnalytics {
  summary: {
    total_customers: number;
    total_revenue: number;
    avg_order_value: number;
  };
  distributions: {
    total_spend: MetricDistribution[];
    loyalty_score: MetricDistribution[];
  };
}

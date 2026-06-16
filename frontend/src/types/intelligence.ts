export interface AudienceSnapshot {
  size: number;
  avgSpend: number;
  avgOrderValue: number;
  avgLoyalty: number;
  avgChurn: number;
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
    total_orders: number;
    total_revenue: number;
    avg_spend: number;
    median_spend: number;
    avg_orders_per_customer: number;
    avg_order_value: number;
    avg_loyalty_score: number;
    avg_churn_score: number;
    avg_days_since_purchase: number;
    p50_spend: number;
    p75_spend: number;
    p90_spend: number;
    p95_spend: number;
  };
  distributions: {
    total_spend: MetricDistribution[];
    loyalty_score: MetricDistribution[];
    churn_score: MetricDistribution[];
    days_since_last_purchase: MetricDistribution[];
    total_orders: MetricDistribution[];
  };
}

export interface HealthMatrixPoint {
  id: string;
  loyalty: number;
  churn: number;
  spend: number;
  name: string;
}

export interface ValuePyramidTier {
  label: string;
  value: number;
  threshold: number;
}

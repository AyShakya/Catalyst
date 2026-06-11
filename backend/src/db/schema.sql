CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_customer_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  external_order_id TEXT,
  amount NUMERIC(14,2),
  currency TEXT,
  order_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_metrics (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  total_spend NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  avg_order_value NUMERIC(14,2),
  highest_order_value NUMERIC(14,2),
  lowest_order_value NUMERIC(14,2),
  first_purchase_date DATE,
  last_purchase_date DATE,
  days_since_last_purchase INTEGER,
  customer_lifetime_value NUMERIC(14,2),
  avg_days_between_orders NUMERIC(14,2),
  purchase_frequency NUMERIC(14,4),
  loyalty_score NUMERIC(6,2),
  churn_score NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_summary (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  total_customers INTEGER,
  total_orders INTEGER,
  total_revenue NUMERIC(14,2),
  avg_spend NUMERIC(14,2),
  median_spend NUMERIC(14,2),
  avg_orders_per_customer NUMERIC(14,4),
  avg_order_value NUMERIC(14,2),
  avg_days_since_purchase NUMERIC(14,2),
  avg_loyalty_score NUMERIC(6,2),
  avg_churn_score NUMERIC(6,2),
  p50_spend NUMERIC(14,2),
  p75_spend NUMERIC(14,2),
  p90_spend NUMERIC(14,2),
  p95_spend NUMERIC(14,2),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metric_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  bucket_label TEXT NOT NULL,
  customer_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metric_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL,
  allowed_operators TEXT[] NOT NULL,
  is_attribute BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS segment_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  goal TEXT,
  campaign_name TEXT,
  campaign_prompt TEXT,
  channel TEXT,
  message_template TEXT,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED')),
  audience_size INTEGER NOT NULL DEFAULT 0,
  forecast_delivered INTEGER,
  forecast_opened INTEGER,
  forecast_clicked INTEGER,
  forecast_purchased INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_audience (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, customer_id)
);

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED')),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

CREATE TABLE IF NOT EXISTS campaign_metrics (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_delivered INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,
  delivery_rate NUMERIC(8,4),
  open_rate NUMERIC(8,4),
  ctr NUMERIC(8,4),
  conversion_rate NUMERIC(8,4),
  revenue_generated NUMERIC(14,2),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_brand_id ON customers (brand_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders (brand_id);

CREATE INDEX IF NOT EXISTS idx_customer_metrics_total_spend ON customer_metrics (total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_days_since_last_purchase ON customer_metrics (days_since_last_purchase);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_loyalty_score ON customer_metrics (loyalty_score);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_churn_score ON customer_metrics (churn_score);

CREATE INDEX IF NOT EXISTS idx_communications_campaign_id ON communications (campaign_id);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications (customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications (status);

CREATE INDEX IF NOT EXISTS idx_communication_events_communication_id ON communication_events (communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_event_type ON communication_events (event_type);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Base Tables (No dependencies)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. V2 Intelligence Layer (Required by campaigns)
CREATE TABLE IF NOT EXISTS strategist_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LAUNCHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES strategist_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES strategist_sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  draft_json JSONB NOT NULL,
  change_summary TEXT,
  is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Core Data Tables
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

-- 4. Analytics Tables
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

-- 5. Campaign & Communication Tables
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
  filter_plan JSONB,
  session_id UUID REFERENCES strategist_sessions(id) ON DELETE SET NULL,
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
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED', 'FAILED')),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED', 'FAILED')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,
  CONSTRAINT unique_communication_event UNIQUE(communication_id, event_type)
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

-- 6. Business Intelligence Tables
CREATE TABLE IF NOT EXISTS business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  estimated_impact DECIMAL(14,2),
  supporting_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_intelligence_summaries (
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  goal VARCHAR(255) NOT NULL,
  campaign_count INTEGER NOT NULL DEFAULT 0,
  best_channel VARCHAR(50),
  avg_ctr DECIMAL(8,4),
  avg_conversion_rate DECIMAL(8,4),
  total_revenue DECIMAL(14,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_id, goal)
);

CREATE TABLE IF NOT EXISTS executive_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  brief_text TEXT NOT NULL,
  key_metrics JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Seed Data
INSERT INTO metric_registry (metric_name, field_type, allowed_operators, is_attribute)
VALUES
  ('total_spend', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('total_orders', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('avg_order_value', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('purchase_frequency', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('days_since_last_purchase', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('loyalty_score', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('churn_score', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('highest_order_value', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('lowest_order_value', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('first_purchase_date', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('last_purchase_date', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('customer_lifetime_value', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('avg_days_between_orders', 'number', ARRAY['>', '<', '=', '>=', '<=', '!='], FALSE),
  ('city', 'string', ARRAY['=', '!=', 'IN'], TRUE),
  ('state', 'string', ARRAY['=', '!=', 'IN'], TRUE),
  ('country', 'string', ARRAY['=', '!=', 'IN'], TRUE)
ON CONFLICT (metric_name)
DO UPDATE SET
  field_type = EXCLUDED.field_type,
  allowed_operators = EXCLUDED.allowed_operators,
  is_attribute = EXCLUDED.is_attribute;

INSERT INTO segment_registry (segment_name, description)
VALUES
  ('VIP', 'High-value customers with strong loyalty (loyalty_score > 75 AND total_spend > p90)'),
  ('Inactive', 'Dormant customers (days_since_last_purchase > 90)'),
  ('Frequent Buyers', 'Regular purchasers (total_orders > 10)'),
  ('At Risk', 'Churning customers (churn_score > 75)'),
  ('New Customers', 'Recently acquired (days_since_last_purchase < 30 AND total_orders = 1)'),
  ('High Spenders', 'Top revenue generators (total_spend > p95)')
ON CONFLICT (segment_name)
DO UPDATE SET description = EXCLUDED.description;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_brand_id ON customers (brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_brand_external_id_unique
  ON customers (brand_id, external_customer_id)
  WHERE external_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_brand_email_unique
  ON customers (brand_id, email)
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_brand_phone_unique
  ON customers (brand_id, phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders (brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_brand_external_id_unique
  ON orders (brand_id, external_order_id)
  WHERE external_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_metrics_total_spend ON customer_metrics (total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_days_since_last_purchase ON customer_metrics (days_since_last_purchase);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_loyalty_score ON customer_metrics (loyalty_score);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_churn_score ON customer_metrics (churn_score);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metric_distributions_brand_metric_bucket
  ON metric_distributions (brand_id, metric_name, bucket_label);

CREATE INDEX IF NOT EXISTS idx_metrics_jobs_brand_id ON metrics_generation_jobs (brand_id);
CREATE INDEX IF NOT EXISTS idx_metrics_jobs_status ON metrics_generation_jobs (status);

CREATE INDEX IF NOT EXISTS idx_communications_campaign_id ON communications (campaign_id);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications (customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications (status);

CREATE INDEX IF NOT EXISTS idx_communication_events_communication_id ON communication_events (communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_event_type ON communication_events (event_type);

CREATE INDEX IF NOT EXISTS idx_business_insights_brand_id ON business_insights (brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_intel_brand_id ON campaign_intelligence_summaries (brand_id);
CREATE INDEX IF NOT EXISTS idx_executive_briefs_brand_id ON executive_briefs (brand_id);

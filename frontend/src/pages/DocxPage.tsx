import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Database, Cpu, Webhook, Percent, ChevronRight, 
  Search, ArrowRight, Shield, Activity, RefreshCw, 
  Sliders, DollarSign, AlertCircle, CheckCircle2,
  BookOpen, Code, Server, Play, Copy, ArrowDownRight,
  TrendingUp, Award, ExternalLink, Zap
} from 'lucide-react';

// Interfaces for Interactive Schema Explorer
interface ColumnInfo {
  name: string;
  type: string;
  constraints?: string;
  description: string;
}

interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
  indexes?: string[];
}

const TABLES_METADATA: TableInfo[] = [
  {
    name: 'brands',
    description: 'Stores brand-level configurations, tenants, and namespaces.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Unique identifier for the brand tenant.' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Display name of the brand or company.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'Timestamp when the brand account was provisioned.' }
    ]
  },
  {
    name: 'customers',
    description: 'Core consumer profiles imported or synced from external brand databases.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Internal unique identifier.' },
      { name: 'brand_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES brands(id) ON DELETE CASCADE', description: 'Brand owner identifier (Tenant isolation partition key).' },
      { name: 'external_customer_id', type: 'TEXT', constraints: 'UNIQUE(brand_id, external_customer_id)', description: 'Customer ID from the client\'s original database.' },
      { name: 'name', type: 'TEXT', description: 'Full name of the customer.' },
      { name: 'email', type: 'TEXT', constraints: 'UNIQUE(brand_id, email)', description: 'Primary contact email.' },
      { name: 'phone', type: 'TEXT', constraints: 'UNIQUE(brand_id, phone)', description: 'Primary contact phone number.' },
      { name: 'city', type: 'TEXT', description: 'City of residence.' },
      { name: 'state', type: 'TEXT', description: 'State or region.' },
      { name: 'country', type: 'TEXT', description: 'Country of residence.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'Profile creation date.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'Timestamp of last modification.' }
    ],
    indexes: ['idx_customers_email', 'idx_customers_phone', 'idx_customers_brand_id']
  },
  {
    name: 'orders',
    description: 'Transaction history containing purchase amounts and order records.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Unique internal order identifier.' },
      { name: 'brand_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES brands(id) ON DELETE CASCADE', description: 'Associated brand identifier.' },
      { name: 'customer_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES customers(id) ON DELETE CASCADE', description: 'Customer placing the order.' },
      { name: 'external_order_id', type: 'TEXT', constraints: 'UNIQUE(brand_id, external_order_id)', description: 'Order ID imported from external platform.' },
      { name: 'amount', type: 'NUMERIC(14,2)', description: 'Monetary value of the order.' },
      { name: 'currency', type: 'TEXT', description: 'Three-letter ISO currency code.' },
      { name: 'order_date', type: 'DATE', description: 'Date when purchase was made.' },
      { name: 'status', type: 'TEXT', description: 'Order status (e.g. COMPLETED, REFUNDED, SHIPPED).' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'Record insertion time.' }
    ],
    indexes: ['idx_orders_customer_id', 'idx_orders_order_date', 'idx_orders_brand_id']
  },
  {
    name: 'customer_metrics',
    description: 'Aggregated statistical metrics computed per customer profile, used for segmentation.',
    columns: [
      { name: 'customer_id', type: 'UUID', constraints: 'PRIMARY KEY, REFERENCES customers(id) ON DELETE CASCADE', description: 'Associated customer.' },
      { name: 'total_spend', type: 'NUMERIC(14,2)', constraints: 'NOT NULL, DEFAULT 0', description: 'Cumulative money spent across all successful orders.' },
      { name: 'total_orders', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Total count of orders placed.' },
      { name: 'avg_order_value', type: 'NUMERIC(14,2)', description: 'Average monetary amount per order (total_spend / total_orders).' },
      { name: 'highest_order_value', type: 'NUMERIC(14,2)', description: 'Maximum single order spend.' },
      { name: 'lowest_order_value', type: 'NUMERIC(14,2)', description: 'Minimum single order spend.' },
      { name: 'first_purchase_date', type: 'DATE', description: 'Date of the first recorded order.' },
      { name: 'last_purchase_date', type: 'DATE', description: 'Date of the most recent order.' },
      { name: 'days_since_last_purchase', type: 'INTEGER', description: 'Recency metric representing days between last purchase and metrics refresh.' },
      { name: 'loyalty_score', type: 'NUMERIC(6,2)', description: 'Catalyst predictive score indicating customer brand loyalty (0 to 100).' },
      { name: 'churn_score', type: 'NUMERIC(6,2)', description: 'AI estimated probability of customer churning (0 to 100).' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'Timestamp of last calculation job.' }
    ],
    indexes: [
      'idx_customer_metrics_total_spend',
      'idx_customer_metrics_days_since_last_purchase',
      'idx_customer_metrics_loyalty_score',
      'idx_customer_metrics_churn_score'
    ]
  },
  {
    name: 'dataset_summary',
    description: 'High-level aggregated metrics and CLV percentiles for a brand\'s dataset, providing AI system prompts with baseline context.',
    columns: [
      { name: 'brand_id', type: 'UUID', constraints: 'PRIMARY KEY, REFERENCES brands(id) ON DELETE CASCADE', description: 'Brand partition ID.' },
      { name: 'total_customers', type: 'INTEGER', description: 'Total profiles.' },
      { name: 'total_orders', type: 'INTEGER', description: 'Total orders.' },
      { name: 'total_revenue', type: 'NUMERIC(14,2)', description: 'Sum of all spend.' },
      { name: 'avg_order_value', type: 'NUMERIC(14,2)', description: 'Mean order size.' },
      { name: 'p50_spend', type: 'NUMERIC(14,2)', description: 'Median spend threshold (50th percentile).' },
      { name: 'p90_spend', type: 'NUMERIC(14,2)', description: 'High spender threshold (90th percentile).' },
      { name: 'p95_spend', type: 'NUMERIC(14,2)', description: 'Top spender threshold (95th percentile).' }
    ]
  },
  {
    name: 'metric_registry',
    description: 'Standard registry defining allowed metrics and fields that the AI engine is authorized to query.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Registry record ID.' },
      { name: 'metric_name', type: 'TEXT', constraints: 'UNIQUE', description: 'Allowed query variable name (e.g. loyalty_score, churn_score).' },
      { name: 'field_type', type: 'TEXT', constraints: 'NOT NULL', description: 'Primitive data type (e.g. number, string).' },
      { name: 'allowed_operators', type: 'TEXT[]', constraints: 'NOT NULL', description: 'Operators approved for validation gates (e.g. >, <, =, IN).' },
      { name: 'is_attribute', type: 'BOOLEAN', constraints: 'NOT NULL, DEFAULT FALSE', description: 'Flag identifying demographic/static attributes (city, state) vs numeric metrics.' }
    ]
  },
  {
    name: 'campaigns',
    description: 'Campaign meta-records containing status, channels, targeting specifications, and forecasts.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Unique campaign ID.' },
      { name: 'brand_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES brands(id) ON DELETE CASCADE', description: 'Target brand.' },
      { name: 'goal', type: 'TEXT', description: 'Strategic goal (e.g. RETENTION, ACQUISITION, WIN_BACK).' },
      { name: 'campaign_name', type: 'TEXT', description: 'Marketer or AI generated title.' },
      { name: 'channel', type: 'TEXT', description: 'Communication channel (EMAIL, SMS, WHATSAPP).' },
      { name: 'message_template', type: 'TEXT', description: 'Raw template text to distribute.' },
      { name: 'status', type: 'TEXT', constraints: 'NOT NULL, DEFAULT \'DRAFT\', CHECK status IN (\'DRAFT\', \'APPROVED\', \'RUNNING\', \'COMPLETED\', \'FAILED\')', description: 'Current campaign execution status.' },
      { name: 'audience_size', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Calculated recipient size based on filters.' },
      { name: 'forecast_delivered', type: 'INTEGER', description: 'Deterministic forecast: Expected delivered count.' },
      { name: 'forecast_opened', type: 'INTEGER', description: 'Deterministic forecast: Expected open count.' },
      { name: 'forecast_clicked', type: 'INTEGER', description: 'Deterministic forecast: Expected click count.' },
      { name: 'forecast_purchased', type: 'INTEGER', description: 'Deterministic forecast: Expected conversion purchase count.' },
      { name: 'filter_plan', type: 'JSONB', description: 'Targeting logic. Contains resolved segment_name or dynamic filters.' },
      { name: 'session_id', type: 'UUID', constraints: 'REFERENCES strategist_sessions(id) ON DELETE SET NULL', description: 'Links campaign back to the AI session.' }
    ]
  },
  {
    name: 'communications',
    description: 'Individual outbound messages tracking state progression for a customer target.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Unique communication record.' },
      { name: 'campaign_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES campaigns(id) ON DELETE CASCADE', description: 'Parent campaign.' },
      { name: 'customer_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES customers(id) ON DELETE CASCADE', description: 'Recipient customer profiles.' },
      { name: 'channel', type: 'TEXT', description: 'Dispatch channel.' },
      { name: 'status', type: 'TEXT', constraints: 'NOT NULL, DEFAULT \'PENDING\', CHECK status IN (\'PENDING\', \'SENT\', \'DELIVERED\', \'OPENED\', \'CLICKED\', \'PURCHASED\', \'FAILED\')', description: 'Current delivery/interaction state.' },
      { name: 'sent_at', type: 'TIMESTAMPTZ', description: 'Timestamp when communication was dispatched.' }
    ],
    indexes: ['idx_communications_campaign_id', 'idx_communications_customer_id', 'idx_communications_status']
  },
  {
    name: 'communication_events',
    description: 'Audit trail of status change events triggered by external webhook notifications.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT gen_random_uuid()', description: 'Unique audit log identifier.' },
      { name: 'communication_id', type: 'UUID', constraints: 'NOT NULL, REFERENCES communications(id) ON DELETE CASCADE', description: 'Target communication.' },
      { name: 'event_type', type: 'TEXT', constraints: 'NOT NULL, CHECK event_type IN (\'SENT\', \'DELIVERED\', \'OPENED\', \'CLICKED\', \'PURCHASED\', \'FAILED\')', description: 'External status event received.' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', constraints: 'NOT NULL, DEFAULT NOW()', description: 'When the event was captured.' },
      { name: 'payload', type: 'JSONB', description: 'Full payload from the external webhook delivery body.' }
    ],
    indexes: ['idx_communication_events_communication_id', 'idx_communication_events_event_type']
  },
  {
    name: 'campaign_metrics',
    description: 'Consolidated aggregate campaign KPIs recalculated asynchronously when webhooks execute.',
    columns: [
      { name: 'campaign_id', type: 'UUID', constraints: 'PRIMARY KEY, REFERENCES campaigns(id) ON DELETE CASCADE', description: 'Campaign partition.' },
      { name: 'total_sent', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Total communication dispatches logged.' },
      { name: 'total_delivered', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Delivered messages logged.' },
      { name: 'total_opened', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Opened messages logged.' },
      { name: 'total_clicked', type: 'INTEGER', constraints: 'NOT NULL, DEFAULT 0', description: 'Clicked messages logged.' },
      { name: 'delivery_rate', type: 'NUMERIC(8,4)', description: 'Calculated: total_delivered / total_sent.' },
      { name: 'open_rate', type: 'NUMERIC(8,4)', description: 'Calculated: total_opened / total_delivered.' },
      { name: 'ctr', type: 'NUMERIC(8,4)', description: 'Calculated: total_clicked / total_opened.' },
      { name: 'conversion_rate', type: 'NUMERIC(8,4)', description: 'Calculated: total_purchased / total_delivered (Specification MVP).' },
      { name: 'revenue_generated', type: 'NUMERIC(14,2)', description: 'Attributed purchase revenue (Orders placed by customers post-campaign sent_at).' }
    ]
  }
];

const DocxPage: React.FC = () => {
  const location = useLocation();
  const isInWorkspace = location.pathname.startsWith('/workspace');
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'architecture' | 'ai-engine' | 'webhooks' | 'formulas'>('architecture');
  
  // Schema search state
  const [schemaSearch, setSchemaSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableInfo>(TABLES_METADATA[6]); // default to campaigns
  
  // Forecast simulator state
  const [simAudience, setSimAudience] = useState<number>(5000);
  const [simAOV, setSimAOV] = useState<number>(85);
  const [rateDelivery, setRateDelivery] = useState<number>(90);
  const [rateOpen, setRateOpen] = useState<number>(70);
  const [rateCTR, setRateCTR] = useState<number>(30);
  const [rateConv, setRateConv] = useState<number>(10);

  // Compute forecast simulation values
  const simDelivered = Math.round(simAudience * (rateDelivery / 100));
  const simOpened = Math.round(simDelivered * (rateOpen / 100));
  const simClicked = Math.round(simOpened * (rateCTR / 100));
  const simPurchased = Math.round(simClicked * (rateConv / 100));
  const simRevenue = simPurchased * simAOV;

  const filteredTables = TABLES_METADATA.filter(t => 
    t.name.toLowerCase().includes(schemaSearch.toLowerCase()) || 
    t.description.toLowerCase().includes(schemaSearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen text-foreground transition-all duration-300 ${
      isInWorkspace ? 'py-4' : 'pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
    }`}>
      {/* Title Header */}
      <div className="mb-8 border-b border-border/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              System Documentation
            </span>
            <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1">
              <Zap size={10} /> Active V2 Spec
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Docx Engine Portal</h1>
          <p className="text-secondary text-sm max-w-2xl mt-1.5 font-medium leading-relaxed">
            Detailed guide to Catalyst's database schemas, custom filter rules, AI machine pipelines, webhook loops, and calculations.
          </p>
        </div>
        
        {/* Floating actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="#schemas" 
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'architecture' ? 'bg-foreground text-white border-foreground' : 'bg-transparent border-border hover:bg-card-bg'
            }`}
          >
            Schemas
          </a>
          <a 
            href="#ai" 
            onClick={() => setActiveTab('ai-engine')}
            className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'ai-engine' ? 'bg-foreground text-white border-foreground' : 'bg-transparent border-border hover:bg-card-bg'
            }`}
          >
            AI Engine
          </a>
          <a 
            href="#webhooks" 
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'webhooks' ? 'bg-foreground text-white border-foreground' : 'bg-transparent border-border hover:bg-card-bg'
            }`}
          >
            Webhooks
          </a>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Navigation Pane */}
        <aside className="lg:col-span-3 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('architecture')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
              activeTab === 'architecture' 
                ? 'bg-foreground text-white border-foreground shadow-lg shadow-black/5' 
                : 'bg-white/40 border-border hover:bg-card-bg/60 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database size={18} className={activeTab === 'architecture' ? 'text-white' : 'text-accent'} />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">Database & Schema</span>
                <span className="block text-[10px] text-secondary mt-0.5 leading-tight">11 Relational Tables</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button 
            onClick={() => setActiveTab('ai-engine')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
              activeTab === 'ai-engine' 
                ? 'bg-foreground text-white border-foreground shadow-lg shadow-black/5' 
                : 'bg-white/40 border-border hover:bg-card-bg/60 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cpu size={18} className={activeTab === 'ai-engine' ? 'text-white' : 'text-accent'} />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">AI Machine Engine</span>
                <span className="block text-[10px] text-secondary mt-0.5 leading-tight">Guardrails & Forecasts</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button 
            onClick={() => setActiveTab('webhooks')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
              activeTab === 'webhooks' 
                ? 'bg-foreground text-white border-foreground shadow-lg shadow-black/5' 
                : 'bg-white/40 border-border hover:bg-card-bg/60 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Webhook size={18} className={activeTab === 'webhooks' ? 'text-white' : 'text-accent'} />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">Webhook Loopcycle</span>
                <span className="block text-[10px] text-secondary mt-0.5 leading-tight">Retry Logic & Failures</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button 
            onClick={() => setActiveTab('formulas')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
              activeTab === 'formulas' 
                ? 'bg-foreground text-white border-foreground shadow-lg shadow-black/5' 
                : 'bg-white/40 border-border hover:bg-card-bg/60 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Percent size={18} className={activeTab === 'formulas' ? 'text-white' : 'text-accent'} />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider">Formulas & KPIs</span>
                <span className="block text-[10px] text-secondary mt-0.5 leading-tight">Attribution Mechanics</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-accent/5 to-emerald-500/5 border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-accent" />
              <span className="text-xs font-black uppercase tracking-wider">Security Layer Info</span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">
              All user segment queries validate through the <strong>Metric Registry</strong> before execution. Custom operators and inputs are strict-validated to prevent injection.
            </p>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          
          {/* TAB 1: ARCHITECTURE & RELATIONAL SCHEMA */}
          {activeTab === 'architecture' && (
            <div className="flex flex-col gap-6">
              
              {/* Introduction Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Database size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Database Architecture & Design</h2>
                    <p className="text-xs text-secondary font-medium">PostgreSQL Engine • Dynamic Index Partitioning</p>
                  </div>
                </div>
                
                <p className="text-sm text-secondary font-medium leading-relaxed">
                  Catalyst OS operates a multi-tenant PostgreSQL database with structured tables split across customer analytics, business intelligence summaries, and webhook communication auditing.
                </p>

                {/* Database ERD Mermaid Representation in CSS */}
                <div className="bg-card-bg p-4 sm:p-6 rounded-2xl border border-border/80">
                  <h3 className="text-xs font-black uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                    <Code size={14} className="text-accent" /> Entity-Relationship Topology
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                    <span className="px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">brands</span>
                    <ArrowRight size={12} className="text-secondary/50" />
                    <span className="px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">customers</span>
                    <ArrowRight size={12} className="text-secondary/50" />
                    <span className="px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">customer_metrics</span>
                    <ArrowRight size={12} className="text-secondary/50" />
                    <span className="px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">campaigns</span>
                    <ArrowRight size={12} className="text-secondary/50" />
                    <span className="px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">communications</span>
                    <ArrowRight size={12} className="text-secondary/50" />
                    <span className="px-3 py-1.5 bg-accent text-white border border-accent rounded-lg shadow-sm">communication_events</span>
                  </div>
                </div>
              </div>

              {/* Interactive Schema Explorer */}
              <div id="schemas" className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Interactive Schema Directory</h2>
                  <p className="text-xs text-secondary mt-1">Select a table to review indexes, constraints, types, and operational descriptions.</p>
                </div>

                {/* Table Search and List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left list of tables */}
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-secondary" />
                      <input 
                        type="text" 
                        placeholder="Search tables..." 
                        value={schemaSearch}
                        onChange={(e) => setSchemaSearch(e.target.value)}
                        className="w-full bg-white border border-border/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto border border-border/60 rounded-xl p-1.5 bg-card-bg/30">
                      {filteredTables.map(table => (
                        <button
                          key={table.name}
                          onClick={() => setSelectedTable(table)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between ${
                            selectedTable.name === table.name 
                              ? 'bg-accent/10 text-accent border border-accent/20' 
                              : 'bg-transparent text-secondary border border-transparent hover:bg-card-bg hover:text-foreground'
                          }`}
                        >
                          <span>{table.name}</span>
                          {selectedTable.name === table.name && <CheckCircle2 size={12} className="text-accent" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right selected table column explorer */}
                  <div className="md:col-span-2 border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-4">
                    <div className="flex items-start justify-between border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-foreground uppercase tracking-tight">{selectedTable.name}</h3>
                          <span className="bg-card-bg border border-border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-secondary">
                            Table Model
                          </span>
                        </div>
                        <p className="text-[11px] text-secondary mt-1 font-medium">{selectedTable.description}</p>
                      </div>
                    </div>

                    {/* Columns table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead>
                          <tr className="border-b border-border/60 text-secondary uppercase font-black tracking-widest text-[9px]">
                            <th className="pb-2">Field</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {selectedTable.columns.map(col => (
                            <tr key={col.name} className="hover:bg-card-bg/40">
                              <td className="py-2.5 font-bold text-foreground">
                                {col.name}
                                {col.constraints?.includes('PRIMARY KEY') && <span className="ml-1 text-[8px] bg-amber-500/10 text-amber-600 px-1 rounded">PK</span>}
                                {col.constraints?.includes('REFERENCES') && <span className="ml-1 text-[8px] bg-accent/10 text-accent px-1 rounded">FK</span>}
                              </td>
                              <td className="py-2.5 text-secondary font-mono text-[10px] max-w-[120px] truncate" title={col.type}>
                                {col.type}
                              </td>
                              <td className="py-2.5 text-secondary leading-relaxed font-medium">
                                {col.description}
                                {col.constraints && !col.constraints.includes('PRIMARY KEY') && !col.constraints.includes('REFERENCES') && (
                                  <div className="mt-0.5 text-[9px] text-accent font-semibold">{col.constraints}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Indexes Metadata */}
                    {selectedTable.indexes && selectedTable.indexes.length > 0 && (
                      <div className="border-t border-border/60 pt-3 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-1.5">Optimized Indexes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTable.indexes.map(idx => (
                            <span key={idx} className="bg-card-bg text-secondary border border-border text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                              {idx}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AI MACHINE ENGINE */}
          {activeTab === 'ai-engine' && (
            <div className="flex flex-col gap-6">
              
              {/* AI Loopcycle Intro Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">AI Marketing Machine Engine</h2>
                    <p className="text-xs text-secondary font-medium">Continuous Strategist Refinement Loop</p>
                  </div>
                </div>

                <p className="text-sm text-secondary font-medium leading-relaxed">
                  The AI engine handles multi-turn strategy sessions, editing drafts, generating filters, and calculating reach forecasts. It routes prompts through <strong>OpenRouter</strong> (standard model: <code>openai/gpt-4o-mini</code>) and wraps requests in tight constraints.
                </p>

                {/* Workflow blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-4 rounded-xl border border-border/80 bg-card-bg/60">
                    <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px]">1</span>
                      Context Assembly
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Collects brand CLV percentiles, active segment lists, metric schema bounds, and historical CTR benchmarks.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card-bg/60">
                    <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px]">2</span>
                      Constraint Engine
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Restricts outputs to pure marketing actions (declines non-marketing prompts). Standardizes custom SQL filter clauses.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card-bg/60">
                    <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px]">3</span>
                      Forecast Funnel
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Triggers real-time DB counts on generated query plans, computing reach, potential actions, and forecasted conversion revenues.
                    </p>
                  </div>
                </div>
              </div>

              {/* Validator Security Gate Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Shield className="text-accent" size={18} /> Validator Layer (Security Guardrail)
                  </h2>
                  <p className="text-xs text-secondary mt-1">
                    Every JSON payload emitted by the model passes through a strict database validation logic inside <code>filter-validator.js</code>.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider">Metrics Registry Gate</span>
                      <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                        Filters can only be executed on metrics defined in <code>metric_registry</code> (e.g. <code>total_spend</code>, <code>loyalty_score</code>). Unknown columns are deleted, neutralizing malicious SQL injection vectors.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider">Allowed Operators Constraint</span>
                      <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                        Forces filters to use allowed operator sets (e.g. numeric columns only allow <code>&gt;, &lt;, =, &gt;=, &lt;=, !=</code>, while string attributes only allow <code>=, !=, IN</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider">Limit Filtering Complexity</span>
                      <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                        Caps standard filters to a maximum of 5. Larger plans are rejected, ensuring optimized query performance on Postgres.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Forecast Simulator */}
              <div id="ai" className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Sliders className="text-accent" size={18} /> Forecast Simulator Sandbox
                  </h2>
                  <p className="text-xs text-secondary mt-1">
                    Calculate deterministic forecasts using Catalyst's official funnel formulas. Adjust sliders to see projected metrics.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Sliders panel */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Audience Size</span>
                        <span className="text-foreground">{simAudience.toLocaleString()}</span>
                      </label>
                      <input 
                        type="range" 
                        min="100" 
                        max="100000" 
                        step="100"
                        value={simAudience} 
                        onChange={(e) => setSimAudience(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Average Order Value ($)</span>
                        <span className="text-foreground">${simAOV}</span>
                      </label>
                      <input 
                        type="range" 
                        min="10" 
                        max="1000" 
                        step="5"
                        value={simAOV} 
                        onChange={(e) => setSimAOV(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Delivery Rate (%)</span>
                        <span className="text-foreground">{rateDelivery}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={rateDelivery} 
                        onChange={(e) => setRateDelivery(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Open Rate (%)</span>
                        <span className="text-foreground">{rateOpen}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={rateOpen} 
                        onChange={(e) => setRateOpen(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Click-Through Rate (%)</span>
                        <span className="text-foreground">{rateCTR}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={rateCTR} 
                        onChange={(e) => setRateCTR(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
                        <span>Conversion Rate (%)</span>
                        <span className="text-foreground">{rateConv}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={rateConv} 
                        onChange={(e) => setRateConv(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>

                  {/* Visual Funnel output */}
                  <div className="border border-border/80 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-border/60 pb-2 mb-4">
                      Deterministic Forecast Pipeline
                    </h3>
                    
                    <div className="flex flex-col gap-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary font-bold">1. Dispatched Target:</span>
                        <span className="font-mono font-black">{simAudience.toLocaleString()} Target(s)</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary font-bold">2. Delivered Messages:</span>
                        <span className="font-mono font-black text-blue-600">{simDelivered.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary font-bold">3. Opened Messages:</span>
                        <span className="font-mono font-black text-amber-500">{simOpened.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary font-bold">4. Clicked Links:</span>
                        <span className="font-mono font-black text-indigo-600">{simClicked.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs border-b border-border/40 pb-3">
                        <span className="text-secondary font-bold">5. Conversions:</span>
                        <span className="font-mono font-black text-emerald-500">{simPurchased.toLocaleString()} Purchase(s)</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">Projected Revenue:</span>
                        <span className="text-lg font-black text-emerald-600 font-mono">
                          ${simRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 p-3 rounded-xl bg-card-bg border border-border text-[9px] text-secondary leading-relaxed font-semibold">
                      Note: Real-time projections use average order value (AOV) calculated from historic data to forecast conversion impact.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: WEBHOOK LOOPCYCLE */}
          {activeTab === 'webhooks' && (
            <div className="flex flex-col gap-6">
              
              {/* Webhook loopcycle Intro Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Webhook size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Webhook Loopcycle & Fallbacks</h2>
                    <p className="text-xs text-secondary font-medium">Outbound Event Triggers & Dead-letter Fallbacks</p>
                  </div>
                </div>

                <p className="text-sm text-secondary font-medium leading-relaxed">
                  When a campaign moves to <code>RUNNING</code> status, Catalyst sends messaging commands to the <strong>Channel Service</strong>. The Channel Service simulates individual recipient lifecycles and communicates statuses back to the CRM using webhook endpoints.
                </p>

                {/* Event timeline SVG */}
                <div className="bg-card-bg p-4 sm:p-6 rounded-2xl border border-border/80 overflow-x-auto">
                  <h3 className="text-xs font-black uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-accent" /> Simulated Dispatch Lifecycle
                  </h3>
                  <div className="min-w-[500px] flex justify-between items-center px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">Initial</span>
                      <span className="mt-1 px-3 py-1.5 bg-white border border-border rounded-lg text-[10px] font-bold">QUEUED</span>
                    </div>
                    <div className="h-0.5 bg-border flex-1 mx-2 relative"><span className="absolute -top-1 right-0 text-[8px] text-secondary">➔</span></div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">Delay 2s</span>
                      <span className="mt-1 px-3 py-1.5 bg-white border border-border rounded-lg text-[10px] font-bold">SENT</span>
                    </div>
                    <div className="h-0.5 bg-border flex-1 mx-2 relative"><span className="absolute -top-1 right-0 text-[8px] text-secondary">➔</span></div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">90% / Delay 3s</span>
                      <span className="mt-1 px-3 py-1.5 bg-white border border-border rounded-lg text-[10px] font-bold text-blue-600">DELIVERED</span>
                      <span className="text-[8px] text-red-500 mt-1">10% FAILED</span>
                    </div>
                    <div className="h-0.5 bg-border flex-1 mx-2 relative"><span className="absolute -top-1 right-0 text-[8px] text-secondary">➔</span></div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">70% / Delay 5s</span>
                      <span className="mt-1 px-3 py-1.5 bg-white border border-border rounded-lg text-[10px] font-bold text-amber-500">OPENED</span>
                    </div>
                    <div className="h-0.5 bg-border flex-1 mx-2 relative"><span className="absolute -top-1 right-0 text-[8px] text-secondary">➔</span></div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">30% / Delay 10s</span>
                      <span className="mt-1 px-3 py-1.5 bg-white border border-border rounded-lg text-[10px] font-bold text-indigo-600">CLICKED</span>
                    </div>
                    <div className="h-0.5 bg-border flex-1 mx-2 relative"><span className="absolute -top-1 right-0 text-[8px] text-secondary">➔</span></div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase text-secondary">10% / Delay 15s</span>
                      <span className="mt-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold">PURCHASED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retry & Fallbacks Mechanics Card */}
              <div id="webhooks" className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <RefreshCw className="text-accent" size={18} /> Retry Loops & Failover Orchestration
                  </h2>
                  <p className="text-xs text-secondary mt-1">
                    What happens when the CRM goes offline or webhooks drop? The Channel Service implements a dual-tiered resilient fallback.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Left Column: Batch flushing & Retries */}
                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary border-b border-border/40 pb-1.5">
                      1. Batched Event Queue & Backoff
                    </span>
                    <p className="text-secondary leading-relaxed">
                      Instead of calling endpoints on every micro-event, the Channel Service groups logs and flushes them in batches every <strong>500ms</strong> to <code>/api/webhook/events</code>.
                    </p>
                    <div className="p-3 bg-card-bg rounded-xl border border-border/60">
                      <span className="block font-bold text-foreground mb-1">Linear Backoff Formula:</span>
                      <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-border font-mono block text-accent">
                        Delay = 5000ms * (retryCount + 1)
                      </code>
                      <p className="text-[10px] text-secondary mt-1.5">
                        Retries up to 3 times on request timeout.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Singular Failover & Dead Lettering */}
                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary border-b border-border/40 pb-1.5">
                      2. Singular Failover & Dead Lettering
                    </span>
                    <p className="text-secondary leading-relaxed">
                      If the batched endpoint rejects the payload, the service unpacks the collection and attempts <strong>singular delivery</strong> for each individual event.
                    </p>
                    <div className="p-3 bg-red-500/5 rounded-xl border border-red-200 text-red-700">
                      <span className="block font-bold text-red-800 mb-0.5">Dead Letter Queue:</span>
                      <p className="text-[10px] leading-relaxed">
                        If singular fallback delivery fails after 3 individual retries, the message status is updated to <code>DEAD</code> in SQLite, freezing the transmission for administrative review.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Idempotency Card */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-border rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900 block mb-1">
                      Idempotency & Database Integrity
                    </span>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      CRM-side webhook handlers wrap updates in database Transactions. Incoming events write directly to the audit log, but a status update only updates the parent table if the priority transition flows forward: 
                      <code className="bg-white/80 border text-accent px-1.5 py-0.5 rounded text-[10px] ml-1 font-mono">
                        SENT &lt; DELIVERED &lt; OPENED &lt; CLICKED &lt; PURCHASED
                      </code>.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <span className="text-[10px] font-black uppercase bg-accent text-white px-3 py-1.5 rounded-lg tracking-wider">
                      Idempotency Guard Active
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: FORMULAS AND METRICS */}
          {activeTab === 'formulas' && (
            <div className="flex flex-col gap-6">
              
              {/* Metric spec Intro Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Percent size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Formulas & Metrics Specifications</h2>
                    <p className="text-xs text-secondary font-medium">Frozen V1 Core Metric Calculations</p>
                  </div>
                </div>

                <p className="text-sm text-secondary font-medium leading-relaxed">
                  Every analytics card, graph, and intelligence insight displayed in the client's panel is governed by rigid mathematical specifications executed at database levels during metric updates.
                </p>
              </div>

              {/* Formula Table Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
                <h3 className="text-base font-black uppercase tracking-tight">Campaign KPI Formulas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-secondary">
                      Delivery Rate
                    </span>
                    <div className="p-4 bg-card-bg rounded-xl flex items-center justify-center font-mono font-black text-sm text-accent">
                      Rate = Total Delivered / Total Sent
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Measures the proportion of sent messages successfully received by the client endpoints, ignoring bounce exceptions.
                    </p>
                  </div>

                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-secondary">
                      Open Rate (OR)
                    </span>
                    <div className="p-4 bg-card-bg rounded-xl flex items-center justify-center font-mono font-black text-sm text-accent">
                      Rate = Total Opened / Total Delivered
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Determines reader engagement. Compares total opened messages against delivered units, filtering out undelivered attempts.
                    </p>
                  </div>

                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-secondary">
                      Click-Through Rate (CTR)
                    </span>
                    <div className="p-4 bg-card-bg rounded-xl flex items-center justify-center font-mono font-black text-sm text-accent">
                      Rate = Total Clicked / Total Opened
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Evaluates link attractiveness. Ratio of unique message link clicks over successfully opened communications.
                    </p>
                  </div>

                  <div className="border border-border/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-secondary">
                      Conversion Rate
                    </span>
                    <div className="p-4 bg-card-bg rounded-xl flex items-center justify-center font-mono font-black text-sm text-accent">
                      Rate = Total Purchased / Total Delivered
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Determines campaign ROI. Calculated directly as the ratio of unique converted purchases divided by total delivered messages.
                    </p>
                  </div>

                </div>

                {/* Attribution Window Explanation */}
                <div className="p-5 border border-border/80 rounded-2xl bg-white shadow-sm flex flex-col gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Award size={14} className="text-emerald-500" /> Revenue Attribution Window & Logic
                  </span>
                  
                  <p className="text-xs text-secondary leading-relaxed">
                    Unlike naive sales tools, Catalyst uses a time-partitioned attribution scheme to credit campaign revenues. 
                    An order value is attributed to a campaign if and only if:
                  </p>

                  <ul className="list-disc pl-5 text-[11px] text-secondary space-y-1">
                    <li>The recipient's corresponding communication status is flagged as <code>PURCHASED</code>.</li>
                    <li>The order's transaction timestamp is <strong>greater than or equal to</strong> the communication's <code>sent_at</code> timestamp.</li>
                    <li>The customer belongs to the target audience defined by the campaign's filter layout.</li>
                  </ul>

                  <div className="p-4 bg-card-bg rounded-xl border border-border font-mono text-[10px] text-secondary leading-relaxed overflow-x-auto">
                    <span className="block font-black uppercase tracking-widest text-[9px] mb-1.5 text-accent">Attribution SQL Query Slice</span>
                    {`SELECT COALESCE(SUM(o.amount), 0) AS total_revenue
FROM communications comm
JOIN orders o ON o.customer_id = comm.customer_id
WHERE comm.campaign_id = $1 
  AND comm.status = 'PURCHASED'
  AND o.created_at >= comm.sent_at;`}
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default DocxPage;

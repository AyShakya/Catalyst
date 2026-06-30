import React, { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

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

const SchemaExplorer: React.FC = () => {
  const [schemaSearch, setSchemaSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableInfo>(TABLES_METADATA[6]);

  const filteredTables = TABLES_METADATA.filter(t => 
    t.name.toLowerCase().includes(schemaSearch.toLowerCase()) || 
    t.description.toLowerCase().includes(schemaSearch.toLowerCase())
  );

  return (
    <div id="schemas" className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight">Interactive Schema Directory</h2>
        <p className="text-xs text-secondary mt-1">Select a table to review indexes, constraints, types, and operational descriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  );
};

export default SchemaExplorer;

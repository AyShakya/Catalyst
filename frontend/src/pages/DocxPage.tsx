import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Database, Cpu, Webhook, Percent, ChevronRight, 
  Shield, Activity, RefreshCw, Award, Zap, Code, CheckCircle2, ArrowRight
} from 'lucide-react';
import SchemaExplorer from '../components/docx/SchemaExplorer';
import ForecastSimulator from '../components/docx/ForecastSimulator';

const DocxPage: React.FC = () => {
  const location = useLocation();
  const isInWorkspace = location.pathname.startsWith('/workspace');
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'architecture' | 'ai-engine' | 'webhooks' | 'formulas'>('architecture');

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
              <SchemaExplorer />

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
              <ForecastSimulator />

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

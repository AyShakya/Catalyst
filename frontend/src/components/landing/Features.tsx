import React from 'react';
import { motion } from 'framer-motion';
import { Database, Lightbulb, Rocket, Check, FileSpreadsheet, ArrowRight } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-transparent border-t border-slate-200/60">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.25em] text-slate-500 uppercase">
            <span className="w-2 h-2 rounded-full bg-accent" />
            PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-slate-900 mb-4">
            How Catalyst works
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-base">
            From raw spreadsheet uploads to direct messaging, Catalyst replaces bloated CRM platforms with an AI strategist.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: Understand */}
          <motion.div 
            className="bg-indigo-50/40 rounded-2xl border border-slate-200/80 p-8 flex flex-col justify-between transition-all hover:border-slate-300 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              {/* Product UI Mockup Top */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm select-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-accent-light/50 text-accent flex items-center justify-center">
                      <Database size={12} />
                    </div>
                    <span className="font-mono text-[9px] font-bold text-slate-400 tracking-wider">DATA INGESTION</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                
                {/* File list mockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-700">customers_db.csv</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">10.2k rows</span>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>MAPPING VECTOR GRAPH</span>
                      <span className="text-accent font-bold">100%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full w-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Eyebrow */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● UNDERSTAND</span>
              </div>
              
              <h3 className="text-2xl font-serif font-medium text-slate-900 mb-3">Vector-Mapped Data</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Upload customer records and purchase history. Catalyst maps your entire commercial database into queryable client profiles automatically.
              </p>
            </div>

            {/* Checklist Feature List */}
            <ul className="space-y-2.5 pt-4 border-t border-slate-200/50">
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-accent font-bold shrink-0 mt-0.5">✓</span>
                <span>Automatic field mapping (CSV & XLSX)</span>
              </li>
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-accent font-bold shrink-0 mt-0.5">✓</span>
                <span>LTV and purchase interval tracking</span>
              </li>
            </ul>
          </motion.div>

          {/* Card 2: Strategize */}
          <motion.div 
            className="bg-[#faf5ff] rounded-2xl border border-slate-200/80 p-8 flex flex-col justify-between transition-all hover:border-slate-300 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              {/* Product UI Mockup Top */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm select-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-pink-50 text-pink-500 flex items-center justify-center">
                      <Lightbulb size={12} />
                    </div>
                    <span className="font-mono text-[9px] font-bold text-slate-400 tracking-wider">STRATEGY MATRIX</span>
                  </div>
                  <span className="text-[9px] font-mono text-pink-500 font-bold bg-pink-50 px-2 py-0.5 rounded-full">AI-native</span>
                </div>
                
                {/* Cohort filters mockup */}
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">GOAL SPECIFICATION</p>
                    <p className="text-[11px] font-medium text-slate-700 leading-tight">
                      "Re-engage users who bought last summer but haven't returned."
                    </p>
                  </div>
                  
                  {/* Generated tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full border border-pink-100">
                      Lapsed VIPs
                    </span>
                    <span className="text-[9px] font-mono bg-indigo-50 text-accent px-2 py-0.5 rounded-full border border-indigo-100">
                      Winter Cohort
                    </span>
                    <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Count: 420
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Eyebrow */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● STRATEGIZE</span>
              </div>
              
              <h3 className="text-2xl font-serif font-medium text-slate-900 mb-3">Natural Language Goals</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Describe your business goal in English. Catalyst instantly discovers the matching audience cohort and builds a tailored discount or content strategy.
              </p>
            </div>

            {/* Checklist Feature List */}
            <ul className="space-y-2.5 pt-4 border-t border-slate-200/50">
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-pink-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>Natural language query translator</span>
              </li>
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-pink-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>AI opportunity auto-discovery feed</span>
              </li>
            </ul>
          </motion.div>

          {/* Card 3: Execute */}
          <motion.div 
            className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 flex flex-col justify-between transition-all hover:border-slate-300 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div>
              {/* Product UI Mockup Top */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm select-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <Rocket size={12} />
                    </div>
                    <span className="font-mono text-[9px] font-bold text-slate-400 tracking-wider">DISPATCH HUD</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                
                {/* Stats grid mockup */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                      <span className="block text-[8px] font-mono text-slate-400">WHATSAPP DELIVERED</span>
                      <span className="text-xs font-bold text-slate-800">98.2%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                      <span className="block text-[8px] font-mono text-slate-400">CONVERSION</span>
                      <span className="text-xs font-bold text-accent">14.3%</span>
                    </div>
                  </div>
                  
                  {/* Status label */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-100 pt-2">
                    <span>DISPATCH ACTIVE</span>
                    <span>1,240 / 1,240 SENT</span>
                  </div>
                </div>
              </div>

              {/* Section Eyebrow */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● EXECUTE</span>
              </div>
              
              <h3 className="text-2xl font-serif font-medium text-slate-900 mb-3">One-Click Dispatch</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Launch SMS, email, or WhatsApp campaigns with a single click. Monitor open rates, conversions, and revenue generation in real-time.
              </p>
            </div>

            {/* Checklist Feature List */}
            <ul className="space-y-2.5 pt-4 border-t border-slate-200/50">
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>Multi-channel delivery (WhatsApp, SMS, Email)</span>
              </li>
              <li className="flex gap-2.5 items-start text-slate-700 text-sm">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>Live revenue metrics tracking dashboard</span>
              </li>
            </ul>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default Features;

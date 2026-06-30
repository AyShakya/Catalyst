import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Send, Users, BarChart3, MessageSquare } from 'lucide-react';

const DemoVideo: React.FC = () => {
  return (
    <section id="demo-video" className="py-20 bg-transparent scroll-mt-24">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.25em] text-slate-500 uppercase">
            <span className="w-2 h-2 rounded-full bg-accent" />
            LIVE CASE STUDY
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-slate-900 mb-4">
            See Catalyst in Action
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-base">
            Watch how our AI engine analyzes customer records, identifies win-back opportunities, and launches an SMS + WhatsApp campaign.
          </p>
        </div>

        {/* Browser Mockup and Video Frame Container */}
        <motion.div 
          className="relative max-w-5xl mx-auto rounded-2xl border-2 border-slate-900 bg-white shadow-xl overflow-hidden group cursor-pointer"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Browser Header Bar */}
          <div className="border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-slate-900/10" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-slate-900/10" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-slate-900/10" />
            </div>
            {/* Browser Address Bar */}
            <div className="h-7 w-96 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[11px] font-mono text-slate-400 tracking-tight px-4">
              catalyst.ai/workspace/campaign_builder_vip
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Inner Workspace Mockup */}
          <div className="grid grid-cols-12 h-[450px] relative bg-slate-50 text-slate-800">
            
            {/* Sidebar Mockup */}
            <div className="col-span-3 border-r border-slate-200 bg-white p-4 hidden md:block select-none">
              <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-white">
                  <Sparkles size={12} />
                </div>
                <span className="font-bold text-sm tracking-tight">Workspace</span>
              </div>
              <nav className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 font-medium text-xs text-accent">
                  <Sparkles size={14} /> AI Strategist
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 font-medium text-xs hover:bg-slate-50">
                  <Users size={14} /> Customer cohorts
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 font-medium text-xs hover:bg-slate-50">
                  <Send size={14} /> Campaigns
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 font-medium text-xs hover:bg-slate-50">
                  <BarChart3 size={14} /> Analytics
                </div>
              </nav>
            </div>

            {/* Dashboard Workspace Mockup */}
            <div className="col-span-12 md:col-span-9 p-6 flex flex-col justify-between select-none">
              <div className="space-y-4">
                {/* Cohort Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">● AUDIENCE SELECTION</span>
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">LTV VIPs (Inactive 30 Days)</h4>
                  <p className="text-xs text-slate-500 mt-1">1,240 records match this criteria. Avg LTV: $420.</p>
                </div>

                {/* Prompt block */}
                <div className="bg-accent-light/40 border border-accent/15 rounded-xl p-4 flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-accent uppercase tracking-wider block mb-1">AI STRATEGIST BRIEF</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      "I want to win back customers who spent over $200 but haven't made a purchase in 30 days. Let's offer them a custom 15% discount code."
                    </p>
                  </div>
                </div>

                {/* Channels Mockup */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs">WhatsApp Channel</h5>
                      <span className="text-[10px] text-slate-400">Template: Winback_V2</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-accent flex items-center justify-center">
                      <Send size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs">SMS Channel</h5>
                      <span className="text-[10px] text-slate-400">Template: Promo_SMS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>STATUS: READY TO DISPATCH</span>
                <span className="text-accent animate-pulse">● WAITING FOR APPROVAL</span>
              </div>
            </div>

            {/* Frosted Play Overlay covering the workspace */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center transition-all group-hover:bg-slate-950/30">
              {/* Pulsing Play Pill Button */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white border-2 border-slate-900 rounded-full px-6 py-3.5 flex items-center gap-3 shadow-xl transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center">
                  <Play size={16} fill="white" className="ml-0.5" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-semibold">WATCH DEMO VIDEO</p>
                  <p className="text-xs font-bold text-slate-800">Increasing Repeat Purchases</p>
                </div>
                <div className="border-l border-slate-200 pl-3 ml-1 text-slate-400 text-xs font-mono">
                  02:45
                </div>
              </motion.div>
              
              <p className="text-white/60 text-xs mt-4 font-mono uppercase tracking-[0.15em]">
                Click to preview the multi-channel workflow
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default DemoVideo;

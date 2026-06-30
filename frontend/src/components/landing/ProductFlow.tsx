import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    step: "STEP 01",
    title: "Business Goal",
    description: "Define your objective in plain English.",
    colorClass: "bg-accent-light/30 border-accent/10 text-accent",
    doodle: (
      <svg width="70" height="70" viewBox="0 0 100 100" className="text-slate-700">
        {/* Drawn input box */}
        <rect x="15" y="30" width="70" height="40" rx="6" fill="white" stroke="currentColor" strokeWidth="2" />
        <circle cx="25" cy="40" r="1.5" fill="currentColor" />
        <circle cx="31" cy="40" r="1.5" fill="currentColor" />
        <circle cx="37" cy="40" r="1.5" fill="currentColor" />
        {/* Text lines */}
        <path d="M25 50 H65 M25 58 H50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Dotted cursor */}
        <path d="M53 54 V62" stroke="#4f46e5" strokeWidth="2" className="animate-pulse" />
        {/* Speech/target bubble */}
        <circle cx="75" cy="25" r="12" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" />
        <path d="M72 25 L75 28 L80 22" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    step: "STEP 02",
    title: "Audience Discovery",
    description: "AI segments customer cohorts dynamically.",
    colorClass: "bg-pink-50/50 border-pink-100 text-pink-500",
    doodle: (
      <svg width="70" height="70" viewBox="0 0 100 100" className="text-slate-700">
        {/* Venn Diagram circles */}
        <circle cx="42" cy="48" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="58" cy="48" r="22" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M48 48 A 22 22 0 0 1 52 48" fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Selected cohort highlight */}
        <path d="M50 35 C 55 40, 55 56, 50 61 C 45 56, 45 40, 50 35 Z" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.5" />
        {/* Magnifying Glass */}
        <path d="M60 60 L78 78 M52 52 C58 52, 62 48, 62 42 C62 36, 58 32, 52 32 C46 32, 42 36, 42 42 C42 48, 46 52, 52 52 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  {
    step: "STEP 03",
    title: "Campaign Strategy",
    description: "Automated channel and copy tailoring.",
    colorClass: "bg-indigo-50/50 border-indigo-100 text-indigo-500",
    doodle: (
      <svg width="70" height="70" viewBox="0 0 100 100" className="text-slate-700">
        {/* Strategy split tree */}
        <rect x="40" y="15" width="20" height="16" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
        <path d="M45 23 H55" stroke="currentColor" strokeWidth="1.5" />
        {/* Connection lines */}
        <path d="M50 31 V48 M50 48 H25 V58 M50 48 H75 V58" fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Channel blocks */}
        <rect x="15" y="58" width="20" height="16" rx="4" fill="#faf5ff" stroke="#4f46e5" strokeWidth="1.5" />
        <path d="M19 66 H31" stroke="#4f46e5" strokeWidth="1.5" />
        <rect x="65" y="58" width="20" height="16" rx="4" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" />
        <circle cx="75" cy="66" r="3" fill="#f472b6" />
      </svg>
    )
  },
  {
    step: "STEP 04",
    title: "Seamless Dispatch",
    description: "Instant delivery via WhatsApp, SMS, or Email.",
    colorClass: "bg-emerald-50/40 border-emerald-100 text-emerald-500",
    doodle: (
      <svg width="70" height="70" viewBox="0 0 100 100" className="text-slate-700">
        {/* Smartphone mockup */}
        <rect x="32" y="15" width="36" height="70" rx="8" fill="white" stroke="currentColor" strokeWidth="2" />
        <line x1="45" y1="20" x2="55" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="50" cy="80" r="2" fill="currentColor" />
        {/* Flying paper plane / message */}
        <path d="M50 42 L68 32 L58 55 L53 47 Z" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M42 42 L25 35" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Speed lines */}
        <path d="M22 48 H12 M25 54 H16" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    step: "STEP 05",
    title: "Actionable Insights",
    description: "Live campaign performance analysis.",
    colorClass: "bg-amber-50/50 border-amber-100 text-amber-500",
    doodle: (
      <svg width="70" height="70" viewBox="0 0 100 100" className="text-slate-700">
        {/* Chart paper */}
        <rect x="20" y="20" width="60" height="60" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
        {/* Grid lines */}
        <path d="M20 70 H80 M30 80 V20 M50 80 V20 M70 80 V20" stroke="slate-100" strokeWidth="1" />
        {/* Bar charts rising */}
        <rect x="28" y="55" width="10" height="15" fill="#e0e7ff" stroke="currentColor" strokeWidth="1.5" />
        <rect x="44" y="40" width="10" height="30" fill="#faf5ff" stroke="currentColor" strokeWidth="1.5" />
        <rect x="60" y="28" width="10" height="42" fill="#fdf2f8" stroke="#4f46e5" strokeWidth="1.5" />
        {/* Sparkle */}
        <path d="M72 18 L74 23 L79 25 L74 27 L72 32 L70 27 L65 25 L70 23 Z" fill="#f59e0b" />
      </svg>
    )
  }
];

const ProductFlow: React.FC = () => {
  return (
    <section className="py-20 bg-transparent">
      
      {/* MONOSPACE STAT BANNER STRIP */}
      <div className="w-full border-y border-slate-200/80 bg-white/60 backdrop-blur-sm py-5 mb-24 overflow-x-auto whitespace-nowrap">
        <div className="container mx-auto px-6 flex items-center justify-between gap-12 font-mono text-xs md:text-sm text-slate-700 max-w-5xl">
          <div className="flex items-center gap-3">
            <span className="font-bold text-accent">10,000+</span>
            <span className="text-slate-400 uppercase tracking-widest text-[11px]">COHORTS ANALYZED</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-accent">84%</span>
            <span className="text-slate-400 uppercase tracking-widest text-[11px]">OPEN ENGAGEMENT</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-accent">&lt; 3 MINUTES</span>
            <span className="text-slate-400 uppercase tracking-widest text-[11px]">TO LAUNCH CAMPAIGN</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-accent">12x</span>
            <span className="text-slate-400 uppercase tracking-widest text-[11px]">AVERAGE MARKETING ROI</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.25em] text-slate-500 uppercase">
            <span className="w-2 h-2 rounded-full bg-accent" />
            THE CATALYST ENGINE
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-slate-900 mb-4">
            From raw data to revenue in five steps
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-base">
            Catalyst automates the heavy lifting of CRM, transforming your list of users into active, high-yield pipelines.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Subtle curved background line on desktop */}
          <div className="hidden xl:block absolute top-[135px] left-[10%] right-[10%] pointer-events-none z-0">
            <svg width="100%" height="80" viewBox="0 0 800 80" fill="none" className="text-slate-300">
              <path d="M0,40 Q200,80 400,40 T800,40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            </svg>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center text-center transition-all hover:border-slate-300 group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Step Indicator eyebrow */}
                <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="font-mono text-[10px] tracking-widest text-slate-400 font-semibold">
                    {step.step}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-accent transition-colors" />
                </div>

                {/* Doodle Sketch Area */}
                <div className="h-24 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  {step.doodle}
                </div>

                {/* Title and Description */}
                <h3 className="text-lg font-bold text-slate-800 mb-2 font-sans">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] xl:max-w-none">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductFlow;

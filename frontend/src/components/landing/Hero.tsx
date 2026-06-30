import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const hasWorkspace = !!localStorage.getItem('catalyst_brand_id');

  const scrollToDemo = () => {
    document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-transparent pt-32 pb-16 lg:pt-44 lg:pb-24 flex flex-col justify-center items-center min-h-[85vh]">
      
      {/* LEFT FLANKING DOODLES (Desktop only - absolute position) */}
      <div className="absolute left-0 top-[10%] w-[280px] xl:w-[350px] h-[550px] pointer-events-none select-none hidden lg:block z-0">
        <motion.div 
          initial={{ opacity: 0, x: -30, rotate: -2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="w-full h-full"
        >
          <svg width="100%" height="100%" viewBox="0 0 320 550" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sweeping main loop line */}
            <path d="M 290,30 C 140,30, 25,110, 25,230 C 25,350, 160,350, 70,490" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />
            
            {/* Connecting loops */}
            <path d="M 120,290 C 45,310, 75,410, 130,410" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />

            {/* Concentric target above top frame */}
            <circle cx="115" cy="40" r="12" fill="none" stroke="#231e21" strokeWidth="2" />
            <circle cx="115" cy="40" r="6" fill="none" stroke="#231e21" strokeWidth="2" />
            <path d="M 115,15 V 45 L 111,39 M 115,45 L 119,39" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />

            {/* Top Browser Frame (Man with beard & magnifying glass) */}
            <rect x="50" y="65" width="130" height="135" rx="3" fill="#ffffff" stroke="#231e21" strokeWidth="2" />
            {/* macOS browser dots top right */}
            <circle cx="152" cy="77" r="2.5" fill="#231e21" />
            <circle cx="160" cy="77" r="2.5" fill="#231e21" />
            <circle cx="168" cy="77" r="2.5" fill="#231e21" />
            
            {/* Man vector */}
            <path d="M 75,198 C 80,170, 95,150, 115,150 C 135,150, 150,170, 155,198 Z" fill="#e0e7ff" />
            <path d="M 95,150 C 95,130, 97,112, 115,112 C 133,112, 135,130, 135,150 Z" fill="#faf5ff" stroke="#231e21" strokeWidth="2" />
            <path d="M 95,132 C 92,112, 102,96, 115,96 C 128,96, 138,112, 135,132 C 127,128, 117,128, 105,132 Z" fill="#231e21" stroke="#231e21" strokeWidth="1" />
            <path d="M 103,158 Q 115,178, 127,158" fill="#231e21" stroke="#231e21" strokeWidth="1.5" />
            <circle cx="108" cy="142" r="1.5" fill="#231e21" />
            <circle cx="122" cy="142" r="1.5" fill="#231e21" />
            {/* Magnifying glass */}
            <circle cx="160" cy="145" r="11" fill="white" fillOpacity="0.8" stroke="#231e21" strokeWidth="2" />
            <line x1="168" y1="153" x2="182" y2="167" stroke="#231e21" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 155,145 A 5 5 0 0 1 165,145" fill="none" stroke="#65b8a2" strokeWidth="1.5" strokeLinecap="round" />

            {/* Calendar icon hanging off */}
            <rect x="35" y="175" width="24" height="24" rx="3" fill="white" stroke="#231e21" strokeWidth="2" />
            <line x1="41" y1="171" x2="41" y2="177" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />
            <line x1="53" y1="171" x2="53" y2="177" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />
            <path d="M 40,189 L 45,193 L 53,184" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />

            {/* Bottom Browser Frame (Woman with teal hair looking up/right) */}
            <rect x="70" y="295" width="140" height="135" rx="3" fill="#ffffff" stroke="#231e21" strokeWidth="2" />
            {/* macOS browser dots top left */}
            <circle cx="82" cy="307" r="2.5" fill="#231e21" />
            <circle cx="90" cy="307" r="2.5" fill="#231e21" />
            <circle cx="98" cy="307" r="2.5" fill="#231e21" />

            {/* Woman vector */}
            <path d="M 95,410 C 80,355, 140,320, 160,350 C 180,380, 178,410, 162,428 Z" fill="#cae1e2" />
            <path d="M 95,410 C 80,355, 140,320, 160,350 C 180,380, 178,410, 162,428" fill="none" stroke="#231e21" strokeWidth="2" />
            <path d="M 115,395 C 115,372, 145,372, 145,395 Z" fill="#faf5ff" stroke="#231e21" strokeWidth="2" />
            <circle cx="132" cy="385" r="1.5" fill="#231e21" />
            <circle cx="142" cy="385" r="1.5" fill="#231e21" />
            <path d="M 134,392 Q 138,395, 140,392" fill="none" stroke="#231e21" strokeWidth="1.5" strokeLinecap="round" />
            {/* Hands resting on bottom edge */}
            <path d="M 105,430 Q 110,422, 115,430 Q 120,422, 125,430" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />
            <path d="M 160,430 Q 165,422, 170,430 Q 175,422, 180,430" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />

            {/* Floating elements and doodles around left side */}
            {/* Video/Camera icon sketch */}
            <circle cx="50" cy="485" r="18" fill="white" stroke="#231e21" strokeWidth="2" />
            <rect x="42" y="479" width="12" height="12" rx="2" fill="none" stroke="#231e21" strokeWidth="2" />
            <path d="M 54,482 L 59,478 V 492 L 54,488 Z" fill="#231e21" stroke="#231e21" strokeWidth="1" />

            {/* Star flower doodle */}
            <path d="M 75,230 L 78,242 L 90,242 L 80,249 L 83,260 L 75,253 L 67,260 L 70,249 L 60,242 L 72,242 Z" fill="#faf5ff" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Blue Video/Zoom badge */}
            <circle cx="280" cy="270" r="16" fill="#e0e7ff" stroke="#231e21" strokeWidth="2" />
            <path d="M 272,266 Q 280,266 288,266 Q 288,274 288,274 Q 280,274 272,274 Z" fill="#4f46e5" />
            <circle cx="280" cy="270" r="4" fill="white" />

            {/* Outlook style Mail badge */}
            <rect x="255" y="365" width="22" height="16" rx="2" fill="#fdf2f8" stroke="#231e21" strokeWidth="2" />
            <path d="M 255,367 L 266,375 L 277,367" fill="none" stroke="#f472b6" strokeWidth="1.5" />

            {/* Small floating chat bubble */}
            <path d="M 275,415 C 275,405, 295,405, 295,415 C 295,423, 285,423, 282,426 L 282,421 Z" fill="white" stroke="#231e21" strokeWidth="1.5" />
          </svg>
        </motion.div>
      </div>

      {/* RIGHT FLANKING DOODLES (Desktop only - absolute position) */}
      <div className="absolute right-0 top-[10%] w-[280px] xl:w-[350px] h-[550px] pointer-events-none select-none hidden lg:block z-0">
        <motion.div 
          initial={{ opacity: 0, x: 30, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="w-full h-full"
        >
          <svg width="100%" height="100%" viewBox="0 0 320 550" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sweeping loops */}
            <path d="M 130,490 C 190,490, 290,430, 290,340 C 290,230, 180,230, 220,100" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />
            
            {/* Dotted path leading up to avatars */}
            <path d="M 210,340 C 190,230, 270,170, 235,50" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />

            {/* Figure with hoodie at laptop */}
            {/* Laptop back/screen */}
            <path d="M 135,420 L 160,355 L 225,355 L 225,420" fill="white" stroke="#231e21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Heart on laptop */}
            <path d="M 185,378 C 182,371, 192,367, 195,375 C 198,377, 208,371, 205,378 L 195,388 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" />
            
            {/* Hoodie body */}
            <path d="M 180,498 C 185,445, 205,422, 235,422 C 265,422, 275,445, 280,498 Z" fill="#fbcfe8" />
            <path d="M 180,498 C 185,445, 205,422, 235,422 C 265,422, 275,445, 280,498" fill="none" stroke="#231e21" strokeWidth="2" />
            {/* Head */}
            <circle cx="230" cy="355" r="22" fill="#faf5ff" stroke="#231e21" strokeWidth="2" />
            {/* Hair */}
            <path d="M 212,350 C 212,330, 248,330, 248,350" fill="none" stroke="#231e21" strokeWidth="2.5" />
            {/* Glasses */}
            <rect x="214" y="347" width="11" height="8" rx="1" fill="none" stroke="#231e21" strokeWidth="1.5" />
            <rect x="229" y="347" width="11" height="8" rx="1" fill="none" stroke="#231e21" strokeWidth="1.5" />
            <line x1="225" y1="351" x2="229" y2="351" stroke="#231e21" strokeWidth="1.5" />
            {/* Keyboard base */}
            <path d="M 130,420 L 225,420 L 240,445 L 115,445 Z" fill="white" stroke="#231e21" strokeWidth="2" />
            {/* Hand lines */}
            <path d="M 185,440 Q 200,432, 205,440" fill="none" stroke="#231e21" strokeWidth="2" strokeLinecap="round" />

            {/* Folder above laptop */}
            <path d="M 215,200 V 150 H 245 L 250,158 H 285 V 200 Z" fill="white" stroke="#231e21" strokeWidth="2" strokeLinejoin="round" />
            <rect x="225" y="132" width="45" height="50" rx="1" fill="white" stroke="#231e21" strokeWidth="1.5" />
            <line x1="233" y1="145" x2="260" y2="145" stroke="#231e21" strokeWidth="1.5" />
            <line x1="233" y1="155" x2="255" y2="155" stroke="#231e21" strokeWidth="1.5" />
            <circle cx="270" cy="188" r="2.5" fill="#231e21" /><circle cx="276" cy="188" r="2.5" fill="#231e21" /><circle cx="282" cy="188" r="2.5" fill="#231e21" />

            {/* Floating Pencil */}
            <path d="M 285,115 L 305,95 L 312,102 L 292,122 Z" fill="white" stroke="#231e21" strokeWidth="1.5" />
            <path d="M 285,115 L 281,122 L 288,119 Z" fill="#231e21" />

            {/* Sweeping dotted trail Avatars */}
            {/* Avatar 1 (top right) */}
            <circle cx="255" cy="85" r="18" fill="#e0e7ff" stroke="#231e21" strokeWidth="2" />
            <circle cx="255" cy="82" r="5" fill="#231e21" />
            <path d="M 245,95 Q 255,91 265,95 Z" fill="#231e21" />
            <path d="M 235,85 C 235,70, 240,65, 255,65 C 270,65, 275,70, 275,85" fill="none" stroke="#231e21" strokeWidth="1" strokeDasharray="2 2" />

            {/* Avatar 2 (middle left) */}
            <circle cx="190" cy="225" r="18" fill="#fda4af" stroke="#231e21" strokeWidth="2" />
            <circle cx="190" cy="222" r="5" fill="#231e21" />
            <path d="M 180,235 Q 190,231 200,235 Z" fill="#231e21" />

            {/* Avatar 3 (bottom left) */}
            <circle cx="195" cy="315" r="18" fill="#fde047" stroke="#231e21" strokeWidth="2" />
            <circle cx="195" cy="312" r="5" fill="#231e21" />
            <path d="M 185,325 Q 195,321 205,325 Z" fill="#231e21" />

            {/* Floating 8-point star doodle */}
            <path d="M 270,40 L 273,47 L 280,48 L 275,53 L 277,60 L 270,56 L 263,60 L 265,53 L 260,48 L 267,47 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" />
          </svg>
        </motion.div>
      </div>

      {/* CENTER CONTENT */}
      <div className="container mx-auto px-6 relative z-10 w-full max-w-[800px]">
        
        {/* AI Assistant Pill Banner */}
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-accent-light/40 border border-accent/20 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase text-accent hover:bg-accent-light/60 transition-all cursor-pointer"
            onClick={scrollToDemo}
          >
            <Sparkles size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span>AI-Assisted CRM</span>
            <span className="text-slate-300">|</span>
            <span className="normal-case font-sans font-medium text-slate-700">Turn customer data into growth instantly</span>
            <ArrowRight size={12} className="ml-1" />
          </motion.div>
        </div>

        {/* Centralized Text Stack */}
        <div className="text-center">
          <motion.span 
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.25em] text-slate-500 uppercase"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            AI MARKETING STRATEGIST FOR MODERN BRANDS
          </motion.span>
          
          <motion.h1 
            className="mx-auto mb-6 text-5xl sm:text-6xl md:text-7xl font-serif font-medium leading-[1.1] tracking-tight text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Turn Customer Data Into <br className="hidden sm:block" />
            <span className="italic font-normal text-accent relative inline-block">
              Growth
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/30 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q25,10 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </span>.
          </motion.h1>
          
          <motion.p 
            className="mx-auto mb-10 max-w-[620px] text-base sm:text-lg leading-relaxed text-slate-600 font-sans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Upload customer data. Describe a business goal. Catalyst discovers high-value cohorts,
            crafts targeted strategies, and deploys multi-channel campaigns.
          </motion.p>
          
          <motion.div 
            className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to={hasWorkspace ? "/workspace" : "/setup"} className="btn btn-primary w-full sm:w-auto px-7 py-3.5 text-[15px]">
              {hasWorkspace ? 'Return to Workspace' : 'Launch Workspace'} <ArrowRight size={16} />
            </Link>
            <button onClick={scrollToDemo} className="btn btn-secondary w-full sm:w-auto px-7 py-3.5 text-[15px]">
              Watch Demo <Play size={14} className="fill-slate-800 text-slate-800 ml-0.5" />
            </button>
          </motion.div>
        </div>

        {/* CHANNELS & INTEGRATIONS ECOSYSTEM BAR */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 border-y border-slate-200/80 py-8 w-full"
        >
          <span className="font-mono text-[10px] tracking-[0.25em] text-slate-400 uppercase text-center block mb-6">
            INTEGRATES SEAMLESSLY WITH YOUR DATA SOURCES & MARKETING CHANNELS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70 grayscale transition-all">
            
            {/* Shopify */}
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold tracking-tight hover:opacity-100 hover:text-[#95BF47] hover:grayscale-0 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Shopify</span>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold tracking-tight hover:opacity-100 hover:text-[#25D366] hover:grayscale-0 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp</span>
            </div>

            {/* Stripe */}
            <div className="flex items-center gap-2 text-slate-700 text-sm font-black tracking-wider uppercase hover:opacity-100 hover:text-[#635BFF] hover:grayscale-0 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Stripe</span>
            </div>

            {/* HubSpot */}
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold tracking-tight hover:opacity-100 hover:text-[#FF7A59] hover:grayscale-0 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v7M12 15v7M2 12h7M15 12h7" />
              </svg>
              <span>HubSpot</span>
            </div>

            {/* Mailchimp */}
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold tracking-tight hover:opacity-100 hover:text-[#FFE01B] hover:grayscale-0 transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 13a6 6 0 0 1-6 6H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a6 6 0 0 1 6 6z" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
              <span>Mailchimp</span>
            </div>
            
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;

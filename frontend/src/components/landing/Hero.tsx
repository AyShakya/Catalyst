import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const hasWorkspace = !!localStorage.getItem('catalyst_brand_id');

  return (
    <section className="relative overflow-hidden bg-transparent py-32 text-center lg:py-48">
      <div className="container mx-auto px-6">
        <motion.span 
          className="mb-6 block text-sm font-semibold tracking-widest text-accent uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          AI Marketing Strategist for Modern Brands
        </motion.span>
        
        <motion.h1 
          className="mx-auto mb-8 max-w-[900px] text-4xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          TURN CUSTOMER <br className="hidden sm:block" /> DATA INTO <br className="hidden sm:block" /> GROWTH.
        </motion.h1>
        
        <motion.p 
          className="mx-auto mb-12 max-w-[600px] text-xl leading-relaxed text-secondary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Upload customer data. Describe a business goal. Catalyst discovers audiences, 
          executes campaigns, and delivers actionable insights.
        </motion.p>
        
        <motion.div 
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to={hasWorkspace ? "/workspace" : "/setup"} className="btn btn-primary w-full sm:w-auto">
            {hasWorkspace ? 'Return to Workspace' : 'Launch Workspace'} <ArrowRight size={18} />
          </Link>
          <button className="btn btn-secondary w-full sm:w-auto">
            Watch Demo <Play size={18} fill="currentColor" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

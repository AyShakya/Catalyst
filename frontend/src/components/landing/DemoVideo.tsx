import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const DemoVideo: React.FC = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">SEE CATALYST IN ACTION</h2>
          <p className="text-secondary max-w-2xl mx-auto">
            Watch how the AI strategist builds a multi-channel campaign in under 3 minutes.
          </p>
        </div>

        <motion.div 
          className="relative max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden bg-foreground shadow-2xl group cursor-pointer border border-white/5"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Professional Background Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-foreground to-foreground group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
              <Play fill="white" className="text-white ml-1" size={32} />
            </div>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="text-white">
              <p className="text-sm font-semibold opacity-60 uppercase tracking-widest mb-1">Demo Case Study</p>
              <h3 className="text-xl font-bold">Increasing Repeat Purchases</h3>
            </div>
            <div className="text-white/60 text-sm font-medium">
              02:45
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoVideo;

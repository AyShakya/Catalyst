import React from 'react';
import { motion } from 'framer-motion';
import { Target, Search, Zap, Send, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: <Target className="text-accent" size={24} />,
    title: "Business Goal",
    description: "Define your objective in plain English."
  },
  {
    icon: <Search className="text-accent" size={24} />,
    title: "Audience Discovery",
    description: "AI identifies the perfect customer segment."
  },
  {
    icon: <Zap className="text-accent" size={24} />,
    title: "Campaign Strategy",
    description: "Automated channel and message selection."
  },
  {
    icon: <Send className="text-accent" size={24} />,
    title: "Execution",
    description: "Seamless delivery across WhatsApp, SMS, or Email."
  },
  {
    icon: <BarChart3 className="text-accent" size={24} />,
    title: "Insights",
    description: "Actionable performance data and next steps."
  }
];

const ProductFlow: React.FC = () => {
  return (
    <section className="py-24 bg-card-bg/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">THE CATALYST ENGINE</h2>
          <p className="text-secondary max-w-2xl mx-auto">
            From raw data to revenue in five intelligent steps.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-border z-0" />
          
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 lg:gap-4 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="flex flex-col items-center text-center group w-full lg:w-1/5 relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Vertical Line (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute top-16 left-1/2 w-0.5 h-12 bg-border -translate-x-1/2 z-0" />
                )}

                <div className="w-16 h-16 rounded-full bg-white border border-border flex items-center justify-center mb-6 shadow-sm group-hover:border-accent group-hover:shadow-md transition-all duration-300 relative bg-white z-10">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-secondary leading-relaxed max-w-[200px] lg:max-w-none">
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

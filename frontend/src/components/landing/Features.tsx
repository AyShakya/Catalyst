import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Lightbulb, Rocket } from 'lucide-react';

const features = [
  {
    icon: <UploadCloud className="text-accent" size={32} />,
    title: "Understand",
    description: "Upload customer and order data. Catalyst maps your business landscape automatically."
  },
  {
    icon: <Lightbulb className="text-accent" size={32} />,
    title: "Strategize",
    description: "Describe a business goal. Catalyst identifies the ideal audience and creates a tailored campaign."
  },
  {
    icon: <Rocket className="text-accent" size={32} />,
    title: "Execute",
    description: "Launch campaigns with one click and monitor results through an AI-powered dashboard."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-transparent">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">HOW CATALYST WORKS</h2>
          <p className="text-secondary max-w-2xl mx-auto">
            A frictionless journey from data to actionable growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white p-10 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:border-accent/20 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

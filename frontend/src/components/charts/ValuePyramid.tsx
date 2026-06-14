import React from 'react';
import { motion } from 'framer-motion';

interface ValuePyramidProps {
  data: { label: string; value: number; threshold: number }[];
}

const COLORS = ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5'];

const ValuePyramid: React.FC<ValuePyramidProps> = React.memo(({ data }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {data.map((tier, index) => (
        <motion.div
          key={tier.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative h-12 flex items-center overflow-hidden rounded-xl group"
          style={{ 
            width: `${100 - index * 10}%`,
            backgroundColor: COLORS[index % COLORS.length]
          }}
        >
          <div className="px-4 flex justify-between w-full items-center text-white relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest">{tier.label}</span>
            <span className="text-xs font-black">
              {tier.threshold > 0 ? `Spend > $${tier.threshold.toLocaleString()}` : `${tier.value}% of Base`}
            </span>
          </div>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ))}
    </div>
  );
});

export default ValuePyramid;

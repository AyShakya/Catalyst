import React from 'react';
import { motion } from 'framer-motion';

interface FunnelStepProps {
  label: string;
  value: number;
  total: number;
  color: string;
  delay: number;
  percentage?: string;
}

const FunnelStep = ({ label, value, total, color, delay, percentage }: FunnelStepProps) => {
  const width = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{label}</span>
        <div className="text-right">
          <span className="text-sm font-black block">{value.toLocaleString()}</span>
          {percentage && <span className="text-[9px] font-bold text-secondary uppercase">{percentage}</span>}
        </div>
      </div>
      <div className="h-3 bg-card-bg rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className="h-full rounded-full shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

interface CampaignFunnelProps {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  purchased: number;
}

const CampaignFunnel: React.FC<CampaignFunnelProps> = React.memo(({ sent, delivered, opened, clicked, purchased }) => {
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0';
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0';
  const ctr = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0';
  const conversionRate = clicked > 0 ? ((purchased / clicked) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <FunnelStep 
        label="Sent" 
        value={sent} 
        total={sent} 
        color="#6366f1" 
        delay={0.1} 
      />
      <FunnelStep 
        label="Delivered" 
        value={delivered} 
        total={sent} 
        color="#8b5cf6" 
        delay={0.2} 
        percentage={`${deliveryRate}% Delivery`}
      />
      <FunnelStep 
        label="Opened" 
        value={opened} 
        total={sent} 
        color="#ec4899" 
        delay={0.3} 
        percentage={`${openRate}% Open Rate`}
      />
      <FunnelStep 
        label="Clicked" 
        value={clicked} 
        total={sent} 
        color="#f59e0b" 
        delay={0.4} 
        percentage={`${ctr}% CTR`}
      />
      <FunnelStep 
        label="Converted" 
        value={purchased} 
        total={sent} 
        color="#10b981" 
        delay={0.5} 
        percentage={`${conversionRate}% Conv. Rate`}
      />
    </div>
  );
});

export default CampaignFunnel;

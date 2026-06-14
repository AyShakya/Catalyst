import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { MetricDistribution } from '../../types/intelligence';

interface RevenueDonutProps {
  data: MetricDistribution[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const RevenueDonut: React.FC<RevenueDonutProps> = ({ data }) => {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  const formatTooltip = (value: any) => {
    const percentage = ((value / totalCount) * 100).toFixed(1);
    return [`${value} Customers (${percentage}%)`, 'Count'];
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="count"
            nameKey="label"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={formatTooltip}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueDonut;

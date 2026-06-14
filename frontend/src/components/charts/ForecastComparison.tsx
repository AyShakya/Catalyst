import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface ForecastComparisonProps {
  forecast: {
    delivered: number;
    opened: number;
    clicked: number;
    conversions: number;
  };
  actual: {
    delivered: number;
    opened: number;
    clicked: number;
    conversions: number;
  };
}

const ForecastComparison: React.FC<ForecastComparisonProps> = React.memo(({ forecast, actual }) => {
  const data = [
    { name: 'Delivered', Forecast: forecast.delivered, Actual: actual.delivered },
    { name: 'Opened', Forecast: forecast.opened, Actual: actual.opened },
    { name: 'Clicked', Forecast: forecast.clicked, Actual: actual.clicked },
    { name: 'Converted', Forecast: forecast.conversions, Actual: actual.conversions },
  ];

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Bar dataKey="Forecast" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
          <Bar dataKey="Actual" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ForecastComparison;

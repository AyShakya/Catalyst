import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, Label
} from 'recharts';
import { HealthMatrixPoint } from '../../types/intelligence';

interface CustomerHealthMatrixProps {
  data: HealthMatrixPoint[];
}

const COLORS = {
  vip: '#10b981', // Green
  atRisk: '#ef4444', // Red
  growth: '#4f46e5', // Indigo
  cooling: '#f59e0b', // Amber
};

const CustomerHealthMatrix: React.FC<CustomerHealthMatrixProps> = React.memo(({ data }) => {
  const formatTooltip = (value: any, name: any): [string, string] => {
    const nameStr = String(name || '');
    if (nameStr === 'Loyalty') return [`${value}/100`, 'Loyalty Score'];
    if (nameStr === 'Churn Risk') return [`${value}%`, 'Churn Risk'];
    if (nameStr === 'Spend') return [`$${Number(value || 0).toLocaleString()}`, 'Total Spend'];
    return [String(value || ''), nameStr];
  };

  const getPointColor = (point: HealthMatrixPoint) => {
    if (point.loyalty > 75 && point.churn < 25) return COLORS.vip;
    if (point.churn > 75) return COLORS.atRisk;
    if (point.loyalty < 30 && point.churn < 50) return COLORS.growth;
    return COLORS.cooling;
  };

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            dataKey="loyalty" 
            name="Loyalty" 
            domain={[0, 100]} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
          >
            <Label value="Loyalty Score" position="bottom" offset={0} style={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="churn" 
            name="Churn Risk" 
            domain={[0, 100]} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
          >
            <Label value="Churn Risk %" angle={-90} position="left" offset={0} style={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
          </YAxis>
          <ZAxis type="number" dataKey="spend" range={[50, 400]} name="Spend" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={formatTooltip}
          />
          
          {/* Quadrant Lines */}
          <ReferenceLine x={50} stroke="#e2e8f0" strokeDasharray="5 5" />
          <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="5 5" />

          <Scatter name="Customers" data={data} isAnimationActive={data.length < 200} animationDuration={1500}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPointColor(entry)} fillOpacity={0.6} strokeWidth={1} stroke={getPointColor(entry)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});

export default CustomerHealthMatrix;

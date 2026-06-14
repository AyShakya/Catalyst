import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, 
  TrendingUp, MousePointer2, Mail, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCampaigns } from '../services/brandService';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) {
      navigate('/setup');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getCampaigns(brandId);
        setCampaigns(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Aggregate Metrics
  const totalDelivered = campaigns.reduce((acc, c) => acc + (Number(c.delivered || c.forecast_delivered) || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (Number(c.opened || c.forecast_opened) || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (Number(c.clicked || c.forecast_clicked) || 0), 0);
  const totalAudience = campaigns.reduce((acc, c) => acc + (Number(c.audience_size) || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (Number(c.revenue || c.forecast_purchased) || 0), 0);
  
  const deliveryRate = totalAudience > 0 ? (totalDelivered / totalAudience) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const ctr = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  const channelData = [
    { name: 'WhatsApp', value: campaigns.filter(c => String(c.channel).toUpperCase() === 'WHATSAPP').length },
    { name: 'SMS', value: campaigns.filter(c => String(c.channel).toUpperCase() === 'SMS').length },
    { name: 'Email', value: campaigns.filter(c => String(c.channel).toUpperCase() === 'EMAIL').length },
  ];

  const trendData = campaigns.slice().reverse().map(c => {
    const delivered = Number(c.delivered || c.forecast_delivered) || 0;
    const opened = Number(c.opened || c.forecast_opened) || 0;
    const clicked = Number(c.clicked || c.forecast_clicked) || 0;
    const name = c.campaign_name || c.name || 'Untitled';

    return {
      name: name.substring(0, 10),
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      ctr: opened > 0 ? (clicked / opened) * 100 : 0,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Analytics</h1>
        <p className="text-secondary font-medium text-sm sm:text-base">Aggregate Marketing Intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-success/10 text-success w-fit mb-4 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Delivery Rate</h3>
            <p className="text-2xl sm:text-3xl font-black truncate">{deliveryRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-accent/10 text-accent w-fit mb-4 shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Open Rate</h3>
            <p className="text-2xl sm:text-3xl font-black truncate">{openRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-warning/10 text-amber-500 w-fit mb-4 shrink-0">
            <MousePointer2 size={24} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">CTR</h3>
            <p className="text-2xl sm:text-3xl font-black truncate">{ctr.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-success/10 text-success w-fit mb-4 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Revenue</h3>
            <p className="text-2xl sm:text-3xl font-black truncate">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Performance Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm min-w-0 overflow-hidden">
          <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 truncate">Engagement Trend</h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="openRate" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm min-w-0 overflow-hidden">
          <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 truncate">Channel Performance</h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={Math.min(50, 150 / channelData.length)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

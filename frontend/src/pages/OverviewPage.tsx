import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, Wallet, Send, 
  TrendingUp, AlertCircle, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getBrandAnalytics, getCampaigns } from '../services/brandService';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const KPICard = ({ title, value, icon: Icon, description }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-2xl bg-card-bg text-accent">
        <Icon size={24} />
      </div>
      <div className="text-xs font-black text-success bg-success/10 px-2 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
        <TrendingUp size={12} /> +12%
      </div>
    </div>
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary mb-1">{title}</h3>
    <p className="text-3xl font-black">{value}</p>
    <p className="text-xs text-secondary mt-2">{description}</p>
  </div>
);

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
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
        const [analyticsRes, campaignsRes] = await Promise.all([
          getBrandAnalytics(brandId),
          getCampaigns(brandId)
        ]);
        setData(analyticsRes.data);
        setCampaigns(campaignsRes.data || []);
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

  const { summary, distributions } = data || {};

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Overview</h1>
          <p className="text-secondary font-medium">Business Health & Intelligence Dashboard</p>
        </div>
        <div className="bg-white border border-border px-4 py-2 rounded-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Live Engine</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Customers" 
          value={summary?.total_customers?.toLocaleString() || '0'} 
          icon={Users}
          description="Unique customer base size"
        />
        <KPICard 
          title="Total Revenue" 
          value={`$${summary?.total_revenue?.toLocaleString() || '0'}`} 
          icon={DollarSign}
          description="Aggregate lifetime value"
        />
        <KPICard 
          title="Avg Customer Spend" 
          value={`$${Math.round(summary?.avg_order_value || 0)}`} 
          icon={Wallet}
          description="Average spend per transaction"
        />
        <KPICard 
          title="Campaigns Created" 
          value={campaigns.length} 
          icon={Send}
          description="Active and completed strategies"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Distribution */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest">Revenue Distribution</h3>
            <span className="text-[10px] font-bold text-secondary uppercase bg-card-bg px-2 py-1 rounded-md">By Lifetime Value</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions?.lifetime_value || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#525252' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#525252' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-accent text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <Sparkles className="absolute -top-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">AI Insights</span>
            </div>
            <h3 className="text-2xl font-black mb-4 leading-tight">
              {summary?.ai_narrative?.split('.')[0]}.
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              {summary?.ai_narrative?.split('.').slice(1).join('.')}
            </p>
          </div>
          <button 
            onClick={() => navigate('/workspace/strategist')}
            className="w-full bg-white text-accent py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg"
          >
            Ask AI Strategist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loyalty Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8">Loyalty Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributions?.loyalty_score || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="label"
                >
                  {(distributions?.loyalty_score || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8">Churn Risk Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributions?.churn_risk || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="label"
                >
                  {(distributions?.churn_risk || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest">Recent Campaigns</h3>
          <button 
            onClick={() => navigate('/workspace/campaigns')}
            className="text-xs font-black text-accent uppercase tracking-widest hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-card-bg/50 border-b border-border">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Campaign</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.slice(0, 5).map((campaign) => (
                <tr key={campaign.id} className="hover:bg-card-bg/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-sm">{campaign.name}</p>
                    <p className="text-xs text-secondary italic">Launched via {campaign.channel}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      campaign.status === 'RUNNING' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 w-32 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${Math.min(100, (campaign.delivered / (campaign.audience_size || 1)) * 100)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold">{Math.round((campaign.delivered / (campaign.audience_size || 1)) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center">
                    <div className="flex flex-col items-center text-secondary">
                      <AlertCircle size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium uppercase tracking-widest opacity-50">No campaigns launched yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

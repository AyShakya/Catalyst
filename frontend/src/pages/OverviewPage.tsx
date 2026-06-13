import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, Wallet, Send, 
  TrendingUp, AlertCircle, Sparkles,
  ArrowRight, ShieldAlert, Zap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBrandAnalytics, 
  getCampaigns, 
  getOpportunityFeed, 
  getExecutiveBrief 
} from '../services/brandService';

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
    <p className="text-xs text-secondary mt-2 font-medium">{description}</p>
  </div>
);

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [executiveBrief, setExecutiveBrief] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) {
      navigate('/setup');
      return;
    }

    const fetchData = async () => {
      try {
        const [analyticsRes, campaignsRes, oppsRes, briefRes] = await Promise.all([
          getBrandAnalytics(brandId),
          getCampaigns(brandId),
          getOpportunityFeed(brandId),
          getExecutiveBrief(brandId)
        ]);
        setData(analyticsRes.data);
        setCampaigns(campaignsRes.data || []);
        setOpportunities(oppsRes.data || []);
        setExecutiveBrief(briefRes.data || '');
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
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Business Health</h1>
          <p className="text-secondary font-medium">Catalyst Intelligence Interface</p>
        </div>
        <div className="bg-white border border-border px-4 py-2 rounded-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Active Intelligence Layer</span>
        </div>
      </div>

      {/* V2: Weekly Executive Brief */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden"
      >
        <Sparkles className="absolute -top-4 -right-4 w-48 h-48 opacity-10 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Zap size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Executive Summary</span>
          </div>
          <p className="text-2xl font-bold leading-relaxed max-w-4xl">
            {executiveBrief || "Analyzing your business performance to generate insights..."}
          </p>
        </div>
      </motion.div>

      {/* V2: Opportunity Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Growth Opportunities</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {opportunities.map((opp, i) => (
              <motion.div 
                key={opp.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between group hover:border-accent transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      opp.severity === 'CRITICAL' ? 'bg-error/10 text-error' : 
                      opp.severity === 'HIGH' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
                    }`}>
                      {opp.severity} Impact
                    </span>
                    <ShieldAlert size={16} className="text-border group-hover:text-accent transition-colors" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-2 leading-snug">{opp.title}</h4>
                  <p className="text-xs text-secondary font-medium leading-relaxed mb-6">{opp.description}</p>
                </div>
                <button 
                  onClick={() => navigate(`/workspace/strategist?prompt=${encodeURIComponent(opp.title)}`)}
                  className="flex items-center justify-between w-full p-4 bg-card-bg rounded-2xl group-hover:bg-accent group-hover:text-white transition-all"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Execute Strategy</span>
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
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
          title="Campaign Success" 
          value={`${campaigns.length > 0 ? '84%' : '0%'}`} 
          icon={Send}
          description="Performance efficiency"
        />
      </div>

      {/* Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-border shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Revenue Distribution</h3>
            <span className="text-[10px] font-bold text-secondary uppercase bg-card-bg px-3 py-1 rounded-lg">LTV Segmentation</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions?.lifetime_value || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#525252' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#525252' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-8">Loyalty DNA</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributions?.loyalty_score || []}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={8} dataKey="count"
                  >
                    {(distributions?.loyalty_score || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-foreground text-white p-8 rounded-[32px] shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">Retention Pulse</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-60">High Risk</span>
                <span className="text-sm font-black text-error">12.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-60">Healthy</span>
                <span className="text-sm font-black text-success">68.2%</span>
              </div>
              <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center group cursor-pointer" onClick={() => navigate('/workspace/strategist?prompt=Improve+customer+retention')}>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Optimize Retention</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

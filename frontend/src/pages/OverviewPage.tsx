import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, Wallet, Send, 
  TrendingUp, AlertCircle, Sparkles,
  ArrowRight, ShieldAlert, Zap, ChevronRight,
  LucideIcon, Target, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBrandAnalytics, 
  getCampaigns, 
  getOpportunityFeed, 
  getExecutiveBrief,
  getHealthMatrix,
  getValuePyramid
} from '../services/brandService';
import { 
  Skeleton, KPICardSkeleton, ChartSkeleton, OpportunitySkeleton, 
  MatrixSkeleton, DonutSkeleton, PyramidSkeleton 
} from '../components/layout/Skeleton';
import { BrandAnalytics, GrowthOpportunity, HealthMatrixPoint, ValuePyramidTier } from '../types/intelligence';
import { Campaign } from '../types/campaign';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/numberFormatters';

// Lazy load heavy charts
const CustomerHealthMatrix = React.lazy(() => import('../components/charts/CustomerHealthMatrix'));
const RevenueDonut = React.lazy(() => import('../components/charts/RevenueDonut'));
const ValuePyramid = React.lazy(() => import('../components/charts/ValuePyramid'));

const KPICard = ({ title, value, icon: Icon, description, detail }: { title: string; value: string; icon: LucideIcon; description: string; detail?: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-border shadow-sm group hover:border-accent transition-all relative overflow-hidden">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 rounded-2xl bg-card-bg text-accent group-hover:bg-accent group-hover:text-white transition-colors">
        <Icon size={24} />
      </div>
      <div className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
        <TrendingUp size={12} /> +12%
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-1">{title}</h3>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-[11px] text-secondary mt-2 font-medium">{description}</p>
      {detail && <div className="mt-3 pt-3 border-t border-border/50 text-[10px] font-bold text-accent uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">{detail}</div>}
    </div>
    <Icon className="absolute -bottom-6 -right-6 w-24 h-24 text-secondary/5 group-hover:text-accent/5 transition-colors" />
  </div>
);

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BrandAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [executiveBrief, setExecutiveBrief] = useState<string>('');
  const [healthMatrix, setHealthMatrix] = useState<HealthMatrixPoint[]>([]);
  const [valuePyramid, setValuePyramid] = useState<ValuePyramidTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) {
      navigate('/setup');
      return;
    }

    const fetchData = async () => {
      try {
        const [analyticsRes, campaignsRes, oppsRes, briefRes, healthRes, pyramidRes] = await Promise.all([
          getBrandAnalytics(brandId),
          getCampaigns(brandId),
          getOpportunityFeed(brandId),
          getExecutiveBrief(brandId),
          getHealthMatrix(brandId),
          getValuePyramid(brandId)
        ]);
        setData(analyticsRes.data);
        setCampaigns(campaignsRes.data || []);
        setOpportunities(oppsRes.data || []);
        setExecutiveBrief(briefRes.data?.brief || '');
        setHealthMatrix(healthRes.data || []);
        setValuePyramid(pyramidRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const { summary, distributions } = data || {};

  return (
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Business Health</h1>
          <p className="text-secondary font-medium text-sm sm:text-base">Catalyst Intelligence Interface</p>
        </div>
        <div className="bg-transparent border border-border px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success animate-pulse shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Active Intel Layer</span>
        </div>
      </div>

      {/* V2: Weekly Executive Brief */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent text-white p-6 sm:p-8 rounded-3xl sm:rounded-[40px] shadow-xl relative overflow-hidden group min-h-[140px]"
      >
        <Sparkles className="absolute -top-10 -right-10 sm:-top-4 sm:-right-4 w-32 h-32 sm:w-48 sm:h-48 opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-45" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shrink-0">
              <Zap size={20} />
            </div>
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.3em]">Executive Summary</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="bg-white/20 h-6 w-3/4" />
              <Skeleton className="bg-white/20 h-6 w-1/2" />
            </div>
          ) : (
            <p className="text-sm sm:text-base lg:text-lg font-semibold leading-relaxed max-w-4xl break-words">
              {executiveBrief || "Analyzing your business performance to generate insights..."}
            </p>
          )}
        </div>
      </motion.div>

      {/* V2: Opportunity Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] sm:text-[10px] font-black text-secondary uppercase tracking-[0.3em] shrink-0">Growth Opportunities</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {loading ? (
            <>
              <OpportunitySkeleton />
              <OpportunitySkeleton />
              <OpportunitySkeleton />
            </>
          ) : (
            <AnimatePresence>
              {opportunities.map((opp, i) => (
                <motion.div 
                  key={opp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between group hover:border-accent hover:shadow-lg transition-all min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0 ${
                        opp.severity === 'CRITICAL' ? 'bg-error/10 text-error' : 
                        opp.severity === 'HIGH' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
                      }`}>
                        {opp.severity} Impact
                      </span>
                      <ShieldAlert size={16} className="text-border group-hover:text-accent transition-colors shrink-0" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight mb-2 leading-snug break-words line-clamp-2">{opp.title}</h4>
                    <p className="text-[11px] sm:text-xs text-secondary font-medium leading-relaxed mb-6 break-words line-clamp-3">{opp.description}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/workspace/strategist?prompt=${encodeURIComponent(opp.title)}`)}
                    className="flex items-center justify-between w-full p-3.5 sm:p-4 bg-card-bg rounded-2xl group-hover:bg-accent group-hover:text-white transition-all shrink-0"
                  >
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Execute Strategy</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {loading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <KPICard 
              title="Total Customers" 
              value={formatNumber(summary?.total_customers, { compact: true })} 
              icon={Users}
              description="Unique customer base size"
              detail={`Avg ${formatNumber(summary?.avg_orders_per_customer, { decimals: 1 })} orders / user`}
            />
            <KPICard 
              title="Total Revenue" 
              value={formatCurrency(summary?.total_revenue, { compact: true })} 
              icon={DollarSign}
              description="Aggregate lifetime value"
              detail={`${formatCurrency(summary?.median_spend)} median spend`}
            />
            <KPICard 
              title="Avg Customer Spend" 
              value={formatCurrency(summary?.avg_order_value)} 
              icon={Wallet}
              description="Average spend per transaction"
              detail={`${formatCurrency(summary?.p90_spend)} top 10% threshold`}
            />
            <KPICard 
              title="Brand Health" 
              value={formatPercent(100 - (summary?.avg_churn_score || 0), 0)} 
              icon={Target}
              description="Overall retention stability"
              detail={`${Math.round(summary?.avg_loyalty_score || 0)}/100 loyalty index`}
            />
          </>
        )}
      </div>

      {/* Primary Analytics Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Customer Health Matrix */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <Skeleton variant="text" className="w-48" />
                <div className="flex gap-2">
                  <Skeleton className="w-12 h-6" />
                  <Skeleton className="w-12 h-6" />
                </div>
              </div>
              <MatrixSkeleton />
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                    <Target size={14} className="text-accent" /> Customer Health Matrix
                  </h3>
                  <p className="text-[10px] text-secondary font-bold uppercase mt-1">Loyalty vs Churn Risk Analysis</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-card-bg px-2 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-secondary">VIP</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-card-bg px-2 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-error" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-secondary">At Risk</span>
                  </div>
                </div>
              </div>
              <div className="h-80 sm:h-96 w-full">
                <React.Suspense fallback={<MatrixSkeleton />}>
                  <CustomerHealthMatrix data={healthMatrix} />
                </React.Suspense>
              </div>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-transparent rounded-2xl border border-border/50">
                  <span className="text-[8px] font-black text-secondary uppercase block mb-1">Avg Loyalty</span>
                  <span className="text-sm font-black">{Math.round(summary?.avg_loyalty_score || 0)}/100</span>
                </div>
                <div className="p-3 bg-transparent rounded-2xl border border-border/50">
                  <span className="text-[8px] font-black text-secondary uppercase block mb-1">Avg Churn</span>
                  <span className="text-sm font-black">{formatPercent(summary?.avg_churn_score, 0)}</span>
                </div>
                <div className="p-3 bg-transparent rounded-2xl border border-border/50">
                  <span className="text-[8px] font-black text-secondary uppercase block mb-1">Inactive Interval</span>
                  <span className="text-sm font-black">{Math.round(summary?.avg_days_since_purchase || 0)} days</span>
                </div>
                <div className="p-3 bg-transparent rounded-2xl border border-border/50">
                  <span className="text-[8px] font-black text-secondary uppercase block mb-1">Max LTV</span>
                  <span className="text-sm font-black text-accent">{formatCurrency(summary?.p95_spend, { compact: true })}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Donut */}
        <div className="space-y-6 lg:space-y-8">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-border shadow-sm h-full flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2 mb-8">
                <DollarSign size={14} className="text-accent" /> Revenue DNA
              </h3>
              <div className="flex-1 min-h-[300px]">
                <React.Suspense fallback={<DonutSkeleton />}>
                  <RevenueDonut data={distributions?.total_spend || []} />
                </React.Suspense>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Analytics Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Value Pyramid */}
        <div className="lg:col-span-1">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-border shadow-sm h-full flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2 mb-6">
                <TrendingUp size={14} className="text-accent" /> Spend Benchmarks
              </h3>
              <div className="flex-1 flex items-center">
                <React.Suspense fallback={<PyramidSkeleton />}>
                  <ValuePyramid data={valuePyramid} />
                </React.Suspense>
              </div>
              <p className="text-[10px] text-secondary font-medium italic mt-6 leading-relaxed">
                Percentile distribution of customer lifetime value across your entire database.
              </p>
            </div>
          )}
        </div>

        {/* Opportunity Feed / Activity Charts */}
        <div className="lg:col-span-2">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-border shadow-sm h-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                  <BarChart3 size={14} className="text-accent" /> Recency Distribution
                </h3>
                <span className="text-[9px] font-black text-secondary uppercase bg-card-bg px-2 py-1 rounded-lg">Days since last purchase</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributions?.days_since_last_purchase || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default OverviewPage;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Target, Users, MessageSquare, 
  BarChart3, Send, CheckCircle2, Clock, Map, Play, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampaignDetails, getCampaignMetrics, getCampaignMilestones } from '../services/brandService';
import { 
  Skeleton, FunnelSkeleton, ComparisonSkeleton, 
  OpportunitySkeleton 
} from '../components/layout/Skeleton';
import { formatNumber, formatCurrency, formatPercent } from '../utils/numberFormatters';

// import CampaignFunnel from '../components/charts/CampaignFunnel';
// import ForecastComparison from '../components/charts/ForecastComparison';

const CampaignFunnel = React.lazy(() => import('../components/charts/CampaignFunnel'));
const ForecastComparison = React.lazy(() => import('../components/charts/ForecastComparison'));

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const [campRes, metRes, milRes] = await Promise.all([
          getCampaignDetails(id),
          getCampaignMetrics(id).catch(() => ({ data: {} })),
          getCampaignMilestones(id).catch(() => ({ data: [] }))
        ]);
        setCampaign(campRes.data);
        setMetrics(metRes.data || {});
        setMilestones(milRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-4" />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div className="space-y-2">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-64 h-10" />
          </div>
          <Skeleton className="w-32 h-10 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <Skeleton className="w-40 h-6" />
              <div className="space-y-4">
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-24" />
                <Skeleton className="w-full h-16 rounded-2xl" />
              </div>
            </div>
            <div className="bg-white p-10 rounded-[48px] border border-border shadow-sm space-y-8">
              <Skeleton className="w-48 h-6" />
              <FunnelSkeleton />
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <Skeleton className="w-32 h-6" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
            <div className="bg-foreground p-8 rounded-3xl shadow-xl space-y-8">
              <Skeleton className="bg-white/10 w-40 h-6" />
              <div className="space-y-6">
                <Skeleton className="bg-white/10 h-12" />
                <Skeleton className="bg-white/10 h-12" />
                <Skeleton className="bg-white/10 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black uppercase mb-4">Campaign Not Found</h2>
        <button onClick={() => navigate('/workspace/campaigns')} className="px-6 py-3 rounded-xl bg-accent text-white font-black text-xs uppercase tracking-widest">Back to Campaigns</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 bg-transparent">
      <button 
        onClick={() => navigate('/workspace/campaigns')}
        className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-black text-[10px] uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2 block">Campaign Intelligence</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none break-words">{campaign.campaign_name || campaign.name}</h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
          campaign.status === 'RUNNING' ? 'border-success/20 bg-success/5 text-success' : 'border-border bg-card-bg text-secondary'
        } w-fit`}>
          {campaign.status === 'RUNNING' ? <Clock size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
          <span className="text-xs font-black uppercase tracking-widest">{campaign.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Goal & Strategy */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Strategy Blueprint</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Original Goal</label>
                <p className="text-lg font-bold">"{campaign.goal || campaign.campaign_prompt || "Drive repeat purchases for VIP customers."}"</p>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">AI Reasoning</label>
                <p className="text-secondary leading-relaxed font-medium">
                  {campaign.reasoning || "The AI strategist identified this segment based on decaying engagement signals. The messaging is optimized for urgency while maintaining brand premiumness."}
                </p>
              </div>

              <div className="p-6 bg-card-bg rounded-2xl border border-border border-dashed">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-3">Generated Message ({campaign.channel})</label>
                <p className="text-sm font-bold italic text-foreground">
                  "{campaign.message_template}"
                </p>
              </div>
            </div>
          </div>

          {/* AI Strategy Milestones */}
          {milestones.length > 0 && (
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                  <Map size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Strategy Evolution</h3>
              </div>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {milestones.map((milestone, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-accent text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="text-[10px] font-black">v{milestone.version}</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] bg-card-bg p-4 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">Iteration {i + 1}</span>
                        <span className="text-[10px] font-medium text-secondary">{new Date(milestone.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground">{milestone.change_summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Funnel */}
          <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-border shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={18} className="text-accent" /> Conversion Journey
              </h3>
              <div className="text-[10px] font-bold text-secondary uppercase bg-card-bg px-3 py-1 rounded-lg">Real-time Performance</div>
            </div>
            <React.Suspense fallback={<FunnelSkeleton />}>
              <CampaignFunnel 
                sent={campaign.audience_size}
                delivered={metrics?.total_delivered || 0}
                opened={metrics?.total_opened || 0}
                clicked={metrics?.total_clicked || 0}
                purchased={metrics?.total_purchased || 0}
              />
            </React.Suspense>
          </div>

          {/* Forecast vs Actual */}
          <div className="bg-white p-6 sm:p-10 rounded-[32px] border border-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap size={18} className="text-accent" /> AI Modeling Precision
                </h3>
                <p className="text-[10px] text-secondary font-bold uppercase mt-1">Forecast vs Real-world Result</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <React.Suspense fallback={<ComparisonSkeleton />}>
                <ForecastComparison 
                  forecast={{
                    delivered: campaign.forecast_delivered || 0,
                    opened: campaign.forecast_opened || 0,
                    clicked: campaign.forecast_clicked || 0,
                    conversions: campaign.forecast_purchased || 0
                  }}
                  actual={{
                    delivered: metrics?.total_delivered || 0,
                    opened: metrics?.total_opened || 0,
                    clicked: metrics?.total_clicked || 0,
                    conversions: metrics?.total_purchased || 0
                  }}
                />
              </React.Suspense>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Audience Metrics */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-success/10 text-success rounded-lg">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Audience Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card-bg rounded-2xl">
                <span className="text-[10px] font-black text-secondary uppercase block mb-1">Target Size</span>
                <span className="text-lg font-black">{formatNumber(campaign.audience_size, { compact: true })}</span>
              </div>
              <div className="p-4 bg-card-bg rounded-2xl">
                <span className="text-[10px] font-black text-secondary uppercase block mb-1">Forecast Conv.</span>
                <span className="text-lg font-black text-success">{formatNumber(campaign.forecast_purchased, { compact: true })}</span>
              </div>
            </div>
          </div>

          {/* Core KPIs */}
          <div className="bg-foreground text-white p-5 sm:p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/10 text-white rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Success Metrics</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-xs font-medium text-white/40 uppercase">Delivery Rate</span>
                <span className="text-2xl font-black">{formatPercent(metrics?.delivery_rate * 100)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-xs font-medium text-white/40 uppercase">Open Rate</span>
                <span className="text-2xl font-black">{formatPercent(metrics?.open_rate * 100)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-xs font-medium text-white/40 uppercase">Conversion Rate</span>
                <span className="text-2xl font-black">{formatPercent(metrics?.conversion_rate * 100)}</span>
              </div>
              <div className="pt-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Revenue Generated</span>
                <span className="text-3xl sm:text-4xl font-black text-success break-words">{formatCurrency(metrics?.revenue_generated, { compact: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsPage;

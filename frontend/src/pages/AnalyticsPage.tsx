import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, 
  TrendingUp, MousePointer2, Mail, CheckCircle2,
  Loader2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampaigns, getMetricsJobHistory, getMetricsJobStatus } from '../services/brandService';
import { useToast } from '../context/ToastContext';
import { Skeleton, KPICardSkeleton, ChartSkeleton, ErrorRetryPanel } from '../components/layout/Skeleton';
import { Campaign } from '../types/campaign';
import { formatNumber, formatCurrency, formatPercent } from '../utils/numberFormatters';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { brandId: routeBrandId } = useParams();
  const { activeBrand } = useWorkspace();
  const brandId = routeBrandId || activeBrand?.id;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<any>(null);
  const [mountTrend, setMountTrend] = useState(false);
  const [mountChannel, setMountChannel] = useState(false);

  const { showToast } = useToast();

  const fetchData = React.useCallback(async (showFullLoading = true) => {
    if (!brandId) return;
    if (showFullLoading || campaigns.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
      const [campaignsRes, historyRes] = await Promise.all([
        getCampaigns(brandId),
        getMetricsJobHistory(brandId, 1),
        delayPromise
      ]);
      setCampaigns(campaignsRes.data || []);

      const latestJob = historyRes.data?.[0];
      if (latestJob && (latestJob.status === 'RUNNING' || latestJob.status === 'PENDING')) {
        setRunningJob(latestJob);
      } else {
        setRunningJob(null);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to fetch analytics intelligence.";
      if (campaigns.length === 0) {
        setError(msg);
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [brandId, campaigns.length, showToast]);

  useEffect(() => {
    fetchData(true);
  }, [brandId]);

  useEffect(() => {
    if (!runningJob) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await getMetricsJobStatus(runningJob.id);
        const job = res.data;
        if (job) {
          if (job.status === 'COMPLETED') {
            clearInterval(intervalId);
            showToast('Workspace Intelligence recalculation completed successfully.', 'success');
            fetchData(false);
          } else if (job.status === 'FAILED') {
            clearInterval(intervalId);
            showToast(`Recalculation failed: ${job.error_message || 'Unknown queue error'}`, 'error');
            setRunningJob(null);
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [runningJob, fetchData, showToast]);


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

  const getProgressMessage = (progress: number) => {
    if (!progress || progress <= 10) return "Initializing database metrics calculations...";
    if (progress <= 30) return "Phase 1: Compiling unified customer lifetime value database...";
    if (progress <= 50) return "Phase 2: Recalculating workspace transaction metrics...";
    if (progress <= 70) return "Phase 3: Building frequency & spend cohort distributions...";
    if (progress <= 90) return "Phase 4: Running predictive clustering and customer segment indexing...";
    return "Workspace updated successfully. Appending new metrics...";
  };

  const showSkeletons = loading && campaigns.length === 0;

  useEffect(() => {
    if (!showSkeletons) {
      setMountTrend(true);
      const timer = setTimeout(() => setMountChannel(true), 350);
      return () => clearTimeout(timer);
    } else {
      setMountTrend(false);
      setMountChannel(false);
    }
  }, [showSkeletons]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Analytics</h1>
        <p className="text-secondary font-medium text-sm sm:text-base">Aggregate Marketing Intelligence</p>
      </div>

      {/* Background Job Progress Banner */}
      <AnimatePresence>
        {runningJob && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-accent/5 border border-accent/25 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-accent/10 p-2 rounded-xl text-accent shrink-0 animate-pulse">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase tracking-wider text-accent">Generating Workspace Intelligence</h4>
                  <p className="text-[10px] sm:text-xs text-secondary font-semibold mt-0.5 truncate">
                    A background database queue task is running to compile full customer metrics.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 bg-accent/15 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-accent animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Processing
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && campaigns.length === 0 ? (
        <ErrorRetryPanel onRetry={() => fetchData(true)} message={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {showSkeletons ? (
              <>
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-success/10 text-success w-fit mb-4 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Delivery Rate</h3>
                    <p className="text-2xl sm:text-3xl font-black truncate">{formatPercent(deliveryRate)}</p>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-accent/10 text-accent w-fit mb-4 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Open Rate</h3>
                    <p className="text-2xl sm:text-3xl font-black truncate">{formatPercent(openRate)}</p>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-warning/10 text-amber-500 w-fit mb-4 shrink-0">
                    <MousePointer2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">CTR</h3>
                    <p className="text-2xl sm:text-3xl font-black truncate">{formatPercent(ctr)}</p>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm min-w-0 flex flex-col justify-between">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-success/10 text-success w-fit mb-4 shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary mb-1 truncate">Revenue</h3>
                    <p className="text-2xl sm:text-3xl font-black truncate">{formatCurrency(totalRevenue, { compact: true })}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Performance Trend */}
            <div className="min-w-0">
              {showSkeletons ? (
                <ChartSkeleton />
              ) : (
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
                        <Line type="monotone" dataKey="openRate" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} isAnimationActive={campaigns.length < 100} animationDuration={1500} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} isAnimationActive={campaigns.length < 100} animationDuration={1500} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Channel Performance */}
            <div className="min-w-0">
              {showSkeletons ? (
                <ChartSkeleton />
              ) : (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm min-w-0 overflow-hidden">
                  <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 truncate">Channel Performance</h3>
                  <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={channelData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                        <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={Math.min(50, 150 / channelData.length)} isAnimationActive={campaigns.length < 100} animationDuration={1500} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Real-time Progress Lock Screen Overlay */}
      {runningJob && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl border border-border shadow-2xl max-w-md w-full text-center space-y-6 mx-4">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Animated progress circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="text-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="text-accent transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * (runningJob.records_processed || 0)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black">{runningJob.records_processed || 0}%</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Progress</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight">Compiling Workspace Data</h3>
              <p className="text-xs font-semibold text-secondary min-h-[32px] px-4">
                {getProgressMessage(runningJob.records_processed)}
              </p>
            </div>

            <div className="w-full bg-card-bg h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500" 
                style={{ width: `${runningJob.records_processed || 0}%` }}
              />
            </div>

            <div className="flex gap-2 items-center justify-center bg-accent/5 p-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-accent animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing Ingestion Queue
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;


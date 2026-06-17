import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, Wallet, Send, 
  TrendingUp, AlertCircle, Sparkles,
  ArrowRight, ShieldAlert, Zap, ChevronRight,
  LucideIcon, Target, BarChart3, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBrandAnalytics, 
  getCampaigns, 
  getOpportunityFeed, 
  getExecutiveBrief,
  getHealthMatrix,
  getValuePyramid,
  getMetricsJobHistory,
  getMetricsJobStatus,
  triggerMetricsRebuild,
  uploadData
} from '../services/brandService';
import { fileToBase64 } from '../utils/fileUtils';
import { useToast } from '../context/ToastContext';
import { 
  Skeleton, KPICardSkeleton, ChartSkeleton, OpportunitySkeleton, 
  MatrixSkeleton, DonutSkeleton, PyramidSkeleton, ErrorRetryPanel 
} from '../components/layout/Skeleton';
import { BrandAnalytics, GrowthOpportunity, HealthMatrixPoint, ValuePyramidTier } from '../types/intelligence';
import { Campaign } from '../types/campaign';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/numberFormatters';

// Lazy load heavy charts
const CustomerHealthMatrix = React.lazy(() => import('../components/charts/CustomerHealthMatrix'));
const RevenueDonut = React.lazy(() => import('../components/charts/RevenueDonut'));
const ValuePyramid = React.lazy(() => import('../components/charts/ValuePyramid'));

const formatBriefText = (text: string) => {
  if (!text) return null;

  const lines = text.split(/\n+/).filter(line => line.trim() !== '');

  return lines.map((line, i) => {
    const trimmed = line.trim();
    
    // Check if the line starts with a numbered/bullet item: e.g. "1)", "1.", "- ", "* ", "• "
    const match = trimmed.match(/^(\d+[\.\)]|[\-\*•])\s*(.*)/);
    
    if (match) {
      const marker = match[1];
      const content = match[2];
      const isNumber = /^\d+/.test(marker);
      return (
        <div key={i} className="flex gap-2.5 items-start pl-2 sm:pl-4 mt-2">
          <span className={`${
            isNumber 
              ? 'font-black text-white/80 text-[10px] sm:text-xs bg-white/20 px-1.5 py-0.5 rounded-md min-w-[20px] text-center shrink-0' 
              : 'w-1.5 h-1.5 rounded-full bg-white/60 mt-2.5 shrink-0'
          }`}>
            {isNumber ? marker.replace(/[\.\)]/, '') : null}
          </span>
          <span className="text-sm sm:text-base font-semibold leading-relaxed text-white/95">
            {content}
          </span>
        </div>
      );
    }
    
    // Otherwise, check if the single line contains inline numbering like:
    // "Some intro. 1) Point one. 2) Point two."
    const parts = trimmed.split(/\b(\d+[\.\)])\s+/);
    if (parts.length > 1) {
      const formattedElements: React.ReactNode[] = [];
      let currentText = parts[0].trim();
      if (currentText) {
        formattedElements.push(
          <p key="intro" className="text-sm sm:text-base lg:text-lg font-semibold leading-relaxed mb-3">
            {currentText}
          </p>
        );
      }
      for (let j = 1; j < parts.length; j += 2) {
        const marker = parts[j];
        const content = parts[j + 1]?.trim() || '';
        const isNumber = /^\d+/.test(marker);
        formattedElements.push(
          <div key={j} className="flex gap-2.5 items-start pl-2 sm:pl-4 mt-3">
            <span className={`${
              isNumber 
                ? 'font-black text-white/80 text-[10px] sm:text-xs bg-white/20 px-1.5 py-0.5 rounded-md min-w-[20px] text-center shrink-0' 
                : 'w-1.5 h-1.5 rounded-full bg-white/60 mt-2.5 shrink-0'
            }`}>
              {isNumber ? marker.replace(/[\.\)]/, '') : null}
            </span>
            <span className="text-sm sm:text-base font-semibold leading-relaxed text-white/90">
              {content}
            </span>
          </div>
        );
      }
      return <div key={i} className="space-y-1">{formattedElements}</div>;
    }

    // Standard paragraph
    return (
      <p key={i} className="text-sm sm:text-base lg:text-lg font-semibold leading-relaxed max-w-4xl break-words mb-3 last:mb-0">
        {trimmed}
      </p>
    );
  });
};

const KPICard = ({ title, value, icon: Icon, description, detail }: { title: string; value: string; icon: LucideIcon; description: string; detail?: string }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.015 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="bg-white p-6 rounded-3xl border border-border shadow-sm group hover:border-accent hover:shadow-md transition-colors relative overflow-hidden cursor-pointer"
  >
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
  </motion.div>
);

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { brandId: routeBrandId } = useParams();
  const { activeBrand } = useWorkspace();
  const brandId = routeBrandId || activeBrand?.id;

  const [data, setData] = useState<BrandAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [executiveBrief, setExecutiveBrief] = useState<string>('');
  const [healthMatrix, setHealthMatrix] = useState<HealthMatrixPoint[]>([]);
  const [valuePyramid, setValuePyramid] = useState<ValuePyramidTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<any>(null);

  // States for Ingestion Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [customerUploadFile, setCustomerUploadFile] = useState<File | null>(null);
  const [orderUploadFile, setOrderUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { showToast } = useToast();

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) return;
    if (!customerUploadFile && !orderUploadFile) {
      showToast('Please select at least one CSV file to upload.', 'error');
      return;
    }

    setUploading(true);
    try {
      showToast('Reading file data...', 'success');
      
      let customerBase64 = undefined;
      let orderBase64 = undefined;
      
      if (customerUploadFile) {
        customerBase64 = await fileToBase64(customerUploadFile);
      }
      if (orderUploadFile) {
        orderBase64 = await fileToBase64(orderUploadFile);
      }

      showToast('Ingesting data into database queue...', 'success');
      const uploadRes = await uploadData(brandId, customerBase64, orderBase64);
      
      if (uploadRes.status === 'success') {
        const jobId = uploadRes.data?.metrics?.job_id;
        if (jobId) {
          setRunningJob({ id: jobId, status: 'PENDING', records_processed: 0 });
          setShowUploadModal(false);
          setCustomerUploadFile(null);
          setOrderUploadFile(null);
          showToast('Data uploaded. Metrics queue calculation triggered.', 'success');
        } else {
          showToast('Data uploaded but metrics generation reference was missing.', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || err.message || 'Failed to upload files.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const fetchData = React.useCallback(async (showFullLoading = true) => {
    if (!brandId) return;
    if (showFullLoading || !data || !data.summary) {
      setLoading(true);
    }
    setError(null);
    try {
      const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
      const [analyticsRes, campaignsRes, oppsRes, briefRes, healthRes, pyramidRes, historyRes] = await Promise.all([
        getBrandAnalytics(brandId),
        getCampaigns(brandId),
        getOpportunityFeed(brandId),
        getExecutiveBrief(brandId),
        getHealthMatrix(brandId),
        getValuePyramid(brandId),
        getMetricsJobHistory(brandId, 1),
        delayPromise
      ]);
      setData(analyticsRes.data);
      setCampaigns(campaignsRes.data || []);
      setOpportunities(oppsRes.data || []);
      setExecutiveBrief(briefRes.data?.brief || '');
      setHealthMatrix(healthRes.data || []);
      setValuePyramid(pyramidRes.data || []);

      const latestJob = historyRes.data?.[0];
      if (latestJob && (latestJob.status === 'RUNNING' || latestJob.status === 'PENDING')) {
        setRunningJob(latestJob);
      } else {
        setRunningJob(null);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to sync connection with Catalyst Intelligence.";
      if (!data || !data.summary) {
        setError(msg);
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [brandId, data, showToast]);

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

  const handleManualRebuild = async () => {
    if (!brandId) return;
    try {
      showToast('Queueing background database recalculation...', 'success');
      const res = await triggerMetricsRebuild(brandId);
      if (res.status === 'success' && res.data) {
        setRunningJob(res.data);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || err.message || "Failed to trigger metrics recalculation.", "error");
    }
  };

  const getProgressMessage = (progress: number) => {
    if (!progress || progress <= 10) return "Initializing database metrics calculations...";
    if (progress <= 30) return "Phase 1: Compiling unified customer lifetime value database...";
    if (progress <= 50) return "Phase 2: Recalculating workspace transaction metrics...";
    if (progress <= 70) return "Phase 3: Building frequency & spend cohort distributions...";
    if (progress <= 90) return "Phase 4: Running predictive clustering and customer segment indexing...";
    return "Workspace updated successfully. Appending new metrics...";
  };

  const { summary, distributions } = data || {};
  const showSkeletons = loading && (!data || !data.summary);

  if (!loading && (!data || !data.summary)) {
    return (
      <div className="space-y-6 sm:space-y-10 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Business Health</h1>
            <p className="text-secondary font-medium text-sm sm:text-base">Catalyst Intelligence Interface</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={runningJob !== null}
              className="bg-card-bg hover:bg-border disabled:bg-border text-primary border border-border px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm transition-colors text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ingest More Data</span>
            </button>
            <button
              onClick={handleManualRebuild}
              disabled={runningJob !== null}
              className="bg-accent hover:bg-accent/90 disabled:bg-border text-white disabled:text-secondary px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm transition-colors text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
            >
              {runningJob ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Queue</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Recalculate Intel</span>
                </>
              )}
            </button>
            <div className="bg-transparent border border-border px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${runningJob ? 'bg-amber-500 animate-pulse' : 'bg-success animate-pulse'} shrink-0`} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                {runningJob ? 'Queue Processing' : 'Active Intel Layer'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-border rounded-3xl space-y-6">
          <div className="p-4 bg-accent/10 rounded-full text-accent">
            <Zap size={32} className="animate-bounce" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-black uppercase">No Intelligence Data Found</h2>
            <p className="text-sm text-secondary font-semibold leading-relaxed">
              We couldn't find any pre-calculated workspace metrics for this brand. Ingest your customers or orders CSV files to calculate metrics.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={runningJob !== null}
            className="bg-accent hover:bg-accent/90 disabled:bg-border text-white disabled:text-secondary px-6 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-wider cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Ingest Brand Datasets</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Business Health</h1>
          <p className="text-secondary font-medium text-sm sm:text-base">Catalyst Intelligence Interface</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={runningJob !== null || loading}
            className="bg-card-bg hover:bg-border disabled:bg-border text-primary border border-border px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm transition-colors text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ingest More Data</span>
          </button>
          <button
            onClick={handleManualRebuild}
            disabled={runningJob !== null || loading}
            className="bg-accent hover:bg-accent/90 disabled:bg-border text-white disabled:text-secondary px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm transition-colors text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
          >
            {runningJob ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Queue</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Recalculate Intel</span>
              </>
            )}
          </button>
          
          <div className="bg-transparent border border-border px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-fit shrink-0 shadow-sm">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${runningJob ? 'bg-amber-500 animate-pulse' : 'bg-success animate-pulse'} shrink-0`} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              {runningJob ? 'Queue Processing' : 'Active Intel Layer'}
            </span>
          </div>
        </div>
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

      {error && (!data || !data.summary) ? (
        <ErrorRetryPanel onRetry={() => fetchData(true)} message={error} />
      ) : (
        <>
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
              {showSkeletons ? (
                <div className="space-y-3">
                  <Skeleton className="bg-white/20 h-6 w-3/4" />
                  <Skeleton className="bg-white/20 h-6 w-1/2" />
                </div>
              ) : (
                <div className="space-y-3 max-w-4xl">
                  {formatBriefText(executiveBrief) || (
                    <p className="text-sm sm:text-base lg:text-lg font-semibold leading-relaxed break-words">
                      Analyzing your business performance to generate insights...
                    </p>
                  )}
                </div>
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
              {showSkeletons ? (
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
                        className="flex items-center justify-between w-full p-3.5 sm:p-4 bg-card-bg rounded-2xl group-hover:bg-accent group-hover:text-white transition-all shrink-0 animate-colors"
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
            {showSkeletons ? (
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
              {showSkeletons ? (
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
              {showSkeletons ? (
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
              {showSkeletons ? (
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
              {showSkeletons ? (
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
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={!distributions || distributions.days_since_last_purchase?.length < 100} animationDuration={1500} animationEasing="ease-out" />
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

      {/* Ingestion Data Files Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-45 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowUploadModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-2xl max-w-lg w-full relative z-10 mx-4 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Ingest Workspace Data</h3>
                  <p className="text-xs text-secondary font-medium mt-1">Upload additional customer or order transaction logs.</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="text-secondary hover:text-primary font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                {/* Customers CSV Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary block">Customers Database CSV</label>
                  <div className="border border-dashed border-border rounded-2xl p-4 hover:border-accent transition-colors relative flex flex-col items-center justify-center text-center bg-card-bg">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCustomerUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-xs font-semibold text-secondary truncate max-w-xs px-2">
                      {customerUploadFile ? customerUploadFile.name : "Select customers.csv"}
                    </span>
                    <span className="text-[9px] font-bold text-secondary/60 uppercase mt-1">
                      {customerUploadFile ? `${(customerUploadFile.size / 1024).toFixed(1)} KB` : "Click to browse files"}
                    </span>
                  </div>
                </div>

                {/* Orders CSV Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary block">Orders Database CSV</label>
                  <div className="border border-dashed border-border rounded-2xl p-4 hover:border-accent transition-colors relative flex flex-col items-center justify-center text-center bg-card-bg">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setOrderUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-xs font-semibold text-secondary truncate max-w-xs px-2">
                      {orderUploadFile ? orderUploadFile.name : "Select orders.csv"}
                    </span>
                    <span className="text-[9px] font-bold text-secondary/60 uppercase mt-1">
                      {orderUploadFile ? `${(orderUploadFile.size / 1024).toFixed(1)} KB` : "Click to browse files"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || (!customerUploadFile && !orderUploadFile)}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-border text-white disabled:text-secondary py-3 rounded-2xl font-black uppercase text-xs tracking-wider cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Upload...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Upload & Ingest Dataset</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewPage;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Target, Users, MessageSquare, 
  BarChart3, Send, CheckCircle2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCampaignDetails } from '../services/brandService';

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const res = await getCampaignDetails(id);
        setCampaign(res.data);
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
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black uppercase mb-4">Campaign Not Found</h2>
        <button onClick={() => navigate('/workspace/campaigns')} className="btn btn-primary">Back to Campaigns</button>
      </div>
    );
  }

  const funnelSteps = [
    { label: 'Audience', value: campaign.audience_size, color: '#4f46e5' },
    { label: 'Delivered', value: campaign.delivered, color: '#6366f1' },
    { label: 'Opened', value: campaign.opened, color: '#818cf8' },
    { label: 'Clicked', value: campaign.clicked, color: '#a5b4fc' },
    { label: 'Conversions', value: campaign.conversions, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <button 
        onClick={() => navigate('/workspace/campaigns')}
        className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-black text-[10px] uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2 block">Campaign Intelligence</span>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{campaign.name}</h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
          campaign.status === 'RUNNING' ? 'border-success/20 bg-success/5 text-success' : 'border-border bg-card-bg text-secondary'
        }`}>
          {campaign.status === 'RUNNING' ? <Clock size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
          <span className="text-xs font-black uppercase tracking-widest">{campaign.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Goal & Strategy */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Strategy Blueprint</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Original Goal</label>
                <p className="text-lg font-bold">"{campaign.goal || "Drive repeat purchases for VIP customers."}"</p>
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

          {/* Performance Funnel */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest mb-10">Engagement Funnel</h3>
            <div className="space-y-4">
              {funnelSteps.map((step, i) => {
                const percentage = i === 0 ? 100 : (step.value / funnelSteps[0].value) * 100;
                return (
                  <div key={step.label} className="relative">
                    <div className="flex justify-between items-center mb-1 px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{step.label}</span>
                      <span className="text-xs font-black">{step.value?.toLocaleString()}</span>
                    </div>
                    <div className="h-10 w-full bg-card-bg rounded-xl overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full flex items-center px-4"
                        style={{ backgroundColor: step.color }}
                      >
                        <span className="text-[10px] font-black text-white">{Math.round(percentage)}%</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Audience Metrics */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-success/10 text-success rounded-lg">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Audience Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card-bg rounded-2xl">
                <span className="text-[10px] font-black text-secondary uppercase block mb-1">Target Size</span>
                <span className="text-lg font-black">{campaign.audience_size?.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-card-bg rounded-2xl">
                <span className="text-[10px] font-black text-secondary uppercase block mb-1">Conversions</span>
                <span className="text-lg font-black text-success">{campaign.conversions || 0}</span>
              </div>
            </div>
          </div>

          {/* Core KPIs */}
          <div className="bg-foreground text-white p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/10 text-white rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Success Metrics</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-xs font-medium text-white/40 uppercase">Conversion Rate</span>
                <span className="text-2xl font-black">{((campaign.conversions / (campaign.delivered || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-xs font-medium text-white/40 uppercase">Open Rate</span>
                <span className="text-2xl font-black">{((campaign.opened / (campaign.delivered || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="pt-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Revenue Generated</span>
                <span className="text-4xl font-black text-success">$4,250.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsPage;

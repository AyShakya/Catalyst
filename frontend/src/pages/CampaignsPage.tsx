import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Clock, CheckCircle2, ChevronRight, 
  BarChart3, Users, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCampaigns } from '../services/brandService';
import { CampaignCardSkeleton } from '../components/layout/Skeleton';

const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) {
      navigate('/setup');
      return;
    }

    const fetchCampaigns = async () => {
      try {
        const res = await getCampaigns(brandId);
        setCampaigns(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [navigate]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 sm:pb-20">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter truncate sm:whitespace-normal">Campaigns</h1>
          <p className="text-secondary font-medium text-sm sm:text-base">Strategy Performance & Management</p>
        </div>
        <button 
          onClick={() => navigate('/workspace/strategist')}
          className="bg-accent text-white px-5 sm:px-6 py-3.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center gap-2 w-full sm:w-auto justify-center shrink-0 shadow-lg shadow-accent/20"
        >
          New Strategy <Send size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-border rounded-[30px] sm:rounded-[40px] p-8 sm:p-20 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card-bg text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Send size={28} className="sm:size-32" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase mb-2">No campaigns yet</h2>
          <p className="text-secondary max-w-sm mx-auto mb-8 font-medium text-sm sm:text-base">
            Use the AI Strategist to architect and launch your first growth campaign.
          </p>
          <button 
            onClick={() => navigate('/workspace/strategist')}
            className="btn btn-primary px-8 w-full sm:w-auto"
          >
            Go to Strategist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => (
            <motion.div 
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/workspace/campaigns/${campaign.id}`)}
              className="bg-white border border-border rounded-3xl p-5 sm:p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all cursor-pointer group flex flex-col h-full min-w-0"
            >
              <div className="flex justify-between items-start mb-6 gap-2">
                <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${campaign.status === 'RUNNING' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                  <Send size={18} className="sm:size-20" />
                </div>
                <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${
                  campaign.status === 'RUNNING' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'
                }`}>
                  {campaign.status}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight mb-2 group-hover:text-accent transition-colors break-words line-clamp-2">{campaign.campaign_name || campaign.name}</h3>
                <p className="text-[11px] sm:text-xs text-secondary font-medium line-clamp-2 mb-6 break-words">
                  {campaign.reasoning || "AI-architected re-engagement strategy."}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-border mt-auto">
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-secondary">
                  <span>Progress</span>
                  <span>{Math.round(((campaign.sent || 0) / (campaign.audience_size || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-card-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((campaign.sent || 0) / (campaign.audience_size || 1)) * 100)}%` }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-secondary uppercase block mb-1">Audience</span>
                    <span className="text-xs sm:text-sm font-black truncate block">{campaign.audience_size?.toLocaleString()}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-secondary uppercase block mb-1">Conversions</span>
                    <span className="text-xs sm:text-sm font-black text-success truncate block">{campaign.clicked || campaign.forecast_purchased || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-accent font-black text-[9px] sm:text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-all">
                View Details <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;

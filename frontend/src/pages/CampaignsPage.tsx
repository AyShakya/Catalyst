import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Clock, CheckCircle2, ChevronRight, 
  BarChart3, Users, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCampaigns } from '../services/brandService';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Campaigns</h1>
          <p className="text-secondary font-medium">Strategy Performance & Management</p>
        </div>
        <button 
          onClick={() => navigate('/workspace/strategist')}
          className="bg-accent text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center gap-2"
        >
          New Strategy <Send size={16} />
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white border border-border rounded-[40px] p-20 text-center">
          <div className="w-20 h-20 bg-card-bg text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Send size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase mb-2">No campaigns yet</h2>
          <p className="text-secondary max-w-sm mx-auto mb-8 font-medium">
            Use the AI Strategist to architect and launch your first growth campaign.
          </p>
          <button 
            onClick={() => navigate('/workspace/strategist')}
            className="btn btn-primary px-8"
          >
            Go to Strategist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => (
            <motion.div 
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/workspace/campaigns/${campaign.id}`)}
              className="bg-white border border-border rounded-3xl p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${campaign.status === 'RUNNING' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                  <Send size={20} />
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  campaign.status === 'RUNNING' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'
                }`}>
                  {campaign.status}
                </div>
              </div>

              <h3 className="text-lg font-black uppercase tracking-tight mb-2 group-hover:text-accent transition-colors">{campaign.campaign_name || campaign.name}</h3>
              <p className="text-xs text-secondary font-medium line-clamp-2 mb-6">
                {campaign.reasoning || "AI-architected re-engagement strategy."}
              </p>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-secondary">
                  <span>Progress</span>
                  <span>{Math.round(((campaign.delivered || campaign.forecast_delivered || 0) / (campaign.audience_size || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-card-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((campaign.delivered || campaign.forecast_delivered || 0) / (campaign.audience_size || 1)) * 100)}%` }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <span className="text-[10px] font-black text-secondary uppercase block mb-1">Audience</span>
                    <span className="text-sm font-black">{campaign.audience_size?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-secondary uppercase block mb-1">Conversions</span>
                    <span className="text-sm font-black text-success">{campaign.clicked || campaign.forecast_purchased || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-accent font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-all">
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

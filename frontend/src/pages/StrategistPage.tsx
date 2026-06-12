import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Send, Loader2, Target, Users, 
  MessageSquare, BarChart3, Rocket, Trash2, Edit3,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCampaignProposal, launchCampaign } from '../services/brandService';

type StrategistState = 'idle' | 'thinking' | 'proposal' | 'launched';

const StrategistPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<StrategistState>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [proposal, setProposal] = useState<any>(null);

  const steps = [
    "Analyzing Customer Base",
    "Identifying Audience",
    "Designing Campaign Strategy",
    "Generating Forecast"
  ];

  const handlePropose = async () => {
    if (!prompt) return;
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) return;

    setState('thinking');
    setCurrentStep(0);

    // Simulation for UX
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const res = await createCampaignProposal(brandId, prompt);
      setProposal(res.data);
      clearInterval(interval);
      setCurrentStep(steps.length - 1);
      setTimeout(() => setState('proposal'), 1000);
    } catch (err) {
      console.error(err);
      setState('idle');
      clearInterval(interval);
    }
  };

  const handleLaunch = async () => {
    if (!proposal) return;
    try {
      await launchCampaign(proposal.id);
      setState('launched');
    } catch (err) {
      console.error(err);
    }
  };

  const examplePrompts = [
    "Increase repeat purchases",
    "Bring back inactive customers",
    "Promote a new product launch",
    "Improve customer retention",
    "Reward high-value customers"
  ];

  if (state === 'thinking') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-12"
          >
            <div className="relative inline-block">
              <Sparkles className="w-16 h-16 text-accent animate-pulse" />
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full -z-10" />
            </div>
            <h2 className="text-3xl font-black mt-6 uppercase tracking-tight">Strategizing...</h2>
            <p className="text-secondary mt-2">Catalyst is architecting your growth strategy</p>
          </motion.div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.2,
                  x: 0,
                }}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 ${
                  index === currentStep ? 'bg-white border-accent shadow-lg shadow-accent/5 translate-x-2' : 'bg-white/50 border-border'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="text-success" size={20} />
                ) : index === currentStep ? (
                  <Loader2 className="animate-spin text-accent" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                )}
                <span className={`font-black text-xs uppercase tracking-[0.15em] ${index === currentStep ? 'text-accent' : 'text-secondary'}`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'proposal' && proposal) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2 block">Campaign Strategy</span>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{proposal.name}</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setState('idle')}
              className="px-6 py-3 rounded-xl border border-border font-black text-xs uppercase tracking-widest hover:bg-card-bg transition-all"
            >
              Discard
            </button>
            <button 
              onClick={handleLaunch}
              className="px-6 py-3 rounded-xl bg-accent text-white font-black text-xs uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              Launch Strategy <Rocket size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Strategy Logic */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                  <Target size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Business Intelligence</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Objective</label>
                  <p className="text-lg font-bold">"{prompt}"</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">AI Reasoning</label>
                  <p className="text-secondary leading-relaxed">
                    Based on the customer behavior analysis, I've identified a segment that has high latent value but low recent activity. 
                    This strategy focuses on re-engagement through personalized multi-channel communication to maximize conversion probability.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Creative */}
            <div className="bg-card-bg p-8 rounded-3xl border border-border shadow-inner relative">
              <div className="absolute top-8 right-8 text-accent opacity-20">
                <MessageSquare size={48} />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white text-foreground rounded-lg shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Communication Protocol</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <p className="text-sm font-medium leading-relaxed italic text-secondary">
                  "{proposal.message_template}"
                </p>
              </div>
              <div className="mt-6 flex gap-4">
                <div className="bg-white px-3 py-2 rounded-lg border border-border text-[10px] font-black uppercase tracking-widest">Channel: {proposal.channel}</div>
                <div className="bg-white px-3 py-2 rounded-lg border border-border text-[10px] font-black uppercase tracking-widest text-accent">AI-Optimized Timing</div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Audience Snapshot */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-success/10 text-success rounded-lg">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Audience Summary</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-4">
                  <span className="text-xs font-bold text-secondary uppercase">Target Size</span>
                  <span className="text-xl font-black">{proposal.audience_size?.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-card-bg rounded-2xl">
                    <span className="text-[10px] font-black text-secondary uppercase block mb-1">Avg Spend</span>
                    <span className="text-sm font-black">$42.50</span>
                  </div>
                  <div className="p-4 bg-card-bg rounded-2xl">
                    <span className="text-[10px] font-black text-secondary uppercase block mb-1">Loyalty</span>
                    <span className="text-sm font-black">Medium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="bg-foreground text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <BarChart3 className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 text-white rounded-lg backdrop-blur-md">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Forecasted Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/60">Expected Reach</span>
                  <span className="text-sm font-black">98.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/60">Expected Opens</span>
                  <span className="text-sm font-black">42.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/60">Conv. Probability</span>
                  <span className="text-sm font-black">8.4%</span>
                </div>
                <div className="pt-4 border-t border-white/10 mt-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Projected Revenue</span>
                  <span className="text-2xl font-black text-success">$12,450.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'launched') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-12 bg-white rounded-[40px] border border-border shadow-2xl max-w-lg"
        >
          <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-8">
            <Rocket size={48} />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Blast Off!</h2>
          <p className="text-secondary mb-10 leading-relaxed font-medium">
            Your campaign strategy has been deployed across all channels. Catalyst is now monitoring performance in real-time.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/workspace/campaigns')}
              className="w-full py-4 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
            >
              Monitor Progress
            </button>
            <button 
              onClick={() => { setState('idle'); setPrompt(''); }}
              className="w-full py-4 rounded-2xl border border-border text-secondary font-black text-sm uppercase tracking-widest hover:bg-card-bg transition-all"
            >
              Create Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4 block">Engine Interface</span>
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">What business outcome <br /> are you trying to achieve?</h1>
        <p className="text-secondary text-lg max-w-xl mx-auto font-medium">
          Catalyst will analyze your customer DNA and architect a high-conversion strategy in seconds.
        </p>
      </motion.div>

      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-accent/5 rounded-[32px] blur-3xl group-hover:bg-accent/10 transition-all duration-500" />
        <div className="relative bg-white border-2 border-border p-2 rounded-[32px] shadow-2xl focus-within:border-accent transition-all flex items-center gap-2">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePropose()}
            placeholder="e.g. Increase repeat purchases for high-value customers"
            className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-xl font-bold placeholder:text-gray-300"
          />
          <button 
            onClick={handlePropose}
            disabled={!prompt}
            className={`p-4 rounded-2xl transition-all ${
              prompt ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-card-bg text-secondary'
            }`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examplePrompts.map((example, i) => (
          <button 
            key={i}
            onClick={() => setPrompt(example)}
            className="text-left p-6 bg-white border border-border rounded-2xl hover:border-accent hover:bg-accent/[0.02] transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-secondary uppercase tracking-widest group-hover:text-accent transition-colors">{example}</span>
              <ArrowRight size={16} className="text-border group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StrategistPage;

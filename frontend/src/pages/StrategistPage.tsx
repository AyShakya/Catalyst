import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Send, Loader2, Target, Users, 
  MessageSquare, BarChart3, Rocket, Trash2, Edit3,
  CheckCircle2, ArrowRight, Bot, User, History,
  ChevronRight, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithStrategist, chatWithStrategistStream, launchStrategistCampaign, getStrategistSession, executeCampaign, closeSession, getActiveSessions } from '../services/brandService';

type Message = {
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: string;
};

type Draft = {
  version: number;
  name: string;
  goal: string;
  channel: string;
  message: string;
  reasoning: string;
  filters: any[];
  audience: {
    size: number;
    avgSpend: number;
    avgLoyalty: number;
    avgChurn: number;
  };
  forecast: {
    delivered: number;
    opened: number;
    clicked: number;
    conversions: number;
    revenue: number;
  };
};

const StrategistPage: React.FC = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestDraft, setLatestDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'LAUNCHED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const streamingAssistantIndexRef = useRef<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brandId = localStorage.getItem('catalyst_brand_id');
    if (!brandId) {
      navigate('/setup');
      return;
    }

    // Recover session from URL if provided (v2 support)
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    if (sid) {
      loadSession(sid);
    } else {
      fetchActiveSessions(brandId);
    }

    // Handle prompt from Opportunity Feed
    const initialPrompt = urlParams.get('prompt');
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchActiveSessions = async (brandId: string) => {
    try {
      const res = await getActiveSessions(brandId);
      if (res.status === 'success') {
        setActiveSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to load active sessions:", err);
    }
  };

  const loadSession = async (sid: string) => {
    try {
      setIsLoading(true);
      const res = await getStrategistSession(sid);
      if (res.status === 'success') {
        setSessionId(sid);
        setMessages(res.data.history);
        setLatestDraft(res.data.latestDraft);
        setStatus(res.data.status);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!sessionId) return;
    try {
      await closeSession(sessionId);
      setSessionId(null);
      setMessages([]);
      setLatestDraft(null);
      setStatus('ACTIVE');
      window.history.replaceState(null, '', window.location.pathname);
      const brandId = localStorage.getItem('catalyst_brand_id');
      if (brandId) fetchActiveSessions(brandId);
    } catch (err) {
      console.error("Failed to close session:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || status === 'LAUNCHED') return;

    const brandId = localStorage.getItem('catalyst_brand_id')!;
    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic UI
    setMessages(prev => [...prev, { role: 'USER', content: userMsg } as Message]);
    streamingAssistantIndexRef.current = null;

    try {
      let streamedFinal: any = null;

      setMessages(prev => {
        const next = [...prev, { role: 'ASSISTANT', content: '' } as Message];
        streamingAssistantIndexRef.current = next.length - 1;
        return next;
      });

      try {
        streamedFinal = await chatWithStrategistStream(brandId, userMsg, sessionId || undefined, {
          onDelta: (delta) => {
            setMessages(prev => {
              const index = streamingAssistantIndexRef.current;
              if (index === null || index < 0 || index >= prev.length) {
                return prev;
              }

              const next = [...prev];
              const current = next[index];

              if (!current || current.role !== 'ASSISTANT') {
                return prev;
              }

              next[index] = {
                ...current,
                content: `${current.content}${delta}`,
              };

              return next;
            });
          },
          onError: (errorMessage) => {
            throw new Error(errorMessage);
          },
        });
      } catch (streamError) {
        const fallbackRes = await chatWithStrategist(brandId, userMsg, sessionId || undefined);
        if (fallbackRes.status === 'success') {
          if (!sessionId) {
            setSessionId(fallbackRes.data.sessionId);
            window.history.replaceState(null, '', `?session=${fallbackRes.data.sessionId}`);
          }
          setMessages(fallbackRes.data.history);
          setLatestDraft(fallbackRes.data.draft);
          return;
        }

        throw streamError;
      }

      if (streamedFinal && (typeof streamedFinal.message === 'string' || Array.isArray(streamedFinal.history))) {
        if (!sessionId && streamedFinal.sessionId) {
          setSessionId(streamedFinal.sessionId);
          window.history.replaceState(null, '', `?session=${streamedFinal.sessionId}`);
        }

        if (Array.isArray(streamedFinal.history) && streamedFinal.history.length > 0) {
          setMessages(streamedFinal.history);
        } else if (typeof streamedFinal.message === 'string') {
          setMessages(prev => {
            const index = streamingAssistantIndexRef.current;
            if (index === null || index < 0 || index >= prev.length) {
              return prev;
            }

            const next = [...prev];
            next[index] = { ...next[index], content: streamedFinal.message };
            return next;
          });
        }

        if (streamedFinal.draft) {
          setLatestDraft(streamedFinal.draft);
        }
      } else {
        const res = await chatWithStrategist(brandId, userMsg, sessionId || undefined);
        if (res.status === 'success') {
          if (!sessionId) {
            setSessionId(res.data.sessionId);
            window.history.replaceState(null, '', `?session=${res.data.sessionId}`);
          }
          setMessages(res.data.history);
          setLatestDraft(res.data.draft);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: "I encountered an error while analyzing your request. Please try again." } as Message]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!sessionId || isLaunching || status === 'LAUNCHED') return;

    const brandId = localStorage.getItem('catalyst_brand_id')!;
    setIsLaunching(true);

    try {
      const res = await launchStrategistCampaign(brandId, sessionId);
      if (res.status === 'success') {
        // Trigger actual execution (PII snapshot + dispatch)
        await executeCampaign(res.data.campaignId);
        setStatus('LAUNCHED');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLaunching(false);
    }
  };

  const examplePrompts = [
    "Increase repeat purchases",
    "Bring back inactive VIPs",
    "Promote a new seasonal collection",
    "Target high-churn risk customers in Mumbai",
    "Reward our top 5% spenders"
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex gap-8">
      {/* Left Chat Section */}
      <div className="flex-1 flex flex-col bg-white rounded-4xl border border-border shadow-sm overflow-hidden relative">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card-bg/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent text-white rounded-xl shadow-lg shadow-accent/20">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">AI Strategist</h2>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'LAUNCHED' ? 'bg-secondary' : 'bg-success animate-pulse'}`} />
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                  {status === 'LAUNCHED' ? 'Session Locked' : 'Online & Analyzing'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sessionId && status !== 'LAUNCHED' && (
              <button 
                onClick={handleCloseSession}
                className="flex items-center gap-1.5 text-[10px] font-black text-error uppercase tracking-widest bg-error/5 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={12} /> Discard
              </button>
            )}
            {sessionId && (
              <div className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-border">
                <History size={12} /> Version {latestDraft?.version || 1}
              </div>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
          <AnimatePresence initial={false}>
            {!sessionId && activeSessions.length > 0 && messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                  <History size={14} /> Resume Active Sessions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSessions.map(session => (
                    <button 
                      key={session.id}
                      onClick={() => {
                        window.history.replaceState(null, '', `?session=${session.id}`);
                        loadSession(session.id);
                      }}
                      className="text-left p-4 rounded-2xl border border-border hover:border-accent bg-card-bg transition-all group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black truncate max-w-[80%]">{session.latestDraft?.name || "Untitled Strategy"}</span>
                        <ArrowRight size={14} className="text-secondary group-hover:text-accent" />
                      </div>
                      <p className="text-[10px] text-secondary font-medium uppercase tracking-widest">
                        Updated {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8"
              >
                <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mb-8">
                  <Sparkles className="text-accent w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Strategic Intelligence</h3>
                <p className="text-secondary font-medium mb-12">
                  Describe a business outcome, and I will architect the ideal audience and communication strategy for you.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full">
                  {examplePrompts.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(p)}
                      className="text-left px-5 py-3 rounded-xl border border-border hover:border-accent hover:bg-accent/2 transition-all text-xs font-bold text-secondary flex justify-between items-center group"
                    >
                      {p} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex gap-4 ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'USER' ? 'bg-card-bg border border-border text-secondary' : 'bg-accent text-white'
                  }`}>
                    {msg.role === 'USER' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'USER' ? 'bg-foreground text-white' : 'bg-card-bg border border-border text-foreground font-medium'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-card-bg border border-border p-4 rounded-2xl flex items-center gap-3">
                  <div className="flex gap-1">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">Strategist is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-border bg-card-bg/30">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading || status === 'LAUNCHED'}
              placeholder={status === 'LAUNCHED' ? "Session closed. Launching campaign..." : "Refine your strategy (e.g. 'Focus only on Mumbai customers')"}
              className="w-full bg-white border border-border rounded-2xl px-6 py-4 pr-16 outline-none focus:border-accent transition-all font-medium text-sm disabled:opacity-50"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || status === 'LAUNCHED'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                input.trim() && !isLoading && status !== 'LAUNCHED' ? 'bg-accent text-white' : 'bg-border text-secondary'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Strategy Snapshot */}
      <div className="w-100 flex flex-col gap-6 h-full">
        <AnimatePresence mode="wait">
          {latestDraft ? (
            <motion.div 
              key="draft"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2"
            >
              {/* Audience Section */}
              <div className="bg-white p-6 rounded-4xl border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Users size={18} className="text-accent" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Audience Discovery</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-border pb-4">
                    <span className="text-[10px] font-bold text-secondary uppercase">Projected Reach</span>
                    <span className="text-xl font-black">{latestDraft.audience.size.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-card-bg rounded-2xl">
                      <span className="text-[8px] font-black text-secondary uppercase block mb-1">Avg Spend</span>
                      <span className="text-xs font-black">${Math.round(latestDraft.audience.avgSpend)}</span>
                    </div>
                    <div className="p-3 bg-card-bg rounded-2xl">
                      <span className="text-[8px] font-black text-secondary uppercase block mb-1">Churn Risk</span>
                      <span className="text-xs font-black">{Math.round(latestDraft.audience.avgChurn)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Card */}
              <div className="bg-white p-6 rounded-4xl border border-border shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <Target size={18} className="text-accent" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Campaign Strategy</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-[8px] font-black text-secondary uppercase block mb-1">Campaign Name</span>
                    <p className="text-sm font-black">{latestDraft.name}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-secondary uppercase block mb-1">Reasoning</span>
                    <p className="text-xs text-secondary leading-relaxed font-medium">
                      {latestDraft.reasoning}
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-secondary uppercase block mb-1">Communication</span>
                    <div className="p-3 bg-card-bg rounded-xl border border-border mt-1">
                      <p className="text-[11px] font-medium italic text-secondary leading-relaxed">
                        "{latestDraft.message}"
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span className="px-2 py-1 bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest rounded-md">
                        {latestDraft.channel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="bg-foreground text-white p-6 rounded-4xl shadow-xl relative overflow-hidden">
                <BarChart3 className="absolute -bottom-4 -right-4 w-20 h-20 opacity-10" />
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">Revenue Forecast</h3>
                <div className="flex justify-between items-end mb-8">
                  <span className="text-2xl font-black text-success">${latestDraft.forecast.revenue.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Expected Lift</span>
                </div>
                {status === 'LAUNCHED' ? (
                  <button 
                    onClick={() => navigate('/workspace/campaigns')}
                    className="w-full py-4 bg-success text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-success/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    Campaign Running <Play size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={handleLaunch}
                    disabled={isLaunching}
                    className="w-full py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    {isLaunching ? <Loader2 size={16} className="animate-spin" /> : <>Launch Campaign <Rocket size={16} /></>}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 border-2 border-dashed border-border rounded-4xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-12 h-12 bg-card-bg rounded-full flex items-center justify-center mb-4 text-secondary/30">
                <Target size={24} />
              </div>
              <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                Strategic Summary <br /> will appear here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StrategistPage;

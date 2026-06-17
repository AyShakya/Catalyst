import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Sparkles, Send, Loader2, Target, Users, 
  MessageSquare, BarChart3, Rocket, Trash2, Edit3,
  CheckCircle2, ArrowRight, Bot, User, History,
  ChevronRight, Play, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithStrategist, chatWithStrategistStream, launchStrategistCampaign, getStrategistSession, executeCampaign, closeSession, getActiveSessions } from '../services/brandService';
import { Skeleton } from '../components/layout/Skeleton';
import { CampaignDraft } from '../types/intelligence';
import { useToast } from '../context/ToastContext';

type Message = {
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: string;
};

interface ActiveSession {
  id: string;
  created_at: string;
  updated_at: string;
  latestDraft: CampaignDraft | null;
}

const ThinkingDots = () => (
  <div className="flex gap-1 shrink-0 py-1">
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
  </div>
);

interface MessageItemProps {
  msg: Message;
}

const MessageItem = React.memo(({ msg }: MessageItemProps) => {
  return (
    <div className={`max-w-[95%] sm:max-w-[85%] flex gap-2 sm:gap-4 ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
        msg.role === 'USER' ? 'bg-card-bg border border-border text-secondary' : 'bg-accent text-white'
      }`}>
        {msg.role === 'USER' ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed break-words overflow-hidden ${
        msg.role === 'USER' ? 'bg-foreground text-white' : 'bg-card-bg border border-border text-foreground font-medium'
      }`}>
        {msg.content || <ThinkingDots />}
      </div>
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

const StrategistPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId: routeBrandId } = useParams();
  const { activeBrand } = useWorkspace();
  const brandId = routeBrandId || activeBrand?.id;
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestDraft, setLatestDraft] = useState<CampaignDraft | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'LAUNCHED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isBuildingCampaign, setIsBuildingCampaign] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const streamingAssistantIndexRef = useRef<number | null>(null);
  const navigatedSessionIdRef = useRef<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!brandId) return;

    const controller = new AbortController();

    // Recover session from URL if provided (v2 support)
    const urlParams = new URLSearchParams(location.search);
    const sid = urlParams.get('session');
    if (sid) {
      if (sid === sessionId) {
        navigatedSessionIdRef.current = null;
      } else {
        if (sid === navigatedSessionIdRef.current) {
          navigatedSessionIdRef.current = null;
        } else {
          loadSession(sid, controller.signal);
        }
      }
    } else {
      if (sessionId !== null) {
        if (sessionId === navigatedSessionIdRef.current) {
          // Waiting for URL to catch up
          console.log("Waiting for URL to catch up to session:", sessionId);
        } else {
          setSessionId(null);
          setMessages([]);
          setLatestDraft(null);
          setStatus('ACTIVE');
          setCampaignId(null);
          setIsBuildingCampaign(false);
          fetchActiveSessions(brandId);
        }
      } else {
        fetchActiveSessions(brandId);
      }
    }

    // Handle prompt from Opportunity Feed
    const initialPrompt = urlParams.get('prompt');
    if (initialPrompt) {
      setInput(initialPrompt);
    }

    return () => controller.abort();
  }, [brandId, location.search, sessionId, navigate]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 150;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setShowScrollBottom(!atBottom);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const threshold = 150;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    
    const lastMessage = messages[messages.length - 1];
    const justSent = lastMessage?.role === 'USER';
    
    if (isAtBottom || justSent) {
      el.scrollTop = el.scrollHeight;
      setShowScrollBottom(false);
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

  const loadSession = async (sid: string, signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setIsBuildingCampaign(true);
      if (!brandId) return;

      const res = await getStrategistSession(brandId, sid);
      if (res.status === 'success' && !signal?.aborted) {
        setSessionId(sid);
        setMessages(res.data.history);
        setLatestDraft(res.data.latestDraft);
        setStatus(res.data.status);
        setCampaignId(res.data.campaignId || null);
      }
    } catch (err) {
      if ((err as any).name !== 'AbortError') {
        console.error("Failed to load session:", err);
        setSessionId(null);
        setMessages([]);
        setLatestDraft(null);
        setStatus('ACTIVE');
        setCampaignId(null);
        navigate(window.location.pathname, { replace: true });
      }
    } finally {
      setIsLoading(false);
      setIsBuildingCampaign(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    try {
      if (!brandId) return;

      await closeSession(brandId, sid);
      setActiveSessions(prev => prev.filter(s => s.id !== sid));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleCloseSession = () => {
    if (!sessionId || isLoading) return;
    setShowDiscardModal(true);
  };

  const executeConfirmedDiscard = async () => {
    if (!sessionId || isLoading || isDiscarding) return;
    
    if (!brandId) return;

    setIsDiscarding(true);
    const targetSessionId = sessionId;

    try {
      await closeSession(brandId, targetSessionId);
      // Remove from list immediately
      setActiveSessions(prev => prev.filter(s => s.id !== targetSessionId));
      
      // Clean up states
      setSessionId(null);
      setMessages([]);
      setLatestDraft(null);
      setStatus('ACTIVE');
      setCampaignId(null);
      setShowDiscardModal(false);
      
      // Navigate to remove URL parameter
      navigate(window.location.pathname, { replace: true });
    } catch (err) {
      console.error("Failed to discard session:", err);
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleSendMessage = async () => {
    // 1. Immediate guard against concurrent clicks or empty input
    if (!input.trim() || isLoading || status === 'LAUNCHED') return;

    if (!brandId) return;

    // 2. Lock UI immediately
    setIsLoading(true);
    
    const userMsg = input.trim();
    const controller = new AbortController();

    setInput('');

    // 3. Optimistic UI: Add user message + placeholder for assistant
    setMessages(prev => {
      const next = [...prev, 
        { role: 'USER', content: userMsg } as Message,
        { role: 'ASSISTANT', content: '' } as Message
      ];
      streamingAssistantIndexRef.current = next.length - 1;
      return next;
    });

    try {
      let streamedFinal: any = null;

      try {
        // 4. Attempt streaming for fast perceived response
        streamedFinal = await chatWithStrategistStream(brandId, userMsg, sessionId || undefined, {
          signal: controller.signal,
          onDelta: (delta) => {
            setMessages(prev => {
              const index = streamingAssistantIndexRef.current;
              if (index === null || index < 0 || index >= prev.length) return prev;

              const next = [...prev];
              const current = next[index];
              if (!current || current.role !== 'ASSISTANT') return prev;

              next[index] = { ...current, content: `${current.content}${delta}` };
              return next;
            });
          },
          onProcessing: (payload) => {
            if (payload.status === 'streaming') {
              if (payload.action === 'UPDATE_DRAFT' && payload.draft) {
                setLatestDraft(payload.draft);
                setIsBuildingCampaign(true);
              } else {
                setIsBuildingCampaign(false);
              }
            }
          },
          onError: (errorMessage) => {
            throw new Error(errorMessage);
          },
        });
      } catch (streamError: any) {
        // Ignore AbortErrors if the user navigated away
        if (streamError.name === 'AbortError') return;

        console.warn("Streaming failed, falling back to polling", streamError);
        
        // 5. Fallback to standard polling if streaming fails (Robustness)
        const fallbackRes = await chatWithStrategist(brandId, userMsg, sessionId || undefined, controller.signal);
        if (fallbackRes.status === 'success') {
          if (!sessionId && fallbackRes.data.sessionId) {
            navigatedSessionIdRef.current = fallbackRes.data.sessionId;
            setSessionId(fallbackRes.data.sessionId);
            navigate(`?session=${fallbackRes.data.sessionId}`, { replace: true });
          }
          setMessages(fallbackRes.data.history);
          setLatestDraft(fallbackRes.data.draft);
          return;
        }

        throw streamError;
      }

      // 6. Finalize state from streaming response
      if (streamedFinal) {
        if (!sessionId && streamedFinal.sessionId) {
          navigatedSessionIdRef.current = streamedFinal.sessionId;
          setSessionId(streamedFinal.sessionId);
          navigate(`?session=${streamedFinal.sessionId}`, { replace: true });
        }

        // Only sync history if streaming content was partial or we need a hard sync
        if (Array.isArray(streamedFinal.history) && streamedFinal.history.length > 0) {
          setMessages(streamedFinal.history);
        } else if (typeof streamedFinal.message === 'string') {
          setMessages(prev => {
            const index = streamingAssistantIndexRef.current;
            if (index === null || index < 0 || index >= prev.length) return prev;
            const next = [...prev];
            next[index] = { ...next[index], content: streamedFinal.message };
            return next;
          });
        }

        if (streamedFinal.draft) {
          setLatestDraft(streamedFinal.draft);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Strategist chat error:", err);
      
      // 7. Graceful error state in the chat bubble
      setMessages(prev => {
        const next = [...prev];
        const index = streamingAssistantIndexRef.current;
        if (index !== null && index < next.length) {
          next[index] = { 
            role: 'ASSISTANT', 
            content: "I encountered an error while analyzing your request. Please try again or refine your prompt." 
          } as Message;
        }
        return next;
      });
      
      // Put the input back so the user doesn't lose it
      setInput(userMsg);
    } finally {
      setIsLoading(false);
      setIsBuildingCampaign(false);
    }
  };

  const handleLaunch = () => {
    if (!sessionId || isLaunching || status === 'LAUNCHED' || isLoading) return;
    setLaunchError(null);
    setShowConfirmModal(true);
  };

  const executeConfirmedLaunch = async () => {
    if (!sessionId || isLaunching || status === 'LAUNCHED' || isLoading) return;

    if (!brandId) return;
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const res = await launchStrategistCampaign(brandId, sessionId);
      if (res.status === 'success') {
        // Trigger actual execution (PII snapshot + dispatch)
        await executeCampaign(res.data.campaignId);
        setStatus('LAUNCHED');
        setCampaignId(res.data.campaignId);
        setShowConfirmModal(false);
        showToast('Campaign successfully built and launched via Catalyst dispatch loop!', 'success');
        // Clear active session state from the list immediately
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        // Redirect to campaigns page to monitor progress
        navigate(`/workspace/${brandId}/campaigns/${res.data.campaignId}`);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to launch campaign.";
      setLaunchError(msg);
      showToast(msg, 'error');
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
    <div className="h-auto lg:h-[calc(100vh-140px)] xl:h-[calc(100vh-120px)] flex flex-col xl:flex-row gap-6 lg:gap-8 min-h-0">
      {/* Left Chat Section */}
      <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-0 flex flex-col bg-white rounded-3xl sm:rounded-4xl border border-border shadow-sm overflow-hidden relative">
        <div className="p-4 sm:p-6 border-b border-border flex flex-wrap justify-between items-center bg-card-bg/30 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 shrink-0">
              <Bot size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest truncate">AI Strategist</h2>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'LAUNCHED' ? 'bg-secondary' : 'bg-success animate-pulse'}`} />
                <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest truncate">
                  {status === 'LAUNCHED' ? 'Session Locked' : 'Online & Analyzing'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
            {sessionId && (
              <button 
                onClick={handleCloseSession}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-error uppercase tracking-widest bg-error/5 hover:bg-error/10 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} /> <span className="hidden xs:inline">Discard</span>
              </button>
            )}
            {sessionId && (
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-secondary uppercase tracking-widest bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-border">
                <History size={12} /> <span className="hidden xs:inline">Version</span> {latestDraft?.version || 1}
              </div>
            )}
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-hide">
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
                    <div 
                      key={session.id}
                      className="group relative"
                    >
                      <button 
                        onClick={() => {
                          navigate(`?session=${session.id}`, { replace: true });
                        }}
                        className="w-full text-left p-4 rounded-2xl border border-border hover:border-accent bg-card-bg transition-all min-w-0 pr-12"
                      >
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="text-xs font-black truncate">{session.latestDraft?.name || "Untitled Strategy"}</span>
                          <ArrowRight size={14} className="text-secondary group-hover:text-accent shrink-0" />
                        </div>
                        <p className="text-[10px] text-secondary font-medium uppercase tracking-widest">
                          Updated {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-secondary hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8 px-4"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/5 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                  <Sparkles className="text-accent w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-4">Strategic Intelligence</h3>
                <p className="text-sm sm:text-base text-secondary font-medium mb-8 sm:mb-12">
                  Describe a business outcome, and I will architect the ideal audience and communication strategy for you.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full">
                  {examplePrompts.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(p)}
                      className="text-left px-4 sm:px-5 py-3 rounded-xl border border-border hover:border-accent hover:bg-accent/2 transition-all text-[11px] sm:text-xs font-bold text-secondary flex justify-between items-center group gap-4"
                    >
                      <span className="truncate">{p}</span> <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.length === 0 && isLoading && (
              <motion.div 
                key="chat-history-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex gap-4">
                  <Skeleton variant="circle" className="w-8 h-8" />
                  <Skeleton className="h-20 w-3/4 rounded-2xl" />
                </div>
                <div className="flex gap-4 flex-row-reverse">
                  <Skeleton variant="circle" className="w-8 h-8" />
                  <Skeleton className="h-12 w-1/2 rounded-2xl" />
                </div>
                <div className="flex gap-4">
                  <Skeleton variant="circle" className="w-8 h-8" />
                  <Skeleton className="h-32 w-2/3 rounded-2xl" />
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
                <MessageItem msg={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 sm:p-6 border-t border-border bg-card-bg/30">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || status === 'LAUNCHED'}
              placeholder={status === 'LAUNCHED' ? "Session closed. Launching campaign..." : "Refine strategy (e.g. 'Only Mumbai customers')"}
              className="w-full bg-white border border-border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 pr-12 sm:pr-14 outline-none focus:border-accent transition-all font-medium text-xs sm:text-sm disabled:opacity-50"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || status === 'LAUNCHED'}
              className={`absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${
                input.trim() && !isLoading && status !== 'LAUNCHED' ? 'bg-accent text-white' : 'bg-border text-secondary'
              }`}
            >
              <Send size={14} className="sm:size-4" />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => {
                const el = scrollRef.current;
                if (el) {
                  el.scrollTop = el.scrollHeight;
                  setShowScrollBottom(false);
                }
              }}
              className="absolute bottom-24 right-6 z-20 flex items-center gap-1.5 px-3.5 py-2 bg-foreground hover:bg-foreground/90 active:scale-95 text-white border border-border/10 rounded-full shadow-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="rotate-90 text-white shrink-0" size={12} /> Scroll to Bottom
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right Strategy Snapshot */}
      <div className="w-full xl:w-80 2xl:w-100 flex flex-col gap-6 h-auto xl:h-full min-w-0">
        <AnimatePresence>
          {latestDraft || isBuildingCampaign ? (
            <motion.div 
              key="strategy-snapshot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col gap-6 xl:overflow-y-auto pr-0 xl:pr-3 pb-6 xl:pb-0"
            >
              {/* Audience Section */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl sm:rounded-4xl border border-border shadow-sm shrink-0">
                <div className="flex items-center gap-2 mb-6">
                  <Users size={18} className="text-accent shrink-0" />
                  <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest truncate">Audience Discovery</h3>
                </div>
                {isBuildingCampaign && !latestDraft ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-border pb-4">
                      <Skeleton variant="text" className="w-20" />
                      <Skeleton variant="text" className="w-16 h-8" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-border pb-4 gap-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase truncate">Projected Reach</span>
                      <span className="text-lg sm:text-xl font-black shrink-0">{latestDraft?.audience.size.toLocaleString() || '0'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card-bg rounded-2xl min-w-0">
                        <span className="text-[8px] font-black text-secondary uppercase block mb-1 truncate">Avg Order</span>
                        <span className="text-xs font-black truncate block">${Math.round(latestDraft?.audience.avgOrderValue || (latestDraft ? latestDraft.audience.avgSpend / 10 : 0))}</span>
                      </div>
                      <div className="p-3 bg-card-bg rounded-2xl min-w-0 border border-success/10">
                        <span className="text-[8px] font-black text-success uppercase block mb-1 truncate">Loyalty DNA</span>
                        <span className="text-xs font-black truncate block">{Math.round(latestDraft?.audience.avgLoyalty || 0)}/100</span>
                      </div>
                      <div className="p-3 bg-card-bg rounded-2xl min-w-0">
                        <span className="text-[8px] font-black text-secondary uppercase block mb-1 truncate">Avg LTV</span>
                        <span className="text-xs font-black truncate block">${Math.round(latestDraft?.audience.avgSpend || 0).toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-card-bg rounded-2xl min-w-0 border border-error/10">
                        <span className="text-[8px] font-black text-error uppercase block mb-1 truncate">Churn Risk</span>
                        <span className="text-xs font-black truncate block text-error">{Math.round(latestDraft?.audience.avgChurn || 0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl sm:rounded-4xl border border-border shadow-sm flex-1 min-h-[300px] flex flex-col shrink-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 shrink-0">
                  <Target size={18} className="text-accent shrink-0" />
                  <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest truncate">Campaign Strategy</h3>
                </div>
                {isBuildingCampaign && !latestDraft ? (
                  <div className="space-y-6 flex-1 pr-1">
                    <div>
                      <Skeleton variant="text" className="w-24 mb-2" />
                      <Skeleton variant="text" className="w-full h-8" />
                    </div>
                    <div>
                      <Skeleton variant="text" className="w-20 mb-2" />
                      <Skeleton variant="text" className="w-full h-24" />
                    </div>
                    <div>
                      <Skeleton variant="text" className="w-28 mb-2" />
                      <Skeleton variant="text" className="w-full h-16 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 min-w-0 overflow-y-auto pr-1">
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-secondary uppercase block mb-1 truncate">Campaign Name</span>
                      <p className="text-sm font-black break-words">{latestDraft?.name}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-secondary uppercase block mb-1 truncate">Reasoning</span>
                      <p className="text-xs text-secondary leading-relaxed font-medium break-words">
                        {latestDraft?.reasoning}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-secondary uppercase block mb-1 truncate">Communication</span>
                      <div className="p-3 bg-card-bg rounded-xl border border-border mt-1">
                        <p className="text-[10px] sm:text-[11px] font-medium italic text-secondary leading-relaxed break-words">
                          "{latestDraft?.message}"
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest rounded-md shrink-0">
                          {latestDraft?.channel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="bg-foreground text-white p-5 sm:p-6 rounded-3xl sm:rounded-4xl shadow-xl relative overflow-hidden shrink-0 mt-auto">
                <BarChart3 className="absolute -bottom-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 opacity-10" />
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-6 opacity-60">Revenue Forecast</h3>
                
                {isBuildingCampaign && !latestDraft ? (
                  <div className="space-y-4 mb-8">
                    <Skeleton className="bg-white/10 w-24 h-8" />
                    <Skeleton className="bg-white/10 w-full h-12" />
                  </div>
                ) : (
                  <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-xl sm:text-2xl font-black text-success shrink-0">${latestDraft?.forecast.revenue.toLocaleString() || '0'}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Estimated Yield</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center group">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Delivered</span>
                        <span className="text-[10px] font-black">{latestDraft?.forecast.delivered.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Opened</span>
                        <span className="text-[10px] font-black">{latestDraft?.forecast.opened.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Clicked</span>
                        <span className="text-[10px] font-black">{latestDraft?.forecast.clicked.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Conv.</span>
                        <span className="text-[10px] font-black text-success">{latestDraft?.forecast.conversions.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {status === 'LAUNCHED' ? (
                  <button 
                    onClick={() => {
                      if (campaignId) {
                        navigate(`/workspace/${brandId}/campaigns/${campaignId}`);
                      } else {
                        navigate(`/workspace/${brandId}/campaigns`);
                      }
                    }}
                    className="w-full py-3.5 sm:py-4 bg-success text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-lg shadow-success/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    Campaign Running <Play size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={handleLaunch}
                    disabled={isLaunching || isLoading}
                    className="w-full py-3.5 sm:py-4 bg-accent text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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
              className="flex-1 border-2 border-dashed border-border rounded-3xl sm:rounded-4xl flex flex-col items-center justify-center p-6 sm:p-8 text-center min-h-[400px]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-card-bg rounded-full flex items-center justify-center mb-4 text-secondary/30 shrink-0">
                <Target size={20} className="sm:size-24" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                Strategic Summary <br /> will appear here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0 shadow-inner">
                  <Rocket size={24} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Confirm Execution</h4>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">Launch Campaign?</h3>
                </div>
              </div>

              {/* Message */}
              <div className="flex gap-3 items-start bg-danger/5 border border-danger/10 p-3.5 rounded-2xl">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-secondary leading-relaxed font-medium">
                  You are about to launch <span className="font-bold text-foreground">"{latestDraft?.name}"</span>. This action cannot be undone and real messages will be dispatched immediately.
                </p>
              </div>

              {/* Details card */}
              {latestDraft && (
                <div className="bg-card-bg rounded-2xl border border-border p-4 space-y-3.5">
                  <div className="text-[9px] font-black text-secondary uppercase tracking-widest border-b border-border pb-2">
                    Campaign Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[8px] font-black text-secondary uppercase block mb-0.5 opacity-60">Target Audience</span>
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Users size={12} className="text-accent" />
                        {latestDraft.audience.size.toLocaleString()} users
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-secondary uppercase block mb-0.5 opacity-60">Estimated Yield</span>
                      <span className="text-xs font-black text-success flex items-center gap-1.5">
                        <BarChart3 size={12} className="text-success" />
                        ${latestDraft.forecast.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-secondary uppercase block mb-0.5 opacity-60">Channel</span>
                      <span className="text-[10px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                        {latestDraft.channel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-secondary uppercase block mb-0.5 opacity-60">Avg Order Value</span>
                      <span className="text-xs font-bold text-foreground">
                        ${Math.round(latestDraft.audience.avgOrderValue || latestDraft.audience.avgSpend / 10)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-3">
                    <span className="text-[8px] font-black text-secondary uppercase block mb-1 opacity-60">Message Template</span>
                    <p className="text-[11px] text-secondary font-medium italic leading-relaxed line-clamp-2">
                      "{latestDraft.message}"
                    </p>
                  </div>
                </div>
              )}

              {launchError && (
                <div className="flex gap-2.5 items-start bg-error/5 border border-error/10 p-3.5 rounded-2xl text-error text-[11px] font-bold uppercase tracking-wider">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{launchError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 border border-border rounded-xl font-bold text-xs uppercase tracking-wider text-secondary hover:bg-card-bg transition-all hover:text-foreground active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedLaunch}
                  disabled={isLaunching}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      Execute Launch
                      <Rocket size={12} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDiscardModal(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center shrink-0 shadow-inner">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-danger mb-1">Confirm Action</h4>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">Discard Session?</h3>
                </div>
              </div>

              {/* Message */}
              <div className="flex gap-3 items-start bg-danger/5 border border-danger/10 p-3.5 rounded-2xl">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-secondary leading-relaxed font-medium">
                  Are you sure you want to discard this strategy chat? This will permanently delete the session, chat history, and all draft details. This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDiscardModal(false)}
                  className="px-5 py-2.5 border border-border rounded-xl font-bold text-xs uppercase tracking-wider text-secondary hover:bg-card-bg transition-all hover:text-foreground active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedDiscard}
                  disabled={isDiscarding}
                  className="px-5 py-2.5 bg-[#ef4444] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#d93838] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDiscarding ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Discarding...
                    </>
                  ) : (
                    <>
                      Discard Session
                      <Trash2 size={12} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StrategistPage;

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Send, BarChart2, LogOut, BookOpen, AlertCircle, Copy, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => (
  <NavLink 
    to={to} 
    end
    className={({ isActive }) => `
      flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider whitespace-nowrap
      ${isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-card-bg hover:text-foreground'}
    `}
  >
    <Icon size={18} className="shrink-0" />
    <span className="hidden sm:inline lg:inline">{children}</span>
    <span className="sm:hidden">{children}</span>
  </NavLink>
);

const WorkspaceLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId: urlBrandId } = useParams();
  const { brands, activeBrand, loading } = useWorkspace();
  const { showToast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild as HTMLElement,
      eventsTarget: scrollRef.current,
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Redirect legacy /workspace/... paths to include the activeBrand.id
  React.useEffect(() => {
    if (loading) return;

    if (!activeBrand) {
      if (brands.length === 0) {
        navigate('/setup');
      }
      return;
    }

    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'workspace') {
      const secondPart = pathParts[1];
      const legacyRoutes = ['overview', 'strategist', 'campaigns', 'analytics'];
      
      // If the brand ID is missing (either pathname is exactly /workspace or contains a legacy route tab next)
      if (!secondPart || legacyRoutes.includes(secondPart)) {
        const subRoutePath = pathParts.slice(1).join('/');
        const newPath = `/workspace/${activeBrand.id}${subRoutePath ? '/' + subRoutePath : '/overview'}`;
        navigate(newPath, { replace: true });
      }
    }
  }, [location.pathname, activeBrand, loading, brands, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('catalyst_brand_id');
    navigate('/');
  };

  const handleBrandChange = (newBrandId: string) => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    // Preserves the current tab, e.g. strategist, campaigns, overview, docx
    const currentTab = pathParts.length > 2 ? pathParts.slice(2).join('/') : 'overview';
    navigate(`/workspace/${newBrandId}/${currentTab}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-card-bg/25">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent text-accent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary animate-pulse">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!activeBrand && brands.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-transparent overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 xl:w-72 bg-white/40 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-border flex flex-col p-4 lg:p-6 shrink-0 z-20">
        <div className="mb-4 lg:mb-10 px-2 flex justify-between items-center lg:flex-col lg:items-stretch gap-4">
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter">CATALYST</h2>
              <p className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-0.5">Intelligence OS</p>
            </div>
            <div className="lg:hidden flex items-center gap-3">
              {activeBrand && (
                <div className="flex items-center gap-2 bg-card-bg/60 backdrop-blur-sm border border-border rounded-xl px-2.5 py-1 min-w-0 max-w-[150px] sm:max-w-[200px]">
                  <div className="min-w-0">
                    <h4 className="text-[9px] font-black text-accent uppercase tracking-wider truncate">{activeBrand.name}</h4>
                    <p className="text-[9px] font-mono font-bold text-secondary truncate select-all">{activeBrand.id}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 border-l border-border pl-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeBrand.id);
                        showToast('Brand ID copied!', 'success');
                      }}
                      className="p-1 text-secondary hover:text-accent active:scale-95 transition-all rounded"
                      title="Copy Brand ID"
                    >
                      <Copy size={11} />
                    </button>
                    <div className="relative group flex items-center">
                      <Info size={11} className="text-secondary hover:text-accent cursor-pointer transition-colors" />
                      <div className="absolute right-0 bottom-full mb-1.5 w-44 p-2 bg-foreground text-white text-[9px] font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 text-center leading-relaxed">
                        Save to access the dashboard later
                        <div className="absolute top-full right-1 border-4 border-transparent border-t-foreground"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="p-2 text-secondary hover:text-danger transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Desktop Brand Selector -> Now Desktop Brand Display & Workspace ID info */}
          {activeBrand && (
            <div className="hidden lg:flex flex-col gap-2 w-full mt-4 bg-card-bg/60 backdrop-blur-sm border border-border p-3 rounded-2xl shadow-sm">
              <div className="min-w-0">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-0.5">Workspace</h4>
                <h3 className="text-xs font-black uppercase text-foreground truncate">{activeBrand.name}</h3>
                {activeBrand.industry && (
                  <p className="text-[9px] text-secondary font-medium tracking-wide truncate mt-0.5">{activeBrand.industry}</p>
                )}
              </div>
              
              <div className="h-px bg-border my-0.5 w-full" />
              
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-wider text-secondary">Brand ID</p>
                  <p className="text-[10px] font-mono font-bold text-foreground truncate select-all">{activeBrand.id}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeBrand.id);
                      showToast('Brand ID copied!', 'success');
                    }}
                    className="p-1 text-secondary hover:text-accent hover:bg-black/5 active:scale-95 transition-all rounded-md"
                    title="Copy Brand ID"
                  >
                    <Copy size={12} />
                  </button>
                  <div className="relative group flex items-center">
                    <Info size={12} className="text-secondary hover:text-accent cursor-pointer transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 p-2 bg-foreground text-white text-[9px] font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 text-center leading-relaxed">
                      Save to access the dashboard later
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/overview`} icon={LayoutDashboard}>Overview</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/strategist`} icon={MessageSquare}>Strategist</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/campaigns`} icon={Send}>Campaigns</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/analytics`} icon={BarChart2}>Analytics</SidebarLink>
        </nav>

        <div className="hidden lg:block pt-6 border-t border-border mt-auto">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-secondary hover:bg-danger/5 hover:text-danger transition-all duration-200 font-bold text-sm uppercase tracking-wider"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto bg-transparent relative">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
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
                  <LogOut size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-danger mb-1">Confirm Action</h4>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">Logout?</h3>
                </div>
              </div>

              {/* Message */}
              <div className="flex gap-3 items-start bg-danger/5 border border-danger/10 p-3.5 rounded-2xl">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-secondary leading-relaxed font-medium">
                  Warning: logging out will clear your current workspace active session reference. If you just want to take a break, you can safely close this website window and access your dashboard directly later without logging out.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-5 py-2.5 border border-border rounded-xl font-bold text-xs uppercase tracking-wider text-secondary hover:bg-card-bg transition-all hover:text-foreground active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-[#ef4444] hover:bg-[#d93838] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                  Logout
                  <LogOut size={12} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceLayout;

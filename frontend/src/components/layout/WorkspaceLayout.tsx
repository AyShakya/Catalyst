import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Send, BarChart2, LogOut, BookOpen } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

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
      const legacyRoutes = ['overview', 'strategist', 'campaigns', 'analytics', 'docx'];
      
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
              {brands.length > 0 && activeBrand && (
                <select
                  value={activeBrand.id}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="bg-card-bg/60 backdrop-blur-sm border border-border text-foreground text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                >
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id} className="bg-white text-foreground">
                      {brand.name}
                    </option>
                  ))}
                </select>
              )}
              <button 
                onClick={handleLogout}
                className="p-2 text-secondary hover:text-danger transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Desktop Brand Selector */}
          {brands.length > 0 && activeBrand && (
            <div className="hidden lg:block w-full">
              <select
                value={activeBrand.id}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full bg-card-bg/60 backdrop-blur-sm border border-border text-foreground text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 cursor-pointer shadow-sm hover:bg-card-bg"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id} className="bg-white text-foreground">
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <nav className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/overview`} icon={LayoutDashboard}>Overview</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/strategist`} icon={MessageSquare}>Strategist</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/campaigns`} icon={Send}>Campaigns</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/analytics`} icon={BarChart2}>Analytics</SidebarLink>
          <SidebarLink to={`/workspace/${activeBrand?.id || ''}/docx`} icon={BookOpen}>Docx</SidebarLink>
        </nav>

        <div className="hidden lg:block pt-6 border-t border-border mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-secondary hover:bg-danger/5 hover:text-danger transition-all duration-200 font-bold text-sm uppercase tracking-wider"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-transparent relative">
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
    </div>
  );
};

export default WorkspaceLayout;

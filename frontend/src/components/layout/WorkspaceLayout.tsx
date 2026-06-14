import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Send, BarChart2, LogOut } from 'lucide-react';

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

  const handleLogout = () => {
    localStorage.removeItem('catalyst_brand_id');
    navigate('/');
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-card-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 xl:w-72 bg-white border-b lg:border-b-0 lg:border-r border-border flex flex-col p-4 lg:p-6 shrink-0 z-20">
        <div className="mb-4 lg:mb-10 px-2 flex justify-between items-center lg:block">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter">CATALYST</h2>
            <p className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-0.5">Intelligence OS</p>
          </div>
          <div className="lg:hidden">
            <button 
              onClick={handleLogout}
              className="p-2 text-secondary hover:text-danger transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
          <SidebarLink to="/workspace" icon={LayoutDashboard}>Overview</SidebarLink>
          <SidebarLink to="/workspace/strategist" icon={MessageSquare}>Strategist</SidebarLink>
          <SidebarLink to="/workspace/campaigns" icon={Send}>Campaigns</SidebarLink>
          <SidebarLink to="/workspace/analytics" icon={BarChart2}>Analytics</SidebarLink>
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
      <main className="flex-1 min-w-0 overflow-y-auto bg-card-bg relative">
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

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Send, BarChart2, LogOut } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => (
  <NavLink 
    to={to} 
    end
    className={({ isActive }) => `
      flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap
      ${isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-card-bg hover:text-foreground'}
    `}
  >
    <Icon size={18} />
    {children}
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
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-border flex flex-col p-4 sm:p-6">
        <div className="mb-4 lg:mb-10 px-1 sm:px-2 lg:px-4">
          <h2 className="text-2xl font-black tracking-tighter">CATALYST</h2>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-1">Intelligence OS</p>
        </div>

        <nav className="flex-1 flex lg:block gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          <SidebarLink to="/workspace" icon={LayoutDashboard}>Overview</SidebarLink>
          <SidebarLink to="/workspace/strategist" icon={MessageSquare}>Strategist</SidebarLink>
          <SidebarLink to="/workspace/campaigns" icon={Send}>Campaigns</SidebarLink>
          <SidebarLink to="/workspace/analytics" icon={BarChart2}>Analytics</SidebarLink>
        </nav>

        <div className="pt-4 lg:pt-6 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 w-full rounded-xl text-secondary hover:bg-danger/5 hover:text-danger transition-all duration-200 font-bold text-xs sm:text-sm uppercase tracking-wider"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-card-bg relative">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default WorkspaceLayout;

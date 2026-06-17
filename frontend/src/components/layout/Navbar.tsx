import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, Sparkles } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle transparent to blurred background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const hasWorkspace = !!localStorage.getItem('catalyst_brand_id');

  // Don't show this navbar in the Workspace (it has its own sidebar)
  if (location.pathname.startsWith('/workspace')) {
    return null;
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md border-b border-border py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-white group-hover:bg-accent transition-colors">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Catalyst</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-xs font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors">Platform</Link>
          <Link to="/docx" className="text-xs font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors">Docx</Link>
          <Link to="/" className="text-xs font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors">Pricing</Link>
          <Link 
            to={hasWorkspace ? "/workspace" : "/setup"} 
            className="bg-foreground text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg shadow-black/5 flex items-center gap-2"
          >
            {hasWorkspace ? 'Return to Workspace' : 'Launch Workspace'} <Rocket size={14} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-border p-6 flex flex-col gap-6 md:hidden shadow-xl"
          >
            <Link to="/" className="text-sm font-black uppercase tracking-widest text-secondary">Platform</Link>
            <Link to="/docx" className="text-sm font-black uppercase tracking-widest text-secondary">Docx</Link>
            <Link to="/" className="text-sm font-black uppercase tracking-widest text-secondary">Pricing</Link>
            <Link 
              to={hasWorkspace ? "/workspace" : "/setup"}  
              className="bg-accent text-white px-6 py-4 rounded-xl text-center font-black uppercase tracking-widest"
            >
              {hasWorkspace ? 'Return to Workspace' : 'Launch Workspace'}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

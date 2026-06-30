import React from 'react';
import { Globe, Cpu, Layers, Layout, Mail, Share2, Info } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-16 border-t border-slate-200 bg-slate-50 text-slate-800 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-black tracking-tighter text-slate-900 mb-6 uppercase flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              CATALYST
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 max-w-xs">
              The AI Marketing Strategist for modern brands. 
              Turn customer data into growth with a single prompt.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Globe size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Share2 size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Mail size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Info size={18} /></a>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● TECHNOLOGY STACK</span>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-500 font-medium">
              <li>React 19 & TypeScript</li>
              <li>Tailwind CSS v4</li>
              <li>Framer Motion</li>
              <li>Node.js & Express</li>
              <li>SQLite & SQL</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● ARCHITECTURE</span>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-500 font-medium">
              <li>AI-Native CRM</li>
              <li>Vector-Driven Discovery</li>
              <li>Multi-Channel Dispatch</li>
              <li>Real-time Analytics</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase">● PRODUCT</span>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-500 font-medium">
              <li><a href="/" className="hover:text-accent transition-colors">Home</a></li>
              <li><a href="/setup" className="hover:text-accent transition-colors">Launch Workspace</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">GitHub Repo</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-slate-400">
            © 2026 CATALYST AI. ALL RIGHTS RESERVED. BUILT FOR MODERN MARKETERS.
          </p>
          <div className="flex gap-8 text-[11px] font-medium text-slate-400">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Globe, Cpu, Layers, Layout, Mail, Share2, Info } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-20 border-t border-border bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-black mb-6">CATALYST</h3>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              The AI Marketing Strategist for modern brands. 
              Turn customer data into growth with a single prompt.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-secondary hover:text-foreground transition-colors"><Globe size={20} /></a>
              <a href="#" className="text-secondary hover:text-foreground transition-colors"><Share2 size={20} /></a>
              <a href="#" className="text-secondary hover:text-foreground transition-colors"><Mail size={20} /></a>
              <a href="#" className="text-secondary hover:text-foreground transition-colors"><Info size={20} /></a>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Cpu size={16} className="text-accent" />
              <h4 className="text-sm font-bold uppercase tracking-widest">Technology Stack</h4>
            </div>
            <ul className="space-y-4 text-sm text-secondary">
              <li>React 19 & TypeScript</li>
              <li>Tailwind CSS v4</li>
              <li>Framer Motion</li>
              <li>Node.js & Express</li>
              <li>SQLite & SQL</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Layers size={16} className="text-accent" />
              <h4 className="text-sm font-bold uppercase tracking-widest">Architecture</h4>
            </div>
            <ul className="space-y-4 text-sm text-secondary">
              <li>AI-Native CRM</li>
              <li>Vector-Driven Discovery</li>
              <li>Multi-Channel Dispatch</li>
              <li>Real-time Analytics</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Layout size={16} className="text-accent" />
              <h4 className="text-sm font-bold uppercase tracking-widest">Product</h4>
            </div>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a href="/" className="hover:text-foreground transition-colors">Home</a></li>
              <li><a href="/setup" className="hover:text-foreground transition-colors">Launch Workspace</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GitHub Repo</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary">
            © 2026 Catalyst AI. All rights reserved. Built for modern marketers.
          </p>
          <div className="flex gap-8 text-xs text-secondary">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

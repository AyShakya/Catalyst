import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

const ForecastSimulator: React.FC = () => {
  const [simAudience, setSimAudience] = useState<number>(5000);
  const [simAOV, setSimAOV] = useState<number>(85);
  const [rateDelivery, setRateDelivery] = useState<number>(90);
  const [rateOpen, setRateOpen] = useState<number>(70);
  const [rateCTR, setRateCTR] = useState<number>(30);
  const [rateConv, setRateConv] = useState<number>(10);

  const simDelivered = Math.round(simAudience * (rateDelivery / 100));
  const simOpened = Math.round(simDelivered * (rateOpen / 100));
  const simClicked = Math.round(simOpened * (rateCTR / 100));
  const simPurchased = Math.round(simClicked * (rateConv / 100));
  const simRevenue = simPurchased * simAOV;

  return (
    <div id="ai" className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-border flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Sliders className="text-accent" size={18} /> Forecast Simulator Sandbox
        </h2>
        <p className="text-xs text-secondary mt-1">
          Calculate deterministic forecasts using Catalyst's official funnel formulas. Adjust sliders to see projected metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Audience Size</span>
              <span className="text-foreground">{simAudience.toLocaleString()}</span>
            </label>
            <input 
              type="range" 
              min="100" 
              max="100000" 
              step="100"
              value={simAudience} 
              onChange={(e) => setSimAudience(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Average Order Value ($)</span>
              <span className="text-foreground">${simAOV}</span>
            </label>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="5"
              value={simAOV} 
              onChange={(e) => setSimAOV(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Delivery Rate (%)</span>
              <span className="text-foreground">{rateDelivery}%</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={rateDelivery} 
              onChange={(e) => setRateDelivery(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Open Rate (%)</span>
              <span className="text-foreground">{rateOpen}%</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={rateOpen} 
              onChange={(e) => setRateOpen(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Click-Through Rate (%)</span>
              <span className="text-foreground">{rateCTR}%</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={rateCTR} 
              onChange={(e) => setRateCTR(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-black uppercase tracking-wider text-secondary mb-1">
              <span>Conversion Rate (%)</span>
              <span className="text-foreground">{rateConv}%</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={rateConv} 
              onChange={(e) => setRateConv(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>

        <div className="border border-border/80 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-border/60 pb-2 mb-4">
            Deterministic Forecast Pipeline
          </h3>
          
          <div className="flex flex-col gap-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">1. Dispatched Target:</span>
              <span className="font-mono font-black">{simAudience.toLocaleString()} Target(s)</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">2. Delivered Messages:</span>
              <span className="font-mono font-black text-blue-600">{simDelivered.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">3. Opened Messages:</span>
              <span className="font-mono font-black text-amber-500">{simOpened.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">4. Clicked Links:</span>
              <span className="font-mono font-black text-indigo-600">{simClicked.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-border/40 pb-3">
              <span className="text-secondary font-bold">5. Conversions:</span>
              <span className="font-mono font-black text-emerald-500">{simPurchased.toLocaleString()} Purchase(s)</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">Projected Revenue:</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                ${simRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-card-bg border border-border text-[9px] text-secondary leading-relaxed font-semibold">
            Note: Real-time projections use average order value (AOV) calculated from historic data to forecast conversion impact.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastSimulator;

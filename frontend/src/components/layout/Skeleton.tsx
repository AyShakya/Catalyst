import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';


interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle' | 'text';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangle', style }) => {
  const baseClasses = "animate-pulse bg-gray-100";
  const variantClasses = {
    rectangle: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={style} />
  );
};

export const KPICardSkeleton = () => (
  <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="w-12 h-12" />
      <Skeleton className="w-12 h-6" />
    </div>
    <Skeleton variant="text" className="w-24 mb-2" />
    <Skeleton variant="text" className="w-32 h-8" />
    <Skeleton variant="text" className="w-48 mt-4" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-4xl border border-border shadow-sm w-full h-full min-h-[300px]">
    <div className="flex justify-between items-center mb-8">
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="w-24" />
    </div>
    <div className="flex items-end gap-2 h-48 sm:h-64 pt-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1" 
          style={{ height: `${Math.random() * 60 + 40}%` }} 
        />
      ))}
    </div>
  </div>
);

export const CampaignCardSkeleton = () => (
  <div className="bg-white border border-border rounded-3xl p-5 sm:p-6 flex flex-col h-full min-w-0">
    <div className="flex justify-between items-start mb-6 gap-2">
      <Skeleton className="w-12 h-12" />
      <Skeleton className="w-16 h-6" />
    </div>
    <div className="flex-1">
      <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
      <Skeleton variant="text" className="w-full mb-1" />
      <Skeleton variant="text" className="w-2/3 mb-6" />
    </div>
    <div className="space-y-4 pt-6 border-t border-border mt-auto">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-12" />
        <Skeleton variant="text" className="w-8" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <Skeleton variant="text" className="w-16 mb-1" />
          <Skeleton variant="text" className="w-12 h-6" />
        </div>
        <div>
          <Skeleton variant="text" className="w-16 mb-1" />
          <Skeleton variant="text" className="w-12 h-6" />
        </div>
      </div>
    </div>
  </div>
);

export const OpportunitySkeleton = () => (
  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between h-full">
    <div>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-6 h-6" />
      </div>
      <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
      <Skeleton variant="text" className="w-full mb-1" />
      <Skeleton variant="text" className="w-full mb-1" />
      <Skeleton variant="text" className="w-2/3 mb-6" />
    </div>
    <Skeleton className="w-full h-12 rounded-2xl" />
  </div>
);

export const MatrixSkeleton = () => (
  <div className="w-full h-full min-h-[350px] relative overflow-hidden">
    <Skeleton className="absolute inset-0" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="grid grid-cols-5 grid-rows-5 gap-4 w-3/4 h-3/4">
        {[...Array(10)].map((_, i) => (
          <Skeleton 
            key={i} 
            variant="circle" 
            className="w-4 h-4 opacity-50" 
            style={{ 
              gridColumn: Math.floor(Math.random() * 5) + 1,
              gridRow: Math.floor(Math.random() * 5) + 1
            }} 
          />
        ))}
      </div>
    </div>
  </div>
);

export const DonutSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[300px]">
    <div className="relative">
      <Skeleton variant="circle" className="w-48 h-48 sm:w-56 sm:h-56" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full" />
      </div>
    </div>
  </div>
);

export const PyramidSkeleton = () => (
  <div className="space-y-3 w-full">
    {[...Array(5)].map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-12" 
        style={{ width: `${100 - i * 15}%` }} 
      />
    ))}
  </div>
);

export const FunnelSkeleton = () => (
  <div className="space-y-6 w-full">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="flex justify-between">
          <Skeleton variant="text" className="w-16" />
          <Skeleton variant="text" className="w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    ))}
  </div>
);

export const ComparisonSkeleton = () => (
  <div className="w-full h-full flex flex-col justify-end gap-6 min-h-[300px] pt-10">
    <div className="flex items-end justify-around h-full gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-1 flex items-end gap-2 max-w-[80px]">
          <Skeleton className="flex-1 h-3/4" />
          <Skeleton className="flex-1 h-1/2" />
        </div>
      ))}
    </div>
    <div className="flex justify-around">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="text" className="w-12" />
      ))}
    </div>
  </div>
);

interface ErrorRetryPanelProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export const ErrorRetryPanel: React.FC<ErrorRetryPanelProps> = ({ 
  message = "Failed to sync connection with Catalyst Intelligence.", 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-border bg-card-bg/25 backdrop-blur-sm min-h-[250px] w-full ${className}`}>
      <div className="p-3.5 rounded-2xl bg-error/10 text-error mb-4 shrink-0 shadow-sm">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-2">Sync Connection Interrupted</h3>
      <p className="text-xs text-secondary font-medium mb-6 max-w-sm leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-accent/15"
      >
        <RotateCcw size={14} /> Retry Connection
      </button>
    </div>
  );
};


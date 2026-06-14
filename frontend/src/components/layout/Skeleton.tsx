import React from 'react';

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

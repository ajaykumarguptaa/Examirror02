import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rect' | 'circle' | 'text' | 'rounded';
}

/**
 * Base Skeleton component with high-performance CSS shimmer wave
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  ...props
}) => {
  const variantClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md h-4'
      : variant === 'rounded'
      ? 'rounded-xl'
      : 'rounded-none';

  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer select-none ${variantClass} ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton for paragraph / multiline text
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = 'space-y-2.5'
}) => {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => {
        // Vary width realistically
        const widthClass =
          i === lines - 1
            ? 'w-2/3'
            : i % 2 === 0
            ? 'w-full'
            : 'w-5/6';
        return <Skeleton key={i} className={`h-3.5 ${widthClass}`} />;
      })}
    </div>
  );
};

/**
 * Circular avatar placeholder
 */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => {
  return (
    <Skeleton
      variant="circle"
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

/**
 * Modern Card Skeleton (for Centers, Courses, Study Materials)
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 ${className}`}
      aria-hidden="true"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <SkeletonText lines={2} />
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SkeletonAvatar size={32} />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Table Skeleton (for Admin & Center Management Lists)
 */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex gap-4">
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={c} className="h-4 flex-1 rounded" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 flex-1 ${c === 0 ? 'w-1/3' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Page Skeleton for Route Suspense Fallback
 */
export const SkeletonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;

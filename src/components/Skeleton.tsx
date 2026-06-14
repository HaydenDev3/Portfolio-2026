"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-white/5 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// Common skeleton blocks for pages
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass p-4 md:p-5 rounded-2xl border border-white/10 ${className}`}>
      <div className="flex gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Skeleton className="h-3.5 w-2/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-8 w-full rounded mt-1" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-3.5 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} 
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  return <Skeleton className={`${sizes[size]} rounded-full`} />;
}

// Full page skeletons for common views
export function ForumSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ClientDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-48 rounded mb-2" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-white/10">
            <Skeleton className="h-8 w-16 rounded mb-2" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonCard />
    </div>
  );
}

export function ProjectsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass p-6 rounded-2xl border border-white/10">
          <div className="flex justify-between mb-4">
            <div>
              <Skeleton className="h-5 w-40 rounded mb-1.5" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded mb-3" />
          <div className="flex gap-2">
            {[1,2,3,4,5].map(j => (
              <Skeleton key={j} className="h-1.5 flex-1 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Live hero preview skeleton */}
      <div className="relative mb-8 -mx-4 md:mx-0">
        <div className="h-28 md:h-36 bg-white/5 rounded-none md:rounded-2xl border-b md:border border-white/10" />
        <div className="absolute left-4 -bottom-7 md:left-6 flex items-end gap-4">
          <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-2xl" />
          <div className="pb-2 space-y-1.5">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
        <Skeleton className="h-3.5 w-40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10">
        <Skeleton className="h-3.5 w-16 rounded mb-3" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";

interface InfiniteScrollProps {
  fetchMore: () => void;
  hasMore: boolean;
  loading: boolean;
  children: React.ReactNode;
}

export default function InfiniteScroll({
  fetchMore,
  hasMore,
  loading,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, loading]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </>
  );
}

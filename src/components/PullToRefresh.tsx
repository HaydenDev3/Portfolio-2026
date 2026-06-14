"use client";

import React, { useState, useRef, ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
}

export default function PullToRefresh({ onRefresh, children, threshold = 70 }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return; // only pull at top
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance > threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
    >
      {/* Pull indicator - fluent modern spinner */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center text-blue-400 transition-all pointer-events-none"
        style={{
          top: -20,
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          opacity: pullDistance > 10 ? progress : 0,
        }}
      >
        <div className={`w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full ${refreshing ? "animate-spin" : ""}`} />
      </div>

      <div
        style={{
          transform: refreshing ? "translateY(40px)" : `translateY(${pullDistance}px)`,
          transition: refreshing || pullDistance === 0 ? "transform 0.2s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

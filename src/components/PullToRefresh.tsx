"use client";

import React, { useState, useRef, ReactNode, useCallback } from "react";

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    if (distance > 0) {
      const damped = distance * 0.5;
      setPullDistance(Math.min(damped, threshold * 1.8));
    }
  }, [refreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance > threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
    >
      {/* Premium pull indicator */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10"
        style={{
          top: 0,
          height: Math.min(pullDistance, threshold + 16),
          opacity: pullDistance > 8 ? Math.min(progress * 1.2, 1) : 0,
          transform: `translateY(${Math.min(pullDistance, threshold + 16) - (threshold + 16)}px)`,
          transition: pullDistance === 0 && !refreshing ? "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease" : "none",
        }}
      >
        {/* Premium spinner with gradient */}
        <div className="relative w-7 h-7">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2.5"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="var(--accent, #3b82f6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 69.1} 69.1`}
              style={{
                transition: refreshing ? "none" : "stroke-dasharray 0.1s ease",
                transform: refreshing ? "rotate(360deg)" : undefined,
              }}
            />
          </svg>
          {refreshing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
            </div>
          )}
        </div>
        {pullDistance > threshold && !refreshing && (
          <span
            className="text-[10px] font-medium text-[var(--accent)] mt-1.5 transition-opacity duration-200"
            style={{ opacity: progress }}
          >
            Release to refresh
          </span>
        )}
      </div>

      <div
        style={{
          transform: refreshing
            ? `translateY(${threshold + 8}px)`
            : `translateY(${pullDistance}px)`,
          transition:
            refreshing
              ? "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : pullDistance === 0
              ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

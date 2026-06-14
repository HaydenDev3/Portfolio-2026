"use client";

import { useEffect, useRef, type RefObject } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(ref: RefObject<HTMLElement | null>, handlers: SwipeHandlers, threshold = 50) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) handlers.onSwipeRight?.();
        if (dx < -threshold) handlers.onSwipeLeft?.();
      } else {
        if (dy > threshold) handlers.onSwipeDown?.();
        if (dy < -threshold) handlers.onSwipeUp?.();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, handlers, threshold]);
}

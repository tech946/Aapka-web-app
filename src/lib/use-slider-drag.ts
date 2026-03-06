'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SWIPE_THRESHOLD = 50;
const MOBILE_BREAKPOINT = 768;

export function useSliderDrag({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX.current - touchEndX;

      if (deltaX > SWIPE_THRESHOLD) {
        onSwipeLeft();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        onSwipeRight();
      }
    },
    [isMobile, onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}

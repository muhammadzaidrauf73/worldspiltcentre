import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const startScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canPull = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Check if we're at the top of the page
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    startScrollY.current = scrollTop;
    
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      canPull.current = true;
    } else {
      canPull.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing || !canPull.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Only activate pull-to-refresh if:
    // 1. We're at the very top (scrollTop <= 0)
    // 2. We're pulling down (diff > 0)
    // 3. The pull distance is significant enough (diff > 15)
    if (scrollTop <= 0 && diff > 0) {
      if (diff > 15) {
        // Now we're definitely doing a pull-to-refresh
        setIsPulling(true);
        const distance = Math.min(diff * 0.4, maxPull);
        setPullDistance(distance);
        
        // Only prevent default when we're actively pulling
        if (distance > 5) {
          e.preventDefault();
        }
      }
    } else {
      // Reset if user scrolls up or we're not at top
      if (isPulling && pullDistance === 0) {
        setIsPulling(false);
        canPull.current = false;
      }
    }
  }, [isRefreshing, maxPull, isPulling, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling && pullDistance === 0) return;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.8);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
    canPull.current = false;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // All events use passive: true initially for better scroll performance
    // We manually handle preventDefault only when needed
    const options = { passive: false } as AddEventListenerOptions;
    const passiveOptions = { passive: true } as AddEventListenerOptions;

    container.addEventListener('touchstart', handleTouchStart, passiveOptions);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, passiveOptions);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
  };
}
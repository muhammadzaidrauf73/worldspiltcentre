import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

// Fixed pull-to-refresh with better sensitivity and horizontal scroll detection

export function usePullToRefresh({
  onRefresh,
  threshold = 100,
  maxPull = 150,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const startX = useRef(0);
  const isPulling = useRef(false);
  const isScrollingHorizontally = useRef(false);
  const hasActivatedPull = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    // Only activate pull-to-refresh when at the very top (within 5px tolerance)
    if (scrollTop <= 5 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      isPulling.current = true;
      isScrollingHorizontally.current = false;
      hasActivatedPull.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Detect horizontal scrolling - if horizontal movement is greater, don't trigger refresh
    if (!hasActivatedPull.current && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isScrollingHorizontally.current = true;
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    
    if (isScrollingHorizontally.current) return;
    
    // Require significant downward movement before activating (at least 30px)
    // and must be at the very top of the page
    if (scrollTop <= 5 && diffY > 30) {
      hasActivatedPull.current = true;
      const distance = Math.min((diffY - 30) * 0.35, maxPull);
      setPullDistance(distance);
      
      if (distance > 15) {
        e.preventDefault();
      }
    } else if (!hasActivatedPull.current) {
      // User is scrolling normally, disable pull-to-refresh
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current && !hasActivatedPull.current) {
      setPullDistance(0);
      return;
    }
    
    isPulling.current = false;
    isScrollingHorizontally.current = false;
    
    if (hasActivatedPull.current && pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        hasActivatedPull.current = false;
      }
    } else {
      setPullDistance(0);
      hasActivatedPull.current = false;
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchMoveOptions = { passive: false } as AddEventListenerOptions;
    const passiveOptions = { passive: true } as AddEventListenerOptions;

    container.addEventListener('touchstart', handleTouchStart, passiveOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
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

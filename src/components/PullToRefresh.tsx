import { ReactNode, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator - only show on mobile */}
      <div
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center transition-opacity duration-200 md:hidden',
          pullDistance > 10 || isRefreshing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{
          top: Math.min(Math.max(pullDistance - 40, 16), 80),
        }}
      >
        <div className={cn(
          "bg-background border border-border rounded-full p-2.5 shadow-lg transition-all duration-200",
          isRefreshing && "shadow-primary/20"
        )}>
          <RefreshCw
            className={cn(
              'h-5 w-5 text-primary transition-transform',
              isRefreshing && 'animate-spin'
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
        
        {/* Loading dots */}
        {isRefreshing && (
          <div className="mt-2 flex items-center gap-1 animate-fade-in">
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Progress bar during refresh */}
      {isRefreshing && (
        <div className="fixed inset-x-0 top-0 z-40 pointer-events-none md:hidden">
          <div className="h-0.5 bg-primary/20 overflow-hidden">
            <div 
              className="h-full w-1/3 bg-primary"
              style={{
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Content - apply pull offset only when actively pulling */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
          transition: pullDistance > 0 ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

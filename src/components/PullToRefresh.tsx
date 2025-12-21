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
    <div ref={containerRef} className={cn('relative min-h-screen', className)}>
      {/* Pull indicator with skeleton animation */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center transition-all duration-300 md:hidden',
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{
          top: Math.max(pullDistance - 50, 8),
        }}
      >
        <div className={cn(
          "bg-background border border-border rounded-full p-2.5 shadow-lg transition-all duration-300",
          isRefreshing && "shadow-primary/20"
        )}>
          <RefreshCw
            className={cn(
              'h-5 w-5 text-primary transition-transform duration-200',
              isRefreshing && 'animate-spin'
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
        
        {/* Skeleton loading indicator */}
        {isRefreshing && (
          <div className="mt-3 flex flex-col items-center gap-2 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Refreshing...</span>
          </div>
        )}
      </div>

      {/* Skeleton overlay during refresh */}
      {isRefreshing && (
        <div className="fixed inset-x-0 top-0 z-40 pointer-events-none md:hidden">
          <div className="h-1 bg-primary/20 overflow-hidden">
            <div className="h-full w-1/3 bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]" 
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
                animation: 'shimmer 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      )}

      {/* Content with pull offset */}
      <div
        className={cn(
          "transition-transform duration-200 ease-out",
          isRefreshing && "opacity-90"
        )}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

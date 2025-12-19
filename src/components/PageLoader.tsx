import { useEffect, useState } from "react";

const PageLoader = () => {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Fast progress animation
    const timers = [
      setTimeout(() => setProgress(40), 50),
      setTimeout(() => setProgress(70), 150),
      setTimeout(() => setProgress(85), 300),
      setTimeout(() => setProgress(95), 500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/50 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Center loader - minimal */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
};

export default PageLoader;

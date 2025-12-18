import { useState, useEffect, useRef } from "react";

interface FlipClockDigitProps {
  value: number;
  label: string;
}

const FlipClockDigit = ({ value, label }: FlipClockDigitProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setPreviousValue(prevValueRef.current);
      setIsFlipping(true);
      
      // Update display value after flip animation starts
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 150);

      // Reset flip state
      const resetTimer = setTimeout(() => {
        setIsFlipping(false);
      }, 600);

      prevValueRef.current = value;

      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [value]);

  const formatValue = (val: number) => String(val).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-10 sm:h-14 md:h-16 w-10 sm:w-14 md:w-16 perspective-500">
        {/* Background card */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground to-foreground/90 rounded-lg shadow-lg" />
        
        {/* Top half (static) */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-foreground to-foreground/95 rounded-t-lg overflow-hidden z-10">
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <span className="font-bold text-xl sm:text-2xl md:text-3xl font-heading text-background tabular-nums translate-y-1/2">
              {formatValue(displayValue)}
            </span>
          </div>
        </div>

        {/* Bottom half (static) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-foreground/85 to-foreground/80 rounded-b-lg overflow-hidden">
          <div className="absolute inset-0 flex items-start justify-center pt-0">
            <span className="font-bold text-xl sm:text-2xl md:text-3xl font-heading text-background/95 tabular-nums -translate-y-1/2">
              {formatValue(displayValue)}
            </span>
          </div>
        </div>

        {/* Flip card - top (flips down showing previous value) */}
        {isFlipping && (
          <div 
            className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-foreground to-foreground/95 rounded-t-lg overflow-hidden z-20 origin-bottom animate-flip-top"
          >
            <div className="absolute inset-0 flex items-end justify-center pb-0">
              <span className="font-bold text-xl sm:text-2xl md:text-3xl font-heading text-background tabular-nums translate-y-1/2">
                {formatValue(previousValue)}
              </span>
            </div>
          </div>
        )}

        {/* Flip card - bottom (flips down revealing new value) */}
        {isFlipping && (
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-foreground/85 to-foreground/80 rounded-b-lg overflow-hidden z-20 origin-top animate-flip-bottom"
          >
            <div className="absolute inset-0 flex items-start justify-center pt-0">
              <span className="font-bold text-xl sm:text-2xl md:text-3xl font-heading text-background/95 tabular-nums -translate-y-1/2">
                {formatValue(displayValue)}
              </span>
            </div>
          </div>
        )}

        {/* Center line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/20 z-30" />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-lg pointer-events-none z-30" />
      </div>
      
      <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold mt-1 sm:mt-1.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default FlipClockDigit;

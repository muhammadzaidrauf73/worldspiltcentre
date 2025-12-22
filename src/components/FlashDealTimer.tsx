import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface FlashDealTimerProps {
  endsAt: string;
  compact?: boolean;
}

export function FlashDealTimer({ endsAt, compact = false }: FlashDealTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        return null;
      }

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (!newTimeLeft) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  if (!timeLeft) {
    return null;
  }

  const formatNum = (num: number) => num.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-deal font-medium">
        <Clock className="h-3 w-3" />
        <span>
          {formatNum(timeLeft.hours)}:{formatNum(timeLeft.minutes)}:{formatNum(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-deal/10 border border-deal/20">
      <Clock className="h-3.5 w-3.5 text-deal" />
      <span className="text-xs text-deal font-medium">
        Ends in {formatNum(timeLeft.hours)}h {formatNum(timeLeft.minutes)}m {formatNum(timeLeft.seconds)}s
      </span>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowRight, Timer, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FlashDealItem {
  id: string;
  name: string;
  original_price: number;
  deal_price: number;
  image_url: string | null;
  sold_percentage: number;
  ends_at: string;
  product_id: string | null;
}

const FlashDeal = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["flash-deals-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_deals")
        .select("*")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("display_order", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as FlashDealItem[];
    },
  });

  useEffect(() => {
    if (!deals || deals.length === 0) return;

    const nearestEnd = deals.reduce((min, deal) => {
      const endTime = new Date(deal.ends_at).getTime();
      return endTime < min ? endTime : min;
    }, new Date(deals[0].ends_at).getTime());

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, nearestEnd - now);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [deals]);

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden" id="deals">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 via-red-500/6 to-orange-500/8 dark:from-rose-500/15 dark:via-red-500/10 dark:to-orange-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-rose-300/25 to-red-300/25 dark:from-rose-500/15 dark:to-red-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-red-300/25 to-orange-300/25 dark:from-red-500/15 dark:to-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-16 right-[12%] opacity-30 dark:opacity-20">
        <Zap className="h-8 w-8 text-rose-500 animate-pulse" style={{ animationDuration: '1.5s' }} />
      </div>
      <div className="absolute bottom-20 left-[8%] opacity-30 dark:opacity-20">
        <Flame className="h-7 w-7 text-orange-500 animate-bounce" style={{ animationDuration: '2s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with unified styling */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Premium animated icon */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-rose-400 via-red-500 to-orange-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-400/40 to-red-400/40 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/40">
                <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" fill="currentColor" />
              </div>
              <Flame className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1s' }} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 dark:from-rose-400 dark:via-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Flash Deals
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 dark:from-red-500/30 dark:to-orange-500/30 text-red-700 dark:text-red-300 text-[10px] sm:text-xs font-bold border border-red-300/50 dark:border-red-500/30 backdrop-blur-sm animate-pulse" style={{ animationDuration: '2s' }}>
                  <Zap className="h-3 w-3" />
                  LIMITED
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                Grab before they're gone!
              </p>
            </div>
          </div>

          {/* Enhanced Countdown Timer */}
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-red-200/50 dark:border-red-500/20 shadow-lg">
            <div className="hidden sm:flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Ends In
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xl font-bold text-red-500">:</span>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xl font-bold text-red-500">:</span>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg animate-pulse" style={{ animationDuration: '1s' }}>
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Row */}
        <div className="min-h-[140px]">
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 min-w-[260px] rounded-2xl flex-shrink-0" />
              ))}
            </div>
          ) : !deals || deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-muted-foreground font-medium">
                No active flash deals at the moment
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Check back soon for amazing offers!
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {deals.map((deal, index) => (
                <Link
                  key={deal.id}
                  to={deal.product_id ? `/product/${deal.product_id}` : `/products?deals=true`}
                  className="group relative bg-white/70 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-500/20 overflow-hidden shadow-lg hover:shadow-xl hover:border-red-400/50 transition-all duration-300 animate-fade-in min-w-[260px] max-w-[260px] flex-shrink-0 snap-start"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Deal badge */}
                  <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold shadow-lg">
                    {Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100)}% OFF
                  </div>
                  
                  <div className="flex gap-4 p-4">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={deal.image_url || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300"}
                        alt={deal.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {deal.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-lg text-red-600 dark:text-red-400">
                            Rs.{deal.deal_price.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            Rs.{deal.original_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="h-2 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${deal.sold_percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          🔥 {deal.sold_percentage}% sold
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6 sm:mt-8">
          <Link to="/products?deals=true">
            <Button 
              variant="outline"
              className="group relative overflow-hidden border-red-300/50 dark:border-red-500/30 bg-white/50 dark:bg-red-950/30 backdrop-blur-sm hover:border-red-500 text-red-600 dark:text-red-300 h-11 px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
            >
              <span className="relative z-10 flex items-center font-semibold">
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashDeal;

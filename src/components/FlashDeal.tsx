import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FlipClockDigit from "@/components/FlipClockDigit";

interface FlashDealItem {
  id: string;
  name: string;
  original_price: number;
  deal_price: number;
  image_url: string | null;
  sold_percentage: number;
  ends_at: string;
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

  // Calculate countdown from nearest ending deal
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
    <section className="py-8 sm:py-12 relative overflow-hidden" id="deals">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-deal/10 via-primary/5 to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--deal)/0.15)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--primary)/0.1)_0%,_transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with enhanced styling */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-deal/30 animate-ping" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-deal to-primary flex items-center justify-center shadow-lg shadow-deal/30">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="currentColor" />
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-deal via-primary to-deal bg-clip-text text-transparent">
                Flash Deals
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Limited time offers! Grab them before they're gone
              </p>
            </div>
          </div>

          {/* Enhanced Countdown Timer */}
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-deal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-deal"></span>
              </span>
              <span className="text-sm font-semibold text-deal uppercase tracking-widest">
                Ends In
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl font-bold text-background font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">Hours</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-deal animate-pulse mb-5">:</span>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl font-bold text-background font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">Minutes</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-deal animate-pulse mb-5">:</span>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-deal to-primary flex items-center justify-center shadow-lg shadow-deal/30 animate-pulse">
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">Seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="min-h-[140px] sm:min-h-[160px]">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 sm:h-40 rounded-xl" />
              ))}
            </div>
          ) : !deals || deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-base sm:text-lg font-medium">
                No active flash deals at the moment
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Check back soon for amazing offers!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {deals.map((deal, index) => (
                <Link
                  key={deal.id}
                  to={`/product/${deal.id}`}
                  className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden shadow-lg hover:shadow-xl hover:border-deal/30 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Deal badge */}
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-deal text-deal-foreground text-xs font-bold shadow-lg">
                    {Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100)}% OFF
                  </div>
                  
                  <div className="flex gap-4 p-4 sm:p-5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={deal.image_url || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300"}
                        alt={deal.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-deal transition-colors">
                          {deal.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-xl sm:text-2xl text-deal">
                            Rs.{deal.deal_price.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground line-through">
                          Rs.{deal.original_price.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="mt-3 space-y-1.5">
                        <div className="h-2 sm:h-2.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-deal to-primary rounded-full transition-all duration-500 relative"
                            style={{ width: `${deal.sold_percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground font-medium">
                            🔥 {deal.sold_percentage}% sold
                          </p>
                          <p className="text-xs text-deal font-semibold">
                            Hurry!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center mt-8">
          <Link to="/products?deals=true">
            <Button 
              className="bg-gradient-to-r from-deal to-primary hover:from-deal/90 hover:to-primary/90 text-white font-semibold px-6 py-3 h-auto rounded-full shadow-lg shadow-deal/25 hover:shadow-xl hover:shadow-deal/30 transition-all duration-300 hover:scale-105"
            >
              View All Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashDeal;

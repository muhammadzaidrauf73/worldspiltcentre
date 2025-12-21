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
    <section className="py-5 sm:py-6 relative overflow-hidden" id="deals">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-deal/5 via-transparent to-primary/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-deal/30 animate-ping" />
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-deal to-primary flex items-center justify-center shadow-md">
                <Zap className="h-5 w-5 sm:h-5 sm:w-5 text-white" fill="currentColor" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold bg-gradient-to-r from-deal via-primary to-deal bg-clip-text text-transparent">
                Flash Deals
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Limited time offers!
              </p>
            </div>
          </div>

          {/* Compact Countdown Timer */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
            <span className="text-xs font-semibold text-deal uppercase tracking-wide hidden sm:block">
              Ends In:
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-base sm:text-lg font-bold text-background font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-lg font-bold text-deal">:</span>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-base sm:text-lg font-bold text-background font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-lg font-bold text-deal">:</span>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-deal to-primary flex items-center justify-center animate-pulse">
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
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
                  to={deal.product_id ? `/product/${deal.product_id}` : `/products?deals=true`}
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

        <div className="flex justify-center mt-5">
          <Link to="/products?deals=true">
            <Button 
              variant="outline"
              className="border-deal text-deal hover:bg-deal hover:text-white font-semibold px-5 py-2 h-auto rounded-full transition-all duration-300 hover:scale-105"
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

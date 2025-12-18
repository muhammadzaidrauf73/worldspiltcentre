import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowRight } from "lucide-react";
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
    <section className="py-6 sm:py-8 bg-gradient-to-r from-deal/5 via-primary/5 to-deal/5" id="deals">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-deal flex items-center justify-center animate-pulse">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-deal-foreground" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground">
                Flash Deals
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Limited time offers!
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-xs font-medium text-deal uppercase tracking-wider flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-deal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-deal"></span>
              </span>
              Ends in
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { value: timeLeft.hours, label: "HRS" },
                { value: timeLeft.minutes, label: "MIN" },
                { value: timeLeft.seconds, label: "SEC" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1 sm:gap-2">
                  <div className="flex flex-col items-center">
                    <div className="relative bg-gradient-to-b from-deal to-deal/80 text-deal-foreground rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-[2.5rem] sm:min-w-[3.5rem] text-center shadow-lg">
                      <span className="font-bold text-lg sm:text-2xl md:text-3xl font-heading tabular-nums">
                        {String(item.value).padStart(2, "0")}
                      </span>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-black/10"></div>
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 sm:mt-1">
                      {item.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <span className="text-deal font-bold text-lg sm:text-2xl animate-pulse mb-3 sm:mb-4">:</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 sm:h-32 rounded-lg" />
            ))}
          </div>
        ) : !deals || deals.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
            No active flash deals at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {deals.map((deal, index) => (
              <Link
                key={deal.id}
                to={`/product/${deal.id}`}
                className="group bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-lg transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                    <img
                      src={deal.image_url || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300"}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2">
                      {deal.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <span className="font-bold text-base sm:text-lg text-deal">
                        Rs.{deal.deal_price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground line-through block mb-1.5 sm:mb-2">
                      Rs.{deal.original_price.toLocaleString()}
                    </span>
                    {/* Progress Bar */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="h-1 sm:h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-deal rounded-full transition-all duration-500"
                          style={{ width: `${deal.sold_percentage}%` }}
                        />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {deal.sold_percentage}% sold
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Link to="/products?deals=true">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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

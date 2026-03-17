import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";
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
  products?: { slug: string } | null;
}

const FlashDeal = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["flash-deals-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_deals")
        .select("*, products(slug)")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("display_order", { ascending: true })
        .limit(6);

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
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [deals]);

  if (!isLoading && (!deals || deals.length === 0)) {
    return null;
  }

  return (
    <section className="py-4 sm:py-6 bg-primary" id="deals">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            <h2 className="text-lg sm:text-xl font-bold text-primary-foreground">
              Flash Sale
            </h2>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-primary-foreground/80 mr-2 hidden sm:inline">Ends in</span>
            <div className="flex items-center gap-1">
              {timeLeft.days > 0 && (
                <>
                  <span className="bg-foreground text-background text-sm font-bold px-2 py-1 rounded">
                    {String(timeLeft.days).padStart(2, '0')}d
                  </span>
                  <span className="text-primary-foreground font-bold">:</span>
                </>
              )}
              <span className="bg-foreground text-background text-sm font-bold px-2 py-1 rounded">
                {String(timeLeft.hours).padStart(2, '0')}h
              </span>
              <span className="text-primary-foreground font-bold">:</span>
              <span className="bg-foreground text-background text-sm font-bold px-2 py-1 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </span>
              <span className="text-primary-foreground font-bold">:</span>
              <span className="bg-foreground text-background text-sm font-bold px-2 py-1 rounded">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>

        {/* Deals Row */}
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 w-36 rounded-lg shrink-0 bg-primary-foreground/20" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {deals?.map((deal) => (
              <Link
                key={deal.id}
                to={deal.products?.slug ? `/product/${deal.products.slug}` : `/products?deals=true`}
                className="shrink-0 w-36 bg-white rounded-lg overflow-hidden"
              >
                <div className="relative aspect-square bg-secondary">
                  <img
                    src={deal.image_url || "/placeholder.svg"}
                    alt={deal.name}
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100)}% OFF
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-foreground text-xs font-medium line-clamp-2 min-h-[2rem] mb-1">
                    {deal.name}
                  </p>
                  <p className="text-primary font-bold text-sm">
                    Rs.{deal.deal_price.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs line-through">
                    Rs.{deal.original_price.toLocaleString()}
                  </p>
                  {/* Progress Bar */}
                  <div className="mt-1.5">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${deal.sold_percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {deal.sold_percentage}% sold
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FlashDeal;

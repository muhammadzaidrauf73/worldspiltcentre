import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FlashDeal = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const deals = [
    {
      id: "1",
      name: "Samsung 55\" 4K Smart TV",
      originalPrice: 799,
      dealPrice: 499,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300",
      soldPercentage: 75,
    },
    {
      id: "2",
      name: "LG Inverter AC 1.5 Ton",
      originalPrice: 699,
      dealPrice: 449,
      image: "https://images.unsplash.com/photo-1631545806609-11e3a851df1e?w=300",
      soldPercentage: 60,
    },
    {
      id: "3",
      name: "Whirlpool Washing Machine",
      originalPrice: 599,
      dealPrice: 399,
      image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
      soldPercentage: 85,
    },
  ];

  return (
    <section className="py-10 bg-gradient-to-r from-deal/5 via-accent/5 to-deal/5" id="deals">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-deal flex items-center justify-center animate-pulse">
              <Zap className="h-6 w-6 text-deal-foreground" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Flash Deals
              </h2>
              <p className="text-sm text-muted-foreground">
                Limited time offers - Don't miss out!
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Ends in:</span>
            {[
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sec" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 min-w-[3rem] text-center">
                  <span className="font-bold text-xl">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                {i < 2 && <span className="text-foreground font-bold">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deals.map((deal, index) => (
            <Link
              key={deal.id}
              to={`/product/${deal.id}`}
              className="group bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-4 p-4">
                <div className="w-24 h-24 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                    {deal.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-deal">
                      ${deal.dealPrice}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${deal.originalPrice}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-deal rounded-full transition-all duration-500"
                        style={{ width: `${deal.soldPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deal.soldPercentage}% sold
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link to="/products?deals=true">
            <Button variant="outline" className="border-deal text-deal hover:bg-deal hover:text-deal-foreground">
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

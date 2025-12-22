import { Star, Quote, MessageCircle, Users, ThumbsUp } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Ahmed Khan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    rating: 5,
    review: "Excellent service! Bought a Samsung TV and the delivery was super fast. The team helped with installation too. Highly recommend!",
    product: "Samsung 65\" QLED TV",
    date: "2 weeks ago",
  },
  {
    id: 2,
    name: "Fatima Ali",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    rating: 5,
    review: "Best electronics store! Great prices and amazing after-sales support. My go-to place for all appliances.",
    product: "LG Washing Machine",
    date: "1 month ago",
  },
  {
    id: 3,
    name: "Hassan Raza",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    rating: 4,
    review: "Very happy with my purchase. The staff was knowledgeable and helped me choose the perfect refrigerator for my needs.",
    product: "Whirlpool Refrigerator",
    date: "3 weeks ago",
  },
];

const CustomerReviews = () => {
  return (
    <section className="py-8 sm:py-14 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-yellow-500/6 to-orange-500/8 dark:from-amber-500/15 dark:via-yellow-500/10 dark:to-orange-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-amber-300/25 to-yellow-300/25 dark:from-amber-500/15 dark:to-yellow-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-yellow-300/25 to-orange-300/25 dark:from-yellow-500/15 dark:to-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-16 right-[15%] opacity-30 dark:opacity-20">
        <Star className="h-7 w-7 text-amber-500 fill-amber-500 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-20 left-[10%] opacity-30 dark:opacity-20">
        <ThumbsUp className="h-6 w-6 text-yellow-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Unified Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10">
          <div className="flex items-center gap-4 sm:gap-5 mb-4">
            {/* Premium animated icon */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              <Star className="absolute -top-2 -right-2 h-5 w-5 text-yellow-300 fill-yellow-300 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 dark:from-amber-400 dark:via-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
              Customer Reviews
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 dark:from-amber-500/30 dark:to-yellow-500/30 text-amber-700 dark:text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-300/50 dark:border-amber-500/30 backdrop-blur-sm">
              <Users className="h-3 w-3" />
              VERIFIED
            </span>
          </div>
          
          {/* Rating summary */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-lg text-foreground">4.8/5</span>
            <span className="text-muted-foreground text-sm">(2,453 reviews)</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="group relative bg-white/70 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-amber-200/50 dark:border-amber-500/20 hover:border-amber-400/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4">
                <Quote className="h-8 w-8 text-amber-200 dark:text-amber-800" />
              </div>
              
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p className="text-foreground text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed">
                "{review.review}"
              </p>

              {/* Author info */}
              <div className="flex items-center gap-3 pt-4 border-t border-amber-200/50 dark:border-amber-500/20">
                <div className="relative">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-200 dark:border-amber-700"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <ThumbsUp className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {review.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {review.product} • {review.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-amber-200/50 dark:border-amber-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">2,453</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Star className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">4.8★</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Avg. Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-orange-200/50 dark:border-orange-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">98%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Recommend</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;

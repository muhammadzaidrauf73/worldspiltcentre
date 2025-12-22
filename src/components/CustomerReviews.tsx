import { Star, Quote, MessageCircle } from "lucide-react";

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
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
            Customer Reviews
          </h2>
          
          {/* Rating summary */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="font-bold text-foreground">4.8/5</span>
            <span className="text-muted-foreground text-sm">(2,453 reviews)</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="group relative bg-card backdrop-blur-sm rounded-2xl p-5 border border-border hover:border-primary/30 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4">
                <Quote className="h-6 w-6 text-primary/10" />
              </div>
              
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p className="text-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                "{review.review}"
              </p>

              {/* Author info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                />
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.product} • {review.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;

import { Star, Quote } from "lucide-react";

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
    <section className="py-10 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
            What Our Customers Say
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Don't just take our word for it
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="font-semibold text-foreground text-sm">4.8/5</span>
            <span className="text-muted-foreground text-sm">(2,453 reviews)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-secondary/50 rounded-lg p-5 border border-border hover:shadow-md transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="h-6 w-6 text-primary/30 mb-3" />
              
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              <p className="text-foreground text-sm mb-4 line-clamp-4">
                "{review.review}"
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-9 h-9 rounded-full object-cover"
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

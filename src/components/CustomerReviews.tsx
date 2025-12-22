import { Star } from "lucide-react";

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
    <section className="py-4 sm:py-6 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
          Customer Reviews
        </h2>

        {/* Reviews scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="shrink-0 w-72 bg-white rounded-lg p-4 border border-border"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p className="text-foreground text-sm mb-3 line-clamp-2">
                {review.review}
              </p>

              {/* Author info */}
              <div className="flex items-center gap-2">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.product}
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

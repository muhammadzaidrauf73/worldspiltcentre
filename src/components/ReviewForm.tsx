import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ShoppingBag, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const ReviewForm = ({ productId, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [location, setLocation] = useState("");

  // Check if user has purchased this product
  const { data: hasPurchased, isLoading: checkingPurchase } = useQuery({
    queryKey: ["has-purchased", productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data: orders, error } = await supabase
        .from("orders")
        .select("items")
        .eq("user_id", user.id)
        .in("status", ["delivered", "shipped", "processing"]);
      
      if (error) return false;
      
      // Check if any order contains this product
      return orders?.some((order) => {
        const items = order.items as unknown as OrderItem[];
        return Array.isArray(items) && items.some((item) => item.id === productId);
      }) || false;
    },
    enabled: !!user,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (!hasPurchased) throw new Error("You must purchase this product to review it");
      if (rating === 0) throw new Error("Please select a rating");

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        reviewer_name: reviewerName.trim() || null,
        reviewer_location: location.trim() || null,
        is_approved: false,
        is_verified_purchase: true, // Automatically verified since we checked
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      toast.success("Review submitted! It will appear after approval.");
      setRating(0);
      setTitle("");
      setComment("");
      setReviewerName("");
      setLocation("");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  if (!user) {
    return (
      <div className="bg-secondary/30 rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-3">Please sign in to write a review</p>
        <Button variant="outline" asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (checkingPurchase) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="bg-secondary/30 rounded-lg p-6 text-center">
        <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="font-medium text-foreground mb-1">Purchase to Review</p>
        <p className="text-sm text-muted-foreground mb-4">
          Only customers who have purchased this product can write a review
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span>Verified purchases only</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Write a Review</h3>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitReview.mutate();
        }}
        className="space-y-4"
      >
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Your Rating *</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    (hoverRating || rating) >= star
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted-foreground"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select rating"}
            </span>
          </div>
        </div>

        {/* Reviewer Name */}
        <div className="space-y-2">
          <Label htmlFor="reviewerName">Your Name (optional)</Label>
          <Input
            id="reviewerName"
            placeholder="How should we display your name?"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">City (optional)</Label>
          <Input
            id="location"
            placeholder="e.g. Lahore"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Review Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Review Title (optional)</Label>
          <Input
            id="title"
            placeholder="Summarize your experience"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Review Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Your Review (optional)</Label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/1000
          </p>
        </div>

        <Button
          type="submit"
          disabled={rating === 0 || submitReview.isPending}
          className="w-full sm:w-auto"
        >
          {submitReview.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
};

export default ReviewForm;

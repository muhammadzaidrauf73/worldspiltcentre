import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
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

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (rating === 0) throw new Error("Please select a rating");

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        reviewer_name: reviewerName.trim() || null,
        reviewer_location: location.trim() || null,
        is_approved: false, // Reviews need approval
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
          <a href="/auth">Sign In</a>
        </Button>
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

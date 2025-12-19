import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Search, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          products:product_id (name, slug, image_url)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-review-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.id] = p.full_name || "Anonymous";
    return acc;
  }, {} as Record<string, string>);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
    onError: (error) => {
      toast.error("Error deleting review: " + error.message);
    },
  });

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchQuery === "" ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.products as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profileMap[review.user_id]?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Reviews
          </h1>
          <p className="text-muted-foreground">
            Moderate product reviews and customer feedback
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">{averageRating}</p>
              <Star className="h-5 w-5 fill-primary text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">5-Star Reviews</p>
            <p className="text-2xl font-bold text-green-500">
              {reviews.filter((r) => r.rating === 5).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Verified Purchases</p>
            <p className="text-2xl font-bold text-primary">
              {reviews.filter((r) => r.is_verified_purchase).length}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="hidden md:table-cell">Review</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={(review.products as any)?.image_url || "/placeholder.svg"}
                          alt={(review.products as any)?.name || "Product"}
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                        />
                        <span className="font-medium text-foreground line-clamp-1 max-w-[150px]">
                          {(review.products as any)?.name || "Unknown Product"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                          {profileMap[review.user_id] || "Anonymous"}
                        </span>
                        {review.is_verified_purchase && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-[300px]">
                        {review.title && (
                          <p className="font-medium text-foreground text-sm">{review.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.comment || "No comment"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Delete this review?")) {
                            deleteMutation.mutate(review.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Image as ImageIcon, Search, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import GalleryUpload from "@/components/admin/GalleryUpload";

interface ReviewForm {
  product_id: string;
  reviewer_name: string;
  reviewer_location: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  is_approved: boolean;
  is_featured: boolean;
  is_verified_purchase: boolean;
}

const emptyForm: ReviewForm = {
  product_id: "",
  reviewer_name: "",
  reviewer_location: "",
  rating: 5,
  title: "",
  comment: "",
  images: [],
  is_approved: true,
  is_featured: false,
  is_verified_purchase: true,
};

const pakistanCities = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Larkana"
];

const AdminReviews = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products:product_id (name, slug, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ReviewForm & { id?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const reviewData = {
        product_id: data.product_id,
        reviewer_name: data.reviewer_name,
        reviewer_location: data.reviewer_location,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images,
        is_approved: data.is_approved,
        is_featured: data.is_featured,
        is_verified_purchase: data.is_verified_purchase,
        user_id: userData.user?.id,
      };
      
      if (data.id) {
        const { error } = await supabase
          .from("product_reviews")
          .update(reviewData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_reviews")
          .insert(reviewData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(editingId ? "Review updated!" : "Review added!");
      setIsOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted!");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleEdit = (review: any) => {
    setEditingId(review.id);
    setForm({
      product_id: review.product_id,
      reviewer_name: review.reviewer_name || "",
      reviewer_location: review.reviewer_location || "",
      rating: review.rating,
      title: review.title || "",
      comment: review.comment || "",
      images: review.images || [],
      is_approved: review.is_approved ?? true,
      is_featured: review.is_featured ?? false,
      is_verified_purchase: review.is_verified_purchase ?? true,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.product_id || !form.reviewer_name || !form.comment) {
      toast.error("Please fill all required fields");
      return;
    }
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review: any) => {
    const matchesSearch =
      searchQuery === "" ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.products as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Reviews
            </h1>
            <p className="text-muted-foreground">
              Add and manage Pakistani customer reviews with photos
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setForm(emptyForm);
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Review" : "Add New Review"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Product *</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reviewer Name *</Label>
                    <Input
                      value={form.reviewer_name}
                      onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
                      placeholder="e.g., Muhammad Ali"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Select value={form.reviewer_location} onValueChange={(v) => setForm({ ...form, reviewer_location: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {pakistanCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${star <= form.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Review Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Best AC I've ever bought!"
                  />
                </div>

                <div>
                  <Label>Review Comment *</Label>
                  <Textarea
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    placeholder="Write the customer review..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Review Images</Label>
                  <GalleryUpload
                    value={form.images}
                    onChange={(images) => setForm({ ...form, images })}
                    maxImages={5}
                    folder="reviews"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_approved}
                      onCheckedChange={(checked) => setForm({ ...form, is_approved: checked })}
                    />
                    <Label>Approved</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_featured}
                      onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_verified_purchase}
                      onCheckedChange={(checked) => setForm({ ...form, is_verified_purchase: checked })}
                    />
                    <Label>Verified Purchase</Label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update Review" : "Add Review"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
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
              {reviews.filter((r: any) => r.rating === 5).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">With Images</p>
            <p className="text-2xl font-bold text-primary">
              {reviews.filter((r: any) => r.images?.length > 0).length}
            </p>
          </div>
        </div>

        {/* Filters */}
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

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="hidden md:table-cell">Review</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reviews found. Add your first review!
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review: any) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={(review.products as any)?.image_url || "/placeholder.svg"}
                          alt={(review.products as any)?.name || "Product"}
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                        />
                        <span className="font-medium text-foreground line-clamp-1 max-w-[120px]">
                          {(review.products as any)?.name || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{review.reviewer_name || "Anonymous"}</p>
                          {review.is_verified_purchase && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{review.reviewer_location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-[200px]">
                        {review.title && (
                          <p className="font-medium text-foreground text-sm line-clamp-1">{review.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {review.comment || "No comment"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.images?.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          <span>{review.images.length}</span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {review.is_approved && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded w-fit">Approved</span>
                        )}
                        {review.is_featured && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded w-fit">Featured</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(review)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this review?")) {
                              deleteMutation.mutate(review.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

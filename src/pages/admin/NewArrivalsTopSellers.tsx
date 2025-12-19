import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Package } from "lucide-react";

const NewArrivalsTopSellers = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, image_url, price, is_new_arrival, is_top_seller, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      productId,
      field,
      value,
    }: {
      productId: string;
      field: "is_new_arrival" | "is_top_seller";
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({ [field]: value })
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-sections"] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    },
  });

  const handleToggle = (
    productId: string,
    field: "is_new_arrival" | "is_top_seller",
    currentValue: boolean
  ) => {
    updateMutation.mutate({ productId, field, value: !currentValue });
  };

  const newArrivals = products?.filter((p) => p.is_new_arrival) || [];
  const topSellers = products?.filter((p) => p.is_top_seller) || [];

  const ProductCard = ({
    product,
    field,
    isSelected,
  }: {
    product: (typeof products)[0];
    field: "is_new_arrival" | "is_top_seller";
    isSelected: boolean;
  }) => (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <img
        src={product.image_url || "/placeholder.svg"}
        alt={product.name}
        className="w-16 h-16 object-contain rounded-md bg-muted"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{product.name}</h4>
        <p className="text-sm text-muted-foreground">{product.brand}</p>
        <p className="text-sm font-semibold text-primary">
          Rs. {product.price?.toLocaleString()}
        </p>
      </div>
      <Switch
        checked={isSelected}
        onCheckedChange={() => handleToggle(product.id, field, isSelected)}
        disabled={updateMutation.isPending}
      />
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Featured Sections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage products displayed in New Arrivals and Top Sellers sections
          </p>
        </div>

        <Tabs defaultValue="new-arrivals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new-arrivals" className="gap-2">
              <Sparkles className="h-4 w-4" />
              New Arrivals ({newArrivals.length})
            </TabsTrigger>
            <TabsTrigger value="top-sellers" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Sellers ({topSellers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-arrivals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Selected New Arrivals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newArrivals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No products selected for New Arrivals section
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {newArrivals.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        field="is_new_arrival"
                        isSelected={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                  {products?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      field="is_new_arrival"
                      isSelected={product.is_new_arrival || false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-sellers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Selected Top Sellers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topSellers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No products selected for Top Sellers section
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {topSellers.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        field="is_top_seller"
                        isSelected={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                  {products?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      field="is_top_seller"
                      isSelected={product.is_top_seller || false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default NewArrivalsTopSellers;

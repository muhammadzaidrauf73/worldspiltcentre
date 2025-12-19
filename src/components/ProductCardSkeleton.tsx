import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    {/* Image skeleton */}
    <div className="aspect-[4/3] sm:aspect-square bg-secondary/30">
      <Skeleton className="w-full h-full" />
    </div>
    
    {/* Content skeleton */}
    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      {/* Brand */}
      <Skeleton className="h-3 w-16" />
      
      {/* Name */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-8" />
      </div>
      
      {/* Price */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Button */}
      <Skeleton className="h-10 sm:h-11 w-full mt-2 rounded-lg" />
      
      {/* Mobile actions */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: ProductCardSkeletonProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const ProductListSkeleton = ({ count = 4 }: ProductCardSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-4 bg-card rounded-xl border border-border p-4">
        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ProductCardSkeleton;

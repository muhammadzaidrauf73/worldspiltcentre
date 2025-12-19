import { Link, LinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";

// Preload functions for critical pages
const preloadMap: Record<string, () => Promise<any>> = {
  '/products': () => import("@/pages/Products"),
  '/auth': () => import("@/pages/Auth"),
  '/cart': () => import("@/pages/Cart"),
  '/product': () => import("@/pages/ProductDetail"),
};

interface PreloadLinkProps extends LinkProps {
  preloadOnHover?: boolean;
}

const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  ({ preloadOnHover = true, to, children, onMouseEnter, ...props }, ref) => {
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (preloadOnHover && typeof to === "string") {
          // Check if the link matches any preload pattern
          const matchedKey = Object.keys(preloadMap).find((key) => 
            to.startsWith(key)
          );
          
          if (matchedKey) {
            preloadMap[matchedKey]();
          }
        }
        onMouseEnter?.(e);
      },
      [preloadOnHover, to, onMouseEnter]
    );

    return (
      <Link ref={ref} to={to} onMouseEnter={handleMouseEnter} {...props}>
        {children}
      </Link>
    );
  }
);

PreloadLink.displayName = "PreloadLink";

export default PreloadLink;

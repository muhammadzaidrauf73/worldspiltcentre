import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Use useLayoutEffect for synchronous scroll before paint
  useLayoutEffect(() => {
    // Scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Fallback with useEffect
  useEffect(() => {
    // Double-check scroll position after render
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

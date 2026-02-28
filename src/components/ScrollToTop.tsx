import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const scrollAllToTop = (behavior: ScrollBehavior) => {
  // Window scroll (most pages)
  window.scrollTo({ top: 0, left: 0, behavior });

  // Document scrolling element fallbacks
  const se = document.scrollingElement as HTMLElement | null;
  if (se) se.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const ScrollToTop = () => {
  const location = useLocation();

  const key = `${location.key}|${location.pathname}|${location.search}|${location.hash}`;

  useLayoutEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return;
      }
    }

    // Instant scroll to guarantee top position immediately
    scrollAllToTop("instant" as ScrollBehavior);
  }, [key]);

  useEffect(() => {
    // Enforce top after lazy content renders
    const raf = requestAnimationFrame(() => scrollAllToTop("instant" as ScrollBehavior));
    const t1 = setTimeout(() => scrollAllToTop("instant" as ScrollBehavior), 100);
    const t2 = setTimeout(() => scrollAllToTop("instant" as ScrollBehavior), 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [key]);

  return null;
};

export default ScrollToTop;

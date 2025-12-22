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

  // Trigger on every navigation (including search/query changes)
  const key = `${location.key}|${location.pathname}|${location.search}|${location.hash}`;

  useLayoutEffect(() => {
    // If there's an anchor hash, scroll to it; otherwise go to top.
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // Smooth scroll + hard fallback to guarantee we end at top
    scrollAllToTop("smooth");
  }, [key]);

  useEffect(() => {
    // After route content finishes rendering/lazy loading, enforce top again.
    const raf = requestAnimationFrame(() => scrollAllToTop("smooth"));
    const t1 = setTimeout(() => scrollAllToTop("smooth"), 150);
    const t2 = setTimeout(() => scrollAllToTop("auto"), 700);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [key]);

  return null;
};

export default ScrollToTop;

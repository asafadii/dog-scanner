"use client";

import { useEffect, useState, useRef } from "react";

export function useScrollDirection(threshold = 8) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const diff = currentY - lastY.current;

      if (currentY < threshold) {
        setHidden(false);
      } else if (Math.abs(diff) > threshold) {
        setHidden(diff > 0);
        lastY.current = currentY;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return hidden;
}

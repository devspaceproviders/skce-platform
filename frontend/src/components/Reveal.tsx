"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "none";

type RevealProps = {
  children: ReactNode;
  /** Delay in ms — use index * 80 to stagger cards. */
  delay?: number;
  direction?: Direction;
  className?: string;
};

const HIDDEN_OFFSET: Record<Direction, string> = {
  up: "translate-y-8",
  left: "-translate-x-10",
  right: "translate-x-10",
  none: "",
};

/**
 * Fades + slides its children in when they scroll into view.
 * Pure CSS transition, no animation library. Respects reduced motion.
 */
export default function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : `opacity-0 ${HIDDEN_OFFSET[direction]}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  end: number;
  suffix?: string;
  duration?: number;
};

/** Counts from 0 to `end` once, when it scrolls into view. */
export default function CountUp({
  end,
  suffix = "",
  duration = 1600,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setValue(end);
      return;
    }

    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.disconnect();

        const startTime = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);

          setValue(Math.round(end * eased));

          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

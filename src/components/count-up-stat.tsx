"use client";

import { useEffect, useState } from "react";

type CountUpStatProps = {
  value: number;
  suffix?: string;
  className?: string;
};

export function CountUpStat({ value, suffix = "", className = "" }: CountUpStatProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(0);
      return;
    }

    const durationMs = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className}>
      {display.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

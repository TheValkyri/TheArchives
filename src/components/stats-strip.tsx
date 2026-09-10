"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { stats as defaultStats, type StatItem } from "@/lib/data";

function CountUp({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const duration = reduce ? 0 : 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, active, reduce]);

  return <span className="tabular-nums">{display.toLocaleString("vi-VN")}</span>;
}

interface StatsStripProps {
  initialStats?: StatItem[];
}

export function StatsStrip({ initialStats }: StatsStripProps) {
  const [statList, setStatList] = useState<StatItem[]>(
    initialStats && initialStats.length > 0 ? initialStats : defaultStats
  );
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section
      ref={ref}
      className="border-y border-line bg-surface/50"
      aria-label="Thống kê kho tư liệu"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 md:grid-cols-4 md:px-6 md:py-16">
        {statList.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              <CountUp value={stat.value} active={inView} />
            </p>
            <p className="mt-2 text-[13px] text-ink-3">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

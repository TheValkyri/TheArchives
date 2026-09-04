"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";
import { stats } from "@/lib/data";

function AnimatedNumber({ value, inView }: { value: number; inView: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, value]);

  return <>{display.toLocaleString("vi-VN")}</>;
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="py-16 md:py-24 border-t border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center"
            >
              <div className="font-mono text-3xl md:text-4xl font-semibold text-text-primary tracking-tight">
                {reduce ? (
                  stat.value.toLocaleString("vi-VN")
                ) : (
                  <AnimatedNumber value={stat.value} inView={inView} />
                )}
              </div>
              <div className="mt-2 text-sm text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

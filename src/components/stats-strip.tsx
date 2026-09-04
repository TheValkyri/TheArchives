"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";
import { stats, getLiveStats, type StatItem } from "@/lib/data";

function RollingDigit({
  digit,
  inView,
  delay = 0,
}: {
  digit: string;
  inView: boolean;
  delay?: number;
}) {
  const isNumber = !isNaN(parseInt(digit, 10));
  if (!isNumber) {
    return <span className="font-mono">{digit}</span>;
  }

  const targetNum = parseInt(digit, 10);
  // Dãy số cuộn lướt xuống: dừng chính xác ở targetNum (index 0)
  // Tạo 2 chu kỳ số để tạo cảm giác quay số slot-machine mượt mà
  const numbers = [
    targetNum,
    (targetNum + 9) % 10,
    (targetNum + 8) % 10,
    (targetNum + 7) % 10,
    (targetNum + 6) % 10,
    (targetNum + 5) % 10,
    (targetNum + 4) % 10,
    (targetNum + 3) % 10,
    (targetNum + 2) % 10,
    (targetNum + 1) % 10,
    9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ];

  const totalItems = numbers.length;
  const initialOffset = -((totalItems - 1) / totalItems) * 100;

  return (
    <span className="inline-block h-[1.25em] overflow-hidden leading-[1.25em] relative align-bottom font-mono tabular-nums">
      <motion.span
        className="flex flex-col select-none"
        initial={{ y: `${initialOffset}%` }}
        animate={inView ? { y: "0%" } : { y: `${initialOffset}%` }}
        transition={{
          duration: 1.8 + delay * 0.25,
          delay: delay,
          ease: [0.16, 1, 0.3, 1], // Easing hãm phanh mượt mà
        }}
      >
        {numbers.map((n, idx) => (
          <span
            key={idx}
            className="h-[1.25em] flex items-center justify-center font-mono tabular-nums"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function RollingNumber({
  value,
  inView,
  baseDelay = 0,
}: {
  value: number;
  inView: boolean;
  baseDelay?: number;
}) {
  const digits = String(value).split("");

  return (
    <span className="inline-flex items-center tracking-tight justify-center">
      {digits.map((d, i) => (
        <RollingDigit
          key={`${i}-${value}`}
          digit={d}
          inView={inView}
          delay={baseDelay + i * 0.12}
        />
      ))}
    </span>
  );
}

export function StatsStrip() {
  const [statList, setStatList] = useState<StatItem[]>(stats);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  const refreshStats = () => {
    getLiveStats().then((live) => {
      if (live && live.length > 0) {
        setStatList(live);
      }
    });
  };

  useEffect(() => {
    refreshStats();

    const handleStorage = () => refreshStats();
    const handleVisibility = () => {
      if (!document.hidden) refreshStats();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <section ref={ref} className="py-16 md:py-24 border-t border-b border-border-subtle bg-bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {statList.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
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
                  <RollingNumber
                    value={stat.value}
                    inView={inView}
                    baseDelay={i * 0.1}
                  />
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

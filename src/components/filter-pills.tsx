"use client";

import { motion, useReducedMotion } from "motion/react";
import { categories } from "@/lib/data";

interface FilterPillsProps {
  active: string;
  onChange: (category: string) => void;
}

export function FilterPills({ active, onChange }: FilterPillsProps) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            active === cat
              ? "text-white"
              : "text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/8"
          }`}
        >
          {active === cat && (
            <motion.div
              layoutId={reduce ? undefined : "filter-pill"}
              className="absolute inset-0 rounded-full bg-accent-red"
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10">{cat}</span>
        </button>
      ))}
    </div>
  );
}

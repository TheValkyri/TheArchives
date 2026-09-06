"use client";

import { categories } from "@/lib/data";

interface FilterPillsProps {
  active: string;
  onChange: (category: string) => void;
}

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
              isActive
                ? "bg-accent text-white"
                : "bg-surface-2 text-ink-2 hover:bg-line hover:text-ink"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { CaretDown } from "@phosphor-icons/react";
import { schoolYears } from "@/lib/data";

/**
 * Ô nhập niên khóa kết hợp: chọn nhanh từ danh sách (datalist)
 * hoặc gõ tay năm bất kỳ — chuẩn hóa format "YYYY - YYYY".
 */
export function SchoolYearInput({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
  className?: string;
}) {
  const listId = `${id}-years`;

  return (
    <div className={`relative ${className || ""}`}>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="VD: 2026 - 2027"
        className="w-full cursor-pointer rounded-xl border border-line bg-bg px-3.5 py-2.5 pr-9 text-[13px] text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none"
        aria-label="Niên khóa / năm học"
      />
      <CaretDown
        size={13}
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-3"
      />
      <datalist id={listId}>
        {schoolYears
          .filter((y) => y !== "Tất cả năm")
          .map((yr) => (
            <option key={yr} value={yr} />
          ))}
      </datalist>
    </div>
  );
}

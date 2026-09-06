"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // Đồng bộ trực tiếp với class .dark trên <html> — script init trong layout
  // đã set class trước paint nên snapshot đầu tiên luôn đúng theme thực tế.
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");

    // Class tạm để mọi màu chuyển mượt trong 300ms
    root.classList.add("theme-transition");
    root.classList.toggle("dark", next);

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}

    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  }, []);

  return (
    <button
      onClick={toggle}
      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-ink-2 transition-[background-color,border-color,color] duration-200 hover:border-line-strong hover:text-ink active:scale-95 ${className}`}
      aria-label={isDark ? "Chuyển sang chủ đề sáng" : "Chuyển sang chủ đề tối"}
      title={isDark ? "Chủ đề sáng" : "Chủ đề tối"}
    >
      {isDark ? (
        <Sun key="sun" size={17} className="toggle-icon-in" />
      ) : (
        <Moon key="moon" size={17} className="toggle-icon-in" />
      )}
    </button>
  );
}

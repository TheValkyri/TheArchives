"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { List, X, SignIn } from "@phosphor-icons/react";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Thư viện", href: "#gallery" },
  { label: "Album", href: "#albums" },
  { label: "Về CLB", href: "#about" },
];

/* Smooth scroll có easing (easeInOutCubic) — mượt hơn scroll-behavior:smooth */
function smoothScrollTo(targetY: number, duration = 650) {
  const startY = window.scrollY;
  const distance = targetY - startY;

  // Khoảng cách nhỏ hoặc đã ở đúng chỗ → không cần animation
  if (Math.abs(distance) < 4) {
    window.scrollTo(0, targetY);
    return;
  }

  const startTime = performance.now();

  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    // easeInOutCubic: chậm → nhanh → chậm
    const eased =
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Anchor click → smooth scroll JS (fallback CSS đã có ở globals.css) */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // để CSS scroll-behavior: auto xử lý (nhảy tức thì)

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const el = document.querySelector(href);
      if (!el) return;

      e.preventDefault();
      setIsOpen(false);
      history.pushState(null, "", href);

      const y = el.getBoundingClientRect().top + window.scrollY - 72; // chừa navbar
      smoothScrollTo(Math.max(0, y));
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating glass pill — nổi trên cùng, thu nhỏ khi scroll */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 transition-[transform] duration-500 ${
          scrolled ? "translate-y-0" : ""
        }`}
      >
        <nav
          className={`flex w-full max-w-2xl items-center justify-between gap-2 rounded-full border px-3 py-2 transition-[background-color,border-color,box-shadow] duration-500 md:pl-4 ${
            scrolled || isOpen
              ? "border-line bg-bg/85 shadow-[0_8px_32px_-12px_rgba(16,36,62,0.18)] backdrop-blur-2xl dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
              : "border-transparent bg-bg/60 backdrop-blur-xl"
          }`}
        >
          <a
            href="#"
            className="flex items-center gap-2.5"
            aria-label="The Archives — trang chủ"
          >
            <span className="relative block h-8 w-8 overflow-hidden rounded-full ring-1 ring-line-strong">
              <Image
                src="/logo.jpg"
                alt="Logo THPT Vĩnh Thuận"
                fill
                className="object-cover"
                sizes="32px"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[13px] font-semibold tracking-tight text-ink">
                The Archives
              </span>
              <span className="mt-0.5 hidden text-[9.5px] text-ink-3 sm:block">
                Đoàn Trường THPT Vĩnh Thuận
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[13px] text-ink-2 transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle className="!h-8 !w-8" />
            <a
              href="/admin/login"
              className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.97] sm:flex"
            >
              <SignIn size={14} weight="bold" />
              Đăng nhập
            </a>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors duration-200 hover:bg-line md:hidden"
              aria-label={isOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={17} /> : <List size={17} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu — panel trượt xuống */}
      <div
        className={`fixed inset-x-0 top-20 z-40 origin-top border-b border-line bg-bg/95 backdrop-blur-2xl transition-[opacity,transform] duration-300 ease-out md:hidden ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-xl px-4 py-3 text-base font-medium text-ink transition-colors duration-200 hover:bg-surface-2"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/admin/login"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
          >
            <SignIn size={15} weight="bold" />
            Đăng nhập trang quản trị
          </a>
        </div>
      </div>
    </>
  );
}

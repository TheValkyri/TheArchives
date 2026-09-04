"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { List, X, MagnifyingGlass } from "@phosphor-icons/react";
import Image from "next/image";

const navLinks = [
  { label: "Thư viện", href: "#gallery" },
  { label: "Album", href: "#albums" },
  { label: "Về CLB", href: "#about" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
        <div className="relative rounded-full border border-border-subtle bg-bg-primary/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
            <a href="#" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-accent-blue/30 shadow-sm">
                <Image
                  src="/logo.jpg"
                  alt="Logo THPT Vĩnh Thuận"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-primary group-hover:text-accent-blue transition-colors duration-200">
                  The Archives
                </span>
                <span className="text-[10px] text-text-muted hidden sm:inline">
                  Đoàn Trường THPT Vĩnh Thuận
                </span>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#gallery"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 border border-border-subtle transition-all duration-200"
                title="Tìm kiếm tư liệu"
              >
                <MagnifyingGlass size={14} weight="light" className="text-accent-blue" />
                <span>Tìm kiếm</span>
              </a>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-text-primary transition-colors duration-200"
                aria-label={isOpen ? "Đóng menu" : "Mở menu"}
              >
                {isOpen ? (
                  <X size={18} weight="light" />
                ) : (
                  <List size={18} weight="light" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-bg-primary/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-3xl font-light text-text-primary hover:text-accent-red transition-colors duration-200"
              >
                {link.label}
              </motion.a>
            ))}

            <motion.a
              href="#gallery"
              onClick={() => setIsOpen(false)}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{
                duration: 0.4,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-accent-red text-white text-sm font-semibold"
            >
              Mở Thư viện tư liệu
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

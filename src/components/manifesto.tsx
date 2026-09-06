"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Tuyên ngôn CLB — scrubbing text reveal.
 * Mỗi từ bắt đầu opacity 0.12, sáng dần lên 1.0 khi người dùng cuộn.
 * Bố cục: tối giản, chữ lớn làm trung tâm.
 */

const WORDS = [
  "Chúng", "tôi", "không", "chỉ", "chụp", "ảnh.", "Mỗi", "khung", "hình",
  "là", "một", "câu", "chuyện", "về", "tuổi", "trẻ,", "về", "phong",
  "trào", "Đoàn", "và", "về", "những", "ký", "ức", "sẽ", "không", "bao",
  "giờ", "quay", "lại.", "The", "Archives", "giữ", "lại", "tất", "cả.",
];

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-word]",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-words-wrap]",
            start: "top 78%",
            end: "bottom 45%",
            scrub: 0.8,
          },
        }
      );

      // Dấu ngắt màu accent sáng lên sau cùng
      gsap.fromTo(
        "[data-word-accent]",
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-words-wrap]",
            start: "center 55%",
            end: "bottom 42%",
            scrub: 0.8,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden py-32 md:py-48"
      aria-label="Tuyên ngôn của CLB Truyền Thông"
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-8">
        <p
          data-words-wrap
          className="font-display text-[clamp(1.75rem,4.2vw,3.4rem)] leading-[1.28] font-medium tracking-[-0.01em] text-ink text-balance"
        >
          {WORDS.map((word, i) => {
            const isAccent =
              word === "The" ||
              word === "Archives" ||
              word === "giữ" ||
              word === "lại" ||
              word === "tất" ||
              word === "cả.";
            return (
              <span
                key={i}
                data-word
                className={`mr-[0.28em] inline-block ${
                  isAccent ? "text-accent" : ""
                }`}
              >
                {word}
              </span>
            );
          })}
        </p>

        <div className="mt-12 flex items-center gap-4">
          <span
            data-word-accent
            className="h-px w-16 bg-accent/60"
            aria-hidden="true"
          />
          <p data-word-accent className="text-[13px] font-medium text-ink-3">
            CLB Truyền Thông — Đoàn Trường THPT Vĩnh Thuận
          </p>
        </div>
      </div>
    </section>
  );
}

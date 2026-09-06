"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, FilmSlate, Palette, PenNib } from "@phosphor-icons/react";

/**
 * Đội ngũ — sticky card stacking.
 * Tiêu đề ghim trái, 4 thẻ vai trò bên phải chồng dần lên nhau khi cuộn,
 * mỗi thẻ xếp chồng với scale nhẹ tạo chiều sâu.
 */

const roles = [
  {
    icon: Camera,
    num: "01",
    title: "Nhiếp ảnh & Flycam",
    desc: "Bắt trọn từng khoảnh khắc cảm xúc và góc chụp toàn cảnh của các hoạt động phong trào Đoàn.",
  },
  {
    icon: FilmSlate,
    num: "02",
    title: "Quay phim & Dựng phim",
    desc: "Sản xuất video recap sự kiện, phóng sự chuyên đề và thước phim ngắn kỷ niệm học đường.",
  },
  {
    icon: Palette,
    num: "03",
    title: "Hậu kỳ & Thiết kế",
    desc: "Chỉnh màu đồng bộ, thiết kế poster, banner và tối ưu hình ảnh trước khi xuất bản.",
  },
  {
    icon: PenNib,
    num: "04",
    title: "Biên tập & Xuất bản",
    desc: "Viết bài truyền thông, quản trị nội dung fanpage và lưu trữ dữ liệu khoa học.",
  },
];

export function AboutTeam() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Thẻ sau chồng lên thẻ trước, scale nhẹ + trượt lên
      gsap.utils.toArray<HTMLElement>("[data-stack-card]").forEach((card, i) => {
        if (i === 0) return;
        gsap.fromTo(
          card,
          { y: 60, scale: 0.96 },
          {
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              end: "top 62%",
              scrub: 0.7,
            },
          }
        );
      });

      // Số lớn mờ trôi ngược chiều nhẹ
      gsap.utils.toArray<HTMLElement>("[data-stack-num]").forEach((num) => {
        gsap.fromTo(
          num,
          { yPercent: 30 },
          {
            yPercent: -18,
            ease: "none",
            scrollTrigger: {
              trigger: num,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={root}
      className="scroll-mt-24 border-t border-line py-32 md:py-48"
      aria-label="Về CLB Truyền Thông"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-4 md:px-6 lg:grid-cols-2 lg:gap-20">
        {/* Cột trái: sticky heading + intro */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[12px] font-medium tracking-[0.28em] text-accent uppercase">
            Đội ngũ tác nghiệp
          </p>
          <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-ink md:text-5xl">
            Bốn mảng chuyên môn,
            <br />
            một <span className="text-accent">tinh thần</span> chung
          </h2>
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
            Trực thuộc Ban Chấp Hành Đoàn Trường THPT Vĩnh Thuận, CLB Truyền
            Thông phụ trách toàn bộ công tác ghi hình, sản xuất tư liệu và
            xây dựng hình ảnh phong trào thanh niên nhà trường.
          </p>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
            Với tinh thần xung kích của tuổi trẻ, chúng tôi không chỉ chụp ảnh
            — chúng tôi giữ lại những ký ức đẹp nhất dưới mái trường Vĩnh
            Thuận thân thương.
          </p>
          <p className="mt-8 border-t border-line pt-5 font-mono text-[12px] text-ink-3">
            18 thành viên thường trực qua các niên khóa
          </p>
        </div>

        {/* Cột phải: card stacking */}
        <div className="relative space-y-6 lg:space-y-0">
          {roles.map((role, i) => (
            <div
              key={role.num}
              data-stack-card
              className={`relative overflow-hidden rounded-3xl border border-line bg-surface p-7 md:p-8 lg:sticky ${
                i === 0
                  ? "lg:top-28"
                  : i === 1
                    ? "lg:top-[9.5rem]"
                    : i === 2
                      ? "lg:top-[17rem]"
                      : "lg:top-[24.5rem]"
              }`}
            >
              {/* Số lớn nền — parallax ngược */}
              <span
                data-stack-num
                aria-hidden="true"
                className="font-display pointer-events-none absolute -top-6 right-4 text-[7rem] leading-none font-bold text-ink/[0.05] select-none dark:text-ink/10"
              >
                {role.num}
              </span>

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <role.icon size={22} weight="duotone" />
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold tracking-tight text-ink">
                  {role.title}
                </h3>
                <p className="mt-2.5 max-w-[40ch] text-[14px] leading-relaxed text-ink-3">
                  {role.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import {
  Camera,
  FilmSlate,
  Palette,
  PenNib,
  Airplay,
  VideoCamera,
  Rocket,
} from "@phosphor-icons/react";

const skills = [
  { icon: Camera, label: "Nhiếp ảnh" },
  { icon: VideoCamera, label: "Quay phim" },
  { icon: FilmSlate, label: "Dựng phim" },
  { icon: Palette, label: "Thiết kế" },
  { icon: PenNib, label: "Truyền thông" },
  { icon: Airplay, label: "Xuất bản" },
  { icon: Rocket, label: "Phong trào" },
];

export function SkillMarquee() {
  const items = [...skills, ...skills];

  return (
    <section
      aria-label="Lĩnh vực hoạt động của CLB"
      className="border-y border-line bg-surface/70 py-6"
    >
      <div className="marquee-mask overflow-hidden">
        <div
          className="marquee-track flex w-max items-center gap-10 pr-10"
          style={{ "--marquee-duration": "28s" } as React.CSSProperties}
        >
          {items.map((skill, i) => (
            <span
              key={`${skill.label}-${i}`}
              className="flex items-center gap-2.5 text-ink-2"
            >
              <skill.icon
                size={20}
                weight="duotone"
                className="text-accent/80"
              />
              <span className="font-display text-lg font-medium tracking-tight whitespace-nowrap md:text-xl">
                {skill.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

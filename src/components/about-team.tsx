"use client";

import { motion, useReducedMotion } from "motion/react";
import { Camera, FilmSlate, Palette, PenNib, Sparkle, UsersThree } from "@phosphor-icons/react";

const teamRoles = [
  {
    icon: Camera,
    title: "Nhiếp ảnh & Flycam",
    desc: "Bắt trọn từng khoảnh khắc cảm xúc, góc chụp toàn cảnh sân trường và các hoạt động phong trào Đoàn.",
    color: "text-accent-blue",
    badge: "Sony · Canon · DJI",
  },
  {
    icon: FilmSlate,
    title: "Quay phim & Dựng phim",
    desc: "Sản xuất video recap sự kiện, phóng sự chuyên đề và các thước phim ngắn kỷ niệm học đường.",
    color: "text-accent-red",
    badge: "4K UHD · 60 FPS",
  },
  {
    icon: Palette,
    title: "Hậu kỳ & Thiết kế",
    desc: "Chỉnh màu đồng bộ, thiết kế poster, banner sự kiện và tối ưu hình ảnh xuất bản trên các nền tảng số.",
    color: "text-accent-gold",
    badge: "Lightroom · Photoshop",
  },
  {
    icon: PenNib,
    title: "Biên tập & Xuất bản",
    desc: "Viết bài truyền thông, quản trị nội dung fanpage Đoàn trường và lưu trữ dữ liệu khoa học.",
    color: "text-emerald-400",
    badge: "BCH Đoàn Trường",
  },
];

export function AboutTeam() {
  const reduce = useReducedMotion();

  return (
    <section id="about" className="py-24 md:py-32 bg-bg-secondary/40 border-t border-border-subtle relative">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Intro */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/30">
              <Sparkle size={13} weight="fill" className="text-accent-gold" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent-blue font-semibold">
                ĐỘI NGŨ TÁC NGHIỆP
              </span>
            </div>

            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl tracking-tighter font-semibold text-text-primary leading-tight"
            >
              CLB Truyền Thông <br />
              <span className="text-accent-blue font-normal">Đoàn Trường</span>
            </motion.h2>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="space-y-4 text-text-secondary text-sm leading-relaxed"
            >
              <p>
                Trực thuộc Ban Chấp Hành Đoàn Trường THPT Vĩnh Thuận, CLB Truyền Thông là lực lượng nòng cốt phụ trách toàn bộ công tác ghi hình, sản xuất tư liệu và xây dựng hình ảnh phong trào thanh niên nhà trường.
              </p>
              <p>
                Với tinh thần xung kích và lòng nhiệt huyết của tuổi trẻ, chúng tôi không chỉ chụp ảnh mà còn giữ lại những ký ức đẹp nhất dưới mái trường Vĩnh Thuận thân thương.
              </p>
            </motion.div>

            <div className="pt-2 flex items-center gap-3 text-xs text-text-muted">
              <UsersThree size={16} weight="light" className="text-accent-gold" />
              <span>18 thành viên hoạt động thường trực qua các niên khóa</span>
            </div>
          </div>

          {/* Right Column: 4 Division Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamRoles.map((role, i) => (
              <motion.div
                key={role.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl bg-bg-card border border-border-subtle hover:border-border-hover p-6 space-y-3 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${role.color}`}>
                    <role.icon size={22} weight="light" />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-bg-secondary border border-border-subtle">
                    {role.badge}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-text-primary group-hover:text-white transition-colors duration-200">
                  {role.title}
                </h3>

                <p className="text-xs text-text-muted leading-relaxed">
                  {role.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

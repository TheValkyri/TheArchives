import Image from "next/image";
import {
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  EnvelopeSimple,
  MapPin,
  Heart,
} from "@phosphor-icons/react/dist/ssr";

const socialLinks = [
  { icon: FacebookLogo, href: "https://facebook.com", label: "Fanpage Đoàn Trường" },
  { icon: InstagramLogo, href: "https://instagram.com", label: "Instagram CLB" },
  { icon: YoutubeLogo, href: "https://youtube.com", label: "Kênh YouTube" },
  { icon: EnvelopeSimple, href: "mailto:clbtruyenthong.thptvinhthuan@gmail.com", label: "Email liên hệ" },
];

const quickLinks = [
  { label: "Thư viện tư liệu", href: "#gallery" },
  { label: "Bộ sưu tập Album", href: "#albums" },
  { label: "Về CLB Truyền Thông", href: "#about" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary/95 relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-accent-blue/30 shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Logo Trường THPT Vĩnh Thuận"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-primary font-semibold">
                  The Archives
                </span>
                <p className="text-xs text-accent-blue font-medium">
                  CLB Truyền Thông · Đoàn Trường THPT Vĩnh Thuận
                </p>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed max-w-[42ch]">
              Hệ thống lưu trữ và tra cứu hình ảnh, video chất lượng cao phục vụ công tác truyền thông, kỷ yếu và phong trào thanh niên trường THPT Vĩnh Thuận.
            </p>

            <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
              <MapPin size={15} weight="light" className="text-accent-red shrink-0" />
              <span>Thị trấn Vĩnh Thuận, Huyện Vĩnh Thuận, Tỉnh Kiên Giang</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-semibold">
              Mục tra cứu
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-accent-blue transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Channels Column */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-semibold">
              Kênh truyền thông
            </h3>
            <p className="text-xs text-text-muted">
              Theo dõi các bản tin thời sự, phóng sự và hình ảnh hoạt động mới nhất.
            </p>
            <div className="flex gap-2.5 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 border border-border-subtle hover:border-accent-blue/40 text-text-secondary hover:text-white transition-all duration-200 active:scale-95"
                  title={social.label}
                >
                  <social.icon size={18} weight="light" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-16 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>
            &copy; {new Date().getFullYear()} Đoàn TNCS Hồ Chí Minh - Trường THPT Vĩnh Thuận.
          </p>
          <p className="flex items-center gap-1">
            <span>Xây dựng với nhiệt huyết tuổi trẻ</span>
            <Heart size={13} weight="fill" className="text-accent-red" />
          </p>
        </div>
      </div>
    </footer>
  );
}

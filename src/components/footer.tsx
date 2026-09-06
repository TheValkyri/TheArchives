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
  {
    icon: EnvelopeSimple,
    href: "mailto:clbtruyenthong.thptvinhthuan@gmail.com",
    label: "Email liên hệ",
  },
];

const quickLinks = [
  { label: "Thư viện tư liệu", href: "#gallery" },
  { label: "Bộ sưu tập Album", href: "#albums" },
  { label: "Về CLB Truyền Thông", href: "#about" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="relative block h-11 w-11 overflow-hidden rounded-full ring-1 ring-line-strong">
                <Image
                  src="/logo.jpg"
                  alt="Logo Trường THPT Vĩnh Thuận"
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-ink">
                  The Archives
                </p>
                <p className="text-[11px] text-ink-3">
                  CLB Truyền Thông · Đoàn Trường THPT Vĩnh Thuận
                </p>
              </div>
            </div>
            <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-3">
              Hệ thống lưu trữ và tra cứu hình ảnh, video chất lượng cao phục
              vụ công tác truyền thông, kỷ yếu và phong trào thanh niên trường
              THPT Vĩnh Thuận.
            </p>
            <p className="flex items-center gap-2 text-[12px] text-ink-3">
              <MapPin size={14} className="shrink-0 text-ink-3" />
              <span>
                Thị trấn Vĩnh Thuận, Huyện Vĩnh Thuận, Tỉnh Kiên Giang
              </span>
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3 md:col-span-3">
            <h3 className="text-[11px] font-semibold tracking-widest text-ink uppercase">
              Mục tra cứu
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[13px] text-ink-3 transition-colors duration-200 hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3 md:col-span-4">
            <h3 className="text-[11px] font-semibold tracking-widest text-ink uppercase">
              Kênh truyền thông
            </h3>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink-2 transition-[background-color,border-color,color] duration-200 hover:border-line-strong hover:text-ink active:scale-95"
                >
                  <social.icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[12px] text-ink-3 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Đoàn TNCS Hồ Chí Minh — Trường
            THPT Vĩnh Thuận.
          </p>
          <p className="flex items-center gap-1.5">
            <span>Xây dựng với nhiệt huyết tuổi trẻ</span>
            <Heart size={12} weight="fill" className="text-danger" />
          </p>
        </div>
      </div>
    </footer>
  );
}

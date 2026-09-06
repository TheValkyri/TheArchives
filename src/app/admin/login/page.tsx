"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Lock, EnvelopeSimple } from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Hệ thống chưa kết nối. Vui lòng kiểm tra cấu hình.");
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (data.user) router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-sky relative flex min-h-screen items-center justify-center bg-bg p-4">
      {/* Nút theme + quay về */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
      </div>
      <Link
        href="/"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Trang chủ
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="relative block h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-line-strong">
            <Image
              src="/logo.jpg"
              alt="Logo THPT Vĩnh Thuận"
              fill
              className="object-cover"
              sizes="64px"
            />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
              The Archives
            </h1>
            <p className="mt-1 text-[13px] text-ink-3">
              Đăng nhập để quản lý kho tư liệu
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-3xl border border-line bg-bg p-7 shadow-[0_24px_64px_-24px_rgba(16,36,62,0.25)] backdrop-blur-xl md:p-8 dark:shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)]"
        >
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] leading-relaxed text-danger">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-ink-2">
              Email
            </label>
            <div className="relative">
              <EnvelopeSimple
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
              />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@thptvinhthuan.edu.vn"
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-surface py-2.5 pr-4 pl-10 text-sm text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-ink-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
              />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="w-full rounded-xl border border-line bg-surface py-2.5 pr-4 pl-10 text-sm text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
            {!loading && (
              <ArrowRight
                size={15}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-3">
          Tài khoản dành riêng cho Ban Quản trị & CLB Truyền Thông.
        </p>
      </div>
    </div>
  );
}

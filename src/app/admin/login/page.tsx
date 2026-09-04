"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, EnvelopeSimple, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
        throw new Error(
          "Hệ thống Supabase chưa được kết nối. Vui lòng điền thông tin vào file .env.local"
        );
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        router.push("/admin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-bg-primary">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-blue/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl bg-bg-card border border-border-subtle p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden ring-2 ring-accent-blue/40 shadow-lg">
              <Image
                src="/logo.jpg"
                alt="Logo THPT Vĩnh Thuận"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-gold font-semibold">
                ĐOÀN TRƯỜNG THPT VĨNH THUẬN
              </span>
              <h1 className="text-2xl font-semibold text-text-primary tracking-tight mt-1">
                Cổng Quản Trị Media
              </h1>
              <p className="text-xs text-text-muted mt-1">
                Dành riêng cho Ban Quản trị & CLB Truyền Thông
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary font-medium">
                Email quản trị viên
              </label>
              <div className="relative flex items-center">
                <EnvelopeSimple
                  size={16}
                  weight="light"
                  className="absolute left-3.5 text-text-muted pointer-events-none"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thptvinhthuan.edu.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border-hover focus:border-accent-blue focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary font-medium">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  weight="light"
                  className="absolute left-3.5 text-text-muted pointer-events-none"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border-hover focus:border-accent-blue focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-full bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-lg shadow-accent-red/25 disabled:opacity-50"
            >
              <span>{loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 pt-6 border-t border-border-subtle flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck size={14} weight="fill" className="text-accent-blue" />
            <span>Xác thực an toàn qua Supabase Auth</span>
          </div>
        </div>

        {/* Back to website */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-text-muted hover:text-text-primary transition-colors duration-200"
          >
            ← Quay lại trang chủ The Archives
          </a>
        </div>
      </div>
    </div>
  );
}

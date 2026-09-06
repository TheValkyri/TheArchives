import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Guard xác thực cho các API route nhạy cảm (upload presign, media delete).
 * Chỉ cho qua khi request mang JWT hợp lệ của user đã đăng nhập Supabase.
 *
 * Trả 401 nếu không có/sai token → chặn upload & xóa trái phép từ bên ngoài.
 */

function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(req: NextRequest): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = getAuthClient();
  if (!supabase) {
    // Chưa cấu hình Supabase → từ chối mọi ghi/xóa qua API (an toàn mặc định)
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Hệ thống xác thực chưa được cấu hình." },
        { status: 503 }
      ),
    };
  }

  // 1) Ưu tiên Bearer token trong header
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;

  // 2) Fallback: cookie access token của supabase-js (localStorage phía client
  //    sẽ tự gắn header khi fetch qua helper, cookie cho trường hợp cùng origin)
  const cookieToken = req.cookies.get("sb-access-token")?.value ?? null;
  const token = bearer || cookieToken;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Chưa đăng nhập — không có quyền thực hiện thao tác này." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." },
        { status: 401 }
      ),
    };
  }

  return { ok: true, userId: user.id };
}

import { NextResponse } from "next/server";

/**
 * GET /api/status — chẩn đoán hạ tầng cho tab Trạng thái của dashboard.
 * Chạy server-side: đọc env vars, trả về trạng thái boolean + thông tin
 * KHÔNG nhạy cảm. Không bao giờ trả về giá trị key/secret thật.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const s3Endpoint = process.env.S3_ENDPOINT;
  const s3AccessKey = process.env.S3_ACCESS_KEY_ID;
  const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY;
  const s3Bucket = process.env.S3_BUCKET_NAME;
  const s3PublicDomain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN;

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const s3Configured = Boolean(
    s3Endpoint && s3AccessKey && s3SecretKey && s3Bucket
  );

  // Kiểm tra kết nối thực tế tới Supabase (không lộ key — chỉ boolean)
  let supabaseReachable = false;
  let supabaseError: string | null = null;
  if (supabaseConfigured && supabaseAnonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/albums?select=id&limit=1`, {
        headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
        signal: AbortSignal.timeout(5000),
      });
      supabaseReachable = res.ok;
      if (!res.ok) {
        supabaseError = res.status === 401 ? "Key không hợp lệ" : `HTTP ${res.status}`;
      }
    } catch (e) {
      supabaseError = e instanceof Error && e.name === "TimeoutError" ? "Timeout" : "Lỗi kết nối";
    }
  }

  // Kiểm tra S3 endpoint reachable (HEAD bucket qua presign không cần — chỉ ping)
  let s3Reachable = false;
  let s3Error: string | null = null;
  if (s3Configured && s3Endpoint && s3Bucket) {
    try {
      const domain = s3PublicDomain || `${s3Endpoint}/${s3Bucket}`;
      const res = await fetch(domain, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      // 200/403 đều nghĩa là endpoint sống (403 = bucket private nhưng host OK)
      s3Reachable = res.status === 200 || res.status === 403 || res.status === 405;
      if (!s3Reachable) s3Error = `HTTP ${res.status}`;
    } catch (e) {
      s3Error = e instanceof Error && e.name === "TimeoutError" ? "Timeout" : "Lỗi kết nối";
    }
  }

  return NextResponse.json({
    supabase: {
      configured: supabaseConfigured,
      reachable: supabaseReachable,
      hasServiceKey: Boolean(supabaseServiceKey),
      error: supabaseError,
    },
    s3: {
      configured: s3Configured,
      reachable: s3Reachable,
      hasPublicDomain: Boolean(s3PublicDomain),
      bucket: s3Bucket ? s3Bucket.replace(/[^\w.-]/g, "*") : null,
      error: s3Error,
    },
    checkedAt: new Date().toISOString(),
  });
}

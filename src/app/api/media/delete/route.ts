import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, isS3Configured } from "@/lib/s3";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, src } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID tư liệu cần xóa" }, { status: 400 });
    }

    // 1. Xóa khỏi Supabase Database (sử dụng supabaseAdmin để có quyền cao nhất trên server)
    const client = supabaseAdmin || supabase;
    if (client) {
      const { error: dbError } = await client
        .from("media_items")
        .delete()
        .eq("id", id);

      if (dbError) {
        console.error("Lỗi xóa Supabase:", dbError);
      }
    }

    // 2. Xóa file vật lý khỏi S3 Storage (nếu có s3Client và đường dẫn file)
    if (isS3Configured && s3Client && src) {
      try {
        let fileKey = src;
        if (src.includes("/api/media/")) {
          fileKey = src.replace("/api/media/", "");
        } else if (src.includes("s3.pikamc.vn/")) {
          const parts = src.split("s3.pikamc.vn/")[1];
          if (parts) {
            const slashIdx = parts.indexOf("/");
            if (slashIdx !== -1) {
              fileKey = parts.substring(slashIdx + 1);
            }
          }
        }

        const bucket = process.env.S3_BUCKET_NAME;
        if (bucket && fileKey) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: fileKey,
            })
          );
        }
      } catch (s3Err) {
        console.warn("Lỗi khi xóa file trên S3:", s3Err);
      }
    }

    return NextResponse.json({ success: true, message: "Đã xóa tư liệu thành công" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

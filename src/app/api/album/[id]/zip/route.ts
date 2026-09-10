import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { s3Client, isS3Configured } from "@/lib/s3";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * GET /api/album/[id]/zip
 *
 * Stream ZIP toàn bộ album: ảnh gốc + video, nén trên bay bằng archiver,
 * GetObject S3 trực tiếp từ server (không presign) → pipe thẳng vào response.
 * Giới hạn: tổng dung lượng tối đa MAX_TOTAL_BYTES (mặc định 2GB) để không
 * thiêu băng thông/hết giờ serverless.
 */

const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_FILES = 500;

function fileKeyFromUrl(src: string, bucket: string): string | null {
  try {
    const u = new URL(src);
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    if (parts[0] === bucket) parts.shift();
    const key = parts.join("/");
    return key || null;
  } catch {
    return null;
  }
}

function safeEntryName(title: string, fallback: string): string {
  return (
    title
      .replace(/[/\\?%*:|"<>\u2013]/g, "-")
      .trim()
      .replace(/\s+/g, "-") || fallback
  );
}

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const bucket = process.env.S3_BUCKET_NAME;

    if (!isS3Configured || !s3Client || !bucket) {
      return NextResponse.json(
        { error: "Kho lưu trữ S3 chưa được cấu hình." },
        { status: 500 }
      );
    }
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: "Cơ sở dữ liệu chưa được cấu hình." },
        { status: 500 }
      );
    }

    // Lấy album + danh sách media items
    const { data: album } = await supabase
      .from("albums")
      .select("title")
      .eq("id", id)
      .maybeSingle();

    if (!album) {
      return NextResponse.json({ error: "Không tìm thấy album." }, { status: 404 });
    }

    const { data: media } = await supabase
      .from("media_items")
      .select("id, title, type, src")
      .eq("album_id", id)
      .order("created_at", { ascending: true });

    if (!media || media.length === 0) {
      return NextResponse.json(
        { error: "Album này chưa có tư liệu để nén." },
        { status: 400 }
      );
    }
    if (media.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Album quá lớn (${media.length} file, tối đa ${MAX_FILES}). Vui lòng chia nhỏ album.` },
        { status: 413 }
      );
    }

    // Kiểm tra tổng dung lượng bằng HeadObject trước khi nén
    const keys: { key: string; name: string }[] = [];
    let totalBytes = 0;

    for (const m of media) {
      const key = fileKeyFromUrl(m.src, bucket);
      if (!key) continue;
      try {
        const head = await s3Client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key })
        );
        const size = head.ContentLength || 0;
        if (totalBytes + size > MAX_TOTAL_BYTES) {
          return NextResponse.json(
            {
              error: `Tổng dung lượng album vượt giới hạn ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024 / 1024)}GB. Vui lòng dùng link Google Drive.`,
            },
            { status: 413 }
          );
        }
        totalBytes += size;
        keys.push({ key, name: safeEntryName(m.title, m.id) });
      } catch {
        // File thiếu trên S3 → bỏ qua, không chặn cả album
      }
    }

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy file hợp lệ trong kho lưu trữ." },
        { status: 404 }
      );
    }

    const zipName = `${safeEntryName(album.title, "album")}.zip`;

    // store: không nén lại — ảnh/video đã nén sẵn, chỉ gộp stream
    const archive = new ZipArchive({ store: true });
    archive.on("warning", (err) => console.warn("ZIP warning:", err.message));

    // Thêm từng file S3 vào archive — GetObject trả stream, pipe thẳng không cần buffer
    void (async () => {
      try {
        for (const { key, name } of keys) {
          const { Body } = await s3Client.send(
            new GetObjectCommand({ Bucket: bucket, Key: key })
          );
          const ext = key.includes(".") ? key.split(".").pop()! : "";
          const entryName = ext ? `${name}.${ext}` : name;
          archive.append(
            Body instanceof Readable ? Body : Readable.fromWeb(Body as never),
            { name: entryName }
          );
        }
        await archive.finalize();
      } catch (err) {
        // Lỗi giữa chừng → kết thúc stream, client sẽ thấy ZIP thiếu/trống
        console.error("Lỗi stream ZIP:", err);
        archive.abort();
      }
    })();

    // archiver là Node stream — bắc cầu sang ReadableStream chuẩn Web
    const nodeStream = archive as unknown as NodeJS.ReadableStream;
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("Lỗi tạo ZIP album:", err);
    return NextResponse.json(
      { error: "Không thể tạo file ZIP. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

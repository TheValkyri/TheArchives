import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, isS3Configured } from "@/lib/s3";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    if (!isS3Configured || !s3Client) {
      return NextResponse.redirect(new URL("/logo.jpg", req.url), 307);
    }

    const { key } = await props.params;
    const fileKey = key.join("/");
    const bucket = process.env.S3_BUCKET_NAME;

    if (!bucket || !fileKey) {
      return NextResponse.redirect(new URL("/logo.jpg", req.url), 307);
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    const contentType = response.ContentType || "image/jpeg";

    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    // Fallback: Nếu file đã bị xóa trên S3 hoặc không tìm thấy, trả về logo.jpg hoặc redirect để Next.js không bị lỗi 400
    try {
      const fallbackPath = path.resolve(process.cwd(), "public", "logo.jpg");
      if (fs.existsSync(fallbackPath)) {
        const fallbackBuffer = fs.readFileSync(fallbackPath);
        return new NextResponse(fallbackBuffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=60",
          },
        });
      }
    } catch {
      // ignore
    }
    return NextResponse.redirect(new URL("/logo.jpg", req.url), 307);
  }
}

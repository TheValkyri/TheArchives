import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, isS3Configured } from "@/lib/s3";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    if (!isS3Configured || !s3Client) {
      return getFallbackResponse();
    }

    const { key } = await props.params;
    const fileKey = key.join("/");
    const bucket = process.env.S3_BUCKET_NAME;

    if (!bucket || !fileKey) {
      return getFallbackResponse();
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    const contentType = response.ContentType || "image/jpeg";

    if (!response.Body) {
      return getFallbackResponse();
    }

    // transformToByteArray() tải toàn bộ dữ liệu ảnh thành Uint8Array an toàn,
    // không bị lỗi timeout hoặc stream treo trên serverless Vercel
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("Lỗi lấy media từ S3:", err);
    return getFallbackResponse();
  }
}

function getFallbackResponse() {
  try {
    const fallbackPath = path.resolve(process.cwd(), "public", "logo.jpg");
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuffer = fs.readFileSync(fallbackPath);
      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=60",
        },
      });
    }
  } catch {
    // ignore
  }

  // Dự phòng pixel trong suốt chuẩn định dạng PNG nếu không đọc được file tĩnh
  const transparentPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );
  return new NextResponse(transparentPng, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
    },
  });
}

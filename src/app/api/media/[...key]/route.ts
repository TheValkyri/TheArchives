import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, isS3Configured } from "@/lib/s3";

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

    // Ký Presigned GET URL trong 1ms (chạy thuần CPU HMAC, không cần kết nối mạng từ Vercel sang S3)
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // Link hợp lệ trong 1 giờ
    });

    return NextResponse.redirect(signedUrl, {
      status: 307,
      headers: {
        "Cache-Control": "public, max-age=3000",
      },
    });
  } catch (err: unknown) {
    console.error("Lỗi ký link media:", err);
    return NextResponse.redirect(new URL("/logo.jpg", req.url), 307);
  }
}

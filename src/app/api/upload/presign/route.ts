import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, isS3Configured } from "@/lib/s3";
import { requireAdmin } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  try {
    // Chặn request chưa đăng nhập — không thể upload file trái phép
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    if (!isS3Configured || !s3Client) {
      return NextResponse.json(
        {
          error:
            "Kho lưu trữ S3 chưa được cấu hình. Vui lòng kiểm tra biến môi trường S3 trong .env.local",
        },
        { status: 500 }
      );
    }

    const { fileName, fileType, albumTitle } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Tên file và định dạng file là bắt buộc." },
        { status: 400 }
      );
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: "Chưa cấu hình S3_BUCKET_NAME trong .env.local" },
        { status: 500 }
      );
    }

    // Làm sạch tên file và tạo đường dẫn lưu trữ
    const sanitizedFileName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");

    // Prefix "thumbs/" cho thumbnail để dễ phân biệt với file gốc
    const folder = fileName === "thumb.webp"
      ? "thumbs"
      : albumTitle
        ? albumTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")
        : "general";

    const timestamp = Date.now();
    const fileKey = `archives/${folder}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // Ký link trực tiếp có hiệu lực trong 1 giờ (3600s)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const publicDomain =
      process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN ||
      `${process.env.S3_ENDPOINT}/${bucketName}`;
    const publicUrl = `${publicDomain}/${fileKey}`;

    return NextResponse.json({
      uploadUrl,
      fileKey,
      publicUrl,
    });
  } catch (error: unknown) {
    console.error("Lỗi tạo Presigned URL:", error);
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";
    return NextResponse.json(
      { error: `Không thể tạo link ký upload S3: ${message}` },
      { status: 500 }
    );
  }
}

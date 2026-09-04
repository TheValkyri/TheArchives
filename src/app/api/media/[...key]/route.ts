import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, isS3Configured } from "@/lib/s3";
import { Readable } from "stream";

export async function GET(
  req: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    if (!isS3Configured || !s3Client) {
      return new NextResponse("S3 not configured", { status: 500 });
    }

    const { key } = await props.params;
    const fileKey = key.join("/");
    const bucket = process.env.S3_BUCKET_NAME;

    if (!bucket || !fileKey) {
      return new NextResponse("Missing bucket or key", { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    const contentType = response.ContentType || "image/jpeg";

    // Chuyển stream thành Web Response Stream
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
    const msg = err instanceof Error ? err.message : "Not found";
    return new NextResponse(`Error: ${msg}`, { status: 404 });
  }
}

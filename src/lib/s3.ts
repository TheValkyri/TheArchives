import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";

export const isS3Configured = Boolean(
  endpoint && accessKeyId && secretAccessKey
);

export const s3Client = isS3Configured
  ? new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Cần thiết cho các kho S3 tự host như PIKAMC, MinIO, Ceph
    })
  : null;

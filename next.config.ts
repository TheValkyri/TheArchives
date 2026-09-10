import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Media đều đi qua /api/media presign-redirect hoặc S3 public URL —
    // không dùng image optimization pipeline của Next (ảnh gốc rất nặng,
    // đã có thumbnail WebP nhỏ do admin tạo khi upload).
    unoptimized: true,
  },
};

export default nextConfig;

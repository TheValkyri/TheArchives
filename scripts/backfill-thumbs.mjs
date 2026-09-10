#!/usr/bin/env node
/**
 * BACKFILL THUMBNAILS — chạy local 1 lần (không deploy)
 *
 * Cho mọi media_items thiếu thumb_url:
 *   - Ảnh:  S3 GetObject → sharp resize 720px → WebP q78 → PutObject thumbs/
 *   - Video: ffmpeg trích frame 1s → resize 720px → WebP → PutObject thumbs/
 * Sau đó UPDATE media_items.thumb_url trong Supabase.
 *
 * Cách chạy:
 *   1. cd the-archives
 *   2. npm i -D sharp @supabase/supabase-js  (đã có sẵn supabase-js)
 *   3. Đặt ffmpeg.exe cạnh script hoặc cài vào PATH (https://ffmpeg.org)
 *   4. Copy .env.local sang biến môi trường (script tự đọc)
 *   5. node scripts/backfill-thumbs.mjs [--dry-run] [--limit=50]
 *
 * Không có SERVICE_KEY → bỏ qua dòng không update được DB (thumb vẫn đẩy lên S3).
 * Chạy lại lần sau sẽ tự bỏ qua những dòng đã có thumb_url.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";

/* ---------- Đọc .env.local thủ công (không phụ thuộc dotenv) ---------- */

async function loadEnvLocal() {
  try {
    const raw = await readFile(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* không có .env.local — dùng biến môi trường sẵn có */
  }
}

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const LIMIT_ARG = argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : Infinity;

const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_KEY = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: { accessKeyId: S3_KEY, secretAccessKey: S3_SECRET },
  forcePathStyle: true,
});

/* ---------- Tìm ffmpeg ---------- */

async function findFfmpeg() {
  const candidates = [
    path.join("scripts", "ffmpeg.exe"),
    path.join("scripts", "ffmpeg"),
    "ffmpeg",
  ];
  for (const c of candidates) {
    try {
      await access(c, constants.X_OK);
      return c;
    } catch {}
  }
  return null;
}

function runFfmpeg(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) =>
      code === 0 ? resolve(true) : reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-400)}`))
    );
    p.on("error", reject);
  });
}

/* ---------- Trích key từ URL S3 public ---------- */
/* src dạng: https://s3.pikamc.vn/<bucket>/archives/...  hoặc domain public tùy biến */

function fileKeyFromUrl(src) {
  try {
    const u = new URL(src);
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    // Bỏ bucket đầu tiên nếu trùng S3_BUCKET
    if (parts[0] === S3_BUCKET) parts.shift();
    return parts.join("/");
  } catch {
    return null;
  }
}

/* ---------- Ảnh → thumb bằng sharp ---------- */

async function imageThumb(s3Body) {
  const { default: sharp } = await import("sharp");
  const buf = Buffer.from(await s3Body.transformToByteArray());
  const img = sharp(buf, { failOn: "none" });
  const meta = await img.metadata();
  const scale = Math.min(1, 720 / meta.width);
  const out = await img
    .resize(Math.round(meta.width * scale), Math.round(meta.height * scale))
    .webp({ quality: 78 })
    .toBuffer();
  const aspect =
    meta.width / meta.height > 1.2 ? "landscape" : meta.width / meta.height < 0.83 ? "portrait" : "square";
  return { buf: out, aspect };
}

/* ---------- Video → thumb bằng ffmpeg (frame giây 1) ---------- */

async function videoThumb(s3Body, tmpPath, ffmpegBin) {
  const buf = Buffer.from(await s3Body.transformToByteArray());
  await writeFile(tmpPath, buf);

  const outPath = tmpPath.replace(/\.[^.]+$/, "") + "-frame.png";
  await runFfmpeg(ffmpegBin, [
    "-y",
    "-ss", "1",
    "-i", tmpPath,
    "-frames:v", "1",
    "-vf", "scale='min(720,iw)':-2",
    outPath,
  ]);

  const { default: sharp } = await import("sharp");
  const img = sharp(outPath);
  const meta = await img.metadata();
  const out = await img.webp({ quality: 78 }).toBuffer();
  const ratio = meta.width / meta.height;
  const aspect = ratio > 1.2 ? "landscape" : ratio < 0.83 ? "portrait" : "square";

  const { unlink } = await import("node:fs/promises");
  await unlink(tmpPath).catch(() => {});
  await unlink(outPath).catch(() => {});

  return { buf: out, aspect };
}

/* ---------- Main ---------- */

async function fetchRows() {
  const headers = {
    apikey: SERVICE_KEY || SUPABASE_ANON,
    Authorization: `Bearer ${SERVICE_KEY || SUPABASE_ANON}`,
    "Content-Type": "application/json",
  };
  const url = `${SUPABASE_URL}/rest/v1/media_items?select=id,src,type,aspect,thumb_url&order=created_at.asc&null=thumb_url${LIMIT !== Infinity ? `&limit=${LIMIT}` : ""}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateRow(id, thumbUrl, aspect) {
  const headers = {
    apikey: SERVICE_KEY || SUPABASE_ANON,
    Authorization: `Bearer ${SERVICE_KEY || SUPABASE_ANON}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/media_items?id=eq.${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ thumb_url: thumbUrl, aspect }),
  });
  if (!res.ok) throw new Error(`UPDATE ${id} lỗi ${res.status}`);
}

async function main() {
  await loadEnvLocal();

  const missing = [S3_ENDPOINT, S3_KEY, S3_SECRET, S3_BUCKET, SUPABASE_URL, SUPABASE_ANON].filter((v) => !v);
  if (missing.length) {
    console.error("❌ Thiếu biến môi trường:", missing.join(", "));
    process.exit(1);
  }
  if (!SERVICE_KEY) {
    console.warn("⚠ Không có SUPABASE_SERVICE_ROLE_KEY → thumb sẽ đẩy S3 nhưng KHÔNG update được DB.");
  }

  const ffmpegBin = await findFfmpeg();
  console.log(ffmpegBin ? `🎬 ffmpeg: ${ffmpegBin}` : "⚠ Không tìm thấy ffmpeg — video sẽ bị bỏ qua.");

  const rows = await fetchRows();
  console.log(`📦 ${rows.length} dòng thiếu thumbnail.`);

  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let idx = 0;

  for (const row of rows) {
    idx++;
    const key = fileKeyFromUrl(row.src);
    if (!key) {
      console.log(`  [${idx}] ⏭ URL lạ, bỏ qua: ${row.src}`);
      skipped++;
      continue;
    }

    const isVideo = row.type === "video";
    if (isVideo && !ffmpegBin) {
      skipped++;
      continue;
    }

    try {
      const { Body } = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));

      const result = isVideo
        ? await videoThumb(Body, path.join(process.env.TEMP || ".", `bf-${row.id}.tmp`), ffmpegBin)
        : await imageThumb(Body);

      const thumbKey = `thumbs/backfill/${row.id}.webp`;
      if (DRY_RUN) {
        console.log(`  [${idx}] 🔎 DRY-RUN ${isVideo ? "video" : "ảnh"} ${key} → ${thumbKey} (${result.buf.length} bytes, ${result.aspect})`);
        ok++;
        continue;
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: thumbKey,
          Body: result.buf,
          ContentType: "image/webp",
        })
      );

      const publicDomain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || `${S3_ENDPOINT}/${S3_BUCKET}`;
      const publicUrl = `${publicDomain}/${thumbKey}`;

      try {
        await updateRow(row.id, publicUrl, row.aspect || result.aspect);
        console.log(`  [${idx}] ✅ ${isVideo ? "video" : "ảnh"} ${key}`);
        ok++;
      } catch (e) {
        console.log(`  [${idx}] ⚠ Đã đẩy S3 nhưng lỗi update DB: ${e.message}`);
        failed++;
      }
    } catch (e) {
      console.error(`  [${idx}] ❌ ${key}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✨ Xong: ${ok} ok, ${failed} lỗi, ${skipped} bỏ qua${DRY_RUN ? " (DRY RUN)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

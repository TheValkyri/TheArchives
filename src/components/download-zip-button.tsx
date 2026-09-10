"use client";

import { useState } from "react";
import { DownloadSimple, SpinnerGap } from "@phosphor-icons/react";

interface DownloadZipButtonProps {
  albumId: string;
  albumTitle: string;
}

/**
 * Nút tải ZIP toàn bộ album.
 *
 * Server (api/album/[id]/zip) đã set `Content-Disposition: attachment`
 * → điều hướng trình duyệt tới URL sẽ stream ZIP thẳng xuống ĐĨA,
 * không buffer cả file trong RAM qua blob() như trước (album nặng
 * vài trăm MB làm Chrome tăng RAM đột biến + tab lag).
 *
 * Lưu ý: không dùng fetch/HEAD check trước — HEAD trong App Router vẫn
 * chạy toàn bộ GET handler (tạo ZIP thật) rồi vứt body, gấp đôi chi phí.
 * Trình duyệt tự hiển thị tiến trình tải trong UI download mặc định.
 */
export function DownloadZipButton({ albumId, albumTitle }: DownloadZipButtonProps) {
  const [state, setState] = useState<"idle" | "started" | "error">("idle");

  const handleDownload = () => {
    if (state === "started") return;
    setState("started");

    // Anchor navigation — browser stream ZIP xuống đĩa, không rời trang
    // vì header Content-Disposition: attachment
    const a = document.createElement("a");
    a.href = `/api/album/${albumId}/zip`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Không có tín hiệu JS "xong" khi stream qua navigation —
    // về idle sau vài giây để nút nhận click lại
    setTimeout(() => setState("idle"), 5000);
  };

  const label =
    state === "started"
      ? "Đang tải — xem trình duyệt"
      : "Tải ZIP toàn bộ";

  const icon =
    state === "started" ? (
      <SpinnerGap size={15} className="animate-spin" />
    ) : (
      <DownloadSimple size={15} weight="bold" />
    );

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-95"
      aria-label={`Tải ZIP toàn bộ album ${albumTitle}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

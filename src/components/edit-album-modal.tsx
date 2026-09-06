"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Check,
  Trash,
  UploadSimple,
  Warning,
  SpinnerGap,
} from "@phosphor-icons/react";
import { supabase, authedFetch } from "@/lib/supabase";
import type { Album, MediaItem } from "@/lib/data";
import { SchoolYearInput } from "./school-year-input";

interface EditAlbumModalProps {
  album: Album | null;
  onClose: () => void;
  onSaved: () => void; // gá»i láº¡i Ä‘á»ƒ parent refresh danh sÃ¡ch
}

const inputCls =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none";

export function EditAlbumModal({ album, onClose, onSaved }: EditAlbumModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schoolYear, setSchoolYear] = useState("2024 - 2025");
  const [driveUrl, setDriveUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // áº¢nh trong album + upload thÃªm
  const [albumMedia, setAlbumMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const addFilesRef = useRef<HTMLInputElement>(null);

  /* Reset state khi má»Ÿ modal vá»›i album khÃ¡c â€” pattern "adjust state during
     render" (React chÃ­nh thá»©c): so sÃ¡nh prop qua state prev, khÃ´ng cáº§n effect.
     Fetch danh sÃ¡ch tÆ° liá»‡u bá»c qua microtask. */
  const [lastAlbumId, setLastAlbumId] = useState<string | null>(null);
  if (album && album.id !== lastAlbumId) {
    setLastAlbumId(album.id);
    setTitle(album.title);
    setDescription(album.description || "");
    setSchoolYear(album.schoolYear);
    setDriveUrl(album.driveFolderUrl || "");
    setCoverFile(null);
    setCoverPreview(null);
    setMessage(null);
    setConfirmDelete(false);
    setAlbumMedia([]);
    void Promise.resolve().then(() => fetchAlbumMedia());
  }

  /* Esc Ä‘Ã³ng modal */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* KhoÃ¡ scroll ná»n khi má»Ÿ */
  useEffect(() => {
    document.documentElement.style.overflow = album ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [album]);

  /* Láº¥y danh sÃ¡ch tÆ° liá»‡u thuá»™c album â€” async wrapper, setState trong callback */
  const fetchAlbumMedia = useCallback(async () => {
    if (!album || !supabase) return;
    setLoadingMedia(true);
    try {
      const { data, error } = await supabase
        .from("media_items")
        .select("id, title, src, type, album_id")
        .eq("album_id", album.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAlbumMedia(
          data.map((m) => ({
            id: m.id,
            title: m.title,
            category: "",
            schoolYear: "",
            date: "",
            album: album.title,
            albumId: m.album_id || undefined,
            type: m.type,
            aspect: "landscape",
            src: m.src,
            photographer: "",
            resolution: "",
            tags: [],
          }))
        );
      }
    } catch {
      // im láº·ng â€” modal váº«n dÃ¹ng Ä‘Æ°á»£c cÃ¡c chá»©c nÄƒng khÃ¡c
    } finally {
      setLoadingMedia(false);
    }
  }, [album]);

  const handleCoverSelect = (file: File | null) => {
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  /* LÆ°u thay Ä‘á»•i metadata + áº£nh bÃ¬a má»›i (náº¿u cÃ³) */
  const handleSave = async () => {
    if (!album || !supabase) return;
    if (!title.trim()) {
      setMessage({ ok: false, text: "TÃªn album khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      let coverUrl: string | undefined;

      // Upload áº£nh bÃ¬a má»›i qua presign náº¿u cÃ³
      if (coverFile) {
        const presignRes = await authedFetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: coverFile.name,
            fileType: coverFile.type,
            albumTitle: title,
          }),
        });
        if (presignRes.ok) {
          const { uploadUrl, publicUrl } = await presignRes.json();
          const upRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": coverFile.type },
            body: coverFile,
          });
          if (upRes.ok) coverUrl = publicUrl;
        }
      }

      const updates: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        school_year: schoolYear,
        drive_folder_url: driveUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (coverUrl) updates.cover_url = coverUrl;

      const { error } = await supabase
        .from("albums")
        .update(updates)
        .eq("id", album.id);

      if (error) throw error;

      setMessage({ ok: true, text: "ÄÃ£ lÆ°u thay Ä‘á»•i album." });
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "LÆ°u tháº¥t báº¡i";
      setMessage({ ok: false, text: msg });
    } finally {
      setSaving(false);
    }
  };

  /* Bá»• sung áº£nh vÃ o album: upload S3 â†’ insert DB vá»›i album_id */
  const handleAddFiles = async (files: FileList | null) => {
    if (!files || !album || !supabase) return;
    setUploading(true);
    let okCount = 0;

    for (const file of Array.from(files)) {
      try {
        const presignRes = await authedFetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            albumTitle: title,
          }),
        });
        if (!presignRes.ok) throw new Error("presign fail");
        const { uploadUrl, publicUrl } = await presignRes.json();

        const upRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!upRes.ok) throw new Error("S3 upload fail");

        const isVideo = file.type.startsWith("video");
        const { error: dbError } = await supabase.from("media_items").insert({
          album_id: album.id,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          category: "Sá»± kiá»‡n",
          school_year: schoolYear,
          date: new Date().toLocaleDateString("vi-VN"),
          type: isVideo ? "video" : "photo",
          aspect: "landscape",
          src: publicUrl,
          photographer: "CLB Truyá»n ThÃ´ng",
          resolution: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          tags: [],
        });
        if (dbError) throw dbError;
        okCount++;
      } catch {
        // bá» qua file lá»—i, tiáº¿p tá»¥c file káº¿
      }
    }

    setUploading(false);
    if (okCount > 0) {
      setMessage({ ok: true, text: `ÄÃ£ thÃªm ${okCount} tÆ° liá»‡u vÃ o album.` });
      fetchAlbumMedia();
      onSaved();
    } else {
      setMessage({ ok: false, text: "KhÃ´ng thá»ƒ táº£i lÃªn tÆ° liá»‡u má»›i." });
    }
  };

  /* XÃ³a album (áº£nh trong album chá»‰ bá» liÃªn káº¿t â€” ON DELETE SET NULL) */
  const handleDeleteAlbum = async () => {
    if (!album || !supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("albums").delete().eq("id", album.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "XÃ³a album tháº¥t báº¡i";
      setMessage({ ok: false, text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {album && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Chá»‰nh sá»­a album ${album.title}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-widest text-accent uppercase">
                  Chá»‰nh sá»­a album
                </p>
                <h3 className="truncate text-[15px] font-semibold text-ink">
                  {album.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-line"
                aria-label="ÄÃ³ng"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {message && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12.5px] ${
                    message.ok
                      ? "border border-success/30 bg-success-soft text-success"
                      : "border border-danger/30 bg-danger-soft text-danger"
                  }`}
                >
                  {message.ok ? (
                    <Check size={15} weight="bold" />
                  ) : (
                    <Warning size={15} weight="bold" />
                  )}
                  {message.text}
                </div>
              )}

              {/* TÃªn + mÃ´ táº£ */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink-2">
                    TÃªn Album
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink-2">
                    MÃ´ táº£
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="MÃ´ táº£ ngáº¯n vá» sá»± kiá»‡n..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      NiÃªn khÃ³a / NÄƒm há»c
                    </label>
                    <SchoolYearInput
                      id="modal-school-year"
                      value={schoolYear}
                      onChange={setSchoolYear}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Link Google Drive gá»‘c
                    </label>
                    <input
                      type="url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* áº¢nh bÃ¬a */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-ink-2">
                  áº¢nh bÃ¬a
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                    <Image
                      src={coverPreview || album.cover}
                      alt="áº¢nh bÃ¬a album"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverSelect(e.target.files?.[0] || null)}
                    className="w-full cursor-pointer rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[12px] text-ink-3 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12px] file:text-ink"
                  />
                </div>
              </div>

              {/* Bá»• sung áº£nh vÃ o album */}
              <div className="space-y-2.5 rounded-xl border border-dashed border-line bg-surface/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">
                      TÆ° liá»‡u trong album ({albumMedia.length})
                    </p>
                    <p className="text-[11px] text-ink-3">
                      Bá»• sung áº£nh / video má»›i â€” tá»± Ä‘á»™ng gÃ¡n vÃ o album nÃ y.
                    </p>
                  </div>
                  <button
                    onClick={() => addFilesRef.current?.click()}
                    disabled={uploading}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {uploading ? (
                      <SpinnerGap size={13} className="animate-spin" />
                    ) : (
                      <UploadSimple size={13} weight="bold" />
                    )}
                    ThÃªm áº£nh
                  </button>
                  <input
                    ref={addFilesRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      handleAddFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {loadingMedia ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-ink-3">
                    <SpinnerGap size={14} className="animate-spin" />
                    Äang táº£i danh sÃ¡ch...
                  </div>
                ) : albumMedia.length === 0 ? (
                  <p className="py-2 text-center text-[12px] text-ink-3">
                    Album chÆ°a cÃ³ tÆ° liá»‡u nÃ o.
                  </p>
                ) : (
                  <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                    {albumMedia.map((m) => (
                      <div
                        key={m.id}
                        className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface"
                        title={m.title}
                      >
                        <Image
                          src={m.src}
                          alt={m.title}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VÃ¹ng xÃ³a â€” 2 bÆ°á»›c xÃ¡c nháº­n */}
              <div className="rounded-xl border border-danger/25 bg-danger-soft/50 p-4">
                {!confirmDelete ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] text-ink-2">
                      XÃ³a album khá»i há»‡ thá»‘ng (tÆ° liá»‡u váº«n Ä‘Æ°á»£c giá»¯, chá»‰ bá» liÃªn
                      káº¿t).
                    </p>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-danger/40 px-3.5 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger-soft"
                    >
                      <Trash size={13} />
                      XÃ³a album
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-danger">
                      <Warning size={15} weight="bold" />
                      XÃ³a vÄ©nh viá»…n &quot;{album.title}&quot;?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAlbum}
                        disabled={saving}
                        className="rounded-full bg-danger px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-danger-hover disabled:opacity-50"
                      >
                        Äá»“ng Ã½ xÃ³a
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-full border border-line bg-bg px-4 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong"
                      >
                        Há»§y
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-5 py-4">
              <button
                onClick={onClose}
                className="rounded-full border border-line px-5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                ÄÃ³ng
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <Check size={14} weight="bold" />
                )}
                {saving ? "Äang lÆ°u..." : "LÆ°u thay Ä‘á»•i"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

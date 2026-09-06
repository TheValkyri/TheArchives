"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Check,
  SpinnerGap,
  Camera,
  VideoCamera,
  Tag,
  User,
  CalendarBlank,
  LinkSimple,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { categories, type Album, type MediaItem } from "@/lib/data";
import { SchoolYearInput } from "./school-year-input";

interface EditMediaModalProps {
  item: MediaItem | null;
  albums: Album[];
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none";

/**
 * Modal sửa toàn bộ metadata một tư liệu: tiêu đề, chuyên mục, năm học,
 * ngày chụp, tác giả, tags, link Drive, gán/chuyển album.
 */
export function EditMediaModal({ item, albums, onClose, onSaved }: EditMediaModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sự kiện");
  const [schoolYear, setSchoolYear] = useState("2026 - 2027");
  const [date, setDate] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [tags, setTags] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [albumId, setAlbumId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  /* Adjust-during-render — reset form mỗi khi mở item khác (pattern React chính thức) */
  const [lastId, setLastId] = useState<string | null>(null);
  if (item && item.id !== lastId) {
    setLastId(item.id);
    setTitle(item.title);
    setCategory(item.category || "Sự kiện");
    setSchoolYear(item.schoolYear || "2026 - 2027");
    setDate(item.date || "");
    setPhotographer(item.photographer || "");
    setTags((item.tags || []).join(", "));
    setDriveUrl(item.driveUrl || "");
    setAlbumId(item.albumId || "");
    setMessage(null);
  }

  if (!item) return null;

  const handleSave = async () => {
    if (!supabase) return;
    if (!title.trim()) {
      setMessage({ ok: false, text: "Tiêu đề không được để trống." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: Record<string, unknown> = {
        title: title.trim(),
        category,
        school_year: schoolYear.trim(),
        date: date.trim(),
        photographer: photographer.trim() || "CLB Truyền Thông",
        tags: tagsArray,
        drive_url: driveUrl.trim() || null,
        album_id: albumId || null,
      };

      const { error } = await supabase
        .from("media_items")
        .update(updates)
        .eq("id", item.id);

      if (error) throw error;

      setMessage({ ok: true, text: "Đã lưu thay đổi tư liệu." });
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lưu thất bại";
      setMessage({ ok: false, text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Chỉnh sửa tư liệu ${item.title}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  {item.type === "video" ? (
                    <VideoCamera size={17} weight="duotone" />
                  ) : (
                    <Camera size={17} weight="duotone" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-widest text-accent uppercase">
                    Chỉnh sửa tư liệu
                  </p>
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {item.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-line"
                aria-label="Đóng"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {message && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12.5px] ${
                    message.ok
                      ? "border border-success/30 bg-success-soft text-success"
                      : "border border-danger/30 bg-danger-soft text-danger"
                  }`}
                >
                  {message.ok ? <Check size={15} weight="bold" /> : <Check size={15} weight="bold" />}
                  {message.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-ink-2">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink-2">
                    Chuyên mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    {categories
                      .filter((c) => c !== "Tất cả")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[12px] font-medium text-ink-2">
                    <CalendarBlank size={12} /> Ngày chụp
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="VD: 05/09/2026"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink-2">
                    Niên khóa / Năm học
                  </label>
                  <SchoolYearInput
                    id="media-school-year"
                    value={schoolYear}
                    onChange={setSchoolYear}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[12px] font-medium text-ink-2">
                    <User size={12} /> Tác giả / Người chụp
                  </label>
                  <input
                    type="text"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    placeholder="VD: Nguyễn Hoàng Nam 12A1"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[12px] font-medium text-ink-2">
                  <Tag size={12} /> Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Đoàn trường, Khai giảng 2026"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[12px] font-medium text-ink-2">
                  <ImageIcon size={12} /> Thuộc Album
                </label>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">— Không thuộc album nào —</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.schoolYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[12px] font-medium text-ink-2">
                  <LinkSimple size={12} /> Link Google Drive gốc (nếu có)
                </label>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-5 py-4">
              <button
                onClick={onClose}
                className="rounded-full border border-line px-5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                Đóng
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
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadSimple,
  FolderPlus,
  SignOut,
  CheckCircle,
  Warning,
  Trash,
  Tag,
  User,
  LinkSimple,
  Globe,
  ArrowsClockwise,
  Images,
  MagnifyingGlass,
  X,
  PencilSimple,
  ChartPie,
} from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured, authedFetch } from "@/lib/supabase";
import { isS3Configured } from "@/lib/s3";
import { categories, getLiveAlbums, type Album } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import { EditAlbumModal } from "@/components/edit-album-modal";
import { SchoolYearInput } from "@/components/school-year-input";

interface UploadQueueItem {
  file: File;
  previewUrl: string;
  title: string;
  category: string;
  schoolYear: string;
  photographer: string;
  tags: string;
  driveUrl: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
}

type Tab = "overview" | "upload" | "manage" | "album" | "manageAlbum" | "status";

const inputCls =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none";

const selectCls =
  "w-full cursor-pointer rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-colors duration-200 hover:border-line-strong focus:border-line-strong focus:outline-none";

/* BÃ¡o cho trang chá»§ biáº¿t dá»¯ liá»‡u Ä‘Ã£ Ä‘á»•i (module scope â€” Date.now an toÃ n vÃ¬
   chá»‰ cháº¡y trong event handler, khÃ´ng pháº£i lÃºc render) */
function notifySync() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("the_archives_updated_at", Date.now().toString());
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Manage state
  const [existingMedia, setExistingMedia] = useState<Record<string, unknown>[]>(
    []
  );
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [manageSearch, setManageSearch] = useState("");

  // Album manage state
  const [adminAlbums, setAdminAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Upload state
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [globalCategory, setGlobalCategory] = useState("Hoáº¡t Ä‘á»™ng ÄoÃ n");
  const [globalYear, setGlobalYear] = useState("2026 - 2027");
  const [globalPhotographer, setGlobalPhotographer] = useState("CLB Truyá»n ThÃ´ng");
  const [globalTags, setGlobalTags] = useState("ÄoÃ n trÆ°á»ng, THPT VÄ©nh Thuáº­n");
  const [isUploading, setIsUploading] = useState(false);

  // Album state
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumYear, setAlbumYear] = useState("2026 - 2027");
  const [albumDriveUrl, setAlbumDriveUrl] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [albumCreating, setAlbumCreating] = useState(false);
  const [albumMessage, setAlbumMessage] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setCurrentUser(data.session.user.email || "Quáº£n trá»‹ viÃªn");
        } else {
          router.push("/admin/login");
        }
      } else {
        setCurrentUser("Cháº¿ Ä‘á»™ thá»­ nghiá»‡m (ChÆ°a káº¿t ná»‘i Supabase)");
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const fetchExistingMedia = async () => {
    setLoadingExisting(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("media_items")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setExistingMedia(data || []);
      }
    } catch (err) {
      console.error("Lá»—i láº¥y danh sÃ¡ch tÆ° liá»‡u:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const fetchAdminAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const live = await getLiveAlbums();
      setAdminAlbums(live);
    } catch (err) {
      console.error("Lá»—i láº¥y danh sÃ¡ch album:", err);
    } finally {
      setLoadingAlbums(false);
    }
  };

  /* Tab overview cáº§n cáº£ media + album; tab manage cáº§n media; tab manageAlbum cáº§n album
     â€” bá»c setTimeout trÃ¡nh setState sync trong effect (rule react-hooks) */
  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "manage" && activeTab !== "manageAlbum")
      return;
    const t = setTimeout(() => {
      if (activeTab === "overview" || activeTab === "manage") fetchExistingMedia();
      if (activeTab === "overview" || activeTab === "manageAlbum") fetchAdminAlbums();
    }, 0);
    return () => clearTimeout(t);
  }, [activeTab]);

  /* XÃ³a album nhanh tá»« tab Quáº£n lÃ½ Album */
  const handleDeleteAlbum = async (album: Album) => {
    if (
      !window.confirm(
        `XÃ³a album "${album.title}"? TÆ° liá»‡u bÃªn trong váº«n Ä‘Æ°á»£c giá»¯, chá»‰ bá» liÃªn káº¿t.`
      )
    )
      return;
    if (!supabase) return;

    try {
      const { error } = await supabase.from("albums").delete().eq("id", album.id);
      if (error) throw error;
      setAdminAlbums((prev) => prev.filter((a) => a.id !== album.id));
      setDeleteMsg(`ÄÃ£ xÃ³a album "${album.title}".`);
      setTimeout(() => setDeleteMsg(null), 3000);
      notifySync();
    } catch (err) {
      console.warn("Lá»—i xÃ³a album:", err);
    }
  };

  const handleDeleteMedia = async (
    id: string,
    src: string,
    title: string
  ) => {
    if (
      !window.confirm(
        `Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a tÆ° liá»‡u "${title}"? Báº£n ghi vÃ  file lÆ°u trá»¯ sáº½ bá»‹ xÃ³a vÄ©nh viá»…n.`
      )
    )
      return;

    setExistingMedia((prev) => prev.filter((item) => item.id !== id));
    setDeleteMsg(`Äang xÃ³a "${title}" khá»i há»‡ thá»‘ng...`);
    notifySync();

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("media_items").delete().eq("id", id);
      }
      await authedFetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, src }),
      });
      setDeleteMsg(`ÄÃ£ xÃ³a thÃ nh cÃ´ng "${title}"!`);
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch (err) {
      console.warn("Lá»—i khi xá»­ lÃ½ xÃ³a:", err);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadQueueItem[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      category: globalCategory,
      schoolYear: globalYear,
      photographer: globalPhotographer,
      tags: globalTags,
      driveUrl: "",
      status: "pending",
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveQueueItem = (index: number) => {
    setQueue((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleStartUpload = async () => {
    if (queue.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === "success") continue;

      setQueue((prev) => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: "uploading", progress: 10 };
        return copy;
      });

      try {
        const presignRes = await authedFetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: item.file.name,
            fileType: item.file.type,
            albumTitle: item.title,
          }),
        });

        if (!presignRes.ok) {
          const errData = await presignRes.json();
          throw new Error(errData.error || "KhÃ´ng thá»ƒ táº¡o link kÃ½ upload");
        }

        const { uploadUrl, publicUrl } = await presignRes.json();

        setQueue((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], progress: 40 };
          return copy;
        });

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });

        if (!uploadRes.ok) throw new Error("KhÃ´ng thá»ƒ Ä‘áº©y file lÃªn kho S3");

        setQueue((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], progress: 80 };
          return copy;
        });

        if (supabase) {
          const isVideo = item.file.type.startsWith("video");
          const tagsArray = item.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

          const { error: dbError } = await supabase.from("media_items").insert({
            title: item.title,
            category: item.category,
            school_year: item.schoolYear,
            date: new Date().toLocaleDateString("vi-VN"),
            type: isVideo ? "video" : "photo",
            aspect: "landscape",
            src: publicUrl,
            photographer: item.photographer,
            resolution: `${item.file.name.split(".").pop()?.toUpperCase() ?? ""} Â· ${(
              item.file.size /
              (1024 * 1024)
            ).toFixed(1)} MB`,
            tags: tagsArray,
            drive_url: item.driveUrl || null,
          });

          if (dbError) console.warn("LÆ°u database tháº¥t báº¡i:", dbError);
        }

        setQueue((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "success", progress: 100 };
          return copy;
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Táº£i lÃªn tháº¥t báº¡i";
        setQueue((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "error", errorMessage: errorMsg };
          return copy;
        });
      }
    }

    setIsUploading(false);
    fetchExistingMedia();
    notifySync();
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlbumCreating(true);
    setAlbumMessage(null);

    try {
      let coverPublicUrl = "/logo.jpg";

      if (albumCoverFile) {
        const presignRes = await authedFetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: albumCoverFile.name,
            fileType: albumCoverFile.type,
            albumTitle,
          }),
        });

        if (presignRes.ok) {
          const { uploadUrl, publicUrl } = await presignRes.json();
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": albumCoverFile.type },
            body: albumCoverFile,
          });
          coverPublicUrl = publicUrl;
        }
      }

      if (supabase) {
        const { error: albumErr } = await supabase.from("albums").insert({
          title: albumTitle,
          description: albumDesc,
          school_year: albumYear,
          cover_url: coverPublicUrl,
          drive_folder_url: albumDriveUrl || null,
        });
        if (albumErr) throw albumErr;
      }

      setAlbumMessage("ÄÃ£ táº¡o Album má»›i thÃ nh cÃ´ng!");
      setAlbumTitle("");
      setAlbumDesc("");
      setAlbumCoverFile(null);
      setAlbumDriveUrl("");
      notifySync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Táº¡o album tháº¥t báº¡i";
      setAlbumMessage(`Lá»—i: ${msg}`);
    } finally {
      setAlbumCreating(false);
    }
  };

  const filteredExistingMedia = existingMedia.filter((item) => {
    if (!manageSearch) return true;
    const q = manageSearch.toLowerCase();
    return (
      (item.title as string)?.toLowerCase().includes(q) ||
      (item.category as string)?.toLowerCase().includes(q) ||
      (item.school_year as string)?.toLowerCase().includes(q) ||
      (item.photographer as string)?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-[13px] text-ink-3">
        Äang kiá»ƒm tra quyá»n quáº£n trá»‹...
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof UploadSimple }[] = [
    { id: "overview", label: "Tá»•ng quan", icon: ChartPie },
    { id: "upload", label: "Táº£i lÃªn", icon: UploadSimple },
    { id: "manage", label: `Quáº£n lÃ½ (${existingMedia.length})`, icon: Images },
    { id: "album", label: "Táº¡o Album", icon: FolderPlus },
    { id: "manageAlbum", label: `Album (${adminAlbums.length})`, icon: PencilSimple },
    { id: "status", label: "Tráº¡ng thÃ¡i", icon: Warning },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative block h-8 w-8 overflow-hidden rounded-full ring-1 ring-line-strong">
              <Image
                src="/logo.jpg"
                alt="Logo THPT VÄ©nh Thuáº­n"
                fill
                className="object-cover"
                sizes="32px"
              />
            </span>
            <div>
              <p className="text-[13px] font-semibold tracking-tight">
                The Archives Â· Admin
              </p>
              <p className="hidden text-[10px] text-ink-3 sm:block">
                {currentUser}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[12px] text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink"
            >
              <Globe size={13} />
              <span className="hidden sm:inline">Xem trang web</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft px-3.5 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:border-danger/50"
            >
              <SignOut size={13} weight="bold" />
              <span>ÄÄƒng xuáº¥t</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Tabs */}
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto border-b border-line px-1 pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-ink-2 hover:bg-line hover:text-ink"
                }`}
              >
                <tab.icon size={15} weight={isActive ? "bold" : "regular"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB: UPLOAD */}
        {activeTab === "upload" && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    ThÃ´ng tin chung
                  </h2>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Tá»± Ä‘á»™ng gÃ¡n cho má»i file táº£i lÃªn trong Ä‘á»£t nÃ y.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      ChuyÃªn má»¥c
                    </label>
                    <select
                      value={globalCategory}
                      onChange={(e) => setGlobalCategory(e.target.value)}
                      className={selectCls}
                    >
                      {categories
                        .filter((c) => c !== "Tất cả")
                        .map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      NÄƒm há»c
                    </label>
                    <SchoolYearInput
                      id="upload-global-year"
                      value={globalYear}
                      onChange={setGlobalYear}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      TÃ¡c giáº£ / NgÆ°á»i chá»¥p
                    </label>
                    <div className="relative">
                      <User
                        size={14}
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
                      />
                      <input
                        type="text"
                        value={globalPhotographer}
                        onChange={(e) => setGlobalPhotographer(e.target.value)}
                        placeholder="VD: Nguyá»…n HoÃ ng Nam 12A1"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Tags (phÃ¢n cÃ¡ch báº±ng dáº¥u pháº©y)
                    </label>
                    <div className="relative">
                      <Tag
                        size={14}
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
                      />
                      <input
                        type="text"
                        value={globalTags}
                        onChange={(e) => setGlobalTags(e.target.value)}
                        placeholder="ÄoÃ n trÆ°á»ng, Khai giáº£ng 2025"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropzone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group w-full cursor-pointer rounded-2xl border-2 border-dashed border-line bg-surface/50 p-8 text-center transition-colors duration-200 hover:border-line-strong"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-transform duration-200 group-hover:scale-105">
                  <UploadSimple size={22} />
                </span>
                <span className="mt-4 block text-sm font-semibold text-ink">
                  KÃ©o tháº£ hoáº·c báº¥m Ä‘á»ƒ chá»n áº£nh / video
                </span>
                <span className="mt-1 block text-[12px] text-ink-3">
                  PNG, JPG, RAW, MP4, MOV â€” khÃ´ng giá»›i háº¡n qua S3
                </span>
              </button>
            </div>

            {/* Queue */}
            <div className="space-y-4 lg:col-span-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    HÃ ng Ä‘á»£i ({queue.length} file)
                  </h2>
                  <p className="text-[12px] text-ink-3">
                    File Ä‘Æ°á»£c kÃ½ link vÃ  Ä‘áº©y trá»±c tiáº¿p lÃªn kho S3 PIKAMC.
                  </p>
                </div>
                {queue.length > 0 && (
                  <button
                    onClick={handleStartUpload}
                    disabled={isUploading}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
                  >
                    <UploadSimple size={15} weight="bold" />
                    <span className="hidden sm:inline">
                      {isUploading ? "Äang Ä‘áº©y..." : "Táº£i lÃªn táº¥t cáº£"}
                    </span>
                    <span className="sm:hidden">
                      {isUploading ? "..." : "Táº£i lÃªn"}
                    </span>
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-[13px] text-ink-3">
                  ChÆ°a cÃ³ file nÃ o trong hÃ ng Ä‘á»£i.
                </div>
              ) : (
                <div className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
                  {queue.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded-xl border border-line bg-surface p-3.5"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                        {item.file.type.startsWith("video") ? (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-accent">
                            VIDEO
                          </div>
                        ) : (
                          <Image
                            src={item.previewUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          disabled={item.status === "success"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], title: val };
                              return copy;
                            });
                          }}
                          className="w-full rounded-md bg-transparent text-[13px] font-medium text-ink focus:outline-none focus:bg-bg focus:px-1.5 focus:py-1"
                        />
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
                          <span className="tabular-nums">
                            {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span>Â·</span>
                          <span>{item.category}</span>
                          <span>Â·</span>
                          <span>{item.schoolYear}</span>
                        </div>

                        {item.status === "uploading" && (
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-accent transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.status === "success" && (
                          <span className="flex items-center gap-1 text-[11px] text-success">
                            <CheckCircle size={12} weight="fill" />
                            ÄÃ£ lÆ°u vÃ o S3 vÃ  Supabase
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="text-[11px] text-accent">
                            {item.errorMessage || "Lá»—i táº£i lÃªn"}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQueueItem(idx)}
                        disabled={isUploading}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-accent disabled:opacity-40"
                        title="XÃ³a khá»i danh sÃ¡ch"
                      >
                        {item.status === "success" ? (
                          <X size={15} />
                        ) : (
                          <Trash size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MANAGE */}
        {activeTab === "manage" && (
          <div className="mt-8 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Quáº£n lÃ½ tÆ° liá»‡u ({existingMedia.length})
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  Danh sÃ¡ch tÆ° liá»‡u trong Supabase vÃ  S3 PIKAMC.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlass
                    size={14}
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    type="text"
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                    placeholder="Lá»c tiÃªu Ä‘á», nÄƒm..."
                    className="w-48 rounded-full border border-line bg-bg py-2 pr-3 pl-9 text-[12px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
                  />
                </div>
                <button
                  onClick={fetchExistingMedia}
                  disabled={loadingExisting}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  <ArrowsClockwise
                    size={13}
                    className={loadingExisting ? "animate-spin" : ""}
                  />
                  <span>LÃ m má»›i</span>
                </button>
              </div>
            </div>

            {deleteMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-[12px] text-success">
                <CheckCircle size={15} weight="fill" />
                <span>{deleteMsg}</span>
              </div>
            )}

            <div className="rounded-xl border border-line bg-surface px-4 py-3 text-[12px] leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">Ghi chÃº: </span>
              Náº¿u Ä‘Ã£ xÃ³a file trá»±c tiáº¿p trÃªn báº£ng Ä‘iá»u khiá»ƒn S3 nhÆ°ng trang chá»§
              váº«n hiá»ƒn thá»‹ (hoáº·c lá»—i 400), hÃ£y tÃ¬m má»¥c Ä‘Ã³ bÃªn dÆ°á»›i vÃ  báº¥m{" "}
              <span className="font-semibold text-accent">XÃ³a</span> Ä‘á»ƒ gá»¡ báº£n
              ghi thá»«a khá»i Supabase.
            </div>

            {loadingExisting ? (
              <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                Äang táº£i danh sÃ¡ch tÆ° liá»‡u...
              </div>
            ) : filteredExistingMedia.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                {existingMedia.length === 0
                  ? "ChÆ°a cÃ³ tÆ° liá»‡u nÃ o trong há»‡ thá»‘ng."
                  : "KhÃ´ng tÃ¬m tháº¥y tÆ° liá»‡u khá»›p tá»« khÃ³a."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredExistingMedia.map((item) => (
                  <div
                    key={String(item.id)}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                        <img
                          src={formatSrc(String(item.src))}
                          alt={String(item.title)}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/logo.jpg";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">
                          {String(item.title)}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-2">
                            {String(item.category)}
                          </span>
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-3">
                            {String(item.school_year)}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-[10px] text-ink-3">
                          {String(item.photographer)} Â· {String(item.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-line pt-2.5">
                      <span className="max-w-[150px] truncate font-mono text-[10px] text-ink-3">
                        {String(item.resolution || "Full HD")}
                      </span>
                      <button
                        onClick={() =>
                          handleDeleteMedia(
                            String(item.id),
                            String(item.src),
                            String(item.title)
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-soft px-3 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:border-danger/50"
                      >
                        <Trash size={13} weight="bold" />
                        <span>XÃ³a</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ALBUM */}
        {activeTab === "album" && (
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 md:p-8">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Táº¡o Album chuyÃªn Ä‘á» má»›i
                </h2>
                <p className="mt-1 text-[12px] text-ink-3">
                  NhÃ³m áº£nh cÃ¹ng sá»± kiá»‡n thÃ nh bá»™ sÆ°u táº­p hiá»ƒn thá»‹ trÃªn trang
                  chá»§.
                </p>
              </div>

              {albumMessage && (
                <div
                  className={`rounded-xl px-4 py-3 text-[13px] ${
                    albumMessage.startsWith("Lá»—i")
                      ? "border border-danger/30 bg-danger-soft text-danger"
                      : "border border-success/30 bg-success-soft text-success"
                  }`}
                >
                  {albumMessage}
                </div>
              )}

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-ink-2">
                    TÃªn Album / sá»± kiá»‡n
                  </label>
                  <input
                    type="text"
                    required
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="VD: Lá»… Khai Giáº£ng NÄƒm Há»c 2025 - 2026"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-ink-2">
                    MÃ´ táº£ ngáº¯n
                  </label>
                  <textarea
                    rows={3}
                    value={albumDesc}
                    onChange={(e) => setAlbumDesc(e.target.value)}
                    placeholder="MÃ´ táº£ khÃ´ng khÃ­, má»¥c Ä‘Ã­ch vÃ  nhá»¯ng khoáº£nh kháº¯c Ä‘Ã¡ng nhá»›..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-ink-2">
                      NÄƒm há»c
                    </label>
                    <SchoolYearInput
                      id="album-create-year"
                      value={albumYear}
                      onChange={setAlbumYear}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-ink-2">
                      Link Google Drive gá»‘c (náº¿u cÃ³)
                    </label>
                    <div className="relative">
                      <LinkSimple
                        size={14}
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
                      />
                      <input
                        type="url"
                        value={albumDriveUrl}
                        onChange={(e) => setAlbumDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-ink-2">
                    áº¢nh bÃ¬a Album
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
                    className="w-full cursor-pointer rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[12px] text-ink-3 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12px] file:text-ink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={albumCreating}
                  className="w-full rounded-full bg-accent py-3 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
                >
                  {albumCreating ? "Äang táº¡o album..." : "LÆ°u Album vÃ o há»‡ thá»‘ng"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: OVERVIEW â€” thá»‘ng kÃª tá»•ng quan há»‡ thá»‘ng */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-6">
            {/* Tháº» sá»‘ liá»‡u */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-3xl font-semibold text-ink tabular-nums">
                  {existingMedia.filter((m) => m.type === "photo").length}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">Bá»©c áº£nh</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-3xl font-semibold text-ink tabular-nums">
                  {existingMedia.filter((m) => m.type === "video").length}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">ThÆ°á»›c phim</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-3xl font-semibold text-ink tabular-nums">
                  {adminAlbums.length}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">Album</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-3xl font-semibold text-ink tabular-nums">
                  {existingMedia.length}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">Tá»•ng tÆ° liá»‡u</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* PhÃ¢n bá»‘ chuyÃªn má»¥c */}
              <div className="rounded-2xl border border-line bg-surface p-6">
                <h3 className="text-sm font-semibold text-ink">
                  PhÃ¢n bá»‘ theo chuyÃªn má»¥c
                </h3>
                <div className="mt-4 space-y-3">
                  {categories
                    .filter((c) => c !== "Tất cả")
                    .map((cat) => {
                      const count = existingMedia.filter(
                        (m) => m.category === cat
                      ).length;
                      const percent = existingMedia.length
                        ? (count / existingMedia.length) * 100
                        : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-ink-2">{cat}</span>
                            <span className="text-ink-3 tabular-nums">
                              {count}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-accent transition-[width] duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Album gáº§n Ä‘Ã¢y nháº¥t */}
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">
                    Album má»›i nháº¥t
                  </h3>
                  <button
                    onClick={() => setActiveTab("manageAlbum")}
                    className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    Xem táº¥t cáº£ â†’
                  </button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {loadingAlbums ? (
                    <p className="py-6 text-center text-[12px] text-ink-3">
                      Äang táº£i...
                    </p>
                  ) : adminAlbums.length === 0 ? (
                    <p className="py-6 text-center text-[12px] text-ink-3">
                      ChÆ°a cÃ³ album nÃ o.
                    </p>
                  ) : (
                    adminAlbums.slice(0, 5).map((album) => (
                      <div
                        key={album.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium text-ink">
                            {album.title}
                          </p>
                          <p className="text-[11px] text-ink-3">
                            {album.schoolYear} Â· {album.count} tÆ° liá»‡u
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingAlbum(album)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-accent"
                          title="Chá»‰nh sá»­a"
                        >
                          <PencilSimple size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MANAGE ALBUM â€” sá»­a / xÃ³a album trá»±c tiáº¿p */}
        {activeTab === "manageAlbum" && (
          <div className="mt-8 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Quáº£n lÃ½ Album ({adminAlbums.length})
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  Äá»•i tÃªn, mÃ´ táº£, niÃªn khÃ³a, áº£nh bÃ¬a â€” hoáº·c bá»• sung áº£nh vÃ o
                  album cÃ³ sáºµn.
                </p>
              </div>
              <button
                onClick={fetchAdminAlbums}
                disabled={loadingAlbums}
                className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                <ArrowsClockwise
                  size={13}
                  className={loadingAlbums ? "animate-spin" : ""}
                />
                <span>LÃ m má»›i</span>
              </button>
            </div>

            {deleteMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-[12px] text-success">
                <CheckCircle size={15} weight="fill" />
                <span>{deleteMsg}</span>
              </div>
            )}

            {loadingAlbums ? (
              <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                Äang táº£i danh sÃ¡ch album...
              </div>
            ) : adminAlbums.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                ChÆ°a cÃ³ album nÃ o. Táº¡o album á»Ÿ tab &quot;Táº¡o Album&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {adminAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                        <img
                          src={formatSrc(album.cover)}
                          alt={album.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/logo.jpg";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">
                          {album.title}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-2">
                            {album.schoolYear}
                          </span>
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-3">
                            {album.count} tÆ° liá»‡u
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-line pt-2.5">
                      <button
                        onClick={() => setEditingAlbum(album)}
                        className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent/50"
                      >
                        <PencilSimple size={13} />
                        <span>Chá»‰nh sá»­a</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(album)}
                        className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-soft px-3 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:border-danger/50"
                      >
                        <Trash size={13} weight="bold" />
                        <span>XÃ³a</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: STATUS */}
        {activeTab === "status" && (
          <div className="mx-auto mt-8 max-w-3xl space-y-5">
            <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 md:p-8">
              <h2 className="text-base font-semibold text-ink">
                Tráº¡ng thÃ¡i cáº¥u hÃ¬nh háº¡ táº§ng
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2.5 rounded-xl border border-line bg-bg p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">
                      Supabase PostgreSQL & Auth
                    </span>
                    {isSupabaseConfigured ? (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-success">
                        <CheckCircle size={15} weight="fill" /> ÄÃ£ káº¿t ná»‘i
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                        <Warning size={15} weight="fill" /> ChÆ°a cÃ³ API Key
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-3">
                    LÆ°u trá»¯ metadata, album, tags vÃ  xÃ¡c thá»±c tÃ i khoáº£n quáº£n trá»‹
                    viÃªn.
                  </p>
                </div>

                <div className="space-y-2.5 rounded-xl border border-line bg-bg p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">
                      PIKAMC S3 Storage (50GB)
                    </span>
                    {isS3Configured ? (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-success">
                        <CheckCircle size={15} weight="fill" /> ÄÃ£ cáº¥u hÃ¬nh
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                        <Warning size={15} weight="fill" /> ChÆ°a cÃ³ S3 Key
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-3">
                    Kho file tÄ©nh qua Presigned URL, bá» qua giá»›i háº¡n 4.5MB cá»§a
                    Vercel.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-line bg-bg p-5 text-[12px] leading-relaxed text-ink-2">
                <h3 className="font-semibold text-ink">
                  HÆ°á»›ng dáº«n cáº¥u hÃ¬nh `.env.local`:
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-ink-3">
                  <li>
                    Copy toÃ n bá»™ ná»™i dung{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      the-archives/supabase/schema.sql
                    </code>{" "}
                    vÃ o SQL Editor trÃªn Supabase rá»“i Run.
                  </li>
                  <li>
                    Äiá»n URL vÃ  Anon Key vÃ o{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      NEXT_PUBLIC_SUPABASE_URL
                    </code>{" "}
                    vÃ {" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </code>
                    .
                  </li>
                  <li>
                    Láº¥y Endpoint, Access Key, Secret Key, Bucket Name tá»« gÃ³i S3
                    Starter 50GB trÃªn{" "}
                    <a
                      href="https://one.pikamc.vn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline decoration-line-strong underline-offset-2 hover:text-accent"
                    >
                      one.pikamc.vn
                    </a>{" "}
                    rá»“i Ä‘iá»n vÃ o `.env.local`.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal chá»‰nh sá»­a album â€” dÃ¹ng chung tá»« trang chá»§ */}
      <EditAlbumModal
        album={editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSaved={() => {
          fetchAdminAlbums();
          notifySync();
        }}
      />
    </div>
  );
}

function formatSrc(src: string): string {
  if (!src) return "/logo.jpg";
  if (src.includes("s3.pikamc.vn")) {
    const parts = src.split("s3.pikamc.vn/")[1];
    if (parts) {
      const slashIdx = parts.indexOf("/");
      if (slashIdx !== -1) {
        return `/api/media/${parts.substring(slashIdx + 1)}`;
      }
    }
  }
  return src;
}

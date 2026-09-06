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
  Camera,
  VideoCamera,
  Check,
  SpinnerGap,
  Path,
  Database,
  HardDrive,
  ArrowDown,
  CaretDown,
} from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured, authedFetch } from "@/lib/supabase";
import { categories, getLiveAlbums, type Album, type MediaItem } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import { EditAlbumModal } from "@/components/edit-album-modal";
import { EditMediaModal } from "@/components/edit-media-modal";
import { SchoolYearInput } from "@/components/school-year-input";

/* ================= Kiểu dữ liệu ================= */

interface UploadQueueItem {
  file: File;
  previewUrl: string;
  title: string;
  category: string;
  schoolYear: string;
  photographer: string;
  tags: string;
  driveUrl: string;
  albumId: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
}

interface AdminMedia {
  id: string;
  title: string;
  category: string;
  school_year: string;
  date: string;
  type: "photo" | "video";
  src: string;
  photographer: string;
  resolution: string;
  tags: string[];
  drive_url: string | null;
  album_id: string | null;
  created_at: string;
}

interface StatusData {
  supabase: { configured: boolean; reachable: boolean; hasServiceKey: boolean; error: string | null };
  s3: { configured: boolean; reachable: boolean; hasPublicDomain: boolean; bucket: string | null; error: string | null };
  checkedAt: string;
}

type Tab = "overview" | "upload" | "manage" | "albums" | "status";
type SortKey = "newest" | "oldest" | "title";

const PAGE_SIZE = 24;

const inputCls =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none";

const selectCls =
  "w-full cursor-pointer rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink transition-colors duration-200 hover:border-line-strong focus:border-line-strong focus:outline-none";

const filterSelectCls =
  "cursor-pointer appearance-none rounded-full border border-line bg-bg py-2 pr-8 pl-3.5 text-[12px] text-ink transition-colors duration-200 hover:border-line-strong focus:outline-none";

/* ================= Helpers (module scope) ================= */

function notifySync() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("the_archives_updated_at", Date.now().toString());
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }
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

function toMediaItem(m: AdminMedia, albums: Album[]): MediaItem {
  const album = albums.find((a) => a.id === m.album_id);
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    schoolYear: m.school_year,
    date: m.date,
    album: album?.title || "Chung",
    albumId: m.album_id || undefined,
    type: m.type,
    aspect: "landscape",
    src: m.src,
    photographer: m.photographer,
    resolution: m.resolution,
    tags: m.tags || [],
    driveUrl: m.drive_url || undefined,
  };
}

/* ================= Trang ================= */

export default function AdminDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* Media */
  const [existingMedia, setExistingMedia] = useState<AdminMedia[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  /* Bộ lọc tab Quản lý */
  const [manageSearch, setManageSearch] = useState("");
  const [manageCategory, setManageCategory] = useState("Tất cả");
  const [manageType, setManageType] = useState("all");
  const [manageAlbumFilter, setManageAlbumFilter] = useState("all");
  const [manageSort, setManageSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* Bulk chọn */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkAlbumId, setBulkAlbumId] = useState("");

  /* Sửa media */
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  /* Album */
  const [adminAlbums, setAdminAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showAlbumForm, setShowAlbumForm] = useState(false);

  /* Upload */
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [globalCategory, setGlobalCategory] = useState("Hoạt động Đoàn");
  const [globalYear, setGlobalYear] = useState("2026 - 2027");
  const [globalPhotographer, setGlobalPhotographer] = useState("CLB Truyền Thông");
  const [globalTags, setGlobalTags] = useState("Đoàn trường, THPT Vĩnh Thuận");
  const [globalAlbumId, setGlobalAlbumId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  /* Tạo album */
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumYear, setAlbumYear] = useState("2026 - 2027");
  const [albumDriveUrl, setAlbumDriveUrl] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [albumCreating, setAlbumCreating] = useState(false);
  const [albumMessage, setAlbumMessage] = useState<string | null>(null);

  /* Trạng thái hạ tầng */
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  /* ================= Auth check ================= */
  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setCurrentUser(data.session.user.email || "Quản trị viên");
        } else {
          router.push("/admin/login");
        }
      } else {
        setCurrentUser("Chế độ thử nghiệm (Chưa kết nối Supabase)");
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  /* ================= Fetchers ================= */

  const fetchExistingMedia = async () => {
    setLoadingExisting(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("media_items")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setExistingMedia((data as AdminMedia[]) || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách tư liệu:", err);
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
      console.error("Lỗi lấy danh sách album:", err);
    } finally {
      setLoadingAlbums(false);
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) setStatusData(await res.json());
    } catch {
      /* bỏ qua — hiển thị trạng thái chưa xác định */
    } finally {
      setLoadingStatus(false);
    }
  };

  /* Load dữ liệu theo tab — setTimeout tránh setState sync trong effect */
  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === "overview" || activeTab === "manage" || activeTab === "upload") {
        if (existingMedia.length === 0) fetchExistingMedia();
      }
      if (activeTab === "overview" || activeTab === "albums" || activeTab === "upload") {
        if (adminAlbums.length === 0) fetchAdminAlbums();
      }
      if (activeTab === "status") fetchStatus();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ================= Thao tác media ================= */

  const showMsg = (text: string) => {
    setDeleteMsg(text);
    setTimeout(() => setDeleteMsg(null), 3500);
  };

  const handleDeleteMedia = async (m: AdminMedia) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa tư liệu "${m.title}"? Bản ghi và file lưu trữ sẽ bị xóa vĩnh viễn.`
      )
    )
      return;

    setExistingMedia((prev) => prev.filter((x) => x.id !== m.id));
    showMsg(`Đang xóa "${m.title}"...`);

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("media_items").delete().eq("id", m.id);
      }
      await authedFetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, src: m.src }),
      });
      showMsg(`Đã xóa thành công "${m.title}"!`);
      notifySync();
    } catch (err) {
      console.warn("Lỗi khi xử lý xóa:", err);
      fetchExistingMedia();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllFilteredSelected = () => {
    const ids = filteredMedia.map((m) => m.id);
    return ids.length > 0 && ids.every((id) => selectedIds.has(id));
  };

  const toggleSelectAll = () => {
    const ids = filteredMedia.map((m) => m.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  /* Xóa hàng loạt các mục đang chọn */
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Xóa ${ids.length} tư liệu đã chọn? Hành động này không thể hoàn tác.`
      )
    )
      return;

    setBulkBusy(true);
    let ok = 0;
    for (const id of ids) {
      const m = existingMedia.find((x) => x.id === id);
      try {
        if (isSupabaseConfigured && supabase) {
          await supabase.from("media_items").delete().eq("id", id);
        }
        if (m) {
          await authedFetch("/api/media/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, src: m.src }),
          });
        }
        ok++;
      } catch {
        /* bỏ qua mục lỗi, tiếp tục */
      }
    }
    setSelectedIds(new Set());
    setBulkBusy(false);
    showMsg(`Đã xóa ${ok}/${ids.length} tư liệu.`);
    await fetchExistingMedia();
    notifySync();
  };

  /* Chuyển hàng loạt sang album khác */
  const handleBulkMove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !bulkAlbumId || !supabase) return;

    setBulkBusy(true);
    try {
      const { error } = await supabase
        .from("media_items")
        .update({ album_id: bulkAlbumId })
        .in("id", ids);
      if (error) throw error;
      showMsg(
        `Đã chuyển ${ids.length} tư liệu vào album "${
          adminAlbums.find((a) => a.id === bulkAlbumId)?.title || ""
        }".`
      );
      setSelectedIds(new Set());
      setBulkAlbumId("");
      await fetchExistingMedia();
      notifySync();
    } catch (err) {
      showMsg(`Lỗi chuyển album: ${err instanceof Error ? err.message : "không xác định"}`);
    } finally {
      setBulkBusy(false);
    }
  };

  /* ================= Lọc / sắp xếp ================= */

  const filteredMedia = (() => {
    const q = manageSearch.trim().toLowerCase();
    const list = existingMedia.filter((m) => {
      if (manageCategory !== "Tất cả" && m.category !== manageCategory) return false;
      if (manageType !== "all" && m.type !== manageType) return false;
      if (manageAlbumFilter === "none" && m.album_id) return false;
      if (
        manageAlbumFilter !== "all" &&
        manageAlbumFilter !== "none" &&
        m.album_id !== manageAlbumFilter
      )
        return false;
      if (q) {
        const hay = `${m.title} ${m.category} ${m.school_year} ${m.photographer} ${(m.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (manageSort === "newest") {
      sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } else if (manageSort === "oldest") {
      sorted.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    } else {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    }
    return sorted;
  })();

  const visibleMedia = filteredMedia.slice(0, visibleCount);

  const resetManageFilters = () => {
    setManageSearch("");
    setManageCategory("Tất cả");
    setManageType("all");
    setManageAlbumFilter("all");
    setManageSort("newest");
    setVisibleCount(PAGE_SIZE);
  };

  /* ================= Upload ================= */

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
      albumId: globalAlbumId,
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
          throw new Error(errData.error || "Không thể tạo link ký upload");
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

        if (!uploadRes.ok) throw new Error("Không thể đẩy file lên kho S3");

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
            album_id: item.albumId || null,
            title: item.title,
            category: item.category,
            school_year: item.schoolYear,
            date: new Date().toLocaleDateString("vi-VN"),
            type: isVideo ? "video" : "photo",
            aspect: "landscape",
            src: publicUrl,
            photographer: item.photographer,
            resolution: `${item.file.name.split(".").pop()?.toUpperCase() ?? ""} · ${(
              item.file.size / (1024 * 1024)
            ).toFixed(1)} MB`,
            tags: tagsArray,
            drive_url: item.driveUrl || null,
          });

          if (dbError) console.warn("Lưu database thất bại:", dbError);
        }

        setQueue((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "success", progress: 100 };
          return copy;
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Tải lên thất bại";
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

  /* ================= Tạo album ================= */

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

      setAlbumMessage("Đã tạo Album mới thành công!");
      setAlbumTitle("");
      setAlbumDesc("");
      setAlbumCoverFile(null);
      setAlbumDriveUrl("");
      fetchAdminAlbums();
      notifySync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tạo album thất bại";
      setAlbumMessage(`Lỗi: ${msg}`);
    } finally {
      setAlbumCreating(false);
    }
  };

  const handleDeleteAlbum = async (album: Album) => {
    if (
      !window.confirm(
        `Xóa album "${album.title}"? Tư liệu bên trong vẫn được giữ, chỉ bỏ liên kết.`
      )
    )
      return;
    if (!supabase) return;

    try {
      const { error } = await supabase.from("albums").delete().eq("id", album.id);
      if (error) throw error;
      setAdminAlbums((prev) => prev.filter((a) => a.id !== album.id));
      showMsg(`Đã xóa album "${album.title}".`);
      notifySync();
    } catch (err) {
      console.warn("Lỗi xóa album:", err);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
  };

  /* ================= Loading guard ================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-[13px] text-ink-3">
        <SpinnerGap size={16} className="animate-spin" />
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  /* ================= Số liệu tổng quan ================= */

  const photoCount = existingMedia.filter((m) => m.type === "photo").length;
  const videoCount = existingMedia.filter((m) => m.type === "video").length;
  const totalStorageMb = existingMedia.reduce((sum, m) => {
    const match = m.resolution?.match(/([\d.]+)\s*MB/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const tabs: { id: Tab; label: string; icon: typeof UploadSimple }[] = [
    { id: "overview", label: "Tổng quan", icon: ChartPie },
    { id: "upload", label: "Tải lên", icon: UploadSimple },
    { id: "manage", label: `Tư liệu (${existingMedia.length})`, icon: Images },
    { id: "albums", label: `Album (${adminAlbums.length})`, icon: FolderPlus },
    { id: "status", label: "Trạng thái", icon: Warning },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative block h-8 w-8 overflow-hidden rounded-full ring-1 ring-line-strong">
              <Image
                src="/logo.jpg"
                alt="Logo THPT Vĩnh Thuận"
                fill
                className="object-cover"
                sizes="32px"
              />
            </span>
            <div>
              <p className="text-[13px] font-semibold tracking-tight">
                The Archives · Admin
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
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* ================= Tabs ================= */}
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto border-b border-line px-1 pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {deleteMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-[12px] text-success">
            <CheckCircle size={15} weight="fill" />
            <span>{deleteMsg}</span>
          </div>
        )}

        {/* ================= TAB: TỔNG QUAN ================= */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-6">
            {/* Thẻ số liệu */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-semibold text-ink tabular-nums">
                    {photoCount}
                  </p>
                  <Camera size={20} weight="duotone" className="text-accent" />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">Bức ảnh</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-semibold text-ink tabular-nums">
                    {videoCount}
                  </p>
                  <VideoCamera size={20} weight="duotone" className="text-accent" />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">Thước phim</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-semibold text-ink tabular-nums">
                    {adminAlbums.length}
                  </p>
                  <FolderPlus size={20} weight="duotone" className="text-accent" />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">Album</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-semibold text-ink tabular-nums">
                    {totalStorageMb >= 1024
                      ? `${(totalStorageMb / 1024).toFixed(1)} GB`
                      : `${totalStorageMb.toFixed(1)} MB`}
                  </p>
                  <HardDrive size={20} weight="duotone" className="text-accent" />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">Dung lượng ước tính</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Phân bố chuyên mục */}
              <div className="rounded-2xl border border-line bg-surface p-6">
                <h3 className="text-sm font-semibold text-ink">
                  Phân bố theo chuyên mục
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
                            <span className="text-ink-3 tabular-nums">{count}</span>
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

              {/* Hoạt động gần đây */}
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">
                    Tư liệu mới nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab("manage")}
                    className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {loadingExisting ? (
                    <p className="flex items-center justify-center gap-2 py-6 text-[12px] text-ink-3">
                      <SpinnerGap size={14} className="animate-spin" />
                      Đang tải...
                    </p>
                  ) : existingMedia.length === 0 ? (
                    <p className="py-6 text-center text-[12px] text-ink-3">
                      Chưa có tư liệu nào trong hệ thống.
                    </p>
                  ) : (
                    existingMedia.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-2.5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          {m.type === "video" ? (
                            <VideoCamera size={14} />
                          ) : (
                            <Camera size={14} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium text-ink">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-ink-3">
                            {m.category} · {m.school_year}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingMedia(toMediaItem(m, adminAlbums));
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-accent"
                          title="Chỉnh sửa"
                        >
                          <PencilSimple size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Album mới nhất */}
            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Album mới nhất</h3>
                <button
                  onClick={() => setActiveTab("albums")}
                  className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  Quản lý album →
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {loadingAlbums ? (
                  <p className="col-span-full flex items-center justify-center gap-2 py-6 text-[12px] text-ink-3">
                    <SpinnerGap size={14} className="animate-spin" />
                    Đang tải...
                  </p>
                ) : adminAlbums.length === 0 ? (
                  <p className="col-span-full py-6 text-center text-[12px] text-ink-3">
                    Chưa có album nào.
                  </p>
                ) : (
                  adminAlbums.slice(0, 3).map((album) => (
                    <div
                      key={album.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-ink">
                          {album.title}
                        </p>
                        <p className="text-[11px] text-ink-3">
                          {album.schoolYear} · {album.count} tư liệu
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingAlbum(album)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-accent"
                        title="Chỉnh sửa"
                      >
                        <PencilSimple size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: TẢI LÊN ================= */}
        {activeTab === "upload" && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Thông tin chung
                  </h2>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Tự động gán cho mọi file tải lên trong đợt này.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Chuyên mục
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
                      Năm học
                    </label>
                    <SchoolYearInput
                      id="upload-global-year"
                      value={globalYear}
                      onChange={setGlobalYear}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Gán vào Album
                    </label>
                    <select
                      value={globalAlbumId}
                      onChange={(e) => setGlobalAlbumId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— Không thuộc album nào —</option>
                      {adminAlbums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.schoolYear})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Tác giả / Người chụp
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
                        placeholder="VD: Nguyễn Hoàng Nam 12A1"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-ink-2">
                      Tags (phân cách bằng dấu phẩy)
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
                        placeholder="Đoàn trường, Khai giảng 2026"
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
                  Kéo thả hoặc bấm để chọn ảnh / video
                </span>
                <span className="mt-1 block text-[12px] text-ink-3">
                  PNG, JPG, RAW, MP4, MOV — không giới hạn qua S3
                </span>
              </button>
            </div>

            {/* Queue */}
            <div className="space-y-4 lg:col-span-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Hàng đợi ({queue.length} file)
                  </h2>
                  <p className="text-[12px] text-ink-3">
                    File được ký link và đẩy trực tiếp lên kho S3 PIKAMC.
                  </p>
                </div>
                {queue.length > 0 && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setQueue([])}
                      disabled={isUploading}
                      className="rounded-full border border-line px-3.5 py-2.5 text-[12px] text-ink-2 transition-colors hover:border-line-strong disabled:opacity-50"
                    >
                      Xóa hàng đợi
                    </button>
                    <button
                      onClick={handleStartUpload}
                      disabled={isUploading}
                      className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
                    >
                      <UploadSimple size={15} weight="bold" />
                      <span className="hidden sm:inline">
                        {isUploading ? "Đang đẩy..." : "Tải lên tất cả"}
                      </span>
                      <span className="sm:hidden">
                        {isUploading ? "..." : "Tải lên"}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-[13px] text-ink-3">
                  Chưa có file nào trong hàng đợi.
                </div>
              ) : (
                <div className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
                  {queue.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 rounded-xl border p-3.5 transition-colors ${
                        item.status === "success"
                          ? "border-success/30 bg-success-soft/40"
                          : item.status === "error"
                            ? "border-danger/30 bg-danger-soft/40"
                            : "border-line bg-surface"
                      }`}
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
                          className="w-full rounded-md bg-transparent text-[13px] font-medium text-ink focus:bg-bg focus:px-1.5 focus:py-1 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
                          <span className="tabular-nums">
                            {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span>·</span>
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>
                            {item.albumId
                              ? adminAlbums.find((a) => a.id === item.albumId)
                                  ?.title || "Album"
                              : "Không album"}
                          </span>
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
                            Đã lưu vào S3 và Supabase
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="text-[11px] text-danger">
                            {item.errorMessage || "Lỗi tải lên"}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQueueItem(idx)}
                        disabled={isUploading}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-danger disabled:opacity-40"
                        title="Xóa khỏi danh sách"
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

        {/* ================= TAB: TƯ LIỆU (QUẢN LÝ) ================= */}
        {activeTab === "manage" && (
          <div className="mt-8 space-y-5">
            {/* Header + filter bar */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Quản lý tư liệu
                    <span className="ml-2 rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-accent tabular-nums">
                      {filteredMedia.length}/{existingMedia.length}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    Chọn nhiều mục để xóa hàng loạt hoặc chuyển album.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <MagnifyingGlass
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
                    />
                    <input
                      type="text"
                      value={manageSearch}
                      onChange={(e) => {
                        setManageSearch(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      placeholder="Tìm tiêu đề, tag, tác giả..."
                      className="w-52 rounded-full border border-line bg-bg py-2 pr-3 pl-9 text-[12px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      fetchExistingMedia();
                      fetchAdminAlbums();
                    }}
                    disabled={loadingExisting}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <ArrowsClockwise
                      size={13}
                      className={loadingExisting ? "animate-spin" : ""}
                    />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Bộ lọc */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={manageCategory}
                    onChange={(e) => {
                      setManageCategory(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={filterSelectCls}
                    aria-label="Lọc chuyên mục"
                  >
                    <option value="Tất cả">Mọi chuyên mục</option>
                    {categories
                      .filter((c) => c !== "Tất cả")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <CaretDown
                    size={11}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </div>

                <div className="relative">
                  <select
                    value={manageType}
                    onChange={(e) => {
                      setManageType(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={filterSelectCls}
                    aria-label="Lọc loại tư liệu"
                  >
                    <option value="all">Ảnh + Video</option>
                    <option value="photo">Chỉ ảnh</option>
                    <option value="video">Chỉ video</option>
                  </select>
                  <CaretDown
                    size={11}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </div>

                <div className="relative">
                  <select
                    value={manageAlbumFilter}
                    onChange={(e) => {
                      setManageAlbumFilter(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={filterSelectCls}
                    aria-label="Lọc theo album"
                  >
                    <option value="all">Mọi album</option>
                    <option value="none">Chưa có album</option>
                    {adminAlbums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={11}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </div>

                <div className="relative">
                  <select
                    value={manageSort}
                    onChange={(e) => setManageSort(e.target.value as SortKey)}
                    className={filterSelectCls}
                    aria-label="Sắp xếp"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="title">Theo tiêu đề</option>
                  </select>
                  <CaretDown
                    size={11}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </div>

                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  <Check size={13} weight={isAllFilteredSelected() ? "fill" : "regular"} />
                  {isAllFilteredSelected() ? "Bỏ chọn hết" : "Chọn hết"}
                </button>
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="sticky top-[68px] z-10 flex flex-wrap items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 backdrop-blur-lg">
                <span className="text-[13px] font-semibold text-accent tabular-nums">
                  Đã chọn {selectedIds.size}
                </span>
                <span className="flex-1" />

                <div className="relative">
                  <select
                    value={bulkAlbumId}
                    onChange={(e) => setBulkAlbumId(e.target.value)}
                    className={filterSelectCls}
                    aria-label="Chuyển đến album"
                  >
                    <option value="">Chuyển đến album...</option>
                    <option value="">— Bỏ khỏi album —</option>
                    {adminAlbums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={11}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </div>
                <button
                  onClick={handleBulkMove}
                  disabled={!bulkAlbumId || bulkBusy}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {bulkBusy ? (
                    <SpinnerGap size={13} className="animate-spin" />
                  ) : (
                    <Path size={13} />
                  )}
                  Chuyển album
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkBusy}
                  className="flex items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-danger-hover disabled:opacity-50"
                >
                  {bulkBusy ? (
                    <SpinnerGap size={13} className="animate-spin" />
                  ) : (
                    <Trash size={13} weight="bold" />
                  )}
                  Xóa đã chọn
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-full border border-line bg-bg px-3.5 py-2 text-[12px] text-ink-2 transition-colors hover:border-line-strong"
                >
                  Bỏ chọn
                </button>
              </div>
            )}

            {/* Grid */}
            {loadingExisting ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-16 text-[13px] text-ink-3">
                <SpinnerGap size={15} className="animate-spin" />
                Đang tải danh sách tư liệu...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                <p>
                  {existingMedia.length === 0
                    ? "Chưa có tư liệu nào trong hệ thống."
                    : "Không tìm thấy tư liệu khớp bộ lọc."}
                </p>
                {existingMedia.length > 0 && (
                  <button
                    onClick={resetManageFilters}
                    className="rounded-full bg-surface-2 px-4 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleMedia.map((m) => {
                    const selected = selectedIds.has(m.id);
                    const album = adminAlbums.find((a) => a.id === m.album_id);
                    return (
                      <div
                        key={m.id}
                        className={`group flex flex-col justify-between gap-3 rounded-xl border p-4 transition-colors ${
                          selected
                            ? "border-accent/50 bg-accent-soft/50"
                            : "border-line bg-surface hover:border-line-strong"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Checkbox chọn */}
                          <button
                            onClick={() => toggleSelect(m.id)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors mt-1 ${
                              selected
                                ? "border-accent bg-accent text-white"
                                : "border-line-strong bg-bg hover:border-accent"
                            }`}
                            aria-label={selected ? "Bỏ chọn" : "Chọn tư liệu"}
                          >
                            {selected && <Check size={12} weight="bold" />}
                          </button>

                          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                            <img
                              src={formatSrc(m.src)}
                              alt={m.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo.jpg";
                              }}
                            />
                            {m.type === "video" && (
                              <span className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white">
                                <VideoCamera size={10} />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">
                              {m.title}
                            </h4>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-2">
                                {m.category}
                              </span>
                              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-3">
                                {m.school_year}
                              </span>
                              {album && (
                                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent">
                                  {album.title}
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 truncate text-[10px] text-ink-3">
                              {m.photographer} · {m.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-line pt-2.5">
                          <span className="max-w-[150px] truncate font-mono text-[10px] text-ink-3">
                            {m.resolution || "Full HD"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingMedia(toMediaItem(m, adminAlbums))}
                              className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent/50"
                            >
                              <PencilSimple size={13} />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(m)}
                              className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-soft px-3 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:border-danger/50"
                            >
                              <Trash size={13} weight="bold" />
                              <span>Xóa</span>
                            </button>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tải thêm */}
                {visibleCount < filteredMedia.length && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                    >
                      Tải thêm
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent tabular-nums">
                        +{filteredMedia.length - visibleCount}
                      </span>
                      <ArrowDown size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= TAB: ALBUM ================= */}
        {activeTab === "albums" && (
          <div className="mt-8 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Quản lý Album ({adminAlbums.length})
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  Đổi tên, mô tả, niên khóa, ảnh bìa, bổ sung ảnh — hoặc tạo album mới.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAdminAlbums}
                  disabled={loadingAlbums}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  <ArrowsClockwise
                    size={13}
                    className={loadingAlbums ? "animate-spin" : ""}
                  />
                  <span>Làm mới</span>
                </button>
                <button
                  onClick={() => setShowAlbumForm((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  <FolderPlus size={13} weight="bold" />
                  {showAlbumForm ? "Đóng form" : "Tạo album mới"}
                </button>
              </div>
            </div>

            {/* Form tạo album — toggle */}
            {showAlbumForm && (
              <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-line bg-surface p-6 md:p-8">
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    Tạo Album chuyên đề mới
                  </h3>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Nhóm ảnh cùng sự kiện thành bộ sưu tập hiển thị trên trang chủ.
                  </p>
                </div>

                {albumMessage && (
                  <div
                    className={`rounded-xl px-4 py-3 text-[13px] ${
                      albumMessage.startsWith("Lỗi")
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
                      Tên Album / sự kiện
                    </label>
                    <input
                      type="text"
                      required
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="VD: Lễ Khai Giảng Năm Học 2026 - 2027"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-ink-2">
                      Mô tả ngắn
                    </label>
                    <textarea
                      rows={3}
                      value={albumDesc}
                      onChange={(e) => setAlbumDesc(e.target.value)}
                      placeholder="Mô tả không khí, mục đích và những khoảnh khắc đáng nhớ..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-ink-2">
                        Năm học
                      </label>
                      <SchoolYearInput
                        id="album-create-year"
                        value={albumYear}
                        onChange={setAlbumYear}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-ink-2">
                        Link Google Drive gốc (nếu có)
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
                      Ảnh bìa Album
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
                    {albumCreating ? "Đang tạo album..." : "Lưu Album vào hệ thống"}
                  </button>
                </form>
              </div>
            )}

            {/* Grid album */}
            {loadingAlbums ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-16 text-[13px] text-ink-3">
                <SpinnerGap size={15} className="animate-spin" />
                Đang tải danh sách album...
              </div>
            ) : adminAlbums.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line py-16 text-center text-[13px] text-ink-3">
                Chưa có album nào. Bấm &quot;Tạo album mới&quot; để bắt đầu.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                            {album.count} tư liệu
                          </span>
                        </div>
                        {album.description && (
                          <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-ink-3">
                            {album.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-line pt-2.5">
                      <button
                        onClick={() => setEditingAlbum(album)}
                        className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent/50"
                      >
                        <PencilSimple size={13} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(album)}
                        className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-soft px-3 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:border-danger/50"
                      >
                        <Trash size={13} weight="bold" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: TRẠNG THÁI ================= */}
        {activeTab === "status" && (
          <div className="mx-auto mt-8 max-w-3xl space-y-5">
            <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">
                  Chẩn đoán hạ tầng trực tiếp
                </h2>
                <button
                  onClick={fetchStatus}
                  disabled={loadingStatus}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  <ArrowsClockwise
                    size={13}
                    className={loadingStatus ? "animate-spin" : ""}
                  />
                  <span>Kiểm tra lại</span>
                </button>
              </div>

              {statusData && (
                <p className="text-[11px] text-ink-3">
                  Kiểm tra lúc:{" "}
                  {new Date(statusData.checkedAt).toLocaleString("vi-VN")}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Supabase */}
                <div className="space-y-2.5 rounded-xl border border-line bg-bg p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <Database size={16} weight="duotone" />
                      Supabase
                    </span>
                    {statusData?.supabase.configured ? (
                      statusData.supabase.reachable ? (
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-success">
                          <CheckCircle size={15} weight="fill" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                          <Warning size={15} weight="fill" /> Lỗi kết nối
                        </span>
                      )
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                        <Warning size={15} weight="fill" /> Chưa cấu hình
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-[12px] text-ink-3">
                    <li className="flex justify-between">
                      <span>Biến môi trường</span>
                      <span className={statusData?.supabase.configured ? "text-success" : "text-warning"}>
                        {statusData?.supabase.configured ? "Đủ" : "Thiếu"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Kết nối REST API</span>
                      <span className={statusData?.supabase.reachable ? "text-success" : ""}>
                        {statusData?.supabase.reachable ? "OK" : statusData?.supabase.error || "—"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Service Role Key (server)</span>
                      <span className={statusData?.supabase.hasServiceKey ? "text-success" : "text-ink-3"}>
                        {statusData?.supabase.hasServiceKey ? "Có" : "Không"}
                      </span>
                    </li>
                  </ul>
                  <p className="text-[11px] leading-relaxed text-ink-3">
                    Lưu trữ metadata, album, tags và xác thực tài khoản quản trị viên.
                  </p>
                </div>

                {/* S3 */}
                <div className="space-y-2.5 rounded-xl border border-line bg-bg p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <HardDrive size={16} weight="duotone" />
                      PIKAMC S3
                    </span>
                    {statusData?.s3.configured ? (
                      statusData.s3.reachable ? (
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-success">
                          <CheckCircle size={15} weight="fill" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                          <Warning size={15} weight="fill" /> Lỗi kết nối
                        </span>
                      )
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] text-warning">
                        <Warning size={15} weight="fill" /> Chưa cấu hình
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-[12px] text-ink-3">
                    <li className="flex justify-between">
                      <span>Biến môi trường</span>
                      <span className={statusData?.s3.configured ? "text-success" : "text-warning"}>
                        {statusData?.s3.configured ? "Đủ" : "Thiếu"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Endpoint khả dụng</span>
                      <span className={statusData?.s3.reachable ? "text-success" : ""}>
                        {statusData?.s3.reachable ? "OK" : statusData?.s3.error || "—"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Bucket</span>
                      <span className="font-mono">
                        {statusData?.s3.bucket || "—"}
                      </span>
                    </li>
                  </ul>
                  <p className="text-[11px] leading-relaxed text-ink-3">
                    Kho file tĩnh qua Presigned URL, bỏ qua giới hạn 4.5MB của Vercel.
                  </p>
                </div>
              </div>

              {/* Hướng dẫn */}
              <div className="space-y-3 rounded-xl border border-line bg-bg p-5 text-[12px] leading-relaxed text-ink-2">
                <h3 className="font-semibold text-ink">
                  Hướng dẫn cấu hình `.env.local`:
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-ink-3">
                  <li>
                    Copy toàn bộ nội dung{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      the-archives/supabase/schema.sql
                    </code>{" "}
                    vào SQL Editor trên Supabase rồi Run.
                  </li>
                  <li>
                    Điền URL và Anon Key vào{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      NEXT_PUBLIC_SUPABASE_URL
                    </code>{" "}
                    và{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </code>
                    .
                  </li>
                  <li>
                    Lấy Endpoint, Access Key, Secret Key, Bucket Name từ gói S3
                    Starter 50GB trên{" "}
                    <a
                      href="https://one.pikamc.vn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline decoration-line-strong underline-offset-2 hover:text-accent"
                    >
                      one.pikamc.vn
                    </a>{" "}
                    rồi điền vào `.env.local`.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= Modals ================= */}
      <EditAlbumModal
        album={editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSaved={() => {
          fetchAdminAlbums();
          notifySync();
        }}
      />
      <EditMediaModal
        item={editingMedia}
        albums={adminAlbums}
        onClose={() => setEditingMedia(null)}
        onSaved={() => {
          fetchExistingMedia();
          notifySync();
        }}
      />
    </div>
  );
}

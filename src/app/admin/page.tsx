"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadSimple,
  FolderPlus,
  SignOut,
  CheckCircle,
  Warning,
  Plus,
  Trash,
  Tag,
  CalendarBlank,
  User,
  LinkSimple,
  Globe,
  ArrowsClockwise,
  Images,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isS3Configured } from "@/lib/s3";
import { categories, schoolYears } from "@/lib/data";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "manage" | "album" | "status">("upload");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Manage media state
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [manageSearch, setManageSearch] = useState("");

  // Upload state
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [globalCategory, setGlobalCategory] = useState<string>("Hoạt động Đoàn");
  const [globalYear, setGlobalYear] = useState<string>("2024 - 2025");
  const [globalPhotographer, setGlobalPhotographer] = useState<string>("CLB Truyền Thông");
  const [globalTags, setGlobalTags] = useState<string>("Đoàn trường, THPT Vĩnh Thuận");
  const [isUploading, setIsUploading] = useState(false);

  // New Album state
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumYear, setAlbumYear] = useState("2024 - 2025");
  const [albumDriveUrl, setAlbumDriveUrl] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [albumCreating, setAlbumCreating] = useState(false);
  const [albumMessage, setAlbumMessage] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setCurrentUser(data.session.user.email || "Quản trị viên");
        } else {
          // Chưa đăng nhập thì chuyển về trang login
          router.push("/admin/login");
        }
      } else {
        // Chưa cấu hình Supabase, hiển thị trang để admin kiểm tra trạng thái
        setCurrentUser("Chế độ thử nghiệm (Chưa kết nối Supabase)");
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
    } catch (err: unknown) {
      console.error("Lỗi lấy danh sách tư liệu:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manage") {
      fetchExistingMedia();
    }
  }, [activeTab]);

  const handleDeleteMedia = async (id: string, src: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tư liệu "${title}"? Bản ghi và file lưu trữ sẽ bị xóa vĩnh viễn.`)) {
      return;
    }

    // 1. Biến mất NGAY LẬP TỨC trên giao diện (0ms, không cần chờ mạng hay F5)
    setExistingMedia((prev) => prev.filter((item) => item.id !== id));
    setDeleteMsg(`Đang xóa "${title}" khỏi hệ thống...`);

    // 2. Thông báo cho các tab khác (như trang chủ) tự động đồng bộ ngay
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("the_archives_updated_at", Date.now().toString());
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }

    try {
      // 3. Xóa trực tiếp từ Supabase client
      if (isSupabaseConfigured && supabase) {
        await supabase.from("media_items").delete().eq("id", id);
      }

      // 4. Gọi API server để dọn file S3 và dọn database
      await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, src }),
      });

      setDeleteMsg(`Đã xóa thành công "${title}" khỏi hệ thống!`);
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch (err: unknown) {
      console.warn("Lỗi khi xử lý xóa:", err);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
  };

  // Handle files selected
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

  // Remove from queue
  const handleRemoveQueueItem = (index: number) => {
    setQueue((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // Upload all items in queue via S3 Presigned URL
  const handleStartUpload = async () => {
    if (queue.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === "success") continue;

      // Update item status to uploading
      setQueue((prev) => {
        const copy = [...prev];
        copy[i].status = "uploading";
        copy[i].progress = 10;
        return copy;
      });

      try {
        // Bước 1: Xin Presigned URL từ Next.js API
        const presignRes = await fetch("/api/upload/presign", {
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
          copy[i].progress = 40;
          return copy;
        });

        // Bước 2: Bắn trực tiếp file lên kho S3 PIKAMC qua Presigned URL
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": item.file.type,
          },
          body: item.file,
        });

        if (!uploadRes.ok) {
          throw new Error("Không thể đẩy file trực tiếp lên kho S3");
        }

        setQueue((prev) => {
          const copy = [...prev];
          copy[i].progress = 80;
          return copy;
        });

        // Bước 3: Lưu metadata vào Supabase PostgreSQL
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
            resolution: `${item.file.name.split(".").pop()?.toUpperCase()} · ${(
              item.file.size /
              (1024 * 1024)
            ).toFixed(1)} MB`,
            tags: tagsArray,
            drive_url: item.driveUrl || null,
          });

          if (dbError) {
            console.warn("Lưu database Supabase thất bại:", dbError);
          }
        }

        setQueue((prev) => {
          const copy = [...prev];
          copy[i].status = "success";
          copy[i].progress = 100;
          return copy;
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Tải lên thất bại";
        setQueue((prev) => {
          const copy = [...prev];
          copy[i].status = "error";
          copy[i].errorMessage = errorMsg;
          return copy;
        });
      }
    }

    setIsUploading(false);
    fetchExistingMedia();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("the_archives_updated_at", Date.now().toString());
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }
  };

  // Create new Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlbumCreating(true);
    setAlbumMessage(null);

    try {
      let coverPublicUrl = "/logo.jpg";

      // Nếu có upload ảnh bìa
      if (albumCoverFile) {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: albumCoverFile.name,
            fileType: albumCoverFile.type,
            albumTitle: albumTitle,
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

      // Lưu album vào Supabase
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

      setAlbumMessage("Đã tạo Album mới thành công vào cơ sở dữ liệu!");
      setAlbumTitle("");
      setAlbumDesc("");
      setAlbumCoverFile(null);
      setAlbumDriveUrl("");

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("the_archives_updated_at", Date.now().toString());
          window.dispatchEvent(new Event("storage"));
        } catch {}
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo album thất bại";
      setAlbumMessage(`Lỗi: ${msg}`);
    } finally {
      setAlbumCreating(false);
    }
  };

  const filteredExistingMedia = existingMedia.filter((item) => {
    if (!manageSearch) return true;
    const q = manageSearch.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.school_year?.toLowerCase().includes(q) ||
      item.photographer?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-muted">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border-subtle bg-bg-secondary/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-accent-blue/40">
              <Image
                src="/logo.jpg"
                alt="Logo THPT Vĩnh Thuận"
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.14em] font-semibold">
                The Archives Admin
              </span>
              <p className="text-[10px] text-text-muted hidden sm:block">
                {currentUser}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-border-subtle transition-all duration-200"
            >
              <Globe size={14} weight="light" />
              <span>Xem trang web</span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-accent-red hover:bg-accent-red/10 border border-accent-red/20 transition-all duration-200"
            >
              <SignOut size={14} weight="bold" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle pb-4">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-accent-red text-white shadow-md shadow-accent-red/25"
                : "bg-bg-card hover:bg-white/5 text-text-secondary border border-border-subtle"
            }`}
          >
            <UploadSimple size={16} weight="bold" />
            <span>Tải lên tư liệu trực tiếp</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("manage");
              fetchExistingMedia();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "manage"
                ? "bg-accent-blue text-white shadow-md shadow-accent-blue/25"
                : "bg-bg-card hover:bg-white/5 text-text-secondary border border-border-subtle"
            }`}
          >
            <Images size={16} weight="bold" />
            <span>Quản lý tư liệu ({existingMedia.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("album")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "album"
                ? "bg-accent-gold text-bg-primary font-bold shadow-md shadow-accent-gold/25"
                : "bg-bg-card hover:bg-white/5 text-text-secondary border border-border-subtle"
            }`}
          >
            <FolderPlus size={16} weight="bold" />
            <span>Tạo Album mới</span>
          </button>

          <button
            onClick={() => setActiveTab("status")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "status"
                ? "bg-accent-gold text-bg-primary font-bold shadow-md shadow-accent-gold/25"
                : "bg-bg-card hover:bg-white/5 text-text-secondary border border-border-subtle"
            }`}
          >
            <span>Trạng thái kết nối</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD MEDIA DIRECT TO S3 */}
        {activeTab === "upload" && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Global Config & Upload Dropzone */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl bg-bg-card border border-border-subtle p-6 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-blue">
                  Cài đặt thông tin chung
                </h2>
                <p className="text-xs text-text-muted">
                  Các giá trị này sẽ tự động được gán cho các file tải lên đợt này.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-secondary">Chuyên mục</label>
                    <select
                      value={globalCategory}
                      onChange={(e) => setGlobalCategory(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                    >
                      {categories.filter((c) => c !== "Tất cả").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary">Năm học</label>
                    <select
                      value={globalYear}
                      onChange={(e) => setGlobalYear(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                    >
                      {schoolYears.filter((y) => y !== "Tất cả năm").map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary">Tác giả / Người chụp</label>
                    <div className="relative flex items-center mt-1">
                      <User size={14} className="absolute left-3 text-text-muted" />
                      <input
                        type="text"
                        value={globalPhotographer}
                        onChange={(e) => setGlobalPhotographer(e.target.value)}
                        placeholder="VD: Nguyễn Hoàng Nam 12A1"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary">Thẻ Tags (phân cách bằng dấu phẩy)</label>
                    <div className="relative flex items-center mt-1">
                      <Tag size={14} className="absolute left-3 text-text-muted" />
                      <input
                        type="text"
                        value={globalTags}
                        onChange={(e) => setGlobalTags(e.target.value)}
                        placeholder="Đoàn trường, Khai giảng 2025"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-3xl border-2 border-dashed border-border-subtle hover:border-accent-blue bg-bg-card/40 p-8 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className="w-14 h-14 rounded-full bg-accent-blue/10 text-accent-blue mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UploadSimple size={28} weight="bold" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text-primary">
                  Kéo thả hoặc bấm để chọn ảnh/video
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Hỗ trợ PNG, JPG, RAW, MP4, MOV (Không giới hạn dung lượng qua S3)
                </p>
              </div>
            </div>

            {/* Right: Queue List & Execution */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Hàng đợi tải lên ({queue.length} file)
                  </h2>
                  <p className="text-xs text-text-muted">
                    File sẽ được ký link và đẩy trực tiếp lên kho S3 PIKAMC.
                  </p>
                </div>

                {queue.length > 0 && (
                  <button
                    onClick={handleStartUpload}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-red hover:bg-accent-red-hover text-white text-xs font-semibold shadow-lg shadow-accent-red/25 disabled:opacity-50 transition-all duration-200"
                  >
                    <UploadSimple size={16} weight="bold" />
                    <span>{isUploading ? "Đang đẩy lên S3..." : "Tiến hành tải lên tất cả"}</span>
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border-subtle bg-bg-card/30 p-12 text-center text-xs text-text-muted">
                  Chưa có file nào trong hàng đợi. Bấm vào khung bên trái để chọn ảnh/video sự kiện.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {queue.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-bg-card border border-border-subtle p-3.5 flex items-center gap-4 transition-all duration-200"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bg-secondary shrink-0">
                        {item.file.type.startsWith("video") ? (
                          <div className="w-full h-full flex items-center justify-center text-xs text-accent-red font-mono">
                            VIDEO
                          </div>
                        ) : (
                          <Image
                            src={item.previewUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) => {
                              const copy = [...prev];
                              copy[idx].title = val;
                              return copy;
                            });
                          }}
                          className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none hover:border-b border-border-subtle"
                        />
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>·</span>
                          <span className="text-accent-blue">{item.category}</span>
                          <span>·</span>
                          <span>{item.schoolYear}</span>
                        </div>

                        {/* Progress Bar */}
                        {item.status === "uploading" && (
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-accent-blue h-full transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        {item.status === "success" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle size={13} weight="fill" />
                            Đã lưu vào S3 và Supabase
                          </span>
                        )}

                        {item.status === "error" && (
                          <span className="text-[11px] text-accent-red">
                            {item.errorMessage || "Lỗi tải lên"}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQueueItem(idx)}
                        disabled={isUploading}
                        className="text-text-muted hover:text-accent-red p-2"
                        title="Xóa khỏi danh sách"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE & DELETE MEDIA */}
        {activeTab === "manage" && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl bg-bg-card border border-border-subtle p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <Images size={24} className="text-accent-blue" weight="bold" />
                    <span>Quản lý & Dọn dẹp tư liệu ({existingMedia.length})</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Danh sách tư liệu đã được lưu trữ trong Supabase và S3 PIKAMC.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={manageSearch}
                      onChange={(e) => setManageSearch(e.target.value)}
                      placeholder="Lọc tiêu đề, năm..."
                      className="pl-8 pr-3 py-1.5 rounded-full bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none w-48"
                    />
                  </div>

                  <button
                    onClick={fetchExistingMedia}
                    disabled={loadingExisting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-border-subtle transition-all duration-200"
                  >
                    <ArrowsClockwise size={14} className={loadingExisting ? "animate-spin" : ""} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {deleteMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" />
                  <span>{deleteMsg}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 text-xs text-text-secondary">
                <span className="font-semibold text-accent-blue">💡 Ghi chú dọn dẹp: </span>
                Nếu bạn đã vào bảng điều khiển S3 để xóa thư mục/file nhưng trang chủ vẫn hiển thị bài đăng (hoặc báo lỗi 400), hãy tìm mục đó ở bảng bên dưới và bấm nút <strong className="text-accent-red font-semibold">Xóa</strong>. Thao tác này sẽ gỡ hoàn toàn bản ghi thừa trong Supabase.
              </div>

              {loadingExisting ? (
                <div className="py-16 text-center text-text-muted text-xs">
                  Đang tải danh sách tư liệu từ cơ sở dữ liệu...
                </div>
              ) : filteredExistingMedia.length === 0 ? (
                <div className="py-16 text-center text-text-muted text-xs">
                  {existingMedia.length === 0
                    ? "Chưa có tư liệu nào trong hệ thống hoặc bảng media_items đang trống."
                    : "Không tìm thấy tư liệu nào khớp với từ khóa tìm kiếm."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExistingMedia.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-bg-secondary border border-border-subtle p-4 flex flex-col justify-between space-y-3 group hover:border-border-hover transition-all"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-bg-primary shrink-0 border border-border-subtle">
                          <img
                            src={item.src}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/logo.jpg";
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue font-mono">
                              {item.category}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted font-mono">
                              {item.school_year}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted mt-1.5 truncate">
                            {item.photographer} · {item.date}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                        <span className="text-text-muted font-mono text-[10px] truncate max-w-[160px]">
                          {item.resolution || "Full HD"}
                        </span>

                        <button
                          onClick={() => handleDeleteMedia(item.id, item.src, item.title)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-accent-red hover:bg-accent-red/10 border border-accent-red/20 transition-all duration-200 font-medium"
                          title="Xóa khỏi Database và S3"
                        >
                          <Trash size={14} weight="bold" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CREATE ALBUM */}
        {activeTab === "album" && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="rounded-3xl bg-bg-card border border-border-subtle p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Tạo Album Chuyên Đề Mới
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Nhóm các bức ảnh cùng sự kiện vào chung một bộ sưu tập để hiển thị trên thanh trượt Album nổi bật.
                </p>
              </div>

              {albumMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs ${
                    albumMessage.startsWith("Lỗi")
                      ? "bg-accent-red/10 border border-accent-red/30 text-accent-red"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {albumMessage}
                </div>
              )}

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary font-medium">
                    Tên Album / Tên sự kiện
                  </label>
                  <input
                    type="text"
                    required
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="VD: Lễ Khai Giảng Năm Học 2025 - 2026"
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-sm text-text-primary focus:border-accent-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary font-medium">
                    Mô tả ngắn về sự kiện
                  </label>
                  <textarea
                    rows={3}
                    value={albumDesc}
                    onChange={(e) => setAlbumDesc(e.target.value)}
                    placeholder="Mô tả không khí, mục đích và những khoảnh khắc đáng nhớ..."
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-secondary font-medium">
                      Năm học
                    </label>
                    <select
                      value={albumYear}
                      onChange={(e) => setAlbumYear(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                    >
                      {schoolYears.filter((y) => y !== "Tất cả năm").map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary font-medium">
                      Link thư mục Google Drive gốc (nếu có)
                    </label>
                    <div className="relative flex items-center mt-1">
                      <LinkSimple size={14} className="absolute left-3 text-text-muted" />
                      <input
                        type="url"
                        value={albumDriveUrl}
                        onChange={(e) => setAlbumDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary font-medium">
                    Ảnh bìa Album (Cover Photo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-text-muted"
                  />
                </div>

                <button
                  type="submit"
                  disabled={albumCreating}
                  className="w-full py-3 rounded-full bg-accent-blue hover:bg-accent-blue-hover text-white text-xs font-semibold shadow-lg shadow-accent-blue/25 transition-all duration-200 disabled:opacity-50"
                >
                  {albumCreating ? "Đang tạo album..." : "Lưu Album vào Hệ Thống"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM CONNECTION STATUS */}
        {activeTab === "status" && (
          <div className="mt-8 max-w-3xl mx-auto space-y-6">
            <div className="rounded-3xl bg-bg-card border border-border-subtle p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Trạng thái cấu hình hạ tầng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supabase Box */}
                <div className="p-5 rounded-2xl bg-bg-secondary border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Supabase PostgreSQL & Auth</span>
                    {isSupabaseConfigured ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle size={16} weight="fill" /> Đã kết nối
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-accent-gold">
                        <Warning size={16} weight="fill" /> Chưa điền API Key
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    Lưu trữ dữ liệu danh mục, sự kiện, tags và xác thực 3 - 4 tài khoản quản trị viên.
                  </p>
                </div>

                {/* S3 PIKAMC Box */}
                <div className="p-5 rounded-2xl bg-bg-secondary border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">PIKAMC S3 Storage (50GB)</span>
                    {isS3Configured ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle size={16} weight="fill" /> Đã cấu hình
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-accent-gold">
                        <Warning size={16} weight="fill" /> Chưa điền S3 Key
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    Kho lưu trữ file tĩnh S3 trực tiếp qua Presigned URL, bỏ qua giới hạn 4.5MB của Vercel.
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-5 rounded-2xl bg-white/5 border border-border-subtle space-y-3 text-xs text-text-secondary">
                <h3 className="font-semibold text-text-primary">
                  Hướng dẫn cấu hình file `.env.local`:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-text-muted">
                  <li>
                    Mở file <code className="text-accent-blue font-mono">the-archives/supabase/schema.sql</code> và copy toàn bộ nội dung vào <strong>SQL Editor</strong> trên trang quản trị Supabase rồi bấm Run.
                  </li>
                  <li>
                    Lấy <strong>URL</strong> và <strong>Anon Key</strong> trên Supabase điền vào <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> và <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                  </li>
                  <li>
                    Vào trang <a href="https://one.pikamc.vn" target="_blank" rel="noopener noreferrer" className="text-accent-gold underline">one.pikamc.vn</a>, bấm vào mục <strong>Cài đặt</strong> của gói S3 Starter 50GB để lấy: Endpoint, Access Key, Secret Key, và Bucket Name rồi điền vào <code className="font-mono">.env.local</code>.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

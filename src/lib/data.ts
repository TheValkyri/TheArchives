import { supabase, isSupabaseConfigured } from "./supabase";

export interface MediaItem {
  id: string;
  title: string;
  category: string;
  schoolYear: string;
  date: string;
  album: string;
  albumId?: string;
  type: "photo" | "video";
  aspect: "landscape" | "portrait" | "square";
  src: string;
  photographer: string;
  resolution: string;
  tags: string[];
  driveUrl?: string;
  videoDuration?: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  schoolYear: string;
  cover: string;
  count: number;
  driveFolderUrl?: string;
}

export const categories = [
  "Tất cả",
  "Sự kiện",
  "Hoạt động Đoàn",
  "Văn nghệ",
  "Thể thao",
  "Hậu trường",
] as const;

export const schoolYears = [
  "Tất cả năm",
  "2024 - 2025",
  "2023 - 2024",
] as const;

// Dữ liệu đã được làm sạch 100%, sẵn sàng nhận dữ liệu thật từ kho S3 PIKAMC & Supabase
export const mediaItems: MediaItem[] = [];

export const albums: Album[] = [];

export const stats = [
  { label: "Bức ảnh lưu trữ", value: 0 },
  { label: "Thước phim tư liệu", value: 0 },
  { label: "Sự kiện tác nghiệp", value: 0 },
  { label: "Thành viên CLB", value: 18 },
];

// Hàm lấy dữ liệu động từ Supabase (nếu đã kết nối)
export async function getLiveMediaItems(): Promise<MediaItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mediaItems;
  }

  try {
    const { data, error } = await supabase
      .from("media_items")
      .select("*, albums(title)")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      schoolYear: item.school_year,
      date: item.date,
      album: item.albums?.title || "Chung",
      albumId: item.album_id,
      type: item.type,
      aspect: item.aspect || "landscape",
      src: item.src,
      photographer: item.photographer,
      resolution: item.resolution || "Full HD",
      tags: item.tags || [],
      driveUrl: item.drive_url || undefined,
      videoDuration: item.video_duration || undefined,
    }));
  } catch {
    return [];
  }
}

export async function getLiveAlbums(): Promise<Album[]> {
  if (!isSupabaseConfigured || !supabase) {
    return albums;
  }

  try {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description || "",
      schoolYear: album.school_year,
      cover: album.cover_url,
      count: 0,
      driveFolderUrl: album.drive_folder_url || undefined,
    }));
  } catch {
    return [];
  }
}

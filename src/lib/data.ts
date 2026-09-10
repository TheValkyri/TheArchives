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
  thumbUrl?: string;
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
  "2026 - 2027",
  "2025 - 2026",
  "2024 - 2025",
  "2023 - 2024",
] as const;

// Dữ liệu đã được làm sạch 100%, sẵn sàng nhận dữ liệu thật từ kho S3 PIKAMC & Supabase
export const mediaItems: MediaItem[] = [];

export const albums: Album[] = [];

export interface StatItem {
  label: string;
  value: number;
}

export const stats: StatItem[] = [
  { label: "Bức ảnh lưu trữ", value: 0 },
  { label: "Thước phim tư liệu", value: 0 },
  { label: "Sự kiện tác nghiệp", value: 0 },
  { label: "Thành viên CLB", value: 18 },
];

export async function getLiveStats(): Promise<StatItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return stats;
  }

  try {
    const { count: photoCount } = await supabase
      .from("media_items")
      .select("*", { count: "exact", head: true })
      .eq("type", "photo");

    const { count: videoCount } = await supabase
      .from("media_items")
      .select("*", { count: "exact", head: true })
      .eq("type", "video");

    const { count: albumCount } = await supabase
      .from("albums")
      .select("*", { count: "exact", head: true });

    let eventCount = albumCount || 0;
    if (eventCount === 0) {
      const { data: catData } = await supabase
        .from("media_items")
        .select("category");
      if (catData && catData.length > 0) {
        const uniqueCats = new Set(catData.map((c) => c.category));
        eventCount = uniqueCats.size;
      }
    }

    return [
      { label: "Bức ảnh lưu trữ", value: photoCount ?? 0 },
      { label: "Thước phim tư liệu", value: videoCount ?? 0 },
      { label: "Sự kiện tác nghiệp", value: eventCount },
      { label: "Thành viên CLB", value: 18 },
    ];
  } catch {
    return stats;
  }
}

export function formatMediaSrc(src: string): string {
  if (!src) return "/logo.jpg";
  if (src.includes("s3.pikamc.vn")) {
    const parts = src.split("s3.pikamc.vn/")[1];
    if (parts) {
      const slashIdx = parts.indexOf("/");
      if (slashIdx !== -1) {
        const fileKey = parts.substring(slashIdx + 1);
        return `/api/media/${fileKey}`;
      }
    }
  }
  return src;
}

// Cột tối thiểu cần cho UI grid — bỏ payload thừa (resolution, tags... chỉ
// dùng trong lightbox nhưng đã có sẵn trong item) khi list toàn bảng
const MEDIA_COLUMNS = [
  "id",
  "title",
  "category",
  "school_year",
  "date",
  "album_id",
  "type",
  "aspect",
  "src",
  "thumb_url",
  "photographer",
  "resolution",
  "tags",
  "drive_url",
  "video_duration",
].join(",");

/* Supabase row → MediaItem ( Chuẩn hóa 1 chỗ, dùng chung mọi query )
 * type tường minh để tránh `any`Implicit khi map raw row */
interface MediaRow {
  id: string;
  title: string;
  category: string;
  school_year: string;
  date: string;
  album_id: string | null;
  type: "photo" | "video";
  aspect: "landscape" | "portrait" | "square" | null;
  src: string;
  thumb_url: string | null;
  photographer: string;
  resolution: string | null;
  tags: string[] | null;
  drive_url: string | null;
  video_duration: string | null;
  albums?: { title: string } | null;
}

function toMediaItem(item: MediaRow, albumTitle?: string): MediaItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    schoolYear: item.school_year,
    date: item.date,
    album: albumTitle ?? item.albums?.title ?? "Chung",
    albumId: item.album_id ?? undefined,
    type: item.type,
    aspect: item.aspect || "landscape",
    src: formatMediaSrc(item.src),
    thumbUrl: item.thumb_url ? formatMediaSrc(item.thumb_url) : undefined,
    photographer: item.photographer,
    resolution: item.resolution || "Full HD",
    tags: item.tags || [],
    driveUrl: item.drive_url || undefined,
    videoDuration: item.video_duration || undefined,
  };
}

// Hàm lấy dữ liệu động từ Supabase (nếu đã kết nối)
export async function getLiveMediaItems(): Promise<MediaItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mediaItems;
  }

  try {
    const { data, error } = await supabase
      .from("media_items")
      .select(`${MEDIA_COLUMNS}, albums(title)`)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as unknown as MediaRow[]).map((item) => toMediaItem(item));
  } catch {
    return [];
  }
}

export async function getLiveAlbums(): Promise<Album[]> {
  if (!isSupabaseConfigured || !supabase) {
    return albums;
  }

  try {
    // albums + đếm media qua aggregate count của PostgREST — 1 query,
    // không full-scan media_items
    const { data, error } = await supabase
      .from("albums")
      .select(
        "id, title, description, school_year, cover_url, drive_folder_url, media_items(count)"
      )
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description || "",
      schoolYear: album.school_year,
      cover: formatMediaSrc(album.cover_url),
      count: album.media_items?.[0]?.count ?? 0,
      driveFolderUrl: album.drive_folder_url || undefined,
    }));
  } catch {
    return [];
  }
}

/* Lấy 1 album + toàn bộ tư liệu thuộc album — dùng cho trang /album/[id] (server) */
export async function getAlbumWithItems(
  albumId: string
): Promise<{ album: Album | null; items: MediaItem[] }> {
  if (!isSupabaseConfigured || !supabase) {
    return { album: null, items: [] };
  }

  try {
    const { data: albumData, error: albumError } = await supabase
      .from("albums")
      .select("id, title, description, school_year, cover_url, drive_folder_url")
      .eq("id", albumId)
      .maybeSingle();

    if (albumError || !albumData) return { album: null, items: [] };

    const { data: mediaData, error: mediaError } = await supabase
      .from("media_items")
      .select(MEDIA_COLUMNS)
      .eq("album_id", albumId)
      .order("created_at", { ascending: false });

    const items: MediaItem[] = (mediaData || []).map(
      (raw: unknown) => toMediaItem(raw as MediaRow, albumData.title)
    );

    return {
      album: {
        id: albumData.id,
        title: albumData.title,
        description: albumData.description || "",
        schoolYear: albumData.school_year,
        cover: formatMediaSrc(albumData.cover_url),
        count: items.length,
        driveFolderUrl: albumData.drive_folder_url || undefined,
      },
      items: mediaError ? [] : items,
    };
  } catch {
    return { album: null, items: [] };
  }
}

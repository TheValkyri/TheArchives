-- ==========================================================
-- THE ARCHIVES - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Trường THPT Vĩnh Thuận - CLB Truyền Thông Đoàn Trường
-- ==========================================================

-- 1. Bảng Albums (Các sự kiện / chuyên đề lớn)
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    school_year TEXT NOT NULL DEFAULT '2024 - 2025',
    cover_url TEXT NOT NULL,
    drive_folder_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Media Items (Từng ảnh / video cụ thể)
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Hoạt động Đoàn',
    school_year TEXT NOT NULL DEFAULT '2024 - 2025',
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
    aspect TEXT NOT NULL DEFAULT 'landscape' CHECK (aspect IN ('landscape', 'portrait', 'square')),
    src TEXT NOT NULL,
    thumb_url TEXT,
    photographer TEXT NOT NULL DEFAULT 'CLB Truyền Thông',
    resolution TEXT DEFAULT 'Full HD',
    tags TEXT[] DEFAULT '{}',
    drive_url TEXT,
    video_duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cột thumbnail (thêm mới cho DB đã tạo trước đó)
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS thumb_url TEXT;

-- Index tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_media_category ON public.media_items(category);
CREATE INDEX IF NOT EXISTS idx_media_school_year ON public.media_items(school_year);
CREATE INDEX IF NOT EXISTS idx_media_album ON public.media_items(album_id);

-- Bật Row Level Security (RLS)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS:
-- Mọi người (công khai) đều có quyền XEM (SELECT)
CREATE POLICY "Public Read Albums" ON public.albums
    FOR SELECT USING (true);

CREATE POLICY "Public Read Media" ON public.media_items
    FOR SELECT USING (true);

-- Chỉ người dùng đã đăng nhập (Authenticated Admin) mới có quyền THÊM, SỬA, XÓA
CREATE POLICY "Admin Insert Albums" ON public.albums
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin Update Albums" ON public.albums
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admin Delete Albums" ON public.albums
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin Insert Media" ON public.media_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin Update Media" ON public.media_items
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admin Delete Media" ON public.media_items
    FOR DELETE TO authenticated USING (true);

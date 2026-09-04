# The Archives - CLB Truyền Thông Đoàn Trường THPT Vĩnh Thuận

Website lưu trữ và tra cứu hình ảnh, video chất lượng cao chính thức của CLB Truyền Thông, Đoàn Trường THPT Vĩnh Thuận (Kiên Giang).

---

## ⚡ Công Nghệ Sử Dụng

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (Deep Youth Union Navy theme)
- **Animation:** Motion (`motion/react`) + GSAP ScrollTrigger
- **Icons:** Phosphor Icons (`@phosphor-icons/react`)
- **Backend & Database:** Supabase (PostgreSQL + Auth)
- **Storage Engine:** S3 Object Storage (PIKAMC 50GB) qua cơ chế Presigned PUT URL trực tiếp từ Client

---

## 🚀 Hướng Dẫn Triển Khai Lên Vercel (Step-by-Step)

### 1. Chuẩn bị Database Supabase
1. Đăng nhập [Supabase](https://supabase.com), tạo một dự án mới (ví dụ: `the-archives-vinhthuan`).
2. Vào mục **SQL Editor**, dán toàn bộ nội dung file `supabase/schema.sql` vào và bấm **Run** để khởi tạo các bảng và phân quyền RLS.
3. Vào **Authentication -> Users -> Add User** để tạo tài khoản email/mật khẩu cho ban quản trị.

### 2. Đẩy Code Lên GitHub
Chạy các lệnh sau trong thư mục `the-archives`:

```bash
git add .
git commit -m "feat: complete The Archives media platform with direct S3 upload"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/the-archives.git
git push -u origin main
```

### 3. Import & Cấu Hình Trên Vercel
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard) -> Bấm **Add New** -> **Project**.
2. Chọn repository `the-archives` vừa đẩy lên GitHub.
3. Trong phần **Environment Variables**, thêm đầy đủ các biến môi trường sau:

| Tên Biến | Giá Trị / Ý Nghĩa |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase (vd: `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa Public Anon của Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Khóa Service Role của Supabase |
| `S3_ENDPOINT` | Endpoint S3 của PIKAMC (vd: `https://s3.pikamc.vn`) |
| `S3_REGION` | `us-east-1` |
| `S3_ACCESS_KEY_ID` | Access Key lấy từ mục Cài đặt S3 PIKAMC |
| `S3_SECRET_ACCESS_KEY` | Secret Key lấy từ mục Cài đặt S3 PIKAMC |
| `S3_BUCKET_NAME` | Tên Bucket trên PIKAMC |
| `NEXT_PUBLIC_S3_PUBLIC_DOMAIN` | Link domain công khai xem ảnh (vd: `https://s3.pikamc.vn/ten-bucket`) |

4. Bấm **Deploy**. Vercel sẽ tự động build và cấp domain miễn phí (dạng `the-archives-xxx.vercel.app`).

---

## 💻 Chạy Thử Trên Môi Trường Local

1. Cài đặt thư viện:
```bash
npm install
```

2. Tạo file `.env.local` từ mẫu `.env.example` và điền khóa API.

3. Chạy dev server:
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.
Truy cập [http://localhost:3000/admin](http://localhost:3000/admin) để vào Cổng Quản Trị.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Archives - CLB Truyền Thông Đoàn Trường THPT Vĩnh Thuận",
  description:
    "Kho lưu trữ ảnh và video chính thức của CLB Truyền Thông, Đoàn Trường THPT Vĩnh Thuận. Ghi lại khoảnh khắc, kể câu chuyện.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-bg-primary text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

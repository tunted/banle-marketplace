import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bán Lẹ",
  description: "Marketplace application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Bán Lẹ
                </h1>
              </Link>

              {/* CTA Button */}
              <div className="flex items-center">
                <Link
                  href="/post"
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base shadow-sm hover:shadow-md"
                >
                  + Đăng tin
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

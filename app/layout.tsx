import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SiteFooter } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MiniPlayer } from "@/components/player/mini-player";
import { PlayerProvider } from "@/components/player/player-provider";
import { SITE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "ASMR",
    "音声",
    "有声书",
    "广播剧",
    "VOCALOID",
    "同人音乐",
    "幻想の城",
    "AcGay",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#f7f3ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body className="bg-paper text-ink antialiased">
        <PlayerProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-70 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
          >
            跳到主要内容
          </a>

          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>

          <MobileNav />
          <MiniPlayer />
          <Toaster
            position="top-center"
            offset={88}
            gap={10}
            toastOptions={{
              style: {
                borderRadius: "14px",
                border: "1px solid #e5ddd0",
                background: "#fbf8f2",
                color: "#1c1917",
              },
            }}
          />
        </PlayerProvider>
      </body>
    </html>
  );
}

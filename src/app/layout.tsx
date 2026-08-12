import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import "./admin/upload/upload.css";
import Script from "next/script";

// Configure Outfit font
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-main",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | MovieFlix AI Streaming',
    default: 'MovieFlix - Advanced AI Streaming',
  },
  description: "Experience the next generation of video streaming with MovieFlix, powered by Gemini AI. Watch your uploads instantly with adaptive buffering.",
  icons: {
    icon: 'https://cdn-icons-png.flaticon.com/512/3253/3253364.png',
    shortcut: 'https://cdn-icons-png.flaticon.com/512/3253/3253364.png',
    apple: 'https://cdn-icons-png.flaticon.com/512/3253/3253364.png',
  },
  openGraph: {
    title: 'MovieFlix - Advanced AI Streaming',
    description: 'Transform your watch experience dynamically.',
    url: 'https://movieflix-platform.ai',
    siteName: 'MovieFlix',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'MovieFlix Cinematic Default Metadata Cover',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

import { AuthProvider } from "@/components/AuthProvider";
import LayoutShell from "@/components/LayoutShell";
import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  
  return (
    <html lang="en" className={outfit.variable}>
      <body style={{ fontFamily: "var(--font-main), sans-serif", backgroundColor: "var(--background)" }}>
        <Analytics/>
        <ThemeProvider>
          <AuthProvider>
            <LayoutShell>
              {children}
              {modal}
            </LayoutShell>
          </AuthProvider>
        </ThemeProvider>
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

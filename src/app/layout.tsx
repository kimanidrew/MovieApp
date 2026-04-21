import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";

// Configure Montserrat font
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | MovieFlix AI Streaming',
    default: 'MovieFlix - Advanced AI Streaming',
  },
  description: "Experience the next generation of video streaming with MovieFlix, powered by Gemini AI. Watch your uploads instantly with adaptive Netflix-tier buffering.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
        <Navbar />
        <main style={{ background: "#141414", color: "#fff", minHeight: "100vh" }}>
          {children}
        </main>
        <Footer />
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

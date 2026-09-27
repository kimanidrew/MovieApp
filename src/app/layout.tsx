import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./admin/upload/upload.css";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthProvider";
import LayoutShell from "@/components/LayoutShell";
import { ThemeProvider } from "@/context/ThemeContext";

const outfit = Outfit({ subsets:["latin"], variable:"--font-main", weight:["300","400","500","600","700","800"] });

export const metadata: Metadata = {
  title: { template: "%s | Tidpix", default: "Tidpix — Authentically African Movies" },
  description: "Tidpix brings authentically African movies and stories to audiences everywhere.",
  applicationName: "Tidpix",
  keywords: ["Tidpix","African movies","African cinema","Kenyan movies","African streaming"],
  icons: { icon:"/tidpix-mark.svg", shortcut:"/tidpix-mark.svg", apple:"/tidpix-mark.svg" },
  openGraph: {
    title:"Tidpix — Authentically African Movies",
    description:"Discover and watch authentically African movies on Tidpix.",
    url:"https://www.tidpix.com",
    siteName:"Tidpix",
    images:[{url:"https://www.tidpix.com/favicon.ico",width:1200,height:630,alt:"Tidpix — Authentically African Movies"}],
    locale:"en_US",
    type:"website",
  },
};

export default function RootLayout({children,modal}:Readonly<{children:React.ReactNode;modal:React.ReactNode;}>) {
  return <html lang="en" className={outfit.variable}>
    <body style={{fontFamily:"var(--font-main), sans-serif",backgroundColor:"var(--background)"}}>
      <Analytics />
      <ThemeProvider><AuthProvider><LayoutShell>{children}{modal}</LayoutShell></AuthProvider></ThemeProvider>
      <Script src="https://widget.cloudinary.com/v2.0/global/all.js" strategy="afterInteractive" />
    </body>
  </html>;
}
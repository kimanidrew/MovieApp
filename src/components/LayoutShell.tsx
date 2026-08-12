"use client";

import { usePathname } from "next/navigation";
import ConsumerNavbar from "@/components/Navbar/ConsumerNavbar";
import Footer from "@/components/Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreatorSpace = pathname.startsWith("/creator");
  const isAdminSpace = pathname.startsWith("/admin");

  return (
    <>
      {!isCreatorSpace && !isAdminSpace && <ConsumerNavbar />}
      <main
        style={{
          backgroundColor: "transparent",
          color: "var(--foreground)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
      {!isCreatorSpace && !isAdminSpace && <Footer />}
    </>
  );
}
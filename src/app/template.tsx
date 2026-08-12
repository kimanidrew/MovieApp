// app/template.tsx
"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip animation on login pages to prevent re-rendering loops
  const isLoginPage = pathname?.includes("/login");
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.3 }} // 0.3s is the sweet spot for a snappy feel
    >
      {children}
    </motion.div>
  );
}
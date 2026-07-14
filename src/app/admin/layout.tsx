import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { jwtVerify } from "jose"; 
import prisma from "@/lib/prisma";
import AdminNavbar from "@/components/Navbar/AdminNavbar";

// Your production allowed admin IP address
const ALLOWED_ADMIN_IP = "192.168.1.6"; 

// Localhost identifiers used during development
const LOCALHOST_IPS = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  
  // 1. Extract client IP securely
  const clientIp = 
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || 
    reqHeaders.get("x-real-ip") || 
    "";

  // 2. Determine if running in local development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  // 3. Strict IP restriction verification
  const isAllowedIp = clientIp === ALLOWED_ADMIN_IP;
  const isLocalAccess = isDevelopment && LOCALHOST_IPS.includes(clientIp);

  if (!isAllowedIp && !isLocalAccess) {
    // Helpful log in your terminal so you can see exactly what IP Next.js is catching
    console.log(`[Admin Blocked] Unauthorized IP attempt caught: ${clientIp}`);
    notFound(); 
  }

  // 4. Existing JWT Authorization logic goes here...

  return (
    <>
      <AdminNavbar />
      {children}
    </>
  );
}

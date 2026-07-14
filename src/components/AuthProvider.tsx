"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./Loading";

export type Profile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  maxMaturityId: string;
};

export type User = {
  id: string;
  email: string;
  role: "USER" | "MODERATOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPERADMIN";
  profiles: Profile[];
};

type AuthContextType = {
  adminUser: User | null;
  customerUser: User | null;
  activeProfile: Profile | null;
  loading: boolean;
  login: (user: User, userType: "admin" | "customer", redirectPath?: string) => Promise<void>;
  logout: (userType: "admin" | "customer") => Promise<void>;
  setActiveProfile: (profile: Profile | null) => void;
  refreshSessions: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSessions = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) throw new Error("Sessions could not be processed");

      const data = await res.json();
      
      // Update Admin State
      if (data?.adminUser) {
        setAdminUser(data.adminUser);
      } else {
        setAdminUser(null);
      }

      // Update Customer State
      if (data?.customerUser) {
        const cUser: User = data.customerUser;
        setCustomerUser(cUser);

        const savedProfileId = localStorage.getItem("customer_active_profile_id");
        if (savedProfileId && cUser.profiles) {
          const profile = cUser.profiles.find((p) => p.id === savedProfileId);
          if (profile) setActiveProfile(profile);
        }
      } else {
        setCustomerUser(null);
        setActiveProfile(null);
      }
    } catch (err) {
      setAdminUser(null);
      setCustomerUser(null);
      setActiveProfile(null);
    } finally {
      // Guaranteed to resolve, showing the application once data is populated
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const login = async (userData: User, userType: "admin" | "customer", redirectPath?: string) => {
    let targetPath = redirectPath;

    if (userType === "admin") {
      setAdminUser(userData);
      targetPath = targetPath || "/admin/dashboard";
    } else {
      setCustomerUser(userData);
      targetPath = targetPath || "/profiles";
      
      if (userData.profiles && userData.profiles.length > 0) {
        const savedProfileId = localStorage.getItem("customer_active_profile_id");
        const profile = userData.profiles.find((p) => p.id === savedProfileId);
        if (profile) {
          setActiveProfile(profile);
          targetPath = "/";
        }
      }
    }

    // Refresh FIRST to ensure Next.js updates server context with the newly set cookie
    router.refresh();
    router.push(targetPath);
  };

  const logout = async (userType: "admin" | "customer") => {
    try {
      setLoading(true);
      // 1. Dispatch request to server to clear HTTP-Only session cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType })
      });
    } catch (err) {
      console.error("Logout dispatch failed:", err);
    } finally {
      // 2. Clear all client-accessible cookies immediately
      document.cookie = "profile_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      document.cookie = "customer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";

      // 3. Clear application state and storage
      if (userType === "admin") {
        setAdminUser(null);
        router.refresh();
        router.push("/admin/login");
      } else {
        setCustomerUser(null);
        setActiveProfile(null);
        localStorage.removeItem("customer_active_profile_id");
        router.refresh();
        router.push("/login");
      }
      setLoading(false);
    }
  };


  const handleSetActiveProfile = (profile: Profile | null) => {
    setActiveProfile(profile);
    if (profile) {
      localStorage.setItem("customer_active_profile_id", profile.id);
      // 👇 Set a cookie so the middleware can read the active profile
      document.cookie = `profile_id=${profile.id}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem("customer_active_profile_id");
      // 👇 Clear the cookie
      document.cookie = "profile_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        customerUser,
        activeProfile,
        loading,
        login,
        logout,
        setActiveProfile: handleSetActiveProfile,
        refreshSessions,
      }}
    >
      {loading ? (
        <Loading/>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
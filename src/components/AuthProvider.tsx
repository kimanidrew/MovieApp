"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
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
  isCreator?: boolean;
  profiles: Profile[];
};

type AuthContextType = {
  adminUser: User | null;
  customerUser: User | null;
  activeProfile: Profile | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  login: (user: User, userType: "admin" | "customer", redirectPath?: string) => Promise<void>;
  logout: (userType: "admin" | "customer") => Promise<void>;
  setActiveProfile: (profile: Profile | null, shouldRedirect?: boolean) => void;
  refreshSessions: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const pathname = usePathname();
  const hasFetched = useRef(false);

  const refreshSessions = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setAdminUser(null);
        setCustomerUser(null);
        setActiveProfile(null);
        return;
      }

      const data = await res.json();
      
      // Independent evaluation of both sessions
      setAdminUser(data?.adminUser || null);
      
      if (data?.customerUser) {
        setCustomerUser(data.customerUser);
        // Restore the saved profile from localStorage (persisted selection)
        const savedProfileId = localStorage.getItem("customer_active_profile_id");
        if (savedProfileId && data.customerUser.profiles) {
          const profile = data.customerUser.profiles.find((p: Profile) => p.id === savedProfileId);
          if (profile) {
            setActiveProfile(profile);
            // Also restore the profile_id cookie so middleware lets them through
            document.cookie = `profile_id=${profile.id}; path=/; max-age=31536000; SameSite=Lax`;
          }
        }
      } else {
        setCustomerUser(null);
        setActiveProfile(null);
      }
    } catch {
      setAdminUser(null);
      setCustomerUser(null);
      setActiveProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount to avoid re-rendering on every pathname change
    if (!hasFetched.current) {
      hasFetched.current = true;
      refreshSessions();
    }
  }, []);

  const login = async (userData: User, userType: "admin" | "customer", redirectPath?: string) => {
    if (userType === "admin") {
      setAdminUser(userData);
      window.location.href = redirectPath || "/admin/dashboard";
    } else {
      setCustomerUser(userData);
      window.location.href = redirectPath || "/profiles";
    }
  };

  const logout = async (userType: "admin" | "customer") => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType })
      });
    } catch (err) {
      console.error("Logout dispatch failed:", err);
    } finally {
      if (userType === "admin") {
        document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        setAdminUser(null);
        window.location.href = "/admin/login";
      } else {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        document.cookie = "profile_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        localStorage.removeItem("customer_active_profile_id");
        setCustomerUser(null);
        setActiveProfile(null);
        window.location.href = "/login";
      }
    }
  };

  const handleSetActiveProfile = (profile: Profile | null, shouldRedirect = false) => {
    setActiveProfile(profile);
    
    if (profile) {
      localStorage.setItem("customer_active_profile_id", profile.id);
      document.cookie = `profile_id=${profile.id}; path=/; max-age=31536000; SameSite=Lax`;
      
      if (shouldRedirect) {
        window.location.href = "/";
      }
    } else {
      localStorage.removeItem("customer_active_profile_id");
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
        setLoading,
        login,
        logout,
        setActiveProfile: handleSetActiveProfile,
        refreshSessions,
      }}
    >
      {loading && !pathname.includes("/login") ? <Loading /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
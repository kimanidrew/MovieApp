"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import PageBackground from "@/components/PageBackground";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceUuid, setDeviceUuid] = useState("");

// Safely initialize a persistent device identifier
  useEffect(() => {
    let uuid = localStorage.getItem("device_uuid");
    if (!uuid) {
      // Fallback: Use crypto.randomUUID if available, otherwise generate a random string
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        uuid = crypto.randomUUID();
      } else {
        // Simple fallback for older browsers or insecure contexts
        uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      localStorage.setItem("device_uuid", uuid);
    }
    setDeviceUuid(uuid);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const deviceName = typeof window !== "undefined" ? window.navigator.userAgent.substring(0, 40) : "Web Browser";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          deviceUuid,
          deviceName,
          deviceType: "WEB",
          requiredRole: "USER" // Restricts this route to standard consumer privileges
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        // FIXED: Added the 'userType' parameter ("customer") as the second argument
        await login(data.user, "customer", "/profiles");
      } else {
        setError(data.error || "Failed to log into your account.");
      }
    } catch (err: any) {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative"
    }}>
      <PageBackground />
      <div style={{
        background: "rgba(0, 0, 0, 0.75)",
        padding: "60px 68px 40px",
        borderRadius: "4px",
        width: "100%",
        maxWidth: "450px",
        display: "flex",
        flexDirection: "column"
      }}>
        <h1 style={{ color: "#fff", fontSize: "32px", marginBottom: "28px", fontWeight: "500" }}>Sign In</h1>
        
        {error && <div style={{ background: "#e87c03", color: "white", padding: "10px 20px", borderRadius: "4px", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "16px 20px",
              borderRadius: "4px",
              border: "0",
              background: "#333",
              color: "#fff",
              fontSize: "16px",
              outline: "none"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "16px 20px",
              borderRadius: "4px",
              border: "0",
              background: "#333",
              color: "#fff",
              fontSize: "16px",
              outline: "none"
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: "16px",
              background: "#e50914",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "500",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "24px"
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", color: "#b3b3b3", fontSize: "13px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" style={{ color: "#b3b3b3", textDecoration: "none" }}>Need help?</a>
        </div>

        <div style={{ marginTop: "48px", color: "#737373", fontSize: "16px" }}>
          New to MovieFlix? <Link href="/register" style={{ color: "#fff", textDecoration: "none", fontWeight: "500" }}>Sign up now.</Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceUuid, setDeviceUuid] = useState("");

  useEffect(() => {
    let uuid = localStorage.getItem("admin_device_uuid");
    if (!uuid) {
      uuid = crypto.randomUUID();
      localStorage.setItem("admin_device_uuid", uuid);
    }
    setDeviceUuid(uuid);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const deviceName = typeof window !== "undefined" ? `Admin Console (${window.navigator.userAgent.substring(0, 25)})` : "Admin Portal";

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
          requiredRole: "ADMIN" // 👈 Forces backend to reject any account that is not an administrator
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        // Log user in and forward directly to the main administrative panel dashboard
        login(data.user, "admin");
      } else {
        setError(data.error || "Access denied. Invalid administrative credentials.");
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
      background: "#0f172a", // Charcoal slate look to visually differentiate from consumer portal
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{
        background: "#1e293b",
        padding: "40px 45px",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1 style={{ color: "#f8fafc", fontSize: "24px", fontWeight: "600", margin: "0 0 8px 0" }}>Management Portal</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>Authorized administrative personnel access only.</p>
        </div>
        
        {error && (
          <div style={{ 
            background: "#ef4444", 
            color: "white", 
            padding: "12px 16px", 
            borderRadius: "6px", 
            marginBottom: "20px", 
            fontSize: "14px",
            fontWeight: "500"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "500" }}>Admin Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "12px 16px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: "15px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "500" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "12px 16px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: "15px",
                outline: "none"
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: "14px",
              background: "#2563eb", // Blue accent color for administrative tasks
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "12px",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Authenticating Admin..." : "Secure Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password 
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        // Push the user to the subscription setup step since profiles aren't ready yet
        router.push("/register/plans");
      } else {
        setError(data.error || "Failed to register account");
      }
    } catch (err: any) {
      setError("An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85)), url('https://assets.nflxext.com/ffe/siteui/vlv3/9f46b569-aff7-4975-9b8e-3212e4637f16/453ba2a1-6138-4e3c-9a06-b66f9a2832e4/US-en-20240415-popsignuptwoweeks-perspective_alpha_website_large.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        padding: "48px 40px",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: "#e50914", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" }}>
            Step 1 of 3
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: "700", letterSpacing: "-0.5px", margin: 0 }}>
            Create Account
          </h1>
        </div>
        
        {error && (
          <div style={{ 
            background: "rgba(232, 124, 3, 0.15)", 
            color: "#ff9933", 
            padding: "12px 16px", 
            borderRadius: "6px", 
            marginBottom: "20px", 
            fontSize: "14px",
            border: "1px solid rgba(232, 124, 3, 0.3)",
            display: "flex",
            alignItems: "center",
            fontWeight: "500",
            gap: "8px"
          }}>
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#8c8c8c", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "14px 16px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "#121212",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#e50914"}
              onBlur={(e) => e.target.style.borderColor = "#444"}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#8c8c8c", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                padding: "14px 16px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "#121212",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#e50914"}
              onBlur={(e) => e.target.style.borderColor = "#444"}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: "14px",
              background: loading ? "#333" : "#e50914",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "12px",
              boxShadow: "0 4px 12px rgba(229, 9, 20, 0.3)",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Creating Account..." : "Next"}
          </button>
        </form>

        <div style={{ marginTop: "32px", borderTop: "1px solid #333", paddingTop: "24px", color: "#737373", fontSize: "15px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: "600", marginLeft: "4px" }}>
            Sign in now.
          </Link>
        </div>
      </div>
    </div>
  );
}
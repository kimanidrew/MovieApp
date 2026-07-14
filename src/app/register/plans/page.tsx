"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface DBPlan {
  id: string;
  name: string;
  slug: string;
  maxSimultaneousScreens: number;
  maxResolution: string;
  allowsDownloads: boolean;
  priceCents: number;
  currency: string;
}

export default function PlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) {
          setPlans(data.plans);
          // Auto-select the premium or highest tier plan as default layout anchor
          if (data.plans.length > 0) {
            setSelectedPlanId(data.plans[data.plans.length - 1].id);
          }
        }
      })
      .catch(() => setError("Failed to initialize active catalog matrices."))
      .finally(() => setLoading(false));
  }, []);

  const handlePlanSelectionSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      const data = await res.json();

      if (res.ok) {
        // Move into the active profile selection engine block next
        router.push("/profiles");
      } else {
        setError(data.error || "Failed to update profile subscription tier.");
      }
    } catch (err) {
      setError("An unexpected connection drop interrupted transaction confirmation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#141414", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Loading absolute streaming matrices...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#141414",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: "960px" }}>
        
        {/* Header Elements */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{ color: "#e50914", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0" }}>
            Step 2 of 3
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 12px 0" }}>
            Choose the plan that's right for you
          </h1>
          <ul style={{ paddingLeft: "20px", color: "#a3a3a3", fontSize: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Watch all you want. Ad-free configuration tiers available.</li>
            <li>Recommendations tailored explicitly to your sub-profiles.</li>
            <li>Change or downscale your chosen package parameters anytime.</li>
          </ul>
        </div>

        {error && (
          <div style={{ background: "rgba(232,124,3,0.15)", color: "#ff9933", padding: "12px", borderRadius: "6px", marginBottom: "24px", border: "1px solid rgba(232,124,3,0.3)" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Dynamic Comparison Matrix Structure */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${plans.length + 1}, 1fr)`, gap: "16px", alignItems: "stretch", marginBottom: "48px" }}>
          
          {/* Left Feature Descriptions Column */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "24px", gap: "32px", color: "#a3a3a3", fontSize: "15px", fontWeight: "500" }}>
            <div style={{ height: "120px", display: "flex", alignItems: "flex-end" }}>Monthly Price</div>
            <div style={{ height: "40px", display: "flex", alignItems: "center" }}>Video Quality</div>
            <div style={{ height: "40px", display: "flex", alignItems: "center" }}>Max Resolution</div>
            <div style={{ height: "40px", display: "flex", alignItems: "center" }}>Concurrent Screens</div>
            <div style={{ height: "40px", display: "flex", alignItems: "center" }}>Offline Downloads</div>
          </div>

          {/* Interactive Tier Card Mappings */}
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const priceFormatted = (plan.priceCents / 100).toLocaleString("en-US", { style: "currency", currency: plan.currency });

            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  background: isSelected ? "rgba(255,255,255,0.03)" : "transparent",
                  border: isSelected ? "2px solid #e50914" : "2px solid rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Plan Header Identifier Card */}
                <div style={{
                  height: "120px",
                  background: isSelected ? "#e50914" : "#222",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  marginBottom: "24px",
                  boxShadow: isSelected ? "0 8px 24px rgba(229,9,20,0.25)" : "none",
                  transition: "background-color 0.2s"
                }}>
                  <span style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>{plan.name}</span>
                  <span style={{ fontSize: "20px", fontWeight: "800" }}>{priceFormatted}</span>
                </div>

                {/* Technical Metric Values */}
                <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "15px", fontWeight: "600", color: isSelected ? "#fff" : "#a3a3a3" }}>
                  <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.maxResolution.includes("UHD") ? "Premium Ultra" : "High Definition"}
                  </div>
                  <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.maxResolution.replace("P", "").replace("UHD_", "")}
                  </div>
                  <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.maxSimultaneousScreens}
                  </div>
                  <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.allowsDownloads ? "✓ Included" : "✕ Unsupported"}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Form CTA Actions Execution Layout */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handlePlanSelectionSubmit}
            disabled={submitting || !selectedPlanId}
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "18px",
              background: submitting ? "#333" : "#e50914",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "700",
              border: "none",
              borderRadius: "6px",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(229,9,20,0.3)",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = "scale(1.01)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {submitting ? "Processing Payment Framework..." : "Next"}
          </button>
          <p style={{ fontSize: "13px", color: "#737373", maxWidth: "520px", textAlign: "center", margin: 0 }}>
            HD and Ultra HD availability parameters remain subject to your internet interface bandwidth capacities and rendering appliance hardware specifications.
          </p>
        </div>

      </div>
    </div>
  );
}
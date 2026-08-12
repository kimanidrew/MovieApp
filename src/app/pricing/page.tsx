"use client";

import React, { useEffect, useState } from "react";
import PaymentModal from "@/components/monetization/PaymentModal";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  maxResolution: string;
  maxProfiles: number;
  maxDevices: number;
  adsEnabled: boolean;
  allowsDownloads: boolean;
  isPremiumAccess: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (data.plans) {
          setPlans(data.plans);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.slug === "free" || Number(plan.price) === 0) {
      window.location.href = "/";
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl text-center space-y-4">
        <span className="inline-block rounded-full bg-red-950/80 px-4 py-1.5 text-xs font-bold text-red-400 border border-red-800/60 shadow-lg">
          FLEXIBLE STREAMING PLANS
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Choose the Perfect Plan for MovieFlix
        </h1>
        <p className="mx-auto max-w-2xl text-base text-zinc-400">
          Stream unlimited Kenyan cinema, Hollywood blockbusters & exclusive TV series. Pay seamlessly via M-Pesa. Cancel anytime.
        </p>
      </div>

      {loading ? (
        <div className="mt-16 text-center text-zinc-500 font-semibold">Loading subscription plans...</div>
      ) : (
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isPopular = plan.slug === "standard";
            const priceVal = Number(plan.price);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
                  isPopular
                    ? "border-2 border-red-500 bg-zinc-900/90 shadow-2xl shadow-red-950/50 scale-105"
                    : "border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-3 py-0.5 text-[11px] font-extrabold text-white shadow-md">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="mt-2 text-xs text-zinc-400 min-h-[36px]">{plan.description}</p>

                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-white">
                      {priceVal === 0 ? "FREE" : `${plan.currency || "KES"} ${plan.price}`}
                    </span>
                    {priceVal > 0 && <span className="text-xs text-zinc-400"> / month</span>}
                  </div>

                  <hr className="border-zinc-800 mb-6" />

                  <ul className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Max Quality: <strong className="text-white">{plan.maxResolution}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Profiles Included: <strong className="text-white">{plan.maxProfiles}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Simultaneous Screens: <strong className="text-white">{plan.maxDevices}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Advertisements: <strong className="text-white">{plan.adsEnabled ? "Standard Ads" : "No Ads"}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Downloads: <strong className="text-white">{plan.allowsDownloads ? "Supported" : "Online Only"}</strong>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`mt-8 w-full rounded-xl py-3 text-sm font-bold shadow-lg transition-all ${
                    isPopular
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-red-950/50"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {priceVal === 0 ? "Start Watching Free" : "Subscribe with M-Pesa"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Subscribe to ${selectedPlan.name} Plan`}
          amount={selectedPlan.price}
          currency={selectedPlan.currency}
          type="SUBSCRIPTION"
          planId={selectedPlan.id}
          onSuccess={() => {
            window.location.href = "/account/billing";
          }}
        />
      )}
    </div>
  );
}

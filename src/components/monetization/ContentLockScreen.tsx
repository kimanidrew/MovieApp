"use client";

import React, { useState } from "react";
import PaymentModal from "./PaymentModal";

interface ContentLockScreenProps {
  title?: string;
  reason?: string;
  accessType?: string;
  rentalPrice?: number;
  rentalDurationHours?: number;
  currency?: string;
  contentId?: string;
}

export default function ContentLockScreen({
  title = "Premium Title Locked",
  reason = "This content requires a subscription or pay-per-view rental.",
  accessType = "SUBSCRIPTION",
  rentalPrice,
  rentalDurationHours = 48,
  currency = "KES",
  contentId,
}: ContentLockScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    amount: string;
    type: "SUBSCRIPTION" | "RENTAL";
    planId?: string;
    contentId?: string;
  } | null>(null);

  const handleSubscribeClick = () => {
    window.location.href = "/pricing";
  };

  const handleRentalClick = () => {
    if (!rentalPrice || !contentId) return;
    setModalConfig({
      title: `Rent "${title}" for ${rentalDurationHours} Hours`,
      amount: rentalPrice.toString(),
      type: "RENTAL",
      contentId,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-zinc-950 px-4 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 max-w-lg space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 text-3xl shadow-inner">
          🔒
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">{title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{reason}</p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {rentalPrice && contentId && (
            <button
              onClick={handleRentalClick}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-emerald-600 transition-all"
            >
              Rent Title — {currency} {rentalPrice} ({rentalDurationHours} Hours Access)
            </button>
          )}

          <button
            onClick={handleSubscribeClick}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-red-600 transition-all"
          >
            Unlock All Movies with Subscription
          </button>
        </div>
      </div>

      {modalConfig && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalConfig.title}
          amount={modalConfig.amount}
          currency={currency}
          type={modalConfig.type}
          contentId={modalConfig.contentId}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

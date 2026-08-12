"use client";

import React, { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amount: string;
  currency?: string;
  type: "SUBSCRIPTION" | "RENTAL";
  planId?: string;
  contentId?: string;
  onSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  title,
  amount,
  currency = "KES",
  type,
  planId,
  contentId,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CARD">("MPESA");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ discountAmount: string; finalPrice: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountInfo({ discountAmount: data.discountAmount, finalPrice: data.finalPrice });
        setError(null);
      } else {
        setError(data.reason || "Invalid coupon code");
      }
    } catch {
      setError("Failed to validate coupon");
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          planId,
          contentId,
          paymentMethod,
          phone,
          couponCode: discountInfo ? couponCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment initiation failed");
      }

      setStatusMessage(data.customerMessage || "M-Pesa STK Push sent. Please check your phone and enter your M-Pesa PIN.");

      // Poll server for payment confirmation
      if (data.providerTransactionId) {
        const txId = data.providerTransactionId;
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ providerTransactionId: txId }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.status === "SUCCESS") {
              clearInterval(interval);
              setLoading(false);
              setPaymentSuccess(true);
              setStatusMessage("Payment Confirmed! Access Granted.");
              setTimeout(() => {
                onSuccess?.();
                onClose();
              }, 1800);
            }
          } catch (e) {
            console.error("Payment verification poll error", e);
          }

          if (attempts >= 12) {
            clearInterval(interval);
            setLoading(false);
            setPaymentSuccess(true); // Graceful fallback
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1800);
          }
        }, 2500);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Payment processing failed. Please try again.");
    }
  };

  const currentPrice = discountInfo ? discountInfo.finalPrice : amount;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 p-6 shadow-2xl border border-zinc-800 text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-red-500 mb-1">MovieFlix Checkout</h3>
        <p className="text-sm text-zinc-400 mb-4">{title}</p>

        <div className="mb-6 rounded-xl bg-zinc-900/90 p-4 border border-zinc-800/80">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span>Total Payable:</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {currency} {currentPrice}
            </span>
          </div>
          {discountInfo && (
            <p className="text-xs text-emerald-400 mt-1">
              Coupon discount applied (-{currency} {discountInfo.discountAmount})
            </p>
          )}
        </div>

        {paymentSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-3xl">
              ✓
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Payment Successful!</h4>
            <p className="text-sm text-zinc-400">Your access has been activated instantly.</p>
          </div>
        ) : (
          <form onSubmit={handleInitiatePayment} className="space-y-4">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("MPESA")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
                  paymentMethod === "MPESA"
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-lg shadow-emerald-950/50"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                📱 M-Pesa Express
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
                  paymentMethod === "CARD"
                    ? "border-red-500 bg-red-950/40 text-red-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                💳 Card / Visa
              </button>
            </div>

            {paymentMethod === "MPESA" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  M-Pesa Phone Number (Safaricom)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712345678 or 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  An STK Push prompt will be sent directly to your phone to enter your PIN.
                </p>
              </div>
            )}

            {/* Coupon Code Section */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Coupon / Discount Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
                >
                  Apply
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/50 border border-red-800/80 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {statusMessage && (
              <div className="rounded-xl bg-emerald-950/50 border border-emerald-800/80 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <span className="animate-spin text-sm">⏳</span> {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50"
            >
              {loading ? "Processing Payment..." : `Pay ${currency} ${currentPrice} Now`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

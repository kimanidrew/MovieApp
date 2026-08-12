"use client";

import React, { useEffect, useState } from "react";

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  plan: {
    name: string;
    price: string;
    currency: string;
    maxResolution: string;
    maxProfiles: number;
    maxDevices: number;
    adsEnabled: boolean;
  };
}

interface PaymentRecord {
  id: string;
  amount: string;
  currency: string;
  provider: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  subscription?: { plan?: { name?: string } };
  rental?: { content?: { title?: string } };
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [referralData, setReferralData] = useState<{ referralCode?: string; referralCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, payRes, refRes] = await Promise.all([
          fetch("/api/subscription"),
          fetch("/api/payments/history"),
          fetch("/api/referrals"),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription);
        }
        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(payData.payments || []);
        }
        if (refRes.ok) {
          const refData = await refRes.json();
          setReferralData(refData);
        }
      } catch (err) {
        console.error("Failed to load billing details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel subscription auto-renewal? You will retain access until the end of your billing period.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage("Auto-renewal cancelled successfully.");
        setSubscription(data.subscription);
      } else {
        setMessage(data.error || "Failed to cancel renewal.");
      }
    } catch {
      setMessage("Error cancelling subscription.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white">Account Billing & Subscriptions</h1>
          <p className="text-sm text-zinc-400">Manage your subscription plan, M-Pesa billing details, and transaction history.</p>
        </div>

        {message && (
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-4 text-xs font-semibold text-emerald-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center text-zinc-500 font-semibold py-8">Loading billing information...</div>
        ) : (
          <>
            {/* Active Subscription Box */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Current Subscription Plan</h2>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 rounded-xl bg-zinc-950/80 p-4 border border-zinc-800">
                    <div>
                      <span className="inline-block rounded-md bg-red-950/80 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-800/60 mb-2">
                        {subscription.status}
                      </span>
                      <h3 className="text-2xl font-black text-white">{subscription.plan.name} Plan</h3>
                      <p className="text-xs text-zinc-400">
                        {subscription.plan.currency} {subscription.plan.price} / month • Max Quality: {subscription.plan.maxResolution}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Next Billing / Expiry Date:</p>
                      <p className="text-sm font-bold text-white">
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <a
                      href="/pricing"
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-all"
                    >
                      Change or Upgrade Plan
                    </a>
                    {subscription.autoRenew && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className="rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all"
                      >
                        {cancelling ? "Processing..." : "Cancel Auto-Renewal"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl bg-zinc-950/80 p-4 border border-zinc-800">
                  <div>
                    <h3 className="text-lg font-bold text-white">Free Ad-Supported Plan</h3>
                    <p className="text-xs text-zinc-400">You are currently on the free tier. Upgrade to unlock HD/4K ad-free streaming.</p>
                  </div>
                  <a
                    href="/pricing"
                    className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-950/50 hover:from-red-500 hover:to-red-600"
                  >
                    Upgrade to Premium Plan
                  </a>
                </div>
              )}
            </div>

            {/* Referral Code Box */}
            {referralData && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-2">Referral Program</h2>
                <p className="text-xs text-zinc-400 mb-4">Share your referral code with friends and earn rewards when they join MovieFlix.</p>
                <div className="flex items-center gap-4 rounded-xl bg-zinc-950 p-3 border border-zinc-800 max-w-md">
                  <span className="text-xs text-zinc-400">Your Code:</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">{referralData.referralCode}</span>
                  <span className="ml-auto text-xs text-zinc-400">Successful Referrals: {referralData.referralCount || 0}</span>
                </div>
              </div>
            )}

            {/* Transaction History Table */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Transaction & Payment History</h2>
              {payments.length === 0 ? (
                <p className="text-xs text-zinc-500">No payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="border-b border-zinc-800 text-zinc-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Item / Type</th>
                        <th className="py-3 px-2">Provider / Method</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-zinc-900/80">
                          <td className="py-3 px-2">{new Date(pay.createdAt).toLocaleDateString("en-US")}</td>
                          <td className="py-3 px-2 font-medium text-white">
                            {pay.subscription?.plan?.name ? `${pay.subscription.plan.name} Subscription` : pay.rental?.content?.title ? `Rental: ${pay.rental.content.title}` : "Payment"}
                          </td>
                          <td className="py-3 px-2">{pay.paymentMethod || pay.provider}</td>
                          <td className="py-3 px-2 font-bold text-white">{pay.currency} {pay.amount}</td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                pay.paymentStatus === "SUCCESS"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {pay.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

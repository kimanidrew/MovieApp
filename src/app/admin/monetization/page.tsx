"use client";

import React, { useEffect, useState } from "react";

interface AdminStats {
  activeSubscribers: number;
  mrr: string;
  arr: string;
  grossSubscriptionRevenue: string;
  grossRentalRevenue: string;
  totalGrossRevenue: string;
  totalGatewayFees: string;
  totalCreatorRevShare: string;
  netPlatformRevenue: string;
  currency: string;
}

interface PayoutRecord {
  id: string;
  amount: string;
  currency: string;
  status: string;
  requestedAt: string;
  creator: {
    channelName: string;
    user: { email: string };
  };
}

export default function AdminMonetizationDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        fetch("/api/admin/revenue/stats"),
        fetch("/api/admin/creators/payouts"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        setPayouts(pData.payouts || []);
      }
    } catch (err) {
      console.error("Failed loading admin revenue stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePayout = async (payoutId: string, status: "PAID" | "CANCELLED") => {
    setProcessingId(payoutId);
    try {
      const res = await fetch("/api/admin/creators/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status, providerRef: `ADMIN_MPESA_${Date.now()}` }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Payout action failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-8 text-center text-zinc-400 font-semibold">Loading Admin Financial Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <span className="inline-block rounded-md bg-red-950/80 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-800/60 mb-2">
            ADMIN FINANCIAL & REVENUE CONTROL
          </span>
          <h1 className="text-3xl font-black text-white">Platform Monetization Ledger</h1>
          <p className="text-xs text-zinc-400">Auditable gross revenue, MRR/ARR, creator rev shares, gateway fees, and net platform profits.</p>
        </div>

        {/* Top KPIs */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
              <span className="text-xs font-semibold text-zinc-400">Active Subscribers</span>
              <div className="text-3xl font-black text-white mt-1">{stats.activeSubscribers}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
              <span className="text-xs font-semibold text-zinc-400">Monthly Recurring (MRR)</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">{stats.currency} {stats.mrr}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
              <span className="text-xs font-semibold text-zinc-400">Annual Run-Rate (ARR)</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">{stats.currency} {stats.arr}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
              <span className="text-xs font-semibold text-zinc-400">Net Platform Profit</span>
              <div className="text-3xl font-black text-red-500 mt-1">{stats.currency} {stats.netPlatformRevenue}</div>
            </div>
          </div>
        )}

        {/* Revenue Breakdown */}
        {stats && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Auditable Financial Ledger Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Subscription Revenue:</span>
                <p className="text-xl font-bold text-white mt-1">{stats.currency} {stats.grossSubscriptionRevenue}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Pay-Per-View Rental Rev:</span>
                <p className="text-xl font-bold text-white mt-1">{stats.currency} {stats.grossRentalRevenue}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400">Creator Rev Share Paid:</span>
                <p className="text-xl font-bold text-purple-400 mt-1">{stats.currency} {stats.totalCreatorRevShare}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Creator Payouts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Creator M-Pesa Payout Requests</h2>
          {payouts.length === 0 ? (
            <p className="text-xs text-zinc-500">No payout requests recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-2">Requested Date</th>
                    <th className="py-3 px-2">Creator / Channel</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/80">
                      <td className="py-3 px-2">{new Date(p.requestedAt).toLocaleDateString("en-US")}</td>
                      <td className="py-3 px-2 font-medium text-white">
                        {p.creator?.channelName || "Creator"} ({p.creator?.user?.email})
                      </td>
                      <td className="py-3 px-2 font-bold text-emerald-400">{p.currency} {p.amount}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "PAID" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {p.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprovePayout(p.id, "PAID")}
                              disabled={processingId === p.id}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                            >
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => handleApprovePayout(p.id, "CANCELLED")}
                              disabled={processingId === p.id}
                              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

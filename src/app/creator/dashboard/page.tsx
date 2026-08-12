"use client";

import React, { useEffect, useState } from "react";

interface CreatorData {
  creatorId: string;
  channelName: string;
  bio?: string;
  currentBalance: string;
  isVerified: boolean;
  contentCount: number;
  totalViews: string;
  totalWatchSeconds: string;
  totalEarnings: string;
  ownerships: any[];
  recentEarnings: any[];
  payoutRecords: any[];
}

export default function CreatorDashboardPage() {
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorData() {
      try {
        const res = await fetch("/api/creator/dashboard");
        const resData = await res.json();
        if (res.ok) {
          setData(resData);
        } else {
          setError(resData.error || "Failed to load creator portal");
        }
      } catch (err) {
        setError("Error connecting to creator server");
      } finally {
        setLoading(false);
      }
    }
    loadCreatorData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    setRequesting(true);
    setPayoutMessage(null);

    try {
      const res = await fetch("/api/creator/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payoutAmount }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setPayoutMessage("Payout request submitted successfully via M-Pesa.");
        setPayoutAmount("");
        // Reload dashboard
        const updatedRes = await fetch("/api/creator/dashboard");
        if (updatedRes.ok) setData(await updatedRes.json());
      } else {
        setPayoutMessage(resData.error || "Payout request failed.");
      }
    } catch {
      setPayoutMessage("Payout submission error.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-8 text-center text-zinc-400 font-semibold">Loading Creator Dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 text-center text-white">
        <h2 className="text-xl font-bold text-red-500 mb-2">Creator Portal Access</h2>
        <p className="text-sm text-zinc-400 mb-6">{error || "Please sign in with a verified creator account."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="inline-block rounded-md bg-purple-950/80 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-800/60 mb-2">
              FILMMAKER & CREATOR STUDIO
            </span>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              {data.channelName} {data.isVerified && <span className="text-emerald-400 text-lg">✓ Verified</span>}
            </h1>
            <p className="text-xs text-zinc-400">{data.bio || "Content Creator & Producer"}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-right">
            <span className="text-xs text-zinc-400">Available Balance:</span>
            <div className="text-3xl font-black text-emerald-400">KES {data.currentBalance}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
            <span className="text-xs text-zinc-400">Titles Published</span>
            <div className="text-2xl font-bold text-white mt-1">{data.contentCount}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
            <span className="text-xs text-zinc-400">Total Views</span>
            <div className="text-2xl font-bold text-white mt-1">{data.totalViews}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
            <span className="text-xs text-zinc-400">Total Watch Hours</span>
            <div className="text-2xl font-bold text-white mt-1">
              {(Number(data.totalWatchSeconds) / 3600).toFixed(1)} hrs
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
            <span className="text-xs text-zinc-400">Lifetime Earnings</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">KES {data.totalEarnings}</div>
          </div>
        </div>

        {/* Request M-Pesa Payout */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2">Request M-Pesa Payout</h2>
          <p className="text-xs text-zinc-400 mb-4">Transfer your creator earnings directly to your Safaricom M-Pesa number.</p>

          {payoutMessage && (
            <div className="mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300">
              {payoutMessage}
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="flex flex-wrap gap-3 max-w-md">
            <input
              type="number"
              step="0.01"
              required
              placeholder="Amount in KES (e.g. 500)"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={requesting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50"
            >
              {requesting ? "Submitting..." : "Withdraw via M-Pesa"}
            </button>
          </form>
        </div>

        {/* Payout History & Recent Earnings Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Recent Revenue Share Breakdown</h3>
            <div className="space-y-2 text-xs">
              {data.recentEarnings.length === 0 ? (
                <p className="text-zinc-500">No earnings events logged yet.</p>
              ) : (
                data.recentEarnings.map((e) => (
                  <div key={e.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                    <div>
                      <span className="font-semibold text-white">{e.sourceType}</span>
                      <p className="text-[10px] text-zinc-500">{new Date(e.createdAt).toLocaleDateString("en-US")}</p>
                    </div>
                    <span className="font-bold text-emerald-400">+ KES {e.amount.toString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Payout Requests History</h3>
            <div className="space-y-2 text-xs">
              {data.payoutRecords.length === 0 ? (
                <p className="text-zinc-500">No payout requests recorded.</p>
              ) : (
                data.payoutRecords.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                    <div>
                      <span className="font-semibold text-white">KES {p.amount.toString()}</span>
                      <p className="text-[10px] text-zinc-500">{new Date(p.createdAt).toLocaleDateString("en-US")}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "PAID" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import HeroBanner from "./HeroBanner";
import ContentRow from "./ContentRow";

interface HomeClientProps {
  initialRows: any[];
  initialContinueWatching: any[];
  initialMyList: any[];
  initialHero: any | null;
  serverProfileId: string;
}

export default function HomeClient({
  initialRows,
  initialContinueWatching,
  initialMyList,
  initialHero,
  serverProfileId
}: HomeClientProps) {
  const [rows, setRows] = useState(initialRows);
  const [continueWatching, setContinueWatching] = useState(initialContinueWatching);
  const [myList, setMyList] = useState(initialMyList);
  const [hero, setHero] = useState(initialHero);
  const [loading, setLoading] = useState(false);

  const { activeProfile } = useAuth();

  useEffect(() => {
    if (!activeProfile || activeProfile.id === serverProfileId) return;

    const syncDashboardState = async () => {
      setLoading(true);
      try {
        const [homeRes, continueRes, listRes, heroRes] = await Promise.all([
          fetch(`/api/home?profileId=${activeProfile.id}`),
          fetch(`/api/home/continue-watching?profileId=${activeProfile.id}`),
          fetch(`/api/home/my-list?profileId=${activeProfile.id}`),
          fetch(`/api/home/hero?profileId=${activeProfile.id}`)
        ]);

        if (homeRes.ok) setRows((await homeRes.json()).rows || []);
        if (continueRes.ok) setContinueWatching((await continueRes.json()).items || []);
        if (listRes.ok) setMyList((await listRes.json()).items || []);
        if (heroRes.ok) setHero((await heroRes.json()).hero || null);
      } catch (err) {
        console.error("Dashboard client rehydration failure:", err);
      } finally {
        setLoading(false);
      }
    };

    syncDashboardState();
  }, [activeProfile, serverProfileId]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#141414] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-red-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#141414] text-white pb-24 overflow-x-hidden">
      <HeroBanner hero={hero} />
      
      {/* Structural Offset Stack Container mimicking standard streaming canvas overlay layouts */}
      <div className={`space-y-8 md:space-y-12 relative z-20 ${hero ? "-mt-12 sm:-mt-20 md:-mt-28 lg:-mt-36" : "pt-8"}`}>
        
        {/* Row 1: High Priority Continue Track */}
        <ContentRow title="Continue Watching" items={continueWatching} isHistoryRow={true} />

        {/* Row 2: Customer Preferences List Track */}
        <ContentRow title="My List" items={myList} />

        {/* Row 3+: Core Algorithmic DB Rows */}
        {rows.map((row) => (
          <ContentRow 
            key={row.id} 
            title={row.title} 
            items={row.collection?.items?.map((i: any) => i.content).filter(Boolean) || []} 
          />
        ))}

        {rows.length === 0 && continueWatching.length === 0 && myList.length === 0 && !hero && (
          <div className="text-center py-20 text-zinc-500 text-sm font-sans">
            No dynamic content channels configured for this profile parameters.
          </div>
        )}
      </div>
    </main>
  );
}
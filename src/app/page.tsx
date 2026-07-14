import React from "react";
import { cookies } from "next/headers";
import getBaseUrl from "@/lib/getBaseUrl";
import HomeClient from "@/components/HomeComponents/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("active_profile_id")?.value || "";

  let initialRows = [];
  let initialContinueWatching = [];
  let initialMyList = [];
  let initialHero = null;

  if (profileId) {
    try {
      const [homeRes, continueRes, listRes, heroRes] = await Promise.all([
        fetch(`${getBaseUrl()}/api/home?profileId=${profileId}`, { cache: "no-store" }),
        fetch(`${getBaseUrl()}/api/home/continue-watching?profileId=${profileId}`, { cache: "no-store" }),
        fetch(`${getBaseUrl()}/api/home/my-list?profileId=${profileId}`, { cache: "no-store" }),
        fetch(`${getBaseUrl()}/api/home/hero?profileId=${profileId}`, { cache: "no-store" })
      ]);

      if (homeRes.ok) initialRows = (await homeRes.json()).rows || [];
      if (continueRes.ok) initialContinueWatching = (await continueRes.json()).items || [];
      if (listRes.ok) initialMyList = (await listRes.json()).items || [];
      if (heroRes.ok) initialHero = (await heroRes.json()).hero || null;
    } catch (err) {
      console.error("Server baseline hydration crash:", err);
    }
  }

  return (
    <HomeClient 
      initialRows={initialRows}
      initialContinueWatching={initialContinueWatching}
      initialMyList={initialMyList}
      initialHero={initialHero}
      serverProfileId={profileId}
    />
  );
}
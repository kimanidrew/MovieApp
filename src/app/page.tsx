import React from "react";
import prisma from "@/lib/prisma";
import HomeClient from "@/components/HomeComponents/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allVideos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <HomeClient initialVideos={allVideos} />;
}

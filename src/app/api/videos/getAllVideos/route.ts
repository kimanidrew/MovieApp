// server route (Next.js or Express)
import prisma from "@/lib/prisma";

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(videos);
}

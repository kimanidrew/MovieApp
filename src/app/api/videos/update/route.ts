import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const updated = await prisma.video.update({
    where: { id: body.id },
    data: {
      hlsUrl: body.hlsUrl,
    },
  });

  return NextResponse.json({ updated });
}
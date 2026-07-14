import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shows = await prisma.show.findMany({
      include: {
        content: true,
      },
      orderBy: {
        content: {
          title: "asc",
        },
      },
    });

    return NextResponse.json(
      shows.map((show) => ({
        id: show.id,
        title: show.content.title,
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch TV shows." },
      { status: 500 }
    );
  }
}
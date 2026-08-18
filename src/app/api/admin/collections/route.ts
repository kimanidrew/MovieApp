import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { displayOrder: "asc" },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                slug: true,
                releaseYear: true,
                images: { where: { type: "POSTER" }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Fetch collections error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const body = await request.json();
    const { name, description, contentIds = [], isActive = true } = body;

    if (!name) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive,
        items: contentIds.length > 0
          ? {
              create: contentIds.map((contentId: string, idx: number) => ({
                contentId,
                displayOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                slug: true,
                releaseYear: true,
                images: { where: { type: "POSTER" }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    console.error("Create collection error:", error);
    return NextResponse.json({ error: error.message || "Failed to create collection" }, { status: 500 });
  }
}
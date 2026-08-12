import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

// GET /api/admin/content - List all content with filters
export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(featured ? { isFeatured: featured === "true" } : {}),
      ...(type === "MOVIE" ? { movies: { some: {} } } : {}),
      ...(type === "SHOW" ? { show: { isNot: null } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.content.count({ where }),
      prisma.content.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isFeatured: true,
          featuredOrder: true,
          releaseYear: true,
          popularityScore: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          images: { where: { type: "POSTER" }, take: 1, select: { url: true } },
          movies: { select: { id: true } },
          show: { select: { id: true } },
          categories: { include: { category: { select: { name: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      items: items.map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        isFeatured: c.isFeatured,
        featuredOrder: c.featuredOrder,
        releaseYear: c.releaseYear,
        popularityScore: c.popularityScore,
        viewCount: c.viewCount?.toString() || "0",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        posterUrl: c.images?.[0]?.url || "",
        type: c.movies?.length ? "MOVIE" : c.show ? "SHOW" : "UNKNOWN",
        categories: c.categories?.map((cat: any) => cat.category.name) || [],
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Admin content list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch content" }, { status: 500 });
  }
}

// PATCH /api/admin/content - Update content (status, featured, etc.)
export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const body = await request.json();
    const { id, status, isFeatured, featuredOrder, title, description, storyline, releaseYear } = body;

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
    }

    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;
    if (typeof featuredOrder === "number") data.featuredOrder = featuredOrder;
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (storyline !== undefined) data.storyline = storyline;
    if (releaseYear) data.releaseYear = Number(releaseYear);
    data.updatedById = user!.id;

    // If publishing, set publishedAt
    if (status === "PUBLISHED" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await prisma.content.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isFeatured: true,
        featuredOrder: true,
        releaseYear: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Admin content update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 });
  }
}

// DELETE /api/admin/content - Delete content
export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
    }

    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin content delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete content" }, { status: 500 });
  }
}
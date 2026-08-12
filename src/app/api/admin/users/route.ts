import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole, USER_MANAGEMENT_ROLES } from "@/lib/admin-auth";

// GET /api/admin/users - List all users
export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, USER_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {
      deletedAt: null,
      ...(query ? { email: { contains: query, mode: "insensitive" } } : {}),
      ...(role ? { role } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          role: true,
          isCreator: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              profiles: true,
              subscriptions: true,
              sessions: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
  try {
    const { user, error } = await requireRole(request, USER_MANAGEMENT_ROLES);
    if (error) return error;

    const body = await request.json();
    const { email, password, role, isCreator } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: role || "USER",
        isCreator: isCreator || false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isCreator: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin user create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update a user
export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireRole(request, USER_MANAGEMENT_ROLES);
    if (error) return error;

    const body = await request.json();
    const { id, email, password, role, isCreator, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-demotion or self-deactivation
    if (id === user!.id && (role && role !== "SUPERADMIN" || isActive === false)) {
      return NextResponse.json({ error: "You cannot demote or deactivate your own account" }, { status: 400 });
    }

    const data: any = {};
    if (email) data.email = email.toLowerCase().trim();
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (role) data.role = role;
    if (typeof isCreator === "boolean") data.isCreator = isCreator;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        isCreator: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Soft-delete a user
export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireRole(request, USER_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === user!.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
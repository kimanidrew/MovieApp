import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-use-env-variable-in-production"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // 1. THE MULTI-TENANT COOKIE FIX: Look for both cookie namespaces
    const adminToken = cookieStore.get("admin_token")?.value;
    const consumerToken = cookieStore.get("token")?.value;
    
    // Give priority to whichever session token is active
    const token = consumerToken || adminToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Missing session token." }, { status: 401 });
    }

    // 2. Decode the incoming JWT safely to extract the database session tracking reference
    let sessionRef: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionRef = payload.sessionRef as string;
    } catch (jwtErr) {
      console.error("Profiles API JWT parsing failure:", jwtErr);
      return NextResponse.json({ error: "Invalid session token signature." }, { status: 401 });
    }

    // 3. Identify session using sessionRef, matching your modern login database layout structure
    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken: sessionRef },
      include: {
        user: {
          include: {
            profiles: {
              where: { deletedAt: null },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      return NextResponse.json({ error: "Session invalid or expired." }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

    // 4. Heartbeat check: Ensure session activity falls within valid streaming buffers
    const isWindowValid = session.lastActiveAt.getTime() >= Date.now() - 15 * 60 * 1000;
    if (!isWindowValid && !isAdmin) {
      return NextResponse.json({ error: "Session heartbeat expired. Please re-authenticate." }, { status: 401 });
    }

    // 5. Refresh the device session activity heartbeat on access
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    // 6. DYNAMIC SORTING: Pin "Guest" to the very end of the profile list
    const rawProfiles = session.user.profiles;
    const sortedProfiles = [...rawProfiles].sort((a, b) => {
      if (a.name === "Guest" && b.name !== "Guest") return 1;
      if (a.name !== "Guest" && b.name === "Guest") return -1;
      return 0; // Keep the default 'createdAt: asc' ordering for everything else
    });

    return NextResponse.json({ profiles: sortedProfiles }, { status: 200 });
  } catch (error) {
    console.error("Profiles Fetch API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;
    const consumerToken = cookieStore.get("token")?.value;
    const token = consumerToken || adminToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Missing session token." }, { status: 401 });
    }

    // 1. Parse session token
    let sessionRef: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionRef = payload.sessionRef as string;
    } catch (jwtErr) {
      return NextResponse.json({ error: "Invalid session token signature." }, { status: 401 });
    }

    // 2. Fetch the device session and user details
    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken: sessionRef },
      include: { user: { include: { profiles: { where: { deletedAt: null } } } } }
    });

    if (!session || !session.user || !session.user.isActive) {
      return NextResponse.json({ error: "Session invalid or expired." }, { status: 401 });
    }

    // 3. Parse incoming body parameters
    const { name, avatarUrl } = await request.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Profile name is required." }, { status: 400 });
    }

    // 4. Set a safe profile limit
    if (session.user.profiles.length >= 5) {
      return NextResponse.json({ error: "Maximum limit of 5 profiles reached." }, { status: 400 });
    }

    // 5. Resolve a default Maturity Rating (Required by your Schema)
    let defaultMaturity = await prisma.maturityRating.findFirst({
      where: {
        code: { in: ["G", "TV-Y", "TV-G", "PG"] }
      },
      orderBy: {
        severityRank: "asc"
      }
    });

    if (!defaultMaturity) {
      defaultMaturity = await prisma.maturityRating.findFirst();
    }

    if (!defaultMaturity) {
      return NextResponse.json(
        { error: "Database error. No maturity ratings are seeded in the system." },
        { status: 500 }
      );
    }

    // 6. Create profile inside Prisma mapping both required relations!
    const newProfile = await prisma.profile.create({
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=ffdfbf`,
        
        user: {
          connect: {
            id: session.user.id
          }
        },

        maxMaturity: {
          connect: {
            id: defaultMaturity.id
          }
        },

        settings: {
          create: {
            interfaceLanguage: "en",
            audioLanguage: "en",
            subtitleLanguage: "en"
          }
        }
      },
      include: {
        maxMaturity: true,
        settings: true
      }
    });

    // 7. Update session heartbeat
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch (error) {
    console.error("Profiles Create API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userType } = body;
    const cookieStore = await cookies();

    if (userType === "admin") {
      // Clear ONLY admin credentials
      cookieStore.set("admin_token", "", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/", 
        maxAge: 0 
      });
    } else {
      // Clear ONLY consumer credentials and active profile
      cookieStore.set("token", "", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/", 
        maxAge: 0 
      });
      cookieStore.set("profile_id", "", { 
        httpOnly: false, 
        secure: process.env.NODE_ENV === "production", 
        path: "/", 
        maxAge: 0 
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Logout route error:", err);
    return NextResponse.json({ error: "Failed to process logout" }, { status: 500 });
  }
}
// src/app/api/init-admin/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import bcrypt from "bcryptjs"; // Make sure bcrypt is in your package.json! 
// Alternative if you use argon2: import argon2 from "argon2";

export async function GET() {
  try {
    const sql = neon("postgresql://neondb_owner:npg_wdoBs0AyUe1z@ep-falling-mode-anaqy4l8-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require");

    const email = "admin@movieflix.com";
    const plainPassword = "singer123"; 
    const role = "ADMIN";
    
    // 1. Securely hash the plain text password using 10 salt rounds
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    // If your app uses argon2 instead: const passwordHash = await argon2.hash(plainPassword);

    const generatedId = crypto.randomUUID(); 
    const now = new Date().toISOString(); 

    // Step 2: Check if the user already exists
    const existingUsers = await sql`SELECT id FROM "User" WHERE email = ${email} LIMIT 1`;

    let result;
    if (existingUsers.length > 0) {
      // Step 3: Update role and password if they exist
      result = await sql`
        UPDATE "User" 
        SET role = ${role}, "passwordHash" = ${passwordHash}, "updatedAt" = ${now}
        WHERE email = ${email}
        RETURNING id, email, role
      `;
    } else {
      // Step 4: Insert record with hashed password
      result = await sql`
        INSERT INTO "User" (id, email, "passwordHash", role, "updatedAt")
        VALUES (${generatedId}, ${email}, ${passwordHash}, ${role}, ${now})
        RETURNING id, email, role
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Superuser configured securely with hashed password!`,
      data: result[0]
    });

  } catch (error: any) {
    console.error("Direct Neon HTTP execution failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database execution failed" },
      { status: 500 }
    );
  }
}
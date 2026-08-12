import { NextResponse } from "next/server";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    if (!tmdbId || !season || !episode) {
      return NextResponse.json({ error: "tmdbId, season, and episode are required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${apiKey}`
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Episode not found on TMDB" }, { status: 404 });
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.name || "",
      description: data.overview || "",
      airDate: data.air_date || null,
      runtime: data.runtime || null,
      stillPath: data.still_path ? `https://image.tmdb.org/t/p/w500${data.still_path}` : null,
    });
  } catch (error: any) {
    console.error("Fetch episode error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch episode" }, { status: 500 });
  }
}
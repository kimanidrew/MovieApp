import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("tmdbId");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // If TMDB returns an error, the data object will contain 'status_message'
    if (data.status_code) {
      console.error("TMDB API Error:", data.status_message);
      return NextResponse.json({ error: data.status_message }, { status: 404 });
    }

    return NextResponse.json({ 
      title: data.name, 
      description: data.overview 
    });
  } catch (err) {
    return NextResponse.json({ error: "TMDB fetch failed" }, { status: 500 });
  }
}
import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentCard from "@/components/home/ContentCard";
import Link from "next/link";
import { Search, Film, Tv, Sparkles, Clapperboard } from "lucide-react";
import { HomepageItem } from "@/types/homepage";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  let movies: HomepageItem[] = [];
  let shows: HomepageItem[] = [];
  let matchingCategories: any[] = [];

  if (query) {
    try {
      const rawContent = await prisma.content.findMany({
        where: {
          status: { in: ["PUBLISHED", "READY"] },
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { storyline: { contains: query, mode: "insensitive" } },
            { categories: { some: { category: { name: { contains: query, mode: "insensitive" } } } } },
            { cast: { some: { person: { name: { contains: query, mode: "insensitive" } } } } },
          ],
        },
        orderBy: { popularityScore: "desc" },
        take: 40,
        include: {
          images: true,
          trailers: true,
          maturityRating: true,
          categories: { include: { category: true } },
          cast: { include: { person: true } },
          movies: true,
          show: true,
        },
      });

      rawContent.forEach((c: any) => {
        const poster = c.images.find((i: any) => i.type === "POSTER")?.url || "";
        const backdrop = c.images.find((i: any) => i.type === "BACKDROP")?.url || poster;
        const item: HomepageItem = {
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description || "",
          releaseYear: c.releaseYear || 2026,
          maturityRating: c.maturityRating?.code || "TV-MA",
          rating: Number(c.popularityScore || 0),
          popularityScore: Number(c.popularityScore || 0),
          createdAt: c.createdAt.toISOString(),
          thumbnailUrl: poster,
          backdropUrl: backdrop,
          categories: c.categories.map((x: any) => x.category.name),
          cast: c.cast.map((x: any) => ({ name: x.person.name, character: x.character, displayOrder: x.displayOrder })),
          isTvShow: !!c.show,
        };

        if (c.show) shows.push(item);
        else movies.push(item);
      });

      matchingCategories = await prisma.category.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 6,
      });
    } catch (err) {
      console.error("Search query error:", err);
    }
  }

  const totalResults = movies.length + shows.length;

  return (
    <main style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px", paddingInline: "4%" }}>
      <PageBackground overlayOpacity={0.85} />

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e50914", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Search size={18} /> Search Results
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", margin: "0.25rem 0 0.5rem 0" }}>
            {query ? `Results for "${query}"` : "Search Catalog"}
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem", margin: 0 }}>
            {query ? `Found ${totalResults} title${totalResults === 1 ? "" : "s"} matching your search.` : "Type a title, genre, actor, or keyword in the search bar above."}
          </p>
        </div>

        {/* Matching Categories Pills */}
        {matchingCategories.length > 0 && (
          <div style={{ marginBottom: "2.5rem", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "1.25rem", borderRadius: "16px", backdropFilter: "blur(16px)" }}>
            <h3 style={{ fontSize: "0.85rem", color: "#fbbf24", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Sparkles size={14} /> Matching Genres
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {matchingCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/genre/${cat.slug}`}
                  style={{
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    color: "#fef08a",
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat.name} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalResults === 0 && query && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "20px", marginTop: "2rem" }}>
            <Search size={48} style={{ color: "#71717a", marginBottom: "1rem" }} />
            <h2 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>No titles found for &quot;{query}&quot;</h2>
            <p style={{ color: "#a1a1aa", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
              Try searching for alternative keywords, actor names, or browse our genre collections.
            </p>
            <Link
              href="/movies"
              style={{
                display: "inline-block",
                background: "#e50914",
                color: "#fff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Browse Movies & Shows
            </Link>
          </div>
        )}

        {/* Movies Section */}
        {movies.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Film size={20} style={{ color: "#60a5fa" }} /> Movies ({movies.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
              {movies.map((item) => (
                <ContentCard key={item.id} content={item} style="STANDARD_POSTER" />
              ))}
            </div>
          </section>
        )}

        {/* TV Shows Section */}
        {shows.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tv size={20} style={{ color: "#f87171" }} /> TV Shows ({shows.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
              {shows.map((item) => (
                <ContentCard key={item.id} content={item} style="STANDARD_POSTER" />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

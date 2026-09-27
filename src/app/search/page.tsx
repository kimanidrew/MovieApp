import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentCard from "@/components/home/ContentCard";
import Link from "next/link";
import { Search } from "lucide-react";
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
    <main className="discover-search">
      <PageBackground overlayOpacity={0.9} />
      <div className="search-shell">
        <header className="search-header">
          <div className="kicker"><span /> TIDPIX DISCOVERY</div>
          <h1>{query ? <>Stories matching <em>“{query}”</em></> : "Find your next story"}</h1>
          <p>{query ? `${totalResults} title${totalResults === 1 ? "" : "s"} found across the Tidpix catalogue.` : "Search African cinema by title, genre, filmmaker, actor or story."}</p>
          <form className="search-form" action="/search">
            <Search size={20} />
            <input name="q" defaultValue={query} placeholder="Search a story, filmmaker, genre..." aria-label="Search Tidpix" />
            <button type="submit">Explore</button>
          </form>
        </header>

        {matchingCategories.length > 0 && (
          <div className="genre-strip">
            <span className="strip-label">RELATED GENRES</span>
            {matchingCategories.map((cat) => <Link key={cat.id} href={`/genre/${cat.slug}`}>{cat.name}<span>↗</span></Link>)}
          </div>
        )}

        {totalResults === 0 && query ? (
          <section className="empty-state">
            <div className="empty-mark">T</div>
            <h2>No story found</h2>
            <p>Try a different title, filmmaker, genre or keyword.</p>
            <Link href="/movies">Browse the cinema <span>→</span></Link>
          </section>
        ) : (
          <div className="results">
            {movies.length > 0 && (
              <section className="result-section">
                <div className="section-head"><div><span className="section-kicker">FEATURE FILMS</span><h2>Movies</h2></div><span>{movies.length} titles</span></div>
                <div className="result-grid">{movies.map(item => <ContentCard key={item.id} content={item} style="STANDARD_POSTER" />)}</div>
              </section>
            )}
            {shows.length > 0 && (
              <section className="result-section">
                <div className="section-head"><div><span className="section-kicker">EPISODIC STORIES</span><h2>Series</h2></div><span>{shows.length} titles</span></div>
                <div className="result-grid">{shows.map(item => <ContentCard key={item.id} content={item} style="STANDARD_POSTER" />)}</div>
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .discover-search { min-height:100vh; padding:140px 5vw 90px; color:#f7f4ec; position:relative; }
        .search-shell { position:relative; z-index:2; max-width:1400px; margin:auto; }
        .search-header { max-width:900px; }
        .kicker,.section-kicker { color:#f4b400; font-size:.7rem; font-weight:800; letter-spacing:.22em; }
        .kicker { display:flex; align-items:center; gap:9px; }
        .kicker span { width:24px; height:2px; background:#f4b400; }
        h1 { font-size:clamp(2.8rem,6vw,5.8rem); line-height:.95; letter-spacing:-.055em; margin:18px 0 18px; font-weight:900; max-width:850px; }
        h1 em { color:#f4b400; font-style:normal; }
        .search-header>p { color:#918d83; max-width:620px; line-height:1.7; margin:0; }
        .search-form { margin-top:30px; max-width:760px; display:flex; align-items:center; gap:13px; padding:8px 8px 8px 17px; border:1px solid rgba(244,180,0,.22); background:rgba(255,255,255,.035); border-radius:12px; }
        .search-form svg { color:#f4b400; flex-shrink:0; }
        .search-form input { flex:1; min-width:0; background:none; border:0; outline:0; color:#fff; font-size:1rem; padding:11px 0; }
        .search-form button { border:0; background:#f4b400; color:#17130a; border-radius:8px; padding:11px 20px; font-weight:800; cursor:pointer; }
        .genre-strip { margin-top:55px; padding:18px 0; border-top:1px solid rgba(255,255,255,.08); border-bottom:1px solid rgba(255,255,255,.08); display:flex; gap:9px; align-items:center; flex-wrap:wrap; }
        .strip-label { color:#66635d; font-size:.65rem; letter-spacing:.14em; margin-right:5px; }
        .genre-strip a { color:#d7d2c7; text-decoration:none; border:1px solid rgba(244,180,0,.2); border-radius:7px; padding:7px 10px; font-size:.78rem; }
        .genre-strip a span { color:#f4b400; margin-left:7px; }
        .result-section { margin-top:68px; }
        .section-head { display:flex; align-items:end; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:14px; }
        .section-head h2 { margin:5px 0 0; font-size:2rem; letter-spacing:-.03em; }
        .section-head>span { color:#66635d; font-size:.75rem; }
        .result-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:24px 18px; }
        .result-grid :global(.card-wrapper) { width:100% !important; }
        .result-grid :global(.card-container) { width:100%; }
        .empty-state { margin-top:70px; min-height:330px; display:grid; place-items:center; align-content:center; text-align:center; border-top:1px solid rgba(255,255,255,.08); }
        .empty-mark { width:54px;height:54px;border:1px solid rgba(244,180,0,.35);border-radius:12px;display:grid;place-items:center;color:#f4b400;font-weight:900;font-size:1.4rem;margin-bottom:18px; }
        .empty-state h2 { margin:0 0 8px;font-size:1.8rem; }
        .empty-state p { color:#77746d;margin:0 0 22px; }
        .empty-state a { color:#f4b400;text-decoration:none;font-weight:750; }
        @media(max-width:700px){ .discover-search{padding:110px 6vw 60px}.search-form button{padding:11px 14px}.result-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px}.section-head h2{font-size:1.55rem} }
      `}</style>
    </main>
  );
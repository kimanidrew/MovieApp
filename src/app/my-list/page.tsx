"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { Bookmark, Film, Play, Search, Sparkles, Trash2, Tv } from "lucide-react";

type LibraryItem = {
  id: string;
  contentId: string;
  createdAt?: string;
  content?: {
    id: string;
    title?: string | null;
    slug?: string | null;
    releaseYear?: number | null;
    description?: string | null;
    isTvShow?: boolean;
    images?: Array<{ url?: string | null; type?: string | null; displayOrder?: number | null }>;
    categories?: Array<{ category?: { name?: string | null } }>;
    movies?: Array<unknown>;
    show?: { seasons?: Array<{ episodes?: Array<unknown> }> } | null;
  };
};

function getArtwork(item: LibraryItem) {
  const images = item.content?.images || [];
  return (
    images.find((image) => String(image.type || "").toUpperCase().includes("BACKDROP"))?.url ||
    images.find((image) => String(image.type || "").toUpperCase().includes("THUMB"))?.url ||
    images[0]?.url ||
    "/placeholder.jpg"
  );
}

export default function MyListPage() {
  const { customerUser, activeProfile } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!activeProfile?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/my-list?profileId=${encodeURIComponent(activeProfile.id)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activeProfile?.id]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const title = item.content?.title?.toLowerCase() || "";
      const categories = (item.content?.categories || [])
        .map((entry) => entry.category?.name || "")
        .join(" ")
        .toLowerCase();
      return title.includes(term) || categories.includes(term);
    });
  }, [items, query]);

  const removeItem = async (item: LibraryItem) => {
    if (!activeProfile?.id || !item.contentId) return;
    setRemoving(item.contentId);
    try {
      const response = await fetch(
        `/api/my-list?profileId=${encodeURIComponent(activeProfile.id)}&contentId=${encodeURIComponent(item.contentId)}`,
        { method: "DELETE" }
      );
      if (response.ok) setItems((current) => current.filter((entry) => entry.contentId !== item.contentId));
    } finally {
      setRemoving(null);
    }
  };

  if (!customerUser) {
    return (
      <main className="tidpix-library-page">
        <section className="library-gate">
          <div className="library-mark"><Bookmark size={28} /></div>
          <span className="eyebrow">YOUR TIDPIX LIBRARY</span>
          <h1>Keep the stories you want close.</h1>
          <p>Sign in to build a personal shelf of films and series you want to return to.</p>
          <Link href="/login" className="library-primary">Sign in to continue</Link>
        </section>
        <Footer />
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="tidpix-library-page">
      <section className="library-shell">
        <div className="library-intro">
          <div>
            <div className="eyebrow-row">
              <span className="eyebrow">TIDPIX / LIBRARY</span>
              <span className="gold-rule" />
            </div>
            <h1>Your stories, <em>kept.</em></h1>
            <p>Films and series you marked for another night, another mood, or another conversation.</p>
          </div>
          <div className="library-count">
            <span>{items.length}</span>
            <small>{items.length === 1 ? "saved story" : "saved stories"}</small>
          </div>
        </div>

        <div className="library-toolbar">
          <div className="toolbar-label"><Sparkles size={15} /> PERSONAL SHELF</div>
          <label className="library-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your library..." />
          </label>
        </div>

        {loading ? (
          <div className="library-grid">
            {[0, 1, 2, 3].map((item) => <div className="library-skeleton" key={item} />)}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="library-grid">
            {filteredItems.map((item, index) => {
              const content = item.content;
              const isSeries = Boolean(content?.isTvShow || content?.show);
              const href = isSeries ? `/shows/${content?.id}` : `/movies/${content?.id}`;
              const category = content?.categories?.[0]?.category?.name || (isSeries ? "Series" : "Film");
              return (
                <article className="library-card" key={item.id} style={{ animationDelay: `${index * 45}ms` }}>
                  <Link href={href} className="artwork">
                    <img src={getArtwork(item)} alt={content?.title || "Tidpix title"} loading="lazy" />
                    <div className="artwork-shade" />
                    <span className="type-chip">{isSeries ? <Tv size={12} /> : <Film size={12} />}{isSeries ? "SERIES" : "FILM"}</span>
                    <span className="play-chip"><Play size={15} fill="currentColor" /></span>
                  </Link>
                  <div className="card-copy">
                    <div className="meta-line">
                      <span>{category}</span>
                      {content?.releaseYear ? <><i /> <span>{content.releaseYear}</span></> : null}
                    </div>
                    <Link href={href} className="title">{content?.title || "Untitled story"}</Link>
                    <div className="card-footer">
                      <span>Saved {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        disabled={removing === item.contentId}
                        aria-label={`Remove ${content?.title || "story"} from library`}
                        title="Remove from library"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : items.length > 0 ? (
          <div className="library-empty compact">
            <Search size={25} />
            <h2>No stories match that search.</h2>
            <button type="button" onClick={() => setQuery("")}>Clear search</button>
          </div>
        ) : (
          <div className="library-empty">
            <div className="empty-mark"><Bookmark size={30} /></div>
            <span className="eyebrow">NOTHING SAVED YET</span>
            <h2>Start your own cinema shelf.</h2>
            <p>When a story catches your eye, save it. Your picks will appear here in a quiet, personal collection.</p>
            <div className="empty-actions">
              <Link href="/movies" className="library-primary">Explore cinema</Link>
              <Link href="/shows" className="library-secondary">Discover series</Link>
            </div>
          </div>
        )}
      </section>
      <Footer />

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .tidpix-library-page { min-height:100vh; background:#070707; color:#f7f4ec; }
  .library-shell { max-width:1420px; margin:0 auto; padding:9rem 5vw 6rem; }
  .library-intro { display:flex; justify-content:space-between; gap:3rem; align-items:flex-end; padding-bottom:3rem; border-bottom:1px solid rgba(244,180,0,.16); }
  .eyebrow-row { display:flex; align-items:center; gap:14px; margin-bottom:1rem; }
  .eyebrow { font-size:.7rem; letter-spacing:.2em; font-weight:800; color:#f4b400; }
  .gold-rule { width:46px; height:1px; background:#f4b400; opacity:.7; }
  h1 { font-size:clamp(3rem,6vw,6.2rem); line-height:.9; letter-spacing:-.055em; margin:0; font-weight:800; }
  h1 em { color:#f4b400; font-style:normal; }
  .library-intro p { max-width:620px; margin:1.3rem 0 0; color:#9d9a92; line-height:1.7; font-size:1rem; }
  .library-count { min-width:145px; padding-left:1.5rem; border-left:1px solid rgba(255,255,255,.12); }
  .library-count span { display:block; font-size:3.2rem; line-height:1; font-weight:800; color:#fff; }
  .library-count small { display:block; margin-top:.45rem; color:#8f8b83; text-transform:uppercase; letter-spacing:.12em; font-size:.65rem; }
  .library-toolbar { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1.5rem 0; }
  .toolbar-label { display:flex; align-items:center; gap:8px; color:#b9b4a9; font-size:.7rem; letter-spacing:.16em; font-weight:800; }
  .toolbar-label svg { color:#f4b400; }
  .library-search { display:flex; align-items:center; gap:9px; width:min(340px,100%); padding:.72rem .9rem; border:1px solid rgba(255,255,255,.12); border-radius:10px; background:rgba(255,255,255,.035); color:#77736b; }
  .library-search:focus-within { border-color:rgba(244,180,0,.45); }
  .library-search input { width:100%; border:0; outline:0; background:transparent; color:#fff; font:inherit; font-size:.86rem; }
  .library-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:2.4rem 1.3rem; }
  .library-card { animation:tidpixReveal .55s ease both; }
  @keyframes tidpixReveal { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .artwork { position:relative; display:block; aspect-ratio:16/10; overflow:hidden; background:#121212; border-radius:12px; border:1px solid rgba(255,255,255,.08); }
  .artwork img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
  .library-card:hover .artwork img { transform:scale(1.035); }
  .artwork-shade { position:absolute; inset:35% 0 0; background:linear-gradient(transparent,rgba(0,0,0,.72)); }
  .type-chip { position:absolute; top:12px; left:12px; display:flex; align-items:center; gap:5px; padding:5px 8px; border-radius:5px; background:rgba(7,7,7,.78); border:1px solid rgba(244,180,0,.28); color:#f4b400; font-size:.58rem; letter-spacing:.11em; font-weight:800; }
  .play-chip { position:absolute; right:12px; bottom:12px; display:grid; place-items:center; width:38px; height:38px; border-radius:9px; background:#f4b400; color:#070707; transform:translateY(4px); opacity:0; transition:.25s ease; }
  .library-card:hover .play-chip { opacity:1; transform:translateY(0); }
  .card-copy { padding:.9rem .1rem 0; }
  .meta-line { display:flex; align-items:center; gap:7px; color:#77736b; text-transform:uppercase; letter-spacing:.1em; font-size:.59rem; font-weight:700; }
  .meta-line i { width:3px; height:3px; border-radius:50%; background:#f4b400; }
  .title { display:block; margin-top:.38rem; color:#f7f4ec; text-decoration:none; font-size:1.1rem; font-weight:750; line-height:1.2; }
  .title:hover { color:#f4b400; }
  .card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:.75rem; color:#66635d; font-size:.68rem; }
  .card-footer button { border:0; background:transparent; color:#77736b; cursor:pointer; padding:5px; }
  .card-footer button:hover { color:#f4b400; }
  .card-footer button:disabled { opacity:.4; cursor:wait; }
  .library-empty { min-height:390px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:4rem 1rem; border-top:1px solid rgba(255,255,255,.07); border-bottom:1px solid rgba(255,255,255,.07); }
  .library-empty.compact { min-height:300px; }
  .empty-mark,.library-mark { width:64px; height:64px; display:grid; place-items:center; border:1px solid rgba(244,180,0,.35); color:#f4b400; border-radius:14px; background:rgba(244,180,0,.05); margin-bottom:1.2rem; }
  .library-empty h2,.library-gate h1 { margin:.65rem 0 .7rem; font-size:clamp(1.8rem,3vw,2.7rem); letter-spacing:-.035em; }
  .library-empty p,.library-gate p { max-width:560px; color:#85827b; line-height:1.7; margin:0; }
  .empty-actions { display:flex; gap:.7rem; margin-top:1.5rem; flex-wrap:wrap; justify-content:center; }
  .library-primary,.library-secondary,.library-empty button { display:inline-flex; align-items:center; justify-content:center; padding:.8rem 1.1rem; border-radius:8px; text-decoration:none; font-weight:750; font-size:.82rem; cursor:pointer; }
  .library-primary { background:#f4b400; color:#070707; border:1px solid #f4b400; }
  .library-primary:hover { background:#ffd45a; }
  .library-secondary,.library-empty button { color:#e8e4da; background:transparent; border:1px solid rgba(255,255,255,.16); }
  .library-secondary:hover,.library-empty button:hover { border-color:rgba(244,180,0,.5); color:#f4b400; }
  .library-gate { min-height:75vh; padding:10rem 1.5rem 6rem; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
  .library-gate h1 { max-width:760px; font-size:clamp(2.5rem,5vw,5rem); }
  .library-gate p { max-width:600px; margin-bottom:1.5rem; }
  .library-skeleton { aspect-ratio:16/10; border-radius:12px; background:linear-gradient(100deg,#101010 20%,#181818 35%,#101010 50%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
  @keyframes shimmer { to{background-position:-200% 0} }
  @media(max-width:1050px){ .library-grid{grid-template-columns:repeat(3,minmax(0,1fr));}.library-intro{align-items:flex-start}.library-count{display:none} }
  @media(max-width:720px){ .library-shell{padding:7rem 1rem 4rem}.library-intro{display:block;padding-bottom:2rem}.library-toolbar{align-items:flex-start;flex-direction:column}.library-search{width:100%}.library-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem .75rem}.title{font-size:.95rem}.card-footer{font-size:.6rem}.play-chip{opacity:1;transform:none;width:34px;height:34px} }
  @media(max-width:430px){ .library-grid{grid-template-columns:1fr}.artwork{aspect-ratio:16/9} }
`;

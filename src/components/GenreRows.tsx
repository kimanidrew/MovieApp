"use client";

import { useRef } from "react";
import { Video } from "@/types/video";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GenreRowsProps {
  items: Video[];
  type: "movies" | "shows" | "home";
}

export default function GenreRows({ items, type }: GenreRowsProps) {
  if (!items?.length) return null;

  const allGenres = new Set<string>();
  items.forEach((i) => i.categories?.forEach((c) => allGenres.add(c)));

  const genreGroups = Array.from(allGenres)
    .map((genre) => ({ genre, content: items.filter((i) => i.categories?.includes(genre)) }))
    .filter((g) => g.content.length > 0);

  return (
    <div style={{ marginTop: "2rem" }}>
      <RowSection title={type === "movies" ? "Popular Movies" : type === "shows" ? "Popular Shows" : "Popular Titles"} items={items.slice(0, 15)} />
      {genreGroups.map((g) => (
        <RowSection key={g.genre} title={g.genre} items={g.content.slice(0, 15)} />
      ))}
    </div>
  );
}

function RowSection({ title, items }: { title: string; items: Video[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;

  const scroll = (dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "right" ? 800 : -800, behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", paddingRight: "1rem" }}>
        <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>{title}</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => scroll("left")} style={btnStyle}><ChevronLeft size={18} /></button>
          <button onClick={() => scroll("right")} style={btnStyle}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: "0.85rem", overflowX: "auto", padding: "0.5rem 0.25rem", scrollbarWidth: "none" }}>
        {items.map((item) => (
          <a key={item.id} href={`/${item.isTvShow ? "shows" : "movies"}/${item.id}`} className="genre-row-card" style={cardStyle}>
            <div style={thumbStyle}>
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: "2rem" }}>
                  {item.isTvShow ? "📺" : "🎬"}
                </div>
              )}
            </div>
            <div style={{ padding: "0.65rem 0.75rem" }}>
              <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
              <div style={{ color: "#888", fontSize: "0.7rem", marginTop: "0.15rem" }}>{item.releaseYear} · {item.isTvShow ? "Series" : "Movie"}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)",
  color: "#fff", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  flexShrink: 0, width: 180, borderRadius: "10px", overflow: "hidden",
  background: "#141414", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  transition: "transform 0.25s ease, box-shadow 0.25s ease", textDecoration: "none",
};

const thumbStyle: React.CSSProperties = {
  position: "relative", width: "100%", height: 100, overflow: "hidden", background: "#0a0a0a",
};

export const genreRowHover = `
  .genre-row-card:hover { transform: scale(1.05); box-shadow: 0 12px 32px rgba(0,0,0,0.8); z-index: 5; }
`;

// Inject hover styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = genreRowHover;
  document.head.appendChild(style);
}
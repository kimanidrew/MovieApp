"use client";

import { useRef } from "react";
import Link from "next/link";
import ContentCard from "./ContentCard";
import { HomepageSection } from "@/types/homepage";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface ContentRowProps {
  section: HomepageSection;
}

export default function ContentRow({ section }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!section.items || section.items.length === 0) return null;

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  };

  const title = section.subtitle || section.title;

  return (
    <section className="content-row" aria-label={title}>
      <div className="row-header">
        <div className="row-heading">
          <h2 className="row-title">{title}</h2>
        </div>
        <div className="row-actions">
          {section.hasMore && section.viewAllHref && (
            <Link href={section.viewAllHref} className="view-all-btn" aria-label={`View all ${section.title}`}>
              View All
              <ArrowRight size={14} />
            </Link>
          )}
          <div className="scroll-buttons">
            <button
              className="scroll-btn"
              onClick={() => scrollBy("left")}
              aria-label={`Scroll ${section.title} left`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="scroll-btn"
              onClick={() => scrollBy("right")}
              aria-label={`Scroll ${section.title} right`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="scroll-container-wrapper">
        <div className="scroll-container" ref={scrollRef}>
          {section.items.map((item, idx) => (
            <div key={item.id} className="card-item-wrapper">
              <ContentCard content={item} style={section.renderStyle} index={idx} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .content-row {
          padding: 0;
          animation: rowFadeIn 0.6s ease forwards;
          width: 100%;
          overflow: hidden;
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.75rem;
          padding: 0 4%;
          gap: 1rem;
        }

        .row-heading {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .row-title {
          color: #fff;
          font-size: 1.4rem;
          font-weight: 600;
          margin: 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .row-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #b3b3b3;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .view-all-btn:hover {
          color: #fff;
        }

        .scroll-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .scroll-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .scroll-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* Netflix-style edge-to-edge overflow scrolling with padding buffers for hover scale clipping */
        .scroll-container-wrapper {
          position: relative;
          width: 100%;
        }

        .scroll-container {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding: 1rem 4%;
          scroll-padding-left: 4%;
          -webkit-overflow-scrolling: touch;
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }

        .card-item-wrapper {
          flex-shrink: 0;
        }

        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .row-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .row-title { font-size: 1.2rem; }
          .scroll-buttons { display: none; }
          .row-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </section>
  );
}
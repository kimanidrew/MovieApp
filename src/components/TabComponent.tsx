"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Tab = {
  label: string;
  path: string;
};

type TabsProps = {
  tabs: Tab[];
};

export default function Tabs({ tabs }: TabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    // 1. Exact match fallback to prevent sub-route bleeding conflicts
    let index = tabs.findIndex((t) => pathname === t.path);
    
    // If no exact match, fallback to root segment checking
    if (index === -1) {
      index = tabs.findIndex((t) => t.path !== "/" && pathname.startsWith(t.path));
    }

    const container = containerRef.current;
    if (!container || index === -1) return;

    // Use children lookup by omitting the absolute placeholder indicator element
    const tabEl = container.children[index] as HTMLElement;

    if (tabEl) {
      setIndicator({
        left: tabEl.offsetLeft, // 2. Left relative calculation maps perfectly now padding is shifted out
        width: tabEl.offsetWidth,
      });
    }
  }, [pathname, tabs]);

  return (
    <div className="tabs-wrapper">
      <div className="tabs-inner-container">
        <div className="tabs" ref={containerRef}>
          {tabs.map((tab) => {
            const isActive = tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
            
            return (
              <button
                key={tab.path}
                type="button"
                className={`tab ${isActive ? "active" : ""}`}
                onClick={() => router.push(tab.path)}
              >
                {tab.label}
              </button>
            );
          })}

          {/* 3. Slider Track Platform Layer */}
          <div
            className="indicator"
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: `${indicator.width}px`,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        /* Glassmorphism blur effects */
        .tabs-wrapper {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(14, 14, 14, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* 4. Isolated Structural Padding Layer to keep coordinates linear */
        .tabs-inner-container {
          max-width: 1920px;
          margin: 0 auto;
          padding: 0 4%;
        }

        .tabs {
          display: flex;
          position: relative;
          align-items: center;
          height: 68px; /* Standard Netflix navigation bar height footprint */
        }

        .tab {
          padding: 0 1.25rem;
          height: 100%;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          transition: color 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .tab:hover {
          color: rgba(255, 255, 255, 0.85);
        }

        .tab.active {
          color: #ffffff;
          font-weight: 700;
        }

        /* Netflix Brand Solid Glow Indicator Track */
        .indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: #e50914;
          border-radius: 2px 2px 0 0;
          box-shadow: 0 -2px 10px rgba(229, 9, 20, 0.4);
          transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), width 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          pointer-events: none;
          will-change: transform, width;
        }
      `}</style>
    </div>
  );
}

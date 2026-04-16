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
    const index = tabs.findIndex((t) =>
      pathname.startsWith(t.path)
    );

    const container = containerRef.current;
    if (!container) return;

    const tabEl = container.children[index] as HTMLElement;

    if (tabEl) {
      setIndicator({
        left: tabEl.offsetLeft,
        width: tabEl.offsetWidth,
      });
    }
  }, [pathname, tabs]);

  return (
    <div className="tabs-wrapper">
      <div className="tabs" ref={containerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.path}
            className={`tab ${
              pathname.startsWith(tab.path) ? "active" : ""
            }`}
            onClick={() => router.push(tab.path)}
          >
            {tab.label}
          </button>
        ))}

        <div
          className="indicator"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
      </div>

      <style jsx>{`
        .tabs-wrapper {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #0b0b0b;
          border-bottom: 1px solid #222;
        }

        .tabs {
          display: flex;
          position: relative;
          padding: 0 2rem;
        }

        .tab {
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: #aaa;
          background: none;
          border: none;
          cursor: pointer;
        }

        .tab.active {
          color: #fff;
        }

        .indicator {
          position: absolute;
          bottom: 0;
          height: 3px;
          background: #e50914;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
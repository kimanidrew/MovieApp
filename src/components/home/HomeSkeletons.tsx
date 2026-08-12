"use client";

interface SkeletonRowProps {
  count?: number;
}

export function SkeletonRow({ count = 6 }: SkeletonRowProps) {
  return (
    <div className="skeleton-row" aria-hidden="true">
      <div className="skeleton-title" />
      <div className="skeleton-card-row">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <style jsx>{`
        .skeleton-row {
          padding: 1.5rem 4%;
        }
        .skeleton-title {
          width: 180px;
          height: 24px;
          border-radius: 6px;
          background: linear-gradient(90deg, #1a1a1a, #2a2a2a, #1a1a1a);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          margin-bottom: 1rem;
        }
        .skeleton-card-row {
          display: flex;
          gap: 1rem;
          overflow: hidden;
        }
        .skeleton-card {
          flex-shrink: 0;
          width: 12rem;
          height: 18rem;
          border-radius: 8px;
          background: linear-gradient(90deg, #1a1a1a, #2a2a2a, #1a1a1a);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 768px) {
          .skeleton-card { width: 10rem; height: 15rem; }
        }
        @media (max-width: 480px) {
          .skeleton-card { width: 8.5rem; height: 12.75rem; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="skeleton-hero" aria-hidden="true">
      <style jsx>{`
        .skeleton-hero {
          width: 100%;
          height: 85vh;
          min-height: 500px;
          background: linear-gradient(90deg, #141414, #1e1e1e, #141414);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          position: relative;
        }
        .skeleton-hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(to top, #141414, transparent);
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 768px) {
          .skeleton-hero { height: 60vh; min-height: 400px; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonHomepage() {
  return (
    <>
      <SkeletonHero />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </>
  );
}
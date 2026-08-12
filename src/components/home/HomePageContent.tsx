"use client";

import ProfileGreeting from "./ProfileGreeting";
import HeroBanner from "./HeroBanner";
import ContentRow from "./ContentRow";
import { HomepageData } from "@/types/homepage";
import { SkeletonHomepage } from "./HomeSkeletons";

interface HomePageContentProps {
  data: HomepageData;
}

export default function HomePageContent({ data }: HomePageContentProps) {
  if (!data) return <SkeletonHomepage />;

  return (
    <main className="homepage" aria-label="Home">
      <HeroBanner content={data.featured} />
      <div className="sections">
          {data.sections
          .filter((section) => section.renderStyle !== "HERO_BILLBOARD")
          .map((section) => (
            <ContentRow key={section.id} section={section} />
          ))}
      </div>

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          background: #000;
        }

        .sections {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: -2rem;
          position: relative;
          z-index: 5;
        }

        @media (max-width: 768px) {
          .sections {
            gap: 0.25rem;
            margin-top: -1rem;
          }
        }
      `}</style>
    </main>
  );
}
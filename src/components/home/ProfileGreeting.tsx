"use client";

import Image from "next/image";
import { HomepageProfile } from "@/types/homepage";
import { Crown, Sparkles } from "lucide-react";

interface ProfileGreetingProps {
  profile: HomepageProfile;
}

export default function ProfileGreeting({ profile }: ProfileGreetingProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name || "user")}`;

  return (
    <div className="profile-greeting" aria-label={`${greeting}, ${profile.name}`}>
      <div className="greeting-avatar">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={`${profile.name}'s avatar`}
            width={48}
            height={48}
            className="avatar-img"
            priority
          />
        ) : (
          <div
            className="avatar-fallback"
            style={{ backgroundImage: `url(${fallbackAvatar})` }}
            role="img"
            aria-label={`${profile.name}'s avatar`}
          />
        )}
      </div>

      <div className="greeting-text">
        <h1 className="greeting-title">
          {greeting}, <span className="greeting-name">{profile.name}</span>
        </h1>
        <div className="greeting-meta">
          {profile.membership && (
            <span className="membership-badge">
              <Crown size={12} />
              {profile.membership}
            </span>
          )}
          {profile.role && profile.role !== "USER" && (
            <span className="role-badge">
              <Sparkles size={12} />
              {profile.role}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-greeting {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 4%;
          margin-top: 4.5rem;
          animation: fadeInUp 0.6s ease forwards;
        }

        .greeting-avatar {
          flex-shrink: 0;
        }

        .avatar-img,
        .avatar-fallback {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          background-size: cover;
          background-position: center;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .greeting-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .greeting-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          line-height: 1.2;
        }

        .greeting-name {
          background: linear-gradient(90deg, #3b82f6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .greeting-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .membership-badge,
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .membership-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .role-badge {
          background: rgba(236, 72, 153, 0.15);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .profile-greeting {
            padding: 1rem 4%;
            margin-top: 4rem;
          }
          .greeting-title {
            font-size: 1.2rem;
          }
          .avatar-img,
          .avatar-fallback {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
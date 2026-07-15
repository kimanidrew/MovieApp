"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Profile } from "@/components/AuthProvider";
import PageBackground from "@/components/PageBackground";

// Curated modern default avatar designs matching our backend presets
const DEFAULT_AVATARS = [
  { id: "avatar-1", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4" },
  { id: "avatar-2", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba&backgroundColor=c0aede" },
  { id: "avatar-3", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Sassy&backgroundColor=ffd5dc" },
  { id: "avatar-4", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Pepper&backgroundColor=ffdfbf" },
  { id: "avatar-5", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow&backgroundColor=d1d4db" },
  { id: "avatar-6", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky&backgroundColor=b6f4c7" },
];

export default function ProfilesPage() {
  const router = useRouter();
  const { customerUser, activeProfile, setActiveProfile, loading: authLoading, setLoading: setAuthLoading } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");

  // Control state for profile creation UI
  const [isAdding, setIsAdding] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0].url);
  const [submitting, setSubmitting] = useState(false);

  // Fetch profiles directly from database session state
  async function fetchProfiles() {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();

      if (res.ok) {
        setProfiles(data.profiles || []);
      } else {
        setError(data.error || "Failed to load profiles.");
        if (res.status === 401) {
          router.push("/login");
        }
      }
    } catch (err) {
      setError("A network error occurred while loading your profiles.");
    } finally {
      setAuthLoading(false);
    }
  }

 

  // Load initial profiles from Auth Provider context, or fall back to an API poll
  useEffect(() => {
    if (authLoading) return;

    if (!customerUser) {
      // Not logged in or session expired
      router.push("/login");
      return;
    }

    if (customerUser.profiles && customerUser.profiles.length > 0) {
      setProfiles(customerUser.profiles);
    } else {
      fetchProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerUser, authLoading]);

const handleProfileSelect = async (profile: Profile) => {
    try {
      setAuthLoading(true);
      // 1. Await the state and cookie persistence in your Auth Provider
      await setActiveProfile(profile);
      
      // 2. Force Next.js to refresh server-side layout data with the new profile cookie
      router.refresh();
      
      // 3. Navigate home
      router.push("/");
    } catch (err) {
      console.error("Failed to set active profile:", err);
      setError("An error occurred while selecting this profile.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProfileName.trim();
    if (!cleanName) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          avatarUrl: selectedAvatar,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewProfileName("");
        setIsAdding(false);
        // Refresh profiles to pull fresh relation structures (including maxMaturity & settings)
        await fetchProfiles();
      } else {
        setError(data.error || "Could not create profile.");
      }
    } catch (err) {
      setError("Failed to communicate with the server.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="profiles-viewport">
      <PageBackground overlayOpacity={0.8} />
      
      {/* 1. Main "Who's Watching" Selection view */}
      {!isAdding && (
        <div className="view-container fade-in">
          <h1 className="main-title">Who's watching?</h1>

          <div className="profiles-flex-grid">
            {profiles.map((profile) => {
              const avatarSeed = profile.name === "Guest" ? "guest-user" : profile.name;
              const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=ffdfbf`;
              
              return (
                <div 
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="profile-card-node"
                >
                  <div 
                    className="avatar-wrapper"
                    style={{ backgroundImage: `url(${profile.avatarUrl || fallbackAvatar})` }}
                  />
                  <span className="profile-card-name">{profile.name}</span>
                </div>
              );
            })}

            {/* Max Limit (5 Profiles) Safety Check */}
            {profiles.length < 5 && (
              <div 
                onClick={() => {
                  setError("");
                  setIsAdding(true);
                }}
                className="profile-card-node add-profile-trigger"
              >
                <div className="avatar-wrapper placeholder-add">
                  <span className="plus-symbol">+</span>
                </div>
                <span className="profile-card-name text-muted">Add Profile</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Create Profile Form Screen */}
      {isAdding && (
        <div className="view-container fade-in">
          <h1 className="main-title">Create Profile</h1>
          <p className="subtitle">Add a profile for another person watching.</p>
          
          <form onSubmit={handleCreateProfile} className="creation-flow-card">
            <div className="avatar-preview-stack">
              <div 
                className="large-avatar-preview"
                style={{ backgroundImage: `url(${selectedAvatar})` }}
              />
              <p className="avatar-label">Choose your avatar:</p>
              
              <div className="avatar-selector-grid">
                {DEFAULT_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`avatar-choice-btn ${selectedAvatar === av.url ? "selected-ring" : ""}`}
                    style={{ backgroundImage: `url(${av.url})` }}
                  />
                ))}
              </div>
            </div>

            <div className="input-row">
              <input 
                type="text" 
                placeholder="Profile Name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                maxLength={15}
                required
                className="modern-text-input"
                autoFocus
              />
            </div>

            {error && <p className="error-alert">{error}</p>}

            <div className="action-row">
              <button 
                type="submit" 
                disabled={submitting || !newProfileName.trim()}
                className="action-btn-primary"
              >
                {submitting ? "Saving..." : "Continue"}
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="action-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .profiles-viewport {
          min-height: 100vh;
          background-color: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start; 
          padding: 140px 20px 60px 20px; 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #fff;
          position: relative;
        }
        .loader-overlay {
          min-height: 100vh;
          background-color: transparent;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #fff;
          font-size: 18px;
        }
        .view-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1100px;
        }
        .fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .main-title {
          font-size: 4rem;
          font-weight: 600;
          margin-bottom: 40px;
          text-align: center;
          text-shadow: 0 4px 10px rgba(0,0,0,0.8);
          letter-spacing: 1px;
        }
        @media (max-width: 768px) {
          .main-title { font-size: 2.5rem; }
        }
        .subtitle {
          color: #ccc;
          margin-top: -30px;
          margin-bottom: 40px;
          font-size: 1.2rem;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        
        /* Fixed Grid Setup with 3 Columns flowing Right to Left */
        .profiles-flex-grid {
          display: grid;
          grid-template-columns: repeat(3, 180px);
          justify-content: center;
          gap: 40px;
          width: auto;
          margin-bottom: 60px;
          align-items: end;
          
          /* Forces columns to order and layout right-to-left */
          direction: rtl; 
        }
        
        @media (max-width: 680px) {
          .profiles-flex-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 20px;
            width: 100%;
          }
        }

        .profile-card-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          width: 100%;
          
          /* Resets textual layouts inside cards back to normal left-to-right */
          direction: ltr; 
        }
        .avatar-wrapper {
          width: 180px;
          height: 180px;
          border-radius: 90px;
          overflow: hidden;
          border: 4px solid transparent;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          background-size: cover;
          background-position: center;
          background-color: #222;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        }
        @media (max-width: 680px) {
          .avatar-wrapper {
            width: 140px;
            height: 140px;
            border-radius: 70px;
          }
        }
        .profile-card-node:hover .avatar-wrapper {
          border-color: #fff;
          transform: scale(1.05) translateY(-10px);
          box-shadow: 0 15px 30px rgba(255,255,255,0.2);
        }
        .placeholder-add {
          border: 4px dashed rgba(255,255,255,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(5px);
          transition: background-color 0.3s, border-color 0.3s, transform 0.3s;
        }
        .profile-card-node:hover .placeholder-add {
          background: rgba(255,255,255,0.1);
          border-color: #fff;
        }
        .plus-symbol {
          font-size: 5rem;
          color: rgba(255,255,255,0.5);
          line-height: 1;
          transition: color 0.3s;
        }
        .profile-card-node:hover .plus-symbol {
          color: #fff;
        }
        .profile-card-name {
          margin-top: 20px;
          color: #b3b3b3;
          font-size: 1.3rem;
          font-weight: 500;
          text-align: center;
          transition: color 0.3s, transform 0.3s;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .profile-card-node:hover .profile-card-name {
          color: #fff;
          transform: translateY(5px);
        }
        .text-muted {
          color: #aaa;
        }

        /* Profile Creation Form Layout */
        .creation-flow-card {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }
        .avatar-preview-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .large-avatar-preview {
          width: 110px;
          height: 110px;
          border-radius: 4px;
          background-size: cover;
          border: 3px solid #e50914;
          box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
        }
        .avatar-label {
          font-size: 0.9rem;
          color: #808080;
          margin: 4px 0;
        }
        .avatar-selector-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .avatar-choice-btn {
          width: 45px;
          height: 45px;
          border-radius: 4px;
          background-size: cover;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
          background-color: #222;
        }
        .avatar-choice-btn:hover {
          transform: scale(1.1);
        }
        .selected-ring {
          border-color: #fff;
          transform: scale(1.1);
        }
        .input-row {
          display: flex;
          flex-direction: column;
        }
        .modern-text-input {
          background: #444;
          border: none;
          outline: none;
          color: white;
          padding: 12px 16px;
          font-size: 1rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .modern-text-input:focus {
          background: #555;
        }
        .error-alert {
          color: #ff3838;
          font-size: 0.9rem;
          text-align: center;
          background: rgba(255, 56, 56, 0.1);
          padding: 8px;
          border-radius: 4px;
        }
        .action-row {
          display: flex;
          gap: 14px;
          margin-top: 10px;
        }
        .action-btn-primary {
          flex: 1;
          background: #fff;
          color: #000;
          border: none;
          padding: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .action-btn-primary:hover:not(:disabled) {
          background: #e50914;
          color: #fff;
        }
        .action-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn-secondary {
          flex: 1;
          background: transparent;
          color: #808080;
          border: 1px solid #808080;
          padding: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-secondary:hover {
          color: white;
          border-color: white;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
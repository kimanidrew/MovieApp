"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";
import { useAuth } from "@/components/AuthProvider";
import {
  Upload,
  Film,
  Tv,
  Clapperboard,
  Sparkles,
  Play,
  Music,
  Podcast,
  Megaphone,
  ArrowLeft,
  ArrowRight,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  Subtitles,
  Search,
  User,
  Plus,
  Globe,
  Languages,
  Accessibility,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Star,
  Eye,
  ThumbsUp,
  MessageCircle,
  Rocket,
  CalendarClock,
  EyeOff,
  Lock,
  Crown,
  ShoppingCart,
  CreditCard,
  MapPin,
  Clock3,
  Captions,
  AudioLines,
  Check,
  Loader2,
} from "lucide-react";

// ---------- Types ----------
type ContentType = "Movie" | "TV Series" | "Documentary" | "Animation" | "Short Film" | "Music" | "Podcast" | "Trailer";

interface UploadFile {
  name: string;
  size: number;
  progress: number;
  speed: string;
  remaining: string;
  status: "uploading" | "done" | "error";
  type: "video" | "poster" | "backdrop" | "trailer" | "subtitle";
}

interface CastMember {
  name: string;
  role: string;
  character?: string;
}

interface ArtworkItem {
  url: string;
  type: "poster" | "backdrop" | "logo" | "gallery";
}

// ---------- Step Definitions ----------
const STEPS = [
  { num: 1, label: "Welcome", icon: Sparkles },
  { num: 2, label: "Content Type", icon: Film },
  { num: 3, label: "Upload Files", icon: Upload },
  { num: 4, label: "Basic Details", icon: FileText },
  { num: 5, label: "Cast & Crew", icon: User },
  { num: 6, label: "Artwork", icon: ImageIcon },
  { num: 7, label: "Trailer", icon: Play },
  { num: 8, label: "Monetization", icon: DollarSign },
  { num: 9, label: "Availability", icon: Globe },
  { num: 10, label: "Accessibility", icon: Accessibility },
  { num: 11, label: "Review", icon: CheckCircle2 },
  { num: 12, label: "Publish", icon: Rocket },
];

const CONTENT_TYPES: { label: ContentType; icon: any; color: string; desc: string }[] = [
  { label: "Movie", icon: Film, color: "#8b5cf6", desc: "Feature-length film" },
  { label: "TV Series", icon: Tv, color: "#38bdf8", desc: "Episodic content" },
  { label: "Documentary", icon: Clapperboard, color: "#10b981", desc: "Non-fiction storytelling" },
  { label: "Animation", icon: Sparkles, color: "#fbbf24", desc: "Animated content" },
  { label: "Short Film", icon: Play, color: "#ec4899", desc: "Under 40 minutes" },
  { label: "Music", icon: Music, color: "#f97316", desc: "Music videos & audio" },
  { label: "Podcast", icon: Podcast, color: "#a855f7", desc: "Audio series" },
  { label: "Trailer", icon: Megaphone, color: "#06b6d4", desc: "Promotional content" },
];

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"];

const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Korean", "Hindi", "Swahili", "Arabic", "Portuguese"];

const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "South Korea", "India", "Kenya", "Nigeria", "Brazil"];

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"];

const SAMPLE_CAST = [
  { name: "Leonardo DiCaprio", role: "Actor", character: "Dom Cobb" },
  { name: "Christopher Nolan", role: "Director" },
  { name: "Hans Zimmer", role: "Music" },
  { name: "Emma Thomas", role: "Producer" },
  { name: "Jonathan Nolan", role: "Writer" },
  { name: "Lee Smith", role: "Editor" },
  { name: "Marion Cotillard", role: "Actor", character: "Mal" },
  { name: "Joseph Gordon-Levitt", role: "Actor", character: "Arthur" },
  { name: "Elliot Page", role: "Actor", character: "Ariadne" },
  { name: "Tom Hardy", role: "Actor", character: "Eames" },
];

const MONETIZATION_OPTIONS = [
  { label: "Free", icon: Eye, color: "#38bdf8", desc: "Available to all viewers", split: "70/30" },
  { label: "Premium", icon: Crown, color: "#8b5cf6", desc: "Premium subscribers only", split: "60/40" },
  { label: "Subscription", icon: CreditCard, color: "#10b981", desc: "Monthly subscription access", split: "55/45" },
  { label: "Rental", icon: Clock3, color: "#fbbf24", desc: "48-hour rental window", split: "50/50" },
  { label: "Purchase", icon: ShoppingCart, color: "#ec4899", desc: "Own it forever", split: "45/55" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// ---------- Confetti Component ----------
function Confetti() {
  const colors = ["#8b5cf6", "#38bdf8", "#fbbf24", "#10b981", "#ec4899", "#f97316"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="creator-confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </>
  );
}

// ---------- Main Upload Wizard ----------
export default function CreatorUploadWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Step 2: Content Type
  const [contentType, setContentType] = useState<ContentType | null>(null);

  // Step 3: Upload Files
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedPosterUrl, setUploadedPosterUrl] = useState("");
  const [uploadedBackdropUrl, setUploadedBackdropUrl] = useState("");
  const [uploadedTrailerUrl, setUploadedTrailerUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const { customerUser, activeProfile } = useAuth();

  // Step 4: Basic Details
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    genre: "",
    language: "",
    country: "",
    releaseDate: "",
    runtime: "",
    ageRating: "",
    keywords: [] as string[],
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 5: Cast & Crew
  const [cast, setCast] = useState<CastMember[]>([]);
  const [castSearch, setCastSearch] = useState("");
  const [castRole, setCastRole] = useState("Actor");

  // Step 6: Artwork
  const [artwork, setArtwork] = useState<ArtworkItem[]>([]);

  // Step 7: Trailer
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerType, setTrailerType] = useState<"upload" | "link">("link");

  // Step 8: Monetization
  const [monetization, setMonetization] = useState("Premium");

  // Step 9: Availability
  const [availability, setAvailability] = useState({
    countries: [] as string[],
    languages: [] as string[],
    releaseDate: "",
    premiereTime: "",
  });

  // Step 10: Accessibility
  const [accessibility, setAccessibility] = useState({
    subtitles: [] as string[],
    captions: false,
    audioDescription: false,
  });

  // Auto-save simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 4) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (!formData.genre) newErrors.genre = "Select a genre";
      if (!formData.language) newErrors.language = "Select a language";
      if (!formData.country) newErrors.country = "Select a country";
      if (!formData.releaseDate) newErrors.releaseDate = "Release date is required";
      if (!formData.runtime) newErrors.runtime = "Runtime is required";
      if (!formData.ageRating) newErrors.ageRating = "Select an age rating";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 2 && !contentType) return;
    if (step === 4 && !validateStep()) return;
    if (step === 3 && uploadFiles.length === 0) return;
    if (step === 6 && artwork.length === 0) return;
    if (step === 8 && !monetization) return;
    if (step === 9 && availability.countries.length === 0) return;
    if (step === 11) {
      setPublishing(true);
      setUploadError("");
      try {
        // Build the payload for the creator upload API
        const isMovie = contentType === "Movie" || contentType === "Documentary" || contentType === "Animation" || contentType === "Short Film";
        const isSeries = contentType === "TV Series";
        const type = isSeries ? "SHOW" : "MOVIE";

        // Parse runtime to seconds
        const runtimeMatch = formData.runtime.match(/(\d+)h\s*(\d+)?m?/);
        const hours = runtimeMatch ? parseInt(runtimeMatch[1]) : 0;
        const minutes = runtimeMatch && runtimeMatch[2] ? parseInt(runtimeMatch[2]) : 0;
        const durationSeconds = hours * 3600 + minutes * 60;

        // Build image assets
        const images = [
          ...(uploadedPosterUrl ? [{ url: uploadedPosterUrl, type: "POSTER", displayOrder: 0 }] : []),
          ...(uploadedBackdropUrl ? [{ url: uploadedBackdropUrl, type: "BACKDROP", displayOrder: 0 }] : []),
          ...artwork.map((a, i) => ({
            url: a.url,
            type: a.type === "poster" ? "POSTER" : a.type === "backdrop" ? "BACKDROP" : "STILL",
            displayOrder: i,
          })),
        ];

        // Build trailers
        const trailers = uploadedTrailerUrl
          ? [{ title: "Official Trailer", hlsManifestUrl: uploadedTrailerUrl }]
          : trailerUrl
          ? [{ title: "Official Trailer", hlsManifestUrl: trailerUrl }]
          : [];

        const payload = {
          type,
          title: formData.title,
          description: formData.description,
          storyline: formData.tagline || formData.description,
          releaseYear: formData.releaseDate ? new Date(formData.releaseDate).getFullYear() : new Date().getFullYear(),
          maturityRatingCode: formData.ageRating || "TV-MA",
          categories: [formData.genre].filter(Boolean),
          images,
          trailers,
          videoUrl: uploadedVideoUrl,
          durationSeconds,
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: formData.title,
          episodeDescription: formData.description,
        };

        const res = await fetch("/api/creator/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to publish content");

        setPublishing(false);
        setPublished(true);
        goTo(12);
      } catch (error: any) {
        setPublishing(false);
        setUploadError(error?.message || "Failed to publish content");
      }
      return;
    }
    goTo(Math.min(step + 1, 12));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = async (files: File[]) => {
    setUploadError("");
    setUploading(true);

    for (const file of files) {
      const fileId = Date.now() + Math.random();
      const isVideo = file.type.startsWith("video");
      const isImage = file.type.startsWith("image");

      const newFile: UploadFile = {
        name: file.name,
        size: file.size,
        progress: 0,
        speed: "0 MB/s",
        remaining: "Starting...",
        status: "uploading",
        type: isVideo ? "video" : isImage ? "poster" : "subtitle",
      };
      setUploadFiles((prev) => [...prev, newFile]);

      try {
        // Determine asset type for R2 upload
        let assetType: "VIDEO" | "POSTER" | "BACKDROP" | "TRAILER" = "VIDEO";
        if (isImage) {
          assetType = "POSTER";
        } else if (isVideo) {
          assetType = "VIDEO";
        }

        // Update progress to show upload starting
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, progress: 10, speed: "Uploading to Cloudflare R2...", remaining: "In progress" }
              : f
          )
        );

        const publicUrl = await uploadFileToR2(file, assetType);

        // Store the URL based on file type
        if (isVideo) {
          setUploadedVideoUrl(publicUrl);
        } else if (isImage) {
          if (!uploadedPosterUrl) setUploadedPosterUrl(publicUrl);
          else if (!uploadedBackdropUrl) setUploadedBackdropUrl(publicUrl);
        }

        // Mark as done
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, progress: 100, status: "done", speed: "0 MB/s", remaining: "Done" }
              : f
          )
        );
      } catch (error: any) {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "error", remaining: error?.message || "Upload failed" }
              : f
          )
        );
        setUploadError(error?.message || "Upload failed");
      }
    }

    setUploading(false);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
      setKeywordInput("");
    }
  };

  const addCastMember = (member: { name: string; role: string; character?: string }) => {
    if (!cast.some((c) => c.name === member.name)) {
      setCast((prev) => [...prev, member]);
    }
  };

  const toggleCountry = (country: string) => {
    setAvailability((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setAvailability((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleSubtitle = (lang: string) => {
    setAccessibility((prev) => ({
      ...prev,
      subtitles: prev.subtitles.includes(lang)
        ? prev.subtitles.filter((l) => l !== lang)
        : [...prev.subtitles, lang],
    }));
  };

  const filteredCast = SAMPLE_CAST.filter(
    (c) =>
      c.name.toLowerCase().includes(castSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(castSearch.toLowerCase())
  );

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={stagger}
            initial="hidden"
            animate="show"
            style={{ textAlign: "center", maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem" }}
          >
            <motion.div variants={fadeUp} style={{ position: "relative", display: "inline-block", marginBottom: "2rem" }}>
              <div className="creator-float-anim" style={{ width: 180, height: 180, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 80px rgba(139,92,246,0.4)" }}>
                <Film size={80} color="#fff" />
              </div>
              <div className="creator-float-slow" style={{ position: "absolute", top: -10, right: -20, width: 50, height: 50, borderRadius: 16, background: "rgba(56,189,248,0.2)", border: "1px solid rgba(56,189,248,0.3)", backdropFilter: "blur(10px)" }} />
              <div className="creator-float-anim" style={{ position: "absolute", bottom: -10, left: -20, width: 40, height: 40, borderRadius: 12, background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)" }} />
            </motion.div>

            <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, marginBottom: "1rem", lineHeight: 1.1 }}>
              Upload Your Next <span className="creator-gradient-text">Masterpiece</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", fontSize: "1.1rem", marginBottom: "2.5rem", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
              Bring your vision to life. A cinematic, step-by-step publishing experience designed for creators.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="creator-btn creator-btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }} onClick={() => goTo(2)}>
                <Rocket size={20} /> Start Upload
              </button>
              <button className="creator-btn creator-btn-secondary" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }}>
                <Save size={20} /> Continue Draft
              </button>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Choose Your <span className="creator-gradient-text">Content Type</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2.5rem" }}>
              Select the format that best fits your creation
            </motion.p>

            <div className="creator-grid creator-grid-4">
              {CONTENT_TYPES.map((type) => (
                <motion.button
                  key={type.label}
                  variants={fadeUp}
                  onClick={() => setContentType(type.label)}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: 20,
                    background: contentType === type.label ? `${type.color}20` : "var(--creator-surface)",
                    border: contentType === type.label ? `2px solid ${type.color}` : "1px solid var(--creator-border)",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s",
                    color: "#fff",
                    fontFamily: "var(--font-main), sans-serif",
                  }}
                >
                  <div style={{ width: 56, height: 56, margin: "0 auto 1rem", borderRadius: "50%", background: `${type.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <type.icon size={26} color={type.color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>{type.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>{type.desc}</div>
                  {contentType === type.label && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: "0.75rem", color: type.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Selected
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Upload Your <span className="creator-gradient-text">Files</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Drag & drop your video, poster, backdrop, trailer, and subtitles
            </motion.p>

            <motion.div
              variants={fadeUp}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#8b5cf6" : "var(--creator-border)"}`,
                borderRadius: 24,
                padding: "3rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
                transition: "all 0.3s",
                marginBottom: "1.5rem",
              }}
            >
              <motion.div animate={{ scale: dragging ? 1.1 : 1 }} style={{ width: 80, height: 80, margin: "0 auto 1rem", borderRadius: "50%", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={36} color="#8b5cf6" />
              </motion.div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {dragging ? "Drop your files here" : "Drag & drop files here"}
              </div>
              <div style={{ color: "var(--creator-text-3)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                or click to browse · Video, Images, Subtitles
              </div>
              <button className="creator-btn creator-btn-secondary" style={{ fontSize: "0.85rem" }}>
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,image/*,.srt,.vtt"
                style={{ display: "none" }}
                onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              />
            </motion.div>

            {uploadFiles.length > 0 && (
              <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {uploadFiles.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="creator-glass"
                    style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: file.type === "video" ? "rgba(139,92,246,0.15)" : file.type === "poster" ? "rgba(56,189,248,0.15)" : "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {file.type === "video" ? <FileVideo size={20} color="#8b5cf6" /> : file.type === "poster" ? <ImageIcon size={20} color="#38bdf8" /> : <Subtitles size={20} color="#10b981" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)", marginBottom: "0.5rem" }}>
                        {(file.size / 1024 / 1024).toFixed(1)} MB · {file.speed} · {file.remaining}
                      </div>
                      <div className="creator-progress-track">
                        <div className="creator-progress-fill" style={{ width: `${file.progress}%`, background: file.status === "done" ? "linear-gradient(135deg,#10b981,#059669)" : undefined }} />
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {file.status === "done" ? (
                        <CheckCircle2 size={22} color="#10b981" />
                      ) : file.status === "error" ? (
                        <AlertCircle size={22} color="#f87171" />
                      ) : (
                        <Loader2 size={22} color="#8b5cf6" className="creator-pulse" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Basic <span className="creator-gradient-text">Details</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Tell your audience what this is about
            </motion.p>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "2rem" }}>
              <div className="creator-grid creator-grid-2">
                <div className="creator-float">
                  <input
                    type="text"
                    placeholder=" "
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={errors.title ? "creator-input-error" : ""}
                  />
                  <label>Title *</label>
                  {errors.title && <div className="creator-error-text"><AlertCircle size={12} /> {errors.title}</div>}
                </div>

                <div className="creator-float">
                  <input
                    type="text"
                    placeholder=" "
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                  <label>Tagline</label>
                </div>
              </div>

              <div className="creator-float" style={{ marginBottom: "1.25rem" }}>
                <textarea
                  placeholder=" "
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? "creator-input-error" : ""}
                />
                <label>Description *</label>
                {errors.description && <div className="creator-error-text"><AlertCircle size={12} /> {errors.description}</div>}
              </div>

              <div className="creator-grid creator-grid-2">
                <div className="creator-float">
                  <select value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className={errors.genre ? "creator-input-error" : ""}>
                    <option value="">Select genre</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <label>Genre *</label>
                  {errors.genre && <div className="creator-error-text"><AlertCircle size={12} /> {errors.genre}</div>}
                </div>

                <div className="creator-float">
                  <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className={errors.language ? "creator-input-error" : ""}>
                    <option value="">Select language</option>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <label>Language *</label>
                  {errors.language && <div className="creator-error-text"><AlertCircle size={12} /> {errors.language}</div>}
                </div>

                <div className="creator-float">
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className={errors.country ? "creator-input-error" : ""}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label>Country *</label>
                  {errors.country && <div className="creator-error-text"><AlertCircle size={12} /> {errors.country}</div>}
                </div>

                <div className="creator-float">
                  <input
                    type="date"
                    placeholder=" "
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className={errors.releaseDate ? "creator-input-error" : ""}
                  />
                  <label>Release Date *</label>
                  {errors.releaseDate && <div className="creator-error-text"><AlertCircle size={12} /> {errors.releaseDate}</div>}
                </div>

                <div className="creator-float">
                  <input
                    type="text"
                    placeholder=" "
                    value={formData.runtime}
                    onChange={(e) => setFormData({ ...formData, runtime: e.target.value })}
                    className={errors.runtime ? "creator-input-error" : ""}
                  />
                  <label>Runtime (e.g. 2h 28m) *</label>
                  {errors.runtime && <div className="creator-error-text"><AlertCircle size={12} /> {errors.runtime}</div>}
                </div>

                <div className="creator-float">
                  <select value={formData.ageRating} onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })} className={errors.ageRating ? "creator-input-error" : ""}>
                    <option value="">Select age rating</option>
                    {AGE_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <label>Age Rating *</label>
                  {errors.ageRating && <div className="creator-error-text"><AlertCircle size={12} /> {errors.ageRating}</div>}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--creator-text-2)", marginBottom: "0.5rem", display: "block" }}>Keywords</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Add keywords and press Enter"
                    className="creator-input"
                  />
                  <button className="creator-btn creator-btn-secondary" onClick={addKeyword} style={{ padding: "0.5rem 1rem" }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {formData.keywords.map((k) => (
                    <span key={k} className="creator-chip">
                      {k}
                      <button onClick={() => setFormData({ ...formData, keywords: formData.keywords.filter((x) => x !== k) })}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Cast & <span className="creator-gradient-text">Crew</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Search and add the people behind your creation
            </motion.p>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--creator-text-3)" }} />
                  <input
                    type="text"
                    value={castSearch}
                    onChange={(e) => setCastSearch(e.target.value)}
                    placeholder="Search TMDB cast & crew..."
                    className="creator-input"
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
                <select value={castRole} onChange={(e) => setCastRole(e.target.value)} className="creator-input" style={{ width: 140 }}>
                  <option value="Actor">Actor</option>
                  <option value="Director">Director</option>
                  <option value="Producer">Producer</option>
                  <option value="Writer">Writer</option>
                  <option value="Editor">Editor</option>
                  <option value="Music">Music</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 300, overflowY: "auto" }} className="creator-scroll">
                {filteredCast.map((member) => (
                  <div
                    key={member.name}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                    onClick={() => addCastMember({ name: member.name, role: castRole, character: member.character })}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={16} color="#8b5cf6" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>{member.role}{member.character ? ` · ${member.character}` : ""}</div>
                    </div>
                    <Plus size={16} color="var(--creator-text-3)" />
                  </div>
                ))}
              </div>
            </motion.div>

            {cast.length > 0 && (
              <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>Added Cast & Crew ({cast.length})</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {cast.map((member) => (
                    <span key={member.name} className="creator-chip">
                      <User size={12} /> {member.name} · {member.role}
                      <button onClick={() => setCast(cast.filter((c) => c.name !== member.name))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Artwork & <span className="creator-gradient-text">Visuals</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Upload your poster, backdrop, logo, and gallery images
            </motion.p>

            <motion.div variants={fadeUp} className="creator-grid creator-grid-2" style={{ marginBottom: "1.5rem" }}>
              {(["poster", "backdrop", "logo", "gallery"] as const).map((type) => (
                <div
                  key={type}
                  onClick={() => {
                    const urls = {
                      poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                      backdrop: "https://image.tmdb.org/t/p/w1280/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                      logo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop",
                      gallery: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
                    };
                    setArtwork((prev) => [...prev, { url: urls[type], type }]);
                  }}
                  style={{
                    border: "2px dashed var(--creator-border)",
                    borderRadius: 20,
                    padding: "2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    background: "rgba(255,255,255,0.02)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "rgba(139,92,246,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--creator-border)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <ImageIcon size={32} color="#8b5cf6" style={{ marginBottom: "0.75rem" }} />
                  <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{type}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--creator-text-3)" }}>Click to add sample</div>
                </div>
              ))}
            </motion.div>

            {artwork.length > 0 && (
              <motion.div variants={fadeUp} style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }} className="creator-scroll">
                {artwork.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ position: "relative", minWidth: 200, height: 120, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}
                  >
                    <img src={item.url} alt={item.type} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", background: "rgba(11,11,15,0.8)", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", textTransform: "capitalize" }}>
                      {item.type}
                    </div>
                    <button
                      onClick={() => setArtwork(artwork.filter((_, idx) => idx !== i))}
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(239,68,68,0.8)", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={14} color="#fff" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="step7" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Trailer & <span className="creator-gradient-text">Preview</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Upload a trailer or paste a YouTube/Vimeo link
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
              <button
                className={`creator-btn ${trailerType === "link" ? "creator-btn-primary" : "creator-btn-secondary"}`}
                onClick={() => setTrailerType("link")}
                style={{ fontSize: "0.85rem" }}
              >
                <LinkIcon size={16} /> YouTube / Vimeo Link
              </button>
              <button
                className={`creator-btn ${trailerType === "upload" ? "creator-btn-primary" : "creator-btn-secondary"}`}
                onClick={() => setTrailerType("upload")}
                style={{ fontSize: "0.85rem" }}
              >
                <Upload size={16} /> Upload Trailer
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
              {trailerType === "link" ? (
                <div className="creator-float">
                  <input
                    type="url"
                    placeholder=" "
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                  />
                  <label>Paste YouTube or Vimeo URL</label>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: "2px dashed var(--creator-border)", borderRadius: 16, padding: "2rem", textAlign: "center", cursor: "pointer" }}
                >
                  <Play size={32} color="#8b5cf6" style={{ marginBottom: "0.5rem" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Click to upload trailer video</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>MP4, MOV, WebM · Max 500MB</div>
                </div>
              )}

              {trailerUrl && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "1.5rem", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                  <iframe
                    src={trailerUrl.replace("watch?v=", "embed/")}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div key="step8" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Monetization <span className="creator-gradient-text">Strategy</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Choose how your content generates revenue
            </motion.p>

            <div className="creator-grid creator-grid-2">
              {MONETIZATION_OPTIONS.map((option) => (
                <motion.button
                  key={option.label}
                  variants={fadeUp}
                  onClick={() => setMonetization(option.label)}
                  whileHover={{ y: -4 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: 20,
                    background: monetization === option.label ? `${option.color}15` : "var(--creator-surface)",
                    border: monetization === option.label ? `2px solid ${option.color}` : "1px solid var(--creator-border)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#fff",
                    fontFamily: "var(--font-main), sans-serif",
                    transition: "all 0.3s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${option.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <option.icon size={22} color={option.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{option.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>{option.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--creator-text-2)" }}>Revenue split</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: option.color }}>{option.split}</span>
                  </div>
                  {monetization === option.label && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: "0.75rem", color: option.color, display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Selected
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div key="step9" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Availability & <span className="creator-gradient-text">Release</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Choose where and when your content is available
            </motion.p>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Globe size={18} color="#38bdf8" />
                <span style={{ fontWeight: 600 }}>Available Countries</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {COUNTRIES.map((country) => (
                  <button
                    key={country}
                    onClick={() => toggleCountry(country)}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: 9999,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      background: availability.countries.includes(country) ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                      border: availability.countries.includes(country) ? "1px solid #38bdf8" : "1px solid var(--creator-border)",
                      color: availability.countries.includes(country) ? "#38bdf8" : "var(--creator-text-2)",
                      fontFamily: "var(--font-main), sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Languages size={18} color="#8b5cf6" />
                <span style={{ fontWeight: 600 }}>Available Languages</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: 9999,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      background: availability.languages.includes(lang) ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                      border: availability.languages.includes(lang) ? "1px solid #8b5cf6" : "1px solid var(--creator-border)",
                      color: availability.languages.includes(lang) ? "#c4b5fd" : "var(--creator-text-2)",
                      fontFamily: "var(--font-main), sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
              <div className="creator-grid creator-grid-2">
                <div className="creator-float">
                  <input
                    type="date"
                    placeholder=" "
                    value={availability.releaseDate}
                    onChange={(e) => setAvailability({ ...availability, releaseDate: e.target.value })}
                  />
                  <label>Release Date</label>
                </div>
                <div className="creator-float">
                  <input
                    type="time"
                    placeholder=" "
                    value={availability.premiereTime}
                    onChange={(e) => setAvailability({ ...availability, premiereTime: e.target.value })}
                  />
                  <label>Premiere Time</label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 10:
        return (
          <motion.div key="step10" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Accessibility & <span className="creator-gradient-text">Inclusion</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Make your content accessible to everyone
            </motion.p>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Captions size={18} color="#10b981" />
                <span style={{ fontWeight: 600 }}>Subtitles & Captions</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleSubtitle(lang)}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: 9999,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      background: accessibility.subtitles.includes(lang) ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: accessibility.subtitles.includes(lang) ? "1px solid #10b981" : "1px solid var(--creator-border)",
                      color: accessibility.subtitles.includes(lang) ? "#10b981" : "var(--creator-text-2)",
                      fontFamily: "var(--font-main), sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={accessibility.captions}
                    onChange={(e) => setAccessibility({ ...accessibility, captions: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "#10b981" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Closed Captions</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>Display text of dialogue and sounds</div>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={accessibility.audioDescription}
                    onChange={(e) => setAccessibility({ ...accessibility, audioDescription: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "#8b5cf6" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Audio Description</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--creator-text-3)" }}>Narrated description of visual elements</div>
                  </div>
                </label>
              </div>
            </motion.div>
          </motion.div>
        );

      case 11:
        return (
          <motion.div key="step11" variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <motion.h2 variants={fadeUp} style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem" }}>
              Review Your <span className="creator-gradient-text">Masterpiece</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: "var(--creator-text-2)", textAlign: "center", marginBottom: "2rem" }}>
              Everything looks ready. Review before publishing.
            </motion.p>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <div style={{ width: 120, height: 180, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <img src="https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg" alt="Poster" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>{formData.title || "Untitled"}</h3>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  <span className="creator-chip">{contentType || "Movie"}</span>
                  {formData.genre && <span className="creator-chip">{formData.genre}</span>}
                  {formData.ageRating && <span className="creator-chip">{formData.ageRating}</span>}
                  {formData.runtime && <span className="creator-chip">{formData.runtime}</span>}
                </div>
                <p style={{ color: "var(--creator-text-2)", fontSize: "0.9rem", margin: 0 }}>{formData.description || "No description provided"}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Content Type", value: contentType || "—" },
                  { label: "Files Uploaded", value: `${uploadFiles.length} files` },
                  { label: "Cast & Crew", value: `${cast.length} people` },
                  { label: "Artwork", value: `${artwork.length} images` },
                  { label: "Monetization", value: monetization || "—" },
                  { label: "Countries", value: `${availability.countries.length} countries` },
                  { label: "Languages", value: `${availability.languages.length} languages` },
                  { label: "Subtitles", value: `${accessibility.subtitles.length} languages` },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--creator-text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.25rem" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {(!formData.title || !formData.description || uploadFiles.length === 0) && (
              <motion.div variants={fadeUp} style={{ padding: "1rem", borderRadius: 12, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertCircle size={20} color="#fbbf24" />
                <div style={{ fontSize: "0.85rem", color: "#fbbf24" }}>
                  Some required fields are missing. Go back to complete them before publishing.
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 12:
        return (
          <motion.div key="step12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "4rem 1.5rem", maxWidth: 600, margin: "0 auto" }}>
            {published && <Confetti />}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="creator-checkmark-circle"
              style={{ margin: "0 auto 2rem" }}
            >
              <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
                <path className="creator-checkmark" d="M14 24L21 31L34 17" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Your Content is <span className="creator-gradient-text">Live!</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ color: "var(--creator-text-2)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
              {formData.title || "Your masterpiece"} has been published successfully. It's now available to your audience.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/creator" className="creator-btn creator-btn-primary" style={{ textDecoration: "none" }}>
                <CheckCircle2 size={18} /> Back to Dashboard
              </Link>
              <button className="creator-btn creator-btn-secondary">
                <CalendarClock size={18} /> Schedule
              </button>
              <button className="creator-btn creator-btn-secondary">
                <Eye size={18} /> Preview
              </button>
              <button className="creator-btn creator-btn-secondary">
                <Save size={18} /> Save Draft
              </button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Animated background */}
      <div className="creator-animated-bg" style={{ position: "fixed", inset: 0, zIndex: -1 }} />

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(11,11,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/creator" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <X size={20} color="var(--creator-text-2)" />
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Exit</span>
          </Link>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="creator-progress-track" style={{ maxWidth: 400 }}>
              <div className="creator-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--creator-text-2)", whiteSpace: "nowrap" }}>
              Step {step} of {STEPS.length}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {saved && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <CheckCircle2 size={14} /> Auto-saved
              </motion.span>
            )}
            <button className="creator-btn creator-btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
              <Save size={14} /> Save Draft
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 0.75rem", display: "flex", gap: "0.25rem", overflowX: "auto" }} className="creator-scroll">
          {STEPS.map((s) => (
            <button
              key={s.num}
              onClick={() => s.num < step && goTo(s.num)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: 9999,
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: s.num < step ? "pointer" : "default",
                background: s.num === step ? "rgba(139,92,246,0.2)" : s.num < step ? "rgba(16,185,129,0.1)" : "transparent",
                border: s.num === step ? "1px solid #8b5cf6" : s.num < step ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                color: s.num === step ? "#c4b5fd" : s.num < step ? "#10b981" : "var(--creator-text-3)",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-main), sans-serif",
              }}
            >
              <s.icon size={12} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {step < 12 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(11,11,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              className="creator-btn creator-btn-ghost"
              onClick={() => goTo(Math.max(step - 1, 1))}
              disabled={step === 1}
              style={{ visibility: step === 1 ? "hidden" : "visible" }}
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="creator-btn creator-btn-secondary" style={{ fontSize: "0.85rem" }}>
                <Save size={16} /> Save Draft
              </button>
              <button
                className="creator-btn creator-btn-primary"
                onClick={handleNext}
                disabled={publishing || (step === 2 && !contentType) || (step === 3 && uploadFiles.length === 0) || (step === 6 && artwork.length === 0) || (step === 9 && availability.countries.length === 0)}
                style={{ fontSize: "0.85rem" }}
              >
                {publishing ? (
                  <>
                    <Loader2 size={16} className="creator-pulse" /> Publishing...
                  </>
                ) : step === 11 ? (
                  <>
                    <Rocket size={16} /> Publish Now
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

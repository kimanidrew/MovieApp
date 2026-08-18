"use client";

import React, { useState, useCallback, useEffect } from "react";
import HeaderTabs from "./components/HeaderTabs";
import TmdbSearch from "./components/TmdbSearch";
import TitleInformationForm from "./components/TitleInformationForm";
import GraphicAssetsUploader from "./components/GraphicAssetsUploader";
import TrailerUploader from "./components/TrailerUploader";
import MainVideoUploader from "./components/MainVideoUploader";
import VideoDetailsForm from "./components/VideoDetailsForm";
import CastCrewForm from "./components/CastCrewForm";
import SubtitlesForm from "./components/SubtitlesForm";
import ProductionInfoForm from "./components/ProductionInfoForm";
import AwardsForm from "./components/AwardsForm";
import TvSeasonEpisodeForm from "./components/TvSeasonEpisodeForm";
import { CheckCircle, AlertTriangle } from "lucide-react";

const emptyFormData: Record<string, any> = {
  title: "", slug: "", description: "", storyline: "", releaseYear: "",
  maturityRatingCode: "", tmdbId: "", keywords: [], originalLanguage: "en",
  spokenLanguages: [], popularityScore: 0, voteAverage: 0, voteCount: 0,
  runtime: "", status: "", homepage: "", imdbId: "",
};

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<"MOVIE" | "SHOW">("MOVIE");
  const [formData, setFormData] = useState<any>({ ...emptyFormData });
  const [categories, setCategories] = useState<string[]>([]);
  const [imageAssets, setImageAssets] = useState<any[]>([]);
  const [trailerTracks, setTrailerTracks] = useState<any[]>([]);
  const [mainVideoFile, setMainVideoFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState<any>({});
  const [cast, setCast] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [productionInfo, setProductionInfo] = useState<any>({});
  const [awards, setAwards] = useState<any[]>([]);
  const [selectedTmdbItem, setSelectedTmdbItem] = useState<any>(null);
  const [showConfig, setShowConfig] = useState({
    seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "",
  });
  const [isExistingShow, setIsExistingShow] = useState(false);
  const [selectedExistingShowId, setSelectedExistingShowId] = useState("");
  const [selectedShowMeta, setSelectedShowMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [maturityOptions, setMaturityOptions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/metadata/ratings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMaturityOptions(data);
        else if (data?.ratings) setMaturityOptions(data.ratings);
      })
      .catch(() => {});
  }, []);

  const updateFormData = useCallback((updater: any) => {
    if (typeof updater === "function") {
      setFormData((prev: any) => updater(prev));
    } else {
      setFormData(updater);
    }
  }, []);

  const handleTypeSwitch = (type: "MOVIE" | "SHOW") => {
    setActiveTab(type);
    setSaveStatus(null);
  };

  const ensureSlug = () => {
    if (!formData.slug && formData.title) {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setFormData((prev: any) => ({ ...prev, slug }));
      return slug;
    }
    return formData.slug;
  };

  const buildPayload = () => {
    const slug = ensureSlug();
    const base: Record<string, any> = {
      type: activeTab,
      title: formData.title,
      slug: slug || `content-${Date.now()}`,
      description: formData.description || "",
      storyline: formData.storyline || "",
      releaseYear: formData.releaseYear || "2026",
      maturityRatingCode: formData.maturityRatingCode || "TV-MA",
      tmdbId: formData.tmdbId || "",
      categories,
      images: imageAssets,
      trailers: trailerTracks,
      imdbId: formData.imdbId || "",
      originalLanguage: formData.originalLanguage || "en",
      spokenLanguages: formData.spokenLanguages || [],
      popularityScore: Number(formData.popularityScore || 0),
      voteAverage: Number(formData.voteAverage || 0),
      voteCount: Number(formData.voteCount || 0),
      runtime: formData.runtime || "",
      status: formData.status || "Released",
      homepage: formData.homepage || "",
      keywords: formData.keywords || [],
      cast, crew, videoDetails, subtitles, productionInfo, awards,
      isFeatured: false, featuredOrder: 0,
    };

    if (activeTab === "MOVIE") {
      return { ...base, movieVideoUrl: uploadedVideoUrl || "", movieDuration: videoDetails.durationSeconds || "7200" };
    }

    return {
      ...base,
      episodeVideoUrl: uploadedVideoUrl || "",
      episodeDuration: videoDetails.durationSeconds || "2700",
      seasonNumber: showConfig.seasonNumber || "1",
      episodeNumber: showConfig.episodeNumber || "1",
      episodeTitle: showConfig.episodeTitle || "",
      episodeDescription: showConfig.episodeDescription || "",
      isExistingShow,
      existingShowId: isExistingShow ? selectedExistingShowId : "",
    };
  };

  const commitCompleteAssetToDb = async () => {
    if (!formData.title) {
      setSaveStatus({ ok: false, message: "At least a title is required to save content." });
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/admin/media/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save content");

      setSaveStatus({ ok: true, message: "Content saved successfully to the catalog!" });
      setTimeout(() => {
        setFormData({ ...emptyFormData });
        setCategories([]); setImageAssets([]); setTrailerTracks([]);
        setMainVideoFile(null); setUploadedVideoUrl(""); setVideoDetails({});
        setCast([]); setCrew([]); setSubtitles([]);
        setProductionInfo({}); setAwards([]); setSelectedTmdbItem(null);
        setShowConfig({ seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "" });
        setSaveStatus(null);
      }, 2500);
    } catch (err: any) {
      setSaveStatus({ ok: false, message: err?.message || "Failed to save content." });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = Boolean(formData.title);

  return (
    <div className="workspace-container">
      <div className="layout-max-wrapper">
        <HeaderTabs activeTab={activeTab} setActiveTab={handleTypeSwitch} />

        {saveStatus && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem",
              background: saveStatus.ok ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${saveStatus.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            }}
          >
            {saveStatus.ok
              ? <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              : <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />}
            <span style={{ fontSize: "0.875rem", color: saveStatus.ok ? "#10b981" : "#ef4444", fontWeight: 500 }}>
              {saveStatus.message}
            </span>
          </div>
        )}

        <TmdbSearch
          activeTab={activeTab}
          setFormData={updateFormData}
          setCategories={setCategories}
          setImageAssets={setImageAssets}
          setTrailerTracks={setTrailerTracks}
          setSelectedTmdbItem={setSelectedTmdbItem}
          setCast={setCast}
          setCrew={setCrew}
          setProductionInfo={setProductionInfo}
        />

        <div className="split-grid-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <TitleInformationForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              setCategories={setCategories}
              maturityOptions={maturityOptions}
            />
            <GraphicAssetsUploader imageAssets={imageAssets} setImageAssets={setImageAssets} />
            <TrailerUploader trailerTracks={trailerTracks} setTrailerTracks={setTrailerTracks} />

            {activeTab === "SHOW" && (
              <TvSeasonEpisodeForm
                showConfig={showConfig}
                setShowConfig={setShowConfig}
                isExistingShow={isExistingShow}
                setIsExistingShow={setIsExistingShow}
                selectedExistingShowId={selectedExistingShowId}
                setSelectedExistingShowId={setSelectedExistingShowId}
                parentTmdbId={formData.tmdbId}
                setSelectedShowMeta={setSelectedShowMeta}
              />
            )}

            <VideoDetailsForm videoDetails={videoDetails} setVideoDetails={setVideoDetails} />
            <CastCrewForm cast={cast} setCast={setCast} crew={crew} setCrew={setCrew} />
            <SubtitlesForm
              subtitles={subtitles}
              setSubtitles={setSubtitles}
              videoDetails={videoDetails}
              setVideoDetails={setVideoDetails}
            />
            <ProductionInfoForm productionInfo={productionInfo} setProductionInfo={setProductionInfo} />
            <AwardsForm awards={awards} setAwards={setAwards} />
          </div>

          <div>
            <MainVideoUploader
              mainVideoFile={mainVideoFile}
              setMainVideoFile={setMainVideoFile}
              uploadedVideoUrl={uploadedVideoUrl}
              setUploadedVideoUrl={setUploadedVideoUrl}
              commitCompleteAssetToDb={commitCompleteAssetToDb}
              saving={saving}
              isFormValid={isFormValid}
            />

            <div className="panel-card-glass" style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.75rem 0" }}>
                Quick Summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Title</span>
                  <span style={{ color: formData.title ? "#fafafa" : "#71717a", fontWeight: 500 }}>
                    {formData.title || "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Type</span>
                  <span style={{ color: "#fafafa", fontWeight: 500 }}>{activeTab === "MOVIE" ? "Movie" : "TV Show"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Categories</span>
                  <span style={{ color: categories.length ? "#fafafa" : "#71717a", fontWeight: 500 }}>{categories.length || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Images</span>
                  <span style={{ color: imageAssets.length ? "#fafafa" : "#71717a", fontWeight: 500 }}>{imageAssets.length || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Video</span>
                  <span style={{ color: uploadedVideoUrl ? "#10b981" : "#71717a", fontWeight: 500 }}>
                    {uploadedVideoUrl ? "✓ Attached" : "Pending"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>Cast</span>
                  <span style={{ color: cast.length ? "#fafafa" : "#71717a", fontWeight: 500 }}>{cast.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

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
  const [showConfig, setShowConfig] = useState({ seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "" });
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
      .catch(() => setSaveStatus({ ok: false, message: "Could not load maturity ratings. You can still complete the other fields." }));
  }, []);

  const updateFormData = useCallback((updater: any) => {
    setFormData((prev: any) => typeof updater === "function" ? updater(prev) : updater);
  }, []);

  const handleTypeSwitch = (type: "MOVIE" | "SHOW") => {
    if (saving) return;
    setActiveTab(type);
    setSaveStatus(null);
  };

  const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const ensureSlug = () => {
    const slug = formData.slug?.trim() || slugify(formData.title || "");
    if (slug && slug !== formData.slug) setFormData((prev: any) => ({ ...prev, slug }));
    return slug;
  };

  const buildPayload = () => {
    const slug = ensureSlug();
    const base: Record<string, any> = {
      type: activeTab,
      title: formData.title.trim(),
      slug: slug || `content-${Date.now()}`,
      description: formData.description?.trim() || "",
      storyline: formData.storyline?.trim() || "",
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

  const resetForm = () => {
    setFormData({ ...emptyFormData });
    setCategories([]); setImageAssets([]); setTrailerTracks([]);
    setMainVideoFile(null); setUploadedVideoUrl(""); setVideoDetails({});
    setCast([]); setCrew([]); setSubtitles([]); setProductionInfo({}); setAwards([]);
    setSelectedTmdbItem(null); setIsExistingShow(false); setSelectedExistingShowId(""); setSelectedShowMeta(null);
    setShowConfig({ seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "" });
  };

  const commitCompleteAssetToDb = async () => {
    const title = formData.title?.trim();
    if (!title) {
      setSaveStatus({ ok: false, message: "Add a title before saving this release." });
      return;
    }

    if (activeTab === "SHOW" && isExistingShow && !selectedExistingShowId) {
      setSaveStatus({ ok: false, message: "Select the existing TV show before saving this episode." });
      return;
    }

    const season = Number(showConfig.seasonNumber);
    const episode = Number(showConfig.episodeNumber);
    if (activeTab === "SHOW" && (!Number.isInteger(season) || season < 1 || !Number.isInteger(episode) || episode < 1)) {
      setSaveStatus({ ok: false, message: "Season and episode numbers must be positive whole numbers." });
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

      let data: any = {};
      try { data = await res.json(); } catch { /* handled by generic error */ }
      if (!res.ok) throw new Error(data.error || "The catalog could not be saved.");

      const label = activeTab === "MOVIE" ? "movie" : "episode";
      setSaveStatus({ ok: true, message: `Tidpix ${label} saved successfully to the catalog.` });
      window.setTimeout(() => {
        resetForm();
        setSaveStatus(null);
      }, 2500);
    } catch (err: any) {
      setSaveStatus({ ok: false, message: err?.message || "The catalog could not be saved. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = Boolean(formData.title?.trim());

  return (
    <div className="workspace-container">
      <div className="layout-max-wrapper">
        <HeaderTabs activeTab={activeTab} setActiveTab={handleTypeSwitch} />

        <div className="upload-intro-banner">
          <div>
            <strong>Publish to Tidpix</strong>
            <span>Search TMDB to auto-fill metadata, add artwork and media, review the details, then save the release.</span>
          </div>
          <div className="upload-flow-hint"><span>1</span> Metadata <b>→</b><span>2</span> Artwork <b>→</b><span>3</span> Video <b>→</b><span>4</span> Publish</div>
        </div>

        {saveStatus && (
          <div className={`save-status-banner ${saveStatus.ok ? "success" : "error"}`} role="status">
            {saveStatus.ok ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{saveStatus.message}</span>
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
          isExistingShow={isExistingShow}
          setIsExistingShow={setIsExistingShow}
          selectedExistingShowId={selectedExistingShowId}
          setSelectedExistingShowId={setSelectedExistingShowId}
          setSelectedShowMeta={setSelectedShowMeta}
        />

        <div className="split-grid-layout">
          <div>
            <TitleInformationForm formData={formData} setFormData={setFormData} categories={categories} setCategories={setCategories} maturityOptions={maturityOptions} />
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
                selectedShowMeta={selectedShowMeta}
              />
            )}

            <VideoDetailsForm videoDetails={videoDetails} setVideoDetails={setVideoDetails} />
            <CastCrewForm cast={cast} setCast={setCast} crew={crew} setCrew={setCrew} />
            <SubtitlesForm subtitles={subtitles} setSubtitles={setSubtitles} videoDetails={videoDetails} setVideoDetails={setVideoDetails} />
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
              setVideoDetails={setVideoDetails}
            />

            <div className="panel-card-glass quick-summary-card">
              <h3>Release summary</h3>
              <div className="summary-list">
                <div><span>Title</span><strong>{formData.title || "Not set"}</strong></div>
                <div><span>Type</span><strong>{activeTab === "MOVIE" ? "Movie" : "TV Episode"}</strong></div>
                <div><span>Genres</span><strong>{categories.length || 0}</strong></div>
                <div><span>Artwork</span><strong>{imageAssets.length || 0}</strong></div>
                <div><span>Trailers</span><strong>{trailerTracks.length || 0}</strong></div>
                <div><span>Video</span><strong className={uploadedVideoUrl ? "summary-ready" : ""}>{uploadedVideoUrl ? "Ready" : "Optional"}</strong></div>
                <div><span>Cast</span><strong>{cast.length || 0}</strong></div>
              </div>
              <button type="button" className="btn-secondary reset-upload-button" onClick={resetForm} disabled={saving}>
                Clear form
              </button>
              <div className="save-reminder"><Loader2 size={14} /> Save only after reviewing the title and media above.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

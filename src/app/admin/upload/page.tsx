"use client";

import React, { useState, useEffect } from "react";
import HeaderTabs from "./components/HeaderTabs";
import TmdbSearch from "./components/TmdbSearch";
import TitleInformationForm from "./components/TitleInformationForm";
import TvSeasonEpisodeForm from "./components/TvSeasonEpisodeForm";
import GraphicAssetsUploader from "./components/GraphicAssetsUploader";
import TrailerUploader from "./components/TrailerUploader";
import MainVideoUploader from "./components/MainVideoUploader";
import { Check, ChevronLeft, ChevronRight, Film, Image as ImageIcon, PlayCircle, UploadCloud, Star, Loader2 } from "lucide-react";

// Wizard step definitions
const STEPS = [
  { id: 1, label: "Search & Select", icon: Film },
  { id: 2, label: "Title Details", icon: Star },
  { id: 3, label: "Images", icon: ImageIcon },
  { id: 4, label: "Trailers", icon: PlayCircle },
  { id: 5, label: "Main Video", icon: UploadCloud },
  { id: 6, label: "Review & Publish", icon: Check },
];

export default function AdminUploadPanel() {
  const [activeTab, setActiveTab] = useState<"MOVIE" | "SHOW">("MOVIE");
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [maturityOptions, setMaturityOptions] = useState<any[]>([]);

  // State to hold metadata of an existing show selected from DB
  const [selectedShowMeta, setSelectedShowMeta] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/metadata/ratings")
      .then((res) => res.json())
      .then((data) => setMaturityOptions(data))
      .catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    title: "", slug: "", description: "", storyline: "", 
    releaseYear: "2026", maturityRatingCode: "TV-MA", 
    tmdbId: "", keywords: [] as string[],
  });

  // Featured content controls
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(0);

  const [categories, setCategories] = useState<string[]>([]);
  const [imageAssets, setImageAssets] = useState<Array<{ url: string; type: "POSTER" | "BACKDROP"; displayOrder: number }>>([]);
  const [trailerTracks, setTrailerTracks] = useState<Array<{ title: string; hlsManifestUrl: string }>>([]);
  
  const [isExistingShow, setIsExistingShow] = useState(false);
  const [selectedExistingShowId, setSelectedExistingShowId] = useState("");
  const [showConfig, setShowConfig] = useState({
    seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "",
  });

  const [mainVideoFile, setMainVideoFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  const resetForm = () => {
    setFormData({
      title: "", slug: "", description: "", storyline: "", 
      releaseYear: "2026", maturityRatingCode: "TV-MA", 
      tmdbId: "", keywords: [],
    });
    setCategories([]); 
    setImageAssets([]); 
    setTrailerTracks([]);
    setMainVideoFile(null); 
    setUploadedVideoUrl("");
    setIsExistingShow(false);
    setSelectedExistingShowId("");
    setSelectedShowMeta(null);
    setShowConfig({
      seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "",
    });
    setIsFeatured(false);
    setFeaturedOrder(0);
    setCurrentStep(1);
  };

  const commitCompleteAssetToDb = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        type: activeTab,
        categories,
        images: imageAssets,
        trailers: trailerTracks,
        movieVideoUrl: activeTab === "MOVIE" ? uploadedVideoUrl : undefined,
        movieDuration: activeTab === "MOVIE" ? "7200" : undefined,
        ...showConfig,
        episodeVideoUrl: activeTab === "SHOW" ? uploadedVideoUrl : undefined,
        episodeDuration: activeTab === "SHOW" ? "2700" : undefined,
        isExistingShow,
        existingShowId: selectedExistingShowId,
        isFeatured,
        featuredOrder,
      };

      const saveRes = await fetch("/api/admin/media/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await saveRes.json();
      if (!saveRes.ok) throw new Error(resData.error || "Failed to save");

      alert("Content added to library successfully!");
      resetForm();
    } catch (err: any) {
      alert(`Could not save title: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Validation per step
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Must have a title selected (from TMDB or manual)
        return formData.title !== "" || (activeTab === "SHOW" && isExistingShow && selectedExistingShowId !== "");
      case 2:
        return formData.title !== "" && formData.slug !== "";
      case 3:
        return true; // Images are optional
      case 4:
        return true; // Trailers are optional
      case 5:
        return uploadedVideoUrl !== ""; // Must have main video uploaded
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!canProceedFromStep(currentStep)) {
      alert("Please complete the required fields for this step before continuing.");
      return;
    }
    setCurrentStep(Math.min(currentStep + 1, STEPS.length));
  };

  const goBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const goToStep = (step: number) => {
    // Only allow going back to previous steps freely
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    // For forward navigation, validate each intermediate step
    for (let s = currentStep; s < step; s++) {
      if (!canProceedFromStep(s)) {
        alert(`Please complete Step ${s} (${STEPS[s-1].label}) first.`);
        return;
      }
    }
    setCurrentStep(step);
  };

  return (
    <div className="workspace-container">
      <div className="layout-max-wrapper">
        <HeaderTabs activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); resetForm(); }} />

        {/* Wizard Progress Bar */}
        <div className="wizard-progress-container">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isComplete = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <div className={`wizard-connector ${isComplete ? "complete" : ""}`} />}
                <button
                  className={`wizard-step-btn ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
                  onClick={() => goToStep(step.id)}
                  disabled={saving}
                >
                  <span className="wizard-step-icon">
                    {isComplete ? <Check size={14} /> : <StepIcon size={14} />}
                  </span>
                  <span className="wizard-step-label">{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="wizard-step-content">
          {/* STEP 1: TMDB Search & Select */}
          {currentStep === 1 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 1: Search & Select Content</h2>
                <p>Search TMDB to auto-fill metadata, or enter details manually in the next step.</p>
              </div>
              {(!isExistingShow || activeTab === "MOVIE") && (
                <TmdbSearch 
                  activeTab={activeTab}
                  setFormData={setFormData}
                  setCategories={setCategories}
                  setImageAssets={setImageAssets}
                  setTrailerTracks={setTrailerTracks}
                />
              )}
              {activeTab === "SHOW" && (
                <TvSeasonEpisodeForm
                  showConfig={showConfig}
                  setShowConfig={setShowConfig}
                  isExistingShow={isExistingShow}
                  selectedExistingShowId={selectedExistingShowId}
                  setSelectedExistingShowId={setSelectedExistingShowId}
                  setSelectedShowMeta={setSelectedShowMeta}
                  parentTmdbId={isExistingShow ? selectedShowMeta?.tmdbId : formData.tmdbId}
                  setIsExistingShow={(val: boolean) => {
                    setIsExistingShow(val);
                    if (!val) {
                      setSelectedShowMeta(null);
                      setSelectedExistingShowId("");
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* STEP 2: Title Details */}
          {currentStep === 2 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 2: Title Information</h2>
                <p>Review and edit the title metadata, categories, and featured settings.</p>
              </div>
              {(!isExistingShow || activeTab === "MOVIE") && (
                <TitleInformationForm
                  formData={formData}
                  setFormData={setFormData}
                  categories={categories}
                  setCategories={setCategories}
                  maturityOptions={maturityOptions}
                />
              )}

              {/* Featured Content Controls */}
              <div className="panel-card-glass">
                <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
                  <span className="step-number-badge">★</span> Featured Content
                </h2>
                <div className="panel-grid-inner">
                  <div>
                    <div className="input-group-wrapper">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          style={{ width: "16px", height: "16px" }}
                        />
                        Mark as Featured
                      </label>
                      <p className="input-help-tip">Featured content appears in the hero billboard and featured rows on the homepage.</p>
                    </div>
                  </div>
                  {isFeatured && (
                    <div>
                      <div className="input-group-wrapper">
                        <label>Featured Order</label>
                        <input
                          type="number"
                          value={featuredOrder}
                          onChange={(e) => setFeaturedOrder(Number(e.target.value))}
                          placeholder="0"
                          className="input-text-field"
                        />
                        <p className="input-help-tip">Lower numbers appear first. 0 is the highest priority.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Graphic Assets */}
          {currentStep === 3 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 3: Poster & Backdrop Images</h2>
                <p>Upload poster and backdrop images. These will be used across the app for cards and hero banners.</p>
              </div>
              <GraphicAssetsUploader imageAssets={imageAssets} setImageAssets={setImageAssets} />
            </div>
          )}

          {/* STEP 4: Trailers */}
          {currentStep === 4 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 4: Trailers & Promotional Tracks</h2>
                <p>Upload trailer videos or add YouTube links for promotional content.</p>
              </div>
              <TrailerUploader trailerTracks={trailerTracks} setTrailerTracks={setTrailerTracks} />
            </div>
          )}

          {/* STEP 5: Main Video */}
          {currentStep === 5 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 5: Main Video Media</h2>
                <p>Upload the main video file for this {activeTab === "MOVIE" ? "movie" : "episode"}. This is the final required step.</p>
              </div>
              <MainVideoUploader
                mainVideoFile={mainVideoFile}
                setMainVideoFile={setMainVideoFile}
                uploadedVideoUrl={uploadedVideoUrl}
                setUploadedVideoUrl={setUploadedVideoUrl}
                commitCompleteAssetToDb={commitCompleteAssetToDb}
                saving={saving}
                isFormValid={ (isExistingShow ? selectedExistingShowId !== "" : formData.title !== "") && uploadedVideoUrl !== "" }
              />
            </div>
          )}

          {/* STEP 6: Review & Publish */}
          {currentStep === 6 && (
            <div className="wizard-step-panel">
              <div className="wizard-step-header">
                <h2>Step 6: Review & Publish</h2>
                <p>Review all the information before publishing to the catalog.</p>
              </div>
              <div className="panel-card-glass">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>Content Summary</h3>
                <div className="review-summary-grid">
                  <div className="review-item">
                    <span className="review-label">Type</span>
                    <span className="review-value">{activeTab}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Title</span>
                    <span className="review-value">{formData.title || "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Slug</span>
                    <span className="review-value">{formData.slug || "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Release Year</span>
                    <span className="review-value">{formData.releaseYear || "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Maturity Rating</span>
                    <span className="review-value">{formData.maturityRatingCode || "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">TMDB ID</span>
                    <span className="review-value">{formData.tmdbId || "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Categories</span>
                    <span className="review-value">{categories.length > 0 ? categories.join(", ") : "—"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Featured</span>
                    <span className="review-value">{isFeatured ? `Yes (Order: ${featuredOrder})` : "No"}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Poster Images</span>
                    <span className="review-value">{imageAssets.filter(i => i.type === "POSTER").length} uploaded</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Backdrop Images</span>
                    <span className="review-value">{imageAssets.filter(i => i.type === "BACKDROP").length} uploaded</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Trailers</span>
                    <span className="review-value">{trailerTracks.length} linked</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Main Video</span>
                    <span className="review-value">{uploadedVideoUrl ? "Uploaded ✓" : "Missing!"}</span>
                  </div>
                  {activeTab === "SHOW" && (
                    <>
                      <div className="review-item">
                        <span className="review-label">Season</span>
                        <span className="review-value">{showConfig.seasonNumber}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Episode</span>
                        <span className="review-value">{showConfig.episodeNumber} - {showConfig.episodeTitle || "Untitled"}</span>
                      </div>
                    </>
                  )}
                </div>

                {!uploadedVideoUrl && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                    ⚠️ Main video is not uploaded yet. Go back to Step 5 to upload the video file.
                  </div>
                )}

                <button 
                  onClick={commitCompleteAssetToDb} 
                  disabled={saving || !uploadedVideoUrl}
                  className="btn-execution-commit"
                  style={{ marginTop: "1.5rem", width: "100%" }}
                >
                  {saving ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : "Publish to Catalog"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="wizard-nav-buttons">
          {currentStep > 1 && (
            <button onClick={goBack} className="btn-secondary" disabled={saving}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {currentStep < STEPS.length && (
            <button onClick={goNext} className="btn-primary" disabled={saving}>
              Continue <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
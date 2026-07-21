"use client";

import React, { useState, useEffect } from "react";
import HeaderTabs from "./components/HeaderTabs";
import TmdbSearch from "./components/TmdbSearch";
import TitleInformationForm from "./components/TitleInformationForm";
import TvSeasonEpisodeForm from "./components/TvSeasonEpisodeForm";
import GraphicAssetsUploader from "./components/GraphicAssetsUploader";
import TrailerUploader from "./components/TrailerUploader";
import MainVideoUploader from "./components/MainVideoUploader";

export default function AdminUploadPanel() {
  const [activeTab, setActiveTab] = useState<"MOVIE" | "SHOW">("MOVIE");
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
    setSelectedShowMeta(null); // Reset meta
    setShowConfig({
      seasonNumber: "1", episodeNumber: "1", episodeTitle: "", episodeDescription: "",
    });
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

  return (
    <div className="workspace-container">
      <div className="layout-max-wrapper">
        <HeaderTabs activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); resetForm(); }} />

        {(!isExistingShow || activeTab === "MOVIE") && (
          <TmdbSearch 
            activeTab={activeTab}
            setFormData={setFormData}
            setCategories={setCategories}
            setImageAssets={setImageAssets}
            setTrailerTracks={setTrailerTracks}
          />
        )}

        <div className="split-grid-layout">
          <div>
            {activeTab === "SHOW" && (
              <TvSeasonEpisodeForm
                showConfig={showConfig}
                setShowConfig={setShowConfig}
                isExistingShow={isExistingShow}
                selectedExistingShowId={selectedExistingShowId}
                setSelectedExistingShowId={setSelectedExistingShowId}
                setSelectedShowMeta={setSelectedShowMeta}
                parentTmdbId={isExistingShow ? selectedShowMeta?.tmdbId : formData.tmdbId}
                // Ensure we clear selected meta when switching to "New Show"
                setIsExistingShow={(val: boolean) => {
                  setIsExistingShow(val);
                  if (!val) {
                    setSelectedShowMeta(null);
                    setSelectedExistingShowId("");
                  }
                }}/>
            )}

            {(!isExistingShow || activeTab === "MOVIE") && (
              <TitleInformationForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                setCategories={setCategories}
                maturityOptions={maturityOptions}
              />
            )}

            <GraphicAssetsUploader imageAssets={imageAssets} setImageAssets={setImageAssets} />
            <TrailerUploader trailerTracks={trailerTracks} setTrailerTracks={setTrailerTracks} />
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
      </div>
    </div>
  );
}
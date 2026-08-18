"use client";

import React from "react";
import { Video, Clock, Film } from "lucide-react";

export default function VideoDetailsForm({ videoDetails, setVideoDetails }: any) {
  const inputStyle = { fontFamily: "inherit" as const };

  const updateField = (field: string, value: any) => {
    setVideoDetails({ ...videoDetails, [field]: value });
  };

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Video size={12} /></span> Video Details & Source
      </h2>

      <div className="panel-grid-inner">
        <div>
          <div className="input-group-wrapper">
            <label><Clock style={{ width: "0.85rem", height: "0.85rem" }} /> Duration (seconds)</label>
            <input type="number" value={videoDetails.durationSeconds || ""} onChange={(e) => updateField("durationSeconds", e.target.value)} placeholder="e.g. 7200" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Resolution</label>
            <select value={videoDetails.resolution || "P1080"} onChange={(e) => updateField("resolution", e.target.value)} className="input-text-field">
              <option value="P240">240p</option>
              <option value="P360">360p</option>
              <option value="P480">480p</option>
              <option value="P720">720p</option>
              <option value="P1080">1080p</option>
              <option value="UHD_4K">4K UHD</option>
              <option value="UHD_8K">8K UHD</option>
            </select>
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Video Codec</label>
            <input type="text" value={videoDetails.codec || "h264"} onChange={(e) => updateField("codec", e.target.value)} placeholder="h264" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Audio Codec</label>
            <input type="text" value={videoDetails.audioCodec || "aac"} onChange={(e) => updateField("audioCodec", e.target.value)} placeholder="aac" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>FPS</label>
            <input type="number" step="0.1" value={videoDetails.fps || "24"} onChange={(e) => updateField("fps", e.target.value)} placeholder="24" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>HDR Format</label>
            <select value={videoDetails.hdr || "SDR"} onChange={(e) => updateField("hdr", e.target.value)} className="input-text-field">
              <option value="SDR">SDR</option>
              <option value="HDR10">HDR10</option>
              <option value="DOLBY_VISION">Dolby Vision</option>
              <option value="HLG">HLG</option>
            </select>
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Aspect Ratio</label>
            <input type="text" value={videoDetails.aspectRatio || "16:9"} onChange={(e) => updateField("aspectRatio", e.target.value)} placeholder="16:9" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Bitrate (kbps)</label>
            <input type="number" value={videoDetails.bitrate || ""} onChange={(e) => updateField("bitrate", e.target.value)} placeholder="e.g. 5000" className="input-text-field" style={inputStyle} />
          </div>
        </div>

        <div className="grid-col-full">
          <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0.5rem 0 0.75rem 0" }}>
            <Film size={12} style={{ marginRight: "0.25rem" }} /> Intro / Credits / Recap Markers (seconds)
          </h3>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Intro Start</label>
            <input type="number" value={videoDetails.introStart || "0"} onChange={(e) => updateField("introStart", e.target.value)} placeholder="0" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Intro End</label>
            <input type="number" value={videoDetails.introEnd || "0"} onChange={(e) => updateField("introEnd", e.target.value)} placeholder="0" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Credits Start</label>
            <input type="number" value={videoDetails.creditsStart || ""} onChange={(e) => updateField("creditsStart", e.target.value)} placeholder="e.g. 6900" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Credits End</label>
            <input type="number" value={videoDetails.creditsEnd || ""} onChange={(e) => updateField("creditsEnd", e.target.value)} placeholder="e.g. 7200" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Recap Start</label>
            <input type="number" value={videoDetails.recapStart || "0"} onChange={(e) => updateField("recapStart", e.target.value)} placeholder="0" className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Recap End</label>
            <input type="number" value={videoDetails.recapEnd || "0"} onChange={(e) => updateField("recapEnd", e.target.value)} placeholder="0" className="input-text-field" style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
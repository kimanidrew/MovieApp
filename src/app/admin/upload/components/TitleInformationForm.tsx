"use client";

import React, { useState, useEffect } from "react";
import { FileText, Tag, Plus, X, Globe, Clock, Link2, Hash } from "lucide-react";

export default function TitleInformationForm({ formData, setFormData, categories, setCategories, maturityOptions }: any) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [existingCategories, setExistingCategories] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    // Fetch existing categories from DB
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setExistingCategories(data); })
      .catch(console.error);

    // Fetch languages
    fetch("/api/admin/languages")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLanguages(data); })
      .catch(console.error);
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategoryInput("");
    }
  };

  const handleToggleExistingCategory = (catName: string) => {
    if (categories.includes(catName)) {
      setCategories(categories.filter((c: string) => c !== catName));
    } else {
      setCategories([...categories, catName]);
    }
  };

  const updateSpokenLanguage = (iso: string, checked: boolean) => {
    const current = formData.spokenLanguages || [];
    if (checked) {
      if (!current.includes(iso)) setFormData({ ...formData, spokenLanguages: [...current, iso] });
    } else {
      setFormData({ ...formData, spokenLanguages: current.filter((l: string) => l !== iso) });
    }
  };

  const inputStyle = { fontFamily: "inherit" as const };

  return (
    <div className={`panel-card-glass ${formData.title ? "active-step" : ""}`}>
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge">2</span> Title Information
      </h2>
      <div className="panel-grid-inner">
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label><FileText style={{ width: "0.85rem", height: "0.85rem" }} /> Display Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. My Beautiful Film" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>URL Slug</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="my-beautiful-film" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label><Hash style={{ width: "0.85rem", height: "0.85rem" }} /> TMDB ID</label>
            <input type="text" value={formData.tmdbId} onChange={(e) => setFormData({ ...formData, tmdbId: e.target.value })} placeholder="Internal tracking ID" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Release Year</label>
            <input type="text" value={formData.releaseYear} onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })} className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Runtime (minutes)</label>
            <input type="text" value={formData.runtime} onChange={(e) => setFormData({ ...formData, runtime: e.target.value })} placeholder="e.g. 120" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label><Clock style={{ width: "0.85rem", height: "0.85rem" }} /> Maturity Rating</label>
            <select value={formData.maturityRatingCode} onChange={(e) => setFormData({ ...formData, maturityRatingCode: e.target.value })} className="input-text-field">
              <option value="">Select Maturity Rating...</option>
              {Array.isArray(maturityOptions) && maturityOptions.map((rating: any) => (
                <option key={rating.id} value={rating.code}>{rating.code} - {rating.description}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label><Globe style={{ width: "0.85rem", height: "0.85rem" }} /> Original Language</label>
            <select value={formData.originalLanguage || "en"} onChange={(e) => setFormData({ ...formData, originalLanguage: e.target.value })} className="input-text-field">
              <option value="">Select Language...</option>
              {languages.map((lang: any) => (
                <option key={lang.id} value={lang.iso6391}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label><Link2 style={{ width: "0.85rem", height: "0.85rem" }} /> IMDb ID</label>
            <input type="text" value={formData.imdbId} onChange={(e) => setFormData({ ...formData, imdbId: e.target.value })} placeholder="e.g. tt1234567" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-text-field">
              <option value="">Select Status...</option>
              <option value="Released">Released</option>
              <option value="In Production">In Production</option>
              <option value="Planned">Planned</option>
              <option value="Post Production">Post Production</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        </div>

        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Homepage URL</label>
            <input type="text" value={formData.homepage} onChange={(e) => setFormData({ ...formData, homepage: e.target.value })} placeholder="https://..." className="input-text-field" />
          </div>
        </div>

        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Spoken Languages (subtitle/audio languages)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
              {languages.slice(0, 20).map((lang: any) => (
                <label key={lang.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#a1a1aa", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={(formData.spokenLanguages || []).includes(lang.iso6391)}
                    onChange={(e) => updateSpokenLanguage(lang.iso6391, e.target.checked)}
                    style={{ width: "14px", height: "14px" }}
                  />
                  {lang.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label><Tag style={{ width: "0.85rem", height: "0.85rem" }} /> Catalog Categories / Genres</label>
            <div className="category-input-container">
              <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }} placeholder="Type new category and press Enter..." className="input-text-field" />
              <button type="button" onClick={handleAddCategory} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
            </div>

            {existingCategories.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <p style={{ fontSize: "0.7rem", color: "#71717a", margin: "0 0 0.35rem 0" }}>Or select existing categories:</p>
                <div className="badge-pills-wrap">
                  {existingCategories.map((cat: any) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleExistingCategory(cat.name)}
                      className={`category-badge-pill ${categories.includes(cat.name) ? "state-active" : ""}`}
                      style={{
                        background: categories.includes(cat.name) ? "#e11d48" : "transparent",
                        color: categories.includes(cat.name) ? "#ffffff" : "#fafafa",
                        border: categories.includes(cat.name) ? "1px solid #e11d48" : "1px solid #3f3f46",
                        cursor: "pointer"
                      }}
                    >
                      {categories.includes(cat.name) ? <CheckMark /> : <PlusIcon />} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categories?.length > 0 && (
              <div className="badge-pills-wrap">
                {categories.map((cat: string, i: number) => (
                  <span key={i} className="category-badge-pill">
                    {cat} <button type="button" onClick={() => setCategories(categories.filter((c: string) => c !== cat))} className="btn-badge-remove"><X style={{ width: "0.65rem", height: "0.65rem" }} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Short Description</label>
            <textarea value={formData.description} rows={2} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-text-field" style={inputStyle} />
          </div>
        </div>
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Tagline / Extended Storyline</label>
            <textarea value={formData.storyline} rows={3} onChange={(e) => setFormData({ ...formData, storyline: e.target.value })} className="input-textbox-field" style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckMark() {
  return <span style={{ display: "inline-flex", width: "12px", height: "12px" }}>✓</span>;
}

function PlusIcon() {
  return <span style={{ display: "inline-flex", width: "12px", height: "12px" }}>{"+"}</span>;
}

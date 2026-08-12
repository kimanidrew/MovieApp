import React, { useState } from "react";
import { FileText, Tag, Plus, X } from "lucide-react";

export default function TitleInformationForm({ formData, setFormData, categories, setCategories, maturityOptions }: any) {
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategoryInput("");
    }
  };

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
            <label>TMDB ID</label>
            <input type="text" value={formData.tmdbId} onChange={(e) => setFormData({ ...formData, tmdbId: e.target.value })} placeholder="Internal tracking ID" className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Release Year</label>
            <input type="text" value={formData.releaseYear} onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })} className="input-text-field" />
          </div>
        </div>
        <div className="input-group-wrapper">
          <label>Maturity Rating</label>
          <select value={formData.maturityRatingCode} onChange={(e) => setFormData({ ...formData, maturityRatingCode: e.target.value })} className="input-text-field">
            <option value="">Select Maturity Rating...</option>
            {Array.isArray(maturityOptions) && maturityOptions.map((rating: any) => (
              <option key={rating.id} value={rating.code}>{rating.code} - {rating.description}</option>
            ))}
          </select>
        </div>

        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label><Tag style={{ width: "0.85rem", height: "0.85rem" }} /> Catalog Categories / Genres</label>
            <div className="category-input-container">
              <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }} placeholder="Type category and press Enter..." className="input-text-field" />
              <button type="button" onClick={handleAddCategory} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
            </div>
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
            <textarea value={formData.description} rows={2} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-text-field" style={{ fontFamily: "inherit" }} />
          </div>
        </div>
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Tagline / Extended Storyline</label>
            <textarea value={formData.storyline} rows={3} onChange={(e) => setFormData({ ...formData, storyline: e.target.value })} className="input-textbox-field" style={{ fontFamily: "inherit" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
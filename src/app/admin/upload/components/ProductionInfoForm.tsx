"use client";

import React, { useState, useEffect } from "react";
import { Building2, Globe2, Plus, X, Trophy } from "lucide-react";

export default function ProductionInfoForm({ productionInfo, setProductionInfo }: any) {
  const [countries, setCountries] = useState<any[]>([]);
  const [newCountry, setNewCountry] = useState("");
  const [newStudio, setNewStudio] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    // Fetch all countries
    fetch("/api/admin/countries")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCountries(data); })
      .catch(console.error);
  }, []);

  const addCountry = (code: string) => {
    const current = productionInfo.countries || [];
    if (!current.includes(code)) {
      setProductionInfo({ ...productionInfo, countries: [...current, code] });
    }
  };

  const removeCountry = (code: string) => {
    setProductionInfo({ ...productionInfo, countries: (productionInfo.countries || []).filter((c: string) => c !== code) });
  };

  const addStudio = () => {
    if (!newStudio.trim()) return;
    setProductionInfo({ ...productionInfo, studios: [...(productionInfo.studios || []), newStudio.trim()] });
    setNewStudio("");
  };

  const addCompany = () => {
    if (!newCompany.trim()) return;
    setProductionInfo({ ...productionInfo, productionCompanies: [...(productionInfo.productionCompanies || []), newCompany.trim()] });
    setNewCompany("");
  };

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Building2 size={12} /></span> Studios, Production Companies & Countries
      </h2>

      <div className="panel-grid-inner">
        {/* Countries */}
        <div>
          <div className="input-group-wrapper">
            <label><Globe2 style={{ width: "0.85rem", height: "0.85rem" }} /> Countries of Origin</label>
            <select
              value={newCountry}
              onChange={(e) => { addCountry(e.target.value); setNewCountry(""); }}
              className="input-text-field"
            >
              <option value="">Select country...</option>
              {countries.map((c: any) => (
                <option key={c.isoAlpha2} value={c.isoAlpha2}>{c.name}</option>
              ))}
            </select>
            {productionInfo.countries?.length > 0 && (
              <div className="badge-pills-wrap">
                {productionInfo.countries.map((code: string) => (
                  <span key={code} className="category-badge-pill">
                    {code} <button type="button" onClick={() => removeCountry(code)} className="btn-badge-remove"><X style={{ width: "0.65rem", height: "0.65rem" }} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Studios */}
        <div>
          <div className="input-group-wrapper">
            <label>Studios</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" value={newStudio} onChange={(e) => setNewStudio(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStudio(); } }} placeholder="e.g. Warner Bros" className="input-text-field" />
              <button type="button" onClick={addStudio} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
            </div>
            {productionInfo.studios?.length > 0 && (
              <div className="badge-pills-wrap">
                {productionInfo.studios.map((s: string, i: number) => (
                  <span key={i} className="category-badge-pill">
                    {s} <button type="button" onClick={() => setProductionInfo({ ...productionInfo, studios: productionInfo.studios.filter((_: string, idx: number) => idx !== i) })} className="btn-badge-remove"><X style={{ width: "0.65rem", height: "0.65rem" }} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Production Companies */}
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Production Companies</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompany(); } }} placeholder="e.g. Marvel Studios" className="input-text-field" />
              <button type="button" onClick={addCompany} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
            </div>
            {productionInfo.productionCompanies?.length > 0 && (
              <div className="badge-pills-wrap">
                {productionInfo.productionCompanies.map((s: string, i: number) => (
                  <span key={i} className="category-badge-pill">
                    {s} <button type="button" onClick={() => setProductionInfo({ ...productionInfo, productionCompanies: productionInfo.productionCompanies.filter((_: string, idx: number) => idx !== i) })} className="btn-badge-remove"><X style={{ width: "0.65rem", height: "0.65rem" }} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
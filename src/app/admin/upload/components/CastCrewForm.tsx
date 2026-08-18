"use client";

import React, { useState } from "react";
import { Users, Plus, X, Briefcase } from "lucide-react";

interface CastMember {
  name: string;
  character: string;
  displayOrder: number;
}

interface CrewMember {
  name: string;
  job: string;
  department: string;
}

export default function CastCrewForm({ cast, setCast, crew, setCrew }: any) {
  const [newCastName, setNewCastName] = useState("");
  const [newCastCharacter, setNewCastCharacter] = useState("");
  const [newCrewName, setNewCrewName] = useState("");
  const [newCrewJob, setNewCrewJob] = useState("");
  const [newCrewDept, setNewCrewDept] = useState("");

  const handleAddCast = () => {
    if (!newCastName.trim()) return;
    setCast([...cast, { name: newCastName.trim(), character: newCastCharacter.trim(), displayOrder: cast.length }]);
    setNewCastName("");
    setNewCastCharacter("");
  };

  const handleAddCrew = () => {
    if (!newCrewName.trim()) return;
    setCrew([...crew, { name: newCrewName.trim(), job: newCrewJob.trim() || "Actor", department: newCrewDept.trim() || "Acting" }]);
    setNewCrewName("");
    setNewCrewJob("");
    setNewCrewDept("");
  };

  const inputStyle = { fontFamily: "inherit" as const };

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Users size={12} /></span> Cast & Crew
      </h2>

      <div className="panel-grid-inner">
        {/* Cast Section */}
        <div className="grid-col-full">
          <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.75rem 0" }}>Cast Members</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem" }}>
            <input type="text" value={newCastName} onChange={(e) => setNewCastName(e.target.value)} placeholder="Actor name" className="input-text-field" style={inputStyle} />
            <input type="text" value={newCastCharacter} onChange={(e) => setNewCastCharacter(e.target.value)} placeholder="Character name" className="input-text-field" style={inputStyle} />
            <button type="button" onClick={handleAddCast} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
          </div>

          {cast.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
              {cast.map((c: CastMember, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                    <Users size={14} style={{ color: "#a1a1aa", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "#71717a" }}>as {c.character}</span>
                  </div>
                  <button type="button" onClick={() => setCast(cast.filter((_: any, idx: number) => idx !== i))} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crew Section */}
        <div className="grid-col-full">
          <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "1rem 0 0.75rem 0" }}>Crew Members</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem" }}>
            <input type="text" value={newCrewName} onChange={(e) => setNewCrewName(e.target.value)} placeholder="Crew name" className="input-text-field" style={inputStyle} />
            <input type="text" value={newCrewJob} onChange={(e) => setNewCrewJob(e.target.value)} placeholder="Job (e.g. Director)" className="input-text-field" style={inputStyle} />
            <input type="text" value={newCrewDept} onChange={(e) => setNewCrewDept(e.target.value)} placeholder="Department (e.g. Directing)" className="input-text-field" style={inputStyle} />
            <button type="button" onClick={handleAddCrew} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
          </div>

          {crew.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
              {crew.map((c: CrewMember, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                    <Briefcase size={14} style={{ color: "#a1a1aa", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{c.job} · {c.department}</span>
                  </div>
                  <button type="button" onClick={() => setCrew(crew.filter((_: any, idx: number) => idx !== i))} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
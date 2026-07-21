import React from "react";
import { Film, Tv } from "lucide-react";

export default function HeaderTabs({ activeTab, setActiveTab }: { activeTab: "MOVIE" | "SHOW", setActiveTab: (t: "MOVIE"|"SHOW") => void }) {
  return (
    <div className="header-bar">
      <div>
        <h1 className="heading-hero-title">Add New Catalog Title</h1>
        <p className="heading-hero-caption">Input assets fully manually, or use smart autocomplete tracking variables.</p>
      </div>
      <div className="toggle-tab-group">
        <button 
          onClick={() => setActiveTab("MOVIE")}
          className={`toggle-tab-item ${activeTab === "MOVIE" ? "state-active" : ""}`}
        >
          <Film style={{ width: "0.875rem", height: "0.875rem" }} /> Movie
        </button>
        <button 
          onClick={() => setActiveTab("SHOW")}
          className={`toggle-tab-item ${activeTab === "SHOW" ? "state-active" : ""}`}
        >
          <Tv style={{ width: "0.875rem", height: "0.875rem" }} /> TV Episode
        </button>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, defaultThemes, ThemeColors } from "@/context/ThemeContext";

export default function ThemePicker() {
  const { activeTheme, colors, setTheme, updateColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleColorChange = (key: keyof ThemeColors, e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor(key, e.target.value);
  };

  return (
    <div className="theme-picker-container" ref={dropdownRef}>
      <button 
        className="theme-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-header">
            <h4>App Theme</h4>
          </div>
          
          <div className="theme-presets">
            {Object.keys(defaultThemes).map((name) => (
              <button 
                key={name} 
                className={`preset-btn ${activeTheme === name ? 'active' : ''}`}
                onClick={() => setTheme(name)}
                style={{ 
                  background: defaultThemes[name].background,
                  borderColor: defaultThemes[name].primaryBrand
                }}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="theme-custom">
            <h5>Custom Colors</h5>
            <div className="color-field">
              <label>Background</label>
              <input 
                type="color" 
                value={colors.background} 
                onChange={(e) => handleColorChange("background", e)} 
              />
            </div>
            <div className="color-field">
              <label>Foreground (Text)</label>
              <input 
                type="color" 
                value={colors.foreground} 
                onChange={(e) => handleColorChange("foreground", e)} 
              />
            </div>
            <div className="color-field">
              <label>Primary Brand</label>
              <input 
                type="color" 
                value={colors.primaryBrand} 
                onChange={(e) => handleColorChange("primaryBrand", e)} 
              />
            </div>
            <div className="color-field">
              <label>Secondary</label>
              <input 
                type="color" 
                value={colors.secondary} 
                onChange={(e) => handleColorChange("secondary", e)} 
              />
            </div>
            <div className="color-field">
              <label>Tertiary</label>
              <input 
                type="color" 
                value={colors.tertiary} 
                onChange={(e) => handleColorChange("tertiary", e)} 
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .theme-picker-container { position: relative; display: flex; align-items: center; }
        .theme-trigger-btn { 
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
          color: white; border-radius: 50%; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .theme-trigger-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
        .theme-dropdown {
          position: absolute; top: 45px; right: 0; 
          background: #141414; border: 1px solid rgba(255, 255, 255, 0.15); 
          border-radius: 12px; width: 280px; padding: 16px; 
          z-index: 1010; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          color: white;
        }
        .theme-header h4 { margin: 0 0 12px 0; font-size: 1.1rem; }
        .theme-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .preset-btn {
          border: 2px solid; padding: 8px; border-radius: 6px; color: white;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          transition: transform 0.2s; opacity: 0.8; text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .preset-btn:hover { opacity: 1; transform: scale(1.02); }
        .preset-btn.active { opacity: 1; box-shadow: 0 0 8px rgba(255,255,255,0.3); }
        .theme-custom h5 { margin: 0 0 10px 0; font-size: 0.95rem; color: #a3a3a3; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; }
        .color-field { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; }
        .color-field input[type="color"] {
          background: transparent; border: none; width: 24px; height: 24px; cursor: pointer; padding: 0;
        }
      `}</style>
    </div>
  );
}

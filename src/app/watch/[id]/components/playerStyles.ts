export const playerStyles = `
/* ==========================================================================
   GLOBAL STRUCTURE & RESET
   ========================================================================== */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #000000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ==========================================================================
   PLAYER CONTAINER VIEWPORT
   ========================================================================== */
.player-wrapper {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  user-select: none;
  -webkit-user-select: none;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000000;
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* ==========================================================================
   HOVER & VISIBILITY STATE MECHANICS
   ========================================================================== */
.controls-hidden .netflix-header {
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(-10px);
}

.controls-hidden .netflix-controls {
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(10px);
}

.controls-visible .netflix-header,
.controls-visible .netflix-controls {
  opacity: 1 !important;
  pointer-events: auto !important;
  transform: translateY(0);
}

/* ==========================================================================
   HEADER ACTIONS BAR
   ========================================================================== */
.netflix-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 140px;
  display: flex;
  align-items: center;
  padding: 0 4%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
  z-index: 70;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
}

.back-button {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), background 0.2s ease, color 0.2s ease;
}

.back-button:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.header-title {
  margin-left: 24px;
  color: #ffffff;
  font-size: 40px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
}

/* ==========================================================================
   FOOTER CONTROLS WRAPPER
   ========================================================================== */
.netflix-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 60px 4% 40px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
  z-index: 60;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
}

/* ==========================================================================
   PROGRESS TIMELINE INFRASTRUCTURE
   ========================================================================== */
.progress-container {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 4px;
  margin-bottom: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: height 0.1s cubic-bezier(0.25, 1, 0.5, 1);
}

.progress-container:hover {
  height: 8px;
}

.buffer-bar {
  position: absolute;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  pointer-events: none;
}

.progress-fill {
  position: absolute;
  left: 0;
  height: 100%;
  background: #e50914;
  border-radius: 4px;
  pointer-events: none;
  z-index: 2;
}

.progress-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 5;
  -webkit-appearance: none;
}

.scrub-circle {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: #e50914;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
  z-index: 4;
  pointer-events: none;
}

.progress-container:hover .scrub-circle {
  transform: translate(-50%, -50%) scale(1);
}

/* ==========================================================================
   BUTTON LAYOUT ROW
   ========================================================================== */
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 28px;
}

.time-display {
  color: #e5e5e5;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.8px;
  margin-left: 4px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

/* ==========================================================================
   BUTTON INTERACTION STYLING
   ========================================================================== */
.control-btn {
  background: none;
  border: none;
  color: #e5e5e5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), color 0.15s ease;
}

.control-btn:hover {
  transform: scale(1.12);
  color: #ffffff;
}

.control-btn svg {
  width: 40px;
  height: 40px;
}

/* ==========================================================================
   VOLUME EXPANSION DYNAMICS (RED FILL FIX)
   ========================================================================== */
.volume-container {
  display: flex;
  align-items: center;
}

.volume-slider {
  width: 0;
  opacity: 0;
  height: 4px;
  margin-left: 0;
  cursor: pointer;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  transition: width 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease, margin-left 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Mozilla Firefox support natively handles tracking fill color */
.volume-slider::-moz-range-progress {
  background-color: #e50914;
  height: 4px;
  border-radius: 2px;
}

.volume-slider::-moz-range-track {
  background-color: rgba(255, 255, 255, 0.2);
  height: 4px;
  border-radius: 2px;
}

.volume-slider::-webkit-slider-runnable-track {
  height: 4px;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e50914;
  margin-top: -5px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  transition: transform 0.1s ease;
}

.volume-slider:active::-webkit-slider-thumb {
  transform: scale(1.2);
}

.volume-container:hover .volume-slider {
  width: 100px;
  opacity: 1;
  margin-left: 14px;
}

/* ==========================================================================
   PREMIUM STREAMING QUALITY OPTIONS POPUP
   ========================================================================== */
.custom-quality-container {
  position: relative;
}

.quality-trigger {
  background: rgba(20, 20, 20, 0.65);
  border: 0px solid rgba(255, 255, 255, 0.3);
  color: #e5e5e5;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.quality-trigger:hover {
  background: rgba(40, 40, 40, 0.85);
  border-color: #ffffff;
  color: #ffffff;
}

.quality-menu {
  position: absolute;
  bottom: 150%;
  right: 0;
  width: 160px;
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  z-index: 100;
  animation: menuFadeIn 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes menuFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.quality-menu button {
  background: none;
  border: none;
  padding: 11px 18px;
  color: rgba(255, 255, 255, 0.65);
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s, color 0.15s;
}

.quality-menu button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.quality-menu button.active {
  color: #e50914;
  font-weight: 700;
  background: rgba(229, 9, 20, 0.08);
}

/* ==========================================================================
   GESTURE RIPPLE FEEDBACK SYSTEM
   ========================================================================== */
.action-ripple-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 85;
}

.alignment-play, .alignment-pause {
  justify-content: center;
}

.alignment-rewind {
  justify-content: flex-start;
  padding-left: 15%;
}

.alignment-forward {
  justify-content: flex-end;
  padding-right: 15%;
}

.ripple-icon-circle {
  background: rgba(0, 0, 0, 0.75);
  border-radius: 50%;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: rippleEffect 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.ripple-icon-circle svg {
  width: 52px;
  height: 52px;
}

.ripple-transparent-icon-circle {
  background: transparent;
  border-radius: 50%;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rippleEffect 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.ripple-transparent-icon-circle svg {
  width: 52px;
  height: 52px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}

@keyframes rippleEffect {
  0% { transform: scale(0.6); opacity: 0; }
  30% { transform: scale(1.08); opacity: 0.95; }
  100% { transform: scale(1.25); opacity: 0; }
}
`;

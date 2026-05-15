"use client";

interface Props {
  isBuffering: boolean;
  showSkipButton: boolean;
  handleSkipIntro: () => void;
  resumeTime: number | null;
  formatTime: (time: number) => string;
  restoreVideo: () => void;
  closeResume: () => void;
}

export default function PlayerOverlays({
  isBuffering,
  showSkipButton,
  handleSkipIntro,
  resumeTime,
  formatTime,
  restoreVideo,
  closeResume
}: Props) {
  return (
    <>
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {resumeTime && (
        <div className="resume-toast">
          <button onClick={restoreVideo}>
            Resume from {formatTime(resumeTime)}
          </button>

          <button onClick={closeResume}>
            ✕
          </button>
        </div>
      )}

      {showSkipButton && (
        <div className="skip-intro-container">
          <button
            className="skip-btn"
            onClick={handleSkipIntro}
          >
            Skip Intro
          </button>
        </div>
      )}
    </>
  );
}
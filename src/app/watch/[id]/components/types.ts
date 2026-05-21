export interface QualityLevel {
  id: number;
  height: number;
}

export interface GestureUI {
  type: "volume" | "brightness" | null;
  value: number;
}

export interface SkipAnimation {
  side: "left" | "right" | null;
}

export interface Chapter {
  title: string;
  start: number;
}

export interface HlsPlayerProps {
  videoId: string;

  profileId?: string | null;

  src: string;

  thumbnail?: string;

  chapters?: Chapter[];

  poster?: string;

  title?: string;

  introStart?: number;

  introEnd?: number;

  isProcessing?: boolean;

  autoPlay?: boolean;
}

export interface PlayerControlsProps {
  isPlaying: boolean;

  progress: number;

  duration: number;

  buffered: number;

  volume: number;

  isMuted: boolean;

  qualities: QualityLevel[];

  currentQuality: number;

  autoHeight: number;

  isQualityOpen: boolean;

  isFullscreen: boolean;

  togglePlay: () => void;

  toggleMute: () => void;

  skipTime: (amount: number) => void;

  handleVolumeChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  setSeek: (value: number) => void;

  formatTime: (
    time: number
  ) => string;

  handleQualityChange: (
    id: number
  ) => void;

  setIsQualityOpen: (
    value: boolean
  ) => void;

  toggleFullscreen: () => void;
}

export interface PlayerHeaderProps {
  title: string;

  showControls: boolean;
}

export interface PlayerOverlaysProps {
  isBuffering: boolean;

  showSkipButton: boolean;

  handleSkipIntro: () => void;

  resumeTime: number | null;

  formatTime: (
    time: number
  ) => string;

  restoreVideo: () => void;

  closeResume: () => void;
}
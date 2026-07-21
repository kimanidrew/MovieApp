/**
 * Represents the unified Video metadata structure used across the frontend.
 * This interface bridges the gap between the Prisma Content/Movie/Show models 
 * and the requirements of the VideoPlayer and VideoModal components.
 */

export interface Video {
  // Core Identity
  id: string;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: string;
  
  // Media Assets
  thumbnailUrl: string;
  backdropUrl: string;
  trailerUrl?: string | null;
  
  hlsManifestUrl?: string | null;
  videoUrl?: string | null;
  
  // Taxonomies
  categories: string[];
  
  // Personnel
  cast: {
    name: string;
    character: string;
  }[];

  // Structural Data (Conditional based on Type)
  seasonCount?: number;
  totalEpisodes?: number;
  seasons?: Season[];
  
  // Playback Resources
  videoSources?: {
    url: string;
    quality: string;
  }[];
}

export interface Season {
  id: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  videoUrl: string;
}
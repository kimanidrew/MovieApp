export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  storyline?: string | null;
  releaseYear: number;
  maturityRating: string;
  createdAt: string; // Serialized Date
  latestEpisodeDate?: string | null;
  episodeDates?: string[];
  status?: string;
  thumbnailUrl: string;
  backdropUrl: string;
  trailerUrl?: string | null;
  categories: string[];
  cast: { name: string; character: string; displayOrder: number }[];
  isTvShow: boolean;
  seasonCount?: number;
  seasons?: Season[];
  videoSources?: {
    url: string;
    quality: string;
    codec?: string;
    hdr?: string;
  }[];
}

export interface Season {
  id: string;
  seasonNumber: number;
  title?: string | null;
  slug: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  createdAt: string; // Serialized Date
  videoUrl: string | null;
}
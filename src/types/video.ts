/**
 * Unified Video Type Definition
 * This maps to the Content, Movie/Episode, and related relational models
 * defined in your Prisma schema.
 */

export interface CastMember {
  name: string;
  character: string;
}

export interface Video {
  // Core Content Metadata
  id: string;
  title: string;
  description: string | null;
  releaseYear: number | null;
  
  // Relations
  categories: string[]; // Mapping from ContentCategory
  maturityRating: string; // From MaturityRating model
  cast: CastMember[]; // Mapping from Cast model
  productionCompanies: string[]; // Mapping from ContentProductionCompany
  
  // Playback & Resource Metadata
  // In your schema, Movies/Episodes link to a Video model
  videoUrl?: string | null;      // From VideoSource
  hlsManifestUrl?: string | null; // From VideoSource
  thumbnailUrl?: string | null;   // From ImageAsset
  
  // Additional runtime data
  durationSeconds?: number;
}
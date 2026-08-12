import { Video } from "./video";

export interface HomepageProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  membership?: string | null;
  role?: string | null;
}

export interface HomepageItem extends Video {
  progress?: number;
  duration?: number;
  rating?: number;
  isInMyList?: boolean;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string | null;
  type: string;
  renderStyle: string;
  items: HomepageItem[];
  hasMore?: boolean;
  viewAllHref?: string;
}

export interface HomepageData {
  profile: HomepageProfile;
  featured: HomepageItem | null;
  sections: HomepageSection[];
}
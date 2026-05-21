export interface YoutubeJob {
  id: string;
  status: "queued" | "downloading" | "uploading" | "encoding" | "done" | "failed";
  progress: number;
  error?: string;
}

// Global in-memory thread storage fallback map
const globalJobs = new Map<string, YoutubeJob>();

export const youtubeQueue = {
  get: (id: string) => globalJobs.get(id),
  set: (id: string, job: YoutubeJob) => globalJobs.set(id, job),
  update: (id: string, updates: Partial<YoutubeJob>) => {
    const active = globalJobs.get(id);
    if (active) globalJobs.set(id, { ...active, ...updates });
  }
};

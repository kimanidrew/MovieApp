// @/lib/uploadResume.ts
const PREFIX = "upload_";

// Constants for upload state expiration
const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
const URL_MAX_AGE = 1000 * 60 * 55; // 55 minutes

// Generate a unique upload key based on file attributes (works for multiple files now)
export function getUploadKey(files: File[]) {
  return `${files.map(file => `${file.name}_${file.size}_${file.lastModified}`).join("_")}`;
}

// Save the upload state to localStorage
export function saveUploadState(key: string, data: any) {
  try {
    const payload = {
      ...data,
      timestamp: Date.now(),
      urlsCreatedAt: data.urlsCreatedAt ?? Date.now(),
    };

    // Check if data size is too large for localStorage (arbitrary size check of 5MB)
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > 5000000) {
      console.warn("Upload state is too large to save to localStorage.");
      return;
    }

    localStorage.setItem(PREFIX + key, payloadString);
  } catch (err) {
    console.warn("saveUploadState failed", err);
  }
}

// Load the upload state from localStorage
export function loadUploadState(key: string) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Expire full upload if it's older than MAX_AGE (24 hours)
    if (Date.now() - parsed.timestamp > MAX_AGE) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }

    // Expire URLs if they're older than URL_MAX_AGE (55 minutes)
    const urlsExpired = !parsed.urlsCreatedAt || Date.now() - parsed.urlsCreatedAt > URL_MAX_AGE;
    if (urlsExpired) {
      parsed.urls = null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(PREFIX + key);
    return null;
  }
}

// Clear the upload state from localStorage
export function clearUploadState(key: string) {
  localStorage.removeItem(PREFIX + key);
}
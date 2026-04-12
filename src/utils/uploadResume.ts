const PREFIX = "upload_";

const MAX_AGE = 1000 * 60 * 60 * 24; // 24h
const URL_MAX_AGE = 1000 * 60 * 55; // 55 min

export function getUploadKey(file: File) {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

export function saveUploadState(key: string, data: any) {
  try {
    const payload = {
      ...data,
      timestamp: Date.now(),
      urlsCreatedAt: data.urlsCreatedAt ?? Date.now(),
    };

    localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch (err) {
    console.warn("saveUploadState failed", err);
  }
}

export function loadUploadState(key: string) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // ❌ expire full upload
    if (Date.now() - parsed.timestamp > MAX_AGE) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }

    // ❌ expire URLs
    const urlsExpired =
      !parsed.urlsCreatedAt ||
      Date.now() - parsed.urlsCreatedAt > URL_MAX_AGE;

    if (urlsExpired) {
      parsed.urls = null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(PREFIX + key);
    return null;
  }
}

export function clearUploadState(key: string) {
  localStorage.removeItem(PREFIX + key);
}
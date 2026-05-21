import crypto from "crypto";

const FALLBACK_IMAGE = "https://unsplash.com";

/**
 * Normalizes a URL and appends a Bunny.net secure token if it belongs to your CDN.
 * Ensure BUNNY_SECURITY_KEY is set in your environment variables (.env.local)
 */
export function normalizeUrl(url?: string | null, tokenExpirySeconds: number = 3600): string {
  if (!url) return FALLBACK_IMAGE;

  // 1. Fix common accidental double protocol strings
  let cleanUrl = url;
  if (cleanUrl.startsWith("https://https://")) {
    cleanUrl = cleanUrl.replace("https://https://", "https://");
  } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // 2. Check if the URL belongs to your Bunny.net zone
  if (cleanUrl.includes("vz-0a6dc352-83d.b-cdn.net")) {
    try {
      const urlObj = new URL(cleanUrl);
      const path = urlObj.pathname; // Gets the path e.g., /998ee155-.../thumbnail.jpg
      
      // Pull key safely from environment variables
      const securityKey = process.env.NEXT_PUBLIC_BUNNY_SECURITY_KEY || ""; 
      if (!securityKey) {
        console.warn("Bunny.net security key missing from environment variables.");
        return cleanUrl;
      }

      // Calculate expiration timestamp (Current time + duration in seconds)
      const expires = Math.floor(Date.now() / 1000) + tokenExpirySeconds;

      // Bunny.net Standard Token Authentication format: md5(securityKey + path + expires)
      const tokenInput = securityKey + path + expires;
      const token = crypto.createHash("md5").update(tokenInput).digest("hex");

      // Append token parameters to the clean URL object
      urlObj.searchParams.set("token", token);
      urlObj.searchParams.set("expires", expires.toString());

      return urlObj.toString();
    } catch (error) {
      console.error("Failed to append secure token to Bunny.net URL:", error);
      return cleanUrl;
    }
  }

  return cleanUrl;
}

// src/lib/slug.ts

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");
}

export function uniqueSlug(
  title: string,
  suffix?: string | number,
): string {
  const base = slugify(title);

  if (!suffix) return base;

  return `${base}-${suffix}`;
}
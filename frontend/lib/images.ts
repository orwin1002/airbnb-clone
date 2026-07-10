export const PLACEHOLDER_IMAGE = "/placeholder-listing.svg";

export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.includes("muscache.com")) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

export function resolveImageSrc(url?: string | null): string {
  return isValidImageUrl(url) ? url! : PLACEHOLDER_IMAGE;
}

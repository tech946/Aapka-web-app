/** Parse gallery JSONB / string values into a clean URL array. */
export function normalizePackageGallery(gallery: unknown): string[] {
  if (gallery == null) return [];

  let parsed: unknown = gallery;

  if (typeof gallery === 'string') {
    const trimmed = gallery.trim();
    if (!trimmed || trimmed === 'null' || trimmed === '[]') return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.startsWith('http') ? [trimmed] : [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'url' in item) {
        return String((item as { url: unknown }).url).trim();
      }
      return '';
    })
    .filter(url => url.length > 0 && url !== 'null' && url.startsWith('http'));
}

/** Thumbnail first, then gallery URLs (deduped). Used on the public package page slider. */
export function getPackageDisplayImages(
  gallery: unknown,
  thumbnailImage?: string | null
): string[] {
  const galleryUrls = normalizePackageGallery(gallery);
  const thumbnail = thumbnailImage?.trim() || '';

  if (galleryUrls.length === 0) {
    return thumbnail ? [thumbnail] : [];
  }

  if (thumbnail && !galleryUrls.includes(thumbnail)) {
    return [thumbnail, ...galleryUrls];
  }

  return galleryUrls;
}

/** Treat literal "null" strings from bad DB values as empty. */
export function normalizePdfUrl(url: unknown): string {
  if (url == null) return '';
  const value = String(url).trim();
  if (!value || value === 'null' || value === 'undefined') return '';
  return value;
}

import { sanitizeFontFamily } from '../shared/validation.ts';

const requestedFamilies = new Set<string>();

/**
 * Dynamically injects a sanitized Google Fonts stylesheet link for font pairing cards
 * without bundling unused fonts upfront.
 */
export function loadGoogleFonts(families: Array<string | undefined | null>) {
  if (typeof document === 'undefined') return;

  const toFetch: string[] = [];
  for (const raw of families) {
    if (!raw) continue;
    const clean = sanitizeFontFamily(raw);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (key === 'allo' || key === 'jetbrains mono' || requestedFamilies.has(key)) {
      continue;
    }
    requestedFamilies.add(key);
    toFetch.push(clean);
  }

  if (toFetch.length === 0) return;

  const familyQuery = toFetch
    .map((name) => `family=${encodeURIComponent(name)}:wght@400;500;600;700`)
    .join('&');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${familyQuery}&display=swap`;
  document.head.appendChild(link);
}

export function getGoogleFontsBrowseUrl(
  headingFont: string,
  bodyFont: string
): string {
  const query = sanitizeFontFamily(headingFont) || sanitizeFontFamily(bodyFont);
  return `https://fonts.google.com/?query=${encodeURIComponent(query)}`;
}

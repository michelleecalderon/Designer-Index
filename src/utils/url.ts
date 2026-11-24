/**
 * Validates external URLs so only http: and https: links can be rendered in href attributes.
 * Blocks javascript: or data: URIs before they ever reach the DOM.
 */
export function getSafeHref(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getHostname(rawUrl: string | null | undefined): string | null {
  const safe = getSafeHref(rawUrl);
  if (!safe) return null;
  try {
    return new URL(safe).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getFaviconUrl(rawUrl: string | null | undefined): string | null {
  const host = getHostname(rawUrl);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

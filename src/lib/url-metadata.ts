import dns from 'dns/promises';
import net from 'net';

export interface UrlMetadataResult {
  isUrl: boolean;
  normalizedUrl: string | null;
  fetched: boolean;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  siteName: string | null;
  textSnippet: string | null;
  fallbackReason?: string;
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isBlockedIp(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (net.isIPv4(normalized)) {
    return isBlockedIpv4(normalized);
  }
  if (net.isIPv6(normalized)) {
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('::ffff:')) {
      return isBlockedIpv4(normalized.slice('::ffff:'.length));
    }
    if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(normalized)) return true;
    return false;
  }
  return true;
}

async function validateExternalUrl(rawUrl: string): Promise<URL | null> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return null;
  }

  if (net.isIP(host)) {
    return isBlockedIp(host) ? null : parsed;
  }

  try {
    const records = await dns.lookup(host, { all: true });
    if (!records.length || records.some((record) => isBlockedIp(record.address))) {
      return null;
    }
  } catch {
    return null;
  }

  return parsed;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

function extractMetaContent(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternA = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const patternB = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`,
    'i'
  );
  const match = html.match(patternA) || html.match(patternB);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim()) || null;
}

function extractTextSnippet(html: string): string | null {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const normalized = decodeHtmlEntities(cleaned).replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 900) : null;
}

/**
 * Checks whether the pasted text is a standalone URL. If so, safely fetches
 * its title, meta description, OpenGraph tags, and a short text snippet
 * with a strict 5-second timeout and graceful fallback if blocked.
 */
export async function inspectPastedUrl(rawInput: string): Promise<UrlMetadataResult> {
  const trimmed = rawInput.trim();
  const looksLikeUrl = /^https?:\/\/\S+$/i.test(trimmed);

  if (!looksLikeUrl) {
    return {
      isUrl: false,
      normalizedUrl: null,
      fetched: false,
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      siteName: null,
      textSnippet: null,
    };
  }

  const safeUrl = await validateExternalUrl(trimmed);
  if (!safeUrl) {
    return {
      isUrl: true,
      normalizedUrl: trimmed,
      fetched: false,
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      siteName: null,
      textSnippet: null,
      fallbackReason: 'URL points to a restricted or unresolvable host.',
    };
  }

  try {
    const response = await fetch(safeUrl.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CuratedIndexBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    let finalResponse = response;
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectTarget = new URL(location, safeUrl).toString();
        const validatedRedirect = await validateExternalUrl(redirectTarget);
        if (validatedRedirect) {
          finalResponse = await fetch(validatedRedirect.toString(), {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
            redirect: 'manual',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CuratedIndexBot/1.0)',
              Accept: 'text/html,application/xhtml+xml',
            },
          });
        }
      }
    }

    if (!finalResponse.ok) {
      return {
        isUrl: true,
        normalizedUrl: safeUrl.toString(),
        fetched: false,
        title: null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        siteName: null,
        textSnippet: null,
        fallbackReason: `Site responded with HTTP ${finalResponse.status}.`,
      };
    }

    const contentType = finalResponse.headers.get('content-type') || '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml')
    ) {
      return {
        isUrl: true,
        normalizedUrl: safeUrl.toString(),
        fetched: false,
        title: null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        siteName: null,
        textSnippet: null,
        fallbackReason: 'URL did not return HTML content.',
      };
    }

    const rawHtml = (await finalResponse.text()).slice(0, 150_000);

    return {
      isUrl: true,
      normalizedUrl: safeUrl.toString(),
      fetched: true,
      title: extractTitle(rawHtml),
      description: extractMetaContent(rawHtml, 'description'),
      ogTitle: extractMetaContent(rawHtml, 'og:title'),
      ogDescription: extractMetaContent(rawHtml, 'og:description'),
      siteName: extractMetaContent(rawHtml, 'og:site_name'),
      textSnippet: extractTextSnippet(rawHtml),
    };
  } catch (error) {
    return {
      isUrl: true,
      normalizedUrl: safeUrl.toString(),
      fetched: false,
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      siteName: null,
      textSnippet: null,
      fallbackReason:
        error instanceof Error ? error.message : 'Request timed out or was blocked.',
    };
  }
}

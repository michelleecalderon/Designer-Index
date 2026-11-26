import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItemType,
  type ResourceMeta,
  type ResourcePricing,
} from './constants.ts';
import { normalizeTags } from './tags.ts';

export interface ValidatedResourcePayload {
  itemType: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string[];
  url: string | null;
  repoUrl: string | null;
  content: string | null;
  meta: ResourceMeta | null;
  isPublic: boolean;
}

/**
 * Normalizes and validates hex color codes (#RGB or #RRGGBB) into uppercase #RRGGBB strings.
 */
export function normalizeHexColors(raw: string | string[]): string[] {
  const parts = Array.isArray(raw)
    ? raw
    : raw
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const prefixed = part.startsWith('#') ? part : `#${part}`;
    if (/^#[0-9a-fA-F]{6}$/.test(prefixed)) {
      const upper = prefixed.toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);
        result.push(upper);
      }
    } else if (/^#[0-9a-fA-F]{3}$/.test(prefixed)) {
      const r = prefixed[1];
      const g = prefixed[2];
      const b = prefixed[3];
      const expanded = `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
      if (!seen.has(expanded)) {
        seen.add(expanded);
        result.push(expanded);
      }
    }
    if (result.length >= 8) break;
  }

  return result;
}

/**
 * Allowlists safe Google Font family characters (letters, digits, spaces, hyphens, dots).
 */
export function sanitizeFontFamily(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s\-.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function validateHttpUrl(
  rawValue: unknown,
  fieldLabel: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!raw) {
    return { ok: true, value: null };
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        ok: false,
        error: `${fieldLabel} must start with http:// or https://.`,
      };
    }
    return { ok: true, value: parsed.toString() };
  } catch {
    return {
      ok: false,
      error: `Please enter a valid ${fieldLabel} (including https://).`,
    };
  }
}

export function sanitizeResourceMeta(raw: unknown): ResourceMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.kind === 'font_pairing') {
    const headingFont =
      typeof obj.headingFont === 'string'
        ? sanitizeFontFamily(obj.headingFont)
        : '';
    const bodyFont =
      typeof obj.bodyFont === 'string' ? sanitizeFontFamily(obj.bodyFont) : '';
    if (!headingFont && !bodyFont) return null;

    const aesthetic =
      typeof obj.aesthetic === 'string'
        ? obj.aesthetic.trim().slice(0, 60)
        : '';
    const sampleText =
      typeof obj.sampleText === 'string'
        ? obj.sampleText.trim().slice(0, 120)
        : '';

    return {
      kind: 'font_pairing',
      headingFont: headingFont || bodyFont,
      bodyFont: bodyFont || headingFont,
      ...(aesthetic ? { aesthetic } : {}),
      ...(sampleText ? { sampleText } : {}),
    };
  }

  if (obj.kind === 'palette') {
    const colors = Array.isArray(obj.colors)
      ? normalizeHexColors(
          obj.colors.filter((c): c is string => typeof c === 'string')
        )
      : typeof obj.colors === 'string'
        ? normalizeHexColors(obj.colors)
        : [];
    if (colors.length < 2) return null;
    return {
      kind: 'palette',
      colors,
    };
  }

  if (obj.kind === 'component') {
    const framework =
      typeof obj.framework === 'string' && obj.framework.trim()
        ? obj.framework.trim().slice(0, 40)
        : 'Tailwind';
    return {
      kind: 'component',
      framework,
    };
  }

  return null;
}

export function validateResourcePayload(
  raw: unknown
): { ok: true; data: ValidatedResourcePayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const body = raw as Record<string, unknown>;

  const itemType =
    typeof body.itemType === 'string' &&
    (ITEM_TYPES as readonly string[]).includes(body.itemType)
      ? (body.itemType as ResourceItemType)
      : null;
  if (!itemType) {
    return { ok: false, error: 'Item type must be link, repo, prompt, or note.' };
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 160) {
    return { ok: false, error: 'Title is required (max 160 characters).' };
  }

  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (!description || description.length > 500) {
    return {
      ok: false,
      error: 'Description is required (max 500 characters).',
    };
  }

  const category =
    typeof body.category === 'string' &&
    (CATEGORIES as readonly string[]).includes(body.category)
      ? (body.category as ResourceCategory)
      : null;
  if (!category) {
    return { ok: false, error: 'Please select a valid category.' };
  }

  const pricing =
    typeof body.pricing === 'string' &&
    (PRICING_OPTIONS as readonly string[]).includes(body.pricing)
      ? (body.pricing as ResourcePricing)
      : 'Free';

  let tags: string[] = [];
  if (Array.isArray(body.tags)) {
    tags = normalizeTags(
      body.tags.filter((t): t is string => typeof t === 'string'),
      4
    );
  } else if (typeof body.tags === 'string') {
    tags = normalizeTags(body.tags, 4);
  }

  const checkedUrl = validateHttpUrl(body.url, 'URL');
  if (checkedUrl.ok === false) return checkedUrl;
  let url = checkedUrl.value;

  const checkedRepoUrl = validateHttpUrl(body.repoUrl, 'GitHub repository URL');
  if (checkedRepoUrl.ok === false) return checkedRepoUrl;
  let repoUrl = checkedRepoUrl.value;

  // For standalone repositories, accept either repoUrl or url and normalize cleanly into repoUrl.
  if (itemType === 'repo') {
    if (!repoUrl && url) {
      repoUrl = url;
      url = null;
    }
    if (!repoUrl && !url) {
      return {
        ok: false,
        error: 'A GitHub repository URL is required for repository entries.',
      };
    }
  }

  if (itemType === 'link' && !url) {
    return { ok: false, error: 'A valid URL is required for link resources.' };
  }

  const rawContent = typeof body.content === 'string' ? body.content.trim() : '';
  const content = rawContent ? rawContent : null;

  if (itemType === 'prompt' && !content) {
    return { ok: false, error: 'Prompt text is required for prompt resources.' };
  }

  const meta = sanitizeResourceMeta(body.meta);

  if (meta?.kind === 'component' && !content && !url && !repoUrl) {
    return {
      ok: false,
      error: 'Add component code or a reference link for component entries.',
    };
  }

  const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : true;

  return {
    ok: true,
    data: {
      itemType,
      title,
      description,
      category,
      pricing,
      tags,
      url,
      repoUrl,
      content,
      meta,
      isPublic,
    },
  };
}

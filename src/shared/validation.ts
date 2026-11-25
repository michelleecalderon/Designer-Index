import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItemType,
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
  content: string | null;
  isPublic: boolean;
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
    return { ok: false, error: 'Item type must be link, prompt, or note.' };
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

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
  let url: string | null = null;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, error: 'URL must start with http:// or https://.' };
      }
      url = parsed.toString();
    } catch {
      return { ok: false, error: 'Please enter a valid URL (including https://).' };
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
      content,
      isPublic,
    },
  };
}

import { GoogleGenAI, Type } from '@google/genai';
import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItemType,
  type ResourcePricing,
} from '../shared/constants.ts';
import { normalizeTags } from '../shared/tags.ts';
import type { UrlMetadataResult } from './url-metadata.ts';

export interface ClassifiedResource {
  item_type: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string[];
  url: string | null;
  content: string | null;
  metadataFetched?: boolean;
  metadataNote?: string | null;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Calls Gemini (gemini-3.1-flash-lite) strictly on the server with Structured JSON Output
 * to classify raw pasted input (plus optional scraped webpage metadata) into our resource schema,
 * reusing existing canonical tags to prevent hashtag bloat.
 */
export async function classifyResourceInput(
  rawInput: string,
  urlMeta: UrlMetadataResult,
  existingTags: string[] = []
): Promise<ClassifiedResource> {
  const ai = getGeminiClient();

  const contextParts: string[] = [`RAW_INPUT:\n${rawInput.trim()}`];

  if (existingTags.length > 0) {
    contextParts.push(`EXISTING_DIRECTORY_TAGS:\n${existingTags.join(', ')}`);
  }

  if (urlMeta.isUrl) {
    contextParts.push(
      `URL_METADATA:\n` +
        JSON.stringify(
          {
            url: urlMeta.normalizedUrl,
            fetched: urlMeta.fetched,
            title: urlMeta.title,
            description: urlMeta.description,
            ogTitle: urlMeta.ogTitle,
            ogDescription: urlMeta.ogDescription,
            siteName: urlMeta.siteName,
            textSnippet: urlMeta.textSnippet,
            fallbackReason: urlMeta.fallbackReason ?? null,
          },
          null,
          2
        )
    );
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: contextParts.join('\n\n'),
    config: {
      systemInstruction:
        'You classify pasted inputs into a minimalist design & AI personal resource directory.\n' +
        'Rules:\n' +
        '- Choose item_type: "link" for websites/tools/articles with a URL; "prompt" for reusable AI prompt templates; "note" for personal notes, quotes, font lists, or takeaways.\n' +
        '- Write a concise, accurate title.\n' +
        '- Write description as exactly 1 crisp, informative sentence (under 24 words).\n' +
        `- Choose category strictly from: ${CATEGORIES.join(', ')}.\n` +
        `- Choose pricing strictly from: ${PRICING_OPTIONS.join(', ')} (use "N/A" for prompts and personal notes).\n` +
        '- Return 2 to 4 short lowercase atomic tags (no # prefix). Strongly prefer reusing matching tags from EXISTING_DIRECTORY_TAGS. Avoid compound variants like "layout-tips" or "layout-review"—use separate atomic tags like "layout" and "tips" or "review".\n' +
        '- For "link", set url to the clean URL and content to empty string.\n' +
        '- For "prompt", set content to the full cleaned prompt text and url to empty string.\n' +
        '- For "note", set content to the note body and url to empty string unless a URL was provided.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          item_type: {
            type: Type.STRING,
            enum: [...ITEM_TYPES],
            description: 'Must be link, prompt, or note.',
          },
          title: {
            type: Type.STRING,
            description: 'Short, clear title for the resource.',
          },
          description: {
            type: Type.STRING,
            description: 'Exactly 1 crisp descriptive sentence.',
          },
          category: {
            type: Type.STRING,
            enum: [...CATEGORIES],
            description: 'Best matching directory category.',
          },
          pricing: {
            type: Type.STRING,
            enum: [...PRICING_OPTIONS],
            description: 'Pricing tier or N/A.',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 4 canonical lowercase tags.',
          },
          url: {
            type: Type.STRING,
            description: 'External URL if applicable, otherwise empty string.',
          },
          content: {
            type: Type.STRING,
            description:
              'Prompt text or note body if applicable, otherwise empty string.',
          },
        },
        required: [
          'item_type',
          'title',
          'description',
          'category',
          'pricing',
          'tags',
          'url',
          'content',
        ],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemini returned an empty classification response.');
  }

  const parsed = JSON.parse(text) as Record<string, unknown>;

  const item_type: ResourceItemType =
    typeof parsed.item_type === 'string' &&
    (ITEM_TYPES as readonly string[]).includes(parsed.item_type)
      ? (parsed.item_type as ResourceItemType)
      : urlMeta.isUrl
        ? 'link'
        : 'note';

  const category: ResourceCategory =
    typeof parsed.category === 'string' &&
    (CATEGORIES as readonly string[]).includes(parsed.category)
      ? (parsed.category as ResourceCategory)
      : 'Other';

  const pricing: ResourcePricing =
    typeof parsed.pricing === 'string' &&
    (PRICING_OPTIONS as readonly string[]).includes(parsed.pricing)
      ? (parsed.pricing as ResourcePricing)
      : item_type === 'link'
        ? 'Free'
        : 'N/A';

  const tags = Array.isArray(parsed.tags)
    ? normalizeTags(
        parsed.tags.filter((t): t is string => typeof t === 'string'),
        4
      )
    : [];

  const title =
    typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : urlMeta.title || 'Untitled Resource';

  const description =
    typeof parsed.description === 'string' && parsed.description.trim()
      ? parsed.description.trim()
      : 'Curated resource added via Magic Paste.';

  const rawUrl =
    typeof parsed.url === 'string' && parsed.url.trim()
      ? parsed.url.trim()
      : urlMeta.isUrl
        ? urlMeta.normalizedUrl
        : null;

  const rawContent =
    typeof parsed.content === 'string' && parsed.content.trim()
      ? parsed.content.trim()
      : null;

  return {
    item_type,
    title,
    description,
    category,
    pricing,
    tags,
    url: rawUrl,
    content: rawContent,
    metadataFetched: urlMeta.fetched,
    metadataNote: urlMeta.isUrl
      ? urlMeta.fetched
        ? 'Fetched webpage title, description, and OpenGraph tags.'
        : 'Site blocked automated preview; classified directly from the URL.'
      : null,
  };
}

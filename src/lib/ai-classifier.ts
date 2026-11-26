import { GoogleGenAI, Type } from '@google/genai';
import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItemType,
  type ResourceMeta,
  type ResourcePricing,
} from '../shared/constants.ts';
import { normalizeTags } from '../shared/tags.ts';
import { sanitizeResourceMeta } from '../shared/validation.ts';
import type { UrlMetadataResult } from './url-metadata.ts';

export interface ClassifiedResource {
  item_type: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string[];
  url: string | null;
  repo_url: string | null;
  content: string | null;
  meta: ResourceMeta | null;
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

function isGitHubRepoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, '').toLowerCase() === 'github.com' &&
      parsed.pathname.split('/').filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
}

/**
 * Calls Gemini (gemini-3.1-flash-lite) strictly on the server with Structured JSON Output
 * to classify pasted URLs, GitHub repos, skills, font pairings, hex palettes, UI components,
 * prompts, or notes into the directory schema.
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
        'You classify pasted inputs into a personal designer workbench directory.\n' +
        'Rules:\n' +
        '- Choose item_type: "repo" for standalone GitHub repositories; "link" for websites, skills, tools, or articles (if a skill/tool also has a GitHub repo mentioned, fill BOTH url and repo_url); "prompt" for reusable AI prompt templates; "note" for personal notes, font pairings, color palettes, or reusable UI code snippets.\n' +
        '- Write a concise, accurate title.\n' +
        '- Write description as exactly 1 crisp, informative sentence (under 24 words).\n' +
        `- Choose category strictly from: ${CATEGORIES.join(', ')}.\n` +
        `- Choose pricing strictly from: ${PRICING_OPTIONS.join(', ')} (use "N/A" for prompts, notes, font pairings, palettes, or component snippets; "Free" for open-source repos unless paid).\n` +
        '- Return 2 to 4 short lowercase atomic tags (no # prefix). Prefer reusing matching tags from EXISTING_DIRECTORY_TAGS. Avoid compound variants like "layout-tips".\n' +
        '- Structured enrichment (meta_kind):\n' +
        '  * If the input describes a font pairing (e.g. "Instrument Serif + DM Sans"), set meta_kind="font_pairing", heading_font, body_font, font_aesthetic (e.g. "Editorial", "Modern SaaS", "Vintage"), and category="Fonts".\n' +
        '  * If the input lists hex colors (e.g. "#F7F4EE, #1F1B16, #D9363E"), set meta_kind="palette", palette_colors (uppercase #RRGGBB array), and category="Color Palettes".\n' +
        '  * If the input contains reusable UI component code (CSS, Tailwind, React, animation), set meta_kind="component", component_framework (e.g. "Tailwind", "CSS", "React"), and place the cleaned code in content.\n' +
        '  * Otherwise set meta_kind="none".\n' +
        '- For standalone "repo", put the GitHub URL in repo_url and leave url empty unless a separate live homepage exists.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          item_type: {
            type: Type.STRING,
            enum: [...ITEM_TYPES],
            description: 'Must be link, repo, prompt, or note.',
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
            description: 'Primary website URL if applicable, otherwise empty string.',
          },
          repo_url: {
            type: Type.STRING,
            description: 'GitHub repository URL if applicable, otherwise empty string.',
          },
          content: {
            type: Type.STRING,
            description:
              'Prompt text, component code, or note body if applicable, otherwise empty string.',
          },
          meta_kind: {
            type: Type.STRING,
            enum: ['none', 'font_pairing', 'palette', 'component'],
            description: 'Optional rich designer preview preset.',
          },
          heading_font: {
            type: Type.STRING,
            description: 'Google Font family for headings when meta_kind is font_pairing.',
          },
          body_font: {
            type: Type.STRING,
            description: 'Google Font family for body copy when meta_kind is font_pairing.',
          },
          font_aesthetic: {
            type: Type.STRING,
            description: 'Aesthetic or use case (e.g. Modern SaaS, Editorial, Vintage).',
          },
          palette_colors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of #RRGGBB hex codes when meta_kind is palette.',
          },
          component_framework: {
            type: Type.STRING,
            description: 'Framework or stack (e.g. Tailwind, CSS, React) when meta_kind is component.',
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
          'repo_url',
          'content',
          'meta_kind',
        ],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemini returned an empty classification response.');
  }

  const parsed = JSON.parse(text) as Record<string, unknown>;

  let item_type: ResourceItemType =
    typeof parsed.item_type === 'string' &&
    (ITEM_TYPES as readonly string[]).includes(parsed.item_type)
      ? (parsed.item_type as ResourceItemType)
      : urlMeta.isUrl
        ? isGitHubRepoUrl(urlMeta.normalizedUrl)
          ? 'repo'
          : 'link'
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
      : item_type === 'link' || item_type === 'repo'
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

  let rawUrl =
    typeof parsed.url === 'string' && parsed.url.trim()
      ? parsed.url.trim()
      : urlMeta.isUrl && !isGitHubRepoUrl(urlMeta.normalizedUrl)
        ? urlMeta.normalizedUrl
        : null;

  let rawRepoUrl =
    typeof parsed.repo_url === 'string' && parsed.repo_url.trim()
      ? parsed.repo_url.trim()
      : urlMeta.isUrl && isGitHubRepoUrl(urlMeta.normalizedUrl)
        ? urlMeta.normalizedUrl
        : null;

  // Normalize standalone GitHub URLs into repo_url cleanly
  if (item_type === 'repo' && !rawRepoUrl && rawUrl) {
    rawRepoUrl = rawUrl;
    rawUrl = null;
  }
  if (!rawRepoUrl && isGitHubRepoUrl(rawUrl) && item_type === 'link') {
    item_type = 'repo';
    rawRepoUrl = rawUrl;
    rawUrl = null;
  }

  const rawContent =
    typeof parsed.content === 'string' && parsed.content.trim()
      ? parsed.content.trim()
      : null;

  let candidateMeta: Record<string, unknown> | null = null;
  if (parsed.meta_kind === 'font_pairing') {
    candidateMeta = {
      kind: 'font_pairing',
      headingFont: parsed.heading_font,
      bodyFont: parsed.body_font,
      aesthetic: parsed.font_aesthetic,
    };
  } else if (parsed.meta_kind === 'palette') {
    candidateMeta = {
      kind: 'palette',
      colors: parsed.palette_colors,
    };
  } else if (parsed.meta_kind === 'component') {
    candidateMeta = {
      kind: 'component',
      framework: parsed.component_framework,
    };
  }

  const meta = sanitizeResourceMeta(candidateMeta);

  return {
    item_type,
    title,
    description,
    category,
    pricing,
    tags,
    url: rawUrl,
    repo_url: rawRepoUrl,
    content: rawContent,
    meta,
    metadataFetched: urlMeta.fetched,
    metadataNote: urlMeta.isUrl
      ? urlMeta.fetched
        ? 'Fetched webpage title, description, and OpenGraph tags.'
        : 'Site blocked automated preview; classified directly from the URL.'
      : null,
  };
}

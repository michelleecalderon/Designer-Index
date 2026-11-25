// Compound modifier suffixes we split into separate atomic tags so
// "#layout-tips" and "#layout-review" reuse "#layout" + "#tips" / "#review".
const SPLITTABLE_SUFFIXES = [
  'review',
  'tips',
  'guide',
  'audit',
  'design',
  'tools',
  'tool',
  'ideas',
  'theory',
  'notes',
  'system',
  'systems',
];

// Canonical stem/synonym map to prevent near-duplicate hashtags from piling up.
const TAG_SYNONYMS: Record<string, string> = {
  font: 'typography',
  fonts: 'typography',
  type: 'typography',
  typeface: 'typography',
  typefaces: 'typography',
  colors: 'color',
  colour: 'color',
  colours: 'color',
  palette: 'color',
  palettes: 'color',
  patterns: 'pattern',
  prompts: 'prompt',
  icons: 'icon',
  notes: 'note',
  flows: 'flow',
  layouts: 'layout',
  minimalist: 'minimalism',
  accessible: 'accessibility',
  prototypes: 'prototyping',
  prototype: 'prototyping',
  llms: 'llm',
  tips: 'tips',
  guides: 'guide',
  reviews: 'review',
  audits: 'audit',
};

function canonicalizeAtom(atom: string): string {
  const cleaned = atom
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleaned) return '';
  return TAG_SYNONYMS[cleaned] ?? cleaned;
}

/**
 * Normalizes tags into a compact, reusable vocabulary:
 * 1. Lowercases and strips '#'
 * 2. Splits compound tags like "layout-tips" -> ["layout", "tips"]
 * 3. Folds plurals/synonyms like "fonts" -> "typography", "colors" -> "color"
 * 4. Deduplicates and caps at maxTags (default 4)
 */
export function normalizeTags(
  rawTags: string[] | string,
  maxTags = 4
): string[] {
  const rawList = Array.isArray(rawTags)
    ? rawTags
    : rawTags.split(',');

  const result: string[] = [];
  const seen = new Set<string>();

  const pushAtom = (atom: string) => {
    const canonical = canonicalizeAtom(atom);
    if (!canonical || seen.has(canonical)) return;
    seen.add(canonical);
    result.push(canonical);
  };

  for (const item of rawList) {
    if (typeof item !== 'string') continue;
    const slug = item
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/^-+|-+$/g, '');

    if (!slug) continue;

    // Check if slug is a compound like "layout-tips" or "ui-audit"
    const parts = slug.split('-').filter(Boolean);
    if (
      parts.length === 2 &&
      (SPLITTABLE_SUFFIXES.includes(parts[1]) || parts[0] === 'layout' || parts[0] === 'ui')
    ) {
      pushAtom(parts[0]);
      pushAtom(parts[1]);
    } else {
      pushAtom(slug);
    }

    if (result.length >= maxTags) break;
  }

  return result.slice(0, maxTags);
}

/**
 * Normalizes a URL for duplicate detection (strips www., trailing slash, hash, and UTM params).
 */
export function normalizeUrlForCompare(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '';
    const params = new URLSearchParams(parsed.search);
    for (const key of Array.from(params.keys())) {
      if (key.toLowerCase().startsWith('utm_') || key.toLowerCase() === 'ref') {
        params.delete(key);
      }
    }
    const search = params.toString();
    return `${host}${pathname}${search ? `?${search}` : ''}`;
  } catch {
    return null;
  }
}

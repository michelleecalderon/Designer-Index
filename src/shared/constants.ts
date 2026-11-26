export const CATEGORIES = [
  'UI Inspiration',
  'Design Tools',
  'Icons & Illustrations',
  'Fonts',
  'Color Palettes',
  'Stock Media',
  'Mockups',
  'Courses & Articles',
  'Job Resources',
  'AI Tools',
  'Prompts',
  'Other',
] as const;

export type ResourceCategory = (typeof CATEGORIES)[number];

export const ITEM_TYPES = ['link', 'repo', 'prompt', 'note'] as const;
export type ResourceItemType = (typeof ITEM_TYPES)[number];

export const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'N/A'] as const;
export type ResourcePricing = (typeof PRICING_OPTIONS)[number];

export interface FontPairingMeta {
  kind: 'font_pairing';
  headingFont: string;
  bodyFont: string;
  aesthetic?: string;
  sampleText?: string;
}

export interface ColorPaletteMeta {
  kind: 'palette';
  colors: string[];
}

export interface ComponentMeta {
  kind: 'component';
  framework: string;
}

export type ResourceMeta = FontPairingMeta | ColorPaletteMeta | ComponentMeta;

export interface ResourceItem {
  id: number;
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
  createdAt: string;
  updatedAt: string;
}

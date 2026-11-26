export interface PricingTheme {
  text: string;
  filterActive: string;
  filterHover: string;
}

/**
 * Neutral muted styling for Free, Freemium, and Paid resources
 * so chromatic accents remain reserved exclusively for categories.
 */
const NEUTRAL_PRICING_THEME: PricingTheme = {
  text: 'text-ink-muted',
  filterActive: 'bg-raised text-ink border-hairline',
  filterHover: 'hover:text-ink',
};

export const PRICING_THEME: Record<'Free' | 'Freemium' | 'Paid', PricingTheme> = {
  Free: NEUTRAL_PRICING_THEME,
  Freemium: NEUTRAL_PRICING_THEME,
  Paid: NEUTRAL_PRICING_THEME,
};

export function getPricingTheme(pricing: string): PricingTheme | null {
  if (pricing === 'Free' || pricing === 'Freemium' || pricing === 'Paid') {
    return PRICING_THEME[pricing];
  }
  return null;
}

export interface CategoryAccent {
  sidebarActive: string;
  sidebarCount: string;
  cardSurface: string;
  cardCategoryText: string;
  mobileSelect: string;
}

const DEFAULT_CATEGORY_ACCENT: CategoryAccent = {
  sidebarActive: 'bg-raised text-ink border-hairline font-semibold',
  sidebarCount: 'text-ink-muted',
  cardSurface: 'bg-card border-hairline hover:border-ink-secondary',
  cardCategoryText: 'text-ink font-semibold',
  mobileSelect: 'bg-raised border-ink-secondary text-ink font-semibold',
};

/**
 * 12 unique category colors applied without colored background fills:
 * - Sidebar & mobile picker keep the warm raised (#EFE9DF) surface
 * - Cards keep the crisp card (#FDFBF7) surface
 * - Selected state uses a crisp category-colored border, subtle ambient shadow,
 *   and bold primary (#1F1B16) typography with a matching 2px underline.
 */
export const CATEGORY_ACCENTS: Record<string, CategoryAccent> = {
  Prompts: {
    // #D9363E
    sidebarActive:
      'bg-raised text-ink border-[#D9363E]/75 shadow-[0_1px_10px_-2px_rgba(217,54,62,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#D9363E]/75 shadow-[0_2px_12px_-3px_rgba(217,54,62,0.20)] hover:border-[#D9363E] hover:shadow-[0_4px_16px_-3px_rgba(217,54,62,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#D9363E]',
    mobileSelect:
      'bg-raised border-[#D9363E]/75 shadow-[0_1px_10px_-2px_rgba(217,54,62,0.22)] text-ink font-semibold',
  },
  'Color Palettes': {
    // #E8590C
    sidebarActive:
      'bg-raised text-ink border-[#E8590C]/75 shadow-[0_1px_10px_-2px_rgba(232,89,12,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#E8590C]/75 shadow-[0_2px_12px_-3px_rgba(232,89,12,0.20)] hover:border-[#E8590C] hover:shadow-[0_4px_16px_-3px_rgba(232,89,12,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#E8590C]',
    mobileSelect:
      'bg-raised border-[#E8590C]/75 shadow-[0_1px_10px_-2px_rgba(232,89,12,0.22)] text-ink font-semibold',
  },
  'Courses & Articles': {
    // #C99700
    sidebarActive:
      'bg-raised text-ink border-[#C99700]/75 shadow-[0_1px_10px_-2px_rgba(201,151,0,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#C99700]/75 shadow-[0_2px_12px_-3px_rgba(201,151,0,0.20)] hover:border-[#C99700] hover:shadow-[0_4px_16px_-3px_rgba(201,151,0,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#C99700]',
    mobileSelect:
      'bg-raised border-[#C99700]/75 shadow-[0_1px_10px_-2px_rgba(201,151,0,0.22)] text-ink font-semibold',
  },
  'AI Tools': {
    // #7FA20C
    sidebarActive:
      'bg-raised text-ink border-[#7FA20C]/75 shadow-[0_1px_10px_-2px_rgba(127,162,12,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#7FA20C]/75 shadow-[0_2px_12px_-3px_rgba(127,162,12,0.20)] hover:border-[#7FA20C] hover:shadow-[0_4px_16px_-3px_rgba(127,162,12,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#7FA20C]',
    mobileSelect:
      'bg-raised border-[#7FA20C]/75 shadow-[0_1px_10px_-2px_rgba(127,162,12,0.22)] text-ink font-semibold',
  },
  Mockups: {
    // #2F9E44
    sidebarActive:
      'bg-raised text-ink border-[#2F9E44]/75 shadow-[0_1px_10px_-2px_rgba(47,158,68,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#2F9E44]/75 shadow-[0_2px_12px_-3px_rgba(47,158,68,0.20)] hover:border-[#2F9E44] hover:shadow-[0_4px_16px_-3px_rgba(47,158,68,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#2F9E44]',
    mobileSelect:
      'bg-raised border-[#2F9E44]/75 shadow-[0_1px_10px_-2px_rgba(47,158,68,0.22)] text-ink font-semibold',
  },
  'Design Tools': {
    // #0E9384
    sidebarActive:
      'bg-raised text-ink border-[#0E9384]/75 shadow-[0_1px_10px_-2px_rgba(14,147,132,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#0E9384]/75 shadow-[0_2px_12px_-3px_rgba(14,147,132,0.20)] hover:border-[#0E9384] hover:shadow-[0_4px_16px_-3px_rgba(14,147,132,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#0E9384]',
    mobileSelect:
      'bg-raised border-[#0E9384]/75 shadow-[0_1px_10px_-2px_rgba(14,147,132,0.22)] text-ink font-semibold',
  },
  'Stock Media': {
    // #1C8FD6
    sidebarActive:
      'bg-raised text-ink border-[#1C8FD6]/75 shadow-[0_1px_10px_-2px_rgba(28,143,214,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#1C8FD6]/75 shadow-[0_2px_12px_-3px_rgba(28,143,214,0.20)] hover:border-[#1C8FD6] hover:shadow-[0_4px_16px_-3px_rgba(28,143,214,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#1C8FD6]',
    mobileSelect:
      'bg-raised border-[#1C8FD6]/75 shadow-[0_1px_10px_-2px_rgba(28,143,214,0.22)] text-ink font-semibold',
  },
  'UI Inspiration': {
    // #4C5BD4
    sidebarActive:
      'bg-raised text-ink border-[#4C5BD4]/75 shadow-[0_1px_10px_-2px_rgba(76,91,212,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#4C5BD4]/75 shadow-[0_2px_12px_-3px_rgba(76,91,212,0.20)] hover:border-[#4C5BD4] hover:shadow-[0_4px_16px_-3px_rgba(76,91,212,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#4C5BD4]',
    mobileSelect:
      'bg-raised border-[#4C5BD4]/75 shadow-[0_1px_10px_-2px_rgba(76,91,212,0.22)] text-ink font-semibold',
  },
  Fonts: {
    // #8B4FD8
    sidebarActive:
      'bg-raised text-ink border-[#8B4FD8]/75 shadow-[0_1px_10px_-2px_rgba(139,79,216,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#8B4FD8]/75 shadow-[0_2px_12px_-3px_rgba(139,79,216,0.20)] hover:border-[#8B4FD8] hover:shadow-[0_4px_16px_-3px_rgba(139,79,216,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#8B4FD8]',
    mobileSelect:
      'bg-raised border-[#8B4FD8]/75 shadow-[0_1px_10px_-2px_rgba(139,79,216,0.22)] text-ink font-semibold',
  },
  'Job Resources': {
    // #C23DB5
    sidebarActive:
      'bg-raised text-ink border-[#C23DB5]/75 shadow-[0_1px_10px_-2px_rgba(194,61,181,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#C23DB5]/75 shadow-[0_2px_12px_-3px_rgba(194,61,181,0.20)] hover:border-[#C23DB5] hover:shadow-[0_4px_16px_-3px_rgba(194,61,181,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#C23DB5]',
    mobileSelect:
      'bg-raised border-[#C23DB5]/75 shadow-[0_1px_10px_-2px_rgba(194,61,181,0.22)] text-ink font-semibold',
  },
  'Icons & Illustrations': {
    // #E0457B
    sidebarActive:
      'bg-raised text-ink border-[#E0457B]/75 shadow-[0_1px_10px_-2px_rgba(224,69,123,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#E0457B]/75 shadow-[0_2px_12px_-3px_rgba(224,69,123,0.20)] hover:border-[#E0457B] hover:shadow-[0_4px_16px_-3px_rgba(224,69,123,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#E0457B]',
    mobileSelect:
      'bg-raised border-[#E0457B]/75 shadow-[0_1px_10px_-2px_rgba(224,69,123,0.22)] text-ink font-semibold',
  },
  Other: {
    // #8A6F52
    sidebarActive:
      'bg-raised text-ink border-[#8A6F52]/75 shadow-[0_1px_10px_-2px_rgba(138,111,82,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-card border-[#8A6F52]/75 shadow-[0_2px_12px_-3px_rgba(138,111,82,0.20)] hover:border-[#8A6F52] hover:shadow-[0_4px_16px_-3px_rgba(138,111,82,0.28)]',
    cardCategoryText:
      'text-ink font-semibold underline decoration-2 underline-offset-4 decoration-[#8A6F52]',
    mobileSelect:
      'bg-raised border-[#8A6F52]/75 shadow-[0_1px_10px_-2px_rgba(138,111,82,0.22)] text-ink font-semibold',
  },
};

export function getCategoryAccent(category: string): CategoryAccent {
  return CATEGORY_ACCENTS[category] ?? DEFAULT_CATEGORY_ACCENT;
}

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
 * 12 unique category colors: soft 12% tinted background over #FDFBF7,
 * dark grey (#5E554A) border, subtle matching colored glow border,
 * and bold primary (#1F1B16) text for contrast.
 */
export const CATEGORY_ACCENTS: Record<string, CategoryAccent> = {
  Prompts: {
    // #D9363E
    sidebarActive:
      'bg-[#F9E3E1] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(217,54,62,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#F9E3E1] border-ink-secondary shadow-[0_0_0_2px_rgba(217,54,62,0.22)] hover:shadow-[0_0_0_2px_rgba(217,54,62,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#F9E3E1] border-ink-secondary shadow-[0_0_0_2px_rgba(217,54,62,0.22)] text-ink font-semibold',
  },
  'Color Palettes': {
    // #E8590C
    sidebarActive:
      'bg-[#FAE8DB] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(232,89,12,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#FAE8DB] border-ink-secondary shadow-[0_0_0_2px_rgba(232,89,12,0.22)] hover:shadow-[0_0_0_2px_rgba(232,89,12,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#FAE8DB] border-ink-secondary shadow-[0_0_0_2px_rgba(232,89,12,0.22)] text-ink font-semibold',
  },
  'Courses & Articles': {
    // #C99700
    sidebarActive:
      'bg-[#F7EFD9] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(201,151,0,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#F7EFD9] border-ink-secondary shadow-[0_0_0_2px_rgba(201,151,0,0.22)] hover:shadow-[0_0_0_2px_rgba(201,151,0,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#F7EFD9] border-ink-secondary shadow-[0_0_0_2px_rgba(201,151,0,0.22)] text-ink font-semibold',
  },
  'AI Tools': {
    // #7FA20C
    sidebarActive:
      'bg-[#EEF0DB] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(127,162,12,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#EEF0DB] border-ink-secondary shadow-[0_0_0_2px_rgba(127,162,12,0.22)] hover:shadow-[0_0_0_2px_rgba(127,162,12,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#EEF0DB] border-ink-secondary shadow-[0_0_0_2px_rgba(127,162,12,0.22)] text-ink font-semibold',
  },
  Mockups: {
    // #2F9E44
    sidebarActive:
      'bg-[#E4F0E2] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(47,158,68,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#E4F0E2] border-ink-secondary shadow-[0_0_0_2px_rgba(47,158,68,0.22)] hover:shadow-[0_0_0_2px_rgba(47,158,68,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#E4F0E2] border-ink-secondary shadow-[0_0_0_2px_rgba(47,158,68,0.22)] text-ink font-semibold',
  },
  'Design Tools': {
    // #0E9384
    sidebarActive:
      'bg-[#E0EFE9] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(14,147,132,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#E0EFE9] border-ink-secondary shadow-[0_0_0_2px_rgba(14,147,132,0.22)] hover:shadow-[0_0_0_2px_rgba(14,147,132,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#E0EFE9] border-ink-secondary shadow-[0_0_0_2px_rgba(14,147,132,0.22)] text-ink font-semibold',
  },
  'Stock Media': {
    // #1C8FD6
    sidebarActive:
      'bg-[#E2EEF3] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(28,143,214,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#E2EEF3] border-ink-secondary shadow-[0_0_0_2px_rgba(28,143,214,0.22)] hover:shadow-[0_0_0_2px_rgba(28,143,214,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#E2EEF3] border-ink-secondary shadow-[0_0_0_2px_rgba(28,143,214,0.22)] text-ink font-semibold',
  },
  'UI Inspiration': {
    // #4C5BD4
    sidebarActive:
      'bg-[#E8E8F3] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(76,91,212,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#E8E8F3] border-ink-secondary shadow-[0_0_0_2px_rgba(76,91,212,0.22)] hover:shadow-[0_0_0_2px_rgba(76,91,212,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#E8E8F3] border-ink-secondary shadow-[0_0_0_2px_rgba(76,91,212,0.22)] text-ink font-semibold',
  },
  Fonts: {
    // #8B4FD8
    sidebarActive:
      'bg-[#EFE6F3] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(139,79,216,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#EFE6F3] border-ink-secondary shadow-[0_0_0_2px_rgba(139,79,216,0.22)] hover:shadow-[0_0_0_2px_rgba(139,79,216,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#EFE6F3] border-ink-secondary shadow-[0_0_0_2px_rgba(139,79,216,0.22)] text-ink font-semibold',
  },
  'Job Resources': {
    // #C23DB5
    sidebarActive:
      'bg-[#F6E4EF] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(194,61,181,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#F6E4EF] border-ink-secondary shadow-[0_0_0_2px_rgba(194,61,181,0.22)] hover:shadow-[0_0_0_2px_rgba(194,61,181,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#F6E4EF] border-ink-secondary shadow-[0_0_0_2px_rgba(194,61,181,0.22)] text-ink font-semibold',
  },
  'Icons & Illustrations': {
    // #E0457B
    sidebarActive:
      'bg-[#FAE5E8] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(224,69,123,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#FAE5E8] border-ink-secondary shadow-[0_0_0_2px_rgba(224,69,123,0.22)] hover:shadow-[0_0_0_2px_rgba(224,69,123,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#FAE5E8] border-ink-secondary shadow-[0_0_0_2px_rgba(224,69,123,0.22)] text-ink font-semibold',
  },
  Other: {
    // #8A6F52
    sidebarActive:
      'bg-[#EFEAE3] text-ink border-ink-secondary shadow-[0_0_0_2px_rgba(138,111,82,0.22)] font-semibold',
    sidebarCount: 'text-ink-muted',
    cardSurface:
      'bg-[#EFEAE3] border-ink-secondary shadow-[0_0_0_2px_rgba(138,111,82,0.22)] hover:shadow-[0_0_0_2px_rgba(138,111,82,0.34)]',
    cardCategoryText: 'text-ink font-semibold',
    mobileSelect:
      'bg-[#EFEAE3] border-ink-secondary shadow-[0_0_0_2px_rgba(138,111,82,0.22)] text-ink font-semibold',
  },
};

export function getCategoryAccent(category: string): CategoryAccent {
  return CATEGORY_ACCENTS[category] ?? DEFAULT_CATEGORY_ACCENT;
}

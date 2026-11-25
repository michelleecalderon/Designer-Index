export interface PricingTheme {
  text: string;
  filterActive: string;
  filterHover: string;
}

/**
 * Accessible high-contrast colors differentiating Free, Freemium, and Paid resources
 * without wrapping metadata in static pill borders.
 */
export const PRICING_THEME: Record<'Free' | 'Freemium' | 'Paid', PricingTheme> = {
  Free: {
    text: 'text-[#15803D]',
    filterActive: 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]',
    filterHover: 'hover:text-[#15803D]',
  },
  Freemium: {
    text: 'text-[#B45309]',
    filterActive: 'bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]',
    filterHover: 'hover:text-[#B45309]',
  },
  Paid: {
    text: 'text-[#4338CA]',
    filterActive: 'bg-[#EEF2FF] text-[#4338CA] border-[#A5B4FC]',
    filterHover: 'hover:text-[#4338CA]',
  },
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
  sidebarActive: 'bg-[#111111] text-[#FAFAFA] border border-[#111111] font-medium',
  sidebarCount: 'text-[#D4D4D4]',
  cardSurface: 'bg-[#F7F7F7] border-[#A3A3A3]',
  cardCategoryText: 'text-[#111111] font-medium',
  mobileSelect: 'border-[#111111] text-[#111111]',
};

/**
 * Distinct editorial accent tokens for each directory category.
 * Used when a category is actively selected to highlight both navigation and matching cards.
 */
export const CATEGORY_ACCENTS: Record<string, CategoryAccent> = {
  'UI Inspiration': {
    sidebarActive: 'bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] font-medium',
    sidebarCount: 'text-[#4F46E5]',
    cardSurface: 'bg-[#F8FAFF] border-[#A5B4FC] hover:border-[#6366F1]',
    cardCategoryText: 'text-[#3730A3] font-semibold',
    mobileSelect: 'border-[#818CF8] bg-[#F8FAFF] text-[#3730A3]',
  },
  'Design Tools': {
    sidebarActive: 'bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] font-medium',
    sidebarCount: 'text-[#0D9488]',
    cardSurface: 'bg-[#F4FEFC] border-[#5EEAD4] hover:border-[#0D9488]',
    cardCategoryText: 'text-[#0F766E] font-semibold',
    mobileSelect: 'border-[#2DD4BF] bg-[#F0FDFA] text-[#0F766E]',
  },
  'Icons & Illustrations': {
    sidebarActive: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] font-medium',
    sidebarCount: 'text-[#E11D48]',
    cardSurface: 'bg-[#FFF7F8] border-[#FDA4AF] hover:border-[#E11D48]',
    cardCategoryText: 'text-[#BE123C] font-semibold',
    mobileSelect: 'border-[#FB7185] bg-[#FFF1F2] text-[#BE123C]',
  },
  Fonts: {
    sidebarActive: 'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] font-medium',
    sidebarCount: 'text-[#7C3AED]',
    cardSurface: 'bg-[#FAF8FF] border-[#C4B5FD] hover:border-[#7C3AED]',
    cardCategoryText: 'text-[#6D28D9] font-semibold',
    mobileSelect: 'border-[#A78BFA] bg-[#F5F3FF] text-[#6D28D9]',
  },
  'Color Palettes': {
    sidebarActive: 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] font-medium',
    sidebarCount: 'text-[#EA580C]',
    cardSurface: 'bg-[#FFFAF5] border-[#FDBA74] hover:border-[#EA580C]',
    cardCategoryText: 'text-[#C2410C] font-semibold',
    mobileSelect: 'border-[#FB923C] bg-[#FFF7ED] text-[#C2410C]',
  },
  'Stock Media': {
    sidebarActive: 'bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD] font-medium',
    sidebarCount: 'text-[#0284C7]',
    cardSurface: 'bg-[#F5FBFF] border-[#7DD3FC] hover:border-[#0284C7]',
    cardCategoryText: 'text-[#0369A1] font-semibold',
    mobileSelect: 'border-[#38BDF8] bg-[#F0F9FF] text-[#0369A1]',
  },
  Mockups: {
    sidebarActive: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] font-medium',
    sidebarCount: 'text-[#16A34A]',
    cardSurface: 'bg-[#F6FEF9] border-[#86EFAC] hover:border-[#16A34A]',
    cardCategoryText: 'text-[#15803D] font-semibold',
    mobileSelect: 'border-[#4ADE80] bg-[#F0FDF4] text-[#15803D]',
  },
  'Courses & Articles': {
    sidebarActive: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-medium',
    sidebarCount: 'text-[#D97706]',
    cardSurface: 'bg-[#FFFDF5] border-[#FCD34D] hover:border-[#D97706]',
    cardCategoryText: 'text-[#B45309] font-semibold',
    mobileSelect: 'border-[#FBBF24] bg-[#FFFBEB] text-[#B45309]',
  },
  'Job Resources': {
    sidebarActive: 'bg-[#FDF4FF] text-[#A21CAF] border border-[#F5D0FE] font-medium',
    sidebarCount: 'text-[#C026D3]',
    cardSurface: 'bg-[#FEF9FF] border-[#F0ABFC] hover:border-[#C026D3]',
    cardCategoryText: 'text-[#A21CAF] font-semibold',
    mobileSelect: 'border-[#E879F9] bg-[#FDF4FF] text-[#A21CAF]',
  },
  'AI Tools': {
    sidebarActive: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-medium',
    sidebarCount: 'text-[#2563EB]',
    cardSurface: 'bg-[#F5F9FF] border-[#93C5FD] hover:border-[#2563EB]',
    cardCategoryText: 'text-[#1D4ED8] font-semibold',
    mobileSelect: 'border-[#60A5FA] bg-[#EFF6FF] text-[#1D4ED8]',
  },
  Prompts: {
    sidebarActive: 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-medium',
    sidebarCount: 'text-[#059669]',
    cardSurface: 'bg-[#F3FCF8] border-[#6EE7B7] hover:border-[#059669]',
    cardCategoryText: 'text-[#047857] font-semibold',
    mobileSelect: 'border-[#34D399] bg-[#ECFDF5] text-[#047857]',
  },
  Other: {
    sidebarActive: 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] font-medium',
    sidebarCount: 'text-[#CA8A04]',
    cardSurface: 'bg-[#FEFDF4] border-[#FDE047] hover:border-[#CA8A04]',
    cardCategoryText: 'text-[#854D0E] font-semibold',
    mobileSelect: 'border-[#FACC15] bg-[#FEFCE8] text-[#854D0E]',
  },
};

export function getCategoryAccent(category: string): CategoryAccent {
  return CATEGORY_ACCENTS[category] ?? DEFAULT_CATEGORY_ACCENT;
}

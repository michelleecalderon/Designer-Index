import { Search, X } from 'lucide-react';
import type { RefObject } from 'react';
import { CATEGORIES } from '../shared/constants.ts';

export type PricingFilter = 'All' | 'Free' | 'Freemium' | 'Paid';

const PRICING_FILTERS: PricingFilter[] = ['All', 'Free', 'Freemium', 'Paid'];

interface DirectoryToolbarProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  pricingFilter: PricingFilter;
  onPricingChange: (value: PricingFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

/**
 * Instant search bar (Cmd+K / Ctrl+K), pricing filter bar, and mobile category selector.
 */
export function DirectoryToolbar({
  searchInputRef,
  searchQuery,
  onSearchChange,
  pricingFilter,
  onPricingChange,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: DirectoryToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Instant search input */}
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools, prompts, tags, or notes…"
            aria-label="Search resources"
            className="w-full h-11 pl-10 pr-20 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-xl text-sm text-[#111111] placeholder:text-[#A3A3A3] transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 text-xs text-[#525252] hover:text-[#111111] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] rounded-md absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Pricing segmented control */}
        <div
          className="inline-flex items-center p-1 bg-[#F2F2F2] border border-[#E5E5E5] rounded-xl shrink-0 self-start sm:self-auto"
          role="group"
          aria-label="Filter by pricing"
        >
          {PRICING_FILTERS.map((option) => {
            const active = pricingFilter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onPricingChange(option)}
                aria-pressed={active}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#111111] border border-[#E5E5E5]'
                    : 'text-[#525252] hover:text-[#111111] border border-transparent'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive category selector for screens narrower than lg */}
      <div className="lg:hidden">
        <label htmlFor="mobile-category-select" className="sr-only">
          Filter by category
        </label>
        <select
          id="mobile-category-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full h-10 px-3.5 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-xl text-sm text-[#111111]"
        >
          <option value="All">All Categories ({totalCount})</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category} ({categoryCounts[category] ?? 0})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

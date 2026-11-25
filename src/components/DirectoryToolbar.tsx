import { Loader2, Search, Sparkles, X } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';
import { CATEGORIES, type ResourceItemType } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';

export type PricingFilter = 'All' | 'Free' | 'Freemium' | 'Paid';
export type TypeFilter = 'all' | ResourceItemType;

const PRICING_FILTERS: PricingFilter[] = ['All', 'Free', 'Freemium', 'Paid'];

interface DirectoryToolbarProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onTriggerAISearch: () => void;
  aiSearching: boolean;
  aiActive: boolean;
  typeFilter: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  typeCounts: Record<TypeFilter, number>;
  pricingFilter: PricingFilter;
  onPricingChange: (value: PricingFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

/**
 * Dual-mode search bar (instant keyword typing + Enter/button AI semantic search),
 * type filter tabs (All / Links / Prompts / Notes), color-differentiated pricing filter bar,
 * and mobile category picker.
 */
export function DirectoryToolbar({
  searchInputRef,
  searchQuery,
  onSearchChange,
  onTriggerAISearch,
  aiSearching,
  aiActive,
  typeFilter,
  onTypeChange,
  typeCounts,
  pricingFilter,
  onPricingChange,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: DirectoryToolbarProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !aiSearching) {
      onTriggerAISearch();
    }
  };

  const TYPE_TABS: Array<{ id: TypeFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'link', label: 'Links' },
    { id: 'prompt', label: 'Prompts' },
    { id: 'note', label: 'Notes' },
  ];

  const pricingDisabled = typeFilter === 'prompt' || typeFilter === 'note';
  const mobileCategoryAccent =
    selectedCategory !== 'All' ? getCategoryAccent(selectedCategory) : null;

  return (
    <div className="space-y-3">
      {/* Dual-mode search bar */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center">
        <Search
          className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by keyword, or describe what you need and press Enter for AI…"
          aria-label="Search resources"
          className="w-full h-11 pl-10 pr-40 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-xl text-sm text-[#111111] placeholder:text-[#A3A3A3] transition-colors"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery.trim() ? (
            <>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="inline-flex items-center p-1.5 text-[#737373] hover:text-[#111111] rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="submit"
                disabled={aiSearching}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                  aiActive
                    ? 'bg-[#111111] text-[#FAFAFA]'
                    : 'bg-[#F2F2F2] hover:bg-[#111111] text-[#111111] hover:text-[#FAFAFA] border border-[#E5E5E5]'
                }`}
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Searching…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] rounded-md mr-1 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {/* Type filter tabs + Pricing filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex items-center p-1 bg-[#F2F2F2] border border-[#E5E5E5] rounded-xl overflow-x-auto max-w-full"
          role="group"
          aria-label="Filter by resource type"
        >
          {TYPE_TABS.map((tab) => {
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTypeChange(tab.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#111111] border border-[#E5E5E5]'
                    : 'text-[#525252] hover:text-[#111111] border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    active ? 'text-[#525252]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {typeCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`inline-flex items-center p-1 bg-[#F2F2F2] border border-[#E5E5E5] rounded-xl shrink-0 transition-opacity ${
            pricingDisabled ? 'opacity-45 pointer-events-none' : ''
          }`}
          role="group"
          aria-label="Filter by pricing"
          aria-disabled={pricingDisabled}
        >
          {PRICING_FILTERS.map((option) => {
            const active = pricingFilter === option;
            const pricingTheme = getPricingTheme(option);
            const activeClasses = pricingTheme
              ? pricingTheme.filterActive
              : 'bg-white text-[#111111] border-[#E5E5E5]';
            const inactiveClasses = pricingTheme
              ? `${pricingTheme.text} opacity-80 hover:opacity-100 border-transparent`
              : 'text-[#525252] hover:text-[#111111] border-transparent';

            return (
              <button
                key={option}
                type="button"
                disabled={pricingDisabled}
                onClick={() => onPricingChange(option)}
                aria-pressed={active}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? activeClasses : inactiveClasses
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
          className={`w-full h-10 px-3.5 border focus:outline-none rounded-xl text-sm transition-colors ${
            mobileCategoryAccent
              ? `${mobileCategoryAccent.mobileSelect} font-medium`
              : 'bg-white border-[#E5E5E5] focus:border-[#111111] text-[#111111]'
          }`}
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

import { LayoutGrid, List, Loader2, Search, Sparkles, X } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';
import { CATEGORIES, type ResourceItemType } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';

export type PricingFilter = 'All' | 'Free' | 'Freemium' | 'Paid';
export type TypeFilter = 'all' | ResourceItemType;
export type ViewMode = 'grid' | 'table';

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
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

/**
 * Dual-mode search bar, type filter tabs (All / Links / Repos / Prompts / Notes),
 * neutral segmented pricing bar, Grid/Table view switch, and mobile category picker.
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
  viewMode,
  onViewModeChange,
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
    { id: 'repo', label: 'Repos' },
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
          className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by keyword, font, hex, repo, or describe what you need and press Enter for AI…"
          aria-label="Search resources"
          className="w-full h-11 pl-10 pr-40 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-xl text-sm text-ink placeholder:text-ink-muted transition-colors"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery.trim() ? (
            <>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="inline-flex items-center p-1.5 text-ink-muted hover:text-ink rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="submit"
                disabled={aiSearching}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                  aiActive
                    ? 'bg-ink text-card'
                    : 'bg-card hover:bg-ink text-ink hover:text-card border border-hairline'
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
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-ink-muted bg-card border border-hairline rounded-md mr-1 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {/* Type filter tabs + Pricing filter + Grid/Table switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          className="inline-flex items-center p-1 bg-card border border-hairline rounded-xl overflow-x-auto max-w-full"
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
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-raised text-ink border-hairline'
                    : 'text-ink-muted hover:text-ink border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                  {typeCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`inline-flex items-center p-1 bg-card border border-hairline rounded-xl shrink-0 transition-opacity ${
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
                : 'bg-raised text-ink border-hairline';
              const inactiveClasses = pricingTheme
                ? `text-ink-muted ${pricingTheme.filterHover} border-transparent`
                : 'text-ink-muted hover:text-ink border-transparent';

              return (
                <button
                  key={option}
                  type="button"
                  disabled={pricingDisabled}
                  onClick={() => onPricingChange(option)}
                  aria-pressed={active}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? activeClasses : inactiveClasses
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div
            className="inline-flex items-center p-1 bg-card border border-hairline rounded-xl shrink-0"
            role="group"
            aria-label="Layout view"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
              title="Card Grid"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-raised text-ink border-hairline'
                  : 'text-ink-muted hover:text-ink border-transparent'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="Table view"
              title="Compact Table"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-raised text-ink border-hairline'
                  : 'text-ink-muted hover:text-ink border-transparent'
              }`}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
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
          className={`w-full h-10 px-3.5 border focus:border-ink focus:outline-none rounded-xl text-sm transition-all ${
            mobileCategoryAccent
              ? mobileCategoryAccent.mobileSelect
              : 'bg-raised border-hairline text-ink'
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

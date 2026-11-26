import { CATEGORIES } from '../shared/constants.ts';
import { getCategoryAccent } from '../shared/theme.ts';

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

/**
 * Clean vertical category index for desktop viewports with right-aligned tabular counts
 * and distinct accent highlights when a category is selected.
 */
export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}: CategorySidebarProps) {
  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-8">
        <p className="text-xs font-medium text-ink-muted mb-3 px-2.5">
          Categories
        </p>
        <nav aria-label="Resource categories" className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-lg border transition-all duration-150 text-left cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-raised text-ink border-hairline font-semibold'
                : 'text-ink-muted border-transparent hover:text-ink hover:bg-raised/60'
            }`}
          >
            <span className="truncate">All Resources</span>
            <span className="font-mono text-xs tabular-nums text-ink-muted">
              {totalCount}
            </span>
          </button>

          {CATEGORIES.map((category) => {
            const count = categoryCounts[category] ?? 0;
            const active = selectedCategory === category;
            const accent = getCategoryAccent(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-lg border transition-all duration-150 text-left cursor-pointer ${
                  active
                    ? accent.sidebarActive
                    : 'text-ink-muted border-transparent hover:text-ink hover:bg-raised/60'
                }`}
              >
                <span className="truncate">{category}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    active ? accent.sidebarCount : 'text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

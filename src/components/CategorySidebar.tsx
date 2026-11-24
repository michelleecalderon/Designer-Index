import { CATEGORIES } from '../shared/constants.ts';

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

/**
 * Clean vertical category index for desktop viewports with right-aligned tabular counts.
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
        <p className="text-xs font-medium text-[#737373] mb-3 px-2.5">
          Categories
        </p>
        <nav aria-label="Resource categories" className="space-y-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-lg transition-colors duration-150 text-left cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#111111] text-[#FAFAFA] font-medium'
                : 'text-[#525252] hover:text-[#111111] hover:bg-[#F2F2F2]'
            }`}
          >
            <span className="truncate">All Resources</span>
            <span
              className={`font-mono text-xs tabular-nums ${
                selectedCategory === 'All' ? 'text-[#D4D4D4]' : 'text-[#A3A3A3]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {CATEGORIES.map((category) => {
            const count = categoryCounts[category] ?? 0;
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-lg transition-colors duration-150 text-left cursor-pointer ${
                  active
                    ? 'bg-[#111111] text-[#FAFAFA] font-medium'
                    : 'text-[#525252] hover:text-[#111111] hover:bg-[#F2F2F2]'
                }`}
              >
                <span className="truncate">{category}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    active ? 'text-[#D4D4D4]' : 'text-[#A3A3A3]'
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

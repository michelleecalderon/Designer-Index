import { useState, type MouseEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Lock,
  Maximize2,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getCategoryAccent } from '../shared/theme.ts';
import { getHostname, getSafeHref } from '../utils/url.ts';

interface ResourceTableProps {
  items: ResourceItem[];
  isAdmin?: boolean;
  selectedCategory: string;
  selectedTag?: string | null;
  onTagClick?: (tag: string) => void;
  onInspect?: (item: ResourceItem) => void;
  onEdit?: (item: ResourceItem) => void;
  onDelete?: (id: number) => Promise<void>;
}

/**
 * Compact Notion-style table view for fast scanning and one-click actions
 * while maintaining the warm neutral ramp and active category highlights.
 */
export function ResourceTable({
  items,
  isAdmin = false,
  selectedCategory,
  selectedTag = null,
  onTagClick,
  onInspect,
  onEdit,
  onDelete,
}: ResourceTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedHexKey, setCopiedHexKey] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopyContent = async (e: MouseEvent, item: ResourceItem) => {
    e.stopPropagation();
    if (!item.content) return;
    await copyText(item.content);
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 1800);
  };

  const handleCopyHex = async (e: MouseEvent, itemId: number, hex: string) => {
    e.stopPropagation();
    await copyText(hex);
    const key = `${itemId}:${hex}`;
    setCopiedHexKey(key);
    window.setTimeout(() => {
      setCopiedHexKey((prev) => (prev === key ? null : prev));
    }, 1500);
  };

  const handleConfirmDelete = async (e: MouseEvent, id: number) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatTypeLabel = (item: ResourceItem) => {
    if (item.meta?.kind === 'font_pairing') return 'Font pairing';
    if (item.meta?.kind === 'palette') return 'Palette';
    if (item.meta?.kind === 'component') return item.meta.framework;
    if (item.itemType === 'repo') return 'Repo';
    if (item.itemType === 'prompt') return 'Prompt';
    if (item.itemType === 'note') return 'Note';
    return 'Link';
  };

  return (
    <div className="bg-card border border-hairline rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-canvas text-[11px] font-medium text-ink-muted">
              <th className="py-2.5 px-4">Resource</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Pricing</th>
              <th className="py-2.5 px-3">Tags</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {items.map((item) => {
              const safeHref = getSafeHref(item.url);
              const safeRepoHref = getSafeHref(item.repoUrl);
              const primaryHref =
                item.itemType === 'repo'
                  ? safeRepoHref ?? safeHref
                  : safeHref ?? safeRepoHref;
              const hostname = getHostname(primaryHref);
              const isHighlighted =
                selectedCategory !== 'All' && selectedCategory === item.category;
              const categoryAccent = isHighlighted
                ? getCategoryAccent(item.category)
                : null;
              const canInspect =
                Boolean(item.meta) ||
                item.itemType === 'prompt' ||
                item.itemType === 'note';

              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (canInspect) onInspect?.(item);
                  }}
                  className={`transition-colors ${
                    canInspect ? 'cursor-pointer hover:bg-raised/60' : 'hover:bg-raised/40'
                  }`}
                >
                  <td className="py-3 px-4 max-w-[320px]">
                    <div className="flex items-center gap-2 min-w-0">
                      {!item.isPublic && (
                        <Lock
                          className="w-3.5 h-3.5 text-ink shrink-0"
                          aria-label="Private"
                        />
                      )}
                      {primaryHref && !canInspect ? (
                        <a
                          href={primaryHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-display font-semibold text-ink hover:underline underline-offset-4 decoration-ink-muted truncate"
                        >
                          <span className="truncate">{item.title}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                        </a>
                      ) : (
                        <span className="font-display font-semibold text-ink truncate">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {item.meta?.kind === 'palette' ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {item.meta.colors.map((hex) => {
                          const key = `${item.id}:${hex}`;
                          return (
                            <button
                              key={hex}
                              type="button"
                              onClick={(e) => handleCopyHex(e, item.id, hex)}
                              title={copiedHexKey === key ? `Copied ${hex}` : `Copy ${hex}`}
                              aria-label={`Copy ${hex}`}
                              style={{ backgroundColor: hex }}
                              className="w-4 h-4 rounded-full border border-hairline hover:scale-110 transition-transform cursor-pointer shrink-0"
                            />
                          );
                        })}
                        {copiedHexKey?.startsWith(`${item.id}:`) && (
                          <span className="text-[11px] font-mono text-ink-muted">
                            Copied
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-secondary truncate mt-0.5">
                        {hostname && item.itemType === 'link'
                          ? `${hostname} — ${item.description}`
                          : item.description}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-3 text-xs text-ink-muted whitespace-nowrap">
                    {formatTypeLabel(item)}
                  </td>

                  <td
                    className={`py-3 px-3 text-xs whitespace-nowrap ${
                      categoryAccent
                        ? categoryAccent.cardCategoryText
                        : 'text-ink-secondary'
                    }`}
                  >
                    {item.category}
                  </td>

                  <td className="py-3 px-3 text-xs text-ink-muted whitespace-nowrap tabular-nums">
                    {item.pricing}
                  </td>

                  <td className="py-3 px-3 text-xs text-ink-muted max-w-[180px]">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.tags.map((tag) => {
                        const active = selectedTag === tag;
                        return onTagClick ? (
                          <button
                            key={tag}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTagClick(tag);
                            }}
                            className={`hover:text-ink cursor-pointer shrink-0 ${
                              active ? 'text-ink font-medium underline underline-offset-4' : ''
                            }`}
                          >
                            #{tag}
                          </button>
                        ) : (
                          <span key={tag} className="shrink-0">
                            #{tag}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {safeRepoHref && (
                        <a
                          href={safeRepoHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open GitHub repo for ${item.title}`}
                          title="Open GitHub repository"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-hairline bg-raised hover:bg-ink hover:text-card text-ink transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}

                      {item.content && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyContent(e, item)}
                          aria-label={`Copy content for ${item.title}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-hairline bg-raised hover:bg-ink hover:text-card text-ink transition-colors cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}

                      {canInspect && (
                        <button
                          type="button"
                          onClick={() => onInspect?.(item)}
                          aria-label={`Inspect ${item.title}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-hairline bg-card hover:border-ink-secondary text-ink-secondary hover:text-ink transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}

                      {isAdmin &&
                        (confirmDeleteId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleConfirmDelete(e, item.id)}
                              disabled={deletingId === item.id}
                              className="text-xs font-medium text-danger hover:underline cursor-pointer px-1"
                            >
                              {deletingId === item.id ? '…' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-ink-muted hover:text-ink cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit?.(item)}
                              aria-label={`Edit ${item.title}`}
                              className="p-1.5 text-ink-muted hover:text-ink cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={`Delete ${item.title}`}
                              className="p-1.5 text-ink-muted hover:text-danger cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

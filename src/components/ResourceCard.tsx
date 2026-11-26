import { useState, type MouseEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Lock,
  Maximize2,
  Pencil,
  Terminal,
  Trash2,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';
import { getFaviconUrl, getHostname, getSafeHref } from '../utils/url.ts';

interface ResourceCardProps {
  item: ResourceItem;
  isAdmin?: boolean;
  isCategoryHighlighted?: boolean;
  selectedTag?: string | null;
  onTagClick?: (tag: string) => void;
  onInspect?: (item: ResourceItem) => void;
  onEdit?: (item: ResourceItem) => void;
  onDelete?: (id: number) => Promise<void>;
}

/**
 * Renders one of the 3 directory item types ('link' | 'prompt' | 'note')
 * inside a uniform-height card using the warm neutral ramp, muted pricing metadata,
 * active category surface/glow highlights, and overlay expansion for Prompts and Notes.
 */
export function ResourceCard({
  item,
  isAdmin = false,
  isCategoryHighlighted = false,
  selectedTag = null,
  onTagClick,
  onInspect,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const safeHref = getSafeHref(item.url);
  const hostname = getHostname(item.url);
  const faviconUrl = getFaviconUrl(item.url);
  const pricingTheme = getPricingTheme(item.pricing);
  const categoryAccent = isCategoryHighlighted
    ? getCategoryAccent(item.category)
    : null;

  const surfaceClasses = categoryAccent
    ? categoryAccent.cardSurface
    : 'bg-card border-hairline hover:border-ink-secondary';

  const handleCopyPrompt = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!item.content) return;
    try {
      await navigator.clipboard.writeText(item.content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = item.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // Unboxed metadata footer shared across all 3 uniform card types
  const renderMetadata = () => (
    <div className="mt-auto pt-3 border-t border-hairline flex items-center justify-between gap-2 text-xs text-ink-muted">
      <div className="flex items-center gap-x-2 min-w-0 truncate">
        {!item.isPublic && (
          <>
            <span className="inline-flex items-center gap-1 font-medium text-ink shrink-0">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Private</span>
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}

        <span
          className={`shrink-0 ${
            categoryAccent ? categoryAccent.cardCategoryText : 'text-ink-secondary'
          }`}
        >
          {item.category}
        </span>

        {item.pricing && item.pricing !== 'N/A' && (
          <>
            <span aria-hidden="true">·</span>
            <span
              className={`shrink-0 ${
                pricingTheme ? pricingTheme.text : 'text-ink-muted'
              }`}
            >
              {item.pricing}
            </span>
          </>
        )}

        {item.tags.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-x-1.5 min-w-0 truncate">
              {item.tags.map((tag) => {
                const isSelected = selectedTag === tag;
                return onTagClick ? (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick(tag);
                    }}
                    className={`hover:text-ink transition-colors cursor-pointer shrink-0 rounded-sm ${
                      isSelected
                        ? 'text-ink font-medium underline underline-offset-4'
                        : 'text-ink-muted'
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
            </span>
          </>
        )}
      </div>

      {isAdmin && (
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-xs font-medium text-danger hover:underline underline-offset-4 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="text-xs text-ink-muted hover:text-ink cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                aria-label={`Edit ${item.title}`}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                aria-label={`Delete ${item.title}`}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-danger transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (item.itemType === 'link') {
    return (
      <article
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-raised border border-hairline flex items-center justify-center shrink-0 overflow-hidden">
                {faviconUrl && !faviconFailed ? (
                  <img
                    src={faviconUrl}
                    alt={`${item.title} icon`}
                    referrerPolicy="no-referrer"
                    onError={() => setFaviconFailed(true)}
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <span className="text-xs font-display font-semibold text-ink-secondary uppercase">
                    {item.title.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                {safeHref ? (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-display text-[15px] font-semibold text-ink group-hover:underline underline-offset-4 decoration-ink-muted rounded-sm max-w-full"
                  >
                    <span className="truncate">{item.title}</span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <h3 className="font-display text-[15px] font-semibold text-ink truncate">
                    {item.title}
                  </h3>
                )}
                {hostname && (
                  <p className="text-xs font-mono text-ink-muted truncate">
                    {hostname}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-ink-secondary leading-relaxed line-clamp-4">
            {item.description}
          </p>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  if (item.itemType === 'prompt') {
    return (
      <article
        onClick={() => onInspect?.(item)}
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
                <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Prompt</span>
              </div>
              <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyPrompt}
                disabled={!item.content}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors duration-150 whitespace-nowrap cursor-pointer disabled:opacity-40"
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect?.(item);
                }}
                aria-label={`Open full prompt: ${item.title}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-card hover:border-ink-secondary text-ink-secondary hover:text-ink transition-colors duration-150 whitespace-nowrap cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" aria-hidden="true" />
                <span>View</span>
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-ink-secondary leading-relaxed line-clamp-2">
            {item.description}
          </p>

          {item.content && (
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-raised border border-hairline font-mono text-[12px] leading-snug text-ink-secondary line-clamp-2">
              {item.content}
            </div>
          )}
        </div>

        {renderMetadata()}
      </article>
    );
  }

  return (
    <article
      onClick={() => onInspect?.(item)}
      className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Note</span>
            </div>
            <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
              {item.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect?.(item);
            }}
            aria-label={`Read full note: ${item.title}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-raised hover:border-ink-secondary text-ink transition-colors duration-150 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" aria-hidden="true" />
            <span>Read note</span>
          </button>
        </div>

        <p className="mt-2.5 text-sm text-ink-secondary leading-relaxed line-clamp-3">
          {item.description}
        </p>

        {(item.content || safeHref) && (
          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-ink-muted">
            {item.content ? (
              <span className="truncate italic">{item.content}</span>
            ) : (
              <span />
            )}
            {safeHref && (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted shrink-0 whitespace-nowrap"
              >
                <span>{hostname ?? 'Reference'}</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      {renderMetadata()}
    </article>
  );
}

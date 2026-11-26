import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Lock,
  Pencil,
  Terminal,
  X,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';
import { getHostname, getSafeHref } from '../utils/url.ts';

interface ResourceDetailModalProps {
  item: ResourceItem | null;
  isAdmin?: boolean;
  isCategoryHighlighted?: boolean;
  selectedTag?: string | null;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
  onEdit?: (item: ResourceItem) => void;
}

/**
 * Expanded overlay reader for Prompts and Notes using the warm neutral ramp,
 * raised prompt surface, muted pricing metadata, and #1F1B16 focus rings.
 */
export function ResourceDetailModal({
  item,
  isAdmin = false,
  isCategoryHighlighted = false,
  selectedTag = null,
  onClose,
  onTagClick,
  onEdit,
}: ResourceDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const safeHref = getSafeHref(item.url);
  const hostname = getHostname(item.url);
  const pricingTheme = getPricingTheme(item.pricing);
  const categoryAccent = isCategoryHighlighted
    ? getCategoryAccent(item.category)
    : null;

  const handleCopy = async () => {
    const textToCopy = item.content || item.description;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-card border border-hairline rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-hairline">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-ink-muted mb-1.5">
              {item.itemType === 'prompt' ? (
                <>
                  <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Prompt</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Note</span>
                </>
              )}
              {!item.isPublic && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    <span>Private</span>
                  </span>
                </>
              )}
            </div>
            <h2
              id="resource-detail-title"
              className="font-display text-lg sm:text-xl font-semibold text-ink leading-snug"
            >
              {item.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.itemType === 'prompt' && item.content && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors whitespace-nowrap cursor-pointer"
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
                    <span>Copy prompt</span>
                  </>
                )}
              </button>
            )}

            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-card hover:border-ink-secondary text-ink-secondary hover:text-ink transition-colors whitespace-nowrap cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail view"
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable reading body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4">
          <p className="text-[15px] text-ink-secondary leading-relaxed max-w-prose">
            {item.description}
          </p>

          {item.content &&
            (item.itemType === 'prompt' ? (
              <pre className="p-4 rounded-xl bg-raised border border-hairline font-mono text-[13px] leading-relaxed text-ink whitespace-pre-wrap break-words">
                {item.content}
              </pre>
            ) : (
              <div className="pt-4 border-t border-hairline text-[15px] text-ink leading-[1.75] whitespace-pre-wrap max-w-prose">
                {item.content}
              </div>
            ))}

          {safeHref && (
            <div className="pt-1">
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted"
              >
                <span>Open reference: {hostname ?? safeHref}</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        {/* Metadata footer */}
        <div className="px-6 py-3.5 border-t border-hairline bg-canvas flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={
                categoryAccent ? categoryAccent.cardCategoryText : 'text-ink-secondary'
              }
            >
              {item.category}
            </span>

            {item.pricing && item.pricing !== 'N/A' && (
              <>
                <span aria-hidden="true">·</span>
                <span className={pricingTheme ? pricingTheme.text : 'text-ink-muted'}>
                  {item.pricing}
                </span>
              </>
            )}

            {item.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex flex-wrap items-center gap-x-2">
                  {item.tags.map((tag) => {
                    const active = selectedTag === tag;
                    return onTagClick ? (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          onTagClick(tag);
                          onClose();
                        }}
                        className={`hover:text-ink transition-colors cursor-pointer rounded-sm ${
                          active
                            ? 'text-ink font-medium underline underline-offset-4'
                            : 'text-ink-muted'
                        }`}
                      >
                        #{tag}
                      </button>
                    ) : (
                      <span key={tag}>#{tag}</span>
                    );
                  })}
                </span>
              </>
            )}
          </div>

          <span className="text-[11px] font-mono text-ink-muted">
            Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}

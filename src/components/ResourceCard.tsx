import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Lock,
  Pencil,
  Terminal,
  Trash2,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getFaviconUrl, getHostname, getSafeHref } from '../utils/url.ts';

interface ResourceCardProps {
  item: ResourceItem;
  isAdmin?: boolean;
  onEdit?: (item: ResourceItem) => void;
  onDelete?: (id: number) => Promise<void>;
}

/**
 * Renders one of the 3 directory item types ('link' | 'prompt' | 'note')
 * with unboxed typographic metadata, optional Private status, and admin actions.
 */
export function ResourceCard({
  item,
  isAdmin = false,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const safeHref = getSafeHref(item.url);
  const hostname = getHostname(item.url);
  const faviconUrl = getFaviconUrl(item.url);

  const handleCopyPrompt = async () => {
    if (!item.content) return;
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = item.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // Unboxed metadata footer shared across all 3 item types (zero pill clouds)
  const renderMetadata = () => (
    <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        {!item.isPublic && (
          <>
            <span className="inline-flex items-center gap-1 font-medium text-[#111111]">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Private</span>
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span className="text-[#525252]">{item.category}</span>
        {item.pricing && item.pricing !== 'N/A' && (
          <>
            <span aria-hidden="true">·</span>
            <span>{item.pricing}</span>
          </>
        )}
        {item.tags.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              {item.tags.map((tag) => `#${tag}`).join(' ')}
            </span>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 shrink-0">
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-xs font-medium text-[#991B1B] hover:underline underline-offset-4 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-xs text-[#737373] hover:text-[#111111] cursor-pointer"
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
                className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-[#111111] transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${item.title}`}
                className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-[#991B1B] transition-colors cursor-pointer"
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
      <article className="group bg-white border border-[#E5E5E5] hover:border-[#A3A3A3] rounded-xl p-5 transition-colors duration-150 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center shrink-0 overflow-hidden">
                {faviconUrl && !faviconFailed ? (
                  <img
                    src={faviconUrl}
                    alt={`${item.title} icon`}
                    referrerPolicy="no-referrer"
                    onError={() => setFaviconFailed(true)}
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <span className="text-xs font-display font-semibold text-[#525252] uppercase">
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
                    className="inline-flex items-center gap-1 font-display text-[15px] font-semibold text-[#111111] group-hover:underline underline-offset-4 decoration-[#A3A3A3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] rounded-sm"
                  >
                    <span className="truncate">{item.title}</span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#111111] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <h3 className="font-display text-[15px] font-semibold text-[#111111] truncate">
                    {item.title}
                  </h3>
                )}
                {hostname && (
                  <p className="text-xs font-mono text-[#737373] truncate">
                    {hostname}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-[#525252] leading-relaxed">
            {item.description}
          </p>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  if (item.itemType === 'prompt') {
    return (
      <article className="bg-white border border-[#E5E5E5] hover:border-[#A3A3A3] rounded-xl p-5 transition-colors duration-150 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#737373] mb-1">
                <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Prompt</span>
              </div>
              <h3 className="font-display text-[15px] font-semibold text-[#111111]">
                {item.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyPrompt}
              disabled={!item.content}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#111111] hover:text-[#FAFAFA] hover:border-[#111111] text-[#111111] transition-colors duration-150 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-40"
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
          </div>

          <p className="mt-2.5 text-sm text-[#525252] leading-relaxed">
            {item.description}
          </p>

          {item.content && (
            <pre className="mt-3.5 p-3.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] font-mono text-[12.5px] leading-relaxed text-[#262626] whitespace-pre-wrap break-words max-h-52 overflow-y-auto">
              {item.content}
            </pre>
          )}
        </div>

        {renderMetadata()}
      </article>
    );
  }

  return (
    <article className="bg-white border border-[#E5E5E5] hover:border-[#A3A3A3] rounded-xl p-5 transition-colors duration-150 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#737373] mb-1">
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Note</span>
            </div>
            <h3 className="font-display text-[15px] font-semibold text-[#111111]">
              {item.title}
            </h3>
          </div>

          {item.content && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#111111] text-[#111111] transition-colors duration-150 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <span>{expanded ? 'Collapse' : 'Read note'}</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        <p className="mt-2.5 text-sm text-[#525252] leading-relaxed">
          {item.description}
        </p>

        {expanded && item.content && (
          <div className="mt-3.5 pt-3.5 border-t border-[#F0F0F0] text-sm text-[#262626] leading-relaxed whitespace-pre-wrap">
            {item.content}
          </div>
        )}

        {safeHref && (
          <div className="mt-3">
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline underline-offset-4 decoration-[#A3A3A3]"
            >
              <span>{hostname ?? 'Reference link'}</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {renderMetadata()}
    </article>
  );
}

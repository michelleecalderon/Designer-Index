import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  FileText,
  Github,
  Lock,
  Palette,
  Pencil,
  Terminal,
  Type as TypeIcon,
  X,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';
import { getGoogleFontsBrowseUrl, loadGoogleFonts } from '../utils/fonts.ts';
import { getHostname, getRepoDisplayLabel, getSafeHref } from '../utils/url.ts';

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
 * Expanded overlay reader for Prompts, Notes, Font Pairings, Color Palettes,
 * and Reusable Components so long text and rich previews never stretch grid rows.
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
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fontMeta = item?.meta?.kind === 'font_pairing' ? item.meta : null;
  const paletteMeta = item?.meta?.kind === 'palette' ? item.meta : null;
  const componentMeta = item?.meta?.kind === 'component' ? item.meta : null;

  useEffect(() => {
    setCopied(false);
    setCopiedHex(null);
  }, [item?.id]);

  useEffect(() => {
    if (fontMeta) {
      loadGoogleFonts([fontMeta.headingFont, fontMeta.bodyFont]);
    }
  }, [fontMeta]);

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
  const safeRepoHref = getSafeHref(item.repoUrl);
  const hostname = getHostname(item.url);
  const repoLabel = getRepoDisplayLabel(item.repoUrl);
  const pricingTheme = getPricingTheme(item.pricing);
  const categoryAccent = isCategoryHighlighted
    ? getCategoryAccent(item.category)
    : null;

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

  const handleCopyContent = async () => {
    const textToCopy =
      paletteMeta?.colors.join(', ') || item.content || item.description;
    if (!textToCopy) return;
    await copyText(textToCopy);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHex = async (hex: string) => {
    await copyText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((prev) => (prev === hex ? null : prev));
    }, 1600);
  };

  const renderTypeBadge = () => {
    if (fontMeta) {
      return (
        <>
          <TypeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            Font pairing{fontMeta.aesthetic ? ` · ${fontMeta.aesthetic}` : ''}
          </span>
        </>
      );
    }
    if (paletteMeta) {
      return (
        <>
          <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Color palette</span>
        </>
      );
    }
    if (componentMeta) {
      return (
        <>
          <Code2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Component · {componentMeta.framework}</span>
        </>
      );
    }
    if (item.itemType === 'prompt') {
      return (
        <>
          <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Prompt</span>
        </>
      );
    }
    return (
      <>
        <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Note</span>
      </>
    );
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
              {renderTypeBadge()}
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
            {(item.itemType === 'prompt' || componentMeta) && item.content && (
              <button
                type="button"
                onClick={handleCopyContent}
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
                    <span>{componentMeta ? 'Copy code' : 'Copy prompt'}</span>
                  </>
                )}
              </button>
            )}

            {paletteMeta && (
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors whitespace-nowrap cursor-pointer"
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copied all!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy hexes</span>
                  </>
                )}
              </button>
            )}

            {safeRepoHref && (
              <a
                href={safeRepoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-card hover:border-ink-secondary text-ink-secondary hover:text-ink transition-colors whitespace-nowrap"
              >
                <Github className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Repo</span>
              </a>
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

        {/* Scrollable reading / specimen body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <p className="text-[15px] text-ink-secondary leading-relaxed max-w-prose">
            {item.description}
          </p>

          {fontMeta && (
            <div className="p-5 rounded-xl bg-raised border border-hairline space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted pb-3 border-b border-hairline">
                <span>
                  Heading: <strong className="font-semibold text-ink">{fontMeta.headingFont}</strong>
                  <span className="mx-2" aria-hidden="true">·</span>
                  Body: <strong className="font-semibold text-ink">{fontMeta.bodyFont}</strong>
                </span>
                {fontMeta.aesthetic && (
                  <span>Aesthetic: {fontMeta.aesthetic}</span>
                )}
              </div>

              <div>
                <p
                  style={{
                    fontFamily: `"${fontMeta.headingFont}", var(--font-display)`,
                  }}
                  className="text-2xl sm:text-3xl font-semibold text-ink leading-tight"
                >
                  {fontMeta.sampleText ||
                    'Design systems built with clarity, rhythm, and quiet confidence.'}
                </p>
                <p
                  style={{
                    fontFamily: `"${fontMeta.bodyFont}", var(--font-sans)`,
                  }}
                  className="mt-3 text-[15px] text-ink-secondary leading-relaxed max-w-prose"
                >
                  Sphinx of black quartz, judge my vow — 0123456789. Body copy rendered in{' '}
                  {fontMeta.bodyFont} to preview contrast, aperture, and reading measure alongside{' '}
                  {fontMeta.headingFont}.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={getGoogleFontsBrowseUrl(
                    fontMeta.headingFont,
                    fontMeta.bodyFont
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted"
                >
                  <span>Inspect on Google Fonts</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          {paletteMeta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paletteMeta.colors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleCopyHex(hex)}
                  className="group/swatch text-left rounded-xl border border-hairline bg-canvas p-2.5 hover:border-ink-secondary transition-colors cursor-pointer"
                >
                  <div
                    style={{ backgroundColor: hex }}
                    className="w-full h-16 rounded-lg border border-hairline"
                  />
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-mono">
                    <span className="text-ink font-medium">{hex}</span>
                    <span className="text-ink-muted">
                      {copiedHex === hex ? 'Copied' : 'Copy'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {item.content &&
            (item.itemType === 'prompt' || componentMeta ? (
              <pre className="p-4 rounded-xl bg-raised border border-hairline font-mono text-[13px] leading-relaxed text-ink whitespace-pre-wrap break-words">
                {item.content}
              </pre>
            ) : (
              <div className="pt-4 border-t border-hairline text-[15px] text-ink leading-[1.75] whitespace-pre-wrap max-w-prose">
                {item.content}
              </div>
            ))}

          {(safeHref || safeRepoHref) && (
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {safeHref && (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted"
                >
                  <span>Open reference: {hostname ?? safeHref}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
              {safeRepoHref && (
                <a
                  href={safeRepoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted"
                >
                  <Github className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{repoLabel ?? safeRepoHref}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
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

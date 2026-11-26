import { useEffect, useState, type MouseEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  FileText,
  Github,
  Globe,
  Lock,
  Maximize2,
  Palette,
  Pencil,
  Terminal,
  Trash2,
  Type as TypeIcon,
} from 'lucide-react';
import type { ResourceItem } from '../shared/constants.ts';
import { getCategoryAccent, getPricingTheme } from '../shared/theme.ts';
import { loadGoogleFonts } from '../utils/fonts.ts';
import {
  getFaviconUrl,
  getHostname,
  getRepoDisplayLabel,
  getSafeHref,
} from '../utils/url.ts';

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
 * Uniform-height directory card supporting:
 * - Standard links (with optional top-right GitHub repo button for dual-link skills)
 * - Standalone GitHub repositories ('repo')
 * - Live Google Font pairing specimens ('font_pairing' meta)
 * - Click-to-copy color palette swatches ('palette' meta)
 * - Copyable reusable UI components ('component' meta)
 * - Prompts and expandable Notes (opening the full overlay reader)
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
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const safeHref = getSafeHref(item.url);
  const safeRepoHref = getSafeHref(item.repoUrl);
  const hostname = getHostname(item.url);
  const repoLabel = getRepoDisplayLabel(item.repoUrl);
  const faviconUrl = getFaviconUrl(item.url);
  const pricingTheme = getPricingTheme(item.pricing);
  const categoryAccent = isCategoryHighlighted
    ? getCategoryAccent(item.category)
    : null;

  const surfaceClasses = categoryAccent
    ? categoryAccent.cardSurface
    : 'bg-card border-hairline hover:border-ink-secondary';

  const fontMeta = item.meta?.kind === 'font_pairing' ? item.meta : null;
  const paletteMeta = item.meta?.kind === 'palette' ? item.meta : null;
  const componentMeta = item.meta?.kind === 'component' ? item.meta : null;

  useEffect(() => {
    if (fontMeta) {
      loadGoogleFonts([fontMeta.headingFont, fontMeta.bodyFont]);
    }
  }, [fontMeta]);

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

  const handleCopyContent = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!item.content) return;
    await copyText(item.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHex = async (e: MouseEvent, hex: string) => {
    e.stopPropagation();
    await copyText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((prev) => (prev === hex ? null : prev));
    }, 1600);
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

  const renderRepoIconButton = () =>
    safeRepoHref ? (
      <a
        href={safeRepoHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open GitHub repository for ${item.title}`}
        title={repoLabel ? `GitHub: ${repoLabel}` : 'Open GitHub repository'}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors duration-150 shrink-0"
      >
        <Github className="w-4 h-4" aria-hidden="true" />
      </a>
    ) : null;

  // Unboxed metadata footer shared across all uniform card types
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

  // 1. Live Font Pairing Card
  if (fontMeta) {
    return (
      <article
        onClick={() => onInspect?.(item)}
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5 truncate">
                <TypeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Font pairing</span>
                {fontMeta.aesthetic && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{fontMeta.aesthetic}</span>
                  </>
                )}
              </div>
              <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {renderRepoIconButton()}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect?.(item);
                }}
                aria-label={`Preview font pairing: ${item.title}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-card hover:border-ink-secondary text-ink-secondary hover:text-ink transition-colors duration-150 whitespace-nowrap cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" aria-hidden="true" />
                <span>View</span>
              </button>
            </div>
          </div>

          <div className="mt-2.5 px-3 py-2.5 rounded-lg bg-raised border border-hairline">
            <p
              style={{
                fontFamily: `"${fontMeta.headingFont}", var(--font-display)`,
              }}
              className="text-[16px] font-semibold text-ink truncate leading-snug"
            >
              Aa · {fontMeta.headingFont}
            </p>
            <p
              style={{
                fontFamily: `"${fontMeta.bodyFont}", var(--font-sans)`,
              }}
              className="mt-0.5 text-xs text-ink-secondary truncate"
            >
              {fontMeta.sampleText ||
                `Paired with ${fontMeta.bodyFont} for clean, balanced prose.`}
            </p>
          </div>

          <p className="mt-2 text-xs text-ink-secondary truncate">
            {item.description}
          </p>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  // 2. Color Palette Card (click-to-copy hex swatches directly on the card)
  if (paletteMeta) {
    return (
      <article
        onClick={() => onInspect?.(item)}
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
                <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Color palette</span>
              </div>
              <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {renderRepoIconButton()}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect?.(item);
                }}
                aria-label={`Inspect palette: ${item.title}`}
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

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {paletteMeta.colors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={(e) => handleCopyHex(e, hex)}
                  aria-label={`Copy color ${hex}`}
                  title={`Click to copy ${hex}`}
                  style={{ backgroundColor: hex }}
                  className="w-7 h-7 rounded-full border border-hairline transition-transform duration-150 hover:scale-110 shrink-0 cursor-pointer"
                />
              ))}
            </div>
            <span
              aria-live="polite"
              className="text-[11px] font-mono text-ink-muted whitespace-nowrap shrink-0"
            >
              {copiedHex
                ? `Copied ${copiedHex}`
                : `${paletteMeta.colors.length} colors`}
            </span>
          </div>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  // 3. Reusable UI Component Card
  if (componentMeta) {
    return (
      <article
        onClick={() => onInspect?.(item)}
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5 truncate">
                <Code2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Component</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{componentMeta.framework}</span>
              </div>
              <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {renderRepoIconButton()}
              {item.content && (
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors duration-150 whitespace-nowrap cursor-pointer"
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
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect?.(item);
                }}
                aria-label={`Inspect component: ${item.title}`}
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

          {item.content ? (
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-raised border border-hairline font-mono text-[12px] leading-snug text-ink-secondary line-clamp-2">
              {item.content}
            </div>
          ) : safeHref ? (
            <div className="mt-3">
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline underline-offset-4 decoration-ink-muted"
              >
                <span>{hostname ?? 'Open component reference'}</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          ) : null}
        </div>

        {renderMetadata()}
      </article>
    );
  }

  // 4. Standalone GitHub Repository Card
  if (item.itemType === 'repo') {
    const primaryRepoHref = safeRepoHref ?? safeHref;
    return (
      <article
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-raised border border-hairline flex items-center justify-center shrink-0">
                <Github className="w-4 h-4 text-ink" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                {primaryRepoHref ? (
                  <a
                    href={primaryRepoHref}
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
                {(repoLabel || hostname) && (
                  <p className="text-xs font-mono text-ink-muted truncate">
                    {repoLabel ?? hostname}
                  </p>
                )}
              </div>
            </div>

            {safeHref && safeRepoHref && (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open website for ${item.title}`}
                title={`Website: ${hostname ?? safeHref}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-raised hover:bg-ink hover:text-card hover:border-ink text-ink transition-colors duration-150 shrink-0"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <p className="mt-3 text-sm text-ink-secondary leading-relaxed line-clamp-4">
            {item.description}
          </p>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  // 5. Standard Website / Skill Link Card (with optional top-right GitHub repo button)
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

            {renderRepoIconButton()}
          </div>

          <p className="mt-3 text-sm text-ink-secondary leading-relaxed line-clamp-4">
            {item.description}
          </p>
        </div>

        {renderMetadata()}
      </article>
    );
  }

  // 6. Prompt Card
  if (item.itemType === 'prompt') {
    return (
      <article
        onClick={() => onInspect?.(item)}
        className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
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
              {renderRepoIconButton()}
              <button
                type="button"
                onClick={handleCopyContent}
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

  // 7. Standard Note Card
  return (
    <article
      onClick={() => onInspect?.(item)}
      className={`group h-full md:h-[236px] border rounded-xl p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer ${surfaceClasses}`}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-0.5">
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Note</span>
            </div>
            <h3 className="font-display text-[15px] font-semibold text-ink truncate group-hover:underline underline-offset-4 decoration-ink-muted">
              {item.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {renderRepoIconButton()}
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

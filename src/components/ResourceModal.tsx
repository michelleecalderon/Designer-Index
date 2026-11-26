import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Wand2,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItem,
  type ResourceItemType,
  type ResourceMeta,
  type ResourcePricing,
} from '../shared/constants.ts';
import { normalizeUrlForCompare } from '../shared/tags.ts';
import { normalizeHexColors, sanitizeFontFamily } from '../shared/validation.ts';
import { loadGoogleFonts } from '../utils/fonts.ts';

export type MetaKindOption = 'none' | 'font_pairing' | 'palette' | 'component';

export interface ResourceFormValues {
  itemType: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string;
  url: string;
  repoUrl: string;
  content: string;
  metaKind: MetaKindOption;
  headingFont: string;
  bodyFont: string;
  fontAesthetic: string;
  sampleText: string;
  paletteColors: string;
  componentFramework: string;
  isPublic: boolean;
}

export interface ClassifiedDraft {
  item_type: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string[];
  url: string | null;
  repo_url: string | null;
  content: string | null;
  meta: ResourceMeta | null;
  metadataNote?: string | null;
}

interface ResourceModalProps {
  open: boolean;
  editingItem: ResourceItem | null;
  existingResources: Array<
    Pick<ResourceItem, 'id' | 'title' | 'url' | 'repoUrl'>
  >;
  onClose: () => void;
  onSave: (values: ResourceFormValues, editingId?: number) => Promise<void>;
  onClassify: (input: string) => Promise<ClassifiedDraft>;
}

const DEFAULT_FORM: ResourceFormValues = {
  itemType: 'link',
  title: '',
  description: '',
  category: 'Design Tools',
  pricing: 'Free',
  tags: '',
  url: '',
  repoUrl: '',
  content: '',
  metaKind: 'none',
  headingFont: '',
  bodyFont: '',
  fontAesthetic: '',
  sampleText: '',
  paletteColors: '',
  componentFramework: 'Tailwind',
  isPublic: true,
};

const META_KIND_OPTIONS: Array<{ id: MetaKindOption; label: string }> = [
  { id: 'none', label: 'Standard' },
  { id: 'font_pairing', label: 'Font pairing' },
  { id: 'palette', label: 'Color palette' },
  { id: 'component', label: 'UI component' },
];

const TYPE_LABELS: Record<ResourceItemType, string> = {
  link: 'Link',
  repo: 'Repo',
  prompt: 'Prompt',
  note: 'Note',
};

function unpackMetaToFormFields(
  meta: ResourceMeta | null | undefined
): Pick<
  ResourceFormValues,
  | 'metaKind'
  | 'headingFont'
  | 'bodyFont'
  | 'fontAesthetic'
  | 'sampleText'
  | 'paletteColors'
  | 'componentFramework'
> {
  if (!meta) {
    return {
      metaKind: 'none',
      headingFont: '',
      bodyFont: '',
      fontAesthetic: '',
      sampleText: '',
      paletteColors: '',
      componentFramework: 'Tailwind',
    };
  }
  if (meta.kind === 'font_pairing') {
    return {
      metaKind: 'font_pairing',
      headingFont: meta.headingFont,
      bodyFont: meta.bodyFont,
      fontAesthetic: meta.aesthetic ?? '',
      sampleText: meta.sampleText ?? '',
      paletteColors: '',
      componentFramework: 'Tailwind',
    };
  }
  if (meta.kind === 'palette') {
    return {
      metaKind: 'palette',
      headingFont: '',
      bodyFont: '',
      fontAesthetic: '',
      sampleText: '',
      paletteColors: meta.colors.join(', '),
      componentFramework: 'Tailwind',
    };
  }
  return {
    metaKind: 'component',
    headingFont: '',
    bodyFont: '',
    fontAesthetic: '',
    sampleText: '',
    paletteColors: '',
    componentFramework: meta.framework || 'Tailwind',
  };
}

/**
 * Modal form for Creating or Updating a designer workbench resource
 * (links, dual-link skills, standalone GitHub repos, font pairings, palettes,
 * reusable UI components, prompts, or notes) with Magic Paste AI classification.
 */
export function ResourceModal({
  open,
  editingItem,
  existingResources,
  onClose,
  onSave,
  onClassify,
}: ResourceModalProps) {
  const [form, setForm] = useState<ResourceFormValues>(DEFAULT_FORM);
  const [pickerColor, setPickerColor] = useState('#D9363E');
  const [magicInput, setMagicInput] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicateMatch = useMemo(() => {
    const normalizedUrl = normalizeUrlForCompare(form.url);
    const normalizedRepo = normalizeUrlForCompare(form.repoUrl);
    if (!normalizedUrl && !normalizedRepo) return null;

    return (
      existingResources.find((row) => {
        if (row.id === editingItem?.id) return false;
        const rowUrl = normalizeUrlForCompare(row.url);
        const rowRepo = normalizeUrlForCompare(row.repoUrl);
        return (
          Boolean(
            normalizedUrl &&
              (rowUrl === normalizedUrl || rowRepo === normalizedUrl)
          ) ||
          Boolean(
            normalizedRepo &&
              (rowUrl === normalizedRepo || rowRepo === normalizedRepo)
          )
        );
      }) ?? null
    );
  }, [form.url, form.repoUrl, existingResources, editingItem]);

  const parsedSwatches = useMemo(
    () => normalizeHexColors(form.paletteColors),
    [form.paletteColors]
  );

  const cleanHeadingFont = sanitizeFontFamily(form.headingFont);
  const cleanBodyFont = sanitizeFontFamily(form.bodyFont);

  useEffect(() => {
    if (open && form.metaKind === 'font_pairing') {
      loadGoogleFonts([cleanHeadingFont, cleanBodyFont]);
    }
  }, [open, form.metaKind, cleanHeadingFont, cleanBodyFont]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMagicInput('');
    setAiStatusNote(null);
    if (editingItem) {
      setForm({
        itemType: editingItem.itemType,
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        pricing: editingItem.pricing,
        tags: editingItem.tags.join(', '),
        url: editingItem.url ?? '',
        repoUrl: editingItem.repoUrl ?? '',
        content: editingItem.content ?? '',
        ...unpackMetaToFormFields(editingItem.meta),
        isPublic: editingItem.isPublic,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editingItem]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleMagicClassify = async () => {
    const trimmed = magicInput.trim();
    if (!trimmed) {
      setError('Paste a URL, GitHub repo, font pairing, hex codes, or note first.');
      return;
    }

    setError(null);
    setAiStatusNote(null);
    setClassifying(true);
    try {
      const result = await onClassify(trimmed);
      setForm((prev) => ({
        ...prev,
        itemType: result.item_type,
        title: result.title,
        description: result.description,
        category: result.category,
        pricing: result.pricing,
        tags: result.tags.join(', '),
        url: result.url ?? '',
        repoUrl: result.repo_url ?? '',
        content: result.content ?? '',
        ...unpackMetaToFormFields(result.meta),
      }));
      setAiStatusNote(
        result.metadataNote
          ? `Auto-filled (${result.metadataNote}) Review the fields below before saving.`
          : 'Auto-filled with AI. Review the fields and visibility toggle below before saving.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to classify right now. You can still fill the fields manually.'
      );
    } finally {
      setClassifying(false);
    }
  };

  const handleAddSwatch = () => {
    const merged = normalizeHexColors([
      ...parsedSwatches,
      pickerColor.toUpperCase(),
    ]);
    setForm((prev) => ({
      ...prev,
      paletteColors: merged.join(', '),
    }));
  };

  const handleRemoveSwatch = (hexToRemove: string) => {
    const remaining = parsedSwatches.filter((hex) => hex !== hexToRemove);
    setForm((prev) => ({
      ...prev,
      paletteColors: remaining.join(', '),
    }));
  };

  const handleMetaKindChange = (nextKind: MetaKindOption) => {
    setForm((prev) => {
      const next = { ...prev, metaKind: nextKind };
      if (nextKind === 'font_pairing') {
        next.category = 'Fonts';
        if (prev.itemType === 'link' && !prev.url.trim()) {
          next.itemType = 'note';
          next.pricing = 'N/A';
        }
      } else if (nextKind === 'palette') {
        next.category = 'Color Palettes';
        if (prev.itemType === 'link' && !prev.url.trim()) {
          next.itemType = 'note';
          next.pricing = 'N/A';
        }
      } else if (nextKind === 'component') {
        if (prev.itemType === 'link' && !prev.url.trim()) {
          next.itemType = 'note';
          next.pricing = 'N/A';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.metaKind === 'font_pairing' && !cleanHeadingFont && !cleanBodyFont) {
      setError('Enter at least a heading or body font family for a Font pairing.');
      return;
    }
    if (form.metaKind === 'palette' && parsedSwatches.length < 2) {
      setError('Add at least 2 valid #RRGGBB hex colors for a Color palette.');
      return;
    }

    setSaving(true);
    try {
      await onSave(form, editingItem?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save resource.');
    } finally {
      setSaving(false);
    }
  };

  const showContentField =
    form.itemType === 'prompt' ||
    form.itemType === 'note' ||
    form.metaKind === 'component' ||
    Boolean(form.content.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-hairline rounded-xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline">
          <h2
            id="resource-modal-title"
            className="font-display text-lg font-semibold text-ink"
          >
            {editingItem ? 'Edit Resource' : 'Add Resource'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Magic Paste section */}
        {!editingItem && (
          <div className="mt-5 p-4 rounded-xl bg-canvas border border-hairline">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                htmlFor="magic-paste-input"
                className="text-xs font-medium text-ink"
              >
                Magic Paste
              </label>
              <span className="text-[11px] text-ink-muted">
                URL, GitHub repo, fonts, hexes, snippet, or note
              </span>
            </div>

            <textarea
              id="magic-paste-input"
              rows={2}
              value={magicInput}
              onChange={(e) => setMagicInput(e.target.value)}
              placeholder="Paste a website or GitHub link, font pairing, hex palette, component snippet, or prompt…"
              className="w-full p-2.5 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted resize-y"
            />

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] text-ink-muted">
                Detects links, GitHub repos, font pairings, palettes, and UI components automatically.
              </p>
              <button
                type="button"
                onClick={handleMagicClassify}
                disabled={classifying || !magicInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 cursor-pointer"
              >
                {classifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Classifying…</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Auto-fill with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-danger/8 border border-danger/30 text-xs text-danger"
            >
              {error}
            </div>
          )}

          {aiStatusNote && (
            <div className="p-3 rounded-lg bg-raised border border-hairline text-xs text-ink-secondary">
              {aiStatusNote}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-ink-secondary mb-1.5">
                Type
              </span>
              <div className="inline-flex items-center p-1 bg-card border border-hairline rounded-lg flex-wrap">
                {ITEM_TYPES.map((typeOption) => {
                  const active = form.itemType === typeOption;
                  return (
                    <button
                      key={typeOption}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          itemType: typeOption,
                          pricing:
                            typeOption === 'prompt' || typeOption === 'note'
                              ? 'N/A'
                              : prev.pricing === 'N/A'
                                ? 'Free'
                                : prev.pricing,
                        }))
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'bg-raised text-ink border-hairline'
                          : 'text-ink-muted hover:text-ink border-transparent'
                      }`}
                    >
                      {TYPE_LABELS[typeOption]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-ink-secondary mb-1.5">
                Card preview preset
              </span>
              <div className="inline-flex items-center p-1 bg-card border border-hairline rounded-lg flex-wrap">
                {META_KIND_OPTIONS.map((option) => {
                  const active = form.metaKind === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleMetaKindChange(option.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-raised text-ink border-hairline'
                          : 'text-ink-muted hover:text-ink border-transparent'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="resource-title"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Title
            </label>
            <input
              id="resource-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Phosphor Icons, Editorial Serif Pair, Liquid Glass Button"
              className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
            />
          </div>

          <div>
            <label
              htmlFor="resource-description"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              1-Sentence Description
            </label>
            <textarea
              id="resource-description"
              required
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Concise summary of what this resource is and when to use it."
              className="w-full p-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="resource-category"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Category
              </label>
              <select
                id="resource-category"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as ResourceCategory,
                  }))
                }
                className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="resource-pricing"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Pricing
              </label>
              <select
                id="resource-pricing"
                value={form.pricing}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pricing: e.target.value as ResourcePricing,
                  }))
                }
                className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink"
              >
                {PRICING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rich Designer Preview Fields */}
          {form.metaKind === 'font_pairing' && (
            <div className="p-4 rounded-xl bg-canvas border border-hairline space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink">
                  Live Google Font Pairing
                </span>
                <span className="text-[11px] text-ink-muted">
                  Loads directly inside the card
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="font-heading"
                    className="block text-[11px] font-medium text-ink-secondary mb-1"
                  >
                    Heading Font
                  </label>
                  <input
                    id="font-heading"
                    type="text"
                    required
                    value={form.headingFont}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, headingFont: e.target.value }))
                    }
                    placeholder="Instrument Serif"
                    className="w-full h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
                  />
                </div>
                <div>
                  <label
                    htmlFor="font-body"
                    className="block text-[11px] font-medium text-ink-secondary mb-1"
                  >
                    Body Font
                  </label>
                  <input
                    id="font-body"
                    type="text"
                    value={form.bodyFont}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, bodyFont: e.target.value }))
                    }
                    placeholder="DM Sans"
                    className="w-full h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="font-aesthetic"
                    className="block text-[11px] font-medium text-ink-secondary mb-1"
                  >
                    Aesthetic / Use Case
                  </label>
                  <input
                    id="font-aesthetic"
                    type="text"
                    value={form.fontAesthetic}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fontAesthetic: e.target.value }))
                    }
                    placeholder="Modern SaaS, Editorial, Vintage"
                    className="w-full h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
                  />
                </div>
                <div>
                  <label
                    htmlFor="font-sample"
                    className="block text-[11px] font-medium text-ink-secondary mb-1"
                  >
                    Sample Line (optional)
                  </label>
                  <input
                    id="font-sample"
                    type="text"
                    value={form.sampleText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sampleText: e.target.value }))
                    }
                    placeholder="Crafted interfaces with editorial poise."
                    className="w-full h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
                  />
                </div>
              </div>

              {(cleanHeadingFont || cleanBodyFont) && (
                <div className="p-3 rounded-lg bg-card border border-hairline">
                  <p
                    style={{
                      fontFamily: `"${cleanHeadingFont || cleanBodyFont}", var(--font-display)`,
                    }}
                    className="text-base font-semibold text-ink truncate"
                  >
                    Aa · {cleanHeadingFont || cleanBodyFont}
                  </p>
                  <p
                    style={{
                      fontFamily: `"${cleanBodyFont || cleanHeadingFont}", var(--font-sans)`,
                    }}
                    className="mt-0.5 text-xs text-ink-secondary truncate"
                  >
                    {form.sampleText.trim() ||
                      `Paired with ${cleanBodyFont || cleanHeadingFont} for crisp hierarchy.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {form.metaKind === 'palette' && (
            <div className="p-4 rounded-xl bg-canvas border border-hairline space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="palette-colors-input"
                  className="text-xs font-medium text-ink"
                >
                  Color Swatches (2–8 hex codes)
                </label>
                <span className="text-[11px] text-ink-muted">
                  Click swatch on card to copy
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="palette-colors-input"
                  type="text"
                  value={form.paletteColors}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, paletteColors: e.target.value }))
                  }
                  placeholder="#F7F4EE, #1F1B16, #D9363E, #0E9384"
                  className="flex-1 h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm font-mono text-ink placeholder:text-ink-muted"
                />
                <input
                  type="color"
                  value={pickerColor}
                  onChange={(e) => setPickerColor(e.target.value)}
                  aria-label="Pick color to add"
                  className="w-9 h-9 p-0.5 bg-raised border border-hairline rounded-lg cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  onClick={handleAddSwatch}
                  className="inline-flex items-center gap-1 px-2.5 h-9 text-xs font-medium bg-card border border-hairline hover:border-ink-secondary text-ink rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add</span>
                </button>
              </div>

              {parsedSwatches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {parsedSwatches.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleRemoveSwatch(hex)}
                      title={`Click to remove ${hex}`}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-card border border-hairline hover:border-danger text-xs font-mono text-ink cursor-pointer"
                    >
                      <span
                        style={{ backgroundColor: hex }}
                        className="w-3.5 h-3.5 rounded-full border border-hairline"
                      />
                      <span>{hex}</span>
                      <X className="w-3 h-3 text-ink-muted" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.metaKind === 'component' && (
            <div className="p-4 rounded-xl bg-canvas border border-hairline space-y-2">
              <label
                htmlFor="component-framework"
                className="block text-xs font-medium text-ink"
              >
                Component Framework / Stack
              </label>
              <input
                id="component-framework"
                type="text"
                value={form.componentFramework}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    componentFramework: e.target.value,
                  }))
                }
                placeholder="Tailwind, CSS, React, Framer Motion"
                className="w-full h-9 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
              />
            </div>
          )}

          {/* URL and GitHub Repository URL fields */}
          <div className="grid grid-cols-1 gap-4">
            {form.itemType !== 'prompt' && (
              <div>
                <label
                  htmlFor="resource-url"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  {form.itemType === 'link'
                    ? 'Website URL'
                    : form.itemType === 'repo'
                      ? 'Website / Docs URL (optional)'
                      : 'Reference URL (optional)'}
                </label>
                <input
                  id="resource-url"
                  type="url"
                  required={form.itemType === 'link'}
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://example.com"
                  className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted font-mono"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="resource-repo-url"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                {form.itemType === 'repo'
                  ? 'GitHub Repository URL'
                  : 'GitHub Repository URL (optional — adds top-right GitHub button)'}
              </label>
              <input
                id="resource-repo-url"
                type="url"
                required={form.itemType === 'repo'}
                value={form.repoUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, repoUrl: e.target.value }))
                }
                placeholder="https://github.com/owner/repository"
                className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted font-mono"
              />
            </div>

            {duplicateMatch && (
              <div
                role="status"
                className="flex items-start gap-2 p-2.5 rounded-lg bg-raised border border-hairline text-xs text-ink-secondary"
              >
                <AlertTriangle
                  className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ink"
                  aria-hidden="true"
                />
                <span>
                  This link already exists in your directory under{' '}
                  <strong className="font-medium text-ink">
                    “{duplicateMatch.title}”
                  </strong>
                  .
                </span>
              </div>
            )}
          </div>

          {showContentField && (
            <div>
              <label
                htmlFor="resource-content"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                {form.metaKind === 'component'
                  ? 'Component Code / Snippet'
                  : form.itemType === 'prompt'
                    ? 'Prompt Text'
                    : 'Note Content'}
              </label>
              <textarea
                id="resource-content"
                required={form.itemType === 'prompt'}
                rows={4}
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder={
                  form.metaKind === 'component'
                    ? 'Paste your reusable Tailwind / CSS / React snippet here…'
                    : form.itemType === 'prompt'
                      ? 'Paste the reusable prompt template here…'
                      : 'Write your personal notes or takeaways here…'
                }
                className={`w-full p-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted resize-y ${
                  form.itemType === 'prompt' || form.metaKind === 'component'
                    ? 'font-mono text-[13px]'
                    : ''
                }`}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="resource-tags"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Tags (comma-separated, max 4 canonical tags)
            </label>
            <input
              id="resource-tags"
              type="text"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="layout, typography, figma"
              className="w-full h-10 px-3 bg-raised border border-hairline focus:border-ink focus:outline-none rounded-lg text-sm text-ink placeholder:text-ink-muted"
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Near-duplicates and compound tags automatically normalize on save (e.g. layout-tips → layout, tips).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))
              }
              aria-pressed={form.isPublic}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-hairline bg-raised hover:border-ink-secondary transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {form.isPublic ? (
                  <Eye className="w-4 h-4 text-ink" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                )}
                <div>
                  <p className="text-xs font-medium text-ink">
                    {form.isPublic ? 'Public resource' : 'Private draft'}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {form.isPublic
                      ? 'Visible to anyone browsing the directory'
                      : 'Hidden from visitors — only visible when signed in as admin'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-ink-secondary">
                {form.isPublic ? 'is_public: true' : 'is_public: false'}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-secondary hover:text-ink border border-hairline rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? 'Saving…'
                : editingItem
                  ? 'Save Changes'
                  : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

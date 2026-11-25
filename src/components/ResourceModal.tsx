import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2, Wand2, X } from 'lucide-react';
import {
  CATEGORIES,
  ITEM_TYPES,
  PRICING_OPTIONS,
  type ResourceCategory,
  type ResourceItem,
  type ResourceItemType,
  type ResourcePricing,
} from '../shared/constants.ts';
import { normalizeUrlForCompare } from '../shared/tags.ts';

export interface ResourceFormValues {
  itemType: ResourceItemType;
  title: string;
  description: string;
  category: ResourceCategory;
  pricing: ResourcePricing;
  tags: string;
  url: string;
  content: string;
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
  content: string | null;
  metadataNote?: string | null;
}

interface ResourceModalProps {
  open: boolean;
  editingItem: ResourceItem | null;
  existingResources: Array<Pick<ResourceItem, 'id' | 'title' | 'url'>>;
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
  content: '',
  isPublic: true,
};

/**
 * Modal form for Creating or Updating a directory resource (link, prompt, or note),
 * including the server-powered AI "Magic Paste" auto-classifier.
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
  const [magicInput, setMagicInput] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicateMatch = useMemo(() => {
    const normalizedInput = normalizeUrlForCompare(form.url);
    if (!normalizedInput) return null;
    return (
      existingResources.find(
        (row) =>
          row.id !== editingItem?.id &&
          normalizeUrlForCompare(row.url) === normalizedInput
      ) ?? null
    );
  }, [form.url, existingResources, editingItem]);

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
        content: editingItem.content ?? '',
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
      setError('Paste a URL, raw prompt, or note first.');
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
        content: result.content ?? '',
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
          <h2
            id="resource-modal-title"
            className="font-display text-lg font-semibold text-[#111111]"
          >
            {editingItem ? 'Edit Resource' : 'Add Resource'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#737373] hover:text-[#111111] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Magic Paste section: paste anything and let Gemini pre-fill the form */}
        {!editingItem && (
          <div className="mt-5 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                htmlFor="magic-paste-input"
                className="text-xs font-medium text-[#111111]"
              >
                Magic Paste
              </label>
              <span className="text-[11px] text-[#737373]">
                URL, prompt, or rough note
              </span>
            </div>

            <textarea
              id="magic-paste-input"
              rows={2}
              value={magicInput}
              onChange={(e) => setMagicInput(e.target.value)}
              placeholder="Paste any link (https://...), reusable prompt, or quick note…"
              className="w-full p-2.5 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111] placeholder:text-[#A3A3A3] resize-y"
            />

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#737373]">
                Detects type, category, pricing, summary, and tags automatically.
              </p>
              <button
                type="button"
                onClick={handleMagicClassify}
                disabled={classifying || !magicInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 cursor-pointer"
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
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {aiStatusNote && (
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#262626]">
              {aiStatusNote}
            </div>
          )}

          <div>
            <span className="block text-xs font-medium text-[#525252] mb-1.5">
              Type
            </span>
            <div className="inline-flex items-center p-1 bg-[#F2F2F2] border border-[#E5E5E5] rounded-lg">
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
                    className={`px-3.5 py-1.5 text-xs font-medium capitalize rounded-md transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-[#111111] border border-[#E5E5E5]'
                        : 'text-[#525252] hover:text-[#111111] border border-transparent'
                    }`}
                  >
                    {typeOption}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="resource-title"
              className="block text-xs font-medium text-[#525252] mb-1.5"
            >
              Title
            </label>
            <input
              id="resource-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Phosphor Icons"
              className="w-full h-10 px-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111]"
            />
          </div>

          <div>
            <label
              htmlFor="resource-description"
              className="block text-xs font-medium text-[#525252] mb-1.5"
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
              placeholder="Concise summary of what this resource is and why it's useful."
              className="w-full p-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="resource-category"
                className="block text-xs font-medium text-[#525252] mb-1.5"
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
                className="w-full h-10 px-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111]"
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
                className="block text-xs font-medium text-[#525252] mb-1.5"
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
                className="w-full h-10 px-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111]"
              >
                {PRICING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.itemType !== 'prompt' && (
            <div>
              <label
                htmlFor="resource-url"
                className="block text-xs font-medium text-[#525252] mb-1.5"
              >
                URL {form.itemType === 'note' ? '(optional)' : ''}
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
                className="w-full h-10 px-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111] font-mono"
              />
              {duplicateMatch && (
                <div
                  role="status"
                  className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    This URL already exists in your directory under{' '}
                    <strong className="font-medium">“{duplicateMatch.title}”</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {form.itemType !== 'link' && (
            <div>
              <label
                htmlFor="resource-content"
                className="block text-xs font-medium text-[#525252] mb-1.5"
              >
                {form.itemType === 'prompt' ? 'Prompt Text' : 'Note Content'}
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
                  form.itemType === 'prompt'
                    ? 'Paste the reusable prompt template here…'
                    : 'Write your personal notes or takeaways here…'
                }
                className={`w-full p-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111] resize-y ${
                  form.itemType === 'prompt' ? 'font-mono text-[13px]' : ''
                }`}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="resource-tags"
              className="block text-xs font-medium text-[#525252] mb-1.5"
            >
              Tags (comma-separated, max 4 canonical tags)
            </label>
            <input
              id="resource-tags"
              type="text"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="layout, typography, figma"
              className="w-full h-10 px-3 bg-white border border-[#E5E5E5] focus:border-[#111111] focus:outline-none rounded-lg text-sm text-[#111111]"
            />
            <p className="mt-1 text-[11px] text-[#737373]">
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
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#A3A3A3] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {form.isPublic ? (
                  <Eye className="w-4 h-4 text-[#111111]" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-4 h-4 text-[#737373]" aria-hidden="true" />
                )}
                <div>
                  <p className="text-xs font-medium text-[#111111]">
                    {form.isPublic ? 'Public resource' : 'Private draft'}
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    {form.isPublic
                      ? 'Visible to anyone browsing the directory'
                      : 'Hidden from visitors — only visible when signed in as admin'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#525252]">
                {form.isPublic ? 'is_public: true' : 'is_public: false'}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#525252] hover:text-[#111111] border border-[#E5E5E5] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
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

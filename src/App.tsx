/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, Plus, Sparkles, X } from 'lucide-react';
import { CategorySidebar } from './components/CategorySidebar.tsx';
import {
  DirectoryToolbar,
  type PricingFilter,
  type TypeFilter,
  type ViewMode,
} from './components/DirectoryToolbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { ResourceCard } from './components/ResourceCard.tsx';
import { ResourceDetailModal } from './components/ResourceDetailModal.tsx';
import {
  ResourceModal,
  type ClassifiedDraft,
  type ResourceFormValues,
} from './components/ResourceModal.tsx';
import { ResourceTable } from './components/ResourceTable.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import type { ResourceItem, ResourceMeta } from './shared/constants.ts';
import { normalizeTags } from './shared/tags.ts';
import { getCategoryAccent } from './shared/theme.ts';
import { sanitizeResourceMeta } from './shared/validation.ts';

function DirectoryApp() {
  const { isAdmin, authLoading, getToken, signOut } = useAuth();

  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Grounded AI semantic search state (triggered on Enter or "Ask AI")
  const [aiMatchedIds, setAiMatchedIds] = useState<number[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ResourceItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        event.key === 'Escape' &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery('');
        setAiMatchedIds(null);
        setAiSummary(null);
        setAiError(null);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchResources = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setLoadError(null);
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }
      const response = await fetch('/api/resources', { headers });
      if (!response.ok) {
        throw new Error('Could not load resources');
      }
      const data = (await response.json()) as { items: ResourceItem[] };
      setResources(data.items);
    } catch {
      setLoadError('Unable to load the directory right now.');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAdmin, getToken]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  const navigate = (to: string) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, '', to);
    setPathname(to);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (aiMatchedIds !== null || aiError !== null) {
      setAiMatchedIds(null);
      setAiSummary(null);
      setAiError(null);
    }
  };

  const clearAISearch = () => {
    setAiMatchedIds(null);
    setAiSummary(null);
    setAiError(null);
  };

  const handleTriggerAISearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setAiSearching(true);
    setAiError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isAdmin) {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: trimmed }),
      });

      const data = (await response.json()) as {
        matchedIds?: number[];
        summary?: string;
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.matchedIds)) {
        throw new Error(data.error || 'Could not complete AI search.');
      }

      setAiMatchedIds(data.matchedIds);
      setAiSummary(data.summary ?? null);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to run AI search right now.'
      );
    } finally {
      setAiSearching(false);
    }
  };

  const handleTypeChange = (nextType: TypeFilter) => {
    setTypeFilter(nextType);
    // Prompts and notes typically use pricing "N/A"; clear pricing filter so they stay visible.
    if (nextType === 'prompt' || nextType === 'note') {
      setPricingFilter('All');
    }
  };

  const handleSaveResource = async (
    values: ResourceFormValues,
    editingId?: number
  ) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    let rawMeta: ResourceMeta | null = null;
    if (values.metaKind === 'font_pairing') {
      rawMeta = {
        kind: 'font_pairing',
        headingFont: values.headingFont,
        bodyFont: values.bodyFont,
        ...(values.fontAesthetic.trim()
          ? { aesthetic: values.fontAesthetic.trim() }
          : {}),
        ...(values.sampleText.trim()
          ? { sampleText: values.sampleText.trim() }
          : {}),
      };
    } else if (values.metaKind === 'palette') {
      rawMeta = {
        kind: 'palette',
        colors: values.paletteColors
          .split(/[\s,;]+/)
          .map((c) => c.trim())
          .filter(Boolean),
      };
    } else if (values.metaKind === 'component') {
      rawMeta = {
        kind: 'component',
        framework: values.componentFramework.trim() || 'Tailwind',
      };
    }

    const payload = {
      itemType: values.itemType,
      title: values.title,
      description: values.description,
      category: values.category,
      pricing: values.pricing,
      tags: normalizeTags(values.tags, 4),
      url: values.url.trim() || null,
      repoUrl: values.repoUrl.trim() || null,
      content: values.content.trim() || null,
      meta: sanitizeResourceMeta(rawMeta),
      isPublic: values.isPublic,
    };

    const endpoint = editingId
      ? `/api/resources/${editingId}`
      : '/api/resources';
    const method = editingId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      item?: ResourceItem;
      error?: string;
    };

    if (!response.ok || !data.item) {
      throw new Error(data.error || 'Failed to save resource.');
    }

    if (editingId) {
      setResources((prev) =>
        prev.map((row) => (row.id === editingId ? data.item! : row))
      );
    } else {
      setResources((prev) => [data.item!, ...prev]);
    }
  };

  const handleDeleteResource = async (id: number) => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setResources((prev) => prev.filter((row) => row.id !== id));
    }
  };

  const handleClassifyResource = async (input: string): Promise<ClassifiedDraft> => {
    const token = await getToken();
    if (!token) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ input }),
    });

    const data = (await response.json()) as {
      classified?: ClassifiedDraft;
      error?: string;
    };

    if (!response.ok || !data.classified) {
      throw new Error(data.error || 'Could not auto-fill from this input.');
    }

    return data.classified;
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of resources) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [resources]);

  const typeCounts = useMemo<Record<TypeFilter, number>>(() => {
    const counts: Record<TypeFilter, number> = {
      all: resources.length,
      link: 0,
      repo: 0,
      prompt: 0,
      note: 0,
    };
    for (const item of resources) {
      if (item.itemType === 'link') counts.link += 1;
      else if (item.itemType === 'prompt') counts.prompt += 1;
      else if (item.itemType === 'note') counts.note += 1;
      if (item.itemType === 'repo' || Boolean(item.repoUrl)) {
        counts.repo += 1;
      }
    }
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    // When AI semantic search results are active, rank strictly by AI-returned IDs
    // while still honoring active type/category/tag/pricing filters.
    const aiRank =
      aiMatchedIds !== null
        ? new Map(aiMatchedIds.map((id, index) => [id, index]))
        : null;

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matches = resources.filter((item) => {
      if (typeFilter === 'repo') {
        if (item.itemType !== 'repo' && !item.repoUrl) {
          return false;
        }
      } else if (typeFilter !== 'all' && item.itemType !== typeFilter) {
        return false;
      }
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (pricingFilter !== 'All' && item.pricing !== pricingFilter) {
        return false;
      }
      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }

      if (aiRank !== null) {
        return aiRank.has(item.id);
      }

      if (!normalizedQuery) return true;

      let metaSearch = '';
      if (item.meta?.kind === 'font_pairing') {
        metaSearch = `${item.meta.headingFont} ${item.meta.bodyFont} ${item.meta.aesthetic ?? ''} ${item.meta.sampleText ?? ''}`;
      } else if (item.meta?.kind === 'palette') {
        metaSearch = item.meta.colors.join(' ');
      } else if (item.meta?.kind === 'component') {
        metaSearch = item.meta.framework;
      }

      const haystack = [
        item.title,
        item.description,
        item.category,
        item.pricing,
        item.tags.join(' '),
        item.content ?? '',
        item.url ?? '',
        item.repoUrl ?? '',
        metaSearch,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    if (aiRank !== null) {
      return matches.sort(
        (a, b) => (aiRank.get(a.id) ?? 999) - (aiRank.get(b.id) ?? 999)
      );
    }

    return matches;
  }, [
    resources,
    typeFilter,
    selectedCategory,
    pricingFilter,
    selectedTag,
    searchQuery,
    aiMatchedIds,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    pricingFilter !== 'All' ||
    selectedCategory !== 'All' ||
    selectedTag !== null ||
    aiMatchedIds !== null;

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPricingFilter('All');
    setSelectedCategory('All');
    setSelectedTag(null);
    clearAISearch();
  };

  if (pathname === '/login') {
    return <LoginView onNavigateHome={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <header className="pb-8 border-b border-hairline">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                resetFilters();
                navigate('/');
              }}
              className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink whitespace-nowrap shrink-0 rounded-sm"
            >
              Curated Index
            </a>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-ink-muted tabular-nums whitespace-nowrap">
                {loading ? 'Loading…' : `${resources.length} resources`}
              </span>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Resource</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink border border-hairline bg-card rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-2.5 max-w-2xl text-[15px] text-ink-secondary leading-relaxed">
            A minimalist personal directory of design tools, typography, AI utilities, prompts, and reference notes.
          </p>
        </header>

        <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            totalCount={resources.length}
          />

          <main className="flex-1 min-w-0">
            <DirectoryToolbar
              searchInputRef={searchInputRef}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onTriggerAISearch={handleTriggerAISearch}
              aiSearching={aiSearching}
              aiActive={aiMatchedIds !== null}
              typeFilter={typeFilter}
              onTypeChange={handleTypeChange}
              typeCounts={typeCounts}
              pricingFilter={pricingFilter}
              onPricingChange={setPricingFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
              totalCount={resources.length}
            />

            {/* Grounded AI Search Banner or Error */}
            {aiError && (
              <div
                role="alert"
                className="mt-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-danger/8 border border-danger/30 text-xs text-danger"
              >
                <span>{aiError}</span>
                <button
                  type="button"
                  onClick={() => setAiError(null)}
                  className="p-1 text-danger hover:text-ink cursor-pointer"
                  aria-label="Dismiss AI search error"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}

            {aiMatchedIds !== null && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-card border border-hairline text-xs text-ink-secondary">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-ink shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {aiSummary || `Matched ${filteredResources.length} stored items.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearAISearch}
                  className="text-xs font-medium text-ink hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Exit AI search
                </button>
              </div>
            )}

            {/* Active results & tag summary */}
            <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                <span
                  className={
                    selectedCategory === 'All'
                      ? 'text-ink-muted'
                      : getCategoryAccent(selectedCategory).cardCategoryText
                  }
                >
                  {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                </span>
                {selectedTag && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="inline-flex items-center gap-1 font-medium text-ink hover:underline underline-offset-4 cursor-pointer"
                    >
                      <span>#{selectedTag}</span>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-ink-muted">
                  {filteredResources.length}{' '}
                  {filteredResources.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-ink hover:underline underline-offset-4 cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[236px] bg-card border border-hairline rounded-xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-raised" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-raised rounded" />
                        <div className="h-3 w-24 bg-raised/70 rounded" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full bg-raised/70 rounded" />
                      <div className="h-3 w-4/5 bg-raised/70 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && loadError && (
              <div className="bg-card border border-hairline rounded-xl p-8 text-center">
                <p className="text-sm text-danger mb-4">{loadError}</p>
                <button
                  type="button"
                  onClick={fetchResources}
                  className="px-4 py-2 text-xs font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !loadError && filteredResources.length === 0 && (
              <div className="bg-card border border-hairline rounded-xl p-10 text-center">
                <p className="text-sm font-medium text-ink mb-1">
                  No matching resources
                </p>
                <p className="text-sm text-ink-muted mb-5">
                  {aiMatchedIds === null && searchQuery.trim()
                    ? 'No exact keyword matches — press Enter or click Ask AI to search by meaning.'
                    : 'Try clearing your search or switching type, category, and pricing filters.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {aiMatchedIds === null && searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={handleTriggerAISearch}
                      disabled={aiSearching}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{aiSearching ? 'Searching…' : 'Ask AI'}</span>
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs font-medium text-ink border border-hairline bg-card rounded-lg hover:border-ink-secondary transition-colors cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading &&
              !loadError &&
              filteredResources.length > 0 &&
              (viewMode === 'table' ? (
                <ResourceTable
                  items={filteredResources}
                  isAdmin={isAdmin}
                  selectedCategory={selectedCategory}
                  selectedTag={selectedTag}
                  onTagClick={(tag) =>
                    setSelectedTag((prev) => (prev === tag ? null : tag))
                  }
                  onInspect={(target) => setInspectingItem(target)}
                  onEdit={(target) => {
                    setEditingItem(target);
                    setModalOpen(true);
                  }}
                  onDelete={handleDeleteResource}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {filteredResources.map((item) => (
                    <ResourceCard
                      key={item.id}
                      item={item}
                      isAdmin={isAdmin}
                      isCategoryHighlighted={
                        selectedCategory !== 'All' &&
                        selectedCategory === item.category
                      }
                      selectedTag={selectedTag}
                      onTagClick={(tag) =>
                        setSelectedTag((prev) => (prev === tag ? null : tag))
                      }
                      onInspect={(target) => setInspectingItem(target)}
                      onEdit={(target) => {
                        setEditingItem(target);
                        setModalOpen(true);
                      }}
                      onDelete={handleDeleteResource}
                    />
                  ))}
                </div>
              ))}
          </main>
        </div>
      </div>

      <ResourceDetailModal
        item={inspectingItem}
        isAdmin={isAdmin}
        isCategoryHighlighted={
          Boolean(inspectingItem) &&
          selectedCategory !== 'All' &&
          selectedCategory === inspectingItem?.category
        }
        selectedTag={selectedTag}
        onClose={() => setInspectingItem(null)}
        onTagClick={(tag) =>
          setSelectedTag((prev) => (prev === tag ? null : tag))
        }
        onEdit={(target) => {
          setEditingItem(target);
          setModalOpen(true);
        }}
      />

      <ResourceModal
        open={modalOpen}
        editingItem={editingItem}
        existingResources={resources}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveResource}
        onClassify={handleClassifyResource}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DirectoryApp />
    </AuthProvider>
  );
}

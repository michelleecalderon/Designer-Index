/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { CategorySidebar } from './components/CategorySidebar.tsx';
import {
  DirectoryToolbar,
  type PricingFilter,
} from './components/DirectoryToolbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { ResourceCard } from './components/ResourceCard.tsx';
import {
  ResourceModal,
  type ResourceFormValues,
} from './components/ResourceModal.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import type { ResourceItem } from './shared/constants.ts';

function DirectoryApp() {
  const { isAdmin, authLoading, getToken, signOut } = useAuth();

  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);

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
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetches resources; when authenticated as Admin, passes Bearer token so private rows are included.
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

  // Handles Create (POST) and Update (PATCH) resource mutations for the admin.
  const handleSaveResource = async (
    values: ResourceFormValues,
    editingId?: number
  ) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const payload = {
      itemType: values.itemType,
      title: values.title,
      description: values.description,
      category: values.category,
      pricing: values.pricing,
      tags: values.tags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean),
      url: values.url.trim() || null,
      content: values.content.trim() || null,
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

  // Handles Delete (DELETE) resource mutation for the admin.
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of resources) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return resources.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (pricingFilter !== 'All' && item.pricing !== pricingFilter) {
        return false;
      }
      if (!normalizedQuery) return true;

      const haystack = [
        item.title,
        item.description,
        item.category,
        item.pricing,
        item.tags.join(' '),
        item.content ?? '',
        item.url ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [resources, searchQuery, pricingFilter, selectedCategory]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    pricingFilter !== 'All' ||
    selectedCategory !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setPricingFilter('All');
    setSelectedCategory('All');
  };

  if (pathname === '/login') {
    return <LoginView onNavigateHome={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        {/* Clean editorial header — /login remains hidden unless directly visited */}
        <header className="pb-8 border-b border-[#E5E5E5]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                resetFilters();
                navigate('/');
              }}
              className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] whitespace-nowrap shrink-0"
            >
              Curated Index
            </a>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-[#737373] tabular-nums whitespace-nowrap">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Resource</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#525252] hover:text-[#111111] border border-[#E5E5E5] bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-2.5 max-w-2xl text-[15px] text-[#525252] leading-relaxed">
            A minimalist personal directory of design tools, typography, AI utilities, prompts, and reference notes.
          </p>
        </header>

        {/* Main 2-column directory layout */}
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
              onSearchChange={setSearchQuery}
              pricingFilter={pricingFilter}
              onPricingChange={setPricingFilter}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
              totalCount={resources.length}
            />

            <div className="mt-6 mb-4 flex items-center justify-between gap-4">
              <p className="text-xs text-[#737373]">
                {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {filteredResources.length}{' '}
                  {filteredResources.length === 1 ? 'item' : 'items'}
                </span>
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-[#111111] hover:underline underline-offset-4 cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-44 bg-white border border-[#E5E5E5] rounded-xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F0F0F0]" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-[#F0F0F0] rounded" />
                        <div className="h-3 w-24 bg-[#F5F5F5] rounded" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full bg-[#F5F5F5] rounded" />
                      <div className="h-3 w-4/5 bg-[#F5F5F5] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && loadError && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 text-center">
                <p className="text-sm text-[#525252] mb-4">{loadError}</p>
                <button
                  type="button"
                  onClick={fetchResources}
                  className="px-4 py-2 text-xs font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !loadError && filteredResources.length === 0 && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-10 text-center">
                <p className="text-sm font-medium text-[#111111] mb-1">
                  No matching resources
                </p>
                <p className="text-sm text-[#737373] mb-5">
                  Try clearing your search or switching category and pricing filters.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 text-xs font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}

            {!loading && !loadError && filteredResources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {filteredResources.map((item) => (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onEdit={(target) => {
                      setEditingItem(target);
                      setModalOpen(true);
                    }}
                    onDelete={handleDeleteResource}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ResourceModal
        open={modalOpen}
        editingItem={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveResource}
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

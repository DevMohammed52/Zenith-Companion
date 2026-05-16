'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import ItemModal from '@/components/ItemModal';

interface SearchIndexItem {
  id: string;
  name: string;
}

type CachedItem = Record<string, unknown>;

interface ItemModalContextType {
  openItem: (id: string) => void;
  openItemByName: (name: string) => void;
  prefetchItem: (idOrName: string) => void;
  closeItem: () => void;
  getCachedItem: (id: string) => CachedItem | undefined;
  setCachedItem: (id: string, data: CachedItem) => void;
}

const ItemModalContext = createContext<ItemModalContextType | undefined>(undefined);

function findSearchIndexItem(searchIndex: SearchIndexItem[], name: string) {
  let found = searchIndex.find(i => i.name.toLowerCase() === name.toLowerCase());

  if (!found) {
    const variants = [];
    if (name.startsWith('Recipe: ')) {
      const base = name.replace('Recipe: ', '');
      variants.push(base + ' Recipe');
      variants.push(base + ' Recipe (Untradable)');
      variants.push(base + ' (Untradable)');

      if (!base.toLowerCase().includes('crystal')) {
        variants.push(base + ' Crystal (Untradable)');
        variants.push(base + ' Crystal Recipe');
      }
    } else if (name.endsWith(' Recipe')) {
      const base = name.replace(' Recipe', '');
      variants.push('Recipe: ' + base);
      variants.push(base + ' (Untradable)');
    }

    for (const variant of variants) {
      found = searchIndex.find(i => i.name.toLowerCase() === variant.toLowerCase());
      if (found) break;
    }
  }

  return found;
}

export function ItemModalProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[] | null>(null);
  const [pendingItemName, setPendingItemName] = useState<string | null>(null);
  const [itemCache] = useState<Map<string, CachedItem>>(new Map());
  const searchIndexPromiseRef = React.useRef<Promise<SearchIndexItem[]> | null>(null);

  const loadSearchIndex = React.useCallback(() => {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (!searchIndexPromiseRef.current) {
      searchIndexPromiseRef.current = fetch('/search-index.json')
        .then(r => r.ok ? r.json() : [])
        .then((payload) => {
          const rows = Array.isArray(payload) ? payload : [];
          setSearchIndex(rows);
          return rows;
        })
        .catch(() => {
          setSearchIndex([]);
          return [];
        })
        .finally(() => {
          searchIndexPromiseRef.current = null;
        });
    }
    return searchIndexPromiseRef.current;
  }, [searchIndex]);

  useEffect(() => {
    if (!pendingItemName) return;
    if (!searchIndex) {
      void loadSearchIndex();
      return;
    }
    if (searchIndex.length === 0) return;
    const found = findSearchIndexItem(searchIndex, pendingItemName);
    if (found) {
      setActiveId(found.id);
      setPendingItemName(null);
    }
  }, [loadSearchIndex, pendingItemName, searchIndex]);

  const getCachedItem = React.useCallback((id: string) => itemCache.get(id), [itemCache]);
  const setCachedItem = React.useCallback((id: string, data: CachedItem) => itemCache.set(id, data), [itemCache]);

  const prefetchItem = React.useCallback(async (idOrName: string) => {
    let id = idOrName;
    if (!idOrName.includes('-') && idOrName.length < 50) {
        const index = await loadSearchIndex();
        const found = findSearchIndexItem(index, idOrName);
        if (found) id = found.id;
    }

    if (itemCache.has(id)) return;
    
    try {
        const res = await fetch(`/api/items/${encodeURIComponent(id)}`);
        if (res.ok) {
            const data = await res.json();
            itemCache.set(id, data);
        }
    } catch {}
  }, [loadSearchIndex, itemCache]);

  const openItem = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);
  
  const openItemByName = React.useCallback((name: string) => {
    if (!searchIndex) {
      setPendingItemName(name);
      void loadSearchIndex();
      return;
    }

    const found = findSearchIndexItem(searchIndex, name);
    if (found) {
      setActiveId(found.id);
      setPendingItemName(null);
    }
  }, [loadSearchIndex, searchIndex]);

  const closeItem = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const value = React.useMemo(() => ({ 
    openItem, 
    openItemByName, 
    prefetchItem, 
    closeItem, 
    getCachedItem, 
    setCachedItem 
  }), [openItem, openItemByName, prefetchItem, closeItem, getCachedItem, setCachedItem]);

  return (
    <ItemModalContext.Provider value={value}>
      {activeId && <ItemModal id={activeId} onClose={closeItem} />}
      {children}
    </ItemModalContext.Provider>
  );
}

export function useItemModal() {
  const context = useContext(ItemModalContext);
  if (context === undefined) {
    throw new Error('useItemModal must be used within an ItemModalProvider');
  }
  return context;
}
